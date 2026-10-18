import '../server/lib/config.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { root, panelIsCurrent } from './panel-state.mjs';
const checks = [];
const [major, minor] = process.versions.node.split('.').map(Number);
checks.push(['Node.js 22.13+', major > 22 || (major === 22 && minor >= 13), process.version]);
checks.push(['Dependências instaladas', fs.existsSync(path.join(root, 'node_modules/vite/bin/vite.js')), 'Execute npm ci se faltar.']);
checks.push(['Painel compilado e atualizado', panelIsCurrent(), 'Execute npm run build para recompilar.']);
const url = new URL(process.env.OLLAMA_URL || 'http://127.0.0.1:11434');
let models = [];
if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.username && !url.password) {
  try { const response = await fetch(url.origin + '/api/tags', { signal: AbortSignal.timeout(3000) }); if (response.ok) models = (await response.json()).models?.map(m => m.name) || []; } catch {}
}
checks.push(['Ollama / modelos locais', models.length > 0, models.join(', ') || 'Inicie Ollama e instale qwen2.5-coder:1.5b; a interface funciona sem ele.']);
checks.push(['API em nuvem opcional', Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL), 'Precisa de chave e modelo no .env para usar este perfil.']);
for (const [label, ok, detail] of checks) console.log(`${ok ? '[OK]' : '[VERIFICAR]'} ${label}: ${detail}`);
console.log('Abra http://127.0.0.1:' + (process.env.PORT || '8787') + ' depois de executar npm start.');
if (!checks.slice(0, 3).every(([, ok]) => ok)) process.exitCode = 1;
