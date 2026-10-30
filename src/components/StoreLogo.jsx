import { useState } from "react";
import { Flame } from "lucide-react";
function Asset({ src, name }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img src={src} alt={`Logo de ${name}`} onError={() => setFailed(true)} />
  ) : (
    <Flame size={27} />
  );
}
export default function StoreLogo({ company }) {
  return (
    <span className="store-brand-mark">
      <Asset key={company.logo} src={company.logo} name={company.name} />
    </span>
  );
}
