# Changelog

All notable changes to Forgua will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-08

### Added

**Core Engine**
- SM-2 spaced repetition algorithm with Again / Hard / Good / Easy grading
- 10+ exercise types: Flashcard, Multiple Choice, Fill in the Blank, Drag Reorder, Matching, Dictation, Write Answer, Sentence Build, Read Aloud, Speak
- Language-agnostic adapter system with writing system abstraction
- Japanese adapter with furigana, romaji, pitch accent, and morphological tokenization (kuromoji)
- Latin adapter for space-delimited languages

**Language Packs**
- Japanese pack: JLPT N5, N4, N3 — vocabulary, grammar, kanji, hiragana, katakana, readings, lessons
- Japanese pack: JLPT N2, N1 — vocabulary, grammar, kanji, readings (planned content)
- English pack: basic vocabulary and grammar (placeholder)

**App**
- Progressive Web App (PWA) with full offline support via Workbox
- Desktop app via Tauri 2.0 for macOS, Windows, and Linux
- 11 pages: Dashboard, Study, Lessons, Explore, Reading, Listening, Speaking, Writing, Roadmap, Settings, Pack Selector
- Progress tracking with charts (Recharts), streaks, accuracy stats
- IndexedDB storage via Dexie.js with backup and restore
- UI available in English and Spanish (i18next)
- Lesson player with step-by-step guided learning
- Text reader with inline annotations
- Audio system: TTS playback and speech recognition (STT)
- Stroke order animator and prosody diagram for CJK characters

**Developer**
- Zod validation schema for Language Packs
- Pack validation script (`npm run validate-pack`)
- End-to-end tests with Playwright
- Unit tests with Vitest + React Testing Library
- Strict TypeScript throughout

[0.1.0]: https://github.com/taaddde/Forgua/releases/tag/v0.1.0
