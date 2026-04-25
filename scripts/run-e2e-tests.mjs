#!/usr/bin/env node
/**
 * E2E Test Runner — drives /test/e2e-matching from the CLI.
 *
 * Usage:
 *   node scripts/run-e2e-tests.mjs                      # list all scenarios
 *   node scripts/run-e2e-tests.mjs <scenario-id>        # run one scenario
 *   node scripts/run-e2e-tests.mjs all                  # run all scenarios
 *   node scripts/run-e2e-tests.mjs --category=Stress    # run all in a category
 *   node scripts/run-e2e-tests.mjs --filter=stress      # run all where id contains 'stress'
 *
 * Targets local Docker Supabase by default. Override with env:
 *   API_URL=https://dqoybysbooxngrsxaekd.supabase.co/functions/v1/make-server-ce05600a \
 *   ANON_KEY=eyJ... \
 *   node scripts/run-e2e-tests.mjs stress-200
 *
 * Exit code: 0 if all scenarios passed, 1 otherwise.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ---- Config ----
function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const envLocal = loadEnvFile(resolve(projectRoot, '.env.local'));
const envBase = loadEnvFile(resolve(projectRoot, '.env'));

const API_URL =
  process.env.API_URL ||
  (envLocal.VITE_SUPABASE_URL || 'http://127.0.0.1:54321') + '/functions/v1/make-server-ce05600a';
const ANON_KEY =
  process.env.ANON_KEY ||
  envLocal.VITE_SUPABASE_ANON_KEY ||
  envBase.SUPABASE_ANON_KEY ||
  '';

if (!ANON_KEY) {
  console.error('❌ No ANON_KEY found. Set ANON_KEY env var or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(2);
}

// ---- ANSI helpers ----
const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const ok = (s) => `${c.green}✓${c.reset} ${s}`;
const fail = (s) => `${c.red}✗${c.reset} ${s}`;

// ---- HTTP helpers ----
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '300000', 10); // 5 min default

async function api(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { _raw: text }; }
    return { status: res.status, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { status: 0, data: { error: `request aborted after ${REQUEST_TIMEOUT_MS}ms (REQUEST_TIMEOUT_MS env)` } };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function listScenarios() {
  const { status, data } = await api('/test/e2e-scenarios');
  if (status !== 200) throw new Error(`List failed: ${status} ${JSON.stringify(data).slice(0, 200)}`);
  return data.scenarios || [];
}

async function runOne(scenarioId) {
  // Long timeout — stress-200 with full cleanup can run 60s
  const t0 = Date.now();
  const { status, data } = await api('/test/e2e-matching', {
    method: 'POST',
    body: JSON.stringify({ scenario: scenarioId }),
  });
  const elapsedMs = Date.now() - t0;
  return { httpStatus: status, result: data, elapsedMs };
}

// ---- Output ----
function fmtMs(ms) {
  if (ms == null) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Compactly stringify a value, truncating large arrays/strings so output stays readable
function compactValue(v) {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.length <= 3) return JSON.stringify(v);
    return `[${JSON.stringify(v[0])}, …, ${JSON.stringify(v[v.length - 1])} (${v.length} items)]`;
  }
  if (v && typeof v === 'object') {
    const s = JSON.stringify(v);
    return s.length > 100 ? s.slice(0, 97) + '…' : s;
  }
  if (typeof v === 'string' && v.length > 60) return v.slice(0, 57) + '…';
  return JSON.stringify(v);
}

function printSteps(steps, indent = '  ') {
  if (!Array.isArray(steps)) return;
  for (const s of steps) {
    const icon = s.ok ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    const ms = c.dim + fmtMs(s.ms) + c.reset;
    const extras = Object.entries(s)
      .filter(([k]) => !['step', 'ok', 'ms', 'error'].includes(k))
      // Hide ids/tokens from output (they're already hashed in the row + clutter the screen)
      .filter(([k]) => k !== 'ids' && k !== 'tokens' && k !== 'sessionId' && k !== 'roundId')
      .map(([k, v]) => `${c.gray}${k}=${c.reset}${compactValue(v)}`)
      .join(' ');
    console.log(`${indent}${icon} ${s.step.padEnd(34)} ${ms}  ${extras}`);
    if (!s.ok && s.error) {
      console.log(`${indent}  ${c.red}${s.error}${c.reset}`);
    }
  }
}

function printResult(scenarioId, { httpStatus, result, elapsedMs }) {
  const passed = result?.success === true;
  const totalMs = result?.totalMs ?? elapsedMs;
  const head = passed
    ? `${c.green}PASS${c.reset}`
    : `${c.red}FAIL${c.reset}`;
  console.log(`\n${head}  ${c.bold}${scenarioId}${c.reset}  ${c.dim}(${result?.category || '?'} · ${fmtMs(totalMs)} · http ${httpStatus})${c.reset}`);
  if (result?.name) console.log(`${c.dim}  ${result.name}${c.reset}`);
  printSteps(result?.steps);
  if (!passed && result?.error) {
    console.log(`  ${c.red}${result.error}${c.reset}`);
  }
}

function summary(results) {
  const passed = results.filter(r => r.result?.success === true).length;
  const failed = results.length - passed;
  const totalMs = results.reduce((a, r) => a + (r.result?.totalMs ?? r.elapsedMs ?? 0), 0);

  console.log('\n' + '═'.repeat(70));
  console.log(`${c.bold}Summary${c.reset}: ${c.green}${passed} passed${c.reset}, ${failed > 0 ? c.red : c.dim}${failed} failed${c.reset}, total ${fmtMs(totalMs)}`);
  if (failed > 0) {
    console.log(`\n${c.red}Failed scenarios:${c.reset}`);
    for (const r of results) {
      if (!r.result?.success) {
        const failingStep = r.result?.steps?.find(s => !s.ok);
        const where = failingStep ? ` (step: ${failingStep.step})` : '';
        console.log(`  ${fail(r.scenarioId)}${where} — ${r.result?.error || 'unknown error'}`);
      }
    }
  }
  console.log('═'.repeat(70));
}

// ---- Main ----
async function main() {
  const args = process.argv.slice(2);
  console.log(`${c.dim}API: ${API_URL}${c.reset}`);

  // No args → list scenarios
  if (args.length === 0) {
    const scenarios = await listScenarios();
    const byCat = scenarios.reduce((acc, s) => {
      (acc[s.category] = acc[s.category] || []).push(s);
      return acc;
    }, {});
    for (const [cat, list] of Object.entries(byCat)) {
      console.log(`\n${c.bold}${c.cyan}${cat}${c.reset} (${list.length})`);
      for (const s of list) {
        console.log(`  ${c.green}${s.id.padEnd(28)}${c.reset} ${c.dim}${s.description}${c.reset}`);
      }
    }
    console.log(`\n${c.dim}Total: ${scenarios.length} scenarios${c.reset}`);
    console.log(`${c.dim}Run one:  node scripts/run-e2e-tests.mjs <id>${c.reset}`);
    console.log(`${c.dim}Run all:  node scripts/run-e2e-tests.mjs all${c.reset}`);
    console.log(`${c.dim}Filter:   node scripts/run-e2e-tests.mjs --category=Stress${c.reset}`);
    return;
  }

  // Resolve target list
  let targets = [];
  const filterArg = args.find(a => a.startsWith('--filter='));
  const categoryArg = args.find(a => a.startsWith('--category='));
  if (args[0] === 'all') {
    const scenarios = await listScenarios();
    targets = scenarios.map(s => s.id);
  } else if (filterArg) {
    const needle = filterArg.split('=')[1].toLowerCase();
    const scenarios = await listScenarios();
    targets = scenarios.filter(s => s.id.toLowerCase().includes(needle)).map(s => s.id);
  } else if (categoryArg) {
    const cat = categoryArg.split('=')[1];
    const scenarios = await listScenarios();
    targets = scenarios.filter(s => s.category.toLowerCase() === cat.toLowerCase()).map(s => s.id);
  } else {
    targets = args.filter(a => !a.startsWith('-'));
  }

  if (targets.length === 0) {
    console.error('No scenarios matched. Try `node scripts/run-e2e-tests.mjs` to list.');
    process.exit(1);
  }

  console.log(`${c.dim}Running ${targets.length} scenario${targets.length === 1 ? '' : 's'}: ${targets.join(', ')}${c.reset}`);

  const results = [];
  for (const id of targets) {
    try {
      const result = await runOne(id);
      results.push({ scenarioId: id, ...result });
      printResult(id, result);
    } catch (err) {
      console.log(`\n${fail(id)}  ${c.red}${err.message}${c.reset}`);
      results.push({ scenarioId: id, httpStatus: 0, result: { success: false, error: err.message }, elapsedMs: 0 });
    }
  }

  if (results.length > 1) summary(results);

  const allPassed = results.every(r => r.result?.success === true);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(`\n${c.red}Fatal error:${c.reset}`, err);
  process.exit(2);
});
