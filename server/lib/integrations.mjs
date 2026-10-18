import './config.mjs';
async function requestList(label, token, url, mapResult, extraHeaders = {}) {
  if (!token) return { label, state: 'não configurado', items: [], detail: 'Adicione o token no .env' };
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...extraHeaders },
      signal: AbortSignal.timeout(9000)
    });
    if (!response.ok) return { label, state: 'erro', items: [], detail: `A API respondeu HTTP ${response.status}. Verifique o token e as permissões.` };
    const payload = await response.json();
    return { label, state: 'conectado', items: mapResult(payload).slice(0, 30), detail: 'Leitura de metadados habilitada.' };
  } catch {
    return { label, state: 'erro', items: [], detail: 'Sem resposta da API. Confira a conexão com a internet.' };
  }
}

export async function getIntegrations() {
  const team = process.env.VERCEL_TEAM_ID?.trim();
  return Promise.all([
    requestList('GitHub', process.env.GITHUB_TOKEN,
      'https://api.github.com/user/repos?per_page=30&sort=updated',
      items => items.map(r => ({ name: r.full_name, subtitle: r.private ? 'Privado' : 'Público' })),
      { 'X-GitHub-Api-Version': '2022-11-28', Accept: 'application/vnd.github+json' }),
    requestList('Supabase', process.env.SUPABASE_ACCESS_TOKEN,
      'https://api.supabase.com/v1/projects',
      items => items.map(p => ({ name: p.name, subtitle: p.region || p.ref || '' }))),
    requestList('Vercel', process.env.VERCEL_TOKEN,
      `https://api.vercel.com/v10/projects?limit=30${team ? `&teamId=${encodeURIComponent(team)}` : ''}`,
      payload => payload.projects.map(p => ({ name: p.name, subtitle: p.framework || 'Projeto web' })))
  ]);
}
