# Unspoken

**Unspoken (working name). Every need, finally heard.**

Formerly CareSignal. The repository and URLs keep the old name.

One shared record of each hard moment, built from the voices of everyone who cares for a person who cannot always say what they need: a parent living with dementia or an autistic child. AI turns a spoken sentence into a structured record, statistics find the patterns behind distress, and strategies are ranked by what actually worked for others. Supports caregivers. Does not diagnose.

Team Unspoken: Jayesh, Prisha, Aadi, Vinod. GTransformer "AI for Global Good" buildathon, Nov 13 to 15, 2026. Synthetic data, with one profile shared by a team member's family with their consent.

**Live app:** https://web-production-1bb4dc67.up.railway.app (works on laptop and phone, no setup)
**Invite code for judges:** `GTRANSFORMER-JUDGE` (Unspoken is invitation only; enter this on the first screen)
**Demo video:** [`submission/Unspoken_demo_Aisha.mp4`](https://github.com/ProdMaven/caresignal/blob/main/submission/Unspoken_demo_Aisha.mp4) (85 seconds, pre-recorded)
**Headline eval score:** see `docs/eval_report.md` | **Safety pass rate:** see `docs/safety_report.md`

| Deliverable | Location |
|---|---|
| Problem | `docs/problem.md` |
| Pitch (5 slides) | `docs/pitch.pdf` |
| Data handling note | `docs/DATA_HANDLING.md`, also at the end of `docs/safety_report.md` |
| Evaluation | `eval/` (cases, script), `eval/results/`, `docs/eval_report.md` |
| Safety | `safety/prompts.json`, `safety/results/`, `docs/safety_report.md`, `docs/DATA_HANDLING.md` |

## For judges: try it and check it

**Try the app.** Open the live URL on a laptop or a phone and enter the invite code. Tap the mic or type your own note, for example "Mom was pacing and calling out around 3, she barely ate lunch." Demo data (synthetic) is already loaded for Helen (dementia care) and Arjun (autism support).

**Run the eval script against the live app.** Needs Node 20.9 or newer. No API key and no local server are needed, and nothing is saved on the live app.

```bash
git clone https://github.com/ProdMaven/caresignal && cd caresignal
npm install
EVAL_BASE_URL=https://web-production-1bb4dc67.up.railway.app npm run eval
EVAL_BASE_URL=https://web-production-1bb4dc67.up.railway.app npm run safety
```

- `npm run eval` runs the 108 benchmark examples in `eval/cases.json` (30 hand-reviewed) and prints each result as it finishes. It takes about 6 minutes. `npm run safety` runs the 90 red-team prompts in `safety/prompts.json`, about 5 minutes.
- The script exits with an error only if a crisis or out-of-scope case fails. A few benchmark cases are expected to fail; they are named with the reason in `docs/eval_report.md`.
- Cases that need to save entries first are listed as "not graded" on the live app, because the script never writes there. Cases for a feature that is switched off on the server are listed the same way.
- Results are written to `eval/results/` and `safety/results/`, and the two reports in `docs/` are rebuilt.

**Run it with no network at all** (keyword baseline, no AI, lower scores by design):

```bash
npm run build
USE_MOCKS=true PORT=3333 npm start &
EVAL_BASE_URL=http://localhost:3333 npm run eval
```

## The problem, in short
When a person living with dementia or an autistic child is in pain, hungry, tired or overwhelmed, they often cannot say so. It comes out as distress, and each person who cares for them sees only a piece of what led up to it. Unspoken joins those pieces into one record so families can see what came before a hard moment and what actually helped. It supports caregivers and does not diagnose. More in `docs/problem.md`.

## How it works
- A fixed safety screen runs before any model call. Red flags lead with "Please contact your doctor or care team", possible emergencies say to call 911, and a caregiver in distress gets the 988 Suicide and Crisis Lifeline.
- The model turns a spoken or typed note into fields from a fixed vocabulary. The caregiver checks every field before saving.
- Plain code counts the patterns and ranks what worked. The model never invents a pattern, a number, a cause, a diagnosis or a medication.
- The people, logs, counts and scores in the app are synthetic. One exception: Aisha's profile and history are shared by her family, with their consent, as a live example. The entries seeded for her are examples.

## Run locally
1. `npm install`
2. `npm run build`
3. `npm start` (pushes the SQLite schema, seeds synthetic data, serves http://localhost:3000). Use `npm run dev` while building.

Notes:
- Node 20.9 or newer (`.nvmrc` says 22).
- `USE_MOCKS=true` (the default) serves every route from `src/mocks/`. There is no reset button. `POST /api/reset` restores the seeded data only on a server with `ALLOW_RESET=true` (staging).
- Invite codes come from `INVITE_CODES` (comma separated). Scripts such as the eval runner can send the header `x-invite-code` instead of the cookie.
- Railway deploys from `railway.json` (Nixpacks, `npm start`, healthcheck `/api/health`).

## Docs
- `docs/HANDOFF.md`: current state and numbers
- `docs/problem.md`, `docs/PITCH.md`, `docs/pitch.pdf`: problem, script, deck
- `docs/eval_report.md`, `docs/safety_report.md`, `docs/DATA_HANDLING.md`: evaluation, safety, data handling
- `docs/PRD.md`, `docs/DATA_MODEL.md`, `docs/SCORING.md`, `docs/DECISIONS.md`: scope, record schema, scoring, decisions
- `docs/research/`: research notes and sources
