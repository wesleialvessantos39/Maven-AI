import { listProjectFiles, readProjectFile } from './workspace.mjs';

const hasAny = (values, keys) => keys.some(key => Object.hasOwn(values, key));

// Inspeção leve, somente leitura. Não executa scripts nem acessa o banco.
export async function summarizeProject(project) {
  const files = await listProjectFiles(project);
  const stack = new Set();
  let packageCount = 0;
  const selectedPackages = files.filter(p => p === 'package.json' || /^(client|frontend|web|app|server|backend|api)\/package\.json$/.test(p)).slice(0, 6);
  for (const file of selectedPackages) {
    try {
      const { content } = await readProjectFile(project, file);
      const pkg = JSON.parse(content);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      packageCount++;
      if (hasAny(deps, ['react', 'react-dom'])) stack.add('React');
      if (hasAny(deps, ['vite', '@vitejs/plugin-react'])) stack.add('Vite');
      if (hasAny(deps, ['express', 'fastify', 'hono'])) stack.add('Backend Node.js');
      if (hasAny(deps, ['@supabase/supabase-js', '@supabase/ssr'])) stack.add('Supabase JS');
      if (hasAny(deps, ['typescript'])) stack.add('TypeScript');
    } catch { /* package inválido ou extenso: apenas ignorar */ }
  }
  if (files.some(p => p.startsWith('supabase/') || p.endsWith('.sql'))) stack.add('Arquivos SQL / Supabase');
  if (files.includes('vercel.json')) stack.add('Configuração Vercel');
  if (files.some(p => p.endsWith('.jsx') || p.endsWith('.tsx'))) stack.add('Componentes React');
  return { project, stack: [...stack], packageCount, filesFound: files.length, filesSample: files.slice(0, 8) };
}
