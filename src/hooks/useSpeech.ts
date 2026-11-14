"use client";

// Web Speech API hook: live interim text, final text, and a graceful fallback
// when the browser has no speech recognition or the mic is blocked. Owner: Lane 1.
import { currentSpeechLanguage } from "@/hooks/useAppState";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechAlternative;
}
interface SpeechResultEvent {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult };
}
interface SpeechErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

export const SPEECH_NOT_SUPPORTED = "Voice is not supported in this browser. Please type your note instead.";

export interface UseSpeech {
  supported: boolean;
  listening: boolean;
  interim: string; // words heard so far in the current phrase
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

// onFinal is called with each finished phrase.
export function useSpeech(onFinal: (text: string) => void): UseSpeech {
  // false on the server and on the first client render, then the real answer.
  const supported = useSyncExternalStore(noopSubscribe, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError(SPEECH_NOT_SUPPORTED);
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = currentSpeechLanguage();
    recognition.continuous = false; // stops by itself after a pause
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) onFinalRef.current(result[0].transcript.trim());
        else live += result[0].transcript;
      }
      setInterim(live);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("The microphone is blocked. Please type your note instead.");
      } else if (event.error === "no-speech") {
        setError("I did not hear anything. Tap the mic and try again, or type your note.");
      } else if (event.error === "language-not-supported") {
        setError("This browser cannot listen in that language. Please pick another language or type your note.");
      } else if (event.error !== "aborted") {
        setError("Voice did not work this time. Please type your note instead.");
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = recognition;
    setError(null);
    setInterim("");
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Voice did not start. Please type your note instead.");
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}
