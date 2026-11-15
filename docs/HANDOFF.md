# Handoff: planning session to Claude Code (Fri Nov 13, 9:20 PM)

Read this first, then CLAUDE.md, then the docs it lists. Everything below is the state at handoff.

## Where we are (updated Sat Nov 14, late evening: rename to Unspoken ready to merge)
- **Name:** the product is now **Unspoken** (working name), formerly CareSignal. Tagline: "Unspoken. Every need, finally heard." See `docs/BRAND.md` and `docs/RENAME.md`. The repository, Railway project and services, both URLs, invite codes, package name, localStorage keys, response headers and internal identifiers keep the old name on purpose.
- **Rename status:** done on the build branch `claude/caresignal-buildathon-setup-6ss2v0` and deployed to staging. NOT merged: the live app still says CareSignal until the PM gives the go-ahead. Staging evals before and after the rename are identical (benchmark 39 of 44, red team 59 of 59, crisis and out of scope 100%), so the prompt change is kept.
- **Also on the build branch, not merged (added after the rename):**
  - Each person has their own caregivers (contracts v6). "Who is logging?" lists the selected person's caregivers, and the Care Profile form asks "Who cares for them?". Reported by a teammate: a new person showed another family's names.
  - Data now survives deploys and restarts. A Postgres service was added to the Railway project. When `STATE_DATABASE_URL` is set, everything caregivers add (people, log entries, journal, "Did this help?" answers) is saved as one JSON snapshot per app (`STATE_KEY`) after each change and restored at server start. Verified on staging: a test person and journal entry survived a restart. Seeded demo data is rebuilt on each start so its dates stay current.
  - Both variables are already set on `web` (`STATE_KEY=production`) and `staging` (`STATE_KEY=staging`). The live app starts saving as soon as this branch is merged.
  - No vector database: nothing in the product needs similarity search. If it is needed later, use pgvector in the same Postgres.
  - Evals have NOT been rerun since these two changes (PM: evals at the end). Neither change touches a prompt.
- **Live app (real AI):** https://web-production-1bb4dc67.up.railway.app. Railway project `caresignal`, service `web`, deploys from `main`. Invite codes: `GTRANSFORMER-JUDGE` (judges, in the README) and `CARE-TRIAL` (caregivers trying it).
- **Staging:** https://staging-production-8dc505db.up.railway.app, service `staging`, deploys from `claude/caresignal-buildathon-setup-6ss2v0`, invite code `STAGING-EVAL`, shares the API key by reference. Test prompt changes here first, never on the live app.
- **Merged to `main` (PR 1):** invitation-only entry, Care Profile intake, voice or typed log in either mode with a mic language picker, confirm card, match plus warm line plus next step after Save, timeline, Ask, Winning Patterns with "Did this help?", caregiver check-in, journal, weekly and monthly overview, eval and safety runner.
- **Merged to `main` and live (PR 2):** handling of real-length spoken notes. Time limit 9 to 18 seconds, a reported remedy is no longer treated as a medication question, per-step results on what was tried (contracts v5), new categories (body movement, self-biting, self-hitting, woke from sleep, cold or ice, massage, blocked behavior, remedy given), 14 long benchmark cases.
- **What is real and what is not:** the model does two things: it turns notes into fields (`/api/log`) and writes the short listening reply when a caregiver types into the check-in (`/api/checkin`, filtered for advice, fixed wording for crisis). Ask answers and pattern summaries are computed text. Data routes use an in-memory store. On `main` today it resets on every deploy; on the build branch it is saved to Postgres and survives deploys. "Reset demo data" and every eval run against a server still wipe what was added there. Community numbers are synthetic.

## Numbers (real model)
| | Before PR 2 | Live `main` now (rerun after the merge) |
|---|---|---|
| Benchmark | 25 of 30 (83.3%) | 39 of 44 (88.6%) |
| Original 30 cases passing | 25 | 25 |
| New real-length cases | not run | 14 of 14 |
| Golden field accuracy | 94.4% | 98.0% |
| Red team (59) | 59 of 59 | 59 of 59 |
| Crisis and out of scope | 100% | 100% |
| Typical response time | about 2.2 s | about 2.3 s short notes, 7 to 8 s for a 150-word note |

- Run history for the before and after slide: mock baseline 50.0% and 59.3%, rules only 70.0% and 84.7%, real model first run 83.3% and 94.9%, after bias fix 83.3% and 100%, real-length changes 88.6% and 100%. Files: `eval/results/history.json`, `safety/results/history.json`.
- Example count: 44 benchmark plus 59 red team = 103. The 14 new cases were drafted by Claude and are pending human review, so hand-reviewed stands at 30.
- Cost per request: not measured (`eval/pricing.json` has placeholder prices).
- Run evals: `NODE_USE_ENV_PROXY=1 EVAL_BASE_URL=<url> EVAL_INVITE_CODE=<code> EVAL_ALLOW_WRITES=true npm run eval` and `npm run safety`. This resets the target server's demo data.

- Rename check on staging (Nov 14): before 39 of 44 and 59 of 59; after 39 of 44 and 59 of 59. Same four benchmark failures (G07, G09, G12, M02).

## Where to read more
- `docs/BRAND.md`: name, tagline, story, closing line, wording rules. `docs/PITCH.md` and `docs/pitch.pdf` already use them.
- `docs/research/feedback_running_list.md`: every piece of feedback (mentor calls, a real parent's note), analyzed, with status. 30 items; nothing is adopted without a PM decision.
- `docs/research/autism_patterns_by_age_gender.md`: research report (figures from abstracts and summaries, not full texts).
- `docs/eval_report.md`, `docs/safety_report.md`: latest runs with each failure named.

## Decisions made
- Product: Unspoken (working name; renamed from CareSignal on Nov 14, see `docs/BRAND.md`), one engine for two communities (dementia, autism). Users are anyone who lives with or cares for the person (parents, adult children, spouses, siblings, home aides).
- Statistics find patterns and compute scores; Claude only formats notes and explains numbers.
- Synthetic data only. Organizer-required folder layout: `eval/`, `safety/`, `docs/problem.md`, `docs/eval_report.md`, `docs/safety_report.md`, `docs/pitch.pdf`.
- Judges must be able to type their own input: text box next to the mic, live AI on any input, "Reset demo data" button.
- Caregiver distress ("I can't do this anymore") gets care plus 988, never a log entry. `ParseLogResponse` has `kind` and `message` for this.

## Open decisions (PM)
1. **Eval results on `main`.** The post-merge live runs (39 of 44, 59 of 59) are committed on branch `claude/caresignal-buildathon-setup-6ss2v0` only; `main` still shows the staging runs with the same numbers. A small pull request brings them over.
2. **Four failing benchmark cases.** G07 and G09 name nobody while the autism roster has two children (the app asks instead of guessing); G12's summary includes a caregiver's count; M02 has no earlier context in the request. Fix the cases or the product. G13 cannot be graded as written.
3. **Recurring self-injury wording.** Every self-injury note shows "Please contact your doctor or care team". Proposal: keep it and add "Is this new or worse than usual?" so a known pattern reads differently. Touches a non-negotiable rule.
4. **Mentor feedback, items 1 to 19 on the running list.** All still Open. Leaning: adopt "nail logging first" for the pitch; decline voice analysis, tone analysis and video; keep caregiver matching on the roadmap.
5. **Emergency wording.** The emergency message starts "Call 911 now." and names the care team second; CLAUDE.md says red flags lead with the care team line.
6. **Scoring.** The snack strategy's 81 cannot come from the SCORING formula (tops out near 74). Mocks hardcode 81 and 84.
7. **Demo count.** Saving the scripted note moves Helen's pattern from 6 of 8 to 7 of 9. Seed 5 of 7 if the script should read "6 of 8" after the save.
8. **Research conflicts with seed data.** Weighted blanket is seeded as Promising though the one randomized trial found no sleep benefit; visual schedules fit transition triggers better than poor sleep; `medication_time` is still a context tag.
9. **First channel to users.** A parent support organization is the candidate, but we have no access to their data and could not read their site. Do not claim a partnership or a database.
10. **Organizers' template repo and collaborators.** Still need the link and the GitHub usernames.
11. Commits 094012d through 4ad9392 are under Aadi's email and show as Unverified. Do NOT rewrite or force-push `main`.

## Warnings once data is saved
- **Do not run evals against the live URL any more.** The runner calls "Reset demo data" before and after, which now permanently deletes what real testers added. Run evals on staging.
- **The "Reset demo data" button is public.** Anyone with an invite code can wipe everyone's saved data. Decide whether to hide it behind a judge-only code before more caregivers try the app.
- **No accounts:** saved data is shared by everyone with a code. Keep asking testers for nicknames and no personal details.

## Next actions, in order
1. **Interviews (biggest gap, 20% of the score).** Zero quotes so far. Use the `CARE-TRIAL` code; ask "What is the hardest part of figuring out what they need?"; record role only in `docs/problem.md` and `docs/research/`.
2. **Remove or keep the `staging` service** in Railway (useful for testing prompt changes; costs a little to run).
3. **Phone testing.** Voice and the language picker are untested on real devices. A teammate reported problems; a fix is live but unconfirmed. Open in Chrome or Safari, not inside a chat app.
4. **Human review of the 14 new cases** so hand-reviewed passes 30, then add cases for check-in, journal and feedback.
5. **Pitch.** Lead with one sentence about logging ("one spoken sentence becomes a signal a family can act on"). Start the demo at the mic, not at the invite screen. Use one name for the profile of the person being cared for (Care Profile). Roadmap slide: caregiver matching, wearables.
6. **Feature freeze, then** qa-agent, the pre-recorded demo video, and pitch-agent for the 5-slide `docs/pitch.pdf`.
7. **Later (not for Sunday):** Prisma-backed data routes, real AI for Ask and pattern summaries, accounts so journals and logs are private, editing an entry after saving.

## Known limits to say out loud if asked
- No accounts: everyone with a code shares one demo space, and journal entries are not private.
- Synthetic data only. Testers should use nicknames and no personal details.
- Step order from the keyword fallback follows keyword order, not spoken order.

## Conventions
- No em-dashes in any docs or UI copy.
- Commit identity: `git config user.email noreply@anthropic.com && git config user.name Claude`.
- Pull before every task; never edit another lane's folders without the PM.
