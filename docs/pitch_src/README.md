# Pitch deck source

`deck.html` is the source for `docs/pitch.pdf` (5 slides, 16:9). The three `shot*.png` files are real screens from the app in mock mode, with synthetic data.

Yellow dashed boxes are placeholders to fill before submitting: team names, quote 1, quote 2 (optional), video link, cost per request, first channel.

To rebuild the PDF after editing `deck.html`, print it from Chrome with paper size 13.333 by 7.5 inches, no margins, background graphics on, or run Playwright's `page.pdf` with `width: "13.333in"`, `height: "7.5in"`, `printBackground: true`.
