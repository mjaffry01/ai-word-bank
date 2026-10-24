// Module 2: Prompting & AI tools. A lesson, a prompt builder, technique cards, a hallucination hunt,
// practice tasks students hand in, and a quiz. Results and hand-ins go to the teacher's Google Sheet.
(function () {
  const MODULE = "Module 2: Prompting & AI tools";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const word = (term, label) => `<button class="wordlink" data-word="${esc(term)}" title="Open in the learning web">${esc(label || term)}</button>`;

  const TABS = [["learn", "Lesson"], ["build", "Prompt builder"], ["tech", "Techniques"], ["hunt", "Hallucination hunt"], ["tasks", "Practice tasks"], ["quiz", "Quiz"]];
  let tab = store.get("wb-m2-tab", "learn");

  /* ---------- Module switching ---------- */
  function setModule(m) {
    $("m1").hidden = m !== "1"; $("m2").hidden = m !== "2";
    $("lede1").hidden = m !== "1"; $("lede2").hidden = m !== "2";
    document.querySelectorAll("[data-module]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.module === m));
    store.set("wb-module", m);
    if (m === "1") window.WB && window.WB.refresh && window.WB.refresh(); else render();
  }
  document.querySelector(".modnav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-module]");
    if (b) setModule(b.dataset.module);
  });

  /* ---------- Lesson ---------- */
  const lesson = () => `
    <section class="m2sec">
      <header><p class="kicker">Lesson · about 25 minutes</p><h2>Getting good answers from AI</h2>
        <p>An AI model only knows what is in your prompt and what it learned in training. The more clearly you say what you want, the better the answer.</p></header>

      <div class="card2"><p class="kicker">1 · What a prompt really is</p>
        <h3>Vague in, vague out</h3>
        <p>A ${word("Prompt", "prompt")} is everything you give the model: your question, your instructions and any text you paste. A ${word("Large Language Model (LLM)", "large language model")} reads it as ${word("Token", "tokens")} and writes the most likely continuation. If the prompt leaves things open, the model fills the gaps with the most average answer.</p>
        <div class="vs">
          <div><p class="lbl bad">Weak</p><pre class="pbox">Write about AI.</pre></div>
          <div><p class="lbl good">Strong</p><pre class="pbox">You are a science teacher. Write a 150-word introduction to AI for 14-year-olds. Use one everyday example, like Netflix recommendations. Format: 3 short paragraphs, then one question for the class.</pre></div>
        </div>
      </div>

      <div class="card2"><p class="kicker">2 · The formula</p>
        <h3>Role + Task + Context + Format + Example</h3>
        <div class="formula">
          <span>Role<small>Who should the AI be?</small></span>
          <span>Task<small>What exactly to do</small></span>
          <span>Context<small>Who it's for, background</small></span>
          <span>Format<small>Length, layout, tone</small></span>
          <span>Example<small>Show what good looks like</small></span>
        </div>
        <p>You rarely need all five. The task is the only one you always need. Add the others when the answer misses the mark. Try it in the <button class="wordlink" data-tab="build">Prompt builder</button>.</p>
      </div>

      <div class="card2"><p class="kicker">3 · Tokens and the context window</p>
        <h3>The model has a limited memory</h3>
        <ul>
          <li>The ${word("Context Window", "context window")} is how much text the model can see at once: your prompt, the chat so far and its replies.</li>
          <li>In very long chats, early instructions can drop out or get less attention. Repeat key rules, or start a new chat for a new task.</li>
          <li>Models have a ${word("Knowledge Cutoff", "knowledge cutoff")}. They may not know recent events unless the tool can search the web or you paste the information in.</li>
        </ul>
      </div>

      <div class="card2"><p class="kicker">4 · Iterate</p>
        <h3>The first answer is a draft</h3>
        <p>Good prompting is a conversation. Read the answer, then steer it:</p>
        <pre class="pbox">Make it shorter: 5 bullet points.
Explain point 3 with an example.
Put this in a table with columns: Step, Why, Time needed.
Rewrite for a beginner. Avoid jargon.</pre>
      </div>

      <div class="card2"><p class="kicker">5 · Reliability</p>
        <h3>AI can be confidently wrong</h3>
        <p>A ${word("Hallucination", "hallucination")} is when the model states something false as if it were true, such as a fake quote, statistic or source. To get answers you can trust:</p>
        <ul>
          <li><b>Ground it:</b> paste the source text and say "use only this text". This is called ${word("Grounding", "grounding")}.</li>
          <li><b>Give it permission to not know:</b> "If you are not sure, say so instead of guessing."</li>
          <li><b>Ask for sources, then check them yourself.</b> Links and references are where hallucinations hide.</li>
          <li><b>Lower creativity for facts:</b> some tools let you set ${word("Temperature", "temperature")}. Low is more focused and predictable.</li>
        </ul>
      </div>

      <div class="card2"><p class="kicker">6 · Safe use</p>
        <h3>What never goes into a prompt</h3>
        <p>Passwords, bank details, other people's personal data, and confidential work or school documents, unless your organisation has approved the tool. Assume anything you type could be stored.</p>
        <p class="tip">Rule of thumb: use AI to draft and explore, and check the result before you rely on it.</p>
      </div>
    </section>`;

  /* ---------- Prompt builder ---------- */
  const FIELDS = [
    ["role", "Role", "input", "e.g. an experienced career coach", "Who should the AI act as?"],
    ["task", "Task", "textarea", "e.g. Write a cover letter for a junior data analyst job", "Start with a verb: write, explain, plan, compare, summarise…"],
    ["context", "Context", "textarea", "e.g. I graduated in economics in 2025, know Excel and basic Python, and the company is a bank", "Who is it for? What should it know about the situation?"],
    ["format", "Format", "input", "e.g. 3 paragraphs, under 250 words", "Length, structure: bullets, table, steps…"],
    ["tone", "Tone", "select", "", ""],
    ["example", "Example", "textarea", "Optional: paste a short example of the style you want", "Showing one good example is often better than describing it."],
  ];
  const TONES = ["", "friendly", "professional", "simple, for beginners", "enthusiastic", "formal", "funny"];
  const PRESETS = {
    "Cover letter": { role: "an experienced career coach", task: "Write a cover letter for a junior data analyst job", context: "I graduated in economics in 2025, know Excel and basic Python, and did a 3-month internship analysing sales data. The company is a mid-sized bank.", format: "3 short paragraphs, under 250 words", tone: "professional", example: "", honest: true },
    "Explain to a child": { role: "a patient primary-school teacher", task: "Explain what a neural network is", context: "The reader is 10 years old and has never heard of AI.", format: "One short paragraph and one everyday analogy, then a one-line summary", tone: "friendly", example: "", honest: false },
    "Study plan": { role: "a programming tutor", task: "Make a 2-week plan to learn the basics of Python", context: "I am a complete beginner with 1 hour a day, on weekdays only.", format: "A table with columns: Day, Topic, Practice task, Time", tone: "simple, for beginners", example: "", honest: false },
  };
  let draft = Object.assign({ role: "", task: "", context: "", format: "", tone: "", example: "", honest: false }, store.get("wb-m2-draft", {}));

  function assemble(d) {
    const out = [];
    if (d.role.trim()) out.push(`You are ${d.role.trim().replace(/^(you are\s+)/i, "").replace(/\.$/, "")}.`);
    if (d.task.trim()) out.push(d.task.trim().replace(/([^.!?])$/, "$1."));
    if (d.context.trim()) out.push(`Context: ${d.context.trim()}`);
    if (d.format.trim()) out.push(`Format: ${d.format.trim()}`);
    if (d.tone) out.push(`Tone: ${d.tone}.`);
    if (d.example.trim()) out.push(`Here is an example of the style I want:\n"""\n${d.example.trim()}\n"""`);
    if (d.honest) out.push("If you are not sure about a fact, say so instead of guessing.");
    return out.join("\n\n");
  }
  const PARTS = [["role", "a role"], ["task", "a clear task"], ["context", "context"], ["format", "a format"], ["tone", "a tone"], ["example", "an example"]];
  function builderScore(d) { return PARTS.filter(([k]) => String(d[k]).trim()).length; }

  const builder = () => {
    const field = ([k, label, type, ph, hint]) => {
      const ctl = type === "textarea" ? `<textarea id="b-${k}" data-b="${k}" rows="${k === "example" ? 3 : 2}" placeholder="${esc(ph)}">${esc(draft[k])}</textarea>`
        : type === "select" ? `<select id="b-${k}" data-b="${k}">${TONES.map((t) => `<option value="${esc(t)}" ${draft[k] === t ? "selected" : ""}>${t ? esc(t) : "Any tone"}</option>`).join("")}</select>`
        : `<input id="b-${k}" data-b="${k}" value="${esc(draft[k])}" placeholder="${esc(ph)}">`;
      return `<div class="field"><label for="b-${k}">${label}${k === "task" ? " <b>· needed</b>" : ""}</label>${ctl}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
    };
    return `<section class="m2sec">
      <header><p class="kicker">Practice</p><h2>Prompt builder</h2>
        <p>Fill in the parts and the prompt writes itself. Then copy it into ChatGPT, Claude, Gemini or Copilot and compare the answer with a one-line prompt.</p></header>
      <div class="btnrow" style="margin:0">${Object.keys(PRESETS).map((n) => `<button class="btn sm" data-preset="${esc(n)}">Example: ${esc(n)}</button>`).join("")}<button class="btn sm" data-clear>Clear</button></div>
      <div class="builder">
        <div class="card2">${FIELDS.map(field).join("")}
          <label class="checks" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="b-honest" data-b="honest" ${draft.honest ? "checked" : ""} style="margin-top:4px;width:18px;height:18px;accent-color:var(--accent)">
          <span>Ask the AI to say when it isn't sure (fewer ${word("Hallucination", "hallucinations")})</span></label>
        </div>
        <div class="card2 preview"><p class="kicker">Your prompt</p><pre class="pbox" id="bOut"></pre>
          <div class="meter" id="bMeter"></div><div class="score2" id="bScore"></div><div class="missing" id="bMissing"></div>
          <div class="btnrow"><button class="btn primary" data-copy="bOut">Copy prompt</button></div><p class="savemsg" id="bCopied" hidden></p>
        </div>
      </div>
    </section>`;
  };
  function updateBuilder() {
    const out = $("bOut"); if (!out) return;
    const p = assemble(draft), n = builderScore(draft);
    out.textContent = p || "Start with the task: what do you want the AI to do?";
    $("bMeter").innerHTML = PARTS.map(([k]) => `<i class="${String(draft[k]).trim() ? "on" : ""}"></i>`).join("");
    $("bScore").textContent = `${n} of ${PARTS.length} parts`;
    const miss = PARTS.filter(([k]) => !String(draft[k]).trim()).map(([, l]) => l);
    $("bMissing").textContent = !draft.task.trim() ? "Add a task first. It's the one part every prompt needs." : miss.length ? `Could add: ${miss.join(", ")}.` : "Every part is there. Try it, then refine.";
    store.set("wb-m2-draft", draft);
  }

  /* ---------- Techniques ---------- */
  const TECH = [
    { name: "Zero-shot", term: "Zero-shot Prompting", when: "Simple, common tasks where the model already knows what good looks like.", tpl: "Translate this sentence into French:\n\"The meeting is moved to Friday.\"", watch: "If the style is off, move to few-shot." },
    { name: "Few-shot", term: "Few-shot Prompting", when: "You want a specific style or format the model should copy.", tpl: "Turn product features into benefits.\n\nFeature: 10-hour battery → Benefit: Work all day without a charger.\nFeature: Waterproof case → Benefit: Use it in the rain without worry.\nFeature: 2-second boot time → Benefit:", watch: "2–3 good examples beat a long description." },
    { name: "Chain-of-thought", term: "Chain-of-Thought (CoT)", when: "Maths, logic, planning: anything with several steps.", tpl: "A shop sells pens at 3 for $2. How much do 20 pens cost? Think step by step, then give the final answer on its own line.", watch: "Check each step. A wrong step leads to a wrong answer." },
    { name: "Role prompting", term: "Role Prompting", when: "You need expertise, a point of view, or a practice partner.", tpl: "You are a strict but fair job interviewer for a marketing role. Ask me one question at a time and give feedback on each answer.", watch: "A role changes tone and focus. It does not add real expertise or facts." },
    { name: "Output format", term: "Structured Output", when: "The answer goes into a document, spreadsheet or app.", tpl: "List 5 healthy breakfast ideas as a table with columns: Name, Main ingredients, Prep time (minutes), Calories (approx).", watch: "Name the exact columns or fields you want." },
    { name: "Prompt chaining", term: "Prompt Chaining", when: "Big tasks: essays, reports, projects.", tpl: "Step 1: Give me 5 possible titles for a blog post about remote work.\n(Then, in your next message) Step 2: Write an outline for title #3.\n(Then) Step 3: Write the introduction from that outline.", watch: "Check each step before moving on." },
    { name: "Delimiters", term: "Delimiter", when: "Pasting text the AI should work on, so it doesn't confuse it with instructions.", tpl: "Summarise the article between the triple quotes in 5 bullet points.\n\"\"\"\n(paste article here)\n\"\"\"", watch: "Also protects against instructions hidden in pasted text." },
    { name: "Self-check", term: "Self-consistency", when: "Facts, calculations and anything important.", tpl: "Answer the question below. Then review your answer for mistakes or claims you're not sure about, and list them under \"Check these\".", watch: "The AI can miss its own errors. You still verify." },
  ];
  const techniques = () => `<section class="m2sec" style="max-width:none">
      <header><p class="kicker">Toolkit</p><h2>Eight prompting techniques</h2>
        <p>Each one is a word from the vocabulary module. Copy the template, run it in an AI tool, then change it for your own task.</p></header>
      <div class="tech">${TECH.map((t, i) => `<div class="card2">
        <h3>${esc(t.name)}</h3><p class="when"><b>Use when:</b> ${esc(t.when)}</p>
        <pre class="pbox" id="tech${i}">${esc(t.tpl)}</pre>
        <p class="watch"><b>Watch out:</b> ${esc(t.watch)}</p>
        <div class="btnrow" style="margin:0"><button class="btn sm" data-copy="tech${i}">Copy</button>${word(t.term, "In the word bank")}</div></div>`).join("")}</div>
    </section>`;

  /* ---------- Hallucination hunt ---------- */
  const BAIT = [
    "List 3 published research papers about using AI to teach beekeeping, with authors, year and a link to each.",
    "What did the mayor of a small town near you say in their speech last Tuesday? Quote them.",
    "Summarise chapter 14 of the book \"Animal Farm\".",
    "What is the population of the town of Westbridge-on-Mere, and who founded it?",
  ];
  const CHECKS = ["Did the AI give sources, names, numbers or quotes?", "I searched for each source. Does it really exist?", "Does the source actually say what the AI claimed?", "Are dates and numbers consistent with an official or trusted site?", "Did the AI admit uncertainty anywhere?"];
  const hunt = () => {
    const done = store.get("wb-m2-checks", []);
    return `<section class="m2sec">
      <header><p class="kicker">Activity · 15–20 minutes</p><h2>Hallucination hunt</h2>
        <p>Your mission: get an AI to make something up, catch it, then rewrite the prompt so it doesn't happen again. You'll hand in your findings under Practice tasks.</p></header>
      <div class="card2"><p class="kicker">Step 1 · Bait prompts</p><h3>Try one of these</h3>
        <p>These ask for things that are obscure, private, made up or impossible. Notice whether the AI admits it doesn't know.</p>
        ${BAIT.map((b, i) => `<pre class="pbox" id="bait${i}" style="margin-bottom:6px">${esc(b)}</pre><div class="btnrow" style="margin:0 0 12px"><button class="btn sm" data-copy="bait${i}">Copy</button></div>`).join("")}
        <p class="tip">"Animal Farm" has only 10 chapters, and Westbridge-on-Mere is made up. A good answer says so.</p>
      </div>
      <div class="card2"><p class="kicker">Step 2 · Red flags</p><h3>Signs an answer may be invented</h3>
        <div class="flags">
          <div><b>Too precise</b>Exact figures, page numbers or quotes on an obscure topic.</div>
          <div><b>Perfect sources</b>Neat author lists and links that don't open or lead elsewhere.</div>
          <div><b>No doubt at all</b>Confident answers to questions nobody could know.</div>
          <div><b>Recent events</b>Details after the model's knowledge cutoff.</div>
        </div>
      </div>
      <div class="card2"><p class="kicker">Step 3 · Verify</p><h3>Fact-check checklist</h3>
        <ul class="checks">${CHECKS.map((c, i) => `<li><label><input type="checkbox" data-check="${i}" ${done.includes(i) ? "checked" : ""}><span>${esc(c)}</span></label></li>`).join("")}</ul>
      </div>
      <div class="card2"><p class="kicker">Step 4 · Fix the prompt</p><h3>A safer version</h3>
        <pre class="pbox" id="safer">Answer the question below. Only state facts you are confident about.
If you don't know, or the thing doesn't exist, say so clearly.
Do not invent sources. If you mention one, say how sure you are that it exists.

Question: (your question here)</pre>
        <div class="btnrow"><button class="btn sm" data-copy="safer">Copy</button><button class="btn sm primary" data-tab="tasks">Hand in my findings</button></div>
      </div>
    </section>`;
  };

  /* ---------- Practice tasks (handed in to the teacher's Sheet) ---------- */
  const TASKS = [
    { id: "cover", title: "Cover letter makeover", goal: "Turn a weak prompt into one that produces a cover letter you'd actually send.", weak: "write a cover letter", crit: ["Gives a role", "Says the job and your real background", "Sets length and tone"] },
    { id: "eli10", title: "Explain it to a 10-year-old", goal: "Get the AI to explain \"neural network\" so a 10-year-old understands it.", weak: "what is a neural network", crit: ["Names the audience", "Asks for an everyday analogy", "Limits the length"] },
    { id: "plan", title: "Study plan as a table", goal: "Get a 2-week study plan for something you want to learn, as a table.", weak: "help me study", crit: ["Says the topic, time available and level", "Asks for a table with named columns"] },
    { id: "summary", title: "Grounded summary", goal: "Summarise a news article using only the article: no outside facts, no made-up details.", weak: "summarise this", crit: ["Uses delimiters around the pasted text", "Says \"use only this text\"", "Sets the output format"] },
    { id: "hunt", title: "Hallucination hunt report", goal: "Report the prompt that made an AI make something up, how you caught it, and your fixed prompt.", weak: "", crit: ["Includes the bait prompt and what the AI invented", "Explains how you checked", "Includes the improved prompt"] },
  ];
  const TOOLS = ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Meta AI", "Perplexity", "Other"];
  const tasks = () => {
    const done = store.get("wb-m2-done", {});
    return `<section class="m2sec">
      <header><p class="kicker">Hand-in · goes to your teacher</p><h2>Practice tasks</h2>
        <p>Do each task in an AI tool of your choice. When you're happy with the result, paste your final prompt here and say what you changed. Your teacher sees every hand-in.</p></header>
      ${TASKS.map((t) => `<div class="card2 chal">
        <div class="meta"><h3 style="margin:0">${esc(t.title)}</h3><span class="pill2 ${done[t.id] ? "done" : ""}">${done[t.id] ? "Handed in" : "To do"}</span></div>
        <p style="margin:0">${esc(t.goal)}</p>
        ${t.weak ? `<div><p class="lbl bad">Starting prompt</p><pre class="pbox">${esc(t.weak)}</pre></div>` : ""}
        <p class="crit"><b>A good answer:</b> ${t.crit.map(esc).join(" · ")}</p>
        <div class="field" style="margin:0"><label for="t-tool-${t.id}">AI tool used</label><select id="t-tool-${t.id}">${TOOLS.map((x) => `<option>${x}</option>`).join("")}</select></div>
        <div class="field" style="margin:0"><label for="t-prompt-${t.id}">${t.id === "hunt" ? "Bait prompt, what the AI invented, and your fixed prompt" : "Your final prompt"}</label><textarea id="t-prompt-${t.id}" rows="5"></textarea></div>
        <div class="field" style="margin:0"><label for="t-ref-${t.id}">${t.id === "hunt" ? "How you caught it" : "What you changed, and how the answer improved"}</label><textarea id="t-ref-${t.id}" rows="3"></textarea></div>
        <div class="btnrow" style="margin:0"><button class="btn primary" data-submit="${t.id}">Hand in</button></div>
        <p class="savemsg" id="t-msg-${t.id}" hidden></p>
      </div>`).join("")}
    </section>`;
  };
  async function submitTask(id) {
    const t = TASKS.find((x) => x.id === id), msg = $("t-msg-" + id);
    const prompt = $("t-prompt-" + id).value.trim(), reflection = $("t-ref-" + id).value.trim();
    msg.hidden = false;
    if (!prompt) { msg.className = "savemsg err"; msg.textContent = "Paste your final prompt first."; return; }
    if (!window.WB || !window.WB.call) { msg.className = "savemsg err"; msg.textContent = "You need to be signed in and approved to hand in work."; return; }
    const btn = document.querySelector(`[data-submit="${id}"]`);
    btn.disabled = true; msg.className = "savemsg"; msg.textContent = "Handing in…";
    try {
      await window.WB.call("saveSubmission", { submission: { module: MODULE, task: t.title, tool: $("t-tool-" + id).value, prompt, reflection } });
      const done = store.get("wb-m2-done", {}); done[id] = true; store.set("wb-m2-done", done);
      msg.className = "savemsg ok"; msg.textContent = "Handed in. Your teacher can see it. You can hand in an improved version any time.";
      const pill = btn.closest(".chal").querySelector(".pill2"); pill.className = "pill2 done"; pill.textContent = "Handed in";
    } catch (e) {
      msg.className = "savemsg err";
      msg.textContent = e && e.error === "signed_out" ? "Your sign-in has ended. Sign in again, then hand in." : "This could not be handed in. Check your connection and try again.";
    }
    btn.disabled = false;
  }

  /* ---------- Quiz ---------- */
  const QUIZ = [
    { q: "Which prompt will most likely give the most useful answer?", o: ["Write a 100-word fun-fact paragraph about dogs for 8-year-olds, in simple words.", "Write about dogs.", "Dogs?", "Tell me everything about dogs."], why: "It names the task, audience, length and style." },
    { q: "Giving the AI two or three examples of the answer you want is called…", o: ["Few-shot prompting", "Zero-shot prompting", "Fine-tuning", "Tokenization"], why: "Few-shot means \"a few examples\" in the prompt. Fine-tuning changes the model itself." },
    { q: "Adding \"think step by step\" to a maths problem is an example of…", o: ["Chain-of-thought", "Role prompting", "RAG", "Lowering temperature"], why: "Chain-of-thought asks the model to show its reasoning steps." },
    { q: "An AI gives you a book reference with a real-sounding author and title, but the book doesn't exist. This is…", o: ["A hallucination", "Bias", "Overfitting", "A jailbreak"], why: "Confidently made-up information is a hallucination." },
    { q: "You need a reliable summary of a long report. What helps most?", o: ["Paste the report and say \"use only this text\"", "Ask it to be more creative", "Raise the temperature", "Ask the same question three times"], why: "Grounding the answer in the text you give reduces made-up details." },
    { q: "In a very long chat, the AI starts ignoring instructions you gave at the beginning. The most likely reason is…", o: ["The context window is full or crowded", "The AI got tired", "Your internet slowed down", "The temperature is too low"], why: "The model can only take in so much text at once. Repeat key rules or start a new chat." },
    { q: "What is a token?", o: ["A chunk of text, often part of a word, that the model reads or writes", "A password for the AI", "A payment for each answer", "An image the model creates"], why: "Models read and write text as tokens. Limits and prices are counted in tokens." },
    { q: "\"You are an experienced job interviewer. Ask me one question at a time.\" Which technique is this?", o: ["Role prompting", "Few-shot prompting", "Prompt chaining", "Delimiters"], why: "Giving the AI a role changes its focus and tone." },
    { q: "You want to paste the AI's answer straight into a spreadsheet. What should you add?", o: ["\"Format it as a table with columns: …\"", "\"Be creative.\"", "\"Answer quickly.\"", "Nothing. It will guess the right layout."], why: "Asking for a specific output format gets a structure you can use." },
    { q: "Writing an essay by asking first for titles, then an outline, then each section is called…", o: ["Prompt chaining", "Self-consistency", "Zero-shot prompting", "Grounding"], why: "Prompt chaining splits a big task into steps, each building on the last." },
    { q: "Which of these should you NOT paste into a public AI chatbot?", o: ["A customer's personal details and account number", "A public news article", "Your own draft essay", "A recipe from a cookbook website"], why: "Personal and confidential data may be stored or seen by others." },
    { q: "An AI tells you a law changed last month, but its knowledge cutoff is a year ago. What should you do?", o: ["Check an official, current source", "Trust it. AI is always up to date", "Ask again until it gives the same answer", "Raise the temperature"], why: "It can't know events after its cutoff unless it searched the web. Verify it." },
    { q: "For factual answers, which temperature setting is usually better?", o: ["Low", "High", "As high as possible", "Temperature has no effect"], why: "Low temperature gives more focused, predictable answers. High gives more varied, creative ones." },
    { q: "The first answer is close but not quite right. What's the best next step?", o: ["Give specific feedback, like \"shorter, add an example\"", "Give up on AI for this task", "Paste the exact same prompt again", "Write the prompt in capital letters"], why: "Iterating with specific feedback is the core prompting skill." },
    { q: "\"You are a nutritionist. Create a meal plan.\" What is this prompt missing most?", o: ["Context and format: who it's for, the goal, length and layout", "A role", "A task", "Nothing. It's complete."], why: "The role and task are there, but without context and format the plan will be generic." },
  ];
  const QZ = { qs: null, i: 0, picked: null, score: 0, missed: [], save: null };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz() {
    QZ.qs = shuffle(QUIZ.map((x) => ({ q: x.q, why: x.why, right: x.o[0], opts: shuffle(x.o.slice()) })));
    QZ.i = 0; QZ.picked = null; QZ.score = 0; QZ.missed = []; QZ.save = null; render();
  }
  const quiz = () => {
    if (!QZ.qs) {
      const best = store.get("wb-m2-best", null);
      return `<section class="m2sec"><header><p class="kicker">Check your understanding</p><h2>Module 2 quiz</h2>
        <p>${QUIZ.length} questions on prompts, techniques and spotting hallucinations. Your score and answers go to your teacher.</p></header>
        <div class="card2"><p style="margin:0 0 12px">${best ? `Your best so far: <b>${best.s} / ${best.n}</b>.` : "You haven't taken this quiz yet."}</p><button class="btn primary" data-qstart>Start the quiz</button></div></section>`;
    }
    const n = QZ.qs.length;
    const head = `<div class="qhead"><span>${esc(MODULE)}</span><span>${QZ.i < n ? `Question ${QZ.i + 1} of ${n} · ` : ""}Score ${QZ.score}</span></div><div class="bar2"><i style="width:${Math.min(1, (QZ.i + (QZ.picked !== null ? 1 : 0)) / n) * 100}%"></i></div>`;
    if (QZ.i >= n) {
      const pct = Math.round(QZ.score / n * 100);
      const msg = pct === 100 ? "Perfect. You're ready to use these techniques for real." : pct >= 80 ? "Strong result. Look over the misses below." : pct >= 50 ? "Getting there. Re-read the lesson sections for the questions you missed, then try again." : "Go back through the lesson and techniques, then try again.";
      const saveTxt = { saving: "Saving your result…", saved: "Result saved. Your teacher can see it.", failed: "This result could not be saved. Check your connection and take the quiz again." }[QZ.save];
      return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qkind">Result</p><div class="score">${QZ.score} / ${n}</div>${saveTxt ? `<p class="savestate${QZ.save === "failed" ? " bad" : ""}">${saveTxt}</p>` : ""}<p>${msg}</p>
        ${QZ.missed.length ? `<p class="qkind" style="margin-top:20px">Review these</p><ul class="missed">${QZ.missed.map((q) => `<li><div class="q">${esc(q.q)}</div><div><b>${esc(q.right)}</b>. ${esc(q.why)}</div></li>`).join("")}</ul>` : ""}
        <div class="qfoot"><button class="btn primary" data-qstart>Take it again</button></div></div></div></section>`;
    }
    const q = QZ.qs[QZ.i], done = QZ.picked !== null;
    return `<section class="m2sec"><div class="quiz" style="margin:0;max-width:none">${head}<div class="qcard"><p class="qprompt">${esc(q.q)}</p>
      <div class="opts">${q.opts.map((o, j) => { const cls = done ? (o === q.right ? " right" : j === QZ.picked ? " wrong" : "") : ""; return `<button class="opt${cls}" data-m2opt="${j}" ${done ? "disabled" : ""}><span class="k">${"ABCD"[j]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>
      ${done ? `<div class="verdict">${q.opts[QZ.picked] === q.right ? `<span class="v good">Correct.</span>` : `<span class="v bad">Not quite.</span>`}<p>${esc(q.why)}</p></div>
      <div class="qfoot"><button class="btn primary" data-qnext>${QZ.i + 1 < n ? "Next question" : "See results"}</button></div>` : ""}</div></div></section>`;
  };
  function answer(j) {
    const q = QZ.qs[QZ.i]; if (QZ.picked !== null || !q.opts[j]) return;
    QZ.picked = j; q.chosen = q.opts[j];
    if (q.chosen === q.right) QZ.score++; else QZ.missed.push(q);
    if (QZ.i === QZ.qs.length - 1) {
      const best = store.get("wb-m2-best", null), n = QZ.qs.length;
      if (!best || QZ.score / n > best.s / best.n) store.set("wb-m2-best", { s: QZ.score, n });
      saveQuiz();
    }
    render();
  }
  function saveQuiz() {
    if (!window.WB || !window.WB.call) return;
    const qs = QZ.qs;
    QZ.save = "saving";
    const result = { module: MODULE, score: QZ.score, total: qs.length, answers: qs.map((q) => ({ kind: "Module 2", question: q.q, chosen: q.chosen, correct: q.right, ok: q.chosen === q.right })) };
    window.WB.call("saveModuleQuiz", { result }).then(() => { QZ.save = "saved"; }, () => { QZ.save = "failed"; }).then(() => { if (QZ.qs === qs && tab === "quiz" && !$("m2").hidden) render(); });
  }

  /* ---------- Rendering and events ---------- */
  const VIEWS = { learn: lesson, build: builder, tech: techniques, hunt, tasks, quiz };
  function render() {
    $("m2body").innerHTML = `<nav class="m2tabs" role="tablist">${TABS.map(([k, l], i) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}"><span class="step">${i + 1}</span>${l}</button>`).join("")}</nav>${VIEWS[tab]()}`;
    if (tab === "build") updateBuilder();
  }
  function goTab(k) { tab = k; store.set("wb-m2-tab", k); render(); window.scrollTo({ top: $("m2").offsetTop - 8 }); }

  function copy(id, btn) {
    const el = $(id); if (!el) return;
    const text = el.textContent;
    const done = () => { const old = btn.textContent; btn.textContent = "Copied"; setTimeout(() => { btn.textContent = old; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => selectText(el));
    else selectText(el);
  }
  function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  $("m2body").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (t) { goTab(t.dataset.tab); return; }
    const w = e.target.closest("[data-word]"); if (w) { setModule("1"); if (typeof goWeb === "function") goWeb(w.dataset.word); return; }
    const c = e.target.closest("[data-copy]"); if (c) { copy(c.dataset.copy, c); return; }
    const p = e.target.closest("[data-preset]"); if (p) { draft = Object.assign({}, PRESETS[p.dataset.preset]); render(); return; }
    if (e.target.closest("[data-clear]")) { draft = { role: "", task: "", context: "", format: "", tone: "", example: "", honest: false }; render(); return; }
    const s = e.target.closest("[data-submit]"); if (s) { submitTask(s.dataset.submit); return; }
    if (e.target.closest("[data-qstart]")) { startQuiz(); return; }
    const o = e.target.closest("[data-m2opt]"); if (o) { answer(+o.dataset.m2opt); return; }
    if (e.target.closest("[data-qnext]")) { QZ.i++; QZ.picked = null; render(); }
  });
  $("m2body").addEventListener("input", (e) => {
    const b = e.target.dataset && e.target.dataset.b; if (!b) return;
    draft[b] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    updateBuilder();
  });
  $("m2body").addEventListener("change", (e) => {
    const b = e.target.dataset && e.target.dataset.b;
    if (b) { draft[b] = e.target.type === "checkbox" ? e.target.checked : e.target.value; updateBuilder(); return; }
    if (e.target.dataset && e.target.dataset.check !== undefined) {
      const i = +e.target.dataset.check, done = store.get("wb-m2-checks", []).filter((x) => x !== i);
      if (e.target.checked) done.push(i);
      store.set("wb-m2-checks", done);
    }
  });
  document.addEventListener("keydown", (e) => {
    if ($("m2").hidden || tab !== "quiz" || !QZ.qs || QZ.i >= QZ.qs.length || QZ.picked !== null || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = "1234abcd".indexOf(e.key.toLowerCase()); if (k >= 0) answer(k % 4);
  });

  setModule(store.get("wb-module", "1"));
})();
