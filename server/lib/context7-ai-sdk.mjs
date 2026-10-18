// Adaptador oficial para aplicações geradas que utilizam Vercel AI SDK.
// A chave continua exclusivamente no servidor. Nenhuma inferência ocorre ao importar.
import { resolveLibraryId, queryDocs, Context7Agent } from '@upstash/context7-tools-ai-sdk';
import { bad } from './security.mjs';
export function createContext7Tools(apiKey=process.env.CONTEXT7_API_KEY) {
  if(!apiKey)throw bad('Configure CONTEXT7_API_KEY no servidor.',412);
  return {resolveLibraryId:resolveLibraryId({apiKey}),queryDocs:queryDocs({apiKey})};
}
export { Context7Agent };
