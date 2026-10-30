# Peds's — logo verde aprovada

Identidade escolhida em 23/10/2026: comanda sorridente, letras personalizadas e apóstrofo entre os dois s. A referência mais recente mantém o p inicial minúsculo no desenho: **peds's**. Em textos e acessibilidade, **Peds's**. A paleta verde da landing foi preservada: lima #D5F36B, oliva #536D30, tinta #252820 e papel #F7F8F2.

## Arquivos finais

- public/brand/peds-logo-green-v1.webp — 900×300, alpha, 38.224 bytes; cabeçalho, rodapé e miniatura ilustrativa do painel.
- public/brand/peds-icon-32-v1.png — favicon de 32px, 2.313 bytes.
- public/brand/peds-icon-64-v1.png — favicon de 64px, 6.240 bytes.
- public/brand/peds-icon-180-v1.png — ícone Apple, 26.549 bytes.
- public/brand/peds-favicon-v1.ico — fallback com 16/32/48px, 7.361 bytes.
- design/brand/peds-logo-green-master.png — matriz transparente 2172×724.
- design/brand/peds-mascot-green-master.png — matriz transparente quadrada 1254×1254.

Os PNGs matriz ficam no projeto e são excluídos do deploy por .vercelignore. scripts/build-brand-assets.py faz somente redimensionamento/codificação para web com Pillow, preservando alpha e mantendo as matrizes. Não é uma dependência de execução ou de build na Vercel.

## Geração e instruções utilizadas

Modo: ferramenta integrada image_gen, não CLI/API com chave própria. A matriz usa a versão verde com apóstrofo escolhida pelo usuário como imagem de edição. Não usa a alternativa coral nem a fonte fina rejeitada. Os nomes de arquivo versionados evitam reaproveitar o favicon antigo em cache.

Prompt da matriz da logo:

> Prepare the APPROVED logo from this image as a production-ready transparent web asset. This is EXTRACTION, NOT A REDESIGN. Retain ONLY the MAIN LARGE HORIZONTAL LOCKUP: the happy walking olive/lime receipt mascot on the LEFT and the near-black CUSTOM LOWERCASE wordmark "peds's" on its right, with the apostrophe between the two s letters. Preserve EXACTLY the existing font, folded-counter p, diagonal e, angled-top d, separate s letters, apostrophe shape and spacing. Keep the same original lower-case initial p. Preserve the exact mascot silhouette, body tilt, walking legs, happy highlighted eyes, open smiling mouth, olive outline and lime folded corner. Keep the paper face OFF-WHITE as a filled part of the mascot, not transparent. Colors exactly olive #536D30, lime #D5F36B, near-black #252820, off-white paper #F7F8F2. Remove the entire presentation background, all palette swatches at bottom left and the small duplicate app icon at bottom right. Output only ONE main logo on a TRULY TRANSPARENT alpha background. Crop the overall canvas closely around the whole main lockup with a small even 4 percent transparent margin; the logo should fill most of a wide horizontal canvas approximately 3:1. High resolution, clean crisp flat edges, no glow, shadow, grain, texture, bevel, gradient or new elements. Visible text must be exactly lowercase "peds's". Maintain the approved design faithfully.

Prompt da matriz do favicon, usando a matriz da logo como referência de edição:

> Extract ONLY the EXACT walking receipt mascot at the left of this approved Peds's logo as a transparent favicon asset. This is a faithful extraction, NOT a redraw or redesign. Remove ALL lettering to its right; do not include any word or apostrophe. Preserve the SAME olive outline and feet, lime folded upper-right corner, off-white filled paper face, near-black highlighted oval eyes, happy open smile with off-white highlight, same body tilt and zigzag lower edge, walking leg pose, proportions and silhouette. Do not invert any colors or create a new pose. Truly transparent background outside the mascot, no colored square or circle, no shadows. Square canvas with the complete mascot centered and filling about 88 percent of its height with a small safe transparent margin, feet and top corner completely visible. Crisp flat clean high-resolution alpha edges, exactly the four original colors, no texture, gradient, 3D, new features or text. This favicon must match the main approved mascot exactly in every visible design detail.

## Escopo

LandingBrand apresenta a nova arte na landing. Brand legado dos fluxos de gestão e as identidades das lojas continuam independentes. index.html usa o nome Peds's e os novos favicons. Nenhum nome, slug, ID, configuração ou cadastro foi alterado no banco. Nenhuma fonte comercial ou biblioteca adicional foi instalada. Ainda são assets raster; não há matriz SVG vetorizada ou manual completo de marca nesta entrega.

## Mascote na hero da landing — 23/10/2026

A mesma matriz aprovada do mascote foi codificada em public/brand/peds-mascot-hero-640-v1.webp e peds-mascot-hero-960-v1.webp, alpha preservado, 37.344 e 61.532 bytes. scripts/build-brand-assets.py gera as duas variantes. Sem geração/redesenho nesta etapa. LandingHero aplica flutuação/rotação em CSS e sombra coordenada, início automático e contínuo sem controle de pausa, inclusive sob movimento reduzido por pedido explícito do usuário. Artigos e números da comanda são decorativos, não pedidos reais. Entrega local nesta iteração.

## Continuidade visual do corpo da landing — 23/10/2026

Seções abaixo da hero usam oliva/lima/papel, títulos com marca-texto lima, prévias arredondadas e o mascote aprovado em personalização, FAQ e encerramento. Hero e animação preservadas integralmente. Nenhuma variação criativa do mascote foi gerada; repetição usa as mesmas WebPs 640/960 existentes, carregadas sob demanda no corpo. Painel e cardápio são ilustrações identificadas, e os links levam aos fluxos reais. CSS do corpo usa prefixo lp- para evitar interferência na hero e nas lojas.

## Movimento dos mascotes do corpo — 23/10/2026

As três aplicações decorativas do mascote agora flutuam e giram suavemente no mesmo ritmo de 6s da hero, com amplitude proporcional ao tamanho e inclinação de composição preservada. Animação contínua automática sem pausa, inclusive sob movimento reduzido por solicitação explícita. Logo, favicon e imagens dentro da marca não são animados. Hero preservada.

## Marca nas páginas do cliente — 23/10/2026

LandingBrand também atende o rodapé de Storefront, as marcas da plataforma em DigitalMenu e o cabeçalho de Tracking, incluindo estados não encontrados. Usa a mesma arte aprovada, alt Peds's e link para a página inicial. Identidades dos estabelecimentos e Brand legado dos painéis/login permanecem independentes. Sem novo asset ou alteração da hero. Entrega local, sem deploy nesta revisão.

## Marca compartilhada no login e painéis — 23/10/2026

Brand.jsx passa a ser a implementação única da arte aprovada; LandingBrand.jsx é um reexport compatível para landing e páginas do cliente. Login, central e painel da loja usam o mesmo WebP, alt e link inicial. AdminShell dimensiona a marca em 170px no desktop e 140px no menu móvel; login usa 210/180px sobre fundo lima com texto escuro. Mascote substitui a chama no painel visual do login e no ícone da central. Sem nova arte, inversão de cores, animação da logo, alteração de identidade dos estabelecimentos ou migração de configuração. Notas anteriores que mantinham Brand legado descrevem as etapas anteriores; ele foi substituído nesta revisão local.
