import { useState } from "react";
import PizzaBuilder from "./PizzaBuilder";
import PizzaPriceBreakdown from "./PizzaPriceBreakdown";
import { initialPizzaSelection, pricePizza } from "../core/pizza.ts";

export default function PizzaSimulator({ config }) {
  const [selection, setSelection] = useState(() => initialPizzaSelection(config));
  let error = "";
  try {
    pricePizza(config, selection);
  } catch (e) {
    error = e.message;
  }
  return (
    <div className="pizza-simulator">
      <p className="notice">
        Teste os valores desta configuração. A simulação não salva alterações nem cria pedidos.
      </p>
      <PizzaBuilder config={config} value={selection} onChange={setSelection} />
      {error ? (
        <p role="status" className="notice">
          {error}
        </p>
      ) : (
        <PizzaPriceBreakdown config={config} selection={selection} expanded />
      )}
    </div>
  );
}
