# API — Pedss

A API implementada nesta etapa usa GET/POST /api/app. GET retorna projeções públicas ou de gestão conforme a sessão; POST recebe {kind, command, args}. As rotas REST abaixo continuam sendo uma proposta futura, não endpoints ativos. `src/core/api.ts` contém os tipos de leitura e os comandos de pedido. O restante dos casos de uso é definido em `services.ts`; a implementação remota deve preservar suas regras.

## Rotas propostas

| Método e rota                                    | Responsabilidade e acesso                                        |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `GET /api/public/stores/:slug`                   | Identidade pública, catálogo, opções, atendimento e revisão      |
| `POST /api/public/stores/:id/orders`             | Validar e criar pedido; Idempotency-Key obrigatório              |
| `GET /api/public/orders/:token`                  | Pedido identificado por token opaco; sem listagem pública        |
| `GET /api/me`                                    | Identidade sanitizada da sessão                                  |
| `POST /api/auth/login` / `logout`                | Provedor real e cookie seguro                                    |
| `POST /api/auth/recovery` / `reset`              | Resposta uniforme e envio pelo provedor de e-mail                |
| `GET /api/stores/:id/orders?cursor=...`          | Paginação de pedidos, filtrada pela sessão/loja                  |
| `PATCH /api/stores/:id/orders/:orderId/status`   | Transição, motivo e expectedUpdatedAt                            |
| `PATCH /api/stores/:id/orders/:orderId/payment`  | Registro manual autorizado, com controle de conflito             |
| `PUT/DELETE /api/stores/:id/products/:productId` | Catálogo da loja autorizada                                      |
| `PUT /api/stores/:id/settings`                   | Configuração e identidade da loja                                |
| `GET/POST /api/stores/:id/team`                  | Equipe/convite com papéis limitados                              |
| `GET/POST/PATCH /api/admin/stores`               | Central; arquivamento preserva histórico                         |
| `POST /api/uploads`                              | Upload autorizado e URL de imagem, substituindo data URLs locais |

## Regras do servidor

- Resolver usuário e tenant pela sessão validada. Um `storeId` no body ou um papel enviado pelo browser nunca concede autorização.
- Recalcular preços e taxas; conferir catálogo, funcionamento, endereço, forma de pagamento e revisão. Nunca aceitar total calculado pelo cliente como fonte da verdade.
- Persistir pedido, linhas, histórico e idempotência na mesma transação. Chave única por loja/chave de idempotência; associar a chave ao conteúdo da tentativa e rejeitar reutilização com payload diferente.
- Usar condição de versão ou lock na transição de pedido. Retornar conflito se `expectedUpdatedAt` estiver desatualizado.
- Representar dinheiro em inteiros, horários de atendimento com timezone e datas de eventos em UTC.
- Retornar erro estruturado `ApiFailure`, status HTTP adequado e requestId. Não devolver stack, segredo ou agregado Workspace.
- Expor equipe sanitizada, sem passwordHash/salt/tokenHash. Autenticação real fica em serviço/provedor do servidor.
- Token de acompanhamento funciona como segredo de acesso: alta entropia, possibilidade de revogação, rate limit, `Cache-Control: no-store` e sem inclusão em analytics/logs públicos. Retornar somente os campos necessários, sem ator interno no histórico público.
- Sessão por cookie HttpOnly/Secure/SameSite conforme o provedor; proteção CSRF, validação de origem e CORS explícito se necessário. Recuperação nunca exibe token na tela em produção.
- Eventos de novos pedidos e atualizações por SSE/WebSocket ou polling autorizado. Cliente reconecta e atualiza consultas; não confundir evento com confirmação de persistência.

## Entidades a persistir depois

Também persistir cupons, lançamentos de despesa e snapshot de custo/desconto em pedidos. Na transação de checkout, validar elegibilidade e consumir limite do cupom junto com a criação do pedido; cancelamento deve liberar uso de forma consistente. No servidor, limites por cliente precisam usar a identidade/regra escolhida pelo produto, pois telefone autodeclarado não comprova identidade.

Endpoints adicionais propostos: `GET/PUT /api/stores/:id/coupons`, `GET/PUT /api/stores/:id/expenses`, `PATCH /api/stores/:id/expenses/:expenseId/archive` e `GET /api/stores/:id/overview`. O overview deve ser agregado no servidor com o tenant da sessão, filtrando demonstrações e respeitando as datas/definições de `BUSINESS.md`. Custos, despesas e rankings de clientes nunca integram a resposta pública do cardápio. Ofertas públicas devem conter somente campos promocionais necessários.

Estabelecimentos, configurações, horários, áreas, produtos, adicionais, ingredientes removíveis, usuários/membros por loja, pedidos, linhas e opções em snapshot, histórico, registros manuais de pagamento e idempotência. IDs de estabelecimento são permanentes e slug tem restrição única, incluindo arquivos. O modelo físico e o provedor serão decididos na etapa de banco.

Convites, sessões, recuperação e credenciais deverão usar o provedor de acesso escolhido, em vez de replicar o workspace do navegador. Catálogo é público; pedidos e dados pessoais são segmentados por tenant; acompanhamento expõe apenas o pedido autorizado pelo token. Definir retenção, exportação e exclusão de dados com a política do produto.

## Importação em lote

`CatalogApi.exportCatalog` propõe `POST /api/stores/:id/catalog/export`: exige permissão de catálogo, atribui SKUs ausentes de forma transacional com unicidade por loja e retorna somente produtos/opções e identificação da loja autorizada. O frontend pode gerar XLSX/ZIP com essa projeção de gestão. A resposta contém custos e nunca deve ser exposta na rota pública do cardápio. IDs, códigos existentes e pedidos permanecem estáveis; a operação não exporta o Workspace, credenciais ou clientes. Ainda não há endpoint HTTP ativo.

Contrato futuro `CatalogApi.importCatalog`: `POST /api/stores/:id/catalog/import` recebe documento normalizado da planilha, `allowUpdates`, `expectedRevision` e `idempotencyKey`. Retorna quantidades criadas/atualizadas e a nova revisão. O servidor deve reconstruir o plano com `core/catalogImport.ts`, ignorar a alegação de validade do cliente, autorizar a loja e gravar tudo na mesma transação. SKU deve ser único por estabelecimento; IDs internos e snapshots de pedidos são preservados. Validar limites também no servidor e devolver erros por aba/linha/coluna, `CONFLICT` para versão vencida e resposta idempotente em retries.

O fingerprint JSON usado pela versão local é apenas uma verificação de conflito em memória; na API, substituí-lo por revisão opaca retornada pelo servidor. Não enviar o agregado Workspace nem dados de sessão. Se o backend vier a receber arquivos binários, deverá fazer sua própria validação de tipo, tamanho, expansão, processamento e autorização; a validação no browser não constitui fronteira de segurança. Nenhuma rota HTTP foi ativada nesta entrega.

## Ordem de integração

1. Escolher backend, banco, provedor de autenticação e hospedagem com os requisitos de operação definidos.
2. Implementar repositório transacional no servidor e repetir os testes do domínio contra esse adaptador.
3. Implementar autenticação real, membership/tenant e endpoints com projeções sanitizadas.
4. Criar runtime HTTP e consultas assíncronas no frontend, preservando formulários e componentes. A sacola pode continuar local, mas não transporta preço como autoridade.
5. Implementar upload, e-mail transacional e sincronização. Migrar dados locais apenas por importação autenticada, validada e confirmada, sem importar hashes/sessões demo.
6. Validar dois dispositivos, dois usuários concorrentes, isolamento entre lojas, falha de rede, retry, conflitos e recuperação de sessão antes de publicar.

O modo remoto está integrado ao Neon. O modo local continua disponível para demonstração legada.


## Transporte implementado

Consulte DEPLOYMENT.md. kind=service aceita somente a lista explícita de casos de uso de gestão; autorização é reexecutada no servidor. kind=auth aceita signIn, signOut, setup (com código privado), invite, acceptInvitation e setUserActive. Não há reset público nem startDemo. kind=checkout/command=create recebe storeId, cart e customer; confere preços e cupom oficiais e associa fingerprint à chave do pedido. kind=coupon/command=validate consulta somente o código informado, sem divulgar códigos privados. GET aceita X-Pedss-Tracking para projetar somente o pedido associado ao token. Respostas privadas são no-store. Imagens pequenas permanecem em data URL e há limite de 3,5 MB por corpo.

## Tipo no cadastro — comando atual (21/10/2026)

No comando RPC `service/saveCompany`, `args[0]` contém os campos do estabelecimento e `heroSegment`: `burger`, `pizza`, `acai`, `icecream`, `snacks` ou `pastel`. O cadastro de um ID novo exige esse campo explicitamente. O caso de uso valida o enum e grava a empresa e `tenant.settings.heroSegment` na mesma transação, com autorização da central. O tipo e o modelo visual compartilham essa configuração; não há um segundo campo na empresa.

Edições sem `heroSegment` preservam a escolha atual. Se informado, atualiza somente essa preferência da operação, além dos dados da empresa enviados no comando, sem reclassificar produtos. Lojas legadas sem preferência continuam com o default compatível de hamburgueria. A forma de autenticação e a rota `/api/app` descritas em DEPLOYMENT.md permanecem inalteradas. Esta mudança de cadastro foi validada localmente e ainda não foi publicada.
