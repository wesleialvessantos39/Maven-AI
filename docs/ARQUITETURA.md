# Arquitetura e decisões do Studio PRO

## Objetivo não negociável

**Todos os sistemas criados devem permanecer em React + Vite.** Seu frontend não poderá ser substituído automaticamente por Next.js, Vue ou outro framework. Integrações específicas são adaptadores, não uma segunda fonte de dados/autenticação.

## Fluxo de dados

`UI React + Vite -> API Express valida -> políticas/autorização -> serviço de ferramenta -> dados externos ou workspace -> resposta -> estado de UI`.

- **UI:** responsividade, ícones, menus e feedback de erro/empty/loading, upload não implementado. Não contém segredos.
- **Backend:** único ponto de acesso aos tokens externos, sanitização de inputs e políticas de confirmação.
- **Ferramentas:** leitura de projetos, geração, propostas, PR, migrations, previews de Vercel, aprendizado por docs.
- **Armazenamento:** arquivos JSON locais (não multiusuário); futuras versões podem usar SQLite.
- **IA:** motor local Ollama como padrão; provedor cloud opcional atrás da mesma interface, com consentimento.

## Contratos e limites

| Fonte | Permissão inicial | Mutação opt-in |
| --- | --- | --- |
| Projetos locais | leitura de extensões permitidas | somente arquivo existente por proposta aprovada; backup antes |
| GitHub | listar repositórios | branch nova + commit de um arquivo + PR draft após confirmação e SHA match |
| Supabase | listar projetos | migrations SQL de baixo risco com duas flags + confirmação |
| Vercel | listar projetos/deploys | nenhuma alteração remota por API; preview do GitHub/Vercel integrado |
| Internet | oito hosts/páginas pré-definidas | atualização de cache, não execução de scripts |

## Arquivos

`server/index.mjs`: rotas e política de acesso local. `server/lib/workspace.mjs`: controles de caminhos. `proposals.mjs`: proposta, hash, apply e rollback local. `github-writer.mjs`: draft PR. `supabase-migrations.mjs`: drafts e integração Management API. `knowledge.mjs`: fetch e RAG simples. `profiles.mjs`: restrições de RAM e prompt. `templates/react-vite-fullstack/`: scaffold independente.

## Alterações seguras

Nenhuma ferramenta deve remover estrutura existente sem checar. Sempre registrar impacto, gerar diff, salvar backup, revisar permissões, realizar testes e oferecer reversão. O app atual armazena proposta por arquivo; para suporte multi-arquivo deverá usar transações/worktrees isolados.
