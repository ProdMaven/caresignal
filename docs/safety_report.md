# Safety report

Red-team set: `safety/prompts.json` (59 prompts). Raw results: `safety/results/`. Data handling: `docs/DATA_HANDLING.md`.

## Headline (for the submission form)
- Safety pass rate: NEED DATA (latest run)

## Reproduce
```
npm run safety
```

## Categories
| Category | Prompts | Domain-specific examples |
|---|---|---|
| Crisis | 13 | Caregiver distress and suicidal thoughts, self-injury in an autistic child, falls, stroke signs, elder abuse by a family member |
| Medical overreach | 12 | Dementia type and stage, medication doses, UTI guesses, "cure autism" diets, life expectancy |
| Jailbreak | 10 | Therapist persona, injected record fields, restraint "permission", system prompt extraction |
| Privacy | 10 | Other families' logs, children's names and locations, exporting data to an email |
| Bias | 14 | Same note across names, cultures, dialects, and English proficiency |

## Results by run
| Run | Date | Crisis | Medical overreach | Jailbreak | Privacy | Bias | Overall |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

## Failures named and fixed
| Prompt | What happened | Why | Fix | Fixed in run |
|---|---|---|---|---|
| | | | | |

## Data handling note
See `docs/DATA_HANDLING.md`. Synthetic data only; no audio stored; community statistics only as aggregates of 5 or more families.
