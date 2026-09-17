const path = require("path");
const { randomBytes } = require("crypto");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.test" });

const testSecret = randomBytes(32).toString("base64");

module.exports = {
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
};
