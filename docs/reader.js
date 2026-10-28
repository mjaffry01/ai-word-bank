// Read aloud: a small speaker button appears by the paragraph under the mouse (or the one tapped on a phone),
// and by any text you select, so you hear only the part you choose. Uses the browser's own voices; in
// Microsoft Edge these include its natural "Online (Natural)" voices. Voice, speed and on/off are set in the
// Display panel (appearance.js calls WB_READ.panelHTML / click / input). Settings: localStorage "wb-read".
(function () {
  "use strict";
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance) return;
  const KEY = "wb-read";
  let cfg;
  try { cfg = Object.assign({ on: true, voice: "", rate: 1 }, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { cfg = { on: true, voice: "", rate: 1 }; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Voices ---------- */
  let voices = [];
  const natural = (v) => /natural|online/i.test(v.name);
  // The page's language (lang.js), e.g. "ur" or "zh-CN"; voices in it come first
  const langTag = () => (window.WB_LANG && window.WB_LANG.tag) || "en";
  const inLang = (v, t = langTag()) => {
    const l = v.lang.toLowerCase().replace("_", "-"), w = t.toLowerCase();
    if (w.startsWith("zh")) return l.startsWith(w) || (w === "zh-tw" && l.startsWith("zh-hk")); // the two Chinese scripts
    return l.split("-")[0] === w.split("-")[0];
  };
  // The page's language first, then Edge's natural voices, then the rest by name
  function loadVoices() {
    voices = synth.getVoices().slice().sort((a, b) => (inLang(b) - inLang(a)) || (b.lang.startsWith("en") - a.lang.startsWith("en")) || (natural(b) - natural(a)) || a.name.localeCompare(b.name));
    if (window.WB_LOOK_REFRESH) window.WB_LOOK_REFRESH();
  }
  loadVoices();
  if ("onvoiceschanged" in synth) synth.addEventListener("voiceschanged", loadVoices);
  window.addEventListener("wb-lang", () => { stop(); loadVoices(); if (menu && !menu.hidden) menu.innerHTML = menuHTML(); });
  function voice() {
    const t = langTag();
    if (!t.startsWith("en")) {
      // The chosen voice if it speaks the page's language, otherwise the best voice that does
      return voices.find((v) => v.name === cfg.voice && inLang(v, t)) || voices.find((v) => inLang(v, t) && natural(v)) || voices.find((v) => inLang(v, t))
        || voices.find((v) => v.name === cfg.voice) || voices.find((v) => v.default) || voices[0] || null;
    }
    return voices.find((v) => v.name === cfg.voice)
      || voices.find((v) => natural(v) && /^en-(GB|US)/.test(v.lang) && /Aria|Jenny|Sonia|Libby|Guy/.test(v.name))
      || voices.find((v) => natural(v) && v.lang.startsWith("en"))
      || voices.find((v) => v.default) || voices[0] || null;
  }
  const hasLangVoice = () => langTag().startsWith("en") || voices.some((v) => inLang(v));
  const noVoiceNote = () => (hasLangVoice() || !voices.length ? "" : `This device has no ${esc((window.WB_LANG && window.WB_LANG.name) || "")} voice, so another voice will read. Microsoft Edge has voices for many more languages. `);
  // "Microsoft Aria Online (Natural) - English (United States)" → "Aria"
  const short = (v) => v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s+-\s+.*$/, "").replace(/\s*\(Natural\)/, "").replace(/\s+Online\b/, "").trim() || v.name;

  /* ---------- Speaking ---------- */
  let reading = null, queue = [], btn = null, vbtn = null, menu = null, target = null, selText = "";
  // Some browsers stop long speech after about 15 seconds, so speak a sentence or two at a time
  function chunks(text) {
    const parts = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*["”’)]*\s*/g) || [text];
    const out = []; let cur = "";
    parts.forEach((p) => { if ((cur + p).length > 220 && cur) { out.push(cur); cur = p; } else cur += p; });
    if (cur.trim()) out.push(cur);
    return out;
  }
  function stop() {
    queue = []; synth.cancel();
    if (reading && reading.el) reading.el.classList.remove("wb-reading");
    reading = null; paint();
  }
  function speak(text, el) {
    const same = reading && reading.el === el && el;
    stop(); if (same) return;
    text = (text || "").trim(); if (!text) return;
    reading = { el }; if (el) el.classList.add("wb-reading");
    queue = chunks(text); next(); paint();
  }
  function next() {
    if (!reading) return;
    const t = queue.shift();
    if (!t) { const done = reading.done; stop(); if (done) done(); return; }
    const u = new SpeechSynthesisUtterance(t), v = voice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = cfg.rate;
    const mine = reading;
    u.onend = () => { if (reading === mine) next(); };
    u.onerror = () => { if (reading === mine) stop(); };
    synth.speak(u);
  }
  // The words a person would read, without the speaker button, hidden bits or emoji used as icons
  function textOf(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll(".wbread, [hidden], [aria-hidden=true], svg, script, style").forEach((x) => x.remove());
    return (c.innerText || c.textContent || "").replace(/[\u{1F300}-\u{1FAFF}☀-➿]️?/gu, "");
  }

  /* ---------- The floating button ---------- */
  const BLOCKS = "p, li, dd, dt, h1, h2, h3, h4, blockquote, td, th, summary, figcaption, .botmsg, .deep, .def, .card .big, .qprompt, .opt";
  const SKIP = ".lookpanel, .tour, .tourmenu, .touroffer, .wbread, .wbvbtn, .wbvmenu, input, textarea, select, [contenteditable], .modnav, .m2tabs, nav";
  function blockAt(node) {
    const el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el || el.closest(SKIP)) return null;
    let b = el.closest(BLOCKS);
    if (!b || b.closest(SKIP)) return null;
    // A list item or cell made mostly of one paragraph: read the paragraph
    if (textOf(b).trim().length < 2) return null;
    return b;
  }
  function makeBtn() {
    btn = document.createElement("button");
    btn.type = "button"; btn.className = "wbread";
    btn.addEventListener("mousedown", (e) => e.preventDefault()); // keep a text selection while clicking
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selText) { const t = selText; clearSel(); speak(t, null); return; }
      if (target) speak(textOf(target), target);
    });
    document.body.appendChild(btn);
    // A second small button under 🔊 opens a quick list of voices
    vbtn = document.createElement("button");
    vbtn.type = "button"; vbtn.className = "wbvbtn"; vbtn.innerHTML = `<span aria-hidden="true">🗣</span>`;
    vbtn.setAttribute("aria-label", "Change the reading voice"); vbtn.title = "Change voice";
    vbtn.setAttribute("aria-haspopup", "listbox"); vbtn.setAttribute("aria-expanded", "false");
    vbtn.addEventListener("mousedown", (e) => e.preventDefault());
    vbtn.addEventListener("click", (e) => { e.stopPropagation(); if (menu && !menu.hidden) closeMenu(); else openMenu(); });
    document.body.appendChild(vbtn);
  }

  /* ---------- Quick voice menu ---------- */
  function menuHTML() {
    const v = voice(), edge = voices.some(natural);
    if (!voices.length) return `<p class="wbvnote">No voices found yet. Try again in a moment.</p>`;
    return `<p class="wbvhead">Choose a voice</p>
      <div class="wbvlist" role="listbox" aria-label="Voices">${voices.map((x) => `<button type="button" role="option" data-voice="${esc(x.name)}" aria-selected="${!!(v && x.name === v.name)}">${esc(short(x))}${natural(x) ? " ★" : ""} <small>${esc(x.lang)}</small></button>`).join("")}</div>
      <p class="wbvnote">${noVoiceNote()}${edge ? "★ natural voices sound most human." : "For natural, human-sounding voices, open this page in Microsoft Edge."} Speed is in Aa Display.</p>`;
  }
  function openMenu() {
    if (!menu) {
      menu = document.createElement("div"); menu.className = "wbvmenu"; menu.hidden = true;
      menu.addEventListener("mousedown", (e) => e.preventDefault());
      menu.addEventListener("click", (e) => {
        e.stopPropagation();
        const b = e.target.closest("[data-voice]"); if (!b) return;
        cfg.voice = b.dataset.voice; save();
        const x = voice(); speak(`Hello, I'm ${x ? short(x) : "your reader"}. This is how I sound.`, null);
        menu.innerHTML = menuHTML(); if (window.WB_LOOK_REFRESH) window.WB_LOOK_REFRESH();
      });
      document.body.appendChild(menu);
    }
    menu.innerHTML = menuHTML(); menu.hidden = false; vbtn.setAttribute("aria-expanded", "true");
    const r = vbtn.getBoundingClientRect(), w = Math.min(280, window.innerWidth - 16);
    menu.style.width = w + "px";
    menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + window.scrollX + "px";
    const below = r.bottom + 6, h = Math.min(360, window.innerHeight - 16);
    menu.style.top = (below + h > window.innerHeight ? Math.max(8, r.top - h - 6) : below) + window.scrollY + "px";
    const cur = menu.querySelector("[aria-selected=true]") || menu.querySelector("button");
    if (cur) { cur.scrollIntoView({ block: "nearest" }); cur.focus({ preventScroll: true }); }
  }
  function closeMenu() { if (menu && !menu.hidden) { menu.hidden = true; vbtn.setAttribute("aria-expanded", "false"); } }
  function paint() {
    if (!btn) return;
    const playing = reading && !reading.done && (selText ? !reading.el : reading.el === target); // the tour's spoken guide isn't the reader's own playing
    btn.innerHTML = playing ? `<span aria-hidden="true">■</span>` : `<span aria-hidden="true">🔊</span>`;
    btn.setAttribute("aria-label", playing ? "Stop reading" : selText ? "Read the selected text aloud" : "Read this paragraph aloud");
    btn.title = btn.getAttribute("aria-label");
    btn.classList.toggle("on", !!playing);
    btn.classList.toggle("sel", !!selText);
  }
  function place(rect) {
    if (!btn) makeBtn();
    const size = 30, gap = 6, x = rect.left - size - gap >= 4 ? rect.left - size - gap : Math.min(window.innerWidth - size - 4, rect.right + gap);
    btn.style.left = Math.max(4, x) + window.scrollX + "px";
    btn.style.top = rect.top + window.scrollY + Math.max(0, Math.min(rect.height, 26) - size) / 2 + "px";
    btn.hidden = false; paint();
    vbtn.style.left = btn.style.left;
    vbtn.style.top = parseFloat(btn.style.top) + size + 4 + "px";
    vbtn.hidden = false;
  }
  function show(el) {
    if (!cfg.on || !el) return;
    closeMenu(); target = el; selText = ""; place(el.getBoundingClientRect());
  }
  const hide = () => { closeMenu(); if (btn && !reading) btn.hidden = vbtn.hidden = true; };
  function clearSel() { selText = ""; const s = window.getSelection(); if (s) s.removeAllRanges(); }

  document.addEventListener("mouseover", (e) => {
    if (!cfg.on || selText || (e.target.closest && e.target.closest(".wbread, .wbvbtn, .wbvmenu"))) return;
    if (menu && !menu.hidden) return; // keep the menu with its paragraph while choosing
    if (reading && reading.el) return; // keep the button on the paragraph being read
    const b = blockAt(e.target); if (b && b !== target) show(b);
  });
  // On a phone there's no hover: a tap on text shows the button
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".wbvmenu, .wbvbtn")) closeMenu();
    if (!cfg.on || e.target.closest(".wbread") || e.target.closest("button, a, input, textarea, select, label")) return;
    if (reading && reading.el) return;
    const b = blockAt(e.target); if (b) show(b);
  });
  document.addEventListener("selectionchange", () => {
    if (!cfg.on) return;
    clearTimeout(document.wbSelT);
    document.wbSelT = setTimeout(() => {
      const s = window.getSelection(), t = s && !s.isCollapsed ? s.toString().trim() : "";
      const a = s && s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
      if (menu && !menu.hidden) return;
      if (!t || t.length < 2 || !a || a.closest(SKIP)) { if (selText) { selText = ""; paint(); } return; }
      const r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width && !r.height) return;
      selText = t; target = null; place(r);
    }, 250);
  });
  window.addEventListener("scroll", (e) => {
    if (menu && e.target && e.target.nodeType === 1 && menu.contains(e.target)) return; // scrolling the voice list
    closeMenu();
    if (reading && reading.el && btn) place(reading.el.getBoundingClientRect()); else if (!selText) hide(); }, { passive: true, capture: true });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (menu && !menu.hidden) { closeMenu(); vbtn.focus(); } else if (reading) stop();
  });
  window.addEventListener("beforeunload", () => synth.cancel());

  /* ---------- Settings in the Display panel ---------- */
  function panelHTML() {
    const v = voice(), edge = voices.some(natural);
    return `<p class="looklbl">Read aloud</p>
      <label class="lookrow"><input type="checkbox" data-readin="on" ${cfg.on ? "checked" : ""}> Show a 🔊 button by each paragraph</label>
      <div class="lookvoice"><label for="wbvoice">Voice</label><select id="wbvoice" data-readin="voice">${voices.length ? voices.map((x) => `<option value="${esc(x.name)}" ${v && x.name === v.name ? "selected" : ""}>${esc(short(x))}${natural(x) ? " ★" : ""} (${esc(x.lang)})</option>`).join("") : `<option>Loading voices…</option>`}</select></div>
      <div class="looksize"><span class="lookrate">Speed</span><input type="range" min="0.6" max="1.6" step="0.1" value="${cfg.rate}" data-readin="rate" aria-label="Reading speed"><span class="lookrate" id="wbrate">${cfg.rate.toFixed(1)}×</span></div>
      <div class="lookfoot" style="margin-top:8px"><button data-read="test">🔊 Test this voice</button></div>
      <p class="looknote" style="text-align:left">${noVoiceNote()}${edge ? "★ marks natural voices, which sound most human." : "For natural, human-sounding voices, open this page in Microsoft Edge."} Point at a paragraph and press 🔊, or select some text to hear just that part. Press Esc to stop.</p>`;
  }
  function click(e) {
    if (e.target.closest("[data-read=test]")) { speak("Hello! This is how I will read the course to you.", null); return true; }
    return false;
  }
  function input(e) {
    const k = e.target.dataset && e.target.dataset.readin; if (!k) return false;
    if (k === "on") { cfg.on = e.target.checked; if (!cfg.on) { stop(); closeMenu(); if (btn) btn.hidden = vbtn.hidden = true; } }
    else if (k === "voice") { cfg.voice = e.target.value; if (reading) stop(); }
    else if (k === "rate") { cfg.rate = +e.target.value; const r = document.getElementById("wbrate"); if (r) r.textContent = cfg.rate.toFixed(1) + "×"; }
    save(); return true;
  }
  // For the guided tour: point(el) shows the 🔊 button by a paragraph; say(text, done) speaks with the chosen
  // voice and speed, then calls done (not called if it's stopped early); quiet() stops it.
  function say(text, done) {
    stop();
    text = String(text || "").replace(/[\u{1F300}-\u{1FAFF}☀-➿★■✦←→↗]️?/gu, "").replace(/\s+/g, " ").trim();
    if (!text) { if (done) done(); return; }
    reading = { el: null, done }; queue = chunks(text); next(); paint();
  }
  window.WB_READ = { panelHTML, click, input, stop, say, quiet: stop, rate: () => cfg.rate, point: (el) => { if (cfg.on && el) show(el); } };
})();
