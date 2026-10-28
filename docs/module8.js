// Module 8: Deployment. A lesson on taking an AI app from your laptop to real users, a host chooser,
// a game on keeping API keys secret, a step-by-step request simulator for three set-ups, a cost and
// rate-limit calculator, a launch-day incident game, a launch-plan hand-in and a quiz saved for the teacher.
(function () {
  "use strict";
  const MODULE = "Module 8: Deployment";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const mine = (k) => (window.WB_mine ? window.WB_mine(k) : k); // a key for the signed-in student's own progress
  const word = (term, label) => `<button class="wordlink" data-word="${esc(term)}" title="Open in the learning web">${esc(label || term)}</button>`;
  const json = (o) => JSON.stringify(o, null, 2);
  const money = (x) => x >= 100 || x === Math.round(x) ? "$" + Math.round(x).toLocaleString("en-US") : "$" + x.toFixed(2);

  const TABS = [["learn", "Lesson"], ["host", "Where to host"], ["keys", "Keep keys secret"], ["flow", "Watch a request"], ["cost", "Cost calculator"], ["live", "Launch day"], ["plan", "Plan a launch"], ["quiz", "Quiz"]];
  let tab = store.get("wb-m8-tab", "learn");
  if (!TABS.some((t) => t[0] === tab)) tab = "learn";

  /* ---------- 1. Lesson ---------- */
  let env = "dev";
  const ENVS = {
    dev: { name: "Development", who: "Just you", what: "Your own computer. You change things, break things and try ideas. Nobody else sees it.", eg: "Running the chatbot from Module 4 on your laptop." },
    staging: { name: "Staging", who: "You and a few testers", what: "A private copy of the live app, set up the same way. You test a change here before real users get it.", eg: "A hidden link your classmates try before launch." },
    prod: { name: "Production", who: "Real users", what: "The live app. Changes here affect everyone, so they're tested first and can be undone quickly.", eg: "The public link you share with the whole school." },
  };
  const lesson = () => {
    const E = ENVS[env];
    return `<section class="m2sec">
    <header><p class="kicker">Lesson · 20 minutes</p><h2>Deployment: from your laptop to the world</h2>
      <p>${word("Deployment")} means putting your app somewhere other people can use it, and keeping it working once they do. A chatbot that runs on your laptop is a project. A chatbot with a link that 500 people use every day is a <b>product</b>, and it needs a few more things.</p></header>
    <div class="card2"><p class="kicker">1 · The parts</p><h3>What a deployed AI app is made of</h3>
      <div class="pipeline">
        <div><span class="n">Front end</span><b>The page people see</b><small>HTML, CSS and JavaScript running in the visitor's browser. Anyone can read this code.</small></div>
        <div><span class="n">Back end</span><b>Your code on a server</b><small>Optional. Keeps secrets, checks who's asking, counts usage. Visitors can't read it.</small></div>
        <div><span class="n">Model API</span><b>The AI itself</b><small>A company's ${word("Endpoint", "endpoint")} (Anthropic, OpenAI, Google, OpenRouter…) that runs the model. You pay per ${word("Token", "token")}.</small></div>
      </div>
      <p class="tip" style="margin-top:12px">In Module 4 you built the front end and called the model with a key. Deployment adds the questions: <b>where does each part live, who pays, and what happens when something goes wrong?</b></p></div>
    <div class="card2"><p class="kicker">2 · Three places your app lives</p><h3>Development, staging and production</h3>
      <div class="chips4" style="margin:0 0 12px">${Object.keys(ENVS).map((k) => `<button class="choice" data-m8env="${k}" aria-pressed="${k === env}">${ENVS[k].name}</button>`).join("")}</div>
      <div class="m7prim"><p><b>${E.name}.</b> Who uses it: ${E.who}.</p><p>${E.what}</p><p class="crit" style="margin:0">Example: ${E.eg}</p></div>
      <p class="crit" style="margin:10px 0 0">The golden rule: <b>never try a change for the first time in production.</b></p></div>
    <div class="card2"><p class="kicker">3 · New worries</p><h3>What changes when real people use it</h3>
      <div class="m8grid">
        <div><b>🔑 Secrets</b><p>Your ${word("API Key", "API key")} is like a credit card. If it's in the page, anyone can copy it and spend your money.</p></div>
        <div><b>💸 Cost</b><p>Every message costs tokens. Ten testers cost pennies; ten thousand users can cost hundreds a month.</p></div>
        <div><b>🚦 Limits</b><p>Model providers allow only so many requests a minute (a ${word("Rate Limit", "rate limit")}). Busy apps hit it.</p></div>
        <div><b>⏱ Speed</b><p>People leave if replies are slow (${word("Latency", "latency")}). ${word("Streaming")} shows words as they arrive.</p></div>
        <div><b>🛡 Safety</b><p>Some users will try to trick your bot (${word("Prompt Injection", "prompt injection")}). ${word("Guardrails")} and logs help.</p></div>
        <div><b>📈 Watching</b><p>Once it's live you need to see errors, costs and complaints, and be able to undo a bad change fast.</p></div>
      </div>
      <div class="btnrow"><button class="btn primary" data-tab="host">Next: where to host it →</button></div></div>
  </section>`;
  };

  /* ---------- 2. Where to host ---------- */
  const HOSTS = {
    static: { name: "Static hosting", eg: "GitHub Pages, Netlify, Cloudflare Pages", how: "Serves your HTML, CSS and JS files exactly as they are. No code runs on the host.", good: "Free, fast and simple. Perfect for pages, and for chatbots where each visitor brings their own key (like Module 4's Host it on GitHub).", bad: "There's nowhere to hide a secret: everything you upload is public." },
    func: { name: "Static page + serverless function", eg: "Vercel or Netlify Functions, Cloudflare Workers, AWS Lambda", how: "Your page is static, plus a small function on the host's servers that runs only when called, e.g. /api/chat.", good: "The function holds your API key, so visitors don't need one. Usually free or cheap at small scale. The most common set-up for small AI apps.", bad: "Functions have time limits, and you must add your own limits so strangers can't run up your bill." },
    server: { name: "Your own server or container", eg: "Render, Railway, Fly.io, a cloud virtual machine, Docker", how: "A program that runs all the time, with its own back-end code and database.", good: "Full control: sign-in, databases, long jobs, queues.", bad: "More to set up, update and pay for, even when nobody is using it." },
    gpu: { name: "Hosting the model yourself", eg: "A cloud GPU, Hugging Face Inference Endpoints, Ollama on a server", how: "You run an open model (like Llama, Qwen or Mistral) on graphics cards you rent.", good: "Your data never leaves your servers, and you can use your own fine-tuned model.", bad: "GPUs are expensive and need expert care. Most apps just call a model API instead." },
  };
  const NEEDS = [
    { q: "A class page where each student pastes their own free OpenRouter key.", best: "static", why: "No secret of yours is needed, so plain static hosting is enough. This is exactly the Module 4 Host it on GitHub set-up." },
    { q: "A school help bot. Visitors shouldn't need a key; the school pays for the model.", best: "func", why: "The key must stay hidden, so you need code that runs off the page. A small serverless function is the simplest way." },
    { q: "A homework app with student accounts, saved chats and a database.", best: "server", why: "Accounts and a database need a back end that's always there, so a server or container fits best." },
    { q: "A hospital that isn't allowed to send patient notes to another company.", best: "gpu", why: "The data must stay in-house, so they run an open model on their own hardware." },
  ];
  let hostPick = {}, hostShow = "static";
  const host = () => {
    const H = HOSTS[hostShow];
    return `<section class="m2sec">
    <header><p class="kicker">Explore · 10 minutes</p><h2>Where should your app live?</h2><p>There's no single best host. It depends on one big question: <b>does your app need to keep a secret?</b></p></header>
    <div class="card2"><div class="chips4" style="margin:0 0 12px">${Object.keys(HOSTS).map((k) => `<button class="choice" data-m8host="${k}" aria-pressed="${k === hostShow}">${HOSTS[k].name}</button>`).join("")}</div>
      <div class="m7prim"><p><b>${H.name}.</b> ${H.how}</p><p class="crit" style="margin:0 0 6px">e.g. ${H.eg}</p><p style="margin:0"><span class="lbl good">Good</span> ${H.good}</p><p style="margin:6px 0 0"><span class="lbl bad">Watch out</span> ${H.bad}</p></div></div>
    <div class="card2"><p class="kicker">Match the app to the host</p><h3>Which would you choose?</h3>
      <ol class="m7risks">${NEEDS.map((n, i) => { const p = hostPick[i]; return `<li class="m7tool ${p == null ? "" : p === n.best ? "ok" : "no"}"><p style="margin-top:0">${esc(n.q)}</p>
        <div class="chips4" style="margin:0">${Object.keys(HOSTS).map((k) => `<button class="choice" data-m8need="${i}:${k}" aria-pressed="${p === k}" ${p != null ? "disabled" : ""}>${HOSTS[k].name}</button>`).join("")}</div>
        ${p != null ? `<p class="crit" style="margin:8px 0 0">${p === n.best ? "✓ Good choice." : `✗ Best fit: <b>${HOSTS[n.best].name}</b>.`} ${n.why}</p>` : ""}</li>`; }).join("")}</ol>
      ${Object.keys(hostPick).length === NEEDS.length ? `<div class="btnrow"><button class="btn sm" data-m8needreset>Try again</button><button class="btn primary sm" data-tab="keys">Next: keep keys secret →</button></div>` : ""}</div>
  </section>`;
  };

  /* ---------- 3. Keep keys secret ---------- */
  const SPOTS = [
    { s: "In the JavaScript of your public GitHub Pages site: <code>const KEY = \"sk-…\"</code>", safe: false, why: "Anyone can press F12 or View Source and copy it. Bots scan public sites and code for keys all day." },
    { s: "In a <code>.env</code> file on your laptop, and <code>.env</code> is listed in <code>.gitignore</code>", safe: true, why: "The file stays on your computer and Git won't upload it. This is the normal way to keep keys during development." },
    { s: "Committed to a public GitHub repository, then deleted in the next commit", safe: false, why: "Git keeps history, so the old commit still has it. Leaked keys are often found within minutes. Revoke it and make a new one." },
    { s: "In your hosting platform's <b>environment variables</b> (secrets), read by a serverless function", safe: true, why: "Only your server-side code can read it; it never reaches the visitor's browser." },
    { s: "In a screenshot you post to the class chat to ask for help", safe: false, why: "Screenshots are shared, saved and forwarded. Blur keys before sharing, or better, revoke and replace the key." },
    { s: "In GitHub Actions <b>repository secrets</b>, used by a deploy workflow", safe: true, why: "GitHub stores it encrypted and hides it in logs. It's built for exactly this." },
    { s: "Typed by each visitor into your page and kept in their own browser tab", safe: true, why: "This is the visitor's own key, used only in their browser, as in Module 4's Host it on GitHub. Your key isn't involved at all." },
  ];
  let spotPick = {};
  const keys = () => `<section class="m2sec">
    <header><p class="kicker">Game · 10 minutes</p><h2>Keep your keys secret</h2><p>An ${word("API Key", "API key")} lets anyone who has it use the model <b>on your bill</b>. For each place, decide: safe or leaked?</p></header>
    <ol class="m7risks">${SPOTS.map((r, i) => { const p = spotPick[i]; return `<li class="card2 ${p == null ? "" : p === r.safe ? "ok" : "no"}"><p style="margin-top:0">${r.s}</p>
      <div class="btnrow" style="margin:0"><button class="btn sm ${p === true ? "on" : ""}" data-m8spot="${i}:1" ${p != null ? "disabled" : ""}>Safe</button><button class="btn sm ${p === false ? "on" : ""}" data-m8spot="${i}:0" ${p != null ? "disabled" : ""}>Leaked</button></div>
      ${p != null ? `<p class="crit" style="margin:8px 0 0">${p === r.safe ? "✓ Right." : "✗ Not quite."} ${r.why}</p>` : ""}</li>`; }).join("")}</ol>
    ${Object.keys(spotPick).length === SPOTS.length ? `<div class="card2"><p class="kicker">Your score: ${SPOTS.filter((r, i) => spotPick[i] === r.safe).length} of ${SPOTS.length}</p><h3>If a key leaks</h3><ol><li><b>Revoke it</b> in the provider's dashboard straight away. Deleting the code isn't enough.</li><li><b>Make a new key</b> and put it somewhere safe.</li><li><b>Check the usage page</b> for spending you don't recognise.</li><li><b>Set a spending limit</b> so a future leak can only cost so much.</li></ol><div class="btnrow"><button class="btn sm" data-m8spotreset>Play again</button><button class="btn primary sm" data-tab="flow">Next: watch a request →</button></div></div>` : ""}</section>`;

  /* ---------- 4. Watch a request ---------- */
  const SETUPS = {
    page: { name: "Key in the page", verdict: "bad" },
    proxy: { name: "Back end holds the key", verdict: "good" },
    byok: { name: "Visitor brings a key", verdict: "ok" },
  };
  let setup = "page", fstep = 0;
  const KEY = "sk-or-v1-7f3a…", KEYS = "Authorization: Bearer " + KEY;
  function flowPlan() {
    const ask = "What time does the library close?", reply = "The library closes at 6pm on weekdays and 1pm on Saturdays.";
    const modelCall = { url: "https://openrouter.ai/api/v1/chat/completions", headers: KEYS, body: { model: "a-free-model", messages: [{ role: "system", content: "You are the school help bot…" }, { role: "user", content: ask }] } };
    const back = { choices: [{ message: { role: "assistant", content: reply } }], usage: { prompt_tokens: 64, completion_tokens: 18 } };
    if (setup === "page") return [
      { who: "Visitor opens the page", see: "everyone", say: "The browser downloads your HTML and JavaScript. That JavaScript contains your API key, so <b>every visitor now has a copy</b>.", msg: "// chat.js, downloaded by every visitor\nconst KEY = \"" + KEY + "\";" },
      { who: "Browser → Model API", see: "everyone", say: "The visitor asks a question and their browser calls the model API directly, sending your key. It's visible in the browser's Network tab (F12).", msg: modelCall },
      { who: "Model API → Browser", see: "everyone", say: "The model replies and you are billed for the tokens.", msg: back, chat: reply },
      { who: "Someone copies the key", see: "everyone", say: "Anyone who opens DevTools, or a bot scanning the web, can copy the key and use it for their own app. <b>You pay for all of it</b> until you revoke it.", msg: "curl https://openrouter.ai/api/v1/chat/completions \\\n  -H \"" + KEYS + "\" \\\n  -d '{\"model\": \"the-most-expensive-model\", …}'", end: true },
    ];
    if (setup === "proxy") return [
      { who: "Visitor opens the page", see: "server", say: "The browser downloads your page. There's <b>no key in it</b>: the page only knows the address of your own back end.", msg: "// chat.js\nfetch(\"/api/chat\", { method: \"POST\", body: JSON.stringify({ message }) })" },
      { who: "Browser → Your back end", see: "server", say: "The question goes to your own function, not to the model company.", msg: { url: "https://my-school-bot.example/api/chat", body: { message: ask } } },
      { who: "Your back end checks", see: "server", say: "Your code can now do things a page can't: check the visitor is signed in, refuse anyone sending more than 20 messages an hour, and cut very long messages.", msg: "if (!signedIn(req)) return 401\nif (tooMany(req.user, 20, \"1h\")) return 429\nmessage = message.slice(0, 2000)" },
      { who: "Your back end → Model API", see: "server", say: "Your function adds the key from its environment variables (<code>process.env.OPENROUTER_KEY</code>) and calls the model. The key never leaves your server.", msg: modelCall },
      { who: "Model API → Your back end", see: "server", say: "The reply comes back to your function. It can log the token count so you can watch your costs.", msg: back },
      { who: "Your back end → Browser", see: "server", say: "Your function sends just the answer to the visitor. They never see your key, your system prompt or the token counts.", msg: { reply }, chat: reply, end: true },
    ];
    return [
      { who: "Visitor opens the page", see: "visitor", say: "Your page has no key in it. It asks the visitor to paste <b>their own</b> key.", msg: "// The page keeps the visitor's key in this tab only\nsessionStorage.setItem(\"key\", pastedKey)" },
      { who: "Browser → Model API", see: "visitor", say: "The browser calls the model API with the visitor's key. It's visible in their own DevTools, but it's theirs.", msg: Object.assign({}, modelCall, { headers: "Authorization: Bearer <the visitor's own key>" }) },
      { who: "Model API → Browser", see: "visitor", say: "The model replies. The bill (or the free allowance) is the visitor's, not yours.", msg: back, chat: reply, end: true },
    ];
  }
  const VERDICT = {
    page: "Never do this on a public site. Your key is public, so your bill is too.",
    proxy: "The safe, standard set-up. Your key stays on the server, and you can add sign-in, limits and logs.",
    byok: "Safe for you, and free to host on GitHub Pages. But every visitor needs their own key, so it suits classes and tools for developers, not the general public.",
  };
  const SEE = { everyone: ["🔓", "Who can see your key: everyone"], server: ["🔒", "Who can see your key: only your server"], visitor: ["🔑", "Your key isn't used. Each visitor uses their own"] };
  const flow = () => `<section class="m2sec">
    <header><p class="kicker">Simulator · 15 minutes</p><h2>Watch a request travel</h2><p>The same question, three ways to deploy. Pick a set-up and press <b>Next step</b>. Watch where the key goes.</p></header>
    <div id="m8flow">${flowBody()}</div></section>`;
  function flowBody() {
    const ev = flowPlan(), cur = ev[fstep], shown = ev.slice(0, fstep + 1), last = fstep === ev.length - 1, S = SEE[cur.see], chat = shown.find((e) => e.chat);
    return `<div class="card2"><p class="dzlbl">Set-up</p><div class="chips4" style="margin:4px 0 0">${Object.entries(SETUPS).map(([k, s]) => `<button class="choice" data-m8setup="${k}" aria-pressed="${k === setup}">${s.name}</button>`).join("")}</div></div>
    <div class="m7simgrid">
      <div class="card2 m7chat"><p class="kicker">What the visitor sees</p>
        <div class="botmsgs" style="min-height:120px"><div class="botmsg user">What time does the library close?</div>${chat ? `<div class="botmsg assistant">${esc(chat.chat)}</div>` : ""}</div>
        <p class="m8see ${cur.see}">${S[0]} ${S[1]}</p></div>
      <div class="card2"><p class="kicker">Behind the scenes · step ${fstep + 1} of ${ev.length}</p>
        <ol class="m7log">${shown.map((e, i) => `<li class="${i === fstep ? "now" : ""}"><span class="m7who">${esc(e.who)}</span><p>${e.say}</p>${i === fstep ? `<pre class="pbox m7json">${esc(typeof e.msg === "string" ? e.msg : json(e.msg))}</pre>` : ""}</li>`).join("")}</ol>
        <div class="btnrow">${fstep > 0 ? `<button class="btn sm" data-m8step="-1">← Back</button>` : ""}${!last ? `<button class="btn primary sm" data-m8step="1">Next step →</button>` : `<button class="btn sm" data-m8restart>Start again</button>`}</div>
        ${last ? `<p class="tip m8verdict ${SETUPS[setup].verdict}">${VERDICT[setup]}</p>` : ""}</div></div>`;
  }

  /* ---------- 5. Cost calculator ---------- */
  // Example prices per million tokens, so students can compare sizes. Real prices change: check the provider's page.
  const SIZES = { free: { name: "Free model", inP: 0, outP: 0, rpm: 20 }, small: { name: "Small", inP: 0.25, outP: 1.25, rpm: 500 }, medium: { name: "Medium", inP: 3, outP: 15, rpm: 500 }, large: { name: "Large", inP: 15, outP: 75, rpm: 500 } };
  const COST0 = { size: "small", users: 200, msgs: 8, sys: 500, ask: 60, out: 250, turns: 4, cache: false, budget: 20 };
  let cost = null;
  function loadCost() { cost = Object.assign({}, COST0, store.get(mine("wb-m8-cost"), {})); }
  // Tokens in a message = system prompt + the earlier turns the app resends + the new question
  function estimate(c) {
    const S = SIZES[c.size], hist = Math.max(0, c.turns - 1) * (c.ask + c.out) / 2;
    const msgsDay = c.users * c.msgs, sysIn = c.sys * msgsDay, otherIn = (hist + c.ask) * msgsDay, outT = c.out * msgsDay;
    const sysPrice = c.cache ? S.inP * 0.1 : S.inP; // cached input often costs about a tenth
    const day = (sysIn * sysPrice + otherIn * S.inP + outT * S.outP) / 1e6;
    const peak = Math.ceil(msgsDay / (6 * 60) * 3); // most use squeezed into ~6 busy hours, with spikes 3× the average
    return { msgsDay, inTok: Math.round(c.sys + hist + c.ask), day, month: day * 30, peak, rpm: S.rpm, perMsg: msgsDay ? day / msgsDay : 0 };
  }
  const SLIDERS = [["users", "Users a day", 1, 5000, 1], ["msgs", "Messages per user", 1, 40, 1], ["sys", "System prompt (tokens)", 50, 4000, 50], ["ask", "Question (tokens)", 10, 1000, 10], ["out", "Reply (tokens)", 20, 2000, 10], ["turns", "Turns of chat history resent", 1, 20, 1]];
  const costView = () => { if (!cost) loadCost(); return `<section class="m2sec">
    <header><p class="kicker">Calculator · 10 minutes</p><h2>What will it cost to run?</h2><p>Model APIs charge per ${word("Cost per Token", "token")}, for the words you send in <i>and</i> the words that come back. Move the sliders to see what your app would cost a month.</p></header>
    <div class="card2"><p class="dzlbl">Model size</p><div class="chips4" style="margin:4px 0 12px">${Object.entries(SIZES).map(([k, s]) => `<button class="choice" data-m8size="${k}" aria-pressed="${k === cost.size}">${s.name}${s.inP ? ` · $${s.inP} / $${s.outP}` : ""}</button>`).join("")}</div>
      <div class="m7sliders">${SLIDERS.map(([k, l, a, b, st]) => `<label>${l}: <b id="m8v-${k}">${cost[k].toLocaleString("en-US")}</b><input type="range" min="${a}" max="${b}" step="${st}" value="${cost[k]}" data-m8cost="${k}" aria-label="${l}"></label>`).join("")}</div>
      <label class="hostcheck"><input type="checkbox" data-m8cache ${cost.cache ? "checked" : ""}> Use ${word("Prompt Caching", "prompt caching")} for the system prompt (it's the same every time)</label>
      <div class="field" style="max-width:260px;margin-top:10px"><label for="m8budget">Monthly budget ($)</label><input id="m8budget" type="number" min="0" step="1" value="${cost.budget}" data-m8budget></div>
      <p class="crit" style="margin:4px 0 0">Prices shown are <b>examples</b> in dollars per million tokens (input / output), to compare sizes. Check your provider's price page for real numbers.</p></div>
    <div id="m8costout">${costOut()}</div></section>`; };
  function costOut() {
    const R = estimate(cost), over = cost.size !== "free" && R.month > cost.budget, limited = R.peak > R.rpm;
    return `<div class="m8stats">
      <div><span class="lbl">Messages a day</span><b class="m7big">${R.msgsDay.toLocaleString("en-US")}</b></div>
      <div><span class="lbl">Tokens sent per message</span><b class="m7big">${R.inTok.toLocaleString("en-US")}</b></div>
      <div><span class="lbl">Cost a month</span><b class="m7big ${over ? "m8bad" : ""}">${cost.size === "free" ? "$0" : money(R.month)}</b></div>
      <div><span class="lbl">Busiest minute</span><b class="m7big ${limited ? "m8bad" : ""}">${R.peak.toLocaleString("en-US")}</b><small>requests (limit about ${R.rpm})</small></div></div>
    <div class="card2"><p class="kicker">What this means</p><ul>
      ${cost.size === "free" ? `<li>Free models cost nothing but have <b>small daily and per-minute limits</b>. Fine for testing; a whole school would hit them in minutes.</li>` : `<li>Each message costs about <b>${R.perMsg < 0.01 ? (R.perMsg * 100).toFixed(3) + "¢" : money(R.perMsg)}</b>.${over ? ` That's <b>over your ${money(cost.budget)} budget</b>: try a smaller model, a shorter system prompt, less history, or a limit on messages per user.` : ` That fits your ${money(cost.budget)} budget.`}</li>`}
      ${limited ? `<li><b>You'd hit the rate limit</b> in the busiest minute, and users would see “Error 429: too many requests”. Queue and retry requests, or ask the provider for a higher limit.</li>` : `<li>The busiest minute stays under the provider's limit.</li>`}
      ${cost.turns > 6 ? `<li>Resending ${cost.turns} turns of history makes every message bigger. Long chats get expensive: many apps keep only the last few turns or summarise older ones.</li>` : ""}
      <li>Always set a <b>spending limit</b> in the provider's dashboard, so a bug or a leaked key can't cost more than you can afford.</li></ul></div>`;
  }

  /* ---------- 6. Launch day ---------- */
  const INCIDENTS = [
    { s: "Day 2: your monthly bill jumps from $3 to $240 overnight.", o: ["Revoke the key, check if it leaked, then add a spending limit and a per-user message limit", "Switch to a bigger model so answers are faster", "Delete the app and start again"], why: "A sudden spike usually means a leaked key or someone abusing the app. Stop the bleeding first (revoke), then add limits so it can't happen again." },
    { s: "At 9am, when everyone logs in, users see “Error 429: too many requests”.", o: ["Retry with a short wait, queue requests, and ask for a higher rate limit", "Tell users to refresh faster", "Remove the system prompt"], why: "429 means you've hit the provider's rate limit. Waiting and retrying (backoff) smooths the spikes; a higher tier raises the ceiling." },
    { s: "You get an email: the model your app uses will be retired next month.", o: ["Test a newer model on staging with your usual questions, then switch production", "Do nothing: models never really change", "Switch production to the newest model today without testing"], why: "Models are retired all the time. Pin the version you use, and test the replacement on staging before users see it." },
    { s: "Replies take 15 seconds and people give up.", o: ["Stream the reply word by word, and try a smaller, faster model", "Make the system prompt longer", "Add a loading spinner and do nothing else"], why: "Streaming shows the first words in under a second, and smaller models are faster. Shorter prompts and history help too." },
    { s: "A user tricks the bot into saying something rude and posts a screenshot.", o: ["Check the logs, strengthen the guardrails and moderation, and test the fix on staging", "Delete the screenshot", "Turn off logging so nobody can see what happened"], why: "Logs show what happened, guardrails and a moderation check reduce repeats, and staging lets you test the fix safely." },
    { s: "You edit the system prompt in production and answers suddenly get worse.", o: ["Roll back to the last version that worked, then test changes on staging first", "Keep editing production until it's fixed", "Tell users the AI is having a bad day"], why: "Keep every version of your prompt (Git is perfect for this) so you can undo in seconds. Then try changes on staging with a set of test questions." },
  ];
  let livePick = {};
  const live = () => `<section class="m2sec">
    <header><p class="kicker">Game · 10 minutes</p><h2>Launch day: what would you do?</h2><p>Your chatbot is live. Things go wrong for every real app; good teams fix them calmly. Choose the best response to each problem.</p></header>
    <ol class="m7risks">${INCIDENTS.map((x, i) => { const p = livePick[i]; return `<li class="card2 ${p == null ? "" : p === 0 ? "ok" : "no"}"><p style="margin-top:0"><b>${esc(x.s)}</b></p>
      <div class="m8opts">${order(i).map((j) => `<button class="choice ${p == null ? "" : j === 0 ? "m8right" : j === p ? "m8wrong" : ""}" data-m8live="${i}:${j}" ${p != null ? "disabled" : ""}>${esc(x.o[j])}</button>`).join("")}</div>
      ${p != null ? `<p class="crit" style="margin:8px 0 0">${p === 0 ? "✓ Good call." : "✗ Not the best move."} ${x.why}</p>` : ""}</li>`; }).join("")}</ol>
    ${Object.keys(livePick).length === INCIDENTS.length ? `<div class="card2"><p class="kicker">Your score: ${INCIDENTS.filter((x, i) => livePick[i] === 0).length} of ${INCIDENTS.length}</p><h3>What good teams always have ready</h3><ul><li><b>Limits</b>: a spending cap and a per-user message limit.</li><li><b>Logs</b>: errors, slow replies and token counts, so you can see problems.</li><li><b>Staging</b>: a safe copy to test fixes and new models.</li><li><b>Rollback</b>: every version saved, so a bad change can be undone in seconds.</li><li>A <b>${word("Fallback", "fallback")}</b>: a backup model or a friendly message if the AI is down.</li></ul><div class="btnrow"><button class="btn sm" data-m8livereset>Play again</button><button class="btn primary sm" data-tab="plan">Next: plan your launch →</button></div></div>` : ""}</section>`;
  // The right answer isn't always first on screen: a fixed shuffle per question
  const order = (i) => [[1, 0, 2], [0, 2, 1], [2, 1, 0], [1, 2, 0], [0, 1, 2], [2, 0, 1]][i % 6];

  /* ---------- 7. Hand-in: plan a launch ---------- */
  const HOSTOPT = { static: "Static hosting (GitHub Pages)", func: "Static page + serverless function", server: "A server or container", gpu: "Our own model on GPUs" };
  const KEYOPT = { visitor: "Each visitor brings their own key", env: "In the host's environment variables (secrets)", page: "In the page's JavaScript" };
  const EXAMPLE = { app: "Library help bot", what: "Answers questions about our school library: opening hours, finding books and how to reserve them.", users: "About 150 students a day, mostly at lunchtime", host: "func", key: "env", model: "A small model via OpenRouter, with a free model on staging", budget: "15",
    limits: "20 messages per student per hour; questions cut to 2,000 characters; a $15 monthly spending limit in the provider dashboard", watch: "Errors and 429s, slow replies, daily token cost, and a thumbs-down button that logs bad answers", rollback: "The system prompt and code are in Git. We test changes on a staging link first and can redeploy the previous version in one click.", ref: "" };
  let plan = null, pmsg = "";
  function loadPlan() { plan = store.get(mine("wb-m8-plan"), null) || { app: "", what: "", users: "", host: "", key: "", model: "", budget: "", limits: "", watch: "", rollback: "", ref: "" }; }
  const savePlan = () => store.set(mine("wb-m8-plan"), plan);
  // Checks a reviewer would make, each true when passed
  function pchecks() {
    const C = [], add = (ok, text) => C.push([ok, text]);
    add(!!plan.app.trim() && plan.what.trim().length >= 20, "It says what the app is and what it does.");
    add(!!plan.users.trim(), "It estimates who will use it and how many.");
    add(!!plan.host, "It picks where to host it.");
    add(!!plan.key && plan.key !== "page", "The API key is never in the page's JavaScript.");
    add(!(plan.host === "static" && plan.key === "env"), "The key choice works with the host (static hosting can't hide a secret).");
    add(+plan.budget > 0, "It sets a monthly budget.");
    add(/limit|per (user|student|hour|day)|cap/i.test(plan.limits), "It limits usage, so one person (or a leaked key) can't run up the bill.");
    add(plan.watch.trim().length >= 15, "It says what to watch once it's live (errors, costs, feedback).");
    add(/roll ?back|previous|undo|staging|test/i.test(plan.rollback), "It can test changes first and undo a bad one.");
    return C;
  }
  function planBody() {
    const C = pchecks(), passed = C.filter((c) => c[0]).length, done = store.get(mine("wb-m8-plan-done"), false), est = cost || (loadCost(), cost), R = estimate(est);
    const f = (k, label, ph, rows) => `<div class="field"><label for="m8p-${k}">${label}</label>${rows ? `<textarea id="m8p-${k}" data-m8p="${k}" rows="${rows}" placeholder="${esc(ph)}">${esc(plan[k])}</textarea>` : `<input id="m8p-${k}" data-m8p="${k}" value="${esc(plan[k])}" placeholder="${esc(ph)}">`}</div>`;
    const pick = (k, opts) => `<div class="chips4" style="margin:4px 0 12px">${Object.entries(opts).map(([v, l]) => `<button class="choice" data-m8pick="${k}:${v}" aria-pressed="${plan[k] === v}">${l}</button>`).join("")}</div>`;
    return `<div class="card2"><p class="kicker">Step 1 · The app</p><h3>What are you launching?</h3>
        <p class="crit" style="margin:0 0 10px">Use the chatbot you designed in Module 4, or any AI app you'd like to build. <button class="wordlink" data-m8pex>Show me a finished example</button></p>
        <div class="dzgrid">${f("app", "App name", "e.g. Library help bot")}${f("users", "Who will use it, and how many?", "e.g. about 150 students a day")}</div>
        ${f("what", "What does it do?", "e.g. answers questions about our school library", 2)}</div>
      <div class="card2 dzsec"><p class="kicker">Step 2 · Where it lives</p><h3>Hosting and the key</h3>
        <p class="dzlbl">Where will you host it?</p>${pick("host", HOSTOPT)}
        <p class="dzlbl">Where will the API key live?</p>${pick("key", KEYOPT)}
        ${plan.key === "page" ? `<p class="savemsg err" style="margin:0 0 10px">Anyone could copy a key in the page. Look again at <button class="wordlink" data-tab="keys">Keep keys secret</button>.</p>` : ""}
        ${plan.host === "static" && plan.key === "env" ? `<p class="savemsg err" style="margin:0 0 10px">Static hosting runs no code of yours, so it has nowhere to read a secret from. Pick a serverless function, or let visitors bring their own key.</p>` : ""}</div>
      <div class="card2 dzsec"><p class="kicker">Step 3 · Cost and limits</p><h3>What will it cost, and what stops it running away?</h3>
        <p class="crit" style="margin:0 0 10px">Your <button class="wordlink" data-tab="cost">Cost calculator</button> settings come to about <b>${est.size === "free" ? "$0 (free model)" : money(R.month) + " a month"}</b>.</p>
        <div class="dzgrid">${f("model", "Which model, and why?", "e.g. a small model: fast and cheap enough")}${f("budget", "Monthly budget ($)", "e.g. 15")}</div>
        ${f("limits", "What limits will you set?", "e.g. 20 messages per student per hour; a spending limit in the dashboard", 2)}</div>
      <div class="card2 dzsec"><p class="kicker">Step 4 · After launch</p><h3>Watching and undoing</h3>
        ${f("watch", "What will you watch once it's live?", "e.g. errors, slow replies, daily cost, thumbs-down feedback", 2)}
        ${f("rollback", "How will you test changes and undo a bad one?", "e.g. test on a staging link first; keep versions in Git and redeploy the last good one", 2)}</div>
      <div class="card2 dzsec"><p class="kicker">Step 5 · Review</p><h3>${passed} of ${C.length} checks passed</h3>
        <ul class="m7checks">${C.map(([ok, t]) => `<li class="${ok ? "ok" : ""}">${ok ? "✓" : "○"} ${t}</li>`).join("")}</ul></div>
      <div class="card2 dzsec"><p class="kicker">Step 6 · Hand in</p><h3>Your launch plan <span class="pill2 ${done ? "done" : ""}" style="vertical-align:middle;margin-left:6px">${done ? "Handed in" : "To do"}</span></h3>
        ${f("ref", "What is most likely to go wrong in your first week, and what will you do?", "e.g. lunchtime rush hits the rate limit: we queue requests and show 'busy, trying again…'", 3)}
        <div class="btnrow" style="margin:0"><button class="btn primary" data-m8phand>Hand in my plan</button></div>
        <p class="crit" style="margin-top:6px">Your plan is saved on this device as you type.</p>
        <p class="savemsg ${pmsg.startsWith("✓") ? "ok" : pmsg && pmsg !== "Handing in…" ? "err" : ""}" ${pmsg ? "" : "hidden"}>${esc(pmsg.replace(/^✓ /, ""))}</p></div>`;
  }
  const planView = () => { if (!plan) loadPlan(); return `<section class="m2sec">
    <header><p class="kicker">Hand-in · 25 minutes · goes to your teacher</p><h2>Plan a launch</h2><p>Write the plan a real team writes before going live: where the app runs, where the key lives, what it costs, and what you'll do when something breaks.</p></header>
    <div id="m8plan">${planBody()}</div></section>`; };
  // Refresh only the review, so typing isn't interrupted
  function refreshChecks() {
    const ul = document.querySelector("#m8plan .m7checks"); if (!ul) return;
    const C = pchecks(); ul.innerHTML = C.map(([ok, t]) => `<li class="${ok ? "ok" : ""}">${ok ? "✓" : "○"} ${t}</li>`).join("");
    ul.closest(".card2").querySelector("h3").textContent = `${C.filter((c) => c[0]).length} of ${C.length} checks passed`;
  }
  async function handInPlan() {
    const show = (m) => { pmsg = m; put("m8plan", planBody()); };
    if (!plan.app.trim() || !plan.host || !plan.key) return show("Fill in the app, where to host it and where the key lives first.");
    if (!plan.ref.trim()) return show("Answer the question about your first week first.");
    if (!window.WB || !window.WB.call) return show("You need to be signed in and approved to hand in work.");
    show("Handing in…");
    const C = pchecks(), R = estimate(cost || (loadCost(), cost));
    const summary = `APP: ${plan.app}\nDOES: ${plan.what}\nUSERS: ${plan.users}\nHOST: ${HOSTOPT[plan.host]}\nKEY: ${KEYOPT[plan.key]}\nMODEL: ${plan.model}\nBUDGET: $${plan.budget}/month (calculator estimate: ${cost.size === "free" ? "$0, free model" : money(R.month)})\nLIMITS: ${plan.limits}\nWATCH: ${plan.watch}\nROLLBACK: ${plan.rollback}\nCHECKS: ${C.filter((c) => c[0]).length}/${C.length}`;
    try {
      await window.WB.call("saveSubmission", { submission: { module: MODULE, task: "Plan a launch", tool: "Launch planner", prompt: summary.slice(0, 2990), reflection: plan.ref.slice(0, 2990) } });
      store.set(mine("wb-m8-plan-done"), true); show("✓ Handed in. Your teacher can see your launch plan.");
    } catch (e) { show(e && e.error === "signed_out" ? "Your sign-in has ended. Sign in again, then hand in." : "This could not be handed in. Check your connection and try again."); }
  }

  /* ---------- 8. Quiz ---------- */
  const QS = [
    { q: "What does deploying an app mean?", o: ["Putting it somewhere other people can use it, and keeping it working", "Training a new AI model", "Writing the app's first line of code", "Deleting the test version"], why: "Deployment takes an app from your computer to real users, and includes running it well afterwards." },
    { q: "Where should you try a change before real users see it?", o: ["Staging", "Production", "In the live app, late at night", "Nowhere: changes are always safe"], why: "Staging is a private copy of production for testing changes safely." },
    { q: "Why must an API key never be in a public page's JavaScript?", o: ["Anyone can view the code, copy the key and spend your money", "It makes the page load slowly", "Browsers can't read keys", "It breaks the model"], why: "Everything sent to the browser is public. A key there is a key for everyone." },
    { q: "You accidentally pushed a key to a public GitHub repo. What first?", o: ["Revoke the key in the provider's dashboard", "Delete the file in the next commit and carry on", "Make the repo private and carry on", "Wait and see if anyone uses it"], why: "Git history and bots mean it may already be copied. Revoking makes the leaked key useless." },
    { q: "Where can a serverless function safely read your API key from?", o: ["The host's environment variables (secrets)", "A comment in the HTML", "The page's URL", "The visitor's browser history"], why: "Environment variables are only visible to code running on the server." },
    { q: "Which set-up lets visitors use your bot without their own key, while keeping yours hidden?", o: ["A back end (like a serverless function) that adds the key", "Putting the key in the page", "GitHub Pages on its own", "Emailing the key to users"], why: "The back end calls the model for the visitor, so the key never reaches the browser." },
    { q: "What does “Error 429” usually mean?", o: ["Too many requests: you've hit a rate limit", "The page wasn't found", "The model is too small", "Your answer was correct"], why: "429 is the standard “too many requests” code. Wait and retry, queue, or raise the limit." },
    { q: "Why do long conversations cost more per message?", o: ["The app resends the earlier messages each time, so more input tokens", "Models charge more at night", "Longer words cost extra", "They don't cost more"], why: "Models don't remember. The history is sent again with every message and you pay for it each time." },
    { q: "What does streaming a reply do?", o: ["Shows the answer word by word as it's generated, so it feels faster", "Makes the reply cheaper", "Saves the chat to a file", "Uses a video connection"], why: "Streaming doesn't change the total time much, but the first words appear almost at once." },
    { q: "What's the best protection against a surprise bill?", o: ["A spending limit and per-user message limits", "A bigger model", "Turning off logs", "Using a longer system prompt"], why: "Caps mean a bug, abuser or leaked key can only cost so much." },
    { q: "Your new system prompt makes answers worse in production. What now?", o: ["Roll back to the last good version, then test changes on staging", "Keep editing production until it works", "Delete the app", "Ignore it"], why: "Versioned prompts and code make rollback quick; staging stops it happening again." },
    { q: "When might a team host an open model on its own GPUs instead of calling an API?", o: ["When its data must not leave its own servers", "Always: it's the cheapest option", "When the app is a simple class page", "Never: it isn't possible"], why: "Self-hosting is costly and complex, but keeps data in-house and allows custom models." },
  ];
  const QZ = { qs: null, i: 0, picked: null, score: 0, missed: [], save: null, result: null };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz() { QZ.qs = shuffle(QS.map((x) => ({ q: x.q, why: x.why, right: x.o[0], opts: shuffle(x.o.slice()) }))); Object.assign(QZ, { i: 0, picked: null, score: 0, missed: [], save: null, result: null }); render(); }
  const quiz = () => {
    if (!QZ.qs) {
      const best = store.get(mine("wb-m8-best"), null);
      return `<section class="m2sec"><header><p class="kicker">Check your understanding</p><h2>Module 8 quiz</h2><p>${QS.length} questions on deployment. Your score and answers go to your teacher.</p></header>
        <div class="card2"><p class="crit" style="margin:0 0 10px">${best ? `Your best: <b>${best.s} / ${best.n}</b>` : "Not tried yet"}</p><button class="btn primary" data-m8start>Start the quiz</button></div></section>`;
    }
    const n = QZ.qs.length;
    const head = `<div class="qhead"><span>${esc(MODULE)}</span><span>${QZ.i < n ? `Question ${QZ.i + 1} of ${n} · ` : ""}Score ${QZ.score}</span></div><div class="bar2"><i style="width:${Math.min(1, (QZ.i + (QZ.picked !== null ? 1 : 0)) / n) * 100}%"></i></div>`;
    if (QZ.i >= n) {
      const pct = Math.round(QZ.score / n * 100);
      const saveTxt = { saving: "Saving your result…", saved: "Result saved. Your teacher can see it.", failed: "This result could not be saved yet. Your answers are kept: check your connection, then press Retry saving." }[QZ.save];
      return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qkind">Result</p><div class="score">${QZ.score} / ${n}</div>
        ${saveTxt ? `<p class="savestate${QZ.save === "failed" ? " bad" : ""}">${saveTxt}</p>` : ""}${QZ.save === "failed" ? `<div class="btnrow" style="justify-content:center"><button class="btn primary" data-m8retry>Retry saving</button></div>` : ""}
        <p>${pct === 100 ? "Perfect. You're ready to launch." : pct >= 75 ? "Strong result. Look over the misses below." : "Go back through the lesson and the simulator, then try again."}</p>
        ${window.WB_CERT ? window.WB_CERT.block({ title: `${MODULE} quiz`, score: QZ.score, total: n, saved: QZ.save, match: { kind: "module", module: MODULE, level: "Deployment" } }) : ""}
        ${QZ.missed.length ? `<p class="qkind" style="margin-top:20px">Review these</p><ul class="missed">${QZ.missed.map((q) => `<li><div class="q">${esc(q.q)}</div><div><b>${esc(q.right)}</b>. ${esc(q.why)}</div></li>`).join("")}</ul>` : ""}
        <div class="qfoot"><button class="btn" data-m8start>Take it again</button></div></div></div></section>`;
    }
    const q = QZ.qs[QZ.i], done = QZ.picked !== null;
    return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qprompt">${esc(q.q)}</p>
      <div class="opts">${q.opts.map((o, j) => { const cls = done ? (o === q.right ? " right" : j === QZ.picked ? " wrong" : "") : ""; return `<button class="opt${cls}" data-m8opt="${j}" ${done ? "disabled" : ""}><span class="k">${"ABCD"[j]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>
      ${done ? `<div class="verdict">${q.opts[QZ.picked] === q.right ? `<span class="v good">Correct.</span>` : `<span class="v bad">Not quite.</span>`}<p>${esc(q.why)}</p></div>
      <div class="qfoot"><button class="btn primary" data-m8next>${QZ.i + 1 < n ? "Next question" : "See results"}</button></div>` : ""}</div></div></section>`;
  };
  function answer(j) {
    const q = QZ.qs[QZ.i]; if (QZ.picked !== null || !q.opts[j]) return;
    QZ.picked = j; q.chosen = q.opts[j];
    if (q.chosen === q.right) QZ.score++; else QZ.missed.push(q);
    if (QZ.i === QZ.qs.length - 1) {
      const n = QZ.qs.length, best = store.get(mine("wb-m8-best"), null);
      if (!best || QZ.score / n > best.s / best.n) store.set(mine("wb-m8-best"), { s: QZ.score, n });
      if (window.WB && window.WB.call) {
        QZ.result = { module: MODULE, level: "Deployment", score: QZ.score, total: n, answers: QZ.qs.map((x) => ({ kind: "Module 8 · Deployment", question: x.q, chosen: x.chosen, correct: x.right, ok: x.chosen === x.right })) };
        saveResult();
      }
    }
    render();
  }
  // A failed save keeps the answers in QZ.result so the student can retry without retaking the quiz
  function saveResult() {
    const qs = QZ.qs; QZ.save = "saving";
    window.WB.call("saveModuleQuiz", { result: QZ.result })
      .then(() => { QZ.save = "saved"; }, () => { QZ.save = "failed"; }).then(() => { if (QZ.qs === qs && tab === "quiz" && !$("m8").hidden) render(); });
  }

  /* ---------- Rendering and events ---------- */
  const VIEWS = { learn: lesson, host, keys, flow, cost: costView, live, plan: planView, quiz };
  function render() {
    $("m8body").innerHTML = `<nav class="m2tabs" role="tablist">${TABS.map(([k, l], i) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}"><span class="step">${i + 1}</span>${l}</button>`).join("")}</nav>${VIEWS[tab]()}`;
  }
  function goTab(k) { tab = k; store.set("wb-m8-tab", k); render(); window.scrollTo({ top: $("m8").offsetTop - 8 }); }
  const put = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const saveCost = () => store.set(mine("wb-m8-cost"), cost);

  $("m8body").addEventListener("click", (e) => {
    const t = e.target;
    const tb = t.closest("[data-tab]"); if (tb) { goTab(tb.dataset.tab); return; }
    const w = t.closest("[data-word]"); if (w) { if (window.WB_NAV) window.WB_NAV.push(); window.WB_setModule && window.WB_setModule("1"); if (typeof goWeb === "function") goWeb(w.dataset.word); return; }
    const en = t.closest("[data-m8env]"); if (en) { env = en.dataset.m8env; render(); return; }
    const hs = t.closest("[data-m8host]"); if (hs) { hostShow = hs.dataset.m8host; render(); return; }
    const nd = t.closest("[data-m8need]"); if (nd) { const [i, k] = nd.dataset.m8need.split(":"); hostPick[+i] = k; render(); return; }
    if (t.closest("[data-m8needreset]")) { hostPick = {}; render(); return; }
    const sp = t.closest("[data-m8spot]"); if (sp) { const [i, v] = sp.dataset.m8spot.split(":"); spotPick[+i] = v === "1"; render(); return; }
    if (t.closest("[data-m8spotreset]")) { spotPick = {}; render(); return; }
    const su = t.closest("[data-m8setup]"); if (su) { setup = su.dataset.m8setup; fstep = 0; put("m8flow", flowBody()); return; }
    const st = t.closest("[data-m8step]"); if (st) { fstep = Math.max(0, Math.min(flowPlan().length - 1, fstep + +st.dataset.m8step)); put("m8flow", flowBody()); return; }
    if (t.closest("[data-m8restart]")) { fstep = 0; put("m8flow", flowBody()); return; }
    const sz = t.closest("[data-m8size]"); if (sz) { cost.size = sz.dataset.m8size; saveCost(); render(); return; }
    const lv = t.closest("[data-m8live]"); if (lv) { const [i, j] = lv.dataset.m8live.split(":"); livePick[+i] = +j; render(); return; }
    if (t.closest("[data-m8livereset]")) { livePick = {}; render(); return; }
    const pk = t.closest("[data-m8pick]"); if (pk) { const [k, v] = pk.dataset.m8pick.split(":"); plan[k] = v; savePlan(); put("m8plan", planBody()); return; }
    if (t.closest("[data-m8pex]")) { if ((plan.app || plan.what) && !confirm("Replace your plan with the example?")) return; plan = Object.assign({}, EXAMPLE, { ref: plan.ref }); savePlan(); put("m8plan", planBody()); return; }
    if (t.closest("[data-m8phand]")) { handInPlan(); return; }
    if (t.closest("[data-m8start]")) { startQuiz(); return; }
    if (t.closest("[data-m8retry]")) { if (QZ.result && window.WB && window.WB.call) { saveResult(); render(); } return; }
    const o = t.closest("[data-m8opt]"); if (o) { answer(+o.dataset.m8opt); return; }
    if (t.closest("[data-m8next]")) { QZ.i++; QZ.picked = null; render(); }
  });
  $("m8body").addEventListener("input", (e) => {
    const d = e.target.dataset || {};
    if (d.m8p) { plan[d.m8p] = e.target.value; savePlan(); refreshChecks(); return; }
    if (d.m8cost) { cost[d.m8cost] = +e.target.value; put("m8v-" + d.m8cost, cost[d.m8cost].toLocaleString("en-US")); saveCost(); put("m8costout", costOut()); return; }
    if (d.m8budget !== undefined) { cost.budget = Math.max(0, +e.target.value || 0); saveCost(); put("m8costout", costOut()); return; }
    if (d.m8cache !== undefined) { cost.cache = e.target.checked; saveCost(); put("m8costout", costOut()); }
  });
  document.addEventListener("keydown", (e) => {
    if ($("m8").hidden || tab !== "quiz" || !QZ.qs || QZ.i >= QZ.qs.length || QZ.picked !== null || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = "1234abcd".indexOf(e.key.toLowerCase()); if (k >= 0) answer(k % 4);
  });
  // A different student signed in (or the last one signed out): forget the open quiz and show their own progress
  window.addEventListener("wb-user", () => {
    plan = null; cost = null; pmsg = "";
    Object.assign(QZ, { qs: null, i: 0, picked: null, score: 0, missed: [], save: null, result: null });
    if (!$("m8").hidden) render();
  });

  (window.WB_MODULES = window.WB_MODULES || {})["8"] = render;
})();
