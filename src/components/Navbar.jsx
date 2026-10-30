import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import LandingBrand from "./LandingBrand";
import "./Navbar.css";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <nav className="container nav-inner" aria-label="Navegação principal">
        <LandingBrand />
        <div className={`nav-links ${open ? "is-open" : ""}`}>
          <a href="#plataforma" onClick={() => setOpen(false)}>
            A plataforma
          </a>
          <a href="#como-funciona" onClick={() => setOpen(false)}>
            Como funciona
          </a>
          <a href="#planos" onClick={() => setOpen(false)}>
            Planos
          </a>
          <Link to="/store/demo">
            Ver demonstração <ArrowUpRight size={13} />
          </Link>
        </div>
        <Link to="/login" className="button button-dark nav-login">
          Acessar painel <ArrowUpRight size={15} />
        </Link>
        <button
          className="icon-button mobile-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
    </header>
  );
}
