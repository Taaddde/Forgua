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
  // Tracks intent: true = user wants to keep listening, false = user stopped or error occurred.
  // Used to auto-restart recognition in continuous mode — mobile Chrome fires onend after each
  // utterance/pause even when continuous=true, which is a known browser bug.
  const shouldContinueRef = useRef(false);

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
    shouldContinueRef.current = continuous;

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
          // 'network' means the browser has the API but can't reach Google's STT service.
          // This happens in non-Chrome browsers (Día, Brave with shields, Firefox, etc.)
          // Treat it the same as "not supported" so the UI shows the browser recommendation.
          shouldContinueRef.current = false;
          setError(err === 'network' ? 'stt-not-supported' : err);
          setIsListening(false);
        },
        onEnd: () => {
          // Mobile Chrome (and other mobile browsers) fire onend after each pause even
          // with continuous=true. Auto-restart to keep listening until the user stops.
          if (shouldContinueRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              return; // isListening stays true
            } catch {
              shouldContinueRef.current = false;
            }
          }
          setIsListening(false);
        },
      });

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'stt-start-failed');
    }
  }, [defaultLang, continuous]);

  const stopListening = useCallback(() => {
    shouldContinueRef.current = false;
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
