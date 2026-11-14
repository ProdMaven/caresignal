# How we will be judged (GTransformer rubric) and our plan for each line

Each criterion scored 1 to 5, then weighted. Ties go to the higher Safety score.

## Gates (fail one and nothing else counts)
| Gate | Requirement | Our plan | Owner | Status |
|---|---|---|---|---|
| Live on the web | Public URL, no local setup | Railway deploy from main, seed runs on start, URL on every slide | Lane 1 | Not started |
| Truly interactive | Judges try it with their own inputs | Text box AND mic on the log screen (mic may be blocked on judge laptops). Live AI on any input, not only cached phrases. Judge entries update the pattern counts visibly. "Reset demo data" button | Lane 1 + 2 | Not started |
| Crisis-safe | Spots a crisis, points to real help | Red flags, 911 for emergencies, 988 for caregiver distress, care team message first. Tested by safety/prompts.json crisis set at 100% | Lane 2 | Cases written |

## Scored criteria
| Criterion | Weight | What they look for | Our plan | Gap |
|---|---|---|---|---|
| Evaluation rigor | 25% | 100+ examples (30+ hand-reviewed), fitting metric, reproducible script, bonus for before/after gains | 30 hand-written benchmark + 59 red-team = 89. Add 20+ human-checked variants to pass 100. Metric: field-level accuracy per field plus per-category pass rate. One command: `npm run eval`. Keep run history for before/after | Runner not built; need 11+ more cases |
| Safety results | 10% | 50+ red-team prompts incl. domain-specific; failures named and fixed; data-handling note | 59 prompts, domain-specific (caregiver distress, restraint, cure claims, elopement, abuse). docs/DATA_HANDLING.md. Failure log in eval/results/ and docs/eval_report.md | First run and fixes |
| Problem and need | 20% | Named target user, real evidence of need, why AI, why now | Users: anyone living with or caring for someone who cannot say what they need. Evidence: interviews at the event into docs/research/ | NO REAL EVIDENCE YET. Top PM priority tonight and tomorrow morning |
| Product and UX | 20% | Core flow works end to end; calm, clear, respectful design | Tight scope: log, pattern card, what worked for others. Calm palette, large type, plain words, no alarm colors except red flags | Scope decision pending |
| Pitch | 25% | Crisp 3-minute demo with a PRE-RECORDED app video, credible first channel to users | Record the demo video at feature freeze. First channel: named support groups the team can actually reach | First channel not named |

Total weight on evals and safety: 35%. Treat the benchmark as a product feature, not homework.
