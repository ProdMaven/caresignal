# Handoff: planning session to Claude Code (Fri Nov 13, 9:20 PM)

Read this first, then CLAUDE.md, then the docs it lists. Everything below is the state at handoff.

## Where we are
- Planning is done; no app code exists yet. `main` has docs, contracts, the agent kit, a 30-case benchmark, and a 59-prompt red-team set.
- No teammate branches or commits yet. Lane 1 has not scaffolded.
- Deadline: Sunday Nov 15, 12 PM (see docs/DELIVERABLES.md). Judging rubric and gates: docs/JUDGING.md.

## Decisions made
- Product: CareSignal, one engine for two communities (dementia, autism). Users are anyone who lives with or cares for the person (parents, adult children, spouses, siblings, home aides).
- Statistics find patterns and compute scores; Claude only formats notes and explains numbers.
- Synthetic data only. Organizer-required folder layout: `eval/`, `safety/`, `docs/problem.md`, `docs/eval_report.md`, `docs/safety_report.md`, `docs/pitch.pdf`.
- Judges must be able to type their own input: text box next to the mic, live AI on any input, "Reset demo data" button.
- Caregiver distress ("I can't do this anymore") gets care plus 988, never a log entry. `ParseLogResponse` has `kind` and `message` for this.

## Open decisions (ask Aadi before building past the scaffold)
1. **Scope.** DECIDED Nov 14: keep full PRD scope (all 5 screens, Ask AI, /api/ask). Tighter cut rejected; TASKS cut list is the fallback.
2. **Demo mode.** DECIDED Nov 14: both. Both modes are live; demo opens in dementia and switches to autism with a live log.
3. **First channel to users** for the pitch (a real group the team can reach).
4. **Organizers' template repo.** The deliverables slide says "repo from the template". Get the link; merge its required files into this repo (or recreate from it, per the rules).
5. **Organizers as collaborators.** Need their GitHub usernames.
6. Commits 094012d through 4ad9392 were made under Aadi's email and show as Unverified. Do NOT rewrite or force-push `main` unless Aadi confirms no teammate has pulled. New commits use the Claude identity.

## Next actions, in order
1. Confirm decisions 1 and 2 with Aadi; update docs accordingly.
2. Lane 1: run scaffold-agent (create-next-app in a temp folder, move files in without overwriting docs), mocks for every route, deploy to Railway, seed on start. Public URL tonight is a gate.
3. Lane 2: formatter for /api/log against `eval/cases.json` and `safety/prompts.json`.
4. Lane 3: Prisma schema, seed script hitting docs/SCORING.md targets, patterns.ts, scoring.ts.
5. Build `eval/run.ts` with `npm run eval` and `npm run safety`, writing to `eval/results/` and `safety/results/`, filling `docs/eval_report.md` and `docs/safety_report.md`. Keep run history for before/after.
6. Grow the benchmark past 100 (Claude-drafted variants, human-checked).
7. Evidence: interview quotes into `docs/research/` and `docs/problem.md`.
8. At freeze: qa-agent, pre-recorded demo video, pitch-agent for the 5-slide `docs/pitch.pdf`.

## Conventions
- No em-dashes in any docs or UI copy.
- Commit identity: `git config user.email noreply@anthropic.com && git config user.name Claude`.
- Pull before every task; never edit another lane's folders without the PM.
