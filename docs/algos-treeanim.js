// Algorithms map: an animated, step-by-step decision tree (scan questions → pick the best → split → repeat → predict).
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A) return;
  const { palette, plot, loop, btn, slider, panel, rgb } = A.h;

  // Same students every time, so the story is repeatable. x = study hours, y = sleep hours (0..1 = 0..10 h)
  function seeded(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function students() {
    const r = seeded(7), pts = [];
    for (let i = 0; i < 46; i++) {
      const x = 0.04 + 0.92 * r(), y = 0.04 + 0.92 * r();
      pts.push({ x, y, c: (x > 0.45 && y > 0.35) || x > 0.82 ? 1 : 0 });
    }
    pts[3].c ^= 1; pts[17].c ^= 1; // two surprises: real data is never perfectly tidy
    return pts;
  }
  const FEAT = { x: "Study", y: "Sleep" };
  const hrs = (v) => (v * 10).toFixed(1) + " h";
  const gini = (pts) => { if (!pts.length) return 0; const p = pts.filter((q) => q.c).length / pts.length; return 2 * p * (1 - p); };
  const count = (pts) => ({ pass: pts.filter((p) => p.c).length, fail: pts.filter((p) => !p.c).length });

  // Grow the whole tree up front and record every step the animation will show
  function grow(pts, maxDepth) {
    const steps = [], nodes = [];
    function make(pts, box, depth, parent, side) {
      const n = Object.assign({ id: nodes.length, pts, box, depth, parent, side, g: gini(pts) }, count(pts)); nodes.push(n);
      return n;
    }
    function split(n) {
      steps.push({ type: "focus", n });
      const stop = n.g === 0 ? "pure" : n.depth >= maxDepth ? "depth" : n.pts.length < 4 ? "small" : null;
      if (!stop) {
        const scans = [];
        for (const f of ["x", "y"]) {
          const [lo, hi] = f === "x" ? [n.box[0], n.box[1]] : [n.box[2], n.box[3]], cands = [];
          for (let t = Math.ceil(lo * 40 + 0.01) / 40; t < hi - 0.001; t += 0.025) {
            const L = n.pts.filter((p) => p[f] < t), R = n.pts.filter((p) => p[f] >= t);
            if (!L.length || !R.length) { cands.push({ t, s: null }); continue; }
            cands.push({ t, s: (L.length * gini(L) + R.length * gini(R)) / n.pts.length, L: count(L), R: count(R) });
          }
          scans.push({ f, cands });
          steps.push({ type: "scan", n, f, cands });
        }
        let best = null;
        scans.forEach(({ f, cands }) => cands.forEach((c) => { if (c.s != null && (!best || c.s < best.s - 1e-9)) best = Object.assign({ f }, c); }));
        if (best && best.s < n.g - 1e-9) {
          n.f = best.f; n.t = best.t; n.after = best.s;
          steps.push({ type: "pick", n });
          const b = n.box, f = n.f, t = n.t;
          n.left = make(n.pts.filter((p) => p[f] < t), f === "x" ? [b[0], t, b[2], b[3]] : [b[0], b[1], b[2], t], n.depth + 1, n, "yes");
          n.right = make(n.pts.filter((p) => p[f] >= t), f === "x" ? [t, b[1], b[2], b[3]] : [b[0], b[1], t, b[3]], n.depth + 1, n, "no");
          steps.push({ type: "split", n });
          split(n.left); split(n.right);
          return;
        }
      }
      n.leaf = true; n.why = stop || "nogain";
      steps.push({ type: "leaf", n });
    }
    const root = make(pts, [0, 1, 0, 1], 0, null, null);
    split(root);
    // Tree-diagram positions: leaves left to right, parents centred above their children
    let slot = 0;
    (function place(n) { if (n.leaf) { n.slot = slot++; return; } place(n.left); place(n.right); n.slot = (n.left.slot + n.right.slot) / 2; })(root);
    return { root, nodes, steps, leaves: slot };
  }
  const DUR = { focus: 1100, scan: 0, pick: 1500, split: 1100, leaf: 1300 };
  const stepDur = (s) => (s.type === "scan" ? Math.max(1200, s.cands.length * 55) : DUR[s.type]);

  const demo = {
    key: "anim", label: "Watch it grow", order: 1,
    how: "A decision tree learns by playing 20 questions with the data. For the group in front of it, it tries every possible yes/no question (\"Study less than 4.5 h?\"), scores how well each one separates passes from fails, keeps the best one, and splits the group in two. Then it does the same for each half, until the groups are pure or the tree is deep enough.",
    try: "Press Play and watch one split at a time. The yellow line sweeps across the chart trying every question; the small chart underneath shows the mix score for each one (lower is better). When the tree is finished, press \"Predict a new student\" or click anywhere on the chart to send a student down the tree.",
    note: "The \"mix score\" here is the Gini impurity: 0 = everyone in the group has the same result, 0.5 = a 50/50 mix. A split is good when the two halves are less mixed than the group was.",
    wide: true,
    mount(host, ctl) {
      const pal = palette(), hl = "#e0a400";
      host.innerHTML = `<div class="tanim"><div class="tleft"><p class="lbl">Students: <span style="color:${pal.a}">● pass</span> <span style="color:${pal.b}">● fail</span></p><div class="tplot"></div><p class="lbl">Mix score for every question tried (lower = better)</p><div class="tscore"></div></div><div class="tright"><p class="lbl">The tree being built</p><canvas class="algocanvas tdiag"></canvas></div></div><p class="tcap" aria-live="polite"></p>`;
      const P = plot(host.querySelector(".tplot"), 300), S = plot(host.querySelector(".tscore"), 90);
      const dc = host.querySelector(".tdiag"), dx = dc.getContext("2d");
      const cap = host.querySelector(".tcap");
      const ui = panel(ctl, `<div class="row">${btn("play", "Pause", true)}${btn("step", "Next step")}${btn("restart", "Restart")}</div>` + slider("sp", "Speed", 0.5, 3, 0.25, 1) + slider("d", "Maximum depth", 1, 4, 1, 3) + btn("predict", "Predict a new student"));
      const pts = students();
      let T, i = 0, t = 0, playing = true, speed = 1, maxDepth = 3, last = performance.now(), pred = null;

      function reset() { T = grow(pts, maxDepth); T.nodes.forEach((n) => { n.shown = n.id === 0; n.asked = false; n.done = false; }); i = 0; t = 0; pred = null; }
      // Apply a finished step's lasting effect on what's drawn
      function finish(s) {
        if (s.type === "pick") s.n.asked = true;
        if (s.type === "split") { s.n.left.shown = s.n.right.shown = true; s.n.done = true; }
        if (s.type === "leaf") s.n.done = true;
      }
      const cur = () => T.steps[i];

      // ---------- Left: the scatter of students ----------
      function region(n, alpha) {
        const col = rgb(n.pass >= n.fail ? pal.a : pal.b), b = n.box;
        P.ctx.fillStyle = `rgba(${col.join(",")},${alpha})`; P.ctx.fillRect(P.X(b[0]), P.Y(b[3]), P.X(b[1]) - P.X(b[0]), P.Y(b[2]) - P.Y(b[3]));
      }
      function outline(n, col, lw) { const b = n.box; P.ctx.lineWidth = lw; P.ctx.strokeStyle = col; P.ctx.strokeRect(P.X(b[0]) + lw / 2, P.Y(b[3]) + lw / 2, P.X(b[1]) - P.X(b[0]) - lw, P.Y(b[2]) - P.Y(b[3]) - lw); }
      function cutLine(n, f, v, col, lw, dash) { const b = n.box; if (f === "x") P.line(v, b[2], v, b[3], col, lw, dash); else P.line(b[0], v, b[1], v, col, lw, dash); }
      function drawPlot(s, k) {
        P.clear();
        T.nodes.forEach((n) => { if (n.leaf && n.done) region(n, 0.16); });
        T.nodes.forEach((n) => { if (n.done && !n.leaf) cutLine(n, n.f, n.t, pal.fg, 2); });
        // axes labels
        P.text("Study hours →", 0.99, 0.02, pal.muted, 11, "right"); P.ctx.save(); P.ctx.translate(12, P.Y(0.5)); P.ctx.rotate(-Math.PI / 2); P.ctx.font = "600 11px system-ui, sans-serif"; P.ctx.fillStyle = pal.muted; P.ctx.textAlign = "center"; P.ctx.fillText("Sleep hours →", 0, 0); P.ctx.restore();
        const n = s && s.n, inFocus = (p) => !n || (p.x >= n.box[0] && p.x < n.box[1] + 1e-9 && p.y >= n.box[2] && p.y < n.box[3] + 1e-9);
        pts.forEach((p) => P.dot(p.x, p.y, p.c ? pal.a : pal.b, 5, pal.bg));
        if (n && !pred) {
          // dim everyone outside the group being worked on
          P.ctx.fillStyle = `rgba(${rgb(pal.bg).join(",")},0.55)`;
          const b = n.box; P.ctx.save(); P.ctx.beginPath(); P.ctx.rect(0, 0, P.w, P.h); P.ctx.rect(P.X(b[0]), P.Y(b[3]), P.X(b[1]) - P.X(b[0]), P.Y(b[2]) - P.Y(b[3])); P.ctx.fill("evenodd"); P.ctx.restore();
          outline(n, hl, 3);
          if (s.type === "scan") {
            const c = s.cands[Math.min(s.cands.length - 1, Math.floor(k * s.cands.length))];
            const side = rgb(hl); P.ctx.fillStyle = `rgba(${side.join(",")},0.10)`; const b2 = n.box;
            if (s.f === "x") P.ctx.fillRect(P.X(b2[0]), P.Y(b2[3]), P.X(c.t) - P.X(b2[0]), P.Y(b2[2]) - P.Y(b2[3])); else P.ctx.fillRect(P.X(b2[0]), P.Y(c.t), P.X(b2[1]) - P.X(b2[0]), P.Y(b2[2]) - P.Y(c.t));
            cutLine(n, s.f, c.t, hl, 2.5, [6, 4]);
          }
          if (s.type === "pick" || s.type === "split") cutLine(n, n.f, n.t, hl, s.type === "pick" ? 2 + 2 * Math.abs(Math.sin(k * Math.PI * 3)) : 3);
          pts.forEach((p) => { if (inFocus(p)) P.dot(p.x, p.y, p.c ? pal.a : pal.b, 5.5, pal.bg); });
        }
        if (pred) {
          const at = pred.path[Math.min(pred.path.length - 1, pred.k)];
          outline(at, hl, 3);
          P.ring(pred.x, pred.y, hl, 10 + 3 * Math.sin(performance.now() / 150), 3);
          P.dot(pred.x, pred.y, pred.k >= pred.path.length - 1 ? (pred.leaf.pass >= pred.leaf.fail ? pal.a : pal.b) : pal.fg, 6, pal.bg);
        }
      }

      // ---------- Under the scatter: the mix score of each question tried ----------
      function drawScore(s, k) {
        S.clear(); const ctx = S.ctx;
        ctx.strokeStyle = pal.line; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, S.w - 1, S.h - 1);
        if (!s || pred || (s.type !== "scan" && s.type !== "pick")) { S.text(s && s.type === "leaf" ? "No question needed: this group stops here." : "Shown while the tree is trying questions.", 0.5, 0.45, pal.muted, 11, "center"); return; }
        const scans = T.steps.filter((x) => x.type === "scan" && x.n === s.n), upto = s.type === "pick" ? 2 : scans.indexOf(s) + 1;
        const all = scans.flatMap((x) => x.cands), half = 0.5;
        scans.slice(0, upto).forEach((sc, j) => {
          const shown = sc === s ? Math.floor(k * sc.cands.length) + 1 : sc.cands.length, col = j ? pal.groups[2] : pal.groups[3];
          ctx.beginPath(); let started = false;
          sc.cands.slice(0, shown).forEach((c) => { if (c.s == null) { started = false; return; } const X = S.X(c.t), Y = S.Y(0.08 + 0.84 * (1 - c.s / half)); if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y); });
          ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
          S.text(`${FEAT[sc.f]} < ?`, j ? 0.98 : 0.02, 0.06, col, 11, j ? "right" : "left");
        });
        S.line(0, 0.92 - 0.84 * (s.n.g / half), 1, 0.92 - 0.84 * (s.n.g / half), pal.muted, 1, [3, 3]);
        S.text(`group's mix now ${s.n.g.toFixed(2)}`, 0.5, 0.95 - 0.84 * (s.n.g / half) + 0.06, pal.muted, 10, "center");
        if (s.type === "pick") { const y = 0.08 + 0.84 * (1 - s.n.after / half); S.ring(s.n.t, y, hl, 6, 3); }
        void all;
      }

      // ---------- Right: the tree diagram ----------
      function drawDiag(s) {
        const W = Math.max(260, Math.min(host.querySelector(".tright").clientWidth || 360, A.full ? 900 : 520)), H = A.full ? Math.round(Math.max(360, window.innerHeight * 0.55)) : 360, d = window.devicePixelRatio || 1;
        if (dc.width !== W * d) { dc.width = W * d; dc.height = H * d; dc.style.width = W + "px"; dc.style.height = H + "px"; }
        dx.setTransform(d, 0, 0, d, 0, 0); dx.clearRect(0, 0, W, H);
        const levels = Math.max(...T.nodes.map((n) => n.depth)) + 1, bw = Math.min(118, W / T.leaves - 6), bh = 46;
        const pos = (n) => ({ x: (n.slot + 0.5) * (W / T.leaves), y: 30 + n.depth * ((H - 60) / Math.max(1, levels - 1 || 1)) });
        const focus = pred ? pred.path[Math.min(pred.path.length - 1, pred.k)] : s && s.n;
        dx.font = "600 11px system-ui, sans-serif"; dx.textAlign = "center"; dx.textBaseline = "middle";
        T.nodes.forEach((n) => { if (!n.shown || !n.parent) return; const a = pos(n.parent), b = pos(n), onPath = pred && pred.path.indexOf(n) > -1 && pred.path.indexOf(n) <= pred.k;
          dx.beginPath(); dx.moveTo(a.x, a.y + bh / 2); dx.lineTo(b.x, b.y - bh / 2); dx.strokeStyle = onPath ? hl : pal.line; dx.lineWidth = onPath ? 4 : 2; dx.stroke();
          dx.fillStyle = pal.muted; dx.fillText(n.side, (a.x + b.x) / 2 + (n.side === "yes" ? -12 : 12), (a.y + b.y) / 2); });
        T.nodes.forEach((n) => {
          if (!n.shown) return; const p = pos(n), x = p.x - bw / 2, y = p.y - bh / 2;
          dx.fillStyle = pal.bg; dx.strokeStyle = n === focus ? hl : n.leaf && n.done ? (n.pass >= n.fail ? pal.a : pal.b) : pal.fg; dx.lineWidth = n === focus ? 3.5 : 1.5;
          dx.beginPath(); dx.roundRect ? dx.roundRect(x, y, bw, bh, 8) : dx.rect(x, y, bw, bh); dx.fill(); dx.stroke();
          // pass/fail bar
          const tot = n.pass + n.fail, pw = (bw - 12) * (n.pass / tot);
          dx.fillStyle = pal.a; dx.fillRect(x + 6, y + bh - 11, pw, 5); dx.fillStyle = pal.b; dx.fillRect(x + 6 + pw, y + bh - 11, bw - 12 - pw, 5);
          dx.fillStyle = pal.fg;
          const label = n.asked ? `${FEAT[n.f]} < ${hrs(n.t)}?` : n.leaf && n.done ? `${n.pass >= n.fail ? "PASS" : "FAIL"} ${Math.max(n.pass, n.fail)}/${tot}` : `? ${tot} students`;
          dx.fillText(label, p.x, y + 15, bw - 6);
          dx.fillStyle = pal.muted; dx.fillText(`${n.pass} pass · ${n.fail} fail`, p.x, y + 28, bw - 6);
        });
      }

      // ---------- Captions in plain language ----------
      function caption(s, k) {
        if (pred) {
          const at = pred.path[Math.min(pred.path.length - 1, pred.k)];
          return at.leaf ? `This student (study ${hrs(pred.x)}, sleep ${hrs(pred.y)}) lands in a box where ${Math.max(at.pass, at.fail)} of ${at.pass + at.fail} students ${at.pass >= at.fail ? "passed" : "failed"}, so the tree predicts ${at.pass >= at.fail ? "PASS" : "FAIL"}.`
            : `Question: ${FEAT[at.f]} less than ${hrs(at.t)}? This student has ${hrs(pred[at.f])}, so the answer is ${pred[at.f] < at.t ? "yes → go left" : "no → go right"}.`;
        }
        if (!s) return `Finished. The tree asks ${T.nodes.filter((n) => !n.leaf).length} questions and ends in ${T.leaves} boxes. Press "Predict a new student" or click the chart.`;
        const n = s.n, tot = n.pass + n.fail;
        if (s.type === "focus") return n.id === 0 ? `Start with all ${tot} students: ${n.pass} passed, ${n.fail} failed. That's quite mixed (mix score ${n.g.toFixed(2)}). The tree needs a question that separates them.` : `Now look only at this group of ${tot} students (${n.pass} pass, ${n.fail} fail). Mix score: ${n.g.toFixed(2)}.`;
        if (s.type === "scan") {
          const c = s.cands[Math.min(s.cands.length - 1, Math.floor(k * s.cands.length))];
          return c.s == null ? `Trying "${FEAT[s.f]} < ${hrs(c.t)}?" … everyone is on one side, so it doesn't split anything.` : `Trying "${FEAT[s.f]} < ${hrs(c.t)}?": yes-side ${c.L.pass} pass / ${c.L.fail} fail, no-side ${c.R.pass} pass / ${c.R.fail} fail → combined mix ${c.s.toFixed(2)}.`;
        }
        if (s.type === "pick") return `Best question: "${FEAT[n.f]} less than ${hrs(n.t)}?". It brings the mix down from ${n.g.toFixed(2)} to ${n.after.toFixed(2)}, more than any other question tried.`;
        if (s.type === "split") return `Split! Students who answer yes go left (${n.left.pass + n.left.fail} students), no goes right (${n.right.pass + n.right.fail}). Each half is now a smaller, tidier problem.`;
        if (s.type === "leaf") return n.why === "pure" ? `Everyone here has the same result: the group is pure, so it becomes a leaf that predicts ${n.pass ? "PASS" : "FAIL"}.` : n.why === "depth" ? `Maximum depth reached, so stop here. The leaf predicts the majority: ${n.pass >= n.fail ? "PASS" : "FAIL"} (${Math.max(n.pass, n.fail)} of ${tot}).` : `No question makes this group tidier (or it's too small to split), so it becomes a leaf predicting ${n.pass >= n.fail ? "PASS" : "FAIL"}.`;
        return "";
      }

      function render() {
        const s = cur(), k = s ? Math.min(1, t / stepDur(s)) : 1;
        drawPlot(s, k); drawScore(s, k); drawDiag(s); cap.textContent = caption(s, k);
        const done = T.steps.slice(0, i).filter((x) => x.type === "split").length;
        ui.info(`step ${Math.min(i + 1, T.steps.length)} of ${T.steps.length}\nquestions chosen: ${done}\nmaximum depth: ${maxDepth}\n\nmix score (Gini):\n  0.00 = all the same\n  0.50 = half pass, half fail`);
      }
      function advance() { const s = cur(); if (!s) return; finish(s); i++; t = 0; }
      function toEnd() { while (cur()) advance(); }
      function predict(x, y) {
        toEnd(); const path = [T.root]; let n = T.root;
        while (!n.leaf) { n = (n.f === "x" ? x : y) < n.t ? n.left : n.right; path.push(n); }
        pred = { x, y, path, leaf: n, k: 0, t: 0 }; playing = true; ui.q("play").textContent = "Pause";
      }

      const stop = loop(() => {
        const now = performance.now(), dt = Math.min(100, now - last) * speed; last = now;
        if (playing) {
          if (pred) { pred.t += dt; if (pred.t > 1400 && pred.k < pred.path.length - 1) { pred.k++; pred.t = 0; } }
          else if (cur()) { t += dt; if (t >= stepDur(cur())) advance(); }
          else { playing = false; ui.q("play").textContent = "Play"; }
        }
        render();
      });

      ui.on("play", "click", (e, b) => { if (!cur() && !pred) { reset(); } playing = !playing; b.textContent = playing ? "Pause" : "Play"; last = performance.now(); });
      ui.on("step", "click", () => { pred = null; playing = false; ui.q("play").textContent = "Play"; if (!cur()) reset(); else advance(); });
      ui.on("restart", "click", () => { reset(); playing = true; ui.q("play").textContent = "Pause"; });
      ui.on("sp", "input", (e, s) => { speed = +s.value; ui.show("sp", speed + "×"); });
      ui.on("d", "input", (e, s) => { maxDepth = +s.value; ui.show("d", maxDepth); reset(); playing = true; ui.q("play").textContent = "Pause"; });
      ui.on("predict", "click", () => predict(0.06 + 0.88 * Math.random(), 0.06 + 0.88 * Math.random()));
      P.c.addEventListener("click", (e) => { const p = P.at(e); predict(p.x, p.y); });
      ui.show("sp", "1×");
      reset();
      return stop;
    },
  };
  // First tab of the Decision Tree page
  A.addView("tree", demo);
})();
