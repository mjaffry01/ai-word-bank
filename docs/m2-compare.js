// Module 2 Practice tasks: run a prompt in up to three real AI models side by side, using the student's OWN API keys.
// Keys stay in the student's browser and go straight to the AI company (OpenRouter, Google Gemini, Groq, Hugging Face,
// Mistral, OpenAI, Anthropic);
// they are never sent to the course server or the teacher's Sheet. Model lists are loaded live from each provider.
// Module 2 calls WB_CMP.keysPanel() and WB_CMP.slot(task) while building the tab, WB_CMP.mount(root) after rendering,
// and WB_CMP.summary(taskId) when a task is handed in.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MAX_OUT = 1200;

  // `base` marks an OpenAI-style service: same request format, so one code path handles them all.
  const PROVIDERS = {
    openrouter: { name: "OpenRouter", free: true, keyUrl: "https://openrouter.ai/keys", ph: "sk-or-…",
      intro: "A “one key, many models” service. One account gives you hundreds of models from OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek and more, and many of them are free (marked “free”). The best first choice for comparing models.",
      hint: "Free models have daily limits, and some free providers may keep your prompts, so don't paste anything private." },
    gemini: { name: "Google Gemini", free: true, keyUrl: "https://aistudio.google.com/apikey", ph: "AIza…",
      intro: "Google's own models: the big Gemini models and the smaller open Gemma models. Google AI Studio gives you a free key with a daily allowance.",
      hint: "Sign in to Google AI Studio with a Google account and create a key." },
    groq: { name: "Groq", free: true, base: "https://api.groq.com/openai/v1", keyUrl: "https://console.groq.com/keys", ph: "gsk_…",
      intro: "A company that runs open models (such as Llama and Qwen) on its own super-fast chips. Answers often arrive in under a second. Run the same prompt here and on another service to see how much speed differs.",
      hint: "Free tier with per-minute and daily limits. Sign up at the Groq console and create a key." },
    huggingface: { name: "Hugging Face", free: true, base: "https://router.huggingface.co/v1", keyUrl: "https://huggingface.co/settings/tokens", ph: "hf_…",
      intro: "The biggest home of open AI models online, a bit like a “GitHub for AI”. One Hugging Face token lets you run many open models, which partner companies host for you.",
      hint: "Free accounts get a small monthly credit; after that it's paid. Create a fine-grained token with the “Make calls to Inference Providers” permission." },
    mistral: { name: "Mistral", free: true, base: "https://api.mistral.ai/v1", keyUrl: "https://console.mistral.ai/api-keys", ph: "",
      intro: "A French AI company that makes its own models, from small and fast ones to large ones. Good for comparing a European model with American and Chinese ones.",
      hint: "The free “Experiment” plan is for testing, with low limits; sign-up may ask you to verify a phone number." },
    openai: { name: "OpenAI (GPT)", free: false, keyUrl: "https://platform.openai.com/api-keys", ph: "sk-…",
      intro: "The company behind ChatGPT, with the GPT models.",
      hint: "Paid: your OpenAI account needs billing set up. Each run costs a fraction of a cent. OpenRouter often has OpenAI's open models for free." },
    anthropic: { name: "Anthropic (Claude)", free: false, keyUrl: "https://console.anthropic.com/settings/keys", ph: "sk-ant-…",
      intro: "The company behind Claude, with the Claude models.",
      hint: "Paid: your Anthropic account needs credit. Each run costs a fraction of a cent." },
  };
  // Services like OpenRouter that can't be added here: shown as a reading list under the key boxes.
  const OTHERS = [
    ["GitHub Models", "https://github.com/marketplace/models", "Free with a GitHub account: a catalogue of models from OpenAI, Meta, Mistral, DeepSeek and others, with its own playground for comparing two models side by side. Not on this page because GitHub blocks requests from other websites, so use it on GitHub."],
    ["Cerebras", "https://cloud.cerebras.ai", "Like Groq: runs open models on its own very fast hardware, with a free tier. Not on this page because it blocks requests from other websites."],
    ["Together AI", "https://www.together.ai", "Hosts hundreds of open models (Llama, Qwen, DeepSeek and more). Pay as you go, sometimes with starter credit."],
    ["Fireworks AI", "https://fireworks.ai", "Fast hosting for open models, aimed at developers building apps. Pay as you go."],
    ["DeepInfra", "https://deepinfra.com", "One of the cheapest places to run open models. Pay as you go."],
    ["Cloudflare Workers AI", "https://developers.cloudflare.com/workers-ai/", "Runs open models on Cloudflare's network, with a free daily allowance. Mostly for developers building websites on Cloudflare."],
    ["Eden AI and Vercel AI Gateway", "https://www.edenai.co", "Gateways like OpenRouter (one key, many companies), aimed at businesses. Paid."],
    ["LiteLLM", "https://github.com/BerriAI/litellm", "Free, open-source software you run yourself to get one key and one format for many AI companies. For developers, not students."],
    ["LMArena", "https://lmarena.ai", "No key needed: chat with two anonymous models at once, vote for the better answer, then see which models they were. The votes build a public leaderboard."],
    ["Poe", "https://poe.com", "A chat app with many models from different companies in one place, with free daily points. It has no API for this page."],
  ];

  /* ---------- Keys: in memory, saved to sessionStorage (or localStorage if the student ticks "remember") ---------- */
  const KEY_STORE = "wb-ai-keys", REMEMBER = "wb-ai-remember";
  const safeGet = (st, k) => { try { return st.getItem(k); } catch (e) { return null; } };
  const safeSet = (st, k, v) => { try { v == null ? st.removeItem(k) : st.setItem(k, v); } catch (e) {} };
  let remember = safeGet(localStorage, REMEMBER) === "1";
  let keys = {};
  try { keys = JSON.parse(safeGet(remember ? localStorage : sessionStorage, KEY_STORE) || "{}") || {}; } catch (e) { keys = {}; }
  const keyStatus = {};
  function saveKeys() {
    const v = JSON.stringify(keys);
    safeSet(sessionStorage, KEY_STORE, remember ? null : v);
    safeSet(localStorage, KEY_STORE, remember ? v : null);
    safeSet(localStorage, REMEMBER, remember ? "1" : null);
  }
  const haveKey = (p) => !!(keys[p] && keys[p].trim());

  /* ---------- Model lists, fetched live from each provider ---------- */
  const models = {}, modelsLoading = {};
  async function jsonOrThrow(res) {
    let body = null; try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      const msg = (body && (body.error && (body.error.message || body.error)) || body && body.message) || res.statusText;
      const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg)); err.status = res.status; throw err;
    }
    return body;
  }
  async function listModels(p) {
    const k = keys[p];
    if (p === "openrouter") {
      const d = await jsonOrThrow(await fetch("https://openrouter.ai/api/v1/models"));
      return (d.data || []).filter((m) => !m.architecture || !m.architecture.output_modalities || m.architecture.output_modalities.includes("text"))
        .map((m) => ({ id: m.id, name: m.name || m.id, free: m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0 }))
        .sort((a, b) => (b.free - a.free) || a.name.localeCompare(b.name));
    }
    if (p === "gemini") {
      const d = await jsonOrThrow(await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": k } }));
      return (d.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent") && /gemini|gemma/i.test(m.name) && !/image|tts|audio|live|embedding|vision/i.test(m.name))
        .map((m) => ({ id: m.name.replace(/^models\//, ""), name: m.displayName || m.name })).reverse();
    }
    if (PROVIDERS[p].base) {
      const d = await jsonOrThrow(await fetch(PROVIDERS[p].base + "/models", { headers: { Authorization: "Bearer " + k } }));
      const seen = new Set();
      return (d.data || []).filter((m) => !/whisper|tts|audio|embed|guard|moderation|ocr|transcri|image/i.test(m.id) && !seen.has(m.id) && seen.add(m.id))
        .map((m) => ({ id: m.id, name: m.name || m.id })).sort((a, b) => a.name.localeCompare(b.name));
    }
    if (p === "openai") {
      const d = await jsonOrThrow(await fetch("https://api.openai.com/v1/models", { headers: { Authorization: "Bearer " + k } }));
      return (d.data || []).map((m) => m.id).filter((id) => /^(gpt-|o\d|chatgpt)/.test(id) && !/audio|realtime|tts|transcribe|image|search|instruct|embedding|codex/.test(id))
        .sort().reverse().map((id) => ({ id, name: id }));
    }
    if (p === "anthropic") {
      const d = await jsonOrThrow(await fetch("https://api.anthropic.com/v1/models?limit=100", { headers: { "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" } }));
      return (d.data || []).map((m) => ({ id: m.id, name: m.display_name || m.id }));
    }
    return [];
  }
  async function checkKey(p) {
    keyStatus[p] = { state: "checking" }; refresh();
    try {
      if (p === "openrouter") await jsonOrThrow(await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: "Bearer " + keys[p] } }));
      if (p === "huggingface") await jsonOrThrow(await fetch("https://huggingface.co/api/whoami-v2", { headers: { Authorization: "Bearer " + keys[p] } }));
      models[p] = await listModels(p);
      keyStatus[p] = { state: "ok", text: `Key works · ${models[p].length} models${p === "openrouter" ? ` (${models[p].filter((m) => m.free).length} free)` : ""}` };
    } catch (e) {
      keyStatus[p] = { state: "bad", text: friendly(e, p) }; models[p] = [];
    }
    refresh();
  }
  function ensureModels(p) {
    if (!haveKey(p) || models[p] || modelsLoading[p]) return;
    modelsLoading[p] = true;
    listModels(p).then((m) => { models[p] = m; }, (e) => { keyStatus[p] = { state: "bad", text: friendly(e, p) }; models[p] = []; }).then(() => { modelsLoading[p] = false; refresh(); });
  }

  /* ---------- Running a prompt ---------- */
  async function runOne(p, model, prompt) {
    const k = keys[p], t0 = performance.now();
    let text = "", usage = "";
    if (p === "openrouter" || p === "openai" || PROVIDERS[p].base) {
      const url = PROVIDERS[p].base ? PROVIDERS[p].base + "/chat/completions" : p === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
      const headers = { Authorization: "Bearer " + k, "Content-Type": "application/json" };
      if (p === "openrouter") { headers["HTTP-Referer"] = location.origin; headers["X-Title"] = "AI Concepts course"; }
      const body = { model, messages: [{ role: "user", content: prompt }] };
      if (p === "openai") body.max_completion_tokens = 2000; else body.max_tokens = MAX_OUT;
      const d = await jsonOrThrow(await fetch(url, { method: "POST", headers, body: JSON.stringify(body) }));
      text = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "";
      if (d.usage) usage = `${d.usage.prompt_tokens} in · ${d.usage.completion_tokens} out tokens`;
    } else if (p === "gemini") {
      const d = await jsonOrThrow(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST", headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096 } }),
      }));
      const c = d.candidates && d.candidates[0];
      text = (c && c.content && (c.content.parts || []).map((x) => x.text || "").join("")) || "";
      if (!text && c && c.finishReason) text = `(No text returned. Reason: ${c.finishReason})`;
      if (d.usageMetadata) usage = `${d.usageMetadata.promptTokenCount} in · ${d.usageMetadata.candidatesTokenCount || 0} out tokens`;
    } else if (p === "anthropic") {
      const d = await jsonOrThrow(await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "Content-Type": "application/json" },
        body: JSON.stringify({ model, max_tokens: MAX_OUT, messages: [{ role: "user", content: prompt }] }),
      }));
      text = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      if (d.usage) usage = `${d.usage.input_tokens} in · ${d.usage.output_tokens} out tokens`;
    }
    return { text: text || "(The model returned an empty answer.)", ms: Math.round(performance.now() - t0), usage };
  }
  // Send one prompt with chosen settings. Only the settings in `params` are sent; the rest stay at the model's defaults.
  // params: temperature, top_p, top_k, max_tokens, frequency_penalty, presence_penalty, stop (string), seed, thinking ("low"|"medium"|"high")
  // Returns the answer plus the exact request body that was sent (minus the key), so students can see it.
  async function callModel(p, model, opts) {
    const k = keys[p], prm = opts.params || {}, has = (n) => prm[n] !== undefined && prm[n] !== null && prm[n] !== "";
    const t0 = performance.now(), msgs = [];
    if (opts.system && p !== "anthropic" && p !== "gemini") msgs.push({ role: "system", content: opts.system });
    // opts.history: earlier turns of a conversation, [{role: "user" | "assistant", content}], sent before the new message
    (opts.history || []).forEach((h) => msgs.push({ role: h.role, content: h.content }));
    msgs.push({ role: "user", content: opts.prompt });
    let url, headers, body;
    if (p === "openrouter" || p === "openai" || PROVIDERS[p].base) {
      url = PROVIDERS[p].base ? PROVIDERS[p].base + "/chat/completions" : p === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
      headers = { Authorization: "Bearer " + k, "Content-Type": "application/json" };
      if (p === "openrouter") { headers["HTTP-Referer"] = location.origin; headers["X-Title"] = "AI Concepts course"; }
      body = { model, messages: msgs };
      ["temperature", "top_p", "frequency_penalty", "presence_penalty", "seed"].forEach((n) => { if (has(n)) body[n] = prm[n]; });
      if (p === "mistral" && has("seed")) { body.random_seed = body.seed; delete body.seed; }
      if (has("top_k") && p === "openrouter") body.top_k = prm.top_k;
      if (has("max_tokens")) body[p === "openai" ? "max_completion_tokens" : "max_tokens"] = prm.max_tokens;
      if (has("stop")) body.stop = [prm.stop];
      if (has("thinking")) { if (p === "openrouter") body.reasoning = { effort: prm.thinking }; else body.reasoning_effort = prm.thinking; }
    } else if (p === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      headers = { "x-goog-api-key": k, "Content-Type": "application/json" };
      const g = {};
      if (has("temperature")) g.temperature = prm.temperature;
      if (has("top_p")) g.topP = prm.top_p;
      if (has("top_k")) g.topK = prm.top_k;
      if (has("max_tokens")) g.maxOutputTokens = prm.max_tokens;
      if (has("frequency_penalty")) g.frequencyPenalty = prm.frequency_penalty;
      if (has("presence_penalty")) g.presencePenalty = prm.presence_penalty;
      if (has("seed")) g.seed = prm.seed;
      if (has("stop")) g.stopSequences = [prm.stop];
      if (has("thinking")) g.thinkingConfig = { thinkingBudget: { low: 512, medium: 4096, high: 16384 }[prm.thinking] };
      body = { contents: (opts.history || []).map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })).concat([{ role: "user", parts: [{ text: opts.prompt }] }]) };
      if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
      if (Object.keys(g).length) body.generationConfig = g;
    } else {
      url = "https://api.anthropic.com/v1/messages";
      headers = { "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "Content-Type": "application/json" };
      body = { model, max_tokens: has("max_tokens") ? prm.max_tokens : 1024, messages: msgs };
      if (opts.system) body.system = opts.system;
      ["temperature", "top_p", "top_k"].forEach((n) => { if (has(n)) body[n] = prm[n]; });
      if (has("stop")) body.stop_sequences = [prm.stop];
      if (has("thinking")) {
        const budget = { low: 1024, medium: 4096, high: 12000 }[prm.thinking];
        body.thinking = { type: "enabled", budget_tokens: budget };
        if (body.max_tokens <= budget) body.max_tokens = budget + 1024;
        delete body.temperature; delete body.top_k;
      }
    }
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const d = await jsonOrThrow(res);
    let text = "", usage = "", finish = "";
    if (p === "gemini") {
      const c = d.candidates && d.candidates[0];
      text = (c && c.content && (c.content.parts || []).filter((x) => !x.thought).map((x) => x.text || "").join("")) || "";
      finish = (c && c.finishReason) || "";
      if (d.usageMetadata) usage = `${d.usageMetadata.promptTokenCount} in · ${d.usageMetadata.candidatesTokenCount || 0} out${d.usageMetadata.thoughtsTokenCount ? " · " + d.usageMetadata.thoughtsTokenCount + " thinking" : ""} tokens`;
    } else if (p === "anthropic") {
      text = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      finish = d.stop_reason || "";
      if (d.usage) usage = `${d.usage.input_tokens} in · ${d.usage.output_tokens} out tokens`;
    } else {
      const ch = d.choices && d.choices[0];
      text = (ch && ch.message && ch.message.content) || "";
      finish = (ch && ch.finish_reason) || "";
      if (d.usage) usage = `${d.usage.prompt_tokens} in · ${d.usage.completion_tokens} out tokens`;
    }
    return { text, finish, usage, ms: Math.round(performance.now() - t0), body };
  }
  function friendly(e, p) {
    const s = e && e.status, m = (e && e.message) || "";
    if (s === 401 || s === 403 || /invalid.*key|api key not valid|incorrect api key|authentication/i.test(m)) return `${PROVIDERS[p].name} didn't accept this key. Check you copied all of it.`;
    if (s === 402 || /credit|billing|quota|insufficient/i.test(m)) return `No credit or quota left on this ${PROVIDERS[p].name} account.${PROVIDERS[p].free ? " Try a model marked free, or wait for the daily limit to reset." : " Add credit, or use a free provider."}`;
    if (s === 429) return "Too many requests or the free daily limit was reached. Wait a minute, or pick another model.";
    if (s === 404) return "This model isn't available to your key. Pick another one.";
    if (!s) return "Couldn't reach the AI service. Check your internet connection.";
    return `Error ${s}: ${m.slice(0, 200)}`;
  }

  /* ---------- Per-task state ---------- */
  const SEL_STORE = "wb-cmp-sel";
  let sel = {}; try { sel = JSON.parse(safeGet(localStorage, SEL_STORE) || "{}") || {}; } catch (e) { sel = {}; }
  const saveSel = () => safeSet(localStorage, SEL_STORE, JSON.stringify(sel));
  const results = {}, running = {}, useWeak = {}, include = {};
  const providersWithKeys = () => Object.keys(PROVIDERS).filter(haveKey);
  // Sensible first picks on OpenRouter: general-purpose free models from well-known companies, one per company.
  // The free list changes often, so this ranks whatever is free today rather than naming fixed models.
  const VENDORS = ["google", "meta-llama", "mistralai", "deepseek", "qwen", "openai", "nvidia", "microsoft", "anthropic"];
  const SPECIALIST = /code|coder|safety|guard|vision|-vl|omni|lyria|audio|image|^openrouter\//i;
  function defaultPool(p, list) {
    if (p !== "openrouter") return list;
    const free = list.filter((y) => y.free && !SPECIALIST.test(y.id)), picks = [];
    VENDORS.forEach((v) => { const hit = free.find((y) => y.id.startsWith(v + "/")); if (hit) picks.push(hit); });
    return picks.concat(free.filter((y) => !picks.includes(y)));
  }
  function slotsFor(id) {
    const avail = providersWithKeys();
    const s = (sel[id] || [{}, {}, {}]).slice(0, 3);
    while (s.length < 3) s.push({});
    // A slot the student set to "none" stays empty; otherwise it defaults to the first provider with a key
    const chosen = !!sel[id];
    return s.map((x, i) => {
      let p = avail.includes(x.p) ? x.p : (chosen && x.p === "" ? "" : avail[0] || "");
      const list = p && models[p];
      let m = x.m;
      if (p && list && !list.some((y) => y.id === m)) {
        const pool = defaultPool(p, list);
        m = (pool[i] || pool[0] || list[0] || {}).id || "";
      }
      return { p, m: p ? m : "" };
    });
  }

  /* ---------- HTML ---------- */
  const STARTERS = ["openrouter", "gemini"], MORE = Object.keys(PROVIDERS).filter((p) => !STARTERS.includes(p));
  let moreOpen = false;
  const keyRow = (p) => { const P = PROVIDERS[p]; const st = keyStatus[p] || {}; return `<div class="cmprow">
        <div><b>${esc(P.name)}</b> <span class="pill2 ${P.free ? "done" : ""}">${P.free ? "Free option" : "Paid"}</span><p class="cmpintro">${esc(P.intro)}</p><p class="crit" style="margin:2px 0 0">${esc(P.hint)} <a href="${P.keyUrl}" target="_blank" rel="noopener">Get a key ↗</a></p></div>
        <div class="cmpkeyin"><input type="password" autocomplete="off" spellcheck="false" placeholder="${esc(P.ph)}" data-cmpkey="${p}" value="${esc(keys[p] || "")}" aria-label="${esc(P.name)} API key">
          <button class="btn sm" data-cmpcheck="${p}" ${haveKey(p) ? "" : "disabled"}>Check</button></div>
        <p class="savemsg ${st.state === "ok" ? "ok" : st.state === "bad" ? "err" : ""}" data-cmpstatus="${p}">${st.state === "checking" ? "Checking…" : esc(st.text || "")}</p>
      </div>`; };
  // opts.closed keeps the panel folded even with no keys (on Practice tasks, where it's an optional extra).
  const keysPanel = (opts) => {
    const n = providersWithKeys().length;
    return `<details class="card2 cmpkeys" ${n || (opts && opts.closed) ? "" : "open"}><summary><span class="kicker" style="display:inline">Optional extra · needs an API key</span><h3>Compare answers from real AI models</h3>
      <p class="crit" style="margin:0">${n ? `${n} key${n > 1 ? "s" : ""} added. Open to change them.` : "Add an API key to run your prompts in up to three AI models side by side, right here on this page."}</p></summary>
      <div class="cmpnote"><b>Your key stays with you.</b> It is kept only in this browser and sent straight to the AI company when you press Run. It never goes to your teacher or this course's server. Treat it like a password: don't share it or paste it anywhere else.</div>
      <p class="crit">Start with <b>one free key</b>: OpenRouter is the easiest (many free models with one key). You can add more later.</p>
      <div class="cmprows">${STARTERS.map(keyRow).join("")}</div>
      <details class="cmpmore" ${moreOpen || MORE.some(haveKey) ? "open" : ""}><summary>More services: ${esc(MORE.map((p) => PROVIDERS[p].name).join(", "))}</summary>
        <div class="cmprows">${MORE.map(keyRow).join("")}</div></details>
      <div class="btnrow"><label class="cmpremember"><input type="checkbox" data-cmpremember ${remember ? "checked" : ""}> Remember my keys on this device</label><button class="btn sm" data-cmpforget>Forget all keys</button></div>
      <p class="crit" style="margin:6px 0 0">Not ticked: keys are forgotten when you close this browser tab. Only tick it on your own device.</p>
      <details class="cmpothers"><summary>Other services like OpenRouter (not on this page)</summary>
        <p class="crit">Worth knowing about. Free plans and limits change often, so check each site's current terms.</p>
        <ul>${OTHERS.map(([n, u, d]) => `<li><a href="${u}" target="_blank" rel="noopener"><b>${esc(n)}</b> ↗</a> ${esc(d)}</li>`).join("")}</ul></details>
    </details>`;
  };
  const slot = (t) => `<div class="cmpbox" data-cmpslot="${esc(t.id)}"></div>`;

  function slotHTML(t) {
    const id = t.id, avail = providersWithKeys();
    if (!avail.length) return `<p class="lbl">Try it in real AI models</p><p class="crit" style="margin:0">Optional: add a free API key in “Compare answers from real AI models” at the bottom of this page to test this prompt in several AI models right here.</p>`;
    const sl = slotsFor(id), res = results[id], busy = running[id];
    const provOpts = (cur) => `<option value="" ${cur ? "" : "selected"}>— none —</option>` + avail.map((p) => `<option value="${p}" ${p === cur ? "selected" : ""}>${esc(PROVIDERS[p].name)}</option>`).join("");
    const modelOpts = (p, cur) => {
      if (!p) return `<option value="">—</option>`;
      const list = models[p];
      if (!list) { ensureModels(p); return `<option value="">Loading models…</option>`; }
      return list.map((m) => `<option value="${esc(m.id)}" ${m.id === cur ? "selected" : ""}>${esc(m.name)}${m.free ? " · free" : ""}</option>`).join("");
    };
    return `<p class="lbl">Try it in real AI models</p>
      ${t.weak ? `<div class="cmpwhich"><label><input type="radio" name="cmpw-${esc(id)}" data-cmpweak="${esc(id)}" value="0" ${useWeak[id] ? "" : "checked"}> My final prompt</label><label><input type="radio" name="cmpw-${esc(id)}" data-cmpweak="${esc(id)}" value="1" ${useWeak[id] ? "checked" : ""}> The starting prompt (“${esc(t.weak)}”)</label></div>` : ""}
      <div class="cmpslots">${sl.map((s, i) => `<div class="cmpslot"><span class="crit">Model ${i + 1}</span>
        <select data-cmpprov="${esc(id)}" data-i="${i}" aria-label="Model ${i + 1} provider">${provOpts(s.p)}</select>
        <select data-cmpmodel="${esc(id)}" data-i="${i}" aria-label="Model ${i + 1}" ${s.p ? "" : "disabled"}>${modelOpts(s.p, s.m)}</select></div>`).join("")}</div>
      <div class="btnrow" style="margin:8px 0 0"><button class="btn primary" data-cmprun="${esc(id)}" ${busy ? "disabled" : ""}>${busy ? "Running…" : "Run and compare"}</button>
        ${res ? `<label class="cmpremember"><input type="checkbox" data-cmpinclude="${esc(id)}" ${include[id] ? "checked" : ""}> Add these answers to my hand-in</label>` : ""}</div>
      ${res ? `<p class="crit" style="margin:10px 0 6px">Prompt used: ${res.weak ? "the starting prompt" : "your final prompt"}. Same prompt, different models: what differs, and why?</p>
      <div class="cmpres">${res.items.map((r) => `<div class="cmpcard ${r.err ? "bad" : ""}"><div class="cmphead"><b>${esc(r.label)}</b><span>${r.pending ? "thinking…" : r.err ? "error" : `${(r.ms / 1000).toFixed(1)} s${r.usage ? " · " + esc(r.usage) : ""}`}</span></div>
        <div class="cmpout">${r.pending ? `<span class="crit">Waiting for the answer…</span>` : r.err ? `<span class="err">${esc(r.err)}</span>` : esc(r.text)}</div></div>`).join("")}</div>` : ""}`;
  }

  /* ---------- Mounting and events ---------- */
  let root = null, taskList = [], bound = false;
  const listeners = [];
  function refresh() {
    listeners.forEach((f) => { try { f(); } catch (e) {} });
    if (!root) return;
    const kp = root.querySelector(".cmpkeys");
    if (kp) { const open = kp.open, tmp = document.createElement("div"); tmp.innerHTML = keysPanel(); const nk = tmp.firstElementChild; nk.open = open; const a = document.activeElement, focusKey = a && a.dataset && a.dataset.cmpkey; kp.replaceWith(nk); if (focusKey) { const el = nk.querySelector(`[data-cmpkey="${focusKey}"]`); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } } }
    root.querySelectorAll("[data-cmpslot]").forEach((el) => { const t = taskList.find((x) => x.id === el.dataset.cmpslot); if (t) el.innerHTML = slotHTML(t); });
  }
  async function run(id) {
    const t = taskList.find((x) => x.id === id); if (!t) return;
    const prompt = useWeak[id] && t.weak ? t.weak : ((document.getElementById("t-prompt-" + id) || {}).value || "").trim();
    if (!prompt) { results[id] = { weak: false, items: [{ label: "Nothing to run", err: "Write your final prompt in the box above first." }] }; refresh(); return; }
    const picks = slotsFor(id).filter((s) => s.p && s.m);
    if (!picks.length) return;
    running[id] = true;
    const items = picks.map((s) => ({ label: `${(models[s.p] || []).find((m) => m.id === s.m)?.name || s.m} (${PROVIDERS[s.p].name})`, pending: true }));
    results[id] = { weak: !!(useWeak[id] && t.weak), prompt, items };
    refresh();
    await Promise.all(picks.map((s, i) => runOne(s.p, s.m, prompt).then((r) => Object.assign(items[i], r, { pending: false }), (e) => Object.assign(items[i], { pending: false, err: friendly(e, s.p) })).then(refresh)));
    running[id] = false; refresh();
  }
  function bind() {
    if (bound || !root) return; bound = true;
    root.addEventListener("toggle", (e) => { if (e.target.classList && e.target.classList.contains("cmpmore")) moreOpen = e.target.open; }, true);
    root.addEventListener("input", (e) => {
      const k = e.target.dataset && e.target.dataset.cmpkey; if (!k) return;
      keys[k] = e.target.value.trim(); delete models[k]; keyStatus[k] = null; saveKeys();
      const b = root.querySelector(`[data-cmpcheck="${k}"]`); if (b) b.disabled = !keys[k];
    });
    root.addEventListener("change", (e) => {
      const d = e.target.dataset || {};
      if (d.cmpkey) { refresh(); return; }
      if ("cmpremember" in d) { remember = e.target.checked; saveKeys(); return; }
      if (d.cmpprov) { const s = slotsFor(d.cmpprov); s[+d.i] = { p: e.target.value, m: "" }; sel[d.cmpprov] = s; saveSel(); refresh(); return; }
      if (d.cmpmodel) { const s = slotsFor(d.cmpmodel); s[+d.i].m = e.target.value; sel[d.cmpmodel] = s; saveSel(); return; }
      if (d.cmpweak) { useWeak[d.cmpweak] = e.target.value === "1"; return; }
      if (d.cmpinclude) { include[d.cmpinclude] = e.target.checked; }
    });
    root.addEventListener("click", (e) => {
      const c = e.target.closest("[data-cmpcheck]"); if (c) { e.preventDefault(); checkKey(c.dataset.cmpcheck); return; }
      if (e.target.closest("[data-cmpforget]")) { e.preventDefault(); keys = {}; Object.keys(models).forEach((p) => delete models[p]); Object.keys(keyStatus).forEach((p) => delete keyStatus[p]); saveKeys(); refresh(); return; }
      const r = e.target.closest("[data-cmprun]"); if (r) { e.preventDefault(); run(r.dataset.cmprun); }
    });
  }
  function mount(el, tasks) { root = el; taskList = tasks || taskList; bind(); refresh(); }

  // Text added to the hand-in when the student ticks "Add these answers to my hand-in"
  function summary(id) {
    const r = results[id]; if (!r || !include[id]) return "";
    const parts = r.items.filter((x) => !x.pending).map((x) => `- ${x.label}${x.err ? ": ERROR " + x.err : ` (${(x.ms / 1000).toFixed(1)} s): ${x.text.replace(/\s+/g, " ").slice(0, 450)}${x.text.length > 450 ? "…" : ""}`}`);
    return parts.length ? `\n\nMODEL COMPARISON (${r.weak ? "starting prompt" : "final prompt"}):\n${parts.join("\n")}` : "";
  }

  window.WB_CMP = {
    keysPanel, slot, mount, summary,
    // Shared with the Model playground tab
    providers: PROVIDERS, providersWithKeys, haveKey,
    models: (p) => { ensureModels(p); return models[p] || null; },
    defaultModels: (p) => (models[p] ? defaultPool(p, models[p]) : []),
    callModel, friendly,
    onChange: (f) => { if (!listeners.includes(f)) listeners.push(f); },
  };
})();
