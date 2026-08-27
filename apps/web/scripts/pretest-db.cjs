const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const envFile = path.resolve(__dirname, '..', '.env.test');
if (!fs.existsSync(envFile)) {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/asa_db_test';
  fs.writeFileSync(envFile, `DATABASE_URL=${databaseUrl}\n`, 'utf8');
  console.log(`[pretest] .env.test criado para asa_db_test em ${envFile}`);
}

const envContent = fs.readFileSync(envFile, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  let key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

if (!env.DATABASE_URL) {
  console.error('[pretest] DATABASE_URL não definido em .env.test');
  process.exit(1);
}

const databaseName = new URL(env.DATABASE_URL).pathname.replace(/^\//, '');
if (databaseName !== 'asa_db_test') {
  console.error(`[pretest] Abortado: o banco de testes deve ser asa_db_test, recebido ${databaseName || '(vazio)'}`);
  process.exit(1);
}

console.log(`[pretest] Proteção ativa: nenhum reset será executado em ${databaseName}`);
console.log(`[pretest] Aplicando somente migrations pendentes em ${databaseName}`);
execSync('node ../../scripts/prisma-safe.cjs migrate-deploy', {
  cwd: path.resolve(__dirname, '..', '..', '..', 'packages', 'database'),
  env: { ...process.env, ...env },
  stdio: 'inherit',
});
