import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bad } from './security.mjs';
export const DATA_DIR = path.resolve(process.env.MY_IA_DATA_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data'));
export async function load(name, fallback=[]) {
  try { return JSON.parse(await fs.readFile(path.join(DATA_DIR,name+'.json'),'utf8')); }
  catch(e) { if(e.code==='ENOENT') return fallback; throw e; }
}
export async function save(name, value) {
  if(!/^[a-z-]{1,40}$/.test(name)) throw bad('Armazenamento inválido.');
  await fs.mkdir(DATA_DIR,{recursive:true});
  const target=path.join(DATA_DIR,name+'.json'); const tmp=target+'.tmp';
  await fs.writeFile(tmp, JSON.stringify(value,null,2),{mode:0o600}); await fs.rename(tmp,target);
}
export async function backup(name, content) {
  if(!/^[a-f0-9-]{36}$/.test(name)) throw bad('Backup inválido.');
  await fs.mkdir(path.join(DATA_DIR,'backups'),{recursive:true});
  const dest=path.join(DATA_DIR,'backups',name+'.bak');
  await fs.writeFile(dest,content,{flag:'wx',mode:0o600});
  return dest;
}
