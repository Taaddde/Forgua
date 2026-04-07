import { describe, it, expect } from 'vitest';
import { isSpeechRecognitionSupported } from '../speech';

describe('Speech recognition', () => {
  it('detects STT support (false in jsdom)', () => {
    expect(isSpeechRecognitionSupported()).toBe(false);
  });
});
