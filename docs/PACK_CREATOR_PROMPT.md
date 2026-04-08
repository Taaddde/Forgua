# Language Pack Creator Prompt

This file contains a ready-to-use prompt template for generating LinguaForge Language Pack data with LLMs (Claude, GPT-4, etc.). Copy the prompt below and adapt it to your target language and level.

## How to Use

1. Copy the prompt template below
2. Replace the placeholders (`[LANGUAGE]`, `[LEVEL]`, `[CONTENT_TYPE]`, etc.) with your target values
3. Paste into your LLM of choice
4. Review the output carefully before saving

## Prompt Template

---

**Copy everything below this line:**

```
You are a language education data specialist. Generate structured JSON data for a LinguaForge Language Pack.

TARGET LANGUAGE: [LANGUAGE]
LEVEL: [LEVEL]
CONTENT TYPE: [CONTENT_TYPE]  (vocabulary | grammar | characters | readings)
WRITING FAMILY: [FAMILY]  (cjk-japanese | cjk-chinese | hangul | latin | cyrillic | arabic | devanagari)

CRITICAL RULES -- follow these exactly:

1. ACCURACY IS MANDATORY. Every reading, meaning, part of speech, and example must be correct. If you are uncertain about any data point, OMIT IT rather than guess. Wrong data in a language learning tool causes learners to memorize errors.

2. USE AUTHORITATIVE SOURCES as your reference:
   - Japanese: JLPT official word lists, JMdict/EDICT, Jisho.org
   - Chinese: HSK official word lists, CC-CEDICT
   - Korean: TOPIK official word lists
   - European languages: CEFR reference level descriptions
   Use these as your mental reference. Do not invent words that do not belong to the stated level.

3. OMIT DATA YOU ARE NOT SURE ABOUT. If you do not know the pitch accent pattern, do not include it. If you are unsure whether a word belongs to this level, leave it out. Partial correct data is better than complete data with errors.

4. INCLUDE 2+ EXAMPLE SENTENCES per entry. Examples should:
   - Be natural, not textbook-artificial
   - Use only vocabulary and grammar appropriate for the stated level (or one level below)
   - Show the word/pattern in a realistic context

5. MEANINGS IN SPANISH AND ENGLISH. Primary meaning in Spanish. If the word has nuances that are clearer in English, include the English meaning as well. Format: ["Spanish meaning", "English meaning (if helpful)"]

OUTPUT FORMAT:

For VOCABULARY, produce a JSON array:
[
  {
    "word": "target language word",
    "reading": "phonetic reading (hiragana, pinyin, romanization, etc.)",
    "meanings": ["Spanish meaning", "English meaning if needed"],
    "pos": "part-of-speech tag",
    "level": "[LEVEL]",
    "tags": ["semantic-category"],
    "examples": [
      {
        "ja": "Example sentence in target language",
        "reading": "Phonetic reading of the sentence",
        "translation": "Spanish translation"
      }
    ]
  }
]

For GRAMMAR, produce a JSON array:
[
  {
    "id": "[LEVEL]-pattern-name",
    "title": "Grammar pattern title",
    "pattern": "Structure pattern (e.g. Verb-て + ください)",
    "meaning": "Concise meaning in Spanish",
    "level": "[LEVEL]",
    "explanation": "Clear explanation in Spanish, 2-4 sentences",
    "examples": [
      {
        "sentence": "Example in target language",
        "reading": "Phonetic reading",
        "translation": "Spanish translation",
        "breakdown": ["word1 = meaning1", "word2 = meaning2"]
      }
    ],
    "notes": "Usage notes, common mistakes, register information",
    "related": ["ids-of-related-grammar-points"],
    "tags": ["grammar-category"]
  }
]

For CHARACTERS, produce a JSON array:
[
  {
    "character": "the character",
    "readings": [
      { "type": "reading-type", "value": "reading-value" }
    ],
    "meanings": ["meaning1", "meaning2"],
    "strokeCount": number,
    "radical": "radical character (if applicable)",
    "radicalMeaning": "radical meaning",
    "level": "[LEVEL]",
    "tags": ["category"],
    "examples": [
      { "word": "compound word", "reading": "reading", "meaning": "meaning" }
    ]
  }
]

For READINGS, produce a JSON array:
[
  {
    "id": "[LEVEL]-topic-slug",
    "title": "Passage title",
    "level": "[LEVEL]",
    "text": "Full passage text in target language",
    "reading": "Full phonetic reading",
    "translation": "Full Spanish translation",
    "vocabulary": ["key-words-used"],
    "questions": [
      {
        "question": "Comprehension question in Spanish",
        "options": ["option1", "option2", "option3", "option4"],
        "correctIndex": 0,
        "explanation": "Why this answer is correct"
      }
    ]
  }
]

PART OF SPEECH TAGS (use these exactly):
noun, verb-ichidan, verb-godan, verb-irregular, adjective-i, adjective-na, adverb, particle, conjunction, interjection, prefix, suffix, counter, pronoun, expression

For non-Japanese languages, use standard POS tags: noun, verb, adjective, adverb, preposition, conjunction, pronoun, determiner, interjection, expression.

Now generate [NUMBER] entries for [LANGUAGE] [LEVEL] [CONTENT_TYPE].
```

---

## Tips for Best Results

### Batch Generation

Generate in batches of 20-30 entries. Larger batches increase the chance of errors and hallucinations. You can always run the prompt multiple times.

### Cross-Reference

After generating, cross-reference the output against an authoritative source:

| Language | Sources |
|----------|---------|
| Japanese | Jisho.org, JLPT word lists, Takoboto |
| Chinese | MDBG, HSK word lists, Pleco |
| Korean | Naver Dictionary, TOPIK word lists |
| Spanish/French/etc. | WordReference, RAE, Larousse |

### Separate by Level

Generate one level at a time. Do not ask the LLM to generate N5 and N4 vocabulary in the same prompt -- it will mix levels.

### Review Readings Carefully

Phonetic readings (furigana, pinyin, romanization) are where LLMs make the most mistakes. Double-check every reading.

### Specific Pitfalls

- **Kanji readings:** LLMs frequently confuse on'yomi and kun'yomi, or assign readings that only apply in specific compounds
- **Pitch accent:** Omit unless you can verify against a pitch accent dictionary (OJAD, NHK accent dictionary)
- **Stroke counts:** Verify against a kanji dictionary -- LLMs guess these often
- **Level assignment:** A word being "common" does not mean it is N5. Check official lists
- **Example naturalness:** Read examples aloud. If they sound like a textbook robot wrote them, rewrite them

## After Generating

1. **Save** the JSON output to the appropriate file in `src/packs/<language>/`
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
- `[NUMBER]` = 25

Then paste the filled prompt into your LLM and review the output.
