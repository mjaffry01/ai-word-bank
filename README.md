# AI Word Bank

An AI vocabulary course site: a learning web of about 660 terms arranged in rings from the core outward, a ring-by-ring learning path, a glossary, flashcards and multiple-choice ring quizzes.

Students sign in with Google. The teacher approves them and sees every score and answer in a Google Sheet. Everything runs on free services.

| Part | Service | Where |
|---|---|---|
| Website | GitHub Pages | `docs/` → https://mjaffry01.github.io/ai-word-bank/ |
| Student sign-in | Sign in with Google | Google Cloud project `ai-word-bank-login` |
| Server | Google Apps Script web app | `apps-script/Code.gs` |
| Admin panel and data | Google Sheet | "AI Word Bank - Students and Results" in the teacher's Drive |

## For the teacher

Everything is managed in the Google Sheet.

- **Students:** every student who signs in appears here as `pending`. Change the **Status** dropdown to `approved` to let them in, or to `rejected` to keep them out. A waiting student's page checks every 30 seconds and opens by itself.
- **Attempts:** one row per finished quiz, with the date, student, ring, score and percent.
- **Answers:** one row per question, showing the question, the student's answer, the right answer and whether it was correct. Use **Data → Create a filter** to look at one student or one ring.
- **Summary:** each student's best score per ring. It updates by itself.

## How it fits together

1. The site shows Google's **Sign in with Google** button. Google gives the browser a signed ID token for the student.
2. The site sends that token to the Apps Script web app. The script checks the token with Google, and checks that it was issued for this site's Client ID. Only then does it read or write the Sheet.
3. New students are added as `pending`. Only `approved` students can save quiz results, and the script rejects impossible scores.

The Apps Script web app is set to **Execute as: Me** and **Who has access: Anyone**. Students' browsers need that access to reach it. It doesn't open your data: every request must carry a valid Google sign-in, and the Sheet itself stays private.

## Settings

- `docs/config.js` holds the Client ID and the Apps Script web app URL. Neither is a secret.
- `apps-script/Code.gs` holds `CLIENT_ID` and `SHEET_ID`. It is a copy of the script in the Apps Script editor. After changing it, paste it into the editor, save, then go to **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The URL stays the same.

## Changing the words

The terms are in `docs/index.html` inside `<script type="text/plain" id="data">`, one `Term|topic|meaning` per line. The connecting words are in `<script type="text/plain" id="web">`, one `Word > words that build on it` per line. Commit and push, and GitHub Pages updates within a minute or two.

## Limits

- **Sign-in lasts an hour.** Google sign-in tokens last one hour. If a student finishes a quiz after that, the site asks them to sign in again and then saves the result.
- **The word list is public.** It is part of the page, so anyone with the address can read it. The sign-in gate protects the quizzes and results.
- **Scores can be faked.** They are worked out in the student's browser, so a technically skilled student could fake one.
- **Free quotas.** Apps Script's free quotas (about 20,000 URL checks and 90 minutes of run time a day) are plenty for a class.
