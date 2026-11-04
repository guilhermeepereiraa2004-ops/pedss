export const orderActionLabels = {
  Aceito: "Aceitar pedido",
  Preparando: "Iniciar preparo",
  "A caminho": "Saiu para entrega",
  "Pronto para retirada": "Pronto para retirada",
  Entregue: "Concluir entrega",
};
export function orderActionLabel(order, status) {
  if (order.channel === "table")
    return status === "Pronto para retirada"
      ? "Pronto para servir"
      : status === "Entregue"
        ? "Marcar como servido"
        : orderActionLabels[status];
  return status === "Entregue" && order.fulfillment === "pickup"
    ? "Confirmar retirada"
    : orderActionLabels[status];
}
export function orderStatusLabel(order) {
  return order.channel === "table" && order.status === "Pronto para retirada"
    ? "Pronto para servir"
    : order.channel === "table" && order.status === "Entregue"
      ? "Servido"
      : order.status;
}
