const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const envFile = path.resolve(__dirname, '..', '.env.test');
if (!fs.existsSync(envFile)) {
  console.error(`[pretest] .env.test não encontrado em ${envFile}`);
  process.exit(1);
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

console.log(`[pretest] Aplicando migrations em ${new URL(env.DATABASE_URL).pathname.slice(1)}`);
execSync('pnpm exec prisma migrate deploy', {
  cwd: path.resolve(__dirname, '..', '..', '..', 'packages', 'database'),
  env: { ...process.env, ...env },
  stdio: 'inherit',
});
