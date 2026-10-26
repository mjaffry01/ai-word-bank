// Algorithms map: a shared player for "Watch it work" walkthroughs (scenes with captions, play/pause/back/next, speed).
// Each walkthrough is registered with A.story(id, {...}); the scenes live in algos-story-sup/uns/rl.js.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A || !A.addView) return;
  const { palette, btn, slider, panel, esc } = A.h;

  // Repeatable randomness, so every viewer sees the same story
  A.seeded = function (seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  A.sgauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // Drawing kit in "page units": u runs 0..1 across, v runs 0..1 down
  function kit(canvas, pal) {
    const ctx = canvas.getContext("2d"), S = { ctx, pal, W: 0, H: 0, hl: "#e0a400", now: 0 };
    S.size = (W, H) => { const d = window.devicePixelRatio || 1; S.W = W; S.H = H; canvas.width = W * d; canvas.height = H * d; canvas.style.width = W + "px"; canvas.style.height = H + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); };
    S.x = (u) => u * S.W; S.y = (v) => v * S.H;
    S.clear = () => ctx.clearRect(0, 0, S.W, S.H);
    S.ease = (k) => (k < 0 ? 0 : k > 1 ? 1 : k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    S.lerp = (a, b, k) => a + (b - a) * k;
    S.part = (k, a, b) => Math.max(0, Math.min(1, (k - a) / (b - a))); // progress of a sub-range of k
    S.alpha = (a, fn) => { const o = ctx.globalAlpha; ctx.globalAlpha = o * Math.max(0, Math.min(1, a)); fn(); ctx.globalAlpha = o; };
    S.text = (s, u, v, o = {}) => {
      ctx.font = `${o.weight || 600} ${o.size || 13}px ${o.mono ? "ui-monospace, Consolas, monospace" : "system-ui, sans-serif"}`;
      ctx.fillStyle = o.color || pal.fg; ctx.textAlign = o.align || "center"; ctx.textBaseline = o.base || "middle";
      ctx.fillText(String(s), S.x(u), S.y(v), o.max ? S.x(o.max) : undefined);
    };
    S.dot = (u, v, r, col, ring) => { ctx.beginPath(); ctx.arc(S.x(u), S.y(v), r, 0, 7); ctx.fillStyle = col; ctx.fill(); if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke(); } };
    S.ring = (u, v, r, col, lw = 2) => { ctx.beginPath(); ctx.arc(S.x(u), S.y(v), r, 0, 7); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); };
    S.line = (u1, v1, u2, v2, col, lw = 2, dash) => { ctx.beginPath(); ctx.setLineDash(dash || []); ctx.moveTo(S.x(u1), S.y(v1)); ctx.lineTo(S.x(u2), S.y(v2)); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]); };
    S.arrow = (u1, v1, u2, v2, col, lw = 2, head = 8) => {
      S.line(u1, v1, u2, v2, col, lw); const a = Math.atan2(S.y(v2) - S.y(v1), S.x(u2) - S.x(u1));
      ctx.beginPath(); ctx.moveTo(S.x(u2), S.y(v2)); ctx.lineTo(S.x(u2) - head * Math.cos(a - 0.45), S.y(v2) - head * Math.sin(a - 0.45)); ctx.lineTo(S.x(u2) - head * Math.cos(a + 0.45), S.y(v2) - head * Math.sin(a + 0.45)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    };
    S.rect = (u, v, w, h, fill, stroke, lw = 1.5, r = 6) => {
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(S.x(u), S.y(v), S.x(w), S.y(h), r); else ctx.rect(S.x(u), S.y(v), S.x(w), S.y(h));
      if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
    };
    // A labelled card centred on (u, v)
    S.box = (u, v, w, h, label, o = {}) => {
      S.rect(u - w / 2, v - h / 2, w, h, o.fill || pal.bg, o.stroke || pal.line, o.lw || 1.5, o.r || 8);
      if (label != null) S.text(label, u, o.sub ? v - h * 0.16 : v, { size: o.size || 12, color: o.color, max: w * 0.94 });
      if (o.sub) S.text(o.sub, u, v + h * 0.22, { size: o.subSize || 10.5, color: pal.muted, weight: 500, max: w * 0.94 });
    };
    S.tint = (col, a) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(col).trim()); return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : col; };
    // A chart area inside the canvas; data x and y both run 0..1 with y pointing up
    S.area = (u0, v0, u1, v1) => {
      const g = { X: (x) => S.x(u0 + (u1 - u0) * x), Y: (y) => S.y(v1 - (v1 - v0) * y), u: (x) => u0 + (u1 - u0) * x, v: (y) => v1 - (v1 - v0) * y };
      g.frame = (xl, yl) => { S.line(u0, v1, u1, v1, pal.line, 1.5); S.line(u0, v0, u0, v1, pal.line, 1.5); if (xl) S.text(xl, u1, v1 + 0.045, { size: 11, color: pal.muted, align: "right" }); if (yl) S.text(yl, u0 + 0.005, v0 - 0.03, { size: 11, color: pal.muted, align: "left" }); };
      g.dot = (x, y, r, col, ring) => S.dot(g.u(x), g.v(y), r, col, ring);
      g.line = (x1, y1, x2, y2, col, lw, dash) => S.line(g.u(x1), g.v(y1), g.u(x2), g.v(y2), col, lw, dash);
      g.path = (pts, col, lw = 2.5) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(g.X(x), g.Y(y)) : ctx.moveTo(g.X(x), g.Y(y)))); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); };
      g.text = (s, x, y, o) => S.text(s, g.u(x), g.v(y), o);
      return g;
    };
    return S;
  }

  A.storyKit = kit; // used by tests to draw scenes directly

  // view = { how, try?, note?, label?, scenes(S) → [{ t: title, dur: ms, cap: string | (k) => string, draw(S, k) }] }
  A.story = function (id, view) {
    A.addView(id, {
      key: "anim", label: view.label || "Watch it work", order: 1, scenes: view.scenes, how: view.how, try: view.try || "Press Play and read the caption under each scene. Use Back and Next to go at your own pace, or click any scene in the list to jump to it.", note: view.note, wide: true,
      mount(host, ctl) {
        const pal = palette();
        host.innerHTML = `<canvas class="algocanvas storycv"></canvas><p class="tcap storycap" aria-live="polite"></p>`;
        const S = kit(host.querySelector("canvas"), pal), cap = host.querySelector(".storycap");
        const fit = () => { const W = Math.max(300, Math.min(host.clientWidth || 640, 780)); S.size(W, W < 480 ? 390 : Math.round(Math.max(300, Math.min(400, W * 0.52)))); };
        fit();
        const first = A.problems && A.problems.scene(id), scenes = (first ? [first] : []).concat(view.scenes(S));
        const ui = panel(ctl, `<div class="row">${btn("play", "Pause", true)}${btn("back", "← Back")}${btn("next", "Next →")}${btn("restart", "Restart")}</div>` + slider("sp", "Speed", 0.5, 3, 0.25, 1) + `<label>Scenes</label><ol class="storylist">${scenes.map((s, i) => `<li><button type="button" data-scene="${i}">${esc(s.t)}</button></li>`).join("")}</ol>`);
        let i = 0, t = 0, playing = true, speed = 1, last = performance.now(), hold = 0;
        const capOf = (s, k) => (typeof s.cap === "function" ? s.cap(k) : s.cap);
        const go = (n) => { i = Math.max(0, Math.min(scenes.length - 1, n)); t = 0; hold = 0; };
        let raf = 0, on = true;
        function frame() {
          if (!on) return;
          const now = performance.now(), dt = Math.min(100, now - last) * speed; last = now; S.now = now;
          const s = scenes[i];
          if (playing) {
            if (t < s.dur) t += dt;
            else { hold += dt; if (hold > Math.max(1800, capOf(s, 1).length * 38)) { if (i < scenes.length - 1) go(i + 1); else { playing = false; ui.q("play").textContent = "Play again"; } } }
          }
          const k = Math.min(1, t / s.dur);
          S.clear(); s.draw(S, k);
          S.text(`${i + 1} / ${scenes.length}  ·  ${s.t}`, 0.012, 0.035, { size: 11, color: pal.muted, align: "left", weight: 700 });
          const c = capOf(s, k); if (cap.textContent !== c) cap.textContent = c;
          ctl.querySelectorAll("[data-scene]").forEach((b) => b.setAttribute("aria-current", +b.dataset.scene === i ? "step" : "false"));
          raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);
        const setPlay = (p) => { playing = p; ui.q("play").textContent = p ? "Pause" : "Play"; };
        ui.on("play", "click", () => { if (!playing && i === scenes.length - 1 && t >= scenes[i].dur) { go(0); setPlay(true); } else setPlay(!playing); last = performance.now(); });
        ui.on("back", "click", () => { go(i - 1); setPlay(false); });
        ui.on("next", "click", () => { if (t < scenes[i].dur) t = scenes[i].dur; else go(i + 1); setPlay(false); });
        ui.on("restart", "click", () => { go(0); setPlay(true); });
        ui.on("sp", "input", (e, el) => { speed = +el.value; ui.show("sp", speed + "×"); });
        ui.show("sp", "1×");
        ctl.querySelector(".storylist").addEventListener("click", (e) => { const b = e.target.closest("[data-scene]"); if (b) { go(+b.dataset.scene); setPlay(true); } });
        const onResize = () => fit(); window.addEventListener("resize", onResize);
        return () => { on = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
      },
    });
  };
})();
