// Module 2, first tab "How AI answers": what an AI model is, before learning to prompt it.
// Interactive parts: a training demo (errors adjust weights), the token-by-token answer loop, how adding details to
// "Explain a bank" narrows the possible answers, a needs-to-technique matching game, a labelled example prompt,
// and a quick true/false check that links prompting to hallucination.
// Module 2 calls WB_HOWAI.html() and WB_HOWAI.mount(root).
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bars = (rows, mark) => rows.map(([w, p]) => `<div class="habar ${w === mark ? "hit" : ""}"><span class="w">${esc(w)}</span><span class="track"><span class="fill" style="width:${Math.round(p * 100)}%"></span></span><span class="pct">${Math.round(p * 100)}%</span></div>`).join("");

  /* ---------- 1. Training: errors nudge the weights ---------- */
  // The model's guesses for "The cat sat on the ___" after each round of training. The right answer is "mat".
  const ROUNDS = [
    { say: "Before training, the weights are random numbers, so every word gets about the same chance. The model has no idea.", p: [["mat", 0.2], ["banana", 0.2], ["sky", 0.2], ["sofa", 0.2], ["run", 0.2]] },
    { say: "The model guessed, the answer was “mat”, and the error was used to nudge the weights a little. “mat” got slightly more likely.", p: [["mat", 0.3], ["banana", 0.16], ["sky", 0.18], ["sofa", 0.2], ["run", 0.16]] },
    { say: "After many more examples, words that fit (“mat”, “sofa”) rise, and words that don't (“run”, “banana”) fall.", p: [["mat", 0.48], ["banana", 0.06], ["sky", 0.08], ["sofa", 0.32], ["run", 0.06]] },
    { say: "After training on billions of sentences, the weights hold patterns about language, facts and relationships. “mat” is now the clear favourite, but “sofa” is still possible.", p: [["mat", 0.62], ["banana", 0.02], ["sky", 0.03], ["sofa", 0.3], ["run", 0.03]] },
  ];

  /* ---------- 2. Answering: one token at a time ---------- */
  const PROMPT_TOKENS = ["What", " is", " the", " capital", " of", " France", "?"];
  const CONTEXT = [["System instructions", "You are a helpful assistant."], ["Your prompt", "What is the capital of France?"]];
  const GEN = [
    { pick: "The", p: [["The", 0.62], ["Paris", 0.3], ["It", 0.08]] },
    { pick: " capital", p: [[" capital", 0.81], [" answer", 0.12], [" city", 0.07]] },
    { pick: " of", p: [[" of", 0.96], [" is", 0.03], [" city", 0.01]] },
    { pick: " France", p: [[" France", 0.98], [" the", 0.01], [" French", 0.01]] },
    { pick: " is", p: [[" is", 0.97], [" was", 0.02], [",", 0.01]] },
    { pick: " Paris", p: [[" Paris", 0.97], [" Lyon", 0.02], [" Marseille", 0.01]] },
    { pick: ".", p: [[".", 0.9], [",", 0.06], ["!", 0.04]] },
    { pick: "[end]", p: [["[end]", 0.93], [" It", 0.05], [" Paris", 0.02]] },
  ];
  const STAGES = ["Break into tokens", "Read the context", "Score the next token", "Pick it and repeat"];

  /* ---------- 3. "Explain a bank": details remove guesswork ---------- */
  const DETAILS = [
    { id: "meaning", label: "Which bank", add: "what a financial bank does", rules: ["river"] },
    { id: "audience", label: "Audience", add: "to a 12-year-old", rules: ["expert"] },
    { id: "example", label: "Example", add: "Use a pocket-money example", rules: ["noexample"] },
    { id: "length", label: "Length", add: "stay under 100 words", rules: ["long"] },
  ];
  const READINGS = [
    ["river", "A riverbank: the land at the edge of a river"],
    ["money", "A financial bank: where people keep and borrow money"],
    ["expert", "A technical answer: interest rates, reserves, regulation"],
    ["noexample", "Any example the AI picks, or none at all"],
    ["long", "Any length: maybe one line, maybe a whole page"],
  ];

  /* ---------- 4. What the model needs, and how to supply it ---------- */
  const NEEDS = [
    ["A clear task", "Use a direct instruction: “Compare these two proposals.”"],
    ["Relevant information", "Give the facts, documents, audience and purpose."],
    ["A pattern to follow", "Show a few good examples (few-shot prompting)."],
    ["A useful perspective", "Give it a role: “Review this as an editor.”"],
    ["A defined result", "Say the format, length and details you need."],
    ["Manageable stages", "Split a big task into steps and check each one."],
  ];
  const SHUF = [3, 0, 5, 2, 4, 1];

  /* ---------- 5. A good prompt, labelled ---------- */
  const PARTS = [
    ["task", "The task", "Using the meeting notes below, write a project update for my manager."],
    ["focus", "What matters", "Focus on decisions, deadlines and unresolved issues."],
    ["format", "Format and length", "Use three sections with those names, and stay under 200 words."],
    ["ground", "Stay with the facts", "Use only information in the notes."],
    ["missing", "What to do when info is missing", "If an owner or deadline is missing, write “Not specified.”"],
    ["data", "The information", "Meeting notes:\n[paste notes here]"],
  ];

  /* ---------- 6. Quick check ---------- */
  const QS = [
    ["Writing a better prompt permanently teaches the model new facts.", false, "No. A prompt only changes the temporary context for this answer. The trained weights stay exactly the same."],
    ["The model writes its answer one token at a time, and each new token becomes part of the context for the next.", true, "Yes. That loop is how every answer is built, word piece by word piece."],
    ["Telling the AI to “act as an expert” makes its facts more reliable.", false, "No. A role changes the perspective and style, not the evidence. If the model lacks the facts, it can still sound confident and be wrong."],
    ["Adding more text to a prompt always gives a better answer.", false, "No. Relevant, clearly organised details help; unrelated text can make the task harder to follow."],
  ];

  /* ---------- State ---------- */
  let round = 0, step = 0, picked = {}, needSel = null, matched = {}, wrongFlash = null, partOn = "task", quiz = {};

  function trainHTML() {
    const r = ROUNDS[round];
    return `<p class="lbl">Training sentence: “The cat sat on the ___” (right answer: mat)</p>
      <div class="hachart">${bars(r.p, "mat")}</div>
      <p class="hasay"><b>Round ${round + 1} of ${ROUNDS.length}.</b> ${esc(r.say)}</p>
      <div class="btnrow">${round > 0 ? `<button class="btn sm" data-ha="train-back">← Back</button>` : ""}${round < ROUNDS.length - 1 ? `<button class="btn sm primary" data-ha="train-next">Train more →</button>` : `<button class="btn sm" data-ha="train-reset">Start again</button>`}</div>`;
  }
  function loopHTML() {
    // step 0: tokens, 1: context, then 2.. : one generated token per step
    const gen = Math.max(0, step - 2), done = gen >= GEN.length;
    const answer = GEN.slice(0, gen).map((g) => g.pick).filter((t) => t !== "[end]").join("");
    const cur = GEN[Math.min(gen, GEN.length - 1)];
    const stage = step === 0 ? 0 : step === 1 ? 1 : 2;
    let body;
    if (step === 0) body = `<p>First the text is cut into <b>tokens</b>: words, parts of words or punctuation. Each colour below is one token.</p><div class="hatoks">${PROMPT_TOKENS.map((t) => `<span>${esc(t.replace(/^ /, "␣"))}</span>`).join("")}</div><p class="crit">␣ marks a space: spaces are usually part of the token.</p>`;
    else if (step === 1) body = `<p>The model reads <b>everything it's been given</b>, not just your question. Apps often add their own instructions or documents.</p>${CONTEXT.map(([k, v]) => `<div class="hactx"><b>${esc(k)}</b>${esc(v)}</div>`).join("")}`;
    else if (!done) body = `<p>Using its trained weights, the model gives every possible next token a chance, then picks one. That token is added to the answer, and the loop runs again.</p>
      <div class="hachart">${bars(cur.p, cur.pick)}</div>`;
    else body = `<p><b>Done.</b> The model picked a special “end” token, so the answer stops. Every answer, from a one-liner to a long essay, is built with this same loop.</p>`;
    return `<div class="hastages">${STAGES.map((s, i) => `<span class="${i === stage || (i === 3 && step >= 2) ? "on" : ""}">${i + 1}. ${s}</span>`).join("")}</div>
      <div class="hastage">${body}</div>
      <div class="haanswer"><p class="lbl">Answer so far</p><p>${answer ? esc(answer) : `<span class="crit">(empty)</span>`}${done ? "" : `<span class="hacursor">▌</span>`}</p></div>
      <div class="btnrow">${step > 0 ? `<button class="btn sm" data-ha="loop-back">← Back</button>` : ""}${!done ? `<button class="btn sm primary" data-ha="loop-next">${step === 0 ? "Next: read the context →" : step === 1 ? "Next: write the first token →" : "Next token →"}</button>` : `<button class="btn sm" data-ha="loop-reset">Start again</button>`}</div>`;
  }
  function bankHTML() {
    const on = DETAILS.filter((d) => picked[d.id]);
    const ruled = new Set(on.flatMap((d) => d.rules));
    const prompt = on.length ? `Explain ${picked.meaning ? "what a financial bank does" : "a bank"}${picked.audience ? " to a 12-year-old" : ""}.${picked.example ? " Use a pocket-money example." : ""}${picked.length ? " Stay under 100 words." : ""}` : "Explain a bank.";
    const left = READINGS.filter(([k]) => !ruled.has(k)).length;
    return `<p>Tap a detail to add it to the prompt, and watch the guesswork disappear.</p>
      <div class="hadets">${DETAILS.map((d) => `<button class="hadet ${picked[d.id] ? "on" : ""}" data-ha="det:${d.id}" aria-pressed="${!!picked[d.id]}">${picked[d.id] ? "✓ " : "+ "}${esc(d.label)}</button>`).join("")}</div>
      <pre class="pbox">${esc(prompt)}</pre>
      <p class="lbl" style="margin-top:12px">What the AI has to guess</p>
      <ul class="hareads">${READINGS.map(([k, t]) => `<li class="${ruled.has(k) ? "gone" : ""}">${esc(t)}</li>`).join("")}</ul>
      <p class="hasay">${on.length === DETAILS.length ? "<b>All four details added.</b> You've supplied the meaning, audience, example style and length, so the model knows exactly what a good answer looks like." : `${left} open question${left === 1 ? "" : "s"} left for the AI to guess.`}</p>`;
  }
  function needsHTML() {
    const n = Object.keys(matched).length;
    return `<p>Each thing a model needs has a prompting technique that supplies it. Tap a need on the left, then the way to supply it on the right.</p>
      <div class="hamatch"><div>${NEEDS.map(([need], i) => `<button class="hapill ${matched[i] !== undefined ? "done" : needSel === i ? "sel" : ""}" data-ha="need:${i}" ${matched[i] !== undefined ? "disabled" : ""}>${esc(need)}</button>`).join("")}</div>
        <div>${SHUF.map((j) => { const doneBy = Object.values(matched).includes(j); return `<button class="hapill ans ${doneBy ? "done" : wrongFlash === j ? "bad" : ""}" data-ha="how:${j}" ${doneBy ? "disabled" : ""}>${esc(NEEDS[j][1])}</button>`; }).join("")}</div></div>
      <p class="hasay">${n === NEEDS.length ? "<b>All matched!</b> These are the prompting techniques you'll practise in the next tabs." : needSel == null ? `${n} of ${NEEDS.length} matched. Pick a need first.` : `Now pick how to supply “${esc(NEEDS[needSel][0])}”.`}</p>
      ${n ? `<button class="linkish" data-ha="needs-reset">Start again</button>` : ""}`;
  }
  function partsHTML() {
    const p = PARTS.find((x) => x[0] === partOn);
    return `<p>Here's a prompt that gives the model everything it needs. Tap a label to see which part does what.</p>
      <div class="hadets">${PARTS.map(([k, l]) => `<button class="hadet ${k === partOn ? "on" : ""}" data-ha="part:${k}">${esc(l)}</button>`).join("")}</div>
      <pre class="pbox haprompt">${PARTS.map(([k, , t]) => `<span class="${k === partOn ? "hl" : ""}">${esc(t)}</span>`).join("")}</pre>
      <p class="hasay"><b>${esc(p[1])}:</b> ${esc({ task: "says exactly what to produce and for whom.", focus: "tells the model which details matter, so it doesn't fill space with the rest.", format: "defines the result, so you know what you'll get back.", ground: "keeps the model to your source, which cuts down on made-up details.", missing: "gives a safe way out, so the model doesn't invent an owner or a date.", data: "is the information the model works from. Without it, the model could only guess." }[p[0]])}</p>`;
  }
  function quizHTML() {
    return `<ol class="haquiz">${QS.map(([q, a, why], i) => `<li><p>${esc(q)}</p><div class="btnrow" style="margin:6px 0 0">${["True", "False"].map((l) => { const v = l === "True", mine = quiz[i] === v; return `<button class="btn sm ${quiz[i] !== undefined && mine ? (v === a ? "ok" : "no") : ""}" data-ha="q:${i}:${v}">${l}</button>`; }).join("")}</div>
      ${quiz[i] !== undefined ? `<p class="hasay ${quiz[i] === a ? "good" : "bad"}">${quiz[i] === a ? "✓" : "✗"} ${esc(why)}</p>` : ""}</li>`).join("")}</ol>`;
  }

  function html() {
    return `<section class="m2sec hasec">
      <header><p class="kicker">Start here · about 15 minutes</p><h2>How an AI answers your prompt</h2>
        <p>Before learning to write prompts, it helps to know what's on the other end. An <b>AI model</b> is a mathematical system trained to spot patterns and use them to produce an output. For prompting, we usually mean a <b>large language model (LLM)</b>: a model that works with language.</p>
        <p class="tip"><b>The big idea:</b> training builds the model's skills. Your prompt steers those skills towards your task.</p></header>
      <div class="card2"><p class="kicker">1 · Before you ever use it</p><h3>Training: learning from mistakes</h3>
        <p>The model practises one simple task billions of times: <b>predict the next piece of text</b>. Each wrong guess is used to adjust its <b>weights</b>, the millions of internal numbers that decide its answers. Later training also teaches it to follow instructions.</p>
        <div id="ha-train">${trainHTML()}</div></div>
      <div class="card2"><p class="kicker">2 · Every time you send a prompt</p><h3>The answer is built one token at a time</h3>
        <div id="ha-loop">${loopHTML()}</div>
        <p class="crit" style="margin:10px 0 0">Even though the answer comes out piece by piece, the work behind each piece is powerful enough for translation, planning and reasoning. <a href="https://developers.google.com/machine-learning/crash-course/llm" target="_blank" rel="noopener">Google's introduction to language models ↗</a></p></div>
      <div class="card2"><p class="kicker">3 · Why the prompt matters</p><h3>Same model, different prompt, different answer</h3>
        <p>The prompt is part of the context the model reads, so changing it changes the answer. “Explain a bank” leaves lots of choices open.</p>
        <div id="ha-bank">${bankHTML()}</div>
        <p class="tip">A prompt changes only the temporary context for this answer. It does <b>not</b> change the model's trained weights: the model doesn't “learn” from your chat.</p></div>
      <div class="card2"><p class="kicker">4 · Game</p><h3>Match what the model needs to how you supply it</h3>
        <div id="ha-needs">${needsHTML()}</div></div>
      <div class="card2"><p class="kicker">5 · Put together</p><h3>A prompt that gives the model what it needs</h3>
        <div id="ha-parts">${partsHTML()}</div>
        <p class="crit" style="margin:10px 0 0">More text isn't automatically better. Relevant, clearly organised context helps; unrelated information makes the task harder to follow.</p></div>
      <div class="card2"><p class="kicker">6 · Link to hallucination</p><h3>Why a confident answer can still be wrong</h3>
        <p>The model always produces a <b>convincing next piece of text</b>, even when its facts are incomplete or wrong. Clear prompts and good sources help, but important claims still need checking. You'll practise this in the <button class="wordlink" data-tab="hunt">Hallucination hunt</button>.</p>
        <p class="lbl" style="margin-top:12px">Quick check: true or false?</p>
        <div id="ha-quiz">${quizHTML()}</div>
        <div class="btnrow"><button class="btn primary" data-tab="learn">Next: learn to write good prompts →</button></div></div>
    </section>`;
  }

  const PANES = { train: ["ha-train", trainHTML], loop: ["ha-loop", loopHTML], det: ["ha-bank", bankHTML], need: ["ha-needs", needsHTML], how: ["ha-needs", needsHTML], needs: ["ha-needs", needsHTML], part: ["ha-parts", partsHTML], q: ["ha-quiz", quizHTML] };
  let root = null;
  function mount(el) {
    if (root === el) return; root = el;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ha]"); if (!b || !el.querySelector(".hasec")) return;
      const [k, a, c] = b.dataset.ha.split(/[:-]/);
      if (k === "train") round = a === "next" ? round + 1 : a === "back" ? round - 1 : 0;
      else if (k === "loop") step = a === "next" ? step + 1 : a === "back" ? step - 1 : 0;
      else if (k === "det") picked[a] = !picked[a];
      else if (k === "need") { needSel = +a; wrongFlash = null; }
      else if (k === "how") { if (needSel == null) return; if (+a === needSel) { matched[needSel] = +a; needSel = null; wrongFlash = null; } else wrongFlash = +a; }
      else if (k === "needs") { matched = {}; needSel = null; wrongFlash = null; }
      else if (k === "part") partOn = a;
      else if (k === "q") quiz[+a] = c === "true";
      const [id, fn] = PANES[k]; const pane = document.getElementById(id); if (pane) pane.innerHTML = fn();
    });
  }

  window.WB_HOWAI = { html, mount };
})();
