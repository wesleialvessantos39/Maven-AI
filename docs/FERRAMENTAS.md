# Superpowers e Context7 no Maven

## O que foi conectado

| Componente | Disponibilidade |
| --- | --- |
| Fonte integral dos dois ZIPs | `third_party/superpowers` e `third_party/context7`, incluindo referências, hooks, plugins, SDKs, docs e licenças. |
| Superpowers no Maven | As 15 habilidades são lidas da fonte original, expostas integralmente no painel e por MCP, selecionadas manual/automaticamente e usadas no chat ou em análise consultiva. |
| Context7 no Maven | Resolver biblioteca, consultar docs por ID, busca v3, filtros de versão/linguagem, cache, exportação e contexto automático opcional. |
| SDK Context7 | Compilado da fonte 0.5.1 enviada por `npm run build:tools`; pacote oficial também fixado em 0.5.1. |
| MCP oficial Context7 | Pacote 4.4.2 instalado pelo lockfile. `npm run context7:mcp`. |
| CLI oficial Context7 | Pacote `ctx7` 0.8.0, todos os comandos disponíveis por `npm run context7:official -- ...`. |
| Vercel AI SDK | Pacote oficial 1.0.3; `createContext7Tools` e `Context7Agent` exportados em `server/lib/context7-ai-sdk.mjs`. |
| Clientes externos | Plugins/adaptadores originais preservados para Codex, Claude Code, Cursor, OpenCode, Pi e os demais hosts suportados pelos projetos. A instalação nesses programas ocorre por seus respectivos mecanismos. |

Incluir uma metodologia de outro host não disponibiliza automaticamente seu shell, navegador, Git ou sistema de subagentes. O adaptador Maven declara essas capacidades ao modelo e mantém ações de escrita nas ferramentas existentes de proposta/aprovação. Não executa os hooks de terceiros ao iniciar o app.

## As 15 habilidades Superpowers

Todas têm conteúdo original completo e leitura de referências no painel, exportação, MCP e análise consultiva:

1. `brainstorming`: requisitos e alternativas.
2. `diagnosing-superpowers`: diagnóstico de comportamento do fluxo.
3. `dispatching-parallel-agents`: decomposição de tarefas independentes; execução paralela exige host com agentes.
4. `executing-plans`: execução orientada por plano.
5. `finishing-a-development-branch`: verificação e entrega de branch.
6. `receiving-code-review`: avaliação de comentários de revisão.
7. `requesting-code-review`: revisão contra requisitos e plano.
8. `subagent-driven-development`: método de desenvolvimento/revisão por especialistas; agentes exigem host compatível.
9. `systematic-debugging`: investigação de causa antes da correção.
10. `test-driven-development`: ciclo RED/GREEN/REFACTOR.
11. `using-git-worktrees`: isolamento de alterações; comandos Git são executados no host apropriado.
12. `using-superpowers`: descoberta e aplicação das habilidades.
13. `verification-before-completion`: exigir evidências antes de declarar sucesso.
14. `writing-plans`: tarefas, caminhos, verificações e critérios.
15. `writing-skills`: criação e validação de habilidades.

Seleção automática: bugs acionam depuração; arquitetura/novos requisitos acionam planejamento; pedidos de testes acionam TDD; revisão aciona code review. Verificação acompanha o fluxo. Habilidades fixadas são combinadas com as sugeridas. O perfil limita o texto enviado ao modelo e informa quando há redução; a leitura integral no painel não é truncada por esse orçamento.

## Configuração Context7

Defina `CONTEXT7_API_KEY` no `.env` e reinicie. O SDK e o serviço exigem uma credencial; não grave a chave em código público ou no frontend.

O painel disponibiliza `resolve-library-id`, `query-docs` e busca v3. A consulta por ID aceita `/organizacao/biblioteca` ou `/organizacao/biblioteca/versao`. O filtro de versão da busca v3 exige ao menos uma biblioteca. Consultas externas precisam de autorização na interface. A opção automática grava autorização por projeto, envia apenas a pergunta e filtros e anexa os resultados ao contexto. Se houver erro externo, o chat informa o problema e continua com o contexto disponível.

O backend fixo é `https://context7.com/api`, com timeout, limite de resposta e sem redirects. O navegador não recebe a chave. Consultas/documentos ficam em `data/contextseven-cache.json`; configurações em `data/tool-settings.json` e análises em `data/workflow-runs.json`, todos ignorados pelo Git.

## CLI integrado e CLI oficial

```bat
npm run context7 -- library react "Como usar useEffect com cleanup?"
npm run context7 -- docs /facebook/react "Como cancelar uma operação em useEffect?"
npm run context7 -- search "Supabase autenticação por JWT"

npm run context7:official -- --help
npm run context7:official -- library react "Como usar hooks?"
npm run context7:official -- docs /facebook/react "useEffect cleanup"
```

O CLI oficial também fornece `login`, `logout`, `whoami`, `setup`, `remove` e `upgrade`. Esses comandos podem abrir autenticação/configurar clientes locais; execute-os quando quiser configurar o respectivo host. O aplicativo não inicia login interativo automaticamente. O wrapper carrega `.env` e desativa a telemetria opcional do cliente.

## MCP integrado

O servidor Maven funciona por stdio, sem expor porta de rede:

```bat
node scripts/mcp-server.mjs
```

Ferramentas: `superpowers-list`, `superpowers-read`, `resolve-library-id`, `query-docs`, `search-docs`. Recursos: `superpowers:///<id>/SKILL.md`, com leitura das referências por caminho relativo validado. Não há execução de shell nesse servidor.

Exemplo de configuração de cliente MCP, ajustando o caminho real:

```json
{
  "mcpServers": {
    "maven-engineering": {
      "command": "node",
      "args": ["C:\\Maven-AI\\scripts\\mcp-server.mjs"]
    }
  }
}
```

Para o servidor **oficial Context7**, use `node scripts/upstream-context7.mjs mcp` no comando stdio ou `npm run context7:mcp`. Ele anuncia as ferramentas originais `resolve-library-id` e `query-docs`; outras opções estão em `npm run context7:mcp -- --help`. Seu funcionamento e sua política de autenticação são os do projeto original. Nenhum MCP é iniciado em background pelo painel.

## Adaptador AI SDK

```js
import { createContext7Tools, Context7Agent } from './server/lib/context7-ai-sdk.mjs';
const tools = createContext7Tools(); // resolveLibraryId e queryDocs
// Passe tools a generateText/streamText do Vercel AI SDK junto de um modelo configurado.
// Ou crie Context7Agent com um objeto de modelo compatível e sua configuração.
```

O modelo e sua credencial continuam sendo fornecidos pela aplicação consumidora. Esse export não executa inferência ao importar.

## Procedência e atualizações

Os repositórios originais permanecem sem alterações. Os pacotes oficiais estão fixados no lockfile. Atualize fontes, versões e testes em conjunto; não rode scripts de atualização remota como parte da inicialização. As licenças MIT e as atribuições estão preservadas.

O ZIP do Context7 não contém o backend, o crawler nem o índice privado do serviço. Credenciais e acesso a esse serviço continuam necessários; a cópia local de seu código público não substitui a plataforma externa.
