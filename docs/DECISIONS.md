# Decisions (choice, alternative rejected, why)

- One engine, two modes (dementia, autism): rejected two separate apps. Same need (decoding distress in people who cannot say what they need), one codebase, bigger story.
- Statistics find patterns, Claude explains: rejected letting the model find patterns. Deterministic counts cannot hallucinate, are cheaper, and are auditable.
- Controlled vocabulary in the formatter: rejected free-text tags. Consistent fields make counting and cross-family matching possible.
- Precomputed strategy scores from seed data: rejected live recomputation. One build day; live tracking is roadmap.
- Browser Web Speech API: rejected a paid speech vendor. Free, no keys, good enough for a demo with a headset mic.
- SQLite via Prisma: rejected hosted Postgres for the demo. Zero setup; swap later.
- Synthetic data only: rejected any real data. Health and children's data carry privacy law obligations we will not take on this weekend.
- Primary users are family caregivers at home (adult children of a parent with dementia, parents of autistic children): rejected nursing home aides as the lead user. Families are the team's chosen user, log on their own phones, and multiple family members plus a home aide create the same "nobody sees the whole day" problem.
