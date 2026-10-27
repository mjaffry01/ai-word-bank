// Module 4, Attention tab, the parts after the attention explorer: query, key and value step by step
// ("The trolley hit the pole because it was …"), attention heads, why attention gets expensive,
// a click-in-order chain from tokens to ChatGPT, and a quick true/false check.
// Module 4 calls WB_ATTN.html() inside the Attention tab and WB_ATTN.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (x) => Math.round(x * 100);

  /* ---------- 1. Query, key and value, one step at a time ---------- */
  const WORDS = ["The", "trolley", "hit", "the", "pole", "because", "it", "was", "LAST"];
  // What each word offers (its key) and what it carries (its value). Simplified descriptions of what are really lists of numbers.
  const KEY = { The: "a pointer word", trolley: "a thing: a vehicle", hit: "an action", the: "a pointer word", pole: "a thing: a post", because: "a reason link", it: "a stand-in word", was: "a linking word" };
  const VALUE = { trolley: "vehicle, moving, on rails", pole: "post, standing still, metal" };
  // Two endings. The last word changes what "it" must be, and so which key its query matches.
  const ENDINGS = {
    rusty: { q: "I stand in for a thing. Which thing could be rusty and give way when hit?", scores: { The: 0.1, trolley: 1.3, hit: 0.6, the: 0.1, pole: 2.8, because: 0.3, it: 0.5, was: 0.2, rusty: 1.4 }, win: "pole", why: "A rusty pole gives way when something hits it, so “it” matches “pole” best." },
    speeding: { q: "I stand in for a thing. Which thing could be speeding?", scores: { The: 0.1, trolley: 2.9, hit: 0.7, the: 0.1, pole: 0.6, because: 0.3, it: 0.5, was: 0.2, speeding: 1.4 }, win: "trolley", why: "Poles can't speed, so now “it” matches “trolley” best. One word changed, and the attention moved." },
  };
  const STEPS = ["Three versions", "Compare", "Turn scores into weights", "Blend"];
  let ending = "rusty", step = 0;

  function softmax(sc) {
    const ks = Object.keys(sc), ex = ks.map((k) => Math.exp(sc[k])), sum = ex.reduce((a, b) => a + b, 0), out = {};
    ks.forEach((k, i) => (out[k] = ex[i] / sum));
    return out;
  }
  function qkvHTML() {
    const E = ENDINGS[ending], words = WORDS.map((w) => (w === "LAST" ? ending : w)), w = softmax(E.scores);
    const sentence = words.map((x) => {
      const isIt = x === "it", wt = step >= 2 ? w[x] : 0, raw = step === 1 ? E.scores[x] : null;
      const bg = step >= 2 && !isIt ? `background:color-mix(in srgb,var(--accent) ${Math.round(10 + wt * 170)}%,transparent);color:${wt > 0.3 ? "var(--accent-ink)" : "var(--fg)"}` : "";
      return `<span class="qkw ${isIt ? "me" : ""}" style="${bg}">${esc(x)}${raw != null && !isIt ? `<small>${raw.toFixed(1)}</small>` : ""}${step >= 2 && !isIt ? `<small>${pct(wt)}%</small>` : ""}</span>`;
    }).join("");
    const top = Object.entries(w).filter(([k]) => k !== "it").sort((a, b) => b[1] - a[1]).slice(0, 3);
    const panels = [
      `<p>Every word gets three versions of itself. Here are the three for <b>“it”</b> and for two other words:</p>
       <div class="qkcards">
         <div class="qkcard q"><span class="t">Query of “it”</span><b>What am I looking for?</b><p>${esc(E.q)}</p></div>
         <div class="qkcard k"><span class="t">Key of each word</span><b>What do I offer?</b><p>“trolley”: ${KEY.trolley}<br>“pole”: ${KEY.pole}<br>“hit”: ${KEY.hit}</p></div>
         <div class="qkcard v"><span class="t">Value of each word</span><b>What do I carry?</b><p>“trolley”: ${VALUE.trolley}<br>“pole”: ${VALUE.pole}</p></div></div>
       <p class="crit">In a real model these are lists of numbers, not sentences. The model makes all three from the same word, using three different sets of learned weights.</p>`,
      `<p>“it” compares its <b>query</b> with every word's <b>key</b>. A good match gives a high score. The small numbers under each word are the scores.</p>
       <p class="crit">Nobody wrote these rules. The model learned during training which queries should match which keys.</p>`,
      `<p>The scores are turned into <b>weights</b> that add up to 100% (this step is called softmax). Darker means more attention.</p>
       <p class="tip">“it” gives <b>${pct(top[0][1])}%</b> of its attention to “${esc(top[0][0])}”. ${esc(E.why)}</p>`,
      `<p>The model builds a <b>new version of “it”</b>: a blend of every word's <b>value</b>, mixed by those weights.</p>
       <div class="qkblend">${top.map(([k, v]) => `<span><b>${pct(v)}%</b> of “${esc(k)}”</span>`).join(" + ")} + a little of the rest</div>
       <p>So after attention, “it” carries the meaning <b>“${esc(VALUE[E.win])}”</b>. The model now knows what “it” refers to.</p>`,
    ];
    return `<div class="chips4" style="margin:0 0 10px"><span class="crit" style="align-self:center">Last word:</span>${Object.keys(ENDINGS).map((k) => `<button class="choice" data-qaend="${k}" aria-pressed="${k === ending}">${k}</button>`).join("")}</div>
      <div class="qksent">${sentence}</div>
      <ol class="qksteps">${STEPS.map((s, i) => `<li><button data-qastep="${i}" aria-pressed="${i === step}" class="${i < step ? "done" : ""}"><span>${i + 1}</span>${s}</button></li>`).join("")}</ol>
      <div class="qkpanel">${panels[step]}</div>
      <div class="btnrow"><button class="btn sm" data-qaprev ${step === 0 ? "disabled" : ""}>← Back</button><button class="btn primary sm" data-qanext ${step === 3 ? "disabled" : ""}>Next step →</button></div>`;
  }

  /* ---------- 2. Attention heads ---------- */
  const HEADS = [
    { name: "Head A", job: "grammar", focus: "hit", w: { trolley: 0.45, pole: 0.4, The: 0.05, the: 0.05 }, say: "This head links the action “hit” to who did it (“trolley”) and what it hit (“pole”)." },
    { name: "Head B", job: "meaning", focus: "it", w: { pole: 0.62, trolley: 0.18, rusty: 0.12, hit: 0.04 }, say: "This head links “it” to the thing it stands for: “pole”." },
    { name: "Head C", job: "position", focus: "was", w: { it: 0.7, because: 0.15, pole: 0.05 }, say: "This head mostly looks at the word just before: “was” looks at “it”. Word order matters too." },
  ];
  let head = 0, headShown = false;
  function headsHTML() {
    const H = HEADS[head], words = WORDS.map((w) => (w === "LAST" ? "rusty" : w));
    return `<div class="chips4" style="margin:0 0 10px">${HEADS.map((h, i) => `<button class="choice" data-qahead="${i}" aria-pressed="${i === head}">${h.name}</button>`).join("")}</div>
      <div class="qksent">${words.map((x) => {
        const wt = H.w[x] || 0, me = x === H.focus;
        return `<span class="qkw ${me ? "me" : ""}" style="${wt ? `background:color-mix(in srgb,var(--accent) ${Math.round(10 + wt * 170)}%,transparent);color:${wt > 0.3 ? "var(--accent-ink)" : "var(--fg)"}` : ""}">${esc(x)}${wt ? `<small>${pct(wt)}%</small>` : ""}</span>`;
      }).join("")}</div>
      <p style="margin:10px 0 6px">Outlined: the word doing the looking. ${esc(H.say)}</p>
      ${headShown ? `<p class="tip">This head ended up tracking <b>${H.job}</b>. Nobody told it to: the jobs appear by themselves during training, and researchers discovered them afterwards by looking inside trained models.</p>`
        : `<button class="btn sm" data-qajob>What is this head's job?</button>`}`;
  }

  /* ---------- 3. Every word sees every word: the cost ---------- */
  let n = 6;
  function costHTML() {
    const big = [[1000, "a few pages"], [10000, "a long report"], [100000, "a whole book"]];
    return `<label class="qkrange">Words in the text: <b>${n}</b><input type="range" min="2" max="14" value="${n}" data-qan aria-label="Number of words"></label>
      <div class="qkgrid" style="grid-template-columns:repeat(${n},1fr)" aria-hidden="true">${"<i></i>".repeat(n * n)}</div>
      <p>${n} words × ${n} words = <b>${n * n} comparisons</b>. Each dot is one word checking another.</p>
      <table class="hrtable qkcost"><thead><tr><th>Text length</th><th>Tokens</th><th>Comparisons</th></tr></thead><tbody>
        ${big.map(([t, l]) => `<tr><td>${l}</td><td>${t.toLocaleString()}</td><td>${(t * t).toLocaleString()}</td></tr>`).join("")}</tbody></table>
      <p class="crit" style="margin-top:8px">Double the length and the work goes up four times. That is why long context windows are expensive, and why a lot of recent research looks for cheaper kinds of attention.</p>`;
  }

  /* ---------- 4. From tokens to ChatGPT: put the chain in order ---------- */
  const CHAIN = [
    ["Break a sentence into pieces", "tokens"],
    ["Turn each token into a list of numbers", "embeddings"],
    ["Give each token a query, a key and a value", "questions and answers between words"],
    ["Compare each query with the keys", "attention scores"],
    ["Turn the scores into weights that add up to 100% (softmax)", "attention weights"],
    ["Blend the values using those weights", "words that know their context"],
    ["Add a small extra network and some tidying-up steps", "a transformer block"],
    ["Stack many blocks on top of each other", "a transformer"],
    ["Train it to predict the next token", "a language model"],
    ["Train it to follow instructions, with feedback from people", "a chat assistant like ChatGPT"],
  ];
  const ORDER = [6, 2, 9, 0, 4, 7, 1, 5, 3, 8]; // the shuffled order the cards are shown in
  let built = 0, wrong = null;
  function chainHTML() {
    const done = built === CHAIN.length;
    return `<ol class="qkchain">${CHAIN.slice(0, built).map(([a, b]) => `<li>If you <b>${esc(a.charAt(0).toLowerCase() + a.slice(1))}</b>, you get <b class="got">${esc(b)}</b>.</li>`).join("")}
        ${done ? "" : `<li class="next">${built ? "What comes next?" : "What comes first?"}</li>`}</ol>
      ${done ? `<p class="tip">Every chatbot you use is built from this chain. Attention is steps 3 to 6.</p><button class="btn sm" data-qareset>Start again</button>`
        : `<div class="qkpool">${ORDER.filter((i) => i >= built).map((i) => `<button class="qkcardbtn ${wrong === i ? "no" : ""}" data-qachain="${i}">${esc(CHAIN[i][0])}</button>`).join("")}</div>
           <p class="crit" aria-live="polite" style="margin-top:8px">${wrong != null ? `Not yet. “${esc(CHAIN[wrong][0])}” needs something that isn't built yet.` : "Click the step that comes next."}</p>`}`;
  }

  /* ---------- 5. Quick check ---------- */
  const QUIZ = [
    ["The query, key and value of a word are made from the same word.", true, "Yes. The same word is turned into three versions, using three different sets of learned weights."],
    ["Engineers decide which attention head tracks grammar and which tracks meaning.", false, "No. The heads find their own jobs during training. People only discover them afterwards."],
    ["Doubling the length of the text doubles the work attention has to do.", false, "No. Every word compares itself with every other word, so double the words means about four times the work."],
    ["In a chatbot, each word can look at the words that come after it.", false, "No. A chatbot writes one token at a time, so each word only looks back at earlier words. The future words don't exist yet."],
  ];
  let answers = {};
  function quizHTML() {
    return `<ol class="qkquiz">${QUIZ.map(([s, t, why], i) => {
      const a = answers[i];
      return `<li><p>${esc(s)}</p><div class="btnrow" style="margin:6px 0 0">${[true, false].map((v) => `<button class="btn sm ${a === v ? (v === t ? "ok" : "no") : ""}" data-qaquiz="${i}:${v}" ${a != null ? "disabled" : ""}>${v ? "True" : "False"}</button>`).join("")}</div>
        ${a != null ? `<p class="crit" style="margin-top:6px">${a === t ? "✓ Right." : "✗ Not quite."} ${esc(why)}</p>` : ""}</li>`;
    }).join("")}</ol>`;
  }

  function html() {
    return `<div class="card2 qksec"><p class="kicker">Inside attention · step by step</p><h3>Query, key and value: how “it” finds what it means</h3>
        <p>The explorer above shows <i>where</i> a word looks. Here is <i>how</i>, without any maths. Step through it, then change the last word and watch “it” change its mind.</p>
        <div id="qkqkv">${qkvHTML()}</div></div>
      <div class="card2 qksec"><p class="kicker">Many heads</p><h3>Several kinds of attention at once</h3>
        <p>A model runs attention many times side by side. Each copy is called a <b>head</b>, and each head learns to notice a different kind of link. Their results are then combined. Pick a head:</p>
        <div id="qkheads">${headsHTML()}</div></div>
      <div class="card2 qksec"><p class="kicker">The catch</p><h3>Every word looks at every word</h3>
        <p>Older models read text one word at a time, left to right. Attention lets every word look at all the others in one step, which is faster to train and better at long-distance links. But it costs a lot. Move the slider:</p>
        <div id="qkcost">${costHTML()}</div>
        <p class="crit" style="margin-top:10px">Chatbots add one rule: each word may only look at the words <i>before</i> it, because the later words haven't been written yet. So in a chatbot, the link between “it” and “pole” is made when the model reaches “rusty” and looks back.</p></div>
      <div class="card2 qksec"><p class="kicker">The big picture · put it in order</p><h3>From tokens to ChatGPT</h3>
        <p>Attention is one link in a chain. Click the steps in the right order to build a chatbot.</p>
        <div id="qkchain">${chainHTML()}</div></div>
      <div class="card2 qksec"><p class="kicker">Quick check</p><h3>True or false?</h3><div id="qkquiz">${quizHTML()}</div></div>`;
  }

  let root = null;
  function mount(el) {
    if (root === el) return; root = el;
    const put = (id, f) => { const b = el.querySelector("#" + id); if (b) b.innerHTML = f(); };
    el.addEventListener("click", (e) => {
      const t = e.target;
      const en = t.closest("[data-qaend]"); if (en) { ending = en.dataset.qaend; put("qkqkv", qkvHTML); return; }
      const st = t.closest("[data-qastep]"); if (st) { step = +st.dataset.qastep; put("qkqkv", qkvHTML); return; }
      if (t.closest("[data-qanext]")) { step = Math.min(3, step + 1); put("qkqkv", qkvHTML); return; }
      if (t.closest("[data-qaprev]")) { step = Math.max(0, step - 1); put("qkqkv", qkvHTML); return; }
      const h = t.closest("[data-qahead]"); if (h) { head = +h.dataset.qahead; headShown = false; put("qkheads", headsHTML); return; }
      if (t.closest("[data-qajob]")) { headShown = true; put("qkheads", headsHTML); return; }
      const c = t.closest("[data-qachain]"); if (c) { const i = +c.dataset.qachain; if (i === built) { built++; wrong = null; } else wrong = i; put("qkchain", chainHTML); return; }
      if (t.closest("[data-qareset]")) { built = 0; wrong = null; put("qkchain", chainHTML); return; }
      const q = t.closest("[data-qaquiz]"); if (q) { const [i, v] = q.dataset.qaquiz.split(":"); answers[+i] = v === "true"; put("qkquiz", quizHTML); }
    });
    el.addEventListener("input", (e) => {
      if (!e.target.matches("[data-qan]")) return;
      n = +e.target.value;
      const box = el.querySelector("#qkcost"); if (!box) return;
      box.querySelector(".qkrange b").textContent = n;
      const g = box.querySelector(".qkgrid"); g.style.gridTemplateColumns = `repeat(${n},1fr)`; g.innerHTML = "<i></i>".repeat(n * n);
      box.querySelector(".qkgrid + p").innerHTML = `${n} words × ${n} words = <b>${n * n} comparisons</b>. Each dot is one word checking another.`;
    });
  }

  window.WB_ATTN = { html, mount };
})();
