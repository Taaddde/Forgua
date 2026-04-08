---
name: pack-data-generator
description: "Generate JSON data files for Forgua Language Packs. Use when the user asks to create vocabulary data, grammar points, character data, reading passages, or any content for a Language Pack. Also trigger on 'generate N5 vocabulary', 'create grammar data', 'add kanji data', 'fill in the pack', or 'create content for [language]'."
---

# Pack Data Generator

Generates JSON data files that conform to the Forgua Pack Spec.

## Critical rules

1. **No executable code.** Packs are JSON only. Never generate .ts or .js files inside a pack.
2. **Follow the schema exactly.** Every field must match the types in `src/core/types/pack-spec.ts`.
3. **Mark AI-generated content.** Set `aiGenerated: true` in the manifest. Add a comment in the PR.
4. **Verify accuracy.** Cross-check vocabulary readings, meanings, and grammar explanations. Flag anything uncertain.
5. **Use real data sources.** For Japanese: JLPT official word lists, JMdict, KANJIDIC. Don't invent words.

## File schemas

### vocabulary/[level].json

```json
[
  {
    "word": "食べる",
    "reading": "たべる",
    "meanings": ["comer", "to eat"],
    "pos": "verb-ichidan",
    "level": "n5",
    "tags": ["food", "daily"],
    "examples": [
      {
        "ja": "毎日ごはんを食べます。",
        "reading": "まいにちごはんをたべます。",
        "translation": "Como arroz todos los días."
      }
    ],
    "audio": "n5/taberu.mp3",
    "extra": {
      "pitchAccent": { "pattern": [0,1,0], "type": "nakadaka" }
    }
  }
]
```

**Required fields:** word, reading, meanings (min 1), pos, level, tags, examples (min 1)
**Optional fields:** audio, extra

**Part-of-speech tags:** noun, verb-ichidan, verb-godan, adjective-i, adjective-na, adverb, particle, conjunction, counter, prefix, suffix, expression

### grammar/[level].json

```json
[
  {
    "id": "n5-grammar-001",
    "title": "〜は〜です",
    "pattern": "Noun は Noun です",
    "meaning": "A es B (afirmación básica)",
    "level": "n5",
    "explanation": "La partícula は (wa) marca el tema de la oración. です (desu) es la cópula formal equivalente a 'ser/estar'.",
    "examples": [
      {
        "sentence": "私は学生です。",
        "reading": "わたしはがくせいです。",
        "translation": "Yo soy estudiante.",
        "breakdown": ["私(わたし) = yo", "は = partícula de tema", "学生(がくせい) = estudiante", "です = ser/estar"]
      }
    ],
    "notes": "は se pronuncia 'wa' cuando funciona como partícula de tema.",
    "related": ["n5-grammar-002"],
    "tags": ["basic", "copula"]
  }
]
```

**Required fields:** id, title, pattern, meaning, level, explanation, examples (min 1 with sentence + translation)
**Optional fields:** notes, related, tags, breakdown in examples

### characters/[system].json (e.g., hiragana.json)

```json
[
  {
    "character": "あ",
    "readings": [{ "type": "romaji", "value": "a" }],
    "meanings": ["a (vowel)"],
    "strokeCount": 3,
    "strokeOrder": "M10,20 L30,20...",
    "level": "n5",
    "tags": ["vowel", "basic"],
    "examples": [
      { "word": "あめ", "reading": "ame", "meaning": "rain" }
    ]
  }
]
```

### characters/kanji/[level].json

```json
[
  {
    "character": "食",
    "readings": [
      { "type": "on", "value": "ショク" },
      { "type": "kun", "value": "た.べる" }
    ],
    "meanings": ["eat", "food", "meal"],
    "strokeCount": 9,
    "radical": "食",
    "radicalMeaning": "eat/food",
    "level": "n5",
    "tags": ["food", "daily"],
    "examples": [
      { "word": "食べる", "reading": "たべる", "meaning": "to eat" },
      { "word": "食事", "reading": "しょくじ", "meaning": "meal" }
    ],
    "extra": {
      "jlptOrder": 1,
      "frequency": 328
    }
  }
]
```

### readings/[level].json

```json
[
  {
    "id": "n5-reading-001",
    "title": "私の一日",
    "level": "n5",
    "text": "毎朝七時に起きます。朝ごはんを食べて、学校に行きます。",
    "reading": "まいあさしちじにおきます。あさごはんをたべて、がっこうにいきます。",
    "translation": "Me levanto a las 7 todas las mañanas. Desayuno y voy a la escuela.",
    "vocabulary": ["毎朝", "起きる", "朝ごはん", "食べる", "学校", "行く"],
    "questions": [
      {
        "question": "何時に起きますか？",
        "options": ["六時", "七時", "八時", "九時"],
        "correctIndex": 1,
        "explanation": "毎朝七時に起きます = Se levanta a las 7"
      }
    ]
  }
]
```

## Generation workflow

1. **Clarify scope** — Which pack? Which level? Which content type?
2. **Research first** — For Japanese, verify against JLPT word lists and grammar references
3. **Generate in batches** — 20-50 entries at a time for vocabulary, 5-10 for grammar
4. **Validate** — Run the validate-pack skill after generating
5. **Save to correct path** — `src/packs/[language]/[type]/[level].json`

## Quality guidelines

- **Meanings:** Include both Spanish and English translations
- **Examples:** Every entry needs at least one natural, level-appropriate example
- **Tags:** Use consistent tags across entries (food, daily, school, travel, etc.)
- **Ordering:** Entries should be roughly ordered by frequency/usefulness
- **Pitch accent:** Include for Japanese vocabulary when known (NHK/Kanjium data)
- **Grammar IDs:** Use format `[level]-grammar-[number]` (e.g., `n5-grammar-042`)
