import {fetchDoc,SOURCES} from './knowledge.mjs';
export function beginDocumentationSchedule(){
 if(process.env.AUTO_REFRESH_DOCS!=='true')return;
 const keys=Object.keys(SOURCES);let index=0;
 const timer=setInterval(async()=>{try{await fetchDoc(keys[index++%keys.length]);console.log('Documentação oficial atualizada.')}catch(e){console.warn('Atualização automática falhou:',e.message)}},24*60*60*1000);
 timer.unref();
}
