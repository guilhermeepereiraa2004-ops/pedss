import { useState } from "react";
export default function ListInput({ value = [], onChange, ...props }) {
  const [text, setText] = useState(() => value.join(", "));
  return (
    <input
      {...props}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}
