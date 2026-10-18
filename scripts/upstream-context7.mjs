import '../server/lib/config.mjs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { root } from './panel-state.mjs';
const [mode,...args]=process.argv.slice(2);
const binary=mode==='mcp'?'@upstash/context7-mcp/dist/index.js':mode==='cli'?'ctx7/dist/index.js':null;
if(!binary){console.error('Modo esperado: cli ou mcp');process.exit(1)}
const child=spawn(process.execPath,[path.join(root,'node_modules',binary),...args],{cwd:root,stdio:'inherit',env:{...process.env,CTX7_TELEMETRY_DISABLED:'1',DO_NOT_TRACK:'1'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));child.on('error',error=>{console.error(error.message);process.exit(1)});
