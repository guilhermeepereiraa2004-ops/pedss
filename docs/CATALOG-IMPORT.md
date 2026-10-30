# Planilhas do cardápio

O formulário agora remove o fundo de fotos comuns automaticamente. Importações XLSX continuam preservando/importando as URLs da coluna Foto sem fundo (URL), sem executar inferência em lote. Para gerar a partir de uma foto do cardápio já importada, edite o produto e use Gerar da foto do produto.

Desde 22/10/2026, a exportação inclui a coluna opcional **Foto sem fundo (URL)**, independente de **Foto (URL)**. Na hamburgueria, é a foto individual usada nos cards do cardápio e nas opções/detalhes do produto. Informe endereço de PNG/WebP já transparente; o importador não remove fundos. Fotos em data URL são exportadas como **MANTER_FOTO_ATUAL** e permanecem na mesma loja ao reimportar com o mesmo código. Célula explicitamente vazia remove a foto sem fundo; uma planilha antiga sem esta coluna preserva a foto já cadastrada. O modelo antigo continua aceito e não apaga esse campo. Imagens não são embutidas na planilha.

No painel de gestão, abra **Cardápio → Baixar modelo**. Preencha o arquivo, escolha **Importar planilha**, confira a prévia e marque a confirmação para gravar. Nenhum produto é salvo durante a leitura. A leitura e a persistência acontecem somente no navegador, sem banco ou envio do arquivo a serviços externos.

O modelo XLSX contém três produtos e dois adicionais fictícios. Substitua esses exemplos pelos dados da loja. Mantenha a linha de cabeçalhos e os nomes das abas. É possível preencher no Excel ou Google Planilhas e salvar/baixar como `.xlsx`. CSV, XLS e XLSM não são aceitos.

## Exportar, editar e importar novamente

Em **Cardápio → Exportar cardápio**, baixe os produtos atuais da loja em XLSX, com abas **Produtos**, **Adicionais** e **Instruções**. A exportação inclui todos os produtos, inclusive indisponíveis, independentemente da busca e da categoria selecionadas no painel. Também inclui custos de gestão, ingredientes e opções; não inclui pedidos, clientes ou dados de outras lojas.

Produtos sem código recebem um código único, salvo no cadastro por uma ação autorizada. Códigos já existentes são preservados. **Mantenha os códigos ao editar**: eles identificam o produto mesmo se você mudar o nome. Depois escolha **Importar planilha**, ative **Atualizar produtos existentes com o mesmo código**, revise e confirme. A importação mantém os IDs internos e os pedidos anteriores. Use um novo código para adicionar um produto novo.

Para catálogos maiores, o download será um ZIP com partes XLSX que respeitam os limites de produtos, adicionais e tamanho. Extraia o ZIP e edite/importe cada parte separadamente. Nenhum produto é descartado para caber em uma planilha. Um catálogo vazio gera apenas os cabeçalhos e as instruções, sem produtos fictícios.

Fotos salvas como arquivo no navegador são representadas por **MANTER_FOTO_ATUAL**, pois a imagem em base64 pode ultrapassar o limite de texto de uma célula. Mantenha esse marcador para preservar a foto ao atualizar na mesma loja; substitua por uma URL para trocar a foto ou deixe vazio para removê-la. O arquivo não transporta essas imagens para outra loja ou navegador. Fotos HTTP/HTTPS ou caminhos locais curtos são exportados como texto.

Ingredientes com ponto e vírgula no próprio nome ou começando com `[` são exportados como uma lista JSON para preservar cada nome. Nesses casos, mantenha aspas e colchetes ao editar. Nos demais casos, os nomes continuam separados por ponto e vírgula. O XLSX exporta textos literais, inclusive quando um nome começa com `=`, sem criar fórmulas.

## Produtos

| Coluna                  | Preenchimento                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código                  | Obrigatório e único. Até 60 letras, números, ponto, hífen ou sublinhado; convertido para maiúsculas. Use um código estável para atualizar o item depois. |
| Nome                    | Obrigatório; até 80 caracteres. Produtos com códigos distintos podem ter o mesmo nome.                                                                   |
| Categoria               | Hamburguer, Pizza, Açaí, Sorvete, Salgado, Pastel, Porção, Bebida ou Sobremesa. Aceita plural e acentos.                                                 |
| Preço (R$)              | Obrigatório, maior que zero, até duas casas decimais. Números ou texto como `29,90` e `1.234,56`.                                                        |
| Custo (R$)              | Opcional. Vazio significa desconhecido; zero significa custo zero.                                                                                       |
| Descrição               | Opcional; até 500 caracteres.                                                                                                                            |
| Disponível              | Sim ou Não. Vazio significa Sim.                                                                                                                         |
| Destaque                | Sim ou Não. Vazio significa Não.                                                                                                                         |
| Foto (URL)              | Opcional; endereço HTTP/HTTPS. Imagens coladas no arquivo não são importadas.                                                                            |
| Ingredientes removíveis | Opcional; nomes separados por ponto e vírgula. Até 30, com até 60 caracteres cada.                                                                       |

Valores monetários são convertidos para centavos antes da gravação. Não use fórmulas: cole valores. Células de data, erros de planilha e valores inválidos impedem a importação. Os erros mostram aba, linha e coluna; nenhuma linha do lote é salva enquanto houver erro.

## Adicionais

Uma linha por adicional. **Código do produto**, **Nome** e **Preço (R$)** são obrigatórios; **Custo (R$)** é opcional; **Disponível** aceita Sim/Não e assume Sim se vazio. O preço do adicional pode ser zero. O código deve existir na aba Produtos do mesmo arquivo. Até 30 adicionais por produto, nomes de até 60 caracteres e sem repetição para o mesmo produto.

## Atualizações

Por padrão, o arquivo serve para adicionar produtos. Se algum código já existir, o lote fica bloqueado até selecionar **Atualizar produtos existentes com o mesmo código**. Produtos antigos sem código podem ser reconhecidos por nome e categoria; a prévia identifica essa correspondência. Correspondências ambíguas precisam ser corrigidas no cadastro.

Uma atualização preserva o ID interno do produto. Substitui os demais campos pelos valores do arquivo, inclusive limpando os opcionais vazios. Se a aba Adicionais estiver presente, substitui as opções dos produtos do lote; se estiver vazia, remove essas opções. Excluir a aba Adicionais do arquivo preserva as opções atuais. Adicionais reconhecidos pelo mesmo nome preservam seus IDs. Produtos fora do lote e snapshots de pedidos anteriores permanecem como estavam.

Se o catálogo mudar depois da leitura, a confirmação fica bloqueada até atualizar a prévia. O serviço verifica novamente essa versão ao gravar e revalida todas as linhas em uma única transação autorizada para a loja. Falha na persistência não grava um lote parcial.

## Limites

Até 2 MB, 500 produtos e 1.500 adicionais por arquivo, sem senha e sem macros. Há limites de estrutura/expansão do ZIP e prazo de 20 segundos para a leitura em worker. A biblioteca do leitor é carregada apenas ao escolher um arquivo. Quantidades maiores devem ser divididas em lotes. A capacidade total também depende da quota de armazenamento do navegador.

O arquivo não foi aberto manualmente em uma instalação física do Excel nem importado de volta após edição no Google Planilhas nesta revisão. O modelo exportado foi inspecionado visualmente e lido pelo mesmo leitor usado no navegador; esses caminhos foram testados com dados fictícios.
