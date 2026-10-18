# Validação da entrega v2

Validação realizada em 18/10/2026, em Linux com Node.js 24.19.0 e Chromium instalado no ambiente.

## Falha original reproduzida

O código original compilou e passou em seus 16 testes de backend, mas o Chromium exibiu `React is not defined`; o texto de `#root` permaneceu vazio. Isso confirmou a causa da tela escura no código fornecido, sem acesso ao computador do usuário.

## Verificações concluídas

| Verificação | Resultado |
| --- | --- |
| Instalação limpa `npm ci` | Passou, usando o lockfile entregue. |
| Testes de backend | 32 passaram: preservação dos módulos anteriores, planejamento, concorrência, hipóteses/evidências, segurança HTTP, auditoria e ferramentas. |
| API com servidor real e modelo simulado | Cinco cenários passaram: saúde/erros, chat/contexto, geração integral/aplicar/reverter, auditoria/revisão e geradores. |
| MCP Maven por stdio | Passou: inicialização, catálogo, leitura de habilidade, bloqueio de caminho externo e erro explícito sem chave Context7. |
| Build do SDK e painel | Passou com Vite 7.3.7; SDK Context7 compilado da fonte enviada. |
| Chromium desktop e viewport 375px | Passou: navegação, criação/atualização de plano, revisão com modelo simulado, auditoria, laboratório, chat, Superpowers, configurações e recarga; sem erros JavaScript e sem overflow horizontal no celular. |
| Templates web, PWA e SaaS | Os três compilaram. O teste de validação de tarefa do template web passou. |
| PWA em navegador | Shell abriu online e offline após instalação do worker; nenhum erro JavaScript, nenhum caminho `/api` no cache. |
| CLI oficial Context7 | `--help` respondeu com seus comandos. |
| MCP oficial Context7 | Inicialização e `tools/list` anunciaram `resolve-library-id` e `query-docs`. |
| AI SDK oficial | Adaptador importado; ferramentas e classe de agente disponíveis sem executar inferência. |
| Integridade das fontes enviadas | Todos os 238 arquivos Superpowers e 530 arquivos Context7 conferem com os ZIPs; hashes registrados em `third_party/SOURCES.json`. |
| `npm audit` | Zero vulnerabilidades reportadas para o lockfile na data da validação. |

Os relatórios do Node totalizam 32 entradas da suíte de backend e sete entradas da suíte de integração/MCP (incluindo o agrupador de cenários de API).

## O que estes resultados não demonstram

Os testes de inferência e HTTP Context7 usaram respostas simuladas. Não foram usados tokens reais do usuário nem cobrados serviços. Ollama real, modelo cloud, autenticação/cotas Context7, migrations Supabase, draft PR criado pelo aplicativo e deploy Vercel devem ser conferidos com as contas e permissões do usuário. O protocolo dos servidores MCP e o CLI oficiais foram verificados sem consulta externa de documentação.

Os arquivos `.bat` foram preparados para Windows, mas não executados em uma máquina Windows nesta sessão. O endereço `127.0.0.1` do computador do usuário não é acessível a partir deste ambiente. A correção foi validada sobre o projeto enviado.

A auditoria de padrões não é um pentest. A migration SaaS foi incluída e o template compilou, mas as policies ainda precisam ser testadas em um banco Supabase real. A base SaaS não inclui cobrança pronta nem integração completa de tenant na aplicação.

## Reproduzir

```bat
npm ci
npm run check
npx playwright install chromium
npm run test:browser
npm audit
```

Para usar Chromium já instalado, configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. As capturas desktop/mobile ficam em `artifacts/`, ignorado pelo Git. Testes usam projetos e armazenamento temporários e os removem ao finalizar.
