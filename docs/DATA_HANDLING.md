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
- Each note's text is sent to the Anthropic API to be formatted into fields. The spoken or typed history is sent to the same API to be turned into milestones. Pattern lines, Ask answers and overview numbers are computed in code and are not sent anywhere. No other third parties receive data.
- No data is sold, shared, or used for advertising.

## Community statistics ("what worked for others")
- Only aggregated outcomes are shown, and only when 5 or more families contributed. No individual family's logs, names, ages, or locations are ever shown to another user.
- In a real product, contributing to community statistics would be opt-in, de-identified, and revocable.

## Safety behavior
- Red flags always show "Please contact your doctor or care team" first; possible emergencies say to call 911; caregiver distress gets care and the 988 Suicide and Crisis Lifeline.
- The app supports caregivers and does not diagnose, recommend medication, or recommend restraint.

## Before real users (roadmap)
- Health and children's data would require a HIPAA-aware setup where applicable, a business associate agreement with the AI provider, encryption at rest, consent flows for minors' data through parents, and user-controlled export and deletion.
