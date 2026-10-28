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
  // English first, then Edge's natural voices, then the rest by name
  function loadVoices() {
    voices = synth.getVoices().slice().sort((a, b) => (b.lang.startsWith("en") - a.lang.startsWith("en")) || (natural(b) - natural(a)) || a.name.localeCompare(b.name));
    if (window.WB_LOOK_REFRESH) window.WB_LOOK_REFRESH();
  }
  loadVoices();
  if ("onvoiceschanged" in synth) synth.addEventListener("voiceschanged", loadVoices);
  function voice() {
    return voices.find((v) => v.name === cfg.voice)
      || voices.find((v) => natural(v) && /^en-(GB|US)/.test(v.lang) && /Aria|Jenny|Sonia|Libby|Guy/.test(v.name))
      || voices.find((v) => natural(v) && v.lang.startsWith("en"))
      || voices.find((v) => v.default) || voices[0] || null;
  }
  // "Microsoft Aria Online (Natural) - English (United States)" → "Aria"
  const short = (v) => v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s+-\s+.*$/, "").replace(/\s*\(Natural\)/, "").replace(/\s+Online\b/, "").trim() || v.name;

  /* ---------- Speaking ---------- */
  let reading = null, queue = [], btn = null, target = null, selText = "";
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
    if (!t) { stop(); return; }
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
  const SKIP = ".lookpanel, .wbread, input, textarea, select, [contenteditable], .modnav, .m2tabs, nav";
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
  }
  function paint() {
    if (!btn) return;
    const playing = reading && (selText ? !reading.el : reading.el === target);
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
  }
  function show(el) {
    if (!cfg.on || !el) return;
    target = el; selText = ""; place(el.getBoundingClientRect());
  }
  const hide = () => { if (btn && !reading) btn.hidden = true; };
  function clearSel() { selText = ""; const s = window.getSelection(); if (s) s.removeAllRanges(); }

  document.addEventListener("mouseover", (e) => {
    if (!cfg.on || selText || (e.target.closest && e.target.closest(".wbread"))) return;
    if (reading && reading.el) return; // keep the button on the paragraph being read
    const b = blockAt(e.target); if (b && b !== target) show(b);
  });
  // On a phone there's no hover: a tap on text shows the button
  document.addEventListener("click", (e) => {
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
      if (!t || t.length < 2 || !a || a.closest(SKIP)) { if (selText) { selText = ""; paint(); } return; }
      const r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width && !r.height) return;
      selText = t; target = null; place(r);
    }, 250);
  });
  window.addEventListener("scroll", () => { if (reading && reading.el && btn) place(reading.el.getBoundingClientRect()); else if (!selText) hide(); }, { passive: true, capture: true });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && reading) stop(); });
  window.addEventListener("beforeunload", () => synth.cancel());

  /* ---------- Settings in the Display panel ---------- */
  function panelHTML() {
    const v = voice(), edge = voices.some(natural);
    return `<p class="looklbl">Read aloud</p>
      <label class="lookrow"><input type="checkbox" data-readin="on" ${cfg.on ? "checked" : ""}> Show a 🔊 button by each paragraph</label>
      <div class="lookvoice"><label for="wbvoice">Voice</label><select id="wbvoice" data-readin="voice">${voices.length ? voices.map((x) => `<option value="${esc(x.name)}" ${v && x.name === v.name ? "selected" : ""}>${esc(short(x))}${natural(x) ? " ★" : ""} (${esc(x.lang)})</option>`).join("") : `<option>Loading voices…</option>`}</select></div>
      <div class="looksize"><span class="lookrate">Speed</span><input type="range" min="0.6" max="1.6" step="0.1" value="${cfg.rate}" data-readin="rate" aria-label="Reading speed"><span class="lookrate" id="wbrate">${cfg.rate.toFixed(1)}×</span></div>
      <div class="lookfoot" style="margin-top:8px"><button data-read="test">🔊 Test this voice</button></div>
      <p class="looknote" style="text-align:left">${edge ? "★ marks natural voices, which sound most human." : "For natural, human-sounding voices, open this page in Microsoft Edge."} Point at a paragraph and press 🔊, or select some text to hear just that part. Press Esc to stop.</p>`;
  }
  function click(e) {
    if (e.target.closest("[data-read=test]")) { speak("Hello! This is how I will read the course to you.", null); return true; }
    return false;
  }
  function input(e) {
    const k = e.target.dataset && e.target.dataset.readin; if (!k) return false;
    if (k === "on") { cfg.on = e.target.checked; if (!cfg.on) { stop(); if (btn) btn.hidden = true; } }
    else if (k === "voice") { cfg.voice = e.target.value; if (reading) stop(); }
    else if (k === "rate") { cfg.rate = +e.target.value; const r = document.getElementById("wbrate"); if (r) r.textContent = cfg.rate.toFixed(1) + "×"; }
    save(); return true;
  }
  window.WB_READ = { panelHTML, click, input, stop };
})();
