let loading;
export function loadModelViewer() {
  loading ??= import("@google/model-viewer").catch((error) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
