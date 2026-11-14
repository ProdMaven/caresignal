# Decisions (choice, alternative rejected, why)

- One engine, two modes (dementia, autism): rejected two separate apps. Same need (decoding distress in people who cannot say what they need), one codebase, bigger story.
- Statistics find patterns, Claude explains: rejected letting the model find patterns. Deterministic counts cannot hallucinate, are cheaper, and are auditable.
- Controlled vocabulary in the formatter: rejected free-text tags. Consistent fields make counting and cross-family matching possible.
- Precomputed strategy scores from seed data: rejected live recomputation. One build day; live tracking is roadmap.
- Browser Web Speech API: rejected a paid speech vendor. Free, no keys, good enough for a demo with a headset mic.
- SQLite via Prisma: rejected hosted Postgres for the demo. Zero setup; swap later.
- Synthetic data only: rejected any real data. Health and children's data carry privacy law obligations we will not take on this weekend.
- Primary users are family caregivers at home (adult children of a parent with dementia, parents of autistic children): rejected nursing home aides as the lead user. Families are the team's chosen user, log on their own phones, and multiple family members plus a home aide create the same "nobody sees the whole day" problem.
- Full PRD scope with both modes live (PM, Nov 14): rejected the 3-feature cut and a single lead mode. The team wants Ask AI and the "one engine, two communities" story shown live; the cut list in TASKS is the fallback if behind.
- Reset demo data via POST /api/reset that re-runs the seed: rejected a manual redeploy. Judges type their own notes, so the demo needs a one-tap way back to the seeded state.
- Invitation-only entry via shared invite codes and a cookie (PM, Nov 14): rejected open access and rejected full accounts. Trust matters for families sharing sensitive notes; accounts are too much for one day. Judges get a code in the README so the public URL gate still passes.
- Intake profile asks age band, optional gender, spectrum level (mild, medium, severe), and communication level (PM, Nov 14): rejected a diagnosis field and a medication field. Research (docs/research/autism_patterns_by_age_gender.md) recommended support-needs wording instead of mild, medium, severe; the PM chose the plainer labels caregivers already use. Gender is for bias audits and display only.
- Expanded journey (PM, Nov 14): match and next step right after Save, caregiver check-in, "Did this help?" feedback, language picker, journal and overview are in; caregiver-to-caregiver messaging is roadmap only. Rejected building messaging now: free text between families is the main route for spam and unsafe advice, and it needs moderation we cannot build this weekend.
- Feedback counts are shown next to the score, not folded into it: rejected "more upvotes, higher score". Votes are easy to game and are not outcome evidence; the score stays tied to before and after logs.
