import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync("docs/acceptance.json", "utf8"));
const report = JSON.parse(fs.readFileSync(".quality/test-results.json", "utf8"));
if (catalog.items.length < catalog.floor)
  throw new Error("O catálogo ficou abaixo do piso registrado.");
const assertions = (report.testResults || []).flatMap((suite) => suite.assertionResults || []);
const rows = catalog.items.map((item) => {
  const tests = assertions.filter((a) => (a.fullName || a.title || "").includes(item.id));
  return {
    ...item,
    passed: tests.length > 0 && tests.every((a) => a.status === "passed"),
    evidence: tests.map((a) => a.fullName || a.title).join("; "),
  };
});
const passed = rows.filter((r) => r.passed).length;
const markdown =
  `# Aceitação — Brasa\n\nGerado por \`npm run check\`. Fonte: \`docs/acceptance.json\`.\n\nTotal: ${rows.length} | Verificados: ${passed} | Progresso: ${Math.round((passed / rows.length) * 100)}%\n\n| ID | Critério | Estado | Evidência |\n| --- | --- | --- | --- |\n` +
  rows
    .map(
      (r) =>
        `| ${r.id} | ${r.title} | ${r.passed ? "Verificado" : "Pendente"} | ${r.evidence || "Sem teste executado"} |`,
    )
    .join("\n") +
  "\n";
fs.writeFileSync("docs/checklist-paridade.md", markdown);
if (passed !== rows.length) throw new Error(`Aceitação incompleta: ${passed}/${rows.length}.`);
process.stdout.write(`Aceitação: ${passed}/${rows.length} critérios verificados.\n`);
