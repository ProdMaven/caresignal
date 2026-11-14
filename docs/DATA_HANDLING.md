# Data handling note

## In this demo
- All people, families, and logs are synthetic. No real patient, child, or caregiver data was collected or used.
- Judges' typed or spoken test inputs are stored only in the demo database and are wiped by "Reset demo data" and on every redeploy.

## What CareSignal stores
- Structured log fields and the text transcript of each note. Audio is never stored; speech is converted to text in the browser.
- No diagnoses, medications, or clinical records are created by the app.

## What leaves the app
- Each note's text is sent to the Anthropic API to be formatted into fields. Text typed into the caregiver check-in is sent to the same API to write a short listening reply; it is not stored. Pattern lines, Ask answers and overview numbers are computed in code and are not sent anywhere. No other third parties receive data.
- No data is sold, shared, or used for advertising.

## Community statistics ("what worked for others")
- Only aggregated outcomes are shown, and only when 5 or more families contributed. No individual family's logs, names, ages, or locations are ever shown to another user.
- In a real product, contributing to community statistics would be opt-in, de-identified, and revocable.

## Safety behavior
- Red flags always show "Please contact your doctor or care team" first; possible emergencies say to call 911; caregiver distress gets care and the 988 Suicide and Crisis Lifeline.
- The app supports caregivers and does not diagnose, recommend medication, or recommend restraint.

## Before real users (roadmap)
- Health and children's data would require a HIPAA-aware setup where applicable, a business associate agreement with the AI provider, encryption at rest, consent flows for minors' data through parents, and user-controlled export and deletion.
