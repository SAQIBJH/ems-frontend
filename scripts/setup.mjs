#!/usr/bin/env node
/**
 * One-command project bootstrap. Cross-platform (Windows / macOS / Linux).
 *
 *   node scripts/setup.mjs
 *
 * The ONLY prerequisite is Node.js >= 20. This script does NOT install Node and
 * does NOT install pnpm globally — it uses Corepack (bundled with Node 20+) to
 * activate the exact pnpm version pinned in package.json's `packageManager`
 * field, so every developer gets the same toolchain with zero drift.
 *
 * Steps:
 *   1. Verify the Node version.
 *   2. Enable Corepack (best-effort) so the pinned pnpm is available.
 *   3. Create .env.local from .env.example if it is missing.
 *   4. Install dependencies via `corepack pnpm install`.
 *   5. Print next steps.
 */

import { execSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT); // run from repo root regardless of where it was invoked

const MIN_NODE_MAJOR = 20;

const c = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const step = (msg) => console.log(`\n${c.cyan('▸')} ${msg}`);
const ok = (msg) => console.log(`  ${c.green('✓')} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow('!')} ${msg}`);

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function tryRun(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

// 1. Node version ------------------------------------------------------------
step('Checking Node.js version');
const major = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
  console.error(
    c.red(`  ✗ Node.js >= ${MIN_NODE_MAJOR} is required. You have ${process.version}.`),
  );
  console.error(c.dim('    Install Node 22 LTS from https://nodejs.org or via nvm/volta.'));
  process.exit(1);
}
ok(`Node ${process.version}`);

// 2. Corepack / pnpm ---------------------------------------------------------
step('Activating pnpm via Corepack (uses the version pinned in package.json)');
if (!tryRun('corepack enable')) {
  warn('`corepack enable` failed (may need elevated permissions).');
  warn('Continuing — `corepack pnpm` still works without it.');
}

// 3. Environment file --------------------------------------------------------
step('Setting up environment variables');
if (existsSync('.env.local')) {
  ok('.env.local already exists — left untouched');
} else if (existsSync('.env.example')) {
  copyFileSync('.env.example', '.env.local');
  ok('Created .env.local from .env.example');
  warn('Review .env.local — set NEXT_PUBLIC_USE_MOCKS=true to use MSW mocks.');
} else {
  warn('.env.example not found — skipping .env.local creation.');
}

// 4. Install dependencies ----------------------------------------------------
step('Installing dependencies (corepack pnpm install)');
try {
  run('corepack pnpm install');
} catch {
  console.error(c.red('  ✗ Dependency install failed.'));
  console.error(c.dim('    Try manually: corepack enable && pnpm install'));
  process.exit(1);
}
ok('Dependencies installed');

// 5. Done --------------------------------------------------------------------
console.log(`\n${c.green('Setup complete.')} Start the app with:\n`);
console.log(`  ${c.cyan('pnpm dev')}   ${c.dim('→ http://localhost:3000')}\n`);
console.log(c.dim('Seed login (live backend): hr@acme.test / Password123!'));
console.log(c.dim('See README.md and CLAUDE.md for full details.\n'));
