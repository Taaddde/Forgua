import { describe, it, expect } from 'vitest';
import { isTTSSupported } from '../tts';

describe('TTS engine', () => {
  it('detects TTS support (false in jsdom)', () => {
    expect(isTTSSupported()).toBe(false);
  });
});
