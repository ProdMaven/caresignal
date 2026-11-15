// Saving a report from the screen: as a PDF through the browser's own print dialog, or as a plain text file.
// Nothing is sent anywhere. The PDF holds exactly what is on screen inside the given element.

// Prints one element on its own. The copy goes into #print-root, and the print rules in globals.css hide the rest.
export function printElement(element: HTMLElement | null, title: string): void {
  if (!element || typeof window === "undefined") return;
  document.getElementById("print-root")?.remove();
  const root = document.createElement("div");
  root.id = "print-root";
  const heading = document.createElement("p");
  heading.className = "print-brand";
  heading.textContent = "Unspoken";
  root.append(heading, element.cloneNode(true));
  document.body.appendChild(root);
  document.body.classList.add("printing");
  // Browsers offer the page title as the PDF file name.
  const previousTitle = document.title;
  document.title = title;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove("printing");
    root.remove();
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  // Some mobile browsers never fire afterprint.
  window.setTimeout(cleanup, 60_000);
}

export function downloadText(filename: string, text: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

// "Helen", "summary 14 days" -> "unspoken-helen-summary-14-days"
export function reportFileName(...parts: string[]): string {
  const slug = parts.join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `unspoken-${slug || "report"}`;
}
