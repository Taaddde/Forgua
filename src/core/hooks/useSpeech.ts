/**
 * Speech recognition hook — wraps Web Speech API (STT).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechRecognitionSupported, createSpeechRecognition, requestMicrophonePermission } from '../engine/speech';

export function useSpeech(defaultLang?: string, continuous = false) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);

  const startListening = useCallback(async (lang?: string) => {
    if (!isSpeechRecognitionSupported()) {
      setError('stt-not-supported');
      return;
    }

    // Request microphone permission first — triggers the OS dialog if needed
    const mic = await requestMicrophonePermission();
    if (!mic.granted) {
      setError(mic.error ?? 'mic-denied');
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
      setError(err instanceof Error ? err.message : 'stt-start-failed');
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
