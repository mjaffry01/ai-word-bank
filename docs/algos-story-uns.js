// Algorithms map: "Watch it work" walkthroughs for the unsupervised must-know algorithms.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A || !A.story) return;
  const pct = (v) => Math.round(v * 100) + "%";

  /* ---------- K-means ---------- */
  A.story("kmeans", {
    how: "Watch K-means find groups with no labels at all: drop k centres, assign every point to its nearest centre, move each centre to the middle of its points, and repeat until nothing changes. Then see how to choose k.",
    scenes(S) {
      const p = S.pal, r = A.seeded(4), pts = [];
      [[0.25, 0.3], [0.7, 0.28], [0.5, 0.72]].forEach(([cx, cy]) => { for (let i = 0; i < 22; i++) pts.push({ x: Math.max(0.03, Math.min(0.97, cx + A.sgauss(r) * 0.08)), y: Math.max(0.03, Math.min(0.97, cy + A.sgauss(r) * 0.08)) }); });
      const nearest = (q, C) => C.reduce((b, c, j) => ((q.x - c.x) ** 2 + (q.y - c.y) ** 2 < (q.x - C[b].x) ** 2 + (q.y - C[b].y) ** 2 ? j : b), 0);
      const inertia = (C, as) => pts.reduce((s, q, i) => s + (q.x - C[as[i]].x) ** 2 + (q.y - C[as[i]].y) ** 2, 0);
      function run(C) { const states = []; for (let it = 0; it < 20; it++) { const as = pts.map((q) => nearest(q, C)); const nc = C.map((c, j) => { const m = pts.filter((q, i) => as[i] === j); return m.length ? { x: m.reduce((s, q) => s + q.x, 0) / m.length, y: m.reduce((s, q) => s + q.y, 0) / m.length } : c; }); states.push({ C, as, nc }); if (nc.every((c, j) => Math.hypot(c.x - C[j].x, c.y - C[j].y) < 1e-6)) break; C = nc; } return states; }
      const st = run([{ x: 0.12, y: 0.62 }, { x: 0.3, y: 0.2 }, { x: 0.42, y: 0.32 }]);
      // Elbow: best of a few runs for each k
      const elbow = [1, 2, 3, 4, 5, 6, 7].map((K) => { let best = Infinity; for (let t = 0; t < 6; t++) { const s = run(A.h.shuffle(pts.slice()).slice(0, K).map((q) => ({ x: q.x, y: q.y }))), l = s[s.length - 1]; best = Math.min(best, inertia(l.nc, pts.map((q) => nearest(q, l.nc)))); } return best; });
      const g = S.area(0.05, 0.08, 0.6, 0.94), col = (j) => p.groups[j];
      const draw = (C, as, o = {}) => {
        g.frame("spend per visit →", "↑ visits per month");
        pts.forEach((q, i) => { if (as && o.lines) S.alpha(o.lines, () => g.line(q.x, q.y, C[as[i]].x, C[as[i]].y, S.tint(col(as[i]), 0.5), 1)); });
        pts.forEach((q, i) => g.dot(q.x, q.y, 5, as ? col(as[i]) : p.muted, p.bg));
        C.forEach((c, j) => { g.dot(c.x, c.y, 11, p.bg, p.fg); g.dot(c.x, c.y, 8, col(j)); g.text("✕", c.x, c.y, { size: 10, color: p.bg }); });
      };
      const side = (lines) => lines.forEach(([t, o], i) => S.text(t, 0.66, 0.2 + i * 0.075, Object.assign({ align: "left", size: 13, max: 0.32 }, o)));
      const lerpC = (a, b, k) => a.map((c, j) => ({ x: S.lerp(c.x, b[j].x, k), y: S.lerp(c.y, b[j].y, k) }));
      const scenes = [
        { t: "Data without labels", dur: 1600, cap: "Each dot is a customer: spend per visit across, visits per month up. Nobody has labelled them. You can probably see three clumps; K-means will find them by itself.", draw(S, k) { g.frame("spend per visit →", "↑ visits per month"); pts.slice(0, Math.ceil(k * pts.length)).forEach((q) => g.dot(q.x, q.y, 5, p.muted, p.bg)); } },
        { t: "Drop k = 3 centres", dur: 1600, cap: "You choose k, the number of groups (here 3). K-means drops 3 starting centres. These starts are deliberately bad, to show it can recover.", draw(S, k) { g.frame(); pts.forEach((q) => g.dot(q.x, q.y, 5, p.muted, p.bg)); S.alpha(S.ease(k), () => st[0].C.forEach((c, j) => { g.dot(c.x, c.y, 11, p.bg, p.fg); g.dot(c.x, c.y, 8, col(j)); })); } },
        { t: "Step 1: assign", dur: 2200, cap: "Assign: every point joins its nearest centre and takes its colour. The thin lines show who belongs to whom.", draw(S, k) { draw(st[0].C, k > 0.3 ? st[0].as : null, { lines: S.ease(k) }); side([["iteration 1", { color: p.muted }], [`spread inside groups: ${inertia(st[0].C, st[0].as).toFixed(2)}`]]); } },
        { t: "Step 2: move", dur: 2200, cap: "Move: each centre jumps to the average position (the mean) of its points. That's where the name comes from: k means.", draw(S, k) { const C = lerpC(st[0].C, st[0].nc, S.ease(k)); draw(C, st[0].as, { lines: 0.35 }); st[0].C.forEach((c, j) => g.line(c.x, c.y, C[j].x, C[j].y, col(j), 2, [4, 3])); side([["iteration 1", { color: p.muted }], ["centres move to the mean"]]); } },
        { t: "Repeat until nothing changes", dur: Math.max(3000, st.length * 1300), cap: (k) => { const n = Math.min(st.length - 1, Math.floor(k * st.length)); return `Iteration ${n + 1}: assign, move, assign, move… Points switch groups as the centres settle. Within-group spread: ${inertia(st[n].C, st[n].as).toFixed(2)}, and it can only go down.`; }, draw(S, k) { const f = k * st.length, n = Math.min(st.length - 1, Math.floor(f)), kk = S.ease(Math.min(1, (f - n) * 1.4)); draw(lerpC(st[n].C, st[n].nc, kk), st[n].as, { lines: 0.3 }); side([[`iteration ${n + 1} of ${st.length}`, { color: p.muted }], [`spread: ${inertia(st[n].C, st[n].as).toFixed(2)}`]]); } },
        { t: "Converged", dur: 1800, cap: `After ${st.length} iterations no point changes group, so K-means stops. It found the three clumps. It doesn't know what they mean; naming them ("occasional big spenders", "frequent small baskets"…) and choosing an offer for each is your job.`, draw(S, k) { const l = st[st.length - 1]; draw(l.nc, pts.map((q) => nearest(q, l.nc)), { lines: 0.3 }); side([["✓ converged", { color: p.good, size: 15 }], [`final spread: ${inertia(l.nc, pts.map((q) => nearest(q, l.nc))).toFixed(2)}`]]); } },
        { t: "How do you choose k?", dur: 2600, cap: "The elbow method: run K-means for k = 1, 2, 3… and plot the spread inside the groups. It always falls as k grows, but after the right k it stops falling much. The bend (the elbow) here is at k = 3.", draw(S, k) { const l = st[st.length - 1]; draw(l.nc, pts.map((q) => nearest(q, l.nc))); const e = S.area(0.67, 0.25, 0.97, 0.8), mx = elbow[0]; e.frame("k →", "spread"); const n = Math.ceil(S.ease(k) * 7); e.path(elbow.slice(0, n).map((v, i) => [i / 6, v / mx]), S.hl, 2.5); elbow.slice(0, n).forEach((v, i) => { e.dot(i / 6, v / mx, i === 2 ? 7 : 4, i === 2 ? S.hl : p.fg); e.text(i + 1, i / 6, -0.08, { size: 10, color: p.muted }); }); if (n >= 3) e.text("elbow", 2 / 6 + 0.12, elbow[2] / mx + 0.12, { size: 12, color: S.hl }); } },
      ];
      return scenes;
    },
  });

  /* ---------- PCA ---------- */
  A.story("pca", {
    how: "Watch PCA find the most informative direction in the data: centre it, try every direction and measure how spread out the points are along it, keep the best one (PC1), then squash the data onto it: two numbers become one.",
    scenes(S) {
      const p = S.pal, r = A.seeded(8), pts = [];
      for (let i = 0; i < 60; i++) { const t = A.sgauss(r) * 0.17, s = A.sgauss(r) * 0.05; pts.push({ x: 0.5 + t * 0.87 - s * 0.5, y: 0.5 + t * 0.5 + s * 0.87 }); }
      const mx = pts.reduce((s, q) => s + q.x, 0) / pts.length, my = pts.reduce((s, q) => s + q.y, 0) / pts.length;
      const spread = (th) => pts.reduce((s, q) => s + ((q.x - mx) * Math.cos(th) + (q.y - my) * Math.sin(th)) ** 2, 0) / pts.length;
      let best = 0; for (let a = 0; a < Math.PI; a += 0.001) if (spread(a) > spread(best)) best = a;
      const v1 = spread(best), v2 = spread(best + Math.PI / 2), tot = v1 + v2;
      const g = S.area(0.05, 0.08, 0.6, 0.94);
      const cloud = (dx = 0, dy = 0) => pts.forEach((q) => g.dot(q.x + dx, q.y + dy, 4.5, p.a, p.bg));
      const axisLine = (th, col, lw = 2.5, len = 0.42) => g.line(mx - Math.cos(th) * len, my - Math.sin(th) * len, mx + Math.cos(th) * len, my + Math.sin(th) * len, col, lw);
      const proj = (th, a = 1) => S.alpha(a, () => pts.forEach((q) => { const t = (q.x - mx) * Math.cos(th) + (q.y - my) * Math.sin(th), px = mx + t * Math.cos(th), py = my + t * Math.sin(th); g.line(q.x, q.y, px, py, S.tint(p.muted, 0.6), 1); g.dot(px, py, 3, S.hl); }));
      const meter = (th) => { S.text("spread along this direction", 0.8, 0.2, { size: 12, color: p.muted }); S.rect(0.66, 0.25, 0.3, 0.05, p.line); S.rect(0.66, 0.25, 0.3 * (spread(th) / v1), 0.05, S.hl); S.text(`${pct(spread(th) / tot)} of the total`, 0.8, 0.35, { size: 14 }); };
      return [
        { t: "Data with two features", dur: 1600, cap: "Each dot is a person, described by two numbers: height (across) and weight (up). They're strongly related: taller people tend to be heavier. So two numbers carry a lot of repeated information.", draw(S, k) { g.frame("height →", "↑ weight"); pts.slice(0, Math.ceil(k * pts.length)).forEach((q) => g.dot(q.x, q.y, 4.5, p.a, p.bg)); } },
        { t: "Centre the data", dur: 1800, cap: "First, centre the data: measure everything from the middle (the mean) of the cloud. (In practice, also standardise features measured in different units.)", draw(S, k) { g.frame("height →", "↑ weight"); cloud(); S.alpha(S.ease(k), () => { g.line(mx, 0.02, mx, 0.98, p.muted, 1.5, [4, 4]); g.line(0.02, my, 0.98, my, p.muted, 1.5, [4, 4]); g.dot(mx, my, 7, S.hl, p.fg); }); } },
        { t: "Try every direction", dur: 6000, cap: (k) => `Try a direction (angle ${Math.round((S.ease(k) * 180) % 180)}°) and drop every point onto it like a shadow. How spread out are the shadows? A direction with a big spread keeps the differences between people; a small spread loses them.`, draw(S, k) { const th = S.ease(k) * Math.PI; g.frame(); cloud(); proj(th); axisLine(th, S.hl); meter(th); } },
        { t: "The best direction: PC1", dur: 2000, cap: `The direction with the largest spread is the first principal component (PC1). It runs along the cloud, roughly "overall body size". It holds ${pct(v1 / tot)} of all the variation.`, draw(S, k) { g.frame(); cloud(); proj(best, 0.6); axisLine(best, S.hl, 4); g.text("PC1", mx + Math.cos(best) * 0.46, my + Math.sin(best) * 0.46, { size: 14, color: S.hl }); meter(best); } },
        { t: "PC2: the leftover", dur: 1800, cap: `PC2 is at a right angle to PC1 and captures what's left: here only ${pct(v2 / tot)} (heavier or lighter than usual for your height). With 100 features you'd get 100 components, sorted from most to least spread.`, draw(S, k) { g.frame(); cloud(); axisLine(best, S.hl, 4); S.alpha(S.ease(k), () => { axisLine(best + Math.PI / 2, p.b, 3, 0.18); g.text("PC2", mx + Math.cos(best + Math.PI / 2) * 0.22, my + Math.sin(best + Math.PI / 2) * 0.22, { size: 13, color: p.b }); }); S.text(`PC1: ${pct(v1 / tot)}`, 0.8, 0.3, { size: 15, color: S.hl }); S.text(`PC2: ${pct(v2 / tot)}`, 0.8, 0.4, { size: 15, color: p.b }); } },
        { t: "Keep only PC1", dur: 2600, cap: `Compress: keep only each person's position along PC1. Every point slides onto the line. Two numbers per person become one, and ${pct(v1 / tot)} of the information survives. With hundreds of features, a handful of components often keeps most of it.`, draw(S, k) { g.frame(); axisLine(best, S.hl, 3); const e = S.ease(k); pts.forEach((q) => { const t = (q.x - mx) * Math.cos(best) + (q.y - my) * Math.sin(best); g.dot(S.lerp(q.x, mx + t * Math.cos(best), e), S.lerp(q.y, my + t * Math.sin(best), e), 4.5, p.a, p.bg); }); S.text("2 numbers → 1 number", 0.8, 0.3, { size: 15 }); S.text(`${pct(v1 / tot)} of the spread kept`, 0.8, 0.4, { size: 14, color: p.good }); } },
      ];
    },
  });

  /* ---------- Apriori ---------- */
  A.story("apriori", {
    how: "Watch Apriori mine shopping baskets: count how often each item appears, keep only the common ones, build pairs and triples only from common items (skipping everything that can't be common), then turn the patterns into rules with confidence and lift.",
    scenes(S) {
      const p = S.pal;
      const B = [["bread", "milk", "butter"], ["bread", "butter"], ["milk", "nappies", "beer"], ["bread", "milk", "butter", "eggs"], ["bread", "butter", "eggs"], ["milk", "eggs"], ["bread", "milk", "butter"], ["nappies", "beer", "bread"]];
      const MIN = 3, sup = (set) => B.filter((b) => set.every((i) => b.includes(i))).length;
      const items = ["bread", "milk", "butter", "eggs", "nappies", "beer"], freq1 = items.filter((i) => sup([i]) >= MIN);
      const pairs = []; freq1.forEach((a, i) => freq1.slice(i + 1).forEach((b) => pairs.push([a, b])));
      const freq2 = pairs.filter((s) => sup(s) >= MIN);
      const triples = [["bread", "milk", "butter"]].filter((t) => [[t[0], t[1]], [t[0], t[2]], [t[1], t[2]]].every((s) => freq2.some((f) => f.join() === s.join())));
      const baskets = (hl) => { S.text("baskets", 0.14, 0.1, { size: 11, color: p.muted }); B.forEach((b, i) => { const on = hl && hl.every((x) => b.includes(x)); S.rect(0.02, 0.14 + i * 0.1, 0.26, 0.08, on ? S.tint(S.hl, 0.2) : null, on ? S.hl : p.line, on ? 2 : 1); S.text(`${i + 1}  ${b.join(", ")}`, 0.03, 0.18 + i * 0.1, { size: 11, align: "left", max: 0.25, weight: 500 }); }); };
      const barRows = (sets, k, o = {}) => sets.forEach((s, i) => { const v = 0.18 + i * (o.gap || 0.1), n = sup(s), ok = n >= MIN, x0 = 0.52;
        S.text(s.join(" + "), x0 - 0.01, v, { size: 12, align: "right", color: o.crossed && o.crossed(s) ? p.muted : p.fg });
        if (o.crossed && o.crossed(s)) { S.line(x0 - 0.18, v, x0 - 0.01, v, p.bad, 2); S.text("never counted", x0 + 0.02, v, { size: 11, color: p.bad, align: "left" }); return; }
        S.rect(x0, v - 0.02, 0.05 * n * k, 0.04, ok ? p.a : S.tint(p.muted, 0.5)); S.text(`${Math.round(n * k)}/8`, x0 + 0.05 * n * k + 0.03, v, { size: 11 });
        if (k >= 1 && !ok) S.text("too rare: dropped", x0 + 0.05 * n + 0.08, v, { size: 11, color: p.bad, align: "left" }); });
      const thr = (n, gap = 0.1) => { const x = 0.52 + 0.05 * MIN; S.line(x, 0.13, x, 0.15 + n * gap, S.hl, 2, [4, 3]); S.text(`min support ${MIN}/8`, x, 0.1, { size: 11, color: S.hl }); };
      const rule = (a, b, i, k) => { const sa = sup(a), sab = sup(a.concat(b)), conf = sab / sa, lift = conf / (sup(b) / B.length);
        S.alpha(k, () => { S.box(0.66, 0.25 + i * 0.22, 0.6, 0.18, null, { stroke: S.hl }); S.text(`${a.join(" + ")}  →  ${b.join(" + ")}`, 0.66, 0.2 + i * 0.22, { size: 14 }); S.text(`confidence ${sab}/${sa} = ${pct(conf)}    lift ${lift.toFixed(2)}`, 0.66, 0.28 + i * 0.22, { size: 12, mono: true, color: p.muted }); }); };
      return [
        { t: "Shopping baskets", dur: 1800, cap: "Eight shopping baskets. Question: which items are bought together often enough to act on (shelf placement, bundles, recommendations)?", draw(S, k) { baskets(); } },
        { t: "Count single items", dur: 2600, cap: `Count how many baskets contain each item: its support. Keep only items in at least ${MIN} of 8 baskets. Nappies and beer appear only twice, so they're dropped.`, draw(S, k) { baskets(); thr(items.length); barRows(items.map((i) => [i]), S.ease(k)); } },
        { t: "The Apriori shortcut", dur: 2600, cap: "Key idea: a pair can't be more common than either of its items. So any pair containing nappies or beer must be rare too, and is never even counted. On real data this skips millions of combinations.", draw(S, k) { baskets(); barRows([["nappies", "beer"], ["bread", "beer"], ["milk", "nappies"]], 0, { crossed: () => true }); S.alpha(S.ease(k), () => S.text("If an item set is rare, every bigger set containing it is rare.", 0.66, 0.6, { size: 13, max: 0.6 })); } },
        { t: "Count pairs of common items", dur: 3000, cap: (k) => `Build pairs only from the common items and count them. ${freq2.map((s) => s.join(" + ")).join(", ")} pass the minimum support; the others are dropped.`, draw(S, k) { const i = Math.min(pairs.length - 1, Math.floor(k * pairs.length)); baskets(pairs[i]); thr(pairs.length, 0.09); barRows(pairs, 1, { gap: 0.09 }); } },
        { t: "Grow to triples", dur: 2200, cap: `Only triples whose pairs are all common are candidates: bread + milk + butter. It's in ${sup(["bread", "milk", "butter"])} of 8 baskets, so it's a frequent item set too.`, draw(S, k) { baskets(["bread", "milk", "butter"]); thr(1); barRows(triples, S.ease(k)); } },
        { t: "Turn patterns into rules", dur: 3200, cap: `Rules come from the frequent sets. "butter → bread": every basket with butter also had bread, so confidence = 100%. Lift = ${(sup(["bread", "butter"]) / sup(["butter"]) / (sup(["bread"]) / 8)).toFixed(2)} means buying butter makes bread 1.33× more likely than usual. Lift above 1 = a real association; check it, because popular items get high confidence by default.`, draw(S, k) { baskets(["butter", "bread"]); rule(["butter"], ["bread"], 0, S.part(k, 0, 0.3)); rule(["bread", "milk"], ["butter"], 1, S.part(k, 0.35, 0.65)); rule(["bread"], ["milk"], 2, S.part(k, 0.7, 1)); } },
      ];
    },
  });

  /* ---------- Embeddings ---------- */
  A.story("emb", {
    how: "Watch words become numbers: each word gets a vector learned from the company it keeps, similar words land close together, directions carry meaning (king − man + woman ≈ queen), and search by meaning becomes a nearest-neighbour lookup.",
    note: "Positions are illustrative 2D placements. Real embeddings have hundreds or thousands of dimensions and are learned from data.",
    scenes(S) {
      const p = S.pal;
      const E = { cat: [0.72, 0.8, 2], kitten: [0.8, 0.86, 2], dog: [0.62, 0.84, 2], puppy: [0.68, 0.92, 2], king: [0.34, 0.36, 0], queen: [0.34, 0.6, 0], man: [0.14, 0.36, 0], woman: [0.14, 0.6, 0], apple: [0.84, 0.3, 3], banana: [0.9, 0.2, 3], mango: [0.94, 0.34, 3], car: [0.56, 0.12, 5], bus: [0.62, 0.06, 5], train: [0.5, 0.05, 5] };
      const words = Object.keys(E), r = A.seeded(13), vec = words.map(() => Array.from({ length: 8 }, () => r() * 2 - 1));
      const g = S.area(0.05, 0.06, 0.95, 0.94), P = (w) => E[w];
      const dist = (a, b) => Math.hypot(P(a)[0] - P(b)[0], P(a)[1] - P(b)[1]);
      const map = (o = {}) => words.forEach((w) => { const [x, y, c] = P(w), on = o.hl && o.hl.includes(w); S.alpha(o.dim && !on ? 0.35 : 1, () => { g.dot(x, y, on ? 8 : 6, p.groups[c], on ? S.hl : p.bg); g.text(w, x, y + 0.05, { size: 12 }); }); });
      return [
        { t: "Words are just text", dur: 2200, cap: "A model can't do maths on text. So every word is turned into a list of numbers, a vector. Here 8 numbers each; real models use hundreds or thousands.", draw(S, k) { words.slice(0, 7).forEach((w, i) => { S.text(w, 0.12, 0.14 + i * 0.11, { size: 13, align: "right" }); S.alpha(S.part(k, i / 9, i / 9 + 0.3), () => vec[i].forEach((v, j) => { S.rect(0.15 + j * 0.06, 0.115 + i * 0.11, 0.05, 0.05, S.tint(v > 0 ? p.a : p.b, 0.2 + 0.7 * Math.abs(v))); S.text(v.toFixed(1), 0.175 + j * 0.06, 0.14 + i * 0.11, { size: 9.5 }); })); }); } },
        { t: "Learned from context", dur: 2600, cap: "Where do the numbers come from? Training on huge amounts of text: words that appear in similar sentences get similar vectors. \"You shall know a word by the company it keeps.\"", draw(S, k) { [["The ___ chased the mouse.", "cat · dog · kitten"], ["I ate a ripe ___.", "apple · banana · mango"], ["The ___ wore a crown.", "king · queen"], ["We took the ___ to work.", "car · bus · train"]].forEach(([s, f], i) => S.alpha(S.part(k, i * 0.2, i * 0.2 + 0.3), () => { S.text(s, 0.3, 0.2 + i * 0.18, { size: 15, mono: true }); S.text(`→ ${f}`, 0.7, 0.2 + i * 0.18, { size: 14, color: p.accent, align: "left" }); })); } },
        { t: "Similar words land close", dur: 2600, cap: "Plot the vectors (squeezed to 2 dimensions so we can see them). Animals, royalty, fruit and vehicles form their own neighbourhoods. Nobody told the model these categories.", draw(S, k) { const e = S.ease(k); words.forEach((w, i) => { const [x, y, c] = P(w), sx = 0.05 + (i % 7) * 0.15, sy = i < 7 ? 0.1 : 0.2; g.dot(S.lerp(sx, x, e), S.lerp(sy, y, e), 6, p.groups[c], p.bg); g.text(w, S.lerp(sx, x, e), S.lerp(sy, y, e) + 0.05, { size: 12 }); }); } },
        { t: "Nearest neighbours", dur: 2400, cap: () => { const n = words.filter((w) => w !== "cat").sort((a, b) => dist("cat", a) - dist("cat", b)).slice(0, 3); return `Similarity = closeness (in practice, cosine similarity: the angle between vectors). The nearest words to "cat" are ${n.join(", ")}. This is how "similar items" and semantic search work.`; }, draw(S, k) { const n = words.filter((w) => w !== "cat").sort((a, b) => dist("cat", a) - dist("cat", b)).slice(0, 3); map({ hl: ["cat", ...n], dim: true }); n.forEach((w, i) => S.alpha(S.part(k, i * 0.25, i * 0.25 + 0.4), () => g.line(P("cat")[0], P("cat")[1], P(w)[0], P(w)[1], S.hl, 2, [4, 3]))); } },
        { t: "Directions carry meaning", dur: 3200, cap: "Directions mean something too. The arrow from man to woman is about the same as from king to queen. So king − man + woman lands right next to queen: the model has learned a \"gender\" direction without being told.", draw(S, k) { map({ hl: ["man", "woman", "king", "queen"], dim: true }); const [mx, my] = P("man"), [wx, wy] = P("woman"), [kx, ky] = P("king"); S.alpha(S.part(k, 0, 0.3), () => S.arrow(g.u(mx), g.v(my), g.u(wx), g.v(wy - 0.03), S.hl, 3)); const t = S.ease(S.part(k, 0.35, 0.9)); if (t > 0) { S.arrow(g.u(kx), g.v(ky), g.u(kx + (wx - mx) * t), g.v(ky + (wy - my) * t - 0.03 * t), S.hl, 3); } S.alpha(S.part(k, 0.9, 1), () => S.text("king − man + woman ≈ queen", 0.5, 0.97, { size: 15 })); } },
        { t: "Search by meaning (RAG)", dur: 3000, cap: "Search by meaning: embed the question \"food for a young cat\", then find the nearest stored vectors: kitten, cat. Retrieval-augmented generation (RAG) does exactly this with chunks of your documents, then hands the closest chunks to the language model.", draw(S, k) { const q = [0.8, 0.72]; const near = words.slice().sort((a, b) => Math.hypot(P(a)[0] - q[0], P(a)[1] - q[1]) - Math.hypot(P(b)[0] - q[0], P(b)[1] - q[1])).slice(0, 2); map({ hl: near, dim: k > 0.4 }); S.alpha(S.part(k, 0, 0.3), () => { g.dot(q[0], q[1], 8, S.hl, p.fg); g.text("\"food for a young cat\"", q[0] - 0.08, q[1] - 0.05, { size: 12, color: S.hl }); }); S.alpha(S.part(k, 0.4, 0.7), () => { S.ring(g.u(q[0]), g.v(q[1]), S.x(0.09), S.hl, 2); near.forEach((w) => g.line(q[0], q[1], P(w)[0], P(w)[1], S.hl, 2, [4, 3])); }); } },
      ];
    },
  });
})();
