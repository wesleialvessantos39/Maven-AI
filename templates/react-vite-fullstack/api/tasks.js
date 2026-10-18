import { createClient } from '@supabase/supabase-js';
export function validateTask(value) {
 if(typeof value!=='string'||value.trim().length<2||value.trim().length>140)throw Object.assign(new Error('Título precisa ter 2 a 140 caracteres.'),{status:400});return value.trim();
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return res.status(503).json({error:'Configure as variáveis server-only do Supabase.'});
 const header=req.headers.authorization||'';const token=header.startsWith('Bearer ')?header.slice(7):'';
 if(!token||token.length>5000)return res.status(401).json({error:'Sessão não autorizada.'});
 const base={auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}};
 const auth=createClient(url,key,base);const {data:verified,error:authError}=await auth.auth.getUser(token);
 if(authError||!verified.user)return res.status(401).json({error:'Sessão expirada ou inválida.'});
 const supabase=createClient(url,key,{...base,global:{headers:{Authorization:`Bearer ${token}`}}});
 const {method}=req;const body=req.body||{};
 try {
  if(method==='GET'){
   const {data,error}=await supabase.from('tasks').select('id,title,done,created_at').order('created_at',{ascending:false}).limit(80);
   if(error)throw error;return res.status(200).json({items:data});
  }
  if(method==='POST'){
   const title=validateTask(body.title);
   const {data,error}=await supabase.from('tasks').insert({title,user_id:verified.user.id}).select('id,title,done,created_at').single();
   if(error)throw error;return res.status(201).json({item:data});
  }
  if(method==='PATCH'){
   if(typeof body.id!=='string'||!(/^[0-9a-f-]{36}$/i).test(body.id)||typeof body.done!=='boolean')return res.status(400).json({error:'Dados inválidos.'});
   const {data,error}=await supabase.from('tasks').update({done:body.done}).eq('id',body.id).eq('user_id',verified.user.id).select('id,title,done,created_at').single();
   if(error)throw error;return res.status(200).json({item:data});
  }
  if(method==='DELETE'){
   if(typeof body.id!=='string'||!(/^[0-9a-f-]{36}$/i).test(body.id))return res.status(400).json({error:'ID inválido.'});
   const {error}=await supabase.from('tasks').delete().eq('id',body.id).eq('user_id',verified.user.id);if(error)throw error;
   return res.status(200).json({ok:true});
  }
  return res.status(405).json({error:'Método não permitido.'});
 }catch(error){console.error('tasks API:',error.code||error.message);return res.status(error.status||500).json({error:error.status?error.message:'Falha ao consultar tarefas. Verifique o banco, RLS e logs da API.'});}
}
