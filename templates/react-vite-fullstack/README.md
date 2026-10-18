# Template profissional — React + Vite + Supabase + Vercel

Base funcional de tarefas com login Supabase, CRUD autenticado no backend, RLS por usuário, painel desktop e celular (320 a 1440px), botão de menu móvel, navegação inferior, ícones, foco acessível, estados de erro/vazio/carregando. **É um template, não um ERP completo**.

1. `npm install` (Node.js 24 recomendado).
2. Copie `.env.example` para `.env`, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. As chaves publishable não substituem RLS. Nunca coloque segredos com prefixo `VITE_`.
3. Revise a migration `supabase/migrations/...sql` e aplique no banco de teste com Supabase CLI versionada; configure usuários pelo Auth Dashboard.
4. Execute `npm run dev`, acesse http://127.0.0.1:5173 (API em localhost:8790).
5. Execute `npm test` e `npm run build` antes de commit.
6. Vincule GitHub à Vercel, configure variável do frontend e do backend por ambiente, `framework=vite`, pasta raiz do projeto, build `npm run build` e output `dist`. A Vercel detecta o diretório `/api` como funções Node quando suportado pela configuração do projeto; valide na prévia antes de publicar.
7. Não deixe acesso à produção sem testar policies RLS e permissões de Auth.

## Arquitetura

`React + Vite UI -> Auth client (publishable key) -> /api/tasks Node -> getUser(JWT) -> Supabase client com JWT do usuário -> RLS -> tabelas`.

## Segurança e verificação

- Funções API autenticadas, validação simples de tamanho e tipos, acesso por RLS.
- Chaves server-only `SUPABASE_*` no backend e variáveis públicas `VITE_*` só com publishable key.
- Backups, rate-limit, observabilidade e testes end-to-end devem ser acrescentados para sistemas públicos de alta criticidade.
- App local (Node) não é publicado automaticamente na Vercel; este template é um projeto separado.
