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
const IN_APP_BROWSER =
  "Voice does not work inside this app's built-in browser. Open this page in Chrome or Safari, or type your note instead.";

// Links opened from chat and social apps load in a built-in browser where speech recognition is missing or blocked.
function inAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent);
}

export interface UseSpeech {
  supported: boolean;
  listening: boolean;
  interim: string; // words heard so far in the current phrase
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

// How many times in a row the mic may come back with nothing before it stops by itself.
const MAX_EMPTY_SESSIONS = 2;

// onFinal is called with each finished phrase.
// The mic keeps listening across pauses until the caregiver taps it again: browsers end a session after a
// short silence, so the hook starts a fresh session each time one ends while the mic is still wanted.
export function useSpeech(onFinal: (text: string) => void): UseSpeech {
  // false on the server and on the first client render, then the real answer.
  const supported = useSyncExternalStore(noopSubscribe, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const wantedRef = useRef(false); // the caregiver wants the mic on
  const emptyRef = useRef(0); // sessions in a row that heard nothing
  const heardAnyRef = useRef(false); // anything heard since the mic was tapped on
  const onFinalRef = useRef(onFinal);
  const beginRef = useRef<() => void>(() => {});

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(
    () => () => {
      wantedRef.current = false;
      recognitionRef.current?.abort();
    },
    [],
  );

  const stop = useCallback(() => {
    wantedRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const begin = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      wantedRef.current = false;
      setListening(false);
      setError(inAppBrowser() ? IN_APP_BROWSER : SPEECH_NOT_SUPPORTED);
      return;
    }
    const recognition = new Ctor();
    let heard = false;
    let fatal = false;
    // Read each time a session starts, so a language change applies from the next phrase.
    recognition.lang = currentSpeechLanguage();
    recognition.continuous = false; // one phrase per session; restarted in onend while the mic is wanted
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const words = result[0].transcript.trim();
        if (!words) continue;
        heard = true;
        heardAnyRef.current = true;
        if (result.isFinal) onFinalRef.current(words);
        else live += result[0].transcript;
      }
      setInterim(live);
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return; // handled in onend
      fatal = true;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError(
          inAppBrowser()
            ? IN_APP_BROWSER
            : "The microphone is blocked. Allow the microphone for this site in your browser settings, or type your note instead.",
        );
      } else if (event.error === "language-not-supported") {
        setError("This browser cannot listen in that language. Please pick another language or type your note.");
      } else if (event.error === "network") {
        setError("Voice needs an internet connection and could not reach the speech service. Please try again or type your note.");
      } else if (event.error === "audio-capture") {
        setError("No microphone was found. Please check your microphone or type your note instead.");
      } else {
        setError("Voice did not work this time. Please type your note instead.");
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return; // a newer session took over
      setInterim("");
      emptyRef.current = heard ? 0 : emptyRef.current + 1;
      if (wantedRef.current && !fatal && emptyRef.current < MAX_EMPTY_SESSIONS) {
        beginRef.current(); // keep listening across the pause
        return;
      }
      if (wantedRef.current && !fatal && !heardAnyRef.current) {
        setError("I did not hear anything. Tap the mic and try again, or type your note.");
      }
      wantedRef.current = false;
      setListening(false);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      wantedRef.current = false;
      setError("Voice did not start. Please type your note instead.");
      setListening(false);
    }
  }, []);

  useEffect(() => {
    beginRef.current = begin;
  }, [begin]);

  const start = useCallback(() => {
    recognitionRef.current?.abort();
    wantedRef.current = true;
    emptyRef.current = 0;
    heardAnyRef.current = false;
    setError(null);
    setInterim("");
    begin();
  }, [begin]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}
