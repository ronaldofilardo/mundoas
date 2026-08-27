#!/usr/bin/env node
/**
 * Guardião de operações Prisma.
 *
 * Política:
 * - nunca executa `migrate reset`, `db drop` ou `db push`;
 * - `migrate deploy` é a única operação de alteração exposta pelos scripts;
 * - somente bancos locais explicitamente reconhecidos podem receber comandos
 *   de desenvolvimento/teste;
 * - o alvo real é exibido sem imprimir credenciais.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const databaseDir = path.join(repoRoot, 'packages', 'database');
const prismaBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function loadDatabaseUrl() {
  const candidates = [
    process.env,
    readEnvFile(path.join(databaseDir, '.env')),
    readEnvFile(path.join(repoRoot, '.env')),
    readEnvFile(path.join(repoRoot, 'apps', 'web', '.env.test')),
    readEnvFile(path.join(repoRoot, 'apps', 'web', '.env.local')),
  ];
  for (const env of candidates) {
    if (env.DATABASE_URL) return env.DATABASE_URL;
  }
  return null;
}

function describeTarget(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, '')) || '(sem nome)';
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || '(padrão)'}/${database}`;
  } catch {
    return '(DATABASE_URL inválido)';
  }
}

function databaseName(databaseUrl) {
  try {
    return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ''));
  } catch {
    return '';
  }
}

function fail(message) {
  console.error(`\n[db-safety] BLOQUEADO: ${message}\n`);
  process.exit(1);
}

function run(args, env) {
  const result = spawnSync(prismaBin, ['exec', 'prisma', ...args], {
    cwd: databaseDir,
    env,
    stdio: 'inherit',
    // Arquivos .cmd precisam ser executados pelo shell no Windows.
    shell: process.platform === 'win32',
  });
  if (result.error) {
    console.error(`[db-safety] Falha ao iniciar ${prismaBin}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status === null || result.status === undefined) {
    console.error('[db-safety] O processo Prisma terminou sem código de saída.');
    process.exit(1);
  }
  process.exit(result.status);
}

const operation = process.argv[2];
const databaseUrl = loadDatabaseUrl();
if (!databaseUrl) fail('DATABASE_URL não foi encontrado. Nenhuma operação será executada.');

const targetName = databaseName(databaseUrl);
const targetDescription = describeTarget(databaseUrl);
const safeLocalTargets = new Set(['asa_db', 'asa_db_test']);
const env = { ...process.env, DATABASE_URL: databaseUrl };

switch (operation) {
  case 'migrate-deploy':
    console.log(`[db-safety] Aplicando somente migrations pendentes em ${targetDescription}.`);
    console.log('[db-safety] Nenhum reset, drop ou db push será executado.');
    run(['migrate', 'deploy'], env);
    break;

  case 'migrate-status':
    console.log(`[db-safety] Consultando status de ${targetDescription}.`);
    run(['migrate', 'status'], env);
    break;

  case 'migrate-dev':
  case 'migrate-reset':
  case 'db-push':
  case 'db-drop':
    fail(`a operação Prisma '${operation}' é proibida pelos scripts do projeto. Use uma migration SQL incremental revisada e depois 'migrate:deploy'.`);
    break;

  case 'check':
    if (!safeLocalTargets.has(targetName)) {
      fail(`o comando de verificação local recebeu o banco '${targetName || '(vazio)'}'. Alvos permitidos: asa_db e asa_db_test.`);
    }
    console.log(`[db-safety] Alvo aprovado: ${targetDescription}`);
    console.log('[db-safety] Política ativa: migrations incrementais; reset/db push/drop bloqueados.');
    break;

  default:
    console.error('Uso: node scripts/prisma-safe.cjs <migrate-deploy|migrate-status|check>');
    console.error('Operações destrutivas e migrate dev são bloqueadas por design.');
    process.exit(2);
}
