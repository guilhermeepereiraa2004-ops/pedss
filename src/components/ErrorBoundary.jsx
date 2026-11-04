import { Component } from "react";
import { isPageLoadError } from "../application/pageLoading";
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <main className="store-not-found">
        <h1>Vamos retomar daqui.</h1>
        <p>
          {this.state.error.name === "DomainError"
            ? this.state.error.message
            : isPageLoadError(this.state.error)
              ? "Não foi possível carregar esta tela. A conexão pode ter falhado ou uma nova versão do site pode estar disponível. Atualize para tentar novamente."
              : "Ocorreu um erro ao abrir esta tela. Tente recarregar a aplicação."}
        </p>
        <button className="button button-dark" onClick={() => window.location.reload()}>
          {isPageLoadError(this.state.error) ? "Atualizar aplicação" : "Recarregar aplicação"}
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
