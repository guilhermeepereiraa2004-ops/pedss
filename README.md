# Pedss — Seu delivery, aceso.

Repositório principal: [guilhermeepereiraa2004-ops/pedss](https://github.com/guilhermeepereiraa2004-ops/pedss). Esta pasta acompanha a versão integral do projeto, incluindo os módulos locais de pizzaria. A conexão Git da Vercel é independente do `origin` local e precisa ser configurada e validada antes da publicação automática.

Aplicação React/Vite de delivery com cardápio, operação da loja e central de estabelecimentos. O modo remoto usa API na Vercel, PostgreSQL atualmente no Supabase e sessões validadas no servidor. O Neon anterior foi preservado. O modo local legado continua disponível. Pagamentos online e e-mails não estão integrados.

Veja [configuração, primeiro acesso, arquitetura remota e limites](docs/DEPLOYMENT.md). A primeira conta publicada exige código privado; nenhum acesso demo é habilitado no modo remoto.

## Executar

Requer Node.js 24 ou superior.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite (normalmente `http://localhost:5173`; se ocupado, ele escolhe a próxima porta). O desenvolvimento usa a demonstração local por padrão, mesmo se `.env.local` contiver `VITE_RUNTIME_MODE=remote`. Para conectar intencionalmente à API/Neon, configure também `PEDSS_ALLOW_REMOTE_DATABASE=true` e as variáveis de servidor. Isso compartilha os dados e o consumo do banco configurado; prefira um banco de desenvolvimento separado. O modo local usa dados isolados por origem. Builds de produção continuam respeitando `VITE_RUNTIME_MODE`.

Veja [sincronização e redução de transferência](docs/DATA-EFFICIENCY.md). A landing não consulta a API nem abre um canal de atualizações.

Para continuar a pizzaria sem acessar o Neon, há uma cópia de desenvolvimento da **Cia da Pizza**. No PowerShell:

```powershell
$env:VITE_RUNTIME_MODE='local'
$env:PEDSS_ALLOW_REMOTE_DATABASE='false'
$env:VITE_LOCAL_CIA_PREVIEW='true'
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Entre como administrador local em `/super-admin`. A cópia aparece em `/store/cia-da-pizza` e `/dashboard?store=cia-da-pizza&tab=menu`, com 14 sabores salvos e o montador de revisão. O preparo exige administrador, é exclusivo do servidor de desenvolvimento e só adiciona uma loja ausente. Não substitui IDs/endereços existentes nem reaplica preços/configurações sobre edições posteriores. A cópia persiste no navegador e na origem usados; não importa contas, clientes, pedidos ou configurações atuais do Neon, nem sincroniza com produção. Usa retirada de demonstração e os valores de referência da prévia. O catálogo de desenvolvimento é excluído do build de produção.

| Endereço                | Função                                         |
| ----------------------- | ---------------------------------------------- |
| `/`                     | Apresentação da plataforma                     |
| `/store/demo`           | Cardápio e checkout da demonstração            |
| `/menu/demo`            | Cardápio presencial para QR code               |
| `/login`                | Conta individual; perfis demo só no modo local |
| `/configurar-acesso`    | Primeira conta; código privado no modo remoto  |
| `/dashboard?store=demo` | Operação da loja                               |
| `/super-admin`          | Central, estabelecimentos e equipe             |
| `/acompanhar`           | Consulta pelo link recebido na confirmação     |
| `/pedido/TOKEN`         | Acompanhamento do pedido                       |

Somente no modo local, `/login` permite **Administrador da plataforma**, **Gestor da loja demo** ou **Atendente da loja demo**. Essa simulação não representa segurança de produção. No modo remoto, use sua conta e senha; o servidor aplica as permissões e os botões demo não estão disponíveis.

## Funcionalidades

- Catálogo com fotos, categorias, busca, disponibilidade, ingredientes removíveis e adicionais com preço.
- Prévia e recorte de fotos, logos e capas, com zoom, arraste, ajuste de posição e confirmação antes de salvar. Aceita PNG/JPEG/WebP de até 10 MB e prepara o recorte com até 500 KB, sem serviço externo.
- Sacola persistente e checkout com cliente, telefone, endereço, área atendida, taxa, retirada, pagamento escolhido, troco e observações.
- Preços recalculados pelo catálogo; alteração de preço exige revisão; confirmação repetida não duplica pedido.
- Pedidos estruturados, aceite, preparo, entrega/retirada, cancelamento com motivo e histórico.
- Acompanhamento por token, cópia do link, impressão e resumo para envio manual por WhatsApp.
- Recebimento e estorno registrados separadamente da entrega; financeiro por período e CSV.
- Logo, capa, cor, nome, telefone, áreas de entrega, horários semanais e funcionamento após meia-noite.
- Perfis administrador, gestor e atendente, verificações nas rotas e nos serviços, convites, recuperação e revogação de acesso locais.
- Central com cadastro, edição, pausa, arquivamento e restauração de lojas; novas lojas começam vazias.
- Migração dos dados legados, validação de dados persistidos, cópia de segurança para conteúdo inválido e erros de armazenamento visíveis.

No modo remoto, os avisos de novos pedidos usam polling de 15 segundos; no local, funcionam entre abas da mesma origem. O som precisa ser ativado pelo usuário. Pix e cartão são escolhas de pagamento no recebimento; não há processamento online. Planos são referências, sem cobrança ou limites contratados.

## Arquitetura e verificação

Para pizzarias, **Painel → Pizzaria** permite cadastrar tamanhos/fatias, preços de cada sabor por tamanho e preço fixo ou acréscimo para 1 a 4 sabores. Massas, bordas e regras do montador ficam na mesma seção. Veja [configuração e cálculo dos preços](docs/PIZZA-BUILDER.md).

### Cardápio da loja física, cupons e indicadores

Em **Painel → Cardápio**, baixe o modelo de planilha XLSX, preencha produtos/adicionais e use **Importar planilha**. A prévia informa erros por linha e só permite gravar o lote inteiro após confirmação. Suporta até 500 produtos e 1.500 adicionais em arquivos de até 2 MB, com atualização opcional pelo código. Pedidos e produtos fora do lote são preservados. Veja o [guia de importação](docs/CATALOG-IMPORT.md).

Use **Exportar cardápio** para baixar os produtos atuais, editá-los e importar novamente. Produtos sem código recebem um código estável; mantenha esses códigos e ative a opção de atualização na reimportação. Exporta também itens indisponíveis, custos e adicionais; catálogos maiores geram um ZIP com partes XLSX. Fotos salvas no navegador são preservadas por marcador na atualização da mesma loja.

Em **Painel → Cardápio digital**, cada estabelecimento tem um link permanente `/menu/SLUG`, prévia do QR code, cópia de link, download em SVG/PNG e placa para impressão. O cardápio usa o mesmo cadastro de produtos, fotos e adicionais; oferece busca, categorias e detalhes para pedir com a equipe. O fechamento do delivery não impede consultar o cardápio presencial; lojas arquivadas não ficam disponíveis.

O QR padrão aponta para a origem atual. `localhost` não abre o projeto no celular de outra pessoa. No modo remoto publicado, o catálogo já é compartilhado pelo backend. `VITE_PUBLIC_MENU_ORIGIN` permite preparar o material com uma origem já publicada, mas não publica nem sincroniza dados.

- **Cupons:** percentual ou valor fixo, mínimo em produtos, validade, limites total/por telefone, ativação e divulgação na vitrine. O desconto é recalculado no checkout e preservado no pedido.
- **Despesas:** gastos já pagos, categoria, data, notas, edição, arquivamento e restauração.
- **Custos:** campos opcionais por produto/adicional, preservados em cada venda. Dados desconhecidos não viram custo zero.
- **Visão geral:** receita, despesas, pedidos e ticket do mês, produtos mais/menos vendidos, cliente com maior margem bruta, saldo dos últimos sete dias e comparação mensal desde o cadastro.

Os indicadores excluem os pedidos de exemplo pré-carregados. Receita segue recebimentos e estornos; despesas seguem pagamentos. Margem bruta não representa lucro líquido: frete e despesas gerais não são rateados entre clientes. Sem custos completos, o ranking de margem informa a pendência. Definições em [docs/BUSINESS.md](docs/BUSINESS.md).

Domínio tipado e validado com Zod em `src/core`; persistência e acesso em `src/adapters`; casos de uso em `src/application`; React apresenta os fluxos. O ponto de composição é `src/application/runtime.js`.

```sh
npm run check        # lint, tipos, camadas, testes, aceitação e build
npm test             # Vitest: domínio, persistência, acesso e UI
npm run typecheck    # TypeScript estrito no núcleo/adaptadores/aplicação TS
npm run format
```

O gate possui 76 critérios com IDs estáveis. A relação e a evidência são geradas em [docs/checklist-paridade.md](docs/checklist-paridade.md). A CI executa o mesmo gate.

Leia [arquitetura](docs/ARCHITECTURE.md), [contrato da API futura](docs/API.md), [verificação](docs/QA.md) e [pendências para produção](docs/GAPS.md).

## Dados e limites locais

O estado usa `brasa.workspace.v2` em localStorage; a sessão usa sessionStorage. Não apague os dados do navegador se precisar preservar cadastros e pedidos. As chaves antigas são mantidas após a migração. Backups de conteúdo inválido usam `brasa.backup.invalid.*`.

O repositório local compartilha o estado entre abas da mesma origem. Outros dispositivos, portas e subdomínios têm armazenamento separado. Endereços como `demo.localhost` são reconhecidos; o uso real de subdomínios depende de API compartilhada e configuração de domínio. `.env.example` documenta o domínio público opcional. Nenhuma credencial de banco deve ser colocada em variáveis `VITE_*`.

Login, convites e recuperação são simulações locais. Senhas são derivadas e tokens armazenados por hash, mas qualquer pessoa com acesso ao armazenamento pode alterar o estado. Convites e recuperação exibem links locais e não enviam e-mails. O agregado local contém dados de todas as lojas; ele **não deve ser enviado por uma API pública**.

Registros de trabalho `plan/` e `log/` ficam locais, ignorados pelo Git conforme a preferência do projeto. A documentação técnica em `docs/` acompanha o código.

### Operação ampliada da pizzaria (local)

O painel inclui Cozinha, Balcão e telefone, Mesas e comandas, Combos, Estoque e fichas, Caixa e Agendamento. Em Pizzaria, o vínculo explícito compartilha os sabores do cardápio com o montador; combinações incluem regras doces/salgadas, personalização por sabor e proporções em quartos. Pedidos novos podem ser repetidos pelo acompanhamento com revalidação dos valores atuais. Guia de uso, limites e critérios: docs/PIZZA-BUILDER.md, seção Operação ampliada da pizzaria.

Estes comandos novos estão implementados no repositório local, sem integração HTTP/banco ou publicação. Não use o modo local como autenticação/segurança de produção. O uso compartilhado entre dispositivos depende da próxima etapa. Nenhuma chave/serviço adicional é necessário para testar localmente. Gate completo: npm run check.
