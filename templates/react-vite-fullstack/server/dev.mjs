import http from 'node:http';import {fileURLToPath} from 'node:url';import handler from '../api/tasks.js';
try{process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url)));}catch(e){if(e.code!=='ENOENT')throw e;}
http.createServer(async(req,res)=>{
 res.status=function(code){res.statusCode=code;return res};
 res.json=function(body){res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));return res};
 let text='';for await(const chunk of req){text+=chunk;if(text.length>10000){res.status(413).json({error:'Requisição muito grande.'});return;}}
 try{req.body=text?JSON.parse(text):{};}catch{res.status(400).json({error:'JSON inválido.'});return;}
 await handler(req,res);
}).listen(8790,'127.0.0.1',()=>console.log('API de desenvolvimento: http://127.0.0.1:8790'));
