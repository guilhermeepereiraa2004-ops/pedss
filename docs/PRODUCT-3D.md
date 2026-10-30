# Produto em 360° real

Escopo atual (22/10/2026): usuário esclareceu que basta movimentar fotografias e autorizou flutuação, balanço e sombra no cardápio. Essa combinação está implementada em CSS para recortes verificados, com pausa/redução de movimento e hero independente. Não requer este pipeline de geração. Fotos sem GLB agora podem ser animadas; a menção a fotos estáticas abaixo registra o estágio anterior. Experimentos externos permanecem parados.

## O que já funciona

Cada produto aceita model3dUrl HTTPS ou caminho local de GLB. ProductVisual faz import dinâmico de @google/model-viewer 4.4.0 somente quando existe modelo. Sem modelo exibe recorte estático, nunca inclinação CSS apresentada como 360°. Modelo válido gira geometria a 30°/s; detalhes aceitam órbita com mouse/toque, com zoom desabilitado para não prender a rolagem. Pausa e preferência de movimento reduzido preservadas. Erro do modelo usa recorte com alpha verificado; foto original opaca não reaparece. A biblioteca é um visualizador, não gera geometria.

model3dUrl é persistido pelo caso de uso saveProduct autorizado e pela estrutura JSON já existente; não houve migração ou alteração de banco nesta tarefa. Trocar a foto invalida recorte/modelo antigos. Importação com a mesma foto preserva URL do modelo. Uma planilha de outra loja não transfere o GLB; é preciso configurar esse vínculo.

## Caminho escolhido pelo usuário

Uma foto de cada hambúrguer → recorte/revisão do produto → gerador imagem-para-3D que estima lados escondidos → revisão do GLB por todos os ângulos → cópia persistente do modelo → vínculo ao ID imutável do produto → visualizador no cardápio. A geração deve ocorrer uma vez por versão da foto e nunca na visita de cada cliente.

Meshy foi pesquisada e recusada pelo usuário. Não foi contratada, não há chave configurada e nenhuma geração/crédito foi usado. Documentação: https://docs.meshy.ai/en/api/image-to-3d e https://docs.meshy.ai/en/api/asset-retention (arquivos API expiram em até 3 dias; não usar URL temporária como armazenamento definitivo).

Alternativa testada: TRELLIS.2, da Microsoft. Repositório https://github.com/microsoft/TRELLIS.2 ; demonstração oficial https://huggingface.co/spaces/microsoft/TRELLIS.2 ; app https://microsoft-trellis-2.hf.space . Após o bloqueio inicial de transmissão, o usuário autorizou explicitamente esse destino e o envio de menu-brasa-only.png foi concluído. Geração 512, seed 2048826796, produziu prévia renderizada com vistas estimadas; não é arquivo GLB exportado. Extrações com 100.000 faces e texturas 2048/1024 retornaram erro genérico. Nova geração em 1024 foi recusada com mensagem de cota ZeroGPU e espera 23:58:15. Não houve download/vínculo de GLB, conta criada, token fornecido, pagamento ou contratação. A página pública não é backend contratado nem promessa de disponibilidade de produção. Evidências: docs/screenshots/trellis-extraction-error.png e trellis-gpu-quota.png.

Outra alternativa aberta: TripoSR https://github.com/VAST-AI-Research/TripoSR ; MIT para código/modelos, aproximadamente 6GB VRAM no padrão, reconstrução de uma imagem. Demo oficial estava com runtime error ao consultar. TRELLIS.2 local exige NVIDIA >=24GB e é testada em Linux. Este PC reportou Intel Iris Xe; não é uma opção prática de GPU local para essa implementação. Não foi instalado pipeline Python/CUDA nem baixados pesos pesados.

## Arquitetura para a geração automática futura

- Comando autenticado do gestor, associado a estabelecimento/produto/fingerprint da foto; um job por foto e idempotência para impedir cobrança/reprocessamento duplicado.
- Gerador separado do frontend/Vercel request: GPU própria ou provedor escolhido; segredo só no servidor. Estados aguardando/processando/erro/revisão/aprovado.
- Resultado revisado antes de publicar. GLB autocontido e otimizado para celular, hospedagem permanente e poster transparente; não gravar base64 grande no agregado do catálogo.
- Persistir URL permanente + versão da foto no produto, e metadados privados do job em entidade separada. Descartar resultado atrasado se a foto mudou e revalidar autorização antes de publicar.
- Carga do GLB por visibilidade e limite de modelos simultâneos; nunca fazer uma geração para cada acesso de cliente. Medir tamanho/texturas e memória em celulares reais.

## Verificação

Gate completo: 123 testes e 76 critérios. Teste técnico de WebGL com cubo GLB de faces coloridas claramente identificado, fora do catálogo; não foi usado como se fosse modelo de hambúrguer. Captura docs/screenshots/glb-technical-viewer.png. Ainda falta validar qualidade, carga e performance de um GLB gerado do produto real.
