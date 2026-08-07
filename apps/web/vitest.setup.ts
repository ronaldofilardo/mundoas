// Setup executado antes dos testes para configurar o ambiente de teste.
// Mantido separado do vitest.config.ts para que o Next.js não faça
// type-check deste código durante o build.

process.env.NODE_ENV = 'test';
process.env.VITEST = 'true';

