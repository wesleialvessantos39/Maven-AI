import { Context7 } from '../vendor/context7-sdk.mjs';
import { bad, makeId } from './security.mjs';
import { load, update } from './store.mjs';

function queryText(value, name = 'Consulta', max = 2000) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.length > max) throw bad(`${name} inválida.`);
  if(/\b(?:sk-(?:proj-)?[a-z\d_-]{20,}|gh[pousr]_[a-z\d]{25,}|ctx7sk[a-z\d_-]{12,})|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(value))throw bad('A consulta contém uma possível credencial. Remova o segredo antes de consultar documentação.');
  return value.trim();
}
export function context7Status() {
  return { configured: Boolean(process.env.CONTEXT7_API_KEY), sdkVersion: '0.5.1', mcpVersion: '4.4.2', source: 'third_party/context7', tools: ['resolve-library-id', 'query-docs', 'search-docs'] };
}
export function createContext7Service({ apiKey = process.env.CONTEXT7_API_KEY, fetchImpl = fetch } = {}) {
  if (!apiKey) throw bad('Configure CONTEXT7_API_KEY no .env e reinicie o aplicativo.', 412);
  const client = new Context7({ apiKey, baseUrl: 'https://context7.com/api', retry: false, timeout: 15000, fetch: async (input, init) => {
    const url = new URL(input);
    if (url.origin !== 'https://context7.com' || !url.pathname.startsWith('/api/')) throw bad('Destino Context7 não permitido.',403);
    const response = await fetchImpl(input, { ...init, redirect: 'error' });
    if (Number(response.headers.get('content-length')) > 1_000_000) throw bad('Resposta Context7 muito grande.', 413);
    const chunks=[];let bytes=0;
    if(response.body)for await(const chunk of response.body){bytes+=chunk.byteLength;if(bytes>1_000_000)throw bad('Resposta Context7 muito grande.',413);chunks.push(chunk)}
    return new Response(Buffer.concat(chunks),{status:response.status,statusText:response.statusText,headers:response.headers});
  } });
  async function invoke(fn) {
    try { return await fn(); }
    catch (error) {
      if(error.status===401)throw bad('A chave Context7 foi recusada. Confira CONTEXT7_API_KEY no .env.',412);
      if (error.status >= 400 && error.status < 500) throw bad(error.status === 429 ? 'Limite Context7 atingido. Aguarde ou confira sua cota.' : 'Consulta Context7 recusada. Confira os parâmetros e sua conta.', error.status);
      throw bad('Falha ao consultar Context7. Confira chave, conexão e disponibilidade do serviço.',502);
    }
  }
  return {
    async resolve({ query, libraryName }) {
      query = queryText(query); libraryName = queryText(libraryName, 'Biblioteca', 100);
      return invoke(() => client.searchLibrary(query, libraryName));
    },
    async docs({ query, libraryId, language = '' }) {
      query = queryText(query);
      if (typeof libraryId !== 'string' || !/^\/[a-z\d_.@-]+\/[a-z\d_.@-]+(?:\/[a-z\d_.@+-]+)?$/i.test(libraryId) || libraryId.length>200) throw bad('ID de biblioteca inválido. Use /organizacao/biblioteca ou sua versão.');
      if (typeof language !== 'string' || language.length > 50) throw bad('Linguagem inválida.');
      // getContext é a operação oficial v2. A busca v3 oferece ranking por linguagem.
      return invoke(() => language ? client.search(query, { libraries: [libraryId], language, type: 'txt' }) : client.getContext(query, libraryId));
    },
    async search({ query, libraries = [], version = '', language = '' }) {
      query = queryText(query);
      if (!Array.isArray(libraries) || libraries.length > 4 || libraries.some(x => typeof x !== 'string' || x.length > 200) || typeof version !== 'string' || version.length > 100 || typeof language !== 'string' || language.length > 50 || (version && !libraries.length)) throw bad('Filtros Context7 inválidos. Versão exige uma biblioteca.');
      return invoke(() => client.search(query, { libraries, ...(version ? { version } : {}), ...(language ? { language } : {}) }));
    }
  };
}
export async function cacheContext7(project, query, libraryId, result) {
  const content = (typeof result === 'string' ? result : JSON.stringify(result)).slice(0,24000);
  const item = { id:makeId(), project, query, libraryId, content, at:new Date().toISOString(), source:'Context7' };
  await update('contextseven-cache', items => [item, ...items].slice(0,80));
  return item;
}
export async function listContext7Cache(project) { return (await load('contextseven-cache', [])).filter(x => x.project === project); }
