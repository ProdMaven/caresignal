# Caregiver Behavior-Tracking and Family Caregiving Tech (Autism + Dementia): Market, Payers, Funding, Moats (VC lens, as of Nov 2026)

Research note scope: US focus. Session date 2026-11-14. Tool-call budget limited this pass to ~20 searches/fetches; items not verified are listed under Gaps rather than filled from memory. Company-reported metrics are flagged as such.

## Market sizing (caregivers, dementia, autism, spend, services markets)

### Takeaway
The US "user" base is very large and growing fast: 63M family caregivers (up 20M in a decade), ~13M unpaid dementia caregivers delivering 19B+ hours worth $446B/yr, and a US ABA services market estimated at $25B to $35B+ growing 10 to 13%/yr. The money is in services (dementia care $409B/yr, ABA $25-35B), not in caregiver software, so a tracking app must attach itself to those service budgets.

### Cited Findings
**Family caregivers (AARP/NAC, Caregiving in the U.S. 2025, released July 24, 2025)**
- About 63 million Americans, nearly 1 in 4 adults, provided ongoing care in the past year; 59 million cared for someone over 18 — [AARP press release, Jul 24 2025](https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html)
- Caregiver population grew by 20 million between 2015 and 2025 (AARP frames it as a 45% increase) — [AARP press release](https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html); [AARP survey page](https://www.aarp.org/caregiving/basics/caregiving-in-us-survey-2025/)
- Nearly 1 in 4 caregivers provide 40+ hours of care per week; one-third have been caregiving 5+ years — [AARP press release](https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html)
- Nearly half of caregivers report at least one major financial impact (debt, stopped saving, food insecurity); average out-of-pocket spend about $7,200/year — [AARP press release](https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html); follow-up financial data release Oct 28 2025: [AARP](https://www.aarp.org/press/releases/2025-10-28-new-data-expose-financial-strain-of-family-caregiving.html)
- Survey included caregivers of children with complex medical conditions or disabilities; about 1 in 3 caregivers also raise children under 18 — [AARP press release](https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html)

**Dementia (Alzheimer's Association, 2026 Facts and Figures, current page)**
- 7.4 million Americans age 65+ living with Alzheimer's in 2026; projected nearly 13 million by 2050 — [alz.org Facts & Figures](https://www.alz.org/alzheimers-dementia/facts-figures)
- Nearly 13 million Americans provide unpaid care for people with Alzheimer's or other dementias; 19+ billion hours of unpaid care in 2025, valued at $446.3 billion — [alz.org Facts & Figures](https://www.alz.org/alzheimers-dementia/facts-figures)
- Total health and long-term care costs for dementia projected at $409B in 2026 (excluding unpaid care); Medicare + Medicaid cover $263B (64%); out-of-pocket $103B; nearly $1 trillion by 2050 — [alz.org Facts & Figures](https://www.alz.org/alzheimers-dementia/facts-figures)
- Medicaid costs per person with dementia are 22x higher than for older adults without dementia; Medicare costs nearly 3x higher — [alz.org Facts & Figures](https://www.alz.org/alzheimers-dementia/facts-figures)
- (Older 2025 edition executive summary for comparison) — [alz.org 2025 executive summary PDF](https://www.alz.org/getmedia/c05f7ba4-9aea-4cb0-8898-5e8bff3f0930/executive-summary-2025-alzheimers-disease-facts-and-figures.pdf)

**Autism services**
- US ABA therapy market estimated at $25B to $35B+, growing 10% to 13% annually, driven by prevalence, insurance coverage expansion, provider capacity (L.E.K., June 30 2025; consultant estimate) — [L.E.K. Consulting](https://www.lek.com/insights/healthcare-services/investing-autism-therapy-key-trends-shaping-us-aba-therapy-sector)
- Much smaller alternative estimate: "$4.4 billion U.S. autism treatment centers market" (MarketResearch.com / Marketdata; narrower definition, treatment centers only) — [MarketResearch.com blog](https://blog.marketresearch.com/the-4.4-billion-u.s.-autism-treatment-centers-market). Note the 6-8x spread between estimates; definitions differ (centers vs all ABA services including home-based).
- CDC autism prevalence 1 in 31 (8-year-olds, ADDM 2022 surveillance year, published 2025): figure supplied in the assignment brief; NOT re-fetched in this session — verify at [CDC autism data](https://www.cdc.gov/autism/data-research/index.html) before pitching.

### Inferences
- A clean TAM framing for a pitch: (a) dementia: 13M unpaid caregivers; (b) autism: at roughly 1 in 31 children, a few million US autistic children and their parents; (c) adjacent "cannot say what they need" populations (IDD, stroke/aphasia) widen it. A bottoms-up SAM using GUIDE PBPM rates or ABA software seats is more credible to VCs than top-down "caregiver tech market" reports.
- Caregiver out-of-pocket spend ($7,200/yr) shows money is spent, but almost all goes to care and supplies, not software; DTC willingness to pay for apps is unproven (see Gaps).

### Gaps
- No credible, sourced "caregiver tech market" size found in this pass; analyst figures (e.g., "AgeTech" or "caregiver app market") were not verified and should not be used without a primary source.
- AARP 2025 share of caregivers caring for someone with dementia, and share caring for an autistic or disabled child, not extracted (in the full report, not the press release).
- AARP data on caregivers' use of technology/apps not extracted.

## Who pays (DTC, ABA providers, schools, Medicaid/HCBS, GUIDE, Medicare CTS codes, MA, employers, agencies, pharma)

### Takeaway
The clearest new payer for dementia caregiver support is CMS GUIDE: a monthly per-beneficiary payment ($65 to $360 PBPM with a caregiver) that explicitly covers caregiver education and support, plus up to $2,500/yr respite, across ~390 participant organizations, running to 2032. For autism, payers fund ABA (commercial + Medicaid) and increasingly parent-mediated/virtual models; home care agencies pay for AI monitoring (Sensi.ai). Employers buy navigation, and Medicaid pays family caregivers directly (Abby Care). A logging/pattern tool sells best as infrastructure to those budget holders (GUIDE programs, ABA providers, home care agencies, Medicaid paid-family-caregiver companies), not as a standalone consumer subscription.

### Cited Findings
**CMS GUIDE (Guiding an Improved Dementia Experience) Model**
- 8-year, nationwide, voluntary model; DCMP payments, respite claims, and performance adjustments run Summer 2024 to Summer 2032 — [CMS GUIDE participant incentives fact sheet](https://www.cms.gov/files/document/guide-participant-model-incentives-factsheet.pdf)
- Dementia Care Management Payment (PBPM), beneficiaries WITH a caregiver: low complexity $150 first 6 months / $65 after; moderate $275 / $120; high $360 / $220. WITHOUT caregiver: low $230 / $120; moderate-to-high $390 / $215 — [CMS fact sheet](https://www.cms.gov/files/document/guide-participant-model-incentives-factsheet.pdf)
- Respite payment up to $2,500 per year per qualified beneficiary; DCMP covers "caregiver education and support services"; one-time $75,000 infrastructure payment for safety-net new-track participants; higher DCMP for low-income beneficiaries from 2025 — [CMS fact sheet](https://www.cms.gov/files/document/guide-participant-model-incentives-factsheet.pdf)
- Launched July 1 2024 with 390 organizations building programs: academic medical centers, small practices, community-based orgs, health systems, hospices, virtual providers (e.g., CareAtHome Medical Group partnering with Vesta Healthcare in 11 states) — [Healthcare Innovation, Jul 9 2024](https://www.hcinnovationgroup.com/policy-value-based-care/alternative-payment-models/news/55094332/details-emerge-about-participants-in-dementia-alternative-payment-model)
- Updated CMS MLN booklet (2026-07 revision) exists — [CMS MLN7172818](https://www.cms.gov/sites/default/files/2026-07/mln7172818-guiding-improved-dementia-experience-model.pdf); implementation lessons paper May 2026 — [HCTTF](https://hcttf.org/wp-content/uploads/2026/05/Reimagining-Dementia-Care-Lessons-from-Implementing-the-GUIDE-Model.pdf); formal evaluation by Mathematica — [Mathematica](https://www.mathematica.org/projects/evaluation-of-the-guiding-an-improved-dementia-experience-model)

**Medicare Caregiver Training Services (CTS) codes**
- CY2024 Medicare PFS created 97550 (caregiver training, first 30 min), 97551 (each additional 15 min), 97552 (group caregiver training, 2+ patients represented); code selection based on patients represented, not caregivers; requires consent and inclusion in the plan of care; only Medicare had approved reimbursement as of April 2024; not billable via telehealth at that time — [Provider Magazine, Apr 30 2024](https://providermagazine.com/Articles/Pages/8-Insights-About-the-Future-of-Caregiver-Training-Services.aspx)
- NAC has continued to advocate on CTS in the CY2026 PFS and ran a "CTS in Practice" program in June 2026 — [NAC CY26 PFS comments](https://www.caregiving.org/wp-content/uploads/2026/06/NAC_CY26-Medicare-PFS-Comments.pdf); [NAC webinar deck Jun 2026](https://www.caregiving.org/wp-content/uploads/2026/07/Programs-Webinar_CTS-in-Practice_Master-Slide-Deck_6.24.26_FINAL.pdf)

**ABA payers (autism)**
- All 50 states cover ABA via commercial mandates, Medicaid waivers, or both; commercial rates typically 15-25% above Medicaid; payers adding utilization management — [L.E.K., Jun 2025](https://www.lek.com/insights/healthcare-services/investing-autism-therapy-key-trends-shaping-us-aba-therapy-sector)
- Leading ABA providers invest in integrated EMR, revenue cycle, and analytics for outcomes tracking; top performers use predictive analytics — [L.E.K.](https://www.lek.com/insights/healthcare-services/investing-autism-therapy-key-trends-shaping-us-aba-therapy-sector)
- Parent-mediated virtual ABA (AnswersNow) is paid by commercial insurers and Medicaid in-network across multiple states; ~5 hrs/week vs 30+ in person; claims up to 75% total cost reduction for payers (company claim) — [HIT Consultant, Jan 21 2026](https://hitconsultant.net/2026/01/21/answersnow-secures-40m-to-disrupt-broken-autism-support-systems/)

**Medicaid paying family caregivers**
- Abby Care trains family members to become certified, paid caregivers and operates as a Medicaid provider working with health plans, serving medically complex members — [Fortune, Oct 15 2026](https://fortune.com/2026/10/15/startup-abby-care-raises-82-million-to-turn-family-members-into-paid-caregivers/)

**Home care agencies as payer**
- Sensi.ai sells AI audio "care intelligence" to home care agencies (and expanding into assisted/senior living); says it supports 80%+ of the largest North American home care networks — [Sensi.ai Series C release, Oct 9 2025](https://www.newswire.com/news/sensi-ai-raises-45m-series-c-extending-its-dominance-of-care-22653210)

**Health plans / risk-bearing payers (dementia)**
- Isaac Health sells to health plans and health systems, citing Medicare and Medicaid partners — [Healthcare IT Today, Sep 8 2025](https://www.healthcareittoday.com/2025/09/08/isaac-health-raises-10-5m-to-democratize-access-to-dementia-care-amid-rising-public-health-crisis/)
- Rippl is paid via GUIDE bundled payments and plans value-based contracts with risk-bearing payers — [Fierce Healthcare](https://www.fiercehealthcare.com/digital-health/rippl-announces-23-mil-series-expand-virtual-dementia-care)

**Employers**
- Employer caregiving-benefit vendors: Cariloop ("the caregiving benefit for every employee") — [Cariloop](https://cariloop.com/); Grayce partnered with Cariloop in Nov 2025 (signal of consolidation) — [GlobeNewswire via Mammoth Times, Nov 13 2025](https://business.mammothtimes.com/mammothtimes/article/gnwcq-2025-11-13-grayce-embarks-on-a-new-chapter-partners-with-cariloop-to-support-employers-and-their-working-caregivers); Wellthy acquired Cleo (family care benefit) — [HR Brew](https://www.hr-brew.com/stories/wellthy-acquires-cleo-family-care)

### Inferences
- GUIDE math for a pitch: a GUIDE program with 1,000 caregiver-supported beneficiaries at a blended ~$150 PBPM generates roughly $1.8M/yr of DCMP revenue (illustrative arithmetic from CMS rates, not a sourced figure). A per-member software fee of a few dollars PBPM that improves caregiver support documentation and reduces crises is an easy ROI story.
- GUIDE participants must deliver caregiver education/support and track caregiver burden; structured caregiver logs are a natural fit. Partnering with virtual GUIDE operators (Rippl, Isaac Health, CareAtHome/Vesta) is a faster channel than 390 separate sales.
- For autism, the payer budget sits with ABA providers and insurers; parent-collected home data is valuable to parent-mediated/virtual ABA models (AnswersNow, etc.) which depend on caregiver execution between sessions.
- Employer channel is crowded and consolidating (Grayce to Cariloop, Wellthy buying Cleo); a logging tool would more likely be a partner/integration than a competing benefit.
- Consolidation signals in employer caregiving suggest standalone benefit vendors struggled to scale independently.

### Gaps
- Medicare CTS payment rates (97550-97552) for 2025/2026, and whether telehealth/remote delivery was allowed in later rules, were not verified.
- ABA practice-management/data-collection software pricing (CentralReach, Catalyst/DataFinch, Motivity, Rethink) and whether they ingest parent-entered data: not researched in this pass.
- School IEP data payers, Medicare Advantage supplemental caregiver benefits, Medicaid HCBS caregiver-support line items, and pharma/research data partnerships: not researched.
- Direct-to-consumer willingness-to-pay data for caregiver apps: no source found.
- Current GUIDE participant count after 2025-2026 cohort changes not confirmed (390 is the July 2024 figure).

## Funded competitors and recent rounds (2023 to 2026)

### Takeaway
Capital is flowing to caregiving businesses that are attached to a reimbursement stream: Medicaid paid-family-caregiving (Abby Care $82M Series C, Oct 2026), agency-paid AI monitoring (Sensi.ai, $98M+ total), GUIDE/value-based dementia care (Rippl $23M A, Isaac Health $16.3M total), and payer-reimbursed autism therapy (AnswersNow $40M B, Hi Rasmus $50M, Frontera $32M seed). No funded player found that does voice-first, cross-caregiver behavior pattern analytics spanning both autism and dementia.

### Cited Findings
| Company | Segment | Round / amount | Date | Investors | Who pays | Source |
|---|---|---|---|---|---|---|
| Abby Care | Medicaid paid family caregivers, AI-native home care | $82M Series C | Oct 2026 | Lead Transformation Capital; CVS Health Ventures, Frist Cressey, Pivotal Ventures; existing Khosla, Thrive, Sequoia | Medicaid / health plans | [Fortune, Oct 15 2026](https://fortune.com/2026/10/15/startup-abby-care-raises-82-million-to-turn-family-members-into-paid-caregivers/); [HIT Consultant Oct 19 2026](https://hitconsultant.net/2026/10/19/abby-care-paid-family-caregiving/) |
| Sensi.ai | AI audio monitoring for home care / senior living | $45M Series C (total $98M+); prior $31M Series B (Jun 2024, Insight, Zeev); $14M Series A | C: Oct 9 2025 | Lead Qumra; Zeev, Insight, Entree, Flint, Jibe | Home care agencies (inferred); also families/enterprises | [Newswire, Oct 2025](https://www.newswire.com/news/sensi-ai-raises-45m-series-c-extending-its-dominance-of-care-22653210); [TechCrunch, Jun 26 2024](https://techcrunch.com/2024/06/26/sensi-ai-grabs-31m-series-b-from-insight-zeev-to-monitor-seniors-24-7) |
| AnswersNow | Virtual, parent-mediated ABA with AI | $40M Series B | Jan 21 2026 | Lead HealthQuest; Left Lane, Owl Ventures | Commercial + Medicaid | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/01/21/3222658/0/en/AnswersNow-Completes-40M-Series-B-to-Expand-BCBA-Driven-AI-Enabled-Autism-Therapy.html); [HIT Consultant](https://hitconsultant.net/2026/01/21/answersnow-secures-40m-to-disrupt-broken-autism-support-systems/) |
| Hi Rasmus | Autism care platform | $50M from Updata Partners | date not verified | Updata | not verified | [Hi Rasmus](https://hirasmus.com/?p=9820); [Signalbase](https://www.trysignalbase.com/news/funding/hi-rasmus-raises-50m-to-expand-autism-care-platform) |
| Frontera Health | Autism care, health equity | $32M seed | date not verified | not verified | not verified | [Pulse 2.0](https://pulse2.com/frontera-health-32-million-seed-funding-raised-for-advancing-autism-care-and-health-equity) |
| Rippl | Virtual dementia care, GUIDE participant | $23M Series A | ~Oct 2024 | Lead Kin Ventures; JSL Health; returning Arch, General Catalyst, GV, F-Prime, MGB Ventures, 1843 Capital | CMS GUIDE bundled payment; risk-bearing payers | [Fierce Healthcare](https://www.fiercehealthcare.com/digital-health/rippl-announces-23-mil-series-expand-virtual-dementia-care); [HIT Consultant Oct 2 2024](https://hitconsultant.net/2024/10/02/rippl-secures-23m-to-expand-its-virtual-dementia-care-platform/) |
| Isaac Health | Virtual brain health / dementia care | $10.5M Series A (total $16.3M); earlier $5.7M seed | Aug/Sep 2025 | Lead Flare Capital; Industry Ventures, Black Opal; existing Meridian Street, B Capital, Primetime | Health plans, health systems, Medicare/Medicaid partners | [Healthcare IT Today, Sep 8 2025](https://www.healthcareittoday.com/2025/09/08/isaac-health-raises-10-5m-to-democratize-access-to-dementia-care-amid-rising-public-health-crisis/); [Fierce (seed)](https://www.fiercehealthcare.com/digital-health/isaac-health-nabs-57m-seed-round-scale-virtual-brain-health-and-dementia-care) |
| Hera | AI senior care coordination | $27M | Jun 2026 | not verified | not verified | [HLTH, Jun 29 2026](https://hlth.com/insights/news/hera-raises-27m-to-expand-ai-powered-senior-care-coordination-platform) |
| Carallel | Caregiver support (plans/employers) | $8.2M Series A | date not verified | not verified | not verified | [Signalbase](https://www.trysignalbase.com/news/funding/empowering-caregivers-carallel-secures-8.2m-in-series-a-funding-for-innovating-caregiving-solutions) |
| Homethrive | Tech-enabled caregiver support (employer benefit) | $20M | date not verified (older) | not verified | Employers | [MobiHealthNews](https://www.mobihealthnews.com/news/homethrive-raises-20m-tech-enabled-caregiver-platform?utm_id=75) |
| Cariloop | Employer caregiving benefit | $20M | Apr 2024 | not verified | Employers | [Axios Pro, Apr 9 2024](https://www.axios.com/pro/health-tech-deals/2024/04/09/cariloop-corrals-20m-to-expand-caregiver-solutions) |
| Wellthy | Employer caregiving benefit | $25.5M (older round, pre-2023) | older | not verified | Employers | [ImpactAlpha](https://impactalpha.com/wellthy-secures-25-5-million-to-provide-caregiving-support-as-an-employee-benefit/) |
| Clara Home Care | Senior caregiver access | $3.1M seed | date not verified | not verified | not verified | [Pulse 2.0](https://pulse2.com/clara-home-care-3-1-million-seed-funding-round-raised-to-make-senior-caregivers-more-accessible) |
| Understanding Zoe (AU) | AI support for parents of neurodivergent children | A$770K-scale seed (AU, non-US) | not verified | not verified | not verified | [SmartCompany](https://www.smartcompany.com.au/exclusive/understanding-zoe-770000-startup-funding-neurodivergent-children-support-ai/) |

- Sensi.ai bundles care coaching with dementia expert Teepa Snow and uses Care/Growth/Ops AI agents — [Newswire](https://www.newswire.com/news/sensi-ai-raises-45m-series-c-extending-its-dominance-of-care-22653210)
- AnswersNow company-reported: ~100,000 hours of virtual ABA and caregiver training in 2025; NPS 83 (n=170); 96% of families see meaningful improvement within 6 months; outcome research planned early 2026 — [HIT Consultant](https://hitconsultant.net/2026/01/21/answersnow-secures-40m-to-disrupt-broken-autism-support-systems/)
- Rippl operates in WA, TX, IL, MO with plans for FL, CA, AZ; partnered with Alzheimer's Association Dementia Care Navigation Service; acquired Kinto — [Fierce Healthcare](https://www.fiercehealthcare.com/digital-health/rippl-announces-23-mil-series-expand-virtual-dementia-care)

### Inferences
- Pattern for VCs: winners own a reimbursement line (Medicaid, GUIDE, ABA claims) or sell to a budget holder (agencies). CareSignal's pitch should name its payer path explicitly (e.g., "data layer for GUIDE programs and parent-mediated ABA").
- Sensi.ai is the closest analog in "AI turns ambient signals into care events" but is passive audio, agency-paid, and seniors-only; CareSignal's differentiation is caregiver-initiated voice notes, cross-family pattern ranking, and spanning autism plus dementia.
- Arizona is on Rippl's expansion list, relevant if the founder is Phoenix-based (local GUIDE partner opportunity).
- Mega-investors (Sequoia, Khosla, Thrive, CVS Health Ventures, GV, General Catalyst) are already active in caregiving, so the category is fundable; the bar is a credible payer and data moat story.

### Gaps
- Not verified this pass: Cortica, Brightline, Birdhouse, Nello, Guiding Growth, Motivity, Rethink First, CentralReach (PE ownership/valuation), Ianacare, Tomorrow Health, Inspiren, CarePredict, Cera, Honor, Papa, Tembo Health funding details and dates.
- Dates/investors for Hi Rasmus, Frontera, Hera, Carallel, Homethrive, Clara not confirmed from primary pages.

## Moats and failure cases

### Takeaway
Defensibility in this space comes from (1) attachment to reimbursement and provider workflows, (2) proprietary longitudinal outcome data, and (3) clinical/outcomes evidence demanded by payers; pure consumer caregiver apps have historically been absorbed or sold for parts (CareZone's assets to Walmart, 2020).

### Cited Findings
- CareZone (consumer caregiver/medication organizer app) sold select assets and personnel to Walmart in June 2020 rather than scaling independently; Walmart wanted its medication-management technology — [CNBC, Jun 15 2020](https://www.cnbc.com/2020/06/15/walmart-buys-tech-from-carezone-to-help-people-manage-prescriptions.html); [Healthcare Dive](https://healthcaredive.com/news/walmart-buys-medication-management-tech-from-startup-carezone/579875) (older data, 2020)
- In ABA, payers are tightening utilization management; strong platforms diversify payer mix and manage authorizations; top performers use integrated tech stacks and predictive analytics, weaker ones rely on manual systems — [L.E.K., Jun 2025](https://www.lek.com/insights/healthcare-services/investing-autism-therapy-key-trends-shaping-us-aba-therapy-sector)
- Payer-facing autism companies are racing to publish outcomes (AnswersNow planning clinical outcome research in early 2026), indicating evidence is becoming table stakes — [HIT Consultant](https://hitconsultant.net/2026/01/21/answersnow-secures-40m-to-disrupt-broken-autism-support-systems/)
- Distribution moat via scale with agencies: Sensi.ai claims 80%+ of the largest North American home care networks — [Newswire](https://www.newswire.com/news/sensi-ai-raises-45m-series-c-extending-its-dominance-of-care-22653210)
- Partnerships with trusted brands as distribution/credibility: Rippl with Alzheimer's Association; Sensi.ai with Teepa Snow — [Fierce](https://www.fiercehealthcare.com/digital-health/rippl-announces-23-mil-series-expand-virtual-dementia-care); [Newswire](https://www.newswire.com/news/sensi-ai-raises-45m-series-c-extending-its-dominance-of-care-22653210)
- Consolidation in employer caregiving (Grayce partnering into Cariloop, Nov 2025; Wellthy acquiring Cleo) — [Mammoth Times/GlobeNewswire](https://business.mammothtimes.com/mammothtimes/article/gnwcq-2025-11-13-grayce-embarks-on-a-new-chapter-partners-with-cariloop-to-support-employers-and-their-working-caregivers); [HR Brew](https://www.hr-brew.com/stories/wellthy-acquires-cleo-family-care)

### Inferences
- Data network effect is CareSignal's most plausible moat: each family's structured logs improve trigger detection and "what worked" ranking for all families (with the 5-family minimum threshold). VCs will probe cold start and data quality; the answer should be "land via a provider/GUIDE program that brings hundreds of families at once."
- CareZone lesson: consumer engagement without a payer leads to asset sale. Avoid pitching DTC subscription as the primary model; pitch B2B2C (GUIDE programs, ABA providers, agencies, Medicaid caregiver companies) with free caregiver app.
- Evidence moat: even observational, pre-registered outcome reporting ("Based on family logs, not a clinical trial") positions CareSignal for later payer validation studies; the guardrails (no diagnosis, crisis routing) are also a regulatory moat argument (staying outside FDA SaMD scope).
- Integration moat: exporting structured caregiver data into ABA data systems or GUIDE care plans makes the tool sticky inside provider workflows.

### Gaps
- No documented shutdown post-mortems found this pass for other caregiver apps (e.g., consumer dementia apps); CareZone's terms and reasons beyond the asset sale were not detailed.
- EHR integration as a moat (Epic/ABA EMR APIs) not researched.
- Regulatory (FDA SaMD/clinical decision support) boundary for behavior-pattern analytics not researched here.
