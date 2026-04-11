# Forgua — Exercises & Lessons: Full Specification

This document describes every exercise type available in Forgua, how to structure them in JSON, and how to combine them into complete lessons for any language.

> **Related:** See [PACK_SPEC.md](PACK_SPEC.md) for the content schemas (vocabulary, grammar, characters, readings) that lessons reference.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Two exercise systems](#2-two-exercise-systems)
3. [Lesson steps (LessonStep)](#3-lesson-steps-lessonstep)
4. [SRS exercises (Exercise)](#4-srs-exercises-exercise)
5. [Conversations](#5-conversations)
6. [Full lesson structure](#6-full-lesson-structure)
7. [Pedagogical decision table](#7-pedagogical-decision-table)
8. [File naming and ordering](#8-file-naming-and-ordering)
9. [Common mistakes to avoid](#9-common-mistakes-to-avoid)

---

## 1. Architecture overview

```
src/packs/<pack-id>/
  manifest.json
  vocabulary/<level>.json
  grammar/<level>.json
  characters/<system>.json
  characters/<system>/<level>.json
  readings/<level>.json
  conversations/<level>.json
  lessons/
    index.json               ← index of all lessons
    <id>.json                ← one file per lesson
  roadmaps.json
  resources.json
```

A **Language Pack** = data in JSON. Zero code. Lessons orchestrate exercises. Exercises activate cards in the SRS.

**Learner flow:**
1. Completes **lessons** → learns new items → items are added to the SRS
2. Does **daily SRS review** → review exercises → the SM-2 engine schedules when each card is seen again

---

## 2. Two exercise systems

### System A — Lesson steps (`LessonStep`)

Used **inside a lesson** to introduce and practice new items. Controlled by the `LessonPlayer`. They operate on the lesson's `items[]` (references to cards).

**Available types:**
| Type | Description | Uses `itemIndices` | Uses `config` |
|------|-------------|-------------------|--------------|
| `introduce` | Present the item (text, audio, image, explanation) — no answer required | ✅ | — |
| `recognize` | Multiple choice: see the front, choose the back | ✅ | — |
| `recall` | Free-text answer (see the back, write the front) | ✅ | — |
| `write` | Variant of recall for characters | ✅ | — |
| `sentence-build` | Build a sentence by reordering fragments | ✅ | `sentences[]` |
| `listen-identify` | Hear audio, choose the correct word | ✅ | — |
| `listen-transcribe` | Hear audio, write what you hear (dictation) | ✅ | — |
| `speak` | Read aloud, pronunciation evaluated via STT | ✅ | — |
| `fill-blank-multi` | Fill MULTIPLE blanks with chips or free text | — | `exercises[]` |
| `word-in-context` | Target word → choose the sentence where it is used correctly | — | `exercises[]` |
| `error-correction` | Does this sentence have an error? → yes/no → explanation | — | `exercises[]` |
| `image-association` | See image → choose the correct word/phrase | — | `exercises[]` |
| `story-comprehension` | Read text → comprehension questions | — | `passage` (inline ReadingText) |
| `conversation-script` | Turn-based guided dialogue | — | `script` (inline ConversationScript) |
| `summary` | Completion screen — not an exercise, no answer | ✅ | — |

**Important note:** Steps that use `config` (embedded System B) do not require `itemIndices`. Pass `"itemIndices": []` in the lesson JSON. The component gets all its data from the `config` field.

### System B — SRS exercises (`Exercise`)

Used in the **daily review** and in standalone exercises outside lessons. They operate on cards (`Card`) already in the SRS.

**Available types:**
| Type | Component | Description |
|------|-----------|-------------|
| `flashcard` | FlashCard | See front → reveal back → self-assess |
| `multiple-choice` | MultipleChoice | 4 options, choose the correct one |
| `write-answer` | WriteAnswer | Free-text field, fuzzy evaluation |
| `fill-blank` | FillBlank | Fill ONE blank (with options or free text) |
| `fill-blank-multi` | ClozeMulti | Fill MULTIPLE blanks |
| `drag-reorder` | DragReorder | Order fragments into the correct sequence |
| `matching` | Matching | Match left column with right column |
| `dictation` | Dictation | Hear audio → write what you hear |
| `speak` | SpeakExercise | Read aloud → pronunciation feedback |
| `sentence-build` | SentenceBuild | Build sentence from given fragments + translation |
| `image-association` | ImageAssociation | See image → choose the correct word/phrase |
| `word-in-context` | WordInContext | Target word → choose the sentence where it is used correctly |
| `error-correction` | ErrorCorrection | Does this sentence have an error? → yes/no → explanation |
| `conversation-script` | ConversationScript | Turn-based guided dialogue |
| `story-comprehension` | StoryComprehension | Read text → comprehension questions |

---

## 3. Lesson steps (`LessonStep`)

Each lesson has a `steps` array. Each step has:
- `type` — the step type
- `title` — title visible to the learner
- `instruction` — brief instruction
- `itemIndices` — which items in the lesson are used (indices into `lesson.items[]`)
- `config` — extra configuration (optional)

### 3.1 `introduce`

Shows the item: front, back, reading, explanation, audio (if available). The learner does not answer. This is pure exposure to comprehensible input.

```jsonc
{
  "type": "introduce",
  "title": "New words",
  "instruction": "Read each word, listen to its pronunciation and explanation.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**When to use:** Always as the first step of any lesson. Never skip it.

---

### 3.2 `recognize`

Multiple choice: the item's `front` is shown, the learner chooses among 4 options which is the correct `back`. The 3 wrong options are automatically generated from the same item group.

```jsonc
{
  "type": "recognize",
  "title": "What does it mean?",
  "instruction": "Choose the correct meaning for each word.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**When to use:** Second step, always after `introduce`. Consolidates recognition.

---

### 3.3 `recall`

Shows the item's `back`. The learner writes the `front` in the target language. The adapter normalizes and compares (romaji→kana, accent-insensitive, etc.).

```jsonc
{
  "type": "recall",
  "title": "How do you say it?",
  "instruction": "Write the word in the target language.",
  "itemIndices": [0, 1, 2, 3]
}
```

**When to use:** Third or fourth step. Requires active production. Best for vocabulary and basic characters.

---

### 3.4 `sentence-build`

Shows the translation of a sentence. The learner drags/clicks fragments in the correct order to build it.

```jsonc
{
  "type": "sentence-build",
  "title": "Build the sentence",
  "instruction": "Order the words to form the correct sentence.",
  "itemIndices": [2],
  "config": {
    "sentences": [
      {
        "translation": "I eat rice every day.",
        "fragments": ["私は", "毎日", "ご飯を", "食べます"],
        "correctOrder": [0, 1, 2, 3]
      }
    ]
  }
}
```

**When to use:** Best for grammar. Always after `introduce` and `recognize`.

---

### 3.5 `listen-identify`

Plays the item's audio. The learner chooses among 4 options which word they heard.

```jsonc
{
  "type": "listen-identify",
  "title": "Listen and choose",
  "instruction": "Which of these words do you hear?",
  "itemIndices": [0, 1, 2, 3]
}
```

**When to use:** For vocabulary with audio. Trains the ear before moving to recall.

---

### 3.6 `listen-transcribe`

Plays the audio. The learner writes what they hear (dictation).

```jsonc
{
  "type": "listen-transcribe",
  "title": "Listen and write",
  "instruction": "Listen to the pronunciation and write the word.",
  "itemIndices": [0, 1, 2]
}
```

**When to use:** After `listen-identify`. More demanding. Recommended for characters and vocabulary.

---

### 3.7 `speak`

Shows the target text. The learner reads it aloud. STT evaluates pronunciation.

```jsonc
{
  "type": "speak",
  "title": "Pronounce it",
  "instruction": "Read the text aloud. Your pronunciation will be evaluated.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**When to use:** Optional. Requires a microphone. Works only in Chrome/Edge. Always place at the end of the lesson.

---

### 3.8 `summary`

Closing screen. Summarizes what was learned. No answer or evaluation.

```jsonc
{
  "type": "summary",
  "title": "Lesson complete!",
  "instruction": "These 5 words are now in your review queue. You will see them again tomorrow.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**When to use:** Always as the last step. Required.

---

### 3.9 `fill-blank-multi` (step with `config`)

Fill multiple blanks in one or several sentences. Best for contextual grammar, prepositions, and agreement.

```jsonc
{
  "type": "fill-blank-multi",
  "title": "Complete the sentences",
  "instruction": "Choose the correct word for each blank.",
  "itemIndices": [],
  "config": {
    "exercises": [
      {
        "template": "She {0} a book when the phone {1}.",
        "blanks": [
          { "answer": "was reading", "options": ["was reading", "is reading", "reads"] },
          { "answer": "rang",        "options": ["rang", "rings", "was ringing"] }
        ]
      }
    ]
  }
}
```

**When to use:** After `introduce` + `recognize` in grammar lessons. Minimum 2 blanks per exercise, 2–5 exercises per step.

---

### 3.10 `word-in-context` (step with `config`)

Given a target word, choose the sentence where it is used correctly.

```jsonc
{
  "type": "word-in-context",
  "title": "Where is it used correctly?",
  "instruction": "Choose the sentence where the word is used correctly.",
  "itemIndices": [],
  "config": {
    "exercises": [
      {
        "targetWord": "deadline",
        "translation": "fecha límite",
        "options": [
          "I met a deadline at the park yesterday.",
          "We need to meet the deadline by Friday.",
          "The deadline is very tall.",
          "I drink deadline every morning."
        ],
        "correctIndex": 1
      }
    ]
  }
}
```

**When to use:** From B1/intermediate onward to consolidate vocabulary use. Minimum 2 exercises per step. Wrong options must have real errors, not absurd ones.

---

### 3.11 `error-correction` (step with `config`)

Decide if a sentence has an error, then see the explanation.

```jsonc
{
  "type": "error-correction",
  "title": "Correct or incorrect?",
  "instruction": "Decide whether each sentence is correct or has an error.",
  "itemIndices": [],
  "config": {
    "exercises": [
      {
        "sentence": "She don't like coffee.",
        "isCorrect": false,
        "correction": "She doesn't like coffee.",
        "explanation": "Third-person singular (she/he/it) requires 'doesn't', not 'don't'.",
        "errorType": "conjugation"
      },
      {
        "sentence": "He usually drinks tea in the morning.",
        "isCorrect": true,
        "explanation": "Correct present simple: 'drinks' (3rd person) + frequency adverb 'usually' before the verb.",
        "errorType": "word-order"
      }
    ]
  }
}
```

**When to use:** From A2 for very common, clear errors; from B1 onward with more freedom. Mix ~50/50 correct and incorrect.

---

### 3.12 `image-association` (step with `config`)

See an image → choose the correct word/phrase.

```jsonc
{
  "type": "image-association",
  "title": "What do you see?",
  "instruction": "Look at the image and choose the correct word.",
  "itemIndices": [],
  "config": {
    "exercises": [
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/320px-Golde33443.jpg",
        "imageAlt": "A golden retriever dog",
        "options": ["dog", "cat", "bird", "fish"],
        "correctIndex": 0
      }
    ]
  }
}
```

**When to use:** Concrete vocabulary (animals, objects, food, places). Use publicly accessible URLs (Wikimedia Commons) or paths relative to the pack (`images/...`).

---

### 3.13 `story-comprehension` (step with `config`)

Read a text → answer comprehension questions.

```jsonc
{
  "type": "story-comprehension",
  "title": "Reading",
  "instruction": "Read the text and answer the questions.",
  "itemIndices": [],
  "config": {
    "passage": {
      "id": "reading-a2-01",
      "title": "A Busy Monday Morning",
      "level": "a2",
      "text": "Sarah wakes up at 6:30 every morning. She has a quick breakfast and takes the bus to work. Today she has an important meeting at 9 o'clock...",
      "translation": "Sarah se despierta a las 6:30 todas las mañanas...",
      "vocabulary": ["wake up", "breakfast", "meeting"],
      "questions": [
        {
          "question": "What time does Sarah wake up?",
          "options": ["6:00", "6:30", "7:00", "8:00"],
          "correctIndex": 1,
          "explanation": "The text says 'Sarah wakes up at 6:30 every morning'."
        }
      ]
    }
  }
}
```

**When to use:** Reading lessons. The passage is declared inline — it does not reference `readings/<level>.json` by id.

---

### 3.14 `conversation-script` (step with `config`)

Turn-based guided dialogue with multiple-choice options.

```jsonc
{
  "type": "conversation-script",
  "title": "Conversation",
  "instruction": "Choose the best response at each turn.",
  "itemIndices": [],
  "config": {
    "script": {
      "id": "conv-a1-hotel-checkin",
      "scenario": "Hotel check-in",
      "level": "a1",
      "turns": [
        {
          "speaker": "npc",
          "text": "Good evening! Welcome to Hotel Central. How can I help you?",
          "translation": "Buenas tardes. Bienvenido al Hotel Central. ¿En qué puedo ayudarle?"
        },
        {
          "speaker": "learner",
          "text": "",
          "options": [
            { "text": "Hi, I have a reservation under the name Smith.", "isCorrect": true,  "feedback": "Perfect — natural way to announce your reservation." },
            { "text": "I want a book, please.",                          "isCorrect": false, "feedback": "'Book' means libro — it doesn't make sense here; you'd want 'room'." },
            { "text": "Goodbye!",                                         "isCorrect": false, "feedback": "Saying goodbye before checking in is out of context." }
          ],
          "correctOptionIndex": 0
        }
      ]
    }
  }
}
```

**When to use:** Situational, reading, or conversational practice lessons. The script lives inline in config, not in a `conversations/` file.

---

## 4. SRS exercises (`Exercise`)

These exercises are defined in the pack's content files or generated automatically by the engine from cards. Those that need to be explicitly defined in the pack are the ones with specific data the engine cannot generate on its own.

### 4.1 `fill-blank` — Single blank

Use `___` as the placeholder in the text.

```json
{
  "type": "fill-blank",
  "data": {
    "sentence": "I ___ to school every day.",
    "options": ["go", "goes", "went", "going"],
    "correctAnswer": "go"
  }
}
```

**Rules:**
- Exactly one `___` in the text
- If `options` is present → selection chips; if absent → free-text field
- For free text, the adapter normalizes before comparing

---

### 4.2 `fill-blank-multi` — Multiple blanks

Use `{0}`, `{1}`, `{2}` as numbered placeholders in the template.

```json
{
  "type": "fill-blank-multi",
  "data": {
    "template": "{0} goes to school {1}.",
    "blanks": [
      {
        "answer": "She",
        "options": ["She", "He", "They", "I"]
      },
      {
        "answer": "every day",
        "options": ["every day", "yesterday", "tomorrow", "never"]
      }
    ]
  }
}
```

**Rules:**
- Placeholders `{0}`, `{1}` must be consecutive from 0 — no gaps
- Each blank can have `options` (multiple choice) or not (free text)
- Mixing MC and free text in the same exercise is allowed
- Minimum 2 blanks (if 1 blank, use `fill-blank`)

---

### 4.3 `matching` — Match columns

```json
{
  "type": "matching",
  "data": {
    "pairs": [
      { "left": "eat",   "right": "comer" },
      { "left": "drink", "right": "beber" },
      { "left": "go",    "right": "ir" },
      { "left": "come",  "right": "venir" },
      { "left": "see",   "right": "ver" }
    ]
  }
}
```

**Rules:**
- Minimum 3 pairs, maximum 8
- Right-column items are shuffled automatically
- Best for new vocabulary: 5 words from the same level/category

---

### 4.4 `drag-reorder` — Order fragments

```json
{
  "type": "drag-reorder",
  "data": {
    "prompt": "Order the words to form 'I eat rice every day'",
    "fragments": ["I", "rice", "every day", "eat"],
    "correctOrder": [0, 3, 1, 2]
  }
}
```

**Rules:**
- `correctOrder` is the array of `fragments` indices in correct order
- In the example: position 0 → index 0 ("I"), position 1 → index 3 ("eat"), etc.
- Minimum 3 fragments, maximum 8
- For long sentences, split by word or grammatical group, NOT by character

---

### 4.5 `image-association` — Image → word

```json
{
  "type": "image-association",
  "data": {
    "imageUrl": "images/a1/eat.jpg",
    "imageAlt": "Person eating",
    "options": ["eat", "drink", "sleep", "run"],
    "correctIndex": 0
  }
}
```

**Rules:**
- `imageUrl` is relative to the pack root
- Images go in `images/` inside the pack
- `imageAlt` is required (accessibility)
- Always 4 options
- Very effective for concrete vocabulary: objects, actions, places, animals, food

---

### 4.6 `word-in-context` — Choose the correct sentence

```json
{
  "type": "word-in-context",
  "data": {
    "targetWord": "borrow",
    "translation": "pedir prestado",
    "options": [
      "Can I borrow your car this weekend?",
      "I borrow very tired after work.",
      "She borrowed the sun yesterday.",
      "They borrow at 8 o'clock every morning."
    ],
    "correctIndex": 0
  }
}
```

**Rules:**
- The 3 wrong options must have real errors, not absurd ones
- Useful error categories: wrong word, wrong preposition, wrong word order, wrong register
- Sentences should be at the declared level or one level lower
- Best from B1/intermediate onward; use sparingly at beginner levels

---

### 4.7 `error-correction` — Does this sentence have an error?

```json
{
  "type": "error-correction",
  "data": {
    "sentence": "She don't like coffee.",
    "isCorrect": false,
    "correction": "She doesn't like coffee.",
    "explanation": "'Don't' is for I/you/we/they. Third-person singular requires 'doesn't'.",
    "errorType": "conjugation"
  }
}
```

Can also be a correct sentence:

```json
{
  "type": "error-correction",
  "data": {
    "sentence": "He usually drinks tea in the morning.",
    "isCorrect": true,
    "explanation": "Correct present simple: 'drinks' (3rd person) with frequency adverb 'usually' before the main verb.",
    "errorType": "word-order"
  }
}
```

**Rules:**
- `errorType` is a free but consistent label. Recommended values: `particle`, `conjugation`, `word-order`, `wrong-verb`, `wrong-adjective`, `register`, `missing-particle`, `preposition`
- In a set of `error-correction` exercises, mix correct and incorrect sentences (~50/50)
- The explanation must be pedagogical: not just what is wrong, but WHY
- Best from B1 onward; at beginner levels only for very common, clear errors

---

### 4.8 `story-comprehension` — Read text + answer questions

This exercise uses the `ReadingText` schema from the pack (file `readings/<level>.json`). The lesson references the text by its `id`.

```jsonc
// In readings/a2.json — text definition
{
  "id": "a2-morning-routine",
  "title": "Sarah's Morning",
  "level": "a2",
  "text": "Sarah wakes up at 6:30 every morning. She has a quick breakfast and takes the bus to work.",
  "translation": "Sarah se despierta a las 6:30 todas las mañanas. Desayuna rápido y toma el autobús al trabajo.",
  "vocabulary": ["wake up", "breakfast", "take the bus"],
  "questions": [
    {
      "question": "What time does Sarah wake up?",
      "options": ["6:00", "6:30", "7:00", "8:00"],
      "correctIndex": 1,
      "explanation": "The text says 'Sarah wakes up at 6:30 every morning'."
    },
    {
      "question": "How does Sarah get to work?",
      "options": ["By car", "By train", "By bus", "On foot"],
      "correctIndex": 2,
      "explanation": "'takes the bus to work' — she commutes by bus."
    }
  ]
}
```

**Rules:**
- Minimum 2 questions, maximum 5
- Questions must be answerable from the text alone — never from external knowledge
- Wrong options must be plausible, not absurd
- The text must use only vocabulary and grammar at the declared level or lower

---

## 5. Conversations

Conversations are guided dialogues. The learner **chooses** among 2–4 options what their character would say. They do not write freely — this eliminates false negatives and frustration.

### 5.1 Conversations file

`conversations/<level>.json` — array of `ConversationScript`.

```jsonc
[
  {
    "id": "a1-shopping",
    "scenario": "At a clothing store",
    "level": "a1",
    "tags": ["shopping", "daily-life", "polite-speech"],
    "turns": [
      {
        "speaker": "npc",
        "text": "Welcome! Can I help you?",
        "translation": "¡Bienvenido/a! ¿En qué puedo ayudarle?",
        "audio": "audio/conversations/welcome.mp3"
      },
      {
        "speaker": "learner",
        "text": "",
        "options": [
          {
            "text": "I'm looking for a t-shirt.",
            "isCorrect": true,
            "feedback": "Correct. 'I'm looking for...' is the natural way to ask for help finding something.",
            "translation": "Estoy buscando una camiseta."
          },
          {
            "text": "Thank you very much.",
            "isCorrect": false,
            "feedback": "'Thank you' is a response to help received, not an opening to a shopping conversation.",
            "translation": "Muchas gracias."
          },
          {
            "text": "Goodbye!",
            "isCorrect": false,
            "feedback": "Saying goodbye before you've even started shopping doesn't make sense here.",
            "translation": "¡Adiós!"
          }
        ],
        "correctOptionIndex": 0
      },
      {
        "speaker": "npc",
        "text": "Sure! What color would you like?",
        "translation": "¡Claro! ¿Qué color le gustaría?",
        "audio": "audio/conversations/what-color.mp3"
      },
      {
        "speaker": "learner",
        "text": "",
        "options": [
          {
            "text": "A blue one, please.",
            "isCorrect": true,
            "feedback": "Perfect. Clear, polite, and appropriate answer to the color question.",
            "translation": "Una azul, por favor."
          },
          {
            "text": "I am a student.",
            "isCorrect": false,
            "feedback": "Introducing yourself doesn't answer the question about color.",
            "translation": "Soy estudiante."
          },
          {
            "text": "A red one, please.",
            "isCorrect": true,
            "feedback": "Also correct — same structure, different color. Both are equally valid.",
            "translation": "Una roja, por favor."
          }
        ],
        "correctOptionIndex": 0
      }
    ]
  }
]
```

### 5.2 Conversation rules

**Number of options:** 2–4 per learner turn. 3 is ideal.

**Single vs. multiple correct answers:** You can have more than one `isCorrect: true`. In that case the system accepts any correct option. Use this when there are equally valid variants (e.g. blue/red above). `correctOptionIndex` must point to the most recommended option for UI feedback purposes.

**Quality of wrong options:** Do NOT invent absurd errors. Wrong options must:
- Be real words at the learner's level
- Be grammatically possible but contextually wrong
- Illustrate real confusions (wrong register, off-topic response, etc.)

**NPC turns:** Always include `translation`. `audio` is optional but recommended when audio files are present in the pack.

**Length:** 4–8 turns per conversation. No more than 10. Too long causes fatigue.

**Vocabulary level:** All NPC text and learner options must use vocabulary at the declared level or lower. An A1 conversation cannot contain B1 vocabulary.

---

## 6. Full lesson structure

### 6.1 `lessons/index.json`

```json
{
  "lessons": [
    {
      "id": "vocab-a1-01",
      "title": "Basic Greetings",
      "description": "The 8 survival words to get started",
      "level": "a1",
      "category": "vocabulary",
      "order": 1,
      "prerequisites": [],
      "estimatedMinutes": 10,
      "newItemCount": 8
    },
    {
      "id": "grammar-a1-01",
      "title": "Present Simple: to be",
      "description": "I am, you are, she is",
      "level": "a1",
      "category": "grammar",
      "order": 11,
      "prerequisites": ["vocab-a1-01"],
      "estimatedMinutes": 12,
      "newItemCount": 6
    }
  ]
}
```

**`order` rules:** Ascending within each level. The engine displays lessons in this order. Vocabulary lessons first, then grammar, then reading, etc. Use gaps between ranges (1–10 vocab, 11–20 grammar) so you can insert new lessons without renumbering everything.

**`prerequisites`:** Array of lesson `id`s that must be completed first. Empty (`[]`) for the first lesson. Do not create circular dependencies.

---

### 6.2 `lessons/<id>.json` — Lesson anatomy

```jsonc
{
  "id": "vocab-a1-01",           // ← must match the filename without .json
  "title": "Basic Greetings",
  "description": "The 8 survival words to get started",
  "level": "a1",
  "category": "vocabulary",      // vocabulary | characters | grammar | mixed

  // Items introduced in this lesson
  "items": [
    {
      "front": "hello",                   // What the SRS shows on the front
      "back": "hola",                     // The answer
      "reading": "ˈhɛloʊ",               // Phonetic reading (required for CJK, optional for latin)
      "explanation": "The most common greeting in English. Used any time of day.",
      "mnemonic": "Sounds like 'ola' — like a wave (ola in Spanish).",  // Optional
      "imageUrl": "images/a1/hello.jpg",  // Optional
      "audio": "audio/a1/hello.mp3",      // Optional
      "cardRef": {
        "category": "vocabulary",         // Must match the item's category
        "front": "hello"                  // Must match exactly with vocabulary/a1.json "word" field
      }
    }
  ],

  // Lesson steps in order
  "steps": [...]
}
```

**Important:** `cardRef.front` must match **exactly** (same text) the `word` field in `vocabulary/<level>.json`, the `character` field in `characters/`, or the `front` field in grammar. If it doesn't match, the item is not added to the SRS.

---

### 6.3 Recommended step sequences by category

#### Vocabulary (5–10 new words)

```
introduce → recognize → listen-identify → recall → [speak] → summary
```

#### Vocabulary with images

```
introduce → image-association → recognize → recall → summary
```

#### Characters / scripts (5 new characters)

```
introduce → recognize → listen-identify → recall → listen-transcribe → [speak] → summary
```

#### Grammar (1–3 patterns)

```
introduce → introduce (full example) → recognize → sentence-build → recall → summary
```

*(Two `introduce` steps is normal for grammar: first the pieces, then the full pattern.)*

#### Mixed (vocabulary + grammar)

```
introduce → recognize → sentence-build → recall → summary
```

#### Conversations

Conversations are **not** lessons — they are standalone exercises. They are accessed from the conversation practice section, not from the standard lesson flow.

---

## 7. Pedagogical decision table

| Learning objective | Primary exercise type | Secondary exercise type |
|-------------------|-----------------------|------------------------|
| New vocabulary, recognition | `recognize` (MC) | `matching` |
| New vocabulary, production | `recall` (write) | `fill-blank` |
| Vocabulary in context | `word-in-context` | `fill-blank-multi` |
| Grammar structure | `sentence-build` | `drag-reorder` |
| Grammar correction | `error-correction` | `fill-blank-multi` |
| Characters, recognition | `recognize` (MC) | `matching` |
| Characters, writing | `recall` + `write` | `character-draw` |
| Listening comprehension | `listen-identify` | `dictation` |
| Reading comprehension | `story-comprehension` | — |
| Oral production | `speak` | — |
| Situational communication | `conversation-script` | — |
| Visual association | `image-association` | — |

---

### When to introduce each exercise type by level

| Level | Available types |
|-------|----------------|
| Absolute beginner (A1 / N5) | `introduce`, `recognize`, `listen-identify`, `recall`, `matching`, `fill-blank` |
| Beginner (A2 / N4) | + `sentence-build`, `drag-reorder`, `fill-blank-multi`, `image-association`, `conversation-script` |
| Lower intermediate (B1 / N3) | + `word-in-context`, `error-correction`, `story-comprehension` |
| Intermediate (B2 / N2) | All available types |
| Advanced (C1+ / N1) | All types, with greater complexity per exercise |

---

## 8. File naming and ordering

### Lesson file naming

Use a consistent pattern: `<category>-<level>-<NN>.json`

| Pattern | Category | Example |
|---------|----------|---------|
| `vocab-<level>-NN.json` | Vocabulary | `vocab-a1-01.json` / `vocab-n5-01.json` |
| `grammar-<level>-NN.json` | Grammar | `grammar-a2-03.json` / `grammar-n4-02.json` |
| `reading-<level>-NN.json` | Reading practice | `reading-b1-01.json` / `reading-n3-01.json` |
| `mixed-<level>-NN.json` | Mixed vocab + grammar | `mixed-a1-01.json` |

For writing-system-intensive packs (e.g. Japanese, Korean, Arabic), add script-specific lessons before vocabulary:

| Pattern | Category | Example |
|---------|----------|---------|
| `script-<name>-NN.json` | Writing system intro | `script-hiragana-01.json` |
| `script-<name>-<level>-NN.json` | Characters by level | `script-kanji-n5-01.json` |

The `<level>` segment must match a level `id` defined in `manifest.json`.

---

### Lesson ordering within a level

For a **CEFR-based pack** (Spanish, French, Italian, English, etc.):

```
1–20:   vocabulary A1 (8–10 words per lesson)
21–40:  grammar A1 (1–2 patterns per lesson)
41–50:  reading A1 (1 text per lesson)
51+:    A2 begins
```

For a **script-heavy pack** (Japanese, Korean, Arabic, Hindi, etc.):

```
1–10:   script group 1 (e.g. hiragana rows, hangul consonants)
11–20:  script group 2
21–30:  first vocabulary using the learned script
31–50:  vocabulary at the level (8–10 words per lesson)
51–65:  grammar (1–2 patterns per lesson)
66–70:  reading
```

The specific grouping depends on the language's script structure — adapt as needed.

---

### How many lessons per level

| Level | Suggested count | New items per lesson |
|-------|----------------|----------------------|
| A1 / N5 | 50–70 lessons | 5–10 items |
| A2 / N4 | 60–80 lessons | 8–12 items |
| B1 / N3 | 80–100 lessons | 10–15 items |
| B2 / N2 | 100+ lessons | 10–15 items |
| C1+ / N1 | 100+ lessons | 10–20 items |

---

## 9. Common mistakes to avoid

### In lessons

❌ **Skipping `introduce`** — The engine cannot practice what hasn't been presented.

❌ **`itemIndices` out of range** — If a lesson has 5 items (indices 0–4), do not use `itemIndices: [5]`.

❌ **`cardRef.front` that doesn't exist** — If the word is not in `vocabulary/<level>.json`, the item won't be added to the SRS. Verify the text matches exactly.

❌ **Too many items per lesson** — Maximum 15. Working memory has limits. For vocabulary, 8–10 is the sweet spot.

❌ **Lesson without `summary`** — The `summary` step is what marks the lesson as completed.

---

### In exercises

❌ **`fill-blank-multi` with `{0}` and `{2}` but no `{1}`** — Indices must be consecutive starting from 0.

❌ **`error-correction` with only incorrect sentences** — Include a mix of correct and incorrect so the exercise is not trivial.

❌ **`matching` with pairs that share part of the same text** — Learners can use visual matching instead of actual knowledge.

❌ **`word-in-context` with absurd wrong options** — "I eat the sky for breakfast" is an obvious distractor that doesn't train real reasoning. Distractors must be plausible.

---

### In conversations

❌ **Learner turn with only one option** — Minimum 2 options, maximum 4.

❌ **NPC vocabulary above the declared level** — If the conversation is A1, the NPC cannot use B1 words.

❌ **`correctOptionIndex` pointing to the wrong option** — Verify it points to an option with `isCorrect: true`.

❌ **NPC turns without `translation`** — The learner needs to understand what the NPC is saying in order to respond.

---

## Appendix: AI prompt template for content generation

```
You are a language teaching specialist. Generate JSON content for a Forgua Language Pack.

TARGET LANGUAGE: [LANGUAGE]
LEVEL: [LEVEL] (e.g. a1, n5, b2)
WRITING FAMILY: [FAMILY] (cjk-japanese | cjk-chinese | hangul | latin | cyrillic | arabic | devanagari)
INSTRUCTION LANGUAGE: [LANGUAGE OF EXPLANATIONS]

CONTENT TYPE TO GENERATE: [TYPE]

Options for [TYPE]:
A) vocabulary/<level>.json — vocabulary
B) grammar/<level>.json — grammar
C) characters/<system>.json — characters
D) readings/<level>.json — reading texts with comprehension questions
E) conversations/<level>.json — guided dialogues
F) lessons/<id>.json — a complete lesson
G) lessons/index.json — lesson index

CRITICAL RULES:
1. ACCURACY IS MANDATORY. If you are unsure of a reading, meaning, or conjugation, omit it or flag it with a comment.
2. REFERENCE SOURCES: JMdict for Japanese, CC-CEDICT for Chinese, TOPIK dictionaries for Korean, CEFR word lists for European languages.
3. NATURAL EXAMPLES. Example sentences should sound like what a real speaker says, not an 80s textbook.
4. TARGET LANGUAGE MEANINGS FIRST, then provide translations.
5. DO NOT INVENT WORDS OR LEVELS. A "common" word is not necessarily A1. Verify against official word lists.
```
