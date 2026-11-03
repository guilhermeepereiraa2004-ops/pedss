# Refinamentos da pizzaria — 03/11/2026

Implementação local. Nenhum commit, envio ao GitHub, deploy ou alteração no banco remoto nesta entrega. Os cadastros existentes da Cia da Pizza foram preservados.

## Cliente e configuração

- O montador usa três etapas em telas estreitas: tamanho, sabores, massa e borda. A prévia pode ser recolhida; continua no fluxo de rolagem, respeitando o rollback da posição fixa. Desktop mantém a composição em duas colunas. Hero e cards não foram redesenhados.
- Busca interna ignora acentos e filtra salgados/doces conforme o tipo cadastrado em cada sabor. Filtrar não remove escolhas anteriores. Cadastros antigos sem tipo continuam classificados como salgados; revisar os sabores doces no painel.
- “Como chegamos ao preço” discrimina base da pizza, acréscimo pela quantidade de sabores, massa, borda, personalizações e adicionais do produto. A quantidade multiplica o total. No combo, a base incluída não é cobrada novamente.
- Em **Pizzaria**, o assistente percorre como cobrar, tamanhos, combinações/ingredientes, preços, massas/bordas e regras por quantidade. As alterações só valem ao salvar.
- **Simular uma compra** usa o rascunho atual e o mesmo cálculo do pedido, sem salvar nem criar venda. Não substitui a confirmação final do cadastro.

## Administração e operação

| Onde | Comportamento |
| --- | --- |
| Visão geral → Vendas da pizzaria | Seleciona mês; conta pizzas por tamanho e equivalentes por sabor. Meia pizza conta 0,5. Decompõe as pizzas incluídas nos combos. |
| Cozinha → Pizza por pizza | Cada unidade avança por montagem, forno e pronta, com histórico, controle de concorrência e repetição idempotente. Depois de iniciar esse controle, todas as pizzas precisam estar prontas antes do despacho. |
| Pedido → Impressão | Vias cozinha, cliente e entrega; papéis de 58/80 mm. Cozinha omite preços, telefone e endereço. Cliente/entrega distinguem forma prevista, recebido registrado e saldo. Documento sem valor fiscal. |
| Estoque e fichas → Compras | Cadastra fornecedor e recebimento com referência, quantidades, valor total, lote e validade. Entrada atômica atualiza saldo e custo médio; repetir a confirmação não duplica estoque. |
| Agendamento → Espaços do forno | Limite opcional de espaços simultâneos. Em Pizzaria → Tamanhos, configure minutos e espaços de cada tamanho. Padrão: um espaço durante dez minutos. |

As vendas guardam nomes, tamanho, frações, massa, borda e parâmetros de forno no momento da compra. Alterar o catálogo não reescreve o histórico. Cancelar unidades reduz o detalhamento restante; a identificação da produção não depende da posição do item na lista.

O relatório usa pedidos **pagos, não cancelados e criados no mês selecionado**. É contagem de produtos, não apuração de margem ou rateio de receita por sabor. Itens antigos sem detalhamento são informados e excluídos desse relatório, sem inventar escolhas históricas.

## Limites mantidos explícitos

- Receber mercadoria não registra pagamento nem despesa automaticamente. Lance a despesa no Financeiro quando ocorrer o pagamento.
- Lotes são registros de recebimento e alertas de validade. O estoque continua agregado por ingrediente: não há saldo remanescente por lote, consumo FEFO ou bloqueio automático por vencimento. Conferir fisicamente e registrar perdas pelo ajuste com motivo.
- A reserva de forno é conservadora: cada pizza ocupa os espaços durante os minutos imediatamente anteriores ao horário combinado. Considera sobreposição entre horários e combos; não organiza fornadas nem calcula tempo de entrega. Pedidos antigos sem reserva histórica exigem revisão quando podem conflitar.
- Pedidos antigos sem composição individual, ou acima de 300 pizzas, continuam no fluxo por pedido. O controle individual é opcional até sua primeira movimentação.
- A impressão usa o diálogo do navegador; escolher o mesmo papel no driver. Corte automático, margens reais, impressora térmica e aparelho móvel físico não foram validados.
- Backup/restauração integral por loja e recuperação remota de senha por e-mail permanecem evoluções separadas. Nenhuma nova integração externa foi contratada/configurada.

## Verificação

`npm run check`: **363 testes em 50 arquivos**, **203/203 critérios**, lint, tipos do núcleo, camadas, API compilada e build aprovados. Os novos testes exercitam domínio, React e HTTP/SQL descartável, incluindo autorização e isolamento entre lojas. Primeiro gate teve timeout de um teste antigo de planilha; reexecução isolada e dois gates completos seguintes passaram. Nenhuma falha foi ocultada ou tempo limite aumentado.

Navegador: prévia descartável em memória conferiu montagem mobile em 390×844 e 320×568, desktop, busca, preço, inclusão na sacola de teste, configuração/simulador, recebimento de compra, relatório e produção de duas pizzas com bloqueio/liberação do despacho. Teste HTTP usa PGlite descartável, sem consultar o banco de produção. Evidências e limitações em `docs/QA.md`.
