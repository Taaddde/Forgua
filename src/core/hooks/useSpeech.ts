/**
 * Speech recognition hook — wraps Web Speech API (STT).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechRecognitionSupported, createSpeechRecognition } from '../engine/speech';

export function useSpeech(defaultLang?: string, continuous = false) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);

  const startListening = useCallback((lang?: string) => {
    if (!isSpeechRecognitionSupported()) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);

    try {
      const recognition = createSpeechRecognition({
        lang: lang ?? defaultLang ?? 'en-US',
        continuous,
        interimResults: true,
        onResult: (result) => {
          if (result.isFinal) {
            setTranscript(result.transcript);
            setConfidence(result.confidence);
            setInterimTranscript('');
          } else {
            setInterimTranscript(result.transcript);
          }
        },
        onError: (err) => {
          setError(err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recognition');
    }
  }, [defaultLang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported: isSpeechRecognitionSupported(),
    error,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
  };
}
