# Brasa Original — teste TripoSR no Colab

Em 22/10/2026 o usuário autorizou executar TripoSR no Google Colab usando a foto do Brasa Original. Escopo: produto no cardápio, cards e detalhes; hero independente.

- Notebook: `notebooks/brasa-original-triposr.ipynb`, gerado por `node scripts/prepare-triposr-colab.mjs`.
- Cópia no Colab: https://colab.research.google.com/drive/1gN-I41q-yNwqS9fn_0TcZZ4OUEqwcNG4 . Acesso depende da conta Google autorizada, sem alteração de compartilhamento.
- Entrada: `public/images/menu-brasa-only.png`, SHA-256 `78530653c6c40744fa97b70c5470995383fb28e694729f8daebcf227e2f1e6e0`. Somente essa foto está embutida; não há credencial ou dados da aplicação no notebook.
- Código TripoSR fixado em `107cefdc244c39106fa830359024f6a2f1c78871`, repositório oficial https://github.com/VAST-AI-Research/TripoSR ; código e pesos sob MIT segundo o projeto.
- O notebook baixa pesos públicos de `stabilityai/TripoSR`, prepara a imagem transparente sobre cinza, gera geometria e cores nos vértices e exporta GLB autocontido. Não há criação de hambúrguer procedural nem giro de foto plana apresentado como modelo.
- GPU Tesla T4 alocada, 15 GB de memória. Painel inicialmente confirmou “Você não tem uma assinatura”, porém depois exibiu 86,62 unidades de computação existentes e taxa de aproximadamente 1,07 unidade/hora. Ausência de assinatura não prova gratuidade desse runtime. Ele foi encerrado ao detectar a taxa; painel confirmou 0 sessões ativas/taxa 0. Consumo anterior exato não medido. Sem compra, upgrade, API paga ou montagem do Drive no runtime.
- Runtime mais recente usa Python 3.13; a criação via venv falhou antes de inferência. Selecionada versão 2025.07 na UI e alterada preparação para virtualenv com dependências isoladas.
- Em Python 3.11 a preparação avançou até falha ao instalar torchmcubes, sem inferência nem GLB. Notebook permanece experimental; não declarar geração validada. Para depuração futura, capturar stdout/stderr da instalação e rever versão/compilação da dependência.
- Usuário esclareceu que deseja movimento das fotos do cardápio, sem exigir 3D completo, e pediu explicação das opções gratuitas. Teste Colab encerrado; pedido de uso de até 0,5 unidade não foi aprovado e não deve ser retomado automaticamente. Movimento CSS é a recomendação atual. Não alterar a hero ou aplicar animação nova nesta etapa explicativa.

Se este experimento voltar ao escopo, verificar modalidade e consumo antes de conectar, corrigir instalação e então executar preparar, gerar e baixar nessa ordem. Colab gratuito tem disponibilidade variável; este notebook não é backend permanente de produção. Repetição deve ocorrer por versão da foto, não por visitante do cardápio. Nenhum dado de catálogo, pedido ou Neon foi modificado durante a preparação.
