// One stream per origin when Web Locks/BroadcastChannel are available.
// Only revision numbers cross tabs; each tab fetches its authorized view.
export function startLiveUpdates({
  refresh,
  getRevision = () => undefined,
  onRevision = () => {},
  events = window,
  EventSourceClass = window.EventSource,
  timers = window,
  locks = window.navigator?.locks,
  BroadcastChannelClass = window.BroadcastChannel,
  background = false,
}) {
  let source,
    retry,
    release,
    controller,
    channel,
    stopped = false,
    delay = 2000,
    active = false;
  const available = () =>
    !stopped &&
    (background || events.document?.visibilityState !== "hidden") &&
    events.navigator?.onLine !== false;
  const update = async () => {
    if (available()) await refresh();
  };
  const revision = (value, broadcast = false) => {
    if (!available() || !Number.isSafeInteger(value) || value < 0) return;
    if (broadcast) channel?.postMessage({ revision: value });
    if (value !== getRevision()) {
      onRevision(value);
      void update().catch(() => {});
    }
  };
  const cancelRetry = () => {
    if (retry) timers.clearTimeout(retry);
    retry = null;
  };
  const schedule = (pollOnly = false) => {
    if (!available() || retry) return;
    retry = timers.setTimeout(
      async () => {
        retry = null;
        if (!available()) return;
        try {
          await update();
        } catch {
          delay = Math.min(delay * 2, 60_000);
        }
        if (pollOnly) schedule(true);
        else connect();
      },
      pollOnly ? Math.max(5000, delay) : delay,
    );
  };
  const connect = () => {
    if (!available() || !active) return;
    if (!EventSourceClass) {
      schedule(true);
      return;
    }
    source?.close();
    const current = new EventSourceClass("/api/updates?v=2");
    source = current;
    current.onopen = () => {
      if (source === current) delay = 2000;
    };
    const message = (event) => {
      if (source !== current) return;
      try {
        revision(JSON.parse(event.data).revision, true);
      } catch {
        /* Malformed event. */
      }
    };
    current.addEventListener("revision", message);
    current.addEventListener("change", message);
    current.onerror = () => {
      if (source !== current || stopped) return;
      current.close();
      source = null;
      schedule();
      delay = Math.min(delay * 2, 60_000);
    };
  };
  const suspend = () => {
    active = false;
    source?.close();
    source = null;
    cancelRetry();
    controller?.abort();
    controller = null;
    release?.();
    release = null;
  };
  const start = () => {
    if (!available() || active) return;
    active = true;
    if (locks && channel) {
      const attempt = new AbortController();
      controller = attempt;
      void locks
        .request("pedss-live-updates-v2", { signal: attempt.signal }, async () => {
          if (!available() || attempt.signal.aborted) return;
          await new Promise((resolve) => {
            release = resolve;
            connect();
          });
        })
        .catch(() => {
          if (!attempt.signal.aborted && available()) {
            channel?.close();
            channel = null;
            connect();
          }
        });
    } else connect();
  };
  const resume = () => {
    if (!available()) {
      suspend();
      return;
    }
    void update().catch(() => {});
    start();
  };
  if (BroadcastChannelClass && locks && EventSourceClass) {
    channel = new BroadcastChannelClass("pedss-live-updates-v2");
    channel.onmessage = (event) => revision(event.data?.revision);
  }
  start();
  events.addEventListener("online", resume);
  events.addEventListener("offline", suspend);
  events.addEventListener("focus", resume);
  const visible = () => (available() ? resume() : suspend());
  events.document?.addEventListener("visibilitychange", visible);
  return () => {
    stopped = true;
    suspend();
    channel?.close();
    events.removeEventListener("online", resume);
    events.removeEventListener("offline", suspend);
    events.removeEventListener("focus", resume);
    events.document?.removeEventListener("visibilitychange", visible);
  };
}
