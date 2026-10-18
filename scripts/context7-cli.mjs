import '../server/lib/config.mjs';
import { createContext7Service } from '../server/lib/context7.mjs';
const [command, first, ...parts] = process.argv.slice(2);
try {
  const service=createContext7Service();let result;
  if(command==='library')result=await service.resolve({libraryName:first,query:parts.join(' ')});
  else if(command==='docs')result=await service.docs({libraryId:first,query:parts.join(' ')});
  else if(command==='search')result=await service.search({query:[first,...parts].filter(Boolean).join(' ')});
  else throw Error('Uso: npm run context7 -- library react "como usar hooks" | docs /facebook/react "useEffect" | search "consulta"');
  console.log(typeof result==='string'?result:JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
