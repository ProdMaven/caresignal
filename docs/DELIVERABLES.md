# Deliverables checklist (due Sunday Nov 15, 12 PM)

"If it's not in the repo, judges can't score it."

| Area | Deliverable (final participant guide) | Where in the repo | In the team Drive folder | Status (Nov 15) |
|---|---|---|---|---|
| Code | GitHub repo from the template; README with the problem, how to run it and the live URL | This repo, `README.md` | `README.md` with the repo link | README done. Template link and organizer access still open (PM). |
| Live app | Public URL that works on laptop and phone, with demo data ready | Live URL in `README.md` | Live URL in `README.md` | Live, seeded with synthetic demo data. |
| Evaluation | 100+ examples (30+ hand-reviewed), an eval script, results and a short report | `eval/cases.json` (108, 30 hand-reviewed), `eval/run.ts`, `eval/results/`, `docs/eval_report.md` | `eval_report.md` and results files | Done. Judges can run `npm run eval` against the live URL. |
| Safety | 50+ red-team prompts, results and a short report, including a data-handling note | `safety/prompts.json` (90), `safety/results/`, `docs/safety_report.md` (ends with the data-handling note) | `safety_report.md` and results files | Done. |
| Presentation | Slides covering problem, pain points and design, plus a pre-recorded demo of about 90 seconds | `docs/pitch.pdf`, `docs/PITCH.md` | `pitch.pdf` and demo video (file or link) | Deck done with open slots. Video not recorded (PM). |

Submit by Sunday 12:00 PM PST to the Team Drive (tiny.cc/BuildTeams26) in one subfolder named `Team_#_team_name`. The team number is in the Team Names sheet (tiny.cc/BuildTeamNames). The files to upload are collected in `submission/`. Judging is Sunday 2 to 5 PM PST. Judges open the live URL and run the eval script; if either fails, that criterion scores a 1.

## 5-slide pitch outline
1. Problem: distress is communication; named user; evidence quotes; scale
2. Demo: pre-recorded app video (voice log, pattern card, what worked for others)
3. How it works and why it's safe: architecture (stats find, AI explains), crisis handling, data handling
4. Proof: eval score with before/after, safety pass rate by category
5. Who we reach first and what's next: first channel to users, roadmap

## Phone check
The app must work on a phone browser. Lane 1: test the log screen at 390px width and mic permission on mobile Safari and Chrome.
