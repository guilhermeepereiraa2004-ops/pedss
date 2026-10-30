# Transferência de dados e sincronização

Implementação local de 27/10/2026, ainda pendente de publicação. A franquia já consumida do Neon não é restituída por esta alteração. Nenhum plano, serviço externo ou dado de produção foi alterado.

## Fluxo de leitura

- A landing fica fora do ApplicationProvider: não inicializa sessão remota, GET /api/app ou SSE. Login/cadastro não mantêm assinatura de atualizações.
- O cliente informa a tela/loja em X-Pedss-View. O servidor valida a sessão independentemente desse seletor. Permissões, custos e acompanhamento continuam filtrados no servidor.
- O PostgreSQL seleciona a loja antes de devolver dados. Cardápios públicos não leem os arquivos de pedidos/despesas das lojas; a central lista estabelecimentos e equipe sem carregar seus catálogos.
- Cada GET começa por uma consulta pequena de sessão/revisão. If-None-Match compatível com a sessão e o escopo produz 304 antes de carregar o catálogo/histórico. Os ETags ficam em memória; respostas usam private/no-store.
- Quando a revisão muda, o banco calcula dois resumos: catálogo e operação. Somente hashes/revisão atravessam a conexão nessa etapa. As versões enviadas ao cliente usam HMAC, vinculado à identidade e ao escopo; hashes de dados internos não são publicados.
- Se só pedidos/financeiro/equipe mudarem, fotos, produtos e personalização permanecem no cliente. Se apenas outra loja mudar, a resposta é uma confirmação pequena de revisão. A sacola de cada loja permanece local, inclusive ao navegar entre lojas.
- Consulta de manifesto e leitura parcial exigem a mesma revisão. Uma mudança concorrente força nova validação de acesso e nova tentativa limitada, evitando misturar revisões ou manter acesso revogado.

## Atualizações automáticas

SSE /api/updates?v=2 transporta exclusivamente números de revisão. Continua verificando a revisão aproximadamente a cada 1,5 segundo; uma mudança pode levar alguns segundos para aparecer, conforme rede e servidor. O evento inicial é comparado com a revisão já carregada: abrir/reabrir o stream não baixa o catálogo.

Web Locks + BroadcastChannel elegem uma conexão por origem e distribuem apenas revisões entre abas. Cada aba lê sua própria projeção autorizada. Navegadores sem esses recursos usam conexões independentes. A consulta pequena de revisão é compartilhada por até 500 ms dentro da mesma instância de servidor, sem depender de memória entre instâncias.

Abas ocultas de cardápio/acompanhamento suspendem a assinatura e retomam ao voltar. Painéis mantêm a assinatura em segundo plano para preservar alertas de pedidos. Falhas fecham o EventSource anterior e usam uma única tentativa agendada com backoff até 60 segundos; não há polling e reconexão paralelos. Sem EventSource, verificações condicionais começam em 5 segundos e recuam em falhas.

Páginas de versões antigas, sem o protocolo de escopo, recebem a orientação de atualizar antes de executar leituras agregadas. Streams antigos são recusados antes de consultar o banco. POSTs legados continuam aceitos para concluir ações em andamento, com as mesmas validações de segurança.

## Gravações e preservação

A fonte de verdade continua sendo pedss.workspace. Não é necessária migração nem duplicação dos dados. O lock transacional da linha foi preservado.

Comandos carregam o estabelecimento envolvido e metadados necessários às regras existentes. Outras lojas são representadas por referências leves e nunca são sobrescritas por essas referências. O UPDATE aplica somente os caminhos JSON alterados. A comparação ignora a ordem das chaves dos objetos JSONB; o baseline é a visão validada antes da mutação, preservando campos legados e mídias não carregadas.

Checkout, status/pagamento, despesas e validação de cupom podem omitir fotos da própria loja. A resposta parcial mantém o catálogo do cliente e uma verificação posterior reconcilia alterações concorrentes. Cotações de frete também usam uma leitura por estabelecimento sem mídia. Preços e idempotência continuam calculados no servidor; entrega e pagamento permanecem separados.

## Desenvolvimento

`npm run dev` inicia o modo local mesmo quando VITE_RUNTIME_MODE=remote está salvo em .env.local. Acesso intencional ao banco exige também PEDSS_ALLOW_REMOTE_DATABASE=true. Isso não cria um banco separado: o banco da DATABASE_URL configurada será usado. A flag não altera builds de produção. Variáveis privadas nunca devem ter prefixo VITE_.

PGlite é uma dependência somente de desenvolvimento para executar SQL PostgreSQL em memória nos testes. Não integra um novo provedor nem entra na API publicada.

## Verificação e limites

Testes DATA/LIVE cobrem consultas condicionais, seleção por loja, expiração de sessão, isolamento, transações/rollback, idempotência, preservação de imagens, respostas parciais e eleição de stream. A verificação HTTP/navegador usa somente uma fixture descartável em memória.

Medição local: 100 GETs sem mudança retornaram 100 respostas 304, sem leitura de catálogo nem leitura completa do workspace. Foram observados 6.920 bytes de linhas SQL durante esse intervalo, incluindo eventual atividade de revisão da prévia. Isso exclui protocolo/TLS e não é uma previsão de cobrança do Neon. Evidência local: .quality/data-efficiency-measurement.json.

Pedido fictício apareceu no painel sem refresh; aceitar no painel atualizou o acompanhamento sem refresh. Landing abriu com a API simulada indisponível, sem requisições à API, streams ou consultas SQL. Evidências: docs/QA.md e arquivos .quality/data-*.

Não foi possível medir a produção: o Neon permanece bloqueado por franquia de transferência. Publicar API e cliente juntos, recarregar as abas antigas e validar o consumo real depois da liberação da cota. Nenhuma redução percentual de cobrança ou adequação permanente ao Free é garantida.

O agregado continua sendo uma única linha; históricos de pedidos e arrays alterados ainda crescem e são serializados por loja. Normalizar pedidos/financeiro e paginar históricos são próximos passos para escala, com migração planejada e autorização. Manter um painel aberto também mantém consultas pequenas; a correção reduz principalmente transferência e duplicação, não elimina todo uso de compute.
