import { useState } from "react";
export default function MoneyInput({ cents, onChange, ...props }) {
  const [text, setText] = useState(() => (cents == null ? "" : String(cents / 100)));
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      pattern="[0-9]+([.,][0-9]{1,2})?"
      maxLength={12}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value.trim() ? Math.round(Number(e.target.value.replace(",", ".")) * 100) : NaN,
        );
      }}
    />
  );
}
