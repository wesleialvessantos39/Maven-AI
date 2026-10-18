# Roadmap de implementação sem regressões

## Entregue no v1 (testes automatizados backend)

- Painel React + Vite responsivo com navegação mobile e áreas separadas.
- Ollama local (1.5B/3B) e modelo cloud opcional por Responses API.
- 17 skills de engenharia como regras de orientação.
- Workspace protegido, proposta por arquivo, edição manual, geração de proposta com IA, aprovação, backup, reversão.
- Scaffold React + Vite + Supabase Auth + CRUD Node + RLS + CI + Vercel.
- GitHub draft PR de arquivo local aprovado, Supabase migration (opt-in), Vercel leitura de deploys.
- Biblioteca de docs oficiais, memórias por projeto, atualização opcional diária.

## Incrementos propostos para níveis avançados

1. **QA visual mobile:** adicionar Playwright e testes de viewport 320/375/430/768/1024/1440. Metas: sem overflow, foco visível, alvos de toque 44px, drawers e menus funcionais.
2. **Editor de diffs:** comparação real linha por linha, validação de sintaxe JS/TS/JSX, prévia de bundle e test-before-apply.
3. **Multi-arquivo:** trabalhar em `git worktree` isolado, plano transacional com reversão de todos arquivos, evitar sobrescrever branches.
4. **Agentes por especialidade:** decomposição frontend/backend/schema/QA em planejamento conjunto, ainda com travas de custos e memória; histórico com traces.
5. **Supabase robusto:** introspecção de schema, plano de migration versionada, comparativo antes/depois, scanner de RLS, dry-run num banco separado, backup antes, rollback em plano validado.
6. **Vercel e GitHub:** preparar variáveis de preview, monitoramento de build, leitura de logs, promover produção apenas por confirmação separada.
7. **Conectores MCP seguros:** Figma, Context7, navegador de pesquisa, VS Code, observabilidade, Playwright; OAuth e esquemas com permissões explícitas.
8. **Qualidade mensurável:** dataset de exemplos de seus projetos, avaliações, detecção de regressões, documentação por módulo, book root versionado.
9. **Escala:** migrar JSON local para SQLite com transações; autenticação quando acesso por rede for necessário. Essa mudança requer revisão de ameaça antes de qualquer publicação.

**Regra permanente:** manter React + Vite, Supabase e Vercel sem trocar a base tecnológica desnecessariamente; mudanças pequenas, testes e backup. Não declarar conclusão de uma etapa sem execução e evidências.
