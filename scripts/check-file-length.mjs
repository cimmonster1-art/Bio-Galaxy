#!/usr/bin/env node
/**
 * Architecture guard: enforce a 500-line cap on source files.
 *
 * Legacy files that already exceeded the cap when this check was introduced
 * are frozen at their current size — they cannot GROW, but they don't block CI.
 * Add an entry to LEGACY_BUDGETS below if an existing file needs freezing.
 *
 * Usage: node scripts/check-file-length.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_LINES = 500;
const SCAN_DIRS = ['src'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const EXCLUDE = new Set(['node_modules', 'dist', '.git', '__tests__']);

// Files that already exceeded the cap when this guard was introduced.
// Format: 'relative/path/from/root': frozenLineCount
// They may not grow beyond their frozen count, but they don't fail the build.
const LEGACY_BUDGETS = {};

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) yield full;
  }
}

let failures = 0;

for (const scanDir of SCAN_DIRS) {
  for await (const file of walk(scanDir)) {
    const rel = file.replace(/\\/g, '/');
    const content = await readFile(file, 'utf8');
    const lines = content.split('\n').length;
    const frozen = LEGACY_BUDGETS[rel];

    if (frozen !== undefined) {
      if (lines > frozen) {
        console.error(`[check-file-length] FROZEN FILE GREW: ${rel} (${lines} lines, frozen at ${frozen})`);
        failures++;
      }
    } else if (lines > MAX_LINES) {
      console.error(`[check-file-length] TOO LONG: ${rel} (${lines} lines, max ${MAX_LINES})`);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n[check-file-length] ${failures} file(s) exceed the line cap. Split them before merging.`);
  process.exit(1);
} else {
  console.log(`[check-file-length] All files within the ${MAX_LINES}-line cap.`);
}
