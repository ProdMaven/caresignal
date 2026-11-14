# Rename: CareSignal to Unspoken (instructions for Claude Code)

Decided by the PM on Sat Nov 14. Read `docs/BRAND.md` first. This is a display-name change only. Do it on the build branch, test on staging, then merge.

## Do not change (these stay "caresignal")
- GitHub repo name, Railway project and service names, both URLs, invite codes (`GTRANSFORMER-JUDGE`, `CARE-TRIAL`, `STAGING-EVAL`).
- `package.json` name and `package-lock.json`.
- localStorage keys (`caresignal.mode`, `caresignal.person.*`, `caresignal.caregiver.*`, `caresignal.speechLang`). Changing them would drop every tester's saved choices.
- Response headers `x-caresignal-source` and `x-caresignal-meta`. The eval runner reads them.
- Internal identifiers (`__caresignalPrisma`, `__caresignalMockStore`), Prisma schema comments, env var names.
- Past result files in `eval/results/` and `safety/results/` (they are a record of what ran), and `research_notes/`.
- Research documents in `docs/research/` (they describe the product as it was named at the time). Add one line at the top of `market_and_differentiation.md` and `feedback_running_list.md`: "CareSignal was renamed Unspoken on Nov 14."

## Change (what a user, judge, or reader sees)

### 1. App (user-visible text only)
Replace the display name "CareSignal" with "Unspoken" in:
- `src/app/layout.tsx` (page title and description metadata)
- `src/components/site-chrome.tsx` (header wordmark; add tagline "Every need, finally heard." where space allows)
- `src/app/invite/page.tsx`
- `src/app/(pages)/page.tsx`, `src/app/(pages)/about/page.tsx`, `src/app/(pages)/checkin/page.tsx`
- `src/components/safety-message.tsx`
- Any user-facing strings in `src/lib/safety.ts`, `src/mocks/safety.ts`, `src/mocks/ask.ts`, `src/lib/api.ts` (error messages)

Check each match before replacing: only strings shown to a person. Grep: `grep -rIn "CareSignal" src`.

Copy rule from BRAND.md: "can't always say what they need", never "can't communicate" or "has no voice".

### 2. Prompts (handle with care)
`src/prompts/formatter.ts` and `src/prompts/checkin.ts` mention the product name. Changing a prompt changes model behavior and resets the prompt cache.
- Change the name there too, so the model never tells a caregiver it is "CareSignal".
- Deploy to staging, then run both sets: `npm run eval` and `npm run safety` against staging.
- Keep the change only if benchmark and red team are no lower than the last staging run, and crisis and out of scope stay at 100%. If anything drops, revert the prompt change and report it.

### 3. Eval tooling
- `eval/run.ts`, `eval/grader.ts`, `eval/lib/*.ts`: change the name only in report text and titles. Do not touch header names or logic.
- `eval/lib/lexicon.ts`: if "CareSignal" is in a word list used for grading (for example, to detect the app naming itself), add "Unspoken" alongside it. Do not remove the old name, so past outputs still grade the same.
- Regenerate `docs/eval_report.md` and `docs/safety_report.md` by running the evals; do not hand-edit them.

### 4. Living docs
Update the name in: `README.md` (title, first paragraph; add "(working name)" on first mention and the tagline), `CLAUDE.md`, `docs/PITCH.md`, `docs/problem.md`, `docs/PRD.md`, `docs/DATA_HANDLING.md`, `docs/EVALS.md`, `docs/HANDOFF.md`, `docs/DELIVERABLES.md`, `docs/JUDGING.md`.
- In `README.md`, add one line: "Formerly CareSignal. The repository and URLs keep the old name."
- In `docs/PITCH.md`, use the story, tagline, and closing line from `docs/BRAND.md`. Title slide: "Unspoken (working name). Every need, finally heard."
- Add to `docs/DECISIONS.md`: "Renamed CareSignal to Unspoken: rejected keeping the name. CareSignal is an existing healthcare company (remote patient monitoring, part of Lightbeam Health Solutions), which is a conflict in front of investors and care programs."

## Verify
1. `grep -rIn "CareSignal" src docs/PITCH.md docs/problem.md README.md CLAUDE.md` returns only the "Formerly CareSignal" line and intentional notes.
2. `npm run build` passes.
3. On staging: header shows "Unspoken", invite screen and About page read correctly on a phone-width screen, saved mode and person choices still load (localStorage keys unchanged).
4. Evals on staging are no lower than before; reports regenerated.
5. Merge to `main` once, at a quiet moment. A deploy clears the live demo data.
6. Update `docs/HANDOFF.md`, commit, push.
