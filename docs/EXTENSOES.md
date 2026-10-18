# Conectores e expansão de inteligência

## Integrações implementadas agora

- GitHub REST: lista repositórios, consulta informações e cria PR draft de uma proposta aprovada e aplicada localmente.
- Supabase Management API: lista projetos e aplica migrations com condições explícitas.
- Vercel REST: lista projetos e deploys. O deploy preview pode ocorrer por integração GitHub/Vercel; não é disparado pelo programa.
- Ollama: inferência local. OpenAI Responses API: alternativa externa opcional com chave própria, modelo próprio e consentimento.
- Documentação: fontes oficiais permitidas; cache local em JSON.

## Integrações que podem ser construídas em novos adaptadores

| Serviço/ambiente | Possível capacidade | Cuidados |
| --- | --- | --- |
| **VS Code** | extensão local para selecionar arquivo, mostrar diffs e iniciar testes | permissões limitadas à pasta selecionada |
| **MCP** | protocolo para conectar ferramentas aprovadas (GitHub, Supabase etc.) | validar servidores, OAuth, entradas, escopos, bloquear ações não autorizadas |
| **Context7/documentação** | recuperar docs por versão de biblioteca | indexar e citar versão; evitar alucinações de API |
| **Firecrawl/pesquisa** | pesquisar docs e páginas técnicas | domínios permitidos, limite de custo, sem aplicar instruções de páginas |
| **Figma** | ler especificações, tokens, componentes para React | não confundir imagem com código acessível testado |
| **Playwright** | testes E2E mobile de 320/375/430/768/1024/1440 px | executar projeto em ambiente isolado e não acessar produção |
| **GitHub Actions** | validar `npm ci`, testes, build e prévia após PR | branch protection, permissões read-only para workflows comuns |
| **Sentry/PostHog** | observar falhas e performance, medir regressões | consentimento, retenção e exclusão de dados sensíveis |
| **Supabase CLI** | migrações versionadas e schema diff em banco de teste | `db pull`/migrations e RLS com auditoria; nunca autoexecutar SQL perigoso |
| **Observabilidade** | medir custo/tokens, duração, memória, erros | logs sem tokens/credenciais |

Esses serviços são **caminhos de evolução**, não plugins instalados dentro da IA. As habilidades/plugins conectados ao ChatGPT não se transferem por copiar arquivos: exigem adaptadores, autenticação e autorizações próprias.

## Sistema de habilidades

1. Registre uma habilidade no catálogo `server/lib/skills.mjs` com nome, descrição e política de segurança.
2. Acrescente instruções de contexto e exemplos *revisados*, sem alterar as regras obrigatórias de segurança ou a arquitetura React + Vite.
3. Teste cada habilidade com tarefas reais e critérios verificáveis: compilação, regressão, acessibilidade, RLS, responsividade.
4. Atualize a biblioteca após testar; adicione uma memória específica quando uma correção for confirmada.

### Proposta futura para plugins externos

`adapters/<name>/manifest.json` com `name,version,permissions,actions,readonly,source`, schema tipado dos argumentos; instalar apenas após análise e assinatura/verificação. Toda ação `write` deve gerar plano, preview, escopo e confirmação no backend. **Não** instalar extensões arbitrárias como comandos shell gerados pela IA.

## Aprendizado contínuo — diferença importante

- **Recuperação aumentada (já implementada de forma simples):** indexar trechos de documentação oficial local, recuperar por palavras e acrescentar ao chat, preservando URL e data.
- **Memória aprovada (já implementada):** correções, decisões e preferências inseridas pelo usuário e selecionadas por projeto.
- **Avaliação (próxima fase):** conjunto de problemas representativos com respostas esperadas e testes executáveis.
- **Fine-tuning (futuro opcional):** não acontece automaticamente. Exige dataset autorizado, filtrado, métricas e infraestrutura de treinamento fora deste notebook de 8GB.
- **Automação (implementada em escopo limitado):** `AUTO_REFRESH_DOCS=true` sincroniza uma fonte a cada 24h enquanto o processo estiver aberto. Esse recurso não toma decisões sozinho e não substitui revisão.

## Política de baixo custo no notebook 8 GB

Modelo Qwen 1.5B para triagem/questões pequenas, até 2 arquivos truncados; 3B apenas quando houver RAM; modelos em nuvem apenas quando explicitamente autorizados; sem inferências paralelas; respostas curtas; cache de documentação; sem banco vetorial pesado, Docker e browser de testes abertos juntos durante inferência.
