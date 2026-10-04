import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers that support it
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null;
  onspeechstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
}

/**
 * Maps spoken punctuation keywords into written glyphs
 * and formats spacing & capitalization.
 */
export function postProcessPunctuation(text: string): string {
  if (!text) return '';

  let formatted = text;

  const punctuationMap: [RegExp, string][] = [
    [/\b(?:period|full stop)\b/gi, '.'],
    [/\bcomma\b/gi, ','],
    [/\bquestion mark\b/gi, '?'],
    [/\bexclamation (?:mark|point)\b/gi, '!'],
    [/\b(?:new line|newline|next line)\b/gi, '\n'],
    [/\bcolon\b/gi, ':'],
    [/\b(?:semicolon|semi-colon)\b/gi, ';'],
    [/\b(?:dash|hyphen)\b/gi, ' - '],
  ];

  for (const [regex, replacement] of punctuationMap) {
    formatted = formatted.replace(regex, replacement);
  }

  // Remove space right before punctuation marks
  formatted = formatted.replace(/\s+([.,!?:;])/g, '$1');
  // Ensure single space after punctuation if followed by word
  formatted = formatted.replace(/([.,!?:;])([A-Za-z0-9])/g, '$1 $2');
  // Clean spaces around newlines
  formatted = formatted.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');

  // Capitalize first character of string and first character after sentence-ending punctuation
  formatted = formatted.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase());

  return formatted;
}

export function useVoiceTranscriber() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isManuallyStoppedRef = useRef(false);

  // Clear silence fallback timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Stop recording and cleanup
  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    clearSilenceTimer();

    if (durationTimerRef.current !== null) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition might already be stopped
      }
    }

    setIsListening(false);
    setAudioLevel(0);
  }, [clearSilenceTimer]);

  // Reset silence timer: auto-stop after 3.5s of dead air
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      // 3.5s of silence detected -> auto-stop
      stopListening();
    }, 3500);
  }, [clearSilenceTimer, stopListening]);

  // Reset all transcripts
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setAudioDuration(0);
  }, []);

  const startListening = useCallback(async () => {
    resetTranscript();
    setError(null);
    isManuallyStoppedRef.current = false;

    // Haptic feedback trigger
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        // Safe ignore
      }
    }

    // Audio Visualizer setup via Web Audio API
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalized = Math.min(1, Math.max(0, average / 128));
            setAudioLevel(normalized);
            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      }
    } catch {
      // Microphone stream for visualization optional or blocked; fallback simulation will run if needed
    }

    // SpeechRecognition check
    const SpeechRecognitionConstructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setAudioDuration(0);

        // Start elapsed audio duration counter
        if (durationTimerRef.current !== null) {
          window.clearInterval(durationTimerRef.current);
        }
        durationTimerRef.current = window.setInterval(() => {
          setAudioDuration((prev) => prev + 1);
        }, 1000);

        // Initiate 3.5s silence timer
        resetSilenceTimer();
      };

      recognition.onspeechstart = () => {
        resetSilenceTimer();
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        resetSilenceTimer();

        let finalAccumulator = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const textChunk = result[0].transcript;
          if (result.isFinal) {
            finalAccumulator += textChunk;
          } else {
            currentInterim += textChunk;
          }
        }

        if (finalAccumulator) {
          setTranscript((prev) => {
            const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            const rawCombined = prev + separator + finalAccumulator;
            return postProcessPunctuation(rawCombined);
          });
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'no-speech') {
          // Normal timeout or silence, keep listening or handled by silence timer
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        console.warn('SpeechRecognition error:', event.error, event.message);
        setError(`Microphone error: ${event.error}`);
      };

      recognition.onend = () => {
        // If not explicitly stopped and still supposed to be active, restart (handled smoothly)
        if (!isManuallyStoppedRef.current) {
          setIsListening(false);
          clearSilenceTimer();
          if (durationTimerRef.current !== null) {
            window.clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
        }
      };

      recognition.start();
    } catch (err: unknown) {
      console.error('Failed to start speech recognition:', err);
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
      setIsListening(false);
    }
  }, [clearSilenceTimer, resetSilenceTimer, resetTranscript, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    audioDuration,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
