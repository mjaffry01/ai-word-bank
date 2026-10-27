// Module 4, "Host it on GitHub": a step-by-step wizard that puts the student's chatbot online with GitHub Pages.
// It turns the chatbot from "My first chatbot" into a single index.html the student downloads and uploads.
// The page holds no API key: each visitor pastes their own OpenRouter key, which stays in their browser,
// because GitHub Pages only serves public files and cannot keep a secret.
// Module 4 calls WB_HOST.html() for the tab and WB_HOST.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mine = (k) => (window.WB_mine ? window.WB_mine(k) : k);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const bot = () => (window.WB_BOT ? window.WB_BOT.design() : { name: "My chatbot", greet: "", system: "You are a helpful assistant.", temp: 0.7, len: 400, mem: 99, p: "", m: "", tests: [] });
  const slug = (s) => String(s || "my-chatbot").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-chatbot";

  const STEPS = [
    ["Plan", "How GitHub Pages works"],
    ["Your file", "Get your chatbot as one web page"],
    ["Repository", "Make a home for it on GitHub"],
    ["Upload", "Upload your file"],
    ["Go live", "Turn on GitHub Pages"],
    ["Test", "Test it like a stranger would"],
    ["Share", "Share it safely"],
  ];
  let h = null, msg = "";
  function load() { h = store.get(mine("wb-m4-host"), null) || { step: 0, done: {}, user: "", repo: "", url: "" }; }
  const save = () => store.set(mine("wb-m4-host"), h);
  const liveURL = () => (h.user ? `https://${h.user.trim().toLowerCase()}.github.io/${(h.repo || slug(bot().name)).trim()}/` : "");

  /* ---------- The page students upload ---------- */
  // A whole working chatbot in one file. The visitor's key is kept in sessionStorage (gone when the tab closes).
  function pageFor(d) {
    const cfg = JSON.stringify({ name: d.name, greet: d.greet, system: d.system, temperature: d.temp, max_tokens: d.len, memory: d.mem, model: d.p === "openrouter" ? d.m : "", tests: d.tests }).replace(/</g, "\\u003c");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.name)}</title>
<style>
  :root { --bg:#f6f8fa; --card:#fff; --fg:#17212b; --muted:#5b6b78; --line:#d4dde4; --accent:#1f7a8c; --ink:#fff; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1417; --card:#182026; --fg:#e6edf2; --muted:#93a4b1; --line:#2b3740; --accent:#5cc4d6; --ink:#062027; } }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--fg); }
  main { max-width:720px; margin:0 auto; padding:16px; }
  h1 { margin:8px 0 4px; font-size:1.6rem; }
  .note { color:var(--muted); font-size:.9rem; margin:0 0 12px; }
  .box { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px; margin-bottom:12px; }
  #log { display:flex; flex-direction:column; gap:8px; min-height:260px; max-height:60vh; overflow-y:auto; }
  .m { max-width:85%; padding:8px 12px; border-radius:12px; white-space:pre-wrap; overflow-wrap:anywhere; }
  .u { align-self:flex-end; background:var(--accent); color:var(--ink); }
  .a { align-self:flex-start; border:1px solid var(--line); }
  form, .row { display:flex; gap:8px; flex-wrap:wrap; }
  input, select, button { font:inherit; padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--fg); }
  input, select { flex:1; min-width:0; }
  button { cursor:pointer; }
  button.go { background:var(--accent); color:var(--ink); border-color:var(--accent); }
  .tries { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .tries button { font-size:.85rem; padding:4px 10px; }
  #status { min-height:1.4em; color:var(--muted); font-size:.9rem; margin:6px 0 0; }
  label { font-size:.85rem; color:var(--muted); display:block; margin-bottom:4px; }
</style>
</head>
<body>
<main>
  <h1>${esc(d.name)}</h1>
  <p class="note">A student project chatbot. Answers can be wrong. Don't type personal information.</p>
  <div class="box" id="keybox">
    <label for="key">Your OpenRouter key (it stays in this browser tab and is never saved in this website)</label>
    <div class="row"><input id="key" type="password" placeholder="sk-or-…" autocomplete="off"><button id="savekey" class="go" type="button">Use key</button></div>
    <p class="note" style="margin:6px 0 0">No key? Make a free one at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>.</p>
  </div>
  <div class="box"><label for="model">Model</label><select id="model"><option>Loading free models…</option></select></div>
  <div class="box">
    <div id="log" role="log" aria-live="polite"></div>
    <div class="tries" id="tries"></div>
    <form id="form" style="margin-top:10px"><input id="msg" placeholder="Type a message…" autocomplete="off" maxlength="2000"><button class="go">Send</button><button type="button" id="clear">New chat</button></form>
    <p id="status" role="status"></p>
  </div>
</main>
<script>
const BOT = ${cfg};
const $ = (id) => document.getElementById(id);
const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) {} } };
let key = ss.get("bot-key") || "", history = [], busy = false;
function show(cls, text) { const p = document.createElement("div"); p.className = "m " + cls; p.textContent = text; $("log").appendChild(p); $("log").scrollTop = 1e9; }
function keyUI() { $("keybox").style.display = key ? "none" : ""; }
$("savekey").onclick = () => { key = $("key").value.trim(); if (key) ss.set("bot-key", key); keyUI(); };
$("clear").onclick = () => { history = []; $("log").replaceChildren(); if (BOT.greet) show("a", BOT.greet); $("status").textContent = ""; };
BOT.tests.forEach((q) => { const b = document.createElement("button"); b.type = "button"; b.textContent = q; b.onclick = () => { $("msg").value = q; $("form").requestSubmit(); }; $("tries").appendChild(b); });
fetch("https://openrouter.ai/api/v1/models").then((r) => r.json()).then((d) => {
  const free = (d.data || []).filter((m) => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0);
  // Well-known model makers first, so the default pick is a sensible general model
  const rank = (id) => { const i = ["meta-llama/", "google/", "mistralai/", "qwen/", "deepseek/", "openai/"].findIndex((p) => id.startsWith(p)); return i < 0 ? 99 : i; };
  const list = (free.length ? free : d.data || []).slice().sort((a, b) => rank(a.id) - rank(b.id));
  $("model").innerHTML = "";
  list.forEach((m) => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.name || m.id; $("model").appendChild(o); });
  if (BOT.model && list.some((m) => m.id === BOT.model)) $("model").value = BOT.model;
}).catch(() => { $("model").innerHTML = ""; const o = document.createElement("option"); o.value = BOT.model || "openrouter/auto"; o.textContent = o.value; $("model").appendChild(o); });
$("form").onsubmit = async (e) => {
  e.preventDefault();
  const text = $("msg").value.trim(); if (!text || busy) return;
  if (!key) { $("status").textContent = "Paste your OpenRouter key first."; return; }
  const remembered = BOT.memory >= 99 ? history : BOT.memory ? history.slice(-BOT.memory) : [];
  const messages = [{ role: "system", content: BOT.system }, ...remembered, { role: "user", content: text }];
  busy = true; show("u", text); $("msg").value = ""; $("status").textContent = "Thinking…";
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "X-Title": BOT.name },
      body: JSON.stringify({ model: $("model").value, messages, temperature: BOT.temperature, max_tokens: BOT.max_tokens }) });
    const d = await r.json();
    if (!r.ok) throw new Error(r.status === 401 ? "The key wasn't accepted. Check it, or make a new one." : r.status === 429 ? "Too many requests. Wait a minute, or pick another model." : (d.error && d.error.message) || "Error " + r.status);
    const reply = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "(empty reply)";
    show("a", reply); history.push({ role: "user", content: text }, { role: "assistant", content: reply });
    $("status").textContent = "";
  } catch (err) {
    $("status").textContent = "Couldn't get an answer: " + err.message; $("msg").value = text;
    if (/key/i.test(err.message)) { key = ""; ss.set("bot-key", ""); keyUI(); }
  }
  busy = false; $("msg").focus();
};
keyUI(); if (BOT.greet) show("a", BOT.greet);
</script>
</body>
</html>
`;
  }

  /* ---------- Steps ---------- */
  const tick = (id, label) => `<label class="hostcheck"><input type="checkbox" data-hosttick="${id}" ${h.done[id] ? "checked" : ""}> ${label}</label>`;
  const shot = (rows) => `<div class="hostui">${rows.map(([where, what]) => `<div><span>${where}</span><b>${what}</b></div>`).join("")}</div>`;
  function body() {
    const d = bot(), repo = h.repo || slug(d.name);
    switch (h.step) {
      case 0: return `<p>GitHub Pages turns files in a GitHub repository into a free website at an address like <code>https://yourname.github.io/your-chatbot/</code>.</p>
        <div class="hrfair"><div><p class="lbl good">It can host</p><ul><li>HTML, CSS and JavaScript files</li><li>Images and downloads</li><li>A chat page that talks to an AI from the visitor's browser</li></ul></div>
          <div><p class="lbl bad">It cannot</p><ul><li>Run a server or Python code</li><li><b>Keep a secret.</b> Every file is public, so anyone can read your page's code</li></ul></div></div>
        <div class="botbolt"><p class="lbl">🔩 The nut and bolt: where the API key lives</p><p>Your chatbot needs an API key to talk to a model. If you put <b>your</b> key in the page, anyone can copy it and spend your credit. So this wizard builds a page where <b>each visitor pastes their own key</b>, which stays in their browser tab. That's safe for a class project. For a public chatbot with your own key, you'd add a small server in the middle: see step 7.</p></div>
        ${tick("plan", "I understand: no API key goes into my files")}`;
      case 1: return `<p>This page turns the chatbot you built in <button class="wordlink" data-tab="bot">My first chatbot</button> into one file called <code>index.html</code>. GitHub Pages shows a file with that name automatically.</p>
        <div class="hostsum"><div><span>Name</span><b>${esc(d.name)}</b></div><div><span>Model</span><b>${d.p === "openrouter" && d.m ? esc(d.m) : "visitor picks a free model"}</b></div><div><span>Temperature</span><b>${d.temp}</b></div><div><span>Memory</span><b>${d.mem >= 99 ? "whole chat" : d.mem ? "last " + d.mem + " messages" : "none"}</b></div></div>
        <p class="crit">Want to change it? Go back to My first chatbot, edit it, then come back: the file updates automatically.</p>
        <p class="dzlbl" style="margin-top:12px">Preview</p>
        <iframe class="hostprev" title="Preview of your chatbot page" sandbox="allow-scripts allow-forms" srcdoc="${esc(pageFor(d))}"></iframe>
        <div class="btnrow"><button class="btn primary" data-hostdl>Download index.html</button><button class="btn sm" data-hostcode>${h.showCode ? "Hide" : "Show"} the code</button></div>
        ${h.showCode ? `<pre class="pbox hostcode">${esc(pageFor(d))}</pre>` : ""}
        <p class="crit">Look in the code for <code>BOT = {</code>: that's your system prompt and settings. Everyone who visits can read it, so never put secrets in a system prompt.</p>
        ${tick("file", "I downloaded index.html")}`;
      case 2: return `<ol class="steps3">
          <li><span>Go to <a href="https://github.com/signup" target="_blank" rel="noopener">github.com/signup</a> and make a free account, or sign in. Your username becomes part of your web address, so pick a sensible one.</span></li>
          <li><span>Click the <b>+</b> at the top right, then <b>New repository</b>.</span></li>
          <li><span>Fill in the form:</span></li></ol>
        ${shot([["Repository name", esc(repo)], ["Visibility", "Public"], ["Add README", "On"], ["Button", "Create repository"]])}
        <p class="crit">A <b>repository</b> (repo) is a project folder that remembers every change. Free GitHub Pages sites need the repository to be Public.</p>
        <div class="dzgrid"><div class="field" style="margin:0"><label for="host-user">Your GitHub username</label><input id="host-user" data-hostin="user" value="${esc(h.user)}" placeholder="e.g. sam-smith"></div>
          <div class="field" style="margin:0"><label for="host-repo">Your repository name</label><input id="host-repo" data-hostin="repo" value="${esc(h.repo)}" placeholder="${esc(repo)}"></div></div>
        ${tick("repo", "My repository is created")}`;
      case 3: return `<ol class="steps3">
          <li><span>Open your repository${h.user ? `: <a href="https://github.com/${esc(h.user.trim())}/${esc(repo)}" target="_blank" rel="noopener">github.com/${esc(h.user.trim())}/${esc(repo)}</a>` : ""}.</span></li>
          <li><span>Click <b>Add file</b>, then <b>Upload files</b>.</span></li>
          <li><span>Drag your <code>index.html</code> into the box. It must be called exactly <code>index.html</code>, all lower case, not inside a folder.</span></li>
          <li><span>Write a short message like “Add my chatbot” and click <b>Commit changes</b>.</span></li></ol>
        <div class="botbolt"><p class="lbl">🔩 The nut and bolt: a commit</p><p>A <b>commit</b> is a saved snapshot of your files with a message. Every time you change your chatbot, you upload the new file and commit again, and GitHub keeps the old versions in case you need to go back.</p></div>
        ${tick("upload", "index.html is in my repository")}`;
      case 4: return `<ol class="steps3">
          <li><span>In your repository, click <b>Settings</b> (the tab with the cog), then <b>Pages</b> in the left menu.</span></li>
          <li><span>Under <b>Build and deployment</b>, set:</span></li></ol>
        ${shot([["Source", "Deploy from a branch"], ["Branch", "main"], ["Folder", "/ (root)"], ["Button", "Save"]])}
        <ol class="steps3" start="3"><li><span>Wait one or two minutes, then refresh the Pages screen. A box appears saying <b>Your site is live at</b> and gives the address.</span></li></ol>
        <p class="dzlbl" style="margin-top:12px">Your address will be</p>
        <p class="hosturl">${liveURL() ? `<a href="${esc(liveURL())}" target="_blank" rel="noopener">${esc(liveURL())}</a>` : `<span class="crit">Type your username in step 3 to see it.</span>`}</p>
        <div class="botbolt"><p class="lbl">🔩 The nut and bolt: deployment</p><p>GitHub copies your files to its web servers. This is called <b>deploying</b>. It happens again automatically every time you commit, which is why changes take a minute to show.</p></div>
        ${tick("live", "My site says it is live")}`;
      case 5: return `<p>Open your address on a different device, like a stranger would. Then check each thing:</p>
        <div class="hostticks">${tick("t1", "The page opens and shows my chatbot's name")}${tick("t2", "It asks for a key, and works once I paste mine")}${tick("t3", "It answers a question from its facts correctly")}${tick("t4", "It uses its fallback for something it can't answer")}${tick("t5", "It works on a phone")}${tick("t6", "My own key is NOT written anywhere in index.html")}</div>
        <p class="dzlbl" style="margin-top:14px">If something goes wrong</p>
        <table class="hrtable"><thead><tr><th>What you see</th><th>Try this</th></tr></thead><tbody>
          <tr><td>404 “There isn't a GitHub Pages site here”</td><td>Wait 2 minutes. Check the file is called <code>index.html</code> and is not in a folder, and Pages is set to main and / (root).</td></tr>
          <tr><td>An old version still shows</td><td>Wait a minute after committing, then press Ctrl+Shift+R (Cmd+Shift+R on a Mac).</td></tr>
          <tr><td>“The key wasn't accepted”</td><td>Copy the whole key again, or make a new one at openrouter.ai/keys.</td></tr>
          <tr><td>“Too many requests”</td><td>Free models have limits. Wait a minute or pick another model from the list.</td></tr></tbody></table>`;
      default: return `<div class="hrfair"><div><p class="lbl good">Share it</p><ul><li>Send the link to friends or your teacher. They'll need their own free key.</li><li>Improve it: change your chatbot, download the new index.html, upload it again and commit.</li></ul></div>
          <div><p class="lbl bad">Stay safe</p><ul><li>If you ever paste a key into a file by mistake, <b>delete the key</b> at openrouter.ai/keys straight away. Deleting the file isn't enough: GitHub keeps old versions.</li><li>Your system prompt is public. Don't put anything private in it.</li></ul></div></div>
        <div class="card2 dzsec" style="background:var(--bg)"><p class="kicker">Advanced</p><h3>A public chatbot with your own key</h3>
          <p>To let visitors chat without their own key, the key must live on a server they can't see. GitHub Pages can't do that, so professionals add a tiny server, such as a Cloudflare Worker or a Vercel function:</p>
          <div class="pipeline"><div><span class="n">1</span><b>Your page</b><small>on GitHub Pages, no key</small></div><div><span class="n">2</span><b>Your small server</b><small>holds the key as a secret, checks who's asking, limits how much each person can use</small></div><div><span class="n">3</span><b>Model API</b><small>answers</small></div></div>
          <p class="crit" style="margin-top:8px">Without limits, strangers could use your server to run up your bill. The guide in My first chatbot (chapters 11, 13 and 14) explains what to add before going public.</p></div>
        ${handin()}`;
    }
  }
  function handin() {
    const done = store.get(mine("wb-m4-host-done"), false);
    return `<div class="card2 dzsec" id="hosthand"><p class="kicker">Hand in</p><h3>Send your teacher the link <span class="pill2 ${done ? "done" : ""}" style="vertical-align:middle;margin-left:6px">${done ? "Handed in" : "To do"}</span></h3>
      <div class="field"><label for="host-url">Your live chatbot address</label><input id="host-url" data-hostin="url" value="${esc(h.url || liveURL())}" placeholder="https://yourname.github.io/your-chatbot/"></div>
      <div class="field"><label for="host-ref">What went wrong along the way, and how did you fix it?</label><textarea id="host-ref" data-hostin="ref" rows="3" placeholder="e.g. I got a 404 because my file was called Index.html. I renamed it and it worked.">${esc(h.ref || "")}</textarea></div>
      <div class="btnrow" style="margin:0"><button class="btn primary" data-hosthandin>Hand in my link</button></div>
      <p class="crit" style="margin-top:6px">Your answers are saved on this device as you type.</p>
      <p class="savemsg ${msg.startsWith("✓") ? "ok" : msg && msg !== "Handing in…" ? "err" : ""}" ${msg ? "" : "hidden"}>${esc(msg.replace(/^✓ /, ""))}</p></div>`;
  }
  function wizard() {
    const ticks = Object.values(h.done).filter(Boolean).length;
    return `<ol class="botsteps">${STEPS.map(([s], i) => `<li><button data-hoststep="${i}" aria-current="${i === h.step ? "step" : "false"}" class="${i < h.step ? "done" : ""}"><span>${i + 1}</span>${s}</button></li>`).join("")}</ol>
      <div class="card2 botcard"><p class="kicker">Step ${h.step + 1} of ${STEPS.length} · ${ticks} ${ticks === 1 ? "thing" : "things"} ticked off</p><h3>${STEPS[h.step][1]}</h3>
        ${body()}
        <div class="btnrow">${h.step ? `<button class="btn" data-hostnav="-1">← Back</button>` : ""}${h.step < STEPS.length - 1 ? `<button class="btn primary" data-hostnav="1">Next: ${STEPS[h.step + 1][0]} →</button>` : ""}</div></div>`;
  }
  function html() {
    if (!h) load();
    return `<section class="m2sec"><header><p class="kicker">Publish it · 20 minutes</p><h2>Host your chatbot on GitHub</h2>
      <p>Put the chatbot you built online, free, with GitHub Pages. You'll get a real web address you can share. Build your chatbot in <button class="wordlink" data-tab="bot">My first chatbot</button> first.</p></header>
      <div id="hostwiz">${wizard()}</div></section>`;
  }

  /* ---------- Events ---------- */
  let root = null;
  const redraw = () => { const w = root && root.querySelector("#hostwiz"); if (w) w.innerHTML = wizard(); };
  function mount(el) {
    if (root === el) return; root = el;
    el.addEventListener("click", (e) => {
      const t = e.target;
      const st = t.closest("[data-hoststep]"); if (st) { h.step = +st.dataset.hoststep; save(); redraw(); return; }
      const nv = t.closest("[data-hostnav]"); if (nv) { h.step = Math.max(0, Math.min(STEPS.length - 1, h.step + +nv.dataset.hostnav)); save(); redraw(); root.querySelector(".botsteps").scrollIntoView({ block: "nearest" }); return; }
      if (t.closest("[data-hostcode]")) { h.showCode = !h.showCode; save(); redraw(); return; }
      if (t.closest("[data-hostdl]")) {
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([pageFor(bot())], { type: "text/html" })); a.download = "index.html";
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        h.done.file = true; save(); redraw(); return;
      }
      if (t.closest("[data-hosthandin]")) handIn();
    });
    el.addEventListener("change", (e) => { const k = e.target.dataset && e.target.dataset.hosttick; if (k) { h.done[k] = e.target.checked; save(); const kk = root.querySelector(".botcard .kicker"); if (kk) kk.textContent = (() => { const n = Object.values(h.done).filter(Boolean).length; return `Step ${h.step + 1} of ${STEPS.length} · ${n} ${n === 1 ? "thing" : "things"} ticked off`; })(); } });
    el.addEventListener("input", (e) => {
      const k = e.target.dataset && e.target.dataset.hostin; if (!k) return;
      h[k] = e.target.value; save();
    });
  }
  async function handIn() {
    const show = (m) => { msg = m; const x = root.querySelector("#hosthand"); if (x) x.outerHTML = handin(); };
    const url = (h.url || liveURL()).trim(), ref = (h.ref || "").trim();
    if (!/^https:\/\/[^\s]+\.github\.io\//i.test(url)) return show("Paste your live address first. It looks like https://yourname.github.io/your-chatbot/");
    if (!ref) return show("Write what went wrong and how you fixed it first.");
    if (!window.WB || !window.WB.call) return show("You need to be signed in and approved to hand in work.");
    show("Handing in…");
    try {
      await window.WB.call("saveSubmission", { submission: { module: "Module 4: How LLMs work", task: "Host my chatbot on GitHub", tool: "GitHub Pages", prompt: `LIVE LINK: ${url}\nChatbot: ${bot().name}\nChecks ticked: ${Object.keys(h.done).filter((k) => h.done[k]).join(", ") || "none"}`, reflection: ref.slice(0, 2990) } });
      store.set(mine("wb-m4-host-done"), true); show("✓ Handed in. Your teacher can open your chatbot.");
    } catch (e) { show(e && e.error === "signed_out" ? "Your sign-in has ended. Sign in again, then hand in." : "This could not be handed in. Check your connection and try again."); }
  }

  window.addEventListener("wb-user", () => { h = null; msg = ""; });
  window.WB_HOST = { html, mount, pageFor };
})();
