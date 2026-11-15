"use client";

// "Save as PDF" and "Download" for a report on screen (visit summary, weekly and monthly overview).
import type { RefObject } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText, printElement } from "@/lib/exportReport";

export function ReportActions({
  target,
  fileName,
  text,
}: {
  target: RefObject<HTMLElement | null>;
  fileName: string; // without an extension
  text: () => string;
}) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => printElement(target.current, fileName)}>
        <Printer className="size-4" aria-hidden />
        Save as PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => downloadText(`${fileName}.txt`, text())}>
        <Download className="size-4" aria-hidden />
        Download
      </Button>
    </div>
  );
}
