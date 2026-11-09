## Escolha de tamanho e preço da pizza

A vitrine da pizzaria começa pela escolha do tamanho e da divisão. Cada tamanho mostra um preço inicial. A massa recebe os sabores à medida que o cliente escolhe e o montador mostra o total calculado ao completar a seleção. Os formatos disponíveis são configuráveis no painel.

## Pedido de pizza simplificado — 08/11/2026

Publicado na Vercel e integrado à `main` do GitHub junto com o frete por CEP e as notificações de novos pedidos. Inclui caminho curto para pizza inteira, combinação direta de sabores com prévia e preço junto da ação, e resumo editável na sacola.

## Frete por CEP para todos os segmentos — 05/11/2026

Integração global ativada localmente e na Vercel (dpl_J3MEWQVtJ8yC5zj89LfoGfe3Hrd2). Chave configurada somente no servidor/Secret de Production, fora do Git. Novo endpoint HeiGIT, caches de CEP/rotas e deduplicação. Gate aprovado: 420 testes/60 arquivos, 245/245 critérios. Rota real entre dois CEPs públicos retornou 1.155 m; simulador local em memória mostrou 1,16 km e respeitou mínimo de teste, sem alterar lojas reais. Catálogo/configurações da Cia preservados na publicação; três domínios com HTTP/API 200. A Cia continua com frete fixo: ativar Por quilômetro, origem, taxas e limite em cada loja é configuração comercial do administrador. Cotação real em loja de produção não executada para preservar essas regras. Painel autenticado exigiu login nesta sessão. Sem novo commit/push; documentação operacional completa em plan/STATUS.md, log/devlog.md e docs/SHIPPING.md.

## Correções da auditoria de pizzaria publicadas — 04/11/2026

Pedido atual autoriza executar as recomendações da auditoria, incluindo a publicação. Finalização mantém nome, telefone, modalidade, endereço, pagamento, observações e rascunho de cupom durante edição/cancelamento/reabertura da sacola. Estado somente em memória da página; cupom e cotação continuam sujeitos à validade, telefone, sacola e regras atuais. Nenhum preço enviado pelo navegador passa a ser confiado.

Pizzas individuais vinculadas iniciam com seu único sabor selecionado, não duplicam as retiradas globais e preservam personalizações antigas e ao trocar tamanho. Ingredientes gerais sem equivalente no sabor permanecem disponíveis. Pedir novamente abre a sacola da loja correspondente, sem confirmar compra. Retirada mostra Retirada no total e Confirmar retirada na ação final; status históricos e pagamento permanecem separados. Tabela de pedidos adapta-se à largura do próprio contêiner, com informações rotuladas e ações visíveis no mobile. Textos de Equipe/Agendamento revisados. Descrição pública da Cia da Pizza corrigida pela UI para “Escolha sua pizza favorita e monte cada detalhe do seu jeito.”; somente esse campo foi editado.

Incluídas as correções locais anteriores de retorno ao cardápio, recuperação de leitura com repetição limitada, recuperação de versão antiga e 404 de assets. Nenhum POST é repetido automaticamente. Nenhuma alteração em preços, regras comerciais, credenciais, permissões, DNS, esquema ou registros financeiros.

Publicação via CLI autenticada em Pedss/prj_wQ4WydtpnP5OS36ei515W9GpoVxV, equipe Diego Projects/team_31LF1BKscdWn5gGQQgAxp4c1. Deployment dpl_HQxuEcaRXoY2QC26A3RaS1o1Kjni, URL pedss-psvfhsivw-diegos-projects-2f58d897.vercel.app, READY; funções gru1. Pacote sanitizado com 292 arquivos efetivamente enviados, sem env, registros locais, backups ou clientes; manifesto .quality/audit-fixes-release-manifest.json. Fonte é o working tree validado sobre b483efe, sem novo commit/push. Não afirmar que o GitHub recebeu esta correção.

Versão criada sem trocar domínios, validada e então promovida. O alias pedss.vercel.app ainda estava em uma versão antiga e foi alinhado explicitamente. www.pedss.com.br, pedss.com.br (redireciona para www) e pedss.vercel.app retornam HTTP 200 e /assets/index-DZ0bufkK.js. GET público da Cia retorna 15 produtos com hash idêntico nos três hosts, zero pedidos/usuários privados; arquivo inexistente em /assets/ retorna 404 text/plain. Nenhum pedido de produção foi criado ou alterado nesta rodada.

Validação: npm run check passou com 412 testes/60 arquivos, lint, tipos, camadas e build. Após registrar quatro critérios novos, scripts/acceptance.mjs confirmou 242/242 critérios. Primeiro gate apontou helper no diretório lib importando core; corrigido para application antes da execução aprovada. Fluxos operacionais em memória/PostgreSQL descartável cobrem cupons, combos, estoque (baixa, cancelamento, duplicidade), recebimentos/sangrias/estornos, fechamento de caixa, mesas/comandas, agenda/capacidade, preços e permissões. Não representam lançamentos ou fechamento financeiro na loja real.

QA pelo navegador integrado: finalização local preservada ao editar quantidade e ao cancelar; pizza individual sem controles duplicados; pedido fictício pronto para retirada concluído mantendo pagamento pendente; Pedir novamente abriu sacola sem criar pedido. Viewport real 390×844 confirmou card de pedido sem rolagem horizontal e botões acessíveis; viewport restaurado. Em produção, painel autenticado recarregou; Calabresa mostrou Sem Cebola e Sem Orégano apenas uma vez; rascunho de finalização manteve nome/telefone/retirada/Pix/observações ao voltar da edição sem envio de pedido. Console da loja sem erros/avisos na verificação.

Evidências locais: .quality/pizzeria-audit-fixes-gate.log, .quality/audit-fixes-public-verification.json, .quality/audit-fixes-deploy.log, .quality/pizzeria-orders-mobile-fixed.png e .quality/pizzeria-checkout-production-fixed.png. Página isolada .quality/audit-fixes-preview.html usa somente memória e não é publicada.

Limites remanescentes: ficha técnica, custos e alergênicos precisam de dados reais da loja; não foram inventados. Impressora térmica física, câmera de QR, rede/aparelho independente e recuperação após interrupções prolongadas não foram homologados fisicamente. Não foi reproduzido o erro intermitente original em produção; as causas de recuperação cobertas por testes foram corrigidas, sem prometer ausência de qualquer indisponibilidade futura. Frete por rotas/CEP e ativação DNS de subdomínios permanecem conforme decisões anteriores, fora deste escopo.

# Roadmap — Pedss

## Push de novos pedidos

O Web Push está publicado no Pedss. O gestor ativa os avisos em cada dispositivo pelo painel. A validação em produção confirmou a versão publicada, a proteção da API e o acesso da conta técnica à tabela. A entrega nativa ainda precisa ser confirmada em um dispositivo inscrito. Veja [a configuração](docs/ORDER-PUSH.md).

## Avisos de novos pedidos — 08/11/2026

Proprietários e administradores podem ativar notificações do navegador em Visão geral e Pedidos. A preferência é salva por conta e loja no navegador. O painel usa a sincronização de pedidos existente para emitir os avisos enquanto permanece aberto. A mudança está no ambiente local.

## Publicação autorizada da restauração de status — 03/11/2026

Usuário autorizou enviar ao GitHub e publicar na Vercel a restauração de botões/status de Pedidos conforme15fe3a8 (30/10). Fonte atual mantém Cozinha removida, sem trava de produção individual; Financeiro e demais módulos preservados. Gate388 testes/55 arquivos e224/224 critérios aprovado; código funcional não mudou desde o gate. Comparação histórica e QA desktop/mobile registradas na seção abaixo. Nenhuma alteração de cadastro, migração ou DNS faz parte desta publicação. Resultado do envio, deployment e conferências posteriores ficará nos registros locais plan/STATUS.md e log/devlog.md, conforme preferência do usuário. Esta seção registra a autorização e validação prévia, sem antecipar sucesso do deploy.


## Botões e status de Pedidos restaurados conforme 30/10 — 03/11/2026

Por pedido explícito, restaurados somente botões, filtros, status e sequência de Pedidos conforme15fe3a8ea95290857b2e210a213240da18ca227d (30/10, versão integral então publicada em dpl_3fi667sKPZyRj9nfvjLHbNitf5BW). Retirada: Pendente → Aceito → Preparando → Pronto para retirada → Entregue. Entrega: Pendente → Aceito → Preparando → A caminho → Entregue. Botões Aceitar pedido, Iniciar preparo, Pronto para retirada/Saiu para entrega e Concluir entrega; mesa mantém Pronto para servir/Marcar como servido. Filtros separados para todos os status, inclusive retirada. Removidos os nomes simplificados Recebido/Em preparo/Concluído e agrupamento de filtros. Acompanhamento do cliente usa novamente os status originais.

Comparação automatizada confirmou igualdade integral com30/10 de orderActions.js, Tracking.jsx, OrdersTable.jsx e funções nextStatuses/transition. UI de Cozinha e exigência de produção individual continuam removidas, como solicitado anteriormente. Prova de regressão inclui pedido com histórico individual incompleto e confirma que chega a Pronto para retirada sem a antiga trava. Financeiro, montador, impressão Cliente/Entrega, autorização, histórico e separação de pagamento preservados. Nenhum pedido ou cadastro antigo migrado/reaberto/alterado; testes usam memória e PostgreSQL descartável.

Gate npm run check aprovado:388 testes/55 arquivos,224/224 critérios, lint/tipos/camadas/build. Log .quality/oct30-order-status-gate.log. Testes cobrem entrega, retirada e mesa, ordem obrigatória, filtros e ações na lista, conclusão de pedidos antigos e pagamento pendente preservado. Inspeção desktop e390x844 com pedidos fictícios confirmou botões diferentes por modalidade e transição de retirada bem-sucedida. Evidências .quality/oct30-order-status-desktop.png e .quality/oct30-order-status-mobile.png; viewport restaurado. Sem commit, push, deploy, DNS ou escrita em banco real nesta tarefa. Versão publicada ainda é b4eafb3 até novo pedido de publicação. Este registro substitui a simplificação anterior apenas para botões/status, mantendo a remoção da Cozinha.


## Versão de Pedidos e Financeiro pronta para publicação — 03/11/2026

Envio autorizado ao GitHub canônico guilhermeepereiraa2004-ops/pedss/main e ao projeto Vercel Pedss/Diego Projects. Versão inclui remoção da UI Cozinha/trava individual, fluxo Aceitar → Preparar → Concluir, vias Cliente/Entrega e Financeiro → Custos e margem. Código de subdomínios incluído como preparação compatível com URLs atuais; ativação DNS/HTTPS e geração global de novos links continuam adiadas pelo usuário. Nenhuma migração ou alteração de cadastro é necessária para esta publicação.

Gate da versão:387 testes/55 arquivos,224/224 critérios, lint/tipos/camadas/build. Inspeção local desktop/mobile concluída. Leitura pública prévia confirmou8 lojas/65 produtos; comparação pós-publicação e evidências do deployment serão registradas nos arquivos locais plan/STATUS.md e log/devlog.md, conforme a política de registros locais. Este registro descreve a versão e os checks prévios; não afirma deploy concluído antecipadamente. Credenciais, env reais, backups, .quality e registros locais excluídos do envio.


## Pedidos simplificados; módulo Cozinha removido — 03/11/2026

Pedido explícito para remover Cozinha e manter somente ver/aceitar/preparar/concluir. Concluído localmente: navegação, tela Kitchen e componente visual PizzaProduction removidos; área Pedidos concentra Aceitar pedido → Preparar pedido → Concluir pedido. Status apresentados como Recebido, Aceito, Em preparo e Concluído. Cancelamento permanece com motivo e pagamento continua separado. Filtros não oferecem mais saída/retirada como passos adicionais; pedidos antigos nesses estados entram no filtro Em preparo e podem concluir. Links antigos tab=kitchen abrem Pedidos. Via térmica de Cozinha removida, padrão Cliente com Entrega opcional. CSS compartilhado renomeado para restaurant-line; regras exclusivas da tela removidas.

Domínio oferece Preparando → Entregue diretamente (Entregue interno é exibido como Concluído). Removida a trava que exigia finalizar pizzas individualmente, preservando os eventos históricos. Compatibilidade de transições de saída/retirada mantida apenas para clientes antigos, sem obrigar ou oferecer esses passos na nova UI. Contratos e eventos legados de produção permanecem para não apagar histórico; não há mais acesso ao controle individual na interface. IDs, preços, montador, estoque, agenda, contas e registros anteriores preservados. Concluir pedido não registra recebimento automaticamente.

Gate npm run check aprovado:387 testes/55 arquivos,224/224 critérios, lint/tipos/camadas/build. Log .quality/simple-order-flow-gate.log. Cinco cenários de domínio cobrem entrega/retirada/mesa com histórico individual incompleto e os dois status antigos; teste de lista estendido até conclusão mantendo pagamento pendente, e regressão para link antigo da Cozinha. Teste térmico atualizado para Cliente/Entrega. Primeiro teste direcionado teve apenas erro no nome esperado de um heading novo, corrigido antes do gate completo. Nenhum teste relaxado para aceitar falha de negócio.

Inspeção desktop e390x844 em runtime descartável mostrou os três botões diretamente na lista e ausência de Cozinha no menu. Controles móveis continuam acessíveis; viewport restaurado. Evidências .quality/simple-order-flow-desktop.png e .quality/simple-order-flow-mobile.png; pedidos usados nas capturas são fictícios em memória. Nenhum pedido ou banco real alterado. Sem commit, push, deploy, alteração de DNS ou retomada da ativação dos subdomínios. Financeiro e subdomínios preparados anteriormente continuam na pasta local. Impressão física não ensaiada; apenas a prévia e o comando de impressão testados.


## Subdomínios preparados; ativação adiada pelo usuário — 03/11/2026

Usuário solicitou endereços por estabelecimento (ciadapizza.pedss.com.br, /dashboard e /menu), autorizou preparar a ativação e depois adiou explicitamente a troca de DNS. Não continuar publicação, DNS ou ativação sem retomada do usuário. Código preparado apenas localmente: resolução por hostname/alias sem hífen, compatibilidade com slugs e IDs existentes, proteção contra colisões, painel sem query de loja, cardápio presencial /menu e projeção SQL com as mesmas permissões. Links antigos preservados; novos links gerados a partir do domínio principal dependem da lista pública de slugs confirmados VITE_PUBLIC_STORE_SLUGS (padrão vazio), para não apontar lojas novas a DNS ainda inexistente. Para o fluxo SaaS automático definitivo, habilitar a geração global somente após confirmar wildcard DNS/HTTPS; ainda não implementado/publicado esse opt-in global. Nenhum cadastro ou ID alterado.

Vercel Diego Projects/Pedss: oito domínios individuais adicionados (brasaburger, ciadapizza, acaidacasa, gelatodacasa, sabordahora, pasteleprosa, burgerstation, fornofarinha).pedss.com.br e *.pedss.com.br anexado. Zona Vercel DNS habilitada, com ALIAS padrão no apex e wildcard para a714198d5f544564.vercel-dns-016.com e CAA padrão. Verificação direta de ns1.vercel-dns.com retornou A para apex, www e ciadapizza. Isso prepara a zona, não comprova ativação pública nem certificado wildcard. Nameservers autoritativos observados continuam d.sec.dns.br/e.sec.dns.br. Domínio e www existentes mantidos no mesmo projeto; nenhum banco, variável privada, proteção ou plano alterado. Conector Vercel retornou403 para a equipe; CLI já autorizada foi usada, sem reconectar credenciais. Um vínculo wildcard foi removido durante tentativa de certificados individuais e depois recriado ao retomar o objetivo de automação.

Orientação corrigida após capturas do Registro.br: formulário mostrado não oferece NS e rejeitou nome curinga *. Não insistir na inserção de registros de zona incompatíveis. Caminho pendente é Alterar servidores DNS uma única vez para ns1.vercel-dns.com e ns2.vercel-dns.com, mantendo o registro do domínio no Registro.br. Usuário confirmou que os únicos registros antigos são A do apex e CNAME www, ambos atendidos pela zona Vercel preparada. Reconfirmar a zona completa antes de retomar, pois ela pode mudar. Não confundir esses servidores com entradas NS no editor. User disse “Faremos isso depois então”; nenhuma mudança nos servidores do Registro.br foi executada pelo agente. Não afirmar que novos endereços já funcionam.

Gate local npm run check aprovado após os últimos ajustes:381 testes/54 arquivos,221/221 critérios, lint/tipos/camadas/build. Log .quality/subdomains-gate-final.log. Oito testes novos cobrem hostname/reservas, aliases e ambiguidades, colisões, escopo, links, painel sem store, cardápio presencial e SQL com isolamento de sessão. Navegador no hostname ciadapizza.localhost confirmou seleção da Cia em runtime descartável, sem pedido ou cadastro real. Viewport padrão. Código financeiro anterior continua local. Sem commit, push, deployment ou migração de banco nesta tarefa. Cópia isolada em .quality/subdomain-release-source-SHubzF ainda incompleta e não deve ser publicada como se validada; ao retomar, reconstruir fonte, testar e validar o alvo antes do envio.


## Financeiro: custos e margem — 03/11/2026

Implementada localmente a aba Financeiro → Custos e margem, disponível a administrador/gestor de qualquer segmento. Exibe total das vendas pagas após cupons/sem frete, custo dos produtos, margem bruta em reais e porcentagem, além do detalhamento por pedido e acesso aos detalhes existentes. Filtros inclusivos por data de criação em America/Bahia; sem datas considera todo o histórico. Custos são snapshots unitários do pedido multiplicados pela quantidade, incluindo adicionais já apurados no snapshot. Cálculo puro em src/core/profitability.ts, sem acesso novo a banco, rede ou persistência.

Apuração incompleta é explícita: custos ausentes, pedidos sem itens e composição divergente não são tratados como zero. Totais de custo/margem e percentual usam apenas vendas com custos completos, com base monetária/cobertura informadas. Custo zero explícito, prejuízo e desconto integral são suportados; sem base positiva não há divisão por zero. Pagamentos pendentes/parciais, estornados, cancelados e exemplos ficam fora. Frete e despesas gerais não são confundidos com margem/lucro líquido ou novamente debitados. Nenhum recálculo retroativo pelo catálogo. Campo de custo do produto agora informa onde consultar o resultado. Pizzas montadas ainda exigem fichas técnicas completas; não foi inventado custo para pedidos antigos.

Gate npm run check aprovado:373 testes/52 arquivos,213/213 critérios, lint/tipos/camadas/build. Sete regressões novas cobrem descontos/quantidades, custo desconhecido/legado, datas/filtros, custo zero/prejuízo/zero receita, integração do painel/detalhes sem mutações, alerta de apuração parcial e bloqueio a atendente. Log .quality/profitability-gate.log. Revisão React aplicada: dados derivados sem efeito/estado duplicado, importações diretas, componente separado, rótulos de filtros, cabeçalhos de tabela, estados vazio/parcial, sem novas dependências ou consultas.

Navegador conferiu desktop e390x844 com runtime descartável em memória (total fictício R$200, custo apurado R$35, margem R$65/65% sobre R$100 com custos completos). Sem transbordamento horizontal da página; tabela rola dentro do contêiner. Viewport restaurado. Painel real da Cia local aberto na nova aba, sem vendas pagas; nenhum pedido, produto, despesa ou banco real alterado. Evidências .quality/profitability-desktop.png, .quality/profitability-mobile.png e .quality/profitability-cia-local.png. Sem commit, push ou deployment: implementação disponível somente localmente. Relatório é margem bruta das vendas integralmente pagas, não DRE/lucro líquido nem fluxo de recebimentos por data de pagamento.


## Lojas locais transferidas para produção — 03/11/2026

Pedido explícito do usuário para copiar estabelecimentos locais e seus produtos para produção. Exportação autorizada pela própria aplicação na origem http://127.0.0.1:5176, somente dados de negócio: quatro lojas/33 produtos. Brasa Burger (6) atualiza a loja publicada brasa-burger, preservando o ID a7b97a08-dad3-4078-87b9-39e9997acb8d e sua URL; Cia da Pizza (15, incluindo montador com14 sabores/2 tamanhos) preserva 188ba6e0-54b7-444c-a2cb-3ebfea786fe0 e cia-da-pizza. Burger Station (6) e Forno & Farinha (6) adicionadas com novos IDs imutáveis e slugs burger-station/forno-farinha. Segmentos e configurações efetivamente locais preservados, sem inferir pizzaria pelo nome. Não havia Super Combo neste snapshot.

Backup privado integral de produção anterior salvo em .quality/backups/local-store-transfer-2026-11-03-production.raw.json; inclui dados sensíveis e não deve ser enviado ao Git/Vercel. Fonte, plano, resultado esperado e pós-cópia também ignorados. Migração transacional com bloqueio da linha e proteção contra catálogo alterado, testada primeiro em PostgreSQL/WASM descartável: igualdade integral, repetição idempotente, rollback em conflito e preservação de pedido concorrente/contas/sessões. Aplicada somente a pedss.workspace no Supabase pedss-producao/ncohdxclvgoeqyutfubw, revisão72. Resultado real exatamente igual ao esperado:8 lojas/65 produtos. Quatro outras lojas publicadas preservadas integralmente, assim como usuários, sessões, pedidos, despesas, caixa e demais registros operacionais. Logins locais não foram importados. Sem credencial, esquema, permissão, assinatura ou alteração no Neon.

API pública das quatro rotas conferida contra a projeção dos produtos/configurações locais, incluindo preços, adicionais e montador. Arquivos relativos já disponíveis na Vercel; fotos de pizza derivadas do catálogo versionado. Navegador confirmou cardápio completo, montador com tamanho/sabores/massa/borda e cálculo de duas metades Mussarela/Calabresa em R$39,90 (regra local: maior sabor). Nenhum pedido ou pagamento real criado. Evidência .quality/local-stores-published-2026-11-03.png; relatório .quality/transfer-published-verification.json. Não houve alteração funcional, commit, push ou novo deployment; atualização é de dados e já está visível em produção. Último gate funcional366 testes/50 arquivos e206 critérios segue válido; testes específicos da transferência executados nesta tarefa.

Esta seção substitui, para os quatro cadastros copiados, os registros históricos que diziam que os dados locais ainda não estavam publicados. Alterações locais futuras não sincronizam automaticamente: precisam de exportação/importação explícita ou cadastro no painel remoto.


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

## Supabase em produção — 30/10/2026

- [x] Receber autorização explícita para início vazio e login técnico limitado, substituindo a espera pelo Neon.
- [x] Inicializar sem demonstração, aplicar a credencial, verificar TLS/RLS e preservar os bancos antigos.
- [x] Configurar Secrets só de produção, publicar fonte isolada validada e promover após API200/SSE.
- [x] Confirmar login público, ausência de erros de execução e manter as proteções Vercel.
- [x] Usuário concluiu primeiro administrador; sessão administrativa e criação dos seis estabelecimentos confirmadas no navegador.

Neon permanece preservado e sem cópia para o novo banco. Gate principal333 testes/181 critérios; fonte publicada216 testes/104 critérios. Nenhum commit ou envio GitHub novo. O deployment corresponde à base publicada com ajustes de banco/tráfego, sem liberar módulos locais sem API.

## Transição Supabase — 30/10/2026

- [x] Confirmar organização PRO e custo adicional; novo projeto `pedss-producao` em São Paulo.
- [x] Preparar schema privado com RLS e revogar execução pública do trigger de RLS automático; advisors sem avisos.
- [x] Preparar conexões pg/TLS, pool de uma conexão por instância e transferência transacional com checksum/recusa de sobrescrita.
- [ ] Autorizar/aplicar login técnico limitado da API (bloqueado pela revisão automática, sem concessão efetuada).
- [ ] Exportar dados do Neon após liberação da cota; importar, conferir e validar API/atualização de pedidos.
- [ ] Trocar produção somente após validação, preservando origem e possibilidade de rollback.

Usuário escolheu preservar contas/lojas/pedidos. Não houve autorização para começar vazio ou descartar histórico. Produção e Vercel permanecem sem alteração nesta etapa. Procedimento em `docs/SUPABASE-MIGRATION.md`.

## Revisão para envio ao GitHub — 30/10/2026

- [x] Repetir gate completo: 325 testes e 181 critérios aprovados.
- [x] Conferir edição/cancelamento parcial no navegador com dados em memória e prévia de combo fixo; conferir formulário do combo no celular emulado.
- [x] Preparar snapshot de código, testes, documentação e imagens sem credenciais ou dados locais, na branch existente `codex/pedss-2026-10-22`.

Publicação na Vercel e integração remota das ações locais continuam fora desta solicitação. A falha de inicialização do navegador registrada em 29/10 foi superada; detalhes e limites em `docs/QA.md`.

## Pedidos por item e combos explícitos — 29/10/2026

- [x] Editar item de pedido recebido/aceito, com revisão dos valores, versão, autorização e auditoria.
- [x] Cancelar quantidade de item, tratar baixa/devolução/perda e saldo manual a devolver; último item cancela conjunto do pedido.
- [x] Distinguir item fixo e grupo de escolha nos combos, com prévia e conversão de alternativas somente após salvar.
- [x] Gate325 testes/44 arquivos e181 critérios, incluindo testes de interação.
- [ ] Inspeção visual desktop/mobile: ferramenta de navegador não inicializa; QA descartável preparada.
- [ ] Integração remota das ações novas, mantida adiada por decisão do usuário.

Dados legados sem baixa histórica por linha não são reconstruídos automaticamente. Combo é cancelado por unidade completa. Relatórios por sabor, controle de forno, compras/lotes e backup completo continuam fora desta entrega.

## Próximas evoluções locais da pizzaria — revisão de 29/10/2026

Itens identificados por análise; implementação ainda não solicitada nesta revisão:

- [x] Edição auditada de pedido confirmado antes de preparar, recalculando diferenças/estoque sem reescrever histórico.
- [x] Cancelamento por item com baixa histórica, devolução/perda e saldo a devolver registrado manualmente.
- [ ] Relatórios por sabor, tamanho e componentes dos combos, além do ranking atual por produto.
- [x] Cadastro de combo com distinção visual entre todos incluídos e opções à escolha.
- [ ] Produção por pizza, prioridade e capacidade de forno além da contagem da agenda existente.
- [ ] Compras, lotes/validade e perdas estruturadas além dos ajustes/fichas existentes.
- [ ] Backup/restauração completos locais e homologação de cenários reais após revisar/vincular catálogo da Cia.

Banco, CEP e demais integrações continuam adiados por escolha do usuário. Última validação executada:305 testes/42 arquivos,161 critérios, em28/10; esta revisão é somente leitura de código e documentação.

## Carregamento confiável das fotos de pizza — 28/10/2026

- [x] Recuperar foto carregada em cache mesmo sem evento load.
- [x] Recuperar exibição ao restaurar a página e manter validação de fotos próprias.
- [x] Exibir14 recortes de pizza versionados sem bloquear por canvas; URLs próprias fora dessa exceção.
- [x] Gate305 testes/42 arquivos e161 critérios; inspeção local desktop/mobile e modal.
- [ ] Testar conexão móvel lenta/aparelho físico e produção quando solicitados.

## Super Combo com três pizzas fixas — 28/10/2026

- [x] Reparo local autorizado: três pizzas fixas, mantendo18000 centavos e referências existentes.
- [x] Pré-seleção dos componentes incluídos; alternativas e montagens seguem explícitas.
- [x] Gate300 testes/41 arquivos e inspeção de card/modal/sacola em memória.
- [ ] Confirmar gravação no navegador do usuário após atualizar painel master local; a sessão controlada não tem esse cadastro.

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

## Operação ampliada da pizzaria — 28/10/2026

Entregue localmente: cadastro vinculado; regras de combinação e personalização por sabor; divisão em quartos; cozinha; balcão/telefone; combos com grupos; estoque/fichas/custos; caixa por turno; mesas/comandas; agenda por capacidade; repetição e alergênicos. Verificação:268 testes,129 critérios, gate completo e inspeção responsiva. Não representa release remoto. Próximos marcos adiados pelo usuário: adaptador HTTP/banco e dados compartilhados entre dispositivos, CEP/endereço e publicação. Expansões além desta entrega: combos com pizzas de múltiplos sabores, divisão/transferência de contas e impressora automática.

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

## Economia de dados — 27/10/2026

- [x] Leitura de banco por loja/tela e controle condicional antes de carregar catálogo/histórico.
- [x] Separar versões de catálogo/operação e omitir fotos em atualizações de pedidos.
- [x] Gravações por caminhos JSON sob lock, preservando dados não carregados.
- [x] SSE com revisão, liderança entre abas, backoff e manutenção dos alertas do painel.
- [x] Landing sem banco e desenvolvimento remoto com opt-in explícito.
- [x] Testes SQL isolados e navegador: pedidos/status sem refresh, landing offline, 100 GETs sem releitura.
- [ ] Publicar cliente/API juntos mediante pedido; nenhuma publicação nesta etapa.
- [ ] Medir consumo real após liberação da cota do Neon; não garantir cabimento permanente no Free.
- [ ] Planejar normalização/paginação de históricos e armazenamento próprio de mídias para escala.

Documentação: docs/DATA-EFFICIENCY.md. Plano e dados de produção não alterados.


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

## Operação e frete — concluídos localmente, 26/10/2026

- Carrinho inferior direito com quantidade, total e confirmação ao adicionar.
- Sincronização automática de dados por SSE, com recuperação por polling/foco/reconexão e proteção contra leituras atrasadas.
- Acompanhamento sem status de pagamento; ações de entrega rápidas na lista e no topo dos detalhes, preservando pagamento independente.
- Despesas dentro do Financeiro; link antigo compatível, sem item de navegação separado.
- Frete dedicado com taxa única, distância rodoviária por CEP e regras legadas preservadas; cotação validada no servidor.

Gate aprovado: 184 testes, 104 critérios. Navegador desktop/celular validado em API real com persistência isolada em memória. Integração BrasilAPI/ORS autorizada, porém usuário adiou a chave: cálculo real por km ainda pendente. Detalhes em docs/SHIPPING.md. Sem commit/deploy nesta revisão.

## Trial, planos e landing publicados na Vercel — 26/10/2026

Concluído a pedido do usuário: Pedss na equipe Diego Projects (prj_wQ4WydtpnP5OS36ei515W9GpoVxV / team_31LF1BKscdWn5gGQQgAxp4c1). Deployment dpl_GWJ1HFPfryYgaPQnLHbZxnfLuM5M, sourceCommit39b3c8c0b195f8cbae36b1a6fb4b937aaa8cdf71, sourceBranch codex/pedss-2026-10-22; build de produção READY e promovido a https://pedss.vercel.app. Host pedss-c6wo0gyhy-diegos-projects-2f58d897.vercel.app; anterior dpl_HxADhZp1JEwFuWUNWd9EyBXoEuXY preservado para rollback.

Snapshot isolado dos247 arquivos do commit conferido por hash;221 arquivos aplicáveis ao deploy, sem env/segredos, registros locais, capturas ou matrizes design. Conector retornou403 para o escopo da equipe; CLI59.16 autenticada confirmou proprietário/projeto e concluiu publicação, sem alterar conexão, permissões, variáveis ou proteção. Produção preparada com --skip-domain, validada antes de promover. Gate do mesmo código aprovado (167 testes,87 critérios) e GitHub Quality40341700324 success; nenhum código alterado neste turno. Build da Vercel aprovado (READY em7s; aviso de bundle model-viewer preexistente).

API antes/staging/depois preservou integralmente as três lojas,28 produtos e configurações; serverNow presente na nova versão. Navegador público confirmou landing/seção trial, CTA para /cadastro, planos Essencial199,90/Rede599,90 e formulário remoto abrindo sem aviso local. Zero erros no console e consulta de logs de erro do novo deployment vazia (janela15m). Sem criação de conta, pedido, cobrança, alteração de catálogo ou migração nesta publicação. Expiração e cadastro completo já cobertos por testes locais de domínio/API/UI; sem novo cadastro real no Neon ou teste em aparelho físico. Drains/monitoramento contínuo não reinspecionados.

Evidências locais: .quality/trial-release-production-{landing,signup}.png, trial-release-staged-validation.json, trial-release-production-inspect.json, trial-release-{before,staged,production}-api.json e trial-release-runtime-errors.jsonl. Registros pós-publicação atualizados apenas localmente; manifesto GitHub continua representando o commit publicado. Raia única, sem delegação.

## Trial, planos e landing enviados ao GitHub — 26/10/2026

Enviado a pedido do usuário para DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22. Commit 39b3c8c0b195f8cbae36b1a6fb4b937aaa8cdf71, árvore d47dfe430227db64b4ce609519fd659b7ccb8f33; 36 arquivos novos/alterados (7 novos), 247 arquivos totais conferidos por hash. Atualização normal com expected SHA, sem force; main 971e24b0263dcfe87e9f867d185c5a9b6bc30e2e preservada. Inclui cadastro trial de7 dias, expiração/ativação, configurações existentes, planos Essencial/Rede e faixa com ícones Peds's. Credenciais, plan/log/.quality e capturas permanecem locais.

Gate do código enviado aprovado:167 testes/21 arquivos,87 critérios,lint/tipos/camadas/API/build; QA de navegador já concluído. GitHub Quality40341700324 concluiu success para o mesmo commit. Sem deploy Vercel ou acesso/gravação ao banco. A produção permanece no commit080c05b, anterior a estas alterações. Raia única, sem delegação.

## Cadastro público com teste de 7 dias — 26/10/2026

Implementados CTA/seção na landing e rota /cadastro com conta e identidade da loja. O cadastro cria gestor, estabelecimento vazio e sessão, seguindo para Configurações já existente. Segmento, nome, endereço reservado e cor (seletor ou hexadecimal) definidos no cadastro. Teste começa ao concluir, com sete dias exatos calculados no servidor. Não aceita papel, plano ou prazo fornecidos pelo cliente. Lojas legadas preservadas via campo trial opcional no JSON existente.

Ao vencer: gestão, convites, gravações e novos pedidos bloqueados; login, dados e consulta pública do catálogo preservados. Central possui Ativar acesso manual, sem cobrança, com histórico do teste mantido. Nenhuma assinatura, e-mail, migração ou integração nova. Cadastro local identificado como simulação independente da produção. Sem acesso ao Neon, commit, GitHub ou deploy nesta etapa.

Validação: npm run check aprovado, 167 testes/21 arquivos e 87/87 critérios, lint/tipos/camadas/API/build. Fluxo real no navegador: landing → cadastro em duas etapas → configurações da própria loja; segmento/cor persistidos, configuração salva, logout/login retornando à própria loja e ativação manual na central. Expiração exata e isolamento verificados em testes de domínio/API/UI. Evidências e limites em docs/QA.md.

## Faixa original com ícones da marca — 26/10/2026

Faixa de marca voltou ao formato contínuo original; novos ícones Peds's preservados. Restante da landing e planos mantidos. Disponível localmente.

## Faixa de identidade da landing — 26/10/2026

Concluído refinamento da faixa de identidade abaixo da hero da landing, com pequenos ícones Peds's no lugar das estrelas. Revisão local; demais entregas e pendências preservadas.

## Projeto local disponível — 26/10/2026

Servidor existente confirmado na porta5176 e landing aberta no navegador para acompanhamento. Mantida a instância já ativa (nova inicialização strictPort recusou duplicata). Planos atualizados visíveis; nenhum código, dado, commit ou deploy alterado. Gate não repetido por ser somente execução; validação anterior permanece válida.

## Planos Essencial e Rede — 26/10/2026

Ofertas comerciais atualizadas para Essencial R$199,90/mês e Rede R$599,90/mês (até5 lojas), sem plano gratuito. Alteração de apresentação/configuração de referência. Cobrança e aplicação de limites via assinaturas continuam no roadmap existente.

## Cardápios publicados no GitHub e Vercel — 24/10/2026

Concluído a pedido do usuário: novo cardápio presencial de consulta, fotos maiores e identidade da loja, com animação permanente nos dois cardápios e detalhes. GitHub DiegoMicaelvs/pedss, branch codex/pedss-2026-10-22, commit080c05b7e78e1abcd5309ce7a2763e756bf53cbb, árvorebc44496d8bb5ff910d177b382a4eced98f6f7fd9;240 arquivos conferidos por hash,14 alterações incluindo2 exclusões. Main preservada. GitHub Quality40116120365 success; gate local156 testes/76 critérios já aprovado.

Vercel Diego Projects/Pedss prj_wQ4WydtpnP5OS36ei515W9GpoVxV: deployment dpl_HxADhZp1JEwFuWUNWd9EyBXoEuXY, sourceCommit080c05b, promovido a https://pedss.vercel.app. Anterior dpl_2js9xeATkq1n7RgmnsHBrYdBpe47 preservado. Staging READY antes de promover; cinco arquivos compilados (JS/CSS dos cardápios e entrada) idênticos ao build local por SHA256. Catálogo antes/staging/depois idêntico:3 lojas,28 produtos e configurações preservados. Sem migração ou gravação de cadastros/pedidos; proteção e variáveis mantidas.

## Movimento permanente no delivery — 24/10/2026

Concluído movimento permanente também no delivery: catálogo e personalização do produto sem controles de pausa, em todas as lojas. Regra compartilhada com o cardápio presencial. Revisão disponível somente localmente.

## Movimento automático no cardápio presencial — 24/10/2026

Concluído: movimento automático dos produtos do cardápio presencial, sem botão de pausa nos cards ou detalhes. Disponível no ambiente local.

## Refinamento visual do cardápio presencial — 24/10/2026

Concluído refinamento visual do cardápio presencial com maior uso da identidade de cada loja e fotos ampliadas. Catálogo continua somente consulta; novos pedidos seguem com a equipe. Landing e delivery preservados. Disponível somente no ambiente local.

## Cardápio presencial como vitrine — 24/10/2026

Concluído: cardápio por QR code como vitrine de consulta, com fotos maiores e estilo claro da loja. O pedido presencial é feito com a equipe. Fluxo de delivery continua separado. Nova revisão disponível somente no servidor local; GitHub/Vercel permanecem na publicação anterior.

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

## Corpo da landing alinhado à hero — 23/10/2026

Concluído em raia única: Landing.jsx e Landing.css redesenhados abaixo da hero. Faixa de marca, apresentação maior do painel, cardápio em prévia de celular, bloco de personalização, passos de uso, planos claros com destaque lima, FAQ acessível e encerramento com mascote. Mesma paleta oliva/lima/papel, títulos fortes e cantos arredondados; removidos estilos antigos sem uso da landing. Mascote aprovado reutilizado em três pontos, com WebP responsivo/lazy no encerramento; sem nova imagem gerada, serviço ou dependência. Planos e valores existentes preservados, com identificação de demonstração; prévias explicitamente ilustrativas.

LandingHero.jsx/CSS mantêm os mesmos hashes SHA-256 anteriores (3B43AD26…226E58 / FF5A09EB…0C561); animação automática sem pausa confirmada no browser. Nenhuma mudança no cardápio real, lojas, banco ou autenticação. Servidor local mantido em http://127.0.0.1:5176/. Sem publicação ou commit/envio GitHub nesta iteração.

Gate npm run check aprovado: lint, tipos, camadas, 156 testes/19 arquivos, 76 critérios e API/build. Primeira execução teve timeout de 15s em EXPORT-02; segunda passou com esse caso em 2,3s, sem alterar teste ou timeout. Browser desktop1440, tablet900, celular390 e 320px: imagens carregadas, FAQ abre/fecha e troca resposta, âncoras navegam, zero erros. Corrigido tamanho mínimo do grid que cortava o texto em 320px e espaçamento/altura do encerramento. Sem overflow ou links fora da tela em 320px (largura útil305). Capturas peds-body-{platform-desktop,menu-desktop,menu-mobile,closing-desktop,closing-mobile}.png. Não medidos aparelho físico, Web Vitals, rede móvel real ou todas as larguras.

## Mascote com animação automática contínua — 23/10/2026

Concluído conforme pedido explícito: removidos botão, estado React e seletores de pausa da LandingHero. Foto e sombra começam animadas automaticamente e repetem em ciclo de 6s. Exceção CSS específica mantém esse comportamento também sob movimento reduzido, conforme escolha do usuário; não muda a preferência do navegador nem animações de outras páginas.

npm run check aprovado: 156 testes/19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Browser após recarregar confirmou foto e sombra running, zero botões no palco e matrizes de transformação diferentes entre leituras; largura540 sem overflow e zero erros. Captura peds-mascot-auto-motion.png em desktop1280. Conferência em navegador, sem aparelho físico. Servidor local 127.0.0.1:5176 mantido. Sem publicação, commit, banco ou nova dependência; raia única.

## Landing com mascote em destaque — 23/10/2026

Nova LandingHero isolada: mascote aprovado em grande escala, título “Seu negócio. No ritmo dos pedidos.”, destaque oliva/lima, fundo claro, fala e comanda decorativas. Layout responsivo sem mudar cards ou heroes das lojas. Movimento CSS de 6s, flutuação até 18px e rotação ±2°, sombra coordenada e botão de pausa/retomada. Preferência de movimento reduzido começa estática; animação depende de ativação explícita nesse caso. WebP transparente responsivo 640/960px (37.344/61.532 bytes), prioridade alta e dimensões reservadas, derivados da matriz aprovada sem novo serviço ou dependência.

Gate npm run check aprovado: 156 testes em 19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Teste existente de abertura em StrictMode atualizado para o novo título; primeiro gate encontrou somente a expectativa antiga/espaçamento do nome acessível e foi corrigido. Browser local em desktop, 900, 390 e 320px: imagem carregada, sem overflow, zero erros; animação e pausa verificadas em estilos computados. Ambiente de QA solicita movimento reduzido e permite ativar pelo botão. Capturas peds-mascot-hero-desktop.png e peds-mascot-hero-mobile.png. Sem medição em aparelho físico/Web Vitals.

Entrega local em http://127.0.0.1:5176/, servidor mantido para acompanhamento. Nenhum commit/envio GitHub ou novo deploy neste ajuste; produção permanece no deployment AjdsqXxKhmMn8QQA9wUwhX66pyNw com a hero anterior. Nenhuma escrita de dados ou mudança de autenticação. Raia única do agente principal.

## Logo aprovada na landing — 23/10/2026

Concluído: Peds's verde com apóstrofo, mascote sorridente, lettering aprovado no cabeçalho/rodapé/prévia, favicons novos e metadados. Paleta verde e marcas dos estabelecimentos preservadas. Gate 156 testes/76 critérios aprovado; browser desktop/320/390px e produção conferidos. Deploy AjdsqXxKhmMn8QQA9wUwhX66pyNw ativo. Matrizes, arquivos finais e prompts em docs/BRAND.md. Sem commit automático. Servidor local disponível em http://127.0.0.1:5176/.

## Sincronização das correções no GitHub — 23/10/2026

Esta revisão reúne as correções das fotos ausentes e a otimização do carregamento na branch codex/pedss-2026-10-22 de DiegoMicaelvs/pedss, por solicitação explícita do usuário. Inclui fallback ilustrativo identificado, 26 imagens WebP responsivas, prioridades de carregamento, cache por hash, testes e documentação. Corresponde às alterações já validadas em produção no deployment 3QTU5zej65SGtYwwSDtWF5VVJdRS. Gate aprovado: 156 testes e 76 critérios. Registros locais, credenciais, capturas e dados de produção não fazem parte do envio. As notas anteriores sobre código ainda não enviado descrevem o estado em 22/10, antes desta sincronização.


## Carregamento das fotos otimizado — 22/10/2026

Heroes e fotos ilustrativas agora usam WebP responsivo, mantendo os PNGs/URLs legados. Hero de hambúrguer: 2.967.083 → 516.190 bytes em 1254px (82,6% menor), ou 171.002 bytes em 640px. As seis heroes possuem variantes; recortes de produtos têm 480/800/resolução maior. Alpha conferido pixel a pixel na geração; originais e fotos próprias preservados. Primeiros dois itens carregam imediatamente, demais sob demanda; detalhes carregam imediatamente. Hero mantém prioridade alta. Rotas públicas são antecipadas em paralelo à consulta inicial, sem alterar autorização. Cache imutável somente nos novos arquivos com hash de conteúdo.

Gate npm run check aprovado: 156 testes em 19 arquivos, 76 critérios, lint/tipos/camadas/API/build. Browser local com catálogo público confirmou nitidez, alpha/movimento e primeira linha antecipada em desktop e 390px; sem overflow da loja. Deploy dpl_3QTU5zej65SGtYwwSDtWF5VVJdRS, equipe Diego Projects/projeto Pedss, validado com API e WebP 200, SHA-256 igual ao asset local e cache public/max-age=31536000/immutable. Três lojas e 28 produtos integralmente preservados. Promovido a pedss.vercel.app; browser público confirmou hero WebP, 28 fotos, primeiras duas eager, animação ativa e ausência de erros. Sem escrita de catálogo, banco, credenciais, commit ou envio GitHub. Deployment anterior BHmigojRYL6chXV35fzjbi866wAF disponível para recuperação. Não medidos Web Vitals/4G real; a consulta inicial ao servidor ainda é necessária.


## Fotos ausentes na produção corrigidas — 22/10/2026

Diagnóstico confirmado: local /store/demo contém seis produtos demonstrativos com mídia própria/bundled; produção tem outro catálogo, com 28 produtos e image/cutoutImage vazios. Não era falha do upload Vercel ou remoção da projeção. Usuário autorizou imagens ilustrativas por categoria enquanto faltarem fotos próprias. Resolver agora cobre nove categorias somente quando ambos os campos de foto estão vazios; foto/recorte cadastrado mantém prioridade, erros em mídia própria não trocam por genérica. Nada é gravado no cadastro. Cards e detalhes identificam Imagem ilustrativa; detalhes explicam que a aparência pode variar. Mesmo componente atende delivery e QR; hero/layout/movimento existentes preservados.

Alterados productPhotography.js, ProductCutout JSX/CSS, ProductOptions.jsx, DigitalMenu.jsx e testes hero-ui. Dez testes novos: nove categorias sem foto, identificação sem mutação e prioridade/falha de foto própria. Gate npm run check aprovado: 152 testes/76 critérios, lint/tipos/camadas/API/build. Browser com snapshot público de produção em repositório de memória confirmou 28 imagens/legendas, alpha/movimento e aviso dos detalhes; mobile 320px da loja sem overflow. Raia única, sem novo asset/dependência, migração ou escrita de dados.

Deploy dpl_BHmigojRYL6chXV35fzjbi866wAF, mesmo projeto/equipe, testado antes de promover: API 200, imagem WebP 200/image/webp com hash igual ao arquivo local e três lojas/28 produtos integralmente preservados. Promovido a pedss.vercel.app. Browser público confirmou 28 imagens/legendas, fotos verificadas com alpha e quatro matrizes de animação idênticas. Capturas photos-fixed-production.png e photos-fixed-qr-mobile.png. Nenhuma foto fictícia foi salva no banco e nenhum pedido/usuário criado. Sem commit/envio GitHub automático nesta correção; a branch GitHub permanece no commit 21a9bf7 da publicação anterior.

## Publicação da versão local — 22/10/2026

Usuário autorizou envio ao GitHub e ajustes necessários na Vercel. Versão React/Vite atual preservada em codex/pedss-2026-10-22 no repositório privado DiegoMicaelvs/pedss, mantendo main 971e24b intacta por conter outra implementação. Envio completo inclui fontes, testes, assets, modelo local e exemplo de ambiente sem segredos; plan/log/.quality, credenciais, builds e capturas QA permanecem locais. Corrigida regra redundante .env* no fim do .gitignore para respeitar a exceção existente .env.example.

Deploy dpl_AtrBthh7MY4f59khpqYrpm4KMjDd, READY/production, publicado via CLI na equipe Diego Projects e promovido após GET de API/cardápio 200. Domínio pedss.vercel.app confirmado no novo deployment; anterior EFBQv83QvQG5ymoMQooft473pJLT preservado para recuperação. Sem troca de projeto, banco, domínio ou proteção, nem migração de dados/cadastros locais. Gate npm run check aprovado: 142 testes/76 critérios, lint/tipos/camadas/API/build. Raia única.

Comparação da API antes/depois preservou as três lojas e os 28 IDs/preços de produtos; diferenças em campos novos com defaults e IDs transitórios de sacola. Produção já não possuía fotos nos 28 produtos antes deste deploy; não foram substituídas por fotos fictícias. Browser público confirmou hero/frase/cor, novo título/cards, detalhe de produto a R$17 e redirecionamento do painel para login remoto; desktop e 320px sem overflow. Sem criação de pedido/usuário ou alteração de configuração para QA.

Envio GitHub temporariamente interrompido após confirmações do conector recusadas, retomado com autorização explícita do usuário. Revisão automática bloqueou um POST de teste de gestão em produção por possível mutação; não foi executado nem contornado. Substituído por testes automatizados de autorização e verificação visual do login. Evidências privadas em .quality/release-*; capturas release-production-hero/menu/mobile.png.

## Origem da produção conferida — 22/10/2026

Inspeção somente leitura autorizada antes de qualquer envio ao GitHub. Produção pedss.vercel.app aponta para dpl_EFBQv83QvQG5ymoMQooft473pJLT, criada em 21/10/2026 às 15:24:19 (America/Bahia) na equipe Diego Projects, projeto prj_wQ4WydtpnP5OS36ei515W9GpoVxV. Metadados da Vercel confirmam source cli, gitSource null, projeto sem link Git; framework vite, build npm run build e saída dist. Portanto foi envio direto de arquivos, sem origem no GitHub.

Árvore original do deploy contém 127 arquivos de fonte: 88 têm SHA-1 exatamente igual aos arquivos locais, incluindo api/app.mjs, server/database.mjs, server/api.mjs, migração e regras do núcleo; 39 diferem e nenhum está ausente localmente. Confirma mesma base da aplicação local, anterior às mudanças atuais. Em contraste, main de DiegoMicaelvs/pedss (971e24b, 17/10 UTC) usa monorepo apps/packages, pnpm/Turbo e Supabase; não é fonte desse deploy. Pasta local segue sem .git; Git CLI sem autenticação disponível, connector GitHub apenas consultado.

Nenhum commit, branch, envio GitHub, publicação Vercel, alteração de banco/configuração ou código neste turno. Solicitação anterior de envio continua suspensa após usuário pedir calma; destino ainda precisa ser definido considerando a divergência. Evidências privadas ignoradas em .quality/vercel-origin-*.json. Raia única; gate não repetido por serem consultas e registros, último gate de código aprovado 142 testes/76 critérios.

## Selo colorido em todas as heroes — 22/10/2026

Aplicado às heroes de pizzaria, açaiteria, sorveteria, lanchonete de salgados e pastelaria o padrão aprovado da hamburgueria: removida a identificação do tipo de estabelecimento, frase própria centralizada em selo preenchido na cor real da loja, texto com contraste calculado, cantos arredondados, leve inclinação estática e sombra da marca. Frases existentes preservadas em caixa normal. Selo tem largura limitada/quebra equilibrada para textos longos no celular. Simplificado o componente compartilhado, removendo showSegment e estilos da antiga identificação.

Somente StoreHero.jsx/CSS e textos de eyebrow no template foram alterados na aplicação. Fotos, dimensões/movimento, títulos principais, CTAs, body/cards, dados e configurações preservados. Raia única. Gate npm run check aprovado: 142 testes/76 critérios, lint/tipos/camadas/API/build. Cinco modelos inspecionados no browser em desktop 1440 e celular 320px via prévia local dos componentes reais; sem overflow e fotos próprias carregadas. Capturas hero-badge-{segmento}-{desktop,mobile}.png e montagens hero-badges-*-overview.png. Nenhuma dependência nova, escrita de loja/pedido/sacola, Neon, deploy ou commit.

## Selo da chamada da hero de hambúrguer — 22/10/2026

Removida a identificação Hamburgueria da hero por showSegment false no template burger. Mantida a frase Quando a fome pede mais (caixa normal), agora em selo centralizado, preenchido na cor exata da loja, com tipografia legível, cantos arredondados, leve inclinação estática e sombra da marca. Após esclarecimento do usuário, a frase foi preservada e a identificação removida. Demais segmentos conservam suas frases/identificação e estilos anteriores. Alterados StoreHero.jsx/CSS e template burger; Deu fome?, foto/movimento, título do cardápio/cards e dados preservados.

Raia única. Gate final npm run check aprovado: 142 testes/76 critérios, lint/tipos/camadas/API/build. Browser Burger Station em 1440 e 320px, sem overflow, etiqueta de categoria ausente e frase presente. Capturas hero-hunger-label-desktop/mobile/detail.png. Sem nova dependência, escrita de dados, Neon, deploy ou commit.

## Título com bloco na cor da loja — 22/10/2026

Substituído o sublinhado discreto por destaque preenchido na cor exata do estabelecimento em favorito., com cantos arredondados, leve inclinação estática e sombra da mesma cor. Chamada Escolha o seu ganhou peso; próximo usa tom legível derivado da marca. Tipografia maior e forte, quebra flexível para celular, frase e h2 acessível preservados. Único arquivo de aplicação alterado neste turno: StorefrontBody.css, apenas regras do título. Hero, cards e movimento intactos.

Raia única. npm run check aprovado (142 testes, 76 critérios, lint/tipos/camadas/API/build). Browser local Burger Station conferido em 1440, 820 e 320px sem overflow; destaque usa #e9ad73 real. Capturas menu-title-color-desktop.png, menu-title-color-detail.png e menu-title-color-mobile.png. Sem dados, dependência nova, Neon, deploy ou commit. Registro anterior de sublinhado é histórico.

## Tipografia do título do cardápio — 22/10/2026

Concluído ajuste pontual em Storefront.jsx/StorefrontBody.css: chamada Escolha o seu menor, próximo favorito em destaque com DM Sans e traço suave na cor do estabelecimento sob favorito. Espaço textual explícito entre os blocos, preservando nome acessível completo do h2. Escala responsiva para manter a chamada legível no celular. Hero, cards, dados e animações preservados.

Raia única do agente principal. npm run check aprovado (142 testes, 76 critérios, lint/tipos/camadas/build). Browser Burger Station conferido em desktop 1440 e celular 320px, sem overflow; título completo em duas linhas de hierarquia. Capturas menu-title-desktop.png, menu-title-detail.png e menu-title-mobile.png. Nenhuma dependência, dado, Neon, publicação ou commit.

## Cards iguais no desktop, seguindo o mobile — 22/10/2026

Concluído o ajuste solicitado: removidos a barra lateral e o tamanho especial do primeiro favorito. Categorias ficam em faixa horizontal; todos os produtos usam cards equivalentes, em duas colunas acima de 800px, com foto maior, fundo claro e mais presença da cor real da loja no painel/foto/botão. Desktop amplo usa foto de 300px e divisão foto/texto de 45%/55%. Mobile conserva o formato compacto dos itens normais, agora aplicado também ao primeiro produto. Selos pequenos de favorito existentes não alteram tamanho/ordem; nenhum dado de produto foi modificado.

Alterados somente Storefront.jsx e StorefrontBody.css na aplicação. Hero aprovada, fotos e animação sincronizada preservadas; QR e painel fora deste ajuste. Agente principal, raia única. Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. Browser Burger Station local conferido em 1440, 820, 390 e 320px, sem overflow horizontal; filtros, busca/restauração, detalhe e pausa/retomada conferidos. Capturas store-equal-cards-desktop.png e store-equal-cards-mobile.png. Sem nova dependência, escrita de catálogo/sacola/pedido/configuração, Neon, deploy ou commit. Registros abaixo sobre lateral/destaque são históricos e foram superados.

## Cardápio com navegação lateral e painéis — 22/10/2026

Após feedback, substituída a composição anterior por categorias laterais no desktop, destaque amplo para o primeiro produto quando já marcado favorito e demais itens em painéis horizontais de foto/texto/preço. Fotos sem fundo sobre formas claras na cor da loja. Faixa de atendimento simplificada, título Escolha o seu próximo favorito e bloco Como pedir preenchido com a cor da marca. No celular, categorias roláveis, favorito vertical e demais itens compactos lado a lado.

Sidebar sticky a 24px somente acima de 800px, limitada à altura da tela e ao próprio cardápio. Nenhuma sobreposição da sacola adicionada. Destaque depende de featured existente, sem alterar produtos/ordem ou inventar ranking. Storefront.jsx/CSS de body alterados; hero, animações dos produtos, banco, casos de uso e dados preservados. Backup local da versão anterior em .quality/body-grid-backup.

Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. Browser desktop 1440, tablet 820 e celulares 390/320 conferidos, sem overflow horizontal; filtros, busca/restauração e detalhes de bebida funcionaram. Seis fotos mantiveram matrizes idênticas; pausa do catálogo não para hero. Capturas store-panels-desktop.png e store-panels-mobile.png. Raia única, sem dependência nova, pedido/sacola/configuração gravados, Neon, deploy ou commit.

## Corpo da loja redesenhado — 22/10/2026

Área do delivery abaixo da hero renovada: faixa de atendimento/tempo/taxa/retirada com dados reais, título Qual é a sua vontade?, busca ampliada, categorias com ícones/contadores e destaque na cor da loja, contagem de resultados, cards claros com tipografia/preço/CTA refinados e novo bloco Como pedir de três passos. Rodapé ficou mais legível. Paleta acompanha estabelecimento, com três colunas no desktop, duas até 900px e uma no celular.

Alterados Storefront.jsx e novo StorefrontBody.css de apresentação, importado depois dos estilos existentes e limitado à loja/body. Hero aprovada, fotos transparentes e movimento coordenado preservados; detalhes/checkout/casos de uso e dados não alterados. Raia única do agente principal. Nenhuma dependência ou serviço novo.

Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. Browser local conferiu filtros, busca vazia/restauração, detalhe de bebida, desktop/tablet/celulares, pausa/retomada e seis matrizes de fotos idênticas; hero continuou animada durante pausa do cardápio. Capturas store-body-*.png. Sem item/pedido criado, configuração gravada, Neon, deploy ou commit. Cardápio QR não foi redesenhado neste turno.

## Mesmo padrão nos cinco segmentos — 22/10/2026

Heroes de pizzaria, açaiteria, sorveteria, lanchonete de salgados e pastelaria alinhadas à hamburgueria: título curto panorâmico, produto central sem fundo, forma colorida, pílulas e etiqueta de preço na cor do estabelecimento, fundo claro e animação automática sem pausa. Chamadas: Deu fome? (pizza/salgados/pastel), Deu vontade? (açaí), Deu calor? (sorvete). sideTitle de cada template substitui texto lateral genérico. Fotos próprias existentes e cor real da loja preservadas; não há paleta fixa por segmento.

CSS dimensiona os títulos mais longos de açaí/sorvete no desktop/celular. Nenhuma mudança no modelo de dados, configuração salva, catálogo ou movimento dos produtos. Raia única do agente principal. Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. HERO-04 ampliado para on/ausência de pausa de todos os segmentos; expectativas de chamadas nos fluxos de configuração/criação atualizadas.

Browser conferiu os cinco modelos em desktop 1440×1000 e celulares 390×844/320×844, com prévia local descartável usando os componentes reais e cores/preços fictícios. Demo existente de pizzaria confirmada com cor #ff6825. Dez capturas hero-{segmento}-{desktop,mobile}.png e montagem real hero-segments-overview.png. Viewport restaurado e abas QA fechadas. Sem gravação de dados, Neon, dependência nova, deploy ou commit.

## Hero colorida e sempre animada — 22/10/2026

Mantidos Deu fome?, foto original e composição central. Cor efetiva do estabelecimento agora preenche forma orgânica atrás da foto, etiqueta inclinada do preço, pílulas e detalhes do CTA escuro. Fundo da página continua claro. Texto lateral Sua fome. Seu momento. ganhou hierarquia. Sem verde fixo: todas as superfícies derivam de --store-accent e textos usam cores de contraste existentes.

Hero passou a data-motion on permanente: removidos botão/estado/imports de pausa e assinatura de matchMedia. Foto e sombra iniciam automaticamente; ciclo normal 6s, variante menor e lenta de 9s sob preferência reduzida, ainda contínua. Movimento do cardápio e respectivo controle de pausa permanecem independentes.

Agente principal, raia única. Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build; testes existentes ampliados para ausência de botão e hero on mesmo após pausar os produtos. Browser desktop/tablet e celulares 390/320 conferidos; capturas hero-brand-desktop.png e hero-brand-mobile.png. Sem dados, configurações de loja, Neon, biblioteca nova, deploy ou commit alterados. Registros anteriores de pausa da hero são históricos.

## Hero com produto central e título panorâmico — 22/10/2026

Composição anterior de duas colunas/painel arredondado substituída por hero aberta de fundo claro: título panorâmico Deu fome?, foto original do hambúrguer centralizada abaixo/sobre a base do título, descrição/perks à esquerda e preço/CTA à direita. Sem moldura externa ou placa inclinada. No celular a foto vem primeiro, seguida por descrição e pedido; preço/CTA quebram em duas linhas no aparelho mais estreito. Cor da loja e foto ilustrativa original preservadas.

Agente principal em raia única, sem delegação. Alterados somente StoreHero JSX/CSS e título do template burger, além dos registros. Cardápio, recortes e animação coordenada dos produtos preservados. Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. Sem dependência nova, escrita de dados/configurações, Neon, deploy ou commit. Seções anteriores sobre a moldura editorial descrevem a versão superada.

## Nova hero com composição de pôster — 22/10/2026

Gate npm run check aprovado: 142 testes/76 critérios, lint, tipos, camadas, API e build. Aviso já existente do chunk opcional model-viewer permanece.

Hero redesenhada no componente compartilhado: painel claro com cantos de 32px, faixa superior editorial, foto original sobre placa suave na cor da loja, tipografia renovada, CTA escuro com seta na cor da marca e preço em etiqueta retangular. Removidos órbitas, asteriscos, anotação manuscrita e selo circular. Hamburgueria ganhou o texto Seu próximo favorito está aqui. Segmentos existentes preservam suas fotos/textos próprios; nenhuma configuração de loja foi gravada.

Movimento e pausa da hero preservados com preferência reduzida; fotos/movimento coordenado do cardápio não alterados. Verificação desktop 1440×1000 e celular 390×844/320×844, CTA até o cardápio e animação/pausa conferidos no browser. Sem overflow lateral nas duas larguras móveis. Capturas hero-editorial-desktop.png e hero-editorial-mobile.png. Demo permanece configurada como pizzaria; prévia de hamburgueria em /store/burger-station. Entrega local, sem deploy, Neon, dependência nova ou commit.


## Movimento coordenado — 22/10/2026

Fotos do cardápio agora movem-se juntas, com amplitude um pouco maior e ciclos suaves preservados. Timeline compartilhada inclui foto carregada depois e detalhes reabertos; sombra sincronizada. Gate 142 testes/76 critérios e browser aprovados. Visual dos cards e hero preservados; entrega local.

## Movimento mais suave — 22/10/2026

Animação de fotos do cardápio suavizada: menos deslocamento/inclinação, ciclo padrão 7,5s e reduzido 10s, sombra mais estável. Mesmos componentes para lojas/categorias/detalhes; visual claro e hero preservados. Gate 141 testes/76 critérios e ciclo real no browser aprovados. Local, sem deploy.

## Sacola pelo cabeçalho — 22/10/2026

Barra flutuante que sobrepunha cardápio removida. Meu pedido no cabeçalho mantém contador e abre checkout. Teste de UI e navegador com item confirmaram o fluxo; gate 141 testes/76 critérios. Sem mudança no visual dos cards, movimento ou hero. Local, sem publicação.

## Cards claros arredondados — 22/10/2026

Estado atual: cards retangulares de cantos arredondados, fundo claro e painel de borda simples, sem arco. Todas as categorias, delivery/presencial e detalhes; movimento atual e hero preservados. Gate 141 testes/76 critérios e inspeção desktop/celular/QR aprovados. Local, sem deploy.

## Acabamento claro atual — 22/10/2026

Arco preservado com fundo perolado, contorno duplo delicado e base suavemente tingida pela cor da loja. Card branco e sombras mais leves, em todas as categorias/detalhes do delivery e presencial. Movimento atual após rollback mantido; hero independente. Gate 141 testes/76 critérios e browser desktop/celular/QR aprovados. Entrega local.

## Estado atual após rollback — 22/10/2026

A pedido do usuário, voltou a vitrine escura em arco com o movimento lateral anterior ao pedido citado. Fundo claro, giro limitado centrado e teste subsequente de spin 360° foram revertidos. Outras funcionalidades e fotos permanecem. Gate 141 testes/76 critérios e inspeção desktop/móvel aprovados; sem deploy.

## Fundo claro e rotação centrada — 22/10/2026

Direção atual substitui arco escuro e deslocamento lateral: cards brancos, painel cinza claro, disco branco e fotos girando em perspectiva sobre o próprio centro. Mesmo padrão em delivery/QR/detalhes; pausa e hero independente. Validação visual/matrizes e gate 141 testes/76 critérios concluídos localmente. Efeito de foto, sem vista traseira 360° gerada.

## Vitrine em arco — 22/10/2026

Direção visual anterior substituída após feedback: painel escuro em arco, halo da cor da loja e contorno fino, com categoria e preço organizados na base clara. Mesmo padrão em delivery, QR e detalhes; movimento preservado e hero independente. Gate 141 testes/76 critérios e inspeção desktop/celular aprovados. Entrega local.

## Acabamento dos cards — 22/10/2026

Entregue localmente: moldura arredondada, painel suave, sombra e destaque de foco/hover na cor da loja em todas as categorias. Fotografias transparentes continuam com movimento e pausa; hero intacta. Delivery, QR e celular verificados; gate 141 testes/76 critérios aprovado. Sem publicação nesta etapa.

## Todas as categorias com fotos sem fundo — 22/10/2026

Entregue localmente: mesma apresentação animada para burgers, porções, bebidas, sobremesas, pizza, açaí, sorvete, salgados e pastel, nos cards/detalhes do delivery e presencial. Upload principal processa fundo em qualquer categoria. Três recortes demo novos; hero preservada. Gate 141 testes/76 critérios e QA desktop/celular/QR aprovados. Fotos legadas personalizadas exigem gerar/revisar o recorte no cadastro; publicação permanece pendente de pedido.

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

| Marco | Estado |
| --- | --- |
| Remoção automática de fundo | Entregue localmente; upload único gera foto original e versão transparente para cards/detalhes do cardápio, processamento em worker no navegador, prévia comparativa, cancelamento e preservação em falhas. Sem serviço pago por foto |
| Fotos próprias no cardápio de hamburgueria | Recortes com alpha verificado; sem retorno a foto opaca. Demo corrigida entre navegadores e Brasa Original isolado sem acompanhamentos. Fotos transparentes com flutuação/balanço/sombra em CSS e pausa; hero preservada |
| Visualização 360° real | Viewer GLB e campo por produto implementados; geometria real/pausa testadas. Teste autorizado no TRELLIS.2 gerou prévia, mas extrações falharam e a cota ZeroGPU impediu nova geração por cerca de 24h. Sem GLB de produto obtido nem API de geração contratada; Meshy recusada |
| Identidade visual e navegação | Entregue; nome alterado de Brasa para Pedss em 21/10/2026 |
| Modelos da hero da loja | Hamburgueria, Pizzaria, Açaiteria, Sorveteria, Lanchonete de salgados e Pastelaria implementados localmente; seletor, prévia, cor, fundo branco/suave e preço da categoria correspondente |
| Movimento das imagens da hero | Flutuação/rotação suave e sombra sincronizada nos seis modelos; Animar/Pausar e redução de movimento respeitada. Validado localmente |
| Tipo no cadastro de estabelecimento | Obrigatório em novos cadastros da central; inicializa modelo, aparece na listagem e permanece preenchido na edição. Implementação local verificada |
| Operação local e migração legada | Preservadas; dados locais não são enviados automaticamente ao banco |
| Cardápio presencial, QR, cupons e dashboard | Entregues; modo remoto consulta API compartilhada |
| Modelo, importação e exportação XLSX | Entregues; comandos revalidados no servidor |
| Prévia e recorte de imagem | Entregues; imagens pequenas persistidas no banco no modo remoto |
| Backend e banco Neon | Implementados; migração aditiva, transações e autorização por loja |
| Sessões, primeiro acesso e convites | Servidor + cookie; código privado no primeiro acesso; convites por link |
| Sincronização entre dispositivos | Polling de 15 segundos; catálogo e pedidos compartilhados |
| Publicação na Vercel / Diego Projects | Entregue: https://pedss.vercel.app público, previews/deployments protegidos e gestão com login Pedss |
| Recuperação de senha por e-mail, MFA/provedor de identidade | Pendente; não simulada como pronta no modo remoto |
| Pagamentos online, cobrança de assinatura e fiscal | Integrações futuras |
| Normalização SQL, paginação e storage de mídia | Próxima etapa para escala; limites em docs/DEPLOYMENT.md |
| Branches por ambiente, backups e restauração | Pendentes antes de operação comercial |

## 03/11/2026 — Servidor local iniciado

Pedido para executar localmente atendido com npm run dev -- --host 127.0.0.1 --port 5176 --strictPort. Vite iniciou e a landing http://127.0.0.1:5176/ foi aberta e conferida no navegador, sem erros de console. Runtime de demonstração local; conexão PostgreSQL remota desativada pelo guard existente. Sem alteração de código, env, cadastros, banco, publicação ou commit. Gate não repetido para simples inicialização do processo; último gate de código registrado permanece válido. Nenhuma nova lacuna identificada nesta verificação de abertura.

## 03/11/2026 — Prévia fixa no montador de pizza mobile

Pedido atendido localmente em src/components/PizzaBuilder.css: a prévia passa a usar sticky/top0/z-index4 no layout de uma coluna; a rolagem do modal reserva248px para manter opções focadas fora da área ocupada pela pizza. Layout desktop de duas colunas preservado. Sem alteração de preços, ingredientes, hero, banco ou lógica do pedido. Sem commit, envio GitHub ou deploy nesta tarefa.

Gate npm run check aprovado:348 testes/48 arquivos e188/188 critérios, lint/tipos/camadas/build. Log .quality/pizza-mobile-sticky-gate-2026-11-03.log. Navegador local na Cia da Pizza validou390x844 e320x568, três e quatro sabores, nomes longos, seleção de massa/borda, botão adicionar e ausência de overflow horizontal. A posição da prévia permaneceu em y89 enquanto a rolagem mudou de1711 para1981 na verificação final. Desktop1440x900 manteve grid de duas colunas e scroll-padding auto. Console sem erros. Viewport temporário restaurado. Evidências .quality/pizza-mobile-sticky-browser-2026-11-03.json e capturas pizza-mobile-sticky-390/320-2026-11-03.png. Apenas rascunho de montagem no navegador, sem adicionar à sacola ou criar pedido. Limite: inspeção em navegador emulado, sem aparelho físico ou teclado virtual nativo; produção permanece na versão anterior até nova solicitação de publicação. Raia única, agente principal.


## 03/11/2026 — Rollback da prévia fixa solicitado

Revertido exclusivamente o ajuste anterior de src/components/PizzaBuilder.css: prévia mobile novamente relative/top:auto e reserva de248px da rolagem removida. Arquivo idêntico ao HEAD, sem diferenças funcionais remanescentes desta alteração. Registros anteriores preservados como histórico. Gate npm run check aprovado:348 testes/48 arquivos e188/188 critérios, lint/tipos/camadas/build. Navegador390x844 confirmou position:relative, scroll-padding:auto e topo da prévia de128 para-378 ao rolar506px. Viewport restaurado. Evidências .quality/pizza-mobile-rollback-browser-2026-11-03.json e .quality/pizza-mobile-rollback-2026-11-03.png; log .quality/pizza-mobile-rollback-gate-2026-11-03.log. Sem pedido, cadastro, banco, commit ou deploy; outras alterações da pasta preservadas.


## 03/11/2026 — Revisão comercial da pizzaria

Análise sem alterações funcionais: módulos principais já implementados/publicados. Recomendações priorizam montador mobile, busca interna de sabores, transparência do preço, configuração assistida/simulador, relatórios por sabor/tamanho, etapas individuais de produção e impressão térmica validada. Compras/lotes/validade e backup integral por loja ficam como evolução. Achados, evidências e limites em docs/GAPS.md, seção Revisão da pizzaria para apresentação comercial. Sem novos testes operacionais, commits ou deploy; último gate348/188 preservado.


## 03/11/2026 — Refinamentos da pizzaria concluídos localmente

Montador mobile em três etapas com prévia recolhível (sem reintroduzir sticky), busca/filtros internos, composição do preço, configuração guiada e simulador com o mesmo cálculo do pedido. Relatório por sabor/tamanho decompõe combos e usa snapshots históricos; cozinha controla cada pizza; impressão tem vias cozinha/cliente/entrega e 58/80mm. Compras com fornecedor, lote/validade e custo médio; agenda reserva espaços e minutos por tamanho, revalidando edições. Operações remotas preparadas nos contratos existentes, sem integrar ou acessar banco nesta tarefa. Hero e cards preservados.

Gate final npm run check aprovado:363 testes/50 arquivos e203/203 critérios, lint/tipos/camadas/build/API. Log .quality/pizzeria-launch-gate-verified.log. Primeiro gate excedeu o timeout de um teste antigo XLSX; isolado e dois gates completos seguintes passaram sem aumentar timeout. UI desktop e390x844/320x568 conferida com runtime descartável em memória, incluindo sacola, cozinha, compras, impressão e relatório. Loja real em localhost:5176 conferida somente para abertura do montador; nenhum pedido/cadastro real alterado. Sem commits, push ou deploy.

Limites: impressão e celular físicos ainda requerem ensaio; compras registram lotes recebidos e alertas, sem saldo por lote/FEFO/baixa automática por validade. Forno reserva capacidade conservadoramente, sem otimizar fornadas. Pedidos antigos sem snapshots ficam fora do detalhamento e são sinalizados. Backup/restauração integral por loja e recuperação remota por e-mail continuam evoluções. Detalhes em docs/PIZZERIA-REFINEMENTS.md e docs/QA.md.


## 03/11/2026 — Carregamento das fotos das pizzas

Corrigido ProductCutout: arquivos versionados confiáveis não são mais tratados como carregados antes de load/decode. A animação só inicia após a decodificação; fotos próximas da tela têm carregamento antecipado por IntersectionObserver, com rechecagem ao rolar, pageshow e retorno à aba. Falhas preservam o estado de foto indisponível e resultados de decodificação antigos não liberam outra imagem. Verificação de transparência das fotos próprias, movimento coordenado, hero, cards e cadastros preservados.

Gate npm run check aprovado:366 testes/50 arquivos e206/206 critérios, lint/tipos/camadas/build/API. Log .quality/pizza-image-lifecycle-gate-final.log. Três novos testes de ciclo de carregamento; os testes de movimento existentes agora simulam complete/naturalWidth e aguardam decode, mantendo as mesmas garantias. Nenhuma biblioteca, alteração de banco, commit, push ou deploy.


## 03/11/2026 — Refinamentos publicados no GitHub e na Vercel

Alterações funcionais enviadas para guilhermeepereiraa2004-ops/pedss/main no commit c23c8f69c66b125ab5e2c42f675574a057ab547b. A integração Git criou o deployment de produção dpl_FvjK4UFgFyLiGvTwvXXZTVE2E8ZB (READY), projeto pedss/prj_wQ4WydtpnP5OS36ei515W9GpoVxV na equipe Diego Projects, funções gru1. Publicados montador em etapas/busca/preço detalhado, assistente/simulador, relatórios, produção por pizza, vias térmicas, compras/lotes e capacidade de forno, além da correção de load/decode das fotos. Este registro documental não altera funcionalidades.

Gate local366 testes/50 arquivos e206 critérios aprovado; GitHub Quality41679447419 success. API pública antes/depois preservou hashes dos catálogos/configurações,6 lojas e48 produtos, sem escrita operacional, seed ou migração no banco. Leitura anônima sem contas/sessões. Bundles publicados nos domínios pedss.com.br/www.pedss.com.br/pedss.vercel.app contêm simulador, relatório, compras e correção de decode; assets Dashboard-BGF4NZLv.js e StoreLogo-D4YbqyBy.js. Navegador conferiu as8 fotos do cardápio remoto, todas carregadas e verificadas; console sem erros. Logs do deployment:0 registros error na janela15m.

O alias manual pedss.vercel.app ainda apontava para o deployment anterior, apesar do domínio próprio já estar novo; foi explicitamente realinhado ao novo deployment do mesmo projeto. Conferir esse alias em futuros envios Git. Configurações e14 sabores do ambiente local não são importados automaticamente: a Cia publicada preserva seus8 produtos e precisa configurar o montador no próprio painel para oferecê-lo ao cliente. Sem novas credenciais, serviços, plano ou alteração de proteções. Limites de impressão/dispositivo físicos e lote por recebimento continuam em docs/PIZZERIA-REFINEMENTS.md.


## 03/11/2026 — Rollback da fatia destacada

Revertida somente a composição visual da pizza com fatia separada, conforme pedido do usuário. ProductCutout.jsx e ProductCutout.css restaurados byte a byte ao HEAD3fa24c4; imagens inteiras, animação coordenada e correção de load/decode preservadas. Navegador confirmou14 fotos carregadas/animadas e nenhum elemento de fatia destacada. Viewport restaurado. Sem alteração de dados, hero, montador, commit ou publicação. Evidência .quality/pizza-slice-rollback.png.

Gate do rollback aprovado: npm run check,366 testes/50 arquivos e206 critérios, lint/tipos/camadas/build/API. Log .quality/pizza-slice-rollback-gate.log.


## 04/11/2026 — Cardápio completo no balcão e telefone

Concluído localmente: paridade de opções entre cardápio e atendimento de balcão/telefone; montagem visual, combos, categorias/busca e edição. Gate391/226 aprovado. Publicação desta mudança aguarda pedido do usuário.


## 04/11/2026 — Recuperação de conexão, versões e retorno ao cardápio

Implementados localmente: preservação da loja no acompanhamento, retomada da conexão sem repetição de gravações e recuperação limitada de versão após falha de importação. Próxima etapa de entrega: publicar quando solicitado e conferir domínio principal/alias e assets ausentes em produção.

## 04/11/2026 — Auditoria da pizzaria em produção (parcial)

Auditoria realizada na aba do ChatGPT, respeitando a proibição de excluir dados, mudar regras/configurações e executar alterações diretas no banco. Fluxo público validado até criação, persistência, consulta e repetição do único pedido fictício #62892B6B (R$ 62,90, retirada, Pendente, sem pagamento, identificado NÃO PREPARAR/NÃO ENTREGAR/NÃO CONTATAR). Pedido preservado; repetição deixou apenas rascunho na sacola. Nenhuma comunicação externa, pagamento, alteração de acesso, commit ou deploy.

Falhas reproduzidas: editar item reinicia nome/observações/modalidade/pagamento do checkout e recoloca frete; acompanhamento sem pedido volta para /store/demo inexistente; www e alias Vercel continuam com bundles diferentes. Fotos carregaram durante a navegação; montador/preço e cardápio presencial funcionaram nos casos exercitados. Detalhes e matriz dos 16 módulos em docs/PIZZERIA-PRODUCTION-AUDIT-2026-11-04.md.

Painel de produção exige login na sessão disponível: não foi validado nem houve tentativa de contornar autenticação. Receber/aceitar/preparar/pronto para retirada/concluir e atualização simultânea real continuam pendentes de sessão autenticada.114 testes complementares em18 arquivos passaram, log .quality/pizzeria-production-audit-supplement.log; são testes locais descartáveis e não equivalem a validação administrativa remota. Nenhuma implementação alterada, gate anterior408/238 preservado. Viewport efetivo631x572; tentativa390x844 não aplicada pelo navegador e override restaurado, sem afirmar teste em celular físico. Raia única, agente principal.

## 04/11/2026 — Resultado do painel em produção

Concluída inspeção dos 16 módulos e percursos QA de retirada/telefone/entrega, com atualização automática e pagamento separado. Próximas prioridades: preservar rascunho do checkout, publicar correções já preparadas quando solicitado, alinhar aliases, revisar classificação/vínculo dos sabores e custos reais, refinar tabela estreita e textos. Cadastros/regras/finanças/acessos preservados; gravações desses módulos exigem ambiente descartável ou escopo específico de homologação. Relatório: docs/PIZZERIA-PRODUCTION-AUDIT-2026-11-04.md.
## 04/11/2026 — Cadastro único da Cia da Pizza em produção

Concluído pelo painel: vínculo dos 14 sabores existentes, compartilhamento dos ingredientes removíveis e classificação de Chocolate com Morango/Banana com Canela como doces. Fotos, descrições e preços preservados. Verificados cardápio individual, montador e filtro Doces. Próximo refinamento de UI registrado: evitar repetição das opções de retirada no sabor individual vinculado. Sem commit/deploy ou alteração dos pedidos existentes.
