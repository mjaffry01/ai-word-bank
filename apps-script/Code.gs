/**
 * AI Word Bank backend: a Google Sheet plus this Apps Script web app.
 *
 * The Sheet is the teacher's admin panel:
 *   Students  - one row per student. Change "Status" to approved / rejected.
 *   Attempts  - one row per finished ring quiz (score and percent).
 *   Answers   - one row per question answered (what was chosen, the right answer).
 *   Summary   - best score per student per ring (formula, updates itself).
 *
 * Students sign in with Google on the website; the site sends their Google ID token,
 * which this script checks with Google before reading or writing anything.
 */

// The OAuth client ID of the website's "Sign in with Google" button.
const CLIENT_ID = '767661169096-4l07sksuk11vfs4frk9s83jon9dc0cbe.apps.googleusercontent.com';

// How long a student stays signed in after a Google sign-in.
const SESSION_HOURS = 48;

const HEADERS = {
  Students: ['Email', 'Name', 'Status', 'Signed up', 'Last seen'],
  Attempts: ['Attempt ID', 'Date', 'Email', 'Name', 'Ring', 'Level', 'Score', 'Total', 'Percent'],
  Answers: ['Attempt ID', 'Date', 'Email', 'Name', 'Ring', 'Question no.', 'Type', 'Question', 'Student answer', 'Right answer', 'Correct'],
  // Later modules (Module 2 onward): one row per finished module quiz, and one per practice task handed in.
  'Module quizzes': ['Attempt ID', 'Date', 'Email', 'Name', 'Module', 'Score', 'Total', 'Percent'],
  Submissions: ['Date', 'Email', 'Name', 'Module', 'Task', 'AI tool used', 'Final prompt', 'What changed and why'],
};

/** A results tab, created with its headers the first time it is needed. */
function sheet(name) {
  const ss = book();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#e8f1f0');
    if (name === 'Module quizzes') sh.getRange('H2:H').setNumberFormat('0%');
    sh.getRange(name === 'Submissions' ? 'A2:A' : 'B2:B').setNumberFormat('yyyy-mm-dd hh:mm');
  }
  return sh;
}
const STATUSES = ['pending', 'approved', 'rejected'];

// The Google Sheet that holds students and results (the long id in the Sheet's web address).
const SHEET_ID = '1_XK-8T1EpOQd-OnxAVNyZuTGivx6FO2zt2jMUNVq2vk';
function book() {
  return SpreadsheetApp.openById(SHEET_ID);
}

/** Run once from the editor: creates the tabs, headers, status dropdown and summary. */
function setup() {
  const ss = book();
  Object.keys(HEADERS).forEach((name) => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS[name]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#e8f1f0');
    }
  });

  const students = ss.getSheetByName('Students');
  const status = students.getRange('C2:C');
  status.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  students.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('approved').setBackground('#d6f0de').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('pending').setBackground('#fdf0c8').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('rejected').setBackground('#f8d7d4').setRanges([status]).build(),
  ]);
  students.getRange('D2:E').setNumberFormat('yyyy-mm-dd hh:mm');
  ss.getSheetByName('Attempts').getRange('B2:B').setNumberFormat('yyyy-mm-dd hh:mm');
  ss.getSheetByName('Attempts').getRange('I2:I').setNumberFormat('0%');
  ss.getSheetByName('Answers').getRange('B2:B').setNumberFormat('yyyy-mm-dd hh:mm');

  const summary = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  summary.clear();
  summary.getRange('A1').setFormula(
    "=IFERROR(QUERY(Attempts!A:I, \"select C, D, E, count(A), max(I) where C is not null group by C, D, E order by C, E label C 'Email', D 'Name', E 'Ring', count(A) 'Attempts', max(I) 'Best %'\", 1), \"No attempts yet\")");
  summary.getRange('E:E').setNumberFormat('0%');
  summary.setFrozenRows(1);

  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  ss.setActiveSheet(students);
}

function doGet() {
  return json({ ok: true, service: 'AI Word Bank' });
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // A fresh Google sign-in starts a 48-hour session; later requests send the session instead.
    const fromGoogle = !req.session;
    const who = fromGoogle ? verifyGoogleToken(req.token) : verifySession(req.session);
    if (req.action === 'me') {
      const res = me(who);
      if (fromGoogle) Object.assign(res, makeSession(who));
      return json(res);
    }
    if (req.action === 'saveAttempt') return json(saveAttempt(who, req.result));
    if (req.action === 'saveModuleQuiz') return json(saveModuleQuiz(who, req.result));
    if (req.action === 'saveSubmission') return json(saveSubmission(who, req.submission));
    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Checks the Google ID token with Google and returns the verified email and name. */
function verifyGoogleToken(token) {
  if (!token || typeof token !== 'string') throw new Error('signed_out');
  const cache = CacheService.getScriptCache();
  const key = 't_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('signed_out');
  const p = JSON.parse(res.getContentText());
  if (p.aud !== CLIENT_ID) throw new Error('wrong_client');
  if (p.iss !== 'accounts.google.com' && p.iss !== 'https://accounts.google.com') throw new Error('signed_out');
  if (String(p.email_verified) !== 'true') throw new Error('email_not_verified');
  const secondsLeft = Number(p.exp) - Math.floor(Date.now() / 1000);
  if (!(secondsLeft > 0)) throw new Error('signed_out');

  const who = { email: String(p.email).toLowerCase(), name: String(p.name || '') };
  cache.put(key, JSON.stringify(who), Math.min(secondsLeft, 3000));
  return who;
}

/** A signed session: who the student is and when it expires, sealed with a secret only this script knows. */
function makeSession(who) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const body = Utilities.base64EncodeWebSafe(JSON.stringify({ e: who.email, n: who.name, x: exp }), Utilities.Charset.UTF_8);
  return { session: body + '.' + sign(body), sessionExpires: exp };
}

function verifySession(session) {
  if (typeof session !== 'string' || session.indexOf('.') < 0) throw new Error('signed_out');
  const parts = session.split('.');
  if (parts.length !== 2 || sign(parts[0]) !== parts[1]) throw new Error('signed_out');
  const p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8'));
  if (!(Number(p.x) > Date.now())) throw new Error('signed_out');
  return { email: String(p.e).toLowerCase(), name: String(p.n || '') };
}

function sign(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text, sessionSecret()));
}

/** Created once and kept in the script's private properties. Changing it signs everyone out. */
function sessionSecret() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('SESSION_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SESSION_SECRET', secret);
  }
  return secret;
}

/** Signs a student in: adds them as "pending" the first time, and returns their status. */
function me(who) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = book().getSheetByName('Students');
    const row = findStudentRow(sh, who.email);
    let status;
    if (row) {
      status = normalizeStatus(sh.getRange(row, 3).getValue());
      sh.getRange(row, 5).setValue(new Date());
    } else {
      status = 'pending';
      sh.appendRow([who.email, safe(who.name), status, new Date(), new Date()]);
    }
    return { ok: true, status: status, name: who.name, best: status === 'approved' ? bestByRing(who.email) : {} };
  } finally {
    lock.releaseLock();
  }
}

/** Saves one finished quiz for an approved student. */
function saveAttempt(who, r) {
  if (studentStatus(who.email) !== 'approved') return { ok: false, error: 'not_approved' };
  const isInt = (n) => typeof n === 'number' && Math.floor(n) === n;
  if (!r || !isInt(r.ring) || r.ring < 0 || r.ring > 30 || !isInt(r.total) || r.total < 1 || r.total > 200 ||
      !isInt(r.score) || r.score < 0 || r.score > r.total || !Array.isArray(r.answers) || r.answers.length !== r.total) {
    return { ok: false, error: 'invalid_result' };
  }
  const id = Utilities.getUuid().slice(0, 8);
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = book();
    ss.getSheetByName('Attempts').appendRow([id, now, who.email, safe(who.name), r.ring, safe(r.level), r.score, r.total, r.score / r.total]);
    const rows = r.answers.map((a, i) => [id, now, who.email, safe(who.name), r.ring, i + 1, safe(a.kind), safe(a.question), safe(a.chosen), safe(a.correct), a.ok ? 'yes' : 'no']);
    const ans = ss.getSheetByName('Answers');
    ans.getRange(ans.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, best: bestByRing(who.email) };
}

/** Saves one finished module quiz (Module 2 onward); each answer also goes to Answers, with the module in the Ring column. */
function saveModuleQuiz(who, r) {
  if (studentStatus(who.email) !== 'approved') return { ok: false, error: 'not_approved' };
  const isInt = (n) => typeof n === 'number' && Math.floor(n) === n;
  if (!r || typeof r.module !== 'string' || !r.module || !isInt(r.total) || r.total < 1 || r.total > 100 ||
      !isInt(r.score) || r.score < 0 || r.score > r.total || !Array.isArray(r.answers) || r.answers.length !== r.total) {
    return { ok: false, error: 'invalid_result' };
  }
  const id = Utilities.getUuid().slice(0, 8);
  const now = new Date();
  const module = safe(r.module, 80);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet('Module quizzes').appendRow([id, now, who.email, safe(who.name), module, r.score, r.total, r.score / r.total]);
    const rows = r.answers.map((a, i) => [id, now, who.email, safe(who.name), module, i + 1, safe(a.kind), safe(a.question), safe(a.chosen), safe(a.correct), a.ok ? 'yes' : 'no']);
    const ans = sheet('Answers');
    ans.getRange(ans.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/** Saves a practice task a student hands in (for example, their final prompt and what they changed). */
function saveSubmission(who, s) {
  if (studentStatus(who.email) !== 'approved') return { ok: false, error: 'not_approved' };
  if (!s || typeof s.task !== 'string' || !s.task || typeof s.prompt !== 'string' || !s.prompt.trim()) {
    return { ok: false, error: 'invalid_submission' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet('Submissions').appendRow([new Date(), who.email, safe(who.name), safe(s.module, 80), safe(s.task, 200),
      safe(s.tool, 80), safe(s.prompt, 5000), safe(s.reflection, 3000)]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function findStudentRow(sh, email) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const emails = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return 0;
}

function studentStatus(email) {
  const sh = book().getSheetByName('Students');
  const row = findStudentRow(sh, email);
  return row ? normalizeStatus(sh.getRange(row, 3).getValue()) : 'none';
}

function normalizeStatus(v) {
  const s = String(v || '').trim().toLowerCase();
  return STATUSES.indexOf(s) >= 0 ? s : 'pending';
}

function bestByRing(email) {
  const sh = book().getSheetByName('Attempts');
  const n = sh.getLastRow() - 1;
  const best = {};
  if (n < 1) return best;
  sh.getRange(2, 3, n, 6).getValues().forEach((row) => {
    if (String(row[0]).toLowerCase() !== email) return;
    const ring = row[2], s = Number(row[4]), t = Number(row[5]);
    const b = best[ring];
    if (t > 0 && (!b || s / t > b.s / b.n)) best[ring] = { s: s, n: t };
  });
  return best;
}

/** Stops text that starts with = + - @ from being read as a spreadsheet formula, and limits length. */
function safe(v, max) {
  const s = String(v == null ? '' : v).slice(0, max || 1000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
