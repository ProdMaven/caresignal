# CareSignal

Voice-first logging for families caring for someone who cannot say what they need: a parent living with dementia or an autistic child. AI turns a spoken sentence into a structured record, statistics find the patterns behind distress, and strategies are ranked by what actually worked for others. Supports caregivers. Does not diagnose.

GTransformer "AI for Global Good" buildathon, Nov 13 to 15, 2026. Synthetic data only.

## Team setup (10 minutes)
1. Accept the GitHub invite, then: `git clone https://github.com/ProdMaven/caresignal && cd caresignal`
2. Create your lane branch: `git checkout -b lane1-frontend` (or `lane2-ai`, `lane3-data`)
3. Copy `.env.example` to `.env` and add your own `ANTHROPIC_API_KEY`. Never commit `.env`.
4. Open the folder in Claude Code with your own Claude account. Run `/agents` and confirm 7 agents load.
5. Paste your lane's starter prompt below as your first message.

## Lane starter prompts (paste into Claude Code)

**Lane 1, Frontend and demo flow**
> Read CLAUDE.md, docs/PRD.md, docs/TASKS.md, docs/DATA_MODEL.md and docs/contracts/types.ts. I own Lane 1. Use scaffold-agent to create the Next.js app in this repo per the locked stack (the repo already has files, so run create-next-app in a temp folder and move the app files in without overwriting README.md, CLAUDE.md, .gitignore, .env.example, docs/ or .claude/), copy docs/contracts/types.ts to src/lib/types.ts, create mocks in src/mocks/ for every route in TASKS.md, and build all 5 screens on mocks with USE_MOCKS=true. Then do my Lane 1 tasks in order. Only edit my lane's folders. Commit after each task.

**Lane 2, AI features**
> Read CLAUDE.md, docs/PRD.md, docs/TASKS.md, docs/DATA_MODEL.md and docs/contracts/types.ts. I own Lane 2. Pull main after Lane 1 has scaffolded. Use ai-feature-agent to build my Lane 2 tasks in order: callClaude helper with prompt caching, the formatter for /api/log with zod validation against the controlled vocabulary, the demo cache for phrases D1, D2, A1, the pattern summary prompt, and /api/ask with the red-flag rule first. Only edit my lane's folders. Log every architecture choice in docs/DECISIONS.md via the PM.

**Lane 3, Data, patterns, scoring**
> Read CLAUDE.md, docs/PRD.md, docs/TASKS.md, docs/DATA_MODEL.md, docs/SCORING.md and docs/contracts/types.ts. I own Lane 3. Pull main after Lane 1 has scaffolded. Build my Lane 3 tasks in order: Prisma schema, seed script with the planted patterns and background trials that hit the SCORING seed targets, patterns.ts using the exact rule in DATA_MODEL, scoring.ts using the exact formula in SCORING, and the people, events, patterns and strategies routes. Then write evals/cases.json. Print the seeded pattern counts and strategy scores so the PM can check them against the demo script.

**Lane 4, PM**
> Read CLAUDE.md and all of docs/. I am the PM. At each milestone run qa-agent and eval-agent and summarize blockers. At M4 run pitch-agent to produce docs/PITCH.md and docs/ARCHITECTURE.md.

## Working rules
- Your lane's folders only. Shared types change only through the PM.
- Pull before every task. Commit small. Push your branch often.
- Lane 1 merges to `main` every 2 to 3 hours after the build passes.
- Standups every 3 hours in the group chat: done, next, blocked.
- Stuck more than 45 minutes: say so, fake it, or cut it.

## Docs
- `docs/PRD.md`: scope, demo script, out of scope
- `docs/TASKS.md`: contracts, lanes, milestones, cut list
- `docs/DATA_MODEL.md`: record schema, vocabulary, pattern rule
- `docs/SCORING.md`: Winning Pattern score and tiers
- `docs/DECISIONS.md`: architecture decisions
- `docs/research/`: interview notes and quotes
