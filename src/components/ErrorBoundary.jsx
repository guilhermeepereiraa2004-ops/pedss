import { Component } from "react";
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
            : "Ocorreu um erro ao abrir a aplicação. Seus dados locais não foram apagados."}
        </p>
        <button className="button button-dark" onClick={() => window.location.reload()}>
          Recarregar aplicação
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
