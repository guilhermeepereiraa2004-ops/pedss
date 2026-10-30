import { Link } from "react-router-dom";
import "./LandingBrand.css";

export default function Brand() {
  return (
    <Link className="landing-brand" to="/" aria-label="Peds's, página inicial">
      <img
        src="/brand/peds-logo-green-v1.webp"
        alt="Peds's"
        width="900"
        height="300"
        decoding="async"
      />
    </Link>
  );
}
