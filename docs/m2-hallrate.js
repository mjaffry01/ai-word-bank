// Module 2, Hallucination hunt, "Step 5 · Measure it": how to measure a hallucination rate.
// The claim-by-claim method, a practice answer to label against evidence, a rate calculator, and how to test a prompt fairly.
// Module 2 calls WB_HRATE.html() inside the hunt tab and WB_HRATE.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

  const STEPS = [
    ["Pick test questions", "Use real questions from what you actually use AI for: 50–100 for a proper test, or about 10 for class practice. A model can be reliable on one topic and poor on another."],
    ["Get trusted evidence", "For each question, collect the correct answer: original documents, official sites or answers checked by an expert."],
    ["Split answers into claims", "A claim is one fact you can check on its own. One sentence often holds several claims."],
    ["Label every claim", "Compare each claim with the evidence: <b class=\"hr-s\">Supported</b>, <b class=\"hr-c\">Contradicted</b>, or <b class=\"hr-u\">Can't tell</b> (the evidence doesn't say)."],
    ["Count and report", "Work out the rates. Decide <i>before</i> you start whether “can't tell” counts as a hallucination for your task."],
  ];

  // Practice: one AI answer, split into claims, checked against a short fact sheet.
  const EVIDENCE = "Riverside Library opened in 1998. It is on Park Street. It has 40,000 books and is open Monday to Saturday. Entry is free.";
  const ANSWER = "Riverside Library opened in 1998 on Park Street. It holds about 60,000 books and is open seven days a week. Entry is free, and the building was designed by the architect Mary Chen.";
  const CLAIMS = [
    ["It opened in 1998.", "s", "The fact sheet says 1998."],
    ["It is on Park Street.", "s", "The fact sheet says Park Street."],
    ["It holds about 60,000 books.", "c", "The fact sheet says 40,000 books, so this is wrong."],
    ["It is open seven days a week.", "c", "The fact sheet says Monday to Saturday: six days, not seven."],
    ["Entry is free.", "s", "The fact sheet says entry is free."],
    ["It was designed by the architect Mary Chen.", "u", "The fact sheet says nothing about an architect. It might be true, or the AI might have made it up: you'd need another source."],
  ];
  const LABELS = { s: "Supported", c: "Contradicted", u: "Can't tell" };

  let picks = {}, checked = false;
  let calc = { s: 170, c: 20, u: 10, bad: 12, total: 50 };

  function practiceHTML() {
    const all = CLAIMS.length, got = Object.keys(picks).length, right = CLAIMS.filter((c, i) => picks[i] === c[1]).length;
    const n = { s: 0, c: 0, u: 0 }; CLAIMS.forEach((c) => n[c[1]]++);
    return `<div class="hrgrid2">
        <div><p class="lbl good">Trusted evidence (the library's fact sheet)</p><p class="hrbox">${esc(EVIDENCE)}</p></div>
        <div><p class="lbl bad">The AI's answer</p><p class="hrbox">${esc(ANSWER)}</p></div></div>
      <p style="margin:12px 0 6px">The answer has been split into ${all} claims. Label each one against the fact sheet:</p>
      <ol class="hrclaims">${CLAIMS.map(([txt, ans, why], i) => `<li class="${checked ? (picks[i] === ans ? "ok" : "no") : ""}"><span class="hrtxt">${esc(txt)}</span>
        <span class="hrbtns">${Object.entries(LABELS).map(([k, l]) => `<button class="hrpick hr-${k} ${picks[i] === k ? "on" : ""}" data-hrpick="${i}:${k}" aria-pressed="${picks[i] === k}">${l}</button>`).join("")}</span>
        ${checked ? `<span class="hrwhy">${picks[i] === ans ? "✓ Right." : `✗ It's <b>${LABELS[ans]}</b>.`} ${esc(why)}</span>` : ""}</li>`).join("")}</ol>
      <div class="btnrow"><button class="btn primary" data-hrcheck ${got < all ? "disabled" : ""}>${got < all ? `Label all ${all} claims to check (${got}/${all})` : "Check my labels"}</button>${checked || got ? `<button class="btn sm" data-hrreset>Start again</button>` : ""}</div>
      ${checked ? `<div class="hrresult"><p style="margin:0 0 8px"><b>You got ${right} of ${all} right.</b> Here is what this one answer scores:</p>
        ${table(n.s, n.c, n.u)}
        <p class="crit" style="margin:8px 0 0">Half the claims are right, but the whole answer still counts as <b>1 wrong answer</b>, because it contains at least one error. And the architect claim can't be counted as false: it just isn't in the evidence.</p></div>` : ""}`;
  }
  function table(s, c, u) {
    const t = s + c + u;
    return `<table class="hrtable"><thead><tr><th>Label</th><th>Claims</th><th>% of claims</th></tr></thead><tbody>
      <tr><td><b class="hr-s">Supported</b> by the evidence</td><td>${s}</td><td>${pct(s, t)}%</td></tr>
      <tr><td><b class="hr-c">Contradicted</b> by the evidence</td><td>${c}</td><td>${pct(c, t)}%</td></tr>
      <tr><td><b class="hr-u">Can't tell</b> from the evidence</td><td>${u}</td><td>${pct(u, t)}%</td></tr>
      <tr class="tot"><td>All claims checked</td><td>${t}</td><td>100%</td></tr></tbody></table>`;
  }
  function calcHTML() {
    const { s, c, u, bad, total } = calc, t = s + c + u;
    const num = (k, v, lbl) => `<label class="hrnum">${lbl}<input type="number" min="0" step="1" value="${v}" data-hrcalc="${k}"></label>`;
    return `<div class="hrnums">${num("s", s, "Supported")}${num("c", c, "Contradicted")}${num("u", u, "Can't tell")}</div>
      <div id="hrcalcout">${calcOut()}</div>
      <p class="lbl" style="margin:16px 0 6px">Answer-level error rate</p>
      <p class="crit" style="margin:0 0 8px">Instead of claims, count whole answers: how many answers had at least one mistake?</p>
      <div class="hrnums">${num("bad", bad, "Answers with an error")}${num("total", total, "All answers")}</div>
      <div id="hrcalcans">${ansOut()}</div>`;
  }
  function calcOut() {
    const { s, c, u } = calc, t = s + c + u;
    if (!t) return `<p class="crit">Enter some numbers.</p>`;
    return `${table(s, c, u)}
      <div class="hrrates"><div><b>${pct(c, t)}%</b><span>Confirmed error rate</span><small>Contradicted ÷ all claims. Claims that are definitely wrong.</small></div>
        <div><b>${pct(c + u, t)}%</b><span>Unsupported-claim rate</span><small>(Contradicted + can't tell) ÷ all claims. Use this when every claim must come from your documents.</small></div></div>`;
  }
  const ansOut = () => { const { bad, total } = calc; return total ? `<div class="hrrates"><div><b>${pct(Math.min(bad, total), total)}%</b><span>of answers contained at least one error</span><small>${Math.min(bad, total)} ÷ ${total} × 100</small></div></div>` : ""; };

  function html() {
    return `<div class="card2 hrsec"><p class="kicker">Step 5 · Measure it</p><h3>How often does an AI make things up?</h3>
        <p>Catching one invented answer is a good start. To know <b>how often</b> a model hallucinates, you measure its <b>hallucination rate</b>: check its factual claims against trusted evidence and count how many fail. The rate is simply that number as a percentage.</p>
        <p class="tip">The rate only tells you about the kind of questions you tested, not every way the model could be used.</p>
        <ol class="hrsteps">${STEPS.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join("")}</ol>
        <div class="hrsplit"><p class="lbl">Example of step 3: one sentence, two claims</p>
          <p class="hrbox" style="margin:0 0 8px">“The company started in 2010 in London.”</p>
          <div class="hrchips"><span>Claim 1: it started in 2010</span><span>Claim 2: it started in London</span></div>
          <p class="crit" style="margin:8px 0 0">Each claim is checked separately, because one can be right while the other is wrong.</p></div>
      </div>
      <div class="card2 hrsec"><p class="kicker">Try it · about 3 minutes</p><h3>Check one AI answer, claim by claim</h3>
        <div id="hrpractice">${practiceHTML()}</div></div>
      <div class="card2 hrsec"><p class="kicker">The maths</p><h3>Work out the rates</h3>
        <p>Say you checked 200 claims from many answers. Change the numbers to see how the rates move.</p>
        ${calcHTML()}
        <p class="crit" style="margin:12px 0 0">“Can't tell” doesn't mean false. Keep it as its own number instead of hiding it inside the error rate.</p></div>
      <div class="card2 hrsec"><p class="kicker">Testing a prompt fairly</p><h3>Did your better prompt really reduce hallucinations?</h3>
        <div class="hrfair"><div><p class="lbl good">Keep the same</p><ul><li>the questions</li><li>the model</li><li>the evidence</li><li>the settings (temperature and so on)</li></ul></div>
          <div><p class="lbl">Change only</p><ul><li>the prompting technique, for example adding “If you don't know, say so”</li></ul><p class="crit">Run each version more than once, because answers vary from run to run. You can do this in the <button class="wordlink" data-tab="play">Model playground</button>.</p></div></div>
        <p class="lbl bad" style="margin-top:14px">Watch out for</p>
        <ul class="hrwatch"><li><b>The “I don't know” trick.</b> A model that refuses everything makes almost no mistakes, but it's useless. Also count how often it actually answers, and how complete its answers are.</li>
          <li><b>Letting the AI mark its own homework.</b> Asking an AI to check its own answers isn't a reliable measurement. People should check at least a sample.</li></ul>
        <p class="crit" style="margin:10px 0 0">Researchers use this same claim-by-claim idea in factuality tests such as FActScore.</p></div>`;
  }

  let root = null;
  function mount(el) {
    if (root === el) return; root = el;
    el.addEventListener("click", (e) => {
      const pr = el.querySelector("#hrpractice"); if (!pr) return;
      const p = e.target.closest("[data-hrpick]");
      if (p) { const [i, k] = p.dataset.hrpick.split(":"); picks[+i] = k; checked = false; pr.innerHTML = practiceHTML(); return; }
      if (e.target.closest("[data-hrcheck]")) { checked = true; pr.innerHTML = practiceHTML(); return; }
      if (e.target.closest("[data-hrreset]")) { picks = {}; checked = false; pr.innerHTML = practiceHTML(); }
    });
    el.addEventListener("input", (e) => {
      const k = e.target.dataset && e.target.dataset.hrcalc; if (!k) return;
      calc[k] = Math.max(0, Math.floor(Number(e.target.value) || 0));
      const o = el.querySelector("#hrcalcout"); if (o) o.innerHTML = calcOut();
      const a = el.querySelector("#hrcalcans"); if (a) a.innerHTML = ansOut();
    });
  }

  window.WB_HRATE = { html, mount };
})();
