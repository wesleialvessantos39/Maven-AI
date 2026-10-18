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
