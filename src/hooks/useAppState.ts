"use client";

// Mode and selected person, kept in localStorage so they survive reloads and
// follow the caregiver across screens.
import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SPEECH_LANGUAGE, isSpeechLanguage, SPEECH_LANGUAGE_KEY } from "@/config/languages";
import { DEFAULT_MODE, MODES } from "@/config/modes";
import type { Mode, Person } from "@/lib/types";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private browsing: the choice still holds until the page reloads
    memory.set(key, value);
  }
  listeners.forEach((l) => l());
}

const memory = new Map<string, string>();

function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key) ?? memory.get(key) ?? null,
    () => null,
  );
}

export function useMode(): [Mode, (mode: Mode) => void] {
  const stored = useStored("caresignal.mode");
  const mode: Mode = stored === "autism" || stored === "dementia" ? stored : DEFAULT_MODE;
  const setMode = useCallback((next: Mode) => write("caresignal.mode", next), []);
  return [mode, setMode];
}

// The picked person for a mode. Falls back to the first person in the list.
export function useSelectedPerson(mode: Mode, people: Person[] | null): [Person | null, (id: string) => void] {
  const key = `caresignal.person.${mode}`;
  const stored = useStored(key);
  const person = people?.find((p) => p.id === stored) ?? people?.[0] ?? null;
  const setPerson = useCallback((id: string) => write(key, id), [key]);
  return [person, setPerson];
}

// Who is logging. Falls back to the first caregiver of the mode.
export function useCaregiver(mode: Mode): [string, (id: string) => void] {
  const key = `caresignal.caregiver.${mode}`;
  const stored = useStored(key);
  const caregivers = MODES[mode].caregivers;
  const id = caregivers.find((c) => c.id === stored)?.id ?? caregivers[0].id;
  const setCaregiver = useCallback((next: string) => write(key, next), [key]);
  return [id, setCaregiver];
}

// The language the caregiver speaks into the mic. Shared by every screen with a mic.
export function useSpeechLanguage(): [string, (code: string) => void] {
  const stored = useStored(SPEECH_LANGUAGE_KEY);
  const code = isSpeechLanguage(stored) ? stored : DEFAULT_SPEECH_LANGUAGE;
  const setCode = useCallback((next: string) => write(SPEECH_LANGUAGE_KEY, next), []);
  return [code, setCode];
}

// Read at the moment the mic starts, so a change applies to the next phrase.
export function currentSpeechLanguage(): string {
  const stored = read(SPEECH_LANGUAGE_KEY) ?? memory.get(SPEECH_LANGUAGE_KEY) ?? null;
  return isSpeechLanguage(stored) ? stored : DEFAULT_SPEECH_LANGUAGE;
}
