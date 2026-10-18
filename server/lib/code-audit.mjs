import { listProjectFiles, readProjectFile } from './workspace.mjs';
import { load, update } from './store.mjs';
import { makeId, sha } from './security.mjs';

const rules = [
  { id: 'dynamic-eval', severity: 'alta', test: /\beval\s*\(|\bnew\s+Function\s*\(/g, title: 'Execução dinâmica de código', fix: 'Remova eval/Function; use interpretação de dados com esquema explícito.' },
  { id: 'shell-execution', severity: 'alta', test: /\bexec(?:Sync)?\s*\(/g, title: 'Execução de comandos pelo shell', fix: 'Revise a origem dos argumentos; prefira execFile com argumentos fixos e isolamento.' },
  { id: 'unsafe-html', severity: 'media', test: /dangerouslySetInnerHTML|\.innerHTML\s*=/g, title: 'Inserção direta de HTML', fix: 'Prefira renderização textual; se HTML for necessário, sanitize com biblioteca mantida.' },
  { id: 'public-service-key', severity: 'critica', test: /\bVITE_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET|PRIVATE_KEY|ACCESS_TOKEN)[A-Z0-9_]*\b/g, title: 'Nome de segredo em variável pública Vite', fix: 'Mova o segredo ao servidor e faça rotação caso já tenha sido publicado.' },
  { id: 'hardcoded-secret', severity: 'critica', test: /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{25,})\b/g, title: 'Possível credencial no código', fix: 'Revogue e substitua a credencial; remova do código e do histórico Git.' },
  { id: 'tls-disabled', severity: 'alta', test: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/g, title: 'Verificação TLS desativada', fix: 'Restaure a verificação de certificado e configure uma CA confiável.' },
  { id: 'wildcard-cors', severity: 'media', test: /['"]Access-Control-Allow-Origin['"]\s*[:,]\s*['"]\*['"]/gi, title: 'CORS aberto a todas as origens', fix: 'Restrinja as origens de APIs que tratam dados sensíveis e revise o uso de credenciais.' },
  { id: 'rls-disabled', severity: 'critica', test: /\bdisable\s+row\s+level\s+security\b/gi, title: 'RLS desabilitada em SQL', fix: 'Ative RLS e teste isolamento por usuário e tenant com JWT real.' }
];

export function inspectCode(file, content) {
  if (!/\.(?:[cm]?[jt]sx?|sql)$/i.test(file)) return [];
  const findings = [];
  for (const rule of rules) {
    rule.test.lastIndex = 0;
    for (const match of content.matchAll(rule.test)) {
      findings.push({ rule: rule.id, severity: rule.severity, title: rule.title, file, line: content.slice(0, match.index).split('\n').length, recommendation: rule.fix, confidence: 'heuristica' });
      if (findings.length >= 100) return findings;
    }
  }
  return findings;
}
export async function runAudit(project) {
  const files = await listProjectFiles(project);
  const findings = [], skipped = [], hashes = {};
  for (const file of files) {
    try {
      const { content } = await readProjectFile(project, file);
      hashes[file] = sha(content);
      findings.push(...inspectCode(file, content));
      if (file.endsWith('package.json')) {
        try {
          const pkg = JSON.parse(content);
          if (!pkg.scripts?.test) findings.push({ rule: 'missing-tests', severity: 'baixa', title: 'Manifesto sem comando de testes', file, line: 1, recommendation: 'Adicione testes de comportamento e um script test para este pacote.', confidence: 'configuracao' });
        } catch { findings.push({ rule: 'invalid-json', severity: 'media', title: 'package.json inválido', file, line: 1, recommendation: 'Corrija o JSON antes de instalar ou compilar.', confidence: 'confirmada' }); }
      }
    } catch { skipped.push(file); }
  }
  const severityOrder = ['critica', 'alta', 'media', 'baixa'];
  findings.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));
  const report = { id: makeId(), project, at: new Date().toISOString(), scanned: Object.keys(hashes).length, skipped, filesHash: sha(JSON.stringify(hashes)), findings: findings.slice(0, 300), truncated: files.length >= 250 || findings.length > 300, summary: Object.fromEntries(severityOrder.map(s => [s, findings.filter(f => f.severity === s).length])), limitations: 'Análise estática por padrões, até 250 arquivos de 24 KB. Não executa código, não consulta CVEs, não prova ausência de vulnerabilidades. Achados exigem revisão; segredos não são incluídos no relatório.' };
  await update('audits', items => [report, ...items].slice(0, 30));
  return report;
}
export async function listAudits(project) { return (await load('audits', [])).filter(x => x.project === project); }
