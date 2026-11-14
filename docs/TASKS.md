# Tasks, lanes, and contracts

## Contracts (frozen, v3 Nov 14)
Types: `docs/contracts/types.ts`. v2 changes by the PM: added POST /api/reset (`ResetResponse`) and `Source` value `"text"` for typed notes. Scope decision: full PRD scope, both modes live, /api/ask stays. v3 changes by the PM: intake profile fields on `Person` (ageBand, gender, spectrumLevel, communicationLevel), POST /api/people (`CreatePersonRequest`), and POST /api/invite for invitation-only entry.

| Route | Method | Request | Response | Owner |
|---|---|---|---|---|
| /api/people?mode= | GET | | PeopleResponse | Lane 3 |
| /api/people/[id]/events?days=21 | GET | | EventsResponse | Lane 3 |
| /api/log | POST | ParseLogRequest | ParseLogResponse | Lane 2 |
| /api/events | POST | SaveEventRequest | SaveEventResponse | Lane 3 |
| /api/patterns?personId= | GET | | PatternsResponse | Lane 3 (numbers) + Lane 2 (summary text) |
| /api/ask | POST | AskRequest | AskResponse | Lane 2 |
| /api/strategies?mode=&patternKey= | GET | | StrategiesResponse | Lane 3 |
| /api/reset | POST | | ResetResponse | Lane 3 |
| /api/people | POST | CreatePersonRequest | CreatePersonResponse | Lane 3 |
| /api/invite | POST | InviteRequest | InviteResponse | Lane 1 |
| /api/checkin | POST | CheckInRequest | CheckInResponse | Lane 2 |
| /api/feedback | POST | FeedbackRequest | FeedbackResponse | Lane 3 |

Every route returns a mock from `src/mocks/` when `USE_MOCKS=true`, so lanes never block each other.

## Folder ownership
- **Lane 1 (Frontend + demo flow)**: `src/app/(pages)`, `src/components/`, `src/hooks/useSpeech.ts`, `src/config/modes.ts`
- **Lane 2 (AI)**: `src/app/api/log`, `src/app/api/ask`, `src/prompts/`, `src/lib/ai.ts`, `src/lib/demoCache.ts`, pattern summary text
- **Lane 3 (Data, patterns, scoring)**: `prisma/`, `scripts/seed.ts`, `src/lib/patterns.ts`, `src/lib/scoring.ts`, `src/app/api/people`, `src/app/api/events`, `src/app/api/reset`, `src/app/api/patterns`, `src/app/api/strategies`, `eval/cases.json`
- **Lane 4 (PM)**: `docs/`, `src/lib/types.ts` (copy of contracts), merges of shared files

## Milestones
- **M1, +3h**: every screen clicks through on mocks, deployed to Railway.
- **M2, +6h**: real voice logging, seed data loaded, real pattern cards.
- **M3, +8h**: Ask and Winning Patterns real, first eval run.
- **M4, +10h**: feature freeze. QA pass. Backup demo video recorded.

## Lane 1: Frontend and demo flow
- [ ] T-L1-1 Scaffold app (scaffold-agent), copy types, mocks, deploy (60m) -> M1
- [ ] T-L1-2 Mode switch + modes config (labels, event types, colors) (45m) -> M1
- [ ] T-L1-3 Home/Log screen: person picker, mic button, text box next to the mic, tap-logger fallback, "Reset demo data" button (60m) -> M1
- [ ] T-L1-4 useSpeech hook (Web Speech API, interim text, stop on silence) (60m) -> M2
- [ ] T-L1-5 Confirm card: fields, low-confidence highlight, edit, Save (60m) -> M2
- [ ] T-L1-6 Person view: timeline by day and time band, pattern cards (75m) -> M2
- [ ] T-L1-7 Ask screen: input + mic, answer, evidence, red-flag banner (60m) -> M3
- [ ] T-L1-8 Winning Patterns screen: ranked cards, tier badges, disclaimer (60m) -> M3
- [ ] T-L1-10 Invite gate: code entry screen, POST /api/invite, cookie check in middleware; codes from env `INVITE_CODES`; judge code in README and the submission form (45m) -> M2
- [ ] T-L1-11 Intake profile form (age band, gender optional, spectrum level mild/medium/severe in autism mode, communication level), POST /api/people (60m) -> M2
- [ ] T-L1-9 Guardrail banner + About page + polish on demo path only (45m) -> M4

## Lane 2: AI features
- [ ] T-L2-1 `src/lib/ai.ts` callClaude with caching, timeout, retry, usage logging (45m) -> M1
- [ ] T-L2-2 Formatter prompt + /api/log with zod validation, roster matching, time resolution, red flags, and kind (event / caregiver_distress / out_of_scope) per docs/EVALS.md (90m) -> M2
- [ ] T-L2-3 Demo cache for D1, D2, A1 phrases (30m) -> M2
- [ ] T-L2-4 Pattern summary prompt (numbers in, one line out) (45m) -> M2
- [ ] T-L2-5 /api/ask: retrieve person events + patterns, grounded answer, red-flag rule first (90m) -> M3
- [ ] T-L2-6 Prompt fixes from eval report (60m) -> M4

## Lane 3: Data, patterns, scoring
- [ ] T-L3-1 Prisma schema per DATA_MODEL, migrations (45m) -> M1
- [ ] T-L3-2 Seed script: featured people with planted patterns, 21 days (90m) -> M2
- [ ] T-L3-3 Seed background trials to hit SCORING seed targets (60m) -> M2
- [ ] T-L3-4 patterns.ts per DATA_MODEL rule + /api/patterns (75m) -> M2
- [ ] T-L3-5 scoring.ts per SCORING + /api/strategies (60m) -> M3
- [ ] T-L3-6 people/events routes (45m) -> M2
- [ ] T-L3-8 /api/reset: restore seeded data (re-run seed), used by the "Reset demo data" button (30m) -> M2
- [x] T-L3-7 eval/cases.json: 30-case starter benchmark written by PM (see docs/EVALS.md)

## Lane 4: PM, pitch, validation
- [ ] T-L4-1 Repo, Railway project, invites, ANTHROPIC_API_KEY in Railway (30m)
- [ ] T-L4-2 3 to 5 interviews at the event, quotes in docs/research/ (ongoing)
- [ ] T-L4-3 Run eval-agent at M2 and M3 (runner eval/run.ts, report per type), qa-agent at M3 and M4
- [ ] T-L4-7 Red-team run on safety/prompts.json (59 prompts): pass rate per category, name each failure, fix, rerun; before/after numbers for the slide
- [ ] T-L4-6 Grow benchmark toward 100: Claude-drafted variants, human-checked, plus every real failure as a regression case
- [ ] T-L4-4 pitch-agent: PITCH.md, ARCHITECTURE.md, deck
- [ ] T-L4-5 Backup demo video at M4, 3 timed rehearsals on demo morning

## Cut list (drop in this order if behind)
1. Tap-logger polish (keep bare form)
2. About page
3. Autism mode Ask (keep live log, pattern + strategies; PM decision is both modes live, so cut this only with PM sign-off)
4. Timeline grouping (plain list)
5. Live voice (use cached transcripts with a "speak" button that plays the cached flow)
