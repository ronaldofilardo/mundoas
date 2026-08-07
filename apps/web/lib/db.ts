/**
 * Cliente Prisma com GARANTIA de resolução correta dentro do monorepo.
 *
 * PROBLEMA HISTÓRICO (ciclos de erro P2022):
 *   O Node resolve `@prisma/client` subindo a hierarquia de pastas. Se houver
 *   uma instalação órfã (ex.: C:\Users\<user>\node_modules\@prisma\client),
 *   ela é escolhida ANTES do client do monorepo, gerando P2022 com DMMF
 *   antigo mesmo após `prisma migrate deploy`.
 *
 * SOLUÇÃO:
 *   1. Resolver explicitamente a partir de C:\apps\mundoas (forçando o
 *      lookup a começar no lugar certo).
 *   2. Validar a versão resolvida em runtime. Se não for a esperada, falhar
 *      alto com mensagem clara, em vez de quebrar com erro opaco do Prisma.
 *   3. Falhar alto também se o caminho estiver FORA do monorepo.
 *
 * USO: importe sempre daqui — nunca `@prisma/client` direto.
 *   import { prisma } from "@/lib/db";
 */
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const EXPECTED_PRISMA_VERSION = "6.19.2";
const MONOREPO_ROOT = resolve(__dirname, "../..");

const requireFromMonorepo = createRequire(
  resolve(MONOREPO_ROOT, "apps/web/package.json"),
);

type PrismaModule = typeof import("@prisma/client");

let cachedPrismaModule: PrismaModule | null = null;

function loadPrisma(): PrismaModule {
  if (cachedPrismaModule) return cachedPrismaModule;

  let mod: PrismaModule;
  let resolvedPath: string;
  try {
    mod = requireFromMonorepo("@prisma/client") as PrismaModule;
    resolvedPath = requireFromMonorepo.resolve("@prisma/client");
  } catch (e) {
    throw new Error(
      `[lib/db] Não foi possível resolver @prisma/client a partir de ${MONOREPO_ROOT}. ` +
        `Rode 'pnpm install' antes de iniciar o dev server.`,
    );
  }

  // 1) Versão
  const version =
    (mod as unknown as { Prisma: { prismaVersion: { client: string } } }).Prisma
      ?.prismaVersion?.client ?? "unknown";
  if (!version.startsWith(EXPECTED_PRISMA_VERSION)) {
    throw new Error(
      `[lib/db] @prisma/client resolvido na versão ${version}, mas a esperada é ${EXPECTED_PRISMA_VERSION}. ` +
        `Caminho: ${resolvedPath}. ` +
        `Provavelmente existe uma instalação órfã em uma pasta-irmã (ex.: C:\\Users\\<user>\\node_modules\\@prisma\\client) ` +
        `sendo capturada por precedência do Node. Remova-a.`,
    );
  }

  // 2) Caminho dentro do monorepo
  if (!resolvedPath.includes(".pnpm") && !resolvedPath.includes("node_modules")) {
    throw new Error(
      `[lib/db] @prisma/client resolvido em caminho inesperado: ${resolvedPath}`,
    );
  }

  cachedPrismaModule = mod;
  return mod;
}

const { PrismaClient } = loadPrisma();

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance;
};

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


