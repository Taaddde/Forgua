# Language Pack Creator Prompt

This file contains a ready-to-use prompt template for generating Forgua Language Pack data with LLMs (Claude, GPT-4, etc.). Copy the prompt below and adapt it to your target language and level.

> **Related:** See [PACK_SPEC.md](PACK_SPEC.md) for content schemas and [EXERCISES_SPEC.md](EXERCISES_SPEC.md) for lesson and conversation schemas.

## How to Use

1. Copy the prompt template below
2. Replace the placeholders (`[LANGUAGE]`, `[LEVEL]`, `[CONTENT_TYPE]`, etc.) with your target values
3. Paste into your LLM of choice
4. Review the output carefully before saving

## Prompt Template

---

**Copy everything below this line:**

```
You are a language education data specialist. Generate structured JSON data for a Forgua Language Pack.

TARGET LANGUAGE: [LANGUAGE]
LEVEL: [LEVEL]
CONTENT TYPE: [CONTENT_TYPE]
  Options: vocabulary | grammar | characters | readings | conversations | lessons
WRITING FAMILY: [FAMILY]
  Options: cjk-japanese | cjk-chinese | hangul | latin | cyrillic | arabic | devanagari
INSTRUCTION LANGUAGE: [LANGUAGE OF EXPLANATIONS AND TRANSLATIONS]

CRITICAL RULES -- follow these exactly:

1. ACCURACY IS MANDATORY. Every reading, meaning, part of speech, and example must be correct. If you are uncertain about any data point, OMIT IT rather than guess. Wrong data in a language learning tool causes learners to memorize errors.

2. USE AUTHORITATIVE SOURCES as your reference:
   - Japanese: JLPT official word lists, JMdict/EDICT, Jisho.org
   - Chinese: HSK official word lists, CC-CEDICT
   - Korean: TOPIK official word lists
   - European languages: CEFR reference level descriptions, WordReference, RAE, Larousse
   Do not invent words that do not belong to the stated level.

3. OMIT DATA YOU ARE NOT SURE ABOUT. If you do not know the pitch accent pattern, do not include it. If you are unsure whether a word belongs to this level, leave it out. Partial correct data is better than complete data with errors.

4. INCLUDE 2+ EXAMPLE SENTENCES per entry. Examples should:
   - Be natural, not textbook-artificial
   - Use only vocabulary and grammar appropriate for the stated level (or one level below)
   - Show the word/pattern in a realistic context

5. TRANSLATIONS. Primary meaning in the instruction language. If the word has nuances that are clearer in English (and English is not the instruction language), include an English clarification in parentheses.

OUTPUT FORMAT — choose based on CONTENT TYPE:

---

For VOCABULARY, produce a JSON array:
[
  {
    "word": "target language word",
    "reading": "phonetic reading (hiragana, pinyin, romanization, IPA, etc.)",
    "meanings": ["primary meaning", "secondary meaning if needed"],
    "pos": "part-of-speech tag",
    "level": "[LEVEL]",
    "tags": ["semantic-category"],
    "examples": [
      {
        "sentence": "Example sentence in target language",
        "reading": "Phonetic reading of the sentence (omit if not applicable)",
        "translation": "Translation in instruction language"
      }
    ]
  }
]

---

For GRAMMAR, produce a JSON array:
[
  {
    "id": "[LEVEL]-pattern-name",
    "title": "Grammar pattern title",
    "pattern": "Structure pattern (e.g. Verb + every day)",
    "meaning": "Concise meaning in instruction language",
    "level": "[LEVEL]",
    "explanation": "Clear explanation, 2-4 sentences",
    "examples": [
      {
        "sentence": "Example in target language",
        "reading": "Phonetic reading (omit if not applicable)",
        "translation": "Translation in instruction language",
        "breakdown": ["word1 = meaning1", "word2 = meaning2"]
      }
    ],
    "notes": "Usage notes, common mistakes, register information",
    "related": ["ids-of-related-grammar-points"],
    "tags": ["grammar-category"]
  }
]

---

For CHARACTERS (writing systems with discrete characters: kanji, hangul, Arabic letters, etc.):
[
  {
    "character": "the character",
    "readings": [
      { "type": "reading-type", "value": "reading-value" }
    ],
    "meanings": ["meaning1", "meaning2"],
    "strokeCount": 0,
    "radical": "radical character (if applicable)",
    "radicalMeaning": "radical meaning",
    "level": "[LEVEL]",
    "tags": ["category"],
    "examples": [
      { "word": "compound word", "reading": "reading", "meaning": "meaning" }
    ]
  }
]

Reading type values depend on the writing system:
- Kanji: "on" (on'yomi), "kun" (kun'yomi), "nanori" (name reading)
- Kana: "romaji"
- Arabic/Devanagari/etc.: "romanization"

---

For READINGS, produce a JSON array:
[
  {
    "id": "[LEVEL]-topic-slug",
    "title": "Passage title",
    "level": "[LEVEL]",
    "text": "Full passage text in target language",
    "reading": "Full phonetic reading (omit if not applicable)",
    "translation": "Full translation in instruction language",
    "vocabulary": ["key-words-used"],
    "questions": [
      {
        "question": "Comprehension question",
        "options": ["option1", "option2", "option3", "option4"],
        "correctIndex": 0,
        "explanation": "Why this answer is correct"
      }
    ]
  }
]

Rules: minimum 2 questions, maximum 5. Questions must be answerable from the text alone. Wrong options must be plausible.

---

For CONVERSATIONS, produce a JSON array:
[
  {
    "id": "[LEVEL]-scenario-slug",
    "scenario": "Scenario description (e.g. At a coffee shop)",
    "level": "[LEVEL]",
    "tags": ["topic", "situation"],
    "turns": [
      {
        "speaker": "npc",
        "text": "NPC line in target language",
        "translation": "Translation in instruction language"
      },
      {
        "speaker": "learner",
        "text": "",
        "options": [
          {
            "text": "Option in target language",
            "isCorrect": true,
            "feedback": "Why this is correct or incorrect",
            "translation": "Translation in instruction language"
          },
          {
            "text": "Wrong option in target language",
            "isCorrect": false,
            "feedback": "Why this is wrong",
            "translation": "Translation in instruction language"
          }
        ],
        "correctOptionIndex": 0
      }
    ]
  }
]

Rules:
- 2-4 options per learner turn (3 is ideal)
- 4-8 turns per conversation (max 10)
- All vocabulary must be at [LEVEL] or lower
- Wrong options must be plausible errors, not absurd ones
- Always include `translation` on NPC turns

---

For LESSONS, produce a single lesson JSON object:
{
  "id": "lesson-id",
  "title": "Lesson title",
  "description": "Brief description",
  "level": "[LEVEL]",
  "category": "vocabulary | grammar | characters | mixed",
  "items": [
    {
      "front": "What the SRS shows on the front",
      "back": "The answer",
      "reading": "Phonetic reading (required for CJK)",
      "explanation": "Short explanation for the learner",
      "cardRef": {
        "category": "vocabulary",
        "front": "must match exactly with vocabulary/[LEVEL].json word field"
      }
    }
  ],
  "steps": [
    { "type": "introduce",  "title": "New words",         "instruction": "...", "itemIndices": [0,1,2,3,4] },
    { "type": "recognize",  "title": "What does it mean?","instruction": "...", "itemIndices": [0,1,2,3,4] },
    { "type": "recall",     "title": "How do you say it?","instruction": "...", "itemIndices": [0,1,2,3,4] },
    { "type": "summary",    "title": "Lesson complete!",  "instruction": "...", "itemIndices": [0,1,2,3,4] }
  ]
}

Rules:
- First step must always be `introduce`. Last step must always be `summary`.
- `cardRef.front` must match EXACTLY the corresponding field in the content file.
- Maximum 15 items per lesson; 8-10 is the sweet spot for vocabulary.

---

PART OF SPEECH TAGS:

Standard (all languages): noun, verb, adjective, adverb, preposition, conjunction, pronoun, determiner, interjection, expression

Japanese-specific: verb-ichidan, verb-godan, verb-irregular, adjective-i, adjective-na, particle, prefix, suffix, counter

---

Now generate [NUMBER] entries for [LANGUAGE] [LEVEL] [CONTENT_TYPE].
```

---

## Tips for Best Results

### Batch Generation

Generate in batches of 20–30 entries. Larger batches increase the chance of errors and hallucinations. You can always run the prompt multiple times.

### Cross-Reference

After generating, cross-reference the output against an authoritative source:

| Language | Sources |
|----------|---------|
| Japanese | Jisho.org, JLPT word lists, Takoboto |
| Chinese | MDBG, HSK word lists, Pleco |
| Korean | Naver Dictionary, TOPIK word lists |
| Spanish / French / Italian | WordReference, RAE, Larousse |
| English | Oxford Learner's Dictionaries, CEFR word lists |

### Separate by Level

Generate one level at a time. Do not ask the LLM to generate A1 and A2 vocabulary in the same prompt — it will mix levels.

### Review Readings Carefully

Phonetic readings (furigana, pinyin, romanization) are where LLMs make the most mistakes. Double-check every reading.

### Specific Pitfalls

- **Kanji readings:** LLMs frequently confuse on'yomi and kun'yomi, or assign readings that only apply in specific compounds
- **Pitch accent:** Omit unless you can verify against a pitch accent dictionary (OJAD, NHK accent dictionary)
- **Stroke counts:** Verify against a kanji dictionary — LLMs guess these often
- **Level assignment:** A word being "common" does not mean it is A1 or N5. Check official word lists
- **Example naturalness:** Read examples aloud. If they sound like a 1980s textbook, rewrite them
- **Conversation options:** Wrong options must be plausible errors — not absurd non-sequiturs
- **`cardRef.front`:** In lessons, this must match the content file exactly — a single character difference breaks the SRS link

## After Generating

1. **Save** the JSON output to the appropriate file in `src/packs/<language>/`
   - Vocabulary → `vocabulary/<level>.json`
   - Grammar → `grammar/<level>.json`
   - Characters → `characters/<system>.json` or `characters/<system>/<level>.json`
   - Readings → `readings/<level>.json`
   - Conversations → `conversations/<level>.json`
   - Lessons → `lessons/<id>.json` (and update `lessons/index.json`)
2. **Validate** against the schema:
   ```bash
   npm run validate-pack -- --pack src/packs/<language>
   ```
3. **Spot-check** at least 10% of entries against a dictionary
4. **Set `"aiGenerated": true`** in the pack manifest
5. **Submit a PR** with a clear description of what was generated and how it was verified

## Example: Generating Japanese N5 Vocabulary

Replace the placeholders:

- `[LANGUAGE]` = Japanese
- `[LEVEL]` = n5
- `[CONTENT_TYPE]` = vocabulary
- `[FAMILY]` = cjk-japanese
- `[INSTRUCTION LANGUAGE]` = Spanish
- `[NUMBER]` = 25

Then paste the filled prompt into your LLM and review the output.

## Example: Generating an Italian A1 Conversation

Replace the placeholders:

- `[LANGUAGE]` = Italian
- `[LEVEL]` = a1
- `[CONTENT_TYPE]` = conversations
- `[FAMILY]` = latin
- `[INSTRUCTION LANGUAGE]` = Spanish
- `[NUMBER]` = 3 conversations

Then paste the filled prompt into your LLM and review the output.
