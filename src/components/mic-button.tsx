"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export function MicButton({
  listening,
  onClick,
  size = "lg",
  disabled,
}: {
  listening: boolean;
  onClick: () => void;
  size?: "lg" | "sm";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop listening" : "Speak your note"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-50",
        size === "lg" ? "size-24" : "size-14",
        listening ? "mic-listening bg-rose-700" : "bg-primary hover:bg-primary/90",
      )}
    >
      {listening ? (
        <Square className={size === "lg" ? "size-9" : "size-6"} fill="currentColor" aria-hidden />
      ) : (
        <Mic className={size === "lg" ? "size-11" : "size-7"} aria-hidden />
      )}
    </button>
  );
}
