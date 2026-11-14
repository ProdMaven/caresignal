"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, Info, MessageCircleQuestion, Mic, Trophy, UserRound } from "lucide-react";
import { MODE_LIST, MODES } from "@/config/modes";
import { useMode } from "@/hooks/useAppState";
import { cn } from "@/lib/utils";

export function ModeSwitch() {
  const [mode, setMode] = useMode();
  return (
    <div role="group" aria-label="Care mode" className="flex rounded-full border bg-muted p-1">
      {MODE_LIST.map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? `${MODES[m].accentBg} text-white shadow-sm` : "text-muted-foreground hover:text-foreground",
            )}
          >
            {MODES[m].label}
          </button>
        );
      })}
    </div>
  );
}

export function TopBar() {
  const gated = usePathname() === "/invite";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <HeartHandshake className="size-6 text-primary" aria-hidden />
          CareSignal
        </Link>
        {!gated && <ModeSwitch />}
      </div>
    </header>
  );
}

const NAV = [
  { href: "/", label: "Log", icon: Mic },
  { href: "/person", label: "Timeline", icon: UserRound },
  { href: "/ask", label: "Ask", icon: MessageCircleQuestion },
  { href: "/patterns", label: "What worked", icon: Trophy },
  { href: "/about", label: "About", icon: Info },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/invite") return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex w-full max-w-xl">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-6", active && "stroke-[2.5]")} aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
