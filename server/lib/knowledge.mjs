import crypto from "node:crypto";
import { load, save } from './store.mjs';
import { bad } from './security.mjs';
export const SOURCES = Object.freeze({
 'vite':{title:'Vite — Guia',url:'https://vite.dev/guide/'},
 'react':{title:'React — Documentação',url:'https://react.dev/learn'},
 'supabase-rls':{title:'Supabase — RLS',url:'https://supabase.com/docs/guides/database/postgres/row-level-security'},
 'supabase-migrations':{title:'Supabase — Migrations',url:'https://supabase.com/docs/guides/deployment/database-migrations'},
 'vercel':{title:'Vercel — Deployments',url:'https://vercel.com/docs/deployments'},
 'github':{title:'GitHub — Pull requests',url:'https://docs.github.com/en/rest/pulls/pulls'},
 'ollama':{title:'Ollama — API',url:'https://docs.ollama.com/api/chat'},
 'mdn':{title:'MDN — Responsive Design',url:'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design'}
});
function strip(html) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/ig,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/ig,' ').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g,' ').replace(/\s+/g,' ').trim().slice(0,30000); }
export async function fetchDoc(key) {
 const doc=SOURCES[key]; if(!doc) throw bad('Fonte não autorizada.',400);
 const result=await fetch(doc.url,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{'User-Agent':'MinhaIAStudio/1.0'}});
 if(!result.ok) throw bad('Falha ao consultar fonte (HTTP '+result.status+').',502);
 const type=result.headers.get('content-type') || '';
 if(!/(html|text|markdown)/i.test(type)) throw bad('Formato de documentação não suportado.',415);
 const raw=await result.text(); if(raw.length>800000) throw bad('Documento muito grande.',413);
 const item={key,title:doc.title,url:doc.url,at:new Date().toISOString(),content:strip(raw)};
 const previous=await load('docs',{});previous[key]=item;await save('docs',previous);
 return {key,title:item.title,url:item.url,at:item.at,chars:item.content.length};
}
export async function listDocs(){return Object.values(await load('docs',{})).map(({key,title,url,at,content})=>({key,title,url,at,chars:content.length}));}
export async function getContext(query){
 const docs=Object.values(await load('docs',{}));
 const tokens=(query.toLowerCase().match(/[a-zá-ú0-9_-]{4,}/g)||[]).slice(0,12);
 return docs.map(doc=>{
  const lower=doc.content.toLowerCase();let best=0; for(const token of tokens){const pos=lower.indexOf(token);if(pos>=0) {best+=1;}}
  return {...doc,score:best};
 }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,2).map(d=>({title:d.title,url:d.url,at:d.at,excerpt:d.content.slice(0,1800)}));
}
export async function addFeedback({project,lesson,kind}) {
 if(typeof project!=='string' || project.length>100 || typeof lesson!=='string' || lesson.trim().length<5 || lesson.length>1200 || !['preferencia','correcao','decisao'].includes(kind))throw bad('Feedback inválido.');
 const all=await load('feedback',[]); const item={id:crypto.randomUUID(),project,kind,lesson:lesson.trim(),at:new Date().toISOString()};
 all.unshift(item);await save('feedback',all.slice(0,100));return item;
}
export async function getFeedback(project){return (await load('feedback',[])).filter(x=>x.project===project || x.project==='geral').slice(0,12);}
