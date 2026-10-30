export function localRuntimeMode(env) {
  return env.VITE_RUNTIME_MODE === "remote" && env.PEDSS_ALLOW_REMOTE_DATABASE === "true"
    ? "remote"
    : "local";
}
