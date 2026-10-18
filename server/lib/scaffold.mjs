import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS_ROOT } from './workspace.mjs';
import {bad,onlySlug,requirePhrase} from './security.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../templates/react-vite-fullstack');
export async function scaffold({name,confirmation}){
 onlySlug(name);requirePhrase(confirmation,'CRIAR PROJETO');
 const target=path.join(PROJECTS_ROOT,name);await fs.mkdir(PROJECTS_ROOT,{recursive:true});
 try{await fs.lstat(target);throw bad('Já existe projeto com esse nome.',409);}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.cp(source,target,{recursive:true,force:false,errorOnExist:true});
 return {name,root:target,files:await fs.readdir(target)};
}
