/**
 * Web Audio API wrapper for recording and basic pitch analysis.
 * Experimental — used for pronunciation feedback.
 */

export interface RecordingResult {
  blob: Blob;
  duration: number;
}

export function isRecordingSupported(): boolean {
  return typeof window !== 'undefined' &&
    'MediaRecorder' in window &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;
}

export async function startRecording(): Promise<{
  stop: () => Promise<RecordingResult>;
  cancel: () => void;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  const startTime = Date.now();

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  return {
    stop: () =>
      new Promise<RecordingResult>((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          resolve({ blob, duration: (Date.now() - startTime) / 1000 });
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
