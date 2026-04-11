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

interface ContentIndex {
  vocabulary: Set<string>;
  grammar: Set<string>;
  characters: Set<string>;
  readings: Set<string>;
}

function buildContentIndex(packDir: string): ContentIndex {
  const index: ContentIndex = {
    vocabulary: new Set(),
    grammar: new Set(),
    characters: new Set(),
    readings: new Set(),
  };

  for (const file of jsonFiles(join(packDir, 'vocabulary'))) {
    const data = loadJSON(file) as Array<{ word?: string }>;
    if (Array.isArray(data)) {
      for (const entry of data) {
        if (entry?.word) index.vocabulary.add(entry.word);
      }
    }
  }

  for (const file of jsonFiles(join(packDir, 'grammar'))) {
    const data = loadJSON(file) as Array<{ title?: string; pattern?: string; id?: string }>;
    if (Array.isArray(data)) {
      for (const entry of data) {
        // Grammar cards are built with the format: `${title} (${pattern})`
        // See pack-data-loader.ts grammarToCards(). This is the ONLY valid front
        // for a grammar cardRef — matching anything else will silently fail
        // at SRS activation time.
        if (entry?.title && entry?.pattern) {
          index.grammar.add(`${entry.title} (${entry.pattern})`);
        }
      }
    }
  }

  for (const file of jsonFilesRecursive(join(packDir, 'characters'))) {
    const data = loadJSON(file) as Array<{ character?: string }>;
    if (Array.isArray(data)) {
      for (const entry of data) {
        if (entry?.character) index.characters.add(entry.character);
      }
    }
  }

  for (const file of jsonFiles(join(packDir, 'readings'))) {
    const data = loadJSON(file) as Array<{ id?: string; title?: string }>;
    if (Array.isArray(data)) {
      for (const entry of data) {
        if (entry?.id) index.readings.add(entry.id);
        if (entry?.title) index.readings.add(entry.title);
      }
    }
  }

  return index;
}

interface LessonData {
  id: string;
  items: Array<{ front: string; cardRef: { category: string; front: string } }>;
}

interface LessonMetaData {
  id: string;
  prerequisites: string[];
}

/**
 * Cross-reference lesson cardRefs against content files and check
 * prerequisites validity + id uniqueness. Lesson categories expected:
 *   - 'vocabulary' → word must exist in vocabulary/*.json
 *   - 'grammar'    → title/pattern/id must exist in grammar/*.json
 *   - 'characters' → character must exist in characters/**.json
 *   - 'reading'    → id/title must exist in readings/*.json
 *   - 'mixed'      → any of the above is accepted
 */
function crossValidateLessons(packDir: string) {
  const lessonsDir = join(packDir, 'lessons');
  if (!existsSync(lessonsDir)) return;

  const index = buildContentIndex(packDir);
  const lessonFiles = jsonFiles(lessonsDir).filter((f) => basename(f) !== 'index.json');

  // id uniqueness
  const ids = new Map<string, string>();
  for (const file of lessonFiles) {
    const data = loadJSON(file) as LessonData;
    if (ids.has(data.id)) {
      console.error(`  ❌ duplicate lesson id "${data.id}" in ${basename(file)} (also in ${basename(ids.get(data.id)!)})`);
      hasErrors = true;
    }
    ids.set(data.id, file);
  }

  // cardRef existence
  for (const file of lessonFiles) {
    const data = loadJSON(file) as LessonData;
    const missing: string[] = [];
    for (const item of data.items ?? []) {
      const ref = item.cardRef;
      if (!ref) continue;
      const pool =
        ref.category === 'vocabulary' ? index.vocabulary
        : ref.category === 'grammar'  ? index.grammar
        : ref.category === 'characters' ? index.characters
        : ref.category === 'reading'  ? index.readings
        : ref.category === 'mixed'    ? new Set([...index.vocabulary, ...index.grammar, ...index.characters, ...index.readings])
        : null;
      if (pool && !pool.has(ref.front)) {
        missing.push(`${ref.category}:"${ref.front}"`);
      }
    }
    if (missing.length > 0) {
      console.error(`  ❌ ${basename(file)}: ${missing.length} unresolved cardRef(s)`);
      for (const m of missing.slice(0, 5)) console.error(`     → ${m}`);
      if (missing.length > 5) console.error(`     … and ${missing.length - 5} more`);
      hasErrors = true;
    }
  }

  // prerequisites validity
  const indexPath = join(lessonsDir, 'index.json');
  if (existsSync(indexPath)) {
    const idx = loadJSON(indexPath) as { lessons: LessonMetaData[] };
    const knownIds = new Set(idx.lessons.map((l) => l.id));
    for (const meta of idx.lessons) {
      for (const prereq of meta.prerequisites ?? []) {
        if (!knownIds.has(prereq)) {
          console.error(`  ❌ lesson "${meta.id}" depends on unknown prerequisite "${prereq}"`);
          hasErrors = true;
        }
      }
    }
    // Check every lesson file is referenced in the index
    for (const file of lessonFiles) {
      const data = loadJSON(file) as LessonData;
      if (!knownIds.has(data.id)) {
        console.error(`  ❌ lesson file ${basename(file)} (id="${data.id}") not listed in index.json`);
        hasErrors = true;
      }
    }
  }
}

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

  // Cross-reference lessons against content files + check prerequisites + id uniqueness
  crossValidateLessons(packDir);

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
