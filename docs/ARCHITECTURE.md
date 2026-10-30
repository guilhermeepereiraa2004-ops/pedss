# Arquitetura — Brasa

## Camadas

| Local                                | Responsabilidade                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `src/core/model.ts`                  | Schemas Zod, entidades e tipos de domínio                                                     |
| `src/core/domain.ts`                 | Preços, disponibilidade, autorização, pedido, transições e financeiro                         |
| `src/core/ports.ts`                  | Contratos de persistência e acesso                                                            |
| `src/core/api.ts`                    | Contratos para a futura fronteira HTTP e projeções públicas                                   |
| `src/adapters/`                      | Persistência, migração, recuperação e autenticação locais; repositório em memória para testes |
| `src/application/services.ts`        | Casos de uso, autorização, validação, transações e conflitos                                  |
| `src/application/runtime.js`         | Composição dos adaptadores; ponto de substituição futuro                                      |
| `src/hooks/` e `ApplicationProvider` | Estado reativo, identidade e apresentação de erros                                            |
| `src/components/` e `src/pages/`     | Formulários, navegação e apresentação                                                         |
| `src/lib/data.js`                    | Exemplos e utilitários de apresentação                                                        |

O núcleo não importa React, navegador ou adaptadores. A UI não escreve em localStorage. `scripts/check-layers.mjs` verifica imports, exports e imports dinâmicos, e o teste de arquitetura comprova rejeição de dependência proibida. A checagem de tipos cobre os módulos TS; as telas JSX são verificadas por lint, build e testes de interação, sem alegação de tipagem integral da UI.

## Transação de pedido

1. A sacola guarda IDs e opções, sem confiar em nome ou preço fornecido pelo cliente.
2. O checkout consulta produtos e adicionais oficiais, configurações, funcionamento, área atendida e pagamento permitido.
3. O total mostrado é comparado com o total calculado. Mudanças de preço interrompem a confirmação sem perder a sacola.
4. A transação cria o snapshot do pedido e limpa a sacola de forma conjunta.
5. O requestId identifica a tentativa; repetições retornam o mesmo pedido.

Valores monetários são inteiros em centavos. O pedido preserva preço, nome, opções, cliente e endereço da compra, mesmo após alteração ou exclusão do produto. Store IDs e slugs são imutáveis. Arquivar uma loja preserva seu histórico e impede reutilizar seu endereço em outro cadastro.

## Operação e pagamento

`Pendente → Aceito → Preparando → A caminho → Entregue`, com a variante `Pronto para retirada` para retirada. Cancelamento exige motivo e é permitido antes da conclusão. Mudanças inválidas são rejeitadas no domínio. Cada alteração registra data, ator, origem, destino e motivo.

Pagamento tem estado próprio. Entregar não registra recebimento. Estorno exige pagamento recebido, pedido cancelado e motivo; apenas registra a conferência manual. Nenhuma chamada financeira é executada. `expectedUpdatedAt` rejeita a escrita sobre pedido alterado por outro operador.

Loja, painel e checkout compartilham `openState`: pausa central, fechamento manual, configuração de entrega/retirada e horário semanal em America/Bahia, inclusive atendimento após meia-noite. O relógio da apresentação é atualizado a cada 30 segundos; o checkout verifica novamente no instante da transação.

## Persistência local

O workspace v2 reúne lojas, tenants, usuários, sessões, convites, recuperações e configuração central. É uma implementação de demonstração, não um modelo de transporte para produção.

O adaptador lê e valida JSON, migra as chaves antigas e mantém os valores originais. Um workspace inválido recebe backup antes da recuperação de registros válidos. Erro de quota ou gravação rejeita a operação e conserva o snapshot anterior; não apresenta sucesso falso.

Transações usam uma fila por adaptador e Web Locks quando o navegador suporta a API. O evento `storage` atualiza outras abas; `useSyncExternalStore` atualiza a mesma aba. Sem Web Locks, a fila só evita conflitos dentro daquela instância: não oferece garantias distribuídas. Há também um adaptador em memória para testar os mesmos casos de uso.

As chaves legadas `saas_companies`, `company_*`, `brasa_SLUG_*` e `brasa_platform` continuam preservadas. Pedidos legados mantêm o texto original dos itens, sem inventar detalhamento ou pagamento recebido. A migração normaliza os registros válidos; conteúdo inválido é omitido da operação e permanece na origem/backup.

## Acesso local

Administrador gerencia a central. Gestor opera a própria loja, catálogo, financeiro, configuração e atendentes. Atendente visualiza e opera os pedidos da loja, sem registrar pagamentos ou alterar catálogo/configurações.

As verificações ocorrem nos serviços, além das rotas e da navegação. Sessões expiram após oito horas; recuperação dura 15 minutos e convite 24 horas, ambos de uso único. Desativar usuário ou arquivar loja revoga suas sessões. Senhas usam PBKDF2/SHA-256 e salt aleatório; tokens opacos são persistidos por hash. O token de sessão fica em sessionStorage.

Essas proteções validam os fluxos locais. Elas não protegem dados contra edição do navegador. Os acessos demo, a recuperação com link na tela e os dados agregados devem ser substituídos no backend de produção.

## Conexão futura

### Prévia e recorte de imagens

`core/imageCrop.ts` calcula o retângulo de recorte, proporção, zoom e posições com limites, sem DOM. `application/imageEditing.js` coordena a leitura/preparação; `adapters/imageEditing.js` usa FileReader, Image e Canvas para decodificar e gerar o arquivo final. `ImageField` e `ImageCropEditor` apresentam a prévia, arraste e controles de teclado. Fotos usam 4:3, logos 1:1 e capas 16:9. Aplicar altera somente o formulário; persistência continua nos serviços de gestão autorizados. Cancelar mantém a imagem anterior, e os formulários não salvam enquanto há recorte/leitura pendente.

Entrada PNG/JPEG/WebP de até 10 MB e 40 megapixels. O recorte reduz dimensões/qualidade para até 500 KB, preferindo WebP e aceitando o fallback PNG do navegador; não há biblioteca ou serviço de edição externo. Links externos dependem da permissão CORS da origem para acesso aos pixels; a falha orienta selecionar o arquivo local e preserva o valor anterior. A integração futura de mídia deve validar conteúdo e limites novamente no servidor, sem confiar no cliente.

### Importação de cardápio

`core/catalogExport.ts` projeta os mesmos campos de importação e divide o catálogo por limites, sem filtrar pelo estado visual da tela. `services.exportCatalog` autoriza a loja e atribui SKU apenas aos produtos sem código, preservando os IDs. O worker reutiliza o modelo XLSX da aplicação em `adapters/catalogExportWorkbook.js`; ExcelJS preenche os dados, mantém valores numéricos/estilos e gera XLSX ou ZIP com partes reimportáveis. `application/catalogTransfer.js` coordena o processamento e o adaptador de download. As bibliotecas permanecem no worker, carregado sob demanda. Fotos em base64 usam um marcador resolvido contra o produto atual na reimportação; nomes de ingredientes com delimitadores usam JSON.

`core/catalogImport.ts` planeja e valida o lote sem React/DOM, normaliza preços para centavos e identifica produtos por SKU estável (opcional para cadastros legados). `application/catalogTransfer.js` valida a seleção e gerencia um worker com cancelamento e timeout. `adapters/catalogWorkbook.js` lê o XLSX com ExcelJS/JSZip, limita a estrutura do arquivo e rejeita fórmulas; normaliza os prefixos SpreadsheetML que o parser ExcelJS não reconhece diretamente. Essas dependências ficam no worker, carregado somente ao selecionar arquivo.

`services.importCatalog` autoriza a gestão da loja, compara o fingerprint do catálogo da prévia e refaz toda a validação dentro da transação. Nenhuma linha é aplicada se houver erro. Produtos são adicionados/atualizados sem alterar seus IDs ou snapshots de pedidos; produtos fora do lote permanecem. A UI só chama casos de uso. `CatalogApi` descreve a futura fronteira remota, sem ativá-la. Regras de preenchimento e substituição de campos/adicionais em `CATALOG-IMPORT.md`.

### Extensão de cardápio, promoções e indicadores

`core/coupons.ts` centraliza validade, limites e cálculo do desconto. `core/analytics.ts` calcula indicadores por eventos de recebimento/estorno e despesas, com calendário Bahia compartilhado em `core/calendar.ts`. Tenant v2 ganhou cupons e despesas com arrays vazios por default; produtos/adicionais ganharam custo opcional, e pedidos preservam custo e cupom em snapshot. Registros antigos permanecem válidos, com custos desconhecidos e sem desconto inventado.

O contrato público exclui custos de produtos, adicionais e linhas do pedido. `BusinessApi` descreve a fronteira autenticada para cupons, despesas e overview. Nenhuma dessas interfaces ativa requisição remota. Páginas são carregadas por rota com React.lazy para evitar entregar o código dos painéis ao abrir o cardápio.

`DigitalMenu` oferece consulta presencial; `MenuQrPanel` gera/exporta o código e um portal isolado para impressão. Os arquivos usam o mesmo catálogo da loja. `BUSINESS.md` documenta os cálculos e o requisito de hosting/API compartilhada para uso real nos celulares.

Não há cliente de banco, migration SQL, servidor ou requisição remota nesta etapa. Os contratos e regras estão separados para serem reutilizados. A integração exigirá um runtime remoto com estado assíncrono, leituras segmentadas e estados de loading/erro; não basta apontar localStorage para uma URL.

O servidor deve executar os casos de uso e a autorização, manter transações e idempotência no banco e expor projeções mínimas. O frontend recebe catálogo público, pedido do token ou dados de gestão autorizados. Credenciais, usuários completos, hashes e sessões jamais entram no catálogo público. Ver `API.md` para contrato e sequência de implementação.
