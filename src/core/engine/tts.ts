/**
 * SpeechSynthesis (TTS) wrapper
 * Uses the browser's built-in speech synthesis API.
 */

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoicesForLang(lang: string): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  const prefix = lang.split('-')[0];
  return speechSynthesis.getVoices().filter((v) => v.lang.startsWith(prefix));
}

export function speak(text: string, lang: string, rate: number = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error('TTS not supported'));
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    // Prefer local/native voices — they handle single characters better
    const voices = getVoicesForLang(lang);
    if (voices.length > 0) {
      const localVoice = voices.find((v) => v.localService) ?? voices[0];
      utterance.voice = localVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (isTTSSupported()) {
    speechSynthesis.cancel();
  }
}
