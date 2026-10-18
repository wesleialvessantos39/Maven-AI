import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
process.env.MY_IA_DATA_DIR=await fs.mkdtemp(path.join(os.tmpdir(),'minha-ia-test-'));
const {PROJECTS_ROOT}=await import('./workspace.mjs');
const {stageProposal,applyProposal,revertProposal}=await import('./proposals.mjs');
const {stageMigration}=await import('./supabase-migrations.mjs');
const {scaffold}=await import('./scaffold.mjs');
const {allowedCode,repoParts}=await import('./security.mjs');
const {SKILLS}=await import('./skills.mjs');
const {DATA_DIR}=await import('./store.mjs');

test('17 habilidades originais para desenvolvimento',()=>{
 assert.equal(SKILLS.length,17);assert.equal(new Set(SKILLS.map(s=>s[0])).size,17);
});
test('impede acesso a arquivos de segredos e pastas externas',()=>{
 for(const name of ['.env','src/../.env','node_modules/x.js','src/.private.js','../../fora.jsx'])assert.equal(allowedCode(name),false);
 assert.equal(allowedCode('src/App.jsx'),true); assert.throws(()=>repoParts('foo/bar/baz'));
});
test('proposta só altera arquivo existente após confirmação, com backup e hash',async()=>{
 const project='fixture-'+crypto.randomUUID().slice(0,8);const folder=path.join(PROJECTS_ROOT,project);await fs.mkdir(folder,{recursive:true});
 const file=path.join(folder,'App.jsx');await fs.writeFile(file,'export default 1;');
 try{
 const p=await stageProposal({project,file:'App.jsx',content:'export default 2;',reason:'Teste de aprovação'});
 assert.equal(p.status,'pendente');assert.equal(await fs.readFile(file,'utf8'),'export default 1;');
 await assert.rejects(()=>applyProposal(p.id,'CONFIRMO'));
 const applied=await applyProposal(p.id,'APLICAR LOCAL');assert.equal(applied.status,'aplicada');
 assert.equal(await fs.readFile(file,'utf8'),'export default 2;');
 assert.equal((await fs.readFile(path.join(DATA_DIR,'backups',applied.backupId+'.bak'),'utf8')),'export default 1;');
 await assert.rejects(()=>applyProposal(p.id,'APLICAR LOCAL'));
 await assert.rejects(()=>revertProposal(p.id,'CONFIRMO'));
 const reverted=await revertProposal(p.id,'REVERTER LOCAL');assert.equal(reverted.status,'revertida');
 assert.equal(await fs.readFile(file,'utf8'),'export default 1;');
 }finally{await fs.rm(folder,{recursive:true,force:true});}
});
test('SQL potencialmente destrutivo bloqueado antes de registrar migration',async()=>{
 await assert.rejects(()=>stageMigration({ref:'abcdefghijklmnopqrst',name:'quebrar',sql:'DROP TABLE public.users;'}));
});
test('scaffold cria novo projeto React + Vite e não sobrescreve projeto existente',async()=>{
 const name='template-'+crypto.randomUUID().slice(0,8);
 try{
 await assert.rejects(()=>scaffold({name,confirmation:'CONFIRMO'}));
 const created=await scaffold({name,confirmation:'CRIAR PROJETO'});
 assert.equal(created.name,name);
 const pkg=JSON.parse(await fs.readFile(path.join(PROJECTS_ROOT,name,'package.json')));
 assert.ok(pkg.dependencies.react);assert.ok(pkg.devDependencies.vite);
 assert.ok((await fs.readFile(path.join(PROJECTS_ROOT,name,'src','style.css'),'utf8')).includes('@media(max-width:650px)'));
 await assert.rejects(()=>scaffold({name,confirmation:'CRIAR PROJETO'}));
 }finally{await fs.rm(path.join(PROJECTS_ROOT,name),{recursive:true,force:true});}
});

test('limpa armazenamento descartável dos testes',async()=>{await fs.rm(DATA_DIR,{recursive:true,force:true});});
