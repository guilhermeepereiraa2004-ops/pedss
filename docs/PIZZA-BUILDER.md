# Montador de pizza

## Alterar pedidos e cadastrar combos — 29/10/2026

**Pedidos → Detalhes → Editar item:** disponível em Recebido/Aceito, antes do preparo. Escolha o mesmo produto ou outro, ajuste quantidade/tamanho/sabores/massa/borda e use Revisar alteração. Confira valor anterior, novo total, diferença e eventual saldo a devolver; informe motivo e confirme. Somente o item alterado usa os preços atuais do catálogo. Outros itens mantêm seus valores. O histórico guarda o antes/depois, horário, autor e motivo. Se outro operador mudar o pedido durante a revisão, reabra o item.

**Cancelar item:** informe quantas unidades daquela linha devem sair. Antes do preparo, devolva os ingredientes ainda não usados ao estoque ou mantenha a baixa como perda. Após iniciar o preparo, somente a opção de perda é aceita. Pedido entregue/cancelado não pode ter itens modificados. Ao cancelar o último item, o pedido inteiro é cancelado e a entrega é zerada. Combo é uma unidade do conjunto inteiro, sem dividir seu preço entre as pizzas.

As baixas de novas vendas ficam registradas por item, com ingredientes de mesmo ID consolidados, inclusive em combos. A devolução usa essa ficha histórica, sem recalcular a receita antiga pelo catálogo atual. Vendas anteriores que só possuem baixa global não têm separação segura: a alteração individual é recusada e o pedido inteiro continua com o fluxo de cancelamento existente. Não há reconstrução automática de dados legados.

Dinheiro recebido não muda automaticamente ao editar. Aumento deixa diferença a receber; redução paga mostra saldo a devolver. O gestor registra o estorno somente depois de devolver ao cliente; o sistema limita o registro ao excesso recebido (ou saldo recebido total no pedido cancelado). Alterar valor de pedido com recebimento exige permissão financeira. Registros de perda não geram automaticamente despesas no financeiro. Cupom segue a condição registrada na venda; mínimos passam a ser guardados em novas vendas. Legados sem esse dado preservam a condição conhecida. Frete permanece enquanto houver itens.

**Combos:** use Adicionar item fixo incluído para produtos que sempre entram juntos; use Adicionar grupo de escolha para alternativas em que o cliente escolhe uma opção. Quantidade repete o produto selecionado. Confira fotos, nomes, tamanhos e preço mínimo na prévia antes de salvar. Trocar um grupo com várias alternativas para fixo separa cada alternativa em um item, preservando quantidade, tamanho, montagem e acréscimo. A conversão só é persistida em Salvar combo; Cancelar descarta. O limite é dez itens/grupos. Grupos antigos continuam compatíveis, sem conversão automática.

Estas ações de pedido estão disponíveis somente no runtime local nesta entrega; integração remota permanece adiada. Gate325 testes/44 arquivos e181 critérios aprovado. A inspeção visual nova ficou pendente porque a ferramenta do navegador falhou ao inicializar; testes de interação do Dashboard passaram. Nenhum pedido/estoque/pagamento real foi usado em QA e nada foi publicado.

## Uso dos refinamentos — 28/10/2026

- **Sacola:** Editar reabre a montagem com tamanho, sabores, frações, massa, borda e observações. Salvar substitui a linha e revalida preços/disponibilidade. Se uma opção antiga foi substituída ou desativada, a edição avisa e exige conferir o novo total.
- **Planilha:** exporte o cadastro da mesma loja; aba Preços das pizzas contém referências de pizza inteira por tamanho. Não altere códigos/IDs. Marque atualizar produtos existentes ao reimportar. Fichas e configurações não viram cadastros novos em outra loja. Alterações conflitantes no mesmo sabor são recusadas.
- **Vínculo:** revise tamanhos/bordas antes de vincular. Adicionais antigos continuam guardados, mas ficam fora da cobrança/seleção duplicada. O vínculo da Cia do usuário permanece não aplicado.
- **Pagamentos:** nos detalhes do pedido, informe valor e forma de cada recebimento. O saldo baixa, sem alterar a etapa de entrega. Para devolver valores, cancele e informe motivo. Estorno parcial não pode superar o recebido. No caixa, apenas Dinheiro altera a gaveta; os demais métodos aparecem separados. Turnos fechados mantêm o retrato original.
- **Comandas:** Receber/dividir pagamento sugere partes iguais com diferença de centavos distribuída; registre cada pagamento manualmente. Sem seleção, o saldo é alocado aos pedidos mais antigos; com seleção, apenas a eles. Transferir pedidos selecionados movimenta pedidos inteiros ainda não pagos. A conta inteira pode trocar de mesa livre sem perder o histórico.
- **Fichas:** Estoque e fichas → produto → Parte da ficha → Adicional do produto. Quantidade da ficha é por unidade do adicional; quantidade do produto multiplica a baixa. Custos históricos permanecem no pedido.

Todas essas alterações permanecem locais, sem novas bibliotecas ou integrações. Testes financeiros/estoque em memória; não foram feitos lançamentos reais para validar.

Implementação local iniciada em 27/10/2026 e refinada em 28/10/2026. Não publicada nesta entrega.

## Gestão e valores — 28/10/2026

### Três regras principais

A seção Pizzaria abre na aba **Como cobrar**, com três opções lado a lado na mesma configuração: **Média dos sabores**, **Sabor mais caro** e **Preço fixo**. Para três partes iguais com referências de R$ 44,90, R$ 39,90 e R$ 54,90, a média resulta em R$ 46,57 e o maior valor em R$ 54,90. No fixo, o estabelecimento informa um preço da pizza inteira para cada tamanho disponível, independentemente da combinação. Nenhuma regra ou preço existente é trocado sem salvar.

No fixo, o contrato usa `pricing: fixed` e `sizes[].fixedPriceCents`; todo tamanho disponível exige valor positivo em centavos. Não é necessário informar preços individuais dos sabores. A aba Preços por tamanho passa a oferecer controles de disponibilidade: zero em `flavor.prices[sizeId]` desabilita naquele tamanho; valor ausente ou positivo permite, desde que o sabor esteja ativo. Valores de referência já existentes são mantidos ao mudar de regra; voltar à média/maior volta a exigir preço positivo por sabor/tamanho.

Precedência: preço fixo específico por quantidade de sabores substitui a regra principal; acréscimo por quantidade é somado à regra principal. Massa, borda e adicionais são somados depois, uma vez por pizza. A consulta presencial informa preço fixo por tamanho e sabores incluídos; o montador mostra a regra aplicada. A soma de preços inteiros permanece aceita apenas para cadastros legados e não aparece entre as três escolhas principais. Campos novos são opcionais; cliente e API devem ser publicados juntos.

O painel agora tem **Pizzaria** na navegação de administradores e gestores quando a loja usa o segmento pizzaria ou possui produtos Pizza. Também há atalho no Cardápio. Na cópia local da Cia: `/dashboard?store=cia-da-pizza&tab=pizza`.

Selecione o produto ou montador a configurar. A tela começa em **Como cobrar**. As demais abas são **Preços por tamanho**, **Tamanhos e fatias**, **Preços por sabores** e **Massas e bordas**. Configuração de fotos/aparência continua disponível no editor completo do produto, pelo Cardápio. Edições só entram em vigor ao salvar; descarte restaura os campos, incluindo os monetários. Troca de produto fica bloqueada enquanto houver edições pendentes.

Em **Tamanhos e fatias**, cadastre nome, diâmetro, quantidade de fatias (incluindo 3 ou 4) e limite de 1 a 4 sabores. Fatias são cortes físicos; quantidade de sabores é a combinação escolhida. Na média/maior, cada sabor precisa de preço maior que zero no tamanho para estar disponível; campo vazio não o oferece nesse tamanho. No preço fixo, use os controles de disponibilidade descritos acima.

Em **Preços por sabores**, cada tamanho pode seguir a regra normal, ter **preço fixo da pizza inteira por quantidade** ou receber **acréscimo sobre a regra dos sabores**. Há campos de 1 até o máximo de sabores permitido naquele tamanho. Campos vazios continuam usando a regra normal. Preço fixo deve ser maior que zero; acréscimo zero é válido. Valores são em centavos. Reduzir o limite de sabores remove as regras das quantidades excedentes.

Exemplo de teste: Grande com 3 sabores e preço fixo de R$ 65,90 custa R$ 65,90 com massa/borda inclusas; massa de R$ 2 e borda de R$ 8 levam a R$ 75,90. O preço fixo substitui a parcela dos sabores, enquanto acréscimo é somado a ela. Massa, borda e adicionais são cobrados uma vez por pizza; quantidade de pizzas multiplica o valor final. O cliente vê a regra e o valor ao escolher, e o cardápio presencial também mostra os valores específicos.

O mínimo anunciado considera combinações realmente possíveis, inclusive um preço fixo menor para mais sabores, sem enumerar todas as combinações. Sabores indisponíveis/sem preço e quantidades impossíveis não participam. A API usa o mesmo cálculo e recusa total adulterado. Pedidos anteriores preservam os valores e o resumo da venda.

Cada produto mantém configuração independente: alterar o montador não altera automaticamente os preços dos cards individuais. Para oferecer tamanhos em uma pizza individual, selecione-a e ative a configuração, mantendo-a como produto no cardápio. Novos montadores podem ser criados nesta seção; nenhum valor fictício novo é salvo automaticamente. Sem migração SQL, banco ou publicação nesta etapa. Campos novos são opcionais; configurações legadas continuam com as regras anteriores.

## Montagem visual

Atualização fotográfica: os desenhos de cobertura foram substituídos por 14 imagens fotorealistas geradas por IA, com recorte por partes. Foto própria continua prioritária. Arquivos, prompts e detalhes: [PIZZA-PHOTOGRAPHY.md](PIZZA-PHOTOGRAPHY.md). As descrições históricas abaixo sobre aparência desenhada foram superadas por essa atualização.

O montador agora exibe uma pizza inteira repartida em uma, duas, três ou quatro partes iguais. O cliente escolhe primeiro o tamanho e a quantidade exata de sabores; cada escolha preenche uma parte, com número e legenda. É necessário preencher todas as partes para adicionar. Diminuir a quantidade mantém os primeiros sabores e libera os demais; trocar tamanho reinicia a escolha.

A prévia acompanha as escolhas no desktop e fica compacta no celular. O cardápio original continua acessível pelos mesmos cards, com retorno explícito Voltar ao cardápio dentro do montador.

No painel, cada sabor possui aparência automática pelo nome ou seleção explícita: queijo, calabresa/pepperoni, frango, vegetais, chocolate e banana. Uma foto vista de cima pode substituir a ilustração desse sabor; falha de carregamento retorna ao desenho. Copiar sabores do catálogo reaproveita a foto cadastrada, quando existente, que deve ser revisada para esta composição. A prévia é identificada como ilustrativa, sem serviço de IA ou geração de imagem a cada clique.

O campo opcional flavorCount é validado também no servidor: número de sabores selecionados deve ser exatamente o declarado e respeitar o limite do tamanho. Sacolas anteriores sem o campo continuam aceitas. Aparência e foto são opcionais no catálogo. Nenhuma ativação ou migração automática da loja real foi executada.

## Configuração

O cardápio de delivery mantém os produtos individuais. A chamada **Quer mais de um sabor? Monte sua pizza** abre os montadores disponíveis que permitem combinar sabores. Para não repetir um card genérico, no cadastro do montador selecione **Exibição no cardápio → Somente na chamada Monte sua pizza**. Esse campo é opcional: produtos anteriores continuam nos cards. Os sabores individuais devem continuar cadastrados normalmente. A chamada não cria produtos nem altera preços dos itens individuais e respeita a disponibilidade da loja e do montador.

No painel, abra Cardápio e crie/edite um produto da categoria Pizza. Marque **Ativar montador de pizza**. Cada produto montável tem sua própria configuração; produtos legados continuam funcionando sem migração automática.

- Tamanhos: nome, centímetros, fatias, disponibilidade e limite de um a quatro sabores.
- Sabores: nome, disponibilidade e preço da pizza inteira em cada tamanho. Preço vazio ou zero não oferece esse sabor naquele tamanho.
- Massas e bordas: exatamente uma opção de cada grupo. Cadastre opções gratuitas, como Tradicional e Sem recheio, quando incluídas.
- Regra de cobrança: sabor mais caro, média dos sabores em partes iguais ou soma dos preços inteiros selecionados. A média é arredondada ao centavo. Massa e borda são somadas uma vez por pizza; adicionais existentes continuam separados.
- O preço do cardápio é calculado pela combinação disponível mais barata e exibido como A partir de.

Copiar sabores do catálogo cria uma cópia independente dos produtos Pizza ainda sem montador, com preço apenas no primeiro tamanho. Revise a tabela e os adicionais legados de tamanho/borda antes de salvar para evitar opções duplicadas. Nada é copiado ou habilitado automaticamente na loja real.

## Cliente e pedido

O cliente escolhe tamanho, de um ao limite de sabores, massa e borda. Trocar tamanho limpa os sabores; opções indisponíveis não aparecem. Cada sabor ocupa a mesma fração da pizza. O preço usa o mesmo domínio no navegador e na API. O servidor recebe IDs, recalcula o total e bloqueia alterações de preço, opções ausentes ou combinações inválidas.

A sacola distingue as montagens. Ao confirmar, o pedido salva um resumo imutável com tamanho, diâmetro, fatias, frações dos sabores, massa e borda, além do preço da venda. Esse resumo aparece na sacola, no painel, na impressão existente, no acompanhamento e no texto do link de WhatsApp. Alterar o catálogo não reescreve os pedidos anteriores. Não é enviada mensagem automaticamente.

O cardápio presencial permanece apenas para consulta: mostra tamanhos, tabela de sabores, massas, bordas e regra de cobrança, sem sacola ou pedido pelo QR.

## Compatibilidade e limites

Campos opcionais em produtos/sacola/pedidos; contratos locais e remotos compatíveis com dados anteriores. Nenhum esquema SQL ou dado real foi alterado. Configuração salva exige a permissão existente de catálogo. Não são expostos custos privados novos. Custos de montagens ficam desconhecidos até existir ficha técnica, evitando apresentar margem inventada.

Reimportar na mesma loja preserva o montador, fichas, alergênicos e combos. A exportação inclui a aba Preços das pizzas: edite valores por sabor/tamanho e o fixo por tamanho, sem alterar códigos/IDs. Preço fixo repetido deve ser igual nas linhas do tamanho; vazio preserva o fixo atual. O mínimo é recalculado e os vínculos explícitos sincronizam. Nomes de tamanho/sabor nessa aba identificam, não renomeiam. Crie tamanhos/sabores no painel; a planilha não clona regras para outra loja. Sabores copiados continuam independentes até usar Vincular sabores ao cardápio.

**Publicar cliente e API juntos antes de ativar o montador nos cadastros reais.** O servidor local remoto utiliza o banco existente, compartilhado com produção. O código antigo publicado não conhece os novos campos; não usar esse ambiente compartilhado como banco de testes da funcionalidade.

## Verificação

Testes de domínio, serviços, componentes e API HTTP cobrem as três regras, arredondamento, quatro sabores, disponibilidade por tamanho, limites, autorização, preço adulterado, revalidação no checkout, sacolas distintas, histórico e preservação na reimportação. QA de navegador usa backend HTTP descartável em memória, sem DATABASE_URL, dados pessoais reais ou contas externas. Evidências e gate registrados em docs/QA.md.

## Operação ampliada da pizzaria — 28/10/2026

Implementação local. As integrações de banco, CEP/endereço, pagamentos, mensagens, impressora automática e publicação não foram executadas. Os novos comandos de operação não estão ligados ao adaptador HTTP remoto; nessa modalidade as telas avisam que a integração fica para depois. O modo local mantém a mesma identificação de simulação e o armazenamento por navegador/origem.

### Cadastro único e montagem

Na seção Pizzaria, selecione o montador e use Vincular sabores ao cardápio somente após revisar as regras. A ação reaproveita os produtos Pizza com o mesmo nome (ou cria os ausentes), preserva suas fotos e descrições e aplica os tamanhos e valores do montador às pizzas individuais. Nomes duplicados ou vínculos inválidos são recusados. Depois do vínculo, nome, disponibilidade, preço por tamanho, ingredientes, alergênicos, adicionais e fichas do sabor são compartilhados. A edição no Cardápio ou em Pizzaria preserva o outro fluxo. Produtos vinculados não podem ser excluídos antes de remover os vínculos. Na aba Combinações e ingredientes há opção de desvincular um sabor; cadastros antigos não são vinculados automaticamente. Mantenha nomes/IDs de tamanho coerentes ao compartilhar sabores entre montadores.

A aba Combinações e ingredientes configura sabores doces/salgados, mistura permitida, ingredientes removíveis, alergênicos declarados pela loja e adicionais por sabor. Cada adicional é cobrado inteiro, uma vez na parte escolhida; não é dividido pela fração. Em Massas e bordas, restrinja tamanhos e tipos de sabor aceitos. O cálculo rejeita combinações incompatíveis e a seleção do cliente troca uma massa/borda que deixou de ser compatível.

Com Permitir partes diferentes ativo, o cliente pode dividir em quatro quartos (2/4 + 1/4 + 1/4, 3/4 + 1/4 etc.). O total precisa somar quatro. A prévia fotográfica, o resumo e a média acompanham os pesos. Maior valor e preço fixo conservam sua regra, e as exceções por quantidade contam sabores distintos. Partes iguais continuam disponíveis, inclusive três terços. Quantidade máxima permanece quatro sabores. O mínimo anunciado considera proporções válidas. Informação de alergênicos não é inferida automaticamente e não certifica ausência de contaminação cruzada.

### Cozinha, atendimento e salão

Cozinha mostra cartões com origem, tamanho, sabores, proporções, massa, borda, adicionais, retiradas e observações. Há tempo de espera, horário de agendados, botões de próxima etapa e acesso aos detalhes/impressão existente. Não há integração com impressora térmica nem impressão silenciosa.

Balcão e telefone monta uma sacola independente da sacola pública, com seleção dos mesmos produtos e combos. Valores são recalculados pelo domínio; a chave do pedido evita duplicidade na confirmação. O atendente pode registrar vendas fora do horário público da loja ativa; os pagamentos começam pendentes. Balcão/mesa com retirada aceitam nome/telefone vazios (identificação de consumidor/mesa); telefone e entrega mantêm os dados obrigatórios. A montagem pode ser editada no resumo, preservando a linha. Não existe cobrança externa automática.

Mesas e comandas cadastra mesas, abre uma comanda por mesa e relaciona os pedidos feitos pelo Balcão (origem Mesa / comanda). O fechamento exige pedidos concluídos e pagos, ou cancelados. O histórico fica preservado. A comanda permite receber em partes, dividir o saldo por pessoas/valor, selecionar pedidos para receber e transferir a conta inteira para mesa livre ou pedidos ainda sem pagamento para outra mesa. O QR continua apenas consulta presencial. Pedidos cancelados com recebimento exigem estorno antes de encerrar.

### Combos, estoque e custos

Combos oferece grupos de escolha com quantidade incluída, preço do conjunto e acréscimo por escolha. Cada grupo é obrigatório. São aceitos produtos comuns e pizzas com tamanho fixado no combo. Ative Permitir escolher sabores, massa e borda para oferecer o montador (obrigatório em produtos com vários sabores). Sabores/tamanho ficam incluídos no preço do conjunto; massas, bordas e adicionais pagos somam por unidade de pizza incluída, além do acréscimo único da escolha do grupo. Sem montagem, pizzas de sabor único usam a primeira massa/borda compatível, incluída no conjunto. Combos dentro de combos são recusados. O resumo do pedido preserva os componentes e o estoque considera suas quantidades. Fotos do combo podem ser editadas no Cardápio. O preço inicial anunciado inclui o menor acréscimo dos grupos disponíveis.

Estoque e fichas cadastra ingredientes em g/ml/un, saldo, alerta mínimo e custo por unidade. O custo unitário é uma taxa em centavos, podendo ter casas decimais para gramas/ml; valores finais são arredondados a centavos inteiros. Entradas, perdas e ajustes exigem motivo; unidade é imutável após o cadastro. Saldo de ingrediente existente é alterado somente por ajuste ou consumo.

A ficha de cada sabor/tamanho representa sua cobertura numa pizza inteira e é multiplicada pela fração escolhida. Massas, bordas e adicionais de sabor entram uma vez, produto/embalagem também pode ter ficha. Fichas compartilhadas de massa/borda propagam entre produtos vinculados com o mesmo ID. Combos multiplicam os componentes e incluem sua embalagem. Retirada de ingredientes não reduz consumo automaticamente: a baixa é conservadora, e perdas/devoluções usam ajustes.

Confirmar o pedido consome o estoque de forma atômica; insuficiência impede a venda sem apagar a sacola. Cancelamento antes do preparo devolve o saldo; depois mantém consumo. Custo da pizza só é apurado com fichas completas da montagem; não se inventa margem para cadastros incompletos. Receitas/custos/estoque/caixa são excluídos da projeção pública. O controle local entre computadores/dispositivos dependerá do banco/adaptador futuro.

### Caixa, agendamento e repetição

Caixa registra abertura, suprimentos, sangrias e conferência por turno. O esperado na gaveta considera dinheiro inicial e recebimentos/estornos em Dinheiro; Pix/cartão aparecem separados. Movimentos de pagamento são associados ao turno, e o fechamento guarda os valores da conferência. Recebimentos sem caixa aberto não são atribuídos automaticamente ao próximo turno. Despesas do Financeiro não saem da gaveta sozinhas: registrar a sangria correspondente evita dupla contagem. Diferenças são apresentadas e preservadas.

Agendamento configura antecedência, intervalo, dias à frente, capacidade em pedidos e capacidade opcional em pizzas por horário. Usa Bahia/UTC−3, valida horários de funcionamento quando ativos e recusa horário lotado; cancelamento libera a vaga. O cliente informa o horário no checkout. O horário agendado é exibido na cozinha, nos detalhes e no acompanhamento. É possível montar/agendar fora do expediente se a agenda estiver habilitada; fechamento manual ou pausa da central continua bloqueando. Combos contam todas as pizzas incluídas e cada pizza conta uma unidade, independentemente de tamanho; não é uma simulação de duração/capacidade física do forno. Pedidos antigos sem contagem confiável precisam de revisão naquele horário. Não há promessa automática de prazo logístico.

Pedidos novos guardam as escolhas necessárias para Pedir novamente no acompanhamento. A repetição adiciona à sacola e revalida IDs, opções e disponibilidade atuais; os preços são atuais e o pedido anterior permanece intacto. O estoque é conferido novamente ao confirmar. Pedidos legados sem escolhas estruturadas continuam consultáveis, mas precisam ser refeitos pelo cardápio.

### Validação desta ampliação

24 testes novos em restaurant.test.ts, restaurant-security.test.ts e restaurant-ui.test.jsx cobrem domínio, serviços em memória, permissões, projeções e componentes. A inspeção de navegador usa origem de QA separada (5181), sem Neon e sem alterar a Cia em 5176. A revisão automática bloqueou salvar uma ficha fictícia e abrir um caixa de R$ 100 no navegador por serem lançamentos operacionais persistentes; esses casos foram verificados somente em memória/testes automatizados, sem contornar o bloqueio. Capturas e gate final constam em QA/STATUS. Ausência de integração externa e de validação em impressora/celular físico é limite real desta etapa.

## Como os combos aparecem no cardápio

O card usa as fotos dos produtos de cada grupo, junto das quantidades e tamanhos definidos em Combos. Produtos indisponíveis não compõem a sugestão visual. O card informa os itens incluídos e separa valor e botão; segue fundo claro e a cor da loja. Em combos montáveis, as fotos iniciais são sugestões dos sabores oferecidos, identificadas como sabores à escolha. Ao escolher, o resumo mostra as pizzas selecionadas e suas partes. A foto original do combo não substitui essa composição. A janela reúne o conjunto antes de adicionar, preservando os IDs, quantidades e regras de preço. Consulta por QR mostra os componentes e mantém a orientação de pedir à equipe.


### Todos incluídos ou uma escolha?

Cada grupo corresponde a uma escolha obrigatória. Para uma Calabresa, uma Mussarela e uma Margherita juntas, cadastre três grupos com quantidade1 e somente a pizza correspondente em cada um. Um grupo de quantidade1 com três opções inclui apenas uma pizza à escolha; quantidade3 nesse mesmo grupo inclui três unidades da opção escolhida, não uma de cada. Itens únicos disponíveis e sem acréscimo são pré-selecionados; alternativas, opções pagas e montagens exigem escolha. O preço base é definido no combo, sem somar automaticamente os preços avulsos.
