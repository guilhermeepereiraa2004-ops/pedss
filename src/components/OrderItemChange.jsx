import { useState } from "react";
import ProductOptions from "./ProductOptions";
import { planOrderItemChange, editableOrder } from "../core/orderAmendments.ts";
import { uuid } from "../core/domain.ts";
import { paidCents } from "../core/payments.ts";
import { money } from "../lib/data";
import "./OrderItemChange.css";

export default function OrderItemChange({
  order,
  tenant,
  lineIndex,
  kind,
  canFinance,
  onSave,
  onBack,
  busy,
  error,
}) {
  const [original] = useState(() => structuredClone(order));
  const [requestId] = useState(uuid);
  const before = original.lines[lineIndex];
  const [productId, setProductId] = useState(before.productId);
  const [selection, setSelection] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [disposition, setDisposition] = useState(editableOrder(original) ? "return" : "waste");
  const product = tenant.products.find((p) => p.id === productId);
  const draft = {
    kind,
    lineIndex,
    ...(selection ? { selection } : {}),
    cancelQuantity: quantity,
    stockDisposition: disposition,
  };
  let plan, problem;
  if (kind === "cancel" || selection) {
    try {
      plan = planOrderItemChange(tenant, original, draft);
    } catch (e) {
      problem = e.message;
    }
  }
  const changed = order.updatedAt !== original.updatedAt;
  const restricted =
    plan && !canFinance && paidCents(original) > 0 && plan.totalCents !== original.totalCents;
  const compose = kind === "edit" && !selection;
  return (
    <div className="order-item-change">
      <div className="order-item-change-head">
        <button type="button" className="text-link" onClick={onBack} disabled={busy}>
          ← Voltar ao pedido
        </button>
        <h3>
          {kind === "edit" ? "Ajuste o item antes do preparo" : "Cancele somente o necessário"}
        </h3>
        <p>
          {before.quantity} × {before.name} · {money(before.totalCents / 100)}
        </p>
        {before.pizzaSummary && <p>{before.pizzaSummary}</p>}
        {before.selection?.comboChoices && (
          <p className="notice">
            Cada unidade deste item é um combo completo. O cancelamento retira o conjunto, sem
            dividir seu preço entre as pizzas.
          </p>
        )}
      </div>
      {compose ? (
        <>
          <label className="field order-item-product">
            Produto
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={busy}
            >
              {!tenant.products.some((p) => p.id === before.productId) && (
                <option value={before.productId}>Produto antigo removido</option>
              )}
              {tenant.products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.status !== "Disponível"}>
                  {p.name}
                  {p.status !== "Disponível" ? " · indisponível" : ""}
                </option>
              ))}
            </select>
          </label>
          {product?.status === "Disponível" ? (
            <ProductOptions
              key={productId}
              product={product}
              products={tenant.products}
              initialLine={
                productId === before.productId && before.selection
                  ? before.selection
                  : {
                      productId,
                      quantity: before.quantity,
                      extraIds: [],
                      removedIngredients: [],
                      notes: before.notes,
                    }
              }
              submitLabel="Revisar alteração"
              busy={busy}
              onAdd={(value) =>
                setSelection({ ...value, key: before.selection?.key || `order-item-${lineIndex}` })
              }
            />
          ) : (
            <p className="notice">Escolha um produto disponível para substituir este item.</p>
          )}
        </>
      ) : (
        <div className="order-item-review">
          {kind === "cancel" && (
            <label className="field">
              Quantidade a cancelar
              <input
                type="number"
                min="1"
                max={before.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={busy}
              />
            </label>
          )}
          {kind === "edit" && (
            <button
              type="button"
              className="button button-outline"
              disabled={busy}
              onClick={() => setSelection(null)}
            >
              Ajustar montagem novamente
            </button>
          )}
          <fieldset className="form-stack">
            <legend>Ingredientes do item anterior</legend>
            <label className="checkbox-field">
              <input
                type="radio"
                name="item-stock"
                value="return"
                checked={disposition === "return"}
                disabled={busy || !editableOrder(original)}
                onChange={() => setDisposition("return")}
              />
              Devolver ao estoque — ainda não foi preparado
            </label>
            <label className="checkbox-field">
              <input
                type="radio"
                name="item-stock"
                value="waste"
                checked={disposition === "waste"}
                disabled={busy}
                onChange={() => setDisposition("waste")}
              />
              Manter a baixa — registrar perda do que já foi usado
            </label>
            {!editableOrder(original) && (
              <p className="small-copy muted">
                O preparo já começou. Os ingredientes usados não voltam automaticamente ao estoque.
              </p>
            )}
          </fieldset>
          {plan && (
            <section className="panel order-change-summary" aria-label="Revisão dos valores">
              <h3>
                {plan.after ? `${plan.after.quantity} × ${plan.after.name}` : "Item removido"}
              </h3>
              {plan.after?.pizzaSummary && <p>{plan.after.pizzaSummary}</p>}
              <p>
                Total anterior: <strong>{money(original.totalCents / 100)}</strong>
              </p>
              <p>
                Novo total do pedido: <strong>{money(plan.totalCents / 100)}</strong>
              </p>
              <p>
                Diferença: <strong>{money((plan.totalCents - original.totalCents) / 100)}</strong>
              </p>
              {(original.coupon?.discountCents || 0) !== (plan.coupon?.discountCents || 0) && (
                <p>
                  Desconto recalculado: {money((plan.coupon?.discountCents || 0) / 100)}. O cupom
                  segue as condições registradas na venda.
                </p>
              )}
              {plan.status === "Cancelado" && (
                <p className="notice">
                  Este é o último item. O pedido inteiro será cancelado, sem cobrar entrega.
                </p>
              )}
              {plan.refundDueCents > 0 && (
                <p className="notice">
                  Saldo a devolver: <strong>{money(plan.refundDueCents / 100)}</strong>. Após
                  devolver ao cliente, registre o estorno no pedido. Esta confirmação não movimenta
                  dinheiro.
                </p>
              )}
              {disposition === "waste" && (
                <p>
                  Perda registrada:{" "}
                  {plan.wasteCostCents === null
                    ? "custo desconhecido; ficha incompleta"
                    : canFinance
                      ? money(plan.wasteCostCents / 100)
                      : "baixa mantida"}
                  . Não gera despesa automática no financeiro.
                </p>
              )}
            </section>
          )}
          <label className="field">
            Motivo da alteração
            <textarea
              required
              minLength="3"
              maxLength="200"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
          </label>
          {restricted && (
            <p className="notice">
              Um gestor precisa autorizar alterações de valor em pedido com recebimento registrado.
            </p>
          )}
          {problem && (
            <p className="form-error" role="alert">
              {problem}
            </p>
          )}
          <div className="order-item-confirm">
            <button
              type="button"
              className="button button-dark"
              disabled={busy || !plan || !!restricted || changed || reason.trim().length < 3}
              onClick={() =>
                onSave({
                  ...draft,
                  requestId,
                  expectedUpdatedAt: original.updatedAt,
                  expectedTotalCents: plan.totalCents,
                  reason,
                })
              }
            >
              {busy
                ? "Salvando…"
                : kind === "edit"
                  ? "Confirmar alteração do item"
                  : "Confirmar cancelamento do item"}
            </button>
          </div>
        </div>
      )}
      {changed && (
        <p className="form-error" role="alert">
          Este pedido mudou durante a revisão. Volte ao pedido e abra o item novamente.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
