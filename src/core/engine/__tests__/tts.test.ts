import { describe, it, expect } from 'vitest';
import { isTTSSupported, voiceQualityScore, isLikelyLowQualityVoice } from '../tts';

/** Build a mock SpeechSynthesisVoice — jsdom doesn't provide one. */
function mockVoice(partial: Partial<SpeechSynthesisVoice>): SpeechSynthesisVoice {
  return {
    default: false,
    lang: 'en-US',
    localService: true,
    name: 'Mock',
    voiceURI: 'mock',
    ...partial,
  } as SpeechSynthesisVoice;
}

describe('TTS engine', () => {
  it('detects TTS support (false in jsdom)', () => {
    expect(isTTSSupported()).toBe(false);
  });

  describe('voiceQualityScore', () => {
    it('returns -1 for language mismatch', () => {
      const v = mockVoice({ lang: 'fr-FR' });
      expect(voiceQualityScore(v, 'ja-JP')).toBe(-1);
    });

    it('rewards exact language match over prefix match', () => {
      const exact = mockVoice({ lang: 'ja-JP', name: 'Kyoko', voiceURI: 'kyoko-basic' });
      const prefix = mockVoice({ lang: 'ja', name: 'Kyoko', voiceURI: 'kyoko-basic' });
      expect(voiceQualityScore(exact, 'ja-JP')).toBeGreaterThan(
        voiceQualityScore(prefix, 'ja-JP'),
      );
    });

    it('ranks premium voices above compact ones', () => {
      const premium = mockVoice({
        lang: 'ja-JP',
        name: 'Kyoko (Premium)',
        voiceURI: 'com.apple.voice.premium.ja-JP.Kyoko',
      });
      const compact = mockVoice({
        lang: 'ja-JP',
        name: 'Kyoko',
        voiceURI: 'com.apple.voice.compact.ja-JP.Kyoko',
      });
      expect(voiceQualityScore(premium, 'ja-JP')).toBeGreaterThan(
        voiceQualityScore(compact, 'ja-JP'),
      );
    });

    it('ranks neural/natural voices high', () => {
      const neural = mockVoice({
        lang: 'ja-JP',
        name: 'Microsoft Nanami Online (Natural) - Japanese (Japan)',
        voiceURI: 'nanami-natural',
      });
      const compact = mockVoice({
        lang: 'ja-JP',
        name: 'Kyoko',
        voiceURI: 'com.apple.voice.compact.ja-JP.Kyoko',
      });
      expect(voiceQualityScore(neural, 'ja-JP')).toBeGreaterThan(
        voiceQualityScore(compact, 'ja-JP'),
      );
    });

    it('penalizes espeak heavily', () => {
      const espeak = mockVoice({ lang: 'ja', name: 'espeak-ng japanese', voiceURI: 'espeak' });
      const plain = mockVoice({ lang: 'ja-JP', name: 'Kyoko', voiceURI: 'kyoko' });
      expect(voiceQualityScore(espeak, 'ja-JP')).toBeLessThan(voiceQualityScore(plain, 'ja-JP'));
    });

    it('rewards remote google voices but still prefers local premium', () => {
      const google = mockVoice({
        lang: 'ja-JP',
        name: 'Google 日本語',
        voiceURI: 'google-ja',
        localService: false,
      });
      const premium = mockVoice({
        lang: 'ja-JP',
        name: 'Kyoko (Premium)',
        voiceURI: 'com.apple.voice.premium.ja-JP.Kyoko',
        localService: true,
      });
      expect(voiceQualityScore(premium, 'ja-JP')).toBeGreaterThan(
        voiceQualityScore(google, 'ja-JP'),
      );
    });
  });

  describe('isLikelyLowQualityVoice', () => {
    it('flags compact apple voices', () => {
      const v = mockVoice({
        name: 'Kyoko',
        voiceURI: 'com.apple.voice.compact.ja-JP.Kyoko',
      });
      expect(isLikelyLowQualityVoice(v)).toBe(true);
    });

    it('flags espeak voices', () => {
      const v = mockVoice({ name: 'espeak-ng english', voiceURI: 'espeak-en' });
      expect(isLikelyLowQualityVoice(v)).toBe(true);
    });

    it('does not flag premium voices', () => {
      const v = mockVoice({
        name: 'Kyoko (Premium)',
        voiceURI: 'com.apple.voice.premium.ja-JP.Kyoko',
      });
      expect(isLikelyLowQualityVoice(v)).toBe(false);
    });

    it('does not flag neural voices', () => {
      const v = mockVoice({
        name: 'Microsoft Nanami Online (Natural)',
        voiceURI: 'nanami-natural',
      });
      expect(isLikelyLowQualityVoice(v)).toBe(false);
    });
  });
});
