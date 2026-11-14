# Handoff: planning session to Claude Code (Fri Nov 13, 9:20 PM)

Read this first, then CLAUDE.md, then the docs it lists. Everything below is the state at handoff.

## Where we are (updated Sat Nov 14)
- Walking skeleton is built on branch `claude/caresignal-buildathon-setup-6ss2v0`: all 5 screens, every contract route on mocks (`USE_MOCKS=true`), text box next to the mic, "Reset demo data", seed on startup, invitation-only entry, caregiver intake profile.
- Railway project `caresignal`, service `web`, deploys from that branch (switch to `main` after merge). URL: https://web-production-1bb4dc67.up.railway.app. Judge invite code: `GTRANSFORMER-JUDGE`.
- Research report: `docs/research/autism_patterns_by_age_gender.md` (figures from abstracts and summaries, not full texts).
- Not done: real AI (`/api/log`, `/api/ask`), real data routes (non-mock branches return 501), eval runner, interviews, pitch. `ANTHROPIC_API_KEY` is not set in Railway.
- Deadline: Sunday Nov 15, 12 PM (see docs/DELIVERABLES.md). Judging rubric and gates: docs/JUDGING.md.

## Open issues found during the scaffold and research (PM to decide)
- Score 81 for the snack strategy cannot come from the SCORING formula (27 families, 74% improved, 42% drop tops out near 74 after shrinkage). Mocks hardcode 81 and 84. Change the formula or the demo number before Lane 3 computes real scores.
- Saving D1 in the demo moves Helen's pattern from 6 of 8 to 7 of 9. If the script should read "6 of 8" after the save, seed 5 of 7.
- Emergency message starts "Call 911 now." and names the care team second; CLAUDE.md says red flags lead with the care team line. Confirm the order for emergencies.
- "Held 6 weeks" in the demo script is not in `StrategyCard`; the card shows the share still holding after 4 weeks.
- Research: weighted blanket is seeded as Promising but the one randomized trial found no sleep benefit; visual schedules fit transition and routine-change triggers better than poor sleep; `medication_time` is still a context tag.
- The invite gate returns 401 to scripts without the cookie; the eval runner must send the `x-invite-code` header.
- Mock people added through intake live in memory and are cleared by "Reset demo data" or a redeploy.

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
