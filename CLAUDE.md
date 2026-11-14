# CareSignal project rules (every Claude session reads this first)

## What we are building
CareSignal: voice-first logging for caregivers of people who cannot say what they need (dementia residents, autistic children). AI turns spoken notes into structured records, statistics find the patterns behind distress, caregivers ask questions answered from their own logs, and strategies are ranked by what actually worked for other families ("Winning Patterns").

Buildathon: GTransformer "AI for Global Good", Nov 13 to 15. Demo is on day 3. A working narrow demo beats an ambitious broken one.

## Read before any task
1. `docs/PRD.md` (scope, demo script, out of scope)
2. `docs/TASKS.md` (API contracts, lanes, folder ownership, checkpoints)
3. `docs/DATA_MODEL.md` (record schema, controlled vocabulary, tables)
4. `docs/SCORING.md` (Winning Pattern score and tiers)
5. `docs/contracts/types.ts` (shared TypeScript types, source of truth)

## Locked stack
Next.js App Router + TypeScript, Tailwind + shadcn/ui, Anthropic SDK server-side only, SQLite via Prisma, deploy on Railway. Browser Web Speech API for speech-to-text.

## Team rules
- Work only in your lane's folders (see `docs/TASKS.md`). Shared files (`docs/contracts/types.ts`, `src/lib/types.ts`, `docs/TASKS.md`) change only through the PM.
- API contracts are frozen. If you need a change, stop and ask the PM.
- Pull before every new task. Commit small and often on your lane branch. Lane 1 merges to `main`; `main` must always build and deploy.
- Anything in PRD "Out of scope" is not built.
- Feature freeze: day 2, 10 hours after build start. After that, bug fixes and pitch only.

## Engineering rules
- Every AI call has a loading state, an error state, and a cached fallback for the scripted demo inputs.
- Prompts live in `src/prompts/`, ordered stable to volatile, with prompt caching on. No per-request data in system prompts.
- AI output is validated with zod against the shared types before it is saved or shown.
- Statistics find patterns and compute scores. Claude only formats notes and explains results. Claude never invents a pattern, a number, a diagnosis, a cause, or a medication.
- Synthetic data only. No real names, residents, or children.
- No secrets in client code or git. `ANTHROPIC_API_KEY` lives in `.env` locally and in Railway variables.
- Every architectural choice gets one line in `docs/DECISIONS.md`: choice, alternative, why.
- No prompt change is kept if it lowers the eval pass rate.
- No em-dashes in any user-facing copy or docs.

## Product guardrails (non-negotiable, also in UI copy)
- "Supports caregivers. Does not diagnose." on every insight screen.
- Suggestions are "possible things to check", never causes or diagnoses.
- No medication, restraint, or clinician-supervised strategies anywhere.
- Red flags (self-injury, sudden major change, signs of pain or illness, injury) always produce "Please contact your doctor or care team" before anything else.
- Community statistics show only when 5 or more families contributed, with the family count visible.
- Scores carry: "Based on family logs, not a clinical trial."
- Autism mode language: "autistic child" or "child", focus on needs and triggers, never on compliance or "fixing behavior".

## Agents (in `.claude/agents/`)
spec-agent, task-split-agent, scaffold-agent, ai-feature-agent, eval-agent, qa-agent, pitch-agent. The PRD and tasks are already written, so start at scaffold-agent.
