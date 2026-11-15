# Data handling note

## In this demo
- All people, families, and logs are synthetic. No real patient, child, or caregiver data was collected or used.
- Judges' and testers' typed or spoken inputs are saved in the app's own Postgres database on Railway so they survive a redeploy. There is no reset button; added data stays until it is removed by the team.
- There are no accounts: everyone with an invite code shares one space and can see what others added. Testers are asked to use nicknames and no personal details.

## What Unspoken stores
- Structured log fields and the text transcript of each note, Care Profiles (first name or nickname, age band, optional gender, spectrum level, communication level, and the first names and roles of the people who care for them), and "Did this help?" answers. Audio is never stored; speech is converted to text in the browser.
- An optional history for each Care Profile: dated milestones in the caregiver's own words (first signs or a diagnosis they report, changes, support started, health events, changes of setting). The app records what the caregiver says; it never produces a diagnosis. Medicine names and doses are removed from milestones.
- No clinical records are created by the app.

## What leaves the app
Text is sent to the Anthropic API in four places, and nowhere else. Audio is never sent; speech becomes text in the browser.
- **A note** (`POST /api/log`): the note's text, the first names and nicknames on the Care Profile list, who is logging, the time, and, when voice was used, the mic language as a hint. It comes back as fields. When the follow-up question is on, the same call may also word one question.
- **A history** (`POST /api/history/format`): the spoken or typed history, to be turned into milestones.
- **A visit summary** (`POST /api/summary`, when the feature is on): a facts object that code computed from one person's logs (counts by kind and time of day, the listed patterns with their counts, what was tried and how often it helped, entries per caregiver by first name) and up to a few short quotes from that person's notes. The raw log entries are not sent. Medicine names and doses are removed before anything is sent.
- **A question on the Ask screen** (`POST /api/ask`, when the feature is on): the question text only, sent to a small fast model that returns a label for what is being asked. No log entries are sent; code writes the answer from the selected person's logs.
- Pattern lines, counts, scores, Ask answers and overview numbers are computed in code. Safety messages are fixed wording chosen by rules before any model call. No other third parties receive data.
- No data is sold, shared, or used for advertising.

## Community statistics ("what worked for others")
- Only aggregated outcomes are shown, and only when 5 or more families contributed. No individual family's logs, names, ages, or locations are ever shown to another user.
- In a real product, contributing to community statistics would be opt-in, de-identified, and revocable.

## Safety behavior
- Red flags always show "Please contact your doctor or care team" first; possible emergencies say to call 911; caregiver distress gets care and the 988 Suicide and Crisis Lifeline.
- The app supports caregivers and does not diagnose, recommend medication, or recommend restraint.

## Before real users (roadmap)
- Health and children's data would require a HIPAA-aware setup where applicable, a business associate agreement with the AI provider, encryption at rest, consent flows for minors' data through parents, and user-controlled export and deletion.
