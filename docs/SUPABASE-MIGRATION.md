# Transição Neon → Supabase

## Seis estabelecimentos cadastrados em produção — 30/10/2026

Pedido explícito do usuário: criar um de cada tipo. Sessão administrativa real confirmada no super-admin publicado. Cadastrados pelo formulário autorizado da aplicação: Brasa Burger (burger, /store/brasa-burger, #d5f36b); Cia da Pizza (pizza, /store/cia-da-pizza, #f97316); Açaí da Casa (acai, /store/acai-da-casa, #8b5cf6); Gelato da Casa (icecream, /store/gelato-da-casa, #38bdf8); Sabor da Hora (snacks, /store/sabor-da-hora, #f59e0b); Pastel e Prosa (pastel, /store/pastel-e-prosa, #ef4444). Todos no plano de referência Essencial, com contatos fictícios example.com. Sem criar/invitar usuários, enviar e-mail, cadastrar produtos/pedidos ou abrir atendimento. Cardápios e configurações operacionais ainda precisam ser preenchidos. Nenhum dado antigo removido; bancos anteriores preservados.

Recarga da página confirmou seis registros, os seis tipos e seis cores distintas persistidas. Captura: .quality/establishments-six-2026-10-30.png. O preenchimento Playwright do input color alterava apenas a apresentação; corrigido pelo controle nativo, e as seis identidades foram confirmadas após nova recarga. Sem alteração de código, novo deploy ou commit; gate anterior permanece o registrado (333 testes/181 critérios na raiz). Raia única, agente principal. Este estado supera a pendência anterior de criação do primeiro administrador.

## Supabase ativo, início vazio autorizado — 30/10/2026

O usuário confirmou: **"Sim, começar vazio e autorizar o login técnico"**. Isso substitui a decisão anterior de aguardar a cópia. O novo projeto `pedss-producao` está ativo em produção, com zero lojas e usuários no momento da inicialização, sem copiar ou apagar dados do Neon. O projeto Supabase antigo também foi preservado.

Login `pedss_api` aplicado após autorização específica, com permissões limitadas, RLS e sem privilégios administrativos. Conexão TLS validada com a CA pública oficial Supabase Root2021, obtida do endereço utilizado pelo código oficial do Studio; fingerprint SHA-256 `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`. Nenhum `rejectUnauthorized=false` foi utilizado. Advisors após provisionamento: **No issues found**.

Deployment `dpl_5z8bQTb6vocB9RYBLccbnx6WSZr5` (READY), região `gru1`, promovido para `https://pedss.vercel.app` após validação protegida. Fonte isolada `.quality/supabase-release-source-eQFVba`: base publicada `c6d8157`, com ajustes de PostgreSQL/TLS, projeções de leitura, escopo de rotas e coordenação de atualizações. Não é o snapshot completo da branch GitHub2123957: os módulos locais de pizzaria ainda não expostos pela API não foram publicados por esta troca de banco. Visual, heroes e cards da versão publicada foram preservados. Nenhum commit novo.

As cinco variáveis privadas DATABASE_URL, DATABASE_URL_UNPOOLED, DATABASE_SSL_CA, PEDSS_SETUP_TOKEN e PEDSS_QUOTE_SECRET foram configuradas como Secrets **somente em produção**. Escopos anteriores preview/development preservados; `.env.local` original não foi lido, copiado ou alterado por esta conclusão. Esses ambientes antigos continuam independentes e não devem ser confundidos com a produção nova. Não se removeu a integração Neon nem seu recurso de banco.

Banco inicializado com `seedWorkspace({demo:false})`, schema validado, sem loja de demonstração e sem credenciais de usuário pré-definidas. Endpoint público respondeu200, identity=null, companies=[] e setupAvailable=true. Leitura real via `pedss_api` confirmou ausência de superuser/createdb/createrole/bypassrls. SSE protegido confirmou connected, revisão0 e heartbeats; a captura encerrou intencionalmente após4s (curl28 esperado). Não foram criados pedidos, estoque ou movimentos financeiros de QA. Escrita/cópia técnica proposta anteriormente foi recusada pela revisão automática; validação foi substituída por SELECT e GET normais, sem contornar a recusa.

Gate da pasta principal:333 testes/46 arquivos e181 critérios. Gate da fonte isolada publicada:216 testes/28 arquivos e104 critérios, lint/tipos/camadas/API/build aprovados. Houve erro inicial de seleção de testes ao levar teste de pizza sem sua fixture para a versão antiga; restaurada a suíte correspondente à base publicada. Uma espera de UI trial falhou sob carga e passou isoladamente e no gate integral seguinte, sem elevar timeout. Logs em `.quality/supabase-fresh-start-gate-2026-10-30.log` e `.quality/supabase-release-source-eQFVba/.quality/supabase-release-gate.log`. Busca de erros do deployment novo (15m): zero registros. Sem contratação de monitoramento/drains.

Primeiro acesso administrativo aberto na aba6 do navegador, `/configurar-acesso`, com o código privado já preenchido e mascarado. Usuário deve escolher nome/e-mail/senha e enviar; agente não definiu a senha nem submeteu a criação de usuário. Até confirmação do cadastro, não declarar administrador criado nem sessão autenticada validada. Código e instruções adicionais somente em arquivos ignorados `.quality/pedss-supabase-first-access*`; nunca no Git/deploy. Captura sem segredo visível `.quality/supabase-production-first-access-2026-10-30.png`.

Deployment anterior `dpl_12nxKfE8uSQvBMvj8EfLX4gm4Zdp` preservado. Ele conserva sua conexão anterior com o Neon, ainda sujeito à cota; rollback de código para ele não garante disponibilidade nem copia os novos dados do Supabase. Dados novos pertencem ao destino e eventual recuperação dos antigos exige mesclagem específica. As seções abaixo registram a preparação e decisões anteriores, superadas por esta autorização.

## Situação em 30/10/2026

O usuário solicitou um projeto novo, confirmou a organização PRO e autorizou aproximadamente US$10/mês de compute Micro adicional. Projeto criado pelo usuário e confirmado pelo CLI: `pedss-producao`, ref `ncohdxclvgoeqyutfubw`, São Paulo (`sa-east-1`), organização `aizmyihmnqxviinxncng` (`diegomicaelvs@gmail.com's Org`). O projeto antigo `pedss` (`ftwpmyaodxamtjfntamq`, criado em 15/10) é outra implementação: possui tabelas no schema public e foi apenas inspecionado, sem alterações.

O novo destino tem somente a estrutura privada `pedss.workspace`, `pedss.schema_migrations` e `pedss.rate_limits`, ainda sem dados de negócio. A migração gerada pelo CLI em `supabase/migrations/20261030135339_harden_pedss_schema.sql` foi aplicada ao destino via `supabase db query --linked --file ...`. RLS ativo nas três tabelas; PUBLIC/anon/authenticated/service_role sem acesso ao schema. A função pública criada pelo opt-in de RLS automático perdeu EXECUTE para PUBLIC/anon/authenticated, preservando seu uso como event trigger. Advisors de segurança: **No issues found** após o ajuste.

O conector Supabase está limitado à organização TEstes e recusou acesso à organização PRO. O CLI 2.109.0 já autenticado tem acesso à organização correta e está vinculado exclusivamente ao projeto novo em `supabase/.temp/project-ref`; esse cache é ignorado pelo Git e pelo deploy. Nenhum token de autenticação foi copiado ou impresso.

## Bloqueios e decisão dos dados

Consulta mínima de leitura na origem Neon retornou PostgreSQL `53000`, identificado como limite/cota excedida. Não foi possível exportar dados. Nenhum backup completo de produção foi obtido nesta tarefa. O usuário escolheu **preservar os dados e aguardar a cópia**; em seguida perguntou sobre começar vazio, o que ainda não constitui autorização para reiniciar o ambiente. Neon, variáveis ativas de `.env.local`, Vercel, produção e seus dados permanecem intactos.

A credencial de aplicação proposta é `pedss_api`: login sem superuser, criação de banco/roles, replicação ou bypass de RLS; acesso somente ao schema privado, SELECT/UPDATE do workspace e SELECT/INSERT/UPDATE dos limitadores. A criação desse login foi **rejeitada pela revisão automática**, por exigir autorização específica para acesso persistente. Não houve execução dessa operação. A autorização está pendente; a resposta mais recente foi uma pergunta sobre começar do zero, não uma aprovação do login.

O arquivo ignorado `.env.supabase.local` contém uma configuração **preparada, ainda não válida**: sua senha gerada não foi aplicada no banco. Não substituir `.env.local` ou variáveis Vercel por esse arquivo antes de confirmar criação do login, importar os dados e validar a API. SQL privado de provisionamento e resultado ficam somente em `.quality/`, nunca no Git/deploy.

## Aplicação e conexões

O backend mantém `pg`, contratos, autenticação própria e cookies existentes; não depende de Neon Auth nem requer Supabase Auth ou SDK no navegador. A troca de PostgreSQL não cria ou migra contas do Supabase Auth. Contas, hashes, sessões, IDs, histórico e valores em centavos continuam no workspace da aplicação.

`server/postgres-connection.mjs` fornece TLS com validação de certificado e hostname, inclusive com CA própria via `DATABASE_SSL_CA` (PEM, quebras reais ou `\n` escapado). Parâmetros SSL da URL não podem desativar a validação explícita. Não usar `rejectUnauthorized=false`. `DATABASE_URL` usa Transaction pooler na porta6543, com um cliente por instância de função e `attachDatabasePool`; consultas `pg` não usam prepared statements nomeadas nem sessão fora de transações. Manutenção usa conexão direta ou Session pooler na porta5432. Copiar o host oficial, não deduzir o índice do pooler pela região.

`DATABASE_URL_UNPOOLED` para importar/migrar precisa ser de um operador de manutenção com permissão de inserção/DDL, não do login limitado da API. O CLI autenticado pode fazer manutenção pelo Management API sem redefinir a senha do projeto. Não transformar a credencial limitada em administrador para contornar isso.

O modo local continua isolado por padrão; `PEDSS_ALLOW_REMOTE_DATABASE=false`. Vite carrega a CA apenas no backend quando há opt-in para modo remoto. O mecanismo existente de atualização dos pedidos e as projeções por tela permanecem, sem acrescentar polling ou transferências do workspace inteiro.

## Transferência preservadora

`npm run db:transfer -- export .quality/backups/arquivo.json` usa `DATABASE_URL_UNPOOLED` da origem em transação REPEATABLE READ READ ONLY. Exporta as três tabelas conhecidas e recusa tabelas adicionais/ausentes; preserva JSON bruto e campos legados desconhecidos, sem transformar o cadastro. Guarda checksums SHA-256 e timestamps na precisão do PostgreSQL. Não sobrescreve arquivo de backup existente. O backup contém dados privados e hashes: nunca enviar ao GitHub ou ao deploy.

No destino, preparar o schema acima **sem executar o seed**. `npm run db:migrate` insere demonstração quando não há workspace e, portanto, não é a preparação correta antes de uma importação preservadora. Para importar com um arquivo de ambiente privado de manutenção:

```powershell
node --env-file=.env.supabase-maintenance.local scripts/db-transfer.mjs import .quality/backups/arquivo.json --apply
node --env-file=.env.supabase-maintenance.local scripts/db-transfer.mjs verify .quality/backups/arquivo.json
```

O arquivo privado deve ter `SUPABASE_PROJECT_REF`, `DATABASE_URL_UNPOOLED` de manutenção e a CA quando necessária. Não passar credenciais como argumentos de shell. A CLI recusa host/projeto divergente, pooler de transação na manutenção e arquivos fora de `.quality/backups/`. Importação exige destino vazio, trava as três tabelas e confere o checksum antes do COMMIT; erro desfaz tudo. Verificação posterior é somente leitura. A CLI não muda `.env.local` ou Vercel.

Antes da cópia final, impedir novas escritas na origem durante o intervalo exportação → troca de tráfego; um snapshot anterior não inclui vendas recebidas depois dele. Confirmar registros/IDs, hashes e API autenticada, pedidos e atualização automática. Promover somente depois disso, preservando configuração anterior para rollback. Não ativar o novo banco vazio como se contivesse o histórico.

Se o usuário autorizar começar vazio, documentar explicitamente que será necessário novo administrador e recadastro de lojas/cardápios; logins e links de pedidos antigos não passam a existir no destino. Dados no Neon não são apagados. Uma cópia posterior para um destino já utilizado exige mesclagem específica, não sobrescrita do workspace novo.

## Validação

Sete testes em PostgreSQL/WASM cobrem cópia exata, preservação da origem, destino ocupado, integridade adulterada, rollback completo, tabelas não mapeadas/divergência, TLS e RLS/acesso negado a anon/authenticated/service_role. Nenhum pedido, estoque ou movimento financeiro real foi criado no Supabase. A API real conectada ao destino e a troca de produção ainda dependem dos dados e da credencial autorizada.

Referências: [Conexões PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [Migração do Neon](https://supabase.com/kb/guides/migrate-from-neon), [TLS](https://supabase.com/docs/guides/platform/ssl-enforcement).
