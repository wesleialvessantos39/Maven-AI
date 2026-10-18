import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareChatRequest, resolveProfile, modelForProfile, fitChatRequest } from './profiles.mjs';

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

test('contexto extenso é reduzido preservando regras e a última pergunta',()=>{
  const prepared=prepareChatRequest({profile:'economico',messages:[{role:'user',content:'Investigue a falha sem remover funções existentes'}],attachments:[{path:'App.jsx',content:'referencia '.repeat(2000)}]});
  prepared.request.messages.splice(1,0,{role:'system',content:'documentacao '.repeat(2000)});
  const result=fitChatRequest(prepared.request,prepared.profile);
  assert.equal(result.limited,true);assert.deepEqual(result.request.messages[0],prepared.request.messages[0]);
  assert.deepEqual(result.request.messages.at(-1),prepared.request.messages.at(-1));assert.ok(result.chars<5000);
});
test('perfil avançado oferece contexto maior mantendo modelo local configurável',()=>{
  const profile=resolveProfile('avancado');assert.ok(profile.num_ctx>resolveProfile('equilibrado').num_ctx);
  assert.equal(modelForProfile(profile,{OLLAMA_MODEL_ADVANCED:'meu-modelo:7b'}),'meu-modelo:7b');
});
