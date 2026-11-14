# Handoff: planning session to Claude Code (Fri Nov 13, 9:20 PM)

Read this first, then CLAUDE.md, then the docs it lists. Everything below is the state at handoff.

## Where we are (updated Fri Nov 13, 11:40 PM)
- Live app with real AI: https://web-production-1bb4dc67.up.railway.app, invite code `GTRANSFORMER-JUDGE`. Railway project `caresignal`, service `web`, deploys from branch `claude/caresignal-buildathon-setup-6ss2v0` (not yet merged to `main`).
- Built and deployed: invitation-only entry, Care Profile intake (age band, gender, spectrum level, communication), voice or typed log in either mode with a mic language picker, confirm card, match plus warm line plus top next step after Save, timeline and pattern cards, Ask, Winning Patterns with "Did this help?" feedback, caregiver check-in (nothing stored, 988 first), caregiver journal, weekly and monthly overview, Reset demo data.
- Real AI is on for /api/log only (`USE_MOCKS=false`, key set in Railway). Data routes, Ask, pattern summaries and check-in replies still run on the in-memory demo store and templates. Data is lost on every redeploy and on Reset demo data.
- Evals on the live app with the real model: benchmark 83.3% (25/30), golden field accuracy 94.4%, crisis 6/6, out of scope 7/7. Red team 100% (59/59): crisis 13/13, medical overreach 12/12, jailbreak 10/10, privacy 10/10, bias 14/14. Run history (mock 50.0% and 59.3%, rules only 70.0% and 84.7%, real model 83.3% and 94.9%, after bias fix 83.3% and 100%) is in `eval/results/history.json` and `safety/results/history.json`.
- Run evals: `NODE_USE_ENV_PROXY=1 EVAL_BASE_URL=<url> EVAL_ALLOW_WRITES=true npm run eval` and `npm run safety`. This resets the live demo data.
- Research: `docs/research/autism_patterns_by_age_gender.md` (figures from abstracts and summaries, not full texts).

## Not done yet
- Evidence of need: zero interview quotes. `docs/problem.md` and `docs/research/` are still empty of real voices.
- Benchmark size: 89 examples against the 100+ target. No cases yet for check-in, journal, feedback, or non-English notes.
- Four benchmark cases still fail (G07, G09, G12, M02); they need a PM decision on the cases or the product, not prompt tuning.
- Cost per request: not measured (`eval/pricing.json` has placeholder prices).
- Voice on real phones: untested. A teammate reported voice and language change not working; a fix is deployed (keeps listening across pauses, language change mid-note, message for in-app browsers) but not confirmed on a device.
- `docs/pitch.pdf`, demo video, first channel to users, organizers' template repo and collaborators, merge to `main`.
- Prisma-backed data routes (Lane 3) and real AI for Ask and pattern summaries (Lane 2).

## Open issues for the PM
- Score 81 for the snack strategy cannot come from the SCORING formula (tops out near 74). Mocks hardcode 81 and 84.
- Saving D1 moves Helen's pattern from 6 of 8 to 7 of 9; seed 5 of 7 if the script should read "6 of 8" after the save.
- Emergency message starts "Call 911 now." and names the care team second; CLAUDE.md says red flags lead with the care team line.
- Research: weighted blanket is seeded as Promising though the one randomized trial found no sleep benefit; visual schedules fit transition triggers better than poor sleep; `medication_time` is still a context tag.
- Journal entries are stored under a caregiver picked from a list, with no accounts, so they are not private. Do not call the journal private in the pitch.
- Caregiver-to-caregiver messaging is roadmap only.

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
