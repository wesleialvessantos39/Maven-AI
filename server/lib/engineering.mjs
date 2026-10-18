import { load, update } from './store.mjs';
import { summarizeProject } from './project-summary.mjs';
import { listAudits } from './code-audit.mjs';
import { bad, makeId } from './security.mjs';

export const SYSTEM_TYPES = Object.freeze({
  web: 'Sistema web', pwa: 'Aplicativo web / PWA', saas: 'SaaS multiempresa', api: 'API / serviço backend'
});
export const ENGINEERING_MODES = Object.freeze({
  engenheiro: { name: 'Engenheiro de software', prompt: 'Analise requisitos e código existente; proponha a menor mudança completa, contratos de API, tratamento de erros, testes e rollback. Adapte à linguagem e ao framework encontrados; preserve recursos existentes.' },
  cientista: { name: 'Cientista de software', prompt: 'Separe observação, hipótese e conclusão. Formule hipóteses refutáveis, experimento reproduzível, variável controlada, resultado esperado e critério de sucesso. Não invente benchmarks ou resultados. Compare alternativas e registre incerteza.' },
  arquiteto: { name: 'Arquiteto de sistemas', prompt: 'Avalie módulos, contratos, dependências, escala, custo, consistência e limites operacionais. Para SaaS inclua tenant, RBAC, isolamento, idempotência e billing por webhooks verificados. Para PWA inclua instalação e privacidade offline. Documente tradeoffs e decisões.' },
  seguranca: { name: 'Especialista em segurança', prompt: 'Faça modelagem de ameaças, identifique fronteiras de confiança e diferencie achados de hipóteses. Avalie autenticação, autorização, IDOR, XSS, CSRF, SSRF, injeção, segredos, RLS, dependências e logs. Vincule cada recomendação a evidência e teste de regressão.' }
});
export function modePrompt(mode = 'engenheiro') {
  if (!Object.hasOwn(ENGINEERING_MODES, mode)) throw bad('Modo de engenharia inválido.');
  return ENGINEERING_MODES[mode].prompt;
}
function text(value, name, min = 8, max = 2000) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) throw bad(`${name}: informe de ${min} a ${max} caracteres.`);
  return value.trim();
}
const task = (id, title, area, acceptance, dependsOn = [], priority = 'P1') => ({ id, title, area, acceptance, dependsOn, priority, status: 'pendente', evidence: '' });
export async function createPlan({ project, objective, systemType = 'web', constraints = '' }) {
  objective = text(objective, 'Objetivo');
  if (!Object.hasOwn(SYSTEM_TYPES, systemType)) throw bad('Tipo de sistema inválido.');
  if (typeof constraints !== 'string' || constraints.length > 1200) throw bad('Restrições inválidas.');
  const summary = await summarizeProject(project);
  const latestAudit = (await listAudits(project))[0];
  const tasks = [
    task('baseline', 'Registrar o comportamento atual e reproduzir o problema', 'investigacao', ['Inventariar funcionalidades e stack existentes', 'Documentar passos de reprodução e resultado esperado', 'Registrar testes/build disponíveis antes de alterar'], [], 'P0'),
    task('requirements', 'Definir requisitos e critérios de aceitação do objetivo', 'produto', [objective, 'Definir fluxos de sucesso, erro e permissões', 'Relacionar requisitos a testes observáveis'], ['baseline'], 'P0'),
    task('architecture', 'Planejar arquitetura e contratos compatíveis com o projeto', 'arquitetura', [`Preservar a stack detectada: ${summary.stack.join(', ') || 'a confirmar'}`, 'Descrever módulos, dados, contratos de API e alternativas', 'Registrar decisão e motivo de cada mudança'], ['requirements']),
    task('security', 'Modelar ameaças e controles de segurança', 'seguranca', ['Definir fronteiras de confiança e autorização por recurso', 'Proteger segredos, validar entrada e limitar requisições', 'Planejar testes negativos de acesso e isolamento'], ['architecture'], 'P0')
  ];
  if (latestAudit?.findings.some(f => ['critica', 'alta'].includes(f.severity))) tasks.push(task('audit-fixes', 'Revisar os achados prioritários da última auditoria', 'seguranca', latestAudit.findings.filter(f => ['critica', 'alta'].includes(f.severity)).slice(0, 5).map(f => `${f.file}:${f.line} — ${f.title}`), ['security'], 'P0'));
  if (systemType === 'saas') tasks.push(task('tenant', 'Projetar isolamento multiempresa e planos de assinatura', 'dados', ['Definir tenant_id, memberships, papéis e RLS com testes cruzados entre empresas', 'Definir planos, cotas e autorização no servidor', 'Projetar webhooks assinados, idempotência e reconciliação de cobrança'], ['security'], 'P0'));
  if (systemType === 'pwa') tasks.push(task('offline', 'Definir instalação e estratégia offline do aplicativo web', 'plataforma', ['Manifesto, ícones e service worker versionado', 'Manter APIs autenticadas e dados privados fora do cache', 'Testar atualização, desconexão e retorno da rede'], ['security']));
  tasks.push(task('implementation', 'Implementar o objetivo em alterações pequenas e revisáveis', 'engenharia', ['Preservar funcionalidades atuais e revisar diffs', 'Validar contratos, estados de erro e entradas', 'Criar backup e registrar como reverter cada alteração'], tasks.filter(t => ['security', 'tenant', 'offline', 'audit-fixes'].includes(t.id)).map(t => t.id)));
  tasks.push(task('validation', 'Validar comportamento, segurança e regressões', 'qualidade', ['Executar testes e build e registrar comandos/saídas reais', ...(systemType === 'api' ? ['Testar autenticação, contratos e limites de API'] : ['Abrir a interface em navegador e verificar desktop e celular']), 'Testar casos negativos, permissões e regressão das funcionalidades existentes'], ['implementation'], 'P0'));
  tasks.push(task('release', 'Preparar entrega, observabilidade e reversão', 'operacao', ['Documentar instalação, variáveis e limitações', 'Revisar logs sem segredos, backup e rollback', 'Publicar somente no ambiente autorizado após validação'], ['validation']));
  const plan = { id: makeId(), project, objective, systemType, constraints: constraints.trim(), createdAt: new Date().toISOString(), revision: 1, source: 'planejamento-estruturado', summary, auditId: latestAudit?.id || null, tasks, aiReview: null };
  await update('plans', items => [plan, ...items].slice(0, 60));
  return presentPlan(plan);
}
export function presentPlan(plan) {
  const completed = plan.tasks.filter(t => t.status === 'concluida').length;
  return { ...plan, completed, progress: Math.round(completed * 100 / plan.tasks.length), ready: plan.tasks.filter(t => t.status === 'pendente' && t.dependsOn.every(id => plan.tasks.find(x => x.id === id)?.status === 'concluida')).map(t => t.id) };
}
export async function listPlans(project) { return (await load('plans', [])).filter(p => p.project === project).map(presentPlan); }
export async function getPlan(id) {
  const plan = (await load('plans', [])).find(p => p.id === id);
  if (!plan) throw bad('Plano não encontrado.', 404);
  return presentPlan(plan);
}
export async function updateTask(id, taskId, { status, evidence = '', revision }) {
  if (!['pendente', 'em_andamento', 'bloqueada', 'concluida'].includes(status)) throw bad('Estado de tarefa inválido.');
  if (typeof evidence !== 'string' || evidence.length > 2000) throw bad('Evidência inválida.');
  let result;
  await update('plans', items => {
    const plan = items.find(p => p.id === id);
    if (!plan) throw bad('Plano não encontrado.', 404);
    if (revision !== plan.revision) throw bad('Plano atualizado em outra aba. Recarregue antes de salvar.', 409);
    const current = plan.tasks.find(t => t.id === taskId);
    if (!current) throw bad('Tarefa não encontrada.', 404);
    if (['em_andamento', 'concluida'].includes(status) && !current.dependsOn.every(dep => plan.tasks.find(t => t.id === dep)?.status === 'concluida')) throw bad('Conclua as dependências antes de avançar esta tarefa.', 409);
    if (current.status === 'concluida' && status !== 'concluida' && plan.tasks.some(t => t.dependsOn.includes(taskId) && ['em_andamento', 'concluida'].includes(t.status))) throw bad('Reabra primeiro as tarefas dependentes.', 409);
    if (['concluida', 'bloqueada'].includes(status) && evidence.trim().length < 8) throw bad('Registre evidência ou motivo do bloqueio com ao menos 8 caracteres.');
    Object.assign(current, { status, evidence: evidence.trim(), updatedAt: new Date().toISOString() });
    plan.revision++; result = presentPlan(plan); return items;
  });
  return result;
}
export async function savePlanReview(id, review, model) {
  let result;
  await update('plans', items => {
    const plan = items.find(p => p.id === id);
    if (!plan) throw bad('Plano não encontrado.', 404);
    plan.aiReview = { content: String(review).slice(0, 16000), model, at: new Date().toISOString() };
    plan.revision++; result = presentPlan(plan); return items;
  });
  return result;
}
export async function addInvestigation({ project, title, hypothesis, experiment, expected, observed = '', conclusion = '', result = 'aberta' }) {
  await summarizeProject(project);
  if (!['aberta', 'sustentada', 'refutada', 'inconclusiva'].includes(result)) throw bad('Resultado inválido.');
  title = text(title, 'Título', 5, 160); hypothesis = text(hypothesis, 'Hipótese');
  experiment = text(experiment, 'Experimento'); expected = text(expected, 'Resultado esperado');
  if (typeof observed !== 'string' || observed.length > 2000 || typeof conclusion !== 'string' || conclusion.length > 2000) throw bad('Observação ou conclusão inválida.');
  if (result !== 'aberta' && (observed.trim().length < 8 || conclusion.trim().length < 8)) throw bad('Conclusões exigem observação e justificativa registradas.');
  const item = { id: makeId(), project, title, hypothesis, experiment, expected, observed: observed.trim(), conclusion: conclusion.trim(), result, at: new Date().toISOString(), evidenceSource: 'registro-do-usuario' };
  await update('investigations', items => [item, ...items].slice(0, 100)); return item;
}
export async function listInvestigations(project) { return (await load('investigations', [])).filter(x => x.project === project); }
export async function engineeringContext(project) {
  if (!project) return '';
  const plan = (await listPlans(project))[0], audit = (await listAudits(project))[0], investigation = (await listInvestigations(project))[0];
  return JSON.stringify({ plan: plan && { objective: plan.objective, systemType: plan.systemType, constraints: plan.constraints, progress: plan.progress, next: plan.tasks.filter(t => plan.ready.includes(t.id)).map(t => ({ title: t.title, acceptance: t.acceptance })) }, audit: audit && { at: audit.at, summary: audit.summary, findings: audit.findings.slice(0, 4) }, investigation });
}
