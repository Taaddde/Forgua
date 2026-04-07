/**
 * Validate all pack JSON files against Zod schemas.
 * Run with: npm run validate-pack
 */

import {
  validateManifest, validateVocabulary, validateGrammar,
  validateCharacters, validateReadings, validateRoadmaps, validateResources,
} from '../src/validation/pack-schema';

// Japanese pack
import manifest from '../src/packs/japanese/manifest.json';
import vocabN5 from '../src/packs/japanese/vocabulary/n5.json';
import vocabN4 from '../src/packs/japanese/vocabulary/n4.json';
import vocabN3 from '../src/packs/japanese/vocabulary/n3.json';
import vocabN2 from '../src/packs/japanese/vocabulary/n2.json';
import vocabN1 from '../src/packs/japanese/vocabulary/n1.json';
import grammarN5 from '../src/packs/japanese/grammar/n5.json';
import grammarN4 from '../src/packs/japanese/grammar/n4.json';
import grammarN3 from '../src/packs/japanese/grammar/n3.json';
import grammarN2 from '../src/packs/japanese/grammar/n2.json';
import grammarN1 from '../src/packs/japanese/grammar/n1.json';
import hiragana from '../src/packs/japanese/characters/hiragana.json';
import katakana from '../src/packs/japanese/characters/katakana.json';
import kanjiN5 from '../src/packs/japanese/characters/kanji/n5.json';
import kanjiN4 from '../src/packs/japanese/characters/kanji/n4.json';
import kanjiN3 from '../src/packs/japanese/characters/kanji/n3.json';
import kanjiN2 from '../src/packs/japanese/characters/kanji/n2.json';
import kanjiN1 from '../src/packs/japanese/characters/kanji/n1.json';
import readingsN5 from '../src/packs/japanese/readings/n5.json';
import readingsN4 from '../src/packs/japanese/readings/n4.json';
import readingsN3 from '../src/packs/japanese/readings/n3.json';
import readingsN2 from '../src/packs/japanese/readings/n2.json';
import readingsN1 from '../src/packs/japanese/readings/n1.json';
import roadmaps from '../src/packs/japanese/roadmaps.json';
import resources from '../src/packs/japanese/resources.json';

// English pack
import englishManifest from '../src/packs/english/manifest.json';
import englishVocabA1 from '../src/packs/english/vocabulary/a1.json';
import englishVocabA2 from '../src/packs/english/vocabulary/a2.json';
import englishGrammarA1 from '../src/packs/english/grammar/a1.json';
import englishGrammarA2 from '../src/packs/english/grammar/a2.json';
import englishReadingsA1 from '../src/packs/english/readings/a1.json';
import englishReadingsA2 from '../src/packs/english/readings/a2.json';
import englishRoadmaps from '../src/packs/english/roadmaps.json';
import englishResources from '../src/packs/english/resources.json';

let hasErrors = false;

function check(name: string, result: { success: boolean; error?: unknown }) {
  if (result.success) {
    console.log(`✅ ${name}`);
  } else {
    console.error(`❌ ${name}:`, JSON.stringify(result.error, null, 2));
    hasErrors = true;
  }
}

console.log('Validating Japanese pack...\n');

check('manifest.json', validateManifest(manifest));
check(`vocabulary/n5.json (${(vocabN5 as unknown[]).length} entries)`, validateVocabulary(vocabN5));
check(`vocabulary/n4.json (${(vocabN4 as unknown[]).length} entries)`, validateVocabulary(vocabN4));
check(`vocabulary/n3.json (${(vocabN3 as unknown[]).length} entries)`, validateVocabulary(vocabN3));
check(`vocabulary/n2.json (${(vocabN2 as unknown[]).length} entries)`, validateVocabulary(vocabN2));
check(`vocabulary/n1.json (${(vocabN1 as unknown[]).length} entries)`, validateVocabulary(vocabN1));
check(`grammar/n5.json (${(grammarN5 as unknown[]).length} entries)`, validateGrammar(grammarN5));
check(`grammar/n4.json (${(grammarN4 as unknown[]).length} entries)`, validateGrammar(grammarN4));
check(`grammar/n3.json (${(grammarN3 as unknown[]).length} entries)`, validateGrammar(grammarN3));
check(`grammar/n2.json (${(grammarN2 as unknown[]).length} entries)`, validateGrammar(grammarN2));
check(`grammar/n1.json (${(grammarN1 as unknown[]).length} entries)`, validateGrammar(grammarN1));
check(`characters/hiragana.json (${(hiragana as unknown[]).length} entries)`, validateCharacters(hiragana));
check(`characters/katakana.json (${(katakana as unknown[]).length} entries)`, validateCharacters(katakana));
check(`characters/kanji/n5.json (${(kanjiN5 as unknown[]).length} entries)`, validateCharacters(kanjiN5));
check(`characters/kanji/n4.json (${(kanjiN4 as unknown[]).length} entries)`, validateCharacters(kanjiN4));
check(`characters/kanji/n3.json (${(kanjiN3 as unknown[]).length} entries)`, validateCharacters(kanjiN3));
check(`characters/kanji/n2.json (${(kanjiN2 as unknown[]).length} entries)`, validateCharacters(kanjiN2));
check(`characters/kanji/n1.json (${(kanjiN1 as unknown[]).length} entries)`, validateCharacters(kanjiN1));
check(`readings/n5.json (${(readingsN5 as unknown[]).length} entries)`, validateReadings(readingsN5));
check(`readings/n4.json (${(readingsN4 as unknown[]).length} entries)`, validateReadings(readingsN4));
check(`readings/n3.json (${(readingsN3 as unknown[]).length} entries)`, validateReadings(readingsN3));
check(`readings/n2.json (${(readingsN2 as unknown[]).length} entries)`, validateReadings(readingsN2));
check(`readings/n1.json (${(readingsN1 as unknown[]).length} entries)`, validateReadings(readingsN1));
check(`roadmaps.json (${(roadmaps as unknown[]).length} entries)`, validateRoadmaps(roadmaps));
check(`resources.json (${(resources as unknown[]).length} entries)`, validateResources(resources));

console.log('\nValidating English pack...\n');

check('english/manifest.json', validateManifest(englishManifest));
check(`english/vocabulary/a1.json (${(englishVocabA1 as unknown[]).length} entries)`, validateVocabulary(englishVocabA1));
check(`english/vocabulary/a2.json (${(englishVocabA2 as unknown[]).length} entries)`, validateVocabulary(englishVocabA2));
check(`english/grammar/a1.json (${(englishGrammarA1 as unknown[]).length} entries)`, validateGrammar(englishGrammarA1));
check(`english/grammar/a2.json (${(englishGrammarA2 as unknown[]).length} entries)`, validateGrammar(englishGrammarA2));
check(`english/readings/a1.json (${(englishReadingsA1 as unknown[]).length} entries)`, validateReadings(englishReadingsA1));
check(`english/readings/a2.json (${(englishReadingsA2 as unknown[]).length} entries)`, validateReadings(englishReadingsA2));
check(`english/roadmaps.json (${(englishRoadmaps as unknown[]).length} entries)`, validateRoadmaps(englishRoadmaps));
check(`english/resources.json (${(englishResources as unknown[]).length} entries)`, validateResources(englishResources));

if (hasErrors) {
  console.log('\n❌ Validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ All pack data valid!');
}
