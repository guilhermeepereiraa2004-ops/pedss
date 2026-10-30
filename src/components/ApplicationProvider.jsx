import { useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { ApplicationContext } from "../hooks/ApplicationContext";
import { getRuntime } from "../application/runtime";
export default function ApplicationProvider({ children, runtime: injected, viewKey = "initial" }) {
  const [runtime] = useState(() => injected || getRuntime());
  const state = useSyncExternalStore(runtime.repository.subscribe, runtime.repository.getSnapshot);
  const [loadedView, setLoadedView] = useState(null);
  const [startupError, setStartupError] = useState(null);
  const [, refresh] = useReducer((v) => v + 1, 0);
  useEffect(() => {
    let alive = true;
    let stopSync;
    runtime.auth.ready.catch(() => {});
    (runtime.refresh ? runtime.refresh() : runtime.auth.ready)
      .then(() => {
        if (alive) {
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
      });
    const unsub = runtime.auth.subscribe(refresh);
    const timer = setInterval(() => {
      refresh();
      if (!runtime.startSync) runtime.refresh?.().catch(() => {});
    }, 30_000);
    return () => {
      alive = false;
      unsub();
      stopSync?.();
      clearInterval(timer);
    };
  }, [runtime, viewKey]);
  const identity = runtime.auth.current();
  if (startupError?.viewKey === viewKey)
    return (
      <div className="loading-screen" role="alert">
        <p>{startupError.message}</p>
        <button className="button button-dark" onClick={() => window.location.reload()}>
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
