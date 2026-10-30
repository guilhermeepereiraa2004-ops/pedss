# Imagens dos modelos de loja

## Pizzaria — correção das cebolas em 28/10/2026

Arte atual: `public/images/hero-pizza-v3.png`, edição da v2 com a ferramenta nativa image_gen. Cebolas em arcos longos substituídas por pequenos pedaços assados de cebola roxa, preservando calabresa, manjericão, queijo, borda, enquadramento e transparência. Layout, cores e animação permanecem iguais. v2 preservada. Derivados WebP com hash reconstruídos pelo script de imagens; `storefrontTemplates.js` seleciona v3 para todas as heroes de pizzaria. Prompt completo e referência em `design/pizzas/onion-correction-2026-10-28.json`. Revisão local, sem publicação.

## Pizzaria — revisão de 26/10/2026

Nova arte ilustrativa da hero: `public/images/hero-pizza-v2.png`, 1254×1254 RGBA com alpha real, gerada pela ferramenta nativa image_gen (skill imagegen, sem CLI/API própria). Pizza inteira de calabresa, mussarela gratinada, cebola roxa, orégano e manjericão; borda mais fina e dourada, sem fatia destacada. Original anterior preservado para URLs legadas e imagens do catálogo. Mudança restrita ao modelo de hero de pizzaria e sua prévia; layout, cor da loja e movimento mantidos.

Variantes WebP 640/1254 com hash de conteúdo e alpha idêntico ao PNG redimensionado em `src/lib/storeImageVariants.json`. PNG gerado copiado sem alteração para o projeto; Pillow utilizado apenas para os derivados WebP. Fonte incluída em `scripts/optimize-store-images.py` para reprodução dos derivados. Nenhum recorte ou processamento no carregamento da página.

Prompt final: “Use case: ads-marketing. Create a single premium photorealistic food photograph, a transparent-background cutout asset for the pizza hero of a Brazilian pizzeria website, not a screenshot or layout. Subject: one whole freshly baked Brazilian-style calabresa pizza, perfectly appetizing and elegantly presented. A generous smooth golden medium-thin crust, light airy rim with very subtle toasted freckles, beautifully melted creamy mozzarella with small golden gratinated spots, evenly distributed thin calabresa sausage rounds, delicate slivers of red onion and a subtle sprinkle of oregano, two or three small fresh basil leaves. Pizza is intact and round, no removed or flying slices. Camera at a slightly elevated three-quarter angle about 45 degrees, so the whole topping is clearly visible and the front crust has delicious depth. Entire pizza visible including all edges, centered, fills approximately 90 percent of the frame with balanced transparent margins. Polished restaurant campaign photography, precise geometry, believable fresh ingredients, mouthwatering warm color, soft directional studio light, controlled highlights, crisp detailed texture throughout the whole pizza, especially cheese and crust. Output a high-resolution square 2048x2048 RGBA PNG with real transparent alpha. No background, no plate, no board, no tabletop, no hands, no text, no logos, no badges, no props, no artificial-looking cheese strings, no thick bread-like rim, no burnt black crust, no dramatic smoke, no blur, no checkerboard baked into the pixels. The existing webpage adds the color shape and animated shadow separately, so output ONLY the isolated whole pizza.” A ferramenta entregou 1254×1254 nativos, preservados sem ampliação artificial.

Cinco imagens criadas pela ferramenta nativa image_gen, com alpha transparente e foco em texturas nítidas. Uso ilustrativo. PNGs preservados sem reprocessamento; original da hamburgueria permanece disponível. Não há upload de imagens de terceiros nem novas dependências.

| Segmento | Arquivo | Dimensões nativas |
| --- | --- | --- |
| Pizzaria | public/images/hero-pizza.png | 1254×1254 |
| Açaiteria | public/images/hero-acai.png | 1219×1290 |
| Sorveteria | public/images/hero-icecream.png | 1254×1254 |
| Lanchonete de salgados | public/images/hero-snacks.png | 1254×1254 |
| Pastelaria | public/images/hero-pastel.png | 1254×1254 |

## Prompts finais

### pizza

Use case: product-mockup. Photoreal commercial food photography asset for a large restaurant storefront hero, centered compact square composition, entire subject visible with small clean margins. Real transparent alpha background. Tack-sharp focus throughout, crisp natural microtextures, appetizing studio light. No depth-of-field blur, bloom, matte, background, floor, drop shadow, props beyond the described serving container, text, logo, badge, or decorations. One whole freshly baked artisanal pizza, mozzarella and pepperoni with a few basil leaves, golden airy blistered crust, bubbling cheese, realistic fine oregano. Three-quarter view from above around 35 degrees, round pizza appearing as a substantial ellipse, front crust clearly visible. One slice gently separated toward the front with a few delicate cheese strands. No board or plate.

### acai

Use case: product-mockup. Photoreal commercial food photography asset for a large restaurant storefront hero, centered compact square composition, entire subject visible with small clean margins. Real transparent alpha background. Tack-sharp focus throughout, crisp natural microtextures, appetizing studio light. No depth-of-field blur, bloom, matte, background, floor, drop shadow, props beyond the described serving container, text, logo, badge, or decorations. One generous small matte off-white paper bowl of dense rich deep purple Brazilian açaí, with clearly resolved velvety swirls, fresh sliced banana, strawberry halves, golden granola and thin condensed milk drizzle neatly arranged in sections. Bowl unbranded and entire bowl visible. Three-quarter angle from slightly above, toppings prominent and bowl occupying the lower third, compact tall composition.

### icecream

Use case: product-mockup. Photoreal commercial food photography asset for a large restaurant storefront hero, centered compact square composition, entire subject visible with small clean margins. Real transparent alpha background. Tack-sharp focus throughout, crisp natural microtextures, appetizing studio light. No depth-of-field blur, bloom, matte, background, floor, drop shadow, props beyond the described serving container, text, logo, badge, or decorations. One compact elegant waffle bowl containing three generous scoops of ice cream: pink strawberry, pale vanilla with tiny vanilla specks and rich chocolate. A light chocolate sauce ribbon, a fresh strawberry and one small wafer triangle. Entire unbranded edible waffle bowl visible, three-quarter slightly elevated view, balanced roughly square silhouette, crystal clear scoop ripples and waffle texture. No melting puddle or spoon.

### snacks

Use case: product-mockup. Photoreal commercial food photography asset for a large restaurant storefront hero, centered compact square composition, entire subject visible with small clean margins. Real transparent alpha background. Tack-sharp focus throughout, crisp natural microtextures, appetizing studio light. No depth-of-field blur, bloom, matte, background, floor, drop shadow, props beyond the described serving container, text, logo, badge, or decorations. A compact abundant group of Brazilian savory snacks: two golden crumb-coated coxinhas, one coxinha cleanly cut open to show moist shredded chicken filling, two small round cheese balls and a golden baked sausage roll. Arranged as a natural small pile, no plate, paper, board or garnish. Eye-level slightly elevated three-quarter view; sharp crispy crumbs, realistic pastry surface, compact roughly square silhouette.

### pastel

Use case: product-mockup. Photoreal commercial food photography asset for a large restaurant storefront hero, centered compact square composition, entire subject visible with small clean margins. Real transparent alpha background. Tack-sharp focus throughout, crisp natural microtextures, appetizing studio light. No depth-of-field blur, bloom, matte, background, floor, drop shadow, props beyond the described serving container, text, logo, badge, or decorations. Two large Brazilian rectangular fried pastéis, one standing diagonally behind and one broken neatly in two halves at the front showing melted cheese in one and seasoned minced beef in the other. Thin golden blistered pastry, distinct crispy bubbles and crimped edges, appetizing textures, compact diagonal pile entirely visible, three-quarter slightly elevated view. No plate, board, paper, garnish or props.

