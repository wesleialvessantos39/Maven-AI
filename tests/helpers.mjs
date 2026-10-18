import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function fixture() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'maven-integration-'));
  const workspace = path.join(temp, 'workspace');
  await fs.mkdir(path.join(workspace, 'sample'), { recursive: true });
  await fs.writeFile(path.join(workspace, 'sample/package.json'), JSON.stringify({ dependencies: { react: '19.2.0', vite: '7.3.7' }, scripts: { test: 'node --test' } }));
  await fs.writeFile(path.join(workspace, 'sample/App.jsx'), '// ' + 'referencia '.repeat(750) + '\n// FIM_DO_ARQUIVO_INTEGRAL\nexport default function App(){return null}');
  await fs.writeFile(path.join(workspace, 'sample/risk.js'), 'eval(userInput);');
  const requests = [];
  const mock = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'qwen2.5-coder:1.5b' }] }));
    let body = ''; for await (const chunk of req) body += chunk;
    const request = JSON.parse(body); requests.push(request);
    res.end(JSON.stringify({ message: { content: request.format === 'json' ? JSON.stringify({ content: 'export default function App(){return "alterado"}', reason: 'Alteração simulada para teste de integração' }) : 'Resposta simulada de integração: confira evidências, contratos e testes.' }, total_duration: 1000000000 }));
  });
  await new Promise(resolve => mock.listen(0, '127.0.0.1', resolve));
  const reserve = net.createServer(); await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve));
  const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const child = spawn(process.execPath, ['server/index.mjs'], { cwd: root, env: { ...process.env, PORT: String(port), PROJECTS_ROOT: workspace, MY_IA_DATA_DIR: path.join(temp, 'data'), OLLAMA_URL: 'http://127.0.0.1:' + mock.address().port, OLLAMA_MODEL_ECO: 'qwen2.5-coder:1.5b', AUTO_REFRESH_DOCS: 'false', CONTEXT7_API_KEY: '', OPENAI_API_KEY: '', OPENAI_MODEL: '', GITHUB_TOKEN: '', SUPABASE_ACCESS_TOKEN: '', VERCEL_TOKEN: '', ALLOW_REMOTE_MUTATIONS: 'false', ENABLE_SUPABASE_WRITES: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
  const base = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) break;
    try { ready = (await fetch(base + '/api/health')).ok; if (ready) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  async function cleanup() {
    if (child.exitCode === null) { child.kill('SIGTERM'); await new Promise(resolve => child.once('exit', resolve)); }
    await new Promise(resolve => mock.close(resolve));
    await fs.rm(temp, { recursive: true, force: true });
  }
  if (!ready) { await cleanup(); throw Error('Servidor de teste não iniciou: ' + output); }
  const session = await fetch(base + '/api/session');
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const { token } = await session.json();
  async function request(route, method = 'GET', body) {
    return fetch(base + route, { method, headers: { Cookie: cookie, ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': token }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  return { base, port, temp, workspace, requests, cleanup, request };
}
