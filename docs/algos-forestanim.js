// Algorithms map: an animated random forest (random bag → grow a tree → add its vote → repeat → predict by majority).
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A || !A.tree) return;
  const { palette, plot, loop, btn, slider, panel, rgb } = A.h;
  const { buildTree, treeP } = A.tree;

  function seeded(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Pass/fail students again (x = study, y = sleep), this time with ~12% surprises so a single tree overfits
  function students(n, seed) {
    const r = seeded(seed), pts = [];
    for (let i = 0; i < n; i++) { const x = 0.04 + 0.92 * r(), y = 0.04 + 0.92 * r(); let c = (x > 0.45 && y > 0.35) || x > 0.82 ? 1 : 0; if (r() < 0.12) c ^= 1; pts.push({ x, y, c }); }
    return pts;
  }
  const FEAT = { x: "Study", y: "Sleep" };
  const hrs = (v) => (v * 10).toFixed(1) + " h";
  const MAXT = 12, GRID = [40, 26];
  const accuracy = (fn, test) => Math.round((test.filter((p) => (fn(p) >= 0.5 ? 1 : 0) === p.c).length / test.length) * 100);

  const demo = {
    key: "anim", label: "Watch it vote", order: 1,
    how: "One decision tree is easily fooled by a few odd students. A random forest grows many trees and lets them vote. Each tree is made different on purpose, in two ways: (1) it practises on its own random \"bag\" of students, drawn with replacement, so some appear twice and some are left out; (2) at every question it may only look at a randomly chosen feature. Their individual mistakes point in different directions and cancel out in the vote.",
    try: "Press Play and watch tree 1 fill its bag (rings = picked, numbers = picked more than once), grow, and add its vote. Compare the small tree maps on the right: each one is different. Watch the forest's accuracy on 300 new students climb past the single tree's. Then press \"Predict a new student\" or click the big chart and watch every tree vote.",
    note: "Accuracy is measured on 300 students the trees never saw, which is the honest test. Building a bag by drawing with replacement is called bootstrapping; combining the votes is called bagging (bootstrap aggregating).",
    wide: true,
    mount(host, ctl) {
      const pal = palette(), hl = "#e0a400";
      host.innerHTML = `<div class="tanim"><div class="tleft"><p class="lbl">All 60 students · background = the forest's vote</p><div class="tplot"></div><div class="fvote"></div></div><div class="tright"><p class="lbl">Each tree's own view (its bag and its boundary)</p><div class="fgrid"></div></div></div><p class="tcap" aria-live="polite"></p>`;
      const P = plot(host.querySelector(".tplot"), 300), cap = host.querySelector(".tcap"), grid = host.querySelector(".fgrid"), voteEl = host.querySelector(".fvote");
      const ui = panel(ctl, `<div class="row">${btn("play", "Pause", true)}${btn("step", "Next step")}${btn("restart", "Restart")}</div>` + slider("sp", "Speed", 0.5, 4, 0.5, 1) + slider("n", "Trees to grow", 1, MAXT, 1, 9) + slider("d", "Depth of each tree", 2, 8, 1, 6) + `<label><span><input type="checkbox" data-k="rf" checked> random feature at each question</span></label>` + btn("predict", "Predict a new student"));
      const train = students(60, 7), test = students(300, 99);
      let trees, phase, t, playing = true, speed = 1, nTrees = 9, depth = 6, randomFeat = true, last = performance.now(), draws, pred = null, votes = null, single, singleAcc;

      // Mini maps on the right, one canvas per tree
      function buildGrid() {
        grid.innerHTML = Array.from({ length: nTrees }, (_, i) => `<div class="fcell" data-i="${i}"><canvas width="1" height="1"></canvas><span class="fname">Tree ${i + 1}</span><span class="fvb"></span></div>`).join("");
      }
      function drawMini(i, alpha) {
        const cell = grid.querySelector(`[data-i="${i}"]`); if (!cell) return;
        const c = cell.querySelector("canvas"), W = Math.max(90, cell.clientWidth - 2), H = Math.round(W * 0.72), d = window.devicePixelRatio || 1, ctx = c.getContext("2d");
        if (c.width !== W * d) { c.width = W * d; c.height = H * d; c.style.width = W + "px"; c.style.height = H + "px"; }
        ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
        const tr = trees[i];
        if (tr && tr.tree) {
          ctx.globalAlpha = alpha; const cw = W / GRID[0], ch = H / GRID[1], ca = rgb(pal.a), cb = rgb(pal.b);
          for (let gx = 0; gx < GRID[0]; gx++) for (let gy = 0; gy < GRID[1]; gy++) { const p = treeP(tr.tree, { x: (gx + 0.5) / GRID[0], y: 1 - (gy + 0.5) / GRID[1] }); ctx.fillStyle = `rgba(${(p >= 0.5 ? ca : cb).join(",")},0.28)`; ctx.fillRect(gx * cw, gy * ch, cw + 1, ch + 1); }
          ctx.globalAlpha = 1;
        }
        if (tr) tr.count.forEach((k, j) => { if (!k) return; const p = train[j]; ctx.beginPath(); ctx.arc(p.x * W, (1 - p.y) * H, k > 1 ? 3.6 : 2.6, 0, 7); ctx.fillStyle = p.c ? pal.a : pal.b; ctx.fill(); });
        cell.classList.toggle("on", !!tr && phase && phase.i === i);
        const vb = cell.querySelector(".fvb");
        if (votes && votes[i] != null) { vb.textContent = votes[i] ? "PASS" : "FAIL"; vb.className = "fvb " + (votes[i] ? "pass" : "fail"); } else { vb.textContent = ""; vb.className = "fvb"; }
      }

      // Forest vote map: share of finished trees saying PASS, recomputed only when a tree is added
      let voteMap = null;
      function recomputeVotes() {
        const done = trees.filter((x) => x.tree && x.voted);
        voteMap = done.length ? Array.from({ length: GRID[0] * GRID[1] }, (_, k) => { const p = { x: ((k % GRID[0]) + 0.5) / GRID[0], y: 1 - (Math.floor(k / GRID[0]) + 0.5) / GRID[1] }; return done.filter((x) => treeP(x.tree, p) >= 0.5).length / done.length; }) : null;
      }
      const forestP = (p) => { const done = trees.filter((x) => x.tree && x.voted); return done.length ? done.filter((x) => treeP(x.tree, p) >= 0.5).length / done.length : 0.5; };

      function reset() {
        trees = []; votes = null; pred = null; voteMap = null;
        single = buildTree(train, depth, false); singleAcc = accuracy((p) => treeP(single, p), test);
        buildGrid(); startTree(0);
      }
      function startTree(i) {
        if (i >= nTrees) { phase = null; return; }
        trees[i] = { count: new Array(train.length).fill(0), tree: null, voted: false };
        draws = Array.from({ length: train.length }, () => Math.floor(Math.random() * train.length));
        phase = { i, kind: "bag", k: 0 }; t = 0;
      }
      const DUR = { bag: 2600, grow: 1700, vote: 1600 };

      function step(dt) {
        if (!phase) return;
        t += dt; const tr = trees[phase.i];
        if (phase.kind === "bag") {
          const want = Math.min(train.length, Math.floor((t / DUR.bag) * train.length));
          while (phase.k < want) { tr.count[draws[phase.k]]++; phase.k++; }
          if (t >= DUR.bag) { while (phase.k < train.length) { tr.count[draws[phase.k]]++; phase.k++; } const bag = []; tr.count.forEach((k, j) => { for (let r = 0; r < k; r++) bag.push(train[j]); }); tr.tree = buildTree(bag, depth, randomFeat); tr.acc = accuracy((p) => treeP(tr.tree, p), test); phase = { i: phase.i, kind: "grow" }; t = 0; }
        } else if (phase.kind === "grow") { if (t >= DUR.grow) { tr.voted = true; recomputeVotes(); phase = { i: phase.i, kind: "vote" }; t = 0; } }
        else if (phase.kind === "vote" && t >= DUR.vote) startTree(phase.i + 1);
      }
      function skipStep() {
        if (!phase) return;
        const k = phase.kind; t = DUR[k] + 1; step(0);
      }

      function drawMain() {
        P.clear();
        if (voteMap) { const cw = P.w / GRID[0], ch = P.h / GRID[1], ca = rgb(pal.a), cb = rgb(pal.b); voteMap.forEach((v, k) => { const col = v >= 0.5 ? ca : cb; P.ctx.fillStyle = `rgba(${col.join(",")},${0.06 + 0.32 * Math.abs(2 * v - 1)})`; P.ctx.fillRect((k % GRID[0]) * cw, Math.floor(k / GRID[0]) * ch, cw + 1, ch + 1); }); }
        P.text("Study hours →", 0.99, 0.02, pal.muted, 11, "right");
        const cur = phase && phase.kind === "bag" ? trees[phase.i] : null;
        train.forEach((p, j) => {
          const inBag = cur && cur.count[j] > 0;
          P.dot(p.x, p.y, p.c ? pal.a : pal.b, 5, pal.bg);
          if (cur && !inBag) { P.ctx.fillStyle = `rgba(${rgb(pal.bg).join(",")},0.6)`; P.ctx.beginPath(); P.ctx.arc(P.X(p.x), P.Y(p.y), 6.5, 0, 7); P.ctx.fill(); }
          if (inBag) { P.ring(p.x, p.y, hl, 8, 2); if (cur.count[j] > 1) P.text("×" + cur.count[j], p.x + 0.018, p.y + 0.02, pal.fg, 11); }
        });
        if (cur && phase.k > 0 && phase.k <= draws.length) { const p = train[draws[phase.k - 1]]; P.ring(p.x, p.y, hl, 13, 3); }
        if (pred) { P.ring(pred.x, pred.y, hl, 11 + 3 * Math.sin(performance.now() / 150), 3); P.dot(pred.x, pred.y, pal.fg, 6, pal.bg); }
      }

      function drawVoteBar() {
        if (!pred) { voteEl.innerHTML = ""; return; }
        const shown = votes.filter((v) => v != null), yes = shown.filter((v) => v).length, no = shown.length - yes, total = trees.filter((x) => x.voted).length;
        voteEl.innerHTML = `<div class="fbar"><i class="pass" style="width:${(yes / total) * 100}%"></i><i class="fail" style="width:${(no / total) * 100}%"></i></div><p class="lbl">Votes so far: ${yes} PASS · ${no} FAIL (of ${total} trees)</p>`;
      }

      function caption() {
        const done = trees.filter((x) => x.voted), fAcc = done.length ? accuracy(forestP, test) : null;
        if (pred) {
          const shown = votes.filter((v) => v != null).length, yes = votes.filter((v) => v === 1).length, total = done.length;
          if (shown < total) return `New student: studied ${hrs(pred.x)}, slept ${hrs(pred.y)}. Asking each tree in turn… tree ${shown} says ${votes[shown - 1] ? "PASS" : "FAIL"}.`;
          const win = yes * 2 >= total;
          return `${win ? yes : total - yes} of ${total} trees say ${win ? "PASS" : "FAIL"}, so the forest predicts ${win ? "PASS" : "FAIL"} (${Math.round((Math.max(yes, total - yes) / total) * 100)}% of the votes). A single tree could be wrong here; the crowd rarely is.`;
        }
        if (!phase) return `Done: ${done.length} trees. One tree trained on all the data scores ${singleAcc}% on 300 new students; the forest scores ${fAcc}%. Press "Predict a new student" or click the chart.`;
        const i = phase.i, tr = trees[i];
        if (phase.kind === "bag") {
          const picked = tr.count.filter((k) => k > 0).length, twice = tr.count.filter((k) => k > 1).length;
          return `Tree ${i + 1} fills its bag: ${phase.k} of 60 random draws, with replacement. So far ${picked} different students are in, ${twice} were picked more than once, and ${60 - picked} are left out.`;
        }
        if (phase.kind === "grow") {
          const root = tr.tree.leaf ? null : tr.tree;
          return `Tree ${i + 1} grows on its own bag (depth up to ${depth}).${root ? ` Its first question: "${FEAT[root.f]} < ${hrs(root.t)}?".` : ""}${randomFeat ? " At every question it may only look at one randomly chosen feature, so it can't simply copy the other trees." : ""} On its own it scores ${tr.acc}% on the 300 new students.`;
        }
        return `Tree ${i + 1} joins the vote. Forest of ${done.length}: ${fAcc}% on new students (one full tree alone: ${singleAcc}%). The background now shows the share of trees voting PASS: stronger colour = more agreement.`;
      }

      function render() {
        drawMain(); for (let i = 0; i < nTrees; i++) drawMini(i, trees[i] && trees[i].tree ? (phase && phase.i === i && phase.kind === "grow" ? Math.min(1, t / 900) : 1) : 0);
        drawVoteBar(); cap.textContent = caption();
        const done = trees.filter((x) => x.voted);
        ui.info(`trees voting: ${done.length} of ${nTrees}\n\naccuracy on 300 new students:\n  one full tree: ${singleAcc}%\n  each forest tree: ${done.length ? done.map((x) => x.acc).join(", ") + "%" : "–"}\n  the forest: ${done.length ? accuracy(forestP, test) + "%" : "–"}`);
      }

      function predict(x, y) {
        while (phase) skipStep();
        pred = { x, y, t: 0 }; votes = trees.map(() => null); playing = true; ui.q("play").textContent = "Pause";
      }

      const stop = loop(() => {
        const now = performance.now(), dt = Math.min(100, now - last) * speed; last = now;
        if (playing) {
          if (pred) { pred.t += dt; const k = Math.min(trees.length, Math.floor(pred.t / 450)); for (let i = 0; i < k; i++) if (votes[i] == null) votes[i] = treeP(trees[i].tree, pred) >= 0.5 ? 1 : 0; }
          else if (phase) step(dt);
          else { playing = false; ui.q("play").textContent = "Play"; }
        }
        render();
      });

      const replay = () => { reset(); playing = true; ui.q("play").textContent = "Pause"; };
      ui.on("play", "click", (e, b) => { if (!phase && !pred) replay(); else { playing = !playing; b.textContent = playing ? "Pause" : "Play"; } last = performance.now(); });
      ui.on("step", "click", () => { pred = null; votes = null; playing = false; ui.q("play").textContent = "Play"; if (!phase) reset(); else skipStep(); });
      ui.on("restart", "click", replay);
      ui.on("sp", "input", (e, s) => { speed = +s.value; ui.show("sp", speed + "×"); });
      ui.on("n", "input", (e, s) => { nTrees = +s.value; ui.show("n", nTrees); replay(); });
      ui.on("d", "input", (e, s) => { depth = +s.value; ui.show("d", depth); replay(); });
      ui.on("rf", "change", (e, c) => { randomFeat = c.checked; replay(); });
      ui.on("predict", "click", () => predict(0.06 + 0.88 * Math.random(), 0.06 + 0.88 * Math.random()));
      P.c.addEventListener("click", (e) => { const p = P.at(e); predict(p.x, p.y); });
      ui.show("sp", "1×");
      reset();
      return stop;
    },
  };
  A.addView("forest", demo);
})();
