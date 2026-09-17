import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: false });

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '__tests__/**/*.{test.ts,test.tsx}',
      'app/__tests__/**/*.{test.ts,test.tsx}',
      'hooks/__tests__/**/*.{test.ts,test.tsx}',
      'lib/__tests__/**/*.{test.ts,test.tsx}',
      'components/__tests__/**/*.{test.ts,test.tsx}',
      'components/__tests__/*.{test.ts,test.tsx}',
    ],
    testTimeout: 30000,
    server: {
      deps: {
        inline: [/@exodus\/bytes/, /html-encoding-sniffer/],
      },
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/coverage/**', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/e2e-cadastrar-comercial.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
