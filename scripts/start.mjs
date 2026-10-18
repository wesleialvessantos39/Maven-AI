import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { root, panelIsCurrent } from './panel-state.mjs';
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) { console.error('Instale Node.js 24 LTS (mínimo 22.13).'); process.exit(1); }
if(!fs.existsSync(path.join(root,'node_modules/express/package.json'))||!fs.existsSync(path.join(root,'node_modules/esbuild/package.json'))){console.error('Dependências ausentes. Execute npm ci na pasta do projeto.');process.exit(1)}
const tools=spawnSync(process.execPath,[path.join(root,'scripts/build-tools.mjs')],{cwd:root,stdio:'inherit'});
if(tools.status!==0)process.exit(tools.status||1);
if (!panelIsCurrent()) {
  const vite = path.join(root, 'node_modules/vite/bin/vite.js');
  if (!fs.existsSync(vite)) { console.error('Dependências ausentes. Execute npm ci na pasta do projeto.'); process.exit(1); }
  console.log('Compilando painel novo ou atualizado…');
  const result = spawnSync(process.execPath, [vite, 'build'], { cwd: path.join(root, 'client'), stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
const child = spawn(process.execPath, [path.join(root, 'server/index.mjs')], { cwd: root, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code || 0));
child.on('error', error => { console.error('Falha ao iniciar:', error.message); process.exit(1); });
