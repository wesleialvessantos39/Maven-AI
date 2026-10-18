# Minha IA Studio PRO v1 — Windows 8 GB, GPU integrada

**Projeto completo de código-fonte para sua própria IA assistente de desenvolvimento React + Vite.** O programa principal funciona como uma aplicação local: painel **React + Vite**, backend **Express/Node**, modelo **Ollama** ou **API externa opcional**, conhecimento de documentação e memória por projeto, ferramentas para **GitHub, Supabase e Vercel**. Inclui um gerador de projetos full-stack React + Vite responsivos. Esta versão evolui a v0.2 sem mudar a pilha.

**Aviso honesto:** o código-fonte foi gerado e os **15 testes automatizados de backend passaram**, incluindo validação de segurança básica, proposta e reversão local, scaffold e bloqueio SQL. Porém, `npm install` não terminou no ambiente que gerou este arquivo. **Não foi possível confirmar o build completo do React/Vite nem testar os tokens reais, Ollama, Windows ou um deploy.** Valide `npm run build` no notebook antes de depender do aplicativo. É uma base extensível funcional em seus módulos testados, não um agente autônomo de produção nem substituto de revisão profissional.

## Instalar e abrir — Windows

1. Instale **Node.js 24 LTS**: https://nodejs.org/; instale **Ollama**: https://ollama.com/download; Git para Windows opcional: https://git-scm.com/downloads/win.
2. Abra o *Prompt de Comando* e rode:
   ```bat
   ollama pull qwen2.5-coder:1.5b
   ```
3. Extraia o ZIP numa pasta como `C:\MinhaIAStudio\`.
4. Clique duas vezes em `iniciar-economico-windows.bat`. O script copia `.env.example` para `.env` se não existir, instala dependências na primeira execução, compila o painel e inicia o backend.
5. Abra **http://127.0.0.1:8787** e mantenha o terminal aberto.
6. Se desejar o modelo local 3B, execute `ollama pull qwen2.5-coder:3b`, reabra o painel e selecione Equilibrado. Com 8 GB e GPU integrada, comece pelo 1.5B.

**Problemas:** se aparecer 'node' ou 'ollama' desconhecido, reinstale ou reinicie o terminal; se `npm install` falhar, abra o terminal na pasta raiz, verifique internet, `node -v`, `npm -v` e rode `npm install --no-audit --no-fund`; se o painel estiver desatualizado, execute `atualizar-painel-windows.bat`. Nunca execute `.bat` recebido de fonte desconhecida sem examinar seu conteúdo.

## Recursos reais desta versão

| Área | Operação | Limites reais |
| --- | --- | --- |
| **Frontend** | Painel responsivo, navegação mobile, botões/ícones, temas CSS, área de chat e editor | A responsividade foi codificada; testes visuais em dispositivos reais pendentes |
| **IA local** | Qwen2.5-Coder 1.5B e 3B via Ollama; uma solicitação por vez | Modelo pequeno; não substitui agentes grandes, respostas podem falhar ou ser incompletas |
| **Nuvem opcional** | Provedor de API Responses da OpenAI, `store: false`, consentimento explícito | Requer chave de API e modelo configurado; pode cobrar à parte; não incluído no Plus |
| **Código local** | Ler arquivos protegendo segredos; gerar proposta JSON com IA; comparar antes/depois; editar manualmente; confirmar gravação; salvar backup; reverter | Muda **um arquivo já existente por proposta**; sem execução automática de testes no projeto alvo |
| **Projeto novo** | Gera template React + Vite com dashboard adaptável, login, backend autenticado, CRUD e migração RLS | Template inicial, não sistema empresarial completo |
| **GitHub** | Metadados de repositórios; branch nova e **draft pull request** de alteração já aplicada, se habilitado | Uma alteração/arquivo por PR; checagem do SHA remoto; não faz merge |
| **Supabase** | Lista projetos; prepara migrations SQL; aplicação remota com confirmação explícita | Bloqueia SQL de alto risco por palavras-chave; heurística não é garantia; CLI/migrações versionadas recomendadas |
| **Vercel** | Lista projetos/deploys e URLs; template preparado para Vite e funções `/api` | A geração do preview vem da ligação GitHub↔Vercel; não dispara deploy de produção |
| **Aprendizado** | 17 habilidades como regras de projeto; memória aprovada; consulta a fontes oficiais com cache e citações no contexto; refresh diário opcional | **Não treina pesos do modelo**; é recuperação de contexto (RAG simples), não aprendizado autônomo ilimitado |

## Criar projetos full-stack React + Vite

No painel vá a **Criar React + Vite** → nome do projeto → confirmação → Criar. O novo projeto aparece em `workspace/<nome>/`. O template inclui:

- `src/App.jsx`, `src/style.css`: responsivo a 320, 360, 650, 850 px e desktop; menu lateral no desktop, gaveta e navegação inferior no celular; ícones, estados de erro, vazio, carregamento, botões com alvos de toque.
- `api/tasks.js`: backend Node compatível com funções Vercel, autenticação JWT por `supabase.auth.getUser(token)`, acesso a dados com JWT do próprio usuário (RLS), CRUD GET/POST/PATCH/DELETE.
- `server/dev.mjs`: servidor de API para desenvolvimento local, porta 8790, proxy do Vite para `/api`.
- `supabase/migrations/20261018000000_create_tasks.sql`: tabela de tarefas + policies RLS por usuário, incluindo `USING` e `WITH CHECK`.
- `vercel.json`, `.github/workflows/ci.yml`: build Vite, output `dist`, API `/api` e testes em PR.
- `.env.example` separa a **chave publishable**, que pode estar no navegador quando acompanhada de RLS, de credenciais exclusivamente do servidor. Nunca coloque `service_role` no frontend.

**Antes de executar o template:** abra seu diretório em outra janela, rode `npm install`, preencha `.env` com suas chaves de projeto Supabase, aplique a migration **num banco de teste** com ferramenta apropriada, crie um usuário pelo Supabase Auth e rode `npm run dev`. Teste API, RLS e fluxo de autenticação.

**No Vercel:** conecte o repositório GitHub, configure a Root Directory se estiver em monorepo, Framework Vite, Build Command `npm run build`, Output Directory `dist`, e variáveis `VITE_SUPABASE_*` para frontend e `SUPABASE_*` para backend, por ambiente. Verifique preview antes de produção. Vercel não hospeda o aplicativo *Minha IA Studio* local sem um novo projeto de autenticação e segurança; o template é para seus sistemas gerados.

## Como conectar GitHub, Supabase e Vercel

Edite `C:\MinhaIAStudio\.env` com o editor de texto, **nunca envie esse arquivo para repositórios ou para o chat**. Reinicie a aplicação após editar:

```env
GITHUB_TOKEN=
SUPABASE_ACCESS_TOKEN=
VERCEL_TOKEN=
VERCEL_TEAM_ID=
```

- GitHub token: prefira token fine-grained restrito ao repositório, `Contents: read` para consultas; para criar draft PR, `Contents: write` e `Pull requests: write`.
- Supabase token: para listar projetos, privilégios de leitura; para aplicar migrations, privilégios especiais de database/migrations write. **Use projeto de teste** e mantenha cópias das migrations no Git.
- Vercel token: escopo mínimo para consultar projetos e deploys; configure Team ID se o projeto for de equipe.

### Ativar escrita remota (desligada por padrão)

```env
ALLOW_REMOTE_MUTATIONS=false
ENABLE_SUPABASE_WRITES=false
```

Mantenha `false` durante estudo e análise. Para criar PR, configure conscientemente `ALLOW_REMOTE_MUTATIONS=true` e digite `CRIAR PR` no painel. Para migration remota, além dessa liberação, configure `ENABLE_SUPABASE_WRITES=true` e digite `APLICAR MIGRACAO`; SQL obviamente destrutivo é bloqueado, **mas nenhum filtro por regex substitui revisão SQL**. O programa **não publica em produção sozinho**, não apaga tabelas em massa nem faz merge do PR.

### Fluxo sugerido para alteração

1. Selecione projeto e arquivo existente; faça pedido específico (preservar o restante).
2. Gere proposta com IA ou edite conteúdo integral manualmente.
3. Compare **Antes/Depois** e revise com atenção. Modelos 1.5B podem truncar código; use modelo remoto opcional se necessário.
4. Aprove aplicação local: arquivo é verificado por hash e recebe backup em `data/backups/`.
5. Execute no diretório do seu projeto os testes e o build apropriados (por enquanto essa execução não está automatizada neste agente).
6. Se o resultado estiver adequado, poderá criar uma branch e draft PR pelo GitHub. O programa confirma que o conteúdo remoto do arquivo era igual à base analisada antes de enviar.
7. Se a Vercel estiver ligada ao GitHub, ela normalmente gera um preview do PR; examine-o e suas variáveis por ambiente.
8. Só após seus testes, aprovação humana e backups adequados faça merge/publicação por suas ferramentas usuais. Use o botão **Reverter arquivo local** se precisar desfazer a aplicação local.

## Memória, internet e evolução

O painel **Conhecimento** tem:

- **Documentação oficial selecionada**: React, Vite, Supabase RLS/migrations, Vercel, GitHub, Ollama e MDN. Não permite inserir URL arbitrária, redirects ou executar scripts das páginas.
- **Cache local** em `data/docs.json` com data e endereço de origem; trechos relevantes são recuperados por correspondência de termos e anexados ao chat como dados **não confiáveis**, não como instruções.
- **Memória por projeto** em `data/feedback.json`: preferências, decisões e correções que você digitar/aprovar; não compartilha automaticamente entre projetos (regras de `geral` são compartilhadas).
- **17 habilidades próprias** de engenharia frontend, acessibilidade, backend, Supabase Auth/RLS/migrations, GitHub, Vercel, segurança, testes, performance, observabilidade, documentação, pesquisa e evolução. As habilidades do ChatGPT/Plugins externos **não são copiadas nem vinculadas automaticamente** a este app.

Se quiser uma consulta **diária, limitada**, configure `AUTO_REFRESH_DOCS=true`: o app atualiza **uma** fonte oficial a cada 24 h **enquanto estiver aberto**. Não é treinamento de pesos. Isso pode consumir internet, não créditos de IA local. Desative se estiver com internet limitada. O app não fica rodando em background quando fechado.

Para aprimorar de verdade: registre exemplos de problemas e soluções verificadas, meça taxa de sucesso, adicione testes e avaliações automatizadas, crie novos conectores com menor privilégio, use modelo remoto quando a tarefa exigir e considere *fine-tuning* apenas depois de acumular dados próprios limpos e autorizados. Veja `docs/EXTENSOES.md`.

## Nuvem opcional (modelo mais avançado)

Seu notebook 8 GB pode ficar limitado em tarefas grandes. Para usar um modelo em nuvem, configure no `.env`:

```env
OPENAI_API_KEY=
OPENAI_MODEL=
```

O nome do modelo deve ser um **identificador disponível na sua conta de API**, não o nome do modelo exibido no ChatGPT. Selecione **Nuvem opcional** no painel e marque o consentimento específico **antes de cada troca de perfil**. A aplicação envia mensagens/arquivos escolhidos ao provedor e solicita `store: false`. A assinatura **ChatGPT Plus não paga créditos de API**; confira custos, retenção e configuração da sua conta. Nunca use segredos de bancos ou dados pessoais sensíveis em prompts sem necessidade e autorização.

## Arquitetura da IA

```text
Notebook Windows (somente 127.0.0.1)
├─ React + Vite UI compilado   [client/]
├─ Express API local           [server/]
│  ├─ workspace protegido      [workspace/]
│  ├─ propostas + backups      [data/]
│  ├─ catálogo 17 skills       [server/lib/skills.mjs]
│  ├─ conhecimento oficial     [server/lib/knowledge.mjs]
│  ├─ migrações/PRs            [server/lib/*]
│  ├─ Ollama local             [127.0.0.1:11434]
│  └─ modelo remoto opcional   [API privada, apenas com consentimento]
└─ Ferramentas externas por tokens server-only
   ├─ GitHub REST
   ├─ Supabase Management REST
   └─ Vercel REST

workspace/<novo-projeto>/    (React + Vite gerado)
├─ src/                 frontend mobile-first
├─ api/                 funções backend Node
├─ server/              API local de desenvolvimento
├─ supabase/migrations/ migração versionada RLS
└─ vercel.json          configuração de publicação
```

## Segurança essencial

- O backend vincula somente `127.0.0.1`; não exponha por túnel, port-forward, domínio ou Vercel. Ele **não tem autenticação de login própria**, pois foi projetado para notebook pessoal.
- Bloqueia navegação `../`, arquivos `.env`, links simbólicos fora de área, extensões indevidas e muitos diretórios gerados. Isso não torna o executor um sandbox de sistema; não execute código não confiável no mesmo computador sem isolamento.
- Conteúdo recuperado da internet e de repositórios pode conter prompt injection. Apenas texto selecionado entra como contexto; propostas geradas exigem revisão.
- Alterações locais trabalham em um arquivo preexistente por vez, com verificação de hash e backup, sem rodar comandos arbitrários. Migrations remotas e PR precisam de opt-in.
- Dados locais `data/*.json` podem conter texto de código e memória do projeto; mantenha-os privados e faça backup criptografado se forem sensíveis. Não sincronize `data/` inadvertidamente.
- **RLS e autenticação no Supabase precisam ser testadas**. `grant` de tabela e policy são camadas distintas. Não use `service_role` no navegador.
- Os testes entregues são automáticos para backend e scaffolding, mas não são pentest, E2E, teste visual mobile, nem garantia de segurança/qualidade em produção.

## Validar no Windows

Abra um Prompt de Comando na raiz:

```bat
node -v
npm -v
npm install --no-audit --no-fund
npm test
npm run build
npm start
```

Depois abra `http://127.0.0.1:8787`, confira a RAM, chat, crie um projeto de teste, execute uma proposta de mudança simples e reverta, conecte tokens de leitura e cheque o preview Vercel. Os scripts npm são executados uma etapa por vez, para evitar consumo paralelo de memória. Depois de `npm install`, mantenha o `package-lock.json` no controle de versão em desenvolvimento.

## O que ainda não está pronto

- Agente autônomo com várias ferramentas encadeadas e validação contínua de tudo o que alterar.
- Refatoração de múltiplos arquivos em uma única transação, inspeção profunda de um monorepo inteiro e PR multi-arquivo.
- Execução em sandbox, testes end-to-end e preview de telas com Playwright; nenhuma garantia de responsividade sem validação visual.
- Migrações complexas automáticas, comparação de schemas e rollback remoto seguro no Supabase.
- Publicação de produção na Vercel; sem configuração automática de domínio e variáveis remotas.
- Auto-treino de pesos, fine-tuning online, busca irrestrita na web ou execução de plugins do ChatGPT sem adaptador externo.

Essas melhorias estão especificadas no documento `docs/ROADMAP.md`; o repositório foi estruturado para recebê-las sem trocar React + Vite.

## Documentação técnica adicional

- `docs/ARQUITETURA.md` — separação de responsabilidades e fluxo.
- `docs/EXTENSOES.md` — conectores, MCP, aprendizado com feedback, pesquisa externa e qualidade.
- `docs/ROADMAP.md` — evolução por etapas sem danificar código existente.
- `docs/API.md` — endpoints reais e permissões.

### Referências oficiais

- Vite: https://vite.dev/guide/
- Ollama: https://docs.ollama.com/api/chat
- GitHub REST: https://docs.github.com/en/rest/pulls/pulls
- Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase Management API: https://supabase.com/docs/reference/api/v1-apply-a-migration
- Vercel deployments: https://vercel.com/docs/deployments
- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses
