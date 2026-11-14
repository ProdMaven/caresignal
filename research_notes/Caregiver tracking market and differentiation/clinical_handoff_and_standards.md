# Clinical handoff, downstream workflows, and standards for caregiver-observed behavior data (autism and dementia)

Scope note: Research conducted 2026-11-14, US focus. About 27 tool calls. Several primary pages (PMC full text, Rethink/Motivity/Catalyst portal docs) could not be fully fetched; those items are listed under Gaps rather than asserted. Items older than 2024 are marked [older].

## Autism: what professionals ask parents for, whether parent ABC data is trusted, how it is handed off, interoperability, and ABA platform parent portals

### Takeaway
Parent-collected ABC data is already a formal input to functional behavior assessment (FBA) in both clinical ABA and school IEP teams, and recent studies show it is usable but imperfect (about 65-70% agreement with gold-standard methods on behavior function; strong agreement on whether a treatment is working). The handoff today is paper data sheets, interviews, and provider-controlled portals focused on parent training and messaging, not parent-originated structured episode logs, and there is no FHIR/HL7 standard for ABA or behavior-episode data. That gap (structured, multi-caregiver, provider-ready episode data that the family owns) is the defensible opening.

### Cited Findings
**What teams ask for (school IEP / FBA)**
- Wisconsin DPI FBA guidance lists nine FBA components (form team, purpose/consent, define target behavior, relevant questions, gather standard data, gather additional data, synthesize, analyze function and root cause, use results); parents/guardians are "key team members and essential partners," and bring knowledge of learning history that makes strategies contextually and culturally relevant — [Wisconsin DPI, 4 Components of an FBA](https://dpi.wi.gov/sites/default/files/imce/sped/pdf/4-Components_of_an_FBA.pdf)
- FBA data methods named by the same guidance: ABC (antecedent-behavior-consequence) data collection, structured interviews of student, parents/caregivers and educators, rating scales (flagged as subject to rater bias), direct observation, progress monitoring, record review — [Wisconsin DPI](https://dpi.wi.gov/sites/default/files/imce/sped/pdf/4-Components_of_an_FBA.pdf)
- Parental notification and consent are required before an FBA when part of an initial evaluation/reevaluation, manifestation determination, or (Wisconsin rule) when a student with an IEP is secluded or restrained twice in a school year — [Wisconsin DPI](https://dpi.wi.gov/sites/default/files/imce/sped/pdf/4-Components_of_an_FBA.pdf) (state-specific; federal IDEA citation not confirmed from this source)
- Parent-facing explainers of FBA/BIP for IEP families exist from PACER and Texas TEA — [PACER](https://www.pacer.org/parent/php/php-c215a.pdf); [Texas TEA SPED Support](https://spedsupport.tea.texas.gov/resource-library/functional-behavior-assessment-fba)

**Is parent ABC data trusted / used (clinical ABA)**
- Call et al. (2023/2024), *Journal of Applied Behavior Analysis* 57(1):166-183, comparative effectiveness trial of FBA methods: an "Indirect+ABC" assessment combining a caregiver interview with caregiver-collected ABC data identified a function also identified by structured descriptive assessment in 70.2% of participants (40/57) and by functional analysis in 65.4% (17/26) — [PMC10843530](https://pmc.ncbi.nlm.nih.gov/articles/PMC10843530/)
- Same study: amount of caregiver ABC data varied, and some caregivers did not collect data every day (adherence problem with paper sheets); caregiver training was a didactic session plus a review session to check episodes against operational definitions — [PMC10843530](https://pmc.ncbi.nlm.nih.gov/articles/PMC10843530/)
- Same study context: even professional methods disagree (SDA vs FA exact agreement 38.5%, total agreement 67.9%), so caregiver-data agreement of about 65-70% is in the same range as professional descriptive methods — [PMC10843530](https://pmc.ncbi.nlm.nih.gov/articles/PMC10843530/)
- Pichardo et al. (2026), *Behavioral Interventions*, doi:10.1002/bin.70067 (replication of Becraft et al.): 8 caregivers of children with pediatric feeding disorder recorded home data on simple sheets; caregiver and trained-observer data were significantly correlated for 7 of 8 caregivers; caregivers agreed with observers on presence of a treatment effect in 14/16 phase contrasts (inappropriate behavior) and 16/16 (appropriate behavior); authors call data preliminary — [Behaviorist Book Club summary](https://behavioristbookclub.com/aba-research/assessment-research/accuracy-of-caregiver-report-for-evaluating-treatment-effects-for-pedi/) (secondary summary of the article)

**How it is handed off / ABA platform parent portals**
- CentralReach CR CareCompanion (caregiver mobile app): short research-based ABA lessons before BCBA sessions, therapist-shared content, journaling and staff-caregiver communications with real-time notifications; the product page does not describe parent ABC or behavior data entry; its "integrated data collection" tracks caregiver usage/progress in training — [CentralReach CR CareCompanion](https://centralreach.com/products/care-companion/); [App Store listing](https://apps.apple.com/us/app/-/id6478708450)
- CentralReach claims practices on average deliver "less than 30% of the hours authorized for family guidance" (vendor industry claim, used to sell parent-training software) — [CentralReach CR CareCompanion](https://centralreach.com/products/care-companion/)
- CentralReach launched CR Care Coordinator, a "patented parent training software product" (April 2023) [older] — [CentralReach press release](https://centralreach.com/centralreach-announces-the-launch-of-cr-care-coordinator-its-patented-parent-training-software-product-that-enables-therapy-providers-to-deliver-parent-training-at-scale-empowering-families-and-ma/); later folded into an "AI powered" CR Care360 suite with a new caregiver app — [CentralReach Care360 announcement](https://centralreach.com/blog/centralreach-announces-cr-care360-ai-powered-care-management-platform-and-introduces-new-caregiver-app-as-latest-innovation-in-cr-care360-suite/); [CR Care360](https://centralreach.com/solutions/care360/)
- CentralReach also has an older client portal (2020 tips PDF) [older] — [CentralReach Client Portal tips](https://centralreach.com/wp-content//uploads/2020/04/7-tips-for-Using-the-Client-Portal-2020.pdf)
- Motivity markets an ABA data collection app and feature set aimed at provider staff — [Motivity features](https://www.motivity.net/features); [Motivity ABA data collection](https://www.motivity.net/features/aba-data-collection); [App Store](https://apps.apple.com/app/id1627697640)

**Interoperability standards**
- HL7 US Behavioral Health Profiles IG is at continuous-build v0.1.0 (ASTP/BHIT, FHIR R4), a crosswalk of USCDI+ behavioral health data elements mostly onto US Core profiles (Observation Screening Assessment, QuestionnaireResponse, CareTeam, RelatedPerson, etc.); it does not mention ABA, autism, dementia, or behavior-episode observations, and RelatedPerson appears only as a demographic element, not as an author of observations — [HL7 US Behavioral Health Profiles IG](https://build.fhir.org/ig/HL7/us-behavioral-health-profiles/bh_to_fhir_profiles.html)
- Colorado BHA has its own state behavioral health FHIR IG (example of state-level BH FHIR work, not ABA-specific) — [Colorado BHA FHIR IG](https://build.fhir.org/ig/RatioPBC/bha-ig)

### Inferences
- Parent ABC data is already accepted as one input to FBA; the barrier is collection adherence and format (paper, daily discipline, operational definitions), which is exactly what voice capture plus structuring attacks. A product claim like "turns your spoken notes into ABC-structured records your BCBA or IEP team can use" is grounded in existing practice.
- Major ABA platforms point their caregiver apps at parent training, content and messaging, which is provider-owned and billing-adjacent. A family-owned, provider-agnostic log that moves with the child across BCBA, OT, pediatrician, and school is a different position, not a head-on competitor, and could become an export target into those systems.
- The absence of any FHIR profile for behavior episodes means CareSignal could define an export format (for example FHIR Observation plus QuestionnaireResponse with RelatedPerson as performer) without fighting an incumbent standard, but also cannot rely on plug-in EHR ingestion.

### Gaps
- Could not verify whether Rethink, Catalyst (DataFinch) or Motivity offer parent-side behavior data entry, or any parent usage/adoption rates of any ABA portal. Vendor pages found were provider-facing.
- No source found stating exactly what developmental pediatricians or OTs request from parents (intake questionnaires vary); AAP guidance not retrieved.
- Federal IDEA regulation text on FBA (34 CFR 300.530(d)-(f)) not fetched; only state guidance cited.
- No published study found on parent ABC data collected via app or voice versus paper.

## Dementia: what geriatricians, neurologists, and GUIDE care navigators need from caregivers; instruments; aide-to-family handoff; data standards

### Takeaway
The CMS GUIDE model (launched July 1, 2024, 8 years, all states) pays monthly for dementia care teams that must assess caregiver needs, run a care plan, and give 24/7 caregiver support, but CMS documents do not mandate specific behavior instruments, and home-aide observations flow to families and clinicians through unstructured calls, texts and agency logs. Validated DICE-based caregiver apps (WeCareAdvisor RCT, JAGS, August 2026) prove the clinical value of structured describe-investigate-create-evaluate workflows, yet usage was about once a month, which leaves room for a lower-friction, multi-caregiver capture layer.

### Cited Findings
**GUIDE model requirements**
- GUIDE is an 8-year voluntary CMS Innovation Center model in all states, territories and DC; care teams must include a trained care navigator and a clinician with dementia proficiency; comprehensive assessment results feed a person-centered care plan; programs assess and address caregiver needs, include the caregiver on the team, and provide ongoing monitoring; caregivers get a 24/7 support line; respite is paid for a subset of patients — [CMS GUIDE Model overview fact sheet](https://www.cms.gov/files/document/guide-model-overview-fs.pdf)
- Payment: monthly per-beneficiary payment for collaborative care, caregiver education and support; tiers by dementia stage and caregiver strain (low complexity; moderate complexity with low-moderate caregiver strain; high complexity with high caregiver strain); one-time infrastructure payment for safety-net New Program track — [CMS GUIDE fact sheet](https://www.cms.gov/files/document/guide-model-overview-fs.pdf)
- Eligibility: community-dwelling Medicare FFS (Parts A and B, dual eligibles included), not Medicare Advantage, hospice, PACE or long-term nursing home — [CMS GUIDE fact sheet](https://www.cms.gov/files/document/guide-model-overview-fs.pdf)
- The CMS fact sheet names no specific assessment instruments — [CMS GUIDE fact sheet](https://www.cms.gov/files/document/guide-model-overview-fs.pdf)
- GUIDE launched July 1, 2024; UCLA Alzheimer's and Dementia Care program (the model's template) began GUIDE care July 2024 with a pre-visit questionnaire, comprehensive assessment by a Dementia Care Specialist, a home visit for moderate/high complexity patients that assesses "environmental, social and behavioral factors," and as-needed follow-ups — [UCLA Health GUIDE page](https://www.uclahealth.org/medical-services/geriatrics/dementia/about-us/cms-guide-model)
- Care navigator training curricula exist (CAPC GUIDE care navigator learning pathway) — [CAPC](https://capc.org/training/learning-pathways/guide-model-care-navigator-training/pdf)

**DICE and caregiver apps**
- WeCareAdvisor (UC Davis Health and Drexel): first randomized trial of an app giving caregivers a systematic non-drug approach to dementia behavioral symptoms, published in *Journal of the American Geriatrics Society* (news dated August 25, 2026); immediate vs delayed-use design with interviews at baseline, 1 and 3 months; at 3 months immediate users had modestly but significantly lower caregiver distress, fewer reported behavioral symptoms, less caregiver upset, better well-being; effects small to moderate; caregivers used the app about once a month on average — [UC Davis Health](https://health.ucdavis.edu/medical-school-research/news/headlines/app-helps-caregivers-manage-dementia-related-behavioral-symptoms-improves-well-being/2026/08)
- DICE = Describe, Investigate, Create, Evaluate: caregivers answer guided questions to describe behaviors, investigate possible causes, create individualized non-drug strategies, and evaluate how well they worked; WeCareAdvisor adds daily text tips and education — [UC Davis Health](https://health.ucdavis.edu/medical-school-research/news/headlines/app-helps-caregivers-manage-dementia-related-behavioral-symptoms-improves-well-being/2026/08)
- Dissemination study of DICE exists (Drexel) — [Drexel Research Discovery](https://researchdiscovery.drexel.edu/esploro/outputs/journalArticle/Disseminating-the-Use-of-the-DICE/991019170391004721)

**Home aide observations to families and clinicians**
- Fabius et al. (2023), *Geriatric Nursing* 54:171-177 [older but recent]: direct care workers notice changes in function and behavior and report them to nurses/agency staff and directly to families via phone, email, verbal updates and agency care logs; agency apps mainly document completed tasks, shift activity and urgent changes; contact with clinicians is limited (aides transport to appointments, some prepare folders) — [PMC10833061](https://pmc.ncbi.nlm.nih.gov/articles/PMC10833061)
- Same study: information sharing among aides, families and clinical teams is "largely unstructured and disorganized"; aides are often left out of assessment and care planning; patient portals are designed for individuals rather than care teams; Maryland law restricts aides from sharing medical information with families and other providers; no difference in communication workflow for clients with vs without dementia; families of people with dementia are anxious and want detailed updates; n=11, one state — [PMC10833061](https://pmc.ncbi.nlm.nih.gov/articles/PMC10833061)
- Aide training materials define what aides should observe and report (state nurse-aide curriculum; agency survey-prep sheets on reporting changes) — [NC DHHS Nurse Aide "What You Should Report"](https://info.ncdhhs.gov/dhsr/hcpr/curriculum/pdf/119_Module%2022%20Handout%203%20_Nurse%20Aide%20What%20You%20Should%20Report_FINAL.pdf); [VNS Health HHA tip sheet, Feb 2024](https://hha.vnshealth.org/wp-content/uploads/2024/02/PersonalCare_SurveyPrepTipSheet_ReportChanges_HHA_2.8.24.pdf)

**Data standards**
- PAINAD (Pain Assessment in Advanced Dementia) has a LOINC panel code 103780-3 (PANEL.H&P, point-in-time) — [HealthAssure code page](https://www.healthassure.in/codes/loinc-103780-3-pain-assessment-in-advanced-dementia-painad) (secondary code lookup; verify on loinc.org)
- Checklist of Nonverbal Pain Indicators panel has LOINC 99287-5 — [FindACode](https://www.findacode.com/loinc/99287-5--checklist-of-nonverbal-pain-indicators-panel-cnpi.html)
- CMS MDS 3.0 cognitive patterns panel (LOINC 96903-0) encodes BIMS, staff mental status assessment and CAM delirium items for nursing homes, showing LOINC coverage of CMS dementia-related assessment items in institutional settings — [LOINC 96903-0](https://loinc.org/96903-0)
- Neuro-QoL behavioral dyscontrol item bank is in LOINC (67896-1) — [LOINC 67896-1](https://cdn.loinc.org/67896-1)
- CMS eCQM CMS149 "Dementia: Cognitive Assessment" exists as a FHIR (QI-Core) measure, i.e., cognitive assessment documentation is a federal quality measure — [eCQM QICore CMS149FHIR](https://build.fhir.org/ig/cqframework/ecqm-content-qicore-2025/Measure-CMS149FHIRDementiaCognitiveAssessment.html)

### Inferences
- GUIDE creates a paying, accountable buyer (care navigator teams) whose job is to monitor behavioral symptoms and caregiver strain between visits and run 24/7 support, but CMS leaves the tooling open. Structured between-visit episode logs from family and aides map directly onto that job (tier assignment depends on caregiver strain; care plans need behavioral context).
- DICE is the clinical vocabulary for non-drug behavioral management; CareSignal's episode model (what happened, what was tried, what helped) is effectively DICE's Describe and Evaluate steps captured in real time. Positioning as "DICE-ready data capture" is evidence-aligned.
- WeCareAdvisor's monthly usage suggests guided-questionnaire apps are used episodically; voice capture at the moment of the episode might raise frequency, but this is unproven.
- The aide-to-family-to-clinician chain is unstructured and portals are single-user; a multi-caregiver shared log is a real gap, though state rules on aide information sharing (e.g., Maryland) need design attention (family as data owner who invites aides).

### Gaps
- Could not confirm LOINC codes for NPI or NPI-Q items or for Cohen-Mansfield Agitation Inventory; searches returned no loinc.org hits. Treat as unverified (may exist or may be licensed-instrument restricted).
- No source retrieved on which instruments GUIDE programs actually use in practice (NPI-Q, Zarit) or on GUIDE enrollment counts as of November 2026.
- WeCareAdvisor sample size not stated in the news release, and whether the app stores behavior/outcome logs not stated.
- No source found on what neurologists specifically request from caregivers beyond general NPI/NPI-Q use.

## Evidence on episode sequences vs flat logs (FBA, scatterplots, sequence analysis, multi-step tools)

### Takeaway
Behavior analysis has a long tradition of analyzing the order of events (antecedent, behavior, consequence; response-stimulus sequences; precursor behaviors), which supports capturing episodes as sequences with per-attempt outcomes rather than flat counts. I found no consumer or clinical tool that captures multi-step caregiver attempts and outcomes per episode as structured data.

### Cited Findings
- ABC recording is itself a three-part sequence format used in FBA to understand why behavior occurs — [Wisconsin DPI](https://dpi.wi.gov/sites/default/files/imce/sped/pdf/4-Components_of_an_FBA.pdf)
- JABA literature analyzes "response-stimulus sequences in descriptive observations" (Samaha et al., JABA 2009, 42:447) [older] — [USU Digital Commons record](https://digitalcommons.usu.edu/sped_facpub/353); [DOI record](https://zendy.io/title/10.1901/jaba.2009.42-447)
- Research on "descriptive and experimental analyses of potential precursors to problem behavior" examines behaviors that reliably precede problem behavior (sequence-based) [older] — [MDSOAR record](https://mdsoar.org/handle/11603/18061); Fritz et al. 2017 precursor work — [Fritz et al. 2017 JABA PDF](https://ceuey.com/wp-content/uploads/2013/09/Fritz_et_al-2017-Journal_of_Applied_Behavior_Analysis.pdf)
- Descriptive analysis of multiple response topographies (behavior chains/escalation) is an active research topic — [Behaviorist Book Club summary](https://behavioristbookclub.com/aba-research/assessment-research/descriptive-analysis-of-multiple-response-topographies-of-challenging/)
- DICE's "Evaluate" step explicitly asks caregivers to judge whether each created strategy worked, i.e., per-strategy outcome tracking — [UC Davis Health](https://health.ucdavis.edu/medical-school-research/news/headlines/app-helps-caregivers-manage-dementia-related-behavioral-symptoms-improves-well-being/2026/08)

### Inferences
- Structuring each episode as an ordered list of attempts with outcomes generates data compatible with ABC and precursor analyses that clinicians already understand, and supports "what worked" ranking that a flat diary cannot.
- Combining sequences across several caregivers resembles multi-observer descriptive assessment, which may improve coverage of settings (home, school, respite) but also introduces inter-observer variability that should be shown, not hidden.

### Gaps
- Full text of Samaha et al. 2009 and related sequence-analysis papers could not be fetched (PMC captcha), so specific quantitative conclusions (for example, whether transitional probabilities outperform simple conditional probabilities) are not reported here.
- Scatterplot (time-of-day) assessment literature not retrieved.
- No tool found (consumer or clinical) that captures multi-step per-attempt outcomes; absence of evidence, not proof of absence.

## Voice and multilingual logging: reach and adherence for low-literacy and non-English-speaking families

### Takeaway
Disparities for Spanish-speaking autism families (later diagnosis, less access to culturally adapted family-centered services) are well documented, and a voice-enabled caregiver medical diary (SpeakHealth) has published feasibility work, but I found no rigorous trial showing voice or multilingual logging improves adherence. This is a plausible but unproven advantage.

### Cited Findings
- Latinx children with autism tend to be diagnosed at later ages, have limited access to family-centered and culturally relevant intervention, and make less progress than mainstream peers; more adaptation is needed for primarily Spanish-speaking, limited-resource parents; UNC pilot of a Spanish parent-coaching intervention (3 families, children 2-4) found feasibility and acceptability, 2 of 3 children improved — [UNC CIDD research summary](https://cidd.unc.edu/Research/research-summaries/summaries/Helping_Latinx_Children_Who_Have_Autism.aspx)
- Cultural and linguistic adaptation of an autism parent-mediated intervention for Spanish-speaking Latinos has been published (J Autism Dev Disord, 2024) — [Springer s10803-024-06322-5](https://link.springer.com/article/10.1007/s10803-024-06322-5)
- Literature reviews document barriers Latino parents face accessing autism services — [NASET review](https://www.naset.com/?p=3194); Autism Speaks family-centered Latino support program — [Autism Speaks](https://autismspeaks.org/blog/bringing-family-centered-support-latino-community)
- "Feasibility of a Voice-Enabled Medical Diary App (SpeakHealth) for Caregivers of Children With Special Health Care Needs and Health Care Providers: Mixed Methods Study," JMIR Formative Research, May 2021 [older] — [PMC8150418](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8150418/); [DOAJ record](https://doaj.org/article/60924bc5d05349ca85584d549f0331c0)
- A 2026 JMIR Research Protocols paper in this space appeared in search results (e83276) but was not fetched — [JMIR Res Protoc 2026 e83276](https://www.researchprotocols.org/2026/1/e83276)

### Inferences
- The disparities literature supports a reach argument for multilingual voice input, especially Spanish, but the claim should be framed as addressing a documented access barrier, not as proven adherence improvement.
- The Call et al. finding that caregivers skipped days of paper ABC data is an adherence problem that a lower-effort input method targets; whether voice fixes it is an open, testable question (a good pilot metric).

### Gaps
- SpeakHealth findings (usability scores, caregiver preference for voice, provider views) could not be fetched; only the title and venue are confirmed.
- No US data found on voice-logging adherence in immigrant or low-literacy dementia caregivers.
- No quantitative disparity stats (for example, mean age of diagnosis by ethnicity, CDC ADDM) retrieved in this pass.

## Regulatory lines: FDA device status, HIPAA, COPPA, FTC Health Breach Notification Rule

### Takeaway
A caregiver-facing app that logs and summarizes observations and suggests "things to check" sits outside FDA's HCP-focused CDS guidance (revised January 6, 2026), and FDA has signaled consumer-facing decision support policy is still pending; HIPAA generally does not apply to a direct-to-consumer app unless it acts for a covered entity, but the FTC Health Breach Notification Rule (amended, effective July 29, 2024) almost certainly does; COPPA's amended rule (compliance April 22, 2026) applies mainly if the service is directed to children or knowingly collects from them, which a parent-facing app may avoid but which needs care when child data is involved.

### Cited Findings
**FDA**
- FDA issued revised CDS guidance on January 6, 2026, superseding the 2022 CDS guidance, without a comment period; software must meet all four Non-Device CDS criteria: (1) not analyze a medical image, IVD signal, or pattern/signal from a signal acquisition system; (2) display/analyze/print medical information; (3) support or provide recommendations to a healthcare professional; (4) enable the HCP to independently review the basis — [Covington, Jan 2026](https://www.cov.com/en/news-and-insights/insights/2026/01/5-key-takeaways-from-fdas-revised-clinical-decision-support-cds-software-guidance)
- 2026 changes: enforcement discretion for single-recommendation outputs where only one is clinically appropriate; time-critical decision limitation moved to Criterion 4; emphasis on avoiding information overload and grounding in "well-understood and accepted sources" — [Covington](https://www.cov.com/en/news-and-insights/insights/2026/01/5-key-takeaways-from-fdas-revised-clinical-decision-support-cds-software-guidance)
- The guidance "continues to focus exclusively on HCP-facing CDS" and adds no new policy for patient/caregiver-facing tools; FDA plans to revise its Policy for Device Software Functions and Mobile Medical Applications in FY26 — [Covington](https://www.cov.com/en/news-and-insights/insights/2026/01/5-key-takeaways-from-fdas-revised-clinical-decision-support-cds-software-guidance)
- FDA updated its General Wellness guidance the same day (January 2026) — [King & Spalding](https://www.kslaw.com/insights/articles/fda-updates-general-wellness-and-clinical-decision-support-guidance-documents); [Ropes & Gray](https://www.ropesgray.com/en/insights/alerts/2026/01/fda-adapts-with-the-times-on-digital-health-updated-guidances-on-general-wellness-products); [Cooley](https://www.cooley.com/news/insight/2026/2026-01-20-automation-bias-and-clinical-practice-fda-makes-incremental-updates-to-clinical-decision-support-software-guidance)

**HIPAA**
- HHS OCR issued health app developer guidance and scenarios (2016, updated 2019) explaining that HIPAA applies to an app only when it is created, received, maintained or transmitted on behalf of a covered entity or business associate; a consumer-chosen app not provided by a covered entity is generally not a business associate [older] — [Haynes Boone summary](https://www.haynesboone.com/publications/ocr-hipaa-guidance-for-mobile-health-developers); [MobiHealthNews on 2019 additions](https://mobihealthnews.com/content/hhs-adds-more-guidance-health-app-developers-navigating-hipaa); [WSGR 2016](https://www.wsgrdataadvisor.com/2016/06/hhs-issues-hipaa-guidance-for-mobile-health-apps/)

**FTC Health Breach Notification Rule (HBNR)**
- Amended HBNR published May 30, 2024, effective July 29, 2024; targets vendors of personal health records and PHR-related entities not covered by HIPAA — [Federal Register 2024-10855](https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule)
- "Covered health care provider" now includes entities furnishing "health care services or supplies," defined to include apps and websites that track diseases, fitness, sleep, diet and other health items; a PHR is covered if it "has the technical capacity to draw information from multiple sources," even if users never enable that feature — [Federal Register](https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule)
- "Breach of security" explicitly includes unauthorized disclosure (e.g., sharing data inconsistent with the company's promises), not just hacks; individual notice due no later than 60 calendar days after discovery; FTC cited penalties of $1.5 million (GoodRx) and $100,000 (Easy Healthcare) — [Federal Register](https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule)

**COPPA**
- Amended COPPA Rule published April 22, 2025, effective June 23, 2025, operator compliance deadline April 22, 2026 — [Davis Polk](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect); [Federal Register 2025-05904](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- New obligations: separate verifiable parental consent for third-party disclosure (disclosure for advertising, monetary consideration, or AI training is not "integral"); written data retention policy with deletion timeframe, indefinite retention prohibited; written information security program with annual risk assessment; biometric identifiers added to personal information — [Davis Polk](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect)
- COPPA applies to operators of services directed to children under 13 or with actual knowledge they collect personal information from children — [Davis Polk](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect)

### Inferences
- Staying non-device: keep outputs caregiver-facing, descriptive ("possible things to check"), avoid diagnosis, avoid analyzing physiologic signals, and avoid time-critical treatment directives (except "call 911 / contact your doctor" escalation). A future clinician-facing view would fall under the 2026 CDS criteria; showing the basis (the underlying logs and statistics) is what Criterion 4 asks for, which aligns with CareSignal's "statistics find patterns, Claude explains" rule.
- HBNR is the realistic baseline obligation for a direct-to-consumer CareSignal (it draws health data from multiple caregivers and possibly integrations). Using logs for model training or sharing with partners without explicit authorization risks being a reportable "breach."
- HIPAA attaches if CareSignal is deployed by or for a GUIDE program, ABA provider, or health system; that B2B path requires BAAs and HIPAA security controls.
- COPPA: a parent-directed app logging observations about an autistic child is not obviously "directed to children," but raw voice recordings that may contain the child's voice, and any AI-training use, are risk points under the amended rule; legal review advised. Whether voice counts as a biometric identifier under COPPA was not confirmed.

### Gaps
- FTC HBNR new FTC-notice deadline and penalty section text were cut off in the fetched excerpt (commonly reported as notice to FTC within 60 days for breaches of 500+ people, but not verified here).
- No 2026 HHS OCR update on consumer health apps found.
- State consumer health privacy laws (e.g., Washington My Health My Data Act) were out of scope of searches and not covered.
- FDA's promised FY26 revision of the Mobile Medical Applications policy: no evidence found that it has been issued as of November 2026.
