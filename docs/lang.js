// Language: shows the whole course in the visitor's chosen language, using Google's free page translator
// (machine translation, loaded only when someone picks a language other than English). The choice is kept in
// this browser ("wb-lang") and in Google's "googtrans" cookie. Read aloud, the tour's voice and the AI Tutor
// follow it: they listen for the "wb-lang" event and read window.WB_LANG.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const KEY = "wb-lang";
  // Google's language codes, each language's own name and its English name. "All languages" adds the rest.
  const TOP = [
    ["en", "English", "English"], ["ur", "اردو", "Urdu"], ["hi", "हिन्दी", "Hindi"], ["ar", "العربية", "Arabic"], ["bn", "বাংলা", "Bengali"],
    ["pa", "ਪੰਜਾਬੀ", "Punjabi"], ["ps", "پښتو", "Pashto"], ["sd", "سنڌي", "Sindhi"], ["fa", "فارسی", "Persian"], ["tr", "Türkçe", "Turkish"],
    ["zh-CN", "中文（简体）", "Chinese (Simplified)"], ["zh-TW", "中文（繁體）", "Chinese (Traditional)"], ["ja", "日本語", "Japanese"], ["ko", "한국어", "Korean"],
    ["es", "Español", "Spanish"], ["pt", "Português", "Portuguese"], ["fr", "Français", "French"], ["de", "Deutsch", "German"], ["it", "Italiano", "Italian"],
    ["nl", "Nederlands", "Dutch"], ["pl", "Polski", "Polish"], ["ru", "Русский", "Russian"], ["uk", "Українська", "Ukrainian"], ["el", "Ελληνικά", "Greek"],
    ["sv", "Svenska", "Swedish"], ["id", "Bahasa Indonesia", "Indonesian"], ["ms", "Bahasa Melayu", "Malay"], ["vi", "Tiếng Việt", "Vietnamese"], ["th", "ไทย", "Thai"],
    ["tl", "Filipino", "Filipino"], ["sw", "Kiswahili", "Swahili"], ["ta", "தமிழ்", "Tamil"], ["te", "తెలుగు", "Telugu"], ["mr", "मराठी", "Marathi"],
    ["gu", "ગુજરાતી", "Gujarati"], ["ml", "മലയാളം", "Malayalam"], ["iw", "עברית", "Hebrew"], ["ha", "Hausa", "Hausa"], ["am", "አማርኛ", "Amharic"],
  ];
  const TITLE = document.title; // in English, before any translation
  const RTL = ["ar", "ur", "fa", "ps", "sd", "iw", "yi", "ug", "dv", "ckb"];
  let extra = []; // the rest of Google's languages, once its translator has loaded
  const nameOf = (c) => { const t = TOP.find((x) => x[0] === c) || extra.find((x) => x[0] === c); return t ? t[1] : c; };
  const englishOf = (c) => { const t = TOP.find((x) => x[0] === c) || extra.find((x) => x[0] === c); return t ? t[2] : c; };
  // Language tags for picking a voice ("iw" is Google's old code for Hebrew)
  const tagOf = (c) => ({ iw: "he", tl: "fil", "zh-CN": "zh-CN", "zh-TW": "zh-TW" }[c] || c);

  let code = "en";
  try { code = localStorage.getItem(KEY) || "en"; } catch (e) {}
  const info = () => ({ code, tag: tagOf(code), name: englishOf(code), native: nameOf(code), rtl: RTL.includes(code), set });
  window.WB_LANG = info();

  /* ---------- Google's translator ---------- */
  function cookie(c) {
    const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    ["", "; domain=" + location.hostname].forEach((d) => { document.cookie = `googtrans=; path=/${d}; ${past}`; });
    if (c !== "en") document.cookie = `googtrans=/en/${c}; path=/`;
  }
  let loading = null;
  function load() {
    if (loading) return loading;
    loading = new Promise((ok, bad) => {
      const holder = document.createElement("div"); holder.id = "wb-gte"; holder.hidden = true; document.body.appendChild(holder);
      window.wbGteInit = () => { try { new window.google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "wb-gte"); } catch (e) { bad(e); } };
      const s = document.createElement("script"); s.src = "https://translate.google.com/translate_a/element.js?cb=wbGteInit";
      s.onerror = () => { loading = null; bad(new Error("The translator couldn't load. Check your internet connection.")); };
      document.head.appendChild(s);
      // The language list appears once Google's widget has drawn itself
      let n = 0; const t = setInterval(() => {
        const box = document.querySelector(".goog-te-combo");
        if (box && box.options.length > 1) {
          clearInterval(t);
          extra = [...box.options].filter((o) => o.value && !TOP.some((x) => x[0] === o.value)).map((o) => [o.value, o.text, o.text]);
          ok(box);
        } else if (++n > 100) { clearInterval(t); loading = null; bad(new Error("The translator didn't start. Try again in a moment.")); }
      }, 150);
    });
    return loading;
  }
  function protect() {
    // Code, prompts to copy, and AI Tutor messages stay as they are
    document.querySelectorAll("pre:not(.notranslate), code:not(.notranslate), .pbox:not(.notranslate), .tutmsg:not(.notranslate), .tutcode:not(.notranslate)").forEach((el) => el.classList.add("notranslate"));
  }
  function note(msg) {
    document.querySelectorAll(".langtoast").forEach((x) => x.remove());
    const t = document.createElement("div"); t.className = "langtoast notranslate"; t.setAttribute("role", "status");
    t.innerHTML = `<p>${esc(msg)}</p><button type="button">OK</button>`;
    t.querySelector("button").addEventListener("click", () => t.remove());
    document.body.appendChild(t); setTimeout(() => t.remove(), 20000);
  }
  let busy = false;
  async function set(c, quiet) {
    code = c || "en";
    try { localStorage.setItem(KEY, code); } catch (e) {}
    cookie(code);
    document.documentElement.dir = RTL.includes(code) ? "rtl" : "ltr";
    window.WB_LANG = info(); paintButtons();
    window.dispatchEvent(new CustomEvent("wb-lang", { detail: window.WB_LANG }));
    if (code === "en" && !loading) return; // nothing to undo
    busy = true; paintButtons();
    try {
      protect();
      const first = !loading, box = await load();
      // Loading for the first time, the translator reads the cookie by itself; after that, switch its menu
      if (!first) { box.value = code; box.dispatchEvent(new Event("change")); }
      else if (code !== "en") setTimeout(() => { if (code !== "en" && !/translated-/.test(document.documentElement.className)) { box.value = code; box.dispatchEvent(new Event("change")); } }, 2500);
      // A long page takes a few seconds: keep showing "…" until the page title has changed language
      if (code !== "en") {
        for (let n = 0; n < 70 && document.title === TITLE; n++) await new Promise((r) => setTimeout(r, 300));
        // Google's free translator is sometimes busy: point to the browser's own translation instead
        if (document.title === TITLE && code !== "en") note(`Google's translator didn't answer this time. Try again in a minute, or use your browser's own translation: in Edge or Chrome, right-click the page and choose “Translate to ${englishOf(code)}”.`);
      }
      if (code === "en") document.documentElement.classList.remove("translated-ltr", "translated-rtl");
    } catch (e) { if (!quiet) note(e.message); }
    busy = false; paintButtons();
  }

  /* ---------- The picker ---------- */
  const BTN = () => `<button class="langbtn notranslate" type="button" aria-haspopup="dialog" title="Show the course in another language"><span aria-hidden="true">🌐</span><span>${esc(nameOf(code))}${busy ? " …" : ""}</span></button>`;
  function paintButtons() { document.querySelectorAll(".langbtn").forEach((b) => { b.outerHTML = BTN(); }); }
  function addButtons() {
    const side = document.querySelector(".mastside");
    if (side && !side.querySelector(".langbtn")) {
      side.insertAdjacentHTML("beforeend", BTN());
      // Keep it last, after the buttons other scripts add around now
      const last = () => { const b = side.querySelector(".langbtn"); if (b) side.appendChild(b); };
      document.addEventListener("DOMContentLoaded", last); setTimeout(last, 0); setTimeout(last, 50);
    }
    // On the sign-in screen, next to Display
    const putGate = () => { const g = document.querySelector(".gatelook"); if (g && !g.querySelector(".langbtn")) g.insertAdjacentHTML("beforeend", BTN()); };
    // appearance.js makes that row when the page has loaded, which can be after this runs
    putGate(); document.addEventListener("DOMContentLoaded", putGate); window.addEventListener("load", putGate);
  }
  let pop = null, opener = null;
  function listHTML(q) {
    q = (q || "").trim().toLowerCase();
    const all = TOP.concat(extra.map(([c, n]) => [c, n, n]));
    const hits = all.filter(([c, n, e]) => !q || n.toLowerCase().includes(q) || e.toLowerCase().includes(q) || c.toLowerCase() === q);
    return hits.length ? hits.map(([c, n, e]) => `<button type="button" role="option" data-lang="${esc(c)}" aria-selected="${c === code}"><span dir="auto">${esc(n)}</span>${n !== e ? `<small>${esc(e)}</small>` : ""}</button>`).join("")
      : `<p class="langnone">No language matches. ${extra.length ? "" : `<button type="button" data-langall>Show all languages</button>`}</p>`;
  }
  function open(b) {
    close(); opener = b;
    pop = document.createElement("div"); pop.className = "langpop notranslate"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Choose a language");
    pop.innerHTML = `<p class="langh">Show the course in</p>
      <input type="search" class="langq" placeholder="Search languages…" aria-label="Search languages" autocomplete="off">
      <div class="langlist" role="listbox">${listHTML("")}</div>
      ${extra.length ? "" : `<button type="button" class="langall" data-langall>Show all 240+ languages</button>`}
      <p class="langnote">Machine translation by Google Translate, so some words may be a little off. AI terms often stay in English. Your choice is remembered on this device.</p>`;
    document.body.appendChild(pop);
    const r = b.getBoundingClientRect(), w = Math.min(300, window.innerWidth - 24);
    pop.style.width = w + "px";
    pop.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.right - w)) + window.scrollX + "px";
    pop.style.top = r.bottom + 8 + window.scrollY + "px";
    const q = pop.querySelector(".langq");
    q.addEventListener("input", () => { pop.querySelector(".langlist").innerHTML = listHTML(q.value); });
    pop.addEventListener("click", async (e) => {
      const l = e.target.closest("[data-lang]");
      if (l) { const c = l.dataset.lang; close(); set(c); return; }
      if (e.target.closest("[data-langall]")) {
        const a = e.target.closest("[data-langall]"); a.disabled = true; a.textContent = "Loading…";
        try { await load(); } catch (x) { a.textContent = x.message; return; }
        const all = pop.querySelector(".langall"); if (all) all.remove();
        pop.querySelector(".langlist").innerHTML = listHTML(q.value);
      }
    });
    const cur = pop.querySelector("[aria-selected=true]"); if (cur) cur.scrollIntoView({ block: "nearest" });
    q.focus();
  }
  function close() { if (pop) { pop.remove(); pop = null; } }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".langbtn");
    if (b) { if (pop && opener === b) close(); else open(b); return; }
    if (pop && !e.target.closest(".langpop")) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && pop) { close(); if (opener && opener.isConnected) opener.focus(); } });

  function init() {
    addButtons();
    if (code !== "en") { document.documentElement.dir = RTL.includes(code) ? "rtl" : "ltr"; set(code, true); }
    // Keep new code blocks and tutor messages untranslated as the page changes
    let t = 0;
    new MutationObserver(() => { if (code === "en") return; clearTimeout(t); t = setTimeout(protect, 200); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
