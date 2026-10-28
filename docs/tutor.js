// AI Tutor: a chat panel where a student brings their own API key (OpenAI, Claude or Gemini), picks a model and a
// topic, and studies it in depth. Besides text, the tutor can draw diagrams and animations (SVG), step-by-step
// slides, flowcharts (Mermaid), pictures (OpenAI and Gemini keys) and course-word links, and it can point at parts
// of this page (open a module or tab, scroll to and highlight some text). The key goes straight from this browser
// to the provider: it is kept for this tab only, unless the student ticks "Remember on this device".
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mine = (k) => (window.WB_mine ? window.WB_mine(k) : k); // a separate key for each signed-in student
  const store = {
    get(s, k, d) { try { const v = s.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(s, k, v) { try { if (v == null) s.removeItem(k); else s.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- Providers ---------- */
  const PROV = {
    openai: { name: "OpenAI (GPT)", short: "OpenAI", hint: "sk-…", keys: "https://platform.openai.com/api-keys", models: ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o-mini"], image: "gpt-image-1" },
    anthropic: { name: "Anthropic (Claude)", short: "Anthropic", hint: "sk-ant-…", keys: "https://console.anthropic.com/settings/keys", models: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"] },
    gemini: { name: "Google (Gemini)", short: "Google", hint: "AIza…", keys: "https://aistudio.google.com/app/apikey", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"], image: "gemini-2.5-flash-image" },
  };
  const LEVELS = { beginner: "Beginner: no background, plain words", some: "Some background", expert: "Advanced: technical depth" };
  const CFG = "wb-tutor";
  let cfg = Object.assign({ prov: "openai", model: {}, imgModel: {}, level: "beginner", autoImg: false, topic: "" }, store.get(localStorage, CFG, {}));
  const saveCfg = () => store.set(localStorage, CFG, cfg);
  const model = () => cfg.model[cfg.prov] || PROV[cfg.prov].models[0];
  const imgModel = () => PROV[cfg.prov].image && (cfg.imgModel[cfg.prov] || PROV[cfg.prov].image);
  // The key: this tab only (sessionStorage), or this device too when the student asks for it
  const keyName = (p) => mine("wb-tutor-key-" + p);
  const getKey = (p = cfg.prov) => store.get(sessionStorage, keyName(p), null) || store.get(localStorage, keyName(p), "") || "";
  const remembered = (p = cfg.prov) => !!store.get(localStorage, keyName(p), "");
  function setKey(p, k, remember) {
    store.set(sessionStorage, keyName(p), k || null);
    store.set(localStorage, keyName(p), remember && k ? k : null);
  }

  /* ---------- Talking to the model (streamed) ---------- */
  async function* sse(res) {
    const rd = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, ""); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim(); if (!d || d === "[DONE]") continue;
        try { yield JSON.parse(d); } catch (e) {}
      }
    }
  }
  async function failure(res) {
    let msg = ""; try { const j = await res.json(); msg = (j.error && (j.error.message || j.error.type)) || j.message || ""; } catch (e) {}
    const why = { 400: "The request was refused", 401: "The key was not accepted. Check that you pasted the whole key", 403: "This key isn't allowed to do that", 404: "That model wasn't found. Check its name, or press \"Load my models\"", 429: "Too many requests, or the account is out of credit", 529: "The service is busy" }[res.status] || "Something went wrong (" + res.status + ")";
    return new Error(why + (msg ? ": " + msg : "."));
  }
  const H = {
    openai: (k) => ({ "Content-Type": "application/json", Authorization: "Bearer " + k }),
    anthropic: (k) => ({ "Content-Type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }),
    gemini: (k) => ({ "Content-Type": "application/json", "x-goog-api-key": k }),
  };
  async function stream(system, msgs, onText, signal) {
    const p = cfg.prov, k = getKey(), m = model();
    let url, body;
    if (p === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      body = { model: m, stream: true, messages: [{ role: "system", content: system }].concat(msgs.map((x) => ({ role: x.role, content: x.text }))) };
    } else if (p === "anthropic") {
      url = "https://api.anthropic.com/v1/messages";
      body = { model: m, max_tokens: 8000, stream: true, system, messages: msgs.map((x) => ({ role: x.role, content: x.text })) };
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:streamGenerateContent?alt=sse`;
      body = { systemInstruction: { parts: [{ text: system }] }, contents: msgs.map((x) => ({ role: x.role === "assistant" ? "model" : "user", parts: [{ text: x.text }] })) };
    }
    const res = await fetch(url, { method: "POST", headers: H[p](k), body: JSON.stringify(body), signal });
    if (!res.ok) throw await failure(res);
    for await (const ev of sse(res)) {
      let t = "";
      if (p === "openai") t = (ev.choices && ev.choices[0] && ev.choices[0].delta && ev.choices[0].delta.content) || "";
      else if (p === "anthropic") { if (ev.type === "error") throw new Error((ev.error && ev.error.message) || "The answer stopped with an error."); if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") t = ev.delta.text; }
      else { const c = ev.candidates && ev.candidates[0]; t = c && c.content && c.content.parts ? c.content.parts.filter((x) => x.text && !x.thought).map((x) => x.text).join("") : ""; }
      if (t) onText(t);
    }
  }
  // The models this key can use, for the model box's suggestions
  async function listModels() {
    const p = cfg.prov, k = getKey();
    const url = { openai: "https://api.openai.com/v1/models", anthropic: "https://api.anthropic.com/v1/models?limit=100", gemini: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200" }[p];
    const res = await fetch(url, { headers: H[p](k) });
    if (!res.ok) throw await failure(res);
    const j = await res.json();
    let ids;
    if (p === "openai") ids = j.data.map((x) => x.id).filter((id) => /^(gpt|o\d|chatgpt)/.test(id) && !/audio|realtime|tts|transcribe|image|search|embedding|instruct/.test(id)).sort().reverse();
    else if (p === "anthropic") ids = j.data.map((x) => x.id);
    else ids = j.models.filter((x) => (x.supportedGenerationMethods || []).includes("generateContent")).map((x) => x.name.replace(/^models\//, "")).filter((id) => /gemini/.test(id)).reverse();
    store.set(localStorage, "wb-tutor-models-" + p, ids);
    return ids;
  }
  async function makeImage(prompt) {
    const p = cfg.prov, k = getKey(), m = imgModel();
    if (p === "openai") {
      const res = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: H.openai(k), body: JSON.stringify({ model: m, prompt, size: "1024x1024", n: 1 }) });
      if (!res.ok) throw await failure(res);
      const d = (await res.json()).data[0];
      return d.b64_json ? "data:image/png;base64," + d.b64_json : d.url;
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, { method: "POST", headers: H.gemini(k), body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!res.ok) throw await failure(res);
    const parts = ((((await res.json()).candidates || [])[0] || {}).content || {}).parts || [];
    const img = parts.find((x) => x.inlineData);
    if (!img) throw new Error("The model answered without a picture. Try again, or pick a picture model in settings.");
    return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
  }

  /* ---------- What the tutor knows about the page ---------- */
  const vis = (el) => !!(el && el.offsetParent !== null && !el.closest(".tut"));
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const modName = (b) => clean(b.textContent).replace(/^Module\s*\d+\s*/i, "");
  function outline() {
    const mods = [...document.querySelectorAll(".modnav [data-module]")].map((b) => `${b.dataset.module}. ${modName(b)}${b.classList.contains("locked") ? " (locked)" : ""}${b.getAttribute("aria-pressed") === "true" ? " ← open now" : ""}`);
    const cur = document.querySelector(".modnav [aria-pressed=true]");
    const tabs = [...document.querySelectorAll(".m2tabs [data-tab], [role=tab]")].filter(vis).map((b) => clean(b.textContent) + (b.getAttribute("aria-selected") === "true" || b.getAttribute("aria-pressed") === "true" ? " (open)" : ""));
    const heads = [...document.querySelectorAll("#app h2, #app h3, #app .kicker")].filter(vis).map((h) => clean(h.textContent)).filter((t) => t && t.length < 120);
    return `Modules:\n${mods.join("\n")}\n\nOpen module: ${cur ? cur.dataset.module + ". " + modName(cur) : "1"}\nTabs in this module: ${tabs.join(" | ") || "none"}\nHeadings visible in this module:\n${[...new Set(heads)].slice(0, 50).join("\n")}`;
  }
  let glossary = null;
  function terms() {
    if (!glossary) { const d = document.getElementById("data"); glossary = new Set(d ? d.textContent.split("\n").map((l) => l.split("|")[0].trim()).filter(Boolean) : []); }
    return glossary;
  }
  function systemPrompt() {
    const P = PROV[cfg.prov], canImg = !!imgModel();
    return `You are a patient, expert AI tutor inside "AI Concepts", a course website that teaches artificial intelligence.
The student wants to study this topic in depth: ${cfg.topic || "(not chosen yet: ask what they'd like to understand)"}.
Student level: ${LEVELS[cfg.level]}.${window.WB_LANG && window.WB_LANG.code !== "en" ? `
The student is reading this course in ${window.WB_LANG.name}. Always reply in ${window.WB_LANG.name}, including the words inside your diagrams; keep standard AI terms in English in brackets the first time you use them.` : ""}

How to teach:
- Go deep, one idea at a time. Keep each reply focused (usually under 250 words plus visuals), then end with one question that checks understanding or offers where to go next.
- Use plain words, define jargon the first time, and give everyday examples. Build on what the student says; correct misunderstandings kindly.
- Use Markdown: short paragraphs, **bold** for key words, lists and small tables where they help.
- Link words from the course glossary like this: [[Token]], [[Large Language Model (LLM)]], [[Overfitting]].

Show, don't just tell. Use a visual whenever it helps, at least every other reply. Your visual tools:
1. Diagram or animation: a \`\`\`svg code block holding one complete <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"> element. Animate with <animate>, <animateTransform>, <animateMotion> (use repeatCount="indefinite" and clear timing) or CSS @keyframes inside <style>. Light background; colours: #0b6e69 teal, #e76f51 orange, #e9c46a yellow, #264653 dark blue, #8ab17d green, #131a1c text. font-family="sans-serif", font-size 14 or more. Label everything. No scripts, links or external images.
2. Step-by-step slides (a story that builds up): a \`\`\`steps code block holding a JSON array of 3 to 6 objects like {"caption": "One sentence", "svg": "<svg xmlns=...>...</svg>"}. Each step's SVG adds to the one before.
3. Flowchart or sequence: a \`\`\`mermaid code block (flowchart, sequenceDiagram, mindmap). Keep labels short; no HTML in labels.
${canImg ? `4. Picture: a \`\`\`image code block holding one detailed prompt for an illustration (for scenes, metaphors and real-world examples; diagrams with text are better as SVG).` : `4. This student's ${P.short} key can't make pictures, so never use image blocks: draw an SVG instead.`}
5. Guide the student on this course page: a \`\`\`guide code block holding one JSON object:
   {"module": "4"} opens a module; {"tab": "Tab name"} opens a tab in the open module; {"word": "Glossary term"} opens a word in the learning web;
   {"show": "exact text that is visible on the page", "note": "what to look at there"} scrolls to it and highlights it.
   Only use modules, tabs and text from the page outline below. Locked modules can't be opened. Add a sentence saying why you're showing it.

Page outline (changes as the student moves around):
${outline()}`;
  }

  /* ---------- Turning a reply into HTML ---------- */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>")
      .replace(/\[\[([^\]]+)\]\]/g, (m, t) => { const w = t.replace(/&amp;/g, "&").replace(/&quot;/g, '"'); return terms().has(w) ? `<button type="button" class="wordlink" data-tutword="${esc(w)}" title="Open in the learning web">${t}</button>` : `<b>${t}</b>`; })
      .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function textHTML(src) {
    const out = [], lines = src.split("\n"); let list = null, para = [];
    const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
    const flushL = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.t}>`); list = null; } };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i], t = l.trim();
      if (!t) { flushP(); flushL(); continue; }
      let m;
      if ((m = t.match(/^(#{1,4})\s+(.*)/))) { flushP(); flushL(); out.push(`<p class="tuth">${inline(m[2])}</p>`); continue; }
      if (/^\|.*\|$/.test(t) && lines[i + 1] && /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
        flushP(); flushL();
        const row = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const head = row(t); i++; const rows = [];
        while (lines[i + 1] && /^\|.*\|$/.test(lines[i + 1].trim())) rows.push(row(lines[++i]));
        out.push(`<div class="tuttable"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      if ((m = t.match(/^([-*•]|\d+[.)])\s+(.*)/))) {
        flushP(); const tp = /\d/.test(m[1]) ? "ol" : "ul";
        if (!list || list.t !== tp) { flushL(); list = { t: tp, items: [] }; }
        list.items.push(m[2]); continue;
      }
      if (list && /^\s{2,}/.test(l)) { list.items[list.items.length - 1] += " " + t; continue; }
      flushL(); para.push(t);
    }
    flushP(); flushL();
    return out.join("");
  }
  // Split a reply into text and visual blocks. An unfinished block (still streaming) is marked open.
  function blocks(src) {
    const out = [], re = /```([\w-]*)[^\n]*\n([\s\S]*?)(```|$)/g; let last = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > last) out.push({ type: "text", src: src.slice(last, m.index) });
      out.push({ type: m[1].toLowerCase() || "code", src: m[2].replace(/\n$/, ""), open: m[3] !== "```" });
      last = re.lastIndex; if (m[3] !== "```") break;
    }
    if (last < src.length) out.push({ type: "text", src: src.slice(last) });
    return out;
  }
  const VISUAL = { svg: "Drawing a diagram", steps: "Making step-by-step slides", mermaid: "Drawing a flowchart", image: "Planning a picture", guide: "Finding the place on the page" };

  // SVG is shown as an image: animations run, but nothing in it can run code or change the page's styles
  function svgURL(svg) {
    let s = String(svg).trim();
    const at = s.search(/<svg[\s>]/i); if (at < 0) return null; s = s.slice(at);
    const end = s.toLowerCase().lastIndexOf("</svg>"); if (end < 0) return null; s = s.slice(0, end + 6);
    if (!/xmlns=/.test(s.slice(0, s.indexOf(">")))) s = s.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    if (!/xmlns:xlink=/.test(s.slice(0, s.indexOf(">"))) && /xlink:/.test(s)) s = s.replace(/<svg/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    s = s.replace(/(<svg[^>]*>)/i, "$1<style>text{font-family:system-ui,'Segoe UI',sans-serif}</style>");
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }
  const svgImg = (svg, alt) => { const u = svgURL(svg); return u ? `<img class="tutsvg" src="${u}" alt="${esc(alt || "Diagram")}" data-zoom>` : `<p class="tuterr">The diagram couldn't be drawn.</p>`; };

  let mermaidP = null;
  function loadMermaid() {
    if (!mermaidP) mermaidP = new Promise((ok, bad) => {
      const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";
      s.onload = () => { window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", flowchart: { htmlLabels: false } }); ok(window.mermaid); };
      s.onerror = () => { mermaidP = null; bad(new Error("The flowchart tool couldn't load.")); };
      document.head.appendChild(s);
    });
    return mermaidP;
  }
  let mid = 0;
  function visual(b, msg) {
    const box = document.createElement("div"); box.className = "tutvis tutvis-" + b.type;
    if (b.type === "svg") box.innerHTML = svgImg(b.src);
    else if (b.type === "steps") {
      let steps = [];
      try { steps = JSON.parse(b.src).filter((x) => x && x.svg); } catch (e) {}
      if (!steps.length) { box.innerHTML = `<p class="tuterr">The slides couldn't be read.</p>`; return box; }
      let i = 0, timer = null;
      const draw = () => {
        box.innerHTML = `<div class="tutframe">${svgImg(steps[i].svg, steps[i].caption)}</div><p class="tutcap"><b>Step ${i + 1} of ${steps.length}.</b> ${inline(steps[i].caption || "")}</p>
          <div class="tutsteps"><button type="button" data-st="prev" ${i ? "" : "disabled"} aria-label="Previous step">◀</button><button type="button" data-st="play">${timer ? "❚❚ Pause" : "▶ Play"}</button><button type="button" data-st="next" ${i < steps.length - 1 ? "" : "disabled"} aria-label="Next step">▶</button>
          <span class="tutdots">${steps.map((s, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</span></div>`;
      };
      const stopT = () => { clearInterval(timer); timer = null; };
      box.addEventListener("click", (e) => {
        const a = e.target.closest("[data-st]"); if (!a) return;
        if (a.dataset.st === "prev") { stopT(); i = Math.max(0, i - 1); }
        if (a.dataset.st === "next") { stopT(); i = Math.min(steps.length - 1, i + 1); }
        if (a.dataset.st === "play") {
          if (timer) stopT();
          else { if (i === steps.length - 1) i = 0; timer = setInterval(() => { if (i < steps.length - 1) { i++; draw(); } else { stopT(); draw(); } }, 3500); }
        }
        draw();
      });
      draw();
    } else if (b.type === "mermaid") {
      box.innerHTML = `<p class="tutwait">Drawing a flowchart…</p>`;
      loadMermaid().then((mm) => mm.render("tutmm" + ++mid, b.src)).then((r) => { box.innerHTML = svgImg(r.svg, "Flowchart"); })
        .catch((e) => { box.innerHTML = `<p class="tuterr">The flowchart couldn't be drawn.</p><pre class="tutcode">${esc(b.src)}</pre>`; document.querySelectorAll("[id^=dtutmm]").forEach((x) => x.remove()); });
    } else if (b.type === "image") {
      const prompt = clean(b.src), key = "img:" + prompt;
      const show = (url) => { box.innerHTML = `<img class="tutpic" src="${esc(url)}" alt="${esc(prompt)}" data-zoom><p class="tutcap">${esc(prompt)}</p>`; };
      const ask = (why) => {
        box.innerHTML = `<p class="tutcap">🎨 <b>Picture idea:</b> ${esc(prompt)}</p>${why ? `<p class="tuterr">${esc(why)}</p>` : ""}
          ${imgModel() ? `<button type="button" class="tutbtn2" data-mk>Create this picture</button><small class="tutsmall">Uses ${esc(imgModel())} on your ${esc(PROV[cfg.prov].short)} account (a few cents).</small>` : `<small class="tutsmall">Your ${esc(PROV[cfg.prov].short)} key can't make pictures. Switch to an OpenAI or Gemini key in ⚙ settings to create it.</small>`}`;
      };
      const go = () => {
        box.innerHTML = `<p class="tutwait">Creating the picture… this can take up to a minute.</p>`;
        makeImage(prompt).then((url) => { pics.set(key, url); show(url); scrollDown(); }).catch((e) => ask(e.message));
      };
      if (pics.has(key)) show(pics.get(key));
      else if (cfg.autoImg && imgModel() && msg && msg.fresh) go();
      else ask();
      box.addEventListener("click", (e) => { if (e.target.closest("[data-mk]")) go(); });
    } else if (b.type === "guide") {
      let g = null; try { g = JSON.parse(b.src); } catch (e) {}
      if (!g) { box.innerHTML = ""; return box; }
      const label = g.module ? `Open Module ${g.module}` : g.tab ? `Open the “${g.tab}” tab` : g.word ? `Show “${g.word}” in the learning web` : g.show ? `Show me on the page` : "Show me";
      box.innerHTML = `<button type="button" class="tutguide">📍 ${esc(label)}</button>${g.note ? `<small class="tutsmall">${esc(g.note)}</small>` : ""}`;
      box.querySelector("button").addEventListener("click", () => guide(g));
      if (msg && msg.fresh && !msg.guided) { msg.guided = true; setTimeout(() => guide(g), 400); }
    } else box.innerHTML = `<pre class="tutcode">${esc(b.src)}</pre>`;
    return box;
  }
  const pics = new Map(); // pictures made this session, so a redraw doesn't make them again

  /* ---------- Pointing at the page ---------- */
  function findText(q) {
    q = clean(q).toLowerCase(); if (!q) return null;
    const tw = document.createTreeWalker(document.getElementById("app") || document.body, NodeFilter.SHOW_TEXT);
    let best = null;
    // Exact text inside one element first; otherwise the smallest visible block that contains it
    for (let n; (n = tw.nextNode());) {
      const el = n.parentElement; if (!vis(el)) continue;
      if (clean(n.textContent).toLowerCase().includes(q)) return el.closest("p,li,h1,h2,h3,h4,button,label,td,th,dt,dd,summary,.card2,section") || el;
    }
    document.querySelectorAll("#app p, #app li, #app h2, #app h3, #app h4, #app button, #app td, #app .card2").forEach((el) => {
      if (!vis(el) || !clean(el.textContent).toLowerCase().includes(q)) return;
      if (!best || el.textContent.length < best.textContent.length) best = el;
    });
    return best;
  }
  function spotlight(el, note) {
    document.querySelectorAll(".tut-spot").forEach((x) => x.classList.remove("tut-spot"));
    document.querySelectorAll(".tutcallout").forEach((x) => x.remove());
    // The panel sits over the page unless the screen is wide, so step aside while pointing
    const aside = panel && !panel.hidden && window.innerWidth < 1100;
    if (aside) peek(true);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("tut-spot");
    const c = document.createElement("div"); c.className = "tutcallout"; c.setAttribute("role", "status");
    c.innerHTML = `<b>✦ Tutor:</b> ${esc(note || "Look here.")}<span class="tutcallbtns"><button type="button" data-cb="ok">Got it</button>${aside ? `<button type="button" data-cb="back">Back to the tutor</button>` : ""}</span>`;
    document.body.appendChild(c);
    const place = () => {
      const r = el.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
      c.style.width = w + "px";
      c.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left)) + window.scrollX + "px";
      const below = r.bottom + 10;
      c.style.top = (below + 120 < window.innerHeight ? below : Math.max(10, r.top - c.offsetHeight - 10)) + window.scrollY + "px";
    };
    setTimeout(place, 450); place();
    const done = () => { el.classList.remove("tut-spot"); c.remove(); };
    c.addEventListener("click", (e) => { const b = e.target.closest("[data-cb]"); if (!b) return; done(); if (b.dataset.cb === "back") peek(false); });
    setTimeout(() => el.classList.remove("tut-spot"), 9000);
  }
  function guide(g) {
    const say = (t) => note(t);
    if (g.module) {
      const b = document.querySelector(`.modnav [data-module="${String(g.module).replace(/\D/g, "")}"]`);
      if (!b) return say(`There's no Module ${g.module}.`);
      if (b.classList.contains("locked")) return say(`Module ${g.module} is locked for now. Your teacher will open it when the class is ready.`);
      if (window.WB_NAV) window.WB_NAV.push();
      b.click(); setTimeout(() => spotlight(b, g.note || `This is Module ${g.module}.`), 300);
    }
    if (g.tab) {
      setTimeout(() => {
        const want = clean(g.tab).toLowerCase();
        const t = [...document.querySelectorAll(".m2tabs [data-tab], [role=tab]")].filter(vis).find((b) => clean(b.textContent).toLowerCase().includes(want));
        if (!t) return say(`I couldn't find a tab called “${g.tab}” here.`);
        t.click(); setTimeout(() => spotlight(t, g.note || `The “${clean(t.textContent)}” tab is open.`), 300);
      }, g.module ? 500 : 0);
    }
    if (g.word) {
      if (typeof window.goWeb !== "function" || !terms().has(g.word)) return say(`“${g.word}” isn't in the course glossary.`);
      if (window.WB_NAV) window.WB_NAV.push();
      if (window.WB_setModule) window.WB_setModule("1");
      window.goWeb(g.word);
      if (panel && !panel.hidden && window.innerWidth < 1100) peek(true);
    }
    if (g.show) {
      setTimeout(() => {
        const el = findText(g.show);
        if (!el) return say(`I couldn't find “${g.show}” on the page right now.`);
        spotlight(el, g.note);
      }, g.module || g.tab ? 900 : 0);
    }
  }

  /* ---------- The panel ---------- */
  let panel = null, fab = null, msgs = store.get(sessionStorage, mine("wb-tutor-chat"), []), busy = null, setup = false;
  const saveChat = () => store.set(sessionStorage, mine("wb-tutor-chat"), msgs.slice(-60).map((m) => ({ role: m.role, text: m.text })));
  const STARTERS = () => {
    const cur = document.querySelector(".modnav [aria-pressed=true]"), name = cur ? modName(cur) : "";
    return [name && `Teach me ${name} step by step`, "How does an AI model pick its next word?", "What happens when I send a message to ChatGPT?", "Explain overfitting with a picture", "How does training a neural network work?"].filter(Boolean);
  };
  const ACTIONS = [["Explain it more simply", "Explain that again more simply, with an everyday example."], ["Go deeper", "Go one level deeper on that. What's really happening underneath?"], ["Draw it", "Draw a labelled diagram of that."], ["Animate it", "Show that as an animation or step-by-step slides."], ["Show me on the page", "Where in this course can I see or try this? Guide me there."], ["Quiz me", "Give me one question to check I understood. Wait for my answer before explaining."]];

  function ensure() {
    if (panel) return;
    panel = document.createElement("aside"); panel.className = "tut"; panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "AI Tutor");
    document.body.appendChild(panel);
    panel.addEventListener("click", onClick);
    panel.addEventListener("keydown", onKey);
    panel.addEventListener("input", onInput);
  }
  function open() {
    ensure(); panel.hidden = false; document.body.classList.add("tut-open");
    if (fab) fab.setAttribute("aria-expanded", "true");
    setup = setup || !getKey(); draw();
    const f = panel.querySelector(setup ? "[data-k=key]" : "textarea"); if (f) f.focus();
  }
  function close() { if (!panel || panel.hidden) return; panel.hidden = true; document.body.classList.remove("tut-open"); if (fab) { fab.setAttribute("aria-expanded", "false"); fab.focus(); } }
  // On a phone the panel covers the page, so step aside while showing something
  function peek(on) { if (!panel) return; panel.classList.toggle("peek", on); if (fab) fab.classList.toggle("peeking", on); }

  function setupHTML() {
    const P = PROV[cfg.prov], k = getKey(), known = store.get(localStorage, "wb-tutor-models-" + cfg.prov, []);
    return `<div class="tutsetup">
      <p class="tutlbl">1 · Choose the AI company</p>
      <div class="tutprov">${Object.entries(PROV).map(([id, p]) => `<button type="button" data-prov="${id}" aria-pressed="${id === cfg.prov}">${esc(p.name)}</button>`).join("")}</div>
      <p class="tutlbl">2 · Paste your secret key <a href="${P.keys}" target="_blank" rel="noopener">Get a ${esc(P.short)} key ↗</a></p>
      <div class="tutkey"><input type="password" data-k="key" value="${esc(k)}" placeholder="${esc(P.hint)}" autocomplete="off" spellcheck="false" aria-label="${esc(P.short)} API key"><button type="button" data-act="showkey" aria-label="Show or hide the key">👁</button></div>
      <label class="tutrow"><input type="checkbox" data-k="remember" ${remembered() ? "checked" : ""}> Remember the key on this device</label>
      <p class="tutsafe">🔒 Your key goes straight from this browser to ${esc(P.short)}. It never reaches this course or your teacher. Without the tick above it's forgotten when you close this tab. Use a key with a spending limit, and don't tick "remember" on a shared computer.</p>
      <p class="tutlbl">3 · Choose the model</p>
      <div class="tutkey"><input data-k="model" list="tutmodels" value="${esc(model())}" spellcheck="false" aria-label="Model name"><button type="button" data-act="models">Load my models</button></div>
      <datalist id="tutmodels">${[...new Set(P.models.concat(known))].map((m) => `<option value="${esc(m)}">`).join("")}</datalist>
      <p class="tutsmall" data-modelnote>${known.length ? `${known.length} models found for your key. Type or pick one.` : "Type any model name, or press “Load my models” to list the ones your key can use."}</p>
      ${P.image ? `<p class="tutlbl">Pictures</p><div class="tutkey"><input data-k="img" value="${esc(imgModel())}" spellcheck="false" aria-label="Picture model"></div>
      <label class="tutrow"><input type="checkbox" data-k="autoImg" ${cfg.autoImg ? "checked" : ""}> Create pictures without asking each time (each costs a few cents)</label>` : `<p class="tutsmall">Claude can't make pictures, so the tutor will draw diagrams and animations instead.</p>`}
      <p class="tutlbl">4 · Your level</p>
      <select data-k="level" aria-label="Your level">${Object.entries(LEVELS).map(([k2, l]) => `<option value="${k2}" ${cfg.level === k2 ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <p class="tuterr" data-err aria-live="polite"></p>
      <div class="tutfoot"><button type="button" class="tutprimary" data-act="save">Start learning</button>${k ? `<button type="button" data-act="forget">Forget my key</button>` : ""}</div>
    </div>`;
  }
  function chatHTML() {
    return `<div class="tuttopic"><label for="tuttopic">Topic</label><input id="tuttopic" data-k="topic" value="${esc(cfg.topic)}" placeholder="What do you want to understand deeply?"></div>
      <div class="tutmsgs" aria-live="polite"></div>
      <div class="tutacts">${msgs.length ? ACTIONS.map(([l, q]) => `<button type="button" data-q="${esc(q)}">${esc(l)}</button>`).join("") : ""}</div>
      <form class="tutcompose"><textarea rows="2" placeholder="Ask anything about AI…" aria-label="Your message"></textarea><button type="submit" class="tutprimary" data-send>${busy ? "■ Stop" : "Send"}</button></form>`;
  }
  function draw() {
    if (!panel) return;
    panel.innerHTML = `<div class="tuthead"><b>✦ AI Tutor</b><span class="tutmodel">${getKey() ? esc(model()) : "not set up"}</span>
      <span class="tuthbtns">${setup ? "" : `<button type="button" data-act="new" title="Start a new chat">＋ New</button><button type="button" data-act="setup" title="Key, model and level" aria-label="Settings">⚙</button>`}<button type="button" data-act="close" aria-label="Close the tutor">✕</button></span></div>
      ${setup ? setupHTML() : chatHTML()}`;
    if (!setup) drawMsgs();
  }
  function msgHTML(m) {
    if (m.role === "user") return `<div class="tutmsg me"><p>${esc(m.text)}</p></div>`;
    if (m.note) return `<div class="tutmsg note"><p>${esc(m.text)}</p></div>`;
    return `<div class="tutmsg ai"></div>`;
  }
  function fillAI(el, m) {
    const parts = blocks(m.text), html = [], vis2 = [];
    parts.forEach((b) => {
      if (b.type === "text") html.push(textHTML(b.src));
      else if (b.open && VISUAL[b.type]) html.push(`<p class="tutwait">${VISUAL[b.type]}…</p>`);
      else if (b.open) html.push(`<pre class="tutcode">${esc(b.src)}</pre>`);
      else { html.push(`<div data-vis="${vis2.length}"></div>`); vis2.push(b); }
    });
    if (m.err) html.push(`<p class="tuterr">${esc(m.err)}${/key|credit|accepted|allowed/i.test(m.err) ? ` <button type="button" class="tutlink" data-act="setup">Check settings</button>` : ""}</p>`);
    if (!m.text && !m.err) html.push(`<p class="tutwait">Thinking…</p>`);
    // Keep visuals already drawn, so streaming doesn't restart their animations
    m.cache = m.cache || new Map();
    const keep = new Map();
    el.innerHTML = html.join("");
    vis2.forEach((b, i) => {
      const id = b.type + ":" + b.src; let node = m.cache.get(id);
      if (!node) node = visual(b, m);
      keep.set(id, node);
      el.querySelector(`[data-vis="${i}"]`).replaceWith(node);
    });
    m.cache = keep;
  }
  function drawMsgs() {
    const box = panel.querySelector(".tutmsgs"); if (!box) return;
    if (!msgs.length) {
      box.innerHTML = `<div class="tutempty"><p class="tuth">What would you like to understand deeply?</p><p>Pick a topic or ask anything. I'll explain one idea at a time, draw diagrams and animations, and show you where to find things in this course.</p>
        <div class="tutstart">${STARTERS().map((s) => `<button type="button" data-q="${esc(s)}" data-topic="1">${esc(s)}</button>`).join("")}</div></div>`;
      return;
    }
    box.innerHTML = msgs.map(msgHTML).join("");
    const nodes = box.children;
    msgs.forEach((m, i) => { if (m.role === "assistant" && !m.note) fillAI(nodes[i], m); });
    scrollDown();
  }
  function scrollDown() { const box = panel && panel.querySelector(".tutmsgs"); if (box) box.scrollTop = box.scrollHeight; }
  function note(t) { msgs.push({ role: "assistant", note: true, text: t }); if (panel && !setup) drawMsgs(); }

  async function send(text) {
    text = clean(text) ? text.trim() : ""; if (!text || busy) return;
    if (!getKey()) { setup = true; draw(); return; }
    if (!cfg.topic) { cfg.topic = text.length < 90 ? text : text.slice(0, 87) + "…"; saveCfg(); }
    const tp = panel.querySelector("#tuttopic"); if (tp && !tp.value) tp.value = cfg.topic;
    msgs.forEach((m) => { m.fresh = false; });
    msgs.push({ role: "user", text });
    const ai = { role: "assistant", text: "", fresh: true }; msgs.push(ai);
    drawMsgs(); setBusy(new AbortController());
    // Find the reply's own bubble each time: a note from the tutor can be added below it while it streams
    const nodeOf = () => { const box = panel.querySelector(".tutmsgs"), i = msgs.indexOf(ai); return box && i >= 0 ? box.children[i] : null; };
    const history = msgs.filter((m) => !m.note && m !== ai && (m.role === "user" || m.text)).slice(-30);
    let raf = 0;
    const paint = () => { raf = 0; const node = nodeOf(); if (node) { const box = node.parentElement, near = box.scrollHeight - box.scrollTop - box.clientHeight < 80; fillAI(node, ai); if (near) scrollDown(); } };
    try {
      await stream(systemPrompt(), history, (t) => { ai.text += t; if (!raf) raf = requestAnimationFrame(paint); }, busy.signal);
      if (!ai.text) ai.err = "The model sent an empty answer. Try again, or choose another model.";
    } catch (e) {
      if (e.name === "AbortError") { if (!ai.text) ai.text = "*(stopped)*"; }
      else ai.err = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "Couldn't reach " + PROV[cfg.prov].short + ". Check your internet connection. (Some school or work networks block AI services.)" : e.message;
    }
    if (raf) cancelAnimationFrame(raf);
    setBusy(null); const el = nodeOf(); if (el) fillAI(el, ai); else drawMsgs();
    scrollDown(); saveChat();
    const acts = panel.querySelector(".tutacts"); if (acts && !acts.children.length) acts.innerHTML = ACTIONS.map(([l, q]) => `<button type="button" data-q="${esc(q)}">${esc(l)}</button>`).join("");
  }
  function setBusy(ctrl) {
    busy = ctrl;
    const b = panel && panel.querySelector("[data-send]"); if (b) { b.textContent = busy ? "■ Stop" : "Send"; b.classList.toggle("stop", !!busy); }
  }

  function readSetup() {
    const v = (k) => panel.querySelector(`[data-k=${k}]`);
    const key = v("key").value.trim();
    setKey(cfg.prov, key, v("remember").checked);
    cfg.model[cfg.prov] = v("model").value.trim() || PROV[cfg.prov].models[0];
    if (v("img")) cfg.imgModel[cfg.prov] = v("img").value.trim();
    if (v("autoImg")) cfg.autoImg = v("autoImg").checked;
    cfg.level = v("level").value; saveCfg();
    return key;
  }
  function onClick(e) {
    const t = e.target, err = (m) => { const x = panel.querySelector("[data-err]"); if (x) x.textContent = m; };
    const w = t.closest("[data-tutword]");
    if (w) { guide({ word: w.dataset.tutword }); return; }
    const z = t.closest("[data-zoom]");
    if (z) { zoom(z); return; }
    const pv = t.closest("[data-prov]");
    if (pv) { readSetup(); cfg.prov = pv.dataset.prov; saveCfg(); draw(); return; }
    const q = t.closest("[data-q]");
    if (q) { if (q.dataset.topic && !cfg.topic) { cfg.topic = q.dataset.q; saveCfg(); } send(q.dataset.q); return; }
    const a = t.closest("[data-act]"); if (!a) return;
    const act = a.dataset.act;
    if (act === "close") close();
    if (act === "setup") { setup = true; draw(); }
    if (act === "new") { if (busy) busy.abort(); msgs = []; cfg.topic = ""; saveCfg(); saveChat(); draw(); const f = panel.querySelector("#tuttopic"); if (f) f.focus(); }
    if (act === "showkey") { const i = panel.querySelector("[data-k=key]"); i.type = i.type === "password" ? "text" : "password"; }
    if (act === "forget") { setKey(cfg.prov, "", false); draw(); }
    if (act === "models") {
      if (!readSetup()) { err("Paste your key first."); return; }
      a.disabled = true; a.textContent = "Loading…";
      listModels().then((ids) => { draw(); const n = panel.querySelector("[data-modelnote]"); if (n) n.textContent = ids.length ? `${ids.length} models found for your key. Click the box to pick one.` : "No chat models found for this key."; })
        .catch((x) => { a.disabled = false; a.textContent = "Load my models"; err(/Failed to fetch/i.test(x.message) ? "Couldn't reach " + PROV[cfg.prov].short + "." : x.message); });
    }
    if (act === "save") {
      if (!readSetup()) { err("Paste your secret key to start. Use “Get a key” if you don't have one yet."); return; }
      setup = false; draw(); const f = panel.querySelector("textarea"); if (f) f.focus();
    }
  }
  function onInput(e) { if (e.target.dataset.k === "topic") { cfg.topic = e.target.value; saveCfg(); } }
  function onKey(e) {
    if (e.key === "Escape") { e.stopPropagation(); if (document.querySelector(".tutzoom")) document.querySelector(".tutzoom").remove(); else close(); return; }
    if (e.target.matches(".tutcompose textarea") && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const v = e.target.value; e.target.value = ""; send(v); }
  }
  function zoom(img) {
    const z = document.createElement("div"); z.className = "tutzoom"; z.setAttribute("role", "dialog"); z.setAttribute("aria-label", "Enlarged picture");
    z.innerHTML = `<img src="${esc(img.src)}" alt="${esc(img.alt)}"><button type="button" aria-label="Close">✕</button>`;
    z.addEventListener("click", () => z.remove()); document.body.appendChild(z); z.querySelector("button").focus();
  }
  document.addEventListener("submit", (e) => {
    if (!e.target.matches(".tutcompose")) return;
    e.preventDefault();
    if (busy) { busy.abort(); return; }
    const ta = e.target.querySelector("textarea"), v = ta.value; ta.value = ""; send(v);
  });

  /* ---------- The launcher ---------- */
  function addFab() {
    fab = document.createElement("button");
    fab.type = "button"; fab.className = "tutfab"; fab.setAttribute("aria-haspopup", "dialog"); fab.setAttribute("aria-expanded", "false");
    fab.title = "Study any AI topic in depth with your own AI model";
    fab.innerHTML = `<span aria-hidden="true">✦</span><span>AI Tutor</span>`;
    fab.addEventListener("click", () => { if (panel && !panel.hidden && !panel.classList.contains("peek")) close(); else { peek(false); open(); } });
    document.body.appendChild(fab);
    // A second way in: in the header, under "Aa Display"
    const side = document.querySelector(".mastside");
    if (side && !side.querySelector(".tutside")) {
      side.insertAdjacentHTML("beforeend", `<button class="tutside" type="button" aria-haspopup="dialog" title="Study any AI topic in depth with your own AI model"><span aria-hidden="true">✦</span><span>AI Tutor</span></button>`);
      const tb = side.querySelector(".tutside");
      tb.addEventListener("click", () => { peek(false); open(); });
      // appearance.js may add its button after this runs: keep ours below it
      const below = () => { const lb = side.querySelector(".lookbtn"); if (lb) lb.after(tb); };
      below(); document.addEventListener("DOMContentLoaded", below); setTimeout(below, 0);
    }
    // Only inside the course, not on the sign-in screen
    const app = document.getElementById("app");
    const sync = () => { fab.hidden = !!(app && app.hidden); if (fab.hidden) close(); };
    sync(); if (app) new MutationObserver(sync).observe(app, { attributes: true, attributeFilter: ["hidden"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addFab); else addFab();
  // A different student on this computer: their own chat and key
  window.addEventListener("wb-user", () => {
    if (busy) busy.abort();
    msgs = store.get(sessionStorage, mine("wb-tutor-chat"), []); setup = !getKey();
    if (panel && !panel.hidden) draw();
  });
  window.WB_TUTOR = { open, ask: (t) => { open(); if (!setup) send(t); } };
})();
