// Module 3: How machines learn. A lesson, the three ways machines learn, a spam-filter lab students train
// themselves, an overfitting lab, case studies, a Teachable Machine hand-in, and a quiz saved to the teacher's Sheet.
(function () {
  const MODULE = "Module 3: How machines learn";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const word = (term, label) => `<button class="wordlink" data-word="${esc(term)}" title="Open in the learning web">${esc(label || term)}</button>`;
  const TABS = [["learn", "Lesson"], ["types", "Ways machines learn"], ["spam", "Train a model"], ["fit", "Overfitting lab"], ["wrong", "When models go wrong"], ["tm", "Teachable Machine"], ["quiz", "Quiz"]];
  let tab = store.get("wb-m3-tab", "learn");

  /* ---------- 1. Lesson ---------- */
  const lesson = () => `<section class="m2sec">
    <header><p class="kicker">Lesson · about 20 minutes</p><h2>How a machine learns from examples</h2>
      <p>Normal software follows rules a person wrote. Machine learning works the other way round: we show the computer many examples, and it works out the rules itself.</p></header>

    <div class="card2"><p class="kicker">1 · Rules vs learning</p><h3>Two ways to build a spam filter</h3>
      <div class="vs">
        <div><p class="lbl">Hand-written rules</p><pre class="pbox">IF message contains "free" AND "click"
  THEN spam
IF sender is unknown AND has a link
  THEN spam
… hundreds more rules, always out of date</pre></div>
        <div><p class="lbl good">${"Machine learning"}</p><pre class="pbox">Show the computer 10,000 messages
already marked "spam" or "not spam".
It finds the patterns itself,
and keeps learning from new examples.</pre></div>
      </div>
      <p style="margin-top:12px">That second approach is ${word("Machine Learning (ML)", "machine learning")}. You'll train exactly this kind of filter yourself in step 3.</p>
    </div>

    <div class="card2"><p class="kicker">2 · The recipe</p><h3>Six steps from data to prediction</h3>
      <div class="recipe">
        <div><span class="n">1</span><b>Data</b><small>Collect examples: messages, photos, sales…</small></div>
        <div><span class="n">2</span><b>Features & labels</b><small>What we measure, and the right answer for each example</small></div>
        <div><span class="n">3</span><b>Training</b><small>The computer adjusts itself to match the examples</small></div>
        <div><span class="n">4</span><b>Model</b><small>The learned patterns, saved and ready to use</small></div>
        <div><span class="n">5</span><b>Prediction</b><small>The model answers for new examples it hasn't seen</small></div>
        <div><span class="n">6</span><b>Testing</b><small>Check it on held-back data to see how good it really is</small></div>
      </div>
    </div>

    <div class="card2"><p class="kicker">3 · Features and labels</p><h3>What the computer actually sees</h3>
      <p>To predict house prices, each house becomes a row of numbers. The ${word("Feature", "features")} are the inputs. The ${word("Label", "label")} is the answer we want the model to learn.</p>
      <div class="tbl"><table><thead><tr><th>Size (m²)</th><th>Bedrooms</th><th>Age (years)</th><th>Distance to city (km)</th><th class="lab">Price · label</th></tr></thead>
        <tbody><tr><td>85</td><td>2</td><td>12</td><td>6</td><td class="lab">$310,000</td></tr><tr><td>140</td><td>4</td><td>3</td><td>15</td><td class="lab">$455,000</td></tr><tr><td>60</td><td>1</td><td>30</td><td>2</td><td class="lab">$275,000</td></tr><tr><td>110</td><td>3</td><td>8</td><td>9</td><td class="lab">?  ← the model predicts this</td></tr></tbody></table></div>
      <p style="margin-top:10px">Predicting a number like a price is called ${word("Regression", "regression")}. Predicting a category like spam or not spam is ${word("Classification", "classification")}.</p>
    </div>

    <div class="card2"><p class="kicker">4 · Training and testing</p><h3>Practice questions and the final exam</h3>
      <p>Think of a student preparing for an exam:</p>
      <ul>
        <li>${word("Training Data", "Training data")} is the practice questions. The model studies them, with answers.</li>
        <li>${word("Test Data", "Test data")} is the final exam: new questions it has never seen.</li>
        <li>A student who memorises the practice answers can fail the exam. A model can do the same. That's called ${word("Overfitting", "overfitting")}, and you'll see it happen in step 4.</li>
      </ul>
      <p class="tip">The only score that matters is how the model does on data it has never seen. That's ${word("Generalization", "generalization")}.</p>
    </div>

    <div class="card2"><p class="kicker">5 · Where you've already met it</p><h3>Machine learning in everyday life</h3>
      <ul>
        <li>Your email's spam folder (classification)</li>
        <li>Netflix and YouTube suggestions (${word("Recommendation System", "recommendation systems")})</li>
        <li>Your bank flagging an unusual payment (${word("Anomaly Detection", "anomaly detection")})</li>
        <li>Phone face unlock and photo search (${word("Computer Vision", "computer vision")})</li>
        <li>Delivery time estimates and price predictions (regression)</li>
      </ul>
    </div>
  </section>`;

  /* ---------- 2. Ways machines learn ---------- */
  const SCEN = [
    ["A bank learns to spot fraud from past transactions marked \"fraud\" or \"genuine\".", "sup"],
    ["A shop groups its customers into types by what they buy, without deciding the groups in advance.", "uns"],
    ["A robot vacuum gets a reward when it cleans an area and learns better routes over time.", "rl"],
    ["A model learns to read handwritten digits from thousands of images labelled 0 to 9.", "sup"],
    ["A news site automatically groups thousands of articles into topics nobody has named yet.", "uns"],
    ["A computer learns to play chess by playing millions of games against itself and being rewarded for wins.", "rl"],
    ["An app predicts house prices from past sales with known prices.", "sup"],
    ["A security system learns what \"normal\" network traffic looks like, then flags anything unusual.", "uns"],
  ];
  const TYPE_NAMES = { sup: "Supervised", uns: "Unsupervised", rl: "Reinforcement" };
  const types = () => {
    const picks = store.get("wb-m3-sort", {});
    const right = SCEN.filter((s, i) => picks[i] === s[1]).length, done = Object.keys(picks).length;
    return `<section class="m2sec">
    <header><p class="kicker">Concepts · 15 minutes</p><h2>Three ways machines learn</h2><p>Every machine-learning system learns in one of three main ways. The difference is what kind of feedback it gets.</p></header>
    <div class="types">
      <div class="card2"><p class="kicker">With answers</p><h3>${word("Supervised Learning", "Supervised learning")}</h3><p>Learns from examples that come with the right answer (labels).</p><p><b>Like:</b> a student with an answer key.</p><p><b>Used for:</b> spam filters, price prediction, medical image diagnosis.</p></div>
      <div class="card2"><p class="kicker">Without answers</p><h3>${word("Unsupervised Learning", "Unsupervised learning")}</h3><p>Finds patterns and groups in data with no labels.</p><p><b>Like:</b> sorting a box of mixed buttons into piles without being told how.</p><p><b>Used for:</b> customer groups, topic discovery, spotting unusual activity.</p></div>
      <div class="card2"><p class="kicker">By trial and reward</p><h3>${word("Reinforcement Learning (RL)", "Reinforcement learning")}</h3><p>Tries actions, gets rewards or penalties, and improves its strategy.</p><p><b>Like:</b> training a dog with treats.</p><p><b>Used for:</b> game-playing AI, robots, and tuning chatbots with feedback (${word("RLHF (Reinforcement Learning from Human Feedback)", "RLHF")}).</p></div>
    </div>
    <div class="card2"><p class="kicker">Quick check</p><h3>Which type is each one?</h3>
      <p class="crit">${done ? `${right} of ${SCEN.length} right so far.` : "Pick a type for each example. You'll see straight away if it's right."}</p>
      <div class="sorter">${SCEN.map(([txt, ans], i) => {
        const p = picks[i];
        return `<div class="row3"><span>${esc(txt)}</span><div class="choices">${Object.entries(TYPE_NAMES).map(([k, n]) => `<button class="choice" data-sort="${i}" data-type="${k}" aria-pressed="${p === k}">${n}</button>`).join("")}</div>
          ${p ? `<div class="fb ${p === ans ? "good" : "bad"}">${p === ans ? "Right." : `Not quite. It's ${TYPE_NAMES[ans]}.`} ${ans === "sup" ? "The examples come with known answers." : ans === "uns" ? "There are no answers given; it finds the groups itself." : "It learns from rewards for its actions."}</div>` : ""}</div>`;
      }).join("")}</div>
      ${done ? `<div class="btnrow"><button class="btn sm" data-sortreset>Start again</button></div>` : ""}
    </div>
  </section>`;
  };

  /* ---------- 3. Train a model: a naive Bayes spam filter ---------- */
  const TRAIN = [
    ["WIN a FREE iPhone now! Click here to claim your prize", "spam"],
    ["Are we still meeting for lunch tomorrow?", "ham"],
    ["Congratulations, you have won $1000 cash. Claim now", "spam"],
    ["Here are the notes from today's class", "ham"],
    ["Limited offer!!! Buy cheap watches, free shipping", "spam"],
    ["Can you send me the report by Friday?", "ham"],
    ["Urgent: your account will be closed, verify your password here", "spam"],
    ["Happy birthday! Hope you have a great day", "ham"],
    ["You are selected for a free holiday, call now to claim", "spam"],
    ["The meeting is moved to 3pm in room 4", "ham"],
    ["Earn money fast from home, click this link", "spam"],
    ["Thanks for your help with the project", "ham"],
  ];
  const TEST = [
    ["Claim your free prize now, click here", "spam"],
    ["Can we move lunch to Friday?", "ham"],
    ["Win cash fast, limited offer", "spam"],
    ["Please send the class notes", "ham"],
    ["Verify your account password urgently", "spam"],
    ["Thanks for the birthday wishes", "ham"],
    ["Free tickets for the meeting tomorrow", "ham"],
    ["Your report is great, call me", "ham"],
  ];
  const STOP = new Set("a an the to for of and or is are be you your we our me my i in on at by it this that with from have has will can".split(" "));
  const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9$\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  let labels = store.get("wb-m3-labels", {});
  let model = null;

  function train() {
    const c = { spam: {}, ham: {} }, n = { spam: 0, ham: 0 }, docs = { spam: 0, ham: 0 }, vocab = new Set();
    TRAIN.forEach(([txt], i) => {
      const y = labels[i]; if (!y) return;
      docs[y]++;
      tokens(txt).forEach((w) => { c[y][w] = (c[y][w] || 0) + 1; n[y]++; vocab.add(w); });
    });
    model = { c, n, docs, V: vocab.size };
  }
  function predict(txt) {
    const { c, n, docs, V } = model, total = docs.spam + docs.ham;
    const score = (y) => Math.log((docs[y] + 1) / (total + 2)) + tokens(txt).reduce((s, w) => s + Math.log(((c[y][w] || 0) + 1) / (n[y] + V)), 0);
    const s = score("spam"), h = score("ham"), p = 1 / (1 + Math.exp(h - s));
    return { y: p >= 0.5 ? "spam" : "ham", p };
  }
  const topWords = (y) => Object.entries(model.c[y]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([w, k]) => `${esc(w)} (${k})`);
  function results() {
    const rows = TEST.map(([txt, truth]) => Object.assign({ txt, truth }, predict(txt)));
    const cm = { tp: 0, fp: 0, fn: 0, tn: 0 };
    rows.forEach((r) => { if (r.y === "spam") r.truth === "spam" ? cm.tp++ : cm.fp++; else r.truth === "spam" ? cm.fn++ : cm.tn++; });
    return { rows, cm, correct: cm.tp + cm.tn };
  }

  const spam = () => {
    const labelled = Object.keys(labels).length, trained = !!model;
    const r = trained ? results() : null;
    return `<section class="m2sec">
    <header><p class="kicker">Lab · 20 minutes</p><h2>Train your own spam filter</h2><p>You'll do the three jobs a data scientist does: <b>label</b> the training data, <b>train</b> the model, and <b>test</b> it on messages it has never seen.</p></header>

    <div class="card2"><p class="kicker">Step 1 · Label the training data</p><h3>Spam or not spam?</h3>
      <p class="crit">${labelled} of ${TRAIN.length} labelled. Try labelling one wrong on purpose later, then retrain and see what happens.</p>
      <div class="msgs">${TRAIN.map(([txt], i) => `<div class="msg"><q>${esc(txt)}</q><div class="choices">
        <button class="choice spam" data-label="${i}" data-y="spam" aria-pressed="${labels[i] === "spam"}">Spam</button>
        <button class="choice ham" data-label="${i}" data-y="ham" aria-pressed="${labels[i] === "ham"}">Not spam</button></div></div>`).join("")}</div>
      <div class="btnrow"><button class="btn primary" data-train ${labelled < 4 || !Object.values(labels).includes("spam") || !Object.values(labels).includes("ham") ? "disabled" : ""}>${trained ? "Retrain the model" : "Train the model"}</button><button class="btn sm" data-autolabel>Label them for me</button><button class="btn sm" data-labelreset>Clear labels</button></div>
      ${labelled >= 4 && !trained ? `<p class="missing">Ready. You need at least one of each kind. More labels usually means a better model.</p>` : ""}
    </div>

    ${trained ? `
    <div class="card2"><p class="kicker">Step 2 · What the model learned</p><h3>The words it links with each label</h3>
      <p>The model counted how often each word appears in spam and in normal messages. That table of counts <i>is</i> the ${word("Model", "model")}. Learning these counts is called ${word("Training", "training")}.</p>
      <div class="learned"><div><p class="lbl bad">Spam words</p><ol>${topWords("spam").map((w) => `<li>${w}</li>`).join("") || "<li>none yet</li>"}</ol></div>
        <div><p class="lbl good">Normal words</p><ol>${topWords("ham").map((w) => `<li>${w}</li>`).join("") || "<li>none yet</li>"}</ol></div></div>
    </div>

    <div class="card2"><p class="kicker">Step 3 · Test on new messages</p><h3>${r.correct} of ${TEST.length} right · ${Math.round(r.correct / TEST.length * 100)}% ${word("Accuracy", "accuracy")}</h3>
      <div class="msgs">${r.rows.map((x) => `<div class="msg"><q>${esc(x.txt)}</q><span class="pred ${x.y === x.truth ? "ok" : "no"}">${x.y === "spam" ? "Spam" : "Not spam"} · ${Math.round((x.y === "spam" ? x.p : 1 - x.p) * 100)}% sure ${x.y === x.truth ? "✓" : `✗ really ${x.truth === "spam" ? "spam" : "not spam"}`}</span></div>`).join("")}</div>
      <p style="margin-top:14px"><b>${word("Confusion Matrix", "Confusion matrix")}</b>: where the right and wrong answers fall.</p>
      <div class="cm">
        <div class="h"></div><div class="h">Predicted spam</div><div class="h">Predicted not spam</div>
        <div class="h">Really spam</div><div class="hit">${r.cm.tp} caught</div><div class="${r.cm.fn ? "miss" : ""}">${r.cm.fn} missed</div>
        <div class="h">Really not spam</div><div class="${r.cm.fp ? "miss" : ""}">${r.cm.fp} false alarm${r.cm.fp === 1 ? "" : "s"}</div><div class="hit">${r.cm.tn} correct</div>
      </div>
      <p class="tip" style="margin-top:12px">Look at how sure it is about "Free tickets for the meeting tomorrow". The word <i>free</i> pulls it towards spam even though it's a normal message. Models learn word patterns, not meaning.</p>
    </div>

    <div class="card2"><p class="kicker">Step 4 · Try your own</p><h3>Type a message and see what the model says</h3>
      <div class="field" style="margin:0"><input id="m3own" placeholder="e.g. Click to claim your free lunch voucher"></div>
      <p class="savemsg" id="m3ownOut" style="font-size:1rem">Type a message above.</p>
    </div>

    <div class="card2"><p class="kicker">Hand in</p><h3>What did you find?</h3>
      <div class="field"><label for="m3spamRef">Which messages did it get wrong, and why? What happened when you mislabelled a training message?</label><textarea id="m3spamRef" rows="4"></textarea></div>
      <div class="btnrow" style="margin:0"><button class="btn primary" data-handin="spam">Hand in</button></div><p class="savemsg" id="m3msg-spam" hidden></p>
    </div>` : ""}
  </section>`;
  };
  function ownPredict() {
    const el = $("m3own"), out = $("m3ownOut"); if (!el || !out || !model) return;
    const t = el.value.trim();
    if (!tokens(t).length) { out.textContent = "Type a message above."; out.className = "savemsg"; return; }
    const p = predict(t), sure = Math.round((p.y === "spam" ? p.p : 1 - p.p) * 100);
    out.className = "savemsg " + (p.y === "spam" ? "err" : "ok");
    out.textContent = `${p.y === "spam" ? "Spam" : "Not spam"} · ${sure}% sure`;
  }

  /* ---------- 4. Overfitting lab: polynomial fits of growing complexity ---------- */
  function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  const truthFn = (x) => 0.75 * Math.sin(Math.PI * x) + 0.25 * x;
  const FITDATA = (() => {
    const r = rng(7), gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += r(); return (s - 3) / 1.2; };
    const pts = (n, off) => Array.from({ length: n }, (_, i) => { const x = -1 + (2 * (i + off)) / n + (r() - 0.5) * 0.08; return { x: Math.max(-1, Math.min(1, x)), y: truthFn(x) + gauss() * 0.16 }; });
    return { train: pts(12, 0.25), test: pts(12, 0.75) };
  })();
  function polyfit(pts, d) {
    const n = d + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
    pts.forEach(({ x, y }) => { const p = Array.from({ length: n }, (_, k) => x ** k); for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += p[i] * p[j]; A[i][n] += p[i] * y; } });
    for (let i = 0; i < n; i++) A[i][i] += 1e-9;
    for (let c = 0; c < n; c++) {
      let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((row, i) => row[n] / row[i]);
  }
  const evalPoly = (w, x) => w.reduce((s, c, k) => s + c * x ** k, 0);
  const mse = (w, pts) => pts.reduce((s, p) => s + (evalPoly(w, p.x) - p.y) ** 2, 0) / pts.length;
  const FITS = Array.from({ length: 11 }, (_, d) => { const w = polyfit(FITDATA.train, d); return { w, tr: mse(w, FITDATA.train), te: mse(w, FITDATA.test) }; });
  const BEST = FITS.reduce((b, f, d) => (d >= 1 && f.te < FITS[b].te ? d : b), 1);
  let degree = store.get("wb-m3-degree", 1);

  function plotSVG(d) {
    const W = 520, H = 320, P = 30, sx = (x) => P + ((x + 1) / 2) * (W - 2 * P), sy = (y) => H / 2 - y * (H / 2 - P) / 1.3;
    const line = (f) => Array.from({ length: 161 }, (_, i) => { const x = -1 + i / 80; return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`; }).join("");
    const w = FITS[d].w;
    return `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Model curve of complexity ${d} through the training points">
      <defs><clipPath id="m3clip"><rect x="${P}" y="${P / 2}" width="${W - 2 * P}" height="${H - P}"/></clipPath></defs>
      <line class="axis" x1="${P}" y1="${sy(0)}" x2="${W - P}" y2="${sy(0)}"/>
      <path class="truth" d="${line(truthFn)}" clip-path="url(#m3clip)"/>
      <path class="curve" d="${line((x) => evalPoly(w, x))}" clip-path="url(#m3clip)"/>
      ${FITDATA.train.map((p) => `<circle class="trainpt" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="5"/>`).join("")}
      ${FITDATA.test.map((p) => `<circle class="testpt" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="5"/>`).join("")}
      <text x="${P}" y="${H - 6}">input</text><text x="${W - P}" y="${H - 6}" text-anchor="end">complexity ${d}</text>
    </svg>`;
  }
  // Labels run in order: underfitting below the good range, overfitting from the first setting whose new-data error doubles
  const LIMIT = FITS[BEST].te * 2;
  const LAST_UNDER = FITS.reduce((m, f, d) => (d < BEST && f.te > LIMIT ? d : m), -1);
  const FIRST_OVER = FITS.findIndex((f, d) => d > BEST && f.te > LIMIT);
  function verdict(d) {
    if (d <= LAST_UNDER) return ["Underfitting", "Too simple. It misses the pattern, so it's wrong on the training points and the new points alike."];
    if (FIRST_OVER > 0 && d >= FIRST_OVER) return ["Overfitting", "Too complex. It bends to hit every training point, including the noise, so it does worse on new points."];
    return ["Good fit", "It follows the real pattern without chasing the noise. The error on new points is low."];
  }
  const fit = () => {
    const maxErr = Math.max(...FITS.slice(0, 11).map((f) => Math.min(f.te, 0.5)), 0.1);
    const f = FITS[degree], [v, why] = verdict(degree);
    const bar = (label, val, color) => `<div class="errbar"><span>${label}</span><span class="track"><span class="fill" style="display:block;width:${Math.min(100, (val / maxErr) * 100)}%;background:${color}"></span></span><span class="num">${val.toFixed(3)}</span></div>`;
    return `<section class="m2sec" style="max-width:none">
    <header><p class="kicker">Lab · 10 minutes</p><h2>Overfitting lab</h2><p>Move the slider to make the model more complex. Watch what happens to its error on the training points it learned from, and on new points it has never seen.</p></header>
    <div class="lab-grid">
      <div class="card2">${plotSVG(degree)}
        <div class="legend3"><span><i style="background:var(--accent)"></i>Training points</span><span><i style="border:2px solid var(--warn);box-sizing:border-box"></i>New points (test)</span><span><i style="background:var(--fg)"></i>Model</span><span><i style="background:var(--muted)"></i>Real pattern (dashed)</span></div>
      </div>
      <div class="card2">
        <label for="m3deg" class="lbl" style="display:block">Model complexity: ${degree}</label>
        <input type="range" class="slider" id="m3deg" min="0" max="10" step="1" value="${degree}">
        <div class="verdict3" style="color:${v === "Good fit" ? "var(--good)" : "var(--bad)"}">${v}</div><p style="margin:0">${why}</p>
        <div class="errbars">${bar("Training error", f.tr, "var(--accent)")}${bar("New-data error", f.te, "var(--warn)")}</div>
        <p class="crit" style="margin-top:10px">Lower is better. Watch the gap between the two bars.</p>
      </div>
    </div>
    <div class="card2"><p class="kicker">What to notice</p><h3>Three things to try</h3>
      <ol><li>Set complexity to <b>0 or 1</b>: a flat or straight line. Both errors are high. That's ${word("Underfitting", "underfitting")}.</li>
        <li>Find the setting where the <b>new-data error is lowest</b>. That's the model you'd actually use.</li>
        <li>Push it to <b>10</b>: the training error drops almost to zero, but the curve goes wild between the points and the new-data error rises. That's ${word("Overfitting", "overfitting")}. It memorised instead of learning.</li></ol>
      <p class="tip">This is why we always keep ${word("Test Data", "test data")} aside: the training score alone would tell you the wildest model is the best.</p>
    </div>
  </section>`;
  };

  /* ---------- 5. When models go wrong ---------- */
  const CASES = [
    { t: "A hiring tool that preferred men", what: "In 2018 Reuters reported that Amazon had stopped using an experimental tool that rated job applicants, after finding it marked down CVs that mentioned women's activities.", why: "It learned from ten years of past hiring, which was mostly men. The model copied the pattern in the data.", lesson: "A model learns whatever is in the data, unfairness included. That's", term: "Algorithmic Bias", q: "Who should check a model like this before it is used, and what should they test?" },
    { t: "Skin-cancer photos with rulers", what: "Researchers found that some skin-lesion classifiers were more likely to call a photo cancerous when a ruler appeared in it.", why: "In the training photos, doctors often placed rulers next to lesions they were worried about. The model learned \"ruler means danger\".", lesson: "Models take shortcuts. They pick up whatever pattern predicts the label, even a meaningless one. Clean, varied data matters:", term: "Data Cleaning", q: "How could you change the training photos to stop this shortcut?" },
    { t: "Face recognition and skin tone", what: "The 2018 \"Gender Shades\" study found commercial face-analysis systems made far more errors for darker-skinned women than for lighter-skinned men.", why: "The training images under-represented some groups, so the model had less to learn from for them.", lesson: "Too little data for a group means worse results for that group. This comes from", term: "Imbalanced Data", q: "What kinds of people or situations might be missing from a dataset you'd collect?" },
    { t: "Shopping forecasts in 2020", what: "When the pandemic hit, many demand-forecasting models suddenly made poor predictions: panic buying, closed shops and new habits looked nothing like past years.", why: "The world changed, so the data coming in no longer looked like the training data.", lesson: "Models need monitoring and retraining when the world shifts. This is called", term: "Data Drift", q: "What change in your own life or work could make an old model wrong?" },
  ];
  const wrong = () => `<section class="m2sec" style="max-width:none">
    <header><p class="kicker">Discussion · 15 minutes</p><h2>When models go wrong</h2><p>Bad data makes a bad model. These real cases show how. Read one per group, then share your answer to the question.</p></header>
    <div class="cases">${CASES.map((c) => `<div class="card2"><h3>${esc(c.t)}</h3><dl>
      <dt>What happened</dt><dd>${esc(c.what)}</dd><dt>Why</dt><dd>${esc(c.why)}</dd>
      <dt>Lesson</dt><dd>${esc(c.lesson)} ${word(c.term, c.term.toLowerCase())}.</dd>
      <dt>Discuss</dt><dd><b>${esc(c.q)}</b></dd></dl></div>`).join("")}</div>
    <div class="card2"><p class="kicker">Remember</p><h3>Garbage in, garbage out</h3>
      <p>Most model failures are data failures: biased, mislabelled, too little, unbalanced or out of date. Before asking "is the algorithm good?", ask "is the data good?"</p></div>
  </section>`;

  /* ---------- 6. Teachable Machine hand-in ---------- */
  const tm = () => {
    const done = store.get("wb-m3-done", {});
    return `<section class="m2sec">
    <header><p class="kicker">Hands-on task · 30 minutes · hand in</p><h2>Train a real model with Teachable Machine</h2>
      <p>Google's free <a href="https://teachablemachine.withgoogle.com/train/image" target="_blank" rel="noopener">Teachable Machine</a> lets you train an image model in your browser with your webcam, with no code and no account. Your images stay on your computer unless you choose to save them.</p></header>
    <div class="card2"><p class="kicker">Steps</p><h3>Build a three-gesture classifier</h3>
      <ol class="steps3">
        <li><span>Open <a href="https://teachablemachine.withgoogle.com/train/image" target="_blank" rel="noopener">teachablemachine.withgoogle.com</a> and choose <b>Image project → Standard image model</b>.</span></li>
        <li><span>Make <b>3 classes</b>, for example <i>Thumbs up</i>, <i>Thumbs down</i> and <i>Open hand</i>. Rename them.</span></li>
        <li><span>For each class, click <b>Webcam</b> and <b>hold to record</b> about <b>50 images</b>. Move your hand around a little. This is your ${word("Training Data", "training data")}.</span></li>
        <li><span>Click <b>Train model</b> and wait. That's ${word("Training", "training")}.</span></li>
        <li><span>Test it in the <b>Preview</b> panel. That's ${word("Inference", "inference")}. Try to break it: different lighting, a different background, someone else's hand, your other hand.</span></li>
        <li><span>Improve it: add more varied images for the class that fails, retrain, and test again.</span></li>
      </ol>
    </div>
    <div class="card2"><p class="kicker">Hand in</p><h3>Your results <span class="pill2 ${done.tm ? "done" : ""}" style="vertical-align:middle;margin-left:6px">${done.tm ? "Handed in" : "To do"}</span></h3>
      <div class="field"><label for="m3tmData">Your classes, and roughly how many images per class</label><textarea id="m3tmData" rows="2" placeholder="e.g. Thumbs up (60), Thumbs down (55), Open hand (50)"></textarea></div>
      <div class="field"><label for="m3tmRes">How well did it work? What fooled it, and why do you think that happened?</label><textarea id="m3tmRes" rows="4" placeholder="e.g. It worked in my room but failed by the window, because all my training images had the same lighting…"></textarea></div>
      <div class="field"><label for="m3tmFix">What did you change to improve it, and did it work?</label><textarea id="m3tmFix" rows="3"></textarea></div>
      <div class="btnrow" style="margin:0"><button class="btn primary" data-handin="tm">Hand in</button></div><p class="savemsg" id="m3msg-tm" hidden></p>
    </div>
  </section>`;
  };

  async function handIn(kind) {
    const msg = $("m3msg-" + kind);
    msg.hidden = false;
    let sub;
    if (kind === "spam") {
      const ref = $("m3spamRef").value.trim(), r = model ? results() : null;
      if (!ref) { msg.className = "savemsg err"; msg.textContent = "Write what you found first."; return; }
      const wrongOnes = r ? r.rows.filter((x) => x.y !== x.truth).map((x) => `"${x.txt}"`).join("; ") : "";
      sub = { task: "Train a spam filter (lab)", tool: "Word Bank lab", prompt: `Labelled ${Object.keys(labels).length}/${TRAIN.length} training messages. Test accuracy: ${r ? r.correct : 0}/${TEST.length}. Wrong: ${wrongOnes || "none"}.`, reflection: ref };
    } else {
      const data = $("m3tmData").value.trim(), res = $("m3tmRes").value.trim(), fix = $("m3tmFix").value.trim();
      if (!data || !res) { msg.className = "savemsg err"; msg.textContent = "Fill in your classes and how well it worked first."; return; }
      sub = { task: "Teachable Machine gesture model", tool: "Teachable Machine", prompt: data, reflection: `RESULTS: ${res}\nIMPROVEMENT: ${fix || "-"}` };
    }
    if (!window.WB || !window.WB.call) { msg.className = "savemsg err"; msg.textContent = "You need to be signed in and approved to hand in work."; return; }
    const btn = document.querySelector(`[data-handin="${kind}"]`); btn.disabled = true;
    msg.className = "savemsg"; msg.textContent = "Handing in…";
    try {
      await window.WB.call("saveSubmission", { submission: Object.assign({ module: MODULE }, sub) });
      const done = store.get("wb-m3-done", {}); done[kind] = true; store.set("wb-m3-done", done);
      msg.className = "savemsg ok"; msg.textContent = "Handed in. Your teacher can see it.";
    } catch (e) {
      msg.className = "savemsg err";
      msg.textContent = e && e.error === "signed_out" ? "Your sign-in has ended. Sign in again, then hand in." : "This could not be handed in. Check your connection and try again.";
    }
    btn.disabled = false;
  }

  /* ---------- 7. Quiz ---------- */
  const QUIZ = [
    { q: "In machine learning, what is a label?", o: ["The correct answer attached to a training example", "The name of the model", "A sticker on the computer", "The first row of a spreadsheet"], why: "Labels are the answers the model learns to predict, such as \"spam\" or a house price." },
    { q: "Why do we keep test data separate from training data?", o: ["To check how the model does on examples it has never seen", "To make training faster", "Because test data is less important", "So the model can memorise it later"], why: "Only unseen data shows whether the model learned real patterns." },
    { q: "A spam filter learns from thousands of emails already marked \"spam\" or \"not spam\". This is…", o: ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "Prompt engineering"], why: "It learns from examples with known answers." },
    { q: "A shop wants to find natural groups among its customers, with no groups decided in advance. Which approach fits?", o: ["Unsupervised learning (clustering)", "Supervised learning", "Reinforcement learning", "Regression"], why: "There are no labels; the model finds the groups itself." },
    { q: "A robot learns to walk by getting a reward each time it moves forward without falling. This is…", o: ["Reinforcement learning", "Supervised learning", "Unsupervised learning", "Data cleaning"], why: "Learning from rewards and penalties is reinforcement learning." },
    { q: "A model scores 99% on its training data but only 60% on new data. What is most likely happening?", o: ["Overfitting", "Underfitting", "Perfect generalization", "The test data is broken"], why: "It memorised the training data instead of learning the general pattern." },
    { q: "A model is too simple and does badly on both training and new data. This is…", o: ["Underfitting", "Overfitting", "Data drift", "Bias"], why: "It hasn't captured the pattern at all." },
    { q: "When predicting house prices, \"number of bedrooms\" is a…", o: ["Feature", "Label", "Model", "Prediction"], why: "Features are the inputs; the price is the label." },
    { q: "Predicting tomorrow's temperature in degrees is an example of…", o: ["Regression", "Classification", "Clustering", "Reinforcement learning"], why: "Predicting a number is regression. Predicting a category is classification." },
    { q: "A hiring model trained on past hires, who were mostly men, starts favouring men. What is the root cause?", o: ["Biased training data", "Too much computing power", "The test data was too small", "The model was underfitting"], why: "The model copied the pattern in its training data." },
    { q: "If many training examples are labelled wrongly, the model will most likely…", o: ["Learn the wrong patterns", "Fix the labels itself", "Ignore the wrong labels", "Become more accurate"], why: "Garbage in, garbage out: the model trusts its labels." },
    { q: "95 out of 100 emails are normal. A lazy model that always says \"not spam\" gets 95% accuracy. What does this show?", o: ["Accuracy alone can be misleading when classes are unbalanced", "The lazy model is excellent", "Spam filters are impossible", "95% is always a good score"], why: "It catches zero spam. The confusion matrix shows this; accuracy hides it." },
    { q: "What does training a model actually mean?", o: ["Adjusting the model's internal values so its predictions match the examples better", "Writing all the rules by hand", "Testing the model on new data", "Collecting more data"], why: "Training tunes the model's parameters to reduce its errors." },
    { q: "Your Teachable Machine model works in your room but fails near a window. What's the best fix?", o: ["Add more training images in different lighting and places", "Train for longer on the same images", "Delete one of the classes", "Use a bigger screen"], why: "Varied training data helps the model generalise to new conditions." },
    { q: "Using a trained model to make predictions on new data is called…", o: ["Inference", "Training", "Labelling", "Clustering"], why: "Inference is the model at work after training." },
  ];
  // Intermediate: applying the ideas to real modelling decisions
  const QUIZ_MID = [
    { q: "You keep adjusting your model and re-checking it on the test set until the test score is as high as possible. What is the problem?", o: ["The test score no longer shows how it will do on truly new data", "The model will train a little more slowly every time you change it", "The test set will get smaller every time you check it", "There is no problem, since you only looked at the test set"], why: "Tuning against the test set leaks it into your choices. Use a separate validation set for tuning, and the test set once at the end." },
    { q: "Only 1 in 1,000 card payments is fraud. Why is accuracy a poor way to judge a fraud model?", o: ["A model that never flags fraud would still be 99.9% accurate", "Accuracy can't be calculated when the data is this large", "Fraud models are always judged by their speed rather than accuracy", "Accuracy only works for regression, not classification"], why: "With rare cases, always guessing the common answer scores highly. Look at how many fraud cases are caught (recall) and how many alarms are real (precision)." },
    { q: "Your spam filter keeps moving important work emails into the spam folder. Which kind of error is this?", o: ["False positives: normal emails wrongly flagged as spam", "False negatives: spam emails that got through the filter", "Underfitting: the filter is far too simple to work at all", "Data drift: spam has changed since the filter was trained"], why: "Flagging something as positive (spam) when it isn't is a false positive. Too many of them means low precision." },
    { q: "A screening model checks for a serious disease. Which mistake is usually worse, and what should you prioritise?", o: ["Missing a sick patient, so prioritise catching every real case", "A false alarm, so prioritise never flagging any healthy patients", "Both mistakes are equal, so only overall accuracy matters", "Neither matters if the model is right most of the time"], why: "Missing a real case (a false negative) can be dangerous, so recall matters most. A doctor can then check the alarms." },
    { q: "When does collecting more training data help the most?", o: ["When the model is overfitting and has memorised its examples", "When the model is far too simple to capture the real pattern at all", "When the training error and test error are already both low", "When the data has the wrong labels on many of the examples"], why: "More varied data makes memorising harder and helps a model that overfits. A model that is too simple needs better features or more complexity." },
    { q: "Your model's error is high on the training data and on the test data. What is the most likely fix?", o: ["Use a more complex model or more useful features", "Collect more data of exactly the same kind", "Train it for a shorter time to avoid overfitting", "Remove the test data and train on everything"], why: "High error everywhere means underfitting. The model can't capture the pattern yet, so give it more capacity or better features." },
    { q: "To predict which customers will cancel, you include \"refund issued in the last month\". Accuracy looks amazing, but it fails in real use. Why?", o: ["It is data leakage: that information usually comes after the cancelling", "Refund data is too small a number to be useful as a feature for this model", "The model needs to be retrained every month to stay accurate", "Customers who cancel are always too rare to predict well"], why: "Leakage is information that wouldn't be available when you make the prediction. It makes test scores look unrealistically good." },
    { q: "Why do we usually shuffle the data randomly before splitting it into training and test sets?", o: ["So both sets have the same mix of examples", "So the model trains faster on mixed-up data", "So the test set always gets the hardest cases", "So no example appears in either set twice"], why: "Without shuffling, the test set might contain only, say, the newest or one type of example, and the score would be misleading." },
    { q: "With only 300 labelled examples, why might you use cross-validation?", o: ["It gives a more reliable estimate by testing on different parts in turn", "It creates 300 extra examples by mixing the existing ones together", "It lets you skip having any test data for the model at all", "It trains the model on the test data so nothing is wasted"], why: "Cross-validation rotates which part is held out, so every example is used for testing once and the estimate is less down to luck." },
    { q: "One feature is age (0–100) and another is yearly income (0–200,000). Why might you normalise them?", o: ["So the large income numbers don't swamp age just because of their scale", "So the model can treat both of them as categories instead of as numbers at all", "So that the data takes up less storage space on the computer", "So that age becomes more important than income in the model"], why: "Many methods compare raw sizes, so putting features on similar scales stops the biggest numbers dominating." },
    { q: "Your model tells huskies from wolves well, but you find it mostly looks for snow in the background. What is happening?", o: ["It learned a shortcut: snow appears in most of the wolf photos", "It is underfitting because there are too few animal photos", "It is working correctly because wolves live in snowy places", "It has learned the real differences between the two animals"], why: "Models use any pattern that predicts the label. Varied backgrounds force it to learn the animal, not the scenery." },
    { q: "A clustering model splits your customers into 4 groups. What do the groups mean?", o: ["People have to inspect each group and decide what it represents", "The model names each group automatically, based on what it learned from them", "Each group matches one of the labels that were in the data", "The groups are random and change every time with no meaning"], why: "Unsupervised learning finds structure but doesn't label it. Interpreting the groups is a human job." },
    { q: "In Teachable Machine you record 200 images of \"thumbs up\" but only 20 of \"open hand\". What is the likely result?", o: ["The model leans towards \"thumbs up\"; balance the classes", "The model will refuse to train until the classes are equal", "The \"open hand\" class becomes the most accurate class", "Nothing changes, because the model ignores class sizes"], why: "Imbalanced classes bias predictions towards the bigger class. Collecting similar amounts for each helps." },
    { q: "What is the purpose of regularisation?", o: ["To discourage overly complex models so they overfit less", "To make sure that every single feature has exactly the same importance", "To make the model train faster on very large datasets", "To make the model's predictions as varied as possible"], why: "Regularisation penalises complexity, nudging the model towards simpler patterns that generalise better." },
    { q: "Your model works well in the lab but much worse with real customers. What should you check first?", o: ["Whether the real data looks different from the training data", "Whether the model was trained for enough hours in the lab", "Whether the computer it runs on now is fast enough", "Whether the customers are using the model correctly"], why: "A gap between lab and real use usually means the real data differs from the training data, in conditions, users or time." },
  ];
  // Advanced: evaluation trade-offs, how training works, fairness and running models in the real world
  const QUIZ_ADV = [
    { q: "You raise the threshold your spam filter needs before it calls a message spam. What happens?", o: ["Fewer false alarms, but more spam gets through", "More false alarms, but less spam gets through", "Both kinds of error go down at the same time", "Nothing changes, because the model is the same"], why: "A stricter threshold flags less, so precision rises and recall falls. Choosing the threshold is a trade-off you make on purpose." },
    { q: "A classifier has a ROC AUC of 0.5. What does that mean?", o: ["It is no better than random guessing at ranking positives above negatives", "It is right exactly half of the time on all the test data that it was given", "It is very good, since 0.5 is the best possible score for AUC", "It has learned half of the patterns that exist in the training data"], why: "AUC 0.5 is the score of random ranking. 1.0 is perfect. Note that 50% accuracy and AUC 0.5 aren't the same thing." },
    { q: "Fraudsters change their tactics, so the link between transaction patterns and fraud changes. What is this called?", o: ["Concept drift: the relationship between inputs and outcome changes", "Data leakage: future information has slipped into the training data", "Overfitting: the model memorised the old fraud examples too closely", "Underfitting: the model was never complex enough to catch fraud"], why: "With concept drift, the meaning of the patterns shifts, so the model needs monitoring and retraining on recent data." },
    { q: "What does it mean that a model has high variance?", o: ["Small changes in the training data produce very different models", "Its predictions are spread over a very wide range of different values", "It gives exactly the same answer for every input it gets", "It was trained on data from many different sources at once"], why: "High variance is the overfitting side of the bias–variance trade-off: the model is too sensitive to its particular training sample." },
    { q: "A face-matching model is 95% accurate overall but 70% accurate for one group of people. What is the lesson?", o: ["Overall scores can hide failures, so evaluate each group separately", "95% is a strong overall score, so the model is ready to be used everywhere", "The group is too small to matter, so it can be safely ignored", "The model needs a larger learning rate to fix the low group"], why: "Averages hide subgroup performance. Fairness checks look at results per group and fix the data or model where one falls short." },
    { q: "In gradient descent, what goes wrong if the learning rate is far too large?", o: ["The updates overshoot, so training jumps around and may never settle", "The model learns far too carefully and takes much too long to finish training", "The model stops using the training data and starts guessing", "The training data is used up before the first epoch finishes"], why: "Too large a step overshoots the minimum and can diverge. Too small a step converges slowly." },
    { q: "Why is Naive Bayes, the method behind the spam lab, called \"naive\"?", o: ["It assumes each word affects the answer independently of the others", "It assumes every message in the training data is labelled correctly", "It ignores how often each word appears and only checks if it's there", "It was the first and simplest machine-learning method ever invented"], why: "It treats words as independent given the class, which isn't true (\"free\" and \"prize\" go together) but works surprisingly well." },
    { q: "In the lab, \"Free tickets for the meeting tomorrow\" pulls towards spam. What is the best way to fix this?", o: ["Add training messages where \"free\" appears in normal messages", "Remove the word \"free\" from all of the messages in the training data", "Lower the threshold so that more messages count as spam", "Train the model for longer on exactly the same messages"], why: "The model only knows \"free\" from spam. Examples of normal uses teach it that the word alone isn't evidence." },
    { q: "What is early stopping?", o: ["Stopping training when validation error starts to rise", "Stopping training once the training error reaches zero", "Stopping the model from answering if it is unsure", "Stopping data collection once you reach 1,000 rows"], why: "Validation error rising while training error keeps falling is the moment overfitting begins, so you stop there." },
    { q: "In the overfitting lab, why can complexity 10 pass almost exactly through all 12 training points?", o: ["It has nearly as many adjustable parameters as there are data points", "The 12 training points happen to lie exactly on a smooth curve", "The test points were also used to train the most complex model", "Complex models always find the true pattern if given enough time"], why: "With about as many parameters as points, a model can fit every point, noise included, which is the clearest sign of overfitting." },
    { q: "A game-playing agent is rewarded for points and learns to circle forever collecting the same bonus instead of finishing the race. What is this?", o: ["Reward hacking: it found a loophole in the reward design", "Underfitting: the agent is too simple to finish the race", "Data drift: the game changed after the agent was trained", "Overfitting: it memorised one particular race track"], why: "Agents optimise exactly what they're rewarded for. Rewards must match the real goal, or they get exploited." },
    { q: "Why can Teachable Machine learn your gestures from only about 50 images per class?", o: ["It reuses a model already trained on millions of images, which is transfer learning", "Hand gestures are simple shapes, so any model can learn them from very few pictures", "It copies your webcam images many times to create thousands of examples", "It searches the internet for more pictures of the gestures you record"], why: "Transfer learning reuses general visual features learned elsewhere. Only the final step is trained on your classes." },
    { q: "A bank removes the \"gender\" column from a loan model, but the model still treats men and women differently. Why?", o: ["Other features, like job titles or shopping habits, act as proxies for gender", "Removing a column only takes effect after the model has been retrained twice", "The model remembers the gender column from the earlier version of the data", "Loan decisions are always unfair, whatever data the model is trained on"], why: "Correlated features can carry the same information. Fairness needs testing outcomes per group, not just deleting a column." },
    { q: "About 30% of your training labels are wrong. What is the most likely effect, and the best response?", o: ["It learns wrong patterns and scores lower; clean or relabel the data", "It is unaffected because models ignore labels that seem wrong", "It becomes more robust because it has seen more variety", "It trains faster, since there are fewer clear patterns to learn"], why: "Models trust their labels. Heavy label noise limits accuracy, and fixing the data usually beats changing the algorithm." },
    { q: "Your model has been live for a year. What is the best way to keep it reliable?", o: ["Monitor its performance on fresh data and retrain when it drops", "Leave it alone, since a trained model doesn't change over time", "Retrain it on the same original data once a month to refresh it", "Increase its complexity a little every few months to keep up"], why: "The world changes even though the model doesn't. Monitoring and retraining on recent data (MLOps) keep it accurate." },
  ];
  const LEVELS = {
    beginner: { name: "Beginner", desc: "The basics: data, labels, training and testing, the three ways machines learn, and why models fail.", qs: QUIZ },
    intermediate: { name: "Intermediate", desc: "Making real modelling choices: picking the right measure, spotting leakage and shortcuts, fixing overfitting and underfitting.", qs: QUIZ_MID },
    advanced: { name: "Advanced", desc: "Trade-offs and real-world use: thresholds and AUC, drift, fairness across groups, how training works, and keeping models reliable.", qs: QUIZ_ADV },
  };
  const QZ = { level: null, qs: null, i: 0, picked: null, score: 0, missed: [], save: null };
  const bestKey = (level) => "wb-m3-best-" + level;
  const nextLevel = (level) => { const ks = Object.keys(LEVELS), i = ks.indexOf(level); return ks[i + 1] || null; };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz(level) { QZ.level = LEVELS[level] ? level : "beginner"; QZ.qs = shuffle(LEVELS[QZ.level].qs.map((x) => ({ q: x.q, why: x.why, right: x.o[0], opts: shuffle(x.o.slice()) }))); QZ.i = 0; QZ.picked = null; QZ.score = 0; QZ.missed = []; QZ.save = null; render(); }
  const quiz = () => {
    if (!QZ.qs) {
      return `<section class="m2sec" style="max-width:none"><header><p class="kicker">Check your understanding</p><h2>Module 3 quiz</h2>
        <p>Three levels of 15 questions each. Start with Beginner and work up. Your score and answers go to your teacher.</p></header>
        <div class="tech">${Object.entries(LEVELS).map(([k, L], i) => {
          const best = store.get(bestKey(k), k === "beginner" ? store.get("wb-m3-best", null) : null);
          return `<div class="card2"><p class="kicker">Level ${i + 1}</p><h3>${L.name}</h3><p class="when">${esc(L.desc)}</p>
            <p class="crit" style="margin:0">${L.qs.length} questions · ${best ? `Your best: <b>${best.s} / ${best.n}</b>` : "Not tried yet"}</p>
            <div class="btnrow" style="margin:0"><button class="btn primary" data-qstart="${k}">Start ${L.name}</button></div></div>`;
        }).join("")}</div></section>`;
    }
    const n = QZ.qs.length;
    const head = `<div class="qhead"><span>${esc(MODULE)} · ${LEVELS[QZ.level].name}</span><span>${QZ.i < n ? `Question ${QZ.i + 1} of ${n} · ` : ""}Score ${QZ.score}</span></div><div class="bar2"><i style="width:${Math.min(1, (QZ.i + (QZ.picked !== null ? 1 : 0)) / n) * 100}%"></i></div>`;
    if (QZ.i >= n) {
      const pct = Math.round(QZ.score / n * 100);
      const msg = pct === 100 ? "Perfect. You understand how machines learn." : pct >= 80 ? "Strong result. Look over the misses below." : pct >= 50 ? "Getting there. Revisit the lesson and labs for the questions you missed." : "Go back through the lesson and the two labs, then try again.";
      const saveTxt = { saving: "Saving your result…", saved: "Result saved. Your teacher can see it.", failed: "This result could not be saved. Check your connection and take the quiz again." }[QZ.save];
      return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qkind">Result</p><div class="score">${QZ.score} / ${n}</div>${saveTxt ? `<p class="savestate${QZ.save === "failed" ? " bad" : ""}">${saveTxt}</p>` : ""}<p>${msg}</p>
        ${QZ.missed.length ? `<p class="qkind" style="margin-top:20px">Review these</p><ul class="missed">${QZ.missed.map((q) => `<li><div class="q">${esc(q.q)}</div><div><b>${esc(q.right)}</b>. ${esc(q.why)}</div></li>`).join("")}</ul>` : ""}
        <div class="qfoot"><button class="btn" data-qlevels>Choose a level</button><button class="btn" data-qstart="${QZ.level}">Take it again</button>${nextLevel(QZ.level) && pct >= 80 ? `<button class="btn primary" data-qstart="${nextLevel(QZ.level)}">Next: ${LEVELS[nextLevel(QZ.level)].name}</button>` : ""}</div></div></div></section>`;
    }
    const q = QZ.qs[QZ.i], done = QZ.picked !== null;
    return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qprompt">${esc(q.q)}</p>
      <div class="opts">${q.opts.map((o, j) => { const cls = done ? (o === q.right ? " right" : j === QZ.picked ? " wrong" : "") : ""; return `<button class="opt${cls}" data-m3opt="${j}" ${done ? "disabled" : ""}><span class="k">${"ABCD"[j]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>
      ${done ? `<div class="verdict">${q.opts[QZ.picked] === q.right ? `<span class="v good">Correct.</span>` : `<span class="v bad">Not quite.</span>`}<p>${esc(q.why)}</p></div>
      <div class="qfoot"><button class="btn primary" data-qnext>${QZ.i + 1 < n ? "Next question" : "See results"}</button></div>` : ""}</div></div></section>`;
  };
  function answer(j) {
    const q = QZ.qs[QZ.i]; if (QZ.picked !== null || !q.opts[j]) return;
    QZ.picked = j; q.chosen = q.opts[j];
    if (q.chosen === q.right) QZ.score++; else QZ.missed.push(q);
    if (QZ.i === QZ.qs.length - 1) {
      const key = bestKey(QZ.level), best = store.get(key, null), n = QZ.qs.length;
      if (!best || QZ.score / n > best.s / best.n) store.set(key, { s: QZ.score, n });
      if (window.WB && window.WB.call) {
        const qs = QZ.qs; QZ.save = "saving";
        window.WB.call("saveModuleQuiz", { result: { module: MODULE, level: LEVELS[QZ.level].name, score: QZ.score, total: n, answers: qs.map((x) => ({ kind: "Module 3 · " + LEVELS[QZ.level].name, question: x.q, chosen: x.chosen, correct: x.right, ok: x.chosen === x.right })) } })
          .then(() => { QZ.save = "saved"; }, () => { QZ.save = "failed"; }).then(() => { if (QZ.qs === qs && tab === "quiz" && !$("m3").hidden) render(); });
      }
    }
    render();
  }

  /* ---------- Rendering and events ---------- */
  const VIEWS = { learn: lesson, types, spam, fit, wrong, tm, quiz };
  function render() {
    if (tab === "spam" && !model && Object.keys(labels).length && store.get("wb-m3-trained", false)) train();
    $("m3body").innerHTML = `<nav class="m2tabs" role="tablist">${TABS.map(([k, l], i) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}"><span class="step">${i + 1}</span>${l}</button>`).join("")}</nav>${VIEWS[tab]()}`;
  }
  function goTab(k) { tab = k; store.set("wb-m3-tab", k); render(); window.scrollTo({ top: $("m3").offsetTop - 8 }); }

  $("m3body").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (t) { goTab(t.dataset.tab); return; }
    const w = e.target.closest("[data-word]"); if (w) { window.WB_setModule && window.WB_setModule("1"); if (typeof goWeb === "function") goWeb(w.dataset.word); return; }
    const s = e.target.closest("[data-sort]"); if (s) { const p = store.get("wb-m3-sort", {}); p[s.dataset.sort] = s.dataset.type; store.set("wb-m3-sort", p); render(); return; }
    if (e.target.closest("[data-sortreset]")) { store.set("wb-m3-sort", {}); render(); return; }
    const l = e.target.closest("[data-label]"); if (l) { labels[l.dataset.label] = l.dataset.y; store.set("wb-m3-labels", labels); render(); return; }
    if (e.target.closest("[data-autolabel]")) { labels = {}; TRAIN.forEach(([, y], i) => { labels[i] = y; }); store.set("wb-m3-labels", labels); render(); return; }
    if (e.target.closest("[data-labelreset]")) { labels = {}; model = null; store.set("wb-m3-labels", labels); store.set("wb-m3-trained", false); render(); return; }
    if (e.target.closest("[data-train]")) { train(); store.set("wb-m3-trained", true); render(); return; }
    const h = e.target.closest("[data-handin]"); if (h) { handIn(h.dataset.handin); return; }
    const qst = e.target.closest("[data-qstart]"); if (qst) { startQuiz(qst.dataset.qstart); return; }
    if (e.target.closest("[data-qlevels]")) { QZ.qs = null; render(); return; }
    const o = e.target.closest("[data-m3opt]"); if (o) { answer(+o.dataset.m3opt); return; }
    if (e.target.closest("[data-qnext]")) { QZ.i++; QZ.picked = null; render(); }
  });
  $("m3body").addEventListener("input", (e) => {
    if (e.target.id === "m3own") ownPredict();
    if (e.target.id === "m3deg") { degree = +e.target.value; store.set("wb-m3-degree", degree); const y = window.scrollY; render(); window.scrollTo(0, y); const s = $("m3deg"); if (s) s.focus(); }
  });
  document.addEventListener("keydown", (e) => {
    if ($("m3").hidden || tab !== "quiz" || !QZ.qs || QZ.i >= QZ.qs.length || QZ.picked !== null || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = "1234abcd".indexOf(e.key.toLowerCase()); if (k >= 0) answer(k % 4);
  });

  (window.WB_MODULES = window.WB_MODULES || {})["3"] = render;
})();
