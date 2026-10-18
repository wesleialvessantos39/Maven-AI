import { load,save } from './store.mjs';
import { sha,bad,allowedCode,makeId,requirePhrase } from './security.mjs';
import {readProjectFile,writeExistingProjectFile} from './workspace.mjs';
function checkContent(path,content){if(!allowedCode(path)||typeof content!=='string'||content.length<1||content.length>24000)throw bad('Arquivo ou conteúdo inválido (limite 24 mil caracteres).');}
export async function stageProposal({project,file,content,reason='Proposta revisável',origin='manual'}){
 checkContent(file,content);
 const original=await readProjectFile(project,file);
 if(original.content===content)throw bad('Conteúdo igual ao arquivo atual.');
 const entry={id:makeId(),project,file,reason:String(reason).slice(0,500),origin,previousHash:sha(original.content),previous:original.content,next:content,status:'pendente',createdAt:new Date().toISOString()};
 const items=await load('proposals',[]);items.unshift(entry);await save('proposals',items.slice(0,50));return present(entry);
}
export function present(p){return {id:p.id,project:p.project,file:p.file,reason:p.reason,origin:p.origin,status:p.status,createdAt:p.createdAt,previous:p.previous,next:p.next,previousHash:p.previousHash,backupId:p.backupId||null,githubUrl:p.githubUrl||null};}
export async function listProposals(project){return (await load('proposals',[])).filter(p=>!project||p.project===project).map(present);}
export async function getProposal(id){let item=(await load('proposals',[])).find(p=>p.id===id);if(!item)throw bad('Proposta não encontrada.',404);return item;}
export async function modifyProposal(id,mod){let all=await load('proposals',[]);let idx=all.findIndex(p=>p.id===id);if(idx<0)throw bad('Proposta não encontrada.',404);all[idx]={...all[idx],...mod};await save('proposals',all);return present(all[idx]);}
export async function applyProposal(id,confirmation){requirePhrase(confirmation,'APLICAR LOCAL');const p=await getProposal(id);
 if(p.status!=='pendente')throw bad('Proposta já processada.',409);
 const result=await writeExistingProjectFile(p.project,p.file,p.next,p.previousHash);
 return modifyProposal(id,{status:'aplicada',backupId:result.backupId,appliedAt:new Date().toISOString()});
}
export function extractGenerated(content){
 const trimmed=content.trim();let json=trimmed;
 if(trimmed.startsWith('```'))json=trimmed.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try {let obj=JSON.parse(json); if(typeof obj.content==='string')return {content:obj.content,reason:obj.reason||'Proposta gerada pela IA'};}catch{}
 // resposta não estruturada: não arriscar escrever código parcial.
 throw bad('O modelo não retornou JSON válido com content. Experimente um modelo maior ou faça uma proposta manual.',422);
}

export async function revertProposal(id,confirmation){
 requirePhrase(confirmation,'REVERTER LOCAL');const p=await getProposal(id);
 if(p.status!=='aplicada')throw bad('Somente proposta aplicada pode ser revertida.',409);
 const result=await writeExistingProjectFile(p.project,p.file,p.previous,sha(p.next));
 return modifyProposal(id,{status:'revertida',revertedAt:new Date().toISOString(),revertBackupId:result.backupId});
}
