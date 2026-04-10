/**
 * SpeechSynthesis (TTS) wrapper
 * Uses the browser's built-in speech synthesis API.
 *
 * Voice quality is wildly inconsistent across OSs because the Web Speech API
 * delegates to whatever voices the OS provides. We apply a quality heuristic
 * to pick the best default, expose the full voice list for manual selection,
 * and let callers override the voice per utterance.
 */

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Returns all voices matching a BCP-47 language tag.
 * Matches exact tag first, then just the primary subtag ("en-US" → "en").
 */
export function getVoicesForLang(lang: string): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  const all = speechSynthesis.getVoices();
  const prefix = lang.split('-')[0];
  return all.filter((v) => v.lang === lang || v.lang.startsWith(prefix));
}

/** Returns every voice the browser knows about. */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  return speechSynthesis.getVoices();
}

/**
 * Scores a voice by likely audio quality for the given language.
 * Higher is better. Returns a negative number if the voice is language-incompatible.
 *
 * Heuristic rationale:
 *  - Apple ships "Compact" voices (~10 MB, concatenative) as the default on macOS/iOS;
 *    they sound muffled/raspy. Premium/Enhanced variants must be downloaded manually.
 *  - Windows SAPI "Desktop" voices sound robotic; Windows "Natural/Neural" are good.
 *  - Linux defaults to espeak-ng, which is universally regarded as poor quality.
 *  - Chrome bundles "Google" network voices that are significantly better than most
 *    compact local voices, at the cost of requiring network.
 */
export function voiceQualityScore(v: SpeechSynthesisVoice, lang: string): number {
  // Language compatibility first — early exit for mismatches.
  const primary = lang.split('-')[0];
  if (v.lang !== lang && !v.lang.startsWith(primary)) return -1;

  let score = 0;
  if (v.lang === lang) score += 100;
  else score += 50;

  const id = `${v.name} ${v.voiceURI}`.toLowerCase();

  // Quality markers (vendor-specific naming conventions).
  if (id.includes('premium')) score += 60;
  if (id.includes('neural') || id.includes('natural')) score += 55;
  if (id.includes('enhanced')) score += 45;
  if (id.includes('wavenet')) score += 50; // Google Cloud voices (rarely exposed, but just in case)

  // Penalties.
  if (id.includes('compact')) score -= 40;
  if (id.includes('espeak')) score -= 80;
  if (id.includes('festival')) score -= 60;

  // Chrome "Google" network voices are generally good, but require connectivity.
  if (!v.localService && id.startsWith('google')) score += 25;

  // Slight preference for local voices — reliable offline and usually lower latency.
  if (v.localService) score += 5;

  return score;
}

/** Returns true if the given voice is known to sound low-quality. */
export function isLikelyLowQualityVoice(v: SpeechSynthesisVoice): boolean {
  const id = `${v.name} ${v.voiceURI}`.toLowerCase();
  return id.includes('compact') || id.includes('espeak') || id.includes('festival');
}

/**
 * Picks the best voice for a given language, applying user preferences first.
 *
 * @param lang BCP-47 language tag (e.g. "ja-JP")
 * @param preferredVoiceURI Optional user-selected voice URI for this language
 */
export function pickBestVoice(
  lang: string,
  preferredVoiceURI?: string,
): SpeechSynthesisVoice | null {
  if (!isTTSSupported()) return null;

  const candidates = getVoicesForLang(lang);
  if (candidates.length === 0) return null;

  // 1. User explicitly chose a voice — honor it if still available.
  if (preferredVoiceURI) {
    const pick = candidates.find((v) => v.voiceURI === preferredVoiceURI);
    if (pick) return pick;
  }

  // 2. Rank by quality heuristic.
  const ranked = [...candidates].sort(
    (a, b) => voiceQualityScore(b, lang) - voiceQualityScore(a, lang),
  );
  return ranked[0] ?? null;
}

export interface SpeakOptions {
  lang: string;
  rate?: number;
  voiceURI?: string;
}

export function speak(text: string, options: SpeakOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error('TTS not supported'));
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang;
    utterance.rate = options.rate ?? 1.0;

    const voice = pickBestVoice(options.lang, options.voiceURI);
    if (voice) utterance.voice = voice;

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

/**
 * Waits until the voice list is populated. Chrome fires `voiceschanged`
 * asynchronously on first load, so `getVoices()` can return [] on initial call.
 */
export function waitForVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve([]);
      return;
    }
    const existing = speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeoutMs);
  });
}
