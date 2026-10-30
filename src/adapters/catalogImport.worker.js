import { readCatalogBuffer } from "./catalogWorkbook.js";
import { writeCatalogExport } from "./catalogExportWorkbook.js";
self.onmessage = async (event) => {
  try {
    if (event.data.operation === "export") {
      const file = await writeCatalogExport(event.data.snapshot, event.data.template);
      self.postMessage({ file }, [file.buffer]);
      return;
    }
    self.postMessage({ document: await readCatalogBuffer(event.data) });
  } catch (error) {
    self.postMessage({
      error:
        error.name === "DomainError" ? error.message : "Não foi possível processar essa planilha.",
    });
  }
};
