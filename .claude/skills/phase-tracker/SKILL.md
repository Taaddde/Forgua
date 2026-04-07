---
name: phase-tracker
description: "Track LinguaForge project progress across implementation phases. Use when the user asks about project status, what's done, what's next, phase progress, roadmap status, or 'where are we'. Also trigger on 'what phase are we in', 'what's left to do', 'next steps', or 'project status'."
---

# Phase Tracker

Reports the current state of LinguaForge's implementation and identifies next steps.

## How to assess current state

Read key files to determine what's implemented vs. stubbed:

1. **Check which files exist** — `find src -name "*.ts" -o -name "*.tsx" | sort`
2. **Check for TODO markers** — `grep -r "TODO: Fase" src/ --include="*.ts" --include="*.tsx" | sort`
3. **Check if build passes** — `npx tsc -b`
4. **Check package.json** — which dependencies are installed

## Phase definitions and checklist

### Fase 1: Core Foundation ✅
- [x] Vite + React + TypeScript + Tailwind setup
- [x] All core dependencies installed
- [x] TypeScript interfaces complete (pack-spec.ts, adapter.ts, models.ts)
- [x] IndexedDB schema with Dexie (database.ts)
- [x] Zustand store (useAppStore.ts)
- [x] Adapter registry with lazy loading
- [x] LatinAdapter implemented
- [x] JapaneseAdapter stub
- [x] Layout: Sidebar + Header + Router + all pages
- [x] PackSelector screen
- [x] i18n (es + en)
- [x] Zod validation schema
- [x] Japanese manifest.json
- [x] PWA manifest + service worker
- [x] Dark theme with Tailwind
- [x] Build compiles clean

### Fase 2: Motor SRS + Ejercicios
- [ ] SM-2 algorithm in `src/core/engine/srs.ts`
- [ ] Scoring logic in `src/core/engine/scoring.ts`
- [ ] `useSRS` hook — review queue, new cards, submit review
- [ ] `useProgress` hook — stats, history, daily goal
- [ ] FlashCard component
- [ ] MultipleChoice component
- [ ] WriteAnswer component
- [ ] FillBlank component
- [ ] Dashboard with real progress data
- [ ] Study page with review flow
- [ ] Session summary after review
- [ ] Unit tests for SM-2

### Fase 3: Pack Japonés — Kana + N5
- [ ] Install kuromoji, kuroshiro, wanakana
- [ ] JapaneseAdapter complete implementation
- [ ] Hiragana data (characters/hiragana.json)
- [ ] Katakana data (characters/katakana.json)
- [ ] Kanji N5 data (characters/kanji/n5.json)
- [ ] Vocabulary N5 data (vocabulary/n5.json)
- [ ] Grammar N5 data (grammar/n5.json)
- [ ] CharacterDraw component
- [ ] Reader with furigana toggle
- [ ] Browse page with filters
- [ ] Seeds: load pack data into IndexedDB

### Fase 4: Audio + Pronunciación
- [ ] `useSpeech` hook — Web Speech API (STT)
- [ ] `useAudio` hook — SpeechSynthesis (TTS)
- [ ] SpeakExercise component
- [ ] Dictation component
- [ ] Pitch accent visualization
- [ ] Browser compatibility disclaimer
- [ ] Audio playback controls

### Fase 5: Contenido + Rutas
- [ ] Grammar N5 complete with exercises
- [ ] DragReorder, Matching, ReadingQuiz components
- [ ] Content N4-N3
- [ ] Roadmap page with interactive phases
- [ ] Export/Import user data
- [ ] Reading page with graded texts

### Fase 6: Tauri + Pulido
- [ ] Tauri 2.0 wrapper setup
- [ ] Build executables (Win/Mac/Linux)
- [ ] GitHub Actions CI
- [ ] PACK_CREATOR_PROMPT.md
- [ ] CONTRIBUTING.md
- [ ] PACK_SPEC.md

### Fase 7: Expansión
- [ ] N2-N1 content
- [ ] Second pack (Korean or English)
- [ ] Advanced statistics
- [ ] Multi-pack validation

## Report format

```
📊 LinguaForge Project Status

Current Phase: Fase X — [Name]
Overall Progress: XX%

✅ Completed Phases:
  - Fase 1: Core Foundation

🔧 Current Phase: Fase 2 — Motor SRS + Ejercicios
  - [x] SM-2 algorithm implemented
  - [ ] FlashCard component (next up)
  - [ ] MultipleChoice component
  Progress: 2/12 tasks (17%)

📋 Next Steps (priority order):
  1. Implement SM-2 in srs.ts
  2. Create FlashCard component
  3. Wire up useSRS hook

⚠️ Blockers: None
```
