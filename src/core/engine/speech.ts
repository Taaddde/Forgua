/**
 * Web Speech API (STT) wrapper
 * Only works in Chrome/Edge. Graceful degradation in other browsers.
 */

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
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
