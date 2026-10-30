# Cardápio presencial e gestão do negócio

## Consulta por QR code

`/menu/:storeId` resolve o slug do estabelecimento e apresenta somente produtos disponíveis, com identidade, busca sem distinção de acentos, categorias, preços, detalhes e adicionais. É um cardápio de consulta para consumo no local: o pedido é feito com a equipe. Não altera a sacola nem cria pedidos de mesa. O fechamento do delivery não bloqueia a consulta; arquivamento da loja bloqueia a rota.

No painel, a aba Cardápio digital gera link e QR por estabelecimento com endereço imutável. SVG é vetorial; PNG tem 1024×1024 px; impressão oferece uma placa com nome da loja. O QR usa preto sobre branco, margem de quatro módulos e correção de erro M, gerado localmente com [qrcode.react](https://github.com/zpao/qrcode.react). Não há gerador remoto, encurtador ou rastreamento externo.

`VITE_PUBLIC_MENU_ORIGIN` é opcional e deve conter a origem publicada. Não configura hosting, banco ou sincronização. Enquanto o catálogo está em localStorage, outros dispositivos não recebem as alterações. A interface identifica a prévia localhost e mantém esse aviso na placa impressa.

## Cupons

Cupom pertence a um tenant e seu código é único e permanente na loja. Pode ter valor fixo em centavos ou percentual inteiro de 1 a 100, mínimo em produtos, início/fim inclusivos em America/Bahia, limite global, limite por telefone, ativação e divulgação pública opcional.

O desconto incide sobre subtotal de produtos com adicionais, até o máximo desse subtotal. Frete não recebe desconto. Exemplo: produtos R$ 29,90, cupom de 10% e retirada resultam em R$ 26,91. O pedido guarda código, tipo, valor original e desconto em snapshot.

O checkout recalcula na transação: cupom vencido, inativo, fora do mínimo ou esgotado é rejeitado e preserva a sacola. Limite é contado por pedidos não cancelados; cancelamento libera a utilização. Repetição da mesma confirmação retorna o pedido existente e não consome outra utilização. Limite por telefone usa o número informado, sem verificação de identidade nesta etapa. Um cupom divulgado aparece na vitrine somente enquanto está disponível; códigos privados podem ser compartilhados manualmente.

## Custos e despesas

Custo de produção e custo de adicional são opcionais e podem ser zero quando zero for um dado conhecido. Campo vazio significa desconhecido. Pedido guarda custo unitário do produto mais os adicionais selecionados, independentemente de mudanças futuras no catálogo. Não é feita inferência retroativa em pedidos antigos.

Despesa representa uma saída já paga: valor positivo, data até o dia atual, categoria, descrição e notas. Edição atualiza o lançamento; arquivamento remove dos indicadores e permite restauração. A chave do tenant delimita a loja. Apenas gestor/administrador autorizado pode gerenciar despesas, cupons e custos; atendente não recebe os controles e os serviços também rejeitam essas ações.

## Definições da visão geral

Todos os períodos usam America/Bahia. Pedidos demonstrativos pré-carregados (`demo: true`) ficam fora dos indicadores do negócio. Não há dados aleatórios para preencher gráficos.

| Indicador               | Cálculo                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Receita do mês          | Valores de eventos de pagamento Pago no mês menos valores de Estornado no mês                        |
| Despesas do mês         | Soma de lançamentos pagos não arquivados pela data informada                                         |
| Saldo do mês            | Receita recebida líquida de estornos menos despesas pagas registradas                                |
| Pedidos do mês          | Pedidos criados no mês, incluindo cancelados; quantidade de cancelados indicada                      |
| Ticket médio            | Total final das vendas pagas não canceladas recebidas no mês, dividido pela quantidade dessas vendas |
| Mais vendido            | Quantidade de unidades vendidas por ID do produto; opções do mesmo produto são somadas               |
| Menos vendido           | Menor quantidade no período, incluindo itens do catálogo com zero vendas; empates por nome           |
| Cliente de maior margem | Maior soma de subtotal − cupom − custo dos produtos/adicionais; cliente agrupado por telefone        |
| Saldo em sete dias      | Mesmo cálculo de caixa para hoje e seis dias anteriores, com dias vazios iguais a zero               |
| Comparação mensal       | Uma linha por mês do cadastro da loja até o atual, inclusive meses sem movimento                     |

Ticket e rankings consideram vendas atualmente pagas, não canceladas, com recebimento no mês. Datas dos eventos de pagamento mantêm receita e estorno no mês em que ocorreram, mesmo quando o pedido nasceu em outro mês. Pedidos legados sem composição detalhada não inventam quantidades de produtos.

Margem bruta exclui frete e despesas gerais. Não é lucro líquido nem saldo de caixa. O custo unitário entra na margem, enquanto compras/saídas registradas entram no caixa; custo não é descontado uma segunda vez do saldo. O ranking de margem só é publicado se todas as vendas usadas no ranking tiverem custos completos. Caso contrário, a tela informa a cobertura e destaca o cliente com maior receita sem chamá-la de lucro.

As regras estão em `src/core/coupons.ts`, `calendar.ts` e `analytics.ts`. Os serviços autorizam as mutações; schemas aplicam defaults aos dados v2 existentes, preservando pedidos, cupons e despesas na recuperação.
