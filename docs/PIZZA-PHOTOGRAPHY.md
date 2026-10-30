# Imagens fotorealistas dos sabores

Geradas em 27/10/2026 pela ferramenta nativa image_gen. São imagens ilustrativas geradas por IA, não fotografias dos produtos reais de um estabelecimento.

## Correção das cebolas — 28/10/2026

Calabresa, portuguesa, toscana, atum e carne seca com requeijão receberam edição pela ferramenta nativa image_gen: cebolas longas, grossas e claras foram substituídas por pequenos pedaços de cebola roxa assada. Coberturas de cada sabor, enquadramento superior, pizza inteira e transparência foram mantidos. As seis imagens novas (cinco sabores e hero) foram inspecionadas individualmente. Os demais nove sabores não contêm cebola e mantêm suas fotos.

Prompts finais, referências e fontes geradas: [onion-correction-2026-10-28.json](../design/pizzas/onion-correction-2026-10-28.json). Novos PNGs dos sabores: `design/pizzas/onion-correction/`. Os originais anteriores permanecem em `originals/`; `workspaceSource` no manifesto de geração seleciona os novos arquivos para a reconstrução. WebP com novos hashes atualizam cards, detalhes e setores do montador, mantendo a prioridade de fotos próprias cadastradas. A hero usa `public/images/hero-pizza-v3.png`, com derivados WebP próprios. Nenhuma alteração em ingredientes cadastrados, preços, dados de loja ou banco.

## Arquivos e prompts

- Prompts completos e origem de cada arquivo: [generation.json](../design/pizzas/generation.json).
- Originais PNG preservados: `design/pizzas/originals/`.
- Imagens usadas pela aplicação: `public/images/pizzas/`.
- Manifesto com caminho, dimensões e tamanho: `src/lib/pizzaPhotos.json`.
- Reconstrução dos WebP: `scripts/optimize-pizza-photos.py`, com Pillow. Originais já preservados permitem executar em outra máquina sem acessar a pasta de geração original.

São 14 imagens: mussarela, calabresa, frango com requeijão, margherita, portuguesa, quatro queijos, bacon com milho, pepperoni, toscana, atum, carne seca com requeijão, vegetariana, chocolate com morango e banana com canela.

A primeira imagem de mussarela foi gerada em vista superior, pizza inteira, centralizada, margem transparente de aproximadamente 2%, sem prato, marcas de corte ou cenário. As outras treze usam essa imagem como referência e preservam enquadramento/borda/escala, substituindo a cobertura pelos ingredientes de cada sabor. Os prompts completos registram as diferenças de ingredientes, inclusive a remoção de molho/queijo nas doces.

## Integração

Cada imagem é WebP RGBA de 768 × 768 pixels, com tamanho registrado no manifesto `pizzaPhotos.json` e limite verificado de 300 KB por arquivo. O script apenas copia os originais e reduz/codifica para WebP, sem desenhar, compor ou recriar conteúdo. Confere transparência real e igualdade do alpha depois da codificação. Arquivos recebem hash de conteúdo. PNGs originais não são necessários no deploy; somente os WebP públicos e o manifesto são usados na navegação.

O montador usa recortes radiais das fotos, incluindo a borda fotografada, sem retornar aos antigos desenhos vetoriais dos ingredientes. O SVG apenas divide, posiciona e identifica as partes. Foto própria em `previewImage` tem prioridade; em falha, tenta a ilustração correspondente e, se ambas falharem, mostra uma área neutra. A identificação da composição como ilustrativa é mantida.

Os cards de produtos Pizza sem foto própria passam a usar a ilustração do sabor pelo nome; aliases e opções explícitas de aparência são aceitos. Fotos e recortes próprios existentes não são substituídos. O nome genérico de um sabor desconhecido usa a ilustração da aparência configurada ou queijo; revisar/cadastrar foto própria nesses casos. Sabores adicionais não são inferidos por IA durante o acesso.

Nenhum preço, ingrediente cadastrado, pedido ou banco foi modificado. Hero e layout do cardápio permanecem independentes. As mudanças são locais e ainda não foram publicadas.
