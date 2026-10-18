import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root, panelIsCurrent } from './panel-state.mjs';
// O Python zipfile é utilizado somente para empacotamento de release no ambiente de desenvolvimento.
if(!panelIsCurrent())throw Error('Execute npm run build antes de empacotar.');
const directory=path.join(root,'downloads');await fs.mkdir(directory,{recursive:true});
const destination=path.join(directory,'Maven-AI-Studio-v2-Windows.zip');
const files=execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean).filter(file=>!file.startsWith('downloads/'));
async function walk(relative){for(const item of await fs.readdir(path.join(root,relative),{withFileTypes:true})){const file=relative+'/'+item.name;if(item.isDirectory())await walk(file);else files.push(file)}}
await walk('client/dist');
const manifest=path.join(directory,'.package-files.json');await fs.writeFile(manifest,JSON.stringify([...new Set(files)].sort()));
try{
  execFileSync('python',['-c',"import json,pathlib,zipfile,sys; root=pathlib.Path(sys.argv[1]); files=json.loads(pathlib.Path(sys.argv[2]).read_text()); z=zipfile.ZipFile(sys.argv[3],'w',zipfile.ZIP_DEFLATED,compresslevel=9); [z.write(root/f,'Maven-AI/'+f) for f in files]; z.close()",root,manifest,destination],{stdio:'inherit'});
}finally{await fs.rm(manifest,{force:true})}
const hash=crypto.createHash('sha256').update(await fs.readFile(destination)).digest('hex');
await fs.writeFile(path.join(directory,'SHA256SUMS.txt'),`${hash}  ${path.basename(destination)}\n`);
console.log(`Pacote: ${destination}\nSHA256: ${hash}`);
