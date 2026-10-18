import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fixture } from './helpers.mjs';

test('API integrada preserva chat, propostas, backups e novos módulos', async t => {
  const f = await fixture();
  try {
    await t.test('saúde, erros e rotas de assets são respostas explícitas', async () => {
      assert.equal((await (await f.request('/api/health')).json()).version, '2.0.0');
      assert.equal((await f.request('/api/not-found')).status, 404);
      const missing = await f.request('/assets/not-found.js');
      assert.equal(missing.status, 404); assert.match(missing.headers.get('content-type'), /text\/plain/);
      assert.equal((await f.request('/api/chat', 'POST', { messages: [] })).status, 400);
      assert.equal((await f.request('/api/chat', 'POST', { messages: [{ role: 'user', content: 'Olá' }], profile: 'nuvem' })).status, 403);
    });
    await t.test('chat usa modo selecionado e contexto real do planejamento', async () => {
      await f.request('/api/plans', 'POST', { project: 'sample', objective: 'Criar API de gestão multiempresa', systemType: 'saas' });
      const response = await f.request('/api/chat', 'POST', { project: 'sample', files: ['App.jsx'], messages: [{ role: 'user', content: 'Investigue esta arquitetura' }], mode: 'cientista' });
      assert.equal(response.status, 200);
      const data = await response.json(); assert.match(data.answer, /Resposta simulada/); assert.deepEqual(data.usedFiles, ['App.jsx']);
      const prompt = JSON.stringify(f.requests.at(-1).messages);
      assert.match(prompt, /hipóteses refutáveis/); assert.match(prompt, /Criar API de gestão multiempresa/);
    });
    await t.test('geração recebe arquivo integral acima de 7000 caracteres; aplicar e reverter preservam original', async () => {
      const original = await fs.readFile(path.join(f.workspace, 'sample/App.jsx'), 'utf8');
      const response = await f.request('/api/proposals/generate', 'POST', { project: 'sample', file: 'App.jsx', instruction: 'Corrija o componente preservando seu contrato', skills: [] });
      assert.equal(response.status, 200);
      assert.match(JSON.stringify(f.requests.at(-1).messages), /FIM_DO_ARQUIVO_INTEGRAL/);
      const { proposal } = await response.json();
      assert.equal((await f.request('/api/proposals/' + proposal.id + '/apply', 'POST', { confirmation: 'APLICAR LOCAL' })).status, 200);
      assert.notEqual(await fs.readFile(path.join(f.workspace, 'sample/App.jsx'), 'utf8'), original);
      assert.equal((await f.request('/api/proposals/' + proposal.id + '/revert', 'POST', { confirmation: 'REVERTER LOCAL' })).status, 200);
      assert.equal(await fs.readFile(path.join(f.workspace, 'sample/App.jsx'), 'utf8'), original);
    });
    await t.test('auditoria e revisão de plano persistem resultados', async () => {
      const response = await f.request('/api/audits', 'POST', { project: 'sample' });
      assert.equal(response.status, 201); assert.ok((await response.json()).report.findings.some(x => x.rule === 'dynamic-eval'));
      const plans = (await (await f.request('/api/plans?project=sample')).json()).items;
      const review = await f.request('/api/plans/' + plans[0].id + '/review', 'POST', { profile: 'economico' });
      assert.equal(review.status, 200); assert.match((await review.json()).plan.aiReview.content, /Resposta simulada/);
    });
    await t.test('scaffold produz PWA e SaaS sem sobrescrever projeto', async () => {
      for (const systemType of ['pwa', 'saas']) {
        const response = await f.request('/api/scaffold', 'POST', { name: systemType + '-test', systemType, confirmation: 'CRIAR PROJETO' });
        assert.equal(response.status, 200);
        const directory = path.join(f.workspace, systemType + '-test');
        if (systemType === 'pwa') {
          assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'public/manifest.webmanifest'))).display, 'standalone');
          assert.match(await fs.readFile(path.join(directory, 'public/sw.js'), 'utf8'), /Authorization/);
          assert.equal((await fs.readFile(path.join(directory, 'public/icons/icon-192.png'))).readUInt32BE(16), 192);
        } else assert.match(await fs.readFile(path.join(directory, 'supabase/migrations/20261018010000_tenants.sql'), 'utf8'), /enable row level security/);
      }
      assert.equal((await f.request('/api/scaffold', 'POST', { name: 'pwa-test', confirmation: 'CRIAR PROJETO' })).status, 409);
    });
  } finally { await f.cleanup(); }
});
