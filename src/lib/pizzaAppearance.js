export const pizzaAppearances = {
  auto: "Automática pelo nome",
  cheese: "Queijo",
  calabresa: "Calabresa / pepperoni",
  chicken: "Frango",
  vegetable: "Vegetais",
  chocolate: "Chocolate",
  banana: "Banana",
};
export function pizzaAppearance(flavor) {
  if (flavor?.appearance && flavor.appearance !== "auto") return flavor.appearance;
  const name = (flavor?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/chocol|brigadeiro|nutella/.test(name)) return "chocolate";
  if (/banana/.test(name)) return "banana";
  if (/frango|chicken/.test(name)) return "chicken";
  if (/calabresa|pepperoni|bacon|toscana/.test(name)) return "calabresa";
  if (/veget|marg|portugues|brocol/.test(name)) return "vegetable";
  return "cheese";
}
