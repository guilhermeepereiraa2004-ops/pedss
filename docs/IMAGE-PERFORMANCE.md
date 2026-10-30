# Carregamento das imagens

As fotos ilustrativas empacotadas usam variantes WebP com srcset/sizes. O navegador escolhe considerando o tamanho exibido e a densidade da tela. Heroes mantêm a resolução original na maior variante; recortes do catálogo têm 480/800/resolução maior. Qualidade 88, alpha lossless. Não altera o desenho, movimento ou composição das imagens.

| Hero | PNG original | WebP completo | WebP 640px |
| --- | ---: | ---: | ---: |
| Hambúrguer | 2.967.083 B | 516.190 B | 171.002 B |
| Pizza | 2.593.246 B | 544.742 B | 171.812 B |
| Açaí | 2.213.558 B | 380.602 B | 129.392 B |
| Sorvete | 2.271.347 B | 407.206 B | 134.760 B |
| Salgados | 2.420.415 B | 510.690 B | 149.404 B |
| Pastel | 2.089.223 B | 426.212 B | 134.136 B |

`src/lib/storeImageVariants.json` mapeia exclusivamente assets conhecidos. Arquivos e URLs originais continuam disponíveis para dados legados. Fotos próprias (inclusive data URLs) não são trocadas por imagens genéricas. Não há processamento de recorte no carregamento do cardápio; a verificação de alpha de 64×64 continua protegendo a apresentação.

Hero: eager/high. Dois primeiros cards: eager; demais lazy. Detalhes: eager. Rotas públicas solicitam seu código durante a consulta inicial, mantendo a validação de sessão antes da renderização. Modelos 3D, remoção de fundo e planilhas continuam módulos opcionais.

Os novos nomes incluem SHA-256 abreviado do conteúdo e têm cache anual imutável. Mudanças na imagem geram outro nome. Não reutilizar um nome com conteúdo diferente, nem aplicar esse cache ao HTML/API/fotos mutáveis. Nenhuma política de cache de sessão foi alterada.

Para reconstruir os assets, executar `python scripts/optimize-store-images.py` em um ambiente com Pillow. Isso é manutenção offline, não dependência de execução/deploy. O script confere dimensões e alpha; `npm run check` confere presença, formato, hashes e orçamento. A geração exige os originais em public/images. Limpar arquivos antigos somente após considerar URLs em versões anteriores; esta entrega preserva todos.

Ainda não há benchmark de LCP/4G real. API inicial e eventual início a frio continuam existindo. Fotos próprias conservam o limite de até 500 KB por saída; transformação dinâmica de uploads não faz parte desta otimização.
