// Module 2, "Model playground" tab: pick up to three models (using the student's own keys from m2-compare.js),
// give each model its own settings (temperature, top-p, top-k, max tokens, penalties, stop, seed, thinking, system prompt),
// and run the same prompt in all of them. As each control moves, a Teacher and a Student explain what it does at that value,
// and a live chart shows which next words the settings still allow. Module 2 calls WB_PLAY.html() and WB_PLAY.mount(root).
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const C = () => window.WB_CMP;
  const STORE = "wb-pg-state";

  /* ---------- The settings, with what each provider supports ---------- */
  const ALL = ["openrouter", "openai", "gemini", "anthropic", "groq", "huggingface", "mistral"], COMPAT = ["groq", "huggingface", "mistral"];
  const PARAMS = [
    { id: "temperature", label: "Temperature", min: 0, max: 2, step: 0.1, def: 1, on: true, prov: ALL, visual: true },
    { id: "top_p", label: "Top-p (p = how much of the chance to keep)", min: 0.05, max: 1, step: 0.05, def: 0.9, prov: ALL, visual: true },
    { id: "top_k", label: "Top-k (k = how many words to keep)", min: 1, max: 50, step: 1, def: 5, prov: ["openrouter", "gemini", "anthropic"], visual: true },
    { id: "max_tokens", label: "Max output tokens", min: 16, max: 2000, step: 16, def: 400, on: true, prov: ALL },
    { id: "frequency_penalty", label: "Frequency penalty", min: -2, max: 2, step: 0.1, def: 0.5, prov: ["openrouter", "openai", "gemini", ...COMPAT] },
    { id: "presence_penalty", label: "Presence penalty", min: -2, max: 2, step: 0.1, def: 0.5, prov: ["openrouter", "openai", "gemini", ...COMPAT] },
    { id: "stop", label: "Stop sequence", type: "text", def: "", prov: ALL },
    { id: "seed", label: "Seed", type: "number", def: 42, prov: ["openrouter", "openai", "gemini", ...COMPAT] },
    { id: "thinking", label: "Thinking (reasoning effort)", type: "choice", choices: ["low", "medium", "high"], def: "low", prov: ALL },
  ];
  const NOT_SUPPORTED = {
    top_k: { openai: "OpenAI's API doesn't offer top-k. Use temperature or top-p instead." },
    frequency_penalty: { anthropic: "Claude's API doesn't use penalties. It avoids repetition in other ways." },
    presence_penalty: { anthropic: "Claude's API doesn't use penalties. It avoids repetition in other ways." },
    seed: { anthropic: "Claude's API doesn't offer a seed, so repeated runs can always differ a little." },
  };

  /* ---------- What the Teacher and the Student say at each value ---------- */
  const T = (t) => ["T", t], S = (t) => ["S", t];
  function talk(id, v, prov) {
    switch (id) {
      case "temperature":
        if (prov === "anthropic" && v > 1) return [T("Claude only accepts temperatures from 0 to 1, so this will be sent as 1."), S("So Claude's 'hottest' is about a normal setting elsewhere?"), T("Roughly, yes. Each company scales it a little differently.")];
        if (v === 0) return [T("At 0 the model always picks the single most likely next word. No dice are rolled."), S("So if I ask the same thing twice, I get the same answer?"), T("Almost word for word. Use this for facts, maths, code and pulling data out of text.")];
        if (v <= 0.5) return [T(`At ${v} the model sticks closely to the most likely words, with just a little variety.`), S("Is that good for my homework summary?"), T("Yes. Low temperature means focused, predictable and less risky. Great for summaries and answers you need to rely on.")];
        if (v <= 1.0) return [T(`${v} is the balanced zone, close to most apps' default. Likely words win most of the time, but the model sometimes surprises you.`), S("Why not always use 0 then, to be safe?"), T("At 0, writing can sound flat and repetitive. A bit of randomness makes emails, stories and ideas sound natural.")];
        if (v <= 1.5) return [T(`At ${v} unlikely words get a real chance. Look at the chart: 'moon' and 'spaceship' are growing.`), S("So this is the creative setting?"), T("Yes: brainstorming, poems, names, jokes. But facts get less reliable, so don't use it for anything you need to be true.")];
        return [T(`At ${v} the chances are nearly flattened. The model can pick almost any word.`), S("Is that why answers can turn into nonsense?"), T("Exactly. Very high temperatures often drift off-topic or into gibberish. Try it once to see, then come back down.")];
      case "top_p":
        return [S("What does the p in top-p mean?"), T("Before each word, the model lists the words that could come next, most likely first, each with a chance. p means probability (chance). Top-p keeps words from the top of that list until their chances add up to p, and throws the rest away.")].concat(topP(v));
      case "top_k":
        if (!PARAMS[2].prov.includes(prov)) return [T(NOT_SUPPORTED.top_k[prov] || "This service doesn't offer top-k. Use temperature or top-p instead.")];
        return [S("And what is k?"), T("k is just a number. The model lists the words that could come next, most likely first, and top-k keeps only the first k words on that list.")].concat(topK(v));
    }
    return talkRest(id, v, prov);
  }
  function topP(v) {
    if (v <= 0.3) return [T(`Top-p ${v}: the model keeps only the few most likely words whose chances add up to ${Math.round(v * 100)}%, and throws the rest away.`), S("So 'banana' can never be chosen now?"), T("Right. With such a small p, often just one or two words are left, so answers become very safe and similar.")];
    if (v < 0.9) return [T(`Top-p ${v} keeps the most likely words until they cover ${Math.round(v * 100)}% of the chance, then picks among those.`), S("Isn't that the same as temperature?"), T("Related, but different. Temperature reshapes everyone's chances; top-p cuts off the long tail of unlikely words. Usually you change one or the other, not both.")];
    return [T(`Top-p ${v} keeps almost every word in play and only cuts off the very rarest ones.`), S("So at 1.0 it does nothing?"), T("Exactly. 1.0 means 'no cut'. Many apps use about 0.9 to stop truly weird words while keeping variety.")];
  }
  function topK(v) {
    if (v === 1) return [T("Top-k 1 means only the single most likely word is allowed."), S("That sounds like temperature 0."), T("It behaves the same way: one choice, so the answer is fixed.")];
    if (v <= 10) return [T(`Top-k ${v}: only the ${v} most likely words are allowed at each step. See the chart: everything after word ${v} is greyed out.`), S("Why use a fixed number instead of top-p?"), T("It's simpler, but less smart: sometimes the top 5 words are all good, sometimes only 1 is. Top-p adapts to that; top-k doesn't.")];
    return [T(`Top-k ${v} allows a large list of candidates, so it barely limits the model.`), S("So big numbers mean more variety?"), T("Yes. A large k only removes very rare words. Temperature then decides how adventurous the choice is.")];
  }
  function talkRest(id, v, prov) {
    switch (id) {
      case "max_tokens": {
        const words = Math.round(v * 0.75);
        return [T(`Max ${v} tokens is about ${words} English words. That's the longest the answer is allowed to be.`), S(v < 100 ? "What happens if the answer needs more?" : "Will a bigger number give me a better answer?"),
          T(v < 100 ? "It gets cut off mid-sentence. You'll see 'Why it stopped: hit the max-tokens limit' under the answer. Try it on a long question!" : "No, it's a ceiling, not a target. The model stops when it's done; you only pay for the tokens it actually writes. Set it high enough not to cut the answer short.")];
      }
      case "frequency_penalty":
        if (prov === "anthropic") return [T(NOT_SUPPORTED.frequency_penalty.anthropic)];
        if (v < 0) return [T(`A negative frequency penalty (${v}) makes words more likely the more they've been used.`), S("Why would anyone want more repetition?"), T("Rarely. Maybe for chants, slogans or keeping one key term consistent. Mostly it's a fun way to see the model loop and repeat itself.")];
        if (v === 0) return [T("0 means no penalty: words are judged only on how well they fit."), S("So it's 'off'?"), T("Yes, and that's the usual default.")];
        if (v <= 1) return [T(`Frequency penalty ${v}: each time a word is used, its chance drops a little more.`), S("So it stops saying 'very, very, very'?"), T("Exactly. A small positive value gently reduces repeated words and phrases in long answers.")];
        return [T(`At ${v} repeated words are punished hard.`), S("Is more always better?"), T("No. Too high and the model avoids even normal words like 'the' or the topic's own name, so writing gets odd. Stay under about 1.")];
      case "presence_penalty":
        if (prov === "anthropic") return [T(NOT_SUPPORTED.presence_penalty.anthropic)];
        if (v < 0) return [T(`A negative presence penalty (${v}) nudges the model to stay on words and ideas it has already used.`), S("So it stays more focused?"), T("A bit, yes, but it can also get repetitive. It's rarely needed.")];
        if (v === 0) return [T("0 means no presence penalty, which is the usual default."), S("What's the difference from the frequency penalty?"), T("Frequency grows each time a word repeats. Presence is a one-time nudge: as soon as a word has appeared at all, it gets the same small penalty.")];
        return [T(`Presence penalty ${v}: any word already used gets a one-time penalty, pushing the model towards new words and new ideas.`), S("Good for brainstorming then?"), T("Yes. It helps a list of ideas cover more ground instead of circling the same theme. Too high, and it drifts off-topic.")];
      case "stop":
        return v ? [T(`The model will stop the moment it writes "${v}". Those characters themselves are not included in the answer.`), S("How would I use that?"), T("Ask for 'a numbered list of 10 fruits' and set the stop sequence to '4.'. You'll get exactly 3 items. Apps use stop sequences to end answers cleanly at a marker.")]
          : [T("A stop sequence is text that makes the model stop immediately when it writes it."), S("What should I type?"), T("Try '4.' with a numbered-list prompt, or a blank line. Type it in the box, then run.")];
      case "seed":
        if (prov === "anthropic") return [T(NOT_SUPPORTED.seed.anthropic)];
        return [T(`Seed ${v} fixes the model's 'dice'. With the same prompt, settings and seed, you should get the same answer again, even at a high temperature.`), S("Then why does it sometimes still change?"), T("Providers only promise 'mostly' repeatable results: their servers and model versions can change. Seeds are handy for testing and for comparing settings fairly.")];
      case "thinking":
        return [T(`Thinking "${v}": reasoning models can think privately before answering. More thinking usually means better answers on hard, multi-step problems.`), S("Do I get to see the thinking?"), T(`Usually not, but you pay for it in tokens and time. It only works on reasoning models; other models will ignore it or return an error, which is a good lesson too.${prov === "anthropic" ? " For Claude, turning thinking on also turns off temperature and top-k." : ""}`)];
      case "system":
        return [T("The system prompt is the hidden instruction behind the whole conversation: the model's role, rules and style."), S("How is that different from my normal prompt?"), T("Your prompt is the question. The system prompt is the job description. Try 'Answer like a pirate in one sentence' and run the same question.")];
    }
    return [];
  }

  /* ---------- The next-word chart: what the current temperature, top-k and top-p allow ---------- */
  const NEXT = [["mat", 0.38], ["sofa", 0.18], ["floor", 0.14], ["chair", 0.1], ["windowsill", 0.07], ["roof", 0.05], ["keyboard", 0.04], ["moon", 0.02], ["spaceship", 0.01], ["banana", 0.01]];
  function allowed(prm, prov) {
    const tOn = prm.temperature && prm.temperature.on, kOn = prm.top_k && prm.top_k.on && PARAMS[2].prov.includes(prov), pOn = prm.top_p && prm.top_p.on;
    let T0 = tOn ? Number(prm.temperature.v) : 1;
    if (prov === "anthropic") T0 = Math.min(T0, 1);
    let probs = T0 < 0.05 ? NEXT.map((_, i) => (i === 0 ? 1 : 0)) : (() => { const e = NEXT.map(([, p]) => Math.exp(Math.log(p) / T0)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); })();
    const keep = probs.map(() => true);
    if (kOn) probs.forEach((_, i) => { if (i >= Number(prm.top_k.v)) keep[i] = false; });
    if (pOn) { let acc = 0; probs.forEach((p, i) => { if (!keep[i]) return; if (acc >= Number(prm.top_p.v) - 1e-9) keep[i] = false; acc += p; }); }
    const s = probs.reduce((a, p, i) => a + (keep[i] ? p : 0), 0) || 1;
    return probs.map((p, i) => ({ w: NEXT[i][0], p: keep[i] ? p / s : 0, cut: !keep[i] }));
  }
  const chart = (prm, prov) => `<div class="pgchart"><p class="lbl">“The cat sat on the ___”: chances with these settings</p>${allowed(prm, prov).map((x) => `<div class="pgbar ${x.cut ? "cut" : ""}"><span class="w">${esc(x.w)}</span><span class="track"><span class="fill" style="width:${(x.p * 100).toFixed(1)}%"></span></span><span class="pct">${x.cut ? "cut" : Math.round(x.p * 100) + "%"}</span></div>`).join("")}</div>`;

  /* ---------- State ---------- */
  const freshParams = () => Object.fromEntries(PARAMS.map((p) => [p.id, { on: !!p.on, v: p.def }]));
  const blankSlot = () => ({ p: "", m: "", params: freshParams(), system: "" });
  let st;
  try { st = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { st = null; }
  if (!st || !Array.isArray(st.slots)) st = { slots: [blankSlot(), blankSlot()], edit: 0, prompt: "Give me 5 names for a new coffee shop.", runs: 1 };
  st.slots.forEach((s) => { const f = freshParams(); s.params = Object.assign(f, s.params || {}); if (s.system == null) s.system = ""; });
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) {} };
  const results = [], busy = { on: false };

  function resolveSlot(i) {
    const s = st.slots[i], avail = C() ? C().providersWithKeys() : [];
    if (!avail.length) return s;
    if (!avail.includes(s.p)) s.p = avail[0];
    const list = C().models(s.p);
    if (list && !list.some((m) => m.id === s.m)) { const pool = C().defaultModels(s.p); s.m = (pool[i] || pool[0] || list[0] || {}).id || ""; }
    return s;
  }
  const modelName = (s) => { const list = s.p && C() && C().models(s.p); const m = list && list.find((x) => x.id === s.m); return m ? m.name : s.m || "—"; };
  const sentParams = (s) => Object.fromEntries(PARAMS.filter((p) => s.params[p.id].on && p.prov.includes(s.p) && !(NOT_SUPPORTED[p.id] || {})[s.p]).map((p) => [p.id, p.type === "number" || p.type === undefined ? Number(s.params[p.id].v) : s.params[p.id].v]).map(([k, v]) => [k, k === "temperature" && s.p === "anthropic" ? Math.min(v, 1) : v]));
  const summaryLine = (s) => { const e = Object.entries(sentParams(s)); return e.length ? e.map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(" · ") : "all defaults"; };

  /* ---------- Guided experiments ---------- */
  const EXPS = [
    { t: "Cold vs hot", d: "Same model, temperature 0 vs 1.8, run twice each. Which one changes between runs?", prompt: "Give me 5 names for a new coffee shop.", runs: 2, set: [{ temperature: 0 }, { temperature: 1.8 }] },
    { t: "Cut off by max tokens", d: "Max tokens 40 vs 600 on a question that needs a long answer.", prompt: "Explain how photosynthesis works.", runs: 1, set: [{ max_tokens: 40 }, { max_tokens: 600 }] },
    { t: "Stop sequence", d: "Ask for 10 items but stop at \"4.\" on model A.", prompt: "List 10 fruits as a numbered list, one per line.", runs: 1, set: [{ stop: "4." }, {}] },
    { t: "Repetition dial", d: "Frequency penalty −1.5 vs +1.5 on a long description.", prompt: "Write a 120-word paragraph about cats.", runs: 1, set: [{ frequency_penalty: -1.5, max_tokens: 250 }, { frequency_penalty: 1.5, max_tokens: 250 }] },
    { t: "Same seed, same answer?", d: "Temperature 1.2 with seed 42 on both runs, vs no seed.", prompt: "Write a one-sentence story about a dragon.", runs: 2, set: [{ temperature: 1.2, seed: 42 }, { temperature: 1.2 }] },
    { t: "System prompt", d: "Model A gets a pirate system prompt; model B gets none.", prompt: "What is machine learning?", runs: 1, set: [{ system: "You are a cheerful pirate. Answer in one short sentence, in pirate speak." }, {}] },
  ];
  function applyExp(i) {
    const e = EXPS[i];
    resolveSlot(0);
    const base = { p: st.slots[0].p, m: st.slots[0].m };
    st.slots = e.set.map((over) => {
      const s = { p: base.p, m: base.m, params: freshParams(), system: over.system || "" };
      Object.entries(over).forEach(([k, v]) => { if (k !== "system") s.params[k] = { on: true, v }; });
      return s;
    });
    st.prompt = e.prompt; st.runs = e.runs; st.edit = 0; results.length = 0; save(); render();
  }

  /* ---------- HTML ---------- */
  const talkHTML = (lines) => `<div class="pgtalk">${lines.map(([who, txt]) => `<p class="${who === "T" ? "t" : "s"}"><b>${who === "T" ? "Teacher" : "Student"}</b>${esc(txt)}</p>`).join("")}</div>`;
  function paramRow(s, p) {
    const ps = s.params[p.id], unsupported = !p.prov.includes(s.p) || (NOT_SUPPORTED[p.id] || {})[s.p];
    const max = p.id === "temperature" && s.p === "anthropic" ? 1 : p.max;
    let ctl;
    if (p.type === "text") ctl = `<input type="text" data-pgv="${p.id}" value="${esc(ps.v)}" placeholder="e.g. 4." ${ps.on && !unsupported ? "" : "disabled"}>`;
    else if (p.type === "number") ctl = `<input type="number" data-pgv="${p.id}" value="${esc(ps.v)}" min="0" step="1" ${ps.on && !unsupported ? "" : "disabled"}>`;
    else if (p.type === "choice") ctl = `<select data-pgv="${p.id}" ${ps.on && !unsupported ? "" : "disabled"}>${p.choices.map((c) => `<option ${c === ps.v ? "selected" : ""}>${c}</option>`).join("")}</select>`;
    else ctl = `<input type="range" class="slider" data-pgv="${p.id}" min="${p.min}" max="${max}" step="${p.step}" value="${Math.min(ps.v, max)}" ${ps.on && !unsupported ? "" : "disabled"}><span class="pgval" id="pgval-${p.id}">${Math.min(ps.v, max)}</span>`;
    return `<div class="pgrow ${unsupported ? "off" : ""}" id="pgrow-${p.id}">
      <div class="pghead"><label class="pgsend"><input type="checkbox" data-pgon="${p.id}" ${ps.on && !unsupported ? "checked" : ""} ${unsupported ? "disabled" : ""}> <b>${esc(p.label)}</b></label>
        <span class="crit">${unsupported ? "Not available for " + esc(C().providers[s.p] ? C().providers[s.p].name : "this provider") : ps.on ? "Sent to the model" : "Off: model uses its own default"}</span></div>
      <div class="pgctl">${ctl}</div>
      <div id="pgtalk-${p.id}">${talkHTML(unsupported ? [T((NOT_SUPPORTED[p.id] || {})[s.p] || "This provider doesn't support this setting.")] : talk(p.id, p.type === "number" || !p.type ? Number(ps.v) : ps.v, s.p))}</div>
    </div>`;
  }
  function html() {
    if (!C()) return "";
    const avail = C().providersWithKeys();
    const head = `<header><p class="kicker">Hands-on lab · uses your own API keys</p><h2>Model playground</h2>
      <p>Every app that uses an AI model sends a few settings along with your prompt. Here you control them yourself. Pick up to three models, give each its own settings, run the same prompt, and compare. As you move a control, the Teacher and Student explain what it does.</p></header>`;
    if (!avail.length) return `<section class="m2sec" style="max-width:none">${head}${C().keysPanel()}<div class="card2"><p style="margin:0">Add at least one API key above to start. A free OpenRouter or Google Gemini key is enough.</p></div></section>`;
    st.slots.forEach((_, i) => resolveSlot(i));
    const e = st.slots[st.edit] || st.slots[0];
    return `<section class="m2sec" style="max-width:none">${head}${C().keysPanel()}
      <div class="card2"><p class="kicker">Try a guided experiment</p><div class="pgexps">${EXPS.map((x, i) => `<button class="pgexp" data-pgexp="${i}"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></button>`).join("")}</div></div>
      <div class="card2"><p class="kicker">1 · The prompt</p>
        <div class="field" style="margin:0"><label for="pgprompt">Your prompt (sent to every model)</label><textarea id="pgprompt" rows="3">${esc(st.prompt)}</textarea></div>
      </div>
      <div class="card2"><p class="kicker">2 · The models</p>
        <div class="pgmodels">${st.slots.map((s, i) => { const list = C().models(s.p); return `<div class="pgmodel ${i === st.edit ? "sel" : ""}">
          <div class="pgmhead"><b>Model ${"ABC"[i]}</b>${st.slots.length > 1 ? `<button class="linkish" data-pgremove="${i}">Remove</button>` : ""}</div>
          <select data-pgprov="${i}" aria-label="Model ${"ABC"[i]} provider">${avail.map((p) => `<option value="${p}" ${p === s.p ? "selected" : ""}>${esc(C().providers[p].name)}</option>`).join("")}</select>
          <select data-pgmodel="${i}" aria-label="Model ${"ABC"[i]}">${list ? list.map((m) => `<option value="${esc(m.id)}" ${m.id === s.m ? "selected" : ""}>${esc(m.name)}${m.free ? " · free" : ""}</option>`).join("") : `<option>Loading models…</option>`}</select>
          <p class="crit pgsum">${esc(summaryLine(s))}${s.system ? " · system prompt" : ""}</p>
          <button class="btn sm ${i === st.edit ? "primary" : ""}" data-pgedit="${i}">${i === st.edit ? "Editing these settings ↓" : "Edit settings"}</button></div>`; }).join("")}
          ${st.slots.length < 3 ? `<button class="pgadd" data-pgadd>+ Add a model</button>` : ""}</div>
      </div>
      <div class="card2"><p class="kicker">3 · Settings for model ${"ABC"[st.edit]}: ${esc(modelName(e))}</p>
        <div class="btnrow" style="margin:0 0 10px"><button class="btn sm" data-pgcopy>Copy these settings to all models</button><button class="btn sm" data-pgreset>Reset to defaults</button></div>
        <div class="pglayout"><div class="pgrows">
          <div class="pgrow"><div class="pghead"><b>System prompt</b><span class="crit">${e.system ? "Sent to the model" : "Empty: no system prompt"}</span></div>
            <textarea id="pgsystem" rows="2" placeholder="e.g. You are a patient teacher. Answer in two sentences.">${esc(e.system)}</textarea>${talkHTML(talk("system"))}</div>
          ${PARAMS.map((p) => paramRow(e, p)).join("")}
        </div><div class="pgside" id="pgside">${chart(e.params, e.p)}<p class="crit">The chart is a simplified example sentence, not your prompt. It shows how temperature, top-k and top-p together decide which next words are still possible.</p></div></div>
      </div>
      <div class="card2"><p class="kicker">4 · Run and compare</p>
        <div class="btnrow" style="margin:0"><button class="btn primary" data-pgrun ${busy.on ? "disabled" : ""}>${busy.on ? "Running…" : "Run all models"}</button>
          <label class="cmpremember">Runs per model <select id="pgruns">${[1, 2, 3].map((n) => `<option ${n === st.runs ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
        <p class="crit">Run more than once to see how much answers vary with each model's settings.</p>
        <div class="pgresults">${st.slots.map((s, i) => `<div class="cmpcard"><div class="cmphead"><b>Model ${"ABC"[i]}: ${esc(modelName(s))}</b><span>${esc(summaryLine(s))}</span></div>
          ${(results[i] || []).map((r, j) => `<div class="pgrun"><p class="lbl">Run ${j + 1}${r.pending ? "" : r.err ? " · error" : ` · ${(r.ms / 1000).toFixed(1)} s${r.usage ? " · " + esc(r.usage) : ""}`}</p>
            <div class="cmpout">${r.pending ? `<span class="crit">Thinking…</span>` : r.err ? `<span class="err">${esc(r.err)}</span>` : esc(r.text || "(empty answer)")}</div>
            ${r.pending || r.err ? "" : `<p class="crit pgfinish">Why it stopped: ${esc(finishText(r.finish))}</p><details class="pgreq"><summary>Show the request that was sent</summary><pre>${esc(JSON.stringify(r.body, null, 2))}</pre></details>`}</div>`).join("") || `<p class="crit" style="padding:10px;margin:0">No answers yet.</p>`}</div>`).join("")}</div>
      </div>
    </section>`;
  }
  function finishText(f) {
    const x = String(f || "").toLowerCase();
    if (/length|max_tokens/.test(x)) return "it hit the max-tokens limit, so the answer was cut off.";
    if (/stop_sequence/.test(x)) return "it wrote your stop sequence.";
    if (/safety|content_filter|recitation/.test(x)) return "a safety filter blocked or stopped it.";
    if (/stop|end_turn/.test(x)) return "it finished naturally (or hit your stop sequence).";
    return x ? x : "not reported by this provider.";
  }

  /* ---------- Running ---------- */
  async function runAll() {
    const prompt = st.prompt.trim(); if (!prompt || busy.on) return;
    busy.on = true; results.length = 0;
    st.slots.forEach((s, i) => { results[i] = Array.from({ length: st.runs }, () => ({ pending: true })); });
    render();
    await Promise.all(st.slots.map((s, i) => (async () => {
      for (let j = 0; j < st.runs; j++) {
        try { Object.assign(results[i][j], await C().callModel(s.p, s.m, { prompt, system: s.system.trim(), params: sentParams(s) }), { pending: false }); }
        catch (err) { Object.assign(results[i][j], { pending: false, err: C().friendly(err, s.p) + (err && err.status === 400 ? " Tip: this model may not accept one of your settings. Switch it off and try again: that's a real lesson in how providers differ." : "") }); }
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
    const y = window.scrollY, a = document.activeElement, focusId = a && a.id, kp = sec.querySelector(".cmpkeys"), open = kp ? kp.open : null;
    sec.innerHTML = html();
    const nk = sec.querySelector(".cmpkeys"); if (nk && open !== null) nk.open = open;
    if (focusId && (focusId === "pgprompt" || focusId === "pgsystem")) { const el = document.getElementById(focusId); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
    window.scrollTo(0, y);
  }
  function updateRow(id) {
    const s = st.slots[st.edit], p = PARAMS.find((x) => x.id === id); if (!p) return;
    const v = s.params[id].v, val = document.getElementById("pgval-" + id), tk = document.getElementById("pgtalk-" + id);
    if (val) val.textContent = v;
    if (tk) tk.innerHTML = talkHTML(talk(id, p.type === "number" || !p.type ? Number(v) : v, s.p));
    const side = document.getElementById("pgside"); if (side && p.visual) side.firstElementChild.outerHTML = chart(s.params, s.p);
    const sum = root.querySelectorAll(".pgsum")[st.edit]; if (sum) sum.textContent = summaryLine(s) + (s.system ? " · system prompt" : "");
  }
  function bind() {
    if (bound) return; bound = true;
    root.addEventListener("input", (e) => {
      if (!root.querySelector("#pgsection")) return;
      const d = e.target.dataset || {};
      if (e.target.id === "pgprompt") { st.prompt = e.target.value; save(); return; }
      if (e.target.id === "pgsystem") { st.slots[st.edit].system = e.target.value; save(); return; }
      if (d.pgv) { const p = PARAMS.find((x) => x.id === d.pgv); st.slots[st.edit].params[d.pgv].v = p.type === "text" || p.type === "choice" ? e.target.value : Number(e.target.value); save(); updateRow(d.pgv); }
    });
    root.addEventListener("change", (e) => {
      if (!root.querySelector("#pgsection")) return;
      const d = e.target.dataset || {};
      if (d.pgon) { st.slots[st.edit].params[d.pgon].on = e.target.checked; save(); render(); return; }
      if (d.pgprov) { st.slots[+d.pgprov].p = e.target.value; st.slots[+d.pgprov].m = ""; save(); render(); return; }
      if (d.pgmodel) { st.slots[+d.pgmodel].m = e.target.value; save(); render(); return; }
      if (e.target.id === "pgruns") { st.runs = +e.target.value; save(); return; }
    });
    root.addEventListener("click", (e) => {
      if (!root.querySelector("#pgsection")) return;
      const t = e.target.closest("[data-pgedit],[data-pgremove],[data-pgadd],[data-pgcopy],[data-pgreset],[data-pgrun],[data-pgexp]"); if (!t) return;
      const d = t.dataset;
      if (d.pgedit !== undefined) { st.edit = +d.pgedit; }
      else if (d.pgremove !== undefined) { st.slots.splice(+d.pgremove, 1); results.splice(+d.pgremove, 1); st.edit = 0; }
      else if (d.pgadd !== undefined) { const s = blankSlot(); s.p = st.slots[0].p; st.slots.push(s); st.edit = st.slots.length - 1; }
      else if (d.pgcopy !== undefined) { const src = st.slots[st.edit]; st.slots.forEach((s) => { s.params = JSON.parse(JSON.stringify(src.params)); s.system = src.system; }); }
      else if (d.pgreset !== undefined) { st.slots[st.edit].params = freshParams(); st.slots[st.edit].system = ""; }
      else if (d.pgrun !== undefined) { runAll(); return; }
      else if (d.pgexp !== undefined) { applyExp(+d.pgexp); return; }
      save(); render();
    });
  }
  function mount(el) {
    root = el; bind();
    if (C()) { C().mount(el, []); C().onChange(() => { if (root && root.querySelector("#pgsection") && !busy.on && !(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.cmpkey)) render(); }); }
  }

  window.WB_PLAY = { html: () => `<div id="pgsection">${html()}</div>`, mount };
})();
