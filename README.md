# Forgua

**The open source language learning engine built for serious learners.**

Forgua is a free, open-source language learning engine built for serious learners. It combines spaced repetition (SM-2), 10+ exercise types, native furigana support, and community-driven Language Packs -- all running 100% offline as a PWA or desktop app.

## Features

- **Spaced Repetition (SM-2)** -- Proven algorithm with Again / Hard / Good / Easy grading
- **10+ Exercise Types** -- Flashcards, multiple choice, writing, dictation, drag-reorder, fill-in-the-blank, matching, reading quizzes, character drawing, and speech
- **CJK First-Class Support** -- Furigana, pitch accent, romaji-to-kana input conversion, morphological tokenization
- **Language Packs in JSON** -- No code required. Create packs by editing JSON files
- **100% Offline** -- All data stays in your browser (IndexedDB). No account needed
- **PWA + Desktop** -- Install from the browser or download the Tauri desktop app
- **Progress Tracking** -- Charts, streaks, accuracy stats, study session history
- **Multi-Language UI** -- Interface available in Spanish and English (i18next)
- **Extensible Adapters** -- Writing system adapters for Japanese, Chinese, Korean, Latin, Cyrillic, Arabic, and Devanagari

## Quick Start

```bash
git clone https://github.com/taaddde/Forgua.git
cd Forgua
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

### Other Commands

```bash
npm run build        # Production build with TypeScript check
npm run preview      # Preview production build
npm run lint         # Run ESLint
npx vitest           # Run tests
```

### Desktop App (Tauri)

Requires [Rust](https://www.rust-lang.org/tools/install) and [Tauri 2.0 prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
npm run tauri dev     # Development
npm run tauri build   # Production binary
```

## Available Language Packs

| Pack | Levels | Content | Status |
|------|--------|---------|--------|
| Japanese (日本語) | JLPT N5, N4, N3 | Vocabulary, grammar, kanji, hiragana, katakana, readings | Complete |
| Japanese (日本語) | JLPT N2, N1 | Vocabulary, grammar, kanji, readings | Planned |

Want to add a language? See the [Pack Specification](docs/PACK_SPEC.md) and [Create Your Own Pack](docs/PACK_SPEC.md#creating-a-new-pack).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript (strict) |
| Bundler | Vite 8 |
| Routing | React Router v7 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Database | IndexedDB via Dexie.js 4 |
| Charts | Recharts |
| i18n | i18next + react-i18next |
| Icons | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |
| Validation | Zod 4 |
| Testing | Vitest + React Testing Library |
| Desktop | Tauri 2.0 |

## Contributing

We welcome contributions of all kinds -- Language Packs, translations, bug fixes, and new features. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome / Edge | Best (recommended) |
| Firefox | Full support |
| Safari | Full support |
| Mobile Chrome / Safari | Full PWA support |

Chrome and Edge provide the best experience for speech recognition and TTS features.

## License

[MIT](LICENSE)
