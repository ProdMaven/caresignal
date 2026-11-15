# Unspoken PRD (buildathon scope)

## 1. One-liner
For caregivers of people who cannot always say what they need, Unspoken (working name, formerly CareSignal) turns a spoken sentence into a structured log, finds the patterns behind distress, and recommends strategies ranked by what actually worked for others. It supports caregivers and never diagnoses.

Pitch line: "Distress is communication. We help caregivers decode it, and every family's experience makes the next family's answer better."

## 2. Primary users (one engine, two modes, both family caregivers at home)
- **Dementia mode.** Neha, 48, cares for her mother Helen (synthetic, 79, dementia) at home with help from her brother on weekends and a part-time home aide on weekday mornings. Helen gets agitated most afternoons. Each caregiver sees a piece of the day and nobody sees the whole picture.
- **Autism mode.** Priya, parent of Arjun (synthetic, age 7, autistic). Mornings before school often end in meltdowns. She keeps scattered notes on her phone and cannot see a pattern or explain it clearly to his therapist.

Users are anyone who lives with or cares for the person day to day: parents, adult children, spouses, siblings, and home aides. They are mostly not professionals: tired, time-poor, logging from a phone in the moment. Several people can log for the same person. Decision (PM, Nov 14): full scope stays and both modes are first-class. Every screen, live AI logging, and Ask work in dementia mode and in autism mode. The demo opens in dementia mode and then switches to autism mode with a live log, to prove it is one engine.

## 3. Evidence
NO EVIDENCE YET from interviews. PM collects 3 to 5 quotes at the event from people with elder care or autism-parent experience into `docs/research/`. Background: care literature treats agitation in dementia as communication of unmet needs, frequently pain (Alzheimer's Association training materials).

## 4. Core flow
Family caregiver speaks -> AI formats a structured record -> pattern finder updates -> caregiver asks "why" -> grounded answer plus scored Winning Pattern.

1. Caregiver taps the mic and says one natural sentence.
2. Claude extracts a structured record using controlled vocabulary; a confirm card shows fields with low-confidence fields highlighted.
3. Caregiver taps Save (or edits a field). Record stored with the raw transcript.
4. Person view shows timeline plus pattern cards with evidence counts.
5. Caregiver asks a question by voice or text; answer cites counts from that person's logs.
6. Answer includes ranked strategies with tier badges and family evidence.

## 5. Screens (5)
1. **Home / Log**: mode switch, person picker, big mic button with a text box next to it (judges can type their own note), small tap-logger form fallback, confirm card. (The "Reset demo data" button was removed Nov 14 by the PM.)
2. **Person view**: header with person, timeline grouped by day and time band, 2 to 3 pattern cards (finding, evidence count, "possible things to check", link to matching strategies).
3. **Ask**: question box with mic, answer with evidence lines and linked entries, red-flag banner when triggered.
4. **Winning Patterns**: strategies for a selected pattern, ranked by score, tier badge, families, % improved, average drop, durability, disclaimer.
5. **About / guardrails** (small): what it does, what it never does, synthetic data note.

## 5b. Intake profile and invitation-only entry (PM, Nov 14)
- **Invitation-only entry.** The app opens on an invite code screen. A valid code sets a cookie and lets the caregiver in. No accounts, passwords, or roles. Codes live in the `INVITE_CODES` environment variable. Judges get a code in the README and the submission form so the public URL still works with no setup. Purpose: trust. Families share sensitive notes and community statistics should come from real caregivers, not spam.
- **Intake profile.** A caregiver can add the person they care for: first name or nickname, what they call them, age band (2 to 5, 6 to 11, 12 to 17, adult), gender (optional), spectrum level in autism mode (mild, medium, severe, as the caregiver describes it), and how the person usually communicates (speaks in sentences, some words, mostly non-speaking). No diagnosis field and no medication field. Gender never changes prompts, suggestions, or red flags. See `docs/research/autism_patterns_by_age_gender.md`.

## 5c. User journey (PM, Nov 14) and build order
1. Enter with an invite code and your name (no passwords this weekend).
2. Create a Care Profile for the person you care for: mode, age band, gender (optional), spectrum level, communication, usual sleep.
3. Home: pick a Care Profile, speak in your language or type, submit.
4. After Save: the matching pattern, a warm line, and the top next step, on the same screen.
5. (Removed Nov 14 by the PM: caregiver check-in screen. A caregiver who sounds in distress in a note still gets a caring message and the 988 Suicide and Crisis Lifeline, and nothing is logged.)
6. Feedback on every suggestion: "Did this help?" The count shows next to the score and never changes the score.
7. Weekly and monthly overview of the logs. (Caregiver journal removed Nov 14 by the PM.) Account page: who is logging, mic language, Care Profiles, sign out on this device. No passwords for now.
8. Roadmap only, not built: messaging between matched caregivers (needs moderation first).

Build order: step 4 above, then real AI on /api/log and the eval runner, then feedback, language picker, and the overview. Every new input surface gets red-team cases.

## 6. Why AI
Free speech from a tired family caregiver is messy ("she was really worked up around 3, wouldn't eat"). AI turns it into consistent, countable fields in seconds, which makes pattern finding across caregivers, days, and families possible at all. AI also explains statistics in caregiver language and answers natural questions. The statistics themselves are plain code, so the system cannot hallucinate a pattern.

## 7. Data
All synthetic, generated by `scripts/seed.ts`:
- Dementia: 1 featured person (Helen, mother of Neha), 21 days of logs from 3 caregivers (Neha, her brother Ravi on weekends, home aide Rosa on weekday mornings). Planted pattern: afternoon agitation after a skipped or small lunch, which Rosa logs in the morning and Neha sees in the afternoon. Second planted pattern: evening restlessness after a busy-visit day.
- Autism: 2 children, 21 days. Arjun has the planted pattern (morning meltdowns after poor sleep plus routine change).
- 50 background families with strategy trials and before/after outcomes, used for Winning Pattern scores. Scores precomputed by the seed script.
- Demo voice phrases cached (see Demo script).

## 8. Out of scope (do not build)
1. Accounts, passwords, roles, permissions (invite code gate only; single demo user, mode switch)
2. Live score recomputation (scores come from seed data; "Did this help?" feedback is counted and shown separately)
3. Shift handover summaries and therapist visit summaries (roadmap slide)
4. Sharing with co-parents, teachers, clinicians
5. Community posting, comments, free-text advice, and messaging between caregivers (roadmap slide; needs moderation)
6. Consent flows (described on slide only)
7. Spoken read-back and voice "save" command
8. Gap-filling follow-up questions
9. Integration with facility record systems
10. Native mobile app, push notifications, offline mode
11. Translated UI (the mic has a language picker and notes in any language are formatted into the same fields; screens stay in English)
12. Camera or sensor input
13. Fine-tuning any model

## 9. Demo script (90 seconds)
1. (10s) Mode = Dementia. Neha taps mic: "Mom was agitated around 3, pacing and calling out for Dad. She barely ate lunch. A snack and some music helped, she settled after 20 minutes."
2. (10s) Confirm card shows: Helen, agitation, moderate, 3:00 PM afternoon, pacing + calling_out, context skipped_meal, response offered_snack + music, outcome calmed. Save.
3. (20s) Person view: pattern card lights up "Afternoon agitation followed a skipped or small lunch on 6 of 8 days in the last 3 weeks." Possible things to check: hunger, pain, tiredness. Note: "Rosa logged the small lunch on 5 of those mornings", the pieces of the day finally connected.
4. (20s) Ask: "Why is Mom so upset every afternoon?" Answer cites counts and which caregiver saw what.
5. (15s) Winning Patterns: "Scheduled mid-afternoon snack" Winning pattern, score 81, 27 families, 74% improved, average drop 42%, held 6 weeks.
6. (15s) Flip mode to Autism. Priya logs A1 live (voice or typed), the confirm card fills in, then Arjun's pattern card and one Winning Pattern ("visual morning schedule"). "One engine for every family caring for someone who cannot say what they need."

Cached demo phrases:
- D1 (above)
- D2: "Rosa here, Helen only ate half her lunch today, she seemed tired."
- A1: "Arjun had a big meltdown before school, he slept badly and we had a substitute driver today."

## 9b. Judging gates (see docs/JUDGING.md)
- Public URL on Railway, no local setup.
- Judges must be able to type their own note (text box next to the mic) and get a live AI result, not only the cached phrases, in either mode. Their entries visibly update pattern counts. (The "Reset demo data" button was removed Nov 14 by the PM; added entries are kept.)
- Crisis-safe on any input.
- Pitch uses a pre-recorded app video.

## 10. Success check
- Can a judge watch a spoken sentence become a correct structured record in under 5 seconds?
- Does every pattern and answer show evidence counts that match the seeded data?
- Does a red-flag question ("he has been hitting his head") produce the doctor/care team message first?
