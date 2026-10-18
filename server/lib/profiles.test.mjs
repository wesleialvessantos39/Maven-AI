import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareChatRequest, resolveProfile, modelForProfile } from './profiles.mjs';

test('perfil econômico padrão usa modelo leve e descarrega da memória', () => {
  const p = resolveProfile();
  assert.equal(p.key, 'economico');
  assert.equal(modelForProfile(p, {}), 'qwen2.5-coder:1.5b');
  const payload = prepareChatRequest({ messages: [{role:'user',content:'olá'}], attachments: [] });
  assert.equal(payload.request.keep_alive, 0);
  assert.equal(payload.request.options.num_ctx, 2048);
});

test('não permite perfis arbitrários', () => {
  assert.throws(() => resolveProfile('servidor-remoto'), /inválido/);
});

test('limita arquivos e histórico para poupar memória', () => {
  const messages = Array.from({length: 14}, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm'.repeat(1800) }));
  const attachments = Array.from({length: 5}, (_, i) => ({ path: `src/f${i}.jsx`, content: 'x'.repeat(9000) }));
  const result = prepareChatRequest({ profile: 'economico', messages, attachments, env: {} });
  assert.equal(result.usedFiles.length, 2);
  assert.equal(result.ignoredFiles, 3);
  assert.equal(result.request.messages.length, 6);
  assert.ok(result.request.messages[1].content.length < 3800);
  assert.equal(result.request.messages[5].content.length, 650);
});

test('perfil equilibrado mantém modelo maior com limites controlados', () => {
  const result = prepareChatRequest({ profile: 'equilibrado', messages: [{role:'user',content:'teste'}], attachments: [], env: {} });
  assert.equal(result.request.model, 'qwen2.5-coder:3b');
  assert.equal(result.request.options.num_ctx, 3072);
});
