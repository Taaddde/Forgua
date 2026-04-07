# Contributing to LinguaForge

Thank you for your interest in contributing to LinguaForge. This guide covers everything you need to get started.

## Prerequisites

- **Node.js 18+** and **npm 9+**
- **Rust** (only for desktop/Tauri development) -- [install here](https://www.rust-lang.org/tools/install)
- A modern browser (Chrome/Edge recommended)

## Setup

```bash
git clone https://github.com/taaddde/LinguaForge.git
cd LinguaForge
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

Verify the build compiles cleanly:

```bash
npm run build
npm run lint
npx tsc -b
```

## Project Structure

```
src/
  core/              Core engine (language-agnostic)
    engine/          SRS algorithm, scoring, speech, TTS, audio analysis
    adapters/        Writing system adapters (Japanese, Latin, etc.)
    components/      React components (layout, cards, exercises, progress, audio, reader, common)
    pages/           Route pages (Dashboard, Study, Learn, Browse, etc.)
    db/              IndexedDB schema and operations (Dexie.js)
    hooks/           React hooks (useSRS, useSpeech, useAudio, usePack, useProgress)
    store/           Zustand global state
    types/           TypeScript interfaces (pack-spec, adapter, models)
  packs/             Language Packs (JSON only, no code)
    japanese/        Japanese pack (manifest + data files)
  i18n/              UI translations (es.json, en.json)
  validation/        Zod schemas for pack validation
docs/                Documentation
public/              Static assets
```

## Ways to Contribute

### 1. Create a Language Pack

The highest-impact contribution. You do not need to write any TypeScript -- Language Packs are pure JSON. See [PACK_SPEC.md](PACK_SPEC.md) for the full specification.

Example packs we would love to see: Mandarin Chinese, Korean, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Hindi.

### 2. Improve Existing Packs

- Fix incorrect readings, meanings, or examples
- Add missing vocabulary, grammar points, or kanji
- Add new levels to existing packs
- Improve example sentences

### 3. Core Code

- Implement new exercise types
- Improve the SRS engine
- Add new writing system adapters
- Fix bugs and improve performance
- Improve accessibility

### 4. Translations

The UI uses i18next. Translation files are in `src/i18n/`. To add a new language:

1. Copy `src/i18n/en.json` to `src/i18n/[lang].json`
2. Translate all strings
3. Register the new locale in the i18n configuration

## Development Guidelines

### TypeScript

- **Strict mode is mandatory.** No `any` unless absolutely unavoidable.
- **No enums.** Use `as const` objects or union types instead.
- **Named exports only.** No default exports (except pages and App).
- **Explicit types.** Always type function parameters and return values.

### Components

- **Small and focused.** One file = one clear purpose.
- **Composable over monolithic.** Prefer composition.
- **Tailwind for styling.** No CSS modules, no styled-components. Only `index.css` for base styles.
- **i18n for all UI strings.** Never hardcode user-facing text. Use `useTranslation()`.

### File Naming

- `kebab-case.ts` for utilities, hooks, and non-component files
- `PascalCase.tsx` for React components
- Use the `@/` alias for imports from `src/`

### State Management

- **Zustand** for global state (`src/core/store/`)
- **useState/useReducer** for component-local state
- Never use React Context for state that could go in Zustand

## Architecture Rules

These are non-negotiable:

1. **Core is language-agnostic.** The `src/core/` directory never imports from `src/packs/`. All language-specific logic goes in adapters or packs.

2. **Packs are JSON-only.** Pack contributors never write TypeScript. Everything is declared in JSON and processed by the core engine.

3. **Lazy loading for adapters.** CJK adapters (Japanese, Chinese, Korean) are loaded via dynamic `import()` only when a pack from that family is selected. They are never statically imported.

4. **PWA first, Tauri second.** All features must work in the browser as a PWA. Tauri desktop support wraps the PWA -- it does not replace it.

5. **Stubs have TODOs.** Every stub file includes a descriptive comment: `// TODO: Fase X -- Description`.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add N4 vocabulary data for Japanese pack
fix: correct furigana rendering for compound kanji
docs: update pack specification with reading schema
refactor: extract SRS calculation into standalone module
test: add unit tests for SM-2 ease factor calculation
chore: update dependencies
```

Scope is optional but recommended:

```
feat(pack-ja): add N3 grammar points
fix(srs): handle edge case when ease factor hits minimum
feat(exercise): implement drag-reorder exercise type
```

## Testing

```bash
npx vitest              # Run all tests (watch mode)
npx vitest run          # Run all tests once
npx vitest run srs      # Run tests matching "srs"
```

Write tests for:
- SRS engine logic (critical path)
- Pack validation schemas
- Adapter tokenization and matching
- Utility functions

Tests live next to the code they test or in a `__tests__/` directory.

## Pack Validation

Before submitting a pack or pack changes, validate against the Zod schema:

```bash
npm run validate-pack -- --pack src/packs/japanese
```

This checks:
- `manifest.json` structure and required fields
- Vocabulary, grammar, character, and reading files
- Roadmaps and resources
- Cross-references between levels and data files

## Pull Request Process

1. **Fork the repository** and create a branch from `main`.
2. **Make your changes** following the guidelines above.
3. **Run the full check suite:**
   ```bash
   npm run lint
   npx tsc -b
   npx vitest run
   npm run build
   ```
4. **Validate packs** if you modified any pack data:
   ```bash
   npm run validate-pack -- --pack src/packs/[pack-name]
   ```
5. **Write a clear PR description** explaining what changed and why.
6. **One concern per PR.** Do not mix unrelated changes.

### PR Title Format

```
feat: short description of the change
fix: what was broken and how it was fixed
docs: what documentation was added or updated
```

## Code of Conduct

Be respectful, constructive, and inclusive. We are building a learning tool -- the community around it should reflect that spirit.

- Be welcoming to newcomers
- Give and receive feedback gracefully
- Focus on what is best for learners and the project
- No harassment, discrimination, or personal attacks

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
