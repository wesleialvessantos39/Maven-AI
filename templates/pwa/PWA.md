# Aplicativo web instalável

Compile com `npm run build` e teste em `npm run preview`. O service worker só é registrado no build de produção. No celular, use HTTPS; localhost é permitido para desenvolvimento na própria máquina.

Personalize nome, cores e ícones em `public/manifest.webmanifest`. O cache guarda apenas shell e arquivos estáticos, nunca `/api`, requisições com Authorization ou respostas do Supabase. A tela pode abrir offline após uma visita online; login e operações do banco precisam de rede. Não há fila de escrita offline.

Antes de distribuir, teste instalação, recarga offline, troca de versão, logout e atualização. Ao mudar o shell, incremente a versão CACHE em `public/sw.js` e valide a atualização do worker. Não acrescente dados privados ao cache.
