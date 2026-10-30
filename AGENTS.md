# Brasa — instruções de desenvolvimento

Repositório canônico solicitado pelo usuário: `https://github.com/guilhermeepereiraa2004-ops/pedss.git`. A pasta local usa esse endereço como `origin`. Não enviar novas alterações para `DiegoMicaelvs/pedss`. O vínculo local com o projeto Vercel não equivale a uma integração Git; conferir separadamente antes de afirmar publicação automática. Este repositório contém a versão integral, incluindo funcionalidades de pizzaria ainda não publicadas remotamente.

Aplicação React/Vite de delivery, agora chamada Pedss. O usuário autorizou Neon e publicação na equipe Diego Projects em 21/10/2026. Existem modos local (demonstração legada) e remoto (API na Vercel, PostgreSQL no Neon e sessões validadas no servidor). Sem provedor externo de identidade ou envio de e-mail.

Atualização de 30/10/2026: produção migrada para Supabase PRO `pedss-producao` (`ncohdxclvgoeqyutfubw`), após autorização explícita para começar vazio e criar login técnico limitado. Neon e `.env.local` anteriores preservados; não importar/sobrescrever o novo banco nem afirmar que contas antigas foram migradas. Primeiro administrador depende da submissão do usuário na tela de primeiro acesso. Estado atual e evidências em `docs/SUPABASE-MIGRATION.md` e `plan/STATUS.md`. Novos módulos locais de pizzaria sem API continuam fora da publicação; a troca usou a base publicada com ajustes de conexão e leitura.

Antes de trabalhar, leia `plan/STATUS.md`, `plan/execution-plan.md`, `ROADMAP.md`, `log/devlog.md` e `plan/LANES.md`. Nesta tarefa há uma raia única, de responsabilidade do agente principal.

Regras: preservar dados legados; valores monetários em centavos; usar ID imutável para estabelecimentos; não confiar em preço ou nome da sacola; separar entrega de pagamento; exigir autorização nas ações de gestão; nunca apresentar a autenticação local como segurança de produção.

Arquitetura: `src/core` contém domínio e contratos sem React/DOM; `src/adapters` implementa persistência e autenticação locais; `src/application` contém casos de uso; `src/hooks`, `components` e `pages` apresentam os fluxos. `src/lib/data.js` mantém somente catálogo de demonstração e utilitários de apresentação. A UI não escreve diretamente em localStorage.

Gate obrigatório: `npm run check`. Inclui lint, tipos do núcleo, camadas, testes de comportamento e build. Alterações de UI exigem inspeção pelo navegador disponível; registrar limitações reais em `docs/QA.md`. Comando local: `npm run dev`.

Não integrar banco, contratar serviços, enviar emails ou publicar sem pedido do usuário. Acesso, convites e recuperação nesta etapa são simulações locais identificadas como tais. Ao concluir, atualizar status, roadmap, lacunas e devlog. Sem commits automáticos.
