# Contrato da API local

Servidor **127.0.0.1:8787**. Não exponha externamente; sem login próprio. JSON, sem CORS para outros sites, validação de Host/Origin e limites de payload.

| Método | Endpoint | Função / autorização |
| --- | --- | --- |
| GET | `/api/status` | Perfil, modelos, RAM, permissões de escrita |
| GET | `/api/projects`, `/api/files?project=x`, `/api/file?project=x&path=y`, `/api/project-summary?project=x` | leitura de workspace com validação de caminhos |
| GET | `/api/skills` | 17 habilidades locais |
| POST | `/api/chat` | mensagens, arquivos selecionados, perfil, habilidades; nuvem requer `consentCloud=true` |
| POST | `/api/proposals/generate` | modelo gera conteúdo integral de 1 arquivo, cria proposta sem aplicar |
| POST | `/api/proposals/manual` | `project,file,content,reason`, gera proposta revisável |
| GET | `/api/proposals?project=x` | histórico completo das propostas |
| POST | `/api/proposals/:id/apply` | `confirmation: "APLICAR LOCAL"`, checa hash, backup e gravação |
| POST | `/api/proposals/:id/revert` | `confirmation: "REVERTER LOCAL"`, checa hash e desfaz localmente |
| POST | `/api/scaffold` | `name,confirmation: "CRIAR PROJETO"`, nova pasta sem sobrescrever |
| GET | `/api/integrations` | metadados GitHub, Supabase, Vercel |
| GET | `/api/github/repo?repository=owner/repo` | leitura metadata |
| POST | `/api/github/draft-pr` | `id,repository,confirmation: "CRIAR PR"`, requer flag + token write |
| GET | `/api/supabase/migrations` | drafts locais |
| POST | `/api/supabase/migrations` | `ref,name,sql` limitado |
| POST | `/api/supabase/migrations/:id/apply` | `confirmation: "APLICAR MIGRACAO"`, requer duas flags + token write |
| GET | `/api/vercel/deployments?project=x` | lista deploys, token Vercel |
| GET | `/api/knowledge` | fontes oficiais fixas e cache |
| POST | `/api/knowledge/refresh` | `key` de uma das fontes autorizadas; sem URL arbitrária |
| GET | `/api/feedback?project=x` | memórias por projeto |
| POST | `/api/feedback` | `project,kind,lesson` escreve regra em JSON local |

Erros retornam `{ "error": "descrição" }` e status HTTP sem divulgar segredos. O contrato deve receber OpenAPI e testes de autenticação completos antes de disponibilizar acesso multiusuário.

## Sessão e recursos v2

Todas as escritas também exigem cookie de sessão local e header `X-CSRF-Token`. Obtenha ambos em `GET /api/session`; o navegador usa `client/src/api.js`. Origem/Host precisam ser locais e as escritas devem ser JSON. Payload máximo 110 KB; limite global 240 requisições de API por minuto e uma inferência por vez. Falhas da sessão usam `code: SESSION_EXPIRED` para permitir renovação pelo cliente.

| Método | Endpoint | Corpo / resultado |
| --- | --- | --- |
| GET | `/api/health` | versão, saúde do servidor e existência do painel compilado |
| GET | `/api/engineering` | tipos de sistema e modos de engenharia |
| GET / POST | `/api/plans` | listar por `?project=...` ou criar com `project,objective,systemType,constraints` |
| PATCH | `/api/plans/:id/tasks/:taskId` | `status,evidence,revision`; verifica dependências e revisão otimista |
| POST | `/api/plans/:id/review` | `profile,consentCloud`; revisão consultiva com modelo |
| GET / POST | `/api/investigations` | listar por projeto ou registrar hipótese, experimento, esperado, observado, conclusão e resultado |
| GET / POST | `/api/audits` | listar por projeto ou auditar com `{project}` |
| GET | `/api/security/events` | últimas 100 operações e consistência dos hashes do arquivo atual |
| GET | `/api/toolbox/catalog?project=x` | 15 habilidades, status Context7, configuração, cache e análises |
| GET | `/api/toolbox/superpowers/:id?resource=SKILL.md` | conteúdo integral e caminhos de referências |
| PUT | `/api/toolbox/settings` | configuração de habilidades e autorização Context7 por projeto |
| POST | `/api/toolbox/superpowers/analyze` | `project,skillId,objective,profile,consentCloud` |
| POST | `/api/toolbox/context7/resolve` | `query,libraryName,consent:true` |
| POST | `/api/toolbox/context7/docs` | `project,query,libraryId,language,consent:true` |
| POST | `/api/toolbox/context7/search` | `project,query,libraries,version,language,consent:true` |
| GET | `/api/toolbox/context7/cache/:id` | documento consultado em cache |

`POST /api/chat` aceita também `mode: engenheiro|cientista|arquiteto|seguranca`; retorna `workflows`, `warnings` e `contextLimited`. O perfil adicional é `avancado`. `POST /api/scaffold` aceita `systemType: web|pwa|saas`.
