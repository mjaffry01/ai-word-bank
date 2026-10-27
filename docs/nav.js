// Back trail: whenever a link jumps somewhere else in the course (a glossary word, another algorithm, a plain-English term),
// remember exactly where the reader was and show a "← Back to …" button. The browser's Back button does the same.
(function () {
  "use strict";
  const trail = [], restorers = {}, MAX = 15;
  let btn = null;

  const activeModule = () => { const b = document.querySelector('.modnav [aria-pressed="true"]'); return b ? b.dataset.module : "1"; };
  // A readable name for the current place: a module's own label if it has one, else "Module name: tab"
  function where(m) {
    const r = restorers[m], own = r && r.label && r.label(); // a place name, e.g. "Decision Tree · Interview guide"
    if (own) return own;
    const b = document.querySelector(`.modnav [data-module="${m}"]`), t = document.querySelector(`#m${m} .m2tabs [aria-selected="true"]`);
    const name = b ? b.lastChild.textContent.trim() : "Module " + m;
    return t ? `${name}: ${t.textContent.replace(/^\s*\d+/, "").trim()}` : name;
  }
  function show() {
    if (!btn) {
      btn = document.createElement("button"); btn.type = "button"; btn.className = "wbback"; btn.hidden = true;
      btn.addEventListener("click", back); document.body.appendChild(btn);
    }
    const last = trail[trail.length - 1];
    btn.hidden = !last;
    if (last) { btn.textContent = "← " + last.label; btn.title = "Go back to where you were (or use your browser's Back button)"; }
  }
  // Call just before a jump. label overrides the automatic "Back to …" text.
  function push(label) {
    const m = activeModule(), r = restorers[m];
    trail.push({ m, y: window.scrollY, state: r && r.capture ? r.capture() : null, label: label || "Back to " + where(m) });
    if (trail.length > MAX) trail.shift();
    try { history.pushState({ wbNav: trail.length }, ""); } catch (e) {}
    show();
  }
  function restoreLast() {
    const s = trail.pop(); if (!s) return;
    if (activeModule() !== s.m && window.WB_setModule) window.WB_setModule(s.m);
    const r = restorers[s.m]; if (r && r.restore && s.state) r.restore(s.state);
    setTimeout(() => window.scrollTo({ top: s.y, behavior: "auto" }), 80);
    show();
  }
  // Our button goes through the browser history so the two Back routes stay in step
  function back() { if (history.state && history.state.wbNav) history.back(); else restoreLast(); }
  window.addEventListener("popstate", () => { if (trail.length) restoreLast(); });

  window.WB_NAV = { push, back, register: (m, r) => (restorers[m] = r), get size() { return trail.length; } };
})();

// Progress that belongs to one student (best scores, hand-ins, drafts) is kept under their email,
// so students who share a computer don't see each other's work. "wb-user" fires when the account changes.
window.WB_mine = (k) => {
  let e = "";
  try { e = (JSON.parse(localStorage.getItem("wb-session") || "null") || {}).email || ""; } catch (x) {}
  return k + "|" + (e.toLowerCase() || "guest");
};
