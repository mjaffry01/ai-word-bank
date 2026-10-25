// Module 4: How large language models work. A lesson, a real tokenizer, a next-word game with temperature,
// an attention explorer, a hallucination demo, a context-window lab, a hand-in, and a three-level quiz.
(function () {
  const MODULE = "Module 4: How LLMs work";
  const TOKENIZER_URL = "https://cdn.jsdelivr.net/npm/gpt-tokenizer@2.1.2/dist/cl100k_base.js";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const word = (term, label) => `<button class="wordlink" data-word="${esc(term)}" title="Open in the learning web">${esc(label || term)}</button>`;
  const TABS = [["learn", "Lesson"], ["tokens", "Tokenizer lab"], ["next", "Next-word game"], ["attn", "Attention"], ["halluc", "Why it hallucinates"], ["ctx", "Context window"], ["task", "Hand-in"], ["quiz", "Quiz"]];
  let tab = store.get("wb-m4-tab", "learn");

  /* ---------- 1. Lesson ---------- */
  const lesson = () => `<section class="m2sec">
    <header><p class="kicker">Lesson · about 25 minutes</p><h2>What is really happening inside a chatbot?</h2>
      <p>ChatGPT, Claude and Gemini are ${word("Large Language Model (LLM)", "large language models")}. Underneath the chat window they all do one surprisingly simple thing, billions of times.</p></header>

    <div class="card2"><p class="kicker">1 · The big idea</p><h3>A very, very good next-word predictor</h3>
      <p>An LLM looks at the text so far and predicts what comes next, one ${word("Token", "token")} at a time. Then it adds that token to the text and predicts again. That loop is called ${word("Next-token Prediction", "next-token prediction")}, and it is how every answer is written.</p>
      <pre class="pbox">The cat sat on the  →  mat (38%)   floor (17%)   sofa (12%)   …
The cat sat on the mat  →  and (21%)   .  (19%)   while (8%)   …</pre>
      <p style="margin-top:10px">Your phone's keyboard suggestions do the same, but with a tiny model. An LLM does it with billions of ${word("Parameters", "parameters")} trained on a large part of the internet, so the predictions come out as fluent paragraphs, code and reasoning.</p>
    </div>

    <div class="card2"><p class="kicker">2 · How one answer is made</p><h3>From your words to its words</h3>
      <div class="pipeline">
        <div><span class="n">1</span><b>Tokens</b><small>Your text is split into tokens and turned into numbers</small></div>
        <div><span class="n">2</span><b>Embeddings</b><small>Each token becomes a list of numbers that captures its meaning</small></div>
        <div><span class="n">3</span><b>Attention</b><small>Every token looks at the others to work out what it means here</small></div>
        <div><span class="n">4</span><b>Probabilities</b><small>The model scores every possible next token</small></div>
        <div><span class="n">5</span><b>Pick one</b><small>One token is chosen, sometimes with a little randomness</small></div>
        <div><span class="n">6</span><b>Repeat</b><small>Add it to the text and go again, until the answer ends</small></div>
      </div>
      <p style="margin-top:10px">Steps 2 to 4 happen inside the ${word("Transformer", "transformer")}, the design behind every modern LLM. You'll try steps 1, 3 and 5 yourself in this module.</p>
    </div>

    <div class="card2"><p class="kicker">3 · How a model is built</p><h3>Three stages of training</h3>
      <div class="stages">
        <div><p class="lbl">Stage 1</p><h3>${word("Pre-training", "Pre-training")}</h3><p>The model reads a huge amount of text, trillions of tokens, and practises predicting the next token. This takes months on thousands of ${word("GPU (Graphics Processing Unit)", "GPUs")}. The result is a ${word("Base Model", "base model")}: it knows a lot, but it only continues text.</p></div>
        <div><p class="lbl">Stage 2</p><h3>${word("Instruction Tuning", "Instruction tuning")}</h3><p>It is trained on examples of good questions and answers, so it learns to follow instructions and reply like an assistant.</p></div>
        <div><p class="lbl">Stage 3</p><h3>${word("RLHF (Reinforcement Learning from Human Feedback)", "Feedback (RLHF)")}</h3><p>People rate different answers, and the model is nudged towards the kind of answers they prefer: helpful, honest and safe.</p></div>
      </div>
      <p class="tip" style="margin-top:12px">Like a student who reads a whole library, then does an apprenticeship, then gets feedback from customers.</p>
    </div>

    <div class="card2"><p class="kicker">4 · Where the knowledge lives</p><h3>Patterns, not a database</h3>
      <ul>
        <li>An LLM doesn't look facts up. Everything it "knows" is stored as patterns in its weights, the billions of numbers set during training.</li>
        <li>That's why it can be fluent and still wrong: it produces text that <i>sounds</i> likely, and likely is not the same as true. This is a ${word("Hallucination", "hallucination")}.</li>
        <li>Its weights stop changing when training ends, so it has a ${word("Knowledge Cutoff", "knowledge cutoff")}, unless a tool lets it search or you paste in fresh information.</li>
      </ul>
    </div>

    <div class="card2"><p class="kicker">5 · Strengths and limits</p><h3>What LLMs are good and bad at</h3>
      <div class="vs">
        <div><p class="lbl good">Good at</p><ul><li>Writing, rewriting, summarising, translating</li><li>Explaining ideas at different levels</li><li>Drafting code and spotting errors</li><li>Brainstorming and structuring ideas</li></ul></div>
        <div><p class="lbl bad">Weak at</p><ul><li>Guaranteed facts, quotes and sources</li><li>Recent events (without tools)</li><li>Exact counting and letter-level tasks</li><li>Knowing when it doesn't know</li></ul></div>
      </div>
    </div>
  </section>`;

  /* ---------- 2. Tokenizer lab (real GPT-4 tokenizer, loaded on demand) ---------- */
  let tokenizer = null, tokState = "idle";
  function loadTokenizer() {
    if (tokState !== "idle") return;
    tokState = "loading";
    const s = document.createElement("script");
    s.src = TOKENIZER_URL; s.async = true;
    s.onload = () => { tokenizer = window.GPTTokenizer_cl100k_base || null; tokState = tokenizer ? "ready" : "failed"; if (tab === "tokens") updateTokens(); };
    s.onerror = () => { tokState = "failed"; if (tab === "tokens") updateTokens(); };
    document.head.appendChild(s);
  }
  // Rough fallback if the tokenizer can't load: words, numbers and punctuation
  const roughTokens = (t) => t.match(/ ?[A-Za-z]{1,6}| ?\d{1,3}| ?[^\sA-Za-z\d]|\s+/g) || [];
  const TOK_EXAMPLES = ["I love strawberries! How many r's are in strawberry?", "Tokenization is surprisingly important.", "मुझे सीखना पसंद है", "I like learning", "supercalifragilisticexpialidocious", "def add(a, b):\n    return a + b", "2025 + 1,234 = 3,259"];
  let tokText = store.get("wb-m4-toktext", TOK_EXAMPLES[0]);
  const tokens = () => {
    loadTokenizer();
    return `<section class="m2sec">
    <header><p class="kicker">Lab · 10 minutes</p><h2>See text the way a model sees it</h2><p>Type anything below. It is split with the real tokenizer used by GPT-4-era models. Each coloured block is one ${word("Token", "token")}.</p></header>
    <div class="card2">
      <div class="field"><label for="m4tok">Your text</label><textarea id="m4tok" rows="3">${esc(tokText)}</textarea></div>
      <div class="chips4">${TOK_EXAMPLES.map((t, i) => `<button class="choice" data-tokex="${i}">${esc(t.length > 26 ? t.slice(0, 24) + "…" : t.replace(/\n/g, " "))}</button>`).join("")}</div>
    </div>
    <div class="card2"><p class="kicker">How the model sees it</p>
      <div class="toks" id="m4toks"></div>
      <div class="tokstats" id="m4stats"></div>
      <p class="tokids" id="m4ids"></p>
      <p class="savemsg" id="m4tokmsg"></p>
    </div>
    <div class="card2"><p class="kicker">Try this</p><h3>Things to notice</h3>
      <ul>
        <li><b>strawberry</b> becomes a few chunks, not 10 letters. That's why models often miscount the r's: they never see single letters.</li>
        <li>Compare <b>"I like learning"</b> with the same sentence in <b>Hindi</b>. Many languages need far more tokens for the same meaning, so they cost more and fill the ${word("Context Window", "context window")} faster.</li>
        <li>Common words are one token. Rare or made-up words are split into pieces.</li>
        <li>Rule of thumb: in English, <b>1 token ≈ ¾ of a word</b>, so 1,000 tokens is about 750 words. AI services charge per token (${word("Cost per Token", "cost per token")}).</li>
      </ul>
    </div>
  </section>`;
  };
  function updateTokens() {
    const box = $("m4toks"); if (!box) return;
    const text = tokText;
    let parts, ids = null;
    if (tokenizer) { ids = tokenizer.encode(text); parts = ids.map((id) => tokenizer.decode([id])); }
    else parts = roughTokens(text);
    box.innerHTML = parts.map((p, i) => `<span class="tok c${i % 5}">${esc(p.replace(/\n/g, "↵"))}</span>`).join("") || `<span style="color:var(--muted)">Type something above.</span>`;
    const words = (text.trim().match(/\S+/g) || []).length;
    $("m4stats").innerHTML = `<div class="stat"><b>${parts.length}</b><span>Tokens</span></div><div class="stat"><b>${text.length}</b><span>Characters</span></div><div class="stat"><b>${words}</b><span>Words</span></div><div class="stat"><b>${words ? (parts.length / words).toFixed(2) : "–"}</b><span>Tokens per word</span></div>`;
    $("m4ids").textContent = ids ? "Token IDs (what the model actually receives): " + ids.slice(0, 60).join(", ") + (ids.length > 60 ? " …" : "") : "";
    $("m4tokmsg").textContent = tokState === "loading" ? "Loading the real tokenizer… (showing a rough split for now)" : tokState === "failed" ? "The real tokenizer couldn't load, so this is a rough split by words and punctuation." : "";
  }

  /* ---------- 3. Next-word game (illustrative probabilities) with temperature ---------- */
  const NEXT = [
    { p: "The cat sat on the", w: [["mat", 38], ["floor", 17], ["sofa", 12], ["bed", 9], ["chair", 7], ["roof", 5], ["keyboard", 4], ["moon", 1]] },
    { p: "Once upon a", w: [["time", 94], ["midnight", 2], ["hill", 1.2], ["star", 1], ["dream", 0.8], ["Tuesday", 0.4]] },
    { p: "My favourite food is", w: [["pizza", 21], ["pasta", 12], ["sushi", 10], ["chocolate", 8], ["chicken", 7], ["rice", 6], ["anything", 3], ["sunlight", 0.3]] },
    { p: "The capital of Australia is", w: [["Canberra", 62], ["Sydney", 23], ["Melbourne", 9], ["Perth", 2], ["Brisbane", 2], ["Vienna", 0.5]] },
    { p: "To make a cup of tea, first", w: [["boil", 41], ["fill", 18], ["put", 14], ["heat", 11], ["take", 7], ["choose", 4], ["dance", 0.2]] },
  ];
  let nextIdx = store.get("wb-m4-nexti", 0), temp = store.get("wb-m4-temp", 1), samples = [], lastPick = null;
  function dist(item, T) {
    const t = Math.max(T, 0.01), raw = item.w.map(([, p]) => Math.pow(p / 100, 1 / t)), sum = raw.reduce((a, b) => a + b, 0);
    return item.w.map(([w], i) => [w, raw[i] / sum]);
  }
  function sample(item, T) {
    const d = dist(item, T);
    if (T <= 0.05) return d.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    let r = Math.random(), acc = 0;
    for (const [w, p] of d) { acc += p; if (r <= acc) return w; }
    return d[d.length - 1][0];
  }
  const tempLabel = (T) => T <= 0.05 ? "0 · always the most likely word" : T < 0.6 ? T.toFixed(1) + " · focused and predictable" : T <= 1.2 ? T.toFixed(1) + " · balanced" : T.toFixed(1) + " · creative and risky";
  const probsHTML = (item, T, picked) => dist(item, T).map(([w, p]) => `<div class="prob ${w === picked ? "picked" : ""}"><span class="w">${esc(w)}</span><span class="track"><span class="fill" style="width:${(p * 100).toFixed(1)}%"></span></span><span class="pct">${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%</span></div>`).join("");
  const next = () => {
    const item = NEXT[nextIdx];
    return `<section class="m2sec">
    <header><p class="kicker">Lab · 15 minutes</p><h2>Be the model: pick the next word</h2><p>The bars show how likely each next word is. Move the ${word("Temperature", "temperature")} slider and press <b>Generate</b> a few times. The percentages are illustrative, but the behaviour is exactly how real models choose words.</p></header>
    <div class="card2">
      <div class="chips4" style="margin:0 0 14px">${NEXT.map((n, i) => `<button class="choice" data-next="${i}" aria-pressed="${i === nextIdx}">${esc(n.p)}…</button>`).join("")}</div>
      <p class="prompt4">${esc(item.p)} <span class="blank" id="m4blank">${lastPick ? esc(lastPick) : "___"}</span></p>
      <div class="probs" id="m4probs">${probsHTML(item, temp, lastPick)}</div>
      <label for="m4temp" class="lbl" style="display:block;margin-top:16px">Temperature: <span id="m4templbl">${tempLabel(temp)}</span></label>
      <input type="range" class="slider" id="m4temp" min="0" max="2" step="0.1" value="${temp}">
      <div class="btnrow"><button class="btn primary" data-gen>Generate</button><button class="btn" data-gen10>Generate 10 times</button><button class="btn sm" data-genclear>Clear</button></div>
      <div class="samples" id="m4samples">${samples.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
    </div>
    <div class="card2"><p class="kicker">What to notice</p><h3>Temperature in one sentence</h3>
      <ul>
        <li><b>Temperature 0:</b> it always picks the top word, so you get the same answer every time. Good for facts and code.</li>
        <li><b>Around 1:</b> mostly likely words, with some variety. The default in many chat apps.</li>
        <li><b>High (1.5–2):</b> unlikely words get picked much more often. More creative, but also more mistakes. Try "The capital of Australia is" at 2 and count how often it says Sydney.</li>
      </ul>
      <p class="tip">Every word of every answer is chosen this way, so the same question can give different answers.</p>
    </div>
  </section>`;
  };
  function refreshNext() {
    const item = NEXT[nextIdx];
    if ($("m4probs")) $("m4probs").innerHTML = probsHTML(item, temp, lastPick);
    if ($("m4blank")) $("m4blank").textContent = lastPick || "___";
    if ($("m4templbl")) $("m4templbl").textContent = tempLabel(temp);
    if ($("m4samples")) $("m4samples").innerHTML = samples.map((s) => `<span>${esc(s)}</span>`).join("");
  }

  /* ---------- 4. Attention explorer (illustrative weights) ---------- */
  const ATTN = [
    { s: "The animal didn't cross the street because it was too tired", focus: { it: { animal: 0.52, street: 0.12, tired: 0.14, The: 0.03, cross: 0.05, was: 0.06 }, tired: { it: 0.34, animal: 0.28, was: 0.14, too: 0.12 } }, note: "\"it\" pays most attention to \"animal\": tired things are animals, not streets." },
    { s: "The animal didn't cross the street because it was too wide", focus: { it: { street: 0.5, animal: 0.14, wide: 0.17, cross: 0.08, was: 0.05 }, wide: { it: 0.31, street: 0.33, too: 0.15, was: 0.1 } }, note: "Change one word and \"it\" now looks at \"street\": wide things are streets. Attention follows meaning." },
    { s: "She sat on the bank of the river and watched the water", focus: { bank: { river: 0.46, water: 0.2, sat: 0.12, of: 0.06, She: 0.04 } }, note: "Here \"bank\" attends to \"river\" and \"water\", so the model reads it as a riverbank." },
    { s: "He went to the bank to pay money into his account", focus: { bank: { money: 0.38, account: 0.3, pay: 0.16, went: 0.05, He: 0.03 } }, note: "Same word, different neighbours: \"bank\" attends to \"money\" and \"account\", so it means a bank you keep money in." },
  ];
  let attnIdx = store.get("wb-m4-attni", 0), attnWord = null;
  const words4 = (s) => s.split(" ");
  const attn = () => {
    const a = ATTN[attnIdx], weights = attnWord ? a.focus[attnWord] : null;
    return `<section class="m2sec">
    <header><p class="kicker">Lab · 10 minutes</p><h2>Attention: how a word finds its meaning</h2><p>${word("Attention Mechanism", "Attention")} lets each word look at every other word and decide which ones matter for understanding it. Click an underlined word to see where it "looks". The darker the highlight, the more attention.</p></header>
    <div class="card2">
      <div class="chips4" style="margin:0 0 14px">${ATTN.map((x, i) => `<button class="choice" data-attn="${i}" aria-pressed="${i === attnIdx}">Sentence ${i + 1}</button>`).join("")}</div>
      <div class="attn">${words4(a.s).map((w) => {
        const key = w.replace(/[^A-Za-z']/g, ""), clickable = !!a.focus[key], wt = weights ? (weights[key] || 0) : 0;
        const bg = weights && wt ? `background:color-mix(in srgb,var(--accent) ${Math.round(15 + wt * 160)}%,transparent);color:${wt > 0.3 ? "var(--accent-ink)" : "var(--fg)"}` : "";
        return `<button class="${clickable ? "click" : ""} ${attnWord === key ? "focus" : ""}" ${clickable ? `data-aword="${esc(key)}"` : "disabled"} style="${bg}">${esc(w)}${weights && wt ? `<span class="wt">${Math.round(wt * 100)}%</span>` : ""}</button>`;
      }).join("")}</div>
      <p style="margin-top:12px">${attnWord ? esc(a.note) : `Click <b>${Object.keys(a.focus).map(esc).join("</b> or <b>")}</b>.`}</p>
    </div>
    <div class="card2"><p class="kicker">Why it matters</p><h3>Context changes meaning</h3>
      <p>Compare sentences 1 and 2, then 3 and 4. The same word means different things depending on its neighbours, and attention is how the model works that out. Real models run many attention patterns at once (${word("Multi-head Attention", "multi-head attention")}) across dozens of layers. The weights here are simplified to show the idea.</p>
    </div>
  </section>`;
  };

  /* ---------- 5. Why it hallucinates ---------- */
  const MARS = { p: "The first person to walk on Mars was", w: [["Neil", 19], ["Elon", 14], ["John", 11], ["an", 10], ["Buzz", 8], ["Mark", 6], ["Yuri", 5], ["nobody", 3]] };
  let marsPick = null;
  const halluc = () => `<section class="m2sec">
    <header><p class="kicker">Concept · 15 minutes</p><h2>Why LLMs make things up</h2><p>Now you know how answers are made, ${word("Hallucination", "hallucinations")} make sense. The model is choosing <i>likely</i> next words, not checking facts.</p></header>
    <div class="card2"><p class="kicker">Demo</p><h3>A question with no true answer</h3>
      <p>Nobody has walked on Mars. But sentences shaped like "The first person to walk on … was …" are almost always followed by a name, so names get most of the probability.</p>
      <p class="prompt4">${esc(MARS.p)} <span class="blank">${marsPick ? esc(marsPick) : "___"}</span></p>
      <div class="probs">${probsHTML(MARS, 1, marsPick)}</div>
      <div class="btnrow"><button class="btn primary" data-mars>Generate</button></div>
      ${marsPick ? `<p class="savemsg ${marsPick === "nobody" ? "ok" : "err"}" style="font-size:1rem">${marsPick === "nobody" ? "It picked the true answer this time, but only about 3% of the time." : `"${esc(marsPick)}…": a confident start to a false answer. The rest of the sentence will be made up to fit.`}</p>` : ""}
      <p class="crit" style="margin-top:8px">Probabilities are illustrative. Modern assistants are trained to catch questions like this one, but the same pull towards a plausible-sounding answer causes hallucinations on harder or more obscure questions.</p>
    </div>
    <div class="card2"><p class="kicker">Causes</p><h3>Four reasons it happens</h3>
      <div class="flags">
        <div><b>Likely ≠ true</b>Training rewards text that sounds right, and most of the time that is also right, but not always.</div>
        <div><b>Gaps in training data</b>On rare topics it has seen little, so it fills the gap with something plausible.</div>
        <div><b>Knowledge cutoff</b>It knows nothing after training ended, but may still answer as if it did.</div>
        <div><b>Pressure to answer</b>Feedback training can reward confident, helpful-sounding replies over "I don't know".</div>
      </div>
    </div>
    <div class="card2"><p class="kicker">Fixes</p><h3>What reduces it (from Module 2)</h3>
      <ul>
        <li>${word("Grounding", "Ground it")}: paste the source text and say "use only this text".</li>
        <li>Give it tools: web search or a database, which is the idea behind ${word("RAG (Retrieval-Augmented Generation)", "RAG")}, coming in Module 5.</li>
        <li>Ask it to say "I don't know" when unsure, and check names, numbers and sources yourself.</li>
        <li>Use a lower ${word("Temperature", "temperature")} for factual tasks.</li>
      </ul>
    </div>
  </section>`;

  /* ---------- 6. Context window lab ---------- */
  const CHAT = [
    ["sys", "Instruction", "Always reply in French, whatever language I use.", 14],
    ["user", "You", "Hi! Can you help me plan a trip to Japan?", 12],
    ["ai", "AI", "Bien sûr ! Combien de jours resterez-vous au Japon ?", 16],
    ["user", "You", "Ten days. I love food, temples and nature. I'm on a mid-range budget.", 20],
    ["ai", "AI", "Voici un itinéraire de dix jours : Tokyo, Hakone, Kyoto, Nara et Osaka…", 180],
    ["user", "You", "Can you add more detail for the Kyoto days?", 11],
    ["ai", "AI", "À Kyoto, commencez par Fushimi Inari tôt le matin, puis…", 210],
    ["user", "You", "What about train passes? Is the JR Pass still worth it?", 14],
    ["ai", "AI", "Le JR Pass est plus cher depuis 2023 ; pour votre trajet…", 190],
    ["user", "You", "Thanks. Now list ten foods I must try, with a short description of each.", 17],
    ["ai", "AI", "1. Ramen : … 2. Sushi : … 3. Okonomiyaki : … (dix plats)", 260],
    ["user", "You", "Great. What should I pack for autumn?", 9],
  ];
  const WINDOW = 800;
  let ctxN = store.get("wb-m4-ctxn", 4);
  function ctxState(n) {
    const msgs = CHAT.slice(0, n).map((m, i) => ({ m, i, inside: true }));
    let total = msgs.reduce((s, x) => s + x.m[3], 0);
    for (let k = 0; total > WINDOW && k < msgs.length; k++) { msgs[k].inside = false; total -= msgs[k].m[3]; }
    return { msgs, total, sysIn: msgs[0] && msgs[0].inside };
  }
  const ctx = () => {
    const st = ctxState(ctxN), used = Math.min(st.total, WINDOW);
    return `<section class="m2sec">
    <header><p class="kicker">Lab · 10 minutes</p><h2>The context window: the model's short-term memory</h2><p>The model can only see a fixed amount of text at once: its ${word("Context Window", "context window")}. This toy model has room for just ${WINDOW} tokens; real ones hold far more, but the same thing happens. Add messages and watch what falls out.</p></header>
    <div class="card2">
      <p class="lbl" style="margin-bottom:8px">Memory used: ${used} of ${WINDOW} tokens</p>
      <div class="ctxbar">${st.msgs.filter((x) => x.inside).map((x) => `<i class="${x.m[0]}" style="width:${(x.m[3] / WINDOW) * 100}%" title="${esc(x.m[1])}: ${x.m[3]} tokens"></i>`).join("")}</div>
      <div class="legend3"><span><i style="background:var(--t3)"></i>Your instruction</span><span><i style="background:var(--t0)"></i>Your messages</span><span><i style="background:var(--t1)"></i>AI replies</span></div>
      <div class="chat4">${st.msgs.map((x) => `<div class="${x.m[0] === "sys" ? "sysmsg" : ""}"><span class="who">${esc(x.m[1])}</span><span class="${x.inside ? "" : "out"}">${esc(x.m[2])}</span><span class="n">${x.inside ? x.m[3] + " tok" : "dropped"}</span></div>`).join("")}</div>
      <div class="btnrow"><button class="btn primary" data-ctxadd ${ctxN >= CHAT.length ? "disabled" : ""}>Add the next message</button><button class="btn sm" data-ctxreset>Start again</button></div>
      ${ctxN >= 2 && CHAT[ctxN - 1][0] === "user" ? `<div class="reply4 ${st.sysIn ? "" : "lost"}"><p class="lbl ${st.sysIn ? "good" : "bad"}">The model's next reply</p><p style="margin:0">${st.sysIn ? "Répondu en français, comme demandé. ✓ The instruction is still inside the window." : "Answered in English. ✗ The \"reply in French\" instruction has dropped out of the window, so the model can no longer see it."}</p></div>` : ""}
    </div>
    <div class="card2"><p class="kicker">Lessons</p><h3>Working with a limited memory</h3>
      <ul><li>Long chats push early messages out, including your instructions. Repeat important rules, or start a new chat.</li>
        <li>Long AI replies fill the window fastest. Asking for shorter answers keeps more of the conversation in view.</li>
        <li>Real context windows range from about 8,000 to over a million tokens, but even large ones pay less attention to details buried in the middle.</li></ul>
    </div>
  </section>`;
  };

  /* ---------- 7. Hand-in ---------- */
  const task = () => {
    const done = store.get("wb-m4-done", false);
    return `<section class="m2sec">
    <header><p class="kicker">Hands-on task · 20 minutes · hand in</p><h2>Same prompt, different answers</h2><p>Explain real AI behaviour using what you've learned: tokens, next-word prediction, temperature, training data and the context window.</p></header>
    <div class="card2"><p class="kicker">Steps</p><ol class="steps3">
      <li><span>Pick one prompt, for example <i>"Write a two-line poem about the sea"</i> or <i>"Who won the 1998 football World Cup, and what was the score?"</i></span></li>
      <li><span>Run it <b>three times</b> in the same AI tool, using a new chat each time. Note how the answers differ.</span></li>
      <li><span>Run it once in a <b>different</b> AI tool, for example ChatGPT and Claude, or Gemini and Copilot.</span></li>
      <li><span>Explain the differences using at least two ideas from this module.</span></li>
    </ol></div>
    <div class="card2"><p class="kicker">Hand in</p><h3>Your findings <span class="pill2 ${done ? "done" : ""}" style="vertical-align:middle;margin-left:6px">${done ? "Handed in" : "To do"}</span></h3>
      <div class="field"><label for="m4p">The prompt you used, and which tools</label><textarea id="m4p" rows="2"></textarea></div>
      <div class="field"><label for="m4diff">How did the answers differ (same tool vs different tools)?</label><textarea id="m4diff" rows="3"></textarea></div>
      <div class="field"><label for="m4why">Why? Explain using ideas from this module</label><textarea id="m4why" rows="4" placeholder="e.g. The words changed each time because the model samples the next token with some randomness (temperature)…"></textarea></div>
      <div class="btnrow" style="margin:0"><button class="btn primary" data-m4handin>Hand in</button></div><p class="savemsg" id="m4msg" hidden></p>
    </div>
  </section>`;
  };
  async function handIn() {
    const msg = $("m4msg"); msg.hidden = false;
    const p = $("m4p").value.trim(), d = $("m4diff").value.trim(), w = $("m4why").value.trim();
    if (!p || !w) { msg.className = "savemsg err"; msg.textContent = "Fill in your prompt and your explanation first."; return; }
    if (!window.WB || !window.WB.call) { msg.className = "savemsg err"; msg.textContent = "You need to be signed in and approved to hand in work."; return; }
    const btn = document.querySelector("[data-m4handin]"); btn.disabled = true; msg.className = "savemsg"; msg.textContent = "Handing in…";
    try {
      await window.WB.call("saveSubmission", { submission: { module: MODULE, task: "Same prompt, different answers", tool: "Several AI tools", prompt: p, reflection: `DIFFERENCES: ${d || "-"}\nWHY: ${w}` } });
      store.set("wb-m4-done", true); msg.className = "savemsg ok"; msg.textContent = "Handed in. Your teacher can see it.";
    } catch (e) { msg.className = "savemsg err"; msg.textContent = e && e.error === "signed_out" ? "Your sign-in has ended. Sign in again, then hand in." : "This could not be handed in. Check your connection and try again."; }
    btn.disabled = false;
  }

  /* ---------- 8. Quiz: three levels ---------- */
  const QUIZ = [
    { q: "At its core, how does an LLM write an answer?", o: ["It predicts the next token, adds it, and repeats", "It looks up a stored answer to each question", "It searches the internet for the best web page", "It copies a full answer that a person wrote"], why: "Every answer is built one token at a time by predicting what comes next." },
    { q: "What is a token?", o: ["A chunk of text, often part of a word", "A password that unlocks the AI tool", "A single letter of the alphabet", "One full sentence or line of the model's answer"], why: "Text is split into tokens: common words are one token, rare words are split into pieces." },
    { q: "What happens during pre-training?", o: ["The model reads huge amounts of text and practises predicting the next token", "People write a correct answer for every single question it might ever be asked", "The model is connected to the internet so it can look things up", "The model is tested on a small exam before it is released"], why: "Pre-training on trillions of tokens is where the model picks up language and general knowledge." },
    { q: "What does RLHF (reinforcement learning from human feedback) do?", o: ["Uses people's ratings of answers to steer the model's behaviour", "Lets the model read human feedback live while it is answering you", "Teaches the model new facts by asking people questions each day", "Checks every answer for mistakes before you are allowed to see it"], why: "Humans rank answers, and the model is trained towards the kinds they prefer." },
    { q: "If you turn the temperature up, the model's answers become…", o: ["More varied and creative, but riskier", "More accurate and always fact-checked", "Shorter and quicker to arrive", "Exactly the same every time"], why: "Higher temperature gives unlikely words a bigger chance of being picked." },
    { q: "What is the context window?", o: ["The most text the model can take in at one time", "The window on screen where you type your prompt", "The list of websites the model learned from", "The time limit for the model to answer"], why: "It's the model's working memory: your messages, its replies and anything you paste." },
    { q: "Why can an LLM state something false with total confidence?", o: ["It predicts text that sounds likely, which isn't always true", "It is designed to make up facts to keep its answers interesting", "Its training data was full of deliberate lies and false facts", "It always invents facts when the question is very easy"], why: "Fluent, likely-sounding text is the goal of training. Truth often comes with it, but not always." },
    { q: "What is a knowledge cutoff?", o: ["The date after which the model has no training data", "The maximum length of answer the model can write", "The point where the model refuses to answer", "The total amount of knowledge the model is able to hold in memory"], why: "Its training data stops at a date, so later events are unknown unless a tool provides them." },
    { q: "\"A 7B model\" means the model has about…", o: ["7 billion parameters (adjustable numbers)", "7 billion words stored in a database", "7 billion users using it every month", "7 billion web pages it can search"], why: "Parameters are the numbers tuned during training. More usually means more capable, and more expensive to run." },
    { q: "What is the transformer?", o: ["The model design behind modern LLMs, built around attention", "A tool that translates text between many different human languages", "The part of the computer that powers the GPU chips", "A program that turns text into speech and back again"], why: "The transformer architecture, introduced in 2017, made today's LLMs possible." },
    { q: "What does attention let the model do?", o: ["Weigh which other words matter for each word", "Pay closer attention to the user's feelings", "Read the prompt more slowly and carefully", "Ignore every word except the last one"], why: "Attention lets \"it\" find \"animal\", or \"bank\" find \"river\", so each word is read in context." },
    { q: "Why does a very long chat sometimes forget your first instructions?", o: ["Early messages fall outside the context window", "The model gets tired after answering many messages", "The model deletes old messages to save money", "Your first message was saved in the wrong language"], why: "Once the conversation is longer than the window, the oldest text drops out of view." },
    { q: "You want answers about a long report. What best reduces hallucinations?", o: ["Paste the report and ask it to use only that text", "Ask the model whether it has already read the report", "Raise the temperature so it thinks more creatively", "Ask the question several times and keep the longest"], why: "Grounding the answer in text you provide stops the model filling gaps with guesses." },
    { q: "What is the difference between a base model and a chat model?", o: ["The chat model is further trained to follow instructions and converse", "The base model is the free version and the chat model is the paid one", "The chat model has read more of the internet than the base model", "The base model can only answer questions about basic subjects"], why: "Instruction tuning and RLHF turn a text-continuing base model into a helpful assistant." },
    { q: "Where does an LLM keep what it \"knows\"?", o: ["As patterns in its weights, not as a searchable list of facts", "In a database of facts that it checks carefully before every answer", "On the internet, which it reads again for each question", "In a file of past answers from other users' conversations"], why: "Knowledge is spread across billions of weights, which is why it can't simply look facts up." },
  ];
  const QUIZ_MID = [
    { q: "Why can the same sentence cost more in Hindi or Arabic than in English?", o: ["It is often split into more tokens for the same meaning", "AI companies charge a higher price for some languages", "The model has to translate it to English before reading", "Longer words are always charged at a higher rate"], why: "Tokenizers are often built mostly from English text, so other scripts are split into more, smaller pieces." },
    { q: "You ask the same question twice at temperature 0. What happens?", o: ["You get almost the same answer each time", "You get two completely different answers", "The model refuses to answer the second time", "The second answer is always more accurate"], why: "At temperature 0 the most likely token is chosen every time, so the output barely changes." },
    { q: "At a high temperature, \"The capital of Australia is\" sometimes gets \"Sydney\". Why?", o: ["Sydney has a real chunk of probability, and high temperature picks less likely words more often", "The model's knowledge of world geography changes each time you raise the temperature setting", "High temperature makes the model look up a different, less reliable source", "Sydney was the capital until recently, so the model is a little out of date"], why: "Sydney often appears near \"Australia\" in text. Raising the temperature boosts those runner-up words." },
    { q: "Why do models often miscount the letter r in \"strawberry\"?", o: ["They see tokens, which are chunks of letters, not single letters", "The word \"strawberry\" didn't appear in their training data", "They aren't allowed to count things inside a single word", "They always round numbers down to make them simpler"], why: "Tokenization hides individual characters, so letter-level questions are surprisingly hard." },
    { q: "In \"The animal didn't cross the street because it was too tired\", what does attention help \"it\" connect to?", o: ["\"animal\", because tired things are animals", "\"street\", because it is the nearest noun before it", "\"cross\", because that's the main verb", "\"The\", because it's the first word"], why: "Attention uses meaning, not just position. Change \"tired\" to \"wide\" and \"it\" links to \"street\" instead." },
    { q: "What does instruction tuning add to a base model?", o: ["The habit of following instructions and answering helpfully", "Knowledge of all the events that happened after pre-training ended", "The ability to search the internet for information", "A much larger context window for longer conversations"], why: "A base model only continues text. Instruction tuning teaches it to act on requests." },
    { q: "You type \"What is the capital of France?\" into a base model with no chat training. What might it do?", o: ["Continue with more quiz-style questions instead of answering", "Answer \"Paris\" in exactly the same way that a chat model would", "Refuse because it isn't allowed to answer geography questions", "Search the internet and then give you a list of web links"], why: "A base model continues the pattern, and a question often continues as a list of questions." },
    { q: "Why can't an LLM tell you today's news on its own?", o: ["Its weights are fixed after training, so it has no recent information", "News articles are banned from all AI training data, so it never saw any news", "It can, but only if you ask it politely enough", "It deletes recent information to save storage space"], why: "Without a search tool or pasted text, it only knows what was in its training data." },
    { q: "What are embeddings?", o: ["Lists of numbers that represent tokens, with similar meanings close together", "Small images that are embedded inside the answer the model gives you", "Hidden instructions that the AI company places inside every prompt", "The links to sources that the model adds at the end of its answers"], why: "Embeddings turn tokens into points in a space where \"cat\" sits near \"kitten\"." },
    { q: "What does \"autoregressive\" mean for how an LLM writes?", o: ["Each new token is predicted from all the tokens before it, including its own", "It automatically goes back over its answer and corrects any earlier mistakes it made", "It writes the whole answer at once and then reads it back to check it", "It repeats the user's question before it starts writing the answer"], why: "Each token it writes becomes part of the input for the next one. That's also why early mistakes can snowball." },
    { q: "Why doesn't a huge context window completely solve \"forgetting\"?", o: ["Models can pay less attention to details in the middle of very long inputs", "Bigger context windows only work for text written in the English language", "The model refuses to read past the first few thousand tokens of a document", "Large context windows make the model answer at a much higher temperature"], why: "Fitting text in the window isn't the same as using it well. Key details can get lost in long inputs." },
    { q: "How can RLHF make a model sycophantic (too agreeable)?", o: ["People tend to rate agreeable, flattering answers more highly", "The model was trained to always agree with its own earlier answers", "Agreeable answers use fewer tokens, so they are cheaper to produce", "The reward model was trained only on polite customer emails"], why: "If raters prefer answers that agree with them, the model learns that agreeing is rewarded." },
    { q: "The AI's answer stops in the middle of a sentence. What is the most likely cause?", o: ["It reached the maximum number of output tokens", "It ran out of facts it knew about the topic", "The temperature was set too low for the question", "It detected a mistake and stopped on purpose"], why: "A max-tokens limit cuts generation off wherever it happens to be." },
    { q: "You ask \"Are you sure?\" and the model switches a correct answer to a wrong one. Why?", o: ["It predicts a likely reply to doubt rather than re-checking the fact", "It checked again and found a newer source that disagreed with it", "Your question raised the temperature for the following answer", "It always changes its answer when asked the same thing twice"], why: "The model has no separate fact-checker. Doubt in the prompt makes a correction seem like the likely next text." },
    { q: "In the context window lab, why did the model stop replying in French?", o: ["The French instruction dropped out of its window", "The later messages were all written in English, not French", "French uses more tokens, so the model ran out", "The temperature rose as the chat got longer"], why: "Once the instruction was pushed out of the window, the model could no longer see it." },
  ];
  const QUIZ_ADV = [
    { q: "What does the softmax step do at the end of the model?", o: ["Turns raw scores (logits) into probabilities that add up to 1", "Makes the final answer softer and more polite before it is shown to you", "Removes the least likely tokens from the model's vocabulary", "Shrinks the model's weights so that it runs more quickly"], why: "Softmax converts the logits for every token into a probability distribution to sample from." },
    { q: "How is top-k sampling different from temperature?", o: ["Top-k keeps only the k most likely tokens; temperature reshapes all the probabilities", "Top-k raises the probability of rare tokens; temperature removes the common ones", "Top-k chooses the k longest tokens; temperature chooses the k shortest tokens", "They are two names for the same setting used by different AI companies"], why: "They are often combined: cut the candidate list (top-k or top-p), then sample with a temperature." },
    { q: "Why does the cost of standard attention grow so quickly with longer inputs?", o: ["Every token is compared with every other token, so the work grows roughly with the square of the length", "Each extra token has to be translated into English before the model can work with it at all", "Longer inputs force the model to reload all of its weights from storage for every new token", "The model has to re-train itself slightly on every long document that you give it to read"], why: "Doubling the input roughly quadruples the attention work, which is why long contexts are expensive." },
    { q: "Why do transformers need positional encoding?", o: ["Attention by itself doesn't know the order of the words", "It tells the model where the user is located in the world", "It decides which position in the answer to stop writing", "It ranks the tokens by how important each one is"], why: "Without position information, \"dog bites man\" and \"man bites dog\" would look the same to attention." },
    { q: "What is multi-head attention for?", o: ["Running several attention patterns at once to capture different relationships", "Letting several different users chat with the same model at exactly the same time", "Combining the answers of several different models into one single answer", "Giving the model several context windows that it can switch between"], why: "Different heads can track grammar, references, meaning and more, all in parallel." },
    { q: "What is the main benefit of a mixture-of-experts (MoE) model?", o: ["Only part of the network runs for each token, so a large model costs less to use", "Several human experts in different subjects check each answer before the model shows it to you", "It trains separate models for each subject and picks the best one to answer", "It mixes answers from many smaller models to reduce the risk of hallucination"], why: "A router sends each token to a few expert sub-networks, giving big capacity with lower compute per token." },
    { q: "Why doesn't a model's fluency tell you whether it is accurate?", o: ["Training rewards likely text, and likelihood only partly tracks truth", "Fluent answers are generated by a different model from accurate ones", "The model deliberately makes answers less fluent when it is unsure of the facts", "Accuracy is checked separately after the fluent answer is written"], why: "Wrong answers can be just as fluent as right ones. Fluency is not a signal of correctness." },
    { q: "What is distillation?", o: ["Training a smaller model to imitate a larger model's outputs", "Removing harmful content from the training data before training", "Shortening a model's answers so they are easier to read", "Combining two large models into one even larger model"], why: "The student model learns from the teacher's outputs, keeping much of the ability at lower cost." },
    { q: "What is the trade-off with quantization?", o: ["Lower-precision numbers make the model smaller and faster, with a small loss of quality", "Fewer training examples make it much cheaper to train, but it then forgets far more of the facts", "Shorter answers save tokens, but the model can no longer explain its reasoning", "More parameters improve quality, but the model can only run in the cloud"], why: "Storing weights in fewer bits saves memory and speed, usually at a slight cost in accuracy." },
    { q: "How do reasoning models use test-time compute?", o: ["They generate extra reasoning tokens before answering, trading time for accuracy", "They quickly retrain themselves on your particular question before they start to answer it", "They search the internet for every step of the problem they solve", "They run the same answer many times and pick the shortest version"], why: "Spending more tokens thinking helps on multi-step problems, but makes answers slower and costlier." },
    { q: "Why is \"lost in the middle\" a concern when you build a RAG system?", o: ["Key passages placed in the middle of a long context may be under-used, so keep context focused and put key facts early", "Documents stored in the middle of a database are retrieved more slowly than the ones near the start", "The model forgets the middle of its own answer, so long answers should always be split into parts", "Retrieved passages are always placed in the middle, where the model cannot read them at all"], why: "Models tend to use the start and end of long inputs best. Retrieve fewer, better passages and order them well." },
    { q: "What is the idea behind Constitutional AI?", o: ["The model critiques and revises its answers against a written set of principles", "A government's written constitution decides which questions the model is allowed to answer", "Each answer is voted on by a panel of people before it is shown", "The model is trained only on legal and government documents"], why: "Written principles let the model generate its own feedback, reducing the need for human labels." },
    { q: "Why are \"emergent abilities\" debated?", o: ["Some seem to appear suddenly with scale, but partly because of how they are measured", "They only ever appear in models trained on the very newest data collected from the internet", "They are abilities that developers add by hand after training has finished", "They disappear completely once a model is fine-tuned for chat"], why: "With smoother measures, many \"sudden\" jumps look more gradual, so the debate is partly about measurement." },
    { q: "What do scaling laws describe?", o: ["How error falls predictably as parameters, data and compute grow", "The legal limits on how large an AI model is allowed to be", "How fast a model's answers get longer as it gets bigger", "The maximum number of users a model can serve at once"], why: "These smooth trends help labs decide how big to make a model and how much data to use." },
    { q: "Which property of LLMs does prompt injection exploit?", o: ["Instructions and data reach the model as the same stream of tokens", "Models are trained to always obey the last person who speaks to them", "Models can't read text that is hidden inside long documents", "Models trust anything written in capital letters more highly"], why: "There's no built-in boundary between your instructions and the text it reads, so hidden instructions can slip in." },
  ];
  const LEVELS = {
    beginner: { name: "Beginner", desc: "The basics: next-token prediction, tokens, training stages, temperature, the context window and why LLMs hallucinate.", qs: QUIZ },
    intermediate: { name: "Intermediate", desc: "Applying the ideas: explaining odd behaviour like letter counting, changing answers, attention and context, and base vs chat models.", qs: QUIZ_MID },
    advanced: { name: "Advanced", desc: "Under the hood: logits and softmax, sampling methods, attention costs, efficient models, reasoning models and safety.", qs: QUIZ_ADV },
  };
  const QZ = { level: null, qs: null, i: 0, picked: null, score: 0, missed: [], save: null };
  const bestKey = (level) => "wb-m4-best-" + level;
  const nextLevel = (level) => { const ks = Object.keys(LEVELS), i = ks.indexOf(level); return ks[i + 1] || null; };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz(level) { QZ.level = LEVELS[level] ? level : "beginner"; QZ.qs = shuffle(LEVELS[QZ.level].qs.map((x) => ({ q: x.q, why: x.why, right: x.o[0], opts: shuffle(x.o.slice()) }))); QZ.i = 0; QZ.picked = null; QZ.score = 0; QZ.missed = []; QZ.save = null; render(); }
  const quiz = () => {
    if (!QZ.qs) {
      return `<section class="m2sec" style="max-width:none"><header><p class="kicker">Check your understanding</p><h2>Module 4 quiz</h2>
        <p>Three levels of 15 questions each. Start with Beginner and work up. Your score and answers go to your teacher.</p></header>
        <div class="tech">${Object.entries(LEVELS).map(([k, L], i) => {
          const best = store.get(bestKey(k), null);
          return `<div class="card2"><p class="kicker">Level ${i + 1}</p><h3>${L.name}</h3><p class="when">${esc(L.desc)}</p>
            <p class="crit" style="margin:0">${L.qs.length} questions · ${best ? `Your best: <b>${best.s} / ${best.n}</b>` : "Not tried yet"}</p>
            <div class="btnrow" style="margin:0"><button class="btn primary" data-qstart="${k}">Start ${L.name}</button></div></div>`;
        }).join("")}</div></section>`;
    }
    const n = QZ.qs.length;
    const head = `<div class="qhead"><span>${esc(MODULE)} · ${LEVELS[QZ.level].name}</span><span>${QZ.i < n ? `Question ${QZ.i + 1} of ${n} · ` : ""}Score ${QZ.score}</span></div><div class="bar2"><i style="width:${Math.min(1, (QZ.i + (QZ.picked !== null ? 1 : 0)) / n) * 100}%"></i></div>`;
    if (QZ.i >= n) {
      const pct = Math.round(QZ.score / n * 100);
      const msg = pct === 100 ? "Perfect. You understand how LLMs work." : pct >= 80 ? "Strong result. Look over the misses below." : pct >= 50 ? "Getting there. Revisit the lesson and labs for the questions you missed." : "Go back through the lesson and labs, then try again.";
      const saveTxt = { saving: "Saving your result…", saved: "Result saved. Your teacher can see it.", failed: "This result could not be saved. Check your connection and take the quiz again." }[QZ.save];
      return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qkind">Result</p><div class="score">${QZ.score} / ${n}</div>${saveTxt ? `<p class="savestate${QZ.save === "failed" ? " bad" : ""}">${saveTxt}</p>` : ""}<p>${msg}</p>
        ${QZ.missed.length ? `<p class="qkind" style="margin-top:20px">Review these</p><ul class="missed">${QZ.missed.map((q) => `<li><div class="q">${esc(q.q)}</div><div><b>${esc(q.right)}</b>. ${esc(q.why)}</div></li>`).join("")}</ul>` : ""}
        <div class="qfoot"><button class="btn" data-qlevels>Choose a level</button><button class="btn" data-qstart="${QZ.level}">Take it again</button>${nextLevel(QZ.level) && pct >= 80 ? `<button class="btn primary" data-qstart="${nextLevel(QZ.level)}">Next: ${LEVELS[nextLevel(QZ.level)].name}</button>` : ""}</div></div></div></section>`;
    }
    const q = QZ.qs[QZ.i], done = QZ.picked !== null;
    return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qprompt">${esc(q.q)}</p>
      <div class="opts">${q.opts.map((o, j) => { const cls = done ? (o === q.right ? " right" : j === QZ.picked ? " wrong" : "") : ""; return `<button class="opt${cls}" data-m4opt="${j}" ${done ? "disabled" : ""}><span class="k">${"ABCD"[j]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>
      ${done ? `<div class="verdict">${q.opts[QZ.picked] === q.right ? `<span class="v good">Correct.</span>` : `<span class="v bad">Not quite.</span>`}<p>${esc(q.why)}</p></div>
      <div class="qfoot"><button class="btn primary" data-qnext>${QZ.i + 1 < n ? "Next question" : "See results"}</button></div>` : ""}</div></div></section>`;
  };
  function answer(j) {
    const q = QZ.qs[QZ.i]; if (QZ.picked !== null || !q.opts[j]) return;
    QZ.picked = j; q.chosen = q.opts[j];
    if (q.chosen === q.right) QZ.score++; else QZ.missed.push(q);
    if (QZ.i === QZ.qs.length - 1) {
      const key = bestKey(QZ.level), best = store.get(key, null), n = QZ.qs.length;
      if (!best || QZ.score / n > best.s / best.n) store.set(key, { s: QZ.score, n });
      if (window.WB && window.WB.call) {
        const qs = QZ.qs, level = LEVELS[QZ.level].name; QZ.save = "saving";
        window.WB.call("saveModuleQuiz", { result: { module: MODULE, level, score: QZ.score, total: n, answers: qs.map((x) => ({ kind: "Module 4 · " + level, question: x.q, chosen: x.chosen, correct: x.right, ok: x.chosen === x.right })) } })
          .then(() => { QZ.save = "saved"; }, () => { QZ.save = "failed"; }).then(() => { if (QZ.qs === qs && tab === "quiz" && !$("m4").hidden) render(); });
      }
    }
    render();
  }

  /* ---------- Rendering and events ---------- */
  const VIEWS = { learn: lesson, tokens, next, attn, halluc, ctx, task, quiz };
  function render() {
    $("m4body").innerHTML = `<nav class="m2tabs" role="tablist">${TABS.map(([k, l], i) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}"><span class="step">${i + 1}</span>${l}</button>`).join("")}</nav>${VIEWS[tab]()}`;
    if (tab === "tokens") updateTokens();
  }
  function goTab(k) { tab = k; store.set("wb-m4-tab", k); render(); window.scrollTo({ top: $("m4").offsetTop - 8 }); }

  $("m4body").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (t) { goTab(t.dataset.tab); return; }
    const w = e.target.closest("[data-word]"); if (w) { window.WB_setModule && window.WB_setModule("1"); if (typeof goWeb === "function") goWeb(w.dataset.word); return; }
    const tx = e.target.closest("[data-tokex]"); if (tx) { tokText = TOK_EXAMPLES[+tx.dataset.tokex]; store.set("wb-m4-toktext", tokText); $("m4tok").value = tokText; updateTokens(); return; }
    const nx = e.target.closest("[data-next]"); if (nx) { nextIdx = +nx.dataset.next; store.set("wb-m4-nexti", nextIdx); samples = []; lastPick = null; render(); return; }
    if (e.target.closest("[data-gen]")) { lastPick = sample(NEXT[nextIdx], temp); samples.push(lastPick); samples = samples.slice(-30); refreshNext(); return; }
    if (e.target.closest("[data-gen10]")) { for (let i = 0; i < 10; i++) { lastPick = sample(NEXT[nextIdx], temp); samples.push(lastPick); } samples = samples.slice(-30); refreshNext(); return; }
    if (e.target.closest("[data-genclear]")) { samples = []; lastPick = null; refreshNext(); return; }
    const at = e.target.closest("[data-attn]"); if (at) { attnIdx = +at.dataset.attn; store.set("wb-m4-attni", attnIdx); attnWord = null; render(); return; }
    const aw = e.target.closest("[data-aword]"); if (aw) { attnWord = attnWord === aw.dataset.aword ? null : aw.dataset.aword; render(); return; }
    if (e.target.closest("[data-mars]")) { marsPick = sample(MARS, 1); render(); return; }
    if (e.target.closest("[data-ctxadd]")) { ctxN = Math.min(CHAT.length, ctxN + 1); store.set("wb-m4-ctxn", ctxN); render(); return; }
    if (e.target.closest("[data-ctxreset]")) { ctxN = 2; store.set("wb-m4-ctxn", ctxN); render(); return; }
    if (e.target.closest("[data-m4handin]")) { handIn(); return; }
    const qst = e.target.closest("[data-qstart]"); if (qst) { startQuiz(qst.dataset.qstart); return; }
    if (e.target.closest("[data-qlevels]")) { QZ.qs = null; render(); return; }
    const o = e.target.closest("[data-m4opt]"); if (o) { answer(+o.dataset.m4opt); return; }
    if (e.target.closest("[data-qnext]")) { QZ.i++; QZ.picked = null; render(); }
  });
  $("m4body").addEventListener("input", (e) => {
    if (e.target.id === "m4tok") { tokText = e.target.value; store.set("wb-m4-toktext", tokText); updateTokens(); }
    if (e.target.id === "m4temp") { temp = +e.target.value; store.set("wb-m4-temp", temp); lastPick = null; refreshNext(); }
  });
  document.addEventListener("keydown", (e) => {
    if ($("m4").hidden || tab !== "quiz" || !QZ.qs || QZ.i >= QZ.qs.length || QZ.picked !== null || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = "1234abcd".indexOf(e.key.toLowerCase()); if (k >= 0) answer(k % 4);
  });

  (window.WB_MODULES = window.WB_MODULES || {})["4"] = render;
})();
