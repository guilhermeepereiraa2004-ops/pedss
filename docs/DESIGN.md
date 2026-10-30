# Identidade Brasa

Rebranding completo implementado a partir do pedido de 20/10/2026. Marca: Brasa. Assinatura: “Seu delivery, aceso.”

## Princípios

- Comida em primeiro plano: fotografia editorial e conteúdo direto, inspirado no balcão.
- Base clara, carvão e verde cítrico, com hierarquia tipográfica e respiro.
- Página inicial assimétrica. Painéis com tabelas, indicadores e ações explícitas.
- Identidade compartilhada entre todas as áreas, com personalização por estabelecimento.

| Token             | Valor         |
| ----------------- | ------------- |
| Papel             | `#f7f8f2`     |
| Carvão            | `#252820`     |
| Verde cítrico     | `#d5f36b`     |
| Verde de apoio    | `#536d30`     |
| Bordas            | `#e3e5da`     |
| Títulos e marca   | Space Grotesk |
| Texto e controles | DM Sans       |

Tokens globais em `src/index.css`. CSS de cada tela acompanha seu componente. Estrutura compartilhada dos painéis em `components/AdminShell.css`. A cor do estabelecimento fica restrita à sua loja.

## Assets e origem

- `public/brasa.svg`: símbolo vetorial criado no código.
- `public/images/brasa-burger.png`: fotografia criada com a ferramenta integrada ImageGen, inspecionada e copiada para o projeto.
- Fotos secundárias: URLs do Unsplash em `src/lib/data.js`, com fallback quando falham. São exemplos de categoria, não fotos reais dos pratos de cada loja.
- Fontes: Google Fonts, com fallbacks locais.

Brief final do ImageGen: fotografia editorial de um double smash com brioche dourado, duas carnes, cheddar e picles, sobre papel claro e superfície carvão; luz lateral quente, textura real, fumaça sutil, enquadramento vertical e espaço escuro superior para tipografia. Sem texto, pessoas ou logotipos.

## Interação

Controles semânticos, nomes acessíveis e foco visível. Modais com título, Escape, foco contido e retorno ao controle de origem. Animações respeitam `prefers-reduced-motion`. Menus e tabelas se adaptam a telas menores.
