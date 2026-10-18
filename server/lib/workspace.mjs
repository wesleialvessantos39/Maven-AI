import './config.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '../../workspace');
export const PROJECTS_ROOT = path.resolve(process.env.PROJECTS_ROOT || DEFAULT_ROOT);
const MAX_FILES = 250;
const MAX_BYTES = 24000;
const VALID_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.json', '.html', '.md', '.sql', '.yml', '.yaml', '.toml', '.py', '.go', '.rs', '.java', '.cs', '.php', '.rb', '.kt', '.swift', '.vue', '.svelte', '.txt']);
const DENIED_DIR = new Set(['.git', '.vercel', '.next', '.output', 'node_modules', 'dist', 'build', '.cache', '.turbo', 'coverage', '.ssh']);
const DENIED_FILE = /(^|\/)\.env(\.|$)|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|id_rsa|id_ed25519|credentials?\.[^/]+|secret[^/]*|\.npmrc)$/i;

const validName = name => typeof name === 'string' && /^[\w.-]{1,100}$/.test(name) && !name.startsWith('.');
const within = (base, candidate) => candidate === base || candidate.startsWith(base + path.sep);

async function projectPath(project) {
  if (!validName(project)) throw Object.assign(new Error('Nome de projeto inválido.'), { status: 400 });
  const root = await fs.realpath(PROJECTS_ROOT);
  const candidate = path.join(root, project);
  const info = await fs.lstat(candidate);
  if (!info.isDirectory()) throw new Error('O projeto deve ser uma pasta real.');
  const real = await fs.realpath(candidate);
  if (!within(root, real)) throw new Error('Projeto fora da área permitida.');
  return real;
}

export async function listProjects() {
  await fs.mkdir(PROJECTS_ROOT, { recursive: true });
  const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
  return entries.filter(e => e.isDirectory() && validName(e.name)).map(e => e.name).sort();
}

export async function listProjectFiles(project) {
  const base = await projectPath(project);
  const files = [];
  async function walk(dir, depth) {
    if (depth > 6 || files.length >= MAX_FILES) return;
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      if (files.length >= MAX_FILES) break;
      const absolute = path.join(dir, item.name);
      const relative = path.relative(base, absolute).split(path.sep).join('/');
      if (item.isDirectory()) {
        if (!DENIED_DIR.has(item.name) && !item.name.startsWith('.')) await walk(absolute, depth + 1);
      } else if (item.isFile() && VALID_EXT.has(path.extname(item.name).toLowerCase()) && !DENIED_FILE.test(relative)) {
        files.push(relative);
      }
    }
  }
  await walk(base, 0);
  return files.sort();
}

export async function readProjectFile(project, file) {
  if (typeof file !== 'string' || !file || file.length > 250 || file.includes('\\') || path.isAbsolute(file) || file.split('/').some(segment => segment === '..' || segment === '.' || !segment)) {
    throw Object.assign(new Error('Caminho inválido.'), { status: 400 });
  }
  if (DENIED_FILE.test(file) || file.split('/').some(segment => DENIED_DIR.has(segment) || segment.startsWith('.'))) {
    throw Object.assign(new Error('Arquivo protegido.'), { status: 403 });
  }
  if (!VALID_EXT.has(path.extname(file).toLowerCase())) throw Object.assign(new Error('Tipo de arquivo não permitido.'), { status: 400 });
  const base = await projectPath(project);
  const target = path.resolve(base, file);
  if (!within(base, target)) throw Object.assign(new Error('Acesso fora do projeto.'), { status: 403 });
  const real = await fs.realpath(target);
  if (!within(base, real)) throw Object.assign(new Error('Arquivo fora da área permitida.'), { status: 403 });
  const info = await fs.stat(real);
  if (!info.isFile() || info.size > MAX_BYTES) throw Object.assign(new Error('Arquivo maior que 24 KB ou inválido.'), { status: 413 });
  const content = await fs.readFile(real, 'utf8');
  return { path: file, content };
}

// Escrita protegida para proposta aprovada: apenas arquivo já existente, dentro do workspace.
// Garante backup e checagem de hash em nível de aplicação; não oferece isolamento contra
// processos externos que alterem a árvore simultaneamente (não é sandbox).
const writes=new Map();
export async function writeExistingProjectFile(project,file,newContent,expectedHash){
  const key=project+'/'+file;const previous=writes.get(key)||Promise.resolve();
  const task=previous.catch(()=>{}).then(()=>writeFileChecked(project,file,newContent,expectedHash));
  writes.set(key,task);task.finally(()=>{if(writes.get(key)===task)writes.delete(key)}).catch(()=>{});return task;
}
async function writeFileChecked(project, file, newContent, expectedHash) {
  const { sha, bad, allowedCode } = await import('./security.mjs');
  const { backup } = await import('./store.mjs');
  if (!allowedCode(file) || typeof newContent !== 'string' || newContent.length > 24000) throw bad('Arquivo ou conteúdo inválido.');
  const original=await readProjectFile(project,file);
  if(sha(original.content)!==expectedHash)throw bad('Arquivo alterado depois da proposta. Gere nova revisão.',409);
  const base=await projectPath(project); const target=path.resolve(base,file);
  // Verifica que cada componente continua dentro da raiz real e não é symlink.
  const real=await fs.realpath(target); if(real!==target || !within(base,real))throw bad('Caminho com link simbólico não permitido.',403);
  const stat=await fs.lstat(target);if(!stat.isFile()||stat.isSymbolicLink())throw bad('Arquivo protegido.',403);
  const id=(await import('node:crypto')).randomUUID();
  await backup(id,original.content);
  const temp=target+'.minha-ia-'+id+'.tmp';
  try {await fs.writeFile(temp,newContent,{flag:'wx',mode:stat.mode});await fs.rename(temp,target);} finally {await fs.rm(temp,{force:true}).catch(()=>{});}
  return {backupId:id,hash:sha(newContent)};
}
