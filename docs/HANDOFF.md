# Handoff (updated Sat Nov 14, night)

Read this first, then CLAUDE.md, then the docs it lists. Deadline: Sunday Nov 15, 12 PM.

## The one thing to know
The live app and the build branch have drifted apart on purpose. The PM is testing on staging and will say when to merge.

| | Live app (`main`) | Staging (build branch) |
|---|---|---|
| URL | https://web-production-1bb4dc67.up.railway.app | https://staging-production-8dc505db.up.railway.app |
| Invite codes | `GTRANSFORMER-JUDGE` (judges), `CARE-TRIAL` (caregivers) | `STAGING-EVAL` |
| Railway service | `web`, deploys from `main` | `staging`, deploys from `claude/caresignal-buildathon-setup-6ss2v0` |
| Name on screen | CareSignal | Unspoken |
| Data | In memory, lost on every deploy | Saved in Postgres, survives deploys |
| Commits | PR 1 to 4 merged | 15 commits ahead of `main`, not merged |

Do not merge to `main` without the PM's go-ahead.

## What is on the build branch and staging, not yet on the live app
1. **Rename to Unspoken (working name).** Display name only, per `docs/RENAME.md` and `docs/BRAND.md`. Tagline: "Unspoken. Every need, finally heard." The repository, Railway project and services, both URLs, invite codes, package name, localStorage keys, response headers and internal identifiers keep the old name on purpose.
2. **Each person has their own caregivers.** "Who is logging?" lists the selected person's caregivers. The Care Profile form asks "Who cares for them?".
3. **The person picked on screen wins.** A note that names nobody goes to the picked person. A note that names someone else on the list keeps the picked person and the confirm card asks whose log it should go to. Example chips show only for the demo person they were written about.
4. **Saved data.** A Postgres service was added to the Railway project. When `STATE_DATABASE_URL` is set, everything people add (Care Profiles, log entries, "Did this help?" answers) is saved as one JSON snapshot per app (`STATE_KEY`) after each change and restored at server start. Seeded demo data is rebuilt on each start so its dates stay current. Both variables are already set on `web` (`STATE_KEY=production`) and `staging` (`STATE_KEY=staging`), so the live app starts saving as soon as the branch is merged. Verified on staging: a tester's profile survived many deploys.
5. **Seven seeded demo patterns** (was four), each with strategies and an example chip. Helen: afternoon agitation after a small lunch, morning refused care around bathing, evening restlessness after a visit. Arjun: morning meltdown after poor sleep, after a routine change, evening hard transition after screen time ends. Maya: afternoon shutdown after loud noise. What each rests on is in `docs/research/seeded_patterns_sources.md`. All counts and scores are synthetic.
6. **Account page replaces the "You" tab.** Who you are logging as, mic language, Care Profiles, About, "Sign out on this device". No passwords and no real login for now.
6b. **Edit a Care Profile and add its history (contracts v9).** On the Account page each added person has "Edit profile and history". History is the caregiver's own account since the first signs or the diagnosis, spoken or typed, turned into dated milestones they can check and change. It is offered when adding a person and when editing one. Demo people show a seeded history and cannot be edited. Medicine names and doses are stripped. A caregiver who sounds in distress in the history box gets the care message and 988.
7. **Removed by the PM:** the caregiver check-in, the caregiver journal, and the "Reset demo data" button.
8. **Reset is locked.** `POST /api/reset` only works where `ALLOW_RESET=true`, which is set on staging only. The live app will refuse it.

## What is real and what is not
- **The model does two things:** it turns a caregiver's note into fields (`POST /api/log`), and it turns a spoken or typed history into milestones (`POST /api/history/format`). Those are the only uses of `ANTHROPIC_API_KEY`. Speech to text is the browser's own.
- **Computed in code, no model:** pattern lines, things to check, Ask answers, strategy rankings, the overview.
- **Fixed wording, chosen by rules before any model call:** care team, 911, 988 and scope messages. The model can add a red flag, never remove one.
- **Synthetic:** every person, log entry, family count, percentage and score. Never present them as results.
- **No accounts:** everyone with an invite code shares one space and can see what others added. Ask testers for nicknames and no personal details.
- **Stopgap storage:** saved data is one JSON snapshot, not real tables. Prisma-backed data routes are still not built.

## Numbers (real model)
Last full runs. The live numbers are from `main`; the staging numbers are from the build branch after the rename.

| | Live `main` | Staging, after the rename |
|---|---|---|
| Benchmark | 39 of 44 (88.6%) | 39 of 44 (88.6%) |
| Golden field accuracy | 98.0% | 98.0% |
| Crisis | 100% (10 of 10) | 100% (10 of 10) |
| Out of scope | 100% (8 of 8) | 100% (8 of 8) |
| Red team | 59 of 59 | 59 of 59 |
| Typical response | about 2.2 s short notes, 7 to 8 s for a 150-word note | same |

- **The history formatter has no eval or red-team cases yet.** It is a new input surface with a new prompt (`src/prompts/history.ts`).
- **Evals have NOT been rerun since the rename check.** Since then: per-person caregivers, the picked-person rule, three new seeded patterns, removal of check-in and journal, removal of the reset button. No prompt changed, but the person handling and the seed did. One full run on staging is needed before merging. It wipes staging data.
- Run history for the before and after slide: keyword-rule baseline 50.0% and 59.3%; rules only 70.0% and 84.7%; first real-model run 83.3% and 94.9%; after the bias fix 83.3% and 100%; after real-length notes 88.6% and 100%. Files: `eval/results/history.json`, `safety/results/history.json`.
- Example count: 44 benchmark plus 59 red team = 103. Hand-reviewed: 30. The 14 real-length cases were drafted by Claude and are pending human review.
- Still failing: G07 and G09 (note names nobody; the roster has two children), G12 (summary includes a second count), M02 (no earlier context in the request). G13 cannot be graded as written.
- Cost per request: not measured (`eval/pricing.json` has placeholder prices).
- Run on staging only: `NODE_USE_ENV_PROXY=1 EVAL_BASE_URL=https://staging-production-8dc505db.up.railway.app EVAL_INVITE_CODE=STAGING-EVAL EVAL_ALLOW_WRITES=true npm run eval`, then `npm run safety`.

## Warnings
- **Run evals on staging, not the live URL.** On staging the runner resets the data before and after. On the live app the reset is refused, so a run there would leave its test people and entries behind in real data.
- **There is no way to clear data from the app.** The reset button is gone. Test entries on the live app can only be removed in the database.
- **Merging redeploys the live app once** and clears its current in-memory data. From then on data is kept.
- **Do not rewrite or force-push `main`.** Commits 094012d through 4ad9392 are under the PM's email and show as Unverified.

## Open decisions (PM)
1. **When to merge the build branch.** It needs one eval run on staging first, which wipes staging test data. Say when testing there is finished.
2. **Four failing benchmark cases** (G07, G09, G12, M02). The picked-person rule now gives the app a person when a note names nobody, but the eval runner does not send one, so G07 and G09 still fail. Decide whether the cases should carry the picked person.
3. **Recurring self-injury wording.** Every self-injury note shows "Please contact your doctor or care team". Proposal: keep it and add "Is this new or worse than usual?". Touches a non-negotiable rule.
4. **Mentor feedback**, items 1 to 19 in `docs/research/feedback_running_list.md`. All still Open.
5. **Emergency wording.** The emergency message starts "Call 911 now." and names the care team second; CLAUDE.md says red flags lead with the care team line.
6. **Older seeded strategies.** The snack and visual-schedule scores (81 and 84) cannot come from the SCORING formula; the weighted blanket is seeded as Promising against the trial evidence. New strategies use the formula.
7. **Demo count.** Saving the scripted note moves Helen's pattern from 6 of 8 to 7 of 9.
8. **First channel to users.** A parent support organization is the candidate. We have no access to their data and could not read their site. Do not claim a partnership or a database.
9. **Organizers' template repo and collaborators.** Still need the link and the GitHub usernames.
10. **Staging service and Postgres** cost a little to run. Keep both until the deadline.

## Next actions, in order
1. **Interviews (biggest gap, 20% of the score).** Zero quotes so far. Use the `CARE-TRIAL` code; ask "What is the hardest part of figuring out what they need?"; record role only in `docs/problem.md` and `docs/research/`.
2. **Finish testing on staging**, then one eval and safety run there, then merge the build branch to `main` and check the live app once.
3. **Phone testing.** Voice and the language picker are untested on real devices. Open in Chrome or Safari, not inside a chat app.
4. **Pitch.** `docs/PITCH.md` and `docs/pitch.pdf` use the Unspoken name, tagline, story and closing line. Still to fill: team names, quotes, video link, first channel, cost per request. The script is 460 words, which is brisk.
5. **Record the demo video** from the click script in `docs/PITCH.md`. Start at the mic. Record on staging or on a fresh Care Profile so earlier test entries do not change the counts.
6. **Human review of the 14 new benchmark cases**, then add cases for the picked-person rule.
7. **Later, not for Sunday:** real tables behind the data routes, accounts with passwords so entries are private, editing an entry after saving, real AI for Ask.

## Where to read more
- `docs/BRAND.md`, `docs/RENAME.md`: name, tagline, story, wording rules, what was and was not renamed.
- `docs/PITCH.md`, `docs/pitch.pdf`, `docs/pitch_src/`: script, deck, demo click script, Q&A, deck source.
- `docs/eval_report.md`, `docs/safety_report.md`: latest runs, failures still open, failures named and fixed.
- `docs/research/seeded_patterns_sources.md`: what each demo pattern and strategy rests on.
- `docs/research/feedback_running_list.md`: every piece of feedback, analyzed, with status.
- `docs/research/autism_patterns_by_age_gender.md`, `docs/research/market_and_differentiation.md`: research reports.
- `docs/DECISIONS.md`: every architectural and product choice, one line each.
- `docs/DATA_HANDLING.md`: what is stored and what leaves the app.

## Decisions made
- Product: Unspoken (working name; renamed from CareSignal on Nov 14), one engine for two communities (dementia, autism). Users are anyone who lives with or cares for the person (parents, adult children, spouses, siblings, home aides).
- Statistics find patterns and compute scores; the model only turns notes into fields.
- Synthetic data only. Organizer-required folder layout: `eval/`, `safety/`, `docs/problem.md`, `docs/eval_report.md`, `docs/safety_report.md`, `docs/pitch.pdf`.
- Judges must be able to type their own input: text box next to the mic, live AI on any input.
- Caregiver distress ("I can't do this anymore") gets care plus 988, never a log entry. `ParseLogResponse` has `kind` and `message` for this.
- Invitation-only entry by invite code. No passwords for now.
- Caregiver-to-caregiver messaging, wearables, and voice or video analysis are roadmap only.

## Conventions
- No em-dashes in any docs or UI copy.
- Commit identity: `git config user.email noreply@anthropic.com && git config user.name Claude`.
- Pull before every task; never edit another lane's folders without the PM.
- Test prompt changes on staging, never on the live app. Keep a prompt change only if nothing drops and crisis and out of scope stay at 100%.
