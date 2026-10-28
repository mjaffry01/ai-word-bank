// Module 2, "Open models" tab: AI models anyone can download and run. What "open" means, a searchable list of the
// main open models (text, reasoning, code, small, vision, pictures, video, speech, embeddings) with sizes and
// licences, a "will it fit on my computer?" calculator, how to try one, and how prompting them differs.
// Module 2 calls WB_M2OPEN.html() to build the tab and WB_M2OPEN.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const CATS = { chat: "Chat & writing", reason: "Reasoning", code: "Coding", small: "Small / on-device", vision: "Sees images", image: "Makes pictures", video: "Makes video", speech: "Speech & audio", embed: "Search (embeddings)" };
  // free: use for anything (Apache 2.0, MIT). cond: free, with conditions in the licence. nc: research or personal use only.
  const LIC = { free: "Use freely", cond: "Free with conditions", nc: "Non-commercial only" };
  // name, maker, categories, sizes, licence group, licence name, best for, Ollama command, Hugging Face page
  const M = (n, by, c, s, l, ln, good, run, hf) => ({ n, by, c: c.split(" "), s, l, ln, good, run, hf });
  const MODELS = [
    M("Llama 4 (Scout, Maverick)", "Meta", "chat vision", "Scout 109B, Maverick 400B (mixture of experts, 17B active)", "cond", "Llama 4 Community License", "Reading very long documents and images; Meta's newest open family.", "", "meta-llama"),
    M("Llama 3.1 / 3.2 / 3.3", "Meta", "chat small vision", "1B, 3B, 8B, 70B, 405B; 11B and 90B see images", "cond", "Llama Community License", "The most widely used open models: chat, summaries, building your own apps.", "ollama run llama3.2", "meta-llama"),
    M("Code Llama", "Meta", "code", "7B, 13B, 34B, 70B", "cond", "Llama Community License", "Writing and explaining code (older; newer coding models beat it).", "ollama run codellama", "meta-llama"),
    M("gpt-oss", "OpenAI", "chat reason", "20B and 120B (mixture of experts)", "free", "Apache 2.0", "OpenAI's open-weight reasoning models; the 20B runs on a good laptop.", "ollama run gpt-oss:20b", "openai"),
    M("Gemma 3", "Google", "chat small vision", "1B, 4B, 12B, 27B", "cond", "Gemma Terms of Use", "Strong small models that also read images; 140+ languages.", "ollama run gemma3", "google"),
    M("Gemma 3n", "Google", "small vision", "E2B, E4B (built for phones)", "cond", "Gemma Terms of Use", "Running on phones and laptops, offline.", "", "google"),
    M("Mistral 7B / Mistral NeMo", "Mistral AI", "chat small", "7B, 12B", "free", "Apache 2.0", "Fast, light chat models from France.", "ollama run mistral", "mistralai"),
    M("Mixtral", "Mistral AI", "chat", "8x7B, 8x22B (mixture of experts)", "free", "Apache 2.0", "Made the mixture-of-experts idea popular; good all-rounder.", "ollama run mixtral", "mistralai"),
    M("Mistral Small 3", "Mistral AI", "chat vision", "24B", "free", "Apache 2.0", "A capable mid-size model that fits one good GPU; 3.1 also reads images.", "ollama run mistral-small", "mistralai"),
    M("Magistral Small", "Mistral AI", "reason", "24B", "free", "Apache 2.0", "Step-by-step reasoning in many languages.", "", "mistralai"),
    M("Devstral", "Mistral AI", "code", "24B", "free", "Apache 2.0", "Coding agents that fix issues across a whole code base.", "", "mistralai"),
    M("Codestral", "Mistral AI", "code", "22B", "nc", "Mistral Non-Production License", "Code completion in 80+ programming languages.", "", "mistralai"),
    M("Qwen3", "Alibaba", "chat reason small", "0.6B to 32B, plus 30B and 235B mixture of experts", "free", "Apache 2.0", "Top open all-rounder; switches between quick answers and deep thinking.", "ollama run qwen3", "Qwen"),
    M("Qwen2.5-Coder / Qwen3-Coder", "Alibaba", "code", "0.5B to 32B; Qwen3-Coder up to 480B", "free", "Apache 2.0 (most sizes)", "Writing code; the small sizes run on laptops.", "ollama run qwen2.5-coder", "Qwen"),
    M("Qwen2.5-VL", "Alibaba", "vision", "3B, 7B, 32B, 72B", "cond", "Apache 2.0 or Qwen licence, by size", "Reading documents, charts and screenshots.", "", "Qwen"),
    M("QwQ-32B", "Alibaba", "reason", "32B", "free", "Apache 2.0", "Maths and logic, thinking step by step.", "", "Qwen"),
    M("DeepSeek-R1", "DeepSeek", "reason small", "671B (mixture of experts), plus small versions 1.5B to 70B", "free", "MIT", "Showed open models can reason like the best closed ones.", "ollama run deepseek-r1", "deepseek-ai"),
    M("DeepSeek-V3", "DeepSeek", "chat code", "671B (mixture of experts, 37B active)", "free", "MIT (V3-0324 and later)", "A very strong general model, cheap to run for its size.", "", "deepseek-ai"),
    M("Phi-4 family", "Microsoft", "small reason vision", "Phi-4 14B, Phi-4-mini 3.8B, Phi-4-reasoning, Phi-4-multimodal", "free", "MIT", "Small models trained on high-quality data; good at maths for their size.", "ollama run phi4", "microsoft"),
    M("Kimi K2", "Moonshot AI", "chat code", "1 trillion (mixture of experts, 32B active)", "cond", "Modified MIT (credit needed in very large products)", "Agent tasks and coding; one of the largest open models.", "", "moonshotai"),
    M("GLM-4.5", "Zhipu AI (Z.ai)", "chat reason code", "355B and 106B (Air), mixture of experts", "free", "MIT", "Agents, tool use and coding.", "", "zai-org"),
    M("MiniMax-M1", "MiniMax", "reason", "456B (mixture of experts)", "free", "Apache 2.0", "Reasoning over very long inputs (up to about a million tokens).", "", "MiniMaxAI"),
    M("OLMo 2", "Allen Institute for AI", "chat", "7B, 13B, 32B", "free", "Apache 2.0", "Fully open: weights, training data, code and logs are all public. Great for learning and research.", "ollama run olmo2", "allenai"),
    M("Granite", "IBM", "chat small code", "Granite 3.x 2B and 8B, Granite 4", "free", "Apache 2.0", "Business use, with published details of the training data.", "ollama run granite3.3", "ibm-granite"),
    M("Nemotron", "NVIDIA", "chat reason", "Several sizes, many built on Llama", "cond", "NVIDIA Open Model License", "Tuned for helpfulness and reasoning; runs well on NVIDIA GPUs.", "", "nvidia"),
    M("Falcon 3", "Technology Innovation Institute (UAE)", "chat small", "1B, 3B, 7B, 10B", "cond", "TII Falcon License", "Light models that run on modest hardware.", "ollama run falcon3", "tiiuae"),
    M("Command R / R+", "Cohere", "chat", "35B, 104B", "nc", "CC BY-NC", "Answering from your own documents (RAG) with sources.", "ollama run command-r", "CohereLabs"),
    M("Aya Expanse / Aya Vision", "Cohere", "chat vision", "8B, 32B", "nc", "CC BY-NC", "Chatting in 23 languages.", "", "CohereLabs"),
    M("SmolLM", "Hugging Face", "small", "SmolLM2 135M, 360M, 1.7B; SmolLM3 3B", "free", "Apache 2.0", "Tiny models for phones, browsers and learning how models work.", "ollama run smollm2", "HuggingFaceTB"),
    M("Grok-1", "xAI", "chat", "314B (mixture of experts)", "free", "Apache 2.0", "A large older base model, mainly of research interest.", "", "xai-org"),
    M("Pythia / GPT-NeoX", "EleutherAI", "chat", "70M to 20B", "free", "Apache 2.0", "Fully open research models, built to study how models learn.", "", "EleutherAI"),
    M("BLOOM", "BigScience", "chat", "560M to 176B", "cond", "BigScience RAIL License (use limits)", "An early open model written by 1,000+ researchers; 46 languages.", "", "bigscience"),
    M("LLaVA", "LLaVA team (University of Wisconsin–Madison and others)", "vision", "7B, 13B, 34B", "cond", "Follows the model it's built on", "Chatting about pictures; an early, simple vision model.", "ollama run llava", "liuhaotian"),
    M("Stable Diffusion (SDXL, SD 3.5)", "Stability AI", "image", "SD 3.5: 2.5B and 8B", "cond", "Stability AI Community License (free under $1M revenue a year)", "Making and editing pictures; huge community of add-ons.", "", "stabilityai"),
    M("FLUX.1", "Black Forest Labs", "image", "12B", "cond", "[schnell]: Apache 2.0; [dev]: non-commercial", "High-quality pictures with readable text in them.", "", "black-forest-labs"),
    M("Wan 2.x", "Alibaba", "video", "1.3B, 5B, 14B", "free", "Apache 2.0", "Making short videos from text or a picture; the small one runs on a gaming GPU.", "", "Wan-AI"),
    M("HunyuanVideo", "Tencent", "video", "13B", "cond", "Tencent Hunyuan licence (some regions excluded)", "Realistic short videos from text.", "", "tencent"),
    M("LTX-Video", "Lightricks", "video", "2B, 13B", "cond", "LTX-Video open licence", "Very fast video making.", "", "Lightricks"),
    M("Mochi 1", "Genmo", "video", "10B", "free", "Apache 2.0", "Smooth motion in short videos.", "", "genmo"),
    M("Whisper", "OpenAI", "speech", "tiny (39M) to large-v3 (1.5B), turbo", "free", "MIT", "Turning speech into text in about 100 languages; also translates.", "", "openai"),
    M("Kokoro", "hexgrad", "speech", "82M", "free", "Apache 2.0", "Natural text-to-speech that runs fast, even without a GPU.", "", "hexgrad"),
    M("XTTS-v2", "Coqui", "speech", "About 0.5B", "nc", "Coqui Public Model License", "Copying a voice from a few seconds of audio (use only with consent).", "", "coqui"),
    M("MusicGen", "Meta", "speech", "300M to 3.3B", "nc", "CC BY-NC (model weights)", "Making music from a text description.", "", "facebook"),
    M("CLIP", "OpenAI", "vision", "Several sizes", "free", "MIT", "Matching pictures with text; a building block of many image tools.", "", "openai"),
    M("Segment Anything (SAM 2)", "Meta", "vision", "39M to 224M", "free", "Apache 2.0", "Cutting out any object in a picture or video with one click.", "", "facebook"),
    M("YOLO (Ultralytics YOLO11)", "Ultralytics", "vision small", "Nano to extra-large", "cond", "AGPL-3.0 (share your code, or buy a licence)", "Spotting and boxing objects in live video, in real time.", "", "Ultralytics"),
    M("DINOv2", "Meta", "vision", "21M to 1.1B", "free", "Apache 2.0", "Understanding images without labels; used for search and medical images.", "", "facebook"),
    M("BGE", "Beijing Academy of AI (BAAI)", "embed", "Small to large; bge-m3 is multilingual", "free", "MIT", "Search and RAG: finding the passages that match a question.", "ollama pull bge-m3", "BAAI"),
    M("Nomic Embed", "Nomic AI", "embed", "137M", "free", "Apache 2.0", "Search over long documents; fully open training data.", "ollama pull nomic-embed-text", "nomic-ai"),
    M("all-MiniLM-L6-v2", "Sentence Transformers", "embed small", "22M", "free", "Apache 2.0", "A tiny, quick favourite for semantic search demos.", "ollama pull all-minilm", "sentence-transformers"),
    M("E5", "Microsoft", "embed", "Small, base, large; multilingual", "free", "MIT", "Search and matching sentences in many languages.", "", "intfloat"),
  ];

  let q = "", cat = "all", lic = "all";
  const shown = () => MODELS.filter((m) => (cat === "all" || m.c.includes(cat)) && (lic === "all" || m.l === lic)
    && (!q || (m.n + " " + m.by + " " + m.good + " " + m.s).toLowerCase().includes(q)));

  function listHTML() {
    const list = shown();
    return `<p class="opcount">${list.length} of ${MODELS.length} models</p>
      ${list.length ? `<div class="opgrid">${list.map((m) => `<article class="opcard">
        <header><h4>${esc(m.n)}</h4><span class="oplic ${m.l}" title="${esc(m.ln)}">${LIC[m.l]}</span></header>
        <p class="opby">${esc(m.by)}</p>
        <p class="optags">${m.c.map((c) => `<span>${CATS[c]}</span>`).join("")}</p>
        <p><b>Sizes:</b> ${esc(m.s)}</p>
        <p><b>Good for:</b> ${esc(m.good)}</p>
        <p class="opln"><b>Licence:</b> ${esc(m.ln)}</p>
        <div class="opbtns">${m.run ? `<button type="button" class="btn sm" data-opcopy="${esc(m.run)}" title="Copy this command for Ollama"><code>${esc(m.run)}</code></button>` : ""}<a class="btn sm" href="https://huggingface.co/${esc(m.hf)}" target="_blank" rel="noopener">Hugging Face ↗</a></div>
      </article>`).join("")}</div>` : `<p class="opnone">No models match. Try another word or filter.</p>`}`;
  }
  const chips = (key, cur, all, labels) => `<div class="opchips" role="group">${[["all", all]].concat(Object.entries(labels)).map(([k, l]) => `<button type="button" class="choice" data-op${key}="${k}" aria-pressed="${cur === k}">${esc(l)}</button>`).join("")}</div>`;

  // Rough memory needed to run a model: parameters × bytes per parameter, plus about 20% for the working memory
  const BYTES = { 16: 2, 8: 1, 4: 0.5 };
  let calc = { b: 8, bits: 4 };
  function calcOut() {
    const gb = calc.b * BYTES[calc.bits] * 1.2;
    const fit = gb <= 6 ? "Most laptops with 8 GB of memory, even without a graphics card (slowly)." : gb <= 12 ? "A laptop with 16 GB of memory, or a graphics card with 8–12 GB." : gb <= 24 ? "A computer with 32 GB of memory, or a gaming graphics card with 24 GB." : gb <= 48 ? "A workstation with 64 GB of memory, or two big graphics cards." : gb <= 160 ? "A server with one or two data-centre GPUs (80 GB each)." : "Several data-centre GPUs working together: a job for the cloud.";
    return `<p class="opbig">≈ ${gb < 10 ? gb.toFixed(1) : Math.round(gb)} GB</p><p>${fit}</p>`;
  }

  function html() {
    return `<section class="m2sec">
      <header><p class="kicker">Open models · about 20 minutes</p><h2>AI you can download and run yourself</h2>
        <p>ChatGPT, Claude and Gemini run on their makers' computers: you can only reach them through an app or a paid API. Open models are different. Anyone can download them, run them on their own computer or server, and change them.</p></header>

      <div class="card2"><p class="kicker">1 · What "open" really means</p>
        <h3>Three levels of openness</h3>
        <div class="opspec">
          <div><b>Closed</b><small>GPT-5, Claude, Gemini</small><p>Use it through the maker's app or API. You never see the model itself.</p></div>
          <div><b>Open weights</b><small>Llama, Gemma, Qwen, DeepSeek, gpt-oss</small><p>Download the trained model (its "weights") and run it anywhere. The training data usually stays secret.</p></div>
          <div><b>Fully open</b><small>OLMo, Pythia</small><p>Weights <i>and</i> training data, code and logs are public, so anyone can check or rebuild it.</p></div>
        </div>
        <p>Most "open source AI" is really <b>open weights</b>. And read the licence: some are free for anything, some add conditions, and some forbid commercial use.</p>
        <div class="opwhy"><div><p class="lbl good">Why choose an open model</p><ul><li><b>Privacy:</b> data never leaves your computer or company.</li><li><b>Cost:</b> no fee per message once it's running.</li><li><b>Control:</b> fine-tune it on your own data; it won't change or vanish overnight.</li><li><b>Offline:</b> works with no internet.</li></ul></div>
          <div><p class="lbl bad">The trade-offs</p><ul><li><b>Hardware:</b> big models need powerful, expensive GPUs.</li><li><b>Work:</b> you install, update and secure it yourself.</li><li><b>Safety:</b> you add the guardrails the big apps include.</li><li><b>Quality:</b> the very best closed models are often still ahead.</li></ul></div></div>
      </div>

      <div class="card2"><p class="kicker">2 · The list</p>
        <h3>The main open models</h3>
        <p class="opnote">The best-known open models as of mid-2026. New versions come out almost every month, so check the maker's page for the latest. "Mixture of experts" models only use part of themselves for each word, so they run faster than their size suggests.</p>
        <input type="search" class="opsearch" placeholder="Search: a name, a maker or a job (e.g. “code”, “Google”, “speech”)" aria-label="Search open models" value="${esc(q)}" data-opq>
        <p class="oplbl">What it does</p>${chips("cat", cat, "Everything", CATS)}
        <p class="oplbl">Licence</p>${chips("lic", lic, "Any licence", LIC)}
        <div data-oplist>${listHTML()}</div>
      </div>

      <div class="card2"><p class="kicker">3 · Will it fit?</p>
        <h3>How much memory does a model need?</h3>
        <p>A model's size is counted in <b>parameters</b> (B = billion). Each one takes memory. <b>Quantising</b> stores each parameter with fewer bits: a 4-bit model needs about a quarter of the memory of the 16-bit original, and loses only a little quality.</p>
        <div class="opcalc">
          <label>Model size: <b data-opb>${calc.b}B</b><input type="range" class="slider" min="1" max="405" step="1" value="${calc.b}" data-opcalc="b" aria-label="Model size in billions of parameters"></label>
          <div class="opchips" role="group" aria-label="Precision">${[16, 8, 4].map((b) => `<button type="button" class="choice" data-opbits="${b}" aria-pressed="${calc.bits === b}">${b}-bit</button>`).join("")}</div>
          <div class="opout" data-opout>${calcOut()}</div>
        </div>
      </div>

      <div class="card2"><p class="kicker">4 · Try one in five minutes</p>
        <h3>Run a model on your own computer</h3>
        <ol>
          <li>Install <a href="https://ollama.com" target="_blank" rel="noopener">Ollama</a> (free, for Windows, Mac and Linux). Prefer buttons to typing? <a href="https://lmstudio.ai" target="_blank" rel="noopener">LM Studio</a> does the same in a normal app.</li>
          <li>Open a terminal and type a command from the list, for example:<pre class="pbox">ollama run llama3.2</pre></li>
          <li>The first time, it downloads the model (about 2 GB for this one). Then type your prompt and press Enter. Type <code>/bye</code> to stop.</li>
          <li>Nothing you type leaves your computer. Try turning off the Wi-Fi: it still works.</li>
        </ol>
      </div>

      <div class="card2"><p class="kicker">5 · Prompting open models</p>
        <h3>What changes when the model is small</h3>
        <ul>
          <li><b>Be more explicit.</b> Small models guess less well. Spell out the role, task, format and length, as in the <button class="wordlink" data-tab="build">Prompt builder</button>.</li>
          <li><b>One job per prompt.</b> Split big tasks into steps instead of asking for everything at once.</li>
          <li><b>Show an example.</b> One or two examples of the answer you want (few-shot prompting) help small models a lot.</li>
          <li><b>Pick the chat version.</b> Names ending in <code>-instruct</code>, <code>-it</code> or <code>-chat</code> follow instructions. "Base" models only continue your text.</li>
          <li><b>Check facts harder.</b> Smaller models make things up more often. Use the <button class="wordlink" data-tab="hunt">Hallucination hunt</button> method to test them.</li>
          <li><b>Lower the temperature</b> for facts and code. See the <button class="wordlink" data-tab="api">AI settings</button> tab.</li>
        </ul>
      </div>
    </section>`;
  }

  function mount(root) {
    const el = root.querySelector(".m2sec"); if (!el) return;
    const redraw = () => { const l = el.querySelector("[data-oplist]"); if (l) l.innerHTML = listHTML(); };
    el.addEventListener("input", (e) => {
      if (e.target.matches("[data-opq]")) { q = e.target.value.trim().toLowerCase(); redraw(); return; }
      if (e.target.dataset.opcalc) { calc.b = +e.target.value; el.querySelector("[data-opb]").textContent = calc.b + "B"; el.querySelector("[data-opout]").innerHTML = calcOut(); }
    });
    el.addEventListener("click", (e) => {
      const c = e.target.closest("[data-opcat]"), l = e.target.closest("[data-oplic]"), b = e.target.closest("[data-opbits]"), cp = e.target.closest("[data-opcopy]");
      if (c || l) {
        if (c) cat = c.dataset.opcat; else lic = l.dataset.oplic;
        const key = c ? "opcat" : "oplic", cur = c ? cat : lic;
        el.querySelectorAll(`[data-${key}]`).forEach((x) => x.setAttribute("aria-pressed", x.dataset[key] === cur));
        redraw(); return;
      }
      if (b) { calc.bits = +b.dataset.opbits; el.querySelectorAll("[data-opbits]").forEach((x) => x.setAttribute("aria-pressed", +x.dataset.opbits === calc.bits)); el.querySelector("[data-opout]").innerHTML = calcOut(); return; }
      if (cp) {
        const done = () => { const old = cp.innerHTML; cp.textContent = "Copied ✓"; setTimeout(() => { cp.innerHTML = old; }, 1400); };
        if (navigator.clipboard) navigator.clipboard.writeText(cp.dataset.opcopy).then(done, () => {}); else done();
      }
    });
  }

  window.WB_M2OPEN = { html, mount };
})();
