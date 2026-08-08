#!/usr/bin/env node
/**
 * Garante que o @prisma/client resolvido em C:\apps\mundoas
 * é o do monorepo (versão fixa em package.json), e NÃO um client órfão
 * em pastas-irmãs (ex.: C:\Users\<user>\node_modules).
 *
 * Sem essa trava, o Node sobe a hierarquia de pastas e pode carregar um
 * @prisma/client de outro projeto com DMMF antigo, causando P2022
 * ("column does not exist") mesmo com migration aplicada.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const EXPECTED_PRISMA_VERSION = "6.19.2";

function fail(msg) {
  console.error("\n[check-prisma-resolution] " + msg);
  console.error(
    "[check-prisma-resolution] Veja AGENTS.md → 'Resolução do @prisma/client'.\n",
  );
  process.exit(1);
}

// 1) Resolve o @prisma/client a partir do monorepo e captura a versão.
const requireFromRepo = createRequire(resolve(repoRoot, "apps/web/package.json"));
let resolvedPath, pkg;
try {
  resolvedPath = requireFromRepo.resolve("@prisma/client");
  pkg = JSON.parse(readFileSync(resolve(resolvedPath, "../package.json"), "utf8"));
} catch (e) {
  fail(
    `Não foi possível resolver @prisma/client a partir do monorepo. Rode 'pnpm install' antes.`,
  );
}

if (pkg.version !== EXPECTED_PRISMA_VERSION) {
  fail(
    `Versão resolvida ${pkg.version} != esperada ${EXPECTED_PRISMA_VERSION}. Caminho: ${resolvedPath}`,
  );
}

// 2) Verifica que o client resolvido está DENTRO do monorepo (.pnpm).
const PnpmMarker = `${sep}.pnpm${sep}@prisma+client`;
if (!resolvedPath.includes(PnpmMarker)) {
  fail(
    `@prisma/client resolvido FORA do monorepo: ${resolvedPath}. Existe uma instalação concorrente em uma pasta pai. Remova-a.`,
  );
}

// 3) Detecta instalações concorrentes nas pastas-irmãs comuns
//    (C:\Users\<user>\node_modules, C:\node_modules, C:\apps\node_modules).
const candidates = [
  resolve(repoRoot, "../../node_modules/@prisma/client"),
  resolve(repoRoot, "../../../node_modules/@prisma/client"),
  resolve(repoRoot, "../../../../node_modules/@prisma/client"),
];

const leaks = candidates.filter((p) => existsSync(p));
if (leaks.length > 0) {
  fail(
    `Detectado(s) @prisma/client órfão(s) fora do monorepo:\n  - ${leaks.join(
      "\n  - ",
    )}\n` +
      `Esses podem ser resolvidos por precedência do Node e causar P2022.\n` +
      `Remova-os (ex.: rm -rf C:\\Users\\<user>\\node_modules\\@prisma).`,
  );
}

console.log(
  `[check-prisma-resolution] OK — @prisma/client@${pkg.version} resolvido em ${resolvedPath}`,
);
