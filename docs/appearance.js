// Display settings: each visitor can change the text size, font, background colour and text colour.
// Loaded in <head> so saved settings apply before the page is drawn; the "Aa" button and panel are
// added once the page has loaded. Settings stay in this browser only (localStorage "wb-look").
(function () {
  "use strict";
  const KEY = "wb-look", root = document.documentElement;
  const DEF = { theme: "auto", size: 100, font: "default", bg: "#f4f7f7", fg: "#131a1c" };
  const THEMES = {
    auto: { name: "Automatic", hint: "Follows your device" },
    light: { name: "Light", bg: "#f4f7f7", fg: "#131a1c" },
    dark: { name: "Dark", bg: "#0e1415", fg: "#e4ecec" },
    cream: { name: "Cream", bg: "#f6efe0", fg: "#2b2418" },
    contrast: { name: "High contrast", bg: "#000000", fg: "#ffffff", accent: "#ffd23f" },
    custom: { name: "My colours" },
  };
  // Google Fonts are loaded only when someone picks them
  const FONTS = {
    default: { name: "Course font", css: null },
    atkinson: { name: "Atkinson Hyperlegible", css: "'Atkinson Hyperlegible',system-ui,sans-serif", gf: "Atkinson+Hyperlegible:wght@400;700", note: "Designed to be easy to read" },
    lexend: { name: "Lexend", css: "'Lexend',system-ui,sans-serif", gf: "Lexend:wght@400;500;600;700", note: "Wide letters, calm to read" },
    serif: { name: "Serif", css: "Georgia,'Times New Roman',serif", note: "Like a printed book" },
    system: { name: "My device's font", css: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" },
    comic: { name: "Comic Neue", css: "'Comic Neue','Comic Sans MS',sans-serif", gf: "Comic+Neue:wght@400;700", note: "Friendly, rounded letters" },
  };
  let look;
  try { look = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { look = Object.assign({}, DEF); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(look)); } catch (e) {} };

  // Relative brightness (WCAG) and the contrast ratio between two colours
  const lum = (hex) => { const v = hex.replace("#", "").match(/../g).map((x) => { const c = parseInt(x, 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const okHex = (h) => /^#[0-9a-f]{6}$/i.test(h || "");

  const VARS = ["--bg", "--surface", "--fg", "--muted", "--line", "--accent", "--accent-ink"];
  function apply() {
    VARS.forEach((v) => root.style.removeProperty(v));
    root.removeAttribute("data-theme");
    const T = THEMES[look.theme] || THEMES.auto;
    const bg = look.theme === "custom" ? look.bg : T.bg, fg = look.theme === "custom" ? look.fg : T.fg;
    if (okHex(bg) && okHex(fg)) {
      const dark = lum(bg) < lum(fg);
      root.setAttribute("data-theme", dark ? "dark" : "light"); // keeps the matching accent, good and bad colours
      if (look.theme !== "light" && look.theme !== "dark") {
        root.style.setProperty("--bg", bg); root.style.setProperty("--fg", fg);
        root.style.setProperty("--surface", `color-mix(in srgb, ${bg} ${dark ? 90 : 70}%, ${dark ? fg : "#ffffff"})`);
        root.style.setProperty("--muted", `color-mix(in srgb, ${fg} 72%, ${bg})`);
        root.style.setProperty("--line", `color-mix(in srgb, ${fg} 20%, ${bg})`);
        if (T.accent) { root.style.setProperty("--accent", T.accent); root.style.setProperty("--accent-ink", bg); }
      }
    }
    const F = FONTS[look.font] || FONTS.default;
    if (F.gf && !document.getElementById("wb-look-font-" + look.font)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.id = "wb-look-font-" + look.font;
      l.href = `https://fonts.googleapis.com/css2?family=${F.gf}&display=swap`; document.head.appendChild(l);
    }
    let st = document.getElementById("wb-look-style");
    if (!st) { st = document.createElement("style"); st.id = "wb-look-style"; document.head.appendChild(st); }
    const size = Math.max(80, Math.min(160, +look.size || 100));
    st.textContent = (size !== 100 ? `html{font-size:${size}%}body{font-size:1rem}` : "") + (F.css ? `:root{--body:${F.css};--display:${F.css}}` : "");
  }
  apply();

  /* ---------- The panel ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cur = (v) => getComputedStyle(root).getPropertyValue(v).trim();
  // The colour the page shows now, as #rrggbb, so "My colours" starts from what you see
  function shown(v) {
    const d = document.createElement("div"); d.style.color = `var(${v})`; document.body.appendChild(d);
    const m = getComputedStyle(d).color.match(/[\d.]+/g); d.remove();
    return m ? "#" + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, "0")).join("") : cur(v);
  }
  function warnHTML() {
    if (look.theme !== "custom" || !okHex(look.bg) || !okHex(look.fg)) return "";
    const r = ratio(look.bg, look.fg);
    return r < 4.5 ? `<span class="bad">⚠ Hard to read: contrast is ${r.toFixed(1)} to 1. Aim for at least 4.5.</span>` : `✓ Easy to read: contrast ${r.toFixed(1)} to 1.`;
  }
  function panelHTML() {
    return `<div class="lookhead"><b>Display settings</b><button class="lookx" data-look="close" aria-label="Close">✕</button></div>
      <p class="looklbl">Text size <span>${look.size}%</span></p>
      <div class="looksize"><button data-look="smaller" aria-label="Smaller text">A−</button><input type="range" min="80" max="160" step="10" value="${look.size}" data-lookin="size" aria-label="Text size"><button data-look="bigger" aria-label="Bigger text">A+</button></div>
      <p class="looklbl">Font</p>
      <div class="lookfonts">${Object.entries(FONTS).map(([k, f]) => `<button data-lookfont="${k}" aria-pressed="${look.font === k}" style="${f.css ? `font-family:${esc(f.css)}` : ""}">${esc(f.name)}${f.note ? `<small>${esc(f.note)}</small>` : ""}</button>`).join("")}</div>
      <p class="looklbl">Colours</p>
      <div class="lookthemes">${Object.entries(THEMES).filter(([k]) => k !== "custom").map(([k, t]) => `<button data-looktheme="${k}" aria-pressed="${look.theme === k}" ${t.bg ? `style="background:${t.bg};color:${t.fg}"` : ""}>${esc(t.name)}</button>`).join("")}</div>
      <div class="lookcustom"><label>Background <input type="color" value="${esc(look.theme === "custom" ? look.bg : shown("--bg"))}" data-lookin="bg"></label>
        <label>Text colour <input type="color" value="${esc(look.theme === "custom" ? look.fg : shown("--fg"))}" data-lookin="fg"></label></div>
      <p class="lookwarn" aria-live="polite">${warnHTML()}</p>
      <p class="looksample">The quick brown fox jumps over the lazy dog. <b>Tokens</b>, <i>prompts</i> and models.</p>
      ${window.WB_READ ? window.WB_READ.panelHTML() : ""}
      <div class="lookfoot"><button data-look="reset">Reset to the course look</button></div>
      <p class="looknote">Saved in this browser only.</p>`;
  }
  let panel = null, opener = null;
  function render() { if (panel) panel.innerHTML = panelHTML(); }
  window.WB_LOOK_REFRESH = () => { if (panel && !panel.hidden) render(); }; // the voice list arrives late
  function open(btn) {
    opener = btn;
    if (!panel) {
      panel = document.createElement("div"); panel.className = "lookpanel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Display settings");
      document.body.appendChild(panel);
      panel.addEventListener("click", onClick);
      panel.addEventListener("input", onInput);
    }
    render(); panel.hidden = false;
    document.querySelectorAll(".lookbtn").forEach((b) => b.setAttribute("aria-expanded", "true"));
    const f = panel.querySelector("[aria-pressed=true]") || panel.querySelector("button"); if (f) f.focus();
  }
  function close() {
    if (!panel || panel.hidden) return;
    panel.hidden = true; document.querySelectorAll(".lookbtn").forEach((b) => b.setAttribute("aria-expanded", "false"));
    if (opener) opener.focus();
  }
  const set = (k, v) => { look[k] = v; save(); apply(); };
  function onClick(e) {
    const t = e.target;
    if (window.WB_READ && window.WB_READ.click(e)) return;
    const a = t.closest("[data-look]"); if (a) {
      const k = a.dataset.look;
      if (k === "close") return close();
      if (k === "smaller" || k === "bigger") set("size", Math.max(80, Math.min(160, look.size + (k === "bigger" ? 10 : -10))));
      if (k === "reset") { look = Object.assign({}, DEF); save(); apply(); }
      return render();
    }
    const f = t.closest("[data-lookfont]"); if (f) { set("font", f.dataset.lookfont); return render(); }
    const th = t.closest("[data-looktheme]"); if (th) { set("theme", th.dataset.looktheme); return render(); }
  }
  function onInput(e) {
    if (window.WB_READ && window.WB_READ.input(e)) return;
    const k = e.target.dataset.lookin; if (!k) return;
    if (k === "size") { set("size", +e.target.value); panel.querySelector(".looklbl span").textContent = look.size + "%"; return; }
    // Picking a colour switches to "My colours", starting from the other colour on screen now
    if (look.theme !== "custom") { look.bg = shown("--bg"); look.fg = shown("--fg"); }
    look[k] = e.target.value; look.theme = "custom"; save(); apply();
    // Update in place: re-drawing would close the colour picker while it's open
    panel.querySelectorAll("[data-looktheme]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    panel.querySelector(".lookwarn").innerHTML = warnHTML();
  }
  const BTN = `<button class="lookbtn" type="button" aria-haspopup="dialog" aria-expanded="false" title="Display settings: text size, font, colours and read aloud"><span aria-hidden="true">Aa</span><span>Display</span></button>`;
  function addButtons() {
    // Under the signed-in name in the course, and under the sign-in box on the sign-in screen
    const side = document.querySelector(".mastside"); if (side && !side.querySelector(".lookbtn")) side.insertAdjacentHTML("beforeend", `<p class="toolkitlbl">Toolkit</p>${BTN}`); // the AI Tutor, tour and language buttons follow
    const gate = document.querySelector(".gatewish"); if (gate && !document.querySelector(".gatelook")) gate.insertAdjacentHTML("afterend", `<p class="gatelook">${BTN}</p>`);
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".lookbtn"); if (b) { if (panel && !panel.hidden) close(); else open(b); return; }
      if (panel && !panel.hidden && !e.target.closest(".lookpanel")) close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButtons); else addButtons();
})();
