// Algorithms map: "Watch it work" walkthroughs for the supervised must-know algorithms.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A || !A.story) return;
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const f2 = (v) => v.toFixed(2), pct = (v) => Math.round(v * 100) + "%";

  /* ---------- Linear regression ---------- */
  A.story("linreg", {
    how: "Watch linear regression find its line: start with a guess, measure every miss, square the misses, and let gradient descent nudge the slope and intercept until the total squared error is as small as it can be.",
    scenes(S) {
      const p = S.pal, r = A.seeded(3), pts = [];
      for (let i = 0; i < 11; i++) { const x = 0.06 + (0.88 * i) / 10 + (r() - 0.5) * 0.05; pts.push({ x, y: Math.max(0.04, Math.min(0.96, 0.14 + 0.66 * x + A.sgauss(r) * 0.07)) }); }
      const mse = (a, b) => pts.reduce((s, q) => s + (q.y - (a + b * q.x)) ** 2, 0) / pts.length;
      const traj = [[0.5, 0]]; for (let i = 0; i < 160; i++) { const [a, b] = traj[traj.length - 1]; let ga = 0, gb = 0; pts.forEach((q) => { const e = a + b * q.x - q.y; ga += (2 * e) / pts.length; gb += (2 * e * q.x) / pts.length; }); traj.push([a - 0.6 * ga, b - 0.6 * gb]); }
      const [A0, B0] = traj[traj.length - 1], m0 = mse(0.5, 0), mEnd = mse(A0, B0);
      const g = S.area(0.07, 0.1, 0.6, 0.88);
      const size = (x) => Math.round(50 + 200 * x), price = (y) => Math.round(100 + 500 * y);
      const base = (n = pts.length) => { g.frame("size (m²) →", "↑ price ($k)"); pts.slice(0, n).forEach((q) => g.dot(q.x, q.y, 5.5, p.a, p.bg)); };
      const fline = (a, b, col = p.fg, lw = 3) => g.line(0, a, 1, a + b, col, lw);
      const resid = (a, b, k = 1) => pts.forEach((q) => { const yh = a + b * q.x; g.line(q.x, yh, q.x, S.lerp(yh, q.y, k), p.bad, 2, [4, 3]); });
      const squares = (a, b, al) => S.alpha(al, () => pts.forEach((q) => { const e = q.y - (a + b * q.x), s = Math.abs(g.Y(0) - g.Y(Math.abs(e))); S.ctx.fillStyle = S.tint(p.bad, 0.18); S.ctx.fillRect(g.X(q.x), Math.min(g.Y(q.y), g.Y(a + b * q.x)), s, s); }));
      const side = (lines) => lines.forEach(([t, o], i) => S.text(t, 0.66, 0.17 + i * 0.075, Object.assign({ align: "left", size: 13 }, o)));
      const errChart = (n) => { const e = S.area(0.66, 0.5, 0.97, 0.86); e.frame("steps →", "error (MSE)"); e.path(traj.slice(0, n + 1).map(([a, b], i) => [i / (traj.length - 1), mse(a, b) / m0]), S.hl, 2.5); };
      return [
        { t: "The data", dur: 1800, cap: "Each dot is a house: its size along the bottom and its price up the side. Bigger houses tend to cost more. Goal: one straight line that predicts the price from the size.", draw(S, k) { base(Math.ceil(k * pts.length)); } },
        { t: "A first guess", dur: 1400, cap: "Start with any line. Here: a flat guess that every house costs the same. It's clearly wrong, so let's measure how wrong.", draw(S, k) { base(); S.alpha(k, () => fline(0.5, 0)); side([["price = 0.50 + 0.00 × size", { mono: true }]]); } },
        { t: "Measure the misses", dur: 2000, cap: "Each red dashed line is an error (a residual): the gap between the real price and what the line predicts.", draw(S, k) { base(); fline(0.5, 0); resid(0.5, 0, S.ease(k)); } },
        { t: "Square the misses", dur: 2200, cap: `Square every error and average them: that's the mean squared error (MSE), here ${m0.toFixed(3)}. Squaring makes all errors positive and makes big misses count much more, which is why one outlier can drag the line.`, draw(S, k) { base(); fline(0.5, 0); resid(0.5, 0); squares(0.5, 0, k); side([["MSE = average of (error)²", { mono: true }], [`= ${(m0 * S.ease(k)).toFixed(3)}`, { mono: true, size: 16, color: p.bad }]]); } },
        { t: "Gradient descent", dur: 6000, cap: (k) => { const i = Math.floor(S.ease(k) * (traj.length - 1)), [a, b] = traj[i]; return `Step ${i}: intercept ${f2(a)}, slope ${f2(b)}, error ${mse(a, b).toFixed(4)}. Each step asks "which small change to the slope and intercept lowers the error?" and takes it. The squares shrink as the line turns.`; }, draw(S, k) { const i = Math.floor(S.ease(k) * (traj.length - 1)), [a, b] = traj[i]; base(); squares(a, b, 1); resid(a, b); fline(a, b, S.hl); side([[`step ${i}`, { color: p.muted }], [`MSE = ${mse(a, b).toFixed(4)}`, { mono: true }]]); errChart(i); } },
        { t: "The best line", dur: 1600, cap: `Gradient descent settles on the least-squares line: the one with the smallest possible total squared error (${mEnd.toFixed(4)}). The slope has a meaning: every extra 10 m² adds about $${Math.round(((B0 * 500) / 200) * 10)}k to the price.`, draw(S, k) { base(); resid(A0, B0); fline(A0, B0, S.hl, 3.5); side([["price = intercept + slope × size", { size: 12, color: p.muted }], [`= ${f2(A0)} + ${f2(B0)} × size`, { mono: true, size: 15 }], [`+$${Math.round(((B0 * 500) / 200) * 10)}k per extra 10 m²`, { color: p.good }]]); errChart(traj.length - 1); } },
        { t: "Predict a new house", dur: 2600, cap: `A new house of ${size(0.72)} m²: go up from its size to the line, then across to read the price: about $${price(A0 + B0 * 0.72)}k. That's the whole model: two numbers.`, draw(S, k) { base(); fline(A0, B0, S.hl, 3.5); const yh = A0 + B0 * 0.72, a1 = S.part(k, 0, 0.5), a2 = S.part(k, 0.5, 1); g.line(0.72, 0, 0.72, S.lerp(0, yh, a1), p.fg, 2, [5, 4]); if (a2 > 0) g.line(0.72, yh, S.lerp(0.72, 0, a2), yh, p.fg, 2, [5, 4]); g.dot(0.72, 0, 6, S.hl); if (a2 >= 1) { g.dot(0, yh, 6, S.hl); side([[`size ${size(0.72)} m²  →  price ≈ $${price(yh)}k`, { size: 14 }]]); } } },
      ];
    },
  });

  /* ---------- Logistic regression ---------- */
  A.story("logreg", {
    how: "Watch logistic regression turn hours of study into a chance of passing: why a straight line fails, how the sigmoid squashes a score into a probability, how training fits the S-curve, and where the decision boundary falls.",
    scenes(S) {
      const p = S.pal, r = A.seeded(11), pts = [];
      for (let i = 0; i < 22; i++) { const x = 0.04 + 0.92 * r(); pts.push({ x, c: r() < sig(11 * (x - 0.52)) ? 1 : 0 }); }
      // Least-squares line on the 0/1 labels, for the "why not a line" scene
      const mx = pts.reduce((s, q) => s + q.x, 0) / pts.length, my = pts.reduce((s, q) => s + q.c, 0) / pts.length;
      const lb = pts.reduce((s, q) => s + (q.x - mx) * (q.c - my), 0) / pts.reduce((s, q) => s + (q.x - mx) ** 2, 0), la = my - lb * mx;
      const loss = (w, b) => -pts.reduce((s, q) => { const pr = Math.min(1 - 1e-9, Math.max(1e-9, sig(w * q.x + b))); return s + (q.c ? Math.log(pr) : Math.log(1 - pr)); }, 0) / pts.length;
      const traj = [[0, 0]]; for (let i = 0; i < 1500; i++) { const [w, b] = traj[traj.length - 1]; let gw = 0, gb = 0; pts.forEach((q) => { const e = sig(w * q.x + b) - q.c; gw += e * q.x; gb += e; }); traj.push([w - (3 * gw) / pts.length, b - (3 * gb) / pts.length]); }
      const [W, B] = traj[traj.length - 1], hstar = -B / W;
      const g = S.area(0.08, 0.12, 0.93, 0.84), hrs = (x) => (x * 10).toFixed(1);
      const base = (n = pts.length) => { g.frame("hours studied →", "↑ chance of passing"); g.text("100%", -0.04, 1, { size: 10, color: p.muted }); g.text("0%", -0.03, 0, { size: 10, color: p.muted }); g.line(0, 1, 1, 1, p.line, 1, [3, 3]); pts.slice(0, n).forEach((q) => g.dot(q.x, q.c ? 0.97 : 0.03, 5.5, q.c ? p.a : p.b, p.bg)); };
      const curve = (w, b, col = S.hl, lw = 3) => g.path(Array.from({ length: 81 }, (_, i) => [i / 80, sig(w * (i / 80) + b)]), col, lw);
      return [
        { t: "The data", dur: 1800, cap: "Each dot is a student: hours studied along the bottom. Top row = passed, bottom row = failed. More study → more passes, but it's not a clean cut. We want the chance of passing for any number of hours.", draw(S, k) { base(Math.ceil(k * pts.length)); } },
        { t: "Why not a straight line?", dur: 2000, cap: "Linear regression would draw a straight line through these 0s and 1s. It soon predicts below 0% and above 100%, which aren't probabilities. We need a curve that always stays between 0 and 1.", draw(S, k) { base(); S.alpha(k, () => { g.path([[0, la], [1, la + lb]], p.muted, 2.5); [[0, la], [1, la + lb]].forEach(([x, y]) => { if (y < 0 || y > 1) g.dot(x, Math.max(-0.08, Math.min(1.08, y)), 7, p.bad); }); }); } },
        { t: "The sigmoid squash", dur: 2600, cap: "Logistic regression still computes a straight-line score: w × hours + b. Then the sigmoid squashes the score into 0–1: very negative scores → near 0%, very positive → near 100%, a score of 0 → exactly 50%.", draw(S, k) { base(); const e = S.ease(k); g.path(Array.from({ length: 81 }, (_, i) => { const x = i / 80; return [x, S.lerp(Math.max(-0.1, Math.min(1.1, la + lb * x)), sig(W * x + B), e)]; }), S.hl, 3); S.text("p = 1 / (1 + e^−(w·hours + b))", 0.5, 0.94, { mono: true, size: 12, color: p.muted }); } },
        { t: "Training", dur: 6000, cap: (k) => { const i = Math.floor(S.ease(k) * (traj.length - 1)), [w, b] = traj[i]; return `Step ${i}: log loss ${loss(w, b).toFixed(3)}. Gradient descent tilts and slides the curve so passers get high probabilities and failers low ones. Log loss punishes confident mistakes hardest.`; }, draw(S, k) { const i = Math.floor(S.ease(k) * (traj.length - 1)), [w, b] = traj[i]; base(); pts.forEach((q) => g.line(q.x, q.c ? 0.97 : 0.03, q.x, sig(w * q.x + b), S.tint(p.bad, 0.5), 1.5, [3, 3])); curve(w, b); S.text(`w = ${f2(w)}   b = ${f2(b)}   log loss = ${loss(w, b).toFixed(3)}`, 0.5, 0.94, { mono: true, size: 12 }); } },
        { t: "Read the probabilities", dur: 2600, cap: `Now read off the chance of passing: ${hrs(0.3)} h of study → ${pct(sig(W * 0.3 + B))}; ${hrs(0.7)} h → ${pct(sig(W * 0.7 + B))}. Unlike many classifiers, logistic regression gives a probability, not just a yes/no.`, draw(S, k) { base(); curve(W, B); [0.3, 0.7].forEach((x, j) => { const a = S.part(k, j * 0.4, j * 0.4 + 0.5), y = sig(W * x + B); if (!a) return; g.line(x, 0, x, S.lerp(0, y, a), p.fg, 2, [5, 4]); if (a >= 1) { g.line(x, y, 0, y, p.fg, 1.5, [5, 4]); g.dot(x, y, 6, S.hl); g.text(pct(y), x + 0.05, y, { size: 13 }); } }); } },
        { t: "The decision boundary", dur: 2200, cap: `With a 50% threshold the boundary sits at ${hrs(hstar)} hours: predict FAIL to the left, PASS to the right. With two or more inputs the boundary becomes a straight line (or flat plane). Lower the threshold to catch more positives at the cost of more false alarms.`, draw(S, k) { S.alpha(S.ease(k) * 0.9, () => { S.ctx.fillStyle = S.tint(p.b, 0.12); S.ctx.fillRect(g.X(0), g.Y(1), g.X(hstar) - g.X(0), g.Y(0) - g.Y(1)); S.ctx.fillStyle = S.tint(p.a, 0.12); S.ctx.fillRect(g.X(hstar), g.Y(1), g.X(1) - g.X(hstar), g.Y(0) - g.Y(1)); }); base(); curve(W, B); g.line(0, 0.5, 1, 0.5, p.muted, 1.5, [4, 4]); g.line(hstar, 0, hstar, 1, p.fg, 2.5); g.text("FAIL", hstar / 2, 0.5, { size: 14, color: p.b }); g.text("PASS", (1 + hstar) / 2, 0.5, { size: 14, color: p.a }); } },
      ];
    },
  });

  /* ---------- Gradient boosting ---------- */
  A.story("boost", {
    how: "Watch gradient boosting build a model from many tiny trees: start from the average, look at what's still wrong, fit a one-question tree to those leftovers, add a fraction of it, and repeat. Then see why you stop at the right moment.",
    scenes(S) {
      const p = S.pal, r = A.seeded(21), mk = (n) => Array.from({ length: n }, () => { const x = 0.02 + 0.96 * r(); return { x, y: 0.5 + 0.28 * Math.sin(2 * Math.PI * 1.1 * x) + A.sgauss(r) * 0.06 }; }).sort((a, b) => a.x - b.x);
      const tr = mk(40), va = mk(60), LR = 0.3, R = 80;
      function stump(res) {
        let best = null;
        for (let i = 1; i < tr.length; i++) { const t = (tr[i - 1].x + tr[i].x) / 2, L = res.slice(0, i), Rr = res.slice(i), ml = L.reduce((s, v) => s + v, 0) / L.length, mr = Rr.reduce((s, v) => s + v, 0) / Rr.length; const sse = L.reduce((s, v) => s + (v - ml) ** 2, 0) + Rr.reduce((s, v) => s + (v - mr) ** 2, 0); if (!best || sse < best.sse) best = { t, ml, mr, sse }; }
        return best;
      }
      const avg = tr.reduce((s, q) => s + q.y, 0) / tr.length, stumps = [], predAt = (x, n) => stumps.slice(0, n).reduce((s, st) => s + LR * (x < st.t ? st.ml : st.mr), avg);
      for (let m = 0; m < R; m++) stumps.push(stump(tr.map((q) => q.y - predAt(q.x, m))));
      const err = (set, n) => set.reduce((s, q) => s + (q.y - predAt(q.x, n)) ** 2, 0) / set.length;
      const trE = Array.from({ length: R + 1 }, (_, n) => err(tr, n)), vaE = Array.from({ length: R + 1 }, (_, n) => err(va, n)), best = vaE.indexOf(Math.min(...vaE)), eMax = Math.max(...trE, ...vaE);
      const top = S.area(0.06, 0.1, 0.64, 0.56), bot = S.area(0.06, 0.66, 0.64, 0.95), ec = S.area(0.7, 0.18, 0.98, 0.7);
      const xs = Array.from({ length: 101 }, (_, i) => i / 100);
      const data = () => { top.frame("x →", "↑ y"); tr.forEach((q) => top.dot(q.x, q.y, 4.5, p.a, p.bg)); };
      const model = (n, col = S.hl) => top.path(xs.map((x) => [x, predAt(x, n)]), col, 3);
      const resBars = (n) => { bot.frame(null, "what's still wrong (residuals)"); bot.line(0, 0.5, 1, 0.5, p.muted, 1); tr.forEach((q) => bot.line(q.x, 0.5, q.x, 0.5 + (q.y - predAt(q.x, n)) * 1.4, p.bad, 3)); };
      const errChart = (n, showBest) => { ec.frame("rounds →", "error"); ec.path(trE.slice(0, n + 1).map((e, i) => [i / R, e / eMax]), p.a, 2.5); ec.path(vaE.slice(0, n + 1).map((e, i) => [i / R, e / eMax]), p.b, 2.5); S.text("— training data", 0.72, 0.78, { align: "left", size: 11, color: p.a }); S.text("— new (validation) data", 0.72, 0.84, { align: "left", size: 11, color: p.b }); if (showBest) { ec.line(best / R, 0, best / R, 1, S.hl, 2, [4, 3]); ec.text(`best: round ${best}`, best / R, 1.06, { size: 11, color: S.hl }); } };
      return [
        { t: "The data", dur: 1600, cap: "We want to predict y from x. The true pattern is a wave, plus some random noise that no model should chase.", draw(S, k) { top.frame("x →", "↑ y"); tr.slice(0, Math.ceil(k * tr.length)).forEach((q) => top.dot(q.x, q.y, 4.5, p.a, p.bg)); } },
        { t: "Round 0: the average", dur: 1800, cap: `Boosting starts with the simplest possible model: predict the average (${f2(avg)}) for everyone. The bars underneath show what's still wrong for each point: the residuals.`, draw(S, k) { data(); S.alpha(k, () => { model(0); resBars(0); }); } },
        { t: "Fit a tiny tree to the errors", dur: 2200, cap: `Now train a tiny tree (just one question: "is x below ${f2(stumps[0].t)}?") to predict those residuals, not y itself. It learns: left side is too low by about ${f2(stumps[0].ml)}, right side too high by ${f2(-stumps[0].mr)}.`, draw(S, k) { data(); model(0); resBars(0); const s = stumps[0]; S.alpha(S.ease(k), () => { bot.line(0, 0.5 + s.ml * 1.4, s.t, 0.5 + s.ml * 1.4, S.hl, 3.5); bot.line(s.t, 0.5 + s.ml * 1.4, s.t, 0.5 + s.mr * 1.4, S.hl, 3.5); bot.line(s.t, 0.5 + s.mr * 1.4, 1, 0.5 + s.mr * 1.4, S.hl, 3.5); }); } },
        { t: "Add a small step of it", dur: 2200, cap: `Add the tiny tree's answer to the model, but only ${LR * 100}% of it (the learning rate). The model moves part of the way towards the data, and every residual shrinks a little.`, draw(S, k) { data(); top.path(xs.map((x) => [x, S.lerp(predAt(x, 0), predAt(x, 1), S.ease(k))]), S.hl, 3); resBars(k > 0.5 ? 1 : 0); } },
        { t: "Repeat, round after round", dur: 7000, cap: (k) => { const n = Math.round(S.ease(k) * R); return `Round ${n}: each new tiny tree fixes part of what the team still gets wrong. Training error ${trE[n].toFixed(4)}, error on new data ${vaE[n].toFixed(4)}. Many weak learners add up to a strong one.`; }, draw(S, k) { const n = Math.round(S.ease(k) * R); data(); model(n); resBars(n); errChart(n); } },
        { t: "Stop at the right time", dur: 2400, cap: `Training error keeps falling forever, but error on new data stops improving around round ${best}: after that the trees start fitting noise. Real libraries (XGBoost, LightGBM, CatBoost) watch a validation set and stop automatically. That's early stopping.`, draw(S, k) { data(); model(best); resBars(best); errChart(R, k > 0.2); } },
      ];
    },
  });

  /* ---------- Naive Bayes ---------- */
  A.story("nb", {
    how: "Watch Naive Bayes decide whether an email is spam: count words in training emails, start from how common spam is, let each word in the new email push the odds one way or the other, and add the pushes up.",
    scenes(S) {
      const p = S.pal;
      const W = [["free", 5, 1], ["prize", 4, 0], ["win", 4, 1], ["meeting", 0, 4], ["lunch", 1, 3], ["report", 0, 4]], N = 6;
      const lik = (c) => (c + 1) / (N + 2); // add-one smoothing
      const email = ["free", "lunch", "prize"], steps = [0];
      email.forEach((w) => { const [, s, n] = W.find((x) => x[0] === w); steps.push(steps[steps.length - 1] + Math.log(lik(s) / lik(n))); });
      const table = (hl, k = 1) => {
        S.text("word", 0.08, 0.17, { size: 11, color: p.muted, align: "left" }); S.text(`in spam (of ${N})`, 0.3, 0.17, { size: 11, color: p.bad }); S.text(`in normal (of ${N})`, 0.48, 0.17, { size: 11, color: p.good });
        W.forEach(([w, s, n], i) => { const v = 0.25 + i * 0.085, on = hl === w;
          if (on) S.rect(0.06, v - 0.035, 0.52, 0.07, S.tint(S.hl, 0.15), S.hl, 2);
          S.text(w, 0.08, v, { align: "left", size: 13 });
          S.rect(0.22, v - 0.02, (0.14 * s * k) / N, 0.04, p.bad); S.text(Math.round(s * k), 0.385, v, { size: 12 });
          S.rect(0.41, v - 0.02, (0.14 * n * k) / N, 0.04, p.good); S.text(Math.round(n * k), 0.575, v, { size: 12 }); });
      };
      const meter = (lo, extra) => {
        const u0 = 0.64, u1 = 0.97, pos = (z) => u0 + ((Math.max(-4, Math.min(4, z)) + 4) / 8) * (u1 - u0), v = 0.62;
        S.rect(u0, v - 0.025, (u1 - u0) / 2, 0.05, S.tint(p.good, 0.25)); S.rect((u0 + u1) / 2, v - 0.025, (u1 - u0) / 2, 0.05, S.tint(p.bad, 0.25));
        S.text("← normal", u0, v + 0.07, { size: 11, color: p.good, align: "left" }); S.text("spam →", u1, v + 0.07, { size: 11, color: p.bad, align: "right" });
        S.line(pos(lo), v - 0.06, pos(lo), v + 0.04, p.fg, 3); S.dot(pos(lo), v - 0.07, 6, S.hl);
        S.text(`chance of spam: ${pct(sig(lo))}`, (u0 + u1) / 2, v - 0.14, { size: 15 });
        if (extra) S.text(extra, (u0 + u1) / 2, v + 0.16, { size: 12, color: p.muted, max: 0.33 });
      };
      const mail = (upto) => { S.text("New email:", 0.64, 0.17, { size: 11, color: p.muted, align: "left" }); email.forEach((w, i) => S.box(0.69 + i * 0.1, 0.25, 0.09, 0.07, w, { stroke: i < upto ? S.hl : p.line, lw: i < upto ? 2.5 : 1.5 })); };
      const wordScene = (i) => { const w = email[i], [, s, n] = W.find((x) => x[0] === w), ratio = lik(s) / lik(n);
        return { t: `Word ${i + 1}: "${w}"`, dur: 2200, cap: `"${w}" appeared in ${s} of ${N} spam and ${n} of ${N} normal emails. With add-one smoothing that's ${s + 1}/${N + 2} vs ${n + 1}/${N + 2}, so "${w}" is ${ratio >= 1 ? f2(ratio) + "× more likely in spam" : f2(1 / ratio) + "× more likely in normal email"}. The needle moves ${ratio >= 1 ? "towards spam" : "towards normal"}.${n === 0 ? ` Without smoothing, 0 normal emails would make the chance exactly 100% spam from one word.` : ""}`,
          draw(S, k) { table(w); mail(i + 1); meter(S.lerp(steps[i], steps[i + 1], S.ease(k)), `${w}: × ${f2(ratio)} on the odds`); } }; };
      return [
        { t: "Training emails", dur: 1800, cap: `Training data: ${N} emails labelled spam and ${N} labelled normal. Naive Bayes doesn't need a training loop; it just counts.`, draw(S, k) { for (let i = 0; i < 12; i++) S.alpha(S.part(k, i / 14, i / 14 + 0.2), () => S.box(0.1 + (i % 6) * 0.14, i < 6 ? 0.35 : 0.65, 0.11, 0.18, i < 6 ? "SPAM" : "normal", { stroke: i < 6 ? p.bad : p.good, color: i < 6 ? p.bad : p.good, lw: 2.5 })); } },
        { t: "Count the words", dur: 2400, cap: "For each word, count how many spam emails and how many normal emails contain it. These counts are the whole model.", draw(S, k) { table(null, S.ease(k)); } },
        { t: "Start from the prior", dur: 1800, cap: "Before reading the new email: half the training emails were spam, so start at 50%. This starting belief is the prior.", draw(S, k) { table(); mail(0); meter(0, "prior: 6 of 12 emails were spam"); } },
        wordScene(0), wordScene(1), wordScene(2),
        { t: "The verdict", dur: 2400, cap: `Add up all the pushes (Naive Bayes adds the logs of these ratios) and turn the total back into a probability: ${pct(sig(steps[3]))} spam, so it's classified as spam. "Naive" because it treats each word as independent evidence, which isn't really true, but works remarkably well.`, draw(S, k) { table(); mail(3); meter(steps[3], "P(spam | words) ∝ P(spam) × P(free|spam) × P(lunch|spam) × P(prize|spam)"); } },
      ];
    },
  });

  /* ---------- Neural network ---------- */
  A.story("nn", {
    how: "Watch a neural network learn: one neuron's weighted sum and activation, a forward pass through layers, measuring the loss, backpropagation sending blame backwards, a weight update, and then thousands of repeats bending the boundary into a circle.",
    scenes(S) {
      const p = S.pal, r = A.seeded(5), data = [];
      for (let i = 0; i < 90; i++) { const x = r(), y = r(); data.push({ x, y, c: Math.hypot(x - 0.5, y - 0.5) < 0.28 ? 1 : 0 }); }
      // Train a real 2-8-1 network (tanh hidden, sigmoid output) and keep snapshots of its predictions
      const H = 8; let w1 = Array.from({ length: H }, () => [A.sgauss(r), A.sgauss(r)]), b1 = Array.from({ length: H }, () => A.sgauss(r) * 0.5), w2 = Array.from({ length: H }, () => A.sgauss(r) * 0.5), b2 = 0;
      const fwd = (x, y) => { const h = w1.map(([a, b], j) => Math.tanh(a * (x - 0.5) * 4 + b * (y - 0.5) * 4 + b1[j])); return { h, o: sig(h.reduce((s, v, j) => s + v * w2[j], b2)) }; };
      const G = 26, snap = () => Array.from({ length: G * G }, (_, k) => fwd(((k % G) + 0.5) / G, 1 - (Math.floor(k / G) + 0.5) / G).o);
      const acc = () => data.filter((q) => (fwd(q.x, q.y).o >= 0.5 ? 1 : 0) === q.c).length / data.length;
      const marks = [0, 30, 120, 400, 1500], snaps = [];
      for (let ep = 0; ep <= 1500; ep++) {
        if (marks.includes(ep)) snaps.push({ ep, grid: snap(), acc: acc() });
        const gw1 = w1.map(() => [0, 0]), gb1 = new Array(H).fill(0), gw2 = new Array(H).fill(0); let gb2 = 0;
        data.forEach((q) => { const { h, o } = fwd(q.x, q.y), d = o - q.c; gb2 += d; h.forEach((hv, j) => { gw2[j] += d * hv; const dh = d * w2[j] * (1 - hv * hv); gw1[j][0] += dh * (q.x - 0.5) * 4; gw1[j][1] += dh * (q.y - 0.5) * 4; gb1[j] += dh; }); });
        const lr = 0.6 / data.length; w1 = w1.map(([a, b], j) => [a - lr * gw1[j][0], b - lr * gw1[j][1]]); b1 = b1.map((v, j) => v - lr * gb1[j]); w2 = w2.map((v, j) => v - lr * gw2[j]); b2 -= lr * gb2;
      }
      // Network diagram: 2 inputs → 4 hidden → 1 output (illustrative numbers)
      const L = [[0.14, [0.35, 0.65]], [0.42, [0.2, 0.4, 0.6, 0.8]], [0.7, [0.5]]];
      const nodes = L.map(([u, vs]) => vs.map((v) => [u, v])), edges = [];
      nodes[0].forEach((a, i) => nodes[1].forEach((b, j) => edges.push({ a, b, w: [0.9, -0.7, 0.4, -1.1, 0.6, 1.2, -0.5, 0.8][i * 4 + j], l: 0 })));
      nodes[1].forEach((a, j) => edges.push({ a, b: nodes[2][0], w: [1.1, -0.9, 0.7, -0.6][j], l: 1 }));
      const net = (o = {}) => {
        edges.forEach((e) => { const w = o.w ? o.w(e) : e.w; S.line(e.a[0], e.a[1], e.b[0], e.b[1], w > 0 ? S.tint(p.a, 0.7) : S.tint(p.b, 0.7), 1 + Math.abs(w) * 3); });
        if (o.pulse != null) edges.forEach((e) => { const t = o.back ? 1 - o.pulse(e) : o.pulse(e); if (t > 0 && t < 1) S.dot(S.lerp(e.a[0], e.b[0], t), S.lerp(e.a[1], e.b[1], t), 5, o.back ? p.bad : S.hl); });
        nodes.forEach((col, li) => col.forEach(([u, v], j) => { const act = o.act ? o.act(li, j) : null; S.dot(u, v, 17, act == null ? p.bg : S.tint(S.hl, 0.2 + 0.8 * act), p.fg); if (act != null) S.text(f2(act), u, v, { size: 10 }); }));
        S.text("inputs", 0.14, 0.94, { size: 11, color: p.muted }); S.text("hidden layer", 0.42, 0.94, { size: 11, color: p.muted }); S.text("output", 0.7, 0.94, { size: 11, color: p.muted });
      };
      const ACT = [[0.8, 0.3], [0.71, 0.12, 0.55, 0.0], [0.62]];
      const side = (lines) => lines.forEach(([t, o], i) => S.text(t, 0.79, 0.25 + i * 0.08, Object.assign({ align: "left", size: 12.5, max: 0.2 }, o)));
      const boundary = (s) => { const g = S.area(0.08, 0.1, 0.52, 0.92), cw = (g.X(1) - g.X(0)) / G, ch = (g.Y(0) - g.Y(1)) / G; s.grid.forEach((v, k) => { S.ctx.fillStyle = S.tint(v >= 0.5 ? p.a : p.b, 0.08 + 0.35 * Math.abs(2 * v - 1)); S.ctx.fillRect(g.X(0) + (k % G) * cw, g.Y(1) + Math.floor(k / G) * ch, cw + 0.5, ch + 0.5); }); data.forEach((q) => g.dot(q.x, q.y, 4, q.c ? p.a : p.b, p.bg)); };
      return [
        { t: "One neuron", dur: 2600, cap: "A single neuron: multiply each input by its weight, add them up with a bias, then pass the total through an activation function. Here 0.8 × 1.5 + 0.3 × (−2.0) + 0.1 = 0.70, and ReLU keeps positive values: output 0.70.", draw(S, k) {
          const ins = [[0.12, 0.35, "0.8", "× 1.5"], [0.12, 0.65, "0.3", "× −2.0"]];
          ins.forEach(([u, v, x, w], i) => { S.dot(u, v, 18, p.bg, p.fg); S.text(x, u, v); S.arrow(u + 0.03, v, 0.4, 0.5, i ? p.b : p.a, 2.5); S.text(w, S.lerp(u, 0.4, 0.5), S.lerp(v, 0.5, 0.5) - 0.05, { size: 12 }); if (k < 1) S.dot(S.lerp(u + 0.03, 0.4, S.part(k, 0, 0.4)), S.lerp(v, 0.5, S.part(k, 0, 0.4)), 5, S.hl); });
          S.dot(0.45, 0.5, 26, S.tint(S.hl, 0.25 * S.part(k, 0.4, 0.6) + 0.05), p.fg); S.text("Σ + b", 0.45, 0.5, { size: 12 });
          S.arrow(0.49, 0.5, 0.6, 0.5, p.fg, 2); S.box(0.66, 0.5, 0.1, 0.12, "ReLU", { sub: "max(0, z)" }); S.arrow(0.71, 0.5, 0.8, 0.5, p.fg, 2);
          S.alpha(S.part(k, 0.5, 0.8), () => S.text("z = 1.20 − 0.60 + 0.10 = 0.70", 0.45, 0.72, { mono: true, size: 12 })); S.alpha(S.part(k, 0.8, 1), () => { S.dot(0.86, 0.5, 18, S.tint(S.hl, 0.6), p.fg); S.text("0.70", 0.86, 0.5); }); } },
        { t: "Layers of neurons", dur: 1800, cap: "Connect many neurons in layers. Every line is a weight: teal = positive, red = negative, thicker = stronger. Inputs go in on the left, the prediction comes out on the right.", draw(S, k) { S.alpha(S.ease(k), () => net()); } },
        { t: "Forward pass", dur: 2600, cap: "Forward pass: one example (x = 0.8, y = 0.3) flows through. Each hidden neuron computes its weighted sum and activation, then the output neuron combines them: the network says 0.62, a 62% chance of class \"inside the circle\".", draw(S, k) { net({ pulse: (e) => S.part(k, e.l * 0.45, e.l * 0.45 + 0.45), act: (li, j) => (S.part(k, li * 0.45, li * 0.45 + 0.1) > 0 || li === 0 ? ACT[li][j] : null) }); } },
        { t: "Measure the loss", dur: 2000, cap: "The right answer for this example was 1 (inside). The network said 0.62. The loss measures the mistake: −log(0.62) = 0.48. A perfect answer would have loss 0.", draw(S, k) { net({ act: (li, j) => ACT[li][j] }); side([["prediction: 0.62"], ["true answer: 1"], [`loss = −log(0.62) = ${(-Math.log(0.62)).toFixed(2)}`, { color: p.bad, mono: true }]].slice(0, 1 + Math.floor(k * 2.99))); } },
        { t: "Backpropagation", dur: 2600, cap: "Backpropagation sends the blame backwards. Using the chain rule, it works out how much each weight contributed to the error: the gradient. Weights that pushed the answer the wrong way get the most blame.", draw(S, k) { net({ act: (li, j) => ACT[li][j], back: true, pulse: (e) => S.part(k, (1 - e.l) * 0.45, (1 - e.l) * 0.45 + 0.45) }); side([["error flows output → input", { color: p.bad }], ["∂loss/∂w for every weight", { mono: true }]]); } },
        { t: "Update the weights", dur: 2200, cap: "Gradient descent: every weight takes a small step in the direction that lowers the loss (new w = w − learning rate × gradient). Watch the lines change thickness. That's one tiny bit of learning.", draw(S, k) { const e = S.ease(k); net({ w: (ed) => ed.w + e * 0.35 * (ed.l ? 1 : Math.sign(ed.w) * 0.6) }); side([["w ← w − η × ∂loss/∂w", { mono: true }]]); } },
        { t: "Repeat thousands of times", dur: 6000, cap: (k) => { const s = snaps[Math.min(snaps.length - 1, Math.floor(k * snaps.length))]; return `After ${s.ep} passes over the data (epochs): ${pct(s.acc)} correct. This is a real network training in your browser. At first its guess is random; as the weights adjust, its boundary bends into a circle no straight line could draw.`; }, draw(S, k) { const s = snaps[Math.min(snaps.length - 1, Math.floor(k * snaps.length))]; boundary(s); side([[`epoch ${s.ep}`, { size: 15 }], [`accuracy ${pct(s.acc)}`, { color: p.good }], ["teal = inside", { color: p.a }], ["red = outside", { color: p.b }]]); } },
      ];
    },
  });

  /* ---------- Transformer ---------- */
  A.story("transformer", {
    how: "Watch a transformer process a sentence: split it into tokens, turn tokens into vectors, add positions, then let the word \"it\" use attention (queries, keys and values) to decide which words matter, mix in their meaning, and predict what comes next.",
    note: "Attention weights here are illustrative, chosen to show the idea clearly. A real model learns them, and runs many heads in every layer.",
    scenes(S) {
      const p = S.pal, toks = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "tired"], F = 7;
      const att = [0.04, 0.46, 0.03, 0.05, 0.03, 0.14, 0.05, 0.1, 0.04, 0.06], raw = att.map((a) => Math.log(a) + 3.5);
      const rmax = Math.max(...raw), r = A.seeded(9), vecs = toks.map(() => Array.from({ length: 6 }, () => r() * 2 - 1));
      const cols = [p.muted, p.a, p.muted, p.groups[3], p.muted, p.groups[2], p.muted, S.hl, p.muted, p.groups[5]];
      const U = (i) => 0.06 + i * 0.098, V = 0.5, w = 0.088;
      const row = (o = {}) => toks.forEach((t, i) => S.alpha(o.n == null || i < o.n ? 1 : 0, () => S.box(U(i), V, w, 0.08, t, { stroke: i === F && o.focus ? S.hl : p.line, lw: i === F && o.focus ? 3 : 1.5, fill: o.fill ? o.fill(i) : p.bg })));
      const vec = (i, a = 1, sh = 0) => S.alpha(a, () => vecs[i].forEach((v, j) => { S.ctx.fillStyle = S.tint(v > 0 ? p.a : p.b, 0.25 + 0.6 * Math.abs(v)); S.ctx.fillRect(S.x(U(i) - w / 2 + 0.006 + j * 0.0128), S.y(V + 0.07 + sh), S.x(0.011), S.y(0.05)); }));
      const arcs = (k) => toks.forEach((t, i) => { if (i === F) return; const lw = 1 + att[i] * 26 * k, x1 = S.x(U(F)), x2 = S.x(U(i)), top = S.y(V - 0.06) - Math.abs(x1 - x2) * 0.32; S.ctx.beginPath(); S.ctx.moveTo(x1, S.y(V - 0.045)); S.ctx.quadraticCurveTo((x1 + x2) / 2, top, x2, S.y(V - 0.045)); S.ctx.lineWidth = lw; S.ctx.strokeStyle = S.tint(S.hl, 0.25 + att[i] * 1.5); S.ctx.stroke(); });
      const bars = (vals, mx, lab) => vals.forEach((v, i) => { const h = 0.2 * (v / mx); S.rect(U(i) - 0.025, 0.86 - h, 0.05, h, i === F ? S.tint(S.hl, 0.5) : S.tint(p.accent, 0.55)); S.text(lab(v), U(i), 0.9, { size: 10.5 }); });
      return [
        { t: "Split into tokens", dur: 2000, cap: "The sentence is split into tokens: words or pieces of words. A real model would use about 1 token per ¾ of a word. The model's job here: understand what \"it\" refers to.", draw(S, k) { row({ n: Math.ceil(k * toks.length) }); } },
        { t: "Tokens become vectors", dur: 2000, cap: "Each token is looked up in an embedding table and becomes a list of numbers (a vector). Real models use thousands of numbers per token; we show 6. Similar words get similar vectors.", draw(S, k) { row(); toks.forEach((t, i) => vec(i, S.part(k, i / 12, i / 12 + 0.3))); } },
        { t: "Add positions", dur: 1800, cap: "Attention on its own doesn't know word order, so position information is added to each vector: \"dog bites man\" and \"man bites dog\" must look different.", draw(S, k) { row(); toks.forEach((t, i) => { vec(i); S.alpha(S.ease(k), () => S.text(`pos ${i + 1}`, U(i), V + 0.17, { size: 10, color: p.muted })); }); } },
        { t: "Query, key, value", dur: 2400, cap: "In each attention layer, every token makes three vectors: a Query (what am I looking for?), a Key (what do I contain?) and a Value (what will I pass on?). Let's follow the token \"it\": its query asks \"which noun am I?\"", draw(S, k) { row({ focus: true }); toks.forEach((t, i) => { vec(i); S.alpha(S.ease(k), () => S.text(i === F ? "Q" : "K  V", U(i), V - 0.08, { size: 11, color: i === F ? S.hl : p.muted, weight: 700 })); }); } },
        { t: "Score every token", dur: 2400, cap: "\"it\" compares its query with every token's key (a dot product). A high score means \"this token is relevant to me\". \"animal\" scores highest, \"street\" second.", draw(S, k) { row({ focus: true }); bars(raw.map((v) => v * S.ease(k)), rmax, (v) => v.toFixed(1)); S.text("scores = Q · K / √d", 0.5, 0.97, { mono: true, size: 11, color: p.muted }); } },
        { t: "Softmax → attention weights", dur: 2400, cap: "Softmax turns the scores into weights that add up to 100%. \"it\" will pay 46% of its attention to \"animal\", 14% to \"street\", and a little to everything else. The arcs show the weights.", draw(S, k) { row({ focus: true }); arcs(S.ease(k)); bars(att, 0.46, (v) => pct(v)); } },
        { t: "Mix in the meaning", dur: 2800, cap: "The new vector for \"it\" is the weighted mix of all the value vectors: mostly \"animal\". After this layer, \"it\" carries the meaning \"the animal\". Change \"tired\" to \"wide\" and a trained model shifts its attention to \"street\" instead.", draw(S, k) { row({ focus: true, fill: (i) => (i === F ? S.tint(p.a, 0.5 * S.ease(k)) : p.bg) }); arcs(1); toks.forEach((t, i) => { if (i === F) return; const tt = S.part(k, 0, 0.8); if (tt > 0 && tt < 1) S.dot(S.lerp(U(i), U(F), tt), V - 0.12 - Math.sin(tt * Math.PI) * 0.15, 3 + att[i] * 14, cols[i]); }); S.alpha(S.part(k, 0.75, 1), () => S.text("it ≈ 46% animal + 14% street + …", U(F), V + 0.13, { size: 12 })); } },
        { t: "Stack layers, predict the next token", dur: 3000, cap: "This happens in many heads at once, in every one of dozens of layers, each refining every token's meaning. At the end, the last token's vector is turned into a probability for every possible next token, and one is picked. Then the whole process repeats for the next token.", draw(S, k) { for (let l = 0; l < 4; l++) S.alpha(S.part(k, l * 0.12, l * 0.12 + 0.2), () => S.box(0.26, 0.78 - l * 0.13, 0.36, 0.1, l === 3 ? "layer 96" : `layer ${l + 1}`, { sub: "attention + feed-forward" })); S.alpha(S.part(k, 0.5, 0.7), () => S.arrow(0.46, 0.4, 0.56, 0.4, p.fg, 2)); [[".", 0.41], [" and", 0.22], [",", 0.15], [" after", 0.06], [" so", 0.05]].forEach(([t, v], i) => S.alpha(S.part(k, 0.55 + i * 0.07, 0.75 + i * 0.07), () => { S.text(`"${t.trim() || t}"`, 0.6, 0.22 + i * 0.1, { align: "left", size: 13, mono: true }); S.rect(0.69, 0.2 + i * 0.1, 0.25 * (v / 0.41), 0.045, i ? S.tint(p.accent, 0.5) : S.hl); S.text(pct(v), 0.95, 0.22 + i * 0.1, { size: 12, align: "left" }); })); S.text("next token after \"…because it was tired\"", 0.78, 0.12, { size: 11, color: p.muted }); } },
      ];
    },
  });
})();
