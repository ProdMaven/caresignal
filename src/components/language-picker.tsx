"use client";

import { Languages } from "lucide-react";
import { SPEECH_LANGUAGES } from "@/config/languages";
import { useSpeechLanguage } from "@/hooks/useAppState";

// Which language the mic listens for. Typed notes can be in any language without changing this.
export function LanguagePicker({ disabled }: { disabled?: boolean }) {
  const [code, setCode] = useSpeechLanguage();
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5 font-semibold">
        <Languages className="size-4" aria-hidden />
        I am speaking in
      </span>
      <select
        value={code}
        disabled={disabled}
        onChange={(e) => setCode(e.target.value)}
        className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SPEECH_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
