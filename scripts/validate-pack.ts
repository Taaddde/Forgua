/**
 * Validate Language Pack JSON files against Zod schemas.
 *
 * Usage:
 *   npm run validate-pack              # validate all packs in src/packs/
 *   npm run validate-pack -- japanese  # validate a specific pack
 *
 * Discovers packs automatically — no changes needed when adding a new pack.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateManifest, validateVocabulary, validateGrammar,
  validateCharacters, validateReadings, validateRoadmaps,
  validateResources, validateLessonIndex, validateLesson,
} from '../src/validation/pack-schema';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PACKS_DIR = resolve(__dirname, '../src/packs');

let hasErrors = false;
let totalChecked = 0;
let totalPacks = 0;

// ── Helpers ────────────────────────────────────────────────────────────────

function loadJSON(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function entryCount(data: unknown): string {
  return Array.isArray(data) ? `${data.length} entries` : '1 object';
}

function check(label: string, result: { success: boolean; error?: unknown }) {
  totalChecked++;
  if (result.success) {
    console.log(`  ✅ ${label}`);
    return;
  }

  console.error(`  ❌ ${label}`);
  hasErrors = true;

  const err = result.error as { issues?: Array<{ path: (string | number)[]; message: string }> };
  if (err?.issues) {
    const shown = err.issues.slice(0, 5);
    for (const issue of shown) {
      const path = issue.path.length ? issue.path.join('.') : '(root)';
      console.error(`     → [${path}] ${issue.message}`);
    }
    if (err.issues.length > 5) {
      console.error(`     … and ${err.issues.length - 5} more issue(s)`);
    }
  } else {
    console.error(JSON.stringify(err, null, 2));
  }
}

/** Return all JSON files directly inside a directory (non-recursive). */
function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((f: string) => join(dir, f))
    .filter((f: string) => statSync(f).isFile() && f.endsWith('.json'));
}

/** Return all JSON files inside a directory tree (recursive). */
function jsonFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...jsonFilesRecursive(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

// ── Per-pack validation ────────────────────────────────────────────────────

function validatePack(packDir: string) {
  const packName = basename(packDir);
  console.log(`\n📦  ${packName}\n${'─'.repeat(50)}`);
  totalPacks++;

  // manifest.json — required
  const manifestPath = join(packDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('  ❌ manifest.json not found — skipping pack');
    hasErrors = true;
    return;
  }
  check('manifest.json', validateManifest(loadJSON(manifestPath)));

  // vocabulary/*.json
  for (const file of jsonFiles(join(packDir, 'vocabulary'))) {
    const data = loadJSON(file);
    check(`${relative(packDir, file)} (${entryCount(data)})`, validateVocabulary(data));
  }

  // grammar/*.json
  for (const file of jsonFiles(join(packDir, 'grammar'))) {
    const data = loadJSON(file);
    check(`${relative(packDir, file)} (${entryCount(data)})`, validateGrammar(data));
  }

  // characters/**/*.json  (recursive — covers subdirs like kanji/)
  for (const file of jsonFilesRecursive(join(packDir, 'characters'))) {
    const data = loadJSON(file);
    check(`${relative(packDir, file)} (${entryCount(data)})`, validateCharacters(data));
  }

  // readings/*.json
  for (const file of jsonFiles(join(packDir, 'readings'))) {
    const data = loadJSON(file);
    check(`${relative(packDir, file)} (${entryCount(data)})`, validateReadings(data));
  }

  // lessons/index.json + lessons/*.json
  const lessonsDir = join(packDir, 'lessons');
  const indexPath = join(lessonsDir, 'index.json');
  if (existsSync(indexPath)) {
    check('lessons/index.json', validateLessonIndex(loadJSON(indexPath)));
  }
  for (const file of jsonFiles(lessonsDir)) {
    if (basename(file) === 'index.json') continue;
    check(`${relative(packDir, file)}`, validateLesson(loadJSON(file)));
  }

  // roadmaps.json — optional
  const roadmapsPath = join(packDir, 'roadmaps.json');
  if (existsSync(roadmapsPath)) {
    const data = loadJSON(roadmapsPath);
    check(`roadmaps.json (${entryCount(data)})`, validateRoadmaps(data));
  }

  // resources.json — optional
  const resourcesPath = join(packDir, 'resources.json');
  if (existsSync(resourcesPath)) {
    const data = loadJSON(resourcesPath);
    check(`resources.json (${entryCount(data)})`, validateResources(data));
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const targetPack = process.argv[2];

if (targetPack) {
  const packDir = join(PACKS_DIR, targetPack);
  if (!existsSync(packDir) || !statSync(packDir).isDirectory()) {
    console.error(`❌ Pack not found: "${targetPack}" (looked in ${PACKS_DIR})`);
    process.exit(1);
  }
  validatePack(packDir);
} else {
  if (!existsSync(PACKS_DIR)) {
    console.error(`❌ Packs directory not found: ${PACKS_DIR}`);
    process.exit(1);
  }
  const packs = readdirSync(PACKS_DIR)
    .map((f: string) => join(PACKS_DIR, f))
    .filter((f: string) => statSync(f).isDirectory());

  if (packs.length === 0) {
    console.error('No packs found in src/packs/');
    process.exit(1);
  }

  for (const packDir of packs) {
    validatePack(packDir);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`Checked ${totalChecked} file(s) across ${totalPacks} pack(s)`);

if (hasErrors) {
  console.error('❌ Validation failed!\n');
  process.exit(1);
} else {
  console.log('✅ All pack data valid!\n');
}
