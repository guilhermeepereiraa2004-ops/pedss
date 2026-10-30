import JSZip from "jszip";
import { catalogExportBatches, catalogExportRows } from "../core/catalogExport.ts";
import { MAX_IMPORT_PRODUCTS, MAX_IMPORT_EXTRAS } from "../core/catalogImport.ts";
import { DomainError } from "../core/errors.ts";
import { loadCatalogWorkbook, validateWorkbookArchive } from "./catalogWorkbook.js";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
function fillSheet(sheet, values, priceColumns) {
  const columnCount = values[0].length;
  const style = Array.from({ length: columnCount }, (_, i) =>
    structuredClone(sheet.getRow(2).getCell(i >= 10 ? 9 : i + 1).style),
  );
  sheet.getRow(1).values = values[0];
  if (columnCount > 10) {
    sheet.getColumn(11).width = 36;
    sheet.getRow(1).getCell(11).style = structuredClone(sheet.getRow(1).getCell(9).style);
  }
  for (let i = 2; i <= sheet.rowCount; i++) sheet.getRow(i).values = [];
  values.slice(1).forEach((cells, index) => {
    const row = sheet.getRow(index + 2);
    row.values = cells;
    row.height = 44;
    cells.forEach((value, col) => {
      const cell = row.getCell(col + 1);
      cell.style = structuredClone(style[col]);
      cell.alignment = { vertical: "middle", wrapText: true };
      if (priceColumns.includes(col + 1)) cell.numFmt = '"R$" #,##0.00';
      // String cell values are literal text, including names beginning with =, + or @.
      cell.value = value === "" ? null : value;
    });
  });
  sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, values.length), column: columnCount },
  };
}
async function buildWorkbook(snapshot, products, template) {
  const workbook = await loadCatalogWorkbook(template);
  const rows = catalogExportRows(products, snapshot.products);
  fillSheet(workbook.getWorksheet("Produtos"), rows.products, [4, 5]);
  fillSheet(workbook.getWorksheet("Adicionais"), rows.extras, [3, 4]);
  if (rows.pizzaPrices.length > 1) {
    const pizzaSheet = workbook.addWorksheet("Preços das pizzas");
    fillSheet(pizzaSheet, rows.pizzaPrices, [6, 8]);
    pizzaSheet.columns.forEach((c) => {
      c.width = 25;
    });
  }
  const guide = workbook.getWorksheet("Instruções");
  for (let i = 1; i <= guide.rowCount; i++) guide.getRow(i).values = [];
  const instructions = [
    [
      "Pizzas com tamanhos",
      "Na aba Preços das pizzas, edite os valores e Sim/Não por sabor/tamanho. Preserve códigos e IDs. Tamanho e Sabor são identificações; crie tamanhos e sabores pelo painel. O preço fixo deve ser igual nas linhas do mesmo tamanho. Os valores calculados da aba Produtos não substituem essa tabela. Configurações, fichas, alergênicos e combos já existentes são preservados. A planilha não clona essas configurações para outra loja.",
    ],
    ["CARDÁPIO ATUAL", snapshot.storeName],
    [
      "Conteúdo",
      `${products.length} produtos e ${products.reduce((sum, p) => sum + p.extras.length, 0)} adicionais desta loja. Inclui itens indisponíveis e todos os produtos, independentemente dos filtros do painel.`,
    ],
    [
      "1. Edite os dados",
      "Altere nome, categoria, preço, custo, descrição, disponibilidade, destaque, foto, ingredientes e adicionais. Mantenha os cabeçalhos e nomes das abas.",
    ],
    [
      "Mantenha os códigos",
      "Não altere o Código dos produtos existentes nem o Código do produto dos adicionais. Os códigos identificam os itens mesmo após renomeá-los. Para cadastrar um novo produto, use um novo código único.",
    ],
    [
      "2. Importe novamente",
      "No painel Cardápio, escolha Importar planilha e selecione este arquivo .xlsx. Marque Atualizar produtos existentes com o mesmo código, revise a prévia e confirme.",
    ],
    [
      "Preços e custos",
      "Valores em reais, até duas casas decimais. Preço do produto maior que zero; preço do adicional pode ser zero. Custo vazio = desconhecido, custo zero = zero. Não use fórmulas.",
    ],
    [
      "Categorias",
      "Hamburguer, Pizza, Açaí, Sorvete, Salgado, Pastel, Porção, Bebida ou Sobremesa.",
    ],
    ["Disponível e Destaque", "Use Sim ou Não. Disponível vazio = Sim. Destaque vazio = Não."],
    [
      "Fotos locais",
      "MANTER_FOTO_ATUAL preserva a foto salva no navegador. Mantenha esse texto para conservar a imagem; substitua por uma URL HTTP/HTTPS para trocar a foto ou apague para removê-la. Esse marcador exige o produto já cadastrado nesta loja.",
    ],
    [
      "Foto sem fundo",
      "Foto sem fundo (URL) é independente da foto do cardápio. Use PNG/WebP já transparente. MANTER_FOTO_ATUAL conserva o arquivo da loja; célula vazia remove. Planilhas antigas sem esta coluna preservam a foto sem fundo atual.",
    ],
    [
      "Ingredientes",
      "Separe por ponto e vírgula. Nomes que contêm ponto e vírgula ou começam com [ são exportados como lista JSON; mantenha as aspas e os colchetes ao editar essa lista.",
    ],
    [
      "Adicionais",
      "Uma linha por adicional. Use o código do produto da aba Produtos deste arquivo. Até 30 opções por produto. Nome, preço, custo e disponibilidade são editáveis.",
    ],
    [
      "Opções substituídas",
      "A aba Adicionais substitui todas as opções dos produtos deste lote. Excluir uma linha remove essa opção. Se excluir a aba inteira, as opções atuais serão mantidas.",
    ],
    [
      "Produtos fora do arquivo",
      "Excluir uma linha de produto não o remove do cadastro: produtos fora do lote permanecem. Para ocultar um item, marque Disponível = Não.",
    ],
    [
      "Pedidos anteriores",
      "IDs internos dos produtos e snapshots de pedidos anteriores são preservados. Alterações de preço e custo valem para os próximos pedidos.",
    ],
    [
      "Limites por arquivo",
      `Até ${MAX_IMPORT_PRODUCTS} produtos, ${MAX_IMPORT_EXTRAS} adicionais e 2 MB. Se a exportação gerar ZIP, extraia e edite/importe cada arquivo XLSX separadamente.`,
    ],
    [
      "Uso local",
      "Reimporte na mesma loja e origem do navegador. Este arquivo contém custos de gestão e não inclui pedidos, clientes, credenciais ou dados de outras lojas.",
    ],
  ];
  instructions.forEach((cells, index) => {
    const row = guide.getRow(index + 2);
    row.values = cells;
    row.height = index === 0 ? 32 : 70;
    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, color: { argb: "FF252820" } };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    row.getCell(1).font = {
      name: "Arial",
      size: index === 0 ? 14 : 10,
      bold: true,
      color: { argb: "FF252820" },
    };
  });
  workbook.creator = "Pedss";
  workbook.title = `Cardápio — ${snapshot.storeName}`;
  const bytes = await workbook.xlsx.writeBuffer();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Runs only in the spreadsheet worker. Uses the existing branded XLSX as its format. */
export async function writeCatalogExport(snapshot, template) {
  const buffers = [];
  async function append(products) {
    const buffer = await buildWorkbook(snapshot, products, template);
    try {
      validateWorkbookArchive(buffer);
    } catch (error) {
      if (products.length <= 1)
        throw new DomainError(
          `Não foi possível exportar um produto dentro do limite da planilha: ${error.message}`,
        );
      const half = Math.ceil(products.length / 2);
      await append(products.slice(0, half));
      await append(products.slice(half));
      return;
    }
    buffers.push(buffer);
  }
  for (const batch of catalogExportBatches(snapshot.products)) await append(batch);
  const stem = `cardapio-${snapshot.storeSlug.replace(/[^a-z0-9-]/gi, "-") || "loja"}`;
  if (buffers.length === 1)
    return { buffer: buffers[0], fileName: `${stem}.xlsx`, mimeType: XLSX_TYPE, parts: 1 };
  const zip = new JSZip();
  buffers.forEach((buffer, index) =>
    zip.file(`${stem}-parte-${String(index + 1).padStart(2, "0")}.xlsx`, buffer),
  );
  return {
    buffer: await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" }),
    fileName: `${stem}.zip`,
    mimeType: "application/zip",
    parts: buffers.length,
  };
}
