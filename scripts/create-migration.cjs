#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const databaseDir = path.join(root, 'packages', 'database');
const migrationsDir = path.join(databaseDir, 'prisma', 'migrations');
const nameArgIndex = process.argv.indexOf('--name');
const name = nameArgIndex >= 0 ? process.argv[nameArgIndex + 1] : '';

if (!name || !/^[a-z0-9][a-z0-9_-]{2,80}$/i.test(name)) {
  console.error('Uso: pnpm db:migration:create --name nome_curto_da_mudanca');
  process.exit(2);
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line) => {
    const value = line.trim();
    if (!value || value.startsWith('#')) return [];
    const i = value.indexOf('=');
    return i < 0 ? [] : [[value.slice(0, i).trim(), value.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]];
  }));
}

const env = {
  ...readEnv(path.join(root, '.env')),
  ...readEnv(path.join(databaseDir, '.env')),
  ...process.env,
};
const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  console.error('[migration-create] DATABASE_URL não encontrado.');
  process.exit(1);
}

let databaseName;
try {
  databaseName = decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ''));
} catch {
  console.error('[migration-create] DATABASE_URL inválido.');
  process.exit(1);
}

if (!new Set(['asa_db', 'asa_db_test']).has(databaseName)) {
  console.error(`[migration-create] BLOQUEADO: criação local exige asa_db ou asa_db_test; recebido ${databaseName}.`);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const folder = path.join(migrationsDir, `${stamp}_${name}`);
if (fs.existsSync(folder)) {
  console.error(`[migration-create] A migration já existe: ${folder}`);
  process.exit(1);
}

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(pnpmBin, [
  'exec', 'prisma', 'migrate', 'diff',
  '--from-url', databaseUrl,
  '--to-schema-datamodel', path.join(databaseDir, 'prisma', 'schema.prisma'),
  '--script',
], {
  cwd: databaseDir,
  env,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.error || result.status !== 0) {
  console.error(`[migration-create] Falha ao executar ${pnpmBin} prisma migrate diff.`);
  if (result.error) console.error(`[migration-create] ${result.error.message}`);
  if (result.status !== null && result.status !== undefined) console.error(`[migration-create] exit code: ${result.status}`);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.stdout) process.stdout.write(result.stdout);
  if (!result.error && !result.stderr && !result.stdout) {
    console.error('[migration-create] O Prisma não retornou detalhes adicionais.');
  }
  process.exit(result.status || 1);
}

const sql = result.stdout.trim();
if (!sql || /^--\s*This is an empty migration/i.test(sql)) {
  console.log('[migration-create] Nenhuma diferença detectada; nenhum arquivo foi criado.');
  process.exit(0);
}

const destructive = /\b(DROP\s+(DATABASE|SCHEMA|TABLE|COLUMN)|TRUNCATE\b|DELETE\s+FROM)\b/i.test(sql);
if (destructive && process.env.ALLOW_DESTRUCTIVE_MIGRATION !== 'I_UNDERSTAND') {
  console.error('[migration-create] BLOQUEADO: o SQL contém operação potencialmente destrutiva.');
  console.error('[migration-create] Revise o diff e repita apenas com ALLOW_DESTRUCTIVE_MIGRATION=I_UNDERSTAND.');
  process.exit(1);
}

fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(path.join(folder, 'migration.sql'), `${sql}\n`, 'utf8');
console.log(`[migration-create] Migration criada para revisão: ${path.relative(root, folder)}`);
console.log('[migration-create] A migration NÃO foi aplicada. Revise o SQL e execute pnpm db:migrate depois da aprovação.');
