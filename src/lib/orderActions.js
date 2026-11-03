export const orderActionLabels = {
  Aceito: "Aceitar pedido",
  Preparando: "Preparar pedido",
  "A caminho": "Saiu para entrega",
  "Pronto para retirada": "Pronto para retirada",
  Entregue: "Concluir pedido",
};
export function orderActionLabel(order, status) {
  if (order.channel === "table" && status === "Pronto para retirada") return "Pronto para servir";
  return orderActionLabels[status];
}
export function orderStatusLabel(order) {
  return (
    { Pendente: "Recebido", Preparando: "Em preparo", Entregue: "Concluído" }[order.status] ||
    order.status
  );
}
export const orderStatusGroup = (status) =>
  ["A caminho", "Pronto para retirada"].includes(status) ? "Preparando" : status;
