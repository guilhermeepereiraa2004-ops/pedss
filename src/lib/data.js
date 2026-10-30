export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
export const burgerPhoto = "/images/brasa-burger.png";
export const foodPhotos = {
  Pizza: "/images/hero-pizza.png",
  Açaí: "/images/hero-acai.png",
  Sorvete: "/images/hero-icecream.png",
  Salgado: "/images/hero-snacks.png",
  Pastel: "/images/hero-pastel.png",
  Hamburguer:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=640&q=85",
  Porção:
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=640&q=85",
  Bebida:
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=640&q=85",
  Sobremesa:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=640&q=85",
};
export const categories = [
  ["Todos", "Todos os itens"],
  ["Hamburguer", "Burgers"],
  ["Porção", "Acompanhamentos"],
  ["Bebida", "Bebidas"],
  ["Sobremesa", "Sobremesas"],
  ["Pizza", "Pizzas"],
  ["Açaí", "Açaís"],
  ["Sorvete", "Sorvetes"],
  ["Salgado", "Salgados"],
  ["Pastel", "Pastéis"],
];
export const defaultCompanies = [
  {
    id: "demo",
    name: "Brasa Burger",
    slug: "demo",
    primaryColor: "#d5f36b",
    adminEmail: "loja@example.com",
    status: "Ativo",
    createdAt: "2026-10-01",
    plan: "Essencial",
  },
  {
    id: "station",
    name: "Burger Station",
    slug: "burger-station",
    primaryColor: "#e9ad73",
    adminEmail: "station@example.com",
    status: "Ativo",
    createdAt: "2026-10-05",
    plan: "Crescer",
  },
  {
    id: "pizza",
    name: "Forno & Farinha",
    slug: "forno-farinha",
    primaryColor: "#c3c8ad",
    adminEmail: "forno@example.com",
    status: "Ativo",
    createdAt: "2026-10-12",
    plan: "Essencial",
  },
];
export const defaultMenu = [
  {
    id: 101,
    name: "Brasa Original",
    price: 29.9,
    category: "Hamburguer",
    description: "Pão de brioche, smash de 150g, cheddar, picles e nosso molho da casa.",
    status: "Disponível",
    image: burgerPhoto,
    cutoutImage: "/images/menu-brasa-only.webp",
    featured: true,
    ingredients: ["Picles", "Molho da casa"],
    extras: [{ id: "cheddar-extra", name: "Cheddar extra", priceCents: 450, available: true }],
  },
  {
    id: 102,
    name: "Double da Casa",
    price: 38.9,
    category: "Hamburguer",
    description:
      "Duas carnes, duas camadas de cheddar e cebola caramelizada. Sem economia de sabor.",
    status: "Disponível",
    image: foodPhotos.Hamburguer,
    cutoutImage: "/images/menu-house-burger.webp",
    featured: true,
  },
  {
    id: 103,
    name: "Crispy Chicken",
    price: 32.9,
    category: "Hamburguer",
    description: "Frango empanado crocante, alface fresca e maionese de limão no brioche.",
    status: "Disponível",
    image: foodPhotos.Hamburguer,
    cutoutImage: "/images/menu-house-burger.webp",
  },
  {
    id: 104,
    name: "Fritas da Brasa",
    price: 18,
    category: "Porção",
    description: "Batatas douradas e crocantes com páprica e um toque de sal. Porção de 400g.",
    status: "Disponível",
    image: foodPhotos.Porção,
    cutoutImage: "/images/menu-fries-cutout.webp",
    featured: true,
  },
  {
    id: 105,
    name: "Refrigerante gelado",
    price: 7,
    category: "Bebida",
    description: "Lata de 350ml, na temperatura certa para acompanhar seu burger.",
    status: "Disponível",
    image: foodPhotos.Bebida,
    cutoutImage: "/images/menu-drink-cutout.webp",
  },
  {
    id: 106,
    name: "Brownie com sorvete",
    price: 19.9,
    category: "Sobremesa",
    description: "Brownie de chocolate, sorvete de baunilha e calda de chocolate.",
    status: "Disponível",
    image: foodPhotos.Sobremesa,
    cutoutImage: "/images/menu-dessert-cutout.webp",
  },
];
const demoDate = new Date().toISOString();
export const defaultOrders = [
  {
    id: "#1024",
    customer: "João Silva",
    items: "2 × Brasa Original",
    total: 59.8,
    status: "Preparando",
    date: demoDate,
    demo: true,
  },
  {
    id: "#1023",
    customer: "Maria Souza",
    items: "1 × Double da Casa, 1 × Fritas",
    total: 56.9,
    status: "A caminho",
    date: demoDate,
    demo: true,
  },
  {
    id: "#1022",
    customer: "Carlos Lima",
    items: "1 × Brasa Original, 1 × Refrigerante",
    total: 36.9,
    status: "Entregue",
    date: demoDate,
    demo: true,
  },
  {
    id: "#1021",
    customer: "Ana Costa",
    items: "2 × Double da Casa",
    total: 77.8,
    status: "Entregue",
    date: demoDate,
    demo: true,
  },
];
export const defaultPlans = [
  {
    id: "essencial",
    name: "Essencial",
    priceCents: 19990,
    description: "Mais espaço para o seu próximo passo.",
    features: ["Pedidos sem limite no painel", "Controle financeiro", "Personalização da sua loja"],
    featured: true,
  },
  {
    id: "rede",
    name: "Rede",
    priceCents: 59990,
    description: "Uma visão de todas as suas lojas.",
    features: [
      "Cadastro de até 5 lojas",
      "Gestão central de empresas",
      "Identidade por estabelecimento",
    ],
  },
];
export const planName = (value) => (value === "Crescer" ? "Essencial" : value);
export function makeSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
