# Recortes das categorias do cardápio

Preparados em 22/10/2026 com a ferramenta nativa `image_gen`, modo edição (`background-extraction`), `transparent_background: true`. Não foi utilizada a CLI nem um serviço contratado de remoção. PNGs originais da ferramenta foram copiados para o projeto, preservando alpha; WebP é apenas a conversão para entrega no site.

| Item | Origem da fotografia | PNG final | WebP utilizado |
| --- | --- | --- | --- |
| Fritas da Brasa | https://images.unsplash.com/photo-1573080496219-bb080dd4f877 | public/images/menu-fries-cutout.png | public/images/menu-fries-cutout.webp |
| Refrigerante gelado | https://images.unsplash.com/photo-1622483767028-3f66f32aef97 | public/images/menu-drink-cutout.png | public/images/menu-drink-cutout.webp |
| Brownie com sorvete | https://images.unsplash.com/photo-1563805042-7684c019e1cb | public/images/menu-dessert-cutout.png | public/images/menu-dessert-cutout.webp |

As fotografias anteriores continuam em `image`. Os recortes demo são resolvidos somente quando a origem coincide exatamente com a fotografia conhecida, em qualquer loja, sem regravar dados locais ou remotos. Recorte próprio tem precedência. Não se aplica um asset demo a uma foto personalizada pela categoria ou pelo nome.

Foi preservada a apresentação fotografada: porção na cesta, uma lata principal e sobremesa na taça. O nome/descrição legados da sobremesa não foram corrigidos nem substituídos por outra receita. A edição por IA pode reconstruir bordas que estavam cortadas; não é uma máscara que garante pixels idênticos à origem. Conferir fidelidade antes de usar fotos comerciais.

## Prompts finais

Prefixo comum de cada chamada:

> Use case: background-extraction. Asset type: transparent product cutout for an animated restaurant menu. Input: supplied photograph is the edit target.

### fries

Isolate only the serving of parmesan herb French fries together with its wire serving basket and fitted paper liner. Remove the table, plate, napkin, scene and surrounding background entirely. Keep the same fries, garnish, basket perspective and product identity; complete any clipped basket edge minimally. Full product centered with transparent space on every side. No new props, no baked shadow, no background color or checkerboard.

### drink

Isolate ONLY the main large foreground red Coca-Cola can, removing all ice, the second can and background. Preserve its existing red label, white Coca-Cola script, condensation and angle. Restore its cropped bottom edge minimally to show one complete can. Full can centered with transparent margin on all sides. No ice or extra props, no baked shadow, no background or checkerboard.

### dessert

Isolate ONLY the central complete dessert glass with its stem and base, chocolate and white cream layers, topping and cookie attached to the dessert. Preserve the same dessert and viewing angle. Remove table, loose cookies and crumbs, plants, jars and entire background, including visible background through the glass. Full product centered, transparent space on all sides. No new props, no baked shadow, no background color or checkerboard.

Sufixo comum:

> Crisp realistic photographic edges; preserve the product rather than redesigning it. Real alpha transparency required.

Cada fotografia de origem foi carregada e inspecionada antes da chamada correspondente. Os três resultados têm alpha zero nas bordas e pixels de produto com alpha significativo, conferidos em PNG/WebP e no navegador sobre a página. WebP: aproximadamente 323 KB (fritas), 227 KB (lata) e 289 KB (sobremesa).

## Integração e limite

O padrão de cards e detalhes agora usa `ProductVisual` em todas as categorias do delivery e cardápio presencial. Sem moldura de foto, com balanço lateral e sombra sincronizada, início automático e pausa compartilhada. Hero independente.

O upload principal de qualquer categoria passa pelo fluxo existente de remoção em worker U²-Net/ONNX no próprio navegador, com revisão e confirmação pelo gestor. As edições nativas acima são assets preparados para estas três fotos de demonstração; não são o algoritmo usado automaticamente pela aplicação. Fotos legadas personalizadas ou URLs importadas não são processadas em lote: abrir o produto e usar **Gerar da foto do produto**. Falta de recorte/alpha inválido mostra estado neutro, sem reexibir uma foto opaca.

