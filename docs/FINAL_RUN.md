# Final run to Sunday 12 PM (PM handoff, Sat Nov 14, 11:40 PM)

Read with `docs/HANDOFF.md` (state) and `docs/AI_FEATURES.md` (tonight's build). This file says what matters for the score and in what order.

## Where we stand against the rubric (PM estimate, 1 to 5)
| Criterion | Weight | Tonight | Reachable | What moves it |
|---|---|---|---|---|
| Evaluation rigor | 25% | 3.5 | 4.5 | Benchmark from 44 to 100+ examples; hand-reviewed count stated; before and after kept |
| Safety results | 10% | 5 | 5 | Keep 100% on crisis and out of scope through every change. Ties go to the higher safety score |
| Problem and need | 20% | 2.5 | 4 | Real quotes. There are none yet |
| Product and UX | 20% | 3.5 | 4 | Live app matches staging; voice works on real phones; calm, clear screens |
| Pitch | 25% | 2.5 | 4 | Recorded demo video; slots in `docs/PITCH.md` filled; a real first channel |

Gates: public URL (passing), judges type their own input (passing), crisis-safe (passing in English; other languages being fixed in Feature 4).

Pitch plus evidence is 45% of the score and needs no code. Do not let the build crowd it out.

## Overnight (Claude Code, unattended)
1. Build per `docs/AI_FEATURES.md`, in its order, on the build branch and staging only. Hard stop for building: **5:00 AM**.
2. At the stop: apply the cut rules, turn off any feature that did not meet its "done when" bar, and leave its flag off.
3. Run the full sets on staging (`npm run eval`, `npm run safety`). Regenerate `docs/eval_report.md` and `docs/safety_report.md`. Record example counts: total, hand-reviewed, drafted and unreviewed, per type.
4. Fill real model prices in `eval/pricing.json` from the provider's current public pricing page (cite the page and date in the file). If the page cannot be reached, leave "not measured" and say so. Never estimate.
5. Phone-width check of every screen on the demo path at 390 px: no sideways scrolling, no clipped text, mic and text box both usable.
6. Update `docs/PITCH.md` and `docs/pitch_src` for whatever shipped: the AI line (only features that are on and passing), eval and safety numbers, example counts. Rebuild `docs/pitch.pdf`. Keep every [SQUARE BRACKET] slot and NEED DATA marker that has no source.
7. Write the morning report at the top of `docs/HANDOFF.md`: what shipped, what was cut and why, numbers before and after, anything that needs a PM decision, and the exact merge steps. Commit and push.
8. Do not merge to `main`. Do not run evals against the live URL. Do not rewrite or force-push `main`.

If something is ambiguous overnight, take the most conservative reading (feature off, wording unchanged, number left as NEED DATA), note it in the morning report, and keep going.

## Sunday morning runbook (PM leads)
| Time | Step | Who |
|---|---|---|
| 6:30 | Read the morning report in `docs/HANDOFF.md`. Decide what merges | PM |
| 6:45 | Try staging on two real phones (one iPhone Safari, one Android Chrome): speak a note, type a note, change mic language, open a summary | PM and teammate |
| 7:15 | Go-ahead to merge. Claude Code merges the build branch to `main`, turns on the passing feature flags on the live service, checks the live app once | PM, then Claude Code |
| 7:30 | One eval and safety run against **staging** at the merged commit; commit results to `main` in the same pull request or a follow-up | Claude Code |
| 8:00 | Record the demo video from the click script in `docs/PITCH.md`, on a fresh Care Profile, starting at the mic. Put the file or link in `docs/` | PM |
| 9:00 | **Deploy freeze.** Nothing is pushed to `main` after this except docs that do not trigger a deploy problem. Check with the PM first | Everyone |
| 9:00 | Fill the slots: quotes into `docs/problem.md` and the deck, team names, video link, first channel. Rebuild `docs/pitch.pdf` | PM with Claude Code |
| 10:00 | README: live URL, invite code for judges, headline eval score, safety pass rate, video link, where each deliverable lives | Claude Code |
| 10:30 | Organizers' template requirements checked; organizers added as collaborators; submission form filled | PM |
| 11:00 | Three timed rehearsals of the 3-minute pitch and the 2-minute Q&A | Team |
| 11:45 | Final look at the repo from a logged-out browser: README renders, links work, required paths exist | PM |

## Only the PM can do these
- **Quotes.** Two or three caregivers, one question each: "What is the hardest part of figuring out what they need?" Role only, no names. Ask the parent whose note was tested for permission to paraphrase it. Put them in `docs/research/interviews.md`; Claude Code moves them into `docs/problem.md` and the deck.
- **First channel.** One real group someone on the team can reach this month. No claimed partnerships.
- **Native-speaker review** of the Hindi cases (and Spanish or Mandarin if anyone on the team can), so they count as hand-reviewed. Change `reviewed` to `true` only for cases a person has read.
- **Organizers' template repo link and GitHub usernames.**
- **Open decisions** in `docs/HANDOFF.md` (failing benchmark cases, emergency wording, seeded scores). If there is no time, leave them and say so in the reports; do not paper over them.

## Lines for the pitch that the evidence supports
- "One shared record of each hard moment, across everyone who cares for the person." Not "the first voice logging app".
- Eval before and after: keyword baseline 50.0%, then the real model, then each fix, to the latest number in `docs/eval_report.md`.
- "Crisis and out of scope: 100%, in every run since the real model went live."
- Community rankings are the long-term vision and run on synthetic data today.
