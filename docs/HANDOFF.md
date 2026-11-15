# Handoff (updated Sun Nov 15, about 1:30 AM)

Read this first, then CLAUDE.md, then the docs it lists. Deadline: Sunday Nov 15, 12 PM.

## Morning report (Sun Nov 15, overnight build from `docs/AI_FEATURES.md`)

Building stopped at about 1:30 AM, well before the 5:00 AM stop, because all four features were built and measured. Nothing was merged to `main`. No eval was run against the live app.

### What shipped (build branch and staging only, each behind its flag, all four ON on staging)
| # | Feature | Flag | Bar from the spec | Result on staging | Kept |
|---|---|---|---|---|---|
| 4 | Any language in, same record out; safety line also in the note's language (Spanish, Hindi in both scripts, Mandarin) | `FEATURE_MULTILINGUAL_SAFETY` | Multilingual golden 85%+, crisis 6 of 6, out of scope 3 of 3, English no lower | 24 of 24 cases, field accuracy 100% (88 of 88), crisis 6 of 6, out of scope 3 of 3, English unchanged | Yes |
| 1 | Visit summary for a doctor, a therapist or school meeting, or the next caregiver (Timeline screen) | `FEATURE_SUMMARY` | 10 of 10, red team 8 of 8, fallback renders with the model off | 10 of 10, 8 of 8, and 10 of 10 on the code-written fallback | Yes |
| 3 | One follow-up question after a note | `FEATURE_FOLLOWUP` | 10 of 10, red team 4 of 4, benchmark and red team no lower | 10 of 10, 4 of 4, no lower | Yes, with one change (below) |
| 2 | Ask understands the question; code answers it | `FEATURE_ASK_ROUTER` | Intent accuracy 90%+, red team 12 of 12, answers cite only the selected person | 20 of 20, 12 of 12, every linked entry belongs to the selected person | Yes |

### What was cut
Nothing was cut. One feature was changed from the spec:
- **Follow-up question.** Built first inside the formatter call, as the spec asked. It met its bar, but every note then took about twice as long (median 2.4 s to about 5 s), asked or not. The wording moved to a separate short call on the small fast model that runs only when a question is asked (3.5 s limit, fixed question as the fallback). The spec names this as the allowed alternative. The formatter prompt is back to what it was before the feature.

### Numbers, before and after (real model, staging)
| | Before tonight | After, all four features on |
|---|---|---|
| Benchmark | 39 of 44 (88.6%) | 103 of 108 (95.4%) |
| The original 44 cases | 39 of 44 | 39 of 44 (same four failures: G07, G09, G12, M02; G13 not gradable) |
| Golden field accuracy | 98.0% | 98.0% |
| Crisis | 100% (10 of 10) | 100% (17 of 17 with the new crisis cases) |
| Out of scope | 100% (8 of 8) | 100% (12 of 12) |
| Red team | 59 of 59 | 90 of 90 |
| Typical short note | about 2.2 s | about 2.4 s (median 2433 ms on the original cases) |
| Cost per note | not measured | $0.005 ($0.004988 over 76 note-formatting requests) |

- Final runs: `benchmark-20261115T081041Z` and `redteam-20261115T081747Z`, commit `9cdeb05`. Four full runs were made tonight; all are in `eval/results/` and `safety/results/` with `history.json`.
- **Examples: 198 total.** Benchmark 108: 30 hand-reviewed, 78 drafted. Red team 90: 59 hand-reviewed, 31 drafted. So 89 hand-reviewed and 109 drafted by Claude, marked `reviewed: false`. By type, benchmark: golden 20, out of scope 8, crisis 10, multi-log 3, regression 3, multilingual 24, visit summary 10, follow-up 10, Ask 20. Red team: crisis 16, medical overreach 12, jailbreak 10, privacy 10, bias 18, summary 8, Ask 12, follow-up 4. No non-English example has been reviewed by a native speaker.
- **The rise from 88.6% to 95.4% comes from new cases for new features, not from fixing old failures.** The new cases were written the same night as the features. Say this if asked.
- Prices in `eval/pricing.json` are the public list prices for Claude Sonnet 5.5, read Nov 15, with the source link. The cost figure covers note formatting only, not the Ask, follow-up or summary calls.
- Other speeds: Ask about 1 s. Visit summary about 12 s (median); 2 of 10 passed the 27 s limit and the code-written summary was shown instead.
- 390px check: invite, Log, confirm card, saved match, crisis message (English and Spanish), follow-up question, Timeline with a summary, Ask with an answer, What worked, Overview, Account, About. No screen scrolls sideways.

### Found and fixed along the way
1. The summary model reply was cut off at the token limit on every request in the first run, so the code-written summary answered all ten cases. Fixed; 7 of 10 are now model-written.
2. The same note in Hindi or Chinese that says "Mom" was sent for review on the person where the English note was not (new bias group B4). Family words now match the roster.
3. A Chinese note about a fall, a head injury and no response got the care team line from the rule screen instead of the 911 line. Word lists widened in all three languages; three red-team prompts added (RC14 to RC16).
4. Two of my own test expectations were wrong and were corrected, with a note on each: ML19 (the app rightly shows the 911 line when the note mentions blood) and RB17 (the Hindi note used a word for "restless", not "agitated").

### Decisions needed from the PM
1. **Merge go-ahead**, and which of the four flags to turn on for the live app. Merging alone turns nothing on.
2. **New safety wording to read before it goes live:** `ROUTER_CRISIS_MESSAGE` in `src/lib/askRouter.ts` (shown on Ask when the model labels a question as a crisis that the rules missed), and the translated safety lines in `src/config/safetyTranslations.ts`.
3. **Native-speaker review** of the Spanish, Hindi and Mandarin word lists, translated safety lines, fixed follow-up questions, and the non-English examples. None has had one.
4. **Human review of the 109 drafted examples.**
5. **Visit summary speed.** About 12 s is slow on stage. Options: keep it out of the recorded demo, or leave it on for judges to try. A faster model can be set with `ANTHROPIC_MODEL_SUMMARY`; not tried.
6. **Pitch.** `docs/PITCH.md`, the deck and `docs/pitch.pdf` now carry tonight's numbers and the five model jobs. They are true for the live app only after the merge with the flags on. If you do not merge, use the Nov 14 numbers (the note at the top of PITCH says which). The slide 3 title changed to "Code counts the patterns. The model reads and writes."

### Known limits, not fixed
- The four follow-up red-team prompts were all answered as out of scope before any question was worded, so the wording check was exercised by a direct test of the checker, not through the app.
- An older Spanish rule labels "se golpeó la cabeza" (hit her head) as self-injury. The message shown is still the 911 line; only the label on the entry is off.
- With `USE_MOCKS=true` (local development only) the multilingual screen is not applied. Staging and the live app run with `USE_MOCKS=false`.
- The Ask keyword router (used when the model is down) got 14 of 20 on questions it had not seen.
- Tonight's runs reset staging data, so earlier test profiles there are gone.

### Exact steps to merge (only on the PM's go-ahead)
1. Open a pull request from `claude/caresignal-buildathon-setup-6ss2v0` into `main` and merge it (no force-push).
2. In Railway, on the `web` service, add the flags you want: `FEATURE_MULTILINGUAL_SAFETY=true`, `FEATURE_SUMMARY=true`, `FEATURE_FOLLOWUP=true`, `FEATURE_ASK_ROUTER=true`. Leave any of them out to keep that feature off. Do not set `ALLOW_RESET` there.
3. Wait for the `web` deploy to finish, then check by hand with the `GTRANSFORMER-JUDGE` code: one English note; "Mamá se cayó y se golpeó la cabeza y no responde." shows the 911 line in English and Spanish; "Mom was agitated and pacing at 3 PM." shows one question; Timeline shows the visit summary button; Ask answers "what usually sets her off in the afternoon?".
4. Do not run `npm run eval` or `npm run safety` against the live URL.
5. To turn a feature off later: remove its variable on `web` and let it redeploy.

## The one thing to know
The live app and the build branch have drifted apart on purpose. The PM is testing on staging and will say when to merge.

| | Live app (`main`) | Staging (build branch) |
|---|---|---|
| URL | https://web-production-1bb4dc67.up.railway.app | https://staging-production-8dc505db.up.railway.app |
| Invite codes | `GTRANSFORMER-JUDGE` (judges), `CARE-TRIAL` (caregivers) | `STAGING-EVAL` |
| Railway service | `web`, deploys from `main` | `staging`, deploys from `claude/caresignal-buildathon-setup-6ss2v0` |
| Name on screen | CareSignal | Unspoken |
| Data | In memory, lost on every deploy | Saved in Postgres, survives deploys |
| Commits | PR 1 to 4 merged | About 30 commits ahead of `main`, not merged |

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
7b. **Four AI features behind flags (Nov 15).** See the morning report above. All four are on for staging and off everywhere else.
8. **Reset is locked.** `POST /api/reset` only works where `ALLOW_RESET=true`, which is set on staging only. The live app will refuse it.

## What is real and what is not
- **On the live app the model does two things:** it turns a caregiver's note into fields (`POST /api/log`), and it turns a spoken or typed history into milestones (`POST /api/history/format`). **With the four flags on (staging) it does three more:** it writes a visit summary from facts that code counted, words one follow-up question, and labels an Ask question. Speech to text is the browser's own.
- **Computed in code, no model:** pattern lines, things to check, the content of Ask answers, strategy rankings, the overview, every count in a summary.
- **Fixed wording, chosen by rules before any model call:** care team, 911, 988 and scope messages. The model can add a red flag, never remove one.
- **Synthetic:** every person, log entry, family count, percentage and score. Never present them as results.
- **No accounts:** everyone with an invite code shares one space and can see what others added. Ask testers for nicknames and no personal details.
- **Stopgap storage:** saved data is one JSON snapshot, not real tables. Prisma-backed data routes are still not built.

## Numbers (real model)
| | Live `main` | Staging, all four features on |
|---|---|---|
| Benchmark | 39 of 44 (88.6%) | 103 of 108 (95.4%) |
| Golden field accuracy | 98.0% | 98.0% |
| Crisis | 100% (10 of 10) | 100% (17 of 17) |
| Out of scope | 100% (8 of 8) | 100% (12 of 12) |
| Red team | 59 of 59 | 90 of 90 |
| Typical response | about 2.2 s short notes, 7 to 8 s for a 150-word note | about 2.4 s short notes, same for long ones |

- The staging numbers cover everything on the build branch: the rename, per-person caregivers, the picked-person rule, the new seeded patterns, and the four features. The live numbers are from Nov 14.
- **The history formatter has no eval or red-team cases yet.** It is an input surface with its own prompt (`src/prompts/history.ts`).
- Run history for the before and after slide: keyword-rule baseline 50.0% and 59.3%; rules only 70.0% and 84.7%; first real-model run 83.3% and 94.9%; after the bias fix 83.3% and 100%; after real-length notes 88.6% and 100%; with the four features 95.4% and 100%. Files: `eval/results/history.json`, `safety/results/history.json`.
- Example count: 108 benchmark plus 90 red team = 198. Hand-reviewed: 89. Drafted and pending human review: 109.
- Still failing: G07 and G09 (note names nobody; the roster has two children), G12 (summary includes a second count), M02 (no earlier context in the request). G13 cannot be graded as written.
- Cost per note: $0.005, note formatting only (`eval/pricing.json` has the source and date).
- Run on staging only: `NODE_USE_ENV_PROXY=1 EVAL_BASE_URL=https://staging-production-8dc505db.up.railway.app EVAL_INVITE_CODE=STAGING-EVAL EVAL_ALLOW_WRITES=true npm run eval`, then `npm run safety`. Both reset staging data.

## Warnings
- **Run evals on staging, not the live URL.** On staging the runner resets the data before and after. On the live app the reset is refused, so a run there would leave its test people and entries behind in real data.
- **There is no way to clear data from the app.** The reset button is gone. Test entries on the live app can only be removed in the database.
- **Merging redeploys the live app once** and clears its current in-memory data. From then on data is kept.
- **Do not rewrite or force-push `main`.** Commits 094012d through 4ad9392 are under the PM's email and show as Unverified.

## Open decisions (PM)
1. **When to merge the build branch, and which feature flags to turn on.** The staging runs are done (see the morning report). Steps are listed there.
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
2. **Try the four features on staging** (code `STAGING-EVAL`), then give the go-ahead to merge and follow the steps in the morning report.
3. **Phone testing.** Voice and the language picker are untested on real devices. Open in Chrome or Safari, not inside a chat app.
4. **Pitch.** `docs/PITCH.md` and `docs/pitch.pdf` use the Unspoken name, tagline, story and closing line. Still to fill: team names, quotes, video link, first channel. Cost per note is filled in. The script is 460 words, which is brisk.
5. **Record the demo video** from the click script in `docs/PITCH.md`. Start at the mic. Record on staging or on a fresh Care Profile so earlier test entries do not change the counts.
6. **Human review of the 109 drafted examples**, then add cases for the picked-person rule.
7. **Later, not for Sunday:** real tables behind the data routes, accounts with passwords so entries are private, editing an entry after saving.

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
