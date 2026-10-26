# AI Concepts

AI Concepts is an AI course site: a learning web of about 660 terms arranged in rings from the core outward, a ring-by-ring learning path, a glossary, flashcards and multiple-choice ring quizzes.

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
- **Module quizzes:** one row per finished quiz from Module 2 onward, with a **Level** column (Beginner, Intermediate or Advanced). Each answer is also in **Answers**, with the module and level in the Ring column.
- **Module summary:** each student's best score per module and level. It updates by itself.
- **Submissions:** practice tasks students hand in, showing the task, the AI tool used, their final prompt and what they changed. The tab appears after the first hand-in.

## Modules

1. **Vocabulary:** learning web, learning path, glossary, flashcards and ring quizzes (`docs/index.html`).
2. **Prompting & AI tools:** a lesson, a prompt builder, eight technique cards, a hallucination hunt, five practice tasks to hand in, and a 15-question quiz (`docs/module2.js`, `docs/module2.css`).
3. **How machines learn:** a lesson (data → features & labels → training → model → prediction → testing), the three ways machines learn with a sorting check, a spam-filter lab students label, train and test themselves (with a confusion matrix), an overfitting lab, four real case studies, a Teachable Machine hand-in, an **Algorithms map** (a "How they connect" overview of where the learning types overlap, algorithm family trees and 18 often-confused pairs, plus 26 interactive demos: 12 supervised, 9 unsupervised, 5 reinforcement; every statistics word is underlined with a plain-English meaning), and a 15-question quiz (`docs/module3.js`, `docs/module3.css`, `docs/algos-*.js`, `docs/algos.css`).

4. **How LLMs work:** a lesson (next-token prediction, the six steps of an answer, pre-training → instruction tuning → RLHF), a tokenizer lab using the real GPT-4 tokenizer (loaded from jsDelivr only when the tab opens), a next-word game with a temperature slider, an attention explorer, a hallucination demo, a context-window lab, a hand-in and a three-level quiz (`docs/module4.js`, `docs/module4.css`).

Modules 2, 3 and 4 save quizzes to **Module quizzes** and hand-ins to **Submissions**, labelled with the module name. To add another module, add a `data-module` button, a `lede` paragraph and an `m<n>` container in `index.html`, and register its render function in `window.WB_MODULES`.

## How it fits together

1. The site shows Google's **Sign in with Google** button. Google gives the browser a signed ID token for the student.
2. The site sends that token to the Apps Script web app. The script checks the token with Google, and checks that it was issued for this site's Client ID. Only then does it read or write the Sheet.
3. New students are added as `pending`. Only `approved` students can save quiz results, and the script rejects impossible scores.

The Apps Script web app is set to **Execute as: Me** and **Who has access: Anyone**. Students' browsers need that access to reach it. It doesn't open your data: every request must carry a valid Google sign-in, and the Sheet itself stays private.

## Settings

- `docs/config.js` holds the Client ID and the Apps Script web app URL. Neither is a secret.
- `apps-script/Code.gs` holds `CLIENT_ID` and `SHEET_ID`. It is a copy of the script in the Apps Script editor. After changing it, paste it into the editor, save, then go to **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The URL stays the same.

## Changing the words

The terms are in `docs/index.html` inside `<script type="text/plain" id="data">`, one `Term|topic|meaning` per line. The connecting words are in `<script type="text/plain" id="web">`, one `Word > words that build on it` per line. Commit and push, and GitHub Pages updates within a minute or two. Each term also has an **In depth** explanation and an **Example** in `docs/deep.txt` (one `Term|In depth|Example` per line, using exactly the same term names). They show in the learning-web panel, the glossary and on the back of flashcards, and the search box searches them too.

## Limits

- **Sign-in lasts 48 hours.** A Google sign-in starts a 48-hour session, signed by the Apps Script with a secret kept in its Script Properties. Students stay signed in on that device, even after closing the browser, until the 48 hours end or they click **Sign out**. If it ends mid-quiz, the site asks them to sign in again and then saves the result. To sign everyone out at once, delete `SESSION_SECRET` under **Project Settings → Script Properties**. Approval is still checked on every request, so setting a student to `rejected` locks them out straight away.
- **The word list is public.** It is part of the page, so anyone with the address can read it. The sign-in gate protects the quizzes and results.
- **Scores can be faked.** They are worked out in the student's browser, so a technically skilled student could fake one.
- **Free quotas.** Apps Script's free quotas (about 20,000 URL checks and 90 minutes of run time a day) are plenty for a class.
