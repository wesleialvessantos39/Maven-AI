import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bad, comparePath } from './security.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../third_party/superpowers/skills');
const names = {
  'brainstorming': 'Definição de requisitos', 'diagnosing-superpowers': 'Diagnóstico do fluxo de trabalho',
  'dispatching-parallel-agents': 'Distribuição de tarefas independentes', 'executing-plans': 'Execução de planos',
  'finishing-a-development-branch': 'Conclusão de branch', 'receiving-code-review': 'Tratamento de revisão',
  'requesting-code-review': 'Solicitação de revisão', 'subagent-driven-development': 'Desenvolvimento por especialistas',
  'systematic-debugging': 'Depuração sistemática', 'test-driven-development': 'Desenvolvimento guiado por testes',
  'using-git-worktrees': 'Isolamento com worktrees', 'using-superpowers': 'Método Superpowers',
  'verification-before-completion': 'Verificação antes da entrega', 'writing-plans': 'Planejamento detalhado',
  'writing-skills': 'Criação de habilidades'
};
export async function listSuperpowers() {
  const items = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[a-z-]+$/.test(entry.name)) continue;
    const content = await fs.readFile(path.join(root, entry.name, 'SKILL.md'), 'utf8');
    items.push({ id: entry.name, name: names[entry.name] || entry.name, description: content.match(/^description:\s*(.+)$/m)?.[1] || '', chars: content.length, provider: 'Superpowers', version: '7.0.0' });
  }
  return items.sort((a,b) => a.id.localeCompare(b.id));
}
export async function readSuperpower(id, resource = 'SKILL.md') {
  if (typeof id !== 'string' || !Object.hasOwn(names, id)) throw bad('Habilidade Superpowers inválida.');
  if (typeof resource !== 'string' || resource.length > 200 || resource.includes('\\') || resource.split('/').some(part => !part || part === '.' || part === '..' || part.startsWith('.'))) throw bad('Referência inválida.');
  const base = path.join(root, id), candidate = path.join(base, resource);
  const real = await fs.realpath(candidate);
  if (!comparePath(base, real)) throw bad('Referência fora da habilidade.', 403);
  const stat = await fs.stat(real);
  if (!stat.isFile() || stat.size > 250000 || !/\.(md|txt|json|[cm]?js|ts|sh|py|html|css)$/.test(real)) throw bad('Referência não pode ser exibida.', 413);
  const resources = [];
  async function walk(folder, prefix = '') {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const relative = prefix + entry.name;
      if (entry.isDirectory()) await walk(path.join(folder, entry.name), relative + '/');
      else if (/\.(md|txt|json|[cm]?js|ts|sh|py|html|css)$/.test(entry.name)) resources.push(relative);
    }
  }
  await walk(base);
  return { id, name: names[id], resource, content: await fs.readFile(real, 'utf8'), resources: resources.sort(), source: 'third_party/superpowers/skills/' + id + '/' + resource };
}
export function suggestSuperpowers(query = '', mode = 'engenheiro') {
  const selected = ['verification-before-completion'];
  if (/erro|bug|falha|escura|vazia|trav|debug|lento/i.test(query)) selected.unshift('systematic-debugging');
  else if (/planej|arquitet|saas|requisito|criar|constru/i.test(query) || mode === 'arquiteto') selected.unshift('writing-plans', 'brainstorming');
  else if (/teste|tdd|regress/i.test(query)) selected.unshift('test-driven-development');
  else if (/review|revis|audit/i.test(query)) selected.unshift('requesting-code-review');
  else selected.unshift('executing-plans');
  return selected.slice(0, 3);
}
export async function superpowersContext({ selected = [], automatic = true, query = '', mode = 'engenheiro', profile = 'economico' } = {}) {
  if (!Array.isArray(selected) || selected.length > 15 || selected.some(id => !Object.hasOwn(names,id))) throw bad('Seleção de habilidades inválida.');
  const ids = [...new Set([...selected, ...(automatic ? suggestSuperpowers(query,mode) : [])])];
  const limit = profile === 'nuvem' ? 16000 : 2000;
  const parts = [];
  for (const id of ids) {
    const item = await readSuperpower(id);
    const share = Math.floor(limit / Math.max(ids.length, 1));
    parts.push(`[SUPERPOWERS ${id}]\n${item.content.slice(0,share)}${item.content.length>share?'\n[REFERÊNCIA LIMITADA AO ORÇAMENTO DO MODELO]':''}`);
  }
  return { ids, content: parts.join('\n\n') };
}
