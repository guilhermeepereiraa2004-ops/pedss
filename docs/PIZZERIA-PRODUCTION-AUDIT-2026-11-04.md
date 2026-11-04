# Auditoria da pizzaria em produção — 04/11/2026

**Resultado: percurso público e administrativo concluído dentro dos limites autorizados.** Após o usuário disponibilizar a sessão autenticada, os 16 módulos do painel foram abertos e inspecionados. Foram exercitados pedidos de retirada e de telefone/entrega, montador no atendimento, transições, atualização automática entre abas, filtros de status/busca, prévias de impressão e download do QR. Operações financeiras, salvamento de regras, exclusões e alterações de acesso não foram executados. Módulos sem cadastros tiveram inspeção dos formulários e rascunhos, não homologação completa de gravação.

## Ambiente e limites

- Loja: `https://www.pedss.com.br/store/cia-da-pizza`.
- Cardápio presencial: `https://www.pedss.com.br/menu/cia-da-pizza`.
- Navegação realizada na aba do próprio ChatGPT, conforme instrução do usuário. Uma tentativa anterior no Chrome foi interrompida pela ferramenta; não foi repetida.
- Nenhuma exclusão, alteração de preço, regra de negócio, configuração, acesso, credencial, infraestrutura ou schema. Nenhum acesso direto ao banco, publicação ou commit.
- Pedido fictício público **#62892B6B**, criado às 13:45 de 04/11/2026, **R$ 62,90**, retirada, Pix apenas como preferência: avançou no painel por Aceito → Preparando → Pronto para retirada → Entregue (14:20:28), mantendo pagamento Pendente.
- Pedido fictício de telefone **#FB43BC92**, criado às 14:26:42, **R$ 64,90** (pizza R$ 59,90 + frete R$ 5,00), endereço fictício e Pix como preferência: avançou por Aceito → Preparando → A caminho → Entregue (14:28:02), mantendo pagamento Pendente.
- Ambos identificados como TESTE QA / NÃO PREPARAR / NÃO ENTREGAR / NÃO CONTATAR e preservados. Nenhum pagamento registrado ou executado. Por serem pedidos operacionais fictícios sem um marcador de exclusão de relatório, **somam R$ 127,80 ao saldo a receber e às vendas entregues e entram na contagem de pedidos**. Não contam como receita recebida. Não foram cancelados nem apagados para limpar esses indicadores.
- “Pedir novamente” adicionou uma cópia à sacola pública deste navegador; essa cópia **não foi enviada**. O segundo pedido acima foi criado separadamente no atendimento por telefone.
- Não foram enviados WhatsApp, e-mail, SMS, notificações externas ou impressão física.
- A tentativa de viewport 390×844 não se refletiu no tamanho efetivo da aba, medido em 631×572; a configuração temporária foi restaurada. A inspeção visual desta rodada é de janela estreita, **não valida um celular físico nem exatamente 390 px**.

## Problemas reproduzidos

### P1 — Editar o item reinicia o formulário da finalização

Reprodução: abrir a sacola, escolher Retirada, preencher nome e observações do pedido, selecionar Pix, clicar em Editar Monte sua pizza e salvar a montagem. O formulário volta com nome e observações vazios, Dinheiro e Entrega selecionados. A taxa de R$ 5,00 reaparece: uma pizza de R$ 62,90 passa a totalizar R$ 67,90.

Não houve cobrança indevida: o segundo pedido não foi confirmado. O risco é perda de preenchimento e envio na modalidade errada se o cliente não revisar novamente. A edição preserva corretamente os sabores, massa, borda e observações **do item**; a falha está no formulário **do pedido**.

Evidência: `.quality/pizzeria-audit-checkout-reset.png`, observação DOM dos campos após salvar e código de `Checkout.jsx`/`Storefront.jsx`: o componente do formulário é desmontado ao editar a linha e recriado com valores padrão. Correção sugerida: preservar o rascunho do checkout durante edição/fechamento e revalidar somente campos afetados. Não implementada nesta auditoria.

### P1 — Retorno do acompanhamento sem pedido aponta para loja inexistente

Reprodução: no rodapé da Cia, Acompanhar pedido → `/acompanhar` → Voltar ao cardápio → `/store/demo`. Resultado: “Estabelecimento não encontrado”. O botão “Conhecer a loja demo” aponta para essa mesma página, sem saída útil para a Cia.

Com um pedido válido identificado, o retorno aponta corretamente para `/store/cia-da-pizza`. Portanto, os dois caminhos têm comportamentos diferentes. A correção já preparada localmente na tarefa anterior ainda não está publicada.

Evidência: `.quality/pizzeria-audit-return-error.png`.

### P2 — Domínios públicos com versões diferentes

Leitura do HTML renderizado confirmou:

| Domínio | Arquivo principal |
| --- | --- |
| `www.pedss.com.br` | `/assets/index-I5h4j2to.js` |
| `pedss.vercel.app` | `/assets/index-D7QnkhOv.js` |

É uma divergência de publicação já identificada na investigação anterior, que pode fazer usuários acessarem funcionalidades diferentes. Esta rodada não realinhou aliases e não atribui todos os episódios de reconexão a essa divergência.

### Ajustes de experiência, sem falha de cálculo

- A descrição publicada da Cia ainda diz “Prévia local da Cia da Pizza”, inclusive no cardápio presencial.
- No produto Calabresa individual, Grande é um adicional marcado em checkbox; no montador, tamanho é uma escolha própria. Os valores conferiram, mas os dois caminhos poderiam ter uma apresentação mais consistente.
- “Pedir novamente” confirmou a adição à sacola, mas permaneceu no acompanhamento. Um acesso direto à sacola ajudaria a continuar a compra.
- O acompanhamento de retirada exibe a linha “Entrega R$ 0,00”. O valor está correto, mas o rótulo poderia acompanhar a modalidade.
- A ação final de retirada se chama “Concluir entrega”. Funcionou, porém “Confirmar retirada” seria mais específico.
- Na janela estreita do painel, a tabela de pedidos mede 949 px dentro de uma área de 574 px e exige rolagem horizontal; total/status não ficam imediatamente visíveis, enquanto a coluna de ações permanece sobre a área rolável. Evidência: `.quality/pizzeria-audit-admin-orders.png`. Não é perda de dados, mas dificulta operação em telas estreitas.
- Equipe ainda usa o subtítulo “Acessos locais”; Agendamento mostra “Capacidade da cozinha”, apesar de não existir módulo/etapa de cozinha exigida na operação testada. São textos a revisar.

### P2 — Pizzas doces classificadas como salgadas

Em Pizzaria → Combinações e ingredientes, Chocolate com Morango e Banana com Canela estão cadastradas como Salgado. No simulador administrativo, Tipo de sabor → Doces resulta em “Nenhum sabor encontrado”. O filtro funciona segundo o cadastro, mas a classificação publicada está incorreta. Não foi alterada nesta auditoria.

### Pendências de configuração — não confundir com falha do sistema

- O painel informa **0 de 14 sabores vinculados ao cardápio**. Produtos individuais e montador continuam cadastros independentes; mudanças futuras de disponibilidade, ingredientes ou preço podem divergir. Exemplo observado: Calabresa individual permite retirar cebola/orégano, mas o sabor Calabresa do montador tem ingredientes removíveis vazios. Os preços exercitados coincidiram.
- Não há ingredientes/fichas técnicas cadastrados; custo do produto consultado também estava vazio. As pizzas montadas ainda não têm custo completo para apuração da margem. O financeiro explica que só considera vendas integralmente pagas; nesta loja não havia nenhuma.
- Mesas, comandas, cupons, combos, fornecedores, compras e turnos de caixa estavam sem registros visíveis. Agendamento estava desativado. Isso limita o teste completo sem cadastrar dados ou mudar a configuração autorizada a preservar.
- Frete atual é fixo em R$ 5,00, com entrega e retirada habilitadas. A tela de km explica a dependência de chave de rotas no servidor; nenhuma chave/configuração externa foi investigada ou alterada nesta rodada.

## Fluxos públicos exercitados

| Caso | Resultado observado |
| --- | --- |
| Abrir Cia da Pizza | Funcionou; loja aberta, prazo 35–50 minutos, taxa fixa R$ 5,00 |
| Fotos dos produtos | As 14 fotos carregaram ao percorrer o cardápio, inclusive Pepperoni e Toscana; não houve foto permanentemente ausente nesta sessão |
| Buscar Calabresa | Retornou apenas o sabor correspondente |
| Busca sem resultados | Mostrou mensagem apropriada e Ver todo o cardápio recuperou a lista |
| Entrada Monte sua pizza | Acessível separadamente das pizzas individuais |
| Tamanho Grande e três sabores | Prévia com terços de Mussarela, Calabresa e Frango com Requeijão; demais sabores desabilitados ao atingir o limite |
| Preço dos sabores | R$ 54,90 pela regra atual de maior valor, entre R$ 44,90 / R$ 49,90 / R$ 54,90 |
| Massa e borda | Fina + R$ 2,00 e Requeijão + R$ 8,00 → R$ 64,90; detalhamento mostrou as parcelas |
| Adicionar à sacola | Contador e aviso de adição apareceram; ícone flutuante abriu a sacola |
| Quantidade | Duas unidades → R$ 129,80; retorno a uma unidade correto |
| Retirada | Removeu taxa de entrega |
| Editar a montagem | Recuperou sabores, massa, borda e observações do item; voltar à Tradicional reduziu total para R$ 62,90; formulário do pedido sofreu a falha descrita acima |
| Campos obrigatórios | Bloqueou confirmação vazia com mensagens de nome, telefone, rua, número e bairro |
| Cupom inexistente | Recusou QA-INEXISTENTE-0411, sem desconto; limpar o campo reabilitou confirmação |
| Troco insuficiente | R$ 10,00 para pedido de R$ 62,90 foi bloqueado |
| Confirmar pedido | Criou #62892B6B uma vez, com composição e total corretos |
| Persistência | Pedido continuou acessível após recarregar a página |
| Acompanhamento | Mostrou Pendente, composição, observações e preferência Pix; não exibiu “Pago” |
| Consulta pelo link | Colar o link válido em Acompanhar recuperou o pedido correto |
| Retorno de pedido válido | Abriu a Cia corretamente |
| Repetir pedido | Adicionou uma linha à sacola com mesma composição e preço atual; nenhuma confirmação adicional |
| Calabresa individual | Grande + R$ 10,00, borda + R$ 8,00 e sem cebola → R$ 57,90; somente rascunho, não adicionado/enviado |
| Cardápio presencial | Listou 15 opções, incluindo montador; detalhes mostraram preços por tamanho, massas e bordas, orientando pedir com a equipe, sem finalizar compra |
| Console | Nenhum aviso/erro capturado na aba do fluxo público na consulta final; isso não exclui falhas intermitentes fora da sessão |

## Cobertura administrativa e pendências reais

Sessão administrativa fornecida pelo usuário no domínio `www.pedss.com.br`, utilizada somente na aba do próprio ChatGPT. O bloqueio por login da primeira rodada foi resolvido pelo usuário. Nenhuma senha foi procurada ou manipulada.

| Módulo | Resultado em produção / limite |
| --- | --- |
| Visão geral | Indicadores, rankings, saldo e comparação mensal carregaram. Pedido público passou a compor a contagem; receita e ticket pagos continuaram zerados. Após concluir o QA, ele saiu da lista de andamento. Sem validar rankings com recebimentos reais. |
| Pedidos | Dois pedidos QA percorreram o fluxo de retirada e entrega, com botões adequados e sem bloqueio de cozinha. Busca TESTE QA e filtros Entregue/Pendente funcionaram. Detalhes/histórico corretos; prévias Cliente/80 mm e Entrega/58 mm completas. Edição posterior, cancelamento, estorno e impressão física não exercitados. |
| Balcão e telefone | Catálogo completo e montador disponíveis. Grande, 2 sabores (Mussarela/Calabresa), massa Fina e borda Requeijão → R$ 59,90. Trocar origem para Telefone ofereceu Entrega/Retirada e campos de endereço. Confirmação vazia bloqueou nome/telefone/rua/número/bairro. Envio fictício com frete criou #FB43BC92 uma única vez. Nenhum pedido separado de balcão ou mesa foi confirmado. |
| Mesas e comandas | Módulo abriu sem mesas; cadastro vazio bloqueado por campo obrigatório. Não cadastradas mesas/comandas nem validado fechamento real. |
| Cardápio | 15 produtos; busca Calabresa filtrou corretamente. Editor abriu preço, custo, fotos/recorte, ingredientes, adicionais, disponibilidade e alergênicos; fechado sem salvar. Importação abriu instruções e opções; arquivo não enviado. Exportação não executada porque a própria tela informa que atribui códigos persistentes a produtos sem código. |
| Pizzaria | Seis abas abriram: cobrança, preços, tamanhos, quantidade de sabores, massas/bordas e combinações/ingredientes. Regras e limites atuais conferidos com montador. Simulador abriu sem criar pedido; filtro Doces reproduziu a classificação incorreta. Sem salvar/vincular/criar montador. |
| Cardápio digital | Link `/menu/cia-da-pizza` correto, QR visível e download SVG concluído. Consulta pública já validada. Leitura por câmera física e impressão da placa não testadas. |
| Cupons | Lista vazia. Formulário abriu validade, mínimos, limites e divulgação. Troca de percentual para valor fixo atualizou o campo no rascunho; fechado sem salvar. Validação de cupom inexistente no cliente já feita; oferta válida não criada. |
| Combos | Lista vazia. Rascunho de item fixo Calabresa mostrou uma pizza incluída e prévia correspondente. Cancelar combo descartou o rascunho. Conjunto completo/venda de combo não testados em produção porque não há combo configurado. |
| Estoque e fichas | Sem ingredientes/compras. Selecionar Monte sua pizza expôs fichas de cada sabor por tamanho, massas e bordas. Campos, histórico e instruções presentes; inclusão na ficha desabilitada sem ingrediente. Sem gravação de ficha, compra, ajuste ou teste de baixa real. |
| Caixa | Tela de abertura e histórico de turnos carregaram; nenhum turno aberto. Não movimentado dinheiro nem registrado recebimento/sangria. |
| Agendamento | Formulário abriu e mostrou agendamento desativado, antecedência, intervalos, limites e capacidade. Não ativado nem enviado pedido agendado. |
| Financeiro | Recebimentos, Despesas e Custos e margem abriram. Pagos sem resultado, a receber R$ 242,60 e recebido R$ 0,00, coerentes com os quatro pedidos pendentes. Pelo calendário nativo, período 04/11 a 04/11 excluiu o pedido de 03/11: três pedidos, a receber R$ 187,70 e vendas entregues R$ 127,80. CSV exportado com três linhas e sem o pedido anterior. Despesas sem lançamentos; formulário abriu sem salvar. Margem mostrou Não apurado, sem inventar custo/lucro. |
| Frete | Valor fixo R$ 5,00 aplicado no pedido por telefone e retirado no pedido de retirada. Campos de km inspecionados em rascunho e opção fixa restaurada antes de sair, sem salvar. Simulação de rota indisponível sem salvar regras; não exercitada. |
| Configurações | Identidade, segmento Pizzaria, cor, fotos, descrição, meios de pagamento e horários carregaram. Abertura automática por horários estava desligada. Nenhum campo salvo ou estado da loja alterado. |
| Equipe | Lista sem integrantes adicionais, formulário de convite com perfis Gestor/Atendente/Administrador abriu e foi fechado. Nenhum convite criado, permissão alterada ou conta alternativa usada; controle entre perfis não homologado em produção. |

**Atualização automática observada:** a aba de acompanhamento do pedido #62892B6B permaneceu aberta e recebeu Aceito, Preparando, Pronto para retirada e Entregue sem reload. Uma segunda aba de Pedidos, aberta e carregada antes do envio pelo telefone, recebeu #FB43BC92 sem reload. A observação confirma esses cenários entre abas no mesmo navegador, não um SLA, latência máxima ou sessão em aparelho independente. Nenhuma desconexão/tela de erro foi reproduzida; consultas finais de console nas abas administrativas retornaram sem avisos/erros.

**Filtro de datas confirmado pelo controle nativo:** a primeira tentativa de preenchimento pela automação não atualizou o estado do formulário. Repetimos a interação abrindo o calendário e confirmando a data selecionada; o resultado e a exportação foram corretos. A dificuldade inicial era da automação e não foi registrada como bug do produto. Nenhum código foi modificado para obter esse resultado.

## Testes e evidências

- **114 testes em 18 arquivos passaram**, em 89,43 segundos. Log: `.quality/pizzeria-production-audit-supplement.log`.
- Seleção: administração de pizza, refinamentos, operação, balcão, combos, estoque, caixa, mesas, agenda, financeiro, cupons, planilhas, permissões, frete e atualizações.
- Nenhuma alteração de implementação nesta auditoria. O gate completo anterior de 408 testes/238 critérios permanece registrado; não foi reapresentado como uma nova validação de produção.
- Capturas: `.quality/pizzeria-audit-order-62892B6B.png`, `.quality/pizzeria-audit-checkout-reset.png`, `.quality/pizzeria-audit-return-error.png`, `.quality/pizzeria-audit-admin-completed.png`, `.quality/pizzeria-audit-admin-orders.png`, `.quality/pizzeria-audit-admin-phone-completed.png`.
- Token de acompanhamento, telefone de teste e dados privados não são incluídos neste documento. A captura do pedido registra o estado visível sem divulgar credenciais.

## Ordem recomendada

1. Preservar o formulário da finalização ao editar itens.
2. Publicar as correções de retorno/recuperação já preparadas e alinhar os domínios à mesma versão, mediante pedido de publicação.
3. Corrigir a classificação de doces, revisar o vínculo dos 14 sabores e preencher ingredientes/alergênicos/custos conforme os produtos reais, com autorização para essas mudanças de cadastro.
4. Refinar a tabela de pedidos em telas estreitas e os textos legados.
5. Em ambiente descartável ou mediante autorização específica, validar persistência de cupons/combos/estoque/mesas, fechamento de caixa, recebimentos, agendamentos, perfis de acesso e integração de rotas. Preservar os limites financeiros e de segurança desta auditoria.

Nenhuma afirmação de “todos os módulos funcionando” é feita neste relatório.
## Correção autorizada — cadastro único dos 14 sabores (04/11/2026)

Após pedido do usuário para corrigir os problemas do vínculo, foram aplicadas pelo painel autenticado de www.pedss.com.br, na Cia da Pizza:

- Transferidas ao montador as listas de ingredientes removíveis já cadastradas nos 14 produtos; nenhum ingrediente/alergênico/custo foi inventado.
- Chocolate com Morango e Banana com Canela classificados como Doce.
- Executado Vincular sabores ao cardápio: contador passou de 0/14 para 14/14. Os 15 registros existentes foram preservados (14 sabores e um montador), sem duplicar produtos.
- Comparação antes/depois confirmou mesmas fotos, descrições, preços mínimos e todos os 28 preços por tamanho. Persistência conferida após recarregar o painel; ingredientes dos 14 sabores preservados.
- Cardápio publicado: Calabresa grande, Tradicional e borda Requeijão = R$ 57,90; metade Mussarela/metade Calabresa grande, Fina e borda Requeijão = R$ 59,90, com retirada de cebola somente na parte Calabresa. Doces passou a listar os dois sabores corretos. Nenhum novo pedido foi confirmado; rascunhos de teste fechados e pedidos anteriores preservados.

Evidência: `.quality/pizza-flavors-linked-production.png`; comparação DOM antes/depois em `.quality/pizza-flavors-link-verification.json`. Consoles administrativo e público consultados sem avisos/erros.

Limite: o produto individual vinculado ainda apresenta retirada global e personalização do sabor, com opções visualmente repetidas; ambas são aceitas pela versão atual, sem cobrança adicional. É um refinamento de UI a tratar separadamente. As demais pendências desta auditoria (checkout, versões/retorno, custos e textos) não são declaradas resolvidas por esta correção de cadastro. Não houve alteração de implementação, commit ou deploy; o vínculo e a classificação já foram salvos em produção pelo painel.

Validação desta rodada: npm run check aprovado (408 testes em 59 arquivos; 238/238 critérios, lint, tipos, camadas e build/API). Log: .quality/pizza-flavor-link-gate.log. O build manteve o aviso de bundle acima de 500 kB, sem falha. A suíte valida o código local; a configuração de produção foi conferida separadamente no navegador.


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
