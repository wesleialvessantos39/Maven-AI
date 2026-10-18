import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { root } from './helpers.mjs';
test('MCP stdio anuncia ferramentas, lê as 15 habilidades e recusa caminhos externos',async()=>{
  const child=spawn(process.execPath,['scripts/mcp-server.mjs'],{cwd:root,env:{...process.env,CONTEXT7_API_KEY:''},stdio:['pipe','pipe','pipe']});
  const requests=[
    {id:1,method:'initialize',params:{protocolVersion:'2025-03-26'}},
    {id:2,method:'tools/list'},
    {id:3,method:'tools/call',params:{name:'superpowers-list',arguments:{}}},
    {id:4,method:'resources/read',params:{uri:'superpowers:///systematic-debugging/SKILL.md'}},
    {id:5,method:'tools/call',params:{name:'superpowers-read',arguments:{id:'writing-plans',resource:'../../LICENSE'}}},
    {id:6,method:'tools/call',params:{name:'query-docs',arguments:{query:'hooks',libraryId:'/facebook/react'}}}
  ];
  let stdout='',stderr='';child.stdout.on('data',c=>stdout+=c);child.stderr.on('data',c=>stderr+=c);
  child.stdin.end(requests.map(x=>JSON.stringify({jsonrpc:'2.0',...x})).join('\n')+'\n');
  await new Promise((resolve,reject)=>{child.on('exit',code=>code?reject(Error(stderr)):resolve());child.on('error',reject)});
  const replies=stdout.trim().split('\n').map(JSON.parse);assert.equal(replies.length,6);
  assert.equal(replies[0].result.serverInfo.name,'maven-ai-superpowers-context7');
  assert.equal(replies[1].result.tools.length,5);
  assert.equal(JSON.parse(replies[2].result.content[0].text).length,15);
  assert.match(replies[3].result.contents[0].text,/Systematic Debugging/);
  assert.equal(replies[4].result.isError,true);assert.equal(replies[5].result.isError,true);
});
