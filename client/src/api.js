let sessionPromise;
async function session() {
  if (!sessionPromise) sessionPromise = fetch('/api/session', { credentials: 'same-origin' }).then(async response => {
    if (!response.ok) throw Error('Não foi possível iniciar a sessão local. Reinicie o servidor.');
    return (await response.json()).token;
  }).catch(error => { sessionPromise = undefined; throw error; });
  return sessionPromise;
}
export async function api(url, method = 'GET', body, retry = true) {
  const headers = body === undefined ? {} : { 'Content-Type': 'application/json' };
  if (!['GET', 'HEAD'].includes(method)) headers['X-CSRF-Token'] = await session();
  const response = await fetch(url, { method, credentials: 'same-origin', headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({ error: 'Resposta inesperada. Verifique se o servidor da porta 8787 está atualizado.' }));
  if (response.status === 403 && data.code === 'SESSION_EXPIRED' && retry) {
    sessionPromise = undefined;
    return api(url, method, body, false);
  }
  if (!response.ok) throw Error(data.error || `HTTP ${response.status}`);
  return data;
}
export function downloadJSON(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
