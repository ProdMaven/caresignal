import type { Metadata, Viewport } from "next";
import { BottomNav, TopBar } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareSignal",
  description:
    "Voice-first logging for people who care for someone who cannot say what they need. Supports caregivers. Does not diagnose.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-28 pt-5">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
