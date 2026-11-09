# Notificações push de pedidos

Em **Visão geral** ou **Pedidos**, proprietários e administradores ativam os avisos no dispositivo que querem usar. O navegador pede permissão no momento da ativação. No iPhone e no iPad, primeiro adicione o painel à Tela de Início e abra pelo ícone.

Um pedido novo confirmado pelo cardápio dispara o aviso pelo servidor após a gravação. O clique abre Pedidos na loja correspondente. A inscrição continua ativa quando a aba fecha e pode ser removida no painel do mesmo dispositivo. Os avisos internos e o som continuam disponíveis no painel.

O ambiente de produção do Pedss já tem a migração e as chaves de envio. Abra o painel e ative os avisos em cada dispositivo que deve recebê-los.

## Ativação no ambiente publicado

1. Aplique [a migração 002](../migrations/002_order_push.sql) no banco Pedss com a credencial de manutenção. O script `npm run db:migrate` também aplica essa migração. Confira a origem de `DATABASE_URL_UNPOOLED` antes de executar. A tabela fica no esquema privado, com RLS e acesso para o papel técnico `pedss_api`.
2. Gere um par estável de chaves com `npx web-push generate-vapid-keys --json`. Guarde os valores nas variáveis de servidor `PEDSS_PUSH_PUBLIC_KEY` e `PEDSS_PUSH_PRIVATE_KEY`. `PEDSS_PUSH_SUBJECT` aceita URL HTTPS ou endereço `mailto:` do responsável. Mantenha a chave privada no ambiente de servidor, fora do Git.
3. Publique a aplicação, abra o painel no dispositivo escolhido e ative as notificações. Feche as abas do painel, faça um pedido em uma loja de teste por outro dispositivo e confira o aviso e o destino do clique.

O serviço de push do navegador pode reter o aviso por até cinco minutos se o dispositivo estiver offline. O envio depende da conectividade, das permissões do navegador e das configurações do sistema. A função usa envio assíncrono após o checkout e remove inscrições que o serviço marca como expiradas. A entrega não possui uma fila persistente para repetir falhas temporárias. A configuração precisa manter o mesmo par de chaves para os dispositivos já inscritos.
