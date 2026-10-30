import {
  MAX_IMPORT_PRODUCTS,
  MAX_IMPORT_EXTRAS,
  normalizeImportText,
} from "../core/catalogImport.ts";
import { DomainError } from "../core/errors.ts";
import JSZip from "jszip";
export const MAX_WORKBOOK_BYTES = 2 * 1024 * 1024;
/** Bound archive metadata before handing it to the spreadsheet reader. */
export function validateWorkbookArchive(buffer) {
  const bytes = new Uint8Array(buffer),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length > MAX_WORKBOOK_BYTES) throw new DomainError("Use uma planilha de até 2 MB.");
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0)
    throw new DomainError("O arquivo não é uma planilha XLSX válida. Use o modelo para preencher.");
  const count = view.getUint16(end + 10, true),
    offset = view.getUint32(end + 16, true),
    size = view.getUint32(end + 12, true);
  if (count > 250 || count === 65535 || offset + size > end)
    throw new DomainError("A planilha está fora dos limites permitidos.");
  let cursor = offset,
    total = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50)
      throw new DomainError("A estrutura do arquivo XLSX está corrompida.");
    const flags = view.getUint16(cursor + 8, true),
      expanded = view.getUint32(cursor + 24, true),
      nameLength = view.getUint16(cursor + 28, true),
      extraLength = view.getUint16(cursor + 30, true),
      commentLength = view.getUint16(cursor + 32, true);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > end) throw new DomainError("A estrutura do arquivo XLSX está corrompida.");
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    total += expanded;
    if (flags & 1 || /vbaproject\.bin$/i.test(name))
      throw new DomainError("Use um arquivo XLSX sem senha e sem macros.");
    if (expanded > 8 * 1024 * 1024 || total > 12 * 1024 * 1024)
      throw new DomainError(
        "A planilha contém dados demais. Use o modelo e mantenha até 500 produtos.",
      );
    cursor = next;
  }
}
export async function loadCatalogWorkbook(buffer) {
  validateWorkbookArchive(buffer);
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    // ExcelJS expects unprefixed SpreadsheetML tags. Excel and other XLSX authors
    // may legally use a namespace prefix; normalize just that known namespace.
    const archive = await JSZip.loadAsync(buffer);
    let normalized = false;
    for (const entry of Object.values(archive.files)) {
      if (entry.dir || !/^xl\/.*\.xml$/.test(entry.name)) continue;
      let xml = await entry.async("string");
      const prefixes = [
        ...xml.matchAll(
          /xmlns:([A-Za-z_][\w.-]*)=["']http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main["']/g,
        ),
      ];
      for (const [, prefix] of prefixes) {
        const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        xml = xml.replace(new RegExp(`<(/?)${escaped}:`, "g"), "<$1");
      }
      if (prefixes.length) {
        archive.file(entry.name, xml);
        normalized = true;
      }
    }
    const input = normalized
      ? await archive.generateAsync({ type: "arraybuffer", compression: "DEFLATE" })
      : buffer;
    await workbook.xlsx.load(input, { ignoreNodes: ["drawing", "picture", "extLst"] });
  } catch {
    throw new DomainError(
      "Não foi possível ler o XLSX. Salve novamente sem senha ou use o modelo.",
    );
  }
  return workbook;
}
export async function readCatalogBuffer(buffer) {
  const workbook = await loadCatalogWorkbook(buffer);
  const sheets = [],
    issues = [];
  for (const sheet of workbook.worksheets) {
    const type = normalizeImportText(sheet.name);
    if (!["produtos", "adicionais", "precos das pizzas"].includes(type)) continue;
    const max =
      type === "produtos"
        ? MAX_IMPORT_PRODUCTS
        : type === "precos das pizzas"
          ? 2000
          : MAX_IMPORT_EXTRAS;
    if (sheet.rowCount > 2002 || sheet.columnCount > 30)
      throw new DomainError(
        `A aba ${sheet.name} contém linhas ou colunas demais. Use os limites do modelo.`,
      );
    const rows = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const cells = [];
      for (let col = 1; col <= sheet.columnCount; col++) {
        const cell = row.getCell(col),
          value = cell.value;
        if (value == null) cells.push(null);
        else if (["string", "number", "boolean"].includes(typeof value)) cells.push(value);
        else if (value.richText) cells.push(value.richText.map((piece) => piece.text).join(""));
        else if (value.hyperlink) cells.push(value.text || value.hyperlink);
        else {
          cells.push(null);
          issues.push({
            sheet: sheet.name,
            line: row.number,
            column: sheet.getRow(1).getCell(col).text || cell.address,
            message:
              value.formula || value.sharedFormula
                ? "Substitua fórmulas por valores antes de importar."
                : "Use texto ou número. Datas e erros de célula não são aceitos neste campo.",
          });
        }
      }
      if (cells.some((v) => v !== null && v !== "")) rows.push({ line: row.number, cells });
    });
    if (rows.filter((r) => r.line > 1).length > max)
      throw new DomainError(`A aba ${sheet.name} excede o limite de ${max} registros.`);
    sheets.push({ name: sheet.name, rows });
  }
  return { sheets, issues };
}
