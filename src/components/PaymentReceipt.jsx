import { useState } from "react";
import { uuid } from "../core/domain.ts";
import { money } from "../lib/data";
import MoneyInput from "./MoneyInput";

/** A request token survives a failed submission, preventing duplicate manual receipts. */
export default function PaymentReceipt({
  maximum,
  methods,
  refund = false,
  busy,
  onSubmit,
  label = "Valor recebido (R$)",
}) {
  const [amount, setAmount] = useState(0),
    [method, setMethod] = useState(methods[0] || ""),
    [reason, setReason] = useState(""),
    [requestId, setRequestId] = useState(uuid);
  return (
    <form
      className="form-stack payment-receipt"
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await onSubmit({
          requestId,
          kind: refund ? "refund" : "receipt",
          amountCents: amount,
          method,
          reason,
        });
        if (result) {
          setRequestId(uuid());
          setAmount(0);
          setReason("");
        }
      }}
    >
      <p>
        {refund ? "Valor disponível para estorno" : "Saldo a receber"}:{" "}
        <strong>{money(maximum / 100)}</strong>. Registro manual, sem cobrança automática.
      </p>
      <div className="form-grid">
        <label className="field">
          {label}
          <MoneyInput cents={amount} onChange={setAmount} />
        </label>
        <label className="field">
          Forma de pagamento
          <select required value={method} onChange={(e) => setMethod(e.target.value)}>
            {methods.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      {refund && (
        <label className="field">
          Motivo do estorno
          <input
            required
            minLength={3}
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      )}
      <button
        className="button button-dark"
        disabled={
          busy || amount <= 0 || amount > maximum || !method || (refund && reason.trim().length < 3)
        }
      >
        {refund ? "Registrar estorno parcial" : "Registrar pagamento parcial"}
      </button>
    </form>
  );
}
