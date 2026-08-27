const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const guard = path.join(root, 'scripts', 'prisma-safe.cjs');

function run(operation, databaseUrl = 'postgresql://postgres:123456@localhost:5432/asa_db_test') {
  return spawnSync(process.execPath, [guard, operation], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
  });
}

test('bloqueia migrate reset sem tocar no banco', () => {
  const result = run('migrate-reset');
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /BLOQUEADO/);
});

test('bloqueia db push', () => {
  const result = run('db-push');
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /BLOQUEADO/);
});

test('bloqueia migrate dev', () => {
  const result = run('migrate-dev');
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /BLOQUEADO/);
});

test('aprova somente asa_db e asa_db_test no check local', () => {
  assert.equal(run('check', 'postgresql://postgres:123456@localhost:5432/asa_db').status, 0);
  assert.equal(run('check', 'postgresql://postgres:123456@localhost:5432/asa_db_test').status, 0);
});

test('bloqueia check apontando para banco não reconhecido', () => {
  const result = run('check', 'postgresql://postgres:123456@localhost:5432/neondb');
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /BLOQUEADO/);
});
