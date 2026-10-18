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

## Módulos v2

- `engineering.mjs`: planos, dependências, revisão, investigações e contexto por projeto.
- `code-audit.mjs`: inspeção estática, metadados de cobertura e relatórios sem valores de credenciais.
- `http-security.mjs`: proteções HTTP, sessão CSRF e trilha de operações.
- `superpowers.mjs`: catálogo das 15 habilidades originais, leitura das referências e seleção por tarefa.
- `context7.mjs`: SDK oficial, consultas externas limitadas e cache.
- `toolbox.mjs`: configuração por projeto e endpoints das ferramentas.
- `scripts/mcp-server.mjs`: ferramentas/recursos stdio para clientes externos; não executa shell.
- `scripts/upstream-context7.mjs`: CLI/MCP oficiais, executados somente quando chamados.
- `scripts/start.mjs`: valida Node, compila SDK e verifica o fingerprint do painel antes de iniciar.

`third_party/` é fonte de terceiros preservada. Suas instruções são referências de metodologia, sem autoridade para substituir as políticas e capacidades do aplicativo. O código recuperado não é executado. Credenciais ficam no `.env` carregado pela raiz do servidor e não são embutidas no build Vite.
