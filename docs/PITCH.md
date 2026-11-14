# CareSignal pitch pack

GTransformer "AI for Global Good". Due Sunday Nov 15, 12 PM. Format: 3 minutes with a pre-recorded app video, then 2 minutes of Q&A.

Live app: https://web-production-1bb4dc67.up.railway.app (judge invite code `GTRANSFORMER-JUDGE`)

Anything in [SQUARE BRACKETS] is a slot the PM must fill. Anything marked NEED DATA has no source in the repo and must not be estimated.

---

## 1. The one sentence and the 3-minute script

### The one sentence

**Distress is communication. One spoken sentence becomes a signal a family can act on.**

One use case, said once at the start and once at the end: logging. Everything else in the app supports that sentence or stays on the roadmap.

### How the time maps to the rubric

| Time | Slide | Rubric line it serves | Weight |
|---|---|---|---|
| 0:00 to 0:27 | 1. Problem | Problem and need | 20% |
| 0:27 to 1:35 | 2. Demo video (68 s) | Product and UX | 20% |
| 1:35 to 2:05 | 3. How it works and why it is safe | Safety results | 10% |
| 2:05 to 2:38 | 4. Proof | Evaluation rigor | 25% |
| 2:38 to 3:00 | 5. Who first and what is next | Pitch (credible first channel) | 25%, scored across the whole talk |

### Script (442 spoken words, about 147 words a minute)

Count is for the version with no quote, with [FIRST CHANNEL] counted as two words. Rehearse with a timer. If you run long, cut the lines marked (cut first).

**Slide 1. 0:00 to 0:27 (69 words)**

> Distress is communication. When a person living with dementia, or an autistic child, is hungry, tired, or in pain, they often cannot say so. It comes out as agitation or a meltdown. Sixty-three million Americans are family caregivers.
>
> The aide sees a small lunch at noon. The daughter sees the agitation at three. Nobody connects them.
>
> With CareSignal, one spoken sentence becomes a signal a family can act on.

How the quote slots work:

- **No quote arrives:** read it as written. The middle paragraph is a picture of the problem, not a real person. Do not present it as one.
- **One quote arrives:** replace the middle paragraph (18 words) with: "A [ROLE] told us: [QUOTE 1: role, words]." Keep the quote to 20 words or fewer.
- **Two quotes arrive:** [QUOTE 2: role, words] goes on slide 1 as text only. Do not read it aloud. There is no time.

**Slide 2. 0:27 to 1:35 (157 words, spoken live over the muted video)**

> Here is the product. Neha cares for her mother, Helen. All names are synthetic. She taps the mic and talks. Mom was agitated around three. She barely ate lunch. A snack and music helped.
>
> The model turns that into a log entry. Who, what, when, what came before, what she tried. One field is marked please check. She can change any field before saving. She sets the snack to helped, and saves.
>
> Now plain statistics take over, not the model. This note fits a pattern in Helen's own logs. Agitation after a small lunch, seen by different caregivers. Possible things to check: hunger, pain, tiredness. Never a cause. Below is what other families tried. Those numbers are demo data, not results.
>
> Next, a note with a bruise. The safety message comes first: please contact your doctor or care team.
>
> One switch, and the same engine supports the parent of an autistic child. Needs and triggers, nothing else.

**Slide 3. 1:35 to 2:05 (75 words)**

> In the log, the model has one job. It turns words into fields. Plain code counts the patterns, so the model cannot invent a pattern. A fixed safety screen runs before any model call. Red flags lead to your doctor or care team. Emergencies say call 911. A caregiver in distress gets the 988 Suicide and Crisis Lifeline. It never suggests medication or restraint. Supports caregivers. Does not diagnose. If the model fails, the safety message still shows. (cut first: the last sentence)

**Slide 4. 2:05 to 2:38 (84 words)**

> How do we know? One hundred three test examples, one command. A keyword baseline passed 50 percent. Today the real model passes 39 of 44. Crisis and out of scope are at 100 percent. Our red team is 59 of 59.
>
> We got there by failing. Dialect notes got a different intensity. Fixed. A parent on our team spoke a real note, 150 words. It timed out, and the fallback logged a child biting their own hand as aggression. Fixed, and now a test.

**Slide 5. 2:38 to 3:00 (57 words)**

> Who first? Families who share the care of one person. We plan to approach parent-run support groups, starting with [FIRST CHANNEL]. Next, accounts, so entries are private. Then caregiver matching and wearables, on the roadmap. (cut first: this sentence)
>
> The app is live. Type your own note.
>
> Distress is communication. One spoken sentence becomes a signal a family can act on.

If [FIRST CHANNEL] is not filled by recording time, stop the sentence at "parent-run support groups." Never name a group you have not contacted.

---

## 2. Deck outline (5 slides, in the order docs/DELIVERABLES.md requires)

Put the live URL and the invite code in the footer of every slide.

### Slide 1. Problem

- **Title:** Distress is communication
- **On the slide (4 bullets at most):**
  - "People who cannot say what they need. Families who cannot see the pattern."
  - [QUOTE 1: role, words]
  - [QUOTE 2: role, words] (delete the bullet if it does not arrive)
  - Named user: a family caregiver sharing care with a sibling and a home aide
- **Exact numbers shown:** 63 million family caregivers in the U.S. (AARP and National Alliance for Caregiving, 2025). Nearly 13 million unpaid dementia caregivers (Alzheimer's Association). Both are in `docs/research/market_and_differentiation.md` and `docs/problem.md`. The "1 in 31" autism figure is in `docs/problem.md` only and the research file says it was not rechecked, so leave it off unless the PM verifies it.
- **Also on the title area:** [TEAM NAMES]
- **Speaker note:** Lead with the person, not the app. If no quote exists, do not fill the slot with a persona quote. Neha and Helen are synthetic and must never be quoted as users. Leave the bullet out and let the scale number carry it.

### Slide 2. Demo

- **Title:** One spoken sentence becomes a signal
- **On the slide:** one visual only, the 68-second video ([VIDEO LINK OR FILE]), full height, phone width. Caption burned into the video during the strategy card: "Demo data (synthetic)".
- **Exact numbers shown:** none on the slide. The video shows Helen's pattern count and the strategy card numbers. All of them are seed data.
- **Speaker note:** Narrate live over the muted video using the slide 2 script. Say "Care Profile" if you name the person picker. Never say "caregiver profile". Do not read the score or the percentages on the strategy card aloud.

### Slide 3. How it works and why it is safe

- **Title:** Statistics find the pattern. The model only fills in the fields.
- **On the slide:** one visual, the diagram below, plus a strip of three lines under it:
  - Red flag: "Please contact your doctor or care team" comes first
  - Possible emergency: call 911. Caregiver distress: 988 Suicide and Crisis Lifeline, and nothing is logged
  - "Supports caregivers. Does not diagnose." Possible things to check, never causes. No medication, restraint, or clinician-supervised strategies are suggested
- **Data handling line (small):** Synthetic data only. Audio is never stored. Community numbers show only with 5 or more families, with the count visible.
- **Exact numbers shown:** 5 (minimum families).
- **Speaker note:** One sentence per box. Optional single line if a judge asks how it was built: "We built it in three days with AI coding agents in separate lanes and a human PM making every product call."

```mermaid
flowchart TD
  U[Caregiver speaks or types a note] --> UI[Log screen: mic and text box]
  UI --> API[POST /api/log]
  API --> S[Safety screen: fixed rules, fixed wording]
  S -->|caregiver distress| C988[988 message, nothing logged]
  S --> DC[Demo cache: 3 scripted phrases]
  S --> P[Formatter prompt, prompt caching on]
  P --> M[Claude model: note to fields]
  M --> V[Validation: schema and fixed vocabulary]
  M -.->|model slow or down| FB[Keyword fallback, every field marked for review]
  DC --> CC[Confirm card: caregiver edits any field]
  V --> CC
  FB --> CC
  S -->|red flags, union with the model's| CC
  CC -->|Save to log| EV[POST /api/events]
  EV --> ST[(Demo store: synthetic seed data, in memory)]
  ST --> PC[Pattern counter: plain code, no model]
  ST --> SC[Strategy scores: computed ahead from seed data]
  PC --> OUT[Match panel and Timeline]
  SC --> OUT
  EVAL[Eval loop: 44 benchmark cases and 59 red team prompts] -->|npm run eval, npm run safety| API
  EVAL --> REP[eval and safety reports, run history]
```

One sentence per box:

| Box | What it is |
|---|---|
| Log screen | Where the caregiver taps the mic or types. Speech becomes text in the browser. |
| POST /api/log | The one route that reads a note. It does not save anything. |
| Safety screen | Fixed rules that run before any model call and choose the safety wording. |
| Demo cache | Three scripted phrases answered without the network so the video is repeatable. |
| Formatter prompt | The instructions and fixed vocabulary, cached so repeat calls are cheaper and faster. |
| Claude model | Turns the note into fields. It does nothing else in this flow. |
| Validation | Rejects anything outside the schema and the fixed vocabulary. |
| Keyword fallback | If the model fails, a rules-only draft with every field marked for review. |
| Confirm card | The caregiver checks and can change every field before saving. |
| Demo store | Synthetic entries held in memory. It resets on deploy and on Reset demo data. |
| Pattern counter | Plain code that counts what came before hard moments. |
| Strategy scores | Numbers computed ahead of time from synthetic seed families. |
| Eval loop | 103 examples run with one command against the live route, with history kept. |

Why table (from `docs/DECISIONS.md`):

| Choice | Alternative rejected | Why |
|---|---|---|
| Statistics find patterns, the model formats | Letting the model find patterns | Counts cannot hallucinate, are cheaper, and can be audited |
| Fixed vocabulary for fields | Free-text tags | Consistent fields make counting possible |
| Safety screen before the model, red flags are the union of screen and model | Trusting the model alone | Crisis handling must hold when the model is slow, down, or manipulated |
| Rules-only fallback | Showing an error | A caregiver in a hard moment still gets a draft to confirm |
| Per-step results on what was tried | One outcome for the whole event | A real parent's note showed several things tried with different results |
| A reported remedy is recorded as given, never ranked | Dropping it, or treating it as a medication question | Parents report what they did. The app must not scold and must not rank medicines |
| Time limit raised from 9 to 18 seconds | Keeping one short limit for every note | Real spoken notes run about 150 words and were timing out |
| Synthetic data only | Any real data | Health and children's data carry legal duties we will not take on this weekend |
| Invite codes | Open access, or full accounts | Trust matters and accounts were too much for the weekend |
| Browser speech to text | A paid speech vendor | Free, no keys, good enough for the demo |

### Slide 4. Proof

- **Title:** We measured it, broke it, and fixed it
- **On the slide:** the run history table, the headline numbers, and three named failures.

Run history (from `eval/results/history.json`, `safety/results/history.json`, `docs/eval_report.md`, `docs/safety_report.md`):

| Step | Benchmark | Red team |
|---|---|---|
| Keyword-rule baseline (no model) | 50.0% (15 of 30) | 59.3% (35 of 59) |
| Rules only: safety screen and keyword fallback | 70.0% (21 of 30) | 84.7% (50 of 59) |
| First real-model run | 83.3% (25 of 30) | 94.9% (56 of 59) |
| After the bias fix | 83.3% (25 of 30) | 100% (59 of 59) |
| After real-length note handling | 88.6% (39 of 44) | 100% (59 of 59) |

- **Exact numbers shown:**
  - 103 examples: 44 benchmark and 59 red team. 30 hand-written and hand-reviewed.
  - Benchmark 39 of 44 (88.6%). Field accuracy on the golden cases 98.0%.
  - Crisis 100%. Out of scope 100%.
  - Red team 59 of 59: crisis 13 of 13, medical overreach 12 of 12, jailbreak 10 of 10, privacy 10 of 10, bias 14 of 14.
  - Typical response about 2.2 seconds for a short note (median 2206 ms), 7 to 8 seconds for a 150-word spoken note. 95th percentile 5590 ms on the benchmark.
  - Prompt cache hit rate 98.0% of input tokens.
  - Cost per request: NEED DATA (`eval/pricing.json` still has placeholder prices).
- **Named failures, found and fixed, now regression cases:**
  1. Dialect and limited-English notes got a different intensity for the same event (bias).
  2. A real 150-word spoken note from a parent on our team hit the 9-second limit and fell back to keyword rules, which logged a child biting their own hand as aggression.
  3. A parent reporting a remedy they gave was treated as asking for medication advice.
- **Speaker note:** Be exact about the last step. The benchmark grew from 30 to 44 cases. The original 30 still pass 25. All 14 new real-length cases pass. So the move from 83.3% to 88.6% comes from handling long notes, not from fixing the older failures. Say so if asked. Four cases still fail and one cannot be graded as written.

### Slide 5. Who we reach first and what is next

- **Title:** First families, then the next ones
- **On the slide (4 bullets):**
  - First users: families who share the care of one person
  - First channel (a plan, not a partnership): parent-run support groups we plan to approach, starting with [FIRST CHANNEL]
  - Next: accounts so entries are private, real caregiver interviews, saved data that survives a restart
  - Roadmap: caregiver-to-caregiver matching (needs moderation first), wearables
- **Exact numbers shown:** none.
- **Speaker note:** End on the one sentence and the live URL. Invite the judges to type their own note.

---

## 3. Demo click script (pre-recorded video, 68 seconds)

Record muted. The presenter narrates live with the slide 2 script. Everything named below is the real label on screen.

**Starting state (before you press record):** invite code already entered, Log screen open, top bar shows `Dementia care` selected, "Who is this about?" shows `Helen`, "Who is logging?" shows `Neha (daughter)`. The video starts on the mic. It never shows the invite screen or "Add the person you care for".

| # | Video time | Screen | Tap or type (exact label) | What appears | Narration cue |
|---|---|---|---|---|---|
| 1 | 0:00 to 0:03 | Log, heading "What happened?" | Nothing. Hold still. | Mic button with "Tap to speak" | "Here is the product. Neha cares for her mother, Helen. All names are synthetic." |
| 2 | 0:03 to 0:13 | Log | Tap the mic. Say: "Mom was agitated around 3, pacing and calling out for Dad. She barely ate lunch. A snack and some music helped, she settled after 20 minutes." | Label changes to "Listening". Words fill the text box. | "She taps the mic and talks. Mom was agitated around three..." |
| 3 | 0:13 to 0:16 | Log | Tap `Turn into a log entry` | Button reads "Reading your note...", then the card "Does this look right?" | "The model turns that into a log entry." |
| 4 | 0:16 to 0:24 | Confirm card | Scroll slowly past Person (Helen), What happened (Agitation), Time (3:00 PM), What you saw (Pacing, Calling out), What came before (Skipped or small meal). Under "How strong", which has the amber `Please check` badge, tap `Moderate`. Under "What you tried", on "1. Offered a snack", change the dropdown from "Not sure" to `Helped`. | The amber badge clears. The snack step reads "Helped". | "Who, what, when... One field is marked please check. She can change any field before saving. She sets the snack to helped" |
| 5 | 0:24 to 0:27 | Confirm card | Tap `Save to log` | Green box "Saved to Helen's log" | "and saves." |
| 6 | 0:27 to 0:41 | Match panel, same screen | Scroll down slowly | The warm line. Then "This fits a pattern in Helen's logs", the count line ending "seen by different caregivers", and "Possible things to check": Hunger, Pain or discomfort, Tiredness. Then "A next step that worked for other families" with the card "Scheduled mid-afternoon snack" and the line "Supports caregivers. Does not diagnose." | "Now plain statistics take over... Those numbers are demo data, not results." Burn the caption "Demo data (synthetic)" over the strategy card. |
| 7 | 0:41 to 0:53 | Log | Scroll up. Paste into the text box: "Mom has a new bruise on her arm and winced when I touched it." Tap `Turn into a log entry`. Then tap `Discard`. | Amber box titled "Please check with your care team", starting "Please contact your doctor or care team." It sits above the card. The card shows "Flagged for your care team:". | "Next, a note with a bruise. The safety message comes first..." |
| 8 | 0:53 to 1:05 | Log | In the top bar tap `Autism support`. Tap the chip `Hard morning`. Tap `Turn into a log entry`. | Card: Arjun, Meltdown, Severe, What came before: Poor sleep, Routine change. Time has the `Please check` badge. | "One switch, and the same engine supports the parent of an autistic child. Needs and triggers, nothing else." |
| 9 | 1:05 to 1:08 | End card | None | Live URL and invite code | Silence. Move to slide 3. |

Notes on the steps:

- **Step 2 safe take.** If speech to text changes the wording, the note goes to the live model and the card may differ a little. For a guaranteed card, tap the chip `Afternoon agitation` instead of the mic. That exact text is cached and never touches the network. Record both takes and keep the better one. A take that opens on the mic is preferred.
- **Step 6 count.** After a reset, saving this note should move Helen's pattern from 6 of 8 to 7 of 9 (per `docs/HANDOFF.md`). Do not say a number in the narration. Let the screen show it.
- **Step 7 is not cached.** It goes to the live model, about 2 seconds. The safety wording comes from the fixed screen, so it shows even if the model is slow. Rehearse this exact sentence once before recording and confirm the amber box appears above the card.
- **Step 8** stops at the confirm card. Do not save, and do not open "What worked" in autism mode on camera.

### Recording checklist

1. Record on the live app in Chrome, in a phone-width window (390 px wide). Hide bookmarks and other tabs.
2. Enter the invite code before recording so the video opens on the Log screen.
3. Reset first: scroll to the bottom of the Log screen, tap `Reset demo data`, then `Reset demo data` again in the dialog. Wait for "Demo data restored".
4. Make sure nobody runs `npm run eval` or `npm run safety` against the live app, and nobody deploys, while you record. Both reset the data.
5. No real names on screen. Only Helen, Neha, Rosa, Arjun, Priya, Maya. Check the browser profile icon, autofill, and the clipboard.
6. Allow the mic in the browser before recording. Use a quiet room or a headset.
7. Do one full dry run, then reset again, then record. Record three takes.
8. If the model is slow on step 7: keep recording, then trim the wait in editing. If it falls back or fails twice, use the backup crisis beat below.
9. In editing: mute the audio, add the "Demo data (synthetic)" caption during step 6, add the end card. Export the 68-second cut and the 30-second cut.
10. Watch the final file once on a different laptop.

**Backup crisis beat (no model call, instant).** Type "I can't do this anymore" and tap `Turn into a log entry`. A violet box titled "You matter too" appears with `Call 988` and `Text 988`, and the message ends "Nothing from this note was saved to the log." Change the narration line to: "Next, the caregiver herself says I can't do this anymore. Nothing is logged. She gets the 988 Suicide and Crisis Lifeline."

### 30-second fallback cut

Use this if time is cut or the main file will not play.

| Time | Shows | Say |
|---|---|---|
| 0:00 to 0:08 | Step 2 safe take (chip `Afternoon agitation`), `Turn into a log entry`, the card | "One sentence in. A log entry out. Every field can be changed." |
| 0:08 to 0:12 | `Save to log`, "Saved to Helen's log" | "Saved." |
| 0:12 to 0:22 | Match panel: pattern, possible things to check, strategy card with the caption | "It fits a pattern in Helen's own logs. Possible things to check, never a cause. The family numbers are demo data." |
| 0:22 to 0:30 | Step 7 result held as a still | "And a red flag always leads with: please contact your doctor or care team." |

### If the video will not play at all

1. Say: "The video is in the repo. Here is the same flow in three pictures." Show three stills placed in the slide 2 notes: the confirm card, the match panel, the amber safety message.
2. Speak the 30-second cut lines over the stills.
3. Do not open the live app during the 3 minutes. Offer it in Q&A: "It is live right now. The code is GTRANSFORMER-JUDGE."
4. Backup file: [VIDEO LINK OR FILE]. The 30-second cut matches 0:03 to 0:53 of the main video with the pauses removed.

---

## 4. Judge Q&A prep

Two or three short sentences each. If you do not know, say "we have not measured that yet".

1. **Why AI?** A tired caregiver will not fill in a form, but they will say one sentence. The model turns that messy sentence into consistent fields, in any wording or language, which a form or keyword rules cannot do. Our keyword baseline passed 50.0% of the benchmark. The model passes 88.6%.

2. **How do you know it works?** We run 103 examples with one command against the live route and keep every run. The benchmark is at 39 of 44, with 98.0% field accuracy on the golden cases. All checks are deterministic. We have not yet run the model-graded tone checks.

3. **How do you know it is safe?** A fixed safety screen runs before any model call, and the model can add red flags but never remove them. Crisis and out of scope cases must pass at 100% or the run fails, and our red team is 59 of 59. The app never suggests medication or restraint, and it says "possible things to check", never causes.

4. **What happens when the model is wrong or down?** Wrong: the caregiver sees every field on the confirm card, unsure fields are marked "Please check", and nothing saves until they tap Save to log. Down: a keyword fallback returns a draft with every field marked for review, and the safety message still shows. After saving, an entry cannot be edited yet.

5. **Is the data real?** No. Every person, log, family count, and score in the app is synthetic seed data. The only real input was one spoken note from a parent on our team, used as a test with the name replaced and not stored.

6. **What about privacy and children's data?** Today there are no accounts, so everyone with a code shares one demo space and entries are not private. That is why we use synthetic data only and ask testers for nicknames. Audio is never stored. Before real families use it we need accounts, consent from parents, encryption, deletion, and a proper agreement with the model provider.

7. **How is this different from a notes app or existing care apps?** A notes app keeps text. We turn it into fields that can be counted across everyone who cares for the same person. We did a short desk scan, not a full competitor review. Trackers and family coordination apps exist, and at least one tracker already offers voice logging, so we do not claim to be first.

8. **What about bias across dialects and languages?** We tested the same note across names, cultures, dialects, and limited English. The first real-model run gave some dialect notes a different intensity. We fixed it, and all 14 bias prompts now return identical fields. The mic has a language picker, but voice is not yet tested on real phones across languages.

9. **What failed?** Three things we fixed: the dialect bias, a real 150-word note that timed out and was logged wrong by the fallback, and a reported remedy treated as a medication question. Four benchmark cases still fail and one cannot be graded as written. Two of the four are notes that name nobody when there are two children, where the app asks instead of guessing.

10. **Who is the first user and how do you reach them?** A family caregiver who shares the care of one person with a sibling, partner, or aide. Our first channel is parent-run support groups we plan to approach, starting with [FIRST CHANNEL]. We have no partnership and no outside data yet.

11. **What is the business model, and what does it cost per user?** We do not have a validated model. Our working guess is that families use it free and a care program or support organization pays, and that is untested. Cost per request: NEED DATA. We captured token usage but have not priced it.

12. **Why this model, and why not RAG or a vector database?** We used one Claude model (claude-sonnet-5-5, confirmed on the live app) and did not compare models this weekend. The benchmark lets us test a smaller one later. We do not need retrieval: the fixed vocabulary fits in the prompt, and patterns come from counting structured fields, which is exact and can be audited.

13. **How would you scale it?** Prompt caching is already on, at 98.0% of input tokens. Next we would send short notes to a smaller, cheaper model and keep the larger one for long notes, checked against the same benchmark. Later, once real and consented usage data exists, we could fine-tune a small model. That is a future step. We did not build it.

14. **What did you validate with real people?** Honestly, little so far. One parent on our team spoke a real note, and it exposed three bugs that short test sentences never would. [INTERVIEWS: number done and roles, or say "interviews start this week"].

15. **What happens after this weekend?** Accounts so entries are private, saved data that survives a restart, and editing after save. Then real interviews and a small test with families from [FIRST CHANNEL]. Caregiver matching and wearables stay on the roadmap until moderation and consent are designed.

Extra lines to have ready:

- **"Does the Ask screen use AI?"** No. Ask answers and pattern summary lines are computed text built from the counts. The model does two things in this build: it turns notes into fields, and it writes the short listening reply when a caregiver types into the check-in screen. That reply is checked for advice and replaced by a fixed message if it drifts, and crisis wording is always fixed, never model-written.
- **"The snack card says research-backed with a score of 81. Where is that from?"** It is demo data. The score, the family counts, and the badge are seeded so the screen has something to show. They are not findings.
- **"Why two communities?"** The need is the same and the engine is the same. For the pitch we show one use case, logging, and one short beat of the second mode.

---

## 5. Do not say

1. Do not invent or paraphrase a quote, a name, or a testimonial. Do not quote Neha, Priya, or any persona as a user. Do not quote the mentor as a user.
2. Do not present any community number as a result: not "27 families", not "74% improved", not the score. Say "demo data".
3. Do not say "AI answers your questions", "AI finds the pattern", or "AI explains". Say "the model turns the note into fields" and "plain statistics find the pattern".
4. Do not say "private journal" or "your data is private". There are no accounts yet.
5. Do not claim a partnership with, data from, or access to any support organization or care program. It is "a plan".
6. Do not say "diagnose", "cause", "detects pain", "predicts", or "clinically proven". Say "possible things to check".
7. Do not say "fixing behavior", "compliance", "stop the meltdowns", "kids with autism", or "dementia patient". Say "autistic child" or "child", "needs and triggers", "a person living with dementia".
8. Do not say "caregiver profile" for the person being cared for. The one term is "Care Profile".
9. Do not describe caregiver messaging, wearables, or voice or video analysis as built. They are roadmap, and voice and video analysis are not planned for now.
10. Do not say "first voice-first caregiver app" or "nothing like this exists". We have not done a full review.
11. Do not estimate cost per request or any number marked NEED DATA.
12. Do not say the app "never mentions medication". A parent can report a remedy they gave and it is recorded. Say "it never suggests or ranks medication".
13. Do not say fine-tuning was done. It is a later step.
14. Do not show the invite screen or profile setup in the video.

---

## 6. What the PM must supply before recording

| Slot | Where it is used | What is needed |
|---|---|---|
| [QUOTE 1: role, words] | Script slide 1, deck slide 1 | One real caregiver quote, 20 words or fewer, role only, saved in `docs/research/` and `docs/problem.md` first |
| [ROLE] | Script slide 1 | The role of the person quoted, for example "a daughter caring for her mother" |
| [QUOTE 2: role, words] | Deck slide 1 only | Optional second quote, from the other community if possible |
| [FIRST CHANNEL] | Script slide 5, deck slide 5, Q&A 10 and 15 | The name of one parent-run support group the team can actually reach. If none, the script stops at "parent-run support groups." |
| [TEAM NAMES] | Deck slide 1 | Names as they should appear on the title area |
| [VIDEO LINK OR FILE] | Deck slide 2, fallback plan | Where the 68-second cut and the 30-second cut live in the repo |
| [INTERVIEWS] | Q&A 14 | How many caregivers were interviewed and their roles, or the honest "none yet" |
| Cost per request (NEED DATA) | Deck slide 4, Q&A 11 | Real prices in `eval/pricing.json` and one rerun, or leave it as "not measured" |

Decisions the PM should make before recording:

1. Adopt the mentor's point (running list items 1 and 4) so the pitch is formally "logging first". The script already assumes it.
2. Whether to seed Helen's pattern at 5 of 7 so the screen reads "6 of 8" after the save, or leave it at 7 of 9.
3. Whether public forum quotes in `docs/research/market_and_differentiation.md` may be used on slide 1 if no interview quote arrives. They would need the label "public forum post, not our interview" and a check of each link first. The script does not use them.
4. Whether the "Winning pattern, research-backed" badge and score 81 on the snack card should be visible in the video at all, given the scoring question in `docs/HANDOFF.md` item 6.
