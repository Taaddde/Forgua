/**
 * Web Speech API (STT) wrapper
 * Only works in Chrome/Edge. Graceful degradation in other browsers.
 */

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // macOS TCC kills non-bundled binaries that access SpeechRecognition,
  // even with NSSpeechRecognitionUsageDescription embedded in the Mach-O.
  // Only a signed .app bundle satisfies TCC. Disable in Tauri to prevent crash.
  if ('__TAURI_INTERNALS__' in window) return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/** Request microphone permission via getUserMedia. Returns true if granted. */
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'mic-unavailable' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return { granted: false, error: 'mic-denied' };
    }
    return { granted: false, error: 'mic-unavailable' };
  }
}

export interface SpeechRecognitionCallbackResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export function createSpeechRecognition(options: {
  lang: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (result: SpeechRecognitionCallbackResult) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): { start: () => void; stop: () => void; abort: () => void } {
  const SpeechRecognitionAPI =
    (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | undefined ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;

  if (!SpeechRecognitionAPI) {
    throw new Error('SpeechRecognition not supported');
  }

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = options.lang;
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const lastResult = event.results[event.results.length - 1];
    options.onResult({
      transcript: lastResult[0].transcript,
      confidence: lastResult[0].confidence,
      isFinal: lastResult.isFinal,
    });
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    options.onError(event.error ?? 'Unknown error');
  };

  recognition.onend = () => {
    options.onEnd();
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  };
}
