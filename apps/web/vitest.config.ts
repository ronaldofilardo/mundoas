import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: false });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  esbuild: {
    jsx: 'react-jsx',
    jsxImportSource: 'react',
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'react',
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
});
