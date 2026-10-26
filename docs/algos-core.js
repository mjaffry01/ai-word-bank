// Algorithms map: shared helpers, the picker/stage layout, and the supervised-learning demos.
// Unsupervised and reinforcement-learning demos register themselves from algos-uns.js and algos-rl.js.
(function () {
  const A = (window.WB_ALGOS = window.WB_ALGOS || { list: [] });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- Helpers shared by every demo ---------- */
  const css = (v, d) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || d;
  function rgb(c) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(c.trim());
    if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    const r = /rgba?\(([^)]+)\)/.exec(c); if (r) return r[1].split(",").slice(0, 3).map(Number);
    return [128, 128, 128];
  }
  const palette = () => ({
    a: css("--t0", "#0b6e69"), b: css("--t4", "#b23f2e"), fg: css("--fg", "#222"), muted: css("--muted", "#777"),
    line: css("--line", "#ccc"), bg: css("--bg", "#fff"), accent: css("--accent", "#0b6e69"), good: css("--good", "#1d7a3e"), bad: css("--bad", "#b3261e"),
    groups: [css("--t0", "#0b6e69"), css("--t4", "#b23f2e"), css("--t2", "#7a861a"), css("--t3", "#b56d12"), css("--t1", "#2f8f5c"), "#7b5cc4"],
  });
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const clamp01 = (v) => Math.max(0.02, Math.min(0.98, v));
  const blob = (n, cx, cy, sd, c) => Array.from({ length: n }, () => ({ x: clamp01(cx + gauss() * sd), y: clamp01(cy + gauss() * sd), c }));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // A canvas in "data space": x and y both run 0..1, with y pointing up
  function plot(host, h = 340) {
    const c = document.createElement("canvas"); c.className = "algocanvas"; host.appendChild(c);
    const ctx = c.getContext("2d"); let W = 0, H = h;
    function size() { W = Math.max(260, Math.min(host.clientWidth || 560, 640)); const d = window.devicePixelRatio || 1; c.width = W * d; c.height = H * d; c.style.width = W + "px"; c.style.height = H + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); }
    size();
    const P = {
      c, ctx, get w() { return W; }, get h() { return H; },
      X: (x) => x * W, Y: (y) => (1 - y) * H,
      at(e) { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height }; },
      clear() { ctx.clearRect(0, 0, W, H); },
      dot(x, y, col, r = 5, ring) { ctx.beginPath(); ctx.arc(P.X(x), P.Y(y), r, 0, 7); ctx.fillStyle = col; ctx.fill(); if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke(); } },
      ring(x, y, col, r = 8, lw = 2) { ctx.beginPath(); ctx.arc(P.X(x), P.Y(y), r, 0, 7); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); },
      line(x1, y1, x2, y2, col, lw = 2, dash) { ctx.beginPath(); ctx.setLineDash(dash || []); ctx.moveTo(P.X(x1), P.Y(y1)); ctx.lineTo(P.X(x2), P.Y(y2)); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]); },
      text(s, x, y, col, size = 12, align = "left") { ctx.font = `600 ${size}px system-ui, sans-serif`; ctx.fillStyle = col; ctx.textAlign = align; ctx.fillText(s, P.X(x), P.Y(y)); },
      // Shade the background from a function returning 0..1 (towards class A or class B)
      shade(fn, ca, cb, cols = 46, rows = 30) {
        const A_ = rgb(ca), B_ = rgb(cb), cw = W / cols, ch = H / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const p = fn((i + 0.5) / cols, 1 - (j + 0.5) / rows); if (p == null) continue;
          const m = [0, 1, 2].map((k) => Math.round(A_[k] * (1 - p) + B_[k] * p)), a = 0.08 + 0.3 * Math.abs(2 * p - 1);
          ctx.fillStyle = `rgba(${m[0]},${m[1]},${m[2]},${a})`; ctx.fillRect(i * cw, j * ch, cw + 1, ch + 1);
        }
      },
    };
    return P;
  }
  // Animation loop that stops itself when the demo is closed
  function loop(fn) { let id = 0, on = true; const f = () => { if (!on) return; fn(); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(id); }; }
  const btn = (k, label, primary) => `<button class="btn sm${primary ? " primary" : ""}" data-k="${k}">${label}</button>`;
  const slider = (k, label, min, max, step, val) => `<label>${label}: <span data-v="${k}">${val}</span><input type="range" class="slider" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  const classPick = (cur) => `<label>Click adds a point of<div class="row"><button class="choice" data-cls="0" aria-pressed="${cur === 0}">Class A</button><button class="choice" data-cls="1" aria-pressed="${cur === 1}">Class B</button></div></label>`;
  // Small control-panel binder: on("k", "click"|"input", fn)
  function panel(el, html) {
    el.innerHTML = html;
    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    return {
      q, on(k, ev, fn) { const n = q(k); if (n) n.addEventListener(ev, (e) => fn(e, n)); },
      val(k) { return +q(k).value; },
      show(k, v) { const n = el.querySelector(`[data-v="${k}"]`); if (n) n.textContent = v; },
      info(s) { let n = el.querySelector(".algoinfo"); if (!n) { n = document.createElement("div"); n.className = "algoinfo"; el.appendChild(n); } n.textContent = s; },
      onClass(fn) { el.querySelectorAll("[data-cls]").forEach((b) => b.addEventListener("click", () => { el.querySelectorAll("[data-cls]").forEach((x) => x.setAttribute("aria-pressed", x === b)); fn(+b.dataset.cls); })); },
    };
  }
  const legend = (pal, items) => `<div class="legend4">${items.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("")}</div>`;
  A.h = { esc, css, rgb, palette, rand, gauss, blob, shuffle, plot, loop, btn, slider, classPick, panel, legend, clamp01 };
  const add = (o) => A.list.push(o);
  A.add = add;

  /* ---------- Shared 2-class datasets ---------- */
  const twoBlobs = (n = 30) => [...blob(n, 0.33, 0.35, 0.11, 0), ...blob(n, 0.66, 0.65, 0.11, 1)];
  const xorData = (n = 22) => [...blob(n, 0.27, 0.27, 0.08, 0), ...blob(n, 0.73, 0.73, 0.08, 0), ...blob(n, 0.27, 0.73, 0.08, 1), ...blob(n, 0.73, 0.27, 0.08, 1)];
  const circleData = (n = 160) => Array.from({ length: n }, () => { const x = Math.random(), y = Math.random(), r = Math.hypot(x - 0.5, y - 0.5); return { x, y, c: r < 0.27 ? 1 : 0 }; }).filter((p) => { const r = Math.hypot(p.x - 0.5, p.y - 0.5); return Math.abs(r - 0.27) > 0.03; });
  A.data = { twoBlobs, xorData, circleData };

  /* ---------- Decision tree (CART with Gini), also used by random forest ---------- */
  const gini = (pts) => { if (!pts.length) return 0; const p = pts.filter((q) => q.c === 1).length / pts.length; return 1 - p * p - (1 - p) * (1 - p); };
  function buildTree(pts, depth, randomFeature) {
    const n1 = pts.filter((p) => p.c === 1).length, leaf = { leaf: true, p: pts.length ? n1 / pts.length : 0.5, n: pts.length };
    if (depth <= 0 || n1 === 0 || n1 === pts.length || pts.length < 3) return leaf;
    let best = null; const base = gini(pts);
    const feats = randomFeature ? [Math.random() < 0.5 ? "x" : "y"] : ["x", "y"];
    for (const f of feats) {
      const vals = [...new Set(pts.map((p) => p[f]))].sort((a, b) => a - b);
      for (let i = 1; i < vals.length; i++) {
        const t = (vals[i - 1] + vals[i]) / 2, L = pts.filter((p) => p[f] < t), R = pts.filter((p) => p[f] >= t);
        const s = (L.length * gini(L) + R.length * gini(R)) / pts.length;
        if (!best || s < best.s) best = { f, t, s, L, R };
      }
    }
    if (!best || best.s >= base - 1e-9) return leaf;
    return { f: best.f, t: best.t, left: buildTree(best.L, depth - 1, randomFeature), right: buildTree(best.R, depth - 1, randomFeature) };
  }
  const treeP = (n, p) => (n.leaf ? n.p : treeP(p[n.f] < n.t ? n.left : n.right, p));
  A.tree = { buildTree, treeP };

  /* ---------- Supervised demos ---------- */
  add({
    id: "linreg", group: "sup", star: true, name: "Linear Regression", kind: "Regression", term: "Linear Regression",
    how: "Finds the straight line that makes the total squared distance between the line and the points (the dashed red errors) as small as possible. The line is the model: slope and intercept are its two parameters.",
    try: "Click to add points anywhere. Add one far-away point and watch it drag the whole line: squared errors make linear regression sensitive to outliers.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = Array.from({ length: 14 }, () => { const x = rand(0.05, 0.95); return { x, y: clamp01(0.18 + 0.6 * x + gauss() * 0.07) }; });
      const ui = panel(ctl, btn("new", "New data") + btn("clear", "Clear"));
      function draw() {
        P.clear(); const n = pts.length;
        if (n >= 2) {
          const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
          const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) || 1e-9, b = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx, a = my - b * mx;
          pts.forEach((p) => P.line(p.x, p.y, p.x, a + b * p.x, pal.bad, 1.5, [4, 3]));
          P.line(0, a, 1, a + b, pal.fg, 3);
          const mse = pts.reduce((s, p) => s + (p.y - (a + b * p.x)) ** 2, 0) / n;
          ui.info(`y = ${a.toFixed(2)} + ${b.toFixed(2)} × x\npoints: ${n}\nmean squared error: ${mse.toFixed(4)}`);
        } else ui.info("Add at least 2 points.");
        pts.forEach((p) => P.dot(p.x, p.y, pal.a, 5));
      }
      P.c.addEventListener("click", (e) => { pts.push(P.at(e)); draw(); });
      ui.on("new", "click", () => { pts = Array.from({ length: 14 }, () => { const x = rand(0.05, 0.95), s = rand(-0.5, 0.8); return { x, y: clamp01(0.3 + s * x + gauss() * 0.07) }; }); draw(); });
      ui.on("clear", "click", () => { pts = []; draw(); });
      draw();
    },
  });

  add({
    id: "logreg", group: "sup", star: true, name: "Logistic Regression", kind: "Classification", term: "Logistic Regression",
    how: "Combines the inputs into a single score with learned weights, then squashes it into a probability between 0 and 1 with the sigmoid curve. Training nudges the weights by gradient descent to reduce errors. The boundary is where probability = 50%, always a straight line.",
    try: "Press Train and watch the boundary rotate into place. Then switch to XOR data: no straight line can separate it, which is why we need trees or neural networks.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = twoBlobs(), w = [0, 0, 0], step = 0, running = false, cls = 0;
      const ui = panel(ctl, btn("train", "Train", true) + btn("reset", "Reset weights") + `<div class="row">${btn("blobs", "Two groups")}${btn("xor", "XOR data")}</div>` + classPick(0));
      const f = (p) => [1, (p.x - 0.5) * 4, (p.y - 0.5) * 4];
      const prob = (p) => 1 / (1 + Math.exp(-f(p).reduce((s, v, i) => s + v * w[i], 0)));
      function gd() { const g = [0, 0, 0]; pts.forEach((p) => { const e = prob(p) - p.c; f(p).forEach((v, i) => { g[i] += e * v; }); }); w = w.map((v, i) => v - (0.6 * g[i]) / pts.length); step++; }
      function draw() {
        P.clear(); P.shade(prob, pal.a, pal.b);
        if (Math.abs(w[2]) > 1e-6) { const yAt = (x) => 0.5 - (w[0] + w[1] * (x - 0.5) * 4) / (w[2] * 4); P.line(0, yAt(0), 1, yAt(1), pal.fg, 2.5); }
        pts.forEach((p) => P.dot(p.x, p.y, p.c ? pal.b : pal.a, 5, pal.bg));
        const acc = pts.filter((p) => (prob(p) >= 0.5 ? 1 : 0) === p.c).length / (pts.length || 1);
        ui.info(`training steps: ${step}\nweights: ${w.map((v) => v.toFixed(2)).join(", ")}\naccuracy: ${Math.round(acc * 100)}%`);
      }
      const stop = loop(() => { if (running) { for (let i = 0; i < 4; i++) gd(); if (step > 600) { running = false; ui.q("train").textContent = "Train"; } draw(); } });
      ui.on("train", "click", (e, b) => { running = !running; if (step > 600) step = 0; b.textContent = running ? "Pause" : "Train"; });
      ui.on("reset", "click", () => { w = [0, 0, 0]; step = 0; draw(); });
      ui.on("blobs", "click", () => { pts = twoBlobs(); w = [0, 0, 0]; step = 0; draw(); });
      ui.on("xor", "click", () => { pts = xorData(); w = [0, 0, 0]; step = 0; draw(); });
      ui.onClass((c) => { cls = c; });
      P.c.addEventListener("click", (e) => { pts.push(Object.assign(P.at(e), { c: cls })); draw(); });
      draw();
      return stop;
    },
  });

  add({
    id: "tree", group: "sup", star: true, name: "Decision Tree", kind: "Classification · Regression", term: "Decision Tree",
    how: "Repeatedly asks the yes/no question about one feature (\"is x below 0.42?\") that best separates the classes, splitting the space into boxes. Each box predicts its majority class. Easy to read, but deep trees memorise noise.",
    try: "Raise the depth one step at a time and read the questions on the right. At high depth, look for tiny boxes drawn around single points: that's overfitting.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = xorData(18).concat(blob(6, 0.5, 0.5, 0.12, Math.random() < 0.5 ? 0 : 1)), depth = 2, cls = 0;
      const ui = panel(ctl, slider("d", "Tree depth", 1, 7, 1, depth) + `<div class="row">${btn("xor", "XOR data")}${btn("blobs", "Two groups")}${btn("circle", "Circle")}</div>` + classPick(0));
      function regions(n, box) {
        if (n.leaf) { const col = rgb(n.p >= 0.5 ? pal.b : pal.a); P.ctx.fillStyle = `rgba(${col.join(",")},${0.1 + 0.25 * Math.abs(2 * n.p - 1)})`; P.ctx.fillRect(P.X(box[0]), P.Y(box[3]), P.X(box[1]) - P.X(box[0]), P.Y(box[2]) - P.Y(box[3])); return; }
        if (n.f === "x") { regions(n.left, [box[0], n.t, box[2], box[3]]); regions(n.right, [n.t, box[1], box[2], box[3]]); P.line(n.t, box[2], n.t, box[3], pal.fg, 1.5); }
        else { regions(n.left, [box[0], box[1], box[2], n.t]); regions(n.right, [box[0], box[1], n.t, box[3]]); P.line(box[0], n.t, box[1], n.t, pal.fg, 1.5); }
      }
      const text = (n, ind = "") => n.leaf ? `${ind}→ ${n.p >= 0.5 ? "B" : "A"} (${Math.round(Math.max(n.p, 1 - n.p) * 100)}%, ${n.n} pts)\n` : `${ind}${n.f} < ${n.t.toFixed(2)} ?\n${text(n.left, ind + "  yes ")}${text(n.right, ind + "  no  ")}`;
      function draw() {
        const t = buildTree(pts, depth); P.clear(); regions(t, [0, 1, 0, 1]);
        pts.forEach((p) => P.dot(p.x, p.y, p.c ? pal.b : pal.a, 5, pal.bg));
        const acc = pts.filter((p) => (treeP(t, p) >= 0.5 ? 1 : 0) === p.c).length / pts.length, txt = text(t);
        ui.info(`training accuracy: ${Math.round(acc * 100)}%\n\n${txt.split("\n").length > 22 ? txt.split("\n").slice(0, 22).join("\n") + "\n…" : txt}`);
      }
      ui.on("d", "input", (e, n) => { depth = +n.value; ui.show("d", depth); draw(); });
      ui.on("xor", "click", () => { pts = xorData(18); draw(); });
      ui.on("blobs", "click", () => { pts = twoBlobs(); draw(); });
      ui.on("circle", "click", () => { pts = circleData(110); draw(); });
      ui.onClass((c) => { cls = c; });
      P.c.addEventListener("click", (e) => { pts.push(Object.assign(P.at(e), { c: cls })); draw(); });
      draw();
    },
  });

  add({
    id: "forest", group: "sup", star: true, name: "Random Forest", kind: "Classification · Regression", term: "Random Forest",
    how: "Trains many decision trees, each on a random sample of the data and with random feature choices, then averages their votes. Individual trees are jumpy; the average is smooth and much less likely to overfit.",
    try: "Start with 1 tree, then raise the number of trees. Watch the blocky boundary become smooth and the shading show how confident the forest is.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = circleData(130), n = 1, forest = [];
      const ui = panel(ctl, slider("n", "Number of trees", 1, 40, 1, n) + btn("regrow", "Grow a new forest") + `<div class="row">${btn("circle", "Circle")}${btn("xor", "XOR data")}</div>`);
      const grow = () => { forest = Array.from({ length: 40 }, () => buildTree(Array.from({ length: pts.length }, () => pts[Math.floor(Math.random() * pts.length)]), 6, true)); };
      function draw() {
        const trees = forest.slice(0, n), pr = (p) => trees.reduce((s, t) => s + treeP(t, p), 0) / trees.length;
        P.clear(); P.shade(pr, pal.a, pal.b, 56, 36);
        pts.forEach((p) => P.dot(p.x, p.y, p.c ? pal.b : pal.a, 4, pal.bg));
        const acc = pts.filter((p) => (pr(p) >= 0.5 ? 1 : 0) === p.c).length / pts.length;
        ui.info(`trees voting: ${n}\neach tree: random bootstrap sample,\n  depth 6, random feature per split\ntraining accuracy: ${Math.round(acc * 100)}%`);
      }
      ui.on("n", "input", (e, s) => { n = +s.value; ui.show("n", n); draw(); });
      ui.on("regrow", "click", () => { grow(); draw(); });
      ui.on("circle", "click", () => { pts = circleData(130); grow(); draw(); });
      ui.on("xor", "click", () => { pts = xorData(20); grow(); draw(); });
      grow(); draw();
    },
  });

  add({
    id: "boost", group: "sup", star: true, name: "Gradient Boosting", kind: "Regression · Classification", term: "Gradient Boosting",
    how: "Builds small trees one after another. Each new tree is trained only on the errors (residuals) that the trees so far still make, and its prediction is added in with a small learning rate. Many small corrections add up to a strong model: the idea behind XGBoost, LightGBM and CatBoost.",
    try: "Move Rounds from 0 upwards: the prediction starts as a flat average and each round fixes part of the remaining error. Push it to 200 with a high learning rate and it starts chasing noise.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [], rounds = 0, lr = 0.3;
      const ui = panel(ctl, slider("r", "Boosting rounds", 0, 200, 1, rounds) + slider("lr", "Learning rate", 0.05, 1, 0.05, lr) + `<label><span><input type="checkbox" data-k="res" checked> show remaining errors</span></label>` + btn("new", "New data"));
      const make = () => { pts = Array.from({ length: 30 }, () => { const x = rand(0.02, 0.98); return { x, y: clamp01(0.5 + 0.3 * Math.sin(x * 6.5) + gauss() * 0.05) }; }); };
      function model(R) {
        const mean = pts.reduce((s, p) => s + p.y, 0) / pts.length, stumps = [], pred = pts.map(() => mean);
        for (let r = 0; r < R; r++) {
          const res = pts.map((p, i) => p.y - pred[i]); let best = null;
          const xs = pts.map((p) => p.x).sort((a, b) => a - b);
          for (let i = 1; i < xs.length; i++) {
            const t = (xs[i - 1] + xs[i]) / 2; let sl = 0, nl = 0, sr = 0, nr = 0;
            pts.forEach((p, k) => { if (p.x < t) { sl += res[k]; nl++; } else { sr += res[k]; nr++; } });
            const ml = nl ? sl / nl : 0, mr = nr ? sr / nr : 0, sse = pts.reduce((s, p, k) => s + (res[k] - (p.x < t ? ml : mr)) ** 2, 0);
            if (!best || sse < best.sse) best = { t, ml, mr, sse };
          }
          stumps.push(best); pts.forEach((p, k) => { pred[k] += lr * (p.x < best.t ? best.ml : best.mr); });
        }
        return { f: (x) => stumps.reduce((s, st) => s + lr * (x < st.t ? st.ml : st.mr), mean), pred };
      }
      function draw() {
        const m = model(rounds); P.clear();
        if (ui.q("res").checked) pts.forEach((p, i) => P.line(p.x, p.y, p.x, m.pred[i], pal.bad, 1.2, [3, 3]));
        P.ctx.beginPath(); for (let i = 0; i <= 300; i++) { const x = i / 300; i ? P.ctx.lineTo(P.X(x), P.Y(m.f(x))) : P.ctx.moveTo(P.X(x), P.Y(m.f(x))); }
        P.ctx.lineWidth = 2.5; P.ctx.strokeStyle = pal.fg; P.ctx.stroke();
        pts.forEach((p) => P.dot(p.x, p.y, pal.a, 5));
        const mse = pts.reduce((s, p, i) => s + (p.y - m.pred[i]) ** 2, 0) / pts.length;
        ui.info(`round 0 = predict the average\nrounds: ${rounds}, learning rate ${lr}\ntraining error (MSE): ${mse.toFixed(4)}`);
      }
      ui.on("r", "input", (e, s) => { rounds = +s.value; ui.show("r", rounds); draw(); });
      ui.on("lr", "input", (e, s) => { lr = +s.value; ui.show("lr", lr.toFixed(2)); draw(); });
      ui.on("res", "change", draw);
      ui.on("new", "click", () => { make(); draw(); });
      make(); draw();
    },
  });

  // Naive Bayes trained on the same messages as the Module 3 spam lab
  const NB_TRAIN = [
    ["WIN a FREE iPhone now! Click here to claim your prize", 1], ["Are we still meeting for lunch tomorrow?", 0],
    ["Congratulations, you have won $1000 cash. Claim now", 1], ["Here are the notes from today's class", 0],
    ["Limited offer!!! Buy cheap watches, free shipping", 1], ["Can you send me the report by Friday?", 0],
    ["Urgent: your account will be closed, verify your password here", 1], ["Happy birthday! Hope you have a great day", 0],
    ["You are selected for a free holiday, call now to claim", 1], ["The meeting is moved to 3pm in room 4", 0],
    ["Earn money fast from home, click this link", 1], ["Thanks for your help with the project", 0],
  ];
  const NB_STOP = new Set("a an the to for of and or is are be you your we our me my i in on at by it this that with from have has will can".split(" "));
  const nbTok = (s) => s.toLowerCase().replace(/[^a-z0-9$\s]/g, " ").split(/\s+/).filter((w) => w && !NB_STOP.has(w));
  add({
    id: "nb", group: "sup", star: true, name: "Naive Bayes", kind: "Classification", term: "Naive Bayes",
    how: "Counts how often each word appears in spam and in normal messages during training. For a new message, each word adds its own piece of evidence, and the model \"naively\" treats words as independent. The evidence is added up into a probability with Bayes' theorem.",
    try: "Type a message. Each bar shows how hard that word pushes towards spam (red, right) or normal (green, left). Try \"free lunch tomorrow\" and see the words fight.",
    wide: true,
    mount(host, ctl) {
      const cnt = [{}, {}], tot = [0, 0], docs = [0, 0], vocab = new Set();
      NB_TRAIN.forEach(([t, y]) => { docs[y]++; nbTok(t).forEach((w) => { cnt[y][w] = (cnt[y][w] || 0) + 1; tot[y]++; vocab.add(w); }); });
      const V = vocab.size, llr = (w) => Math.log(((cnt[1][w] || 0) + 1) / (tot[1] + V)) - Math.log(((cnt[0][w] || 0) + 1) / (tot[0] + V));
      host.innerHTML = `<div class="field" style="margin:0 0 12px"><label for="nbIn">Message</label><input id="nbIn" value="Claim your free prize now"></div><div class="wbars" id="nbBars"></div><p id="nbOut" class="savemsg" style="font-size:1.05rem;margin-top:12px"></p>`;
      panel(ctl, `<div class="algoinfo">Trained on the 12 messages\nfrom the spam lab:\n6 spam, 6 normal,\n${V} different words.</div>`);
      const draw = () => {
        const ws = nbTok(host.querySelector("#nbIn").value); let s = 0;
        const rows = ws.map((w) => { const known = vocab.has(w), v = known ? llr(w) : 0; s += v; return { w, v, known }; });
        const mx = Math.max(1.5, ...rows.map((r) => Math.abs(r.v)));
        host.querySelector("#nbBars").innerHTML = `<div class="wbar"><span class="w"></span><span class="lbl good" style="text-align:right;padding-right:6px">← normal</span><span class="lbl bad" style="padding-left:6px">spam →</span></div>` + rows.map((r) => `<div class="wbar"><span class="w" title="${esc(r.w)}">${esc(r.w)}${r.known ? "" : " ?"}</span><span class="l">${r.v < 0 ? `<i style="width:${(-r.v / mx) * 100}%"></i>` : ""}</span><span class="r">${r.v > 0 ? `<i style="width:${(r.v / mx) * 100}%"></i>` : ""}</span></div>`).join("");
        const p = 1 / (1 + Math.exp(-s)), out = host.querySelector("#nbOut");
        out.className = "savemsg " + (p >= 0.5 ? "err" : "ok");
        out.textContent = ws.length ? `${p >= 0.5 ? "Spam" : "Normal"}: ${Math.round((p >= 0.5 ? p : 1 - p) * 100)}% sure   ·   words marked ? weren't in the training data, so they give no evidence` : "Type a message.";
      };
      host.querySelector("#nbIn").addEventListener("input", draw); draw();
    },
  });

  add({
    id: "knn", group: "sup", name: "K-Nearest Neighbors (KNN)", kind: "Classification · Regression", term: "K-Nearest Neighbors (KNN)",
    how: "Doesn't train at all: it stores the examples. To classify a new point it finds the k closest stored points and takes a majority vote. Small k is jumpy and sensitive to noise; large k is smooth but can blur real boundaries.",
    try: "Move your mouse over the plot: the lines show the k neighbours that vote. Change k from 1 to 15 and watch the shaded decision map smooth out.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [...blob(26, 0.35, 0.4, 0.13, 0), ...blob(26, 0.62, 0.6, 0.13, 1)], k = 5, q = { x: 0.5, y: 0.5 }, cls = 0;
      const ui = panel(ctl, slider("k", "k (neighbours)", 1, 15, 1, k) + `<label><span><input type="checkbox" data-k="map" checked> show decision map</span></label>` + btn("new", "New data") + classPick(0));
      const near = (p) => pts.map((s) => ({ s, d: Math.hypot(s.x - p.x, s.y - p.y) })).sort((a, b) => a.d - b.d).slice(0, k);
      const vote = (p) => near(p).filter((n) => n.s.c === 1).length / k;
      function draw() {
        P.clear(); if (ui.q("map").checked) P.shade(vote, pal.a, pal.b, 40, 26);
        const nn = near(q), v = nn.filter((n) => n.s.c === 1).length;
        P.ring(q.x, q.y, pal.muted, nn[nn.length - 1].d * P.w, 1);
        nn.forEach((n) => P.line(q.x, q.y, n.s.x, n.s.y, pal.fg, 1.2));
        pts.forEach((p) => P.dot(p.x, p.y, p.c ? pal.b : pal.a, 5, pal.bg));
        P.dot(q.x, q.y, pal.fg, 7, pal.bg);
        ui.info(`neighbours: ${k - v} A, ${v} B\nprediction: ${v * 2 > k ? "B" : v * 2 < k ? "A" : "tie"}`);
      }
      P.c.addEventListener("mousemove", (e) => { q = P.at(e); draw(); });
      P.c.addEventListener("click", (e) => { pts.push(Object.assign(P.at(e), { c: cls })); draw(); });
      ui.on("k", "input", (e, s) => { k = +s.value; ui.show("k", k); draw(); });
      ui.on("map", "change", draw);
      ui.on("new", "click", () => { pts = [...blob(26, 0.35, 0.4, 0.13, 0), ...blob(26, 0.62, 0.6, 0.13, 1)]; draw(); });
      ui.onClass((c) => { cls = c; });
      draw();
    },
  });

  add({
    id: "svm", group: "sup", name: "Support Vector Machine (SVM)", kind: "Classification", term: "Support Vector Machine (SVM)",
    how: "Looks for the boundary with the widest possible empty street (margin) between the classes. Only the points on the edge of the street, the support vectors (circled), decide where it goes. Moving any other point changes nothing.",
    try: "Add a point inside the street and watch the boundary and margin react. Lower \"softness\" to demand a strict, wide street; raise it to tolerate a few points on the wrong side.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [...blob(22, 0.3, 0.32, 0.09, 0), ...blob(22, 0.7, 0.68, 0.09, 1)], lam = 0.01, cls = 0, w = [0, 0, 0];
      const ui = panel(ctl, slider("l", "Softness (regularisation)", 0.001, 0.2, 0.001, lam) + btn("new", "New data") + classPick(0));
      const fx = (p) => [(p.x - 0.5) * 4, (p.y - 0.5) * 4, 1];
      function train() {
        w = [0, 0, 0]; const T = 25000;
        for (let t = 1; t <= T; t++) {
          const p = pts[Math.floor(Math.random() * pts.length)], y = p.c ? 1 : -1, x = fx(p), eta = 1 / (lam * t + 10);
          const m = y * (w[0] * x[0] + w[1] * x[1] + w[2] * x[2]);
          w = [w[0] * (1 - eta * lam), w[1] * (1 - eta * lam), w[2]];
          if (m < 1) w = w.map((v, i) => v + eta * y * x[i]);
        }
      }
      const score = (p) => { const x = fx(p); return w[0] * x[0] + w[1] * x[1] + w[2]; };
      function draw() {
        P.clear(); P.shade((x, y) => 1 / (1 + Math.exp(-2 * score({ x, y }))), pal.a, pal.b, 40, 26);
        if (Math.abs(w[1]) > 1e-6) for (const off of [0, -1, 1]) { const yAt = (x) => 0.5 + (off - w[2] - w[0] * (x - 0.5) * 4) / (w[1] * 4); P.line(0, yAt(0), 1, yAt(1), off ? pal.muted : pal.fg, off ? 1.5 : 2.5, off ? [6, 4] : null); }
        let sv = 0; pts.forEach((p) => { const y = p.c ? 1 : -1, m = y * score(p); P.dot(p.x, p.y, p.c ? pal.b : pal.a, 5, pal.bg); if (m <= 1.05) { P.ring(p.x, p.y, pal.fg, 9); sv++; } });
        const margin = 2 / Math.hypot(w[0], w[1]) / 4;
        ui.info(`support vectors: ${sv}\nmargin width: ${margin.toFixed(3)}\n(dashed lines = edges of the street)`);
      }
      ui.on("l", "input", (e, s) => { lam = +s.value; ui.show("l", lam.toFixed(3)); train(); draw(); });
      ui.on("new", "click", () => { pts = [...blob(22, 0.3, 0.32, 0.09, 0), ...blob(22, 0.7, 0.68, 0.09, 1)]; train(); draw(); });
      ui.onClass((c) => { cls = c; });
      P.c.addEventListener("click", (e) => { pts.push(Object.assign(P.at(e), { c: cls })); train(); draw(); });
      train(); draw();
    },
  });

  add({
    id: "nn", group: "sup", star: true, name: "Neural Network", kind: "Classification · Regression", term: "Neural Network",
    how: "Layers of neurons, each computing a weighted sum and a non-linear activation. Training (backpropagation + gradient descent) adjusts every weight to reduce the error. With hidden layers it can bend its boundary into any shape, which is why it handles circles and XOR.",
    try: "Pick Circle data with 0 hidden layers and press Train: it fails, because that's just logistic regression. Add 1 or 2 hidden layers and train again. The diagram shows the weights: thicker lines = stronger, colour = positive or negative.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host, 300);
      const net = document.createElement("canvas"); net.className = "algocanvas"; net.style.marginTop = "8px"; net.style.cursor = "default"; host.appendChild(net);
      let pts = circleData(170), layers = 1, H = 6, W = [], B = [], epoch = 0, running = false, loss = 0;
      const ui = panel(ctl, btn("train", "Train", true) + btn("reset", "Reset") + slider("l", "Hidden layers", 0, 3, 1, layers) + slider("h", "Neurons per layer", 2, 8, 1, H) + `<div class="row">${btn("circle", "Circle")}${btn("xor", "XOR")}${btn("blobs", "Two groups")}</div>`);
      function init() { const sizes = [2, ...Array(layers).fill(H), 1]; W = []; B = []; for (let i = 0; i < sizes.length - 1; i++) { W.push(Array.from({ length: sizes[i + 1] }, () => Array.from({ length: sizes[i] }, () => gauss() * Math.sqrt(1 / sizes[i])))); B.push(Array(sizes[i + 1]).fill(0)); } epoch = 0; }
      function fwd(p) { let a = [(p.x - 0.5) * 3, (p.y - 0.5) * 3]; const acts = [a]; for (let l = 0; l < W.length; l++) { const z = W[l].map((row, j) => row.reduce((s, w, i) => s + w * a[i], B[l][j])); a = l === W.length - 1 ? z.map((v) => 1 / (1 + Math.exp(-v))) : z.map(Math.tanh); acts.push(a); } return acts; }
      function trainEpoch() {
        const lr = 0.08; loss = 0;
        for (const p of shuffle(pts.slice())) {
          const acts = fwd(p), out = acts[acts.length - 1][0]; loss += -(p.c * Math.log(out + 1e-9) + (1 - p.c) * Math.log(1 - out + 1e-9));
          let delta = [out - p.c];
          for (let l = W.length - 1; l >= 0; l--) {
            const a = acts[l], prev = l > 0 ? a.map((v, i) => W[l].reduce((s, row, j) => s + row[i] * delta[j], 0) * (1 - v * v)) : null;
            W[l].forEach((row, j) => { row.forEach((w, i) => { row[i] -= lr * delta[j] * a[i]; }); B[l][j] -= lr * delta[j]; });
            if (prev) delta = prev;
          }
        }
        loss /= pts.length; epoch++;
      }
      function drawNet() {
        const d = window.devicePixelRatio || 1, w = P.w, h = 150; net.width = w * d; net.height = h * d; net.style.width = w + "px"; net.style.height = h + "px";
        const c = net.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
        const sizes = [2, ...W.map((m) => m.length)], xs = sizes.map((_, i) => 30 + (i * (w - 60)) / (sizes.length - 1)), ys = (n) => Array.from({ length: n }, (_, j) => (h * (j + 1)) / (n + 1));
        const mx = Math.max(0.1, ...W.flat(2).map(Math.abs));
        W.forEach((m, l) => m.forEach((row, j) => row.forEach((v, i) => { c.beginPath(); c.moveTo(xs[l], ys(sizes[l])[i]); c.lineTo(xs[l + 1], ys(sizes[l + 1])[j]); c.strokeStyle = v > 0 ? pal.accent : pal.bad; c.globalAlpha = 0.25 + 0.7 * Math.abs(v) / mx; c.lineWidth = 0.5 + 3 * Math.abs(v) / mx; c.stroke(); })));
        c.globalAlpha = 1; sizes.forEach((n, l) => ys(n).forEach((y) => { c.beginPath(); c.arc(xs[l], y, 6, 0, 7); c.fillStyle = pal.bg; c.fill(); c.lineWidth = 2; c.strokeStyle = pal.fg; c.stroke(); }));
        c.font = "600 11px system-ui"; c.fillStyle = pal.muted; c.textAlign = "center"; c.fillText("inputs", xs[0], h - 4); c.fillText("output", xs[xs.length - 1], h - 4);
      }
      function draw() {
        P.clear(); P.shade((x, y) => fwd({ x, y }).pop()[0], pal.a, pal.b, 44, 26);
        pts.forEach((p) => P.dot(p.x, p.y, p.c ? pal.b : pal.a, 4, pal.bg));
        const acc = pts.filter((p) => (fwd(p).pop()[0] >= 0.5 ? 1 : 0) === p.c).length / pts.length;
        ui.info(`epochs: ${epoch}\nloss: ${loss.toFixed(3)}\naccuracy: ${Math.round(acc * 100)}%\nlayers: 2 → ${Array(layers).fill(H).join(" → ")}${layers ? " → " : ""}1`);
        drawNet();
      }
      const stop = loop(() => { if (running) { trainEpoch(); if (epoch % 2 === 0) draw(); if (epoch >= 400) { running = false; ui.q("train").textContent = "Train"; draw(); } } });
      ui.on("train", "click", (e, b) => { running = !running; if (epoch >= 400) init(); b.textContent = running ? "Pause" : "Train"; });
      ui.on("reset", "click", () => { init(); draw(); });
      ui.on("l", "input", (e, s) => { layers = +s.value; ui.show("l", layers); init(); draw(); });
      ui.on("h", "input", (e, s) => { H = +s.value; ui.show("h", H); init(); draw(); });
      ui.on("circle", "click", () => { pts = circleData(170); init(); draw(); });
      ui.on("xor", "click", () => { pts = xorData(26); init(); draw(); });
      ui.on("blobs", "click", () => { pts = twoBlobs(40); init(); draw(); });
      init(); draw();
      return stop;
    },
  });

  // Convolution: slide a 3x3 filter over a 10x10 drawing
  const KERNELS = {
    "Vertical edges": [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
    "Horizontal edges": [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
    "Blur": [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)),
    "Sharpen": [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  };
  const SHAPES = {
    Square: (r, c) => r >= 2 && r <= 7 && c >= 2 && c <= 7 && (r === 2 || r === 7 || c === 2 || c === 7),
    Cross: (r, c) => r === c || r + c === 9,
    Seven: (r, c) => r === 1 && c >= 2 && c <= 8 || (c === 9 - Math.round(r * 0.75) - 1 && r >= 2 && r <= 9),
    Plus: (r, c) => (r === 4 || r === 5) && c >= 1 && c <= 8 || (c === 4 || c === 5) && r >= 1 && r <= 8,
  };
  add({
    id: "cnn", group: "sup", name: "Convolutional Neural Network (CNN)", kind: "Images", term: "Convolutional Neural Network (CNN)",
    how: "A CNN slides small filters (kernels) across an image. At each position it multiplies the 3×3 patch by the filter's weights and adds them up, producing a feature map that lights up wherever that pattern appears. Real CNNs learn hundreds of filters and stack many layers: edges → shapes → objects.",
    try: "Pick a filter and press Play to watch it slide. Vertical-edge filters light up the left and right sides of the square; horizontal-edge filters light up the top and bottom. Click squares on the input to draw your own shape.",
    wide: true,
    mount(host, ctl) {
      const pal = palette(); let img = Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => (SHAPES.Square(r, c) ? 1 : 0))), kname = "Vertical edges", pos = -1, playing = false, last = 0;
      host.innerHTML = `<div class="algoflex"><div><p class="lbl">Input image (click to draw)</p><div class="pixgrid" id="cIn" style="grid-template-columns:repeat(10,22px)"></div></div>
        <div><p class="lbl">Filter</p><div class="pixgrid small" id="cK" style="grid-template-columns:repeat(3,34px)"></div></div>
        <div><p class="lbl">Feature map (output)</p><div class="pixgrid" id="cOut" style="grid-template-columns:repeat(8,22px)"></div></div></div>`;
      const ui = panel(ctl, `<label>Filter<select class="field" data-k="k" style="font:inherit;padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg)">${Object.keys(KERNELS).map((k) => `<option>${k}</option>`).join("")}</select></label>` + btn("play", "Play", true) + btn("all", "Show full result") + `<label>Shape<div class="row">${Object.keys(SHAPES).map((s) => `<button class="choice" data-shape="${s}">${s}</button>`).join("")}</div></label>`);
      const conv = (r, c) => { const K = KERNELS[kname]; let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += K[i][j] * img[r + i][c + j]; return s; };
      const cellCol = (v, mx) => v === 0 ? "var(--line)" : `color-mix(in srgb,${v > 0 ? pal.accent : pal.bad} ${Math.round(25 + 75 * Math.min(1, Math.abs(v) / mx))}%,var(--bg))`;
      function draw() {
        const pr = pos >= 0 ? Math.floor(pos / 8) : -9, pc = pos >= 0 ? pos % 8 : -9;
        host.querySelector("#cIn").innerHTML = img.map((row, r) => row.map((v, c) => `<span data-r="${r}" data-c="${c}" class="${r >= pr && r < pr + 3 && c >= pc && c < pc + 3 ? "hl" : ""}" style="background:${v ? pal.fg : "var(--line)"}"></span>`).join("")).join("");
        const K = KERNELS[kname]; host.querySelector("#cK").innerHTML = K.flat().map((v) => `<span style="width:34px;height:34px;display:grid;place-items:center;font:600 .75rem var(--mono);background:${cellCol(v, 1)}">${Number.isInteger(v) ? v : v.toFixed(2)}</span>`).join("");
        const all = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) all.push(conv(r, c));
        const mx = Math.max(1, ...all.map(Math.abs));
        host.querySelector("#cOut").innerHTML = all.map((v, i) => `<span class="${i === pos ? "hl" : ""}" title="${v.toFixed(2)}" style="background:${pos === -2 || i <= pos ? cellCol(v, mx) : "var(--line)"}"></span>`).join("");
        if (pos >= 0) ui.info(`position ${pos + 1} of 64\npatch × filter, summed = ${conv(pr, pc).toFixed(2)}`);
        else ui.info("Each output square = the 3×3 patch\nunder the filter × the filter weights,\nadded up. Bright = strong match.");
      }
      const stop = loop(() => { if (!playing) return; const t = performance.now(); if (t - last < 140) return; last = t; pos++; if (pos > 63) { playing = false; pos = -2; ui.q("play").textContent = "Play"; } draw(); });
      host.querySelector("#cIn").addEventListener("click", (e) => { const s = e.target.closest("[data-r]"); if (!s) return; img[+s.dataset.r][+s.dataset.c] ^= 1; draw(); });
      ui.on("k", "change", (e, s) => { kname = s.value; pos = -2; draw(); });
      ui.on("play", "click", (e, b) => { playing = !playing; if (playing && (pos < 0 || pos >= 63)) pos = -1; b.textContent = playing ? "Pause" : "Play"; });
      ui.on("all", "click", () => { playing = false; ui.q("play").textContent = "Play"; pos = -2; draw(); });
      ctl.querySelectorAll("[data-shape]").forEach((b) => b.addEventListener("click", () => { img = Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => (SHAPES[b.dataset.shape](r, c) ? 1 : 0))); pos = -2; draw(); }));
      pos = -2; draw();
      return stop;
    },
  });

  // RNN vs LSTM: a simplified sentiment memory to show why LSTMs remember longer
  const VAL = { terrible: -2, awful: -2, boring: -1.5, bad: -1.5, hated: -2, love: 2, loved: 2, great: 2, good: 1.5, brilliant: 2, nice: 1, fine: 0.8, friendly: 1, comfortable: 1 };
  const SENTS = [
    "The film was terrible , although the popcorn , the seats and the staff were all quite nice",
    "I loved this film , even if the ending was a little bit long and the music was bad",
    "The plot was boring but the acting was brilliant and the ending was great",
  ];
  add({
    id: "rnn", group: "sup", name: "RNN / LSTM", kind: "Sequences", term: "LSTM (Long Short-Term Memory)",
    how: "Recurrent networks read a sequence one step at a time, carrying a memory forward. A plain RNN's memory fades quickly, so early words get forgotten. An LSTM has gates that decide what to keep, so important early information survives to the end.",
    try: "Step through the first sentence. \"terrible\" comes first; by the end the RNN's memory has faded and the nice words win, so it wrongly says positive. The LSTM kept \"terrible\".",
    wide: true,
    mount(host, ctl) {
      let si = 0, step = 0;
      const ui = panel(ctl, btn("step", "Next word", true) + btn("run", "Read whole sentence") + btn("reset", "Start again") + `<label>Sentence<div class="row">${SENTS.map((_, i) => `<button class="choice" data-sent="${i}" aria-pressed="${i === 0}">${i + 1}</button>`).join("")}</div></label>`);
      function states(n) {
        const ws = SENTS[si].split(" "); let r = 0, l = 0;
        for (let i = 0; i < n; i++) { const v = VAL[ws[i].toLowerCase()] || 0; r = 0.6 * r + v * 0.6; l = 0.97 * l + v * (Math.abs(v) >= 2 ? 1 : 0.35); }
        return { r, l, ws };
      }
      const bar = (name, v) => { const p = Math.max(-1, Math.min(1, v / 2.5)); return `<div class="m"><span>${name}</span><span class="track"><span class="fill" style="left:${p < 0 ? 50 + p * 50 : 50}%;width:${Math.abs(p) * 50}%;background:${p < 0 ? "var(--bad)" : "var(--good)"}"></span></span><span style="font:600 .8rem var(--mono)">${v.toFixed(2)}</span></div>`; };
      function draw() {
        const s = states(step);
        host.innerHTML = `<div class="seqwords">${s.ws.map((w, i) => `<span class="${i === step - 1 ? "on" : i < step - 1 ? "done" : ""}">${w}</span>`).join("")}</div>
          <p class="lbl">Memory after ${step} of ${s.ws.length} words (− negative · + positive)</p><div class="mem">${bar("RNN", s.r)}${bar("LSTM", s.l)}</div>
          ${step === s.ws.length ? `<p class="savemsg" style="font-size:1rem;margin-top:12px">Final verdict: RNN says <b>${s.r >= 0 ? "positive" : "negative"}</b>, LSTM says <b>${s.l >= 0 ? "positive" : "negative"}</b>.</p>` : ""}`;
        ui.info("RNN: memory × 0.6 each step\n  (fades fast)\nLSTM: forget gate keeps ~97%,\n  input gate stores strong words");
      }
      ui.on("step", "click", () => { const n = SENTS[si].split(" ").length; step = Math.min(n, step + 1); draw(); });
      ui.on("run", "click", () => { step = SENTS[si].split(" ").length; draw(); });
      ui.on("reset", "click", () => { step = 0; draw(); });
      ctl.querySelectorAll("[data-sent]").forEach((b) => b.addEventListener("click", () => { si = +b.dataset.sent; step = 0; ctl.querySelectorAll("[data-sent]").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); }));
      draw();
    },
    note: "Simplified: the memory is a single number with hand-set rules, to show the idea of fading vs gated memory.",
  });

  // Transformer attention arcs (illustrative weights, same sentences as Module 4)
  const ATT = [
    { s: "The animal didn't cross the street because it was too tired", f: { it: { animal: 0.52, street: 0.12, tired: 0.14, cross: 0.05, was: 0.06 }, tired: { it: 0.34, animal: 0.28, was: 0.14, too: 0.12 }, cross: { animal: 0.4, street: 0.35, "didn't": 0.15 } } },
    { s: "The animal didn't cross the street because it was too wide", f: { it: { street: 0.5, animal: 0.14, wide: 0.17, cross: 0.08 }, wide: { street: 0.33, it: 0.31, too: 0.15 } } },
    { s: "She sat on the bank of the river and watched the water", f: { bank: { river: 0.46, water: 0.2, sat: 0.12 }, watched: { She: 0.42, water: 0.38 } } },
    { s: "He went to the bank to pay money into his account", f: { bank: { money: 0.38, account: 0.3, pay: 0.16 }, his: { He: 0.7 } } },
  ];
  add({
    id: "transformer", group: "sup", star: true, name: "Transformer", kind: "Sequences · Language", term: "Transformer",
    how: "A transformer reads all the words at once. For each word, attention computes how much to look at every other word, then mixes their information in. Stacking many attention layers (with many heads each) lets it understand context, which is the engine of ChatGPT, Claude and Gemini.",
    try: "Click an underlined word. The arcs show where it pays attention; thicker = more. Compare sentences 1 and 2: changing one word (tired → wide) changes what \"it\" refers to.",
    wide: true,
    mount(host, ctl) {
      let si = 0, focus = "it";
      const ui = panel(ctl, `<label>Sentence<div class="row">${ATT.map((_, i) => `<button class="choice" data-as="${i}" aria-pressed="${i === 0}">${i + 1}</button>`).join("")}</div></label>`);
      function draw() {
        const a = ATT[si], ws = a.s.split(" "), W = Math.max(320, Math.min(host.clientWidth || 600, 720)), gap = W / ws.length, top = 120;
        const wts = a.f[focus] || {}, fi = ws.indexOf(focus);
        const arcs = fi < 0 ? "" : ws.map((w, i) => { const v = wts[w] || 0; if (!v) return ""; const x1 = gap * (fi + 0.5), x2 = gap * (i + 0.5), h = Math.min(100, 18 + Math.abs(x2 - x1) * 0.35); return `<path d="M${x1},${top} C${x1},${top - h} ${x2},${top - h} ${x2},${top}" fill="none" stroke="var(--accent)" stroke-width="${1 + v * 14}" stroke-opacity="${0.35 + v}" stroke-linecap="round"/><text x="${x2}" y="${top - h * 0.75 - 4}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="monospace">${Math.round(v * 100)}%</text>`; }).join("");
        const labels = ws.map((w, i) => `<text x="${gap * (i + 0.5)}" y="${top + 22}" text-anchor="middle" font-size="${Math.min(15, gap / 3.2)}" font-weight="${w === focus ? 700 : 500}" fill="${a.f[w] ? "var(--accent)" : "var(--fg)"}" style="cursor:${a.f[w] ? "pointer" : "default"};${a.f[w] ? "text-decoration:underline" : ""}" data-aw="${esc(w)}">${esc(w)}</text>`).join("");
        host.innerHTML = `<svg viewBox="0 0 ${W} ${top + 36}" width="100%" style="max-width:${W}px;display:block;border:1px solid var(--line);border-radius:10px;background:var(--bg)">${arcs}${labels}</svg>`;
        host.querySelectorAll("[data-aw]").forEach((t) => t.addEventListener("click", () => { if (a.f[t.dataset.aw]) { focus = t.dataset.aw; draw(); } }));
        ui.info(`focus word: "${focus}"\nclickable: ${Object.keys(a.f).join(", ")}`);
      }
      ctl.querySelectorAll("[data-as]").forEach((b) => b.addEventListener("click", () => { si = +b.dataset.as; focus = Object.keys(ATT[si].f)[0]; ctl.querySelectorAll("[data-as]").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); }));
      draw();
    },
    note: "Attention weights are illustrative. Real models learn them, and run many heads and layers at once.",
  });

  /* ---------- Layout: picker + stage ---------- */
  const GROUPS = [["map", "Start here · the big picture"], ["sup","Supervised · with answers"], ["uns", "Unsupervised · without answers"], ["rl", "Reinforcement · trial and reward"]];
  // A demo can grow extra tabs ("views"): its own demo becomes the "Experiment" tab, others are added with A.addView
  A.addView = function (id, view) {
    const a = A.list.find((x) => x.id === id); if (!a) return;
    if (!a.views) a.views = [{ key: "play", label: "Experiment", order: 2, how: a.how, try: a.try, note: a.note, wide: a.wide, mount: a.mount }];
    a.views.push(view); a.views.sort((p, q) => p.order - q.order);
  };
  const OLD = { treeanim: ["tree", "anim"], forestanim: ["forest", "anim"] };
  let current = store.get("wb-algo", "connect"), views = store.get("wb-algo-view", {}), cleanup = null, root = null;
  if (OLD[current]) { views[OLD[current][0]] = OLD[current][1]; current = OLD[current][0]; }
  function stage() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    const a = A.list.find((x) => x.id === current) || A.list[0]; current = a.id;
    const v = a.views ? a.views.find((x) => x.key === views[a.id]) || a.views[0] : a;
    root.querySelectorAll("[data-algo]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.algo === a.id));
    const sel = root.querySelector(".algopick select"); if (sel) sel.value = a.id;
    const st = root.querySelector(".algostage");
    const P = A.plain, txt = (s) => (P ? P.wrap(esc(s)) : esc(s));
    const tabs = a.views ? `<div class="algoviews" role="tablist">${a.views.map((x, i) => `<button role="tab" data-view="${x.key}" aria-selected="${x === v}"><b>${i + 1}</b> ${esc(x.label)}</button>`).join("")}</div>` : "";
    st.innerHTML = `<div class="card2"><div class="algohead"><h3>${esc(a.name)}</h3>${a.star ? `<span class="algotag star">★ must-know</span>` : ""}<span class="algotag">${esc(GROUPS.find((g) => g[0] === a.group)[1].split(" · ")[0])}</span><span class="algotag">${esc(a.kind)}</span></div>
      ${tabs}<p class="algohow">${txt(v.how)}</p>${v.page ? `<div class="algopage"></div>` : `<div class="algoplay ${v.wide ? "wide" : ""}"><div class="algocv"></div><div class="algoctl"></div></div>`}
      ${v.try ? `<p class="algotry"><b>Try this:</b> ${txt(v.try)}</p>` : ""}${v.note ? `<p class="algonote">${txt(v.note)}</p>` : ""}
      ${a.views && v !== a.views[a.views.length - 1] ? `<p class="algonext"><button class="btn sm" data-view="${a.views[a.views.indexOf(v) + 1].key}">Next: ${esc(a.views[a.views.indexOf(v) + 1].label)} →</button></p>` : ""}
      <div class="algoextra"></div>
      <p class="algonote"><button class="wordlink" data-word="${esc(a.term)}">Read "${esc(a.term)}" in the glossary</button></p></div>`;
    const r = v.page ? v.mount(st.querySelector(".algopage")) : v.mount(st.querySelector(".algocv"), st.querySelector(".algoctl"));
    if (typeof r === "function") cleanup = r;
    // Plain-English box covers every stats word on screen (explanations, controls and readouts), then the often-confused pairs
    const extra = st.querySelector(".algoextra");
    extra.innerHTML = (A.words ? A.words.box(a.id, a.name) : "") + (P ? P.box(P.find(st.querySelector(".card2").textContent), esc) : "") + (A.compare ? A.compare.box(a.id) : "");
  }
  // Clicking an underlined stats word opens its plain-English entry; clicking a name in a comparison opens that demo
  function stageClick(e) {
    const w = e.target.closest(".stword");
    if (w) {
      const box = root.querySelector(".algoextra .plainbox"), def = box && box.querySelector(`[data-stdef="${w.dataset.st}"]`);
      if (!def) return;
      box.open = true; def.classList.remove("flash"); void def.offsetWidth; def.classList.add("flash");
      def.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    const t = e.target.closest("[data-view]");
    if (t) { views[current] = t.dataset.view; store.set("wb-algo-view", views); stage(); root.querySelector(".algostage").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    const g = e.target.closest("[data-go]");
    if (g) { current = g.dataset.go; store.set("wb-algo", current); stage(); root.querySelector(".algostage").scrollIntoView({ block: "start", behavior: "smooth" }); }
  }
  A.mount = function (host) {
    root = host;
    host.innerHTML = `<div class="algomap"><nav class="algolist">${GROUPS.map(([g, label]) => `<div class="grp"><h4>${label}</h4>${A.list.filter((x) => x.group === g).map((x) => `<button data-algo="${x.id}">${esc(x.name)}${x.star ? ` <span class="star">★</span>` : ""}</button>`).join("")}</div>`).join("")}</nav>
      <div><div class="algopick field"><label for="algoSel">Algorithm</label><select id="algoSel">${GROUPS.map(([g, label]) => `<optgroup label="${label}">${A.list.filter((x) => x.group === g).map((x) => `<option value="${x.id}">${esc(x.name)}${x.star ? " ★" : ""}</option>`).join("")}</optgroup>`).join("")}</select></div><div class="algostage"></div></div></div>`;
    host.querySelector(".algolist").addEventListener("click", (e) => { const b = e.target.closest("[data-algo]"); if (!b) return; current = b.dataset.algo; store.set("wb-algo", current); stage(); });
    host.querySelector("#algoSel").addEventListener("change", (e) => { current = e.target.value; store.set("wb-algo", current); stage(); });
    host.querySelector(".algostage").addEventListener("click", stageClick);
    stage();
  };
  A.unmount = function () { if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; } root = null; };
})();
