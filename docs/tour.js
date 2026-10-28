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

  // sel: what to light up, as a selector or a function (all matches are joined into one box; one: only the first).
  // go: get the page ready first. leave: tidy up after. still: don't scroll (it would close a menu being shown).
  const M1 = [
    { sel: ".modnav", t: "Your modules", x: "The course is split into modules. Start with <b>Module 1</b>. A 🔒 means your teacher hasn't opened that module yet.", go: () => mod("1") },
    { sel: "#q", t: "Search", x: "Type any word, such as <i>token</i> or <i>prompt</i>, to find it among the course's 660 AI terms and their meanings." },
    { sel: ".seg", t: "Five ways to study", x: "<b>Learning web</b>: see how words connect. <b>Learning path</b>: learn them in order. <b>Glossary</b>: an A–Z list. <b>Flashcards</b>: test your memory. <b>Ring quiz</b>: check a whole ring at once." },
    { sel: "#chips", t: "Pick a topic", x: "Show only one topic, such as <i>Prompting</i> or <i>Ethics &amp; safety</i>. The number tells you how many words it has." },
    { sel: ".web .stage", t: "The learning web", x: "The core words sit in the centre. Each ring outward builds on the rings inside it, so learn from the centre out. <b>Click any dot</b> to open that word.", go: () => { const b = document.getElementById("mWeb"); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); } },
    { sel: ".web .zoom", t: "Zoom", x: "Zoom in and out, or press <b>Fit</b> to see the whole web again." },
    { sel: "#panel", t: "The word panel", x: "When you pick a word, it shows here: what it means, an example and which words to learn first. <b>← Back</b> returns to the word before." },
    { sel: "#mCards, #mQuiz", t: "Test yourself", x: "When a ring feels familiar, try <b>Flashcards</b> and the <b>Ring quiz</b> to check what stuck." },
    // The Toolkit in the header, then each of its tools
    { sel: ".toolkitlbl, .mastside .lookbtn, .mastside .tutside, .mastside .tourbtn, .mastside .langbtn", t: "Your Toolkit", x: "At the top right of every page, the <b>Toolkit</b> holds tools that work across the whole course: <b>Display</b> for easier reading, the <b>AI Tutor</b>, <b>Take the tour</b> and the <b>language</b> button. Let's see what each one does.", go: () => window.scrollTo(0, 0) },
    // Read aloud: show the real buttons on a real paragraph
    { sel: () => [para(), ...$$(".wbread, .wbvbtn")], still: true, keep: () => pointAt(), t: "Read aloud: one paragraph at a time", x: "Point at any paragraph (on a phone, tap it) and a <b>🔊</b> button appears beside it, like here. Press it to hear <b>just that paragraph</b>, highlighted as it's read. Press it again (■) or <b>Esc</b> to stop.", go: async () => { clearSel(); const p = para(); if (!p) return; p.scrollIntoView({ block: "center" }); await wait(300); if (window.WB_READ && window.WB_READ.point) window.WB_READ.point(p); } },
    { sel: ".wbvbtn, .wbvmenu", still: true, keep: () => { pointAt(); const v = document.querySelector(".wbvbtn"); if (v && !document.querySelector(".wbvmenu:not([hidden])")) v.click(); }, t: "Choose the voice", x: "The <b>🗣</b> button under 🔊 lists the voices. Pick one to hear a short sample; it's remembered. In <b>Microsoft Edge</b>, the ★ voices sound the most human.", go: async () => { const v = document.querySelector(".wbvbtn"); if (v && !v.hidden) { if (!document.querySelector(".wbvmenu:not([hidden])")) v.click(); } }, leave: () => { const m = document.querySelector(".wbvmenu:not([hidden])"); if (m) document.querySelector(".wbvbtn").click(); } },
    { sel: () => [para(), ...$$(".wbread")], still: true, t: "Read only the part you need", x: "Too many lines? <b>Select</b> a few words or a sentence, and a <b>Read selection</b> button appears. It reads only what you selected.", go: async () => { const v = document.querySelector(".wbvmenu:not([hidden])"); if (v) document.querySelector(".wbvbtn").click(); selectSome(); await wait(450); }, leave: () => clearSel() },
    { sel: ".lookbtn", t: "Toolkit: Display", x: "<b>Aa Display</b> in the Toolkit holds the reading <b>speed</b>, the voice and an on/off switch for the 🔊 buttons. It also changes the text size, font and colours." },
    // Right-click: open the real Ask AI menu on a word
    { sel: ".askai", still: true, t: "Right-click any word or sentence", x: "<b>Right-click</b> a word to ask an AI to <b>explain it</b>, give <b>examples</b>, or <b>explain the whole sentence</b>. Select some text first to ask about just that. <b>Open in</b> picks ChatGPT, Claude, Gemini, Copilot or Perplexity. It opens in a new tab with the question filled in. (Shift + right-click gives the normal menu.)", go: () => rightClickDemo(), leave: () => document.querySelectorAll(".askai").forEach((x) => x.remove()) },
    // The AI Tutor: open it and walk through the setup
    { sel: ".tutside", t: "Toolkit: AI Tutor", x: "Study any AI topic in depth with your own AI model. Open it from the Toolkit, or from the round <b>✦ AI Tutor</b> button in the bottom-right corner.", go: () => closeTutor() },
    { sel: ".tut .tutprov", t: "Tutor step 1: choose the AI company", x: "Pick <b>OpenAI (GPT)</b>, <b>Anthropic (Claude)</b> or <b>Google (Gemini)</b>, whichever you have an account with.", go: () => openTutorSetup() },
    { sel: ".tut [data-k=key], .tut .tutsafe", t: "Tutor step 2: paste your secret key", x: "Use <b>Get a key ↗</b> to make one on the company's site, then paste it here. It goes <b>straight from your browser to that company</b>, never to this course or your teacher, and it's forgotten when you close the tab unless you tick <i>Remember</i>.", go: () => openTutorSetup() },
    { sel: ".tut [data-k=model], .tut [data-act=models]", t: "Tutor step 3: choose a model", x: "Type a model name, or press <b>Load my models</b> to list the ones your key can use. Bigger models explain better; smaller ones are faster and cheaper. Then press <b>Start learning</b>.", go: () => openTutorSetup() },
    { sel: ".tut", t: "Tutor step 4: learn by chatting", x: "Type a topic, such as <i>how does attention work?</i> The tutor explains one idea at a time and checks you understood. It <b>draws diagrams and animations</b>, makes <b>step-by-step slides</b> and pictures, and its <b>📍 Show me</b> buttons take you to the right place in the course. Quick buttons: <i>Explain more simply, Go deeper, Draw it, Quiz me</i>.", go: () => openTutorSetup(), leave: () => closeTutor() },
    { sel: ".mastside .langbtn", t: "Toolkit: Language", x: "Read the course in your own language. Press <b>🌐</b> and pick from 240+ languages, such as Urdu, Hindi or Arabic. The whole site is translated, and read aloud and the AI Tutor switch to that language too. Choose <b>English</b> to switch back.", go: () => window.scrollTo(0, 0) },
    { sel: ".mastside .tourbtn", t: "Toolkit: Take the tour", x: "Come back to this tour any time. Pick a tour, then let it play by itself (<b>❚❚</b> to pause) and use <b>🔊 Voice</b> to hear it or mute it." },
  ];

  /* ---------- Demo helpers ---------- */
  // A paragraph with real text in the open view, to show the read-aloud and right-click features on
  // The reader hides its 🔊 button when the page scrolls, so the read-aloud steps put it back
  const pointAt = () => { const b = document.querySelector(".wbread"), p = para(); if ((!b || b.hidden) && p && window.WB_READ && window.WB_READ.point) window.WB_READ.point(p); };
  const para = () => $$("#panel p, #main p, #m2body .card2 p").find((p) => p.textContent.trim().length > 60) || null;
  function clearSel() { const s = getSelection(); if (s && s.rangeCount) s.removeAllRanges(); }
  // A text node and a word inside the paragraph
  function word(p) {
    const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) { const m = /[A-Za-z]{5,}/.exec(n.textContent); if (m) return { n, at: m.index, len: m[0].length }; }
    return null;
  }
  function selectSome() {
    const p = para(); if (!p) return; const w = word(p); if (!w) return;
    p.scrollIntoView({ block: "center" });
    const r = document.createRange(); r.setStart(w.n, w.at); r.setEnd(w.n, Math.min(w.n.textContent.length, w.at + 40));
    clearSel(); getSelection().addRange(r);
  }
  async function rightClickDemo() {
    clearSel();
    const p = para(); if (!p) return; const w = word(p); if (!w) return;
    p.scrollIntoView({ block: "center" }); await wait(300); // the menu closes on scroll, so let it settle first
    const r = document.createRange(); r.setStart(w.n, w.at); r.setEnd(w.n, w.at + w.len);
    const b = r.getBoundingClientRect();
    // Let the click reach the page under the tour's dark layer
    if (box) box.style.pointerEvents = "none";
    p.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }));
    if (box) box.style.pointerEvents = "";
  }
  function openTutorSetup() {
    if (!window.WB_TUTOR) return;
    const t = document.querySelector(".tut");
    if (!t || t.hidden) window.WB_TUTOR.open();
    const s = document.querySelector(".tut [data-act=setup]"); if (s) s.click();
    return wait(120);
  }
  function closeTutor() { const c = document.querySelector(".tut:not([hidden]) [data-act=close]"); if (c) c.click(); }
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
  const WISH = { sel: ".wishbtn", t: "Training wish list", x: "Is there a topic you'd like to learn that isn't here yet? Open the <b>★ Training wish list</b> to suggest the training you'd like, so your teacher knows what to plan next." };
  const END = { t: "You're ready!", x: "Start with Module 1's learning web, then move on to Module 2. You can take this tour again any time from <b>🧭 Take the tour</b> in the Toolkit." };

  let steps = [], i = 0, box = null, hole = null, card = null, target = [];

  /* ---------- Playing by itself, and the spoken guide ---------- */
  // auto: move on by itself after each step. voice: read each step aloud (with the voice chosen in Aa Display).
  const PREFS = "wb-tour-prefs";
  let prefs = { auto: true, voice: true };
  try { prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS) || "{}")); } catch (e) {}
  const savePrefs = () => { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (e) {} };
  const canSpeak = () => !!(window.WB_READ && window.WB_READ.say);
  const plain = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent; };
  const english = () => !window.WB_LANG || window.WB_LANG.code === "en";
  const spoken = (s) => {
    if (english() || !card) return s.t + ". " + plain(s.x);
    const h = card.querySelector("h3"), p = card.querySelector("h3 + p");
    return (h ? h.textContent : s.t) + ". " + (p ? p.textContent : plain(s.x));
  };
  let timer = 0, safety = 0;
  function hush() { clearTimeout(timer); clearTimeout(safety); timer = safety = 0; if (canSpeak()) window.WB_READ.quiet(); }
  // About how long reading the step takes, at the chosen speed
  const readTime = (s) => { const words = plain(s.t + " " + s.x).split(/\s+/).length, rate = canSpeak() && window.WB_READ.rate ? window.WB_READ.rate() : 1; return (words / (2.6 * rate)) * 1000; };
  function narrate() {
    hush();
    const s = steps[i], at = i; if (!s || !box) return;
    const onward = (ms) => { clearTimeout(timer); timer = setTimeout(() => { if (box && prefs.auto && i === at && i < steps.length - 1) next(); }, ms); };
    if (prefs.voice && canSpeak()) {
      const speak = () => { if (box && i === at) window.WB_READ.say(spoken(s), () => { if (prefs.auto) onward(900); }); };
      // In another language, wait for the translator, then read the card as it now reads
      if (english()) speak(); else timer = setTimeout(speak, 1200);
      // In case the browser never says it has finished
      if (prefs.auto) safety = setTimeout(() => onward(0), readTime(s) * 1.8 + 5000);
    } else if (prefs.auto) onward(readTime(s) + 2500);
  }
  function controls() {
    return `<span class="tourctl">
      <button type="button" data-tour="auto" aria-pressed="${prefs.auto}" title="${prefs.auto ? "Pause: move on only when I click Next" : "Play: move on by itself"}">${prefs.auto ? "❚❚ Pause" : "▶ Play"}</button>
      ${canSpeak() ? `<button type="button" data-tour="voice" aria-pressed="${prefs.voice}" title="${prefs.voice ? "Mute the spoken guide" : "Turn the spoken guide on"}" aria-label="${prefs.voice ? "Mute the voice" : "Turn the voice on"}">${prefs.voice ? "🔊 Voice" : "🔇 Muted"}</button>` : ""}
    </span>`;
  }
  function drawControls() { const c = card && card.querySelector(".tourctl"); if (c) c.outerHTML = controls(); }
  function toggleAuto() {
    prefs.auto = !prefs.auto; savePrefs(); drawControls();
    if (!prefs.auto) { clearTimeout(timer); clearTimeout(safety); return; }
    // Playing again: carry on after the voice finishes, or now if it's quiet
    const speaking = prefs.voice && canSpeak() && window.speechSynthesis && window.speechSynthesis.speaking;
    if (!speaking) { timer = setTimeout(() => { if (box && prefs.auto) next(); }, 1200); }
  }
  function toggleVoice() {
    prefs.voice = !prefs.voice; savePrefs(); drawControls();
    if (prefs.voice) narrate();
    else { hush(); if (prefs.auto) { const at = i; timer = setTimeout(() => { if (box && prefs.auto && i === at) next(); }, 2500); } }
  }
  function build(which) {
    steps = [];
    if (which !== "2") steps.push(...M1);
    if (which !== "1") {
      if (m2open()) steps.push(...M2);
      else steps.push({ sel: '.modnav [data-module="2"]', t: "Module 2 is next", x: "Module 2 (Prompting & AI tools) is locked for now. Your teacher will open it when the class is ready, and you can take its tour then.", go: () => mod("1") });
    }
    steps.push(WISH, END);
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
    leave(); hush();
    box.remove(); box = null;
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
    try { localStorage.setItem(mine("wb-tour-seen"), "1"); } catch (e) {}
    const b = document.querySelector(".tourbtn"); if (b) b.focus();
  }
  let active = null; // the step whose page changes need undoing
  function leave() { if (active && active.leave) { try { active.leave(); } catch (e) {} } active = null; }
  async function show() {
    const s = steps[i]; if (!s) return stop();
    hush(); leave();
    await wait(0); // let the Next click finish first, or it would close a menu the step opens
    if (s.go) { try { await s.go(); } catch (e) {} await wait(150); }
    active = s;
    if (!box || steps[i] !== s) return; // stopped or moved on while getting ready
    target = selOf(s);
    if (s.one) target = target.slice(0, 1);
    // A step whose part isn't on screen (a narrow phone, say) is shown in the middle instead
    if (target.length && !s.still) {
      const first = target[0];
      first.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    }
    card.innerHTML = `<div class="tourtop"><p class="tourstep">${i + 1} of ${steps.length}</p>${controls()}</div><h3 id="tourt">${esc(s.t)}</h3><p>${s.x}</p>
      <div class="tourbtns"><button type="button" data-tour="skip" class="tourskip">${i === steps.length - 1 ? "Close" : "Skip tour"}</button>
        <span>${i ? `<button type="button" data-tour="back">← Back</button>` : ""}<button type="button" data-tour="next" class="tourgo">${i === steps.length - 1 ? "Finish ✓" : "Next →"}</button></span></div>
      <div class="tourbar"><i style="width:${((i + 1) / steps.length) * 100}%"></i></div>`;
    place();
    const go = card.querySelector(".tourgo"); if (go) go.focus({ preventScroll: true });
    narrate();
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
  const selOf = (s) => (!s.sel ? [] : typeof s.sel === "function" ? s.sel().filter(Boolean) : $$(s.sel));
  function place() {
    if (!box) return;
    if (active && active.keep) { active.keep(); target = selOf(active); if (active.one) target = target.slice(0, 1); }
    // A demo menu can close by itself (for example when the page scrolls): drop what's gone
    if (target.some((el) => !el.isConnected || el.hidden)) target = target.filter((el) => el.isConnected && !el.hidden);
    const r = rect(), vw = window.innerWidth, vh = window.innerHeight, w = Math.min(360, vw - 24);
    card.style.width = w + "px";
    if (!r) { hole.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0`; card.style.left = (vw - w) / 2 + "px"; card.style.top = Math.max(12, (vh - card.offsetHeight) / 2) + "px"; return; }
    hole.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.right - r.left}px;height:${r.bottom - r.top}px`;
    const h = card.offsetHeight, gap = 12;
    let top = r.bottom + gap <= vh - h - 8 ? r.bottom + gap : r.top - gap - h >= 8 ? r.top - gap - h : vh - h - 12;
    let left = Math.min(vw - w - 12, Math.max(12, r.left));
    // Beside a tall part when there's no room above or below it
    if (top === vh - h - 12 && r.right + gap + w < vw) { left = r.right + gap; top = Math.min(vh - h - 12, Math.max(12, r.top)); }
    else if (top === vh - h - 12 && r.left - gap - w > 0) { left = r.left - gap - w; top = Math.min(vh - h - 12, Math.max(12, r.top)); }
    card.style.left = left + "px"; card.style.top = top + "px";
  }
  function next() { if (i < steps.length - 1) { i++; show(); } else stop(); }
  function back() { if (i > 0) { i--; show(); } }
  function onClick(e) {
    const b = e.target.closest("[data-tour]"); if (!b) return;
    ({ next, back, skip: stop, auto: toggleAuto, voice: toggleVoice })[b.dataset.tour]();
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
    m.innerHTML = `<p>Which tour?</p><small class="tourhint">It plays by itself with a spoken guide. Use ❚❚ to click through at your own pace, or 🔇 to mute.</small>
      <button type="button" role="menuitem" data-pick="both">Modules 1 and 2 <small>about 5 minutes</small></button>
      <button type="button" role="menuitem" data-pick="1">Module 1 and the reading tools <small>about 4 minutes</small></button>
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
    o.innerHTML = `<p><b>New here?</b> Take a 5-minute tour: the course, read aloud, right-click and the AI Tutor.</p><div><button type="button" class="tourgo" data-o="go">Show me around</button><button type="button" data-o="no">No thanks</button></div>`;
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
