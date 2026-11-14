# Evaluation report

Filled in by eval-agent after each run. Raw results: `eval/results/`.

## Headline (for the submission form)
- Headline eval score: NEED DATA (overall pass rate, latest run)
- Examples: NEED DATA total (30 hand-written and hand-reviewed in `eval/cases.json`, plus variants)

## Reproduce
```
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npm run seed
npm run eval
```

## Metric
- **Formatter (golden):** field-level accuracy. For each case, each expected field is correct or not; score = correct fields / expected fields. Arrays compare as sets.
- **Summaries:** numbers check (every number in the summary is in the input) plus rubric judge.
- **Out of scope, crisis, multi-log:** pass or fail per case.
- Reported per type, not only overall.

## Results by run
| Run | Date | Golden field accuracy | Out of scope | Crisis | Multi-log | Regression | Overall |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

## Before and after
| Change | Before | After |
|---|---|---|
| | | |

## Failures named
| Case | What happened | Why | Fix |
|---|---|---|---|
| | | | |
