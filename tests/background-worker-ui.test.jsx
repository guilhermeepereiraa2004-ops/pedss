// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { removeImageBackground } from "../src/adapters/backgroundRemoval.js";
afterEach(() => vi.unstubAllGlobals());
function fakeWorker() {
  const worker = { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null, onerror: null };
  vi.stubGlobal("OffscreenCanvas", class {});
  vi.stubGlobal(
    "Worker",
    class {
      constructor() {
        return worker;
      }
    },
  );
  return worker;
}
it("BG-WORKER-01 recebe progresso/resultado e libera worker sem enviar foto ao servidor", async () => {
  const worker = fakeWorker(),
    progress = vi.fn(),
    blob = new Blob(["result"], { type: "image/png" });
  const pending = removeImageBackground("data:image/jpeg;base64,AAAA", undefined, progress);
  expect(worker.postMessage.mock.calls[0][0]).toMatchObject({ src: "data:image/jpeg;base64,AAAA" });
  expect(worker.postMessage.mock.calls[0][0].modelUrl).toContain("/models/u2netp.onnx");
  worker.onmessage({ data: { progress: "Removendo…" } });
  worker.onmessage({ data: { blob } });
  await expect(pending).resolves.toBe(blob);
  expect(progress).toHaveBeenCalledWith("Removendo…");
  expect(worker.terminate).toHaveBeenCalledOnce();
});
it("BG-WORKER-02 cancelar/falhar termina inferência e permite tentar de novo", async () => {
  const worker = fakeWorker(),
    controller = new AbortController();
  const pending = removeImageBackground("/photo.jpg", controller.signal);
  const rejected = expect(pending).rejects.toThrow(/cancelado/);
  controller.abort();
  await rejected;
  expect(worker.terminate).toHaveBeenCalledOnce();
  const again = removeImageBackground("/photo.jpg");
  worker.onerror();
  await expect(again).rejects.toThrow(/carregar/);
  expect(worker.terminate).toHaveBeenCalledTimes(2);
});
