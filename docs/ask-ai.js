// Right-click any word or sentence on the course page to ask an AI chat about it.
// Shows a small menu (explain the word, explain the sentence, give an example, or ask about a selection)
// and opens the student's chosen AI tool in a new tab with the question filled in.
// Text boxes keep the browser's own menu, and Shift + right-click always shows it too.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PREF = "wb-askai-tool";

  // `q`: the tool takes the question in its address. Tools without that get the question copied, then open.
  const TOOLS = {
    chatgpt: { name: "ChatGPT", q: "https://chatgpt.com/?q=" },
    claude: { name: "Claude", q: "https://claude.ai/new?q=" },
    gemini: { name: "Gemini", open: "https://gemini.google.com/app" },
    copilot: { name: "Microsoft Copilot", q: "https://copilot.microsoft.com/?q=" },
    perplexity: { name: "Perplexity", q: "https://www.perplexity.ai/search?q=" },
  };
  let tool = "chatgpt";
  try { const t = localStorage.getItem(PREF); if (TOOLS[t]) tool = t; } catch (e) {}

  /* ---------- Finding the word and sentence under the pointer ---------- */
  const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu;
  const BLOCK = "p,li,dd,dt,td,th,h1,h2,h3,h4,h5,h6,pre,blockquote,figcaption,label,summary,button,.pbox";
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && { node: p.offsetNode, off: p.offset }; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r && { node: r.startContainer, off: r.startOffset }; }
    return null;
  }
  function textUnder(e) {
    const c = caretAt(e.clientX, e.clientY);
    if (!c || !c.node || c.node.nodeType !== 3) return null;
    const block = c.node.parentElement && (c.node.parentElement.closest(BLOCK) || c.node.parentElement);
    if (!block) return null;
    // Position of the caret inside the whole block's text
    const r = document.createRange(); r.setStart(block, 0); r.setEnd(c.node, c.off);
    const full = block.textContent.replace(/\s+/g, " "), at = r.toString().replace(/\s+/g, " ").length;
    let word = "";
    for (const m of full.matchAll(WORD)) { if (m.index <= at && at <= m.index + m[0].length) { word = m[0]; break; } }
    if (!word) return null;
    // The sentence: from the previous . ! ? to the next one
    const before = full.slice(0, at), after = full.slice(at);
    const start = Math.max(before.lastIndexOf(". "), before.lastIndexOf("! "), before.lastIndexOf("? ")) + 1;
    const endM = after.search(/[.!?](\s|$)/);
    let sentence = full.slice(start, endM < 0 ? full.length : at + endM + 1).trim();
    if (sentence.length > 400) sentence = sentence.slice(0, 400) + "…";
    // A glossary word, or a short bold/code phrase, counts as one term ("large language model", not just "large")
    const term = e.target.closest && e.target.closest("[data-word]"), inl = e.target.closest && e.target.closest("b,strong,code,em,dt,.wordlink");
    const phrase = term ? term.dataset.word : inl ? inl.textContent.replace(/\s+/g, " ").trim() : "";
    if (phrase && phrase.length <= 60 && phrase.split(" ").length <= 6) word = phrase.replace(/[.:,;]+$/, "");
    return { word: word.replace(/['’\-]+$/, ""), sentence: sentence === word ? "" : sentence };
  }

  /* ---------- The questions ---------- */
  const ask = {
    word: (w) => `Explain the term "${w}" in simple words, as it is used in artificial intelligence. Give one everyday example.`,
    example: (w) => `Give me 3 real-world examples of "${w}" in artificial intelligence, explained simply.`,
    sentence: (s) => `I'm learning about AI. Explain this sentence in simple words:\n\n"${s}"`,
    selection: (s) => `I'm learning about AI. Explain this in simple words:\n\n"${s}"`,
  };
  function openIn(text) {
    const t = TOOLS[tool];
    if (t.q) { window.open(t.q + encodeURIComponent(text), "_blank", "noopener"); return; }
    const go = () => { window.open(t.open, "_blank", "noopener"); toast(`Question copied. Paste it into ${t.name} (Ctrl+V or ⌘V).`); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(go, go); else go();
  }

  /* ---------- The menu ---------- */
  let menu = null, items = [];
  function close() { if (menu) { menu.remove(); menu = null; } }
  function show(x, y, found) {
    close();
    const sel = found.selection, short = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
    items = sel ? [["selection", `Explain “${short(sel, 40)}”`, sel]] : [["word", `Explain “${found.word}”`, found.word], ["example", `Examples of “${found.word}”`, found.word]];
    if (!sel && found.sentence) items.push(["sentence", "Explain this sentence", found.sentence]);
    menu = document.createElement("div");
    menu.className = "askai"; menu.setAttribute("role", "menu");
    menu.innerHTML = `<p class="askai-h">Ask AI</p>
      ${items.map(([k, label], i) => `<button role="menuitem" data-askai="${i}">${esc(label)}</button>`).join("")}
      <button role="menuitem" data-askai-copy>Copy “${esc(short(sel || found.word, 30))}”</button>
      <label class="askai-tool">Open in <select data-askai-tool aria-label="AI tool">${Object.entries(TOOLS).map(([k, t]) => `<option value="${k}" ${k === tool ? "selected" : ""}>${t.name}</option>`).join("")}</select></label>
      <p class="askai-tip">Shift + right-click for the normal menu</p>`;
    document.body.appendChild(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + "px";
    menu.querySelector("button").focus();
  }

  document.addEventListener("contextmenu", (e) => {
    if (e.shiftKey || e.target.closest("input,textarea,select,[contenteditable=''],[contenteditable='true'],.askai,a[href],img,video,canvas")) return;
    if (!document.getElementById("app") || document.getElementById("app").hidden) return;
    const s = String(getSelection() || "").replace(/\s+/g, " ").trim();
    let found = null;
    if (s && s.length <= 1500 && getSelection().rangeCount && [...Array(getSelection().rangeCount).keys()].some((i) => { const rr = getSelection().getRangeAt(i).getBoundingClientRect(); return e.clientX >= rr.left - 4 && e.clientX <= rr.right + 4 && e.clientY >= rr.top - 4 && e.clientY <= rr.bottom + 4; })) found = { selection: s };
    else found = textUnder(e);
    if (!found) return;
    e.preventDefault();
    show(e.clientX, e.clientY, found);
  });
  document.addEventListener("click", (e) => {
    if (!menu) return;
    if (!e.target.closest(".askai")) { close(); return; }
    const b = e.target.closest("[data-askai]");
    if (b) { const [k, , text] = items[+b.dataset.askai]; openIn(ask[k](text)); close(); return; }
    if (e.target.closest("[data-askai-copy]")) { const [, , text] = items[0]; if (navigator.clipboard) navigator.clipboard.writeText(text); toast("Copied."); close(); }
  });
  document.addEventListener("change", (e) => {
    if (!e.target.matches("[data-askai-tool]")) return;
    tool = e.target.value; try { localStorage.setItem(PREF, tool); } catch (err) {}
  });
  document.addEventListener("keydown", (e) => {
    if (!menu) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const bs = [...menu.querySelectorAll("button")], i = bs.indexOf(document.activeElement);
      bs[(i + (e.key === "ArrowDown" ? 1 : bs.length - 1)) % bs.length].focus(); e.preventDefault();
    }
  });
  addEventListener("scroll", close, { passive: true });
  addEventListener("resize", close);

  function toast(msg) {
    const t = document.createElement("div"); t.className = "askai-toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
  }
})();
