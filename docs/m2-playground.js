// Module 2, "Model playground" tab, in two parts.
// Part 1, "Learn the dials" (no key needed): one setting at a time, with a slider, a picture of what it does,
// and a short Teacher/Student conversation that changes with the value.
// Part 2, "Try it for real" (student's own key, from m2-compare.js): run one prompt in up to three models,
// each with its own settings; every setting says "default" until the student moves it.
// Module 2 calls WB_PLAY.html() and WB_PLAY.mount(root).
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const C = () => window.WB_CMP;
  const STORE = "wb-pg2";

  /* ---------- The settings, with what each service supports ---------- */
  const ALL = ["openrouter", "openai", "gemini", "anthropic", "groq", "huggingface", "mistral"], COMPAT = ["groq", "huggingface", "mistral"];
  // min/max/def: the real range used in Part 2. learn: a smaller range for Part 1 where that makes the picture clearer.
  const PARAMS = [
    { id: "temperature", name: "Temperature", api: "temperature", what: "How adventurous the model is when it picks each next word.", min: 0, max: 2, step: 0.1, def: 1, prov: ALL },
    { id: "top_p", name: "Top-p", api: "top_p", what: "Keep only the most likely words until their chances add up to p. Throw the rest away.", min: 0.05, max: 1, step: 0.05, def: 0.9, prov: ALL },
    { id: "top_k", name: "Top-k", api: "top_k", what: "Keep only the k most likely words. Throw the rest away.", min: 1, max: 50, step: 1, def: 5, learn: { max: 10 }, prov: ["openrouter", "gemini", "anthropic"] },
    { id: "max_tokens", name: "Max length", api: "max_tokens", what: "The longest the answer is allowed to be, counted in tokens (pieces of words).", min: 16, max: 2000, step: 16, def: 400, learn: { min: 10, max: 100, step: 5, def: 30 }, prov: ALL },
    { id: "stop", name: "Stop sequence", api: "stop", what: "A piece of text that makes the model stop writing the moment it would write it.", type: "text", def: "4.", prov: ALL },
    { id: "frequency_penalty", name: "Repeat penalty", api: "frequency_penalty", what: "Makes a word less likely every time it is repeated.", min: -2, max: 2, step: 0.1, def: 0, prov: ["openrouter", "openai", "gemini", ...COMPAT] },
    { id: "presence_penalty", name: "New-ideas nudge", api: "presence_penalty", what: "Gives a one-time push away from any word already used, towards new words and ideas.", min: -2, max: 2, step: 0.1, def: 0, prov: ["openrouter", "openai", "gemini", ...COMPAT] },
    { id: "seed", name: "Seed", api: "seed", what: "Fixes the model's “dice”, so the same prompt and settings give the same answer again.", type: "number", def: 42, prov: ["openrouter", "openai", "gemini", ...COMPAT] },
    { id: "thinking", name: "Thinking", api: "reasoning effort", what: "Lets reasoning models think privately before they answer.", type: "choice", choices: ["low", "medium", "high"], def: "low", prov: ALL },
    { id: "system", name: "System prompt", api: "system", what: "Hidden instructions about the model's role, rules and style, sent before your question.", type: "system", def: "You are a cheerful pirate. Answer in one sentence.", prov: ALL },
  ];
  const P = (id) => PARAMS.find((x) => x.id === id);
  const NOT_SUPPORTED = {
    top_k: { openai: "OpenAI doesn't offer top-k." },
    frequency_penalty: { anthropic: "Claude doesn't use penalties." },
    presence_penalty: { anthropic: "Claude doesn't use penalties." },
    seed: { anthropic: "Claude doesn't offer a seed." },
  };
  const supports = (p, prov) => p.prov.includes(prov) && !(NOT_SUPPORTED[p.id] || {})[prov];
  const provName = (prov) => (C() && C().providers[prov] ? C().providers[prov].name : prov);

  /* ---------- What the Teacher and the Student say at each value (prov is "" in Part 1) ---------- */
  const T = (t) => ["T", t], S = (t) => ["S", t];
  function talk(id, v, prov) {
    switch (id) {
      case "temperature":
        if (prov === "anthropic" && v > 1) return [T("Claude only accepts temperatures from 0 to 1, so this will be sent as 1.")];
        if (v === 0) return [T("At 0 the model always picks the single most likely next word. No dice are rolled."), S("So if I ask the same thing twice, I get the same answer?"), T("Almost word for word. Use this for facts, maths, code and pulling data out of text.")];
        if (v <= 0.5) return [T(`At ${v} the model sticks closely to the most likely words, with just a little variety.`), S("Is that good for my homework summary?"), T("Yes. Low temperature means focused and predictable. Great for answers you need to rely on.")];
        if (v <= 1.0) return [T(`${v} is the balanced zone, close to most apps' default. Likely words usually win, but the model sometimes surprises you.`), S("Why not always use 0, to be safe?"), T("At 0, writing can sound flat and repetitive. A little randomness makes emails, stories and ideas sound natural.")];
        if (v <= 1.5) return [T(`At ${v} unlikely words get a real chance. Look at the bars: “moon” and “spaceship” are growing.`), S("So this is the creative setting?"), T("Yes: brainstorming, poems, names, jokes. But facts get less reliable.")];
        return [T(`At ${v} the chances are nearly flat. The model can pick almost any word.`), S("Is that why answers turn into nonsense?"), T("Exactly. Very high temperatures often drift off-topic or into gibberish. Try it once, then come back down.")];
      case "top_p":
        if (v <= 0.3) return [S("What does the p mean?"), T("p is short for probability, which just means chance."), T(`With p = ${v}, the model keeps words from the top of the list until their chances reach ${Math.round(v * 100)}%. Here that's only “mat”. Everything else is crossed out.`), S("So the answer becomes very safe?"), T("Yes. A small p leaves only one or two words to choose from.")];
        if (v < 1) return [S("What does the p mean?"), T("p is short for probability, which just means chance."), T(`With p = ${v}, the model keeps words from the top until their chances reach ${Math.round(v * 100)}%. Look at the bars: the rare words at the bottom are crossed out.`), S("Isn't that the same as temperature?"), T("Related, but different. Temperature changes everyone's chances; top-p just cuts off the unlikely words. Usually you change one or the other, not both.")];
        return [S("What does the p mean?"), T("p is short for probability, which just means chance."), T("p = 1 means keep 100% of the chance: nothing is cut, so top-p does nothing at all."), S("So why do apps use it?"), T("Many apps use about 0.9 to cut only the truly weird words while keeping variety.")];
      case "top_k":
        if (prov && !supports(P("top_k"), prov)) return [T((NOT_SUPPORTED.top_k[prov] || "This service doesn't offer top-k.") + " Use temperature or top-p instead.")];
        if (v === 1) return [S("What is k?"), T("k is just a number: how many words to keep."), T("With k = 1, only the single most likely word is allowed."), S("That sounds like temperature 0."), T("It behaves the same way: one choice, so the answer is fixed.")];
        return [S("What is k?"), T("k is just a number: how many words to keep."), T(`With k = ${v}, only the top ${v} words can be picked. Look at the bars: everything below word ${v} is crossed out.`), S("How is that different from top-p?"), T("Top-k always keeps the same number of words. Top-p keeps however many it takes to reach the chance p.")];
      case "max_tokens":
        if (prov) return [T(`${v} tokens is about ${Math.round(v * 0.75)} English words. If the answer needs more, it gets cut off.`)];
        return [T(`Max length ${v}: the answer may be at most ${v} tokens long. (In this picture each word counts as one token.)`), S(v < 75 ? "It stopped in the middle of a sentence!" : "So now it finished?"), T(v < 75 ? "Yes. The model doesn't plan ahead; it just stops when it hits the limit. Real apps then show a cut-off answer." : "Yes. The limit is a ceiling, not a target: the model stops when it's done, and you only pay for what it writes.")];
      case "stop":
        return v ? [T(`The model stops the moment it would write “${v}”. Those characters are not included.`), S("Why would I want that?"), T("To end answers cleanly at a marker. Here, “4.” stops a list after 3 items, even though we asked for 10.")]
          : [T("Type some text, such as “4.”, and watch where the list stops.")];
      case "frequency_penalty":
        if (prov === "anthropic") return [T(NOT_SUPPORTED.frequency_penalty.anthropic)];
        if (v < 0) return [T(`A negative value (${v}) makes words MORE likely the more they're used.`), S("Why would anyone want that?"), T("Rarely. Mostly it's a fun way to see the model loop and repeat itself.")];
        if (v === 0) return [T("0 means no penalty. This is the usual default."), S("What happens if I raise it?"), T("Each time a word is used, its chance drops a little more, so the model repeats itself less.")];
        if (v <= 1) return [T(`At ${v}, each time a word is used, its chance drops a little more.`), S("So it stops saying “very, very, very”?"), T("Exactly. A small value gently reduces repetition in long answers.")];
        return [T(`At ${v}, repeated words are punished hard.`), S("Is more always better?"), T("No. Too high, and the model even avoids normal words like “the”, so the writing gets odd. Stay under about 1.")];
      case "presence_penalty":
        if (prov === "anthropic") return [T(NOT_SUPPORTED.presence_penalty.anthropic)];
        if (v < 0) return [T(`A negative value (${v}) nudges the model to stay on words it has already used.`), S("So it stays focused?"), T("A bit, but it can get repetitive. It's rarely needed.")];
        if (v === 0) return [T("0 means no nudge. This is the usual default."), S("How is it different from the repeat penalty?"), T("The repeat penalty grows every time a word repeats. This one is a one-time push: once a word has appeared at all, it's slightly less likely.")];
        return [T(`At ${v}, any word already used gets a one-time push down, so the model reaches for new words and ideas.`), S("Good for brainstorming then?"), T("Yes. A list of ideas covers more ground. Too high, and it drifts off-topic.")];
      case "seed":
        if (prov === "anthropic") return [T(NOT_SUPPORTED.seed.anthropic)];
        return [T("Normally the model rolls dice for every word, so each run is a bit different."), S("And the seed?"), T(`The seed (here ${v}) fixes the dice. Same prompt, same settings, same seed: you should get the same answer again, even at a high temperature. Any number works; it just has to be the same each time.`)];
      case "thinking":
        return [T(`Thinking “${v}”: reasoning models can think privately, step by step, before they answer.`), S("Is more thinking always better?"), T(`It helps on hard problems like maths or planning, but it's slower and uses more tokens. Only reasoning models can do it; other models ignore it or give an error.${prov === "anthropic" ? " For Claude, thinking also switches off temperature and top-k." : ""}`)];
      case "system":
        return [T("The system prompt is the hidden instruction behind the conversation: the model's role, rules and style."), S("How is it different from my normal prompt?"), T("Your prompt is the question. The system prompt is the job description. With the pirate system prompt, even “What is machine learning?” gets a pirate answer.")];
    }
    return [];
  }

  /* ---------- Pictures for Part 1 ---------- */
  const NEXT = [["mat", 0.38], ["sofa", 0.18], ["floor", 0.14], ["chair", 0.1], ["windowsill", 0.07], ["roof", 0.05], ["keyboard", 0.04], ["moon", 0.02], ["spaceship", 0.01], ["banana", 0.01]];
  function chances(temp, topP, topK) {
    const probs = temp < 0.05 ? NEXT.map((_, i) => (i === 0 ? 1 : 0)) : (() => { const e = NEXT.map(([, p]) => Math.exp(Math.log(p) / temp)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); })();
    const keep = probs.map((_, i) => topK == null || i < topK);
    if (topP != null) { let acc = 0; probs.forEach((p, i) => { if (acc >= topP - 1e-9) keep[i] = false; acc += p; }); }
    const s = probs.reduce((a, p, i) => a + (keep[i] ? p : 0), 0) || 1;
    return probs.map((p, i) => ({ w: NEXT[i][0], p: keep[i] ? p / s : 0, cut: !keep[i] }));
  }
  const bars = (rows) => `<div class="pgchart"><p class="lbl">The model is writing: “The cat sat on the ___”</p><p class="crit" style="margin:0 0 6px">Chance of each next word:</p>${rows.map((x) => `<div class="pgbar ${x.cut ? "cut" : ""}"><span class="w">${esc(x.w)}</span><span class="track"><span class="fill" style="width:${(x.p * 100).toFixed(1)}%"></span></span><span class="pct">${x.cut ? "cut" : Math.round(x.p * 100) + "%"}</span></div>`).join("")}</div>`;
  const LONG = "Photosynthesis is how plants make their own food. They take in sunlight through their leaves, water through their roots and carbon dioxide from the air. Inside the leaves, a green substance called chlorophyll catches the light energy. The plant uses that energy to turn water and carbon dioxide into sugar, which it uses to grow. It also releases oxygen into the air, which is what we breathe.".split(" ");
  const LIST = ["1. Apple", "2. Banana", "3. Mango", "4. Orange", "5. Grapes", "6. Pear", "7. Peach", "8. Cherry", "9. Plum", "10. Kiwi"].join("\n");
  function picture(id, v) {
    if (id === "temperature") return bars(chances(v, null, null));
    if (id === "top_p") return bars(chances(1, v, null));
    if (id === "top_k") return bars(chances(1, null, v));
    if (id === "max_tokens") { const cut = v < LONG.length; return `<div class="pgchart"><p class="lbl">Question: “Explain how photosynthesis works.”</p><p class="pgtext">${esc(LONG.slice(0, v).join(" "))}${cut ? ' <span class="pgcut">… [cut off]</span>' : ""}</p><p class="crit" style="margin:0">${cut ? `Stopped at ${v} words: the answer needed ${LONG.length}.` : `Finished naturally after ${LONG.length} words.`}</p></div>`; }
    if (id === "stop") { const i = v ? LIST.indexOf(v) : -1; return `<div class="pgchart"><p class="lbl">Prompt: “List 10 fruits, numbered.”</p><pre class="pgtext">${i < 0 ? esc(LIST) : `${esc(LIST.slice(0, i))}<span class="pgcut">${esc(LIST.slice(i))}</span>`}</pre><p class="crit" style="margin:0">${i < 0 ? "The stop text never appears, so the whole list is written." : "The crossed-out part is never written."}</p></div>`; }
    return "";
  }

  /* ---------- State ---------- */
  const blankSlot = () => ({ p: "", m: "", v: {} });   // v[id] = value, or missing = model's default
  let st;
  try { st = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { st = null; }
  if (!st || !Array.isArray(st.slots)) st = { learn: "temperature", lv: {}, slots: [blankSlot(), blankSlot()], prompt: "Give me 5 names for a new coffee shop.", runs: 1, exp: -1 };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) {} };
  const learnVal = (p) => (st.lv[p.id] !== undefined ? st.lv[p.id] : (p.learn && p.learn.def !== undefined ? p.learn.def : p.def));
  const results = [], busy = { on: false };

  function resolveSlot(i) {
    const s = st.slots[i], avail = C() ? C().providersWithKeys() : [];
    if (!avail.length) return s;
    if (!avail.includes(s.p)) s.p = avail[0];
    const list = C().models(s.p);
    if (list && list.length && !list.some((m) => m.id === s.m)) { const pool = C().defaultModels(s.p); s.m = (pool[i] || pool[0] || list[0] || {}).id || ""; }
    return s;
  }
  const modelName = (s) => { const list = s.p && C() && C().models(s.p); const m = list && list.find((x) => x.id === s.m); return m ? m.name : s.m || "—"; };
  function sentParams(s) {
    const out = {};
    PARAMS.forEach((p) => { if (p.id === "system" || s.v[p.id] === undefined || !supports(p, s.p)) return; out[p.id] = p.id === "temperature" && s.p === "anthropic" ? Math.min(s.v[p.id], 1) : s.v[p.id]; });
    return out;
  }
  const summaryLine = (s) => { const e = Object.entries(sentParams(s)).map(([k, v]) => `${P(k).name.toLowerCase()} ${v}`); if (s.v.system) e.push("system prompt"); return e.length ? e.join(" · ") : "all settings on default"; };

  /* ---------- Ready-made experiments, each with what to notice ---------- */
  const EXPS = [
    { t: "Cold vs hot", d: "Temperature 0 vs 1.8, two runs each.", prompt: "Give me 5 names for a new coffee shop.", runs: 2, set: [{ temperature: 0 }, { temperature: 1.8 }],
      notice: "Model A (temperature 0) should give almost the same names in both runs. Model B (1.8) should give different, wilder names each time, maybe with odd words." },
    { t: "Cut off by max length", d: "Max length 40 vs 600 tokens.", prompt: "Explain how photosynthesis works.", runs: 1, set: [{ max_tokens: 40 }, { max_tokens: 600 }],
      notice: "Model A stops mid-sentence, and under it you'll see that it hit the max-length limit. Model B finishes its explanation." },
    { t: "Stop sequence", d: "Ask for 10 fruits, but stop at “4.” on model A.", prompt: "List 10 fruits as a numbered list, one per line.", runs: 1, set: [{ stop: "4." }, {}],
      notice: "Model A stops before item 4, so you only get 3 fruits. Model B lists all 10." },
    { t: "Repetition dial", d: "Repeat penalty −1.5 vs +1.5.", prompt: "Write a 120-word paragraph about cats.", runs: 1, set: [{ frequency_penalty: -1.5, max_tokens: 250 }, { frequency_penalty: 1.5, max_tokens: 250 }],
      notice: "Model A (−1.5) tends to repeat words like “cats” again and again, or even loop. Model B (+1.5) avoids repeats and may reach for unusual words." },
    { t: "Same seed, same answer?", d: "Temperature 1.2, with and without a seed, two runs each.", prompt: "Write a one-sentence story about a dragon.", runs: 2, set: [{ temperature: 1.2, seed: 42 }, { temperature: 1.2 }],
      notice: "Model A's two runs (same seed) should match or be very close. Model B's two runs should differ. If A's don't match exactly, that's normal: services only promise “mostly” the same." },
    { t: "System prompt", d: "A pirate system prompt on model A only.", prompt: "What is machine learning?", runs: 1, set: [{ system: "You are a cheerful pirate. Answer in one sentence, in pirate speak." }, {}],
      notice: "Model A answers like a pirate; Model B answers normally. Same question, different hidden instructions." },
  ];
  function applyExp(i) {
    const e = EXPS[i];
    resolveSlot(0);
    const base = st.slots[0];
    st.slots = e.set.map((v) => ({ p: base.p, m: base.m, v: Object.assign({}, v) }));
    st.prompt = e.prompt; st.runs = e.runs; st.exp = i; results.length = 0; save(); render();
    const r = root && root.querySelector("#pgtry"); if (r) r.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Part 1: Learn the dials ---------- */
  const talkHTML = (lines) => `<div class="pgtalk">${lines.map(([who, txt]) => `<p class="${who === "T" ? "t" : "s"}"><b>${who === "T" ? "Teacher" : "Student"}</b>${esc(txt)}</p>`).join("")}</div>`;
  function learnControl(p, v) {
    if (p.type === "text") return `<input type="text" data-pglv="${p.id}" value="${esc(v)}" placeholder="e.g. 4.">`;
    if (p.type === "number") return `<input type="number" data-pglv="${p.id}" value="${esc(v)}" min="0" step="1">`;
    if (p.type === "choice") return `<select data-pglv="${p.id}">${p.choices.map((c) => `<option ${c === v ? "selected" : ""}>${c}</option>`).join("")}</select>`;
    if (p.type === "system") return `<textarea data-pglv="${p.id}" rows="2">${esc(v)}</textarea>`;
    const L = Object.assign({ min: p.min, max: p.max, step: p.step }, p.learn || {});
    return `<input type="range" data-pglv="${p.id}" min="${L.min}" max="${L.max}" step="${L.step}" value="${v}"><b class="pgbig" id="pglval">${v}</b>`;
  }
  function learnHTML() {
    const p = P(st.learn) || PARAMS[0], v = learnVal(p), idx = PARAMS.indexOf(p);
    const works = C() ? ALL.filter((x) => supports(p, x)).map(provName) : [];
    return `<div class="pgchips" role="tablist">${PARAMS.map((x, i) => `<button role="tab" class="pgchip ${x === p ? "on" : ""}" aria-selected="${x === p}" data-pglearn="${x.id}"><span>${i + 1}</span>${esc(x.name)}</button>`).join("")}</div>
      <div class="pglesson">
        <div class="pglhead"><h3>${esc(p.name)}</h3><code>${esc(p.api)}</code></div>
        <p class="pgwhat">${esc(p.what)}</p>
        <div class="pgctl">${learnControl(p, v)}</div>
        <div class="pglgrid"><div id="pglpic">${picture(p.id, v)}</div><div id="pgltalk">${talkHTML(talk(p.id, v, ""))}</div></div>
        ${works.length && works.length < ALL.length ? `<p class="crit">Works on: ${esc(works.join(", "))}.</p>` : ""}
        <div class="btnrow">${idx > 0 ? `<button class="btn sm" data-pglearn="${PARAMS[idx - 1].id}">← ${esc(PARAMS[idx - 1].name)}</button>` : ""}${idx < PARAMS.length - 1 ? `<button class="btn sm primary" data-pglearn="${PARAMS[idx + 1].id}">Next: ${esc(PARAMS[idx + 1].name)} →</button>` : `<a class="btn sm primary" href="#pgtry" data-pgjump>Now try it for real ↓</a>`}</div>
      </div>`;
  }

  /* ---------- Part 2: Try it for real ---------- */
  function setRow(i, s, p) {
    const on = s.v[p.id] !== undefined, v = on ? s.v[p.id] : p.def, key = `${i}:${p.id}`;
    const q = `<button class="pgq" data-pglearn="${p.id}" data-pgjumpup title="What is ${esc(p.name)}?">?</button>`;
    if (!supports(p, s.p)) return `<div class="pgset na"><span class="pgsname">${esc(p.name)} ${q}</span><span class="crit">Not offered by ${esc(provName(s.p))}</span></div>`;
    let ctl;
    if (p.type === "text") ctl = `<input type="text" data-pgsv="${key}" value="${on ? esc(v) : ""}" placeholder="none">`;
    else if (p.type === "number") ctl = `<input type="number" data-pgsv="${key}" value="${on ? esc(v) : ""}" placeholder="none" min="0" step="1">`;
    else if (p.type === "choice") ctl = `<select data-pgsv="${key}"><option value="">default</option>${p.choices.map((c) => `<option ${on && c === v ? "selected" : ""}>${c}</option>`).join("")}</select>`;
    else if (p.type === "system") ctl = `<textarea data-pgsv="${key}" rows="2" placeholder="none">${on ? esc(v) : ""}</textarea>`;
    else { const max = p.id === "temperature" && s.p === "anthropic" ? 1 : p.max; ctl = `<input type="range" data-pgsv="${key}" min="${p.min}" max="${max}" step="${p.step}" value="${Math.min(v, max)}"><span class="pgsval">${on ? v : "default"}</span>`; }
    return `<div class="pgset ${on ? "on" : ""} ${p.type === "system" ? "wide" : ""}"><span class="pgsname">${esc(p.name)} ${q}<button class="pgreset" data-pgdef="${key}" title="Back to the model's default">↺ default</button></span><span class="pgsctl">${ctl}</span></div>`;
  }
  function tryHTML() {
    const avail = C().providersWithKeys();
    if (!avail.length) return `<div class="card2 pgstart"><h3>You need a free key first</h3>
        <p>A key is like a password that lets this page send your prompt to an AI company. The quickest free one is OpenRouter:</p>
        <ol><li>Open <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys ↗</a> and sign in (a Google account works).</li><li>Click <b>Create key</b>, give it any name, and copy the key.</li><li>Paste it into the <b>OpenRouter</b> box below and press <b>Check</b>.</li></ol>
        <p class="crit" style="margin:0">Your key stays in this browser only. It never goes to your teacher or this course.</p></div>${C().keysPanel()}`;
    st.slots.forEach((_, i) => resolveSlot(i));
    const e = EXPS[st.exp];
    return `${C().keysPanel()}
      <div class="card2"><p class="kicker">Ready-made experiments</p><p class="crit">Pick one: it fills in the prompt and the settings for you. Then press Run.</p>
        <div class="pgexps">${EXPS.map((x, i) => `<button class="pgexp ${i === st.exp ? "on" : ""}" data-pgexp="${i}"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></button>`).join("")}</div></div>
      <div class="card2"><p class="kicker">Your prompt</p><textarea id="pgprompt" rows="2" aria-label="Your prompt">${esc(st.prompt)}</textarea></div>
      <div class="pgmodels">${st.slots.map((s, i) => { const list = C().models(s.p), pool = s.p === "openrouter" && list && list.length ? C().defaultModels(s.p).slice(0, 5) : [];
        const opt = (m) => `<option value="${esc(m.id)}" ${m.id === s.m ? "selected" : ""}>${esc(m.name)}${m.free ? " · free" : ""}</option>`;
        return `<div class="card2 pgmodel">
          <div class="pgmhead"><b>Model ${"ABC"[i]}</b>${st.slots.length > 1 ? `<button class="linkish" data-pgremove="${i}">Remove</button>` : ""}</div>
          <label class="pgfield">Service<select data-pgprov="${i}">${avail.map((p) => `<option value="${p}" ${p === s.p ? "selected" : ""}>${esc(provName(p))}</option>`).join("")}</select></label>
          <label class="pgfield">Model<select data-pgmodel="${i}">${!list ? `<option>Loading models…</option>` : !list.length ? `<option>No models: check your key above</option>` : pool.length ? `<optgroup label="Suggested">${pool.map(opt).join("")}</optgroup><optgroup label="All models">${list.filter((m) => !pool.includes(m)).map(opt).join("")}</optgroup>` : list.map(opt).join("")}</select></label>
          <p class="lbl" style="margin:8px 0 2px">Settings</p><p class="crit" style="margin:0 0 6px">Everything starts on the model's own default. Move a setting to change it.</p>
          <div class="pgsets">${PARAMS.map((p) => setRow(i, s, p)).join("")}</div>
        </div>`; }).join("")}
        ${st.slots.length < 3 ? `<button class="pgadd" data-pgadd>+ Add a model</button>` : ""}</div>
      <div class="card2"><div class="btnrow" style="margin:0;align-items:center"><button class="btn primary" data-pgrun ${busy.on ? "disabled" : ""}>${busy.on ? "Running…" : "Run all models"}</button>
        <label class="cmpremember">Runs per model <select id="pgruns">${[1, 2, 3].map((n) => `<option ${n === st.runs ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <span class="crit">Run twice to see how much answers change.</span></div>
        ${e ? `<div class="pgnotice"><b>What to notice</b>${esc(e.notice)}</div>` : ""}
        <div class="pgresults">${st.slots.map((s, i) => `<div class="cmpcard"><div class="cmphead"><b>Model ${"ABC"[i]}: ${esc(modelName(s))}</b><span>${esc(summaryLine(s))}</span></div>
          ${(results[i] || []).map((r, j) => `<div class="pgrun"><p class="lbl">Run ${j + 1}${r.pending ? "" : r.err ? " · error" : ` · ${(r.ms / 1000).toFixed(1)} s${r.usage ? " · " + esc(r.usage) : ""}`}</p>
            <div class="cmpout">${r.pending ? `<span class="crit">Thinking…</span>` : r.err ? `<span class="err">${esc(r.err)}</span>` : esc(r.text || "(empty answer)")}</div>
            ${r.pending || r.err ? "" : `<p class="crit pgfinish">Why it stopped: ${esc(finishText(r.finish))}</p><details class="pgreq"><summary>Show the request that was sent</summary><pre>${esc(JSON.stringify(r.body, null, 2))}</pre></details>`}</div>`).join("") || `<p class="crit" style="padding:10px;margin:0">No answers yet.</p>`}</div>`).join("")}</div>
      </div>`;
  }
  function finishText(f) {
    const x = String(f || "").toLowerCase();
    if (/length|max_tokens/.test(x)) return "it hit the max-length limit, so the answer was cut off.";
    if (/stop_sequence/.test(x)) return "it reached your stop sequence.";
    if (/safety|content_filter|recitation/.test(x)) return "a safety filter blocked or stopped it.";
    if (/stop|end_turn/.test(x)) return "it finished naturally (or reached your stop sequence).";
    return x ? x : "not reported by this service.";
  }
  function html() {
    if (!C()) return "";
    return `<section class="m2sec" style="max-width:none">
      <header><p class="kicker">Hands-on lab</p><h2>Model playground</h2>
        <p>When an app sends your prompt to an AI model, it also sends a few <b>settings</b> that change how the model answers. This page has two parts:</p>
        <ol class="pgsteps"><li><b>Learn the dials.</b> Move one setting at a time and see what it does. No key needed.</li><li><b>Try it for real.</b> Send a prompt to real AI models with your own settings and compare the answers. Needs a free key.</li></ol></header>
      <h3 class="pgpart"><span>1</span> Learn the dials</h3>
      <div class="card2" id="pglearn">${learnHTML()}</div>
      <h3 class="pgpart" id="pgtry"><span>2</span> Try it for real</h3>
      ${tryHTML()}
    </section>`;
  }

  /* ---------- Running ---------- */
  async function runAll() {
    const prompt = st.prompt.trim(); if (!prompt || busy.on) return;
    busy.on = true; results.length = 0;
    st.slots.forEach((s, i) => { results[i] = Array.from({ length: st.runs }, () => ({ pending: true })); });
    render();
    await Promise.all(st.slots.map((s, i) => (async () => {
      for (let j = 0; j < st.runs; j++) {
        try { Object.assign(results[i][j], await C().callModel(s.p, s.m, { prompt, system: String(s.v.system || "").trim(), params: sentParams(s) }), { pending: false }); }
        catch (err) { Object.assign(results[i][j], { pending: false, err: C().friendly(err, s.p) + (err && err.status === 400 ? " Tip: this model may not accept one of your settings. Set it back to default (↺) and try again." : "") }); }
        render();
      }
    })()));
    busy.on = false; render();
  }

  /* ---------- Rendering and events ---------- */
  let root = null, bound = false;
  function render() {
    const sec = root && root.querySelector("#pgsection");
    if (!sec) return;
    const y = window.scrollY, a = document.activeElement, focusKey = a && (a.id || (a.dataset && (a.dataset.pgsv || a.dataset.pglv))), kp = sec.querySelector(".cmpkeys"), open = kp ? kp.open : null;
    sec.innerHTML = html();
    const nk = sec.querySelector(".cmpkeys"); if (nk && open !== null) nk.open = open;
    if (focusKey) { const el = document.getElementById(focusKey) || sec.querySelector(`[data-pgsv="${focusKey}"],[data-pglv="${focusKey}"]`); if (el && el.type !== "range") { el.focus(); if (el.setSelectionRange && el.type !== "number") el.setSelectionRange(el.value.length, el.value.length); } }
    window.scrollTo(0, y);
  }
  function renderLearn() { const el = root.querySelector("#pglearn"); if (el) el.innerHTML = learnHTML(); }
  function updateLearn(p, v) {
    const val = root.querySelector("#pglval"); if (val) val.textContent = v;
    const pic = root.querySelector("#pglpic"); if (pic) pic.innerHTML = picture(p.id, v);
    const tk = root.querySelector("#pgltalk"); if (tk) tk.innerHTML = talkHTML(talk(p.id, v, ""));
  }
  function updateSet(el, i, p) {
    const s = st.slots[i], row = el.closest(".pgset"), on = s.v[p.id] !== undefined;
    if (row) row.classList.toggle("on", on);
    const sv = row && row.querySelector(".pgsval"); if (sv) sv.textContent = on ? s.v[p.id] : "default";
    const sum = root.querySelectorAll(".cmphead span")[i]; if (sum) sum.textContent = summaryLine(s);
  }
  function bind() {
    if (bound) return; bound = true;
    const mine = () => !!root.querySelector("#pgsection");
    root.addEventListener("input", (e) => {
      if (!mine()) return;
      const d = e.target.dataset || {};
      if (e.target.id === "pgprompt") { st.prompt = e.target.value; st.exp = -1; save(); return; }
      if (d.pglv) { const p = P(d.pglv), v = p.type && p.type !== "number" ? e.target.value : Number(e.target.value); st.lv[p.id] = v; save(); updateLearn(p, v); return; }
      if (d.pgsv) {
        const [i, id] = d.pgsv.split(":"), p = P(id), s = st.slots[+i], raw = e.target.value;
        if (p.type && p.type !== "number" ? raw === "" : raw === "") delete s.v[id]; else s.v[id] = p.type && p.type !== "number" ? raw : Number(raw);
        st.exp = -1; save(); updateSet(e.target, +i, p);
      }
    });
    root.addEventListener("change", (e) => {
      if (!mine()) return;
      const d = e.target.dataset || {};
      if (d.pgprov) { st.slots[+d.pgprov].p = e.target.value; st.slots[+d.pgprov].m = ""; save(); render(); return; }
      if (d.pgmodel) { st.slots[+d.pgmodel].m = e.target.value; save(); render(); return; }
      if (e.target.id === "pgruns") { st.runs = +e.target.value; save(); return; }
      if (d.pgsv && e.target.tagName === "SELECT") { const [i, id] = d.pgsv.split(":"); updateSet(e.target, +i, P(id)); }
    });
    root.addEventListener("click", (e) => {
      if (!mine()) return;
      const t = e.target.closest("[data-pglearn],[data-pgjump],[data-pgdef],[data-pgremove],[data-pgadd],[data-pgrun],[data-pgexp]"); if (!t) return;
      const d = t.dataset;
      if (d.pglearn) { e.preventDefault(); st.learn = d.pglearn; save(); renderLearn(); if (d.pgjumpup !== undefined || t.closest(".pglesson")) root.querySelector("#pglearn").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if (d.pgjump !== undefined) { e.preventDefault(); root.querySelector("#pgtry").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if (d.pgdef) { const [i, id] = d.pgdef.split(":"); delete st.slots[+i].v[id]; st.exp = -1; }
      else if (d.pgremove !== undefined) { st.slots.splice(+d.pgremove, 1); results.splice(+d.pgremove, 1); }
      else if (d.pgadd !== undefined) { const s = blankSlot(); s.p = st.slots[0].p; st.slots.push(s); }
      else if (d.pgrun !== undefined) { runAll(); return; }
      else if (d.pgexp !== undefined) { applyExp(+d.pgexp); return; }
      save(); render();
    });
  }
  function mount(el) {
    root = el; bind();
    if (C()) { C().mount(el, []); C().onChange(() => { const a = document.activeElement; if (root && root.querySelector("#pgsection") && !busy.on && !(a && a.dataset && (a.dataset.cmpkey || a.dataset.pgsv || a.dataset.pglv)) && a.id !== "pgprompt") render(); }); }
  }

  window.WB_PLAY = { html: () => `<div id="pgsection">${html()}</div>`, mount };
})();
