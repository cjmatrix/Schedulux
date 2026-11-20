#!/usr/bin/env node
/**
 * Schedulux Load Test Runner CLI
 * Wraps k6 execution with automated token injection, results directory management, and clear summary output.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateTestTenantToken } from './utils/token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(__dirname, 'results');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const SCENARIOS = {
  'core:ramp': 'scenarios/01-core-availability-ramp.js',
  'core:spike': 'scenarios/02-core-booking-spike.js',
  'chat:mocked': 'scenarios/03-chat-mocked-ramp.js',
  'chat:live': 'scenarios/04-chat-live-smoke.js',
};

const target = process.argv[2] || 'core:ramp';

if (target === '--help' || target === '-h') {
  console.log('='.repeat(70));
  console.log('🚀 SCHEDULUX LOAD TEST RUNNER');
  console.log('='.repeat(70));
  console.log('\nUsage: node loadtests/run.js <scenario> [k6 options]');
  console.log('\nAvailable standard scenarios:');
  Object.keys(SCENARIOS).forEach((k) => console.log(`  - ${k.padEnd(14)} -> ${SCENARIOS[k]}`));
  console.log('\nExamples:');
  console.log('  node loadtests/run.js core:ramp');
  console.log('  node loadtests/run.js chat:mocked --duration 30s');
  console.log('  node loadtests/run.js chat:live --vus 2 --duration 15s');
  process.exit(0);
}

const scenarioFile = SCENARIOS[target] || target;
const fullPath = path.isAbsolute(scenarioFile) ? scenarioFile : path.join(__dirname, scenarioFile);

if (!fs.existsSync(fullPath)) {
  console.error(`\n❌ Error: Scenario file not found: ${fullPath}`);
  console.log('\nAvailable standard scenarios:');
  Object.keys(SCENARIOS).forEach((k) => console.log(`  - ${k.padEnd(14)} -> ${SCENARIOS[k]}`));
  process.exit(1);
}

// Generate valid JWT token for authenticated endpoints
const tenantToken = generateTestTenantToken();

console.log('='.repeat(70));
console.log(`🚀 SCHEDULUX LOAD TEST RUNNER: ${target}`);
console.log('='.repeat(70));
console.log(`• Script:         ${path.relative(ROOT_DIR, fullPath)}`);
console.log(`• Results Dir:    ${path.relative(ROOT_DIR, RESULTS_DIR)}`);
console.log(`• Tenant ID:      ${process.env.TENANT_ID || 'tnt_Qb012pyfTyZDwW1ctXTF6'}`);
console.log(`• Core Gateway:   ${process.env.CORE_GATEWAY_URL || 'http://localhost:5000'}`);
console.log(`• Customer GW:    ${process.env.CUSTOMER_GATEWAY_URL || 'http://localhost:5001'}`);
console.log('='.repeat(70) + '\n');

// Forward remaining CLI arguments to k6 (e.g. --duration, -u, etc.)
const extraArgs = process.argv.slice(3);

const env = {
  ...process.env,
  TENANT_TOKEN: tenantToken,
};

const k6Process = spawn('k6', ['run', fullPath, ...extraArgs], {
  stdio: 'inherit',
  env,
  cwd: ROOT_DIR,
});

k6Process.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Load test completed successfully! Reports saved in loadtests/results/');
  } else {
    console.error(`\n⚠️  Load test exited with code ${code}. Check threshold breaches or server logs above.`);
  }
  process.exit(code);
});
