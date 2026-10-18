import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import http from 'node:http';
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'maven-security-'));
process.env.MY_IA_DATA_DIR = temp;
const { installSecurity, auditEvents } = await import('./http-security.mjs');
const app = express();
// Host conhecido separado da porta aleatória do socket para testar rebinding.
installSecurity(app, { port: 8787 });
app.use(express.json());
app.post('/api/write', (_, res) => res.json({ ok: true }));
app.get('/api/read', (_, res) => res.json({ ok: true }));
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const request = (route, options = {}) => new Promise((resolve, reject) => {
  const req = http.request(base + route, { method: options.method || 'GET', headers: { Host: '127.0.0.1:8787', ...options.headers } }, res => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: Object.fromEntries(Object.entries(res.headers).map(([k,v]) => [k, Array.isArray(v) ? v.join(', ') : v])) })));
  });
  req.on('error', reject); req.end(options.body);
});
after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(temp, { recursive: true, force: true }); });

test('bloqueia Host e origem externos; envia cabeçalhos de proteção', async () => {
  assert.equal((await request('/api/read', { headers: { Host: 'evil.example:8787' } })).status, 403);
  assert.equal((await request('/api/read', { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await request('/api/read', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  const res = await request('/api/read');
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});
test('escrita exige sessão e CSRF; token malformado é recusado sem exceção', async () => {
  assert.equal((await request('/api/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  const session = await request('/api/session');
  const cookie = session.headers.get('set-cookie').split(';')[0];
  assert.match(session.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const { token } = await session.json();
  const send = csrf => request('/api/write', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf }, body: '{}' });
  assert.equal((await send('z'.repeat(64))).status, 403);
  assert.equal((await send(token)).status, 200);
  assert.equal((await request('/api/write', { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': token }, body: '{}' })).status, 415);
});
test('trilha registra estado HTTP com cadeia consistente, sem corpo ou token', async () => {
  const { items, valid } = await auditEvents();
  assert.equal(valid, true);
  assert.ok(items.some(e => e.status === 200 && e.route === '/api/write'));
  assert.ok(items.every(e => !('body' in e) && !('token' in e)));
});
test('limita rajadas de requisições na API', async () => {
  let last;
  for (let i = 0; i < 241; i++) last = await request('/api/read');
  assert.equal(last.status, 429);
  assert.equal(last.headers.get('retry-after'), '60');
});
