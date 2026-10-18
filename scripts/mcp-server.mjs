import '../server/lib/config.mjs';
import readline from 'node:readline';
import { listSuperpowers, readSuperpower } from '../server/lib/superpowers.mjs';
import { createContext7Service } from '../server/lib/context7.mjs';
const string = {type:'string'};
const schema = (properties,required) => ({type:'object',properties,required,additionalProperties:false});
const tools = [
  {name:'superpowers-list',description:'Lista todas as 15 habilidades e metodologias Superpowers instaladas.',inputSchema:schema({},[])},
  {name:'superpowers-read',description:'Lê habilidade Superpowers integral e lista suas referências. Não executa scripts.',inputSchema:schema({id:string,resource:string},['id'])},
  {name:'resolve-library-id',description:'Resolve nome de biblioteca em ID Context7. Envia query ao serviço externo; requer CONTEXT7_API_KEY.',inputSchema:schema({query:string,libraryName:string},['query','libraryName'])},
  {name:'query-docs',description:'Consulta documentação atual de um ID Context7. Requer CONTEXT7_API_KEY.',inputSchema:schema({query:string,libraryId:string,language:string},['query','libraryId'])},
  {name:'search-docs',description:'Busca Context7 v3 com filtros de biblioteca, versão e linguagem.',inputSchema:schema({query:string,libraries:{type:'array',items:string,maxItems:4},version:string,language:string},['query'])}
];
const output = value => process.stdout.write(JSON.stringify(value)+'\n');
async function handle(message) {
  if(message.id===undefined)return;
  const id=message.id;
  try {
    let result;
    if(message.jsonrpc!=='2.0')throw Object.assign(Error('JSON-RPC inválido'),{rpc:-32600});
    if(message.method==='initialize')result={protocolVersion:['2025-06-18','2025-03-26','2024-11-05'].includes(message.params?.protocolVersion)?message.params.protocolVersion:'2025-03-26',capabilities:{tools:{},resources:{}},serverInfo:{name:'maven-ai-superpowers-context7',version:'2.0.0'}};
    else if(message.method==='ping')result={};
    else if(message.method==='tools/list')result={tools};
    else if(message.method==='resources/list')result={resources:(await listSuperpowers()).map(s=>({uri:'superpowers:///'+s.id+'/SKILL.md',name:s.name,mimeType:'text/markdown',description:s.description}))};
    else if(message.method==='resources/read'){
      const uri=message.params?.uri||'';const match=/^superpowers:\/\/\/([a-z-]+)\/(.+)$/.exec(uri);
      if(!match)throw Object.assign(Error('Recurso inválido'),{rpc:-32602});
      const item=await readSuperpower(match[1],match[2]);result={contents:[{uri,mimeType:'text/markdown',text:item.content}]};
    }else if(message.method==='tools/call'){
      const {name,arguments:args={}}=message.params||{};let value;
      try {
        if(name==='superpowers-list')value=await listSuperpowers();
        else if(name==='superpowers-read')value=await readSuperpower(args.id,args.resource);
        else if(name==='resolve-library-id')value=await createContext7Service().resolve(args);
        else if(name==='query-docs')value=await createContext7Service().docs(args);
        else if(name==='search-docs')value=await createContext7Service().search(args);
        else throw Object.assign(Error('Ferramenta desconhecida'),{rpc:-32602});
        result={content:[{type:'text',text:typeof value==='string'?value:JSON.stringify(value)}]};
      }catch(error){if(error.rpc)throw error;result={isError:true,content:[{type:'text',text:error.message}]};}
    }else throw Object.assign(Error('Método não encontrado'),{rpc:-32601});
    output({jsonrpc:'2.0',id,result});
  }catch(error){output({jsonrpc:'2.0',id,error:{code:error.rpc||-32603,message:error.message}});}
}
const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
let queue=Promise.resolve();
lines.on('line',line=>{
  if(Buffer.byteLength(line)>110000)return output({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Mensagem muito grande'}});
  let message;try{message=JSON.parse(line)}catch{return output({jsonrpc:'2.0',id:null,error:{code:-32700,message:'JSON inválido'}})}
  if(!message||typeof message!=='object'||Array.isArray(message))return output({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Requisição inválida'}});
  queue=queue.then(()=>handle(message));
});
