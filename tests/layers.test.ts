import { it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { violationsFor } from "../scripts/check-layers.mjs";
it("ARCH-01 aceita dependência permitida e rejeita violação com exit code 1", () => {
  expect(violationsFor("src/application/service.ts", "import {x} from '../core/domain';")).toEqual(
    [],
  );
  const result = spawnSync(process.execPath, ["scripts/check-layers.mjs", "--fixture-violation"], {
    encoding: "utf8",
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("não pode importar");
});
