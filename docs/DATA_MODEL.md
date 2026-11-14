# Data model

Source of truth for types: `docs/contracts/types.ts` (copied to `src/lib/types.ts` by the scaffold).

## Log record (one per event)
```json
{
  "id": "evt_0142",
  "mode": "dementia",
  "personId": "p_helen",
  "loggedBy": "cg_neha",
  "occurredAt": "2026-11-13T15:00:00-07:00",
  "timeBand": "afternoon",
  "loggedAt": "2026-11-13T15:04:12-07:00",
  "source": "voice",
  "eventType": "agitation",
  "behaviors": ["pacing", "calling_out"],
  "intensity": 2,
  "durationMin": 20,
  "contextBefore": ["skipped_meal"],
  "environment": [],
  "responseTried": ["offered_snack", "music"],
  "outcome": "calmed",
  "rawNote": "Mom was agitated around 3, pacing and calling out for Dad. She barely ate lunch. A snack and some music helped, she settled after 20 minutes.",
  "confidence": { "eventType": 0.95, "occurredAt": 0.8, "intensity": 0.6 },
  "needsReview": ["intensity"],
  "redFlags": []
}
```

## Controlled vocabulary
The formatter may only output these values. Anything else stays in `rawNote` only.

**timeBand**: early_morning (5 to 8), morning (8 to 12), afternoon (12 to 17), evening (17 to 21), night (21 to 5)

**eventType**
- dementia: agitation, calling_out, wandering, refused_care, refused_food, restlessness, crying, sleep_disturbance
- autism: meltdown, shutdown, stimming_increase, sleep_trouble, food_refusal, transition_distress, aggression, elopement

**behaviors** (shared): pacing, calling_out, crying, hitting, kicking, throwing, screaming, rocking, covering_ears, withdrawing, repetitive_speech, grabbing, biting, running_off, head_banging, body_movement, self_biting, self_hitting. Listed in the order they appeared. biting, hitting and kicking mean toward another person or a thing; self_biting and self_hitting are toward their own body and always set the self_injury red flag

**contextBefore** (shared): skipped_meal, poor_sleep, routine_change, transition, visitor, toileting_need, pain_signs, medication_time, bathing, new_person, screen_time_ended, loud_noise, crowd, clothing_texture, waiting, denied_request, woke_from_sleep

**environment** (shared): caregiver_handoff, noisy, crowded, bright_lights, new_place, outing, school, car, mealtime, bedtime

**responseTried** (shared): offered_snack, offered_drink, quiet_space, reassurance, redirect_activity, music, toileting_assist, pain_check_reported, sensory_tool, visual_schedule, deep_pressure, break_time, walk, cold_or_ice, massage, blocked_behavior, remedy_given

**responses** (v5): the same tags as responseTried, in the order tried, each with its own result: helped, helped_a_little, did_not_help, unknown. When several things were tried and the note only says how it ended, every result is unknown. `remedy_given` records that a medicine or remedy was given: no name, result always unknown, never counted in statistics, never ranked or suggested. `blocked_behavior` records that a movement was held or blocked so its results can be counted; it is never suggested

**outcome**: calmed, partly_calmed, escalated, unknown

**intensity**: 1 mild, 2 moderate, 3 severe

**redFlags** (set by formatter or Ask, never ignored): self_injury, head_banging, injury, fall, sudden_change, signs_of_illness, signs_of_pain_severe, not_eating_days

## Tables (Prisma, SQLite)
- **Person**: id, mode, displayName, aliases (JSON array, for "Mom", "Helen"), ageBand or careSetting, isFeatured (bool, demo people), plus intake fields: ageBand (2_5, 6_11, 12_17, adult), gender (optional), spectrumLevel (mild, medium, severe; autism mode), communicationLevel (speaks_in_sentences, some_words, mostly_non_speaking)
- **Event**: all record fields; list fields stored as JSON strings for the demo (fine for SQLite counts in code)
- **Pattern**: id, personId, mode, eventType, timeBand, contextTag, matchCount, totalCount, windowDays, confidence (low/medium/high), evidenceEventIds (JSON), summary (Claude one-liner, cached)
- **Strategy**: id, mode, name, description, patternKey (eventType + contextTag, e.g. "agitation|skipped_meal"), researchBacked (bool), safetyApproved (bool)
- **StrategyTrial**: id, strategyId, personId (background people), triedAt, eventsBefore14d, eventsAfter14d, sustained4w (bool), loggingStable (bool), concurrentStrategies (int)
- **StrategyScore**: strategyId, patternKey, families, pctImproved, avgDropPct, durabilityPct, score, tier, notRecommended (bool), computedAt

## Pattern finder rule (deterministic)
For each featured person over the last 21 days:
- For each (eventType, timeBand), count events. Keep combos with 4 or more events.
- For each kept combo and each contextTag, matchCount = events with that tag. Pattern if matchCount >= 4 and matchCount / total >= 0.6.
- confidence: high if total >= 6 and ratio >= 0.75; medium if ratio >= 0.6; else low (not shown).
- Cross-caregiver: if the context tag was logged by a different `loggedBy` (another family member or the home aide) than the event, mark `crossShift: true` (UI label: "seen by different caregivers").
- Claude writes the one-line summary from these numbers only.
