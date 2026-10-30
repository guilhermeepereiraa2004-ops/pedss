# Pedss — Neon e Vercel

## Repositório principal transferido — 30/10/2026

Por solicitação explícita, o destino oficial agora é https://github.com/guilhermeepereiraa2004-ops/pedss.git, branch main. O destino estava vazio. Git foi inicializado nesta pasta, origin e upstream main definidos para o novo repositório, e o Git Credential Manager já autenticado do computador realizou o envio. O conector GitHub tinha somente leitura; não foi necessário alterar permissões ou obter senhas/chaves. O repositório DiegoMicaelvs/pedss permanece preservado e não deve receber novos envios deste projeto.

Primeiro commit ed95d01c297480b7fb4f869501161bf82f11adf1, árvore cf628cd6c061ffafcfd8824819d952ee23ff7d1d:384 arquivos/116.033.805 bytes, incluindo o código integral, módulos/preços/montador/combos de pizzaria, imagens, testes, documentação e migrações. Arquivos remotos conferidos por hash com o snapshot local, sem diferenças. Apenas .env.example foi incluído; env reais, credenciais, .vercel, plan/log/.quality, outputs e ferramentas locais ficaram ignorados. README e AGENTS apontam para o novo destino.

Gate npm run check aprovado novamente:340 testes/48 arquivos e188/188 critérios, lint/tipos/camadas/build. Log .quality/new-origin-gate-2026-10-30.log. GitHub Quality inicial41122293452 iniciado; estado final será registrado em .quality/new-repository-transfer-state.json. Nenhum código funcional ou dado de negócio alterado nesta transferência. Sem deploy ou conexão Git na Vercel: ela continua no projeto Diego Projects/Pedss, com a versão parcial publicada antes. Publicação integral ainda exige validar os contratos remotos dos módulos locais e configurar explicitamente a integração desejada.

## Auditoria da divergência GitHub/Vercel — 30/10/2026

Usuário apontou ausência das novas opções de pizzaria em produção e de repositório conectado. Confirmado por leituras atuais da API Vercel: projeto Pedss/Diego Projects com link Git ausente, gitSource=null e último deployment dpl_6Rq9cFo67yzEppZkoRGCFjSePBkH source=cli, releaseScope=opening-status. Código completo está em DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, head36df2fd9b1edc1353655bd6c463072bea086743e; main continua971e24b0263dcfe87e9f867d185c5a9b6bc30e2e. Arquivo PizzaManagement.jsx confirmado no GitHub desse commit.

Fonte enviada à Vercel veio da cópia isolada da produção anterior com patches de abertura/Frete, e não da árvore completa do commit. Não inclui PizzaManagement, PizzaConfigEditor, restaurantServices ou RestaurantPanel existentes localmente. A metadata changesCommit era referência de alterações, não equivalência do código. A comunicação anterior de publicação não destacou adequadamente essa limitação; isso foi reconhecido ao usuário. Parte dos módulos avançados ainda precisa de suporte remoto antes da publicação integral.

Próxima correção necessária: concluir contratos/API dos fluxos locais, validar com Supabase preservando os registros, estabelecer uma fonte Git de produção com branch adequada e então publicar a mesma versão validada. Somente diagnóstico nesta tarefa: sem conectar repositório, mudar branch/ambiente, fazer deploy, migração, novo commit ou alterar dados. Evidência .quality/release-divergence-audit-2026-10-30.json. Não houve alteração de código nem novo gate.

## Aviso de abertura enviado ao GitHub e publicado — 30/10/2026

Concluído por pedido explícito do usuário. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit 36df2fd9b1edc1353655bd6c463072bea086743e, árvore 84d3b481304410e0d8d6151f87cd564306e8eda6:383 arquivos conferidos por hash,32 novos/alterados(12 novos), sem exclusões/force; main preservada. Credenciais/env reais, plan/log/.quality e capturas excluídos. Documentação e configuração Supabase sincronizadas; região do repositório alinhada a gru1. Gate raiz340 testes/48 arquivos/188 critérios e GitHub Quality41115965876 success. Varredura de segredos liberou somente duas URLs explicitamente fictícias db.example.com de testes; nenhuma credencial real lida/enviada.

Vercel Diego Projects/Pedss confirmado por CLI autenticada após conector403. Fonte isolada C:/Users/Mara Rubia/Documents/Documents/House/Saas Hamburgueria/.quality/opening-release-source-KTKdXR parte da última produção Supabase e aplica só o aviso de abertura/Frete; não publica os módulos locais avançados sem contrato HTTP. Gate da fonte223 testes/30 arquivos/111 critérios. Deploy dpl_6Rq9cFo67yzEppZkoRGCFjSePBkH, READY, gru1, inicialmente com --skip-domain e promovido após validar API/landing/SSE. Domínio https://pedss.vercel.app. Metadata changesCommit aponta ao commit de alterações; não se afirma equivalência do snapshot de produção ao repositório completo. Rollback dpl_5z8bQTb6vocB9RYBLccbnx6WSZr5 preserva Supabase e continua disponível. Nenhuma migração, variável, permissão, serviço, senha ou proteção foi alterada nesta publicação.

Comparação pública antes/staging/depois confirmou seis lojas,48 produtos e configurações/atendimento idênticos. SSEv2 connected/revisão67 e dois heartbeats; timeout4s/curl28 é encerramento intencional. Browser autenticado confirmou novo aviso no Frete, tentativa de abrir mostrando motivo e atalho correto, sem salvar frete nem abrir/fechar loja. Captura .quality/opening-production-warning-2026-10-30.png. Console sem erros e consulta de erros do novo deployment(15m) vazia. Não criado pedido/pagamento/usuário nem teste de carga. Monitoramento contínuo/drains não configurados por esta tarefa. Registros pós-publicação atualizados apenas localmente; manifesto representa o commit enviado. Raia única, sem subagentes.

## Produção com Supabase vazio — 30/10/2026

Após autorização explícita para começar do zero e criar o login técnico limitado, a produção passou ao Supabase PRO `pedss-producao` (`ncohdxclvgoeqyutfubw`). Deployment `dpl_5z8bQTb6vocB9RYBLccbnx6WSZr5` READY e promovido para `https://pedss.vercel.app`, região gru1. API pública200, zero lojas/usuários iniciais e setupAvailable=true; primeiro acesso aberto com código privado mascarado para o usuário definir sua senha. Não afirmar que a conta administrativa já existe antes dessa submissão.

Fonte publicada: base anterior c6d8157 + ajustes de conexão/TLS, leitura por escopo, coordenação de atualizações e manutenção. Gate principal333/181; fonte isolada216/104. Variáveis privadas novas são Secrets só de produção, prévias/desenvolvimento antigos preservados. `.env.local` original e Neon intactos; nenhuma cópia de dados da origem. Proteção Vercel mantida e busca de erros do novo deployment sem registros. Sem commit. Detalhes e limites em `SUPABASE-MIGRATION.md`; seções anteriores são histórico.

## Transição Supabase em preparação — 30/10/2026

Novo projeto `pedss-producao` (`ncohdxclvgoeqyutfubw`) criado na organização PRO indicada, com custo adicional Micro de aproximadamente US$10/mês autorizado. Schema privado e RLS preparados; advisors sem avisos de segurança após correção das permissões do trigger de RLS automático. **A produção ainda usa Neon**: a origem recusa leitura por cota, o usuário escolheu aguardar a cópia e a credencial limitada da API aguarda autorização específica após bloqueio da revisão automática. Nenhuma variável Vercel, deployment ou dado de produção alterado. O projeto Supabase antigo `pedss` foi preservado. Procedimento e limites atuais em [SUPABASE-MIGRATION.md](SUPABASE-MIGRATION.md).

## Operação, carrinho e frete publicados — 26/10/2026

Envio e publicação solicitados pelo usuário concluídos. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit c6d81575a4470c93240db9858fa2273c71c295c1, árvore 51b08aaaa9c31467cd4f3bbff4549f01da0e06e8: 44 arquivos alterados/novos (14 novos), 261 arquivos totais conferidos por hash. Main preservada em 971e24b0263dcfe87e9f867d185c5a9b6bc30e2e, atualização normal com expected SHA. Inclui carrinho somente com ícone/contador, sincronização automática, ações rápidas de pedidos, acompanhamento sem status de pagamento, despesas no Financeiro e módulo Frete.

Gate local repetido e aprovado:184 testes/24 arquivos,104 critérios,lint/tipos/camadas/API/build. GitHub Quality40375817044/verify success. Snapshot isolado igual ao commit;232 arquivos aplicáveis enviados à Vercel, sem env/segredos, plan/log/.quality ou capturas. Conector Vercel retornou403 para a equipe; CLI59.16 já autenticada confirmou Diego Projects/Pedss e concluiu publicação sem alterar acesso/proteção/variáveis.

Deployment dpl_12nxKfE8uSQvBMvj8EfLX4gm4Zdp, sourceCommit c6d81575a4470c93240db9858fa2273c71c295c1, READY em aproximadamente 10s, preparado com --skip-domain e validado antes da promoção para https://pedss.vercel.app. Anterior dpl_GWJ1HFPfryYgaPQnLHbZxnfLuM5M preservado para rollback. Cliente, API e nova api/updates publicados juntos. SSE com Neon respondeu200 text/event-stream, connected e heartbeats. Catálogo antes/staging/depois idêntico:3 lojas,28 produtos e configurações preservados. Sem migração, cadastro, pedido ou alteração de pagamento de produção.

Navegador público confirmou catálogo e carrinho compacto:adicionar somente à sacola local do navegador, abrir checkout e remover item; estado original vazio restaurado, nenhum pedido enviado. Console sem erros e consulta dos logs de erro do deployment (15m) vazia. Drains configurados:0; monitoramento contínuo não configurado por este trabalho. Fluxo autenticado de etapas/Financeiro/Frete coberto no QA HTTP isolado anterior, sem sessão de gestão de produção. Sem teste de carga, aparelho físico ou alteração real para provocar evento de pedido em produção.

Frete rodoviário permanece preparado conforme decisão do usuário; OPENROUTESERVICE_API_KEY não configurada nem modificada. Taxa fixa/áreas legadas disponíveis; não se declara cálculo real por km validado. Aviso de bundle model-viewer preexistente mantido. Evidências: .quality/operations-release-{state,integrity,staged-validation,production-validation}.json, operations-release-staged-stream.txt e operations-release-production-cart.png. Raia única; registros pós-publicação atualizados apenas localmente e manifesto GitHub representa o commit publicado.

## Próxima revisão local: operação e frete — 26/10/2026

Esta revisão ainda não foi publicada. Publicar cliente, api/app e nova api/updates juntos; build-server inclui .server/updates.mjs e vercel.json define duração de 30 s para SSE (conexões limitadas a 24 s, reconexão automática). Gate local aprovado, 184 testes/104 critérios. Produção atual é a publicação registrada abaixo.

Usuário adiou configuração de OPENROUTESERVICE_API_KEY. Manter vazia até ativação; não usar prefixo VITE_. Frete fixo e áreas funcionam sem ela. Para km, seguir docs/SHIPPING.md e validar rota externa real após configurar a chave no servidor. Nenhuma variável ou segredo foi modificado neste trabalho; nenhum acesso de escrita ao Neon.

## Trial, planos e landing publicados na Vercel — 26/10/2026

Concluído a pedido do usuário: Pedss na equipe Diego Projects (prj_wQ4WydtpnP5OS36ei515W9GpoVxV / team_31LF1BKscdWn5gGQQgAxp4c1). Deployment dpl_GWJ1HFPfryYgaPQnLHbZxnfLuM5M, sourceCommit39b3c8c0b195f8cbae36b1a6fb4b937aaa8cdf71, sourceBranch codex/pedss-2026-10-22; build de produção READY e promovido a https://pedss.vercel.app. Host pedss-c6wo0gyhy-diegos-projects-2f58d897.vercel.app; anterior dpl_HxADhZp1JEwFuWUNWd9EyBXoEuXY preservado para rollback.

Snapshot isolado dos247 arquivos do commit conferido por hash;221 arquivos aplicáveis ao deploy, sem env/segredos, registros locais, capturas ou matrizes design. Conector retornou403 para o escopo da equipe; CLI59.16 autenticada confirmou proprietário/projeto e concluiu publicação, sem alterar conexão, permissões, variáveis ou proteção. Produção preparada com --skip-domain, validada antes de promover. Gate do mesmo código aprovado (167 testes,87 critérios) e GitHub Quality40341700324 success; nenhum código alterado neste turno. Build da Vercel aprovado (READY em7s; aviso de bundle model-viewer preexistente).

API antes/staging/depois preservou integralmente as três lojas,28 produtos e configurações; serverNow presente na nova versão. Navegador público confirmou landing/seção trial, CTA para /cadastro, planos Essencial199,90/Rede599,90 e formulário remoto abrindo sem aviso local. Zero erros no console e consulta de logs de erro do novo deployment vazia (janela15m). Sem criação de conta, pedido, cobrança, alteração de catálogo ou migração nesta publicação. Expiração e cadastro completo já cobertos por testes locais de domínio/API/UI; sem novo cadastro real no Neon ou teste em aparelho físico. Drains/monitoramento contínuo não reinspecionados.

Evidências locais: .quality/trial-release-production-{landing,signup}.png, trial-release-staged-validation.json, trial-release-production-inspect.json, trial-release-{before,staged,production}-api.json e trial-release-runtime-errors.jsonl. Registros pós-publicação atualizados apenas localmente; manifesto GitHub continua representando o commit publicado. Raia única, sem delegação.

## Trial, planos e landing enviados ao GitHub — 26/10/2026

Enviado a pedido do usuário para DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22. Commit 39b3c8c0b195f8cbae36b1a6fb4b937aaa8cdf71, árvore d47dfe430227db64b4ce609519fd659b7ccb8f33; 36 arquivos novos/alterados (7 novos), 247 arquivos totais conferidos por hash. Atualização normal com expected SHA, sem force; main 971e24b0263dcfe87e9f867d185c5a9b6bc30e2e preservada. Inclui cadastro trial de7 dias, expiração/ativação, configurações existentes, planos Essencial/Rede e faixa com ícones Peds's. Credenciais, plan/log/.quality e capturas permanecem locais.

Gate do código enviado aprovado:167 testes/21 arquivos,87 critérios,lint/tipos/camadas/API/build; QA de navegador já concluído. GitHub Quality40341700324 concluiu success para o mesmo commit. Sem deploy Vercel ou acesso/gravação ao banco. A produção permanece no commit080c05b, anterior a estas alterações. Raia única, sem delegação.

## Cadastro público com teste de 7 dias — 26/10/2026

Revisão trial disponível somente localmente. Próxima publicação deve incluir frontend e API juntos (registerTrial/activatePlan e projeção serverNow); campo trial é opcional no workspace JSONB existente, sem migração SQL. Lojas antigas sem trial mantêm comportamento. Não rodar seed ou substituir workspace de produção. Gate167 testes/87 critérios aprovado. Cadastro remoto validado com handler real e repositório em memória, sem gravação no Neon. Ativação manual libera acesso, não processa pagamento. Identidade e dados continuam validados no servidor.

## Cardápios publicados no GitHub e Vercel — 24/10/2026

Concluído a pedido do usuário: novo cardápio presencial de consulta, fotos maiores e identidade da loja, com animação permanente nos dois cardápios e detalhes. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit080c05b7e78e1abcd5309ce7a2763e756bf53cbb, árvorebc44496d8bb5ff910d177b382a4eced98f6f7fd9;240 arquivos conferidos por hash,14 alterações incluindo2 exclusões. Main preservada. GitHub Quality40116120365 success; gate local156 testes/76 critérios já aprovado.

Vercel Diego Projects/Pedss prj_wQ4WydtpnP5OS36ei515W9GpoVxV: deployment dpl_HxADhZp1JEwFuWUNWd9EyBXoEuXY, sourceCommit080c05b, promovido a https://pedss.vercel.app. Anterior dpl_2js9xeATkq1n7RgmnsHBrYdBpe47 preservado. Staging READY antes de promover; cinco arquivos compilados (JS/CSS dos cardápios e entrada) idênticos ao build local por SHA256. Catálogo antes/staging/depois idêntico:3 lojas,28 produtos e configurações preservados. Sem migração ou gravação de cadastros/pedidos; proteção e variáveis mantidas.

Navegador público confirmou cardápio presencial desktop e celular390, fotos visíveis e movimento sincronizado sem pausa; detalhes informativos sem compra. Delivery e personalização igualmente animados sem pausa, modais abrindo/fechando; nenhum pedido enviado. Zero erros no console, sem overflow no presencial verificado. Capturas .quality/menu-release-production-{desktop,mobile}.png e menu-release-delivery-production.png. Sem teste em aparelho físico/Web Vitals ou painéis autenticados neste deploy. Sem mudança de código durante a publicação. Registros pós-publicação atualizados somente localmente; manifesto representa o commit publicado.

## Identidade completa publicada na Vercel — 23/10/2026

Concluído a pedido do usuário: deployment dpl_2js9xeATkq1n7RgmnsHBrYdBpe47 publicado e promovido a https://pedss.vercel.app, no projeto Pedss prj_wQ4WydtpnP5OS36ei515W9GpoVxV/equipe Diego Projects team_31LF1BKscdWn5gGQQgAxp4c1. Código e assets conferidos com os 242 arquivos do commit c2969b021d41b490f927c700d9705d41b35c4816, sem divergências antes do envio. Inclui landing/mascotes animados, nova logo/favicon e identidade no cliente/login/painéis. Matrizes design/brand e registros privados excluídos do deploy. Deployment anterior dpl_AjdsqXxKhmMn8QQA9wUwhX66pyNw preservado para recuperação.

Gate do mesmo commit já aprovado (156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build) e GitHub Quality40017665066 success; sem mudança de código para este deploy. Build da Vercel também aprovado. Staging com ambiente de produção validado antes de promover: API e HTML200, logo/mascotes640/960 image/webp200 e hashes iguais aos locais, título/favicon corretos. Catálogo comparado antes/staging/depois: mesmas três lojas, 28 produtos e configurações integralmente preservados. Domínio público confirmado READY no novo deployment e metadado sourceCommit correto.

Browser público desktop1440 e celular390 confirmou landing nova, quatro animações sem pausa, imagens carregadas ao entrar na área visível, FAQ, login conectado sem botões de demonstração e rodapé da loja com logo aprovada. Sem overflow nas views verificadas e zero erros de console. Painéis autenticados não acessados em produção; validados localmente e pelo código/build da mesma versão. Sem escrita de banco, migração, alteração de variáveis/proteções, credenciais ou novos pedidos/usuários. Conector Vercel retornou403; utilizada a CLI já autenticada com escopo explícito, sem mudar acesso ou exigir reconexão. Raia única.

Capturas peds-identity-production-{hero,body,login,client-mobile}.png. Não medidos Web Vitals/rede móvel/aparelho físico. Relatório privado em .quality/identity-release-state.json. Registros desta publicação atualizados localmente, sem novo commit automático; branch GitHub permanece c2969b0. Servidor local e prévia mantidos.

## Identidade Peds's consolidada para GitHub — 23/10/2026

Revisão solicitada pelo usuário para a branch existente codex/pedss-2026-10-22 de DiegoMicaelvs/pedss. Reúne logo/favicons verdes com apóstrofo, matrizes aprovadas, hero e corpo da landing com mascotes animados, marca compartilhada no cliente/login/painéis e documentação. Sem alteração de dependências, migrações ou credenciais; plan/log/.quality e capturas permanecem locais. Main preservada. GitHub e Vercel continuam independentes: este envio não publica as revisões locais na produção.

Gate npm run check repetido e aprovado no estado de código enviado: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Inspeções visuais registradas nas seções anteriores desta documentação; nenhuma mudança de UI durante o envio. A publicação usa commit descendente do último envio, com conferência de hashes e atualização normal da branch, sem force. Identificadores finais e acompanhamento do CI ficam no registro local .quality/github-published-state.json.

## Marca verde aprovada — 23/10/2026

Produção atual dpl_AjdsqXxKhmMn8QQA9wUwhX66pyNw (pedss-mhaq9yihc-diegos-projects-2f58d897.vercel.app), promovida após gate156 testes/76 critérios e GETs de API/HTML/WebP/favicon. Mesmas três lojas e 28 produtos; nenhuma migração ou configuração alterada. Landing Peds's com logo verde, apóstrofo e mascote no favicon. Matrizes design/brand excluídas do deploy; somente assets web em public/brand são requisitados. Anterior 3QTU5zej65SGtYwwSDtWF5VVJdRS mantido para recuperação. Não feito commit/envio GitHub automático da nova identidade.

## Sincronização das correções no GitHub — 23/10/2026

Esta revisão reúne as correções das fotos ausentes e a otimização do carregamento na branch codex/pedss-2026-10-22 de DiegoMicaelvs/pedss, por solicitação explícita do usuário. Inclui fallback ilustrativo identificado, 26 imagens WebP responsivas, prioridades de carregamento, cache por hash, testes e documentação. Corresponde às alterações já validadas em produção no deployment 3QTU5zej65SGtYwwSDtWF5VVJdRS. Gate aprovado: 156 testes e 76 critérios. Registros locais, credenciais, capturas e dados de produção não fazem parte do envio. As notas anteriores sobre código ainda não enviado descrevem o estado em 22/10, antes desta sincronização.


## Otimização das fotos — 22/10/2026

Produção atual: dpl_3QTU5zej65SGtYwwSDtWF5VVJdRS (pedss-9hvx4qvyx-diegos-projects-2f58d897.vercel.app), promovida após gate 156 testes/76 critérios e validação de API, WebP/hash/cache. Hero burger 82,6% menor na resolução completa; versões responsivas para heroes e ilustrações, primeiros produtos antecipados, import da rota em paralelo. Cache anual imutável apenas em /images/optimized/ com nome por hash; não aplicar a fotos mutáveis, HTML, API ou PNGs legados. Mesmos três estabelecimentos/28 produtos; nenhuma migração, credencial, configuração de loja ou proteção alterada. Anterior BHmigojRYL6chXV35fzjbi866wAF preservado para recuperação. Sem commit automático; GitHub 21a9bf7 continua anterior às duas correções de fotos.

## Correção de imagens — 22/10/2026

Produção pedss.vercel.app atualizada para dpl_BHmigojRYL6chXV35fzjbi866wAF (pedss-feoynbknv-diegos-projects-2f58d897.vercel.app). Fallback ilustrativo para produtos sem foto, sem escrever no banco ou mudar o catálogo. Gate 152 testes/76 critérios aprovado; API e imagem de produto 200; imagem servida com bytes iguais ao asset local. Três lojas e os 28 produtos/IDs/preços preservados; browser público confirmou imagens e animação. Deployment anterior AtrBthh7MY4f59khpqYrpm4KMjDd preservado para recuperação. GitHub 21a9bf7 ainda representa a versão anterior; não feito commit automático neste ajuste.

## Versão atual — 22/10/2026

Produção https://pedss.vercel.app agora atende dpl_AtrBthh7MY4f59khpqYrpm4KMjDd (https://pedss-d8echnux2-diegos-projects-2f58d897.vercel.app), publicado no mesmo projeto/equipe via CLI, testado com GET de API e cardápio e promovido. Build Node24/Vite e gate 142 testes/76 critérios aprovados. Proteção de previews/deployments e domínio público preservados. Nenhuma migração, troca de banco ou configuração de loja feita.

Código desta versão na branch codex/pedss-2026-10-22 do repositório privado DiegoMicaelvs/pedss. A main contém outra implementação e foi preservada. Ainda não existe integração Git→Vercel: envio ao GitHub e publicação CLI são ações separadas. Deployment anterior dpl_EFBQv83QvQG5ymoMQooft473pJLT continua disponível para eventual rollback de código, que não desfaz dados.

## Origem verificada da produção — 22/10/2026

Em consulta autenticada, pedss.vercel.app resolve dpl_EFBQv83QvQG5ymoMQooft473pJLT, criado em 21/10/2026 às 15:24:19 (America/Bahia). source cli, gitSource null e link Git do projeto ausente: publicação por envio direto da máquina, com Vite, npm run build e dist. Árvore de fontes confirma mesma base deste projeto local (88 de 127 arquivos enviados ainda idênticos por SHA-1); os ajustes visuais atuais são posteriores e não foram publicados nesta auditoria.

O repositório DiegoMicaelvs/pedss consultado tem estrutura distinta (monorepo pnpm/Turbo/Supabase) e não foi a origem desse deploy. Antes de enviar a cópia local para lá, definir o destino sem sobrepor essa implementação inadvertidamente. Nenhuma alteração remota nesta verificação.

Produção: https://pedss.vercel.app. Em 21/10/2026, após autorização explícita do usuário, a proteção herdada foi alterada para Standard Protection (`prod_deployment_urls_and_all_previews`): domínio de produção público; URLs geradas de deployment e previews continuam com autenticação Vercel. O login e a autorização da aplicação Pedss continuam obrigatórios para gestão. Teste HTTP sem cookies: site/cardápio/API 200; gestão anônima 401; URL de deployment 302. Nenhuma proteção foi desligada globalmente.

Equipe: Diego's projects (`diegos-projects-2f58d897`). Projeto: `pedss`, ID `prj_wQ4WydtpnP5OS36ei515W9GpoVxV`. Neon: recurso dedicado `brasa-db`, projeto `autumn-feather-08399369`, plano Free. O nome interno do recurso foi mantido após o rebranding para não recriar banco.

## Executar e migrar

Node 24+. `npm ci` e `npm run dev`. `VITE_RUNTIME_MODE=local` mantém o ambiente legado isolado; `remote` usa `/api/app`. Em desenvolvimento, o plugin Vite serve a API na mesma origem. As variáveis da Vercel são puxadas para `.env.local`, ignorado no Git e excluído do upload. Somente `VITE_*` é público. Nunca prefixar credenciais do banco com `VITE_`.

`npm run db:migrate` usa conexão direta `DATABASE_URL_UNPOOLED`, verifica certificado TLS, cria o schema `pedss`, aplica `migrations/001_initial.sql` em transação e insere o seed somente se ainda não existir. Reexecutar não apaga dados. Aplicação usa pool `pg` com `DATABASE_URL`, TLS validado e `attachDatabasePool` da Vercel.

## Acesso inicial

O modo remoto não permite perfis demo. A primeira conta exige `PEDSS_SETUP_TOKEN` aleatório de 32 bytes e só pode ser criada uma vez, sob lock no banco. Instruções privadas ficam em `.quality/primeiro-acesso-pedss.local.txt`, nunca no deploy. O código é passado como fragmento de URL, não como query enviada ao servidor. Usuário escolhe seu nome, e-mail e senha.

Os casos de uso de credenciais existentes foram levados para o servidor: derivação PBKDF2 SHA-256 com 600 mil iterações, salt individual, tokens opacos aleatórios, somente digest em banco, sessão de oito horas, cookie HttpOnly/Secure/SameSite=Strict em HTTPS. A API valida sessão e permissões em cada comando; papel ou storeId no payload não concede acesso. Não se usa o Neon Auth provisionado automaticamente pela integração; suas variáveis não são consumidas pela aplicação. A simulação local continua explicitamente identificada e não constitui autenticação de produção.

Convites autorizados por link expiram em 24 horas, são de uso único e funcionam entre dispositivos; não enviam e-mail. Recuperação autônoma por e-mail permanece indisponível. Sem MFA ou provedor externo de identidade. Não publicar a senha nem o código de configuração em issues/logs.

## Persistência e limites desta primeira integração

O domínio legado foi preservado em um agregado JSONB privado (`pedss.workspace`), validado por Zod, com `SELECT FOR UPDATE` por comando e commit atômico. Nenhum agregado privado é transferido ao browser: `server/projection.mjs` monta uma projeção de apresentação sem hashes, sessões ou tokens internos e sem finanças/pedidos de outras lojas. Pedidos públicos exigem token opaco. Valores monetários continuam em centavos. Checkout reconsulta catálogo, preços e cupom, e persiste fingerprint de conteúdo associado à chave idempotente.

Esse modelo evita perda de atualização na fase inicial, mas serializa as escritas de todas as lojas e carrega o agregado no servidor. Não é um esquema final para grande volume: normalizar por tenant/produto/pedido, paginar consultas e separar mídia antes de escalar. Imagens raster pequenas ainda são data URLs no banco; não há object storage. Corpo HTTP limitado a 3,5 MB e plataforma Vercel também impõe limites de resposta. Para catálogos grandes, usar lotes menores.

Sacolas ficam separadas por navegador; apenas elas são gravadas localmente no modo remoto. Chaves e dados legados `brasa.*` não são apagados nem importados. O seed contém só uma loja fictícia, sem contas, pedidos ou despesas. Dados reais antigos precisam de migração autenticada específica.

Polling a cada 15 segundos atualiza painel e acompanhamento. Mutações exigem JSON, cabeçalho próprio e origem igual ao host, com rate limiting persistente em PostgreSQL. Há logs de classe de erro/requestId, sem payload, credenciais ou dados pessoais. Não foram contratados pagamentos, e-mail ou serviços adicionais. Pagamento permanece registro manual.

## Publicação e recuperação

Gate obrigatório: `npm run check`. Confirmar equipe/projeto com `vercel project inspect --scope diegos-projects-2f58d897`. Publicar primeiro com `vercel deploy --prod --skip-domain --yes --scope diegos-projects-2f58d897`, conferir API e rotas, depois `vercel promote URL --scope diegos-projects-2f58d897`. Não desativar proteção de deployment para contornar falha de acesso. Não são feitos commits automáticos.

Rollback de código não desfaz dados. A migração inicial é aditiva. Backups externos, restauração completa e política de retenção ainda precisam ser definidos/testados antes da operação comercial. Desenvolvimento, preview e produção desta conexão compartilham o recurso provisionado: usar branch Neon separada antes de manter ambientes com dados reais. `scripts/cloud-smoke.mjs` só deve ser executado com autorização explícita para criar registros fictícios e limpeza obrigatória em `finally` via `--cleanup`.
