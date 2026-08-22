/**
 * Lint test: handlers de rotas NÃO devem importar `@prisma/client` diretamente.
 *
 * Por que: AGENTS.md proíbe imports diretos. A única forma permitida de obter
 * o cliente Prisma é via `@/lib/db` ou `@asa/database` (re-export). Isso
 * garante que qualquer handler passe pelo helper de validação de versão.
 *
 * Exceções (não aplicar lint):
 *   - Próprio `lib/db.ts` (é o helper)
 *   - Arquivos de teste (__tests__)
 *   - Helper compartilhado `app/__tests__/test-helpers.ts` (usa @asa/database,
 *     que por sua vez re-exporta o client)
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const WEB_ROOT = resolve(__dirname, "..", "..");
const API_ROOT = join(WEB_ROOT, "app", "api");

function walkTs(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let isDir;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      walkTs(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/__tests__/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

const forbidden = ["@prisma/client"];

describe("Lint: imports proibidos em handlers de rotas", () => {
  const handlers = walkTs(API_ROOT);

  if (handlers.length === 0) {
    it.skip("nenhum handler encontrado em app/api (pular)", () => {});
    return;
  }

  for (const file of handlers) {
    it(`${file.replace(WEB_ROOT, ".")} não importa @prisma/client direto`, () => {
      const source = readFileSync(file, "utf8");
      for (const lib of forbidden) {
        // Match: `import ... from "@prisma/client"` ou `import("@prisma/client")`
        const importRegex = new RegExp(
          `from\\s+["']${lib.replace("/", "\\/")}["']|import\\(["']${lib.replace("/", "\\/")}["']\\)`,
        );
        expect(source, `${file} importa ${lib} diretamente`).not.toMatch(
          importRegex,
        );
      }
    });
  }
});

describe("Lint: lib/db.ts existe e exporta prisma", () => {
  it("lib/db.ts existe", () => {
    const dbPath = join(WEB_ROOT, "lib", "db.ts");
    let exists = false;
    try {
      statSync(dbPath);
      exists = true;
    } catch {
      exists = false;
    }
    expect(exists).toBe(true);
  });

  it("lib/db.ts exporta prisma", () => {
    const source = readFileSync(join(WEB_ROOT, "lib", "db.ts"), "utf8");
    expect(source).toMatch(/export\s+const\s+prisma\s*:/);
  });
});
