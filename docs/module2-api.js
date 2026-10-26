// Module 2, "AI settings (API)" tab: the settings an app sends with every request to an AI model (OpenAI / GPT,
// Gemini, Claude), each explained for a first-time student with a small interactive demo, plus a comparison table
// and a short practice. Module 2 calls WB_M2API.html() to build the tab and WB_M2API.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const word = (term, label) => `<button class="wordlink" data-word="${esc(term)}" title="Open in the learning web">${esc(label || term)}</button>`;
  const pct = (v) => (v >= 0.995 ? "100" : v < 0.005 ? "0" : Math.round(v * 100)) + "%";

  // The next-word example used by the sampling demos: "The cat sat on the ___"
  const NEXT = [["mat", 0.38], ["sofa", 0.18], ["floor", 0.14], ["chair", 0.1], ["windowsill", 0.07], ["roof", 0.05], ["keyboard", 0.04], ["moon", 0.02], ["spaceship", 0.01], ["banana", 0.01]];
  const softmaxT = (T) => { if (T < 0.05) return NEXT.map((n, i) => (i === 0 ? 1 : 0)); const e = NEXT.map(([, p]) => Math.exp(Math.log(p) / T)), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
  const sample = (probs) => { let r = Math.random(); for (let i = 0; i < probs.length; i++) { r -= probs[i]; if (r <= 0) return i; } return probs.length - 1; };
  const bars = (probs, opts = {}) => `<div class="apibars">${NEXT.map(([w], i) => { const off = opts.off && opts.off[i]; return `<div class="apibar${off ? " off" : ""}"><span class="w">${esc(w)}</span><span class="track"><i style="width:${Math.max(0.5, probs[i] * 100)}%"></i></span><span class="v">${off ? "removed" : pct(probs[i])}</span></div>`; }).join("")}</div>`;

  // What each provider calls the setting. note = a short warning shown under the names.
  const P = (openai, gemini, claude, note) => ({ openai, gemini, claude, note });
  const names = (p) => `<div class="apinames"><div><b>OpenAI / GPT</b><code>${p.openai}</code></div><div><b>Gemini</b><code>${p.gemini}</code></div><div><b>Claude</b><code>${p.claude}</code></div></div>${p.note ? `<p class="apinote">${p.note}</p>` : ""}`;

  // The 16 settings: id, group, title, one-sentence meaning, everyday analogy, when to change it, provider names, demo
  const S = [
    { id: "model", g: 0, t: "Choose the model", one: "Which AI model answers: a small, fast, cheap one or a big, slower, more capable one.", like: "Choosing between a quick helper and a senior expert. The expert is better at hard problems, but slower and more expensive.", when: "Use a small model for simple, high-volume jobs (sorting emails, short replies); a large one for hard reasoning, coding or important writing.", names: P("model", "model", "model", "Every company names its models differently, for example a \"mini\" or \"flash\" model versus a \"pro\" or \"opus\" model."), words: ["Large Language Model (LLM)", "Small Language Model (SLM)"] },
    { id: "system", g: 0, t: "System instructions", one: "Background instructions that set the AI's role, rules and style for the whole conversation, before the user says anything.", like: "The briefing a manager gives a new receptionist before the first visitor arrives: who you are, how to speak, what not to do.", when: "Almost always: set the role, tone, audience and rules here instead of repeating them in every message.", names: P("instructions (or a system message)", "system_instruction", "system"), words: ["System Prompt"] },
    { id: "max", g: 0, t: "Maximum output size", one: "The most tokens (word-pieces) the AI may write in its reply. When it hits the limit, it simply stops, even mid-sentence.", like: "A word limit on an exam answer: once you reach it, the examiner stops reading.", when: "Raise it for long answers, code or reports; lower it to cap cost and keep replies short. Too low cuts answers off.", names: P("max_output_tokens", "max_output_tokens", "max_tokens"), words: ["Max Tokens", "Token"] },
    { id: "temp", g: 1, t: "Temperature", one: "How adventurous the AI is when picking each next word. Low = always the most likely word (predictable). High = more surprising choices (creative, but riskier).", like: "A chef following the recipe exactly (low) versus improvising with new ingredients (high).", when: "Low for facts, code and data extraction; higher for brainstorming, stories and slogans.", names: P("temperature", "temperature*", "<s>temperature</s> retired"), note: "<b>Claude:</b> Claude 4.7 and later models accept only the default value, and Claude's current API version (2026-10-21) removes <code>temperature</code>, <code>top_p</code> and <code>top_k</code> altogether. The model manages its own word choice. <b>Gemini (*):</b> Google recommends keeping the default on its newest models.", words: ["Temperature"] },
    { id: "topp", g: 1, t: "Top-p (nucleus) sampling", one: "Only consider the most likely next words until their chances add up to p (say 90%); ignore the long tail of unlikely words.", like: "Choosing a restaurant only from those that together get 90% of the good reviews, never from the odd ones at the bottom.", when: "Lower it to cut wild word choices while keeping some variety. Usually change temperature or top-p, not both.", names: P("top_p", "top_p*", "<s>top_p</s> retired"), note: "<b>Claude:</b> retired with temperature (see above).", words: ["Top-p (Nucleus) Sampling"] },
    { id: "topk", g: 1, t: "Top-k sampling", one: "Only consider the k most likely next words (say the top 3), whatever their chances.", like: "A quiz show where you may only pick from the 3 answers on the screen.", when: "A blunt way to avoid rare words. Many developers never touch it.", names: P("not offered in GPT's main APIs", "top_k*", "<s>top_k</s> retired"), note: "<b>Claude:</b> retired with temperature (see above).", words: ["Top-k Sampling"] },
    { id: "stop", g: 1, t: "Stop sequences", one: "A word or symbol that makes the AI stop writing the moment it would produce it.", like: "Telling a speaker: \"stop as soon as you say ‘Question 3’.\"", when: "To end output at a known marker, for example after one item of a list or before the next speaker's name.", names: P("stop (Chat Completions; depends on the API)", "stop_sequences", "stop_sequences"), words: ["Stop Sequence"] },
    { id: "cand", g: 1, t: "Multiple candidates", one: "Ask for several different answers to the same request in one go, then pick the best.", like: "Asking three friends for a gift idea at once instead of one.", when: "Brainstorming options, or letting another program choose the best of several. Each candidate costs extra output tokens.", names: P("one response per call in the newer Responses API (n in older Chat Completions)", "candidate_count (where supported)", "one response per request"), note: "With Claude, send several separate requests if you want several answers.", words: [] },
    { id: "logp", g: 1, t: "Token probabilities", one: "Alongside the answer, report how likely the model thought each word was. Low probability = the model was unsure.", like: "A student writing their confidence next to each answer on a test.", when: "Spotting uncertain answers, building confidence scores, or research. Mostly used by developers, not end users.", names: P("logprobs / top_logprobs (where supported)", "logprobs settings (where supported)", "not offered"), note: "Claude's API does not return token probabilities.", words: ["Probability"] },
    { id: "think", g: 2, t: "Reasoning effort", one: "How much the AI thinks step by step before answering. More effort = better on hard problems, but slower and more tokens.", like: "Answering a maths question in your head versus working it out on paper first.", when: "Low for simple chat and quick lookups; high for tricky maths, coding, planning and anything where mistakes are costly.", names: P("reasoning.effort", "thinking_level / thinking config", "thinking: adaptive + output_config.effort"), note: "Claude's effort levels run low, medium, high, xhigh and max.", words: ["Reasoning Model", "Extended Thinking"] },
    { id: "tools", g: 3, t: "Custom functions (tools)", one: "Describe functions your program can run (check the weather, search a database). The AI decides when to call one and with what inputs; your code runs it and sends back the result.", like: "A receptionist who can't see the diary, but knows to ask you \"please check Tuesday at 3\" and then tells the visitor the answer.", when: "Whenever the AI needs live data or must take an action (bookings, calculations, company systems). This is the heart of AI agents.", names: P("tools (function definitions)", "function declarations (tools)", "tools"), words: ["Tool Use (Function Calling)", "AI Agent"] },
    { id: "choice", g: 3, t: "Force or guide tool use", one: "Tell the AI whether it may use tools (auto), must use one, must use a specific one, or must not use any.", like: "Telling an assistant: \"use the calculator if you need to\" (auto) versus \"you must use the calculator\" (forced).", when: "Usually leave it on auto. Turn tools off (none) for plain chat; force a tool when your app always needs that function called.", names: P("tool_choice", "tool_config", "tool_choice"), note: "<b>Claude:</b> the newest Claude models accept only <code>auto</code> and <code>none</code>; to make sure a tool is used, say so in the instructions.", words: [] },
    { id: "par", g: 3, t: "Parallel tool calls", one: "Let the AI ask for several tool calls at the same time instead of one after another.", like: "Phoning three shops at once (with three phones) instead of calling them one by one.", when: "Leave it on to save time when calls don't depend on each other; turn it off if your tools must run in order.", names: P("parallel_tool_calls", "depends on the model and tools", "on by default; disable_parallel_tool_use turns it off"), words: [] },
    { id: "json", g: 4, t: "Structured JSON output", one: "Force the answer into an exact data shape (a JSON schema), so another program can read it reliably.", like: "Filling in a form with labelled boxes instead of writing a free-form letter.", when: "Whenever code, not a person, reads the answer: extracting fields, filling databases, feeding other systems.", names: P("text.format (JSON schema)", "response_schema", "output_config.format (JSON schema), strict tools"), words: ["Structured Output", "Output Format"] },
    { id: "stream", g: 4, t: "Streaming", one: "Send the answer piece by piece as it's written, instead of all at once at the end.", like: "Watching a live sports commentary versus reading the match report afterwards.", when: "Almost always for chat apps: people see the first words in under a second. Turn it off for back-end jobs that only need the final result.", names: P("stream", "streaming APIs (streamGenerateContent)", "stream"), words: ["Streaming"] },
    { id: "safe", g: 4, t: "Safety controls", one: "Rules that stop the AI producing harmful content. Some platforms let developers adjust how strict the filters are; others build the safeguards into the model.", like: "A film rating system: some cinemas let you choose the rating; others only show family films.", when: "Keep defaults unless you have a clear, legitimate reason; stricter settings suit apps for children.", names: P("built-in platform and model safeguards", "safety_settings (per-category thresholds)", "built-in safeguards; few adjustable knobs"), note: "When Claude's safeguards decline a request, the response ends with <code>stop_reason: \"refusal\"</code>, so apps can handle it gracefully.", words: ["Guardrails", "Content Filter"] },
  ];
  const GROUPS = ["Who answers, and how much", "How the next word is picked", "Thinking before answering", "Using tools", "Shape, delivery and safety"];

  /* ---------- Demos: each returns HTML; wire(id, el) adds behaviour ---------- */
  const SYS = {
    none: ["No system instructions", "Photosynthesis is the process plants use to turn light energy into chemical energy. Using chlorophyll, they combine carbon dioxide and water to make glucose and release oxygen. It happens mainly in the leaves, in structures called chloroplasts."],
    kid: ["Explain things to a 10-year-old in 2 sentences.", "Plants are like little chefs: they use sunlight, water and air to cook their own food. While they cook, they breathe out the oxygen we need!"],
    pirate: ["You are a friendly pirate.", "Arr, matey! Photosynthesis be how the green plants o' the land catch the sun's golden rays and turn 'em into grub, breathin' out fresh air fer us sailors!"],
    json: ["Reply only with JSON: {\"term\", \"definition\"}.", "{\"term\": \"photosynthesis\", \"definition\": \"How plants use light, water and carbon dioxide to make sugar and release oxygen.\"}"],
  };
  const LONG = "Photosynthesis is how plants make food. They take in sunlight with a green pigment called chlorophyll , pull water up from their roots , and breathe in carbon dioxide from the air . Inside the leaf , these are turned into glucose , a sugar the plant uses for energy and growth . Oxygen is released as a by-product , which is why plants are so important for life on Earth .".split(" ");
  const STREAM = "Streaming sends each piece of the answer as soon as it is written, so you can start reading straight away instead of staring at a spinner.".split(" ");
  const MODELS = [
    { k: "small", n: "Small / fast model", sp: 95, cost: 8, cap: 45, a: "Day 1: city sights. Day 2: museum. Day 3: shopping." },
    { k: "mid", n: "Medium model", sp: 70, cost: 35, cap: 72, a: "Day 1: old town walking tour and a food market. Day 2: museum in the morning, park in the afternoon. Day 3: day trip to the coast; book train tickets in advance." },
    { k: "large", n: "Large model", sp: 40, cost: 90, cap: 95, a: "Day 1: old town tour (go early to beat crowds), lunch at the food market. Day 2: museum (closed Mondays, so check the date), evening river cruise. Day 3: coast day trip; the 8:10 train avoids rush hour, and pack layers since the coast is windy in spring." },
  ];
  const EFFORT = { low: { think: 1, tok: 15, time: 15, acc: 55, steps: ["The ball costs $0.10."] }, medium: { think: 3, tok: 40, time: 40, acc: 85, steps: ["Let the ball cost x.", "Then the bat costs x + 1.00.", "So x + (x + 1.00) = 1.10 → x = 0.05.", "The ball costs $0.05."] }, high: { think: 6, tok: 75, time: 70, acc: 95, steps: ["Let the ball cost x.", "The bat costs x + 1.00 (a dollar more).", "Together: 2x + 1.00 = 1.10.", "2x = 0.10, so x = 0.05.", "Check: 0.05 + 1.05 = 1.10 ✓ and 1.05 − 0.05 = 1.00 ✓", "The ball costs $0.05."] } };
  const SAFETY = [["Harassment", "a rude insult aimed at a person"], ["Dangerous content", "steps to make something dangerous"], ["Hate speech", "an attack on a group of people"], ["Sexual content", "explicit material"]];

  function demo(s) {
    switch (s.id) {
      case "model": return `<div class="apirow">${MODELS.map((m, i) => `<button type="button" class="choice" data-mod="${i}" aria-pressed="${i === 1}">${m.n}</button>`).join("")}</div><div class="apiout" data-out></div>`;
      case "system": return `<p class="apilbl">Same question every time: <b>"What is photosynthesis?"</b> Pick the system instructions:</p><div class="apirow">${Object.entries(SYS).map(([k, [l]], i) => `<button type="button" class="choice" data-sys="${k}" aria-pressed="${i === 0}">${esc(l)}</button>`).join("")}</div><div class="apichat" data-out></div>`;
      case "max": return `<label class="apilbl">Maximum output tokens: <b data-v>30</b><input type="range" class="slider" min="5" max="${LONG.length + 5}" value="30" data-r></label><div class="apiout" data-out></div>`;
      case "temp": return `<p class="apilbl">The model is writing: <b>"The cat sat on the ___"</b>. These are its chances for the next word.</p><label class="apilbl">Temperature: <b data-v>1.0</b><input type="range" class="slider" min="0" max="2" step="0.1" value="1" data-r></label><div data-out></div><div class="apirow"><button type="button" class="btn sm primary" data-gen>Write the next word 10 times</button></div><div class="apichips" data-chips></div>`;
      case "topp": return `<label class="apilbl">Top-p: <b data-v>0.90</b><input type="range" class="slider" min="0.1" max="1" step="0.05" value="0.9" data-r></label><div data-out></div>`;
      case "topk": return `<label class="apilbl">Top-k: <b data-v>3</b><input type="range" class="slider" min="1" max="10" step="1" value="3" data-r></label><div data-out></div>`;
      case "stop": return `<label class="apilbl">Stop sequence: <input class="apiinput" value="Q3:" data-in></label><div class="apiout mono" data-out></div>`;
      case "cand": return `<p class="apilbl">Request: <b>"Suggest a name for a bakery."</b></p><label class="apilbl">Candidates: <b data-v>3</b><input type="range" class="slider" min="1" max="4" step="1" value="3" data-r></label><div class="apirow"><button type="button" class="btn sm primary" data-gen>Ask</button></div><div class="apicands" data-out></div>`;
      case "logp": return `<p class="apilbl">Click a word to see how sure the model was, and what else it considered.</p><div class="apitokens" data-out></div><div class="apiout" data-detail></div>`;
      case "think": return `<p class="apilbl">Tricky question: <b>"A bat and a ball cost $1.10. The bat costs $1.00 more than the ball. How much is the ball?"</b></p><div class="apirow">${Object.keys(EFFORT).map((k, i) => `<button type="button" class="choice" data-eff="${k}" aria-pressed="${i === 0}">${k[0].toUpperCase() + k.slice(1)} effort</button>`).join("")}</div><div data-out></div>`;
      case "tools": return `<div class="apiflow" data-out></div><div class="apirow"><button type="button" class="btn sm" data-back>← Back</button><button type="button" class="btn sm primary" data-step>Next step →</button></div>`;
      case "choice": return `<div class="apirow">${["auto", "required", "specific", "none"].map((k, i) => `<button type="button" class="choice" data-tc="${k}" aria-pressed="${i === 0}">${{ auto: "auto", required: "must use a tool", specific: "must use get_weather", none: "none" }[k]}</button>`).join("")}</div><div data-out></div>`;
      case "par": return `<p class="apilbl">The user asks: <b>"What's the weather in Lahore, Karachi and Islamabad?"</b> Each weather lookup takes 1 second.</p><div class="apirow"><button type="button" class="choice" data-pp="0" aria-pressed="false">One at a time</button><button type="button" class="choice" data-pp="1" aria-pressed="true">In parallel</button><button type="button" class="btn sm primary" data-gen>Run</button></div><div class="apitime" data-out></div>`;
      case "json": return `<p class="apilbl">Request: <b>"Tell me about the film Inception."</b> Your program needs the year.</p><div class="apirow"><button type="button" class="choice" data-js="0" aria-pressed="true">Free text</button><button type="button" class="choice" data-js="1" aria-pressed="false">JSON schema</button></div><div data-out></div>`;
      case "stream": return `<div class="apirow"><button type="button" class="btn sm primary" data-gen>Send the same question both ways</button></div><div class="apistream"><div><p class="apilbl"><b>Streaming on</b> <span data-t1></span></p><div class="apiout" data-o1></div></div><div><p class="apilbl"><b>Streaming off</b> <span data-t2></span></p><div class="apiout" data-o2></div></div></div>`;
      case "safe": return `<p class="apilbl">Gemini-style filter strictness for each category (the example messages are described, not shown):</p><div class="apisafe">${SAFETY.map(([c, d], i) => `<div><b>${c}</b><small>e.g. ${esc(d)}</small><select data-sf="${i}"><option value="0">Block none</option><option value="1">Block only high risk</option><option value="2" selected>Block medium and above</option><option value="3">Block low and above</option></select></div>`).join("")}</div><div data-out></div>`;
    }
    return "";
  }

  // Behaviour for each demo, called after the tab is drawn
  function wire(s, el) {
    const q = (sel) => el.querySelector(sel), out = q("[data-out]");
    const press = (attr, v) => el.querySelectorAll(`[${attr}]`).forEach((b) => b.setAttribute("aria-pressed", b.getAttribute(attr) === String(v)));
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    switch (s.id) {
      case "model": {
        const show = (i) => { const m = MODELS[i]; press("data-mod", i); out.innerHTML = `<p class="apilbl">Task: <b>"Plan a 3-day city trip."</b></p><div class="apimeters">${[["Speed", m.sp], ["Cost", m.cost], ["Capability", m.cap]].map(([l, v]) => `<div><span>${l}</span><span class="track"><i style="width:${v}%"></i></span></div>`).join("")}</div><div class="apibubble ai">${esc(m.a)}</div>`; };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-mod]"); if (b) show(+b.dataset.mod); }); show(1); break;
      }
      case "system": {
        const show = (k) => { press("data-sys", k); out.innerHTML = `<div class="apibubble sys"><b>System:</b> ${esc(SYS[k][0])}</div><div class="apibubble user">What is photosynthesis?</div><div class="apibubble ai">${esc(SYS[k][1])}</div>`; };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-sys]"); if (b) show(b.dataset.sys); }); show("none"); break;
      }
      case "max": {
        const r = q("[data-r]"), show = () => { const n = +r.value, cut = n < LONG.length; q("[data-v]").textContent = n; out.innerHTML = `<p>${LONG.slice(0, n).map((w) => `<span class="tok">${esc(w)}</span>`).join(" ")}${cut ? ' <span class="apibad">… [cut off]</span>' : ""}</p><p class="apilbl">${cut ? `<span class="apibad">Stopped: hit the ${n}-token limit</span> (the answer needed about ${LONG.length}).` : `<span class="apigood">Finished naturally</span> after ${LONG.length} tokens.`} Each box is one token; real tokens are often parts of words.</p>`; };
        r.addEventListener("input", show); show(); break;
      }
      case "temp": {
        const r = q("[data-r]"), chips = q("[data-chips]");
        const show = () => { const T = +r.value; q("[data-v]").textContent = T.toFixed(1); out.innerHTML = bars(softmaxT(T)) + `<p class="apilbl">${T < 0.05 ? "At 0, the model always picks the single most likely word." : T < 0.7 ? "Low: the top word dominates; answers are predictable." : T <= 1.2 ? "Around 1: the model's natural chances." : "High: unlikely words get a real chance; answers get creative, or odd."}</p>`; chips.innerHTML = ""; };
        r.addEventListener("input", show);
        el.addEventListener("click", (e) => { if (!e.target.closest("[data-gen]")) return; const p = softmaxT(+r.value); chips.innerHTML = Array.from({ length: 10 }, () => `<span class="chip">${esc(NEXT[sample(p)][0])}</span>`).join(""); });
        show(); break;
      }
      case "topp": {
        const r = q("[data-r]"), show = () => { const p = +r.value; q("[data-v]").textContent = p.toFixed(2); let sum = 0; const keep = NEXT.map(([, v]) => { const k = sum < p - 1e-9; sum += v; return k; }); const kept = NEXT.reduce((a, [, v], i) => a + (keep[i] ? v : 0), 0); out.innerHTML = bars(NEXT.map(([, v], i) => (keep[i] ? v / kept : 0)), { off: keep.map((k) => !k) }) + `<p class="apilbl">Kept the top ${keep.filter(Boolean).length} words, whose chances add up to at least ${pct(p)}; their chances are rescaled to add up to 100% again.</p>`; };
        r.addEventListener("input", show); show(); break;
      }
      case "topk": {
        const r = q("[data-r]"), show = () => { const k = +r.value; q("[data-v]").textContent = k; const kept = NEXT.slice(0, k).reduce((a, [, v]) => a + v, 0); out.innerHTML = bars(NEXT.map(([, v], i) => (i < k ? v / kept : 0)), { off: NEXT.map((n, i) => i >= k) }) + `<p class="apilbl">Only the ${k} most likely word${k === 1 ? "" : "s"} can be chosen, however likely or unlikely the rest are.</p>`; };
        r.addEventListener("input", show); show(); break;
      }
      case "stop": {
        const FULL = "Q1: What is a token?\nA: A small piece of text.\nQ2: What is a prompt?\nA: The input you give the AI.\nQ3: What is temperature?\nA: How random word choice is.";
        const inp = q("[data-in]"), show = () => { const s0 = inp.value, i = s0 ? FULL.indexOf(s0) : -1; out.innerHTML = i < 0 ? `${esc(FULL)}\n\n<span class="apilbl">The stop sequence never appears, so the whole answer is written.</span>` : `${esc(FULL.slice(0, i))}<span class="apistop">${esc(FULL.slice(i))}</span>\n\n<span class="apilbl">Stopped just before "${esc(s0)}". The crossed-out part is never written (and never billed).</span>`; };
        inp.addEventListener("input", show); show(); break;
      }
      case "cand": {
        const NAMES = ["Rise & Shine Bakery", "The Golden Crust", "Flour Power", "Knead to Know", "Sweet Dough Co.", "Crumbs & Co.", "The Daily Loaf", "Butter Me Up"];
        const r = q("[data-r]"); r.addEventListener("input", () => { q("[data-v]").textContent = r.value; });
        const ask = () => { const pool = NAMES.slice().sort(() => Math.random() - 0.5); out.innerHTML = pool.slice(0, +r.value).map((n, i) => `<div class="apicand"><small>Candidate ${i + 1}</small><b>${esc(n)}</b></div>`).join("") + `<p class="apilbl">${r.value} answers in one request; you pay output tokens for all ${r.value}.</p>`; };
        el.addEventListener("click", (e) => { if (e.target.closest("[data-gen]")) ask(); }); ask(); break;
      }
      case "logp": {
        const TOK = [["The", 0.98, []], ["capital", 0.96, []], ["of", 0.99, []], ["Australia", 0.97, []], ["is", 0.99, []], ["Canberra", 0.62, [["Sydney", 0.31], ["Melbourne", 0.05]]], [".", 0.97, []]];
        out.innerHTML = TOK.map(([w, p], i) => `<button type="button" class="apitok" data-tk="${i}" style="--p:${p}">${esc(w)}<small>${pct(p)}</small></button>`).join(" ");
        const det = q("[data-detail]");
        const show = (i) => { const [w, p, alt] = TOK[i]; det.innerHTML = `<b>"${esc(w)}"</b>: ${pct(p)} sure.${alt.length ? ` It also considered ${alt.map(([a, v]) => `"${esc(a)}" (${pct(v)})`).join(" and ")}. A 31% chance of "Sydney" is a warning sign: this is exactly where a ${word("Hallucination", "hallucination")} could slip in.` : " Very confident."}`; };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-tk]"); if (b) show(+b.dataset.tk); }); show(5); break;
      }
      case "think": {
        const show = (k) => { press("data-eff", k); const E = EFFORT[k], right = E.steps[E.steps.length - 1].includes("0.05"); out.innerHTML = `<div class="apithink">${E.steps.map((t, i) => `<div class="${i === E.steps.length - 1 ? "fin" : ""}">${i === E.steps.length - 1 ? "Answer: " : "Thinking: "}${esc(t)}</div>`).join("")}</div><p class="${right ? "apigood" : "apibad"}">${right ? "✓ Correct: the ball costs 5 cents." : "✗ Wrong: the quick, intuitive answer is 10 cents, but then the bat would cost $1.10 and the total $1.20."}</p><div class="apimeters">${[["Thinking tokens", E.tok], ["Time", E.time], ["Accuracy on hard problems", E.acc]].map(([l, v]) => `<div><span>${l}</span><span class="track"><i style="width:${v}%"></i></span></div>`).join("")}</div><p class="apilbl">Illustrative numbers. Modern models usually get this classic right even at low effort; the point is the trade-off.</p>`; };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-eff]"); if (b) show(b.dataset.eff); }); show("low"); break;
      }
      case "tools": {
        const STEPS = [
          ["You (the developer)", "Send the question plus a tool description: <code>get_weather(city)</code>: \"Returns the current weather for a city.\""],
          ["User", "\"Should I take an umbrella in Lahore today?\""],
          ["AI model", "Can't know today's weather by itself, so it replies with a tool call instead of an answer: <code>get_weather({\"city\": \"Lahore\"})</code>"],
          ["Your code", "Runs the real function: asks a weather service, gets <code>{\"temp\": 34, \"rain_chance\": 70}</code>"],
          ["Your code → AI", "Sends that result back to the model as a tool result."],
          ["AI model", "\"Yes, take an umbrella: there's a 70% chance of rain in Lahore today, though it's warm at 34°C.\""],
        ];
        let i = 0; const show = () => { out.innerHTML = STEPS.map(([who, what], j) => `<div class="apistep${j === i ? " now" : ""}${j > i ? " later" : ""}"><b>${j + 1}. ${who}</b><span>${what}</span></div>`).join("") + `<p class="apilbl">Step ${i + 1} of ${STEPS.length}. The AI never runs code itself; it asks, and your program does the work.</p>`; };
        el.addEventListener("click", (e) => { if (e.target.closest("[data-step]")) { i = Math.min(STEPS.length - 1, i + 1); show(); } if (e.target.closest("[data-back]")) { i = Math.max(0, i - 1); show(); } }); show(); break;
      }
      case "choice": {
        const R = { auto: ["Replies \"Hello! How can I help?\" (no tool needed)", "Calls get_weather(\"Lahore\")", "The model decides. This is the normal setting."], required: ["Must call some tool, even for a greeting (odd!)", "Calls get_weather(\"Lahore\")", "Guarantees a tool call; use only when your app always needs one."], specific: ["Calls get_weather, even for \"Hi!\"", "Calls get_weather(\"Lahore\")", "Always calls that exact tool. (Not available on the newest Claude models.)"], none: ["Replies \"Hello! How can I help?\"", "Can't check: \"I don't have live weather data.\"", "Tools are switched off for this request."] };
        const show = (k) => { press("data-tc", k); const [a, b, n] = R[k]; out.innerHTML = `<div class="apigrid2"><div class="apibubble user">"Hi!"</div><div class="apibubble ai">${esc(a)}</div><div class="apibubble user">"What's the weather in Lahore?"</div><div class="apibubble ai">${esc(b)}</div></div><p class="apilbl">${esc(n)}</p>`; };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-tc]"); if (b) show(b.dataset.tc); }); show("auto"); break;
      }
      case "par": {
        let par = true; const CITIES = ["Lahore", "Karachi", "Islamabad"];
        const run = () => { timers.splice(0).forEach(clearTimeout); out.innerHTML = CITIES.map((c, i) => `<div class="apilane"><span>get_weather("${c}")</span><span class="track"><i data-l="${i}" style="margin-left:${par ? 0 : i * 33.3}%;width:0"></i></span></div>`).join("") + `<p class="apilbl" data-sum>Running…</p>`; CITIES.forEach((c, i) => later(() => { const b = out.querySelector(`[data-l="${i}"]`); if (b) b.style.width = "33.3%"; }, (par ? 0 : i * 1000) + 30)); later(() => { const s0 = out.querySelector("[data-sum]"); if (s0) s0.innerHTML = par ? "<b>Done in about 1 second:</b> all three ran at once." : "<b>Done in about 3 seconds:</b> each waited for the previous one."; }, par ? 1100 : 3100); };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-pp]"); if (b) { par = b.dataset.pp === "1"; press("data-pp", b.dataset.pp); } if (e.target.closest("[data-gen]")) run(); }); run(); break;
      }
      case "json": {
        const show = (on) => { press("data-js", on ? 1 : 0); out.innerHTML = on ? `<div class="apiout mono">Schema you send:\n{ "title": string, "year": integer, "director": string, "genres": [string] }\n\nAnswer:\n{ "title": "Inception", "year": 2010, "director": "Christopher Nolan", "genres": ["science fiction", "thriller"] }</div><p class="apigood">✓ Your program reads <code>answer.year</code> → 2010, every time.</p>` : `<div class="apiout">Sure! Inception is a mind-bending film by Christopher Nolan that came out in the summer of 2010. It mixes science fiction with a heist thriller…</div><p class="apibad">✗ Your program has to dig "2010" out of a sentence, and the wording changes every time.</p>`; };
        el.addEventListener("click", (e) => { const b = e.target.closest("[data-js]"); if (b) show(b.dataset.js === "1"); }); show(false); break;
      }
      case "stream": {
        const o1 = q("[data-o1]"), o2 = q("[data-o2]"), t1 = q("[data-t1]"), t2 = q("[data-t2]");
        const run = () => { timers.splice(0).forEach(clearTimeout); o1.textContent = ""; o2.innerHTML = '<span class="apispin"></span> waiting…'; t1.textContent = ""; t2.textContent = ""; STREAM.forEach((w, i) => later(() => { o1.textContent += (i ? " " : "") + w; if (i === 0) t1.textContent = "· first words after 0.3 s"; }, 300 + i * 110)); later(() => { o2.textContent = STREAM.join(" "); t2.textContent = `· everything after ${(0.3 + STREAM.length * 0.11).toFixed(1)} s`; }, 300 + STREAM.length * 110); };
        el.addEventListener("click", (e) => { if (e.target.closest("[data-gen]")) run(); }); run(); break;
      }
      case "safe": {
        const RISK = [3, 1, 2, 3]; // how risky each example message is: 1 low, 2 medium, 3 high
        const show = () => { const lv = [...el.querySelectorAll("[data-sf]")].map((s0) => +s0.value); out.innerHTML = `<div class="apisafe res">${SAFETY.map(([c], i) => { const blocked = lv[i] > 0 && RISK[i] >= 4 - lv[i]; return `<div><b>${c}</b><span class="${blocked ? "apibad" : "apigood"}">${blocked ? "Blocked" : "Allowed"}</span><small>example is ${["", "low", "medium", "high"][RISK[i]]} risk</small></div>`; }).join("")}</div><p class="apilbl">Stricter settings block more, including some harmless requests (false alarms). Claude's safeguards are built in instead; a declined request ends with <code>stop_reason: "refusal"</code>.</p>`; };
        el.addEventListener("change", (e) => { if (e.target.closest("[data-sf]")) show(); }); show(); break;
      }
    }
    return () => timers.forEach(clearTimeout);
  }

  /* ---------- Request anatomy, table and practice ---------- */
  const REQ = [["model", "\"model\": \"…\",", "model"], ["system", "\"system\": \"You are a friendly science tutor.\",", "system"], ["", "\"messages\": [{ \"role\": \"user\", \"content\": \"What is photosynthesis?\" }],", ""], ["max", "\"max_tokens\": 400,", "max"], ["temp", "\"temperature\": 0.7,", "temp"], ["stop", "\"stop_sequences\": [\"Q3:\"],", "stop"], ["think", "\"reasoning effort\": \"medium\",", "think"], ["tools", "\"tools\": [ get_weather(city) ],", "tools"], ["json", "\"output format\": { JSON schema },", "json"], ["stream", "\"stream\": true", "stream"]];
  const TABLE = [
    ["Choose model", "model", "model", "model"],
    ["System instructions", "instructions / system message", "system_instruction", "system"],
    ["Max output size", "max_output_tokens", "max_output_tokens", "max_tokens"],
    ["Temperature", "temperature", "temperature*", "retired†"],
    ["Top-p sampling", "top_p", "top_p*", "retired†"],
    ["Top-k sampling", "not a main GPT parameter", "top_k*", "retired†"],
    ["Reasoning effort", "reasoning.effort", "thinking_level / thinking config", "thinking: adaptive + output_config.effort"],
    ["Custom functions", "tools (function definitions)", "function declarations / tools", "tools"],
    ["Force / guide tool use", "tool_choice", "tool_config", "tool_choice‡"],
    ["Parallel tool calls", "parallel_tool_calls", "model / tool dependent", "on by default; disable_parallel_tool_use"],
    ["Structured JSON", "text.format / JSON schema", "response_schema", "output_config.format; strict tools"],
    ["Stop generation", "stop (depends on the API)", "stop_sequences", "stop_sequences"],
    ["Multiple candidates", "one per call in the Responses API", "candidate_count (where supported)", "one response per request"],
    ["Token probabilities", "top_logprobs / logprobs (where supported)", "logprobs settings (where supported)", "not offered"],
    ["Streaming", "stream", "streaming APIs", "stream"],
    ["Safety controls", "platform / model safeguards", "safety_settings", "built-in safeguards; refusal stop reason"],
  ];
  const PRACTICE = [
    ["Your homework-help chatbot keeps giving different answers to the same maths question.", "temp", "Lower the temperature (or, on Claude, rely on the default and clear instructions) so the most likely, consistent answer is chosen."],
    ["Your app's answers stop mid-sentence.", "max", "The maximum output size is too small; the model hit the limit."],
    ["Your program must save each customer's name and order number in a database.", "json", "Structured JSON output gives exact, labelled fields every time."],
    ["The bot should always reply in a polite, formal tone as \"Ayesha from support\".", "system", "System instructions set the role and tone for the whole conversation."],
    ["Users stare at a blank screen for 8 seconds before the answer appears.", "stream", "Streaming shows the first words in well under a second."],
    ["The assistant needs today's exchange rate.", "tools", "A custom function (tool) lets your code fetch live data for the model."],
    ["A tricky planning task keeps getting small logic mistakes.", "think", "Raise the reasoning effort so the model thinks it through first."],
    ["You need 4 slogan ideas to choose from in one go.", "cand", "Ask for multiple candidates (where supported), or send several requests."],
  ];

  function html() {
    const sec = (s) => `<div class="card2 apisec" id="api-${s.id}" data-api="${s.id}">
      <div class="apihead"><h3>${esc(s.t)}</h3>${s.words.map((w) => word(w, "📖 " + w)).join("")}</div>
      <p class="apione">${esc(s.one)}</p><p class="apilike"><b>Like:</b> ${esc(s.like)}</p>
      <div class="apidemo">${demo(s)}</div>
      <p class="apiwhen"><b>When to change it:</b> ${esc(s.when)}</p>${names(s.names)}</div>`;
    return `<section class="m2sec apipage" style="max-width:none">
      <header><p class="kicker">For curious users and future developers · about 30 minutes</p><h2>AI settings: the dials behind every AI app</h2>
        <p>When you type into ChatGPT, Gemini or Claude, the app sends your message to the AI model through an ${word("API (Application Programming Interface)", "API")}: a way for one program to talk to another. Along with your message it sends <b>settings</b> you never see in the chat box. Developers choose them, and they explain a lot about why AI answers behave the way they do.</p></header>
      <div class="card2"><p class="kicker">1 · What a request looks like</p><p>Every request is a small bundle of labelled settings. <b>Click any line</b> to jump to its explanation.</p>
        <div class="apireq">{${REQ.map(([id, line]) => `<button type="button" class="apireqline${id ? "" : " plain"}" ${id ? `data-goapi="${id}"` : "disabled"}>  ${esc(line)}</button>`).join("")}}</div>
        <p class="apilbl">Simplified: exact names differ between OpenAI, Gemini and Claude, as each section shows. "messages" is the conversation itself.</p></div>
      ${GROUPS.map((g, gi) => `<h3 class="apigroup">${gi + 2} · ${esc(g)}</h3>${S.filter((s) => s.g === gi).map(sec).join("")}`).join("")}
      <h3 class="apigroup">7 · Everything side by side</h3>
      <div class="card2"><div class="apitable" role="table"><div role="row" class="hd"><span>Setting</span><span>OpenAI / GPT</span><span>Gemini</span><span>Claude</span></div>${TABLE.map((r) => `<div role="row"><span><b>${esc(r[0])}</b></span>${r.slice(1).map((c) => `<span><code>${esc(c)}</code></span>`).join("")}</div>`).join("")}</div>
        <p class="apinote">* Gemini: newer models may fix these values or recommend keeping the defaults. † Claude: Claude 4.7 and later models accept only the default sampling values, and Claude's API version 2026-10-21 removes <code>temperature</code>, <code>top_p</code> and <code>top_k</code> from requests. ‡ Claude: the newest models accept only <code>auto</code> and <code>none</code>. Parameter names change as these APIs evolve, so check each provider's documentation before building.</p></div>
      <h3 class="apigroup">8 · Practice: which setting would you change?</h3>
      <div class="card2 apiprac">${PRACTICE.map(([q0], i) => `<div class="apiq" data-pq="${i}"><p>${i + 1}. ${esc(q0)}</p><select data-pa="${i}"><option value="">Choose a setting…</option>${S.map((s) => `<option value="${s.id}">${esc(s.t)}</option>`).join("")}</select><p class="apifb" data-fb="${i}"></p></div>`).join("")}<p class="apilbl" data-score></p></div>
    </section>`;
  }

  let cleanups = [];
  function mount(root) {
    cleanups.forEach((f) => f()); cleanups = [];
    const page = root.querySelector(".apipage"); if (!page) return;
    page.querySelectorAll("[data-api]").forEach((el) => { const s = S.find((x) => x.id === el.dataset.api); if (s) cleanups.push(wire(s, el.querySelector(".apidemo"))); });
    page.addEventListener("click", (e) => {
      const g = e.target.closest("[data-goapi]"); if (!g) return;
      if (window.WB_NAV) window.WB_NAV.push("Back to the request");
      const t = page.querySelector("#api-" + g.dataset.goapi); if (t) { t.scrollIntoView({ behavior: "smooth", block: "start" }); t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash"); }
    });
    page.addEventListener("change", (e) => {
      const sel = e.target.closest("[data-pa]"); if (!sel) return;
      const i = +sel.dataset.pa, [, right, why] = PRACTICE[i], fb = page.querySelector(`[data-fb="${i}"]`), ok = sel.value === right;
      fb.innerHTML = sel.value ? (ok ? `<span class="apigood">✓ Right.</span> ${esc(why)}` : `<span class="apibad">Not quite.</span> Look again at what is actually going wrong, then re-read the "When to change it" notes above.`) : "";
      sel.closest(".apiq").classList.toggle("ok", ok);
      const done = page.querySelectorAll(".apiq.ok").length; page.querySelector("[data-score]").textContent = `${done} of ${PRACTICE.length} right.`;
    });
  }
  window.WB_M2API = { html, mount, settings: S };
})();
