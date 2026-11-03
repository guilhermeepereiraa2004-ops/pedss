# Pendências — Pedss

## Versão integral publicada e novo Git conectado — 30/10/2026

Produção Pedss/Diego Projects atualizada integralmente para o commit 15fe3a8ea95290857b2e210a213240da18ca227d de guilhermeepereiraa2004-ops/pedss/main. Fonte criada por git archive do commit, sem env reais nem registros locais. Deployment dpl_3fi667sKPZyRj9nfvjLHbNitf5BW, READY, funções gru1, promovido para https://pedss.vercel.app após validação. Bundle Dashboard publicado tem SHA256 idêntico ao build do gate. Projeto principal prj_wQ4WydtpnP5OS36ei515W9GpoVxV agora conectado ao novo repositório GitHub, productionBranch=main. Não é mais uma publicação parcial baseada na produção antiga.

Gate aprovado:348 testes/48 arquivos,188/188 critérios, lint/tipos/camadas/build; CI GitHub Quality41125913799 success. Oito regressões novas cobrem HTTP/SQL de pizzaria, estoque/caixa, mesas e pagamento, isolamento, repetição, alteração auditada/idempotente de itens e caches parciais. PostgreSQL/WASM descartável foi usado nos testes; não houve pedido, pagamento, cliente, migração, seed nem alteração operacional no Supabase real.

Leituras antes/staging/produção confirmaram seis lojas,48 produtos, identidade, preços, configurações e online preservados (novos defaults normalizados pelo mesmo schema). SSEv2 conectado, revisão67 e dois heartbeats; timeout4s intencional. Inspeção autenticada confirmou Pizzaria, Estoque e fichas, Caixa, Mesas e comandas, Agendamento, Combos, Cozinha e Balcão. Ativação do editor de tamanhos testada somente como rascunho e descartada, sem salvar. Console sem erros; logs de erro do deployment vazios na janela15m. Captura .quality/full-production-pizzeria-2026-10-30.png. Testes de gravação em produção, carga e rotas externas por CEP não realizados; OPENROUTESERVICE_API_KEY continua adiada pelo usuário. Cadastros locais de demonstração não foram copiados para o banco publicado.

Incidente de vínculo: primeiro envio começou antes de terminar a criação da cópia isolada e criou full-release-15fe3a8 (prj_Idk2gd4zB0oKXonhcb02RBLCAF5g), sem afetar o Pedss original ou seu banco. Exclusão inicialmente bloqueada pela revisão automática; usuário autorizou expressamente excluir apenas esse projeto extra. CLI confirmou remoção permanente do projeto e deployment depois dessa autorização. Vínculo corrigido/inspecionado antes do envio ao Pedss correto. Nenhuma proteção, credencial, variável ou plano foi alterado. Raia única, sem subagentes.

Registros posteriores à publicação não alteram o código funcional do commit enviado. Rollback disponível na produção anterior Supabase dpl_6Rq9cFo67yzEppZkoRGCFjSePBkH.


## Publicação integral em preparação — 30/10/2026

Pedido explícito para atualizar toda a versão da Vercel. Fonte canônica: guilhermeepereiraa2004-ops/pedss, main. Contrato único de comandos agora conecta os módulos de pizzaria e operação à API: vínculo de sabores, estoque/fichas, agendamento, caixa, pagamentos parciais, mesas/comandas, balcão e alterações de itens. Repetição de pedido usa token opaco e mantém a sacola somente no navegador. A API reaplica permissões e preços do domínio; resultados de pedidos para atendentes são sanitizados.

Leitura SQL por loja agora inclui scheduling no catálogo e estoque/caixa/mesas nas operações, respeitando o papel da sessão. Cache parcial restaura cada partição corretamente; mudanças operacionais não reenviam fotos. Nenhuma migração, seed, troca de banco, variável privada ou mudança operacional das lojas é necessária. Testes novos executam os fluxos HTTP com SQL real em PostgreSQL/WASM descartável, sem acessar o banco publicado.

A promoção depende do gate completo, comparação dos seis cardápios, API/SSE da versão preparada e inspeção da interface. O resultado e o deployment serão registrados após a conclusão; esta seção não afirma publicação antecipada. Dados de demonstração do navegador local não são copiados para produção.


## Repositório principal transferido — 30/10/2026

Por solicitação explícita, o destino oficial agora é https://github.com/guilhermeepereiraa2004-ops/pedss.git, branch main. O destino estava vazio. Git foi inicializado nesta pasta, origin e upstream main definidos para o novo repositório, e o Git Credential Manager já autenticado do computador realizou o envio. O conector GitHub tinha somente leitura; não foi necessário alterar permissões ou obter senhas/chaves. O repositório DiegoMicaelvs/pedss permanece preservado e não deve receber novos envios deste projeto.

Primeiro commit ed95d01c297480b7fb4f869501161bf82f11adf1, árvore cf628cd6c061ffafcfd8824819d952ee23ff7d1d:384 arquivos/116.033.805 bytes, incluindo o código integral, módulos/preços/montador/combos de pizzaria, imagens, testes, documentação e migrações. Arquivos remotos conferidos por hash com o snapshot local, sem diferenças. Apenas .env.example foi incluído; env reais, credenciais, .vercel, plan/log/.quality, outputs e ferramentas locais ficaram ignorados. README e AGENTS apontam para o novo destino.

Gate npm run check aprovado novamente:340 testes/48 arquivos e188/188 critérios, lint/tipos/camadas/build. Log .quality/new-origin-gate-2026-10-30.log. GitHub Quality inicial41122293452 iniciado; estado final será registrado em .quality/new-repository-transfer-state.json. Nenhum código funcional ou dado de negócio alterado nesta transferência. Sem deploy ou conexão Git na Vercel: ela continua no projeto Diego Projects/Pedss, com a versão parcial publicada antes. Publicação integral ainda exige validar os contratos remotos dos módulos locais e configurar explicitamente a integração desejada.

## Confirmação de identidade da pasta e vínculos — 30/10/2026

Nova conferência: a pasta Saas Hamburgueria não é um repositório Git (git rev-parse confirmou ausência de .git também nos ancestrais). Ela tem vínculo de CLI .vercel/project.json para Pedss/Diego Projects, mas a API Vercel confirmou gitConnected=false. São vínculos diferentes. GitHub DiegoMicaelvs/pedss contém os mesmos arquivos: hashes de PizzaManagement.jsx, storeOpening.ts e restaurantServices.ts idênticos à pasta local na árvore84d3b481304410e0d8d6151f87cd564306e8eda6. Envios anteriores ocorreram pelo conector GitHub, sem remote Git na pasta. Nome local não determina nome/conta do repositório. Nenhum vínculo ou estado externo alterado.

## Auditoria da divergência GitHub/Vercel — 30/10/2026

Usuário apontou ausência das novas opções de pizzaria em produção e de repositório conectado. Confirmado por leituras atuais da API Vercel: projeto Pedss/Diego Projects com link Git ausente, gitSource=null e último deployment dpl_6Rq9cFo67yzEppZkoRGCFjSePBkH source=cli, releaseScope=opening-status. Código completo está em DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, head36df2fd9b1edc1353655bd6c463072bea086743e; main continua971e24b0263dcfe87e9f867d185c5a9b6bc30e2e. Arquivo PizzaManagement.jsx confirmado no GitHub desse commit.

Fonte enviada à Vercel veio da cópia isolada da produção anterior com patches de abertura/Frete, e não da árvore completa do commit. Não inclui PizzaManagement, PizzaConfigEditor, restaurantServices ou RestaurantPanel existentes localmente. A metadata changesCommit era referência de alterações, não equivalência do código. A comunicação anterior de publicação não destacou adequadamente essa limitação; isso foi reconhecido ao usuário. Parte dos módulos avançados ainda precisa de suporte remoto antes da publicação integral.

Próxima correção necessária: concluir contratos/API dos fluxos locais, validar com Supabase preservando os registros, estabelecer uma fonte Git de produção com branch adequada e então publicar a mesma versão validada. Somente diagnóstico nesta tarefa: sem conectar repositório, mudar branch/ambiente, fazer deploy, migração, novo commit ou alterar dados. Evidência .quality/release-divergence-audit-2026-10-30.json. Não houve alteração de código nem novo gate.

## Aviso de abertura enviado ao GitHub e publicado — 30/10/2026

Concluído por pedido explícito do usuário. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit 36df2fd9b1edc1353655bd6c463072bea086743e, árvore 84d3b481304410e0d8d6151f87cd564306e8eda6:383 arquivos conferidos por hash,32 novos/alterados(12 novos), sem exclusões/force; main preservada. Credenciais/env reais, plan/log/.quality e capturas excluídos. Documentação e configuração Supabase sincronizadas; região do repositório alinhada a gru1. Gate raiz340 testes/48 arquivos/188 critérios e GitHub Quality41115965876 success. Varredura de segredos liberou somente duas URLs explicitamente fictícias db.example.com de testes; nenhuma credencial real lida/enviada.

Vercel Diego Projects/Pedss confirmado por CLI autenticada após conector403. Fonte isolada C:/Users/Mara Rubia/Documents/Documents/House/Saas Hamburgueria/.quality/opening-release-source-KTKdXR parte da última produção Supabase e aplica só o aviso de abertura/Frete; não publica os módulos locais avançados sem contrato HTTP. Gate da fonte223 testes/30 arquivos/111 critérios. Deploy dpl_6Rq9cFo67yzEppZkoRGCFjSePBkH, READY, gru1, inicialmente com --skip-domain e promovido após validar API/landing/SSE. Domínio https://pedss.vercel.app. Metadata changesCommit aponta ao commit de alterações; não se afirma equivalência do snapshot de produção ao repositório completo. Rollback dpl_5z8bQTb6vocB9RYBLccbnx6WSZr5 preserva Supabase e continua disponível. Nenhuma migração, variável, permissão, serviço, senha ou proteção foi alterada nesta publicação.

Comparação pública antes/staging/depois confirmou seis lojas,48 produtos e configurações/atendimento idênticos. SSEv2 connected/revisão67 e dois heartbeats; timeout4s/curl28 é encerramento intencional. Browser autenticado confirmou novo aviso no Frete, tentativa de abrir mostrando motivo e atalho correto, sem salvar frete nem abrir/fechar loja. Captura .quality/opening-production-warning-2026-10-30.png. Console sem erros e consulta de erros do novo deployment(15m) vazia. Não criado pedido/pagamento/usuário nem teste de carga. Monitoramento contínuo/drains não configurados por esta tarefa. Registros pós-publicação atualizados apenas localmente; manifesto representa o commit enviado. Raia única, sem subagentes.

## Motivos e orientação para abrir a loja — 30/10/2026

Implementação local concluída: diagnóstico derivado das regras públicas de disponibilidade, aviso persistente na visão geral, explicação ao tentar abrir e atalhos para Frete, horários ou central. Pausa e trial vencido não são confundidos com botão manual. Atendimento programado explica o horário America/Bahia e não desliga silenciosamente. Erros de gravação continuam visíveis e não produzem sucesso falso. Frete agora avisa que os valores sugeridos só valem depois de salvar. Sem alterações no contrato HTTP, banco, preços ou regras de autorização; UI deixa de fazer a tentativa quando já conhece um bloqueio.

Produção Brasa Burger inspecionada somente por leitura: entrega marcada, retirada desmarcada, endereço vazio e formulário de frete sugerindo taxa única de R$5,00, ainda sem configuração de atendimento salva. Nenhuma forma de atendimento real foi escolhida/salva pelo agente. Para usar, o gestor precisa salvar entrega configurada ou retirada com endereço. Não há publicação/commit nesta tarefa; aviso novo ainda não está na Vercel.

Gate npm run check aprovado:340 testes/48 arquivos, lint/tipos/camadas/build e181 critérios então cadastrados. Sete novos critérios adicionados ao catálogo após o gate e verificados pelo mesmo relatório aprovado:188/188 em scripts/acceptance.mjs, piso188. Log .quality/store-opening-gate-2026-10-30.log. Verificação pelo navegador completou tentativa bloqueada → modal → atalho Frete → salvar → voltar → abrir, sem refresh, usando exclusivamente repositório descartável em memória. Evidência .quality/store-opening-desktop-2026-10-30.png; prévia local na porta5180. Nenhuma loja publicada foi aberta/fechada nem dados legados alterados. Raia única, sem subagentes.

## Cardápios iniciais cadastrados em produção — 30/10/2026

Pedido do usuário para cadastrar produtos nos seis estabelecimentos recém-criados. Importação pelo painel autenticado: 8 produtos em cada loja, 48 no total, sem substituir produtos existentes (prévia: 8 novos, 0 atualizações e 0 erros por arquivo). Cada produto tem SKU, categoria, descrição, preço em centavos e fotos ilustrativas sem fundo já publicadas. Custos não inventados: permanecem vazios. Adicionais: 12 nos hambúrgueres, 18 nos açaís e 9 opções de sabor nos sorvetes (39 no total). Cardápios incluem bebidas e sobremesas. Preços são exemplos editáveis; as imagens por categoria não representam fotografias próprias de cada receita.

As seis gravações mostraram conclusão no painel. Navegação independente nos seis cardápios públicos confirmou 8 produtos por loja e 8/8 fotos carregadas após rolagem (48/48). Lojas permanecem fora de atendimento, sem alterar entrega/retirada, criar pedidos, usuários, pagamentos ou abrir operação. Pizzas cadastradas como produtos simples grandes de 35 cm/8 fatias; montador avançado local não foi publicado/configurado por esta tarefa.

Planilhas criadas com artifact-tool, números reais nas colunas de preço, prévia visual e inspeção de dados. Exportações existem e foram aceitas pelo importador apesar de o processo do gerador encerrar com código1 após concluir os seis arquivos. Junction de dependências recusada pelo sistema de arquivos; usado import absoluto do runtime fornecido, sem ampliar permissões. Evidências em .quality/catalogs-2026-10-30: manifest.json, browser-checks.json, brasa-published.png e catalog-published.png. Nenhum código alterado, deploy ou commit; npm run check não repetido para cadastro operacional. Gate anterior permanece registrado. Raia única do agente principal.

## Seis estabelecimentos cadastrados em produção — 30/10/2026

Pedido explícito do usuário: criar um de cada tipo. Sessão administrativa real confirmada no super-admin publicado. Cadastrados pelo formulário autorizado da aplicação: Brasa Burger (burger, /store/brasa-burger, #d5f36b); Cia da Pizza (pizza, /store/cia-da-pizza, #f97316); Açaí da Casa (acai, /store/acai-da-casa, #8b5cf6); Gelato da Casa (icecream, /store/gelato-da-casa, #38bdf8); Sabor da Hora (snacks, /store/sabor-da-hora, #f59e0b); Pastel e Prosa (pastel, /store/pastel-e-prosa, #ef4444). Todos no plano de referência Essencial, com contatos fictícios example.com. Sem criar/invitar usuários, enviar e-mail, cadastrar produtos/pedidos ou abrir atendimento. Cardápios e configurações operacionais ainda precisam ser preenchidos. Nenhum dado antigo removido; bancos anteriores preservados.

Recarga da página confirmou seis registros, os seis tipos e seis cores distintas persistidas. Captura: .quality/establishments-six-2026-10-30.png. O preenchimento Playwright do input color alterava apenas a apresentação; corrigido pelo controle nativo, e as seis identidades foram confirmadas após nova recarga. Sem alteração de código, novo deploy ou commit; gate anterior permanece o registrado (333 testes/181 critérios na raiz). Raia única, agente principal. Este estado supera a pendência anterior de criação do primeiro administrador.

## Supabase ativo após autorização de início vazio — 30/10/2026

Troca de produção concluída no novo Supabase PRO, com RLS, TLS validado, credencial técnica limitada e API/SSE respondendo. A escolha explícita de começar vazio substitui a espera pela cópia; Neon preservado, sem migração de contas/lojas/histórico. Falta o usuário concluir a criação do novo administrador na tela aberta (código privado já preenchido). Até lá, sem sessão autenticada real de produção validada; não houve cadastro operacional fictício.

Prévia/desenvolvimento e `.env.local` anteriores não foram trocados. Módulos locais de pizzaria sem integração HTTP continuam fora do deployment: publicação usou base já publicada com ajustes de conexão e tráfego, evitando expor funcionalidades remotas incompletas. Futuro resgate de dados do Neon exigirá mesclagem com o destino que começar a receber cadastros. Nenhum GitHub/commit novo nesta etapa. Estado e evidências em `SUPABASE-MIGRATION.md`.

## Troca para Supabase — 30/10/2026

Projeto novo `pedss-producao` criado na organização PRO e schema privado protegido, sem dados. Falta conseguir ler/exportar o Neon (erro53000 de cota), obter autorização específica para a credencial limitada `pedss_api`, copiar/validar contas e histórico e então trocar a conexão de produção. O usuário escolheu preservar os dados; pergunta posterior sobre reiniciar não autoriza começar vazio. `.env.supabase.local` é somente uma preparação com credencial ainda não aplicada. Nenhuma mudança de Vercel, Neon, banco antigo Supabase, autenticação de usuários ou dados locais. Detalhes em `docs/SUPABASE-MIGRATION.md`.

## Revisão para GitHub — 30/10/2026

Gate completo novamente aprovado (325 testes, 181 critérios). A inspeção em navegador voltou a funcionar: edição e cancelamento parcial de pedido foram conferidos no Dashboard real com dados descartáveis em memória; prévia de combo fixo conferida em desktop e formulário móvel, sem overflow. A limitação de inicialização descrita em 29/10 é histórica e foi superada nessa extensão. Não houve teste operacional persistente, aparelho físico ou integração remota das novas ações; esses limites permanecem. Enviar ao GitHub não torna essas ações disponíveis na API nem atualiza a Vercel.

## Pedidos por item e combos explícitos — 29/10/2026

Edição de pedido confirmado antes do preparo e cancelamento por item entregues localmente, com auditoria, estoque histórico, revisão financeira e prevenção de concorrência/duplicidade. Cadastro de combos agora distingue fixos/escolhas e tem prévia. A lista da revisão anterior é histórica; esses três itens foram atendidos.

Limites atuais: ações novas não estão no adaptador HTTP; nenhuma integração/banco/publicação solicitada. Pedido legado com baixa global sem fichas históricas por item não pode ser editado/cancelado parcialmente com segurança; operação recusa e orienta cancelar inteiro. Combos são conjuntos indivisíveis, sem rateio arbitrário entre pizzas. Edição só antes de iniciar preparo; cancelamento posterior mantém baixa como perda. Perdas são auditadas com custo conhecido/desconhecido, sem gerar despesa financeira automática. Devoluções são registros manuais, não transferências externas. Cupons anteriores sem mínimo registrado usam apenas a condição conhecida; não se consulta o cadastro atual para inventar regra histórica.

Gate325/44 e181 critérios aprovado, mas inspeção visual desktop/mobile não realizada: controle CUA/Node REPL falha ao criar kernel assets. QA descartável preparada, ainda não inspecionada; sem aparelho físico/produção. Relatórios por sabor/tamanho, forno por pizza, compras/lotes/validade e backup integral continuam pendentes e não foram pedidos nesta entrega.

## Pendências confirmadas na revisão de 29/10/2026

Sem incluir banco/CEP e demais integrações adiadas:

1. services.ts permite updateCartLine, mas não editar composição/quantidade de uma venda já confirmada. OrderDetail oferece status, pagamento e impressão. Falta fluxo auditado de alteração antes do preparo.
2. changeOrder transiciona o pedido inteiro; não há cancelamento operacional de uma linha. Recebimento/estorno parcial já existem e não equivalem a retirar uma pizza da venda.
3. analytics.ts/businessOverview soma productMap por line.productId; não há ranking por sabor/tamanho ou decomposição de combo. Vendas do montador se acumulam no produto montador.
4. RestaurantPanel/Kitchen avança o pedido inteiro, não cada pizza. Agenda limita pedidos e pizzaUnits sem ponderar tamanho/tempo/carga física do forno.
5. ComboForm representa tudo como grupos de opções; falta facilitar a distinção entre um de cada e uma opção à escolha. Reparo específico do Super Combo é só desenvolvimento e não substitui essa melhoria genérica.
6. Estoque possui saldo, movimentos com motivo e fichas/custos, sem modelo estruturado de compras, fornecedor, lote/validade e perda/refação.
7. Exportação existente é do catálogo/planilha. Não foi localizado fluxo de backup/restauração de todo o workspace local (pedidos, configurações, comandas e caixa).

Não são defeitos demonstrados do cálculo básico nem recursos todos obrigatórios para um piloto. Cadastro da Cia ainda precisa ser revisado/vinculado pelo usuário; aplicação do Super Combo no armazenamento dele não confirmada. Sem auditoria dinâmica ou testes novos nesta revisão; último gate305/42 e161 critérios de28/10. Sem dados, banco, publicação ou commit.

## Carregamento confiável das fotos de pizza — 28/10/2026

Resolvida a lacuna de imagem concluída em cache sem evento load: componente confere complete/naturalWidth e pageshow. Recortes versionados do manifesto de pizzas deixam de depender de canvas para serem mostrados; uploads continuam validados. Gate305/42 e161 critérios,14/14 fotos no browser local após reabertura. A ocorrência intermitente original não foi reproduzida no navegador controlado; regressões simulam o evento ausente. Rede móvel lenta, dispositivo físico e produção não testados; fotos próprias externas ainda dependem da disponibilidade/CORS do servidor de origem. Sem integração/publicação.

## Super Combo com três pizzas fixas — 28/10/2026

Reparo específico preparado para três pizzas a R$180,00, somente DEV com flag local e admin. Não cria combo ausente nem modifica configurações diferentes. O armazenamento do usuário difere da sessão controlada: atualizar o painel master no navegador onde foi cadastrado para aplicar. Gravação nesse navegador não confirmada. Sacolas antigas com escolhas do grupo anterior não são reescritas; precisam revalidar/reselecionar o combo. Fluxo validado em memória; gate300/41. Sem publicação/banco.

## Apresentação unificada dos combos — 28/10/2026

Card próprio de combo no delivery e na consulta presencial: composição com fotos dos componentes cadastrados, quantidades, nomes e tamanhos; fundo claro com a cor da loja, preço separado do botão e fotos animadas. Fotos próprias dos componentes são priorizadas; não se usa a imagem genérica da categoria do combo. Quando montável, o card identifica sabores à escolha e a janela mostra a composição real selecionada, inclusive pizzas com vários sabores. Resumo unificado acompanha todos os grupos, com miniaturas nas opções. Hero, cards normais, valores, regras e cadastros preservados.

Apresentação deriva das opções elegíveis do domínio; helper em application, respeitando dependências entre camadas. Galeria mostra até quatro unidades e informa a quantidade total; conteúdos além de três grupos têm expansão. Cardápio presencial continua apenas consulta. Sem nova biblioteca, imagem gerada, banco, commit ou publicação. Raia única do agente principal. Revisão React aplicada.

Verificação: npm run check aprovado: 295 testes/40 arquivos, 156/156 critérios, lint, tipos, camadas, API e build (.quality/combo-visual-gate.log); aviso preexistente de tamanho do model-viewer. Três testes novos validam conteúdo, fotos próprias/elegibilidade/limite, consulta e resumo/escolhas; nenhuma gravação operacional. Browser conferiu prévia local descartável em .quality/combo-visual.html com exemplos explícitos, sem salvar catálogo/pedidos. Desktop 1280px: cards de576px, resumo em duas colunas e totalR$180,00; celular390×844: cards339px, modal390px, sem overflow e ações dentro da tela. Resumo em desktop baixo mediu417px e coube no corpo509px. Capturas .quality/combo-cards-desktop.png, combo-cards-mobile.png e combo-summary-mobile.png. Viewport restaurado.

Limite: o Super Combo do usuário não está no armazenamento da sessão IAB inspecionada, embora a URL da Cia5176 seja a mesma; a regra foi aplicada genericamente aos combos existentes em qualquer navegador, sem inventar ou reconfigurar os itens desse cadastro. Preview usa os componentes reais com dados de exemplo em memória. Sem aparelho físico ou produção. Uma falha de vínculo do controle exigiu reconexão; gate inicial acusou helper na camada lib, movido para application antes da validação final.

## Refinamentos da pizzaria concluídos localmente — 28/10/2026

Implementados os três reparos da auditoria: reimportação preserva fichas/alergênicos/combos, exportação inclui preços por sabor/tamanho com sincronização dos vínculos, adicionais legados de tamanho/borda não são cobrados junto ao montador e combos compartilham a validação de disponibilidade no anúncio, seleção e checkout. Importação conjunta mantém edições individuais e preços do montador, recusando conflitos explícitos.

Cliente e atendimento: edição de pizza/combo na sacola e no rascunho do balcão; montagem de vários sabores com massa/borda dentro de combos; atendimento presencial com nome/telefone opcionais, mantendo identificação no canal telefone e entrega; agendamento fora do horário público quando habilitado, sem permitir pedidos durante fechamento manual/pausa. A agenda limita pedidos e, opcionalmente, unidades de pizza, contando as quantidades dos combos.

Operação: fichas e baixa/custo dos adicionais gerais; recebimentos/estornos parciais por forma de pagamento; saldo pendente e histórico; divisão por valor/pessoas e por pedidos selecionados; transferência de comanda ou pedidos entre mesas. Recebimentos são alocados aos pedidos mais antigos selecionados. Estornos novos preservam também a atribuição por horário dos recebimentos legados sem ID de turno; novos recebimentos sem caixa continuam não atribuídos. Pedidos parcialmente pagos não podem ser divididos entre comandas, mas a comanda inteira pode mudar de mesa. Fechar exige conclusão e quitação, ou cancelamento com devolução do recebido. Caixa preserva turnos fechados e o financeiro conta recebimentos na data, com venda/ticket somente na quitação.

Raia única do agente principal, sem subagentes. Somente modo local: não houve acesso ao Neon, CEP/rotas, pagamento externo, e-mail, commit, GitHub ou Vercel. Cadastros/preços/estoque/caixa/comandas reais da Cia em 5176 não foram alterados. O vínculo dos 14 sabores e o preenchimento das regras/fichas continuam ações explícitas do usuário; não foram executados automaticamente.

Verificação final: npm run check aprovado: 292 testes em 39 arquivos, 153/153 critérios, lint, tipos, camadas, API e build (.quality/pizza-refinements-gate-final.log); 24 testes novos. Aviso preexistente de tamanho do model-viewer. Testes novos em pizza-refinements.test.ts e pizza-refinements-ui.test.jsx; lançamentos financeiros/estoque exclusivamente em memória. React revisado: hooks estáveis, formulários separados, IDs validados, sem escrita direta de armazenamento pela UI.

Browser Cia5176: balcão em 1280×900 recuperou três sabores e alterou massa de Tradicional para Fina no rascunho, atualizando R$54,90 → R$56,90 sem duplicar linha. Em 390×844 modal ocupou 390px, sem overflow, ações visíveis. Rascunho removido sem confirmar venda; nenhum pedido novo. Agenda mostrou capacidade por pizzas, combo aceitou montador de vários sabores em rascunho descartado e Pizzaria mostrou aviso sobre adicionais antigos. Viewport restaurado. Capturas .quality/pizza-refinements-edit.png e pizza-refinements-mobile.png. Servidor precisou reiniciar fora da restrição de rede para localhost acessível; permanece local em 5176. Controle de navegação teve falhas de conexão/aba durante o reinício, resolvidas em aba nova.

Limites atuais: comandos de operação e novos pagamentos continuam sem adaptador HTTP/banco, conforme etapa local. Sem teste de produção, aparelho físico, carga, impressora térmica ou cobrança automática. Divisão por pedidos inteiros, não repartição de unidades de uma mesma linha; divisão por valor permite receber em partes. A capacidade conta pizzas sem ponderar tamanho/tempo de forno. Agendados antigos sem contagem confiável de combo bloqueiam uma vaga com limite de pizzas em vez de assumir zero. As restrições da revisão automática anterior a gravações financeiras/fichas no browser foram respeitadas; não houve nova tentativa dessas gravações nem contorno por outro meio.

## Auditoria da pizzaria — 28/10/2026

Revisão solicitada pelo usuário, sem alterações no código da aplicação, cadastros ou integrações. Três problemas confirmados com scripts Node/TypeScript em repositório de memória (nenhum banco ou armazenamento do navegador):

1. Importação: planCatalogImport monta um objeto novo e não preserva recipe, allergens e combo. Caso de produto existente com os três campos retornou zero issues e perdeu os três ao reimportar. A tabela genérica também não edita preços por tamanho e importCatalog não chama syncPizzaCatalog. Prioridade alta: preservar metadados e garantir consistência dos vínculos em importações.
2. Migração de adicionais: vínculo de um sabor do catálogo local da Cia mantém extras antigos Grande e Borda recheada, além do tamanho/borda do montador novo. priceLine aceita ambos. Caso isolado: configuração moderna custou4800 centavos e com as duas opções legadas custou6600. Não houve alteração na Cia real/local do usuário. Prioridade alta: revisão explícita/mapeamento de opções redundantes no vínculo, sem remoção silenciosa de dados legados.
3. Combos: comboStartingPrice e a seleção da UI consideram o status do produto, mas não a disponibilidade atual do tamanho configurado/massa/borda. Após desativar o tamanho da opção inclusa, combo anunciou5000 centavos, a única opção válida custou6000 e a escolha inclusa foi recusada somente ao calcular a linha. Prioridade alta: mesma validação de elegibilidade para anúncio, seleção e checkout.

Outras lacunas observadas: adicionais gerais de produto não têm ficha/baixa de ingredientes (apenas adicionais por sabor a têm); agendamento do cliente continua bloqueado quando a loja está fora do horário, pois botões e addToCart exigem openState; balcão/mesa exigem telefone como o checkout público; sacola não edita montagem existente, apenas quantidade/remoção; combo não monta múltiplos sabores nem permite escolher massa/borda; comanda não divide/ transfere conta ou recebe pagamento parcial; capacidade da agenda conta pedidos, sem carga por pizzas/forno. Impressão térmica automática, testes físicos/carga e integração remota continuam fora da entrega. Alguns itens são extensões de escopo, não defeitos do cálculo básico.

Último gate funcional permanece268 testes/37 arquivos e129 critérios (.quality/pizza-modal-layout-gate-final.log); não foi repetido por se tratar de análise sem mudança de código. Os três cenários acima são lacunas da cobertura anterior e precisam ganhar regressões quando corrigidos. Próxima tarefa recomendada: proteger reimportação, revisar adicionais legados no vínculo e unificar disponibilidade/preço mínimo dos combos. Raia única, sem subagentes, commit, publicação ou acesso ao Neon.

## Montador de pizza ampliado — 28/10/2026

Corrigido modal estreito no Balcão: prop wide não era usada por Modal; agora aplica o mesmo modificador pizza-builder-modal do delivery. Janela até1180px, cabeçalho e ações fora da área rolável, prévia/controles com colunas definidas pelo espaço real do conteúdo via container query. Abaixo do espaço necessário usa uma coluna, sem quebrar nomes em sílabas. Celular em tela cheia, contagem em2×2, quantidade e botão sempre visíveis; adaptação para desktop baixo. Formulário compartilha corpo e ações, sem mudar regras, totais ou persistência. Revisão React aplicada; raia única, sem delegação, dados, banco, commit ou publicação.

Gate final npm run check aprovado:268 testes/37 arquivos,129 critérios; .quality/pizza-modal-layout-gate-final.log. Testes existentes preservados, sem testes de CSS que espelham implementação. Browser Cia5176 conferiu balcão e delivery em1280×900,1280×720,767×875 e390×844. Desktop mediu1180px e duas colunas;767px ficou727px/uma coluna;390px usou toda a largura. Sem overflow horizontal; desktop baixo prévia435px cabe no corpo506px. Cabeçalho/rodapé visíveis, montagem real de3 sabores habilitou Adicionar comR$54,90, sem clicar/adicionar/pedir; sacola permaneceu0. Escape fechou, viewport restaurado e cardápio mantido aberto. Capturas .quality/pizza-modal-delivery.png, pizza-modal-desktop.png e pizza-modal-mobile.png. Limites: sem aparelho físico ou teste em produção/outros navegadores. Controle precisou reconectar uma vez. Relatos anteriores de modal comprimido foram superados.

## Operação ampliada da pizzaria — situação em 28/10/2026

Fechadas localmente as lacunas: cadastro vinculado/preços compartilhados; combinação doce/salgada e compatibilidade; proporções desiguais; personalização por sabor; cozinha; balcão/telefone; combos; fichas/estoque; caixa; mesas/comandas; agenda; repetição; alergênicos declarados. Gate:268 testes,129 critérios. Relatos históricos abaixo que afirmam ausência desses recursos foram superados para o modo local.

Limites atuais: vínculo dos produtos existentes é explícito e usa a configuração do montador (não altera preços da Cia principal sem a ação do usuário). Tamanhos de catálogos compartilhados precisam de IDs/nomes coerentes. Combos usam produtos comuns ou pizzas individuais/tamanho fixo, sem montar vários sabores dentro do combo. Estoque só conhece receitas cadastradas; custo incompleto permanece desconhecido; retirar ingrediente não devolve estoque automaticamente. Caixa é conferência local, não processamento de pagamento nem contabilidade; despesas e sangrias não são conciliadas automaticamente. Mesas não têm divisão de conta/transferência/autoatendimento QR. Agenda limita pedidos por horário, sem capacidade de forno em unidades nem garantia logística. Repetição exige seleção estruturada de pedidos novos.

Conforme pedido: banco, adaptador HTTP remoto das novas operações, CEP/endereço e release ficam para depois. Sem impressora térmica automática, integração fiscal/mensagens ou validação em aparelhos físicos. Lote de gravação operacional de QA (ficha/caixa) foi barrado pela revisão automática; coberto em testes de memória, sem gravação browser desses lançamentos. Nenhuma integração/pagamento/serviço externo contratado.

## Ajuda da cobrança por quantidade — 28/10/2026

Aba Preços por sabores explica as três opções em cartões Manter, Substituir e Somar, com exemplos ilustrativos de preço da pizza inteira. Identifica a regra principal atual, distingue fatias de sabores e esclarece campos vazios, acréscimo único por pizza e massa/borda/adicionais somados depois. Ajuda contextual vinculada ao seletor via aria-describedby. Sem mudança no cálculo, contratos ou valores salvos.

npm run check aprovado (244 testes/34 arquivos e 105 critérios); .quality/pizza-count-help-gate.log. Navegador Cia5176 confirmou guia, ausência de overflow na largura625px e ajuda dos três modos; alterações de teste descartadas sem salvar preços. Captura .quality/pizza-count-help.png. Limites: sem nova inspeção em aparelho físico ou viewport largo. Raia única, somente local, sem Neon/publicação/commit. Publicação continua pendente até solicitação.


## Três regras principais de cobrança — 28/10/2026

Aba inicial Como cobrar reúne Média dos sabores, Sabor mais caro e Preço fixo, com explicação/exemplos. Novo pricing=fixed e sizes[].fixedPriceCents opcional; exige valor positivo por tamanho disponível. No fixo, sabores podem ser ofertados sem preço individual: ausência de referência permite, zero desabilita no tamanho e disponibilidade global continua exigida. Tabela troca campos de dinheiro por disponibilidade; referências existentes são preservadas ao selecionar outra regra. Soma continua somente compatibilidade com cadastros legados, sem ser oferecida entre as três opções principais. Exceção fixa por quantidade tem prioridade; acréscimo soma à base; massa/borda/adicionais uma vez. Cliente e consulta presencial mostram a regra e valores aplicáveis. Sem biblioteca ou migração SQL.

Gate npm run check aprovado: 244 testes/34 arquivos, 105 critérios, lint/tipos/camadas/API/build; log .quality/pizza-three-rules-gate.log. Seis testes novos conferem mesmo exemplo (média4657, maior5490, fixo4990), fixo por tamanho, disponibilidade sem referência/zero, inválidos, exceções/acréscimos, persistência no serviço, cliente e checkout HTTP contra preço adulterado. Testes legados preservados; revisão React mantida. Aviso model-viewer preexistente.

Navegador confirmou três escolhas na Cia5176, campos de fixo Média/Grande e descarte restaurando o maior valor sem salvar nem alterar preços da loja. Captura .quality/pizza-three-rules.png; largura625px. Controle precisou reset após falha de vínculo e retomou normalmente. Servidor fixture5179 reiniciado para usar contratos novos sem acessar banco; sem dados fictícios novos persistidos. Casos de API executados no harness isolado; sem teste de preço fixo em banco real, aparelho físico ou nova inspeção larga. Guia PIZZA-BUILDER.md atualizado. Raia única, sem delegação, Neon, GitHub, Vercel, commit ou publicação. Cliente/API precisam de release conjunto quando solicitado.

## Gestão de tamanhos e preços da pizzaria — 28/10/2026

Nova seção Pizzaria para admin/gestor em lojas do segmento pizza ou com produtos Pizza, com atalho no Cardápio. Seleção de produto/montador e abas Preços por tamanho, Tamanhos e fatias, Preços por sabores, Massas e bordas e Regras gerais. Cadastro de tamanhos com 3/4 ou mais fatias separado do máximo de 1–4 sabores. Preços por sabor/tamanho, preço fixo da pizza inteira ou acréscimo por quantidade em cada tamanho. Campos vazios preservam a regra normal; massas/bordas/adicionais somados uma vez. Novos montadores, descarte com recuperação dos campos monetários e bloqueio de troca de produto com edições pendentes. Não há sincronização automática entre preços de montador e produtos individuais; cada produto pode ser configurado nesta seção. Nenhum preço/configuração do usuário alterado automaticamente.

Contrato opcional sizes[].flavorCountPricing { mode:fixed|extra, prices:1..4 } validado no domínio. Recusa fixo zero, centavos fracionários/negativos e quantidades acima do limite do tamanho. Cálculo compartilhado pelo cliente/API, mínimo considera combinações disponíveis e ignora totais fora do limite; histórico e legados preservados. Cliente mostra preço fixo/acréscimo por quantidade; consulta presencial informa regra e valores, sem pedidos. Ajuste adicional: prévia deixa de ser sticky abaixo de 800px para não cobrir botões de tamanho/sabor; desktop mantém prévia fixa. Sem migração SQL ou biblioteca nova.

Gate final npm run check aprovado: 238 testes/33 arquivos, 105 critérios, lint/tipos/camadas/API/build (.quality/pizza-management-gate-complete.log). Nove novos testes de domínio, serviços, UI e HTTP validam tamanhos3/4, preços3/4sabores, mínimo real, inválidos, descarte, API contra preço adulterado e histórico. Revisão React Best Practices aplicada. Primeiro gate identificou export de helper no JSX, corrigido movendo para application/pizzaDraft.ts; execução posterior teve timeout no EXPORT-02 de planilha sob carga, repetição integral passou. Gate repetido após ajuste móvel também passou. Aviso model-viewer preexistente.

Navegador conferiu módulo real da Cia em 5176 sem editar seus dados (largura625px, documento610px, sem overflow de página). Imagem .quality/pizza-management-prices.png. Em fixture HTTP isolada5179, salvou fatias3/4 e preços fixos Grande3sabores6590/4sabores7590; após reload confirmou persistência e cliente exibiu R,90/R,90. Screenshot pizza-management-qa-{saved,client}.png. Problema de sobreposição móvel foi reproduzido e corrigido; seleção funcionou e console final sem erros observados. Helpers reiniciados para remover valores fictícios ao final; Cia5176 preservada. Sem celular físico ou nova inspeção desktop larga; ambiente Neon não consultado. Falhas transitórias de vínculo da automação resolvidas com reinicialização do controle. Documentação PIZZA-BUILDER.md/README atualizada. Raia única, sem delegação, commit, GitHub ou Vercel; publicar cliente/API juntos somente quando solicitado.

## Cebolas das pizzas corrigidas — 28/10/2026

Editadas pela ferramenta nativa image_gen as fotos de calabresa, portuguesa, toscana, atum e carne seca/requeijão, além da pizza da hero. Cebolas tubulares e arcos grossos substituídos por pequenos pedaços de cebola roxa assada; ingredientes restantes, pizza inteira, enquadramento e transparência preservados. Outros nove sabores sem cebola mantidos. Originais anteriores preservados; novos PNGs em design/pizzas/onion-correction e public/images/hero-pizza-v3.png. Prompts finais/fontes em design/pizzas/onion-correction-2026-10-28.json. Reconstrução usa workspaceSource para revisões sem sobrescrever originais. Manifestos com hashes novos atualizam cards, detalhes, composição e hero; prioridade de fotos próprias preservada. Sem mudança em cadastro, preços, configurações ou animação.

Pillow usado somente para reduzir/codificar: cinco WebP novos de 194.186–213.756 bytes, catálogo completo de 14 fotos com 3.215.654 bytes, alpha conferido idêntico ao redimensionado. Hero v3 WebP 640/1254 de 144.208/446.330 bytes. Todas as seis edições inspecionadas individualmente. Navegador 1280px confirmou fontes novas carregadas, composição de quatro sabores e troca para carne seca; sem erros de console observados. Screenshot .quality/pizza-onions-builder.png. Prévia antiga 5179 também recarregada e confirmou hero/calabresa novas. Sem aparelho físico ou nova inspeção móvel nesta troca de imagens, sem alteração de layout.

Gate final npm run check aprovado: 229 testes/31 arquivos, 105 critérios, lint/tipos/camadas/API/build; log .quality/pizza-onion-gate-final.log. Primeiro gate iniciou antes de terminar a reconstrução dos derivados e encontrou manifesto da hero ainda incompleto; repetição após conclusão passou sem correção adicional. Aviso model-viewer preexistente. Alias python do Windows indisponível; executados scripts existentes com Python do runtime empacotado. Controle de navegador precisou reinicializar a sessão após erro de vínculo; verificações retomadas com sucesso. Raia única, sem delegação, banco, GitHub, Vercel ou commit. Revisões permanecem locais.

## Cia da Pizza no painel local — 28/10/2026

Preparada cópia local persistente da Cia da Pizza em 127.0.0.1:5176, ID b8b27514-5d20-4bfd-adff-106639a6364d e slug cia-da-pizza, com 14 produtos do catálogo público salvo e montador separado da prévia. Apenas em desenvolvimento, modo local e opt-in VITE_LOCAL_CIA_PREVIEW=true; exige administrador local. Operação atômica pelo repositório, validação do domínio e prevenção de colisões por ID/slug/tenant. Loja existente/arquivada e edições posteriores nunca são substituídas. Não importa contas, sessões, pedidos, clientes ou configuração atual do Neon. Retirada de demonstração e preços/massa/borda de referência; não representa restauração integral da loja real. Dados persistem somente no navegador/origem. Flag do processo 5176 habilitada; .env.local preservado.

Navegador confirmou quatro lojas na central incluindo Cia da Pizza após reload, 14 sabores no cardápio e abertura do montador com tamanhos/múltiplos sabores/massa/borda. Screenshot .quality/local-cia-central.png. Não foi possível inspecionar o Chrome da captura diretamente; preparo será executado no próprio armazenamento desse navegador ao atualizar o painel autenticado como administrador. Testes LOCAL-PIZZA-01/02 verificam preservação dos outros tenants/contas/sessões, idempotência, edições, colisão e autorização. Primeiro gate teve timeout isolado no EXPORT-02 de planilha; repetição integral sem mudança passou: 229 testes/31 arquivos, 105 critérios, lint/tipos/camadas/API/build. Log .quality/local-cia-preview-gate-retry.log; aviso model-viewer preexistente. Catálogo/chaves de desenvolvimento ausentes dos JS do build de produção. Sem Neon, GitHub, Vercel, commit ou delegação. README explica execução e limites da cópia.

## Prévia de pizzaria reaberta — 28/10/2026

Reiniciado o helper existente .quality/pizza-builder-qa.mjs em http://127.0.0.1:5179/store/demo#cardapio. Navegador confirmou Pizzaria de teste, 14 sabores e chamada Monte sua pizza. Esta é a prévia isolada em memória, não o cadastro real cia-da-pizza no Neon. Landing 5176 é outra origem com demonstração padrão; dados não foram apagados nem transferidos entre ambientes. Cadastro real não consultado nesta etapa. Sem mudanças de código, gate repetido, banco, commit ou publicação. Prévia não persiste edições após reiniciar o helper; manter distinção explícita para o usuário.

## Reinício local — 28/10/2026

Porta 5176 estava sem servidor ativo. Reiniciado npm run dev -- --host 127.0.0.1 --port 5176 --strictPort, com VITE_RUNTIME_MODE=local e PEDSS_ALLOW_REMOTE_DATABASE=false apenas no processo. Landing confirmada no navegador em http://127.0.0.1:5176/. A aba antiga ainda exibia erro de conexão; uma nova abertura confirmou a página carregada. Sem acesso ao Neon, alteração de configuração persistente ou código, commit ou publicação. Gate anterior de 227 testes mantido, sem repetição para inicialização. Raia única; nenhuma nova lacuna funcional avaliada.

## Execução local — 27/10/2026

Servidor npm run dev iniciado em http://127.0.0.1:5173 com VITE_RUNTIME_MODE=local e PEDSS_ALLOW_REMOTE_DATABASE=false apenas no processo. Landing e /store/demo conferidos no navegador; rodapé confirma demonstração local. Sem conexão Neon, alteração de .env.local, código, dados reais, GitHub ou Vercel. Gate anterior de 227 testes preservado, sem repetição para simples inicialização. Raia única; ambientes/portas anteriores preservados. Dados locais variam por origem/porta.

## Transferência de dados — 27/10/2026

Corrigidos localmente os recarregamentos sem mudança, leituras agregadas entre lojas, reenvio de fotos em atualizações de pedidos, reconexões paralelas, dependência do banco na landing e acesso remoto acidental no desenvolvimento. Testes e evidências em docs/DATA-EFFICIENCY.md e docs/QA.md.

Pendências reais: publicar cliente/API juntos; recarregar abas antigas; medir consumo do Neon após a liberação da cota. A otimização não restitui a franquia consumida e não garante que produção caiba para sempre no Free. O agregado ainda usa uma linha; histórico completo por loja/arrays e mídia inline exigem normalização, paginação e armazenamento de arquivos para maior escala, com migração planejada. Painel aberto mantém consultas pequenas para avisos em segundo plano. Sem teste de carga/instâncias distribuídas ou celular físico. Sem alteração de plano ou dados de produção.


## Incidente de produção: transferência do Neon — 27/10/2026

Após o usuário concluir a verificação de e-mail, painel autenticado do projeto autumn-feather-08399369/brasa-db confirmou: Limit reached, monthly network transfer allowance exhausted. Uso observado: Network transfer 5.83 GB; Storage 33.48 MB; History 2.84 MB; Compute 25.74 CU-hrs; plano Free; uma branch. Billing summary informa período de 01/10/2026 a 01/11/2026, assinatura gerida pela Vercel. Documentação oficial consultada informa 5 GB de transferência pública por projeto/mês no Free, com renovação por período. Cota atingida é transferência; não há evidência de esgotamento de armazenamento ou processamento.

Código atual e fonte da última publicação conferidos: liveUpdates abre SSE, busca /api/app a cada abertura/reabertura, usa fallback a cada 5 segundos e não suspende ao ocultar a aba. SSE dura 24 segundos e consulta somente revisão a cada 1.5 segundo. Já /api/app lê o JSON completo de pedss.workspace do banco antes da projeção autorizada. Isso causa tráfego repetido mesmo sem pedidos; múltiplas abas e ambiente remoto local compartilham produção. É um mecanismo concreto de desperdício e provável contribuinte, mas não há medição histórica por consulta para atribuir todos os 5.83 GB a ele. Não confundir consulta pequena de revisão com leitura do JSON completo. Fotos geradas recentemente são arquivos estáticos locais ainda não publicados, sem gravação no Neon.

Diagnóstico anterior permanece: GET /api/app retorna 503 nos dois domínios e SQL recusa conexão com 53000/quota. Não houve recuperação, mudança de plano, cobrança, mutação de dados, migração, commit ou deploy. Acesso ao painel foi somente leitura. Nenhuma alteração de código; gate anterior de 203 testes não repetido para investigação e documentação. Raia única do principal.

Pendências: eliminar releituras completas sem mudança, limitar dados consultados por loja/fluxo, revisar reconexão/fallback e abas ocultas, separar ambientes e medir bytes/consultas. A landing deve poder abrir sem depender do banco. Otimização não restitui transferência já consumida; liberação depende da renovação da cota ou de alteração de plano autorizada pelo usuário. Revalidar conexão, API e navegador depois da liberação. Sem decisão de contratação nesta etapa.

## Fotografias ilustrativas dos sabores de pizza — 27/10/2026

Geradas 14 imagens fotorealistas com a ferramenta nativa image_gen, em vista superior, fundo transparente e enquadramento uniforme: mussarela, calabresa, frango/requeijão, margherita, portuguesa, quatro queijos, bacon/milho, pepperoni, toscana, atum, carne seca/requeijão, vegetariana, chocolate/morango e banana/canela. Originais em design/pizzas/originals; prompts completos em design/pizzas/generation.json. WebP RGBA 768px com alpha preservado em public/images/pizzas (221–259KB, 3.422.474 bytes no total); manifesto pizzaPhotos.json e script de otimização incluídos. Sem serviço/API de geração na navegação nem novas bibliotecas.

PizzaPreview combina setores das fotos e da própria borda fotografada; removidos desenhos vetoriais de coberturas/borda. Foto cadastrada no sabor permanece prioritária; falha tenta imagem ilustrativa e depois área neutra. Cards e miniaturas de Pizza sem foto própria usam a imagem do sabor; fotos próprias preservadas. Composição identificada como ilustrativa. Hero, regras de preço, ingredientes cadastrados e fluxo de cards/chamada separados preservados.

Gate npm run check aprovado: 203 testes, 105 critérios, lint/tipos/camadas/API/build. PIZZA-PHOTO-01/02 conferem 14 fontes distintas, arquivos/hash/WebP, limite de tamanho e prioridade das fotos próprias; testes de UI cobrem setores com três fotos e fallback. Script validou transparência e igualdade de alpha nos 14 WebP. Navegador 1280px e 390px confirmou montagem de mussarela/calabresa/frango com fontes distintas, sem overflow e sem erros observados no console. Catálogo com 14 cards, 14 fontes distintas e 10 recortes já decodificados na leitura (demais sob lazy loading). Capturas pizza-photoreal-{desktop,mobile}.png; gate em .quality/pizza-photoreal-gate.log. Captura desktop inicial suavizada pelo redimensionamento da superfície do navegador; nova aba na resolução correta confirmou captura nítida, sem filtros de blur no conteúdo. Sem celular físico, teste de rede móvel lenta ou nova compra.

Raia única, sem delegação, commit, GitHub, Vercel, gravação em banco ou alteração de fotos reais de lojas. Prévia isolada 5179 preservada para revisão. Imagens representam sabores e não produtos reais fotografados; detalhes em docs/PIZZA-PHOTOGRAPHY.md. Publicação continua pendente de pedido.

## Cardápio completo e montador separado — 27/10/2026

Delivery mantém cards dos sabores individuais, com chamada independente Quer mais de um sabor? Monte sua pizza. Campo opcional pizza.menuPlacement permite deixar o produto montador somente nessa chamada; valor ausente mantém cards legados. Categoria, busca e contagem usam o catálogo visível; o montador continua selecionável pelo ID real e segue os cálculos existentes. Chamada aparece apenas para montadores disponíveis com combinações de mais de um sabor e respeita loja fechada. Vários montadores recebem botões identificados por nome. Sem mudança na hero, fotos ou layout dos cards.

Prévia HTTP isolada 5179 agora contém os 14 sabores individuais e um montador separado com tabela desses sabores (preços de referência da prévia). Somente memória; nenhum catálogo/configuração/pedido real alterado. Dados de teste antigos reiniciados ao recarregar o helper. Login master real continua no ambiente 5178; publicação conjunta API/interface ainda necessária antes de configurar dados reais.

Gate npm run check aprovado: 201 testes, 105 critérios, lint/tipos/camadas/API/build. PIZZA-MENU-01 comprova cards individuais, ausência do card genérico separado, abertura/retorno do montador e ocultação quando indisponível. Navegador 1280 px e 390 px confirmou 14 cards e zero overflow; pedido individual Calabresa abre detalhe simples sem prévia do montador. Chamada abre composição visual e retorna aos cards. Console sem erros observados no teste móvel; capturas .quality/pizza-full-menu-{desktop,mobile}.png e log pizza-full-menu-gate.log. Sem aparelho físico ou nova publicação. Aviso model-viewer preexistente.

Raia única do principal, sem delegação, commit, GitHub, Vercel ou migração/banco. Prévia 5179 e aba do cardápio mantidas para revisão. Guia docs/PIZZA-BUILDER.md atualizado.

## Montagem visual de pizzas — 27/10/2026

Prévia SVG da pizza inteira dividida em 1–4 partes iguais, preenchidas conforme os sabores. Escolha explícita da quantidade, limitada pelo tamanho e pela disponibilidade de sabores; precisa completar exatamente a quantidade escolhida. Trocar tamanho reinicia a montagem e reduzir a quantidade mantém apenas os primeiros sabores. flavorCount opcional validado no domínio/servidor; sacolas legadas preservadas.

Aparência por sabor automática pelo nome ou configurável no painel (queijo, calabresa, frango, vegetais, chocolate, banana). Foto vista de cima opcional com recorte por setor e retorno à ilustração em falha. Fotos reaproveitadas ao copiar sabores; revisão pelo gestor necessária. Prévia identificada como ilustrativa, sem geração por IA nem novas bibliotecas. Sem alteração da hero ou dos cards. Modal mais amplo no desktop, prévia compacta fixa durante escolhas no celular, preço e botão Voltar ao cardápio acessíveis durante rolagem.

Gate npm run check aprovado: 200 testes, 105 critérios, lint/tipos/camadas/API/build; aviso preexistente de model-viewer. Novos testes cobrem três setores/composição acessível, quantidade exata, redução de partes, retorno aos cards, foto com falha e compatibilidade do domínio. Navegador 1280 px e 390 px: três sabores, prévia visível durante seleção, sem overflow; aparência salva e reaberta no admin. Pedido fictício passou pela API e acompanhamento com três frações e total de R$ 60,00. Console sem erros observados. Capturas .quality/pizza-visual-{desktop,mobile,admin}.png; gate em pizza-visual-gate.log. Sem aparelho físico, foto própria real carregada pelo navegador ou teste de carga.

Raia única, sem delegação, commit, GitHub, Vercel, migração SQL ou alteração de cadastros reais. QA HTTP isolado em memória reiniciado e mantido na porta 5179; login master pertence ao ambiente real 5178, não à prévia. Publicar API e interface juntas antes de ativar em dados reais compartilhados com produção. Limites anteriores de configuração por produto, planilhas, ficha técnica e adicionais por metade permanecem. Guia atualizado: docs/PIZZA-BUILDER.md.

## Montador de pizza e configuração no painel — 27/10/2026

Montador opt-in no produto Pizza, configurável no painel: tamanhos/diâmetro/fatias/limite de 1 a 4 sabores, preços por sabor e tamanho, disponibilidade, massas e bordas exclusivas. Cobrança pelo maior valor, média em partes iguais arredondada ao centavo ou soma. Massa/borda/adicionais somados por unidade. Preço mínimo derivado no servidor e indicação A partir de. Sem dependência nova ou alteração da hero/cards existentes.

Domínio compartilhado e API recalculam IDs/opções/valores; checkout revalida catálogo e mantém pagamento separado. Sacola distingue montagens; pedido preserva resumo da composição, exibido na sacola/painel/consulta/WhatsApp. Cardápio presencial permanece apenas consulta, com tabela de opções. Campos opcionais preservam legado; reimportação no mesmo produto mantém configuração e preço calculado. Custos das combinações desconhecidos, sem margem inventada.

Gate npm run check aprovado: 197 testes, 105 critérios, lint/tipos/camadas/API/build. Testes novos cobrem três regras, centavos, até 4 sabores, opções indisponíveis, autorização, preço adulterado, revalidação, composição histórica e reimportação. A espera do teste TRIAL-UI-01 após PBKDF2 passou de 1 s para 5 s após falhas reproduzidas só sob disputa de CPU; assertivas e segurança preservadas. Aviso preexistente de bundle model-viewer permanece.

QA HTTP com backend em memória sem env/banco: montagem enviada até acompanhamento/painel; alteração de preço/regra salva e refletida no público, pedido anterior preservado. Desktop de 1280 px e celular de 390 px; matriz administrativa com rolagem interna após corrigir min-width. Console sem erros observados. Capturas .quality/pizza-builder-{customer,mobile,admin,admin-mobile}.png; log pizza-builder-gate.log. Sem celular físico, impressão térmica ou teste de carga.

Raia única do principal, sem delegação, commit, GitHub, Vercel, migração SQL ou escrita de teste no Neon. Servidor local atualizado na porta 5178; prévia 5179 isolada mantida para revisão. Loja real Cia permanece com 14 produtos legados intactos. Publicar interface e API juntas antes de configurar dados reais: ambiente local remoto compartilha banco com produção antiga.

Limites: configuração independente por produto; copiar sabores cria cópia, sem sincronização. Planilha não transporta regras para outra loja; usar painel. Frações desiguais, adicionais por metade, ficha técnica e regras doce/salgada ficam para evolução. Instruções em docs/PIZZA-BUILDER.md.

## Cor apenas no círculo do produto — 26/10/2026

Conforme esclarecimento do usuário, cards voltaram ao fundo branco com borda neutra, inclusive ao passar o mouse. Somente a área arredondada atrás do produto mantém o tom da loja (24% da marca com branco). Botão Escolher escuro, fotos, movimento, ausência do selo e bloco de instruções suave preservados. Regra compartilhada para todos os perfis; alteração restrita a StorefrontBody.css.

Gate npm run check concluído com exit_code0:185 testes e105 critérios aprovados,lint/tipos/camadas/API/build. Navegador confirmou fundo rgb(255,255,255),borda neutra e círculo pêssego na Cia, em desktop1265px e consulta de estilos em304px. Console sem erros observados. Captura .quality/store-card-white-circle-desktop.png; log store-card-white-circle-gate.log. Sem novo teste para mudança CSS simples ou aparelho físico.

Raia única,sem gravação de dados,commit/GitHub/Vercel. Alteração local na porta5178; aba e servidor do usuário preservados.

## Itens do cardápio sem selo sobre a foto — 26/10/2026

Removido o selo visual Imagem ilustrativa do ProductCutout compartilhado e excluído seu CSS sem uso. Vale para delivery, cardápio presencial e imagens que reutilizam o componente. Fotos, movimento, cores e cadastros preservados; alt acessível das imagens genéricas mantido. Nota da hero e observações dos detalhes não alteradas.

Gate confirmado com exit_code=0 e relatório success=true:185 testes aprovados,zero falhas,105 critérios e build aprovado. PHOTO-01 (nove categorias) e PHOTO-02 adaptados para queryByText(...).not.toBeInTheDocument() e confirmados passed no relatório final. Navegador:delivery e presencial da Cia da Pizza com14 imagens e zero elementos product-illustrative-label;console sem erros observados. Evidências .quality/menu-no-photo-badge-{delivery,presencial}.png e menu-no-photo-badge-gate.log. Sem aparelho físico.

Raia única,revisão local sem commit/GitHub/Vercel ou escrita no banco. Servidor5178 e aba do usuário mantidos.

## Cards com tom da loja e Escolher padronizado — 26/10/2026

Após retorno do usuário de que os cards ficaram sem cor e o botão diferente, ajustado o refinamento anterior: superfície usa8% da cor da loja com branco, borda18% com neutro e área da foto24% com branco. Regra compartilhada para todas as lojas/segmentos, sem retornar à saturação anterior de42%. Textos continuam neutros e legíveis. Escolher usa botão escuro arredondado com texto branco e seta suavemente tingida pela marca; não depende do contraste visual da cor principal. Estados desabilitados permanecem neutros e inoperantes.

Alteração restrita a StorefrontBody.css. Hero, fotos, movimento, layout e bloco Seu pedido.Sem complicar. com fundo suave14% mantidos. Gate npm run check aprovado:185 testes/105 critérios,lint/tipos/camadas/API/build, sem novos testes para ajuste CSS. Browser1265px e304px confirmou tons e botão consistente, sem overflow. Escolher abriu o detalhe de Mussarela; fechado sem adicionar/enviar pedido. Console sem erros observados. Capturas .quality/store-card-color-{desktop,mobile}.png e log store-card-color-gate.log. Sem aparelho físico ou nova rodada de todas as paletas extremas; teste numérico de contraste existente passou.

Cia da Pizza observada aberta com taxa configurada pelo usuário; nenhuma configuração ou dado foi modificado neste trabalho. Raia única,sem commit/GitHub/Vercel. Revisão local na porta5178, instância e aba do usuário preservadas.

## Bloco de instruções em tom suave da marca — 26/10/2026

Seu pedido.Sem complicar. passou a usar14% da cor da loja misturada com branco e texto escuro #252b27. Regra compartilhada .store-how vale para todos os segmentos/estabelecimentos, sem depender da cor original verde. Layout,textos,links,hero,cards e animações preservados. Nenhuma configuração da Cia ou banco alterada; atendimento/frete continuam sob configuração do usuário.

Gate npm run check aprovado:185 testes/25 arquivos,105 critérios,lint/tipos/camadas/API/build. Sem novos testes para alteração CSS simples. Navegador desktop1265px confirmou fundo pêssego claro na Cia da Pizza. Prévia HTTP isolada em memória confirmou azul,laranja,roxo,verde,branco e preto com fundo claro e texto escuro; valores calculados em .quality/store-how-soft-palettes.json. Screenshot .quality/store-how-soft-desktop.png e log store-how-soft-gate.log. Mobile não reinspecionado nesta revisão de cores; mesma regra compartilhada sem alteração de layout. Servidor temporário5179 encerrado; local5178 mantido.

Raia única,sem commit/GitHub/Vercel. Revisão disponível apenas no código local; publicação anterior e cadastro existente de14 pizzas preservados.

## Paleta do cardápio equilibrada para outras cores — 26/10/2026

Cards do delivery com fundo branco e borda neutra em desktop/celular, sem tingir toda a superfície com a cor da loja. Área da foto recebe gradiente cinza claro com apenas8% de tonalidade da marca, em vez de24–42%; descrições/títulos/preços mais neutros e legíveis. Cor concentrada em categorias e botões ativos; bordas visíveis também com marca branca. Botões desabilitados continuam desabilitados, com superfície cinza e opacity1 em vez de lavar a cor pela transparência. Layout, hero, fotos, movimento e comportamento preservados.

storeColors mantém a cor escolhida e escurece o primeiro plano quando necessário para contraste mínimo4,5:1; corrige tons médios nos quais o texto escuro anterior também falhava. Teste COLOR-01 cobre a paleta laranja/azul/roxo/verde/amarelo/branco/preto e os256 níveis de cinza, além do texto de apoio. Gate npm run check aprovado:185 testes/25 arquivos,105 critérios,lint/tipos/camadas/API/build. Aviso preexistente de model-viewer permanece.

QA com lojas fictícias em servidor HTTP isolado em memória confirmou cards brancos e botões com primeiro plano claro/escuro em seis cores, sem modificar cores reais ou banco. Browser1265px e304px; Cia da Pizza local confirmou aparência e estado fechado preservado. Capturas .quality/store-palette-{blue,orange,purple,green,white,black}-desktop.png e store-palette-orange-mobile.png; metadados em store-palette-browser.json. Console sem erros observados. Sem aparelho físico ou medição formal de todas as combinações dos demais componentes da aplicação.

Servidor QA5179 e suas abas encerrados; servidor local5178 e prévia da Cia preservados. Raia única,sem commit/GitHub/deploy ou gravação de dados. Cardápio de14 pizzas já cadastrado permanece intacto. Produção ainda no commit c6d8157; este refinamento e a nova pizza da hero permanecem locais.

## Cardápio inicial da Cia da Pizza — 26/10/2026

Cadastro solicitado pelo usuário concluído na loja existente cia-da-pizza, ID imutável b8b27514-5d20-4bfd-adff-106639a6364d. Catálogo anterior vazio;14 pizzas criadas com SKU/ID únicos, sem sobrescrever produtos ou alterar outras lojas. Transação com row lock pelo repositório PostgreSQL existente, validação productSchema/workspaceSchema, guardas de catálogo vazio/identidade e comparação de todo o estado para limitar a mudança aos produtos da loja. Backup de catálogo/configuração e plano/resultados sanitizados em .quality/cia-pizza-menu-{before,preview,result}.json. Sem criação de sessão, credencial, migração ou alteração de autenticação. Autorização: pedido direto de cadastro nesta conversa.

Sabores:Mussarela,Calabresa,Margherita,Portuguesa,Frango com Requeijão,Quatro Queijos,Bacon com Milho,Pepperoni,Toscana,Atum,Carne Seca com Requeijão,Vegetariana,Chocolate com Morango eBanana com Canela. Preços de referência comunicados ao usuário:R$34,90–54,90 para média30cm/6fatias,opção grande35cm/8fatias +R$10,borda recheada +R$8 (chocolate nas doces,requeijão nas salgadas). Descrições,ingredientes removíveis e adicionais cadastrados. Sem custo inventado, destaque ou fotos próprias: imagens de categoria mantidas com identificação ilustrativa. Valores em centavos.

A instância local5178 usa o banco existente:cadastro também aparece no site publicado, como informado antes de gravar. Verificação pós-gravação confirmou IDs e conteúdo;API pública confirmou14 itens na loja correta. Nenhuma mudança de preço de outro catálogo, pedido, pagamento, atendimento, entrega ou retirada. Loja permaneceu fechada/em configuração, sem habilitar vendas ou enviar pedidos. Nova imagem da hero permanece revisão de código local, separada deste cadastro de dados.

Navegador confirmou14 sabores na página já aberta sem refresh, preço inicial R$34,90 e opções de tamanho/borda no detalhe de Calabresa. Gate npm run check aprovado:184 testes/104 critérios,lint/tipos/camadas/API/build; aviso model-viewer preexistente. Sem novos testes para dados de cadastro. Console sem erros observados;capturas cia-pizza-menu-{desktop,mobile}.png. Sem dispositivo físico ou compra real. Servidor5178 e prévia mantidos. Raia única;sem commit/GitHub/deploy nesta etapa.

## Nova pizza da hero e Cia da Pizza local — 26/10/2026

Substituída somente a imagem ilustrativa do modelo de pizzaria por hero-pizza-v2.png, gerada pela ferramenta nativa image_gen: pizza inteira de calabresa, mussarela gratinada, cebola roxa e manjericão, borda mais delicada e fundo transparente. Original RGBA1254×1254 preservado, sem ampliação; derivados WebP640/1254 com alpha conferido e cache por hash (167990/544844 bytes). Alt/prévia/manifesto e script de reconstrução atualizados. Hero/layout/cor/animação e fotos do catálogo preservados; outras categorias sem mudanças. Prompt e origem registrados em docs/HERO-SEGMENT-ASSETS.md.

Cia da Pizza disponível em http://127.0.0.1:5178/store/cia-da-pizza, instância npm run dev -- --host 127.0.0.1 --port 5178 --strictPort em modo remoto com configuração existente. Porta5176 estava ocupada por demonstração sem esse cadastro; instância anterior preservada. Sessão local97304 mantida para acompanhamento. API existente retornou a própria Cia da pizza, sem criar/salvar loja, produto, pedido ou alterar banco/esquema. Somente leitura dos dados públicos existentes.

Gate npm run check aprovado:184 testes/24 arquivos,104 critérios,lint/tipos/camadas/API/build; aviso preexistente de model-viewer permanece. Browser1265px e304px confirmou nova imagem WebP carregada, transparência e movimento ativos, sem overflow ou erros de console. Evidências .quality/pizza-hero-{before,desktop,mobile}.png e pizza-hero-gate.log. Sem aparelho físico. Raia única; nova revisão local, sem commit, GitHub ou Vercel. Produção permanece c6d8157 até nova publicação solicitada.

## Operação, carrinho e frete publicados — 26/10/2026

Envio e publicação solicitados pelo usuário concluídos. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit c6d81575a4470c93240db9858fa2273c71c295c1, árvore 51b08aaaa9c31467cd4f3bbff4549f01da0e06e8: 44 arquivos alterados/novos (14 novos), 261 arquivos totais conferidos por hash. Main preservada em 971e24b0263dcfe87e9f867d185c5a9b6bc30e2e, atualização normal com expected SHA. Inclui carrinho somente com ícone/contador, sincronização automática, ações rápidas de pedidos, acompanhamento sem status de pagamento, despesas no Financeiro e módulo Frete.

Gate local repetido e aprovado:184 testes/24 arquivos,104 critérios,lint/tipos/camadas/API/build. GitHub Quality40375817044/verify success. Snapshot isolado igual ao commit;232 arquivos aplicáveis enviados à Vercel, sem env/segredos, plan/log/.quality ou capturas. Conector Vercel retornou403 para a equipe; CLI59.16 já autenticada confirmou Diego Projects/Pedss e concluiu publicação sem alterar acesso/proteção/variáveis.

Deployment dpl_12nxKfE8uSQvBMvj8EfLX4gm4Zdp, sourceCommit c6d81575a4470c93240db9858fa2273c71c295c1, READY em aproximadamente 10s, preparado com --skip-domain e validado antes da promoção para https://pedss.vercel.app. Anterior dpl_GWJ1HFPfryYgaPQnLHbZxnfLuM5M preservado para rollback. Cliente, API e nova api/updates publicados juntos. SSE com Neon respondeu200 text/event-stream, connected e heartbeats. Catálogo antes/staging/depois idêntico:3 lojas,28 produtos e configurações preservados. Sem migração, cadastro, pedido ou alteração de pagamento de produção.

Navegador público confirmou catálogo e carrinho compacto:adicionar somente à sacola local do navegador, abrir checkout e remover item; estado original vazio restaurado, nenhum pedido enviado. Console sem erros e consulta dos logs de erro do deployment (15m) vazia. Drains configurados:0; monitoramento contínuo não configurado por este trabalho. Fluxo autenticado de etapas/Financeiro/Frete coberto no QA HTTP isolado anterior, sem sessão de gestão de produção. Sem teste de carga, aparelho físico ou alteração real para provocar evento de pedido em produção.

Frete rodoviário permanece preparado conforme decisão do usuário; OPENROUTESERVICE_API_KEY não configurada nem modificada. Taxa fixa/áreas legadas disponíveis; não se declara cálculo real por km validado. Aviso de bundle model-viewer preexistente mantido. Evidências: .quality/operations-release-{state,integrity,staged-validation,production-validation}.json, operations-release-staged-stream.txt e operations-release-production-cart.png. Raia única; registros pós-publicação atualizados apenas localmente e manifesto GitHub representa o commit publicado.

## Carrinho compacto — 26/10/2026

Botão flutuante restrito ao ícone ShoppingCart e contador, sem rótulo, preço ou seta visíveis. Formato compacto arredondado, cor da loja, foco acessível e abertura do checkout preservados. Cálculo de subtotal exclusivo do rótulo removido. Raia única, revisão local sem commit/deploy. Gate npm run check aprovado (184 testes, 104 critérios); inspeção desktop/celular registrada em docs/QA.md. Pendências anteriores mantidas.

## Operação e frete — 26/10/2026

Resolvidos localmente: visibilidade da sacola, atualização automática de pedidos/dados, status de pagamento indevido no acompanhamento, acesso às etapas, despesas dentro do Financeiro e separação do Frete de Configurações. Gate aprovado com 184 testes/104 critérios; QA HTTP isolado desktop/celular concluído.

Pendências desta revisão:

- Usuário optou por deixar a integração por km preparada: configurar OPENROUTESERVICE_API_KEY no servidor e validar rota real antes de ativar esse modo. Sem chave, entrega por distância é recusada com mensagem clara; não inventa valor. Taxa fixa/áreas disponíveis. CEP representa coordenadas aproximadas, não o número do imóvel.
- Código ainda local, sem envio/deploy nesta etapa; API e cliente/SSE precisam ser publicados juntos. Teste SSE com Neon/Vercel real e aparelho físico ainda não realizado.
- SSE verifica revisão a cada 1,5 s por conexão, com fallback de 5 s. Avaliar broker/assinaturas compartilhadas e modelo de persistência por entidade para escala maior; não há serviço externo de realtime novo.
- Mantido aviso preexistente de bundle model-viewer maior que 500 kB.

Autorização de BrasilAPI/ORS recebida; detalhes de payloads, chave e cotação em docs/SHIPPING.md. Nenhum banco, segredo ou dado de produção alterado.

## Trial, planos e landing publicados na Vercel — 26/10/2026

Concluído a pedido do usuário: Pedss na equipe Diego Projects (prj_wQ4WydtpnP5OS36ei515W9GpoVxV / team_31LF1BKscdWn5gGQQgAxp4c1). Deployment dpl_GWJ1HFPfryYgaPQnLHbZxnfLuM5M, sourceCommit39b3c8c0b195f8cbae36b1a6fb4b937aaa8cdf71, sourceBranch codex/pedss-2026-10-22; build de produção READY e promovido a https://pedss.vercel.app. Host pedss-c6wo0gyhy-diegos-projects-2f58d897.vercel.app; anterior dpl_HxADhZp1JEwFuWUNWd9EyBXoEuXY preservado para rollback.

Snapshot isolado dos247 arquivos do commit conferido por hash;221 arquivos aplicáveis ao deploy, sem env/segredos, registros locais, capturas ou matrizes design. Conector retornou403 para o escopo da equipe; CLI59.16 autenticada confirmou proprietário/projeto e concluiu publicação, sem alterar conexão, permissões, variáveis ou proteção. Produção preparada com --skip-domain, validada antes de promover. Gate do mesmo código aprovado (167 testes,87 critérios) e GitHub Quality40341700324 success; nenhum código alterado neste turno. Build da Vercel aprovado (READY em7s; aviso de bundle model-viewer preexistente).

API antes/staging/depois preservou integralmente as três lojas,28 produtos e configurações; serverNow presente na nova versão. Navegador público confirmou landing/seção trial, CTA para /cadastro, planos Essencial199,90/Rede599,90 e formulário remoto abrindo sem aviso local. Zero erros no console e consulta de logs de erro do novo deployment vazia (janela15m). Sem criação de conta, pedido, cobrança, alteração de catálogo ou migração nesta publicação. Expiração e cadastro completo já cobertos por testes locais de domínio/API/UI; sem novo cadastro real no Neon ou teste em aparelho físico. Drains/monitoramento contínuo não reinspecionados.

Evidências locais: .quality/trial-release-production-{landing,signup}.png, trial-release-staged-validation.json, trial-release-production-inspect.json, trial-release-{before,staged,production}-api.json e trial-release-runtime-errors.jsonl. Registros pós-publicação atualizados apenas localmente; manifesto GitHub continua representando o commit publicado. Raia única, sem delegação.

## Trial, planos e landing enviados ao GitHub — 26/10/2026

Enviado a pedido do usuário para DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22. Commit 39b3c8c0b195f8cbae36b1a6fb4b937aaa8cdf71, árvore d47dfe430227db64b4ce609519fd659b7ccb8f33; 36 arquivos novos/alterados (7 novos), 247 arquivos totais conferidos por hash. Atualização normal com expected SHA, sem force; main 971e24b0263dcfe87e9f867d185c5a9b6bc30e2e preservada. Inclui cadastro trial de7 dias, expiração/ativação, configurações existentes, planos Essencial/Rede e faixa com ícones Peds's. Credenciais, plan/log/.quality e capturas permanecem locais.

Gate do código enviado aprovado:167 testes/21 arquivos,87 critérios,lint/tipos/camadas/API/build; QA de navegador já concluído. GitHub Quality40341700324 concluiu success para o mesmo commit. Sem deploy Vercel ou acesso/gravação ao banco. A produção permanece no commit080c05b, anterior a estas alterações. Raia única, sem delegação.

## Cadastro público com teste de 7 dias — 26/10/2026

Cadastro trial implementado para uma loja por gestor, com sete dias completos, expiração no servidor e ativação manual pela central. Ainda sem cobrança/assinaturas automáticas, confirmação de e-mail, envio ou recuperação de senha por e-mail; controles adicionais contra recadastro por pessoas diferentes não incluídos. Limitação de cadastro porIP existente aplicada. Rede e vínculo de várias lojas por proprietário continuam no roadmap comercial. Publicação do trial pendente; nenhum acesso ao banco de produção nesta revisão.

## Faixa original com ícones da marca — 26/10/2026

Faixa restaurada com ícones atuais e conferida localmente em desktop/celular320. Sem aparelho físico ou publicação desta revisão. Demais lacunas funcionais e comerciais preservadas.

## Faixa de identidade da landing — 26/10/2026

Faixa de identidade refinada e validada localmente em desktop e celular emulado320px. Sem publicação desta revisão ou teste em aparelho físico. Pendências de assinaturas/limite comercial e demais lacunas preservadas.

## Projeto local disponível — 26/10/2026

Servidor local confirmado e landing aberta em http://127.0.0.1:5176/. Pendências funcionais e de publicação dos planos permanecem as registradas anteriormente.

## Planos Essencial e Rede — 26/10/2026

Ofertas da landing e da central atualizadas; plano gratuito removido. O limite de5 lojas do Rede é uma condição anunciada no catálogo de referência, ainda sem backend de assinaturas ou bloqueio automático por plano. Avisos existentes mantidos. Publicação desta revisão e validação em aparelho físico pendentes; demais lacunas preservadas.

## Cardápios publicados no GitHub e Vercel — 24/10/2026

Concluído a pedido do usuário: novo cardápio presencial de consulta, fotos maiores e identidade da loja, com animação permanente nos dois cardápios e detalhes. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit080c05b7e78e1abcd5309ce7a2763e756bf53cbb, árvorebc44496d8bb5ff910d177b382a4eced98f6f7fd9;240 arquivos conferidos por hash,14 alterações incluindo2 exclusões. Main preservada. GitHub Quality40116120365 success; gate local156 testes/76 critérios já aprovado.

Vercel Diego Projects/Pedss prj_wQ4WydtpnP5OS36ei515W9GpoVxV: deployment dpl_HxADhZp1JEwFuWUNWd9EyBXoEuXY, sourceCommit080c05b, promovido a https://pedss.vercel.app. Anterior dpl_2js9xeATkq1n7RgmnsHBrYdBpe47 preservado. Staging READY antes de promover; cinco arquivos compilados (JS/CSS dos cardápios e entrada) idênticos ao build local por SHA256. Catálogo antes/staging/depois idêntico:3 lojas,28 produtos e configurações preservados. Sem migração ou gravação de cadastros/pedidos; proteção e variáveis mantidas.

Navegador público confirmou cardápio presencial desktop e celular390, fotos visíveis e movimento sincronizado sem pausa; detalhes informativos sem compra. Delivery e personalização igualmente animados sem pausa, modais abrindo/fechando; nenhum pedido enviado. Zero erros no console, sem overflow no presencial verificado. Capturas .quality/menu-release-production-{desktop,mobile}.png e menu-release-delivery-production.png. Sem teste em aparelho físico/Web Vitals ou painéis autenticados neste deploy. Sem mudança de código durante a publicação. Registros pós-publicação atualizados somente localmente; manifesto representa o commit publicado.

## Movimento permanente no delivery — 24/10/2026

Animação permanente implementada nos dois cardápios, incluindo detalhes/personalização. Validada localmente; publicação e avaliação em aparelho físico continuam pendentes. Demais lacunas de produção preservadas.

## Movimento automático no cardápio presencial — 24/10/2026

Cardápio presencial com movimento automático e sem pausa implementado localmente; publicação e aparelho físico seguem pendentes. As demais lacunas registradas permanecem.

## Refinamento visual do cardápio presencial — 24/10/2026

Refinamento visual do cardápio presencial disponível localmente. Fotos/identidade/detalhes conferidos no navegador desktop e celular emulado; avaliação em aparelho físico e publicação desta revisão permanecem pendentes. Demais lacunas de produção anteriores preservadas.

## Cardápio presencial como vitrine — 24/10/2026

Vitrine presencial revisada e conferida no navegador local. Não há pedido online neste modo: detalhes, ingredientes e adicionais são informativos. Pendente somente publicação desta revisão quando solicitada; aparelho físico e teste remoto desta revisão não realizados. As demais lacunas de lançamento permanecem conforme registros anteriores.

## Execução local — 24/10/2026

Servidor iniciado por solicitação do usuário com npm run dev, host127.0.0.1/porta5176, strictPort e VITE_RUNTIME_MODE=local, sessão39153. Navegador abriu a landing Peds's e a aba foi mantida. Sem mudança de código, banco, publicação ou commit; gate não repetido por ser somente inicialização. Registros anteriores de QA e pendências funcionais permanecem válidos. Raia única.

## Identidade completa publicada na Vercel — 23/10/2026

Concluído a pedido do usuário: deployment dpl_2js9xeATkq1n7RgmnsHBrYdBpe47 publicado e promovido a https://pedss.vercel.app, no projeto Pedss prj_wQ4WydtpnP5OS36ei515W9GpoVxV/equipe Diego Projects team_31LF1BKscdWn5gGQQgAxp4c1. Código e assets conferidos com os 242 arquivos do commit c2969b021d41b490f927c700d9705d41b35c4816, sem divergências antes do envio. Inclui landing/mascotes animados, nova logo/favicon e identidade no cliente/login/painéis. Matrizes design/brand e registros privados excluídos do deploy. Deployment anterior dpl_AjdsqXxKhmMn8QQA9wUwhX66pyNw preservado para recuperação.

Gate do mesmo commit já aprovado (156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build) e GitHub Quality40017665066 success; sem mudança de código para este deploy. Build da Vercel também aprovado. Staging com ambiente de produção validado antes de promover: API e HTML200, logo/mascotes640/960 image/webp200 e hashes iguais aos locais, título/favicon corretos. Catálogo comparado antes/staging/depois: mesmas três lojas, 28 produtos e configurações integralmente preservados. Domínio público confirmado READY no novo deployment e metadado sourceCommit correto.

Browser público desktop1440 e celular390 confirmou landing nova, quatro animações sem pausa, imagens carregadas ao entrar na área visível, FAQ, login conectado sem botões de demonstração e rodapé da loja com logo aprovada. Sem overflow nas views verificadas e zero erros de console. Painéis autenticados não acessados em produção; validados localmente e pelo código/build da mesma versão. Sem escrita de banco, migração, alteração de variáveis/proteções, credenciais ou novos pedidos/usuários. Conector Vercel retornou403; utilizada a CLI já autenticada com escopo explícito, sem mudar acesso ou exigir reconexão. Raia única.

Capturas peds-identity-production-{hero,body,login,client-mobile}.png. Não medidos Web Vitals/rede móvel/aparelho físico. Relatório privado em .quality/identity-release-state.json. Registros desta publicação atualizados localmente, sem novo commit automático; branch GitHub permanece c2969b0. Servidor local e prévia mantidos.

## Identidade Peds's consolidada para GitHub — 23/10/2026

Revisão solicitada pelo usuário para a branch existente codex/pedss-2026-10-22 de DiegoMicaelvs/pedss. Reúne logo/favicons verdes com apóstrofo, matrizes aprovadas, hero e corpo da landing com mascotes animados, marca compartilhada no cliente/login/painéis e documentação. Sem alteração de dependências, migrações ou credenciais; plan/log/.quality e capturas permanecem locais. Main preservada. GitHub e Vercel continuam independentes: este envio não publica as revisões locais na produção.

Gate npm run check repetido e aprovado no estado de código enviado: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Inspeções visuais registradas nas seções anteriores desta documentação; nenhuma mudança de UI durante o envio. A publicação usa commit descendente do último envio, com conferência de hashes e atualização normal da branch, sem force. Identificadores finais e acompanhamento do CI ficam no registro local .quality/github-published-state.json.

## Identidade Peds's no login e painéis — 23/10/2026

Concluído: Brand agora contém a única implementação da logo aprovada (mascote, apóstrofo e WebP verde); LandingBrand reexporta o mesmo componente para manter os consumidores públicos. Login e AdminShell usam Brand sem a antiga opção compact. Logo dimensionada para a barra lateral desktop e menu móvel, ícone da central usa o mascote, textos fixos de marca atualizados. Login recebeu painel lima com texto escuro, logo legível e mascote no lugar da chama. Nomes/configurações salvos da central e das lojas preservados, inclusive o nome legado Central Brasa quando configurado; não houve migração ou gravação de cadastros. Hero e animações da landing preservadas por hash.

Gate npm run check aprovado no código final: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Browser local em desktop1440 e mobile320 confirmou login, central e dashboard com WebP carregada/alt Peds's e ausência de brand-symbol. Menu móvel abre/fecha com logo e botão de fechar sem sobreposição. min-width do body ajustado apenas no login para não gerar os 15px de overflow herdado; largura útil305 agora scroll305. Fluxos, validação, avisos locais/remotos e autorização mantidos. QA usou botão Administrador da plataforma exclusivamente em modo de demonstração local, consultou os dois painéis e encerrou a sessão por Sair; login voltou sem Continuar como. Zero erros no console. Sem uso de senha, conta de produção, alteração de banco, dependência, publicação ou commit.

Capturas peds-admin-login-{desktop,mobile}.png, peds-admin-central-desktop.png, peds-admin-dashboard-desktop.png e peds-admin-sidebar-mobile.png. Sem conferência em aparelho físico nem login real remoto. Raia única; servidor local 127.0.0.1:5176 mantido.

## Logo aprovada nas páginas do cliente — 23/10/2026

Corrigido o uso da marca antiga no rodapé da loja. Storefront, DigitalMenu e Tracking agora reutilizam LandingBrand e a mesma WebP aprovada com mascote e apóstrofo da landing, inclusive nos estados de loja/cardápio não encontrados. Larguras específicas para rodapés, barra do QR code e acompanhamento, com tamanhos menores no celular. Texto do rodapé de acompanhamento atualizado para Peds's. Cabeçalho/identidade dos estabelecimentos, hero, produtos e autenticação preservados; Brand legado dos painéis/login não alterado neste escopo.

Gate npm run check aprovado no código final: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Browser local confirmou foto carregada, alt Peds's e ausência da marca antiga em loja, QR e acompanhamento; desktop1440 e celular320, links do rodapé preservados e zero erros. Corrigido min-width herdado do body somente no QR code, que antes gerava 15px de overflow quando havia barra de rolagem; largura útil305 agora scroll305. Captura peds-customer-footer-logo-desktop.png. Sem teste em aparelho físico. Raia única, sem nova dependência/asset, escrita de dados, commit ou publicação. Servidor 127.0.0.1:5176 mantido.

## Mascotes do corpo animados — 23/10/2026

Concluído: os três mascotes em personalização, FAQ e encerramento usam flutuação e rotação suave de ±2° em ciclo CSS de 6s, com início automático e sem controle de pausa. Deslocamento proporcional ao tamanho: 8/6/18px, mantendo a inclinação original de cada arte. Exceção específica ao reset de movimento reduzido segue o comportamento solicitado para a hero; não altera preferências do navegador. Somente Landing.css mudou na aplicação; hero, layout, imagens, links e dados preservados.

npm run check aprovado: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Browser desktop1440 e mobile320 confirmou as três animações running/6s e transformações diferentes entre leituras, sem botões de pausa, zero erros e largura útil305 sem overflow. Hero continua com peds-mascot-float. Capturas peds-body-mascots-animated-desktop.png e peds-body-mascots-animated-mobile.png. Sem aferição em aparelho físico. Raia única; servidor local 127.0.0.1:5176 mantido. Sem publicação, commit, dependência ou banco.

## Corpo da landing — 23/10/2026

Novo visual abaixo da hero concluído e validado localmente em 1440/900/390/320px. Hero preservada por hash, sem alteração dos dados ou fluxos operacionais. Gate aprovado (156 testes/76 critérios). Planos continuam referências demonstrativas, sem cobrança real; painel/cardápio desenhados na landing são ilustrações, com links para os fluxos existentes. Publicação e envio GitHub não solicitados nesta revisão. Sem aferição de Web Vitals, aparelho físico ou rede móvel real. Assets raster aprovados reutilizados, sem vetorização nova.

## Mascote com animação automática contínua — 23/10/2026

Concluído conforme pedido explícito: removidos botão, estado React e seletores de pausa da LandingHero. Foto e sombra começam animadas automaticamente e repetem em ciclo de 6s. Exceção CSS específica mantém esse comportamento também sob movimento reduzido, conforme escolha do usuário; não muda a preferência do navegador nem animações de outras páginas.

npm run check aprovado: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Browser após recarregar confirmou foto e sombra running, zero botões no palco e matrizes de transformação diferentes entre leituras; largura540 sem overflow e zero erros. Captura peds-mascot-auto-motion.png em desktop1280. Conferência em navegador, sem aparelho físico. Servidor local 127.0.0.1:5176 mantido. Sem publicação, commit, banco ou nova dependência; raia única.

## Hero com mascote — 23/10/2026

Implementada e validada localmente em desktop/tablet/320/390px; gate completo aprovado (156 testes/76 critérios). Não publicada nem enviada ao GitHub nesta iteração visual. Movimento reduzido é respeitado no início; usuário pode optar por animar. WebP 640/960px transparente, sem matriz vetorial. Não medidos aparelho físico, Web Vitals ou rede móvel real. Demais pendências funcionais e de produção seguem independentes.

## Identidade verde Peds's — 23/10/2026

Logo e favicon aprovados aplicados à landing e publicados em AjdsqXxKhmMn8QQA9wUwhX66pyNw. PNGs matriz e WebP/PNG/ICO derivados mantêm alpha. Arte ainda raster, sem matriz vetorial ou manual completo de identidade. Brand legado nos fluxos de gestão continua independente deste escopo; nomes de empresas/slugs/cadastro não alterados. GitHub ainda no commit1304f68 da correção anterior, pois não solicitado envio da nova marca. URL local testada é 127.0.0.1:5176; localhost da primeira tentativa expirou, sem mudar firewall, proxy ou proteção.

## Sincronização das correções no GitHub — 23/10/2026

Esta revisão reúne as correções das fotos ausentes e a otimização do carregamento na branch codex/pedss-2026-10-22 de DiegoMicaelvs/pedss, por solicitação explícita do usuário. Inclui fallback ilustrativo identificado, 26 imagens WebP responsivas, prioridades de carregamento, cache por hash, testes e documentação. Corresponde às alterações já validadas em produção no deployment 3QTU5zej65SGtYwwSDtWF5VVJdRS. Gate aprovado: 156 testes e 76 critérios. Registros locais, credenciais, capturas e dados de produção não fazem parte do envio. As notas anteriores sobre código ainda não enviado descrevem o estado em 22/10, antes desta sincronização.


## Peso e ordem de carregamento das fotos — 22/10/2026

Corrigidos: PNGs pesados das heroes/ilustrações agora têm WebP responsivo; primeira linha e detalhes carregam sem lazy, hero com prioridade alta, antecipação da rota e cache imutável com hash. Produção 3QTU5zej65SGtYwwSDtWF5VVJdRS. Pendências reais: não há medição de Web Vitals/4G ou aparelho físico; o primeiro render ainda depende da API/sessão e eventual início a frio do servidor/banco. Fotos próprias mantêm URLs e limites de upload existentes (até 500 KB por saída), sem serviço de transformação dinâmica/migração dos dados. Ajustes de fotos e performance ainda não enviados ao GitHub, conforme regra de não fazer commits automáticos.

## Ilustração para produtos sem foto — 22/10/2026

Produtos sem image/cutoutImage passam a usar imagem ilustrativa da categoria, com autorização explícita do usuário e identificação visível. Não equivale a foto individual nem promete ingredientes/apresentação exatos; bebidas/porções compartilham imagem genérica da categoria até cadastrar foto própria. Fotos reais continuam prioritárias; erros de foto própria não geram substituição silenciosa. Nenhuma mídia/URL foi gravada no catálogo. Produção corrigida em dpl_BHmigojRYL6chXV35fzjbi866wAF; código local ainda não enviado ao GitHub nesta correção (sem commit automático). Sem novas dependências/serviços.

## Versão local publicada — 22/10/2026

Produção pedss.vercel.app atualizada para dpl_AtrBthh7MY4f59khpqYrpm4KMjDd. Código desta versão na branch codex/pedss-2026-10-22 de DiegoMicaelvs/pedss; main com monorepo/Supabase preservada. Projeto Vercel continua sem Git conectado, então push nessa branch não publica automaticamente. Registros locais, credenciais e capturas não enviados ao GitHub. Catálogo real preservado: os 28 produtos da produção já estavam sem fotos antes deste deploy; fotos precisam ser cadastradas nessa loja. Não copiar armazenamento local de demonstração para produção sem migração autorizada. Sem teste autenticado de gestão/pedido real neste release; gate automatizado e fluxo público conferidos.

## Destino GitHub pendente — 22/10/2026

Produção Vercel confirmada como upload CLI da mesma base React/Vite/Neon local, publicado em 21/10 às 15:24 America/Bahia, sem repositório Git conectado. GitHub DiegoMicaelvs/pedss main contém outra estrutura (monorepo pnpm/Turbo/Supabase). Envio foi suspenso pelo usuário e nada foi alterado remotamente. Não sobrescrever main ou criar branch sem retomar a decisão do destino. Pasta local sem metadados Git; não existe histórico local para diff Git convencional.

## Selo colorido compartilhado — 22/10/2026

Todos os seis modelos de hero usam frase própria na cor da loja, sem identificação do tipo de estabelecimento. Fotos/cards/movimento mantidos. Conferência visual dos cinco modelos adicionais via prévia local com cores/preço ilustrativos, sem reconfigurar lojas reais. Não conferidas todas as lojas/cores ou aparelho físico; entrega local sem publicação.

## Chamada da hero de hambúrguer — 22/10/2026

Hamburgueria removido; Quando a fome pede mais mantido em selo centralizado na cor da loja. Ajuste local do template burger; demais segmentos não alterados visualmente. Não conferidas todas as lojas/cores ou aparelho físico. Sem publicação.

## Título colorido do cardápio — 22/10/2026

Novo destaque preenchido substitui sublinhado: título usa cor real e contraste calculado existentes, sem configurar loja. Hero e cards preservados. Conferência local em Burger Station; demais cores/lojas e aparelho físico não reinspecionados. Sem publicação.

## Título refinado do cardápio — 22/10/2026

Chamada do body delivery refinada com hierarquia tipográfica e sublinhado na cor da loja. Sem alteração funcional ou de conteúdo; hero/cards/movimento preservados. Entrega local. Não conferidas todas as cores/lojas ou aparelho físico; layout compartilhado e limitações anteriores mantidos.

## Cardápio sem lateral ou produto principal — 22/10/2026

Layout atual do delivery: categorias horizontais e cards iguais em duas colunas no desktop, inspirados no formato compacto do mobile. Fotos maiores e superfícies/CTAs na cor do estabelecimento; hero e movimento preservados. Versão com lateral/destaque abaixo foi substituída. Dados de favoritos e fotos não alterados. Foto legada do Brasa Original nesta Burger Station inclui papel/batatas junto ao recorte; apresentação não corrige conteúdo da mídia. QR/painel conservados. Entrega local sem publicação; não inspecionadas individualmente todas as lojas/cores nem aparelho físico.

## Composição atual do cardápio — 22/10/2026

Body do delivery agora usa navegação lateral/painéis horizontais, com destaque condicional ao primeiro produto já favorito. Não altera ordenação, cadastro ou faturamento. Mobile usa faixa de categorias e lista compacta; botão visual de seta mantém nome acessível. Hero aprovada e movimento sincronizado continuam independentes. Estágio anterior de grade uniforme foi substituído. QR e painel não redesenhados; entrega local sem publicação.

## Novo body da loja — 22/10/2026

Renovado visual abaixo da hero no delivery, com categorias roláveis, cards, informações de atendimento e passos de pedido. Estilos isolados em StorefrontBody.css, sem alterar animação/remoção de fundo nem dados/checkout. Fotos, preços e contagens são os existentes; nenhum ranking ou avaliação inventado. Cardápio presencial QR e painel conservam apresentação anterior. Limitações já documentadas de mídia/produção permanecem; entrega local ainda sem deploy.

## Heroes por segmento — 22/10/2026

Todos os seis modelos compartilham a composição colorida e animação contínua. Cada estabelecimento usa sua cor salva e sua imagem ilustrativa por tipo; cores da montagem de demonstração não são novas configurações padrão. Fotos do cardápio continuam independentes da hero. Preço inicial depende de produto disponível da categoria correspondente, sem valor fictício em loja real. Alterações locais ainda dependem de pedido de deploy para chegar à produção; nenhuma nova biblioteca/serviço necessário.

## Hero sempre animada — 22/10/2026

Por pedido explícito, hero não oferece pausa e começa animada. Preferência reduzida mantém movimento menor (5px/±0,2° em 9s); padrão 14px/±0,6° em 6s. Cardápio conserva pausa independente. Forma, preço e detalhes seguem a cor real de cada estabelecimento, sem verde forçado; fundo geral claro. Deu fome? e foto original mantidos. Entrega local, sem deploy. Limitações anteriores de foto ilustrativa, banco e publicação permanecem; relatos antigos de pausa na hero são históricos.

## Hero centralizada — 22/10/2026

Composição atual usa título panorâmico e produto central, sem painel externo. Hamburger mantém foto ilustrativa original e preço da categoria disponível; hero independente das fotos do cardápio. Nova disposição adapta os modelos já existentes sem gravar segmento/cor. Demo segue pizzaria; prévia de hambúrguer em /store/burger-station. Local, sem deploy. Registros sobre painel editorial são históricos. Nenhuma nova integração ou biblioteca necessária.

## Nova hero — 22/10/2026

Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. Aviso já existente do chunk opcional model-viewer permanece.

Composição editorial nova aplicada localmente à hero compartilhada; fotos próprias de cada segmento e cor da loja mantidas. Foto da hero continua ilustrativa, independente das fotos de produtos do cardápio. Preço inicial deriva somente dos produtos disponíveis da categoria correspondente. Não foi criada alegação de nota, quantidade de clientes ou promoção fictícia. Demo local permanece configurada como pizzaria; prévia de hamburgueria em /store/burger-station. Publicação em produção ainda depende de novo pedido de deploy.


## Coordenação do movimento — 22/10/2026

Sincronia usa a origem da timeline do documento via Web Animations API, aplicada quando cada foto fica pronta ou retoma. Não exige loop JavaScript por quadro. Navegadores sem getAnimations mantêm o CSS com fases por card removidas, mas não há garantia de alinhar cargas tardias nesse fallback. Movimento atual continua sendo flutuação/balanço, sem retomar giro 360°. Sem publicação.

## Suavização de movimento — 22/10/2026

Movimento atual é flutuação/balanço menor e mais lento, preservando o estado anterior após rollback. Não se retomou giro 360° ou geração 3D. Controle de pausa completo e variante reduzida permanecem. Fundo/cards não alterados. Entrega local, sem publicação.

## Acesso à sacola — 22/10/2026

Barra flutuante removida por pedido do usuário. Acesso existente em Meu pedido no cabeçalho permanece; não foi introduzida outra sobreposição ou navegação fixa. Checkout/contador preservados. Mudança local ainda sem deploy.

## Cards sem arco — 22/10/2026

Formato atual é retangular com cantos arredondados, fundo claro e borda simples; mantém o movimento existente após rollback. Registros abaixo sobre arco são históricos. Mudança de CSS local, sem processamento de foto ou publicação. Limitações de fotos legadas e demais funcionalidades permanecem.

## Acabamento claro atual — 22/10/2026

Fundo perolado e contorno duplo em arco implementados localmente, mantendo o movimento que foi restaurado no rollback. Não se retomou giro centrado nem spin 360°. Fotografias e dados permanecem os mesmos; painel é camada CSS, não fundo gravado na foto. Limites de recortes/legados abaixo permanecem. Sem publicação nesta etapa.

## Estado após rollback — 22/10/2026

Moldura escura em arco e flutuação lateral anteriores restauradas pelo pedido do usuário. Descrições abaixo de moldura clara/rotação centrada são históricas e foram superadas pelo rollback. Giro completo 360° no plano da foto chegou a ser aplicado e verificado transitoriamente após esclarecimento, mas também foi revertido neste corte; não é o comportamento atual. Limites de recortes legados e modelo 3D real permanecem. Sem publicação.

## Rotação da foto em fundo claro — 22/10/2026

Interface clara entregue; translação lateral/vertical removida. Movimento atual é rotação limitada da fotografia em perspectiva a partir do centro, sem reconstrução 3D ou visão traseira. Não é um giro 360° real. Continua disponível pausa total e variante reduzida. Não altera fotos cadastradas nem resolve recortes legados automaticamente; limites abaixo mantidos. Sem publicação nesta etapa.

## Vitrine em arco — 22/10/2026

Novo acabamento local substitui moldura clara anterior: painel escuro de arco, halo derivado da cor da loja e superfície clara para informações. O fundo pertence à interface; fotos continuam com alpha. Sem seletor novo de estilo, processamento de fotos, serviço externo ou publicação. Limites das fotos legadas/segmentação permanecem abaixo.

## Molduras dos produtos — 22/10/2026

Acabamento entregue localmente por CSS compartilhado entre categorias; cor acompanha o accent existente. Não há seletor adicional de estilo de moldura. Arquivos das fotos continuam transparentes; o painel suave pertence à interface. Limites da remoção de fundo e recortes legados permanecem os descritos abaixo. Sem deploy ou mudança de dados.

## Fotos de todas as categorias — 22/10/2026

Padrão unificado entregue em cards/detalhes delivery e presencial. Upload principal agora remove fundo em qualquer categoria, com prévia e confirmação. As três fotos demo apontadas foram preparadas por edição nativa e associadas somente às origens exatas; fotografias anteriores e dados preservados.

Não há migração automática das fotos personalizadas legadas nem processamento em lote de URLs/planilhas: gerar o recorte no cadastro e revisar. Sem recorte válido, estado neutro; não há retorno à foto opaca. U²-Net pode reter objetos/errar bordas, sobretudo vidro e cenas com várias embalagens; as edições preparadas da demo não representam garantia do algoritmo automático. Nome/descrição antigos da sobremesa preservados apesar da foto de taça já existente. Sem biblioteca adicional, integração de geração 3D ou publicação. Testes de UI com runtime remoto não equivalem a verificação deste código na produção atual.

## Balanço lateral mais visível — 22/10/2026

A pedido do usuário, movimento das fotos passou a ir efetivamente de um lado ao outro. Padrão: X -26 a +26px, Y 0 a -12px, rotação ±7°, ciclo 4s. Variante reduzida também ganhou deslocamento claro: X ±20px, Y até -8px, rotação ±5°, ciclo 5s. Sombra acompanha a mesma posição X, mudando escala/opacidade; fases dos cards -1,3/-2,6s. Espaço lateral móvel ampliado de 12 para 24px. Alterado somente ProductCutout.css; início em todas as lojas, pausa e hero preservados.

Gate npm run check aprovado com 127 testes/76 critérios, lint/tipos/camadas/build/API; sem testes novos para espelhar CSS. Browser mediu X de -19,9993 a +19,854px durante um ciclo na variante reduzida, com matriz de inclinação e sombra sincronizadas. Gravação real de 17 frames em docs/screenshots/catalog-side-to-side.gif; capturas catalog-sway-desktop.png e catalog-sway-mobile.png. Em viewport 390×844 (área útil 375px) não houve overflow horizontal; produto e detalhes couberam. Pausa no modal retornou fotos/sombras a none; retomada funcionou. Viewport restaurado. Sem fotos/dados de catálogo/sacola, hero, Neon, serviço externo, deploy ou commit alterados.

## Movimento automático em todas as lojas — 22/10/2026

Removida a condição de slug demo/runtime local. usePhotoMotion inicia ligado para todas as lojas no delivery e cardápio presencial, incluindo código do modo remoto, e mantém pausa compartilhada entre cards e detalhes. Nenhuma configuração da loja precisa ser gravada. Efeito padrão continua 12px/±1,5°/5,6s; com prefers-reduced-motion, fotografias usam variante menor/lenta de 4px/±0,5°/9s e sombra reduzida, ainda com pausa completa disponível. Hero e seu controle de movimento não foram alterados.

Gate npm run check aprovado: 127 testes/76 critérios, lint, tipos, camadas e build/API. Teste parametrizado cobre demo e slug não demo em local/remoto e runtime legado, com preferência reduzida, início automático, pausa e hero independente. Browser em localhost:5176/store/burger-station confirmou três fotos on, animações reduzidas de 9s e sombra, antes de qualquer clique no controle; hero permaneceu system/animation:none. Pausa nos detalhes parou todas as fotos/sombras e retomada funcionou. Captura docs/screenshots/catalog-all-stores.png. Imagens e dados existentes preservados, inclusive recortes antigos que ainda contenham acompanhamentos. Sem pedido/sacola, serviço externo, Neon, commit ou novo deploy. Modo remoto validado por testes de UI; produção publicada ainda não recebe esta alteração sem novo deploy.

## Correção do acesso novo à demo — 22/10/2026

Relato reproduzido em aba nova de localhost:5176/store/demo: fotos com alpha pronto, porém data-motion=off e animation:none. A preferência de redução iniciava pausada; o teste anterior havia ativado apenas o estado transitório da aba QA. Corrigido início automático exclusivamente para slug demo no runtime não remoto, abrangendo o modo local legado (mode ausente) e local explícito. Botão Pausar movimento continua funcionando; hero independente e redução de movimento das lojas remotas/outras lojas preservadas.

Verificação real sem clicar em Animar fotos: nova abertura/reload e /menu/demo mostraram três recortes on, catalog-product-float e catalog-product-shadow, com transformações diferentes entre quadros. Pausa retornou animation:none; nova abertura reiniciou a prévia. Gate aprovado: 125 testes/76 critérios, lint, tipos, camadas e build/API. Teste parametrizado cobre runtime legado, local explícito e remoto sob movimento reduzido. Prova animada real em docs/screenshots/catalog-autoplay.gif (18 capturas/5,8s); PNG catalog-autoplay.png. Nenhuma escrita de catálogo/sacola, Neon, deploy, serviço externo ou alteração da hero.

## Flutuação, balanço e sombra do cardápio — entregue em 22/10/2026

Fotos transparentes dos hambúrgueres nos cards e detalhes do delivery e cardápio presencial agora combinam flutuação de 12px, balanço de ±1,5° e sombra com escala/opacidade sincronizadas, ciclo de 5,6s e fases diferentes por card. CSS restrito a ProductCutout; hero sem alteração. Animação só começa após validar alpha. Controle Animar fotos/Pausar movimento compartilhado entre cards e detalhes; redução de movimento inicia pausada com ativação explícita possível. Sem modelo 3D, API, GPU, dependência nova ou escrita de dados.

Gate npm run check aprovado: 123 testes, 76 critérios, lint, tipos, camadas e build/API. Browser validou movimento/sombra, pausa/retomada, hero independente, QR e viewport celular 390×844 (área útil 375px), sem overflow horizontal. Evidências em docs/screenshots/catalog-float-desktop.png e catalog-float-mobile.png. QA só alterou estado transitório; sem sacola/pedido/Neon/deploy/commit. Geração GLB permanece experimento opcional fora do escopo atual; relatos anteriores de foto estática descrevem o estágio anterior desta entrega.

## Escopo esclarecido pelo usuário — movimento gratuito no cardápio (22/10/2026)

O usuário esclareceu que não exige 3D completo nem verso reconstruído: quer movimentar as fotos dos itens no cardápio. Flutuação, balanço, perspectiva leve, sombra sincronizada e interação podem ser implementados em CSS/JavaScript, sem geração externa ou biblioteca adicional. Hero independente. Nesta etapa solicitou explicação das opções; nenhuma nova animação foi aplicada antes dessa definição.

Teste Colab interrompido e runtime encerrado, com 0 sessões ativas. O notebook com a foto autorizada foi salvo e a T4 foi alocada, mas não houve inferência/exportação de GLB: venv falhou no Python 3.13; ambiente 2025.07/Python 3.11 avançou até falha de instalação de torchmcubes. O painel inicialmente exibiu ausência de assinatura e depois informou 86,62 unidades existentes/taxa de 1,07 unidade por hora. Por isso não se declara o teste isento de consumo de unidades: sessão encerrada ao detectar a taxa, sem compra ou upgrade; consumo exato anterior não foi medido. Pergunta para retomar até 0,5 unidade não foi autorizada e foi superada por este esclarecimento de escopo. Não retomar GPU ou qualquer serviço externo automaticamente.

Notebook experimental em notebooks/brasa-original-triposr.ipynb, gerador em scripts/prepare-triposr-colab.mjs, sintaxe Python validada. Detalhes em docs/TRIPOSR-COLAB.md; evidência docs/screenshots/colab-units-disconnected.png. Modelo de produto não gerado, catálogo/sacola/Neon/produção preservados. A recomendação atual é foto transparente com movimento CSS e controle de pausa/redução de movimento.

## Situação atual: recorte e modelo real — 22/10/2026

Recorte corrigido para a loja /store/demo: sem fallback para a foto original com fundo; fotos demo antigas resolvem recorte da própria origem mesmo sem cutoutImage. Alpha verificado antes da exibição; arquivo opaco, vazio, erro ou CORS inválido não é apresentado como recorte. Brasa Original recebeu asset com só o hambúrguer, sem papel/fritas/cenário, editado por imagegen. UI 2D fica estática; 360° agora exige modelo GLB real. ProductVisual carrega @google/model-viewer 4.4.0 sob demanda, gira geometria, aceita controles nos detalhes e usa recorte como poster/fallback. Campo model3dUrl aditivo e autorizado no cadastro, preservado ao reimportar a mesma foto, invalidado ao trocar a foto. Nenhum GLB de hambúrguer foi gerado ainda.

O 360° do hambúrguer ainda está pendente: o visualizador existe, mas não há asset GLB desse produto. Usuário autorizou o envio específico de menu-brasa-only.png ao TRELLIS.2/demo pública do Hugging Face; upload e geração de prévia concluídos. Duas extrações GLB retornaram erro; nova geração em 1024 foi recusada pela cota ZeroGPU, com espera aproximada de 24h. Retomada depende da disponibilidade/cota do serviço. Não há API nova de geração, worker de GPU, armazenamento de modelos ou serviço contratado. GLB pode ser cadastrado por URL HTTPS/local permanente. Planilha conserva vínculo do modelo ao editar a mesma foto; exportação não inclui o arquivo GLB nem transfere modelos para outra loja. Foto alterada invalida modelo antigo.

A validação de alpha detecta opacidade, mas não reconhece semanticamente ingredientes/objetos. Remoção automática U²-Net no editor continua podendo manter papel/acompanhamentos em fotos complexas. O asset demo foi corrigido por edição imagegen fora do runtime; isso não foi apresentado como integração generativa para todo upload. Modelos gerados de uma foto estimam vistas escondidas e precisam de revisão visual. Navegadores sem WebGL/modelo válido recebem a foto transparente. Publicação/banco não exercitados nesta entrega.


## Giro com aparência 3D — 22/10/2026

Usuário especificou giro do próprio hambúrguer com aparência 3D. Removidos fundos, gradientes, círculos, bordas e molduras dos produtos de hambúrguer no delivery e presencial. Foto recortada agora aparece diretamente sobre o fundo da página, com perspectiva de 850px e giro lateral de -32° a +32°, inclinação nos três eixos e profundidade em ciclo de 7 segundos. Sombra no chão permanece sutil; outras categorias e hero preservadas. Não é visão 360°: uma foto não revela o verso. Giro real completo exigiria múltiplas vistas ou modelo 3D.

Fotos sem cutoutImage ainda usam o original como fallback; para terem alpha, precisam da geração no editor. Nesta correção não foram processados novos arquivos nem alteradas as fotos demo preparadas anteriormente. A representação é uma fotografia girada com CSS, não malha tridimensional, reconstrução ou fotografia de todos os ângulos. Limite explicado antes da implementação. Inferência de remoção continua no editor; navegação pública não carrega modelo novo ou biblioteca 3D.


## Escopo corrigido: cardápio — 22/10/2026

As fotos próprias agora são usadas nos cards e detalhes do cardápio de delivery e do QR presencial. A hero voltou à ilustração fixa do modelo; nunca fica vazia por falta de cutoutImage. Foto original do produto cobre ausência/erro de recorte. Upload comum continua gerando cutoutImage automaticamente; fotos legadas/importadas precisam ser preparadas pelo editor (Gerar da foto do produto). Não se executa inferência em cada visita do cliente. Relatos históricos abaixo de foto individual na hero foram superados por esta correção. Animação respeita redução de movimento, com ativação/pausa explícita. Fotos com vários objetos ainda podem manter acompanhamentos/papel; não há composição por ingrediente.

## Atualização: remoção automática — 22/10/2026

A exigência anterior de enviar uma foto já transparente foi resolvida no formulário. JPEG/PNG/WebP agora passa por modelo local de saliência em worker; upload principal de hambúrguer também gera a versão da hero, com comparação e salvamento controlado. Detalhes e licenças em BACKGROUND-REMOVAL.md. Seções abaixo sobre ausência de remoção registram o estado histórico anterior desta mesma data.

Permanecem: revisão de bordas em fotos complexas, segmentação semântica para isolar só o hambúrguer quando há papel/acompanhamentos, editor manual de máscara, medição em celulares reais e processamento de grandes lotes. O modelo compacto pode manter objetos em primeiro plano; não produz composições por ingredientes. Navegadores precisam de Web Worker, OffscreenCanvas e WebAssembly. A primeira utilização carrega cerca de 4,57 MB de modelo e 12,36 MB de runtime antes de compressão; nenhum deles entra na navegação pública inicial da hero.

Login de produção foi confirmado pelo usuário; o problema relatado era no projeto local. localhost:5176 é demonstração independente: acesso pelos botões demo ou recuperação de conta local no mesmo navegador/origem. A recuperação remota por e-mail continua pendente. Nenhuma credencial de produção alterada.

## Foto individual de hambúrguer — 22/10/2026

Seleção da hero de hamburgueria agora usa cutoutImage do próprio produto e o preço base exato; o relato histórico abaixo sobre foto fixa/menor preço aplica-se aos outros cinco modelos. Cada loja deve cadastrar suas fotos reais já transparentes em Cardápio → Editar produto → Foto sem fundo do produto. Sem cadastro/erro há estado neutro; imagens antigas não são convertidas/removidas nem substituídas automaticamente. Não há remoção de fundo ou montagem por ingrediente: uma foto não permite inferir visualmente adicionais/retiradas. Para essa próxima etapa serão necessários assets por camada ou fotos por variação e regras de composição.

Campo aditivo compatível com o agregado atual, exposto pela projeção pública sem custos e preservado em exportações/importações; sem migração SQL nova. UI e persistência verificadas localmente, publicação/Neon não exercitados. A automação do file chooser expirou; o fluxo real de endereço → recorte WebP com alpha → salvar → recarregar foi validado no navegador. Celular físico e desempenho de mídia continuam pendentes. QA Burgers Fotos arquivada de forma restaurável em 5176, com dois produtos fictícios, sem pedidos e com sacola vazia. Nenhuma loja anterior alterada.

Atualizado em 21/10/2026. Neon e API já estão implementados; o modo local legado permanece disponível. Detalhes e limites: DEPLOYMENT.md.

Entregue nesta integração: persistência transacional no PostgreSQL, API com autorização por loja, cookies de sessão, configuração inicial protegida, convites por link, checkout idempotente, validação de cupons no servidor, projeções sem credenciais/custos privados e atualização entre dispositivos por polling. Dados locais não foram importados automaticamente.

Antes de escalar a operação comercial:

- Normalizar o agregado JSONB por loja/produto/pedido, reduzir o alcance dos locks e paginar pedidos/clientes. O modelo inicial serializa as escritas no workspace inteiro e não foi submetido a carga de produção.
- Separar ambientes com branches Neon. Atualmente as conexões provisionadas para dev/preview/produção apontam para o recurso compartilhado.
- Definir backups, testar restauração completa e escolher retenção/exclusão de dados pessoais.
- Implementar recuperação segura de senha (a recuperação pública não está habilitada), MFA ou provedor de identidade conforme necessidade. Convites são links manuais sem envio de e-mail.
- Mover imagens pequenas hoje persistidas como data URL para object storage, com validação de conteúdo/dimensões no servidor e variantes de mídia. Corpo HTTP limitado a 3,5 MB; catálogos grandes devem usar lotes menores.
- Configurar observabilidade, alertas e política de rate limiting por tenant. Existem logs mínimos sem payload e limitador persistente por IP.
- Pagamentos online, webhooks de conciliação, assinaturas e emissão fiscal permanecem integrações futuras; Pix/cartão no checkout são conferidos manualmente.
- Validar celular físico, leitura de QR e impressora térmica. As verificações de navegador não substituem esses testes.
- Fazer migração autenticada dos dados legados, se desejado; o banco novo tem apenas catálogo fictício e nenhuma conta local antiga foi copiada.

A loja demo publicada é um exemplo. Configure o primeiro administrador com o arquivo privado local indicado na entrega. Não há senha padrão nem login demo de gestão na publicação.

## Modelo da hero — 21/10/2026

Seis modelos implementados na página de pedidos: hamburgueria, pizzaria, açaiteria, sorveteria, lanchonete de salgados e pastelaria. O cardápio presencial continua com sua capa, preservada nas configurações. Fotos da hero são ilustrativas e fixas por modelo; selo informa o menor preço base de produto disponível da categoria correspondente, sem adicionais, e fica oculto sem produtos compatíveis. Fundo branco ou versão suave da cor da marca. Mudanças validadas localmente e ainda não publicadas. Celular físico e desempenho em rede móvel lenta não foram testados; PNGs transparentes de aproximadamente 2–3 MB cada podem ser otimizados futuramente. A página carrega apenas a imagem do modelo selecionado na hero.

Na origem remota local 5175 foi observada sacola legada com produto ausente do catálogo atual: cabeçalho indica um item e subtotal visual R$ 0,00. Revalidação do checkout existente impede confiar no preço antigo, mas a apresentação de itens obsoletos merece tratamento próprio. Nenhuma sacola ou produto dessa origem foi alterado durante esta entrega.

Nitidez revisada após feedback: nova foto detalhada de 1254×1254 (aproximadamente 3 MB) e sombra independente do bitmap. A resolução nativa retornada pela ferramenta continua 1254 px; não se declara entrega 3K. Em cerca de 620 px CSS há cobertura para DPR 2; nitidez em telas DPR 3/zoom elevado e desempenho em conexão lenta ainda não foram verificados.

Escolher outro segmento não reclassifica produtos antigos nem muda nome/logo/cor da loja. Para o selo aparecer, cadastre/classifique os itens como Pizza, Açaí, Sorvete, Salgado ou Pastel. Categorias amplas anteriores, como Sobremesa, permanecem preservadas. Não há implementação de pizza meio a meio, tamanhos com regras específicas, venda por peso ou montagem livre; adicionais existentes continuam disponíveis por produto. Exemplos da planilha distribuída seguem genéricos/legados, mas o importador já aceita todas as novas categorias e a exportação inclui as instruções atualizadas. O arquivo de modelo não foi refeito nesta entrega.

Novos cadastros da central exigem tipo explícito, validado também no caso de uso. Não há inferência automática para lojas antigas: o tipo existente/default compatível é preservado e pode ser ajustado. Tipo e modelo usam a mesma configuração heroSegment para evitar divergência; não foi criado campo paralelo na empresa. Alteração ainda local. A loja fictícia QA Sorveteria Cadastro da validação em 5176 ficou arquivada e restaurável, sem catálogo/pedidos; não foi excluída permanentemente.

As imagens da hero agora têm animação CSS compartilhada. Com redução de movimento ativa no sistema, começam estáticas e podem ser ativadas manualmente em Animar. Escolha manual vale enquanto a página permanece montada; não é gravada no banco/navegador. Não foi medido consumo de GPU/bateria em celular físico ou dispositivo de baixo desempenho. Previews de formulário continuam estáticos; o movimento é da hero pública.

## 03/11/2026 — Servidor local iniciado

Pedido para executar localmente atendido com npm run dev -- --host 127.0.0.1 --port 5176 --strictPort. Vite iniciou e a landing http://127.0.0.1:5176/ foi aberta e conferida no navegador, sem erros de console. Runtime de demonstração local; conexão PostgreSQL remota desativada pelo guard existente. Sem alteração de código, env, cadastros, banco, publicação ou commit. Gate não repetido para simples inicialização do processo; último gate de código registrado permanece válido. Nenhuma nova lacuna identificada nesta verificação de abertura.

## 03/11/2026 — Prévia fixa no montador de pizza mobile

Pedido atendido localmente em src/components/PizzaBuilder.css: a prévia passa a usar sticky/top0/z-index4 no layout de uma coluna; a rolagem do modal reserva248px para manter opções focadas fora da área ocupada pela pizza. Layout desktop de duas colunas preservado. Sem alteração de preços, ingredientes, hero, banco ou lógica do pedido. Sem commit, envio GitHub ou deploy nesta tarefa.

Gate npm run check aprovado:348 testes/48 arquivos e188/188 critérios, lint/tipos/camadas/build. Log .quality/pizza-mobile-sticky-gate-2026-11-03.log. Navegador local na Cia da Pizza validou390x844 e320x568, três e quatro sabores, nomes longos, seleção de massa/borda, botão adicionar e ausência de overflow horizontal. A posição da prévia permaneceu em y89 enquanto a rolagem mudou de1711 para1981 na verificação final. Desktop1440x900 manteve grid de duas colunas e scroll-padding auto. Console sem erros. Viewport temporário restaurado. Evidências .quality/pizza-mobile-sticky-browser-2026-11-03.json e capturas pizza-mobile-sticky-390/320-2026-11-03.png. Apenas rascunho de montagem no navegador, sem adicionar à sacola ou criar pedido. Limite: inspeção em navegador emulado, sem aparelho físico ou teclado virtual nativo; produção permanece na versão anterior até nova solicitação de publicação. Raia única, agente principal.


## 03/11/2026 — Rollback da prévia fixa solicitado

Revertido exclusivamente o ajuste anterior de src/components/PizzaBuilder.css: prévia mobile novamente relative/top:auto e reserva de248px da rolagem removida. Arquivo idêntico ao HEAD, sem diferenças funcionais remanescentes desta alteração. Registros anteriores preservados como histórico. Gate npm run check aprovado:348 testes/48 arquivos e188/188 critérios, lint/tipos/camadas/build. Navegador390x844 confirmou position:relative, scroll-padding:auto e topo da prévia de128 para-378 ao rolar506px. Viewport restaurado. Evidências .quality/pizza-mobile-rollback-browser-2026-11-03.json e .quality/pizza-mobile-rollback-2026-11-03.png; log .quality/pizza-mobile-rollback-gate-2026-11-03.log. Sem pedido, cadastro, banco, commit ou deploy; outras alterações da pasta preservadas.


## 03/11/2026 — Revisão da pizzaria para apresentação comercial

Revisão estática do código atual e dos registros de QA; sem implementar funcionalidades, alterar cadastros ou publicar. Os contratos remotos completos foram publicados em30/10: tamanhos/regras/sabores, combos, cozinha, balcão, mesas/comandas, pagamentos manuais, caixa, estoque/fichas e agendamento não são lacunas ausentes. Alteração de itens e cancelamento parcial também já existem. Notas antigas de ausência de API foram superadas.

Refinamentos recomendados antes da apresentação autônoma: montador mobile em etapas/recolhível, busca e filtros dentro dos sabores, composição explícita do preço, assistente de configuração inicial e simulador com os valores reais do cadastro. PizzaBuilder lista todos os sabores disponíveis em checkboxes, sem busca interna; ProductOptions mostra resumo e total, sem detalhamento monetário completo da composição; PizzaConfigEditor explica com exemplos estáticos, sem simulador interativo de compra.

Lacunas funcionais confirmadas: analytics agrega por productId, sem ranking de sabores/tamanhos ou decomposição de combos; Kitchen avança o pedido inteiro, sem etapas individuais por pizza/forno; capacidade de agenda conta pedidos/pizzas, sem ponderar tamanho/tempo de forno; estoque contém saldos/movimentos/fichas, sem compras/fornecedores/lotes/validade estruturados; impressão usa window.print, sem integração automática ou formato térmico validado em equipamento real. Não foi localizado fluxo de backup/restauração integral por loja na aplicação, o que não equivale a afirmar ausência de backups da infraestrutura. Recuperação por e-mail do acesso remoto permanece indisponível no proxy de autenticação.

Antes de operação comercial: ensaio em dispositivos físicos e várias sessões reais, incluindo entrada de pedido, atualização na cozinha, edição/cancelamento parcial, recebimentos/estornos e fechamento; os testes automatizados/SQL descartável já cobrem regras, mas não substituem esse ensaio. Último gate registrado348 testes/48 arquivos e188 critérios, aprovado na tarefa de rollback. Gate não repetido nesta análise sem código novo; não houve auditoria dinâmica adicional de produção. Integrações externas anteriormente adiadas não foram configuradas.


## 03/11/2026 — Refinamentos da pizzaria concluídos localmente

Esta seção atualiza a revisão comercial anterior; os registros antigos foram preservados como histórico.

Montador mobile em três etapas com prévia recolhível (sem reintroduzir sticky), busca/filtros internos, composição do preço, configuração guiada e simulador com o mesmo cálculo do pedido. Relatório por sabor/tamanho decompõe combos e usa snapshots históricos; cozinha controla cada pizza; impressão tem vias cozinha/cliente/entrega e 58/80mm. Compras com fornecedor, lote/validade e custo médio; agenda reserva espaços e minutos por tamanho, revalidando edições. Operações remotas preparadas nos contratos existentes, sem integrar ou acessar banco nesta tarefa. Hero e cards preservados.

Limites: impressão e celular físicos ainda requerem ensaio; compras registram lotes recebidos e alertas, sem saldo por lote/FEFO/baixa automática por validade. Forno reserva capacidade conservadoramente, sem otimizar fornadas. Pedidos antigos sem snapshots ficam fora do detalhamento e são sinalizados. Backup/restauração integral por loja e recuperação remota por e-mail continuam evoluções. Detalhes em docs/PIZZERIA-REFINEMENTS.md e docs/QA.md.

Os relatórios contam somente pedidos pagos criados no mês escolhido e não calculam receita/margem por sabor. Cadastros antigos sem tipo de sabor continuam salgados; revisar doces no painel. Produção individual tem limite de300 pizzas por pedido e fluxo legado preservado quando não iniciado. Receber compra não cria despesa: registrar no Financeiro quando pagar. Novos lotes vencidos são recusados; lotes já recebidos exigem conferência física. Nenhum backup ou alteração de conta remota foi executado.


## 03/11/2026 — Carregamento das fotos das pizzas

Corrigido ProductCutout: arquivos versionados confiáveis não são mais tratados como carregados antes de load/decode. A animação só inicia após a decodificação; fotos próximas da tela têm carregamento antecipado por IntersectionObserver, com rechecagem ao rolar, pageshow e retorno à aba. Falhas preservam o estado de foto indisponível e resultados de decodificação antigos não liberam outra imagem. Verificação de transparência das fotos próprias, movimento coordenado, hero, cards e cadastros preservados.

Os 14 arquivos de pizza existem e carregaram no navegador. O círculo vazio persistente da captura não reapareceu nesta sessão; foi corrigida a condição confirmada no componente que iniciava animação antes do carregamento. Falha de rede permanente ainda apresenta estado de foto indisponível. Sem ensaio em aparelho físico ou rede móvel real.


## 03/11/2026 — Refinamentos publicados no GitHub e na Vercel

Alterações funcionais enviadas para guilhermeepereiraa2004-ops/pedss/main no commit c23c8f69c66b125ab5e2c42f675574a057ab547b. A integração Git criou o deployment de produção dpl_FvjK4UFgFyLiGvTwvXXZTVE2E8ZB (READY), projeto pedss/prj_wQ4WydtpnP5OS36ei515W9GpoVxV na equipe Diego Projects, funções gru1. Publicados montador em etapas/busca/preço detalhado, assistente/simulador, relatórios, produção por pizza, vias térmicas, compras/lotes e capacidade de forno, além da correção de load/decode das fotos. Este registro documental não altera funcionalidades.

Gate local366 testes/50 arquivos e206 critérios aprovado; GitHub Quality41679447419 success. API pública antes/depois preservou hashes dos catálogos/configurações,6 lojas e48 produtos, sem escrita operacional, seed ou migração no banco. Leitura anônima sem contas/sessões. Bundles publicados nos domínios pedss.com.br/www.pedss.com.br/pedss.vercel.app contêm simulador, relatório, compras e correção de decode; assets Dashboard-BGF4NZLv.js e StoreLogo-D4YbqyBy.js. Navegador conferiu as8 fotos do cardápio remoto, todas carregadas e verificadas; console sem erros. Logs do deployment:0 registros error na janela15m.

O alias manual pedss.vercel.app ainda apontava para o deployment anterior, apesar do domínio próprio já estar novo; foi explicitamente realinhado ao novo deployment do mesmo projeto. Conferir esse alias em futuros envios Git. Configurações e14 sabores do ambiente local não são importados automaticamente: a Cia publicada preserva seus8 produtos e precisa configurar o montador no próprio painel para oferecê-lo ao cliente. Sem novas credenciais, serviços, plano ou alteração de proteções. Limites de impressão/dispositivo físicos e lote por recebimento continuam em docs/PIZZERIA-REFINEMENTS.md.
