import { useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { ApplicationContext } from "../hooks/ApplicationContext";
import { getRuntime } from "../application/runtime";
export default function ApplicationProvider({ children, runtime: injected, viewKey = "initial" }) {
  const [runtime] = useState(() => injected || getRuntime());
  const state = useSyncExternalStore(runtime.repository.subscribe, runtime.repository.getSnapshot);
  const [loadedView, setLoadedView] = useState(null);
  const [startupError, setStartupError] = useState(null);
  const [attempt, retry] = useReducer((v) => v + 1, 0);
  const [, refresh] = useReducer((v) => v + 1, 0);
  useEffect(() => {
    let alive = true;
    let stopSync;
    let starting = false;
    let ready = false;
    runtime.auth.ready.catch(() => {});
    const initialize = () => {
      if (!alive || starting || ready) return;
      starting = true;
      return (runtime.refresh ? runtime.refresh() : runtime.auth.ready)
        .then(() => {
          if (alive) {
            ready = true;
            setLoadedView(viewKey);
            setStartupError(null);
            stopSync = runtime.startSync?.();
          }
        })
        .catch(() => {
          if (alive)
            setStartupError({
              viewKey,
              message:
                "Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.",
            });
        })
        .finally(() => {
          starting = false;
        });
    };
    void initialize();
    const reconnect = () => {
      if (window.navigator.onLine !== false) void initialize();
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("focus", reconnect);
    const unsub = runtime.auth.subscribe(refresh);
    const timer = setInterval(() => {
      refresh();
      if (!runtime.startSync) runtime.refresh?.().catch(() => {});
    }, 30_000);
    return () => {
      alive = false;
      unsub();
      stopSync?.();
      window.removeEventListener("online", reconnect);
      window.removeEventListener("focus", reconnect);
      clearInterval(timer);
    };
  }, [runtime, viewKey, attempt]);
  const identity = runtime.auth.current();
  if (startupError?.viewKey === viewKey)
    return (
      <div className="loading-screen" role="alert">
        <p>{startupError.message}</p>
        <button
          className="button button-dark"
          onClick={() => {
            setStartupError(null);
            retry();
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  if (loadedView !== viewKey)
    return (
      <div className="loading-screen" role="status">
        Preparando a Pedss…
      </div>
    );
  return (
    <ApplicationContext value={{ ...runtime, state, identity, now: runtime.now?.() || new Date() }}>
      {runtime.repository.warning && (
        <div className="global-warning" role="alert">
          {runtime.repository.warning}
        </div>
      )}
      {children}
    </ApplicationContext>
  );
}
