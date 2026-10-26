// Algorithms map: unsupervised-learning demos (clustering, dimensionality reduction, patterns, anomalies, embeddings)
(function () {
  const A = window.WB_ALGOS, { esc, rgb, palette, rand, gauss, blob, shuffle, plot, loop, btn, slider, panel, clamp01 } = A.h;
  const add = A.add;
  const threeBlobs = () => shuffle([...blob(25, 0.25, 0.7, 0.07, 0), ...blob(25, 0.72, 0.72, 0.08, 0), ...blob(25, 0.5, 0.25, 0.08, 0), ...blob(15, 0.3, 0.3, 0.06, 0)]).map((p) => ({ x: p.x, y: p.y }));

  add({
    id: "kmeans", group: "uns", star: true, name: "K-Means Clustering", kind: "Clustering", term: "K-Means Clustering",
    how: "You choose k. It drops k centre points, then repeats two steps: assign every point to its nearest centre, then move each centre to the middle of its points. It stops when nothing changes. You still have to decide what each group means.",
    try: "Press Step slowly to watch assign → move → assign. Then try k = 2 and k = 6 on the same data: K-means always finds k groups, even when that's the wrong number.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = threeBlobs(), k = 4, cent = [], phase = 0, iter = 0, running = false, last = 0;
      const ui = panel(ctl, btn("step", "Step", true) + btn("run", "Run") + btn("reinit", "New starting centres") + slider("k", "k (number of groups)", 1, 6, 1, k) + btn("new", "New data"));
      const init = () => { cent = shuffle(pts.slice()).slice(0, k).map((p) => ({ x: p.x, y: p.y })); pts.forEach((p) => { p.g = -1; }); phase = 0; iter = 0; };
      const assign = () => { let ch = 0; pts.forEach((p) => { let b = 0, bd = 9; cent.forEach((c, i) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; b = i; } }); if (p.g !== b) ch++; p.g = b; }); return ch; };
      const move = () => cent.forEach((c, i) => { const m = pts.filter((p) => p.g === i); if (m.length) { c.x = m.reduce((s, p) => s + p.x, 0) / m.length; c.y = m.reduce((s, p) => s + p.y, 0) / m.length; } });
      let changed = 1;
      function step() { if (phase === 0) { changed = assign(); phase = 1; } else { move(); phase = 0; iter++; } }
      function draw() {
        P.clear();
        if (pts[0] && pts[0].g >= 0) pts.forEach((p) => { const c = cent[p.g]; P.line(p.x, p.y, c.x, c.y, pal.groups[p.g % 6], 0.6); });
        pts.forEach((p) => P.dot(p.x, p.y, p.g >= 0 ? pal.groups[p.g % 6] : pal.muted, 4.5, pal.bg));
        cent.forEach((c, i) => { const col = pal.groups[i % 6]; P.line(c.x - 0.022, c.y - 0.03, c.x + 0.022, c.y + 0.03, pal.fg, 6); P.line(c.x - 0.022, c.y + 0.03, c.x + 0.022, c.y - 0.03, pal.fg, 6); P.line(c.x - 0.02, c.y - 0.027, c.x + 0.02, c.y + 0.027, col, 3.5); P.line(c.x - 0.02, c.y + 0.027, c.x + 0.02, c.y - 0.027, col, 3.5); });
        const sse = pts[0] && pts[0].g >= 0 ? pts.reduce((s, p) => s + (p.x - cent[p.g].x) ** 2 + (p.y - cent[p.g].y) ** 2, 0) : 0;
        ui.info(`iteration: ${iter}\nnext step: ${phase === 0 ? "assign points to nearest centre" : "move centres to the middle"}\nwithin-group distance: ${sse.toFixed(3)}${changed === 0 && phase === 1 ? "\n✓ converged: no point changed group" : ""}`);
      }
      const stop = loop(() => { if (!running) return; const t = performance.now(); if (t - last < 450) return; last = t; step(); draw(); if (changed === 0 && phase === 1) { running = false; ui.q("run").textContent = "Run"; } });
      ui.on("step", "click", () => { step(); draw(); });
      ui.on("run", "click", (e, b) => { running = !running; b.textContent = running ? "Pause" : "Run"; });
      ui.on("reinit", "click", () => { init(); draw(); });
      ui.on("k", "input", (e, s) => { k = +s.value; ui.show("k", k); init(); draw(); });
      ui.on("new", "click", () => { pts = threeBlobs(); init(); draw(); });
      init(); draw();
      return stop;
    },
  });

  add({
    id: "hier", group: "uns", name: "Hierarchical Clustering", kind: "Clustering", term: "Hierarchical Clustering",
    how: "Starts with every point as its own group, then repeatedly merges the two closest groups. The full history of merges forms a tree (a dendrogram). Cutting the tree at different heights gives you more or fewer groups, without choosing k in advance.",
    try: "Press Merge to join the two closest groups, one step at a time, and watch the dendrogram grow below. Then use the cut slider to choose how many groups to keep.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host, 260);
      const D = document.createElement("canvas"); D.className = "algocanvas"; D.style.marginTop = "8px"; D.style.cursor = "default"; host.appendChild(D);
      let pts = [], merges = [], step = 0, cut = 3;
      const ui = panel(ctl, btn("merge", "Merge closest", true) + btn("all", "Merge all") + btn("reset", "Start again") + slider("cut", "Cut into groups", 1, 8, 1, cut) + btn("new", "New data"));
      function make() { pts = shuffle([...blob(5, 0.22, 0.7, 0.06, 0), ...blob(5, 0.75, 0.72, 0.06, 0), ...blob(4, 0.5, 0.25, 0.06, 0), ...blob(2, 0.82, 0.2, 0.05, 0)]).map((p, i) => ({ x: p.x, y: p.y, i })); compute(); step = 0; }
      function compute() {
        let cl = pts.map((p) => ({ m: [p.i], id: p.i })); merges = []; let next = pts.length;
        const dist = (a, b) => { let s = 0; a.m.forEach((i) => b.m.forEach((j) => { s += Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y); })); return s / (a.m.length * b.m.length); };
        while (cl.length > 1) { let best = null; for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) { const d = dist(cl[i], cl[j]); if (!best || d < best.d) best = { i, j, d }; } const a = cl[best.i], b = cl[best.j], n = { m: [...a.m, ...b.m], id: next++, a, b, h: best.d }; merges.push(n); cl = cl.filter((_, k) => k !== best.i && k !== best.j).concat([n]); }
      }
      const groupsAt = (s) => { let g = pts.map((p) => [p.i]); merges.slice(0, s).forEach((m) => { g = g.filter((x) => !x.some((i) => m.m.includes(i))).concat([m.m]); }); return g; };
      function draw() {
        const shown = Math.max(step, 0), cutS = Math.min(shown, pts.length - cut), grp = groupsAt(cutS), col = {};
        grp.forEach((g, gi) => g.forEach((i) => { col[i] = g.length > 1 ? pal.groups[gi % 6] : pal.muted; }));
        P.clear(); merges.slice(0, shown).forEach((m) => { const ca = m.a.m.reduce((s, i) => [s[0] + pts[i].x / m.a.m.length, s[1] + pts[i].y / m.a.m.length], [0, 0]), cb = m.b.m.reduce((s, i) => [s[0] + pts[i].x / m.b.m.length, s[1] + pts[i].y / m.b.m.length], [0, 0]); P.line(ca[0], ca[1], cb[0], cb[1], pal.line, 1.5); });
        pts.forEach((p) => P.dot(p.x, p.y, col[p.i], 6, pal.bg));
        // Dendrogram
        const d = window.devicePixelRatio || 1, w = P.w, h = 170; D.width = w * d; D.height = h * d; D.style.width = w + "px"; D.style.height = h + "px";
        const c = D.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
        const order = []; const walk = (n) => { if (!n.a) order.push(n.id); else { walk(n.a); walk(n.b); } }; walk(merges[merges.length - 1] || { id: 0 });
        const maxH = merges.length ? merges[merges.length - 1].h : 1, X = (id) => 20 + (order.indexOf(id) * (w - 40)) / Math.max(1, order.length - 1), Yh = (hh) => h - 20 - (hh / maxH) * (h - 40);
        const pos = {}; order.forEach((id) => { pos[id] = { x: X(id), y: h - 20 }; });
        merges.forEach((m, k) => { const pa = pos[m.a.id], pb = pos[m.b.id], y = Yh(m.h); pos[m.id] = { x: (pa.x + pb.x) / 2, y }; if (k >= shown) return; c.beginPath(); c.moveTo(pa.x, pa.y); c.lineTo(pa.x, y); c.lineTo(pb.x, y); c.lineTo(pb.x, pb.y); c.strokeStyle = pal.fg; c.lineWidth = 1.5; c.stroke(); });
        order.forEach((id) => { c.beginPath(); c.arc(pos[id].x, h - 20, 4, 0, 7); c.fillStyle = col[id]; c.fill(); });
        if (cutS > 0 && cutS < merges.length) { const y = (Yh(merges[cutS - 1].h) + Yh(merges[cutS].h)) / 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.strokeStyle = pal.bad; c.stroke(); c.setLineDash([]); }
        c.font = "600 11px system-ui"; c.fillStyle = pal.muted; c.fillText("dendrogram: height = distance when merged", 8, 12);
        ui.info(`merges done: ${shown} of ${merges.length}\ngroups now: ${pts.length - shown}\ncolours = cut into ${Math.max(cut, pts.length - shown)} groups`);
      }
      ui.on("merge", "click", () => { step = Math.min(merges.length, step + 1); draw(); });
      ui.on("all", "click", () => { step = merges.length; draw(); });
      ui.on("reset", "click", () => { step = 0; draw(); });
      ui.on("cut", "input", (e, s) => { cut = +s.value; ui.show("cut", cut); draw(); });
      ui.on("new", "click", () => { make(); draw(); });
      make(); draw();
    },
  });

  add({
    id: "dbscan", group: "uns", name: "DBSCAN", kind: "Clustering · Noise", term: "DBSCAN",
    how: "Groups points that are packed densely together. A point with at least minPts neighbours within distance ε is a core point; clusters grow from core points through their neighbours. Isolated points are labelled noise (grey). It finds clusters of any shape and decides the number itself.",
    try: "Hover over points to see their ε circle. Shrink ε until the crescents break apart; grow it until everything merges into one blob. Notice that K-means could never find these crescent shapes.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [], eps = 0.07, minPts = 4, hover = null;
      const ui = panel(ctl, slider("e", "ε (neighbourhood radius)", 0.02, 0.2, 0.005, eps) + slider("m", "minPts", 2, 10, 1, minPts) + btn("new", "New data"));
      function make() {
        pts = [];
        for (let i = 0; i < 70; i++) { const t = Math.PI * Math.random(); pts.push({ x: clamp01(0.32 + 0.22 * Math.cos(t) + gauss() * 0.018), y: clamp01(0.48 + 0.25 * Math.sin(t) + gauss() * 0.018) }); }
        for (let i = 0; i < 70; i++) { const t = Math.PI * Math.random(); pts.push({ x: clamp01(0.54 + 0.22 * Math.cos(t) + gauss() * 0.018), y: clamp01(0.58 - 0.25 * Math.sin(t) + gauss() * 0.018) }); }
        for (let i = 0; i < 14; i++) pts.push({ x: rand(0.03, 0.97), y: rand(0.03, 0.97) });
      }
      function run() {
        const nb = pts.map((p) => pts.filter((q) => Math.hypot(p.x - q.x, p.y - q.y) <= eps)); pts.forEach((p, i) => { p.core = nb[i].length >= minPts; p.g = -1; });
        let g = 0; pts.forEach((p, i) => { if (!p.core || p.g >= 0) return; const st = [i]; p.g = g; while (st.length) { const j = st.pop(); if (!pts[j].core) continue; nb[j].forEach((q) => { if (q.g < 0) { q.g = g; st.push(pts.indexOf(q)); } }); } g++; });
        return g;
      }
      function draw() {
        const n = run(); P.clear();
        if (hover) P.ring(hover.x, hover.y, pal.fg, eps * P.w, 1.5);
        pts.forEach((p) => { if (p.g < 0) P.ring(p.x, p.y, pal.muted, 3.5, 1.5); else P.dot(p.x, p.y, pal.groups[p.g % 6], p.core ? 5 : 3.5, pal.bg); });
        ui.info(`clusters found: ${n}\nnoise points: ${pts.filter((p) => p.g < 0).length}\nbig dots = core points`);
      }
      P.c.addEventListener("mousemove", (e) => { const q = P.at(e); hover = pts.reduce((b, p) => (!b || Math.hypot(p.x - q.x, p.y - q.y) < Math.hypot(b.x - q.x, b.y - q.y) ? p : b), null); draw(); });
      P.c.addEventListener("mouseleave", () => { hover = null; draw(); });
      ui.on("e", "input", (e, s) => { eps = +s.value; ui.show("e", eps.toFixed(3)); draw(); });
      ui.on("m", "input", (e, s) => { minPts = +s.value; ui.show("m", minPts); draw(); });
      ui.on("new", "click", () => { make(); draw(); });
      make(); draw();
    },
  });

  add({
    id: "pca", group: "uns", star: true, name: "Principal Component Analysis (PCA)", kind: "Dimensionality reduction", term: "Principal Component Analysis (PCA)",
    how: "Finds the directions in which the data varies the most. The first principal component (PC1) is the longest arrow. Keeping only the top components compresses many features into a few while losing as little information as possible.",
    try: "Press \"Squash onto PC1\": every point slides onto the main arrow, turning 2 numbers into 1. The percentage tells you how much of the spread survived. Try a rounder cloud and see that percentage drop.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [], t = 0, target = 0, pc = null;
      const ui = panel(ctl, btn("proj", "Squash onto PC1", true) + btn("thin", "Long thin cloud") + btn("round", "Rounder cloud"));
      function make(spread) { const ang = rand(0.2, 1.2), c = Math.cos(ang), s = Math.sin(ang); pts = Array.from({ length: 70 }, () => { const a = gauss() * 0.16, b = gauss() * 0.16 * spread; return { x: clamp01(0.5 + a * c - b * s), y: clamp01(0.5 + a * s + b * c) }; }); compute(); t = target = 0; }
      function compute() {
        const n = pts.length, mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
        let a = 0, b = 0, d = 0; pts.forEach((p) => { a += (p.x - mx) ** 2; b += (p.x - mx) * (p.y - my); d += (p.y - my) ** 2; }); a /= n; b /= n; d /= n;
        const tr = a + d, det = a * d - b * b, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(tr * tr / 4 - det);
        let v1 = Math.abs(b) > 1e-12 ? [l1 - d, b] : a >= d ? [1, 0] : [0, 1]; const nv = Math.hypot(...v1); v1 = [v1[0] / nv, v1[1] / nv];
        pc = { mx, my, l1, l2, v1, v2: [-v1[1], v1[0]] };
      }
      function draw() {
        const { mx, my, l1, l2, v1, v2 } = pc; P.clear();
        P.line(mx - v1[0], my - v1[1], mx + v1[0], my + v1[1], pal.line, 1, [4, 4]);
        pts.forEach((p) => { const s = (p.x - mx) * v1[0] + (p.y - my) * v1[1], px = mx + s * v1[0], py = my + s * v1[1]; P.dot(p.x + (px - p.x) * t, p.y + (py - p.y) * t, pal.a, 4.5, pal.bg); });
        const L1 = 2 * Math.sqrt(l1), L2 = 2 * Math.sqrt(Math.max(l2, 0));
        P.line(mx, my, mx + v1[0] * L1, my + v1[1] * L1, pal.bad, 4); P.text("PC1", mx + v1[0] * L1 + 0.01, my + v1[1] * L1 + 0.02, pal.bad, 13);
        if (t < 0.5) { P.line(mx, my, mx + v2[0] * L2, my + v2[1] * L2, pal.fg, 3); P.text("PC2", mx + v2[0] * L2 + 0.01, my + v2[1] * L2 + 0.02, pal.fg, 12); }
        ui.info(`PC1 explains ${Math.round((l1 / (l1 + l2)) * 100)}% of the spread\nPC2 explains ${Math.round((l2 / (l1 + l2)) * 100)}%\n${t > 0.5 ? "now: 1 number per point" : "now: 2 numbers per point"}`);
      }
      const stop = loop(() => { if (Math.abs(t - target) < 0.001) return; t += (target - t) * 0.12; if (Math.abs(t - target) < 0.01) t = target; draw(); });
      ui.on("proj", "click", (e, b) => { target = target ? 0 : 1; b.textContent = target ? "Back to 2D" : "Squash onto PC1"; });
      ui.on("thin", "click", () => { make(0.25); ui.q("proj").textContent = "Squash onto PC1"; draw(); });
      ui.on("round", "click", () => { make(0.8); ui.q("proj").textContent = "Squash onto PC1"; draw(); });
      make(0.3); draw();
      return stop;
    },
  });

  add({
    id: "tsne", group: "uns", name: "t-SNE / UMAP", kind: "Visualisation", term: "t-SNE / UMAP",
    how: "These methods draw high-dimensional data as a 2D map. They pull points that are similar in the original data close together and push dissimilar ones apart, so hidden groups appear as islands. Good for exploring; distances between islands don't mean much.",
    try: "Press Run: the points start as a meaningless scatter and organise themselves into groups. The colours are only revealed at the end. The algorithm itself never sees them, only the similarities.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [], running = false, it = 0, reveal = false;
      const ui = panel(ctl, btn("run", "Run", true) + btn("reset", "Scramble") + `<label><span><input type="checkbox" data-k="rev"> reveal hidden groups</span></label>`);
      function make() {
        // Each point has a hidden 10-number "feature vector"; similarity is computed from those, not from the 2D position
        const centers = Array.from({ length: 4 }, () => Array.from({ length: 10 }, () => rand(0, 1)));
        pts = Array.from({ length: 80 }, (_, i) => { const g = i % 4; return { g, v: centers[g].map((c) => c + gauss() * 0.12), x: rand(0.1, 0.9), y: rand(0.1, 0.9) }; });
        pts.forEach((p) => { p.nb = pts.map((q) => ({ q, d: Math.hypot(...p.v.map((v, k) => v - q.v[k])) })).sort((a, b) => a.d - b.d).slice(1, 9).map((o) => o.q); });
        it = 0;
      }
      function stepSim() {
        pts.forEach((p) => {
          let fx = 0, fy = 0;
          p.nb.forEach((q) => { fx += (q.x - p.x) * 0.02; fy += (q.y - p.y) * 0.02; });
          for (let k = 0; k < 10; k++) { const q = pts[Math.floor(Math.random() * pts.length)]; if (q === p) continue; const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy + 0.002; fx += (dx / d2) * 0.00012; fy += (dy / d2) * 0.00012; }
          p.x = clamp01(p.x + fx); p.y = clamp01(p.y + fy);
        });
        it++;
      }
      function draw() { P.clear(); const rv = ui.q("rev").checked || reveal; pts.forEach((p) => P.dot(p.x, p.y, rv ? pal.groups[p.g] : pal.muted, 5, pal.bg)); ui.info(`iterations: ${it}\neach point really has 10 features;\nthe map keeps near neighbours near`); }
      const stop = loop(() => { if (!running) return; for (let i = 0; i < 3; i++) stepSim(); draw(); if (it > 450) { running = false; reveal = true; ui.q("run").textContent = "Run"; draw(); } });
      ui.on("run", "click", (e, b) => { running = !running; b.textContent = running ? "Pause" : "Run"; });
      ui.on("reset", "click", () => { pts.forEach((p) => { p.x = rand(0.1, 0.9); p.y = rand(0.1, 0.9); }); it = 0; reveal = false; draw(); });
      ui.on("rev", "change", draw);
      make(); draw();
      return stop;
    },
    note: "Simplified force layout that follows the same idea (attract nearest neighbours, repel the rest). Real t-SNE and UMAP use probability-based versions of these forces.",
  });

  // Apriori over a small basket table
  const ITEMS = ["Bread", "Butter", "Milk", "Eggs", "Coffee", "Nappies", "Beer"];
  const START = [[1, 1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 0, 0, 0], [0, 0, 1, 0, 1, 0, 0], [1, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1], [1, 0, 1, 0, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 0, 0], [0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1]];
  add({
    id: "apriori", group: "uns", star: true, name: "Apriori (association rules)", kind: "Pattern finding", term: "Apriori",
    how: "Scans shopping baskets for item sets that appear together often (support), then turns them into rules like Bread → Butter with a confidence: of the baskets with bread, how many also had butter. It saves work by never checking bigger sets that contain an already-rare smaller set.",
    try: "Tick and untick items in the baskets and watch the rules update. Lower the minimum support to find rarer patterns, such as the classic (and probably mythical) nappies → beer.",
    wide: true,
    mount(host, ctl) {
      let B = START.map((r) => r.slice()), minS = 0.3, minC = 0.6;
      const ui = panel(ctl, slider("s", "Minimum support", 0.1, 0.6, 0.05, minS) + slider("c", "Minimum confidence", 0.3, 1, 0.05, minC));
      function draw() {
        const n = B.length, sup = (set) => B.filter((b) => set.every((i) => b[i])).length / n;
        let freq = []; let level = ITEMS.map((_, i) => [i]).filter((s) => sup(s) >= minS); const all = [...level];
        while (level.length) { const nxt = []; level.forEach((s) => { for (let i = s[s.length - 1] + 1; i < ITEMS.length; i++) { const t = [...s, i]; if (sup(t) >= minS) nxt.push(t); } }); all.push(...nxt); level = nxt; }
        freq = all;
        const rules = []; freq.filter((s) => s.length >= 2).forEach((s) => s.forEach((rhs) => { const lhs = s.filter((i) => i !== rhs), c = sup(s) / sup(lhs); if (c >= minC) rules.push({ lhs, rhs, c, s: sup(s) }); }));
        rules.sort((a, b) => b.c - a.c || b.s - a.s);
        host.innerHTML = `<div class="algoflex"><div><p class="lbl">Baskets (tick = bought)</p><div class="tbl"><table class="basket"><thead><tr><th>#</th>${ITEMS.map((i) => `<th>${i}</th>`).join("")}</tr></thead><tbody>${B.map((r, bi) => `<tr><td>${bi + 1}</td>${r.map((v, ii) => `<td><input type="checkbox" data-b="${bi}" data-i="${ii}" ${v ? "checked" : ""}></td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
          <div style="min-width:240px;flex:1"><p class="lbl">Frequent sets (support)</p><div class="algoinfo">${freq.map((s) => `${s.map((i) => ITEMS[i]).join(" + ")}: ${Math.round(sup(s) * 100)}%`).join("\n") || "none"}</div>
          <p class="lbl" style="margin-top:12px">Rules (confidence)</p><div class="algoinfo">${rules.map((r) => `${r.lhs.map((i) => ITEMS[i]).join(" + ")} → ${ITEMS[r.rhs]}   ${Math.round(r.c * 100)}%`).join("\n") || "no rules at these settings"}</div></div></div>`;
        host.querySelectorAll("[data-b]").forEach((c) => c.addEventListener("change", () => { B[+c.dataset.b][+c.dataset.i] = c.checked ? 1 : 0; draw(); }));
      }
      ui.on("s", "input", (e, s) => { minS = +s.value; ui.show("s", minS.toFixed(2)); draw(); });
      ui.on("c", "input", (e, s) => { minC = +s.value; ui.show("c", minC.toFixed(2)); draw(); });
      draw();
    },
  });

  add({
    id: "iforest", group: "uns", name: "Isolation Forest", kind: "Anomaly detection", term: "Anomaly Detection",
    how: "Makes random cuts through the data until each point sits alone. Unusual points are far from the crowd, so they get isolated in just a few cuts; normal points need many. Averaging over many random trees gives each point an anomaly score.",
    try: "Click a point to watch random cuts isolate it, and compare the number of cuts for an outlier with one in the middle of the crowd. Then press \"Score every point\".",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let pts = [], cuts = [], target = null, scored = false, anim = null;
      const ui = panel(ctl, btn("score", "Score every point", true) + btn("new", "New data"));
      const make = () => { pts = [...blob(60, 0.45, 0.5, 0.1, 0), ...blob(25, 0.7, 0.7, 0.05, 0), { x: 0.92, y: 0.12, c: 0 }, { x: 0.1, y: 0.9, c: 0 }, { x: 0.88, y: 0.92, c: 0 }, { x: 0.08, y: 0.15, c: 0 }]; scored = false; cuts = []; target = null; };
      function isolate(p, record) {
        let set = pts, box = [0, 1, 0, 1], depth = 0; const rec = [];
        while (set.length > 1 && depth < 40) {
          const f = Math.random() < 0.5 ? "x" : "y", lo = Math.min(...set.map((q) => q[f])), hi = Math.max(...set.map((q) => q[f])); if (hi - lo < 1e-6) break;
          const t = rand(lo, hi); rec.push({ f, t, box: box.slice() });
          set = set.filter((q) => (q[f] < t) === (p[f] < t));
          if (f === "x") { if (p.x < t) box[1] = t; else box[0] = t; } else { if (p.y < t) box[3] = t; else box[2] = t; }
          depth++;
        }
        if (record) cuts = rec; return depth;
      }
      function draw(k) {
        P.clear();
        const show = k == null ? cuts.length : k;
        cuts.slice(0, show).forEach((c) => { if (c.f === "x") P.line(c.t, c.box[2], c.t, c.box[3], pal.bad, 1.5); else P.line(c.box[0], c.t, c.box[1], c.t, pal.bad, 1.5); });
        const mx = scored ? Math.max(...pts.map((p) => p.s)) : 1, mn = scored ? Math.min(...pts.map((p) => p.s)) : 0;
        pts.forEach((p) => { const z = scored ? (p.s - mn) / (mx - mn || 1) : 0; const col = scored ? `color-mix(in srgb,${pal.bad} ${Math.round(z * 100)}%,${pal.a})` : pal.a; P.dot(p.x, p.y, col, scored ? 4 + z * 4 : 4.5, pal.bg); });
        if (target) P.ring(target.x, target.y, pal.fg, 10, 2.5);
        if (target) ui.info(`cuts to isolate this point: ${show}${k == null || k >= cuts.length ? "" : "…"}\naverage over 100 random trees:\n  this point: ${target.avg.toFixed(1)} cuts\n  typical point: ${(pts.reduce((s, p) => s + (p.avg || 0), 0) / pts.filter((p) => p.avg).length || 0).toFixed(1)}`);
        else ui.info(scored ? "red / bigger = isolated quickly = anomaly" : "click a point to isolate it");
      }
      function avgDepth(p) { let s = 0; for (let i = 0; i < 100; i++) s += isolate(p, false); return s / 100; }
      P.c.addEventListener("click", (e) => {
        const q = P.at(e); target = pts.reduce((b, p) => (!b || Math.hypot(p.x - q.x, p.y - q.y) < Math.hypot(b.x - q.x, b.y - q.y) ? p : b), null);
        pts.forEach((p) => { if (!p.avg) p.avg = avgDepth(p); });
        isolate(target, true); let k = 0; if (anim) anim(); let last = 0;
        anim = loop(() => { const t = performance.now(); if (t - last < 260) return; last = t; draw(k); k++; if (k > cuts.length) { anim(); anim = null; } });
      });
      ui.on("score", "click", () => { pts.forEach((p) => { p.avg = p.avg || avgDepth(p); p.s = -p.avg; }); scored = true; draw(); });
      ui.on("new", "click", () => { make(); draw(); });
      make(); draw();
      return () => { if (anim) anim(); };
    },
  });

  // Linear autoencoder (equivalent to PCA) trained on "normal" line patterns
  add({
    id: "ae", group: "uns", name: "Autoencoder", kind: "Compression · Anomalies", term: "Autoencoder",
    how: "An autoencoder squeezes its input through a narrow bottleneck and tries to rebuild it. Trained only on normal examples, it learns to rebuild those well. Anything unusual rebuilds badly, and that high reconstruction error flags an anomaly.",
    try: "This one was trained only on 6 kinds of straight line (rows and columns 2, 5 and 7). Draw a line and it rebuilds almost perfectly; draw a diagonal or a blob and the error jumps. Change the bottleneck size to see compression vs quality.",
    wide: true,
    mount(host, ctl) {
      const N = 8, D = 64;
      const train = []; for (const k of [1, 4, 6]) { train.push(Array.from({ length: D }, (_, i) => (Math.floor(i / N) === k ? 1 : 0))); train.push(Array.from({ length: D }, (_, i) => (i % N === k ? 1 : 0))); }
      const mean = Array.from({ length: D }, (_, i) => train.reduce((s, v) => s + v[i], 0) / train.length);
      const X = train.map((v) => v.map((x, i) => x - mean[i]));
      // Eigenvectors of the small Gram matrix (Jacobi), mapped back to pixel space
      const n = X.length, G = X.map((a) => X.map((b) => a.reduce((s, v, i) => s + v * b[i], 0)));
      const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))), M = G.map((r) => r.slice());
      for (let sweep = 0; sweep < 60; sweep++) for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { if (Math.abs(M[p][q]) < 1e-10) continue; const th = (M[q][q] - M[p][p]) / (2 * M[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c; for (let k = 0; k < n; k++) { const a = M[k][p], b = M[k][q]; M[k][p] = c * a - s * b; M[k][q] = s * a + c * b; } for (let k = 0; k < n; k++) { const a = M[p][k], b = M[q][k]; M[p][k] = c * a - s * b; M[q][k] = s * a + c * b; } for (let k = 0; k < n; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; } }
      const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => M[b][b] - M[a][a]);
      const comps = order.filter((i) => M[i][i] > 1e-6).map((i) => { const u = Array.from({ length: D }, (_, d) => X.reduce((s, row, r) => s + row[d] * V[r][i], 0)); const nn = Math.hypot(...u); return u.map((v) => v / nn); });
      let img = Array.from({ length: D }, (_, i) => (i % N === 4 ? 1 : 0)), k = 5;
      host.innerHTML = `<div class="algoflex"><div><p class="lbl">Input (click to draw)</p><div class="pixgrid" id="aeIn" style="grid-template-columns:repeat(8,22px)"></div></div><div><p class="lbl">Bottleneck</p><div id="aeCode" class="algoinfo" style="min-width:120px"></div></div><div><p class="lbl">Rebuilt output</p><div class="pixgrid" id="aeOut" style="grid-template-columns:repeat(8,22px)"></div></div></div><p id="aeErr" class="savemsg" style="font-size:1.05rem;margin-top:12px"></p>`;
      const ui = panel(ctl, slider("k", "Bottleneck size (numbers)", 1, Math.min(15, comps.length), 1, k) + `<label>Load<div class="row">${btn("line", "Line")}${btn("diag", "Diagonal")}${btn("blob", "Blob")}${btn("clear", "Clear")}</div></label>`);
      function draw() {
        const x = img.map((v, i) => v - mean[i]), code = comps.slice(0, k).map((u) => u.reduce((s, v, i) => s + v * x[i], 0));
        const rec = mean.map((m, i) => m + code.reduce((s, c, j) => s + c * comps[j][i], 0)), err = img.reduce((s, v, i) => s + (v - rec[i]) ** 2, 0) / D;
        host.querySelector("#aeIn").innerHTML = img.map((v, i) => `<span data-i="${i}" style="background:${v ? "var(--fg)" : "var(--line)"}"></span>`).join("");
        host.querySelector("#aeOut").innerHTML = rec.map((v) => `<span style="cursor:default;background:color-mix(in srgb,var(--fg) ${Math.round(Math.max(0, Math.min(1, v)) * 100)}%,var(--line))"></span>`).join("");
        host.querySelector("#aeCode").textContent = `${D} pixels\n  → ${k} numbers\n  → ${D} pixels\n\n${code.map((c) => c.toFixed(2)).join("\n")}`;
        const o = host.querySelector("#aeErr"), bad = err > 0.03; o.className = "savemsg " + (bad ? "err" : "ok");
        o.textContent = `Reconstruction error: ${err.toFixed(3)}  ·  ${bad ? "High: this doesn't look like the training data (anomaly)" : "Low: looks normal"}`;
      }
      host.querySelector("#aeIn").addEventListener("click", (e) => { const s = e.target.closest("[data-i]"); if (!s) return; img[+s.dataset.i] ^= 1; draw(); });
      ui.on("k", "input", (e, s) => { k = +s.value; ui.show("k", k); draw(); });
      ui.on("line", "click", () => { const r = [1, 4, 6][Math.floor(rand(0, 3))], h = Math.random() < 0.5; img = Array.from({ length: D }, (_, i) => ((h ? Math.floor(i / N) : i % N) === r ? 1 : 0)); draw(); });
      ui.on("diag", "click", () => { img = Array.from({ length: D }, (_, i) => (Math.floor(i / N) === i % N ? 1 : 0)); draw(); });
      ui.on("blob", "click", () => { img = Array.from({ length: D }, (_, i) => { const r = Math.floor(i / N), c = i % N; return Math.hypot(r - 3.5, c - 3.5) < 2.2 ? 1 : 0; }); draw(); });
      ui.on("clear", "click", () => { img = Array(D).fill(0); draw(); });
      draw();
    },
    note: "A linear autoencoder (mathematically the same as PCA), trained here in your browser on 6 line patterns. Deep autoencoders use neural networks for the encoder and decoder.",
  });

  // Embeddings: illustrative 2D word map
  const EMB = { king: [0.62, 0.36], queen: [0.62, 0.52], man: [0.36, 0.36], woman: [0.36, 0.52], prince: [0.7, 0.3], princess: [0.7, 0.58],
    Paris: [0.1, 0.86], France: [0.04, 0.95], Rome: [0.22, 0.84], Italy: [0.16, 0.94], Tokyo: [0.34, 0.86], Japan: [0.28, 0.95],
    cat: [0.82, 0.86], dog: [0.9, 0.8], kitten: [0.78, 0.94], puppy: [0.94, 0.9], apple: [0.15, 0.12], banana: [0.25, 0.08], mango: [0.2, 0.2], car: [0.86, 0.16], bus: [0.94, 0.24], train: [0.88, 0.08] };
  add({
    id: "emb", group: "uns", star: true, name: "Embeddings", kind: "Representation", term: "Embedding",
    how: "An embedding turns each word (or image, product or document) into a list of numbers so that similar meanings sit close together. Directions carry meaning too: the step from man to woman is about the same as from king to queen. Embeddings power semantic search, recommendations and RAG.",
    try: "Click a word to see its nearest neighbours. Then try the analogies: king − man + woman lands next to queen, and Paris − France + Japan lands on Tokyo.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host);
      let sel = "cat", ana = null;
      const ui = panel(ctl, `<label>Analogies<div class="row">${btn("a1", "king − man + woman")}${btn("a2", "Paris − France + Japan")}${btn("a3", "puppy − dog + cat")}</div></label>`);
      const near = (v, skip) => Object.entries(EMB).filter(([w]) => !skip.includes(w)).map(([w, p]) => ({ w, d: Math.hypot(p[0] - v[0], p[1] - v[1]) })).sort((a, b) => a.d - b.d);
      function draw() {
        P.clear();
        if (ana) { const [a, b, c] = ana, A_ = EMB[a], B_ = EMB[b], C = EMB[c], R = [A_[0] - B_[0] + C[0], A_[1] - B_[1] + C[1]];
          P.line(B_[0], B_[1], A_[0], A_[1], pal.bad, 2.5, [6, 4]); P.line(C[0], C[1], R[0], R[1], pal.bad, 2.5, [6, 4]); P.ring(R[0], R[1], pal.bad, 12, 2.5);
          const res = near(R, [a, b, c])[0]; ui.info(`${a} − ${b} + ${c}\n= ${res.w}\n(the same arrow, moved)`); }
        else if (sel) { const nn = near(EMB[sel], [sel]).slice(0, 3); nn.forEach((o) => P.line(EMB[sel][0], EMB[sel][1], EMB[o.w][0], EMB[o.w][1], pal.accent, 2)); ui.info(`nearest to "${sel}":\n${nn.map((o) => `  ${o.w}  (distance ${o.d.toFixed(2)})`).join("\n")}`); }
        Object.entries(EMB).forEach(([w, p]) => { P.dot(p[0], p[1], w === sel ? pal.bad : pal.a, 5, pal.bg); P.text(w, p[0] + 0.012, p[1] + 0.015, pal.fg, 12); });
      }
      P.c.addEventListener("click", (e) => { const q = P.at(e); sel = Object.entries(EMB).reduce((b, [w, p]) => (Math.hypot(p[0] - q.x, p[1] - q.y) < Math.hypot(EMB[b][0] - q.x, EMB[b][1] - q.y) ? w : b), "cat"); ana = null; draw(); });
      ui.on("a1", "click", () => { ana = ["king", "man", "woman"]; sel = null; draw(); });
      ui.on("a2", "click", () => { ana = ["Paris", "France", "Japan"]; sel = null; draw(); });
      ui.on("a3", "click", () => { ana = ["puppy", "dog", "cat"]; sel = null; draw(); });
      draw();
    },
    note: "Illustrative 2D positions. Real embeddings have hundreds or thousands of dimensions and are learned from data.",
  });
})();
