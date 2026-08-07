/**
 * Teste do script scripts/check-prisma-resolution.mjs
 *
 * Garante que o validador:
 *   1. ACEITA o monorepo no estado atual (versão 6.19.2 dentro de .pnpm)
 *   2. Tem a constante EXPECTED_PRISMA_VERSION = "6.19.2"
 *   3. Detecta caminhos órfãos relativos ao monorepo
 *
 * Roda como subprocesso Node para isolar o test runner.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MONOREPO_ROOT = resolve(__dirname, "..", "..", "..", "..");
const SCRIPT_PATH = join(
  MONOREPO_ROOT,
  "scripts",
  "check-prisma-resolution.mjs",
);

describe("check-prisma-resolution.mjs", () => {
  it("ACEITA o monorepo no estado correto (6.19.2 dentro de .pnpm)", () => {
    const result = spawnSync("node", [SCRIPT_PATH], {
      cwd: MONOREPO_ROOT,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/OK — @prisma\/client@6\.19\.2/);
    expect(result.stderr).toBe("");
  });

  it("constante EXPECTED_PRISMA_VERSION esta fixada em 6.19.2", () => {
    const source = readFileSync(SCRIPT_PATH, "utf8");
    expect(source).toMatch(/EXPECTED_PRISMA_VERSION\s*=\s*["']6\.19\.2["']/);
  });

  it("script detecta caminhos orfaos relativos ao monorepo", () => {
    const source = readFileSync(SCRIPT_PATH, "utf8");
    expect(source).toMatch(/\.pnpm/);
    expect(source).toMatch(/FORA do monorepo|órfão/i);
  });

  it("script e referenciado pelo preinstall hook no package.json raiz", () => {
    const pkg = JSON.parse(
      readFileSync(join(MONOREPO_ROOT, "package.json"), "utf8"),
    );
    expect(pkg.scripts?.preinstall).toContain("check-prisma-resolution");
  });
});
