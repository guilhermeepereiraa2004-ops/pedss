# Frete e atualização automática

O painel oferece um módulo Frete separado de Configurações. Despesas são lançadas em Financeiro → Despesas; links antigos com `tab=expenses` abrem essa aba. Nenhum lançamento anterior é removido.

## Regras de entrega

- Valor único: `fixedFeeCents` em todas as entregas. Não precisa de serviço externo.
- Por quilômetro: taxa de saída + distância em metros × preço por km / 1000, arredondando apenas o resultado final para centavos; respeita frete mínimo e percurso máximo.
- Por bairro: preserva áreas e taxas legadas. Lojas sem configuração nova continuam usando suas regras anteriores.
- Retirada: frete zero. Ativação e endereço de retirada ficam no módulo Frete.

Nome/identidade, horários e meios de pagamento permanecem em Configurações. Salvar essa tela preserva as regras atuais de Frete, inclusive quando o formulário foi aberto antes de uma alteração.

## Ativação do cálculo por CEP

O usuário autorizou, em 26/10/2026, o envio dos CEPs à BrasilAPI e das coordenadas resultantes ao OpenRouteService, sem nome, telefone ou dados dos pedidos. Em 05/11/2026 retomou a ativação e confirmou que a integração é para todos os tipos de estabelecimento. A conta foi criada pelo usuário e o acesso ao painel HeiGIT foi confirmado. `OPENROUTESERVICE_API_KEY` foi configurada em `.env.development.local` (ignorado pelo Git) e como Secret de Production na Vercel. O teste real de percurso e assinatura passou; a chave não foi registrada no repositório nem exibida no chat.

Uma conta/chave central atende hamburguerias, pizzarias, açaiterias, sorveterias, lanchonetes e pastelarias. Cada loja mantém seu CEP de origem, taxas, distância máxima e modalidade de entrega. Ativar a integração não muda automaticamente as regras comerciais de nenhuma loja.

1. Gere sua chave no [portal de contas do HeiGIT/openrouteservice](https://account.heigit.org/). O provedor oferece um plano Standard gratuito sujeito a limites; verifique as condições vigentes no portal. [Referência oficial sobre uso comercial do Standard](https://ask.openrouteservice.org/t/free-plan-in-an-app-with-a-paid-tier-license-cc-by-sa-4-0-personal-data-and-attribution-questions/8079).
2. Configure `OPENROUTESERVICE_API_KEY` somente no servidor: `.env.development.local` em desenvolvimento e variáveis da Vercel em produção. Nunca use prefixo `VITE_`, campo do painel ou repositório para a chave. Reinicie o servidor local após configurar; na Vercel, a variável exige novo deployment.
3. Em Frete, selecione Por quilômetro, informe CEP de origem, preço por km, taxa de saída, mínimo e limite. Salve e use o simulador.
4. O checkout pede CEP e uma cotação válida antes de permitir confirmar a entrega. Continua oferecendo retirada quando habilitada.

O servidor usa `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`. O host antigo foi descontinuado pelo provedor, com desligamento anunciado entre 02 e 06/11/2026; a variável `OPENROUTESERVICE_API_KEY` mantém o nome para compatibilidade. [Aviso oficial da migração](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912/).

Em 05/11/2026 o [portal oficial](https://account.heigit.org/info/plans) exibiu Standard gratuito, com 2.000 consultas de Directions/dia e 40/minuto. Essas cotas são compartilhadas entre todas as lojas que usam a mesma chave; não são cotas por estabelecimento nem promessa de disponibilidade. Consulte sempre os limites vigentes antes de ativar.

O percurso é estimado pelas ruas entre as coordenadas dos CEPs; não representa geocodificação do imóvel ou rastreamento de entregador. BrasilAPI pode retornar CEP sem coordenadas e o roteador pode não encontrar percurso. Nesses casos, ou sem chave/conexão/cota disponível, não há valor inventado nem substituição por linha reta: é exibido erro e a confirmação da entrega permanece bloqueada. Há atribuição dos provedores na interface.

## Validação e privacidade

Consultas a CEP/rota ocorrem no servidor; a chave não é devolvida ao navegador. Rotas usam HTTPS, timeout, cache de15min por par de CEPs e cache de24h de localização por CEP, com limite de500 entradas em cada cache. Consultas simultâneas iguais compartilham a operação em andamento. Os caches são apenas em memória da instância: reinícios e outras instâncias da Vercel podem consultar novamente. Nenhuma escrita de cache no banco e nenhum armazenamento de nomes, telefones ou pedidos. Preços/tokens são gerados separadamente por loja, mesmo quando a distância é compartilhada. No modo local a Vite fornece um proxy de desenvolvimento; no modo remoto, a API usa a origem da loja persistida e limita consultas.

CEP inexistente, excesso de consultas, chave recusada e indisponibilidade recebem mensagens próprias sem ecoar a resposta do provedor. Erros não são armazenados no cache, não viram frete grátis e não disparam repetição automática das consultas externas. A confirmação do pedido continua exigindo cotação válida.

A cotação vale15min. O token é assinado com HMAC e vincula loja, CEP, metros, valor, regras e expiração. `PEDSS_QUOTE_SECRET` é opcional; sem ele, o segredo de conexão do servidor é usado como chave. Alterar regras, loja, CEP, validade ou token invalida a cotação. O checkout verifica assinatura e recalcula o valor/total dentro da transação, sem consultar serviços externos mantendo o bloqueio do banco. Valores fornecidos pelo cliente não determinam a cobrança. Pedidos existentes preservam taxa e total originais.

## Atualização sem recarregar

O runtime remoto abre uma conexão SSE em `/api/updates`. A função consulta apenas a revisão do workspace a cada1,5s e envia eventos vazios de invalidação; não transmite pedidos, tokens ou dados pessoais. O cliente então busca sua projeção autorizada em `/api/app`, incluindo o token do pedido apenas quando está na rota de acompanhamento.

As conexões são renovadas após24s dentro do limite de30s da função. Em falha ou navegador sem EventSource, há atualização por polling de5s. Foco, retorno da conexão e visibilidade retomam a consulta. Leituras são deduplicadas; respostas anteriores a uma gravação não desfazem o resultado e a sacola local é preservada. O modo local mantém os eventos de armazenamento entre abas da mesma origem.

Isso atualiza listas, etapas, catálogo, disponibilidade e indicadores automaticamente, normalmente em poucos segundos, dependendo da conexão. Formulários mantêm as edições em curso. Não é rastreamento GPS. O banco existente é mantido, sem nova plataforma, migração ou dependência. Para grande volume, a revisão por conexão e o workspace JSON único ainda precisam evoluir para publicação de eventos por loja e consultas menores.

## Publicação

Publicar frontend, API principal e `api/updates.mjs` juntos. `npm run build` compila `.server/app.mjs` e `.server/updates.mjs`. Não substituir o workspace, rodar seed ou redefinir pedidos. Ativação publicada em 05/11/2026 no deployment `dpl_J3MEWQVtJ8yC5zj89LfoGfe3Hrd2`, usando o working tree validado sobre `61707e3`; sem novo commit/push. Os três domínios de produção foram conferidos. Regras comerciais das lojas foram preservadas: cada administrador precisa escolher Por quilômetro e definir origem, taxas e limite quando desejar usar essa modalidade. A Cia da Pizza ainda usa valor fixo, sem CEP de saída. O teste de rota real foi feito isoladamente; nenhuma cotação/pedido real de produção foi criado.
