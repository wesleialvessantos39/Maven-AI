import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'maven-engineering-'));
process.env.MY_IA_DATA_DIR = path.join(temp, 'data');
process.env.PROJECTS_ROOT = path.join(temp, 'workspace');
await fs.mkdir(path.join(process.env.PROJECTS_ROOT, 'sample'), { recursive: true });
await fs.writeFile(path.join(process.env.PROJECTS_ROOT, 'sample/package.json'), JSON.stringify({ dependencies: { react: '19.2.0' }, scripts: { test: 'node --test' } }));
await fs.writeFile(path.join(process.env.PROJECTS_ROOT, 'sample/main.js'), 'eval(userInput);');
const { createPlan, getPlan, updateTask, addInvestigation, engineeringContext, modePrompt } = await import('./engineering.mjs');
const { runAudit, inspectCode } = await import('./code-audit.mjs');
after(() => fs.rm(temp, { recursive: true, force: true }));

test('auditoria retorna localização e recomendação sem copiar credencial', async () => {
  const secret = 'sk-proj-' + 'z'.repeat(40);
  const findings = inspectCode('api.js', `const token = '${secret}';\neval(input);`);
  assert.equal(findings.length, 2);
  assert.ok(findings.some(f => f.rule === 'dynamic-eval' && f.line === 2));
  assert.ok(!JSON.stringify(findings).includes(secret));
  assert.equal(inspectCode('README.md', 'eval(example)').length, 0);
});
test('plano SaaS incorpora stack, requisitos e achados prioritários', async () => {
  const audit = await runAudit('sample');
  assert.equal(audit.summary.alta, 1);
  const plan = await createPlan({ project: 'sample', objective: 'Criar gestão por empresa sem remover clientes existentes', systemType: 'saas' });
  assert.equal(plan.auditId, audit.id);
  assert.ok(plan.summary.stack.includes('React'));
  assert.ok(plan.tasks.some(t => t.id === 'tenant'));
  assert.ok(plan.tasks.some(t => t.id === 'audit-fixes'));
  assert.deepEqual(plan.ready, ['baseline']);
  assert.equal(plan.progress, 0);
});
test('etapas exigem dependências, evidência e revisão atual; impedem invalidar dependentes', async () => {
  let p = await createPlan({ project: 'sample', objective: 'Corrigir tela inicial com evidência reproduzível' });
  await assert.rejects(() => updateTask(p.id, 'requirements', { status: 'em_andamento', revision: p.revision }), /dependências/);
  await assert.rejects(() => updateTask(p.id, 'baseline', { status: 'concluida', revision: p.revision }), /evidência/);
  p = await updateTask(p.id, 'baseline', { status: 'concluida', evidence: 'Chromium: reproduzido React is not defined', revision: p.revision });
  assert.ok(p.ready.includes('requirements'));
  await assert.rejects(() => updateTask(p.id, 'requirements', { status: 'em_andamento', revision: 1 }), /outra aba/);
  p = await updateTask(p.id, 'requirements', { status: 'em_andamento', revision: p.revision });
  await assert.rejects(() => updateTask(p.id, 'baseline', { status: 'pendente', revision: p.revision }), /dependentes/);
  const concurrent = await Promise.allSettled([
    updateTask(p.id, 'requirements', { status: 'bloqueada', evidence: 'Falta confirmar contrato do produto', revision: p.revision }),
    updateTask(p.id, 'requirements', { status: 'concluida', evidence: 'Critérios revisados e documentados', revision: p.revision })
  ]);
  assert.equal(concurrent.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal((await getPlan(p.id)).revision, p.revision + 1);
});
test('PWA inclui critérios offline; tipos e modos desconhecidos são recusados', async () => {
  const p = await createPlan({ project: 'sample', objective: 'Criar aplicativo web instalável', systemType: 'pwa' });
  assert.ok(p.tasks.some(t => t.id === 'offline'));
  await assert.rejects(() => createPlan({ project: 'sample', objective: 'Criar aplicativo web instalável', systemType: '__proto__' }));
  assert.throws(() => modePrompt('desconhecido'));
});
test('investigação não aceita conclusão sem resultado observado', async () => {
  const input = { project: 'sample', title: 'Investigar tela inicial', hypothesis: 'JSX exige React no escopo', experiment: 'Abrir Chromium e inspecionar o console', expected: 'Erro React is not defined no console', result: 'sustentada' };
  await assert.rejects(() => addInvestigation(input), /observação/);
  await addInvestigation({ ...input, observed: 'Console exibiu React is not defined', conclusion: 'Erro reproduzido antes da correção' });
  assert.match(await engineeringContext('sample'), /React is not defined/);
});

test('propostas concorrentes não sobrescrevem silenciosamente o mesmo arquivo',async()=>{
  const {stageProposal,applyProposal}=await import('./proposals.mjs');
  const a=await stageProposal({project:'sample',file:'main.js',content:'export default 1;'});
  const b=await stageProposal({project:'sample',file:'main.js',content:'export default 2;'});
  const results=await Promise.allSettled([applyProposal(a.id,'APLICAR LOCAL'),applyProposal(b.id,'APLICAR LOCAL')]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(results.find(x=>x.status==='rejected').reason.status,409);
});
