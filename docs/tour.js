// Guided tour of Modules 1 and 2: dims the page, lights up one part at a time and explains it, with Back / Next,
// arrow keys and Esc. Started from "Take the tour" in the header; first-time visitors get a small offer once.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mine = (k) => (window.WB_mine ? window.WB_mine(k) : k);
  const $$ = (s) => [...document.querySelectorAll(s)].filter((el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const mod = (m) => { if (window.WB_setModule) window.WB_setModule(m); };
  const m2open = () => { const b = document.querySelector('.modnav [data-module="2"]'); return !!b && !b.classList.contains("locked"); };
  const tabs = (...k) => k.map((x) => `.m2tabs [data-tab="${x}"]`).join(",");

  // sel: what to light up (all matches are joined into one box; one: only the first). go: get the page ready first.
  const M1 = [
    { sel: ".modnav", t: "Your modules", x: "The course is split into modules. Start with <b>Module 1</b>. A 🔒 means your teacher hasn't opened that module yet.", go: () => mod("1") },
    { sel: "#q", t: "Search", x: "Type any word, such as <i>token</i> or <i>prompt</i>, to find it among the course's 660 AI terms and their meanings." },
    { sel: ".seg", t: "Five ways to study", x: "<b>Learning web</b>: see how words connect. <b>Learning path</b>: learn them in order. <b>Glossary</b>: an A–Z list. <b>Flashcards</b>: test your memory. <b>Ring quiz</b>: check a whole ring at once." },
    { sel: "#chips", t: "Pick a topic", x: "Show only one topic, such as <i>Prompting</i> or <i>Ethics &amp; safety</i>. The number tells you how many words it has." },
    { sel: ".web .stage", t: "The learning web", x: "The core words sit in the centre. Each ring outward builds on the rings inside it, so learn from the centre out. <b>Click any dot</b> to open that word.", go: () => { const b = document.getElementById("mWeb"); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); } },
    { sel: ".web .zoom", t: "Zoom", x: "Zoom in and out, or press <b>Fit</b> to see the whole web again." },
    { sel: "#panel", t: "The word panel", x: "When you pick a word, it shows here: what it means, an example and which words to learn first. <b>← Back</b> returns to the word before." },
    { sel: "#mCards, #mQuiz", t: "Test yourself", x: "When a ring feels familiar, try <b>Flashcards</b> and the <b>Ring quiz</b> to check what stuck." },
    { sel: "#main", t: "Ask an AI about any word", x: "<b>Right-click</b> any word or sentence on the course pages to ask an AI chat to explain it or give examples." },
    { sel: ".lookbtn", t: "Make it easy to read", x: "<b>Aa Display</b> changes the text size, font and colours. Its <b>Read aloud</b> part picks the voice that reads paragraphs to you." },
    { sel: "#panel p, #main p", one: true, t: "Hear any paragraph", x: "Point at a paragraph (or tap it on a phone) and a 🔊 button appears beside it. It reads just that paragraph. Select some text to hear only that part." },
    { sel: ".tutside", t: "Your AI Tutor", x: "Study any AI topic in depth with your own AI model. The tutor draws diagrams and animations, and can show you where things are in the course." },
  ];
  const M2 = [
    { sel: '.modnav [data-module="2"]', t: "Module 2: Prompting & AI tools", x: "Now put the words to work: write prompts that get good answers, and catch AI when it makes things up.", go: async () => { mod("2"); await wait(250); const t = document.querySelector('.m2tabs [data-tab="model"]'); if (t) t.click(); } },
    { sel: ".m2tabs", t: "Work through the tabs", x: "Each module is a row of numbered tabs. Go from left to right: each one builds on the one before. Swipe or scroll the row to see them all." },
    { sel: tabs("model", "learn"), t: "1–2 · Understand it", x: "<b>How AI answers</b> shows what happens after you press send. The <b>Lesson</b> teaches the prompt formula: Role + Task + Context + Format + Example." },
    { sel: tabs("build", "tech"), t: "3–4 · Write better prompts", x: "The <b>Prompt builder</b> helps you put a strong prompt together, part by part. <b>Techniques</b> shows the main prompting methods with examples." },
    { sel: tabs("api", "play", "open"), t: "5–7 · Settings and models", x: "<b>AI settings</b> explains temperature, tokens and more. The <b>Model playground</b> lets you compare models. <b>Open models</b> lists AI you can download and run yourself." },
    { sel: tabs("hunt"), t: "8 · Hallucination hunt", x: "Catch an AI making things up, then change your prompt so it doesn't, and measure how often it happens." },
    { sel: tabs("tasks", "quiz"), t: "9–10 · Show what you learned", x: "Do the <b>Practice tasks</b> and hand them in, then take the <b>Quiz</b>. Both are saved for your teacher." },
    { sel: "#m2body .m2sec", t: "Lessons have things to try", x: "Most tabs mix short explanations with things to click, type and test. Blue underlined words open in the learning web." },
  ];
  const END = { t: "You're ready!", x: "Start with Module 1's learning web, then move on to Module 2. You can take this tour again any time from <b>🧭 Take the tour</b> at the top of the page." };

  let steps = [], i = 0, box = null, hole = null, card = null, target = [];
  function build(which) {
    steps = [];
    if (which !== "2") steps.push(...M1);
    if (which !== "1") {
      if (m2open()) steps.push(...M2);
      else steps.push({ sel: '.modnav [data-module="2"]', t: "Module 2 is next", x: "Module 2 (Prompting & AI tools) is locked for now. Your teacher will open it when the class is ready, and you can take its tour then.", go: () => mod("1") });
    }
    steps.push(END);
  }

  function start(which) {
    stop(); build(which); i = 0;
    document.querySelectorAll(".touroffer").forEach((x) => x.remove());
    try { localStorage.setItem(mine("wb-tour-seen"), "1"); } catch (e) {}
    box = document.createElement("div"); box.className = "tour";
    box.innerHTML = `<div class="tourhole"></div><div class="tourcard" role="dialog" aria-modal="true" aria-labelledby="tourt"></div>`;
    document.body.appendChild(box);
    hole = box.querySelector(".tourhole"); card = box.querySelector(".tourcard");
    card.addEventListener("click", onClick);
    box.addEventListener("click", (e) => { if (e.target === box) next(); });
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
    show();
  }
  function stop() {
    if (!box) return;
    box.remove(); box = null;
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
    try { localStorage.setItem(mine("wb-tour-seen"), "1"); } catch (e) {}
    const b = document.querySelector(".tourbtn"); if (b) b.focus();
  }
  async function show() {
    const s = steps[i]; if (!s) return stop();
    if (s.go) await s.go();
    if (s.go) await wait(150);
    target = s.sel ? $$(s.sel) : [];
    if (s.one) target = target.slice(0, 1);
    // A step whose part isn't on screen (a narrow phone, say) is shown in the middle instead
    if (target.length) {
      const first = target[0];
      first.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    }
    card.innerHTML = `<p class="tourstep">${i + 1} of ${steps.length}</p><h3 id="tourt">${esc(s.t)}</h3><p>${s.x}</p>
      <div class="tourbtns"><button type="button" data-tour="skip" class="tourskip">${i === steps.length - 1 ? "Close" : "Skip tour"}</button>
        <span>${i ? `<button type="button" data-tour="back">← Back</button>` : ""}<button type="button" data-tour="next" class="tourgo">${i === steps.length - 1 ? "Finish ✓" : "Next →"}</button></span></div>
      <div class="tourbar"><i style="width:${((i + 1) / steps.length) * 100}%"></i></div>`;
    place();
    const go = card.querySelector(".tourgo"); if (go) go.focus({ preventScroll: true });
  }
  function rect() {
    if (!target.length) return null;
    const rs = target.map((el) => el.getBoundingClientRect()).filter((r) => r.width || r.height);
    if (!rs.length) return null;
    const pad = 6;
    const r = { left: Math.min(...rs.map((x) => x.left)) - pad, top: Math.min(...rs.map((x) => x.top)) - pad, right: Math.max(...rs.map((x) => x.right)) + pad, bottom: Math.max(...rs.map((x) => x.bottom)) + pad };
    // Keep the light on screen when the part is bigger than the window
    r.left = Math.max(4, r.left); r.top = Math.max(4, r.top); r.right = Math.min(window.innerWidth - 4, r.right); r.bottom = Math.min(window.innerHeight - 4, r.bottom);
    return r.right > r.left && r.bottom > r.top ? r : null;
  }
  function place() {
    if (!box) return;
    const r = rect(), vw = window.innerWidth, vh = window.innerHeight, w = Math.min(360, vw - 24);
    card.style.width = w + "px";
    if (!r) { hole.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0`; card.style.left = (vw - w) / 2 + "px"; card.style.top = Math.max(12, (vh - card.offsetHeight) / 2) + "px"; return; }
    hole.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.right - r.left}px;height:${r.bottom - r.top}px`;
    const h = card.offsetHeight, gap = 12;
    let top = r.bottom + gap <= vh - h - 8 ? r.bottom + gap : r.top - gap - h >= 8 ? r.top - gap - h : vh - h - 12;
    let left = Math.min(vw - w - 12, Math.max(12, r.left));
    // Beside a tall part when there's no room above or below it
    if (top === vh - h - 12 && r.right + gap + w < vw) { left = r.right + gap; top = Math.min(vh - h - 12, Math.max(12, r.top)); }
    card.style.left = left + "px"; card.style.top = top + "px";
  }
  function next() { if (i < steps.length - 1) { i++; show(); } else stop(); }
  function back() { if (i > 0) { i--; show(); } }
  function onClick(e) {
    const b = e.target.closest("[data-tour]"); if (!b) return;
    ({ next, back, skip: stop })[b.dataset.tour]();
  }
  function onKey(e) {
    if (!box) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); stop(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
    else if (e.key === "Tab") { // keep keyboard focus inside the tour card
      const f = [...card.querySelectorAll("button")]; if (!f.length) return;
      const k = f.indexOf(document.activeElement);
      if (e.shiftKey && k <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && k === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }

  /* ---------- Starting the tour ---------- */
  function menu(anchor) {
    closeMenu();
    const m = document.createElement("div"); m.className = "tourmenu"; m.setAttribute("role", "menu");
    m.innerHTML = `<p>Which tour?</p>
      <button type="button" role="menuitem" data-pick="both">Modules 1 and 2 <small>about 3 minutes</small></button>
      <button type="button" role="menuitem" data-pick="1">Module 1: Vocabulary <small>about 2 minutes</small></button>
      <button type="button" role="menuitem" data-pick="2">Module 2: Prompting &amp; AI tools <small>about 1 minute</small></button>`;
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(), w = Math.min(280, window.innerWidth - 24);
    m.style.width = w + "px";
    m.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.right - w)) + window.scrollX + "px";
    m.style.top = r.bottom + 8 + window.scrollY + "px";
    m.addEventListener("click", (e) => { const p = e.target.closest("[data-pick]"); if (p) { closeMenu(); start(p.dataset.pick); } });
    m.querySelector("button").focus();
  }
  function closeMenu() { document.querySelectorAll(".tourmenu").forEach((x) => x.remove()); }
  document.addEventListener("click", (e) => { if (!e.target.closest(".tourmenu, .tourbtn")) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  function offer() {
    let seen = false; try { seen = !!localStorage.getItem(mine("wb-tour-seen")); } catch (e) {}
    if (seen || document.querySelector(".touroffer") || box) return;
    const o = document.createElement("div"); o.className = "touroffer"; o.setAttribute("role", "status");
    o.innerHTML = `<p><b>New here?</b> Take a 3-minute tour of Modules 1 and 2.</p><div><button type="button" class="tourgo" data-o="go">Show me around</button><button type="button" data-o="no">No thanks</button></div>`;
    document.body.appendChild(o);
    o.addEventListener("click", (e) => {
      const b = e.target.closest("[data-o]"); if (!b) return;
      o.remove();
      if (b.dataset.o === "go") start("both"); else try { localStorage.setItem(mine("wb-tour-seen"), "1"); } catch (x) {}
    });
  }

  function addButton() {
    const side = document.querySelector(".mastside"); if (!side || side.querySelector(".tourbtn")) return;
    side.insertAdjacentHTML("beforeend", `<button class="tourbtn" type="button" aria-haspopup="menu" title="A short guided tour of the course"><span aria-hidden="true">🧭</span><span>Take the tour</span></button>`);
    const b = side.querySelector(".tourbtn");
    b.addEventListener("click", () => { if (document.querySelector(".tourmenu")) closeMenu(); else menu(b); });
    // Keep it last, under Display and AI Tutor, which other scripts add around now
    const last = () => side.appendChild(b);
    document.addEventListener("DOMContentLoaded", last); setTimeout(last, 0);
    // Offer the tour once the course is showing (not on the sign-in screen)
    const app = document.getElementById("app");
    const check = () => { if (app && !app.hidden) setTimeout(offer, 1200); };
    check(); if (app) new MutationObserver(check).observe(app, { attributes: true, attributeFilter: ["hidden"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton); else addButton();
  window.addEventListener("wb-user", () => { document.querySelectorAll(".touroffer").forEach((x) => x.remove()); const app = document.getElementById("app"); if (app && !app.hidden) setTimeout(offer, 1200); });
  window.WB_TOUR = { start, stop };
})();
