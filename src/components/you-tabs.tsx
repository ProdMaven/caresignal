"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "Account" },
  { href: "/checkin", label: "Check in" },
  { href: "/journal", label: "My journal" },
];

// Switch between the caregiver's own pages: account settings, check-in, and journal.
export function YouTabs() {
  const pathname = usePathname();
  return (
    <div role="group" aria-label="Your space" className="flex self-start rounded-full border bg-muted p-1">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
