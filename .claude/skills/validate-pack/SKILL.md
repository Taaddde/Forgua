---
name: validate-pack
description: "Validate a Forgua Language Pack against the Zod schema. Use whenever the user mentions validating a pack, checking pack JSON files, testing pack structure, or when creating/editing Language Pack data files. Also trigger when reviewing a PR that modifies files under src/packs/."
---

# Validate Language Pack

Validates a Language Pack's JSON files against Forgua's Zod schemas.

## What this skill does

1. Reads the pack's `manifest.json` and validates it against `PackManifestSchema`
2. Checks that all referenced level files exist
3. Validates vocabulary, grammar, and character JSON files against their schemas
4. Reports errors clearly with file path, field name, and expected value
5. Ensures no executable code (.js, .ts) exists in the pack folder

## How to validate

### Step 1: Identify the pack

The pack is a folder under `src/packs/[language]/`. The user will specify which pack, or default to `japanese`.

### Step 2: Run validation

Use Node.js to run the Zod validation inline. Do NOT rely on a separate script existing — write the validation logic directly:

```typescript
import { PackManifestSchema } from '../../src/validation/pack-schema';
import manifest from '../../src/packs/[language]/manifest.json';

const result = PackManifestSchema.safeParse(manifest);
if (!result.success) {
  console.error('Manifest validation failed:');
  console.error(result.error.format());
} else {
  console.log('✅ Manifest is valid');
}
```

### Step 3: Check file structure

Verify that:
- `manifest.json` exists and is valid JSON
- Every level in `manifest.levels` has corresponding files in `vocabulary/`, `grammar/`, etc.
- No `.js`, `.ts`, `.jsx`, `.tsx` files exist in the pack folder
- All JSON files are valid (parseable)

### Step 4: Report results

Format output as:
```
Pack: japanese (日本語)
Family: cjk-japanese
Version: 1.0.0

✅ manifest.json — valid
✅ File structure — complete
⚠️ vocabulary/n5.json — missing (expected for level n5)
❌ grammar/n5.json — invalid: field 'pattern' required

Summary: 2 passed, 1 warning, 1 error
```

## Validation schemas location

All Zod schemas are in `src/validation/pack-schema.ts`. The main schemas are:
- `PackManifestSchema` — validates manifest.json
- `VocabularyEntrySchema` — validates vocabulary entries
- `GrammarPointSchema` — validates grammar points

## Important notes

- A pack in Phase 1 only has `manifest.json` — missing content files are warnings, not errors
- The `extra` field in vocabulary/grammar is a free-form object — don't validate its contents
- `aiGenerated: true` packs should be flagged for human review
