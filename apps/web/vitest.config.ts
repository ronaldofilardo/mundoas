import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: false });

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
      '__tests__/**/*.test.mjs',
      'app/__tests__/**/*.test.ts',
      'app/__tests__/**/*.test.tsx',
      'lib/__tests__/**/*.test.ts',
      'lib/__tests__/**/*.test.tsx',
      'lib/__tests__/**/*.test.mjs',
      'components/__tests__/**/*.test.ts',
      'components/__tests__/**/*.test.tsx',
    ],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    sequence: { concurrent: false },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/coverage/**', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/e2e-cadastrar-comercial.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
});
