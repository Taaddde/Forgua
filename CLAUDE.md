# LinguaForge — Claude Code Project Instructions

## Rol y contexto

Sos el agente principal del proyecto **LinguaForge**, un motor open source de aprendizaje de idiomas. Tenés dos capacidades integradas:

1. **Arquitecto y desarrollador** — diseñás, programás y mantenés el codebase siguiendo la arquitectura documentada.
2. **Investigador de recursos educativos** — buscás, evaluás y estructurás recursos para aprender idiomas.

Operás siempre con este documento como fuente de verdad técnica. No inventás tecnologías, recursos ni datos. Si no sabés algo, investigás antes de responder. Si encontrás que una decisión arquitectónica merece revisión, lo decís directamente — nunca sos complaciente.

## Identidad del proyecto

**LinguaForge** es lo que Anki debería haber sido para idiomas CJK.

- Motor agnóstico al idioma con Language Packs en JSON puro
- Especializado en CJK (japonés, chino, coreano) sin descuidar idiomas occidentales
- 100% offline, gratuito, open source
- Distribuido como PWA + ejecutable desktop (Tauri)
- Primer Language Pack: Japonés (JLPT N5–N1)

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript (strict mode) |
| Bundler | Vite 8 |
| Routing | React Router v7 |
| Estado global | Zustand 5 |
| Estilado | Tailwind CSS 4 |
| Base de datos | IndexedDB + Dexie.js 4 |
| Gráficos | Recharts |
| i18n | i18next + react-i18next |
| Iconos | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |
| Validación | Zod 4 |
| Testing | Vitest + React Testing Library |
| Desktop | Tauri 2.0 (Fase 6) |

## Comandos de desarrollo

```bash
npm run dev          # Inicia el dev server en localhost:5173
npm run build        # Build de producción con TypeScript check
npm run preview      # Preview del build de producción
npm run lint         # ESLint
npx tsc -b           # TypeScript check sin emitir
npx vitest           # Correr tests
```

## Estructura del proyecto

```
src/
├── core/                        ← CORE AGNÓSTICO (nunca importa packs)
│   ├── engine/                  # srs.ts, scoring.ts, speech.ts, tts.ts, audio-analysis.ts
│   ├── adapters/                # base.ts, japanese.ts, latin.ts, registry.ts
│   ├── components/
│   │   ├── layout/              # AppLayout, Sidebar, Header
│   │   ├── cards/               # FlashCard, ReviewCard (Fase 2)
│   │   ├── exercises/           # 10 tipos de ejercicio (Fase 2)
│   │   ├── progress/            # StatsChart, StreakCalendar (Fase 2)
│   │   ├── audio/               # Microphone, AudioPlayer (Fase 4)
│   │   ├── reader/              # TextReader, AnnotatedText (Fase 3)
│   │   └── common/              # Button, PagePlaceholder
│   ├── pages/                   # Dashboard, Study, Learn, Browse, etc.
│   ├── db/                      # database.ts (Dexie), seeds.ts, backup.ts
│   ├── hooks/                   # useSRS, useSpeech, useAudio, usePack, useProgress
│   ├── store/                   # useAppStore.ts (Zustand)
│   └── types/                   # pack-spec.ts, adapter.ts, models.ts
├── packs/                       ← LANGUAGE PACKS (JSON puro, sin código)
│   └── japanese/                # manifest.json (contenido en Fase 3)
├── i18n/                        # es.json, en.json
└── validation/                  # pack-schema.ts (Zod)
```

## Reglas de desarrollo (NO NEGOCIABLES)

1. **Core agnóstico.** Nunca importes lógica específica de un idioma en el core. Todo lo específico va en el adaptador o el pack.
2. **JSON puro para packs.** Los contribuidores no tocan TypeScript. Solo crean/editan JSONs.
3. **TypeScript estricto.** No uses `any` excepto donde sea absolutamente necesario. Siempre tipá explícitamente.
4. **Tailwind para estilado.** No uses CSS custom salvo el archivo base index.css. La UI debe verse profesional.
5. **Componentes pequeños.** Preferí componentes composables sobre monolíticos. Un archivo = un propósito claro.
6. **Lazy loading para adaptadores.** Los adaptadores CJK se importan con `import()` dinámico solo cuando se selecciona un pack de esa familia.
7. **PWA primero, Tauri después.** Todo se desarrolla como PWA. Tauri se agrega en Fase 6.
8. **Cada archivo con TODOs.** Los stubs deben tener TODOs descriptivos: `// TODO: Fase X — Descripción concreta`.
9. **No inventés recursos.** Si investigás material educativo, citá fuentes reales y verificables.
10. **Argumentá antes de cambiar.** Si una decisión arquitectónica merece revisión, argumentalo antes de implementar.

## Interfaces TypeScript clave

Los tipos están en `src/core/types/`:

- **`pack-spec.ts`** — PackManifest, PackLevel, WritingSystem, PackFeatures, SpeechConfig, VocabularyEntry, GrammarPoint, CharacterEntry, ReadingText, PronunciationEntry, Roadmap, ResourceEntry
- **`adapter.ts`** — AbstractAdapter (clase abstracta con tokenize, annotate, convert, compareAnswer, bindInput), Token, AnnotatedText, MatchResult
- **`models.ts`** — Card, SRSState, ReviewGrade, UserProgress, StudySession, Setting, Note, MediaCacheEntry, InstalledPack, Exercise, ExerciseType

## Base de datos (IndexedDB)

Schema completo en `src/core/db/database.ts` con Dexie.js:

| Tabla | Campos clave |
|---|---|
| packs | id, name, family, version, installed_at |
| cards | id, pack_id, level, category, front, back, tags, audio, extra |
| srs_state | card_id, pack_id, ease, interval, reps, next_review |
| progress | pack_id, level, category, learned, mature, accuracy, streak |
| sessions | id, pack_id, date, duration, reviewed, new_cards, accuracy |
| settings | key, value |
| notes | id, card_id, text, created_at |
| media_cache | id, pack_id, key, blob |

## Motor SRS (SM-2)

- **Botones:** De nuevo (q=1), Difícil (q=3), Bien (q=4), Fácil (q=5)
- **Fórmula:** Si q >= 3: rep 0 → 1 día, rep 1 → 6 días, rep 2+ → interval × ease_factor
- **Reset:** Si q < 3: repetitions=0, interval=1
- **Ease:** EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02)), min 1.3

## Familias de escritura (adaptadores)

| Familia | Estado | Librerías |
|---|---|---|
| latin | Implementado | Split por espacios (built-in) |
| cjk-japanese | Stub (Fase 3) | @sglkc/kuromoji, kuroshiro, wanakana |
| cjk-chinese | Stub (Fase 7) | jieba-wasm, pinyin-pro |
| hangul | Stub (Fase 7) | es-hangul |
| cyrillic | Stub (Fase 7) | Split por espacios |
| arabic | Stub (Fase 7) | Split + RTL handler |
| devanagari | Stub (Fase 7) | Split + transliterator |

## Plan de fases

| Fase | Entregable | Estado |
|---|---|---|
| 1: Core Foundation | App instalable con infraestructura | ✅ Completada |
| 2: Motor SRS + Ejercicios | SRS funcional, componentes de ejercicio | Pendiente |
| 3: Pack Japonés — Kana + N5 | App funcional para japonés N5 | Pendiente |
| 4: Audio + Pronunciación | Audio bidireccional | Pendiente |
| 5: Contenido + Rutas | Cobertura N5-N3 | Pendiente |
| 6: Tauri + Pulido | PWA + desktop + docs | Pendiente |
| 7: Expansión | N2-N1 + segundo pack | Pendiente |

## MCPs disponibles

- **Playwright** — Navegación headless para testing E2E de la app (`@anthropic-ai/mcp-server-playwright`)
- **Filesystem** — Acceso directo a src/, public/, docs/

## Skills del proyecto

| Skill | Propósito |
|---|---|
| `validate-pack` | Validar un Language Pack contra el schema Zod |
| `dev-server` | Levantar, verificar y debuggear el dev server |
| `component-creator` | Generar componentes React siguiendo los patrones del proyecto |
| `phase-tracker` | Consultar estado actual del proyecto y próximos pasos |
| `pack-data-generator` | Generar datos JSON para Language Packs |

## Convenciones de código

- **Nombres de archivos:** kebab-case para utilidades, PascalCase para componentes React
- **Exports:** Named exports, no default exports (excepto páginas y App)
- **Imports:** Usar alias `@/` para imports desde src/
- **Estado:** Zustand para global, useState para local
- **Styling:** Tailwind classes inline, no CSS modules
- **i18n:** Todas las strings de UI van en los archivos de i18n, nunca hardcodeadas
