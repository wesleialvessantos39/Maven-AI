import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'maven-toolbox-'));
process.env.MY_IA_DATA_DIR=path.join(temp,'data');process.env.PROJECTS_ROOT=path.join(temp,'workspace');
await fs.mkdir(path.join(process.env.PROJECTS_ROOT,'sample'),{recursive:true});
await fs.writeFile(path.join(process.env.PROJECTS_ROOT,'sample/package.json'),'{}');
const { listSuperpowers, readSuperpower, superpowersContext }=await import('./superpowers.mjs');
const { createContext7Service }=await import('./context7.mjs');
const { saveToolSettings, toolContext }=await import('./toolbox.mjs');
after(()=>fs.rm(temp,{recursive:true,force:true}));

test('todas as 15 habilidades originais e suas referências são acessíveis',async()=>{
  const all=await listSuperpowers();assert.equal(all.length,15);
  for(const skill of all){const item=await readSuperpower(skill.id);assert.ok(item.content.length>100);assert.ok(item.resources.includes('SKILL.md'))}
  const debug=await readSuperpower('systematic-debugging');assert.ok(debug.resources.length>1);
  await assert.rejects(()=>readSuperpower('systematic-debugging','../../LICENSE'));
  await assert.rejects(()=>readSuperpower('__proto__'));
});
test('seleção automática e configuração de ferramentas entram no contexto',async()=>{
  const auto=await superpowersContext({query:'Corrigir erro de tela escura',profile:'economico'});
  assert.ok(auto.ids.includes('systematic-debugging'));assert.match(auto.content,/REFERÊNCIA LIMITADA/);
  await saveToolSettings({project:'sample',selected:['test-driven-development'],automaticSuperpowers:false});
  assert.deepEqual((await toolContext('sample','Revisar código','engenheiro','economico')).superpowers,['test-driven-development']);
  await assert.rejects(()=>saveToolSettings({project:'sample',automaticContext7:true,context7Consent:false,libraryId:'/facebook/react'}),/autorização/);
});
test('SDK oficial Context7 resolve bibliotecas, consulta documentação e usa filtros v3',async()=>{
  const calls=[];
  const service=createContext7Service({apiKey:'ctx7sk-test-only',fetchImpl:async(input,init)=>{
    const url=new URL(input);calls.push({url,init});assert.equal(url.origin,'https://context7.com');assert.equal(init.redirect,'error');
    assert.equal(init.headers.Authorization,'Bearer ctx7sk-test-only');
    if(url.pathname.endsWith('/libs/search'))return Response.json({results:[{id:'/facebook/react',title:'React',description:'React docs',versions:['v19']}]});
    if(url.pathname.endsWith('/context'))return Response.json({codeSnippets:[{codeTitle:'Hook',codeDescription:'Example',codeList:[{language:'tsx',code:'useEffect(effect, [])'}],codeId:'https://react.dev/reference/react/useEffect'}],infoSnippets:[]});
    return Response.json({codeSnippets:[],infoSnippets:[{content:'Use hooks',pageId:'https://react.dev',libraryId:'/facebook/react'}]});
  }});
  assert.equal((await service.resolve({query:'como usar hooks',libraryName:'react'}))[0].name,'React');
  assert.match((await service.docs({query:'useEffect',libraryId:'/facebook/react'}))[0].content,/useEffect/);
  await service.search({query:'hooks',libraries:['/facebook/react'],version:'v19',language:'TypeScript'});
  assert.equal(calls.at(-1).url.searchParams.get('version'),'v19');assert.equal(calls.at(-1).url.searchParams.get('language'),'TypeScript');
  await assert.rejects(()=>service.docs({query:'hooks',libraryId:'http://localhost/private'}),/ID/);
  await assert.rejects(()=>service.search({query:'hooks',version:'v19'}),/Filtros/);
});
test('falhas do Context7 não expõem corpo remoto nem credenciais',async()=>{
  assert.throws(()=>createContext7Service({apiKey:''}),/CONTEXT7_API_KEY/);
  const service=createContext7Service({apiKey:'ctx7sk-test-only',fetchImpl:async()=>Response.json({error:'secret diagnostic value'},{status:429})});
  await assert.rejects(()=>service.resolve({query:'hooks',libraryName:'react'}),error=>error.status===429&&!error.message.includes('secret diagnostic'));
});
