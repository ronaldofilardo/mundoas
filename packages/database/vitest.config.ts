import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["prisma/__tests__/**/*.test.ts"],
    testTimeout: 30000,
    pool: "forks",
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
