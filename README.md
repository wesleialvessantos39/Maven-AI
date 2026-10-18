# Maven AI Studio v2

Assistente local de engenharia e ciência de software para sistemas web, aplicativos web, APIs e SaaS. Evolui o Minha IA Studio PRO v1 enviado, mantendo React + Vite, Express, Ollama, nuvem opcional, propostas com backup/reversão e integrações com GitHub, Supabase e Vercel.

**[Baixar pacote Windows com painel compilado](https://github.com/wesleialvessantos39/Maven-AI/raw/refs/heads/main/downloads/Maven-AI-Studio-v2-Windows.zip)** · [Ferramentas integradas](docs/FERRAMENTAS.md) · [Validação e limites](docs/VALIDACAO.md)

## Abrir no Windows

1. Instale **Node.js 24 LTS**. O mínimo é 22.13 por compatibilidade com o CLI Context7.
2. Baixe e extraia o ZIP em uma pasta nova, por exemplo `C:\Maven-AI\`.
3. Execute **`iniciar-windows.bat`**. Ele cria `.env` sem sobrescrever um existente, instala as versões do lockfile e inicia a aplicação. É necessário acesso à internet para a primeira instalação.
4. Aguarde o terminal informar que iniciou e abra **http://127.0.0.1:8787**. Mantenha o terminal aberto.

O painel, planejamento, laboratório, auditoria e biblioteca de habilidades abrem sem Ollama. Para conversar ou gerar análises, configure um modelo local ou a API em nuvem.

Instalação pelo terminal:

```bat
npm ci
npm start
```

Para migrar da v1, mantenha uma cópia da pasta anterior e transfira seus diretórios privados `workspace/`, `data/` e seu `.env` para a nova instalação. Acrescente ao `.env` as novas opções de `.env.example`. Não publique esses dados no GitHub. Feche o terminal da versão anterior antes de iniciar outra instância na porta 8787.

## Correção da tela escura

A falha do ZIP original foi reproduzida no Chromium: **`React is not defined`**, com `#root` vazio. O build antigo passava, mas gerava JSX que dependia de `React` no escopo de componentes que não o importavam.

A v2 configura o runtime JSX automático no painel e nos templates, inclui recuperação de erros de renderização/carregamento, informa quando falta o build e recompila o painel ao detectar alteração no código/dependências. Assets ausentes retornam 404, evitando entregar HTML no lugar de JavaScript.

Se estiver usando uma cópia antiga, feche seu terminal, extraia a v2 em outra pasta, execute `iniciar-windows.bat` e pressione **Ctrl+F5** no navegador. Para diagnóstico, execute `diagnosticar-windows.bat` ou `npm run doctor`. `atualizar-painel-windows.bat` força reinstalação e build.

## Recursos

| Área | Implementação |
| --- | --- |
| Planejamento | Planos por projeto, tipos web/PWA/SaaS/API, stack detectada, critérios de aceitação, prioridades, dependências, evidências, bloqueios, controle de revisão entre abas e exportação JSON. Revisão opcional com IA. |
| Ciência de software | Caderno de hipóteses, experimento, esperado, observado, conclusão e incerteza; impede concluir sem observações. |
| Assistente | Modos engenheiro, cientista, arquiteto e segurança; contexto do plano, auditoria, investigação, habilidades e documentação; exportação da conversa. |
| Superpowers | **15 habilidades originais completas**, leitura das referências, seleção automática ou manual por projeto, análises consultivas com modelo, histórico e recursos/ferramentas MCP. |
| Context7 | SDK oficial da fonte enviada, resolução de bibliotecas, documentação por ID, busca v3 com versão/linguagem, cache por projeto, consulta automática opcional, CLI e MCP oficiais, adaptador Vercel AI SDK. |
| Segurança local | Host/Origin e Fetch Metadata, sessão HttpOnly/SameSite, token CSRF, CSP, limite de requisições/payload, IDs de operação e trilha com hashes sem corpos ou tokens. |
| Auditoria de código | Padrões estáticos com severidade, arquivo, linha e recomendação; relatórios exportáveis sem reproduzir possíveis credenciais. |
| Código | Leitura de arquivos permitidos, proposta manual ou gerada, comparação, aprovação, hash de concorrência, backup e reversão. Escritas do mesmo arquivo são serializadas. |
| Geradores | Web React + Vite; PWA com manifesto, ícones e service worker; fundação SaaS com esquema de empresas/membros e RLS. |
| Integrações preservadas | GitHub: metadados e draft PR; Supabase: consultas e migrations controladas; Vercel: projetos/deploys; documentação oficial e memórias aprovadas. |

O workspace reconhece também arquivos Python, Go, Rust, Java, C#, PHP, Ruby, Kotlin, Swift, Vue e Svelte. O assistente se adapta à stack encontrada; os geradores continuam usando React + Vite.

## Modelos de IA

| Perfil | Padrão | Uso |
| --- | --- | --- |
| Econômico | `qwen2.5-coder:1.5b` | Notebook de 8 GB; contexto pequeno e respostas curtas. |
| Equilibrado | `qwen2.5-coder:3b` | Maior qualidade, com mais consumo de memória. |
| Avançado local | `qwen2.5-coder:7b` | Contexto maior; recomenda-se pelo menos 16 GB de RAM. |
| Nuvem | Modelo definido por você | Para tarefas extensas; exige API, saldo e consentimento no painel. |

Para o perfil econômico:

```bat
ollama pull qwen2.5-coder:1.5b
```

Configure em `.env` os modelos opcionais ou `OPENAI_API_KEY` e `OPENAI_MODEL`. A assinatura ChatGPT não inclui créditos da API. Chaves ficam no servidor, nunca em `VITE_*`. O modelo é descarregado após as inferências locais; somente uma inferência ocorre por vez. O aplicativo avisa quando reduz referências/histórico para caber no perfil; a tokenização real varia por modelo. Ferramentas e prompts não eliminam as limitações do modelo escolhido.

## Ativar Context7

Gere sua chave em https://context7.com/dashboard e coloque no `.env`:

```env
CONTEXT7_API_KEY=
```

Reinicie o servidor. Na página **Superpowers e Context7**, digite uma consulta, autorize seu envio, busque a biblioteca e consulte a documentação. Para automatizar no chat, configure um ID de biblioteca, marque consulta automática e salve a configuração do projeto. Somente a pergunta e os filtros vão ao Context7; os arquivos anexados não são enviados a esse serviço. Perguntas com padrões conhecidos de credenciais são bloqueadas.

O backend, índice e crawler do Context7 são serviços externos privados e não estão nos ZIPs originais. A integração depende da rede, chave, permissões e cotas do serviço. O cache local continua disponível. Consulte [docs/FERRAMENTAS.md](docs/FERRAMENTAS.md) para CLI, MCP, AI SDK e a matriz completa das habilidades.

## Projetos gerados

Em **Criar projeto**, escolha web, PWA ou SaaS. Uma nova pasta é criada em `workspace/<nome>` sem sobrescrever projetos. Em outro terminal, entre nela, execute `npm install`, configure seu `.env` e siga o README gerado.

- **Web:** login Supabase, CRUD de tarefas autenticado, backend Node, migration RLS, CI e configuração Vercel.
- **PWA:** adiciona manifesto, ícones PNG e service worker de produção. O shell abre offline após visita online; operações do banco precisam de rede. Não há fila de escrita offline nem cache de APIs autenticadas.
- **SaaS:** mantém o CRUD por usuário e acrescenta esquema de empresas/membros com RLS e documentação de evolução. Integração de tenant nas entidades/API/interface, cotas e cobrança real ainda devem ser implementadas para cada negócio.

O painel Maven permanece uma ferramenta local pessoal. Os sistemas gerados são projetos separados, que precisam de configuração e validação próprias antes da publicação.

## Conexões e alterações externas

Mantenha seus tokens apenas no `.env`: `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`. Para liberar PR ou migration use as flags existentes `ALLOW_REMOTE_MUTATIONS` e `ENABLE_SUPABASE_WRITES`, além da confirmação específica na interface. Não há merge ou deploy de produção automático.

## Testar

```bat
npm ci
npm run check
npx playwright install chromium
npm run test:browser
npm audit
```

Se houver Chromium já instalado, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE` com seu caminho. Os testes usam armazenamento temporário e modelo simulado; não alteram seus projetos nem chamam APIs pagas. [Validação registrada](docs/VALIDACAO.md).

## Limites e segurança

- Uso pessoal, vinculado somente a `127.0.0.1`. Sessão/CSRF não são um login multiusuário. Hospedagem pública exige autenticação, HTTPS e isolamento próprios.
- Planos concluídos registram evidências declaradas; não provam execução de comandos. Análises Superpowers orientam o modelo e não executam hooks, shell ou subagentes automaticamente. Os adaptadores para outros hosts estão preservados nos repositórios originais.
- Propostas alteram um arquivo existente por vez. Não há execução arbitrária de comandos ou transação multi-arquivo no agente local.
- Auditoria usa padrões e pode produzir falsos positivos/negativos. Não consulta CVEs e não substitui teste de autorização, RLS ou avaliação especializada. `npm audit` é uma verificação separada das dependências instaladas.
- A trilha usa hashes para detectar inconsistências; quem controla o computador pode reescrever seus arquivos. Dados locais não são criptografados pelo aplicativo.
- Contexto recuperado de documentos e habilidades é tratado como referência externa. Não há treinamento automático de pesos.

## Fontes e licenças

As cópias completas enviadas estão em [`third_party/superpowers`](third_party/superpowers) (7.0.0, MIT, Jesse Vincent) e [`third_party/context7`](third_party/context7) (MIT, Upstash). Veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Os originais estão preservados; os adaptadores Maven ficam em `server/lib/`, `client/src/` e `scripts/`.
