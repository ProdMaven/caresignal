# Seeded demo patterns and what each one rests on

Written Nov 14. Every person, log entry, family count, percentage and score in the app is synthetic. No published dataset of caregiver episode logs was used, and none was found: research gives findings and prevalence figures, not logs. What research can do is tell us which patterns are realistic to seed. This file records, for each seeded pattern and strategy, the published finding behind it and how strong that finding is, so nobody presents demo data as a result.

Figures marked "from abstracts or summaries" were read in search results or abstracts, not full texts.

## Patterns

| Person (synthetic) | Seeded pattern | Count in the seed | What it rests on | Strength |
|---|---|---|---|---|
| Helen, living with dementia | Afternoon agitation after a skipped or small lunch | 6 of 8 | The unmet needs model: behavior in dementia often expresses a need the person cannot state, and hunger is among the needs clinicians are told to rule out ([Cohen-Mansfield et al., unmet needs in advanced dementia](https://pmc.ncbi.nlm.nih.gov/articles/PMC4451402); [Merck Manual](https://www.merckmanuals.com/professional/neurologic-disorders/delirium-and-dementia/behavioral-and-psychologic-symptoms-of-dementia)). Late-afternoon worsening is the "sundowning" window; reported prevalence ranges from 2.5% to 66% depending on definition and setting ([Canevelli et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5187352/)). | The link between a missed meal and afternoon agitation is plausible and guidance-level. No study we found measures it. |
| Helen | Morning refused care around bath or shower time | 5 of 6 | Bathing is a well-studied trigger. A randomized trial in 15 nursing homes (69 residents completed) cut aggressive incidents by 53% with person-centered showering and 60% with a towel bath, against 7% in usual care ([Sloane et al. 2004, summarized by the Commonwealth Fund](https://www.commonwealthfund.org/publications/newsletter-article/guidance-bathing-patients-dementia-bathing-without-battle)). | Strong for nursing homes (one trial, from abstracts or summaries). Not tested with families at home. |
| Helen | Evening restlessness after a visit | 4 of 5 | Overstimulation and tiredness are listed as possible contributors to late-day agitation in overviews of sundowning ([Osmosis](https://www.osmosis.org/answers/sundown-syndrome)); the 2016 review notes the evidence on triggers is thin. | Weak. Guidance-level only. |
| Arjun, autistic child, 7 | Morning meltdown after a night of poor sleep | 7 of 9 | Night waking had the strongest link to daytime aggression and irritability (Mazurek and Sohl 2016, n=81), and the prior night's sleep predicted next-day aggression or self-injury (Cohen et al. 2018). Sources and caveats are in `autism_patterns_by_age_gender.md`. | Medium. Association, not cause; from abstracts or summaries. |
| Arjun | Morning meltdown after a change in routine | 6 of 9 | Insistence on sameness and difficulty with unexpected change are core, well-documented features; visual supports for change are an evidence-based practice (NCAEP 2020, see `autism_patterns_by_age_gender.md`). | Medium for the trigger. No published rate. |
| Arjun | Evening hard transition after screen time ends | 5 of 6 | Named in parent guidance as a common trigger. Our research found it only in guidance sources, with no study of how often it happens. | Weak. Guidance-level only. |
| Aisha (demo entries; formerly the made-up profile "Maya"), autistic child | Afternoon shutdown after loud noise | 5 of 6 | Sensory differences affect roughly 69% to 95% of autistic children and persist with age; shutdown and withdrawal are described outcomes of sensory overload (see `autism_patterns_by_age_gender.md`). | Medium for sensory sensitivity. No published rate for shutdowns after noise. |

The counts (6 of 8, 5 of 6 and so on) are ours. They were chosen so each pattern clears the app's own rule (at least 4 matches and 60% of that kind of moment), not taken from any study.

## Strategies shown under each pattern

All family counts, percentages and scores are synthetic. Scores for the strategies added on Nov 14 come from the formula in `docs/SCORING.md`. The "research-backed" badge is used only where a published study supports the practice itself.

| Pattern | Strategy | Badge | What it rests on |
|---|---|---|---|
| Refused care around bathing | Towel bath in a warm room | Research-backed | Sloane et al. 2004 (above). The trial was in nursing homes. |
| Refused care around bathing | Same helper, same time of day; favorite music | None | Person-centered care guidance. No trial found. |
| Refused care around bathing | Getting it over with quickly | Not recommended | The opposite of the person-centered approach the trial tested. Seeded as worse, which is our assumption. |
| Restlessness after a visit | Shorter visits; quiet time after; visits earlier in the day | None | Caregiver guidance on overstimulation. No trial found. |
| Meltdown after a routine change | Show the change ahead of time with a picture | Research-backed | Visual supports are an NCAEP 2020 evidence-based practice. A 2025 review found insufficient evidence that the schedule itself is what improves transitions, so the badge refers to visual supports in general. |
| Meltdown after a routine change | One familiar thing stays the same | None | Practice guidance. |
| Meltdown after a routine change | Not mentioning the change until it happens | Not recommended | Our assumption, consistent with guidance on preparing for change. |
| Hard transition after screen time | Visual timer; two warnings; next activity ready | None | Practice guidance. One 2026 meta-analysis on transition warnings was seen only in a blog summary, so no badge. |
| Hard transition after screen time | Extra screen time to avoid the upset | Not recommended | Screens used as the routine calming tool were linked to later emotional dysregulation in a general-population cohort of 3 to 5 year olds. Correlational and not autism-specific. |
| Shutdown after loud noise | Ear defenders on hand; a quiet spot agreed in advance; leaving early | None | Practice guidance. No controlled outcome studies found. |

## What still does not match the evidence (left as is, PM decision)

- "Weighted blanket at bedtime" is still seeded as Promising for poor sleep; the one randomized trial found no sleep benefit.
- "Visual morning schedule" is still the top strategy for meltdowns after poor sleep; the evidence fits routine change better, and that pattern now has its own picture-based strategy.
- The older strategies keep hand-set scores (81 and 84) that the scoring formula cannot produce.

## How to say it in the pitch

"These are demo families. We seeded patterns that the research says are realistic, such as distress around bathing in dementia and harder days after a bad night in autism. The numbers are not results."
