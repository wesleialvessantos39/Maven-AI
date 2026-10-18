import {load,save} from './store.mjs';
import {bad,onlySlug,makeId,requirePhrase} from './security.mjs';
const refOk=ref=>{if(typeof ref!=='string'||!/^[a-z0-9]{12,30}$/i.test(ref))throw bad('ID de projeto Supabase inválido.');return ref;};
function sqlChecks(sql){
 if(typeof sql!=='string'||sql.length<15||sql.length>16000)throw bad('SQL inválido ou muito grande.');
 if(/\b(drop|truncate|delete|update|insert|grant|revoke|alter\s+role|create\s+extension|copy|execute|do\s+\$|pg_sleep)\b/i.test(sql))throw bad('SQL de alto risco bloqueado nesta versão. Faça manualmente depois de revisão especializada.',403);
 return ['RLS deve ser habilitada nas tabelas expostas.','Verifique policies por usuário e por empresa.','Faça backup e valide em projeto de teste.','A classificação por palavras-chave não equivale a uma auditoria de SQL.'];
}
export async function stageMigration({ref,name,sql}){
 refOk(ref);onlySlug(name,'Nome da migration');const warnings=sqlChecks(sql);
 const all=await load('migrations',[]);let item={id:makeId(),ref,name,sql,warnings,status:'rascunho',createdAt:new Date().toISOString()};all.unshift(item);await save('migrations',all.slice(0,30));return item;
}
export async function listMigrations(){return await load('migrations',[]);}
export async function applyMigration(id,phrase){requirePhrase(phrase,'APLICAR MIGRACAO');
 if(process.env.ALLOW_REMOTE_MUTATIONS!=='true'||process.env.ENABLE_SUPABASE_WRITES!=='true')throw bad('Libere ALLOW_REMOTE_MUTATIONS=true e ENABLE_SUPABASE_WRITES=true no .env.',403);
 const token=process.env.SUPABASE_ACCESS_TOKEN; if(!token)throw bad('Token de acesso Supabase não configurado.',412);
 const all=await load('migrations',[]);let ix=all.findIndex(x=>x.id===id);if(ix<0)throw bad('Migration não encontrada.',404);
 const item=all[ix];if(item.status!=='rascunho')throw bad('Migration já processada.',409);sqlChecks(item.sql);
 const r=await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(refOk(item.ref))}/database/migrations`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({name:item.name,query:item.sql}),signal:AbortSignal.timeout(25000)});
 const body=await r.text();if(!r.ok)throw bad(`Supabase respondeu HTTP ${r.status}: ${body.slice(0,160)}`,502);
 all[ix]={...item,status:'aplicada',appliedAt:new Date().toISOString()};await save('migrations',all);return {id,status:'aplicada',ref:item.ref};
}
