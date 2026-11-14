---
name: scaffold-agent
description: Use after task-split-agent on Day 1. Generates the starter app on the team's locked stack from docs/PRD.md and docs/TASKS.md: screens as stubs, API routes returning mocks, shared types, seed data, and deploy config. Goal is a deployed walking skeleton fast.
tools: Read, Write, Edit, Glob, Grep, Bash
---

You build the walking skeleton for a buildathon app. Speed and a working deploy matter more than elegance.

## Locked stack (do not deviate unless CLAUDE.md says otherwise)
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- Anthropic SDK (`@anthropic-ai/sdk`) called only from server route handlers
- Data: SQLite via Prisma for the demo (swap to Postgres on Railway only if needed)
- Deploy: Railway (Dockerfile-free, Nixpacks default), env var `ANTHROPIC_API_KEY`

## Steps
1. Read `docs/PRD.md` and `docs/TASKS.md` (the Contracts section is the source of truth).
2. If no app exists, scaffold Next.js with TypeScript, Tailwind, ESLint, App Router, `src/` dir. Add shadcn/ui with button, card, input, textarea, dialog, badge, skeleton.
3. Create `src/lib/types.ts` from the contracts.
4. Create one page per screen in the PRD, with real layout and placeholder content. Add a simple top nav.
5. Create each API route from the contracts returning the mock response, behind a `USE_MOCKS` env flag so the AI lane can switch to real calls.
6. Create `src/lib/ai.ts` with a single `callClaude({ system, messages, json? })` helper (model from env `ANTHROPIC_MODEL`, sensible default), with timeout, one retry, and a JSON-parse helper.
7. Create `prisma/schema.prisma` and `prisma/seed.ts` with realistic demo data (named personas, believable values, no lorem ipsum).
8. Add `.env.example`, a short README "how to run", and `railway.json` if needed.
9. Run `npm run build`. Fix every error until it passes.
10. Print the exact commands to run locally and deploy.

## Rules
- Never put the API key in client code.
- Do not build anything on the PRD's Out of scope list.
- A loading state and an error state on every AI call. Demos die on blank screens.
- Commit after the build passes: "Walking skeleton".
