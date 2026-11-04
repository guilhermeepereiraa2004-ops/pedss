import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { Minus, Plus, Trash2, ArrowUpRight, ShieldCheck } from "lucide-react";
import FoodImage from "./FoodImage";
import { digits, priceLine } from "../core/domain.ts";
import { money } from "../lib/data";
import { applyCoupon } from "../core/coupons.ts";
import { shippingMode, shippingRuleKey, deliveryConfigured } from "../core/shipping.ts";
import { useAction } from "../hooks/useApplication";
import "./Checkout.css";
export default function Checkout({
  tenant,
  availability,
  onQuantity,
  onSubmit,
  busy,
  error,
  mode = "local",
  onValidateCoupon,
  onQuoteShipping,
  now = new Date(),
  onEditLine,
  customerOptional = false,
}) {
  const settings = tenant.settings;
  const [couponText, setCouponText] = useState(""),
    [couponCode, setCouponCode] = useState("");
  const [remoteCoupon, setRemoteCoupon] = useState(null);
  const [validating, setValidating] = useState(false);
  const [shippingQuote, setShippingQuote] = useState(null);
  const shippingAction = useAction();
  const freightMode = shippingMode(settings);
  const scheduling = tenant.restaurant?.scheduling;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      fulfillment: deliveryConfigured(settings) ? "delivery" : "pickup",
      postalCode: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      reference: "",
      areaId: "",
      paymentMethod: settings.paymentMethods[0] || "",
      change: "",
      notes: "",
    },
  });
  const [fulfillment, areaId, method, phone, postalCode] = useWatch({
    control,
    name: ["fulfillment", "areaId", "paymentMethod", "phone", "postalCode"],
  });
  const scheduledDate = useWatch({ control, name: "scheduledAt" });
  const optionalCustomer = customerOptional && fulfillment === "pickup";
  const cep = digits(postalCode || "");
  const quoted =
    shippingQuote &&
    shippingQuote.postalCode === cep &&
    shippingQuote.ruleKey === shippingRuleKey(settings) &&
    Date.parse(shippingQuote.expiresAt) > now.getTime()
      ? shippingQuote
      : null;
  const needsQuote = fulfillment === "delivery" && freightMode === "distance" && !quoted;
  const rows = tenant.cart.lines.map((line) => {
    try {
      return { line, priced: priceLine(line, tenant.products), problem: "" };
    } catch (e) {
      return { line, priced: null, problem: e.message };
    }
  });
  const hasProblem = rows.some((r) => r.problem),
    subtotal = rows.reduce((sum, r) => sum + (r.priced?.totalCents || 0), 0),
    fee =
      fulfillment !== "delivery"
        ? 0
        : freightMode === "fixed"
          ? settings.shipping.fixedFeeCents
          : freightMode === "distance"
            ? quoted?.feeCents || 0
            : settings.areas.find((a) => a.id === areaId)?.feeCents || 0,
    totalBeforeDiscount = subtotal + fee;
  let coupon = null,
    couponError = "";
  const couponKey = JSON.stringify([couponCode, tenant.cart.lines, phone]);
  if (mode === "remote" && couponCode) {
    if (remoteCoupon?.key === couponKey) {
      coupon = remoteCoupon.value;
      couponError = remoteCoupon.error || "";
    } else
      couponError = validating
        ? "Validando cupom…"
        : "A sacola ou o telefone mudou. Aplique o cupom novamente.";
  } else
    try {
      coupon = applyCoupon(tenant, couponCode, subtotal, phone || "");
    } catch (e) {
      couponError = e.message;
    }
  const total = totalBeforeDiscount - (coupon?.discountCents || 0);
  return (
    <>
      <div className="cart-product-list">
        {rows.map(({ line, priced, problem }) => {
          const product = tenant.products.find((p) => p.id === line.productId) || {
            name: "Produto indisponível",
            image: "",
            category: "Hamburguer",
          };
          return (
            <div className="cart-product" key={line.key}>
              <FoodImage product={product} />
              <div>
                <h3>{priced?.name || product.name}</h3>
                {priced?.pizzaSummary && <small>{priced.pizzaSummary}</small>}
                <span>{priced ? money(priced.totalCents / 100) : "Revise este item"}</span>
                {priced?.extras.length > 0 && (
                  <small>+ {priced.extras.map((e) => e.name).join(", ")}</small>
                )}
                {line.removedIngredients.length > 0 && (
                  <small>Sem {line.removedIngredients.join(", ")}</small>
                )}
                {line.notes && <small>{line.notes}</small>}
                {onEditLine && (
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => onEditLine(line.key)}
                  >
                    Editar {product.name}
                  </button>
                )}
                {problem && <p className="form-error">{problem}</p>}
                <div className="quantity-control">
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Diminuir quantidade de ${product.name}`}
                    onClick={() => onQuantity(line.key, line.quantity - 1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    disabled={busy || line.quantity >= 99}
                    aria-label={`Aumentar quantidade de ${product.name}`}
                    onClick={() => onQuantity(line.key, line.quantity + 1)}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="cart-remove"
                aria-label={`Remover ${product.name}`}
                disabled={busy}
                onClick={() => onQuantity(line.key, 0)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
      {!rows.length ? (
        <div className="empty-state">
          <h3>Sua sacola está esperando.</h3>
          <p>Escolha seus favoritos no cardápio.</p>
        </div>
      ) : (
        <form
          className="checkout-form"
          noValidate
          onSubmit={handleSubmit((values) =>
            needsQuote
              ? shippingAction.setError("Calcule o frete pelo CEP antes de confirmar.")
              : onSubmit({
                  ...values,
                  scheduledAt: values.scheduledAt
                    ? new Date(`${values.scheduledAt}:00-03:00`).toISOString()
                    : undefined,
                  phone: digits(values.phone),
                  changeForCents:
                    method === "Dinheiro" && values.change !== ""
                      ? Math.round(Number(values.change) * 100)
                      : null,
                  expectedTotalCents: total,
                  couponCode,
                  postalCode: cep,
                  shippingQuoteToken: fulfillment === "delivery" ? quoted?.token || "" : "",
                }),
          )}
        >
          <div className="delivery-options">
            {deliveryConfigured(settings) && (
              <label className={fulfillment === "delivery" ? "selected" : ""}>
                <input type="radio" value="delivery" {...register("fulfillment")} /> Entrega
              </label>
            )}
            {settings.pickupEnabled && (
              <label className={fulfillment === "pickup" ? "selected" : ""}>
                <input type="radio" value="pickup" {...register("fulfillment")} /> Retirada
              </label>
            )}
          </div>
          <div className="form-stack">
            {scheduling?.enabled && (
              <label className="field">
                Agendar para {availability.open ? "(opcional)" : "(obrigatório fora do horário)"}
                <input
                  type="datetime-local"
                  step={scheduling.slotMinutes * 60}
                  {...register("scheduledAt", {
                    required: !availability.open
                      ? "Escolha um horário para o pedido agendado."
                      : false,
                  })}
                />
                {errors.scheduledAt && <small role="alert">{errors.scheduledAt.message}</small>}
                <small>
                  Horário da Bahia. Antecedência mínima: {scheduling.leadMinutes} min. Até{" "}
                  {scheduling.days} dias; intervalos de {scheduling.slotMinutes} min.{" "}
                  {availability.open
                    ? "Deixe vazio para pedir agora."
                    : "A loja está fora do horário; escolha um horário futuro de atendimento."}
                </small>
              </label>
            )}
            <label className="field">
              Como podemos chamar você? {optionalCustomer && "(opcional)"}
              <input
                {...register("name", {
                  required: optionalCustomer ? false : "Informe seu nome.",
                  minLength: { value: 2, message: "Use pelo menos dois caracteres." },
                })}
                maxLength={70}
                autoComplete="name"
              />
              {errors.name && <small role="alert">{errors.name.message}</small>}
            </label>
            <label className="field">
              Telefone com DDD {optionalCustomer && "(opcional)"}
              <input
                type="tel"
                {...register("phone", {
                  required: optionalCustomer ? false : "Informe seu telefone.",
                  validate: (v) =>
                    (optionalCustomer && !digits(v)) ||
                    /^\d{10,11}$/.test(digits(v)) ||
                    "Informe DDD e número.",
                })}
                autoComplete="tel-national"
                placeholder="71 99999-9999"
              />
              {errors.phone && <small role="alert">{errors.phone.message}</small>}
            </label>
            {fulfillment === "delivery" ? (
              <>
                <label className="field">
                  CEP de entrega
                  <input
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={9}
                    {...register("postalCode", {
                      validate: (v) =>
                        fulfillment !== "delivery" ||
                        freightMode !== "distance" ||
                        /^\d{8}$/.test(digits(v || "")) ||
                        "Informe o CEP com 8 dígitos.",
                    })}
                  />
                  {errors.postalCode && <small role="alert">{errors.postalCode.message}</small>}
                </label>
                {freightMode === "distance" && (
                  <div className="checkout-freight">
                    <button
                      type="button"
                      className="button button-outline"
                      disabled={cep.length !== 8 || shippingAction.busy}
                      onClick={() =>
                        shippingAction.run(
                          () => onQuoteShipping(cep),
                          (q) => {
                            setShippingQuote(q);
                            if (digits(getValues("postalCode") || "") === q.postalCode) {
                              if (!getValues("street")) setValue("street", q.address.street);
                              if (!getValues("neighborhood"))
                                setValue("neighborhood", q.address.neighborhood);
                            }
                          },
                        )
                      }
                    >
                      {shippingAction.busy ? "Calculando percurso…" : "Calcular frete pelo CEP"}
                    </button>
                    {quoted ? (
                      <p role="status">
                        {(quoted.distanceMeters / 1000).toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        km pelas ruas · {money(quoted.feeCents / 100)}
                      </p>
                    ) : (
                      <p>Calcule o frete antes de confirmar. A cotação vale por 15 minutos.</p>
                    )}
                    {shippingAction.error && (
                      <p role="alert" className="form-error">
                        {shippingAction.error}
                      </p>
                    )}
                    <small>
                      Rotas estimadas entre CEPs por{" "}
                      <a href="https://openrouteservice.org/" target="_blank" rel="noreferrer">
                        openrouteservice
                      </a>{" "}
                      e{" "}
                      <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noreferrer"
                      >
                        © OpenStreetMap
                      </a>
                      ; CEP: BrasilAPI.
                    </small>
                  </div>
                )}
                {freightMode === "areas" && (
                  <label className="field">
                    Área atendida
                    <select
                      {...register("areaId", {
                        validate: (v) =>
                          fulfillment !== "delivery" ||
                          freightMode !== "areas" ||
                          !!v ||
                          "Escolha uma área atendida.",
                      })}
                    >
                      <option value="">Selecione o bairro / área</option>
                      {settings.areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {money(a.feeCents / 100)}
                        </option>
                      ))}
                    </select>
                    {errors.areaId && <small role="alert">{errors.areaId.message}</small>}
                  </label>
                )}
                <div className="form-grid">
                  <label className="field">
                    Rua
                    <input
                      {...register("street", {
                        validate: (v) =>
                          fulfillment !== "delivery" || !!v.trim() || "Informe a rua.",
                      })}
                      maxLength={120}
                      autoComplete="address-line1"
                    />
                    {errors.street && <small role="alert">{errors.street.message}</small>}
                  </label>
                  <label className="field">
                    Número
                    <input
                      {...register("number", {
                        validate: (v) =>
                          fulfillment !== "delivery" || !!v.trim() || "Informe o número ou S/N.",
                      })}
                      maxLength={20}
                    />
                    {errors.number && <small role="alert">{errors.number.message}</small>}
                  </label>
                </div>
                <label className="field">
                  Bairro
                  <input
                    {...register("neighborhood", {
                      validate: (v) =>
                        fulfillment !== "delivery" || !!v.trim() || "Informe o bairro.",
                    })}
                    maxLength={60}
                  />
                  {errors.neighborhood && <small role="alert">{errors.neighborhood.message}</small>}
                </label>
                <label className="field">
                  Complemento
                  <input {...register("complement")} maxLength={100} autoComplete="address-line2" />
                </label>
                <label className="field">
                  Ponto de referência
                  <input {...register("reference")} maxLength={120} />
                </label>
              </>
            ) : (
              <p className="notice">Retirada em: {settings.address}</p>
            )}
            <label className="field">
              Forma de pagamento
              <select {...register("paymentMethod")}>
                {settings.paymentMethods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <small>Pagamento no recebimento. Nenhuma cobrança online.</small>
            </label>
            {method === "Dinheiro" && (
              <label className="field">
                Precisa de troco para quanto? (R$)
                <input
                  type="number"
                  min="0"
                  step=".01"
                  {...register("change")}
                  placeholder="Deixe vazio para valor exato"
                />
              </label>
            )}
            <label className="field">
              Observações do pedido
              <textarea
                {...register("notes")}
                maxLength={500}
                placeholder="Orientações para entrega ou retirada"
              />
            </label>
          </div>
          <div className="coupon-checkout">
            <label className="field">
              Cupom de desconto
              <input
                value={couponText}
                maxLength={24}
                onChange={(e) => {
                  setCouponText(e.target.value.toUpperCase());
                  setCouponCode("");
                }}
                placeholder="Digite o código"
              />
            </label>
            <button
              type="button"
              className="button button-outline button-small"
              disabled={!couponText.trim() || busy || validating}
              onClick={async () => {
                const code = couponText.trim().toUpperCase();
                setCouponCode(code);
                if (mode !== "remote") return;
                const key = JSON.stringify([code, tenant.cart.lines, phone]);
                setValidating(true);
                try {
                  setRemoteCoupon({ key, value: await onValidateCoupon(code, phone || "") });
                } catch (error) {
                  setRemoteCoupon({ key, error: error.message });
                } finally {
                  setValidating(false);
                }
              }}
            >
              Aplicar cupom
            </button>
            {coupon && (
              <p role="status">
                {coupon.code} aplicado: −{money(coupon.discountCents / 100)}{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setCouponCode("");
                    setCouponText("");
                  }}
                >
                  Remover cupom
                </button>
              </p>
            )}
            {couponError && (
              <p className="form-error" role="alert">
                {couponError}
              </p>
            )}
          </div>
          <div className="cart-totals">
            <div>
              <span>Produtos</span>
              <span>{money(subtotal / 100)}</span>
            </div>
            <div>
              <span>{fulfillment === "delivery" ? "Entrega" : "Retirada"}</span>
              <span>{needsQuote ? "Calcule pelo CEP" : money(fee / 100)}</span>
            </div>
            {coupon && (
              <div>
                <span>Cupom {coupon.code}</span>
                <span>−{money(coupon.discountCents / 100)}</span>
              </div>
            )}
            <div className="total-line">
              <strong>Total</strong>
              <strong>{money(total / 100)}</strong>
            </div>
          </div>
          {!availability.open && <p className="notice">{availability.reason}</p>}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="button button-dark button-full"
            disabled={
              busy ||
              hasProblem ||
              !!couponError ||
              (!availability.open && !scheduledDate) ||
              needsQuote ||
              shippingAction.busy
            }
          >
            {busy
              ? "Confirmando…"
              : mode === "remote"
                ? "Confirmar pedido"
                : "Confirmar pedido local"}
            <ArrowUpRight size={15} />
          </button>
          <p className="checkout-note">
            <ShieldCheck size={12} />{" "}
            {mode === "remote"
              ? "Pedido enviado à loja. Sem cobrança online automática."
              : "Demonstração local. Sem cobrança ou envio automático."}
          </p>
        </form>
      )}
    </>
  );
}
