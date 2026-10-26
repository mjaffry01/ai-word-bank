// Algorithms map: reinforcement-learning demos
(function () {
  const A = window.WB_ALGOS, { esc, rgb, palette, rand, plot, loop, btn, slider, panel } = A.h;
  const add = A.add;

  /* ---------- Q-learning in a grid world ---------- */
  const GW = { cols: 7, rows: 5, start: [0, 4], goal: [6, 0], pits: [[3, 1], [3, 2], [5, 3], [1, 1]], walls: [[3, 3], [1, 3]] };
  const ACT = [[0, -1], [1, 0], [0, 1], [-1, 0]], ARROW = ["↑", "→", "↓", "←"];
  add({
    id: "qlearn", group: "rl", star: true, name: "Q-Learning", kind: "Value-based", term: "Q-Learning",
    how: "The agent keeps a table with a score (Q-value) for every action in every square: how much reward it expects if it takes that action and plays well afterwards. After each move it nudges the score towards the reward it got plus the best score of where it landed. Over many episodes, good paths light up.",
    try: "Press \"Train 1 episode\" a few times and watch the agent wander. Then train 200 episodes: the arrows settle into a safe route around the pits. Raise exploration to see it try more random moves.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host, 300);
      const key = (x, y) => `${x},${y}`, isIn = (arr, x, y) => arr.some(([a, b]) => a === x && b === y);
      let Q = {}, eps = 0.2, episodes = 0, agent = null, trail = [], lastRet = 0, anim = null;
      const ui = panel(ctl, btn("one", "Train 1 episode", true) + btn("many", "Train 200 episodes") + btn("run", "Run best route") + btn("reset", "Forget everything") + slider("e", "Exploration (ε)", 0, 0.6, 0.05, eps));
      const q = (x, y) => (Q[key(x, y)] = Q[key(x, y)] || [0, 0, 0, 0]);
      function stepEnv(x, y, a) {
        let nx = x + ACT[a][0], ny = y + ACT[a][1];
        if (nx < 0 || ny < 0 || nx >= GW.cols || ny >= GW.rows || isIn(GW.walls, nx, ny)) { nx = x; ny = y; }
        if (nx === GW.goal[0] && ny === GW.goal[1]) return { nx, ny, r: 10, done: true };
        if (isIn(GW.pits, nx, ny)) return { nx, ny, r: -10, done: true };
        return { nx, ny, r: -0.2, done: false };
      }
      function episode(record) {
        let [x, y] = GW.start, ret = 0; const path = [[x, y]];
        for (let t = 0; t < 80; t++) {
          const qs = q(x, y), a = Math.random() < eps ? Math.floor(Math.random() * 4) : qs.indexOf(Math.max(...qs));
          const { nx, ny, r, done } = stepEnv(x, y, a);
          qs[a] += 0.5 * (r + (done ? 0 : 0.95 * Math.max(...q(nx, ny))) - qs[a]);
          x = nx; y = ny; ret += r; path.push([x, y]); if (done) break;
        }
        episodes++; lastRet = ret; if (record) trail = path; return path;
      }
      function draw(pos) {
        P.clear(); const cw = P.w / GW.cols, ch = P.h / GW.rows, c = P.ctx;
        const vals = []; for (let x = 0; x < GW.cols; x++) for (let y = 0; y < GW.rows; y++) if (Q[key(x, y)]) vals.push(Math.max(...Q[key(x, y)]));
        const mx = Math.max(1, ...vals.map(Math.abs));
        for (let x = 0; x < GW.cols; x++) for (let y = 0; y < GW.rows; y++) {
          const px = x * cw, py = y * ch;
          if (isIn(GW.walls, x, y)) { c.fillStyle = pal.fg; c.fillRect(px, py, cw, ch); continue; }
          if (isIn(GW.pits, x, y)) { c.fillStyle = `rgba(${rgb(pal.bad).join(",")},.55)`; c.fillRect(px, py, cw, ch); c.font = "600 20px system-ui"; c.fillStyle = pal.bg; c.textAlign = "center"; c.fillText("−10", px + cw / 2, py + ch / 2 + 7); continue; }
          if (x === GW.goal[0] && y === GW.goal[1]) { c.fillStyle = `rgba(${rgb(pal.good).join(",")},.6)`; c.fillRect(px, py, cw, ch); c.font = "600 20px system-ui"; c.fillStyle = pal.bg; c.textAlign = "center"; c.fillText("+10", px + cw / 2, py + ch / 2 + 7); continue; }
          const qs = Q[key(x, y)];
          if (qs) { const v = Math.max(...qs), col = rgb(v >= 0 ? pal.good : pal.bad); c.fillStyle = `rgba(${col.join(",")},${0.08 + 0.4 * Math.min(1, Math.abs(v) / mx)})`; c.fillRect(px, py, cw, ch);
            if (qs.some((v2) => v2 !== 0)) { c.font = "600 18px system-ui"; c.fillStyle = pal.fg; c.textAlign = "center"; c.fillText(ARROW[qs.indexOf(Math.max(...qs))], px + cw / 2, py + ch / 2 + 6); c.font = "500 10px monospace"; c.fillStyle = pal.muted; c.fillText(v.toFixed(1), px + cw / 2, py + ch - 5); } }
          c.strokeStyle = pal.line; c.lineWidth = 1; c.strokeRect(px, py, cw, ch);
        }
        if (trail.length > 1) { c.beginPath(); trail.forEach(([x, y], i) => { const X = (x + 0.5) * cw, Y = (y + 0.5) * ch; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.strokeStyle = pal.accent; c.lineWidth = 3; c.globalAlpha = 0.6; c.stroke(); c.globalAlpha = 1; }
        const [ax, ay] = pos || GW.start; c.beginPath(); c.arc((ax + 0.5) * cw, (ay + 0.5) * ch, Math.min(cw, ch) * 0.22, 0, 7); c.fillStyle = pal.accent; c.fill(); c.lineWidth = 3; c.strokeStyle = pal.bg; c.stroke();
        c.font = "600 11px system-ui"; c.fillStyle = pal.fg; c.textAlign = "left"; c.fillText("start", 4, P.h - 6);
        ui.info(`episodes trained: ${episodes}\nlast episode reward: ${lastRet.toFixed(1)}\neach step costs −0.2, pits −10, goal +10\narrows = best action learned so far`);
      }
      function animate(path) { if (anim) anim(); let i = 0, last = 0; anim = loop(() => { const t = performance.now(); if (t - last < 140) return; last = t; draw(path[i]); i++; if (i >= path.length) { anim(); anim = null; } }); }
      ui.on("one", "click", () => { animate(episode(true)); });
      ui.on("many", "click", () => { for (let i = 0; i < 200; i++) episode(false); trail = []; draw(); });
      ui.on("run", "click", () => { let [x, y] = GW.start; const path = [[x, y]]; for (let t = 0; t < 40; t++) { const qs = q(x, y), a = qs.indexOf(Math.max(...qs)), r = stepEnv(x, y, a); x = r.nx; y = r.ny; path.push([x, y]); if (r.done) break; } trail = path; animate(path); });
      ui.on("reset", "click", () => { Q = {}; episodes = 0; trail = []; lastRet = 0; draw(); });
      ui.on("e", "input", (e, s) => { eps = +s.value; ui.show("e", eps.toFixed(2)); });
      draw();
      return () => { if (anim) anim(); };
    },
  });

  /* ---------- DQN: a network replaces the Q-table (catch-the-ball game) ---------- */
  add({
    id: "dqn", group: "rl", star: true, name: "Deep Q-Network (DQN)", kind: "Value-based · Deep", term: "Deep Q-Network (DQN)",
    how: "A Q-table is impossible when the input is a game screen: there are too many possible screens. A DQN uses a neural network that looks at the screen and outputs a Q-value for each action. The agent picks the highest. It's how DeepMind's agent learned Atari games from pixels.",
    try: "Watch the paddle catch the falling balls. The bars show the Q-value of each action at every moment; the paddle takes the tallest. Switch to \"Untrained\" to see random Q-values and a hopeless paddle.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host, 300);
      let trained = true, ball = null, pad = 0.5, score = 0, miss = 0, last = 0, qv = [0, 0, 0];
      const ui = panel(ctl, `<label>Network<div class="row"><button class="choice" data-k="tr" aria-pressed="true">Trained</button><button class="choice" data-k="un" aria-pressed="false">Untrained</button></div></label><div id="dqnQ"></div>`);
      const newBall = () => ({ x: rand(0.08, 0.92), y: 1, vx: rand(-0.004, 0.004) });
      function qvals() {
        if (!trained) return [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
        const d = ball.x - pad, urgency = 1 - ball.y * 0.6;
        return [-d * 4 * urgency, 0.6 - Math.abs(d) * 6 * urgency, d * 4 * urgency];
      }
      function draw() {
        P.clear(); const c = P.ctx;
        P.dot(ball.x, ball.y, pal.bad, 9);
        c.fillStyle = pal.accent; c.fillRect(P.X(pad - 0.08), P.Y(0.06), P.X(0.16), 10);
        const mx = Math.max(0.5, ...qv.map(Math.abs)), names = ["Left", "Stay", "Right"], best = qv.indexOf(Math.max(...qv));
        ctl.querySelector("#dqnQ").innerHTML = `<p class="lbl" style="margin:0 0 6px">Q-values from the network</p>` + qv.map((v, i) => `<div class="prob ${i === best ? "picked" : ""}" style="grid-template-columns:3.5rem 1fr 3rem"><span class="w">${names[i]}</span><span class="track"><span class="fill" style="width:${Math.max(2, ((v + mx) / (2 * mx)) * 100)}%"></span></span><span class="pct">${v.toFixed(2)}</span></div>`).join("") + `<div class="algoinfo" style="margin-top:8px">caught: ${score}   missed: ${miss}</div>`;
      }
      const stop = loop(() => {
        const t = performance.now(); if (t - last < 30) return; last = t;
        if (!ball) ball = newBall();
        ball.y -= 0.012; ball.x = Math.max(0.03, Math.min(0.97, ball.x + ball.vx));
        qv = qvals(); const a = qv.indexOf(Math.max(...qv)); pad = Math.max(0.08, Math.min(0.92, pad + (a - 1) * 0.022));
        if (ball.y <= 0.08) { if (Math.abs(ball.x - pad) < 0.1) score++; else miss++; ball = newBall(); }
        draw();
      });
      ui.on("tr", "click", (e, b) => { trained = true; b.setAttribute("aria-pressed", "true"); ui.q("un").setAttribute("aria-pressed", "false"); score = miss = 0; });
      ui.on("un", "click", (e, b) => { trained = false; b.setAttribute("aria-pressed", "true"); ui.q("tr").setAttribute("aria-pressed", "false"); score = miss = 0; });
      return stop;
    },
    note: "Simplified: the \"trained network\" is a hand-written function standing in for a real neural network, so you can see the decision loop: screen → Q-values → best action.",
  });

  /* ---------- Policy gradient / actor-critic / PPO on a 3-armed bandit ---------- */
  add({
    id: "pg", group: "rl", star: true, name: "Policy Gradient · Actor-Critic · PPO", kind: "Policy-based", term: "Policy",
    how: "Instead of scoring actions, the agent directly learns a policy: a probability for each action. After each try it raises the probability of actions that did better than expected and lowers the others. The \"expected\" baseline is the critic (actor-critic). PPO clips each update so the policy never jumps too far at once. PPO is the algorithm used in RLHF.",
    try: "Three slot machines pay out with hidden probabilities. Press \"Play 100 times\" and watch the policy shift towards the best machine. Turn PPO clipping on and compare: steadier, smaller steps.",
    mount(host, ctl) {
      const pal = palette(), P = plot(host, 220);
      let pay = [], pref = [0, 0, 0], base = 0, plays = 0, ppo = true, hist = [], wins = 0;
      const ui = panel(ctl, btn("one", "Play once", true) + btn("hund", "Play 100 times") + btn("reset", "New machines") + `<label><span><input type="checkbox" data-k="ppo" checked> PPO clipping (±20% per step)</span></label><div id="pgBars"></div>`);
      const reset = () => { pay = [0.25, 0.5, 0.8].sort(() => Math.random() - 0.5); pref = [0, 0, 0]; base = 0; plays = 0; wins = 0; hist = []; };
      const pi = () => { const e = pref.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
      function play() {
        const p = pi(); let r = Math.random(), a = 0; while (r > p[a] && a < 2) { r -= p[a]; a++; }
        const reward = Math.random() < pay[a] ? 1 : 0, adv = reward - base, lr = 0.25;
        const newPref = pref.map((v, i) => v + lr * adv * ((i === a ? 1 : 0) - p[i]));
        if (ppo) { const e = newPref.map(Math.exp), s = e.reduce((x, y) => x + y, 0), np = e.map((v) => v / s), ratio = np[a] / p[a];
          if (ratio > 1.2 || ratio < 0.8) { const target = p[a] * (ratio > 1.2 ? 1.2 : 0.8), scale = Math.log(target / p[a]) / Math.log(ratio); pref = pref.map((v, i) => v + (newPref[i] - v) * scale); } else pref = newPref; }
        else pref = newPref;
        base += 0.05 * (reward - base); plays++; wins += reward;
        hist.push(pi()[pay.indexOf(Math.max(...pay))]); if (hist.length > 400) hist.shift();
      }
      function draw() {
        const p = pi(), best = pay.indexOf(Math.max(...pay));
        ctl.querySelector("#pgBars").innerHTML = `<p class="lbl" style="margin:0 0 6px">Policy (chance of choosing)</p>` + p.map((v, i) => `<div class="prob ${i === best ? "picked" : ""}" style="grid-template-columns:5rem 1fr 3rem"><span class="w">Machine ${i + 1}</span><span class="track"><span class="fill" style="width:${v * 100}%"></span></span><span class="pct">${Math.round(v * 100)}%</span></div>`).join("") + `<div class="algoinfo" style="margin-top:8px">plays: ${plays}  wins: ${wins}\ncritic's expected reward: ${base.toFixed(2)}\n(hidden payouts: ${plays >= 100 ? pay.map((v) => Math.round(v * 100) + "%").join(", ") : "revealed after 100 plays"})</div>`;
        P.clear(); P.line(0, 1 / 3, 1, 1 / 3, pal.line, 1, [4, 4]); P.text("chance of picking the best machine over time", 0.01, 0.92, pal.muted, 11);
        if (hist.length > 1) { const c = P.ctx; c.beginPath(); hist.forEach((v, i) => { const x = i / Math.max(100, hist.length - 1); i ? c.lineTo(P.X(x), P.Y(v * 0.85)) : c.moveTo(P.X(x), P.Y(v * 0.85)); }); c.strokeStyle = pal.accent; c.lineWidth = 2.5; c.stroke(); }
      }
      ui.on("one", "click", () => { play(); draw(); });
      ui.on("hund", "click", () => { for (let i = 0; i < 100; i++) play(); draw(); });
      ui.on("reset", "click", () => { reset(); draw(); });
      ui.on("ppo", "change", (e, c) => { ppo = c.checked; });
      reset(); draw();
    },
  });

  /* ---------- Monte Carlo Tree Search playing tic-tac-toe ---------- */
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winner = (b) => { for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; return b.every((v) => v) ? "draw" : null; };
  function mcts(board, player, iters) {
    const other = (p) => (p === "X" ? "O" : "X");
    const root = { b: board, p: player, n: 0, w: 0, kids: null, parent: null, move: -1 };
    const expand = (nd) => { nd.kids = nd.b.map((v, i) => (v ? null : i)).filter((i) => i !== null).map((i) => { const b = nd.b.slice(); b[i] = nd.p; return { b, p: other(nd.p), n: 0, w: 0, kids: null, parent: nd, move: i }; }); };
    for (let it = 0; it < iters; it++) {
      let nd = root;
      while (nd.kids && nd.kids.length && !winner(nd.b)) { nd = nd.kids.reduce((best, k) => { const u = k.n ? k.w / k.n + 1.4 * Math.sqrt(Math.log(nd.n + 1) / k.n) : 1e9; return u > best.u ? { k, u } : best; }, { k: null, u: -1 }).k; }
      if (!winner(nd.b) && !nd.kids) { expand(nd); if (nd.kids.length) nd = nd.kids[Math.floor(Math.random() * nd.kids.length)]; }
      let b = nd.b.slice(), p = nd.p, res = winner(b);
      while (!res) { const free = b.map((v, i) => (v ? null : i)).filter((i) => i !== null); b[free[Math.floor(Math.random() * free.length)]] = p; p = other(p); res = winner(b); }
      for (let x = nd; x; x = x.parent) { x.n++; const mover = other(x.p); x.w += res === "draw" ? 0.5 : res === mover ? 1 : 0; }
    }
    return root.kids || [];
  }
  add({
    id: "mcts", group: "rl", star: true, name: "Monte Carlo Tree Search (MCTS)", kind: "Planning · Search", term: "Monte Carlo Tree Search (MCTS)",
    how: "To choose a move, MCTS plays out thousands of quick random games from the current position, building a tree of the moves it tried. It focuses more simulations on moves that keep winning, while still exploring others. The most-visited move wins. Combined with neural networks, this is how AlphaGo beat the world champion.",
    try: "You are X. Click a square, then the computer (O) thinks with the number of simulations you choose. The small numbers show how many simulations each move got. Try 20 simulations (easy to beat) vs 2,000 (very hard).",
    wide: true,
    mount(host, ctl) {
      let board = Array(9).fill(null), stats = [], sims = 800, msg = "Your move: you are X.";
      const ui = panel(ctl, slider("s", "Simulations per move", 10, 3000, 10, sims) + btn("new", "New game") + btn("first", "Let the computer start"));
      function aiMove() {
        const kids = mcts(board, "O", sims); stats = kids.map((k) => ({ m: k.move, n: k.n, wr: k.n ? k.w / k.n : 0 }));
        const best = kids.reduce((a, k) => (!a || k.n > a.n ? k : a), null); if (best) board[best.move] = "O";
      }
      function draw() {
        const best = stats.reduce((a, s) => (!a || s.n > a.n ? s : a), null);
        host.innerHTML = `<div class="algoflex"><div class="ttt">${board.map((v, i) => { const s = stats.find((x) => x.m === i); return `<button data-sq="${i}" class="${best && best.m === i ? "best" : ""}" ${v || winner(board) ? "disabled" : ""}>${v || ""}${s ? `<small>${s.n} · ${Math.round(s.wr * 100)}%</small>` : ""}</button>`; }).join("")}</div>
          <div style="max-width:320px"><p class="savemsg" style="font-size:1rem;margin:0 0 8px">${esc(msg)}</p><p class="algonote" style="margin:0">Numbers under each square after the computer moves: how many simulations explored that move · how often it won for O.</p></div></div>`;
        host.querySelectorAll("[data-sq]").forEach((b) => b.addEventListener("click", () => {
          const i = +b.dataset.sq; if (board[i] || winner(board)) return; board[i] = "X"; stats = [];
          if (!winner(board)) aiMove();
          const w = winner(board); msg = w === "X" ? "You win! Try more simulations." : w === "O" ? "The computer wins." : w === "draw" ? "Draw." : "Your move.";
          draw();
        }));
        ui.info(`simulations per move: ${sims}\nselection uses UCB: win rate +\nan exploration bonus for rarely\ntried moves`);
      }
      ui.on("s", "input", (e, s) => { sims = +s.value; ui.show("s", sims); });
      ui.on("new", "click", () => { board = Array(9).fill(null); stats = []; msg = "Your move: you are X."; draw(); });
      ui.on("first", "click", () => { board = Array(9).fill(null); aiMove(); msg = "Your move."; draw(); });
      draw();
    },
  });

  /* ---------- RLHF / DPO: learning from human preferences ---------- */
  const STYLES = [
    { k: "Simple & friendly", a: "Plants are like little chefs! They use sunlight, water and air to cook their own food, and they breathe out the oxygen we need." },
    { k: "Technical", a: "Photosynthesis converts light energy into chemical energy: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂, via the light-dependent reactions and the Calvin cycle." },
    { k: "Too short", a: "Plants make food from light." },
    { k: "Rambling", a: "Well, there are many things to say about plants, and photosynthesis is one of them, which is interesting because plants are green and green is a colour, and…" },
  ];
  add({
    id: "rlhf", group: "rl", star: true, name: "RLHF / DPO", kind: "Learning from preferences", term: "RLHF (Reinforcement Learning from Human Feedback)",
    how: "People compare two answers and pick the better one. RLHF trains a reward model on these choices, then uses PPO to push the chatbot towards high-reward answers. DPO skips the reward model and updates the chatbot directly from the preferred/rejected pairs. This is how assistants learn to be helpful, clear and safe.",
    try: "The question is \"Explain photosynthesis to a 10-year-old\". Pick the better answer each round. Watch the reward scores and the chatbot's style probabilities follow your choices. Your preferences are shaping the model.",
    wide: true,
    mount(host, ctl) {
      let reward = STYLES.map(() => 0), policy = STYLES.map(() => 0), rounds = 0, pair = [0, 1];
      const ui = panel(ctl, btn("skip", "Different pair") + btn("reset", "Start again"));
      const pi = () => { const e = policy.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
      const newPair = () => { const i = Math.floor(Math.random() * 4); let j = Math.floor(Math.random() * 3); if (j >= i) j++; pair = [i, j]; };
      function choose(w) {
        const l = pair[0] === w ? pair[1] : pair[0];
        const pw = 1 / (1 + Math.exp(reward[l] - reward[w])); reward[w] += 0.6 * (1 - pw); reward[l] -= 0.6 * (1 - pw);
        const p = pi(); policy = policy.map((v, i) => v + 0.5 * p[i] * (reward[i] - p.reduce((s, q, k) => s + q * reward[k], 0)));
        rounds++; newPair(); draw();
      }
      function draw() {
        const p = pi(), mr = Math.max(1, ...reward.map(Math.abs));
        host.innerHTML = `<p class="lbl">Round ${rounds + 1}: which answer is better? <span style="font-weight:400;text-transform:none;letter-spacing:0">"Explain photosynthesis to a 10-year-old"</span></p>
          <div class="vs">${pair.map((i) => `<button class="opt" data-pick="${i}" style="display:block;text-align:left"><span class="k" style="display:block;margin-bottom:4px">Answer</span>${esc(STYLES[i].a)}</button>`).join("")}</div>
          <div class="algoflex" style="margin-top:14px"><div style="flex:1;min-width:240px"><p class="lbl">Reward model (learned from your choices)</p><div class="probs">${STYLES.map((s, i) => `<div class="prob" style="grid-template-columns:8.5rem 1fr 3rem"><span class="w">${s.k}</span><span class="track"><span class="fill" style="width:${((reward[i] + mr) / (2 * mr)) * 100}%"></span></span><span class="pct">${reward[i].toFixed(1)}</span></div>`).join("")}</div></div>
          <div style="flex:1;min-width:240px"><p class="lbl">Chatbot policy (how often it answers in each style)</p><div class="probs">${STYLES.map((s, i) => `<div class="prob" style="grid-template-columns:8.5rem 1fr 3rem"><span class="w">${s.k}</span><span class="track"><span class="fill" style="width:${p[i] * 100}%"></span></span><span class="pct">${Math.round(p[i] * 100)}%</span></div>`).join("")}</div></div></div>`;
        host.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.pick)));
        ui.info(`preferences given: ${rounds}\nreward model: learns a score per\n  style from your picks\npolicy: shifts towards high reward`);
      }
      ui.on("skip", "click", () => { newPair(); draw(); });
      ui.on("reset", "click", () => { reward = STYLES.map(() => 0); policy = STYLES.map(() => 0); rounds = 0; newPair(); draw(); });
      draw();
    },
    note: "Simplified: real RLHF learns from thousands of comparisons and updates billions of weights, but the loop is the same: compare → reward model → policy update.",
  });
})();
