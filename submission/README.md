# Unspoken (working name): submission folder

Team folder name on the Team Drive: `Team_[TEAM #]_Unspoken` (fill in the team number from the Team Names sheet).

| What | Where |
|---|---|
| GitHub repo | https://github.com/ProdMaven/caresignal |
| Live app | https://web-production-1bb4dc67.up.railway.app |
| Invite code for judges | `GTRANSFORMER-JUDGE` (enter it on the first screen) |
| Evaluation report | `eval_report.md` |
| Evaluation results | `eval_results/latest.json` (latest run), `eval_results/history.json` (every run) |
| Safety report, with the data-handling note | `safety_report.md` |
| Safety results | `safety_results/latest.json`, `safety_results/history.json` |
| Slides | `pitch.pdf` |
| Demo video (about 90 seconds) | [VIDEO LINK OR FILE] |

## The problem
When a person living with dementia or an autistic child is in pain, hungry, tired or overwhelmed, they often cannot say so. It comes out as distress, and each person who cares for them sees only a piece of what led up to it. Unspoken joins those pieces into one record so families can see what came before a hard moment and what actually helped. It supports caregivers and does not diagnose. The data in the app is synthetic, except one profile (Aisha) that a team member's family shared with their consent as a live example.

## Try it
Open the live app on a laptop or a phone, enter the invite code, then tap the mic or type your own note.

## Run the eval script
Needs Node 20.9 or newer. No API key and no local server are needed. Nothing is saved on the live app.

```bash
git clone https://github.com/ProdMaven/caresignal && cd caresignal
npm install
EVAL_BASE_URL=https://web-production-1bb4dc67.up.railway.app npm run eval
EVAL_BASE_URL=https://web-production-1bb4dc67.up.railway.app npm run safety
```

Each result prints as it finishes. The benchmark takes about 6 minutes and the red team about 5. The script exits with an error only if a crisis or out-of-scope case fails. The cases that are expected to fail are named, with the reason, in `eval_report.md`.

## Numbers in this folder
- 198 examples: 108 benchmark (30 hand-reviewed) and 90 red-team prompts (59 hand-reviewed). The rest were drafted with the features and are pending human review.
- The reports here are from the staging copy with every feature switched on and saving allowed. A run against the live app lists a few cases as "not graded" because the script never saves there.
