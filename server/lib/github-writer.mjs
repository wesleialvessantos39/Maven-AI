import { repoParts, bad,requirePhrase,sha } from './security.mjs';
import {getProposal,modifyProposal} from './proposals.mjs';
import {readProjectFile} from './workspace.mjs';
const base='https://api.github.com';
async function gh(route,options={}){
 if(!process.env.GITHUB_TOKEN)throw bad('GITHUB_TOKEN não configurado.',412);
 const r=await fetch(base+route,{...options,signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':'2026-03-10',Accept:'application/vnd.github+json','Content-Type':'application/json',...options.headers}});
 const value=await r.json().catch(()=>({}));
 if(!r.ok)throw bad(`GitHub HTTP ${r.status}: ${String(value.message||'Verifique credenciais e permissões').slice(0,200)}`,502);
 return value;
}
export async function createDraftPR({id,repository,confirmation}){
 requirePhrase(confirmation,'CRIAR PR');
 if(process.env.ALLOW_REMOTE_MUTATIONS!=='true')throw bad('Ative ALLOW_REMOTE_MUTATIONS=true no .env.',403);
 const p=await getProposal(id);if(p.status!=='aplicada'||p.githubUrl)throw bad('Aplique localmente uma proposta ainda não publicada.',409);
 const {content:current}=await readProjectFile(p.project,p.file);
 if(sha(current)!==sha(p.next))throw bad('Arquivo local divergiu após aprovação.',409);
 const [owner,repo]=repoParts(repository);const prefix=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
 const meta=await gh(prefix); const main=meta.default_branch;
 const ref=await gh(`${prefix}/git/ref/heads/${encodeURIComponent(main)}`);
 const remote=await gh(`${prefix}/contents/${p.file.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(main)}`);
 if(!remote.content || remote.encoding!=='base64')throw bad('Arquivo remoto indisponível.',409);
 const original=Buffer.from(remote.content.replace(/\n/g,''),'base64').toString('utf8');
 if(sha(original)!==p.previousHash)throw bad('Arquivo no GitHub é diferente da base analisada. Não foi criado PR.',409);
 const branch=`minha-ia/${p.id.slice(0,8)}`;
 await gh(`${prefix}/git/refs`,{method:'POST',body:JSON.stringify({ref:'refs/heads/'+branch,sha:ref.object.sha})});
 await gh(`${prefix}/contents/${p.file.split('/').map(encodeURIComponent).join('/')}`,{method:'PUT',body:JSON.stringify({message:`Minha IA: ${p.reason.slice(0,70)}`,branch,sha:remote.sha,content:Buffer.from(p.next,'utf8').toString('base64')})});
 const pr=await gh(`${prefix}/pulls`,{method:'POST',body:JSON.stringify({title:`Minha IA: ${p.reason.slice(0,65)}`,body:`Proposta revisável ${p.id}.\nArquivo: ${p.file}\n\nRevisar código, testes, Supabase RLS e preview Vercel antes de aprovar.`,head:branch,base:main,draft:true})});
 await modifyProposal(id,{githubUrl:pr.html_url});return {url:pr.html_url,branch,number:pr.number};
}
