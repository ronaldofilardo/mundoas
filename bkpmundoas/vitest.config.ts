import { defineConfig } from "vitest/config";
import path from "path";
import { randomBytes } from "crypto";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Generate random test secret each run (never hardcoded)
const testSecret = randomBytes(32).toString("base64");

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      NEXTAUTH_SECRET: testSecret,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      "@asa/shared": path.resolve(__dirname, "packages/shared/src"),
      "@asa/database": path.resolve(__dirname, "packages/database/src"),
      "@": path.resolve(__dirname, "apps/web"),
    },
  },
});
