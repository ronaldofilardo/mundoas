// Setup executado antes dos testes para configurar o ambiente de teste.
// Mantido separado do vitest.config.ts para que o Next.js nÃo faça
// type-check deste cÃdigo durante o build.

import 'vitest';
import '@testing-library/jest-dom/vitest';
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, ".env.test"),
  override: false,
});

process.env.NODE_ENV = "test";
process.env.VITEST = "true";