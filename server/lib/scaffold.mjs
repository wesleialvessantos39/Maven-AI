import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS_ROOT } from './workspace.mjs';
import {bad,onlySlug,requirePhrase} from './security.mjs';
import crypto from 'node:crypto';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../templates/react-vite-fullstack');
const overlays=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../templates');
const creating=new Set();
export async function scaffold({name,confirmation,systemType='web'}){
 onlySlug(name);requirePhrase(confirmation,'CRIAR PROJETO');
 if(!['web','pwa','saas'].includes(systemType))throw bad('Tipo de template inválido.');
 if(creating.has(name))throw bad('Projeto já está sendo criado.',409);
 creating.add(name);
 const target=path.join(PROJECTS_ROOT,name);
 const staging=path.join(PROJECTS_ROOT,'.stage-'+crypto.randomUUID());
 try{
 await fs.mkdir(PROJECTS_ROOT,{recursive:true});
 try{await fs.lstat(target);throw bad('Já existe projeto com esse nome.',409);}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.cp(source,staging,{recursive:true,force:false,errorOnExist:true});
 if(systemType!=='web')await fs.cp(path.join(overlays,systemType),staging,{recursive:true});
 const pkg=JSON.parse(await fs.readFile(path.join(staging,'package.json'),'utf8'));pkg.name=name;
 await fs.writeFile(path.join(staging,'package.json'),JSON.stringify(pkg,null,2)+'\n');
 if(systemType==='pwa'){
  const main=path.join(staging,'src/main.jsx');await fs.appendFile(main,"\nif(import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(error=>console.error('Service worker:',error));\n");
  const html=path.join(staging,'index.html');await fs.writeFile(html,(await fs.readFile(html,'utf8')).replace('</head>','<link rel="manifest" href="/manifest.webmanifest"/><meta name="theme-color" content="#152d48"/></head>'));
 }
 await fs.writeFile(path.join(staging,'maven-project.json'),JSON.stringify({name,systemType,createdAt:new Date().toISOString(),framework:'React + Vite',notes:systemType==='saas'?'CRUD de exemplo por usuário; esquema de empresas e memberships incluído. Integração de tenant na API e cobrança ainda deve ser implementada.':systemType==='pwa'?'Instalável em localhost ou HTTPS; cache de shell estático, sem cache de APIs ou dados autenticados.':'Base web full-stack.'},null,2));
 await fs.rename(staging,target);
 return {name,systemType,root:target,files:await fs.readdir(target)};
 }finally{creating.delete(name);await fs.rm(staging,{recursive:true,force:true});}
}
