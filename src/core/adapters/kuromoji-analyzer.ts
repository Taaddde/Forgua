/**
 * Browser-compatible Kuroshiro analyzer using @sglkc/kuromoji.
 *
 * Replaces kuroshiro-analyzer-kuromoji which bundles the original
 * kuromoji with Node.js dependencies (path, zlib, fs) that don't
 * work in the browser.
 *
 * Implements the same interface kuroshiro expects from an analyzer:
 *   - init(): Promise<void>
 *   - parse(str): Promise<Token[]>
 */

import kuromoji from '@sglkc/kuromoji';

interface KuromojiToken {
  word_id: number;
  word_type: string;
  word_position: number;
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading?: string;
  pronunciation?: string;
}

interface ParsedToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading?: string;
  pronunciation?: string;
  verbose: {
    word_id: number;
    word_type: string;
    word_position: number;
  };
}

interface Tokenizer {
  tokenize(text: string): KuromojiToken[];
}

export class BrowserKuromojiAnalyzer {
  private _analyzer: Tokenizer | null = null;
  private _dictPath: string;

  constructor({ dictPath }: { dictPath?: string } = {}) {
    this._dictPath = dictPath ?? '/dict';
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._analyzer != null) {
        reject(new Error('This analyzer has already been initialized.'));
        return;
      }
      kuromoji.builder({ dicPath: this._dictPath }).build((err, tokenizer) => {
        if (err) {
          reject(err);
        } else {
          this._analyzer = tokenizer as unknown as Tokenizer;
          resolve();
        }
      });
    });
  }

  parse(str = ''): Promise<ParsedToken[]> {
    return new Promise((resolve) => {
      if (str.trim() === '') return resolve([]);
      const result = this._analyzer!.tokenize(str);
      const parsed: ParsedToken[] = result.map((token) => ({
        surface_form: token.surface_form,
        pos: token.pos,
        pos_detail_1: token.pos_detail_1,
        pos_detail_2: token.pos_detail_2,
        pos_detail_3: token.pos_detail_3,
        conjugated_type: token.conjugated_type,
        conjugated_form: token.conjugated_form,
        basic_form: token.basic_form,
        reading: token.reading,
        pronunciation: token.pronunciation,
        verbose: {
          word_id: token.word_id,
          word_type: token.word_type,
          word_position: token.word_position,
        },
      }));
      resolve(parsed);
    });
  }
}
