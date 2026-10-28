// Module 8, the "AI on Kubernetes" tab: the main Kubernetes ideas, a live cluster simulator running a
// model server on GPU nodes (autoscaling, self-healing, rolling updates and rollback), a Deployment
// file with clickable line notes, why AI makes Kubernetes harder, and when you don't need it.
// Module 8 calls WB_M8K8S.view() for the tab and WB_M8K8S.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- The cluster simulator ---------- */
  // 3 GPU nodes with 2 GPUs each. Each model pod needs one GPU and serves about 10 requests a second.
  const NODES = 3, PER = 2, SLOTS = NODES * PER, RPS = 10, MAXR = 8, START_TICKS = 4;
  let pods = [], traffic = 15, auto = true, manual = 2, target = "v1", good = "v1", bad = {}, rolling = false, events = [], t = 0, timer = null, nextV = 2;
  const name = () => "chat-model-" + Math.random().toString(36).slice(2, 7);
  const log = (m) => { events.unshift([t, m]); events = events.slice(0, 7); };
  const desired = () => auto ? Math.max(1, Math.min(MAXR, Math.ceil(traffic / RPS))) : manual;
  const freeSlot = () => { for (let s = 0; s < SLOTS; s++) if (!pods.some((p) => p.slot === s)) return s; return null; };
  function add(ver) {
    const s = freeSlot(), p = { id: name(), ver, slot: s, st: s == null ? "pending" : "starting", age: 0 };
    pods.push(p);
    log(s == null ? `New pod ${p.id} is <b>waiting for a GPU</b>: every GPU is busy.` : `Starting pod ${p.id} (${ver}) on node ${Math.floor(s / PER) + 1}: loading the model's weights…`);
  }
  // Least useful first: waiting, then starting or failing, then ready
  const rank = { pending: 0, failing: 1, starting: 2, ready: 3 };
  function remove(list) { const p = list.sort((a, b) => rank[a.st] - rank[b.st])[0]; pods = pods.filter((x) => x !== p); return p; }
  // What the Deployment controller does: compare what's running with what's wanted, and fix the difference
  function reconcile() {
    const want = desired(), alive = pods.filter((p) => p.st !== "crashed");
    const old = alive.filter((p) => p.ver !== target), neu = alive.filter((p) => p.ver === target);
    const neuReady = neu.filter((p) => p.st === "ready").length;
    while (old.length > Math.max(0, want - neuReady)) { const p = remove(old); old.splice(old.indexOf(p), 1); log(`Stopped old pod ${p.id} (${p.ver}).`); }
    if (neu.some((p) => p.st === "failing")) return;
    const wantNeu = old.length ? Math.min(want, neuReady + 1) : want; // a rolling update replaces one pod at a time
    for (let n = neu.length; n < wantNeu; n++) add(target);
    if (!old.length) {
      while (neu.length > want) { const p = remove(neu); neu.splice(neu.indexOf(p), 1); log(`Scaled down: stopped pod ${p.id}.`); }
      if (rolling && neu.every((p) => p.st === "ready")) { rolling = false; good = target; log(`<b>Rollout finished.</b> Every pod now runs ${target}.`); }
    }
  }
  function tick() {
    t++;
    pods.forEach((p) => {
      if (p.st === "pending") { const s = freeSlot(); if (s != null) { p.slot = s; p.st = "starting"; p.age = 0; log(`A GPU is free: pod ${p.id} starts on node ${Math.floor(s / PER) + 1}.`); } }
      else if (p.st === "starting" && ++p.age >= START_TICKS) {
        if (bad[p.ver]) { p.st = "failing"; log(`Pod ${p.id} (${p.ver}) <b>fails its health check</b>. Kubernetes keeps it out of the service, and the rollout stops.`); }
        else { p.st = "ready"; log(`Pod ${p.id} passed its health check and now <b>receives requests</b>.`); }
      }
    });
    pods = pods.filter((p) => { if (p.st === "crashed" && ++p.age >= 2) { log(`The Deployment sees pod ${p.id} is gone and starts a replacement.`); return false; } return true; });
    reconcile();
  }
  function liveHTML() {
    const ready = pods.filter((p) => p.st === "ready").length, cap = ready * RPS, want = desired();
    const status = !ready ? ["bad", "Down: no pod is ready to answer"] : traffic > cap ? ["warn", `Overloaded: about ${Math.round((1 - cap / traffic) * 100)}% of requests wait in a queue`] : ["good", "Healthy: every request is answered"];
    const chip = (p) => `<div class="m8pod ${p.st} ${bad[p.ver] ? "badver" : ""}" title="${esc(p.id)}"><b>${esc(p.ver)}</b><small>${{ starting: "loading…", ready: "ready", crashed: "crashed", failing: "failing", pending: "waiting" }[p.st]}</small></div>`;
    const failing = pods.some((p) => p.st === "failing");
    return `<div class="m8svc"><b>Service: chat-model</b><span>${traffic} requests/s → ${ready} ready pod${ready === 1 ? "" : "s"} (can handle ${cap}/s)</span><span class="m8health ${status[0]}">${status[1]}</span></div>
      <div class="m8nodes">${Array.from({ length: NODES }, (_, n) => `<div class="m8node"><p class="dzlbl">Node ${n + 1} · ${PER} GPUs</p><div class="m8slots">${Array.from({ length: PER }, (_, g) => { const p = pods.find((x) => x.slot === n * PER + g); return p ? chip(p) : `<div class="m8pod empty"><small>free GPU</small></div>`; }).join("")}</div></div>`).join("")}</div>
      ${pods.some((p) => p.st === "pending") ? `<div class="m8pending"><p class="dzlbl">Waiting for a GPU</p><div class="m8slots">${pods.filter((p) => p.st === "pending").map(chip).join("")}</div></div>` : ""}
      ${rolling && pods.some((p) => p.ver === target && p.st === "pending") ? `<p class="tip" style="margin:8px 0 0"><b>The update is stuck.</b> A rolling update starts each new pod <i>before</i> stopping an old one, so it needs a spare GPU, and there isn't one. Lower the traffic to free a GPU. Real teams keep a spare GPU or let one old pod stop first (<code>maxUnavailable: 1</code>).</p>` : ""}
      <p class="crit" style="margin:8px 0">Wanted: <b>${want}</b> pod${want === 1 ? "" : "s"}${auto ? " (set by the autoscaler)" : ""} · Version wanted: <b>${esc(target)}</b>${rolling ? " · rolling update in progress" : ""}</p>
      <div class="btnrow" style="margin:0">
        <button class="btn sm" data-m8k="crash" ${ready ? "" : "disabled"}>💥 Crash a pod</button>
        <button class="btn sm" data-m8k="roll" ${rolling || failing ? "disabled" : ""}>Roll out v${nextV}</button>
        <button class="btn sm" data-m8k="rollbad" ${rolling || failing ? "disabled" : ""}>Roll out a broken v${nextV}</button>
        ${failing ? `<button class="btn primary sm" data-m8k="back">Roll back to ${esc(good)}</button>` : ""}
        ${!auto ? `<span class="m8rep">Replicas <button class="btn sm" data-m8k="minus" ${manual <= 1 ? "disabled" : ""}>−</button> <b>${manual}</b> <button class="btn sm" data-m8k="plus" ${manual >= MAXR ? "disabled" : ""}>+</button></span>` : ""}</div>
      <p class="dzlbl" style="margin-top:12px">What Kubernetes just did</p>
      <ol class="m8events">${events.length ? events.map(([s, m]) => `<li><span>${(s * 0.7).toFixed(1)}s</span> ${m}</li>`).join("") : `<li>Starting up…</li>`}</ol>`;
  }
  const simHTML = () => `<div class="m8kctl"><label>Traffic: <b id="m8ktv">${traffic}</b> requests a second<input type="range" min="0" max="80" step="5" value="${traffic}" data-m8kt aria-label="Traffic"></label>
      <label class="hostcheck" style="margin:0"><input type="checkbox" data-m8ka ${auto ? "checked" : ""}> Autoscaler on (adds pods when traffic grows)</label></div>
    <div id="m8klive" aria-live="off">${liveHTML()}</div>`;

  /* ---------- The Deployment file ---------- */
  const YAML = [
    ["apiVersion: apps/v1", "Which part of the Kubernetes API this file uses. Deployments live in apps/v1."],
    ["kind: Deployment", "A Deployment says “keep this many copies of this program running, at this version”. Kubernetes then works all the time to make that true."],
    ["metadata:", ""],
    ["  name: chat-model", "The Deployment's name. Its pods get names like chat-model-x7k2p, as in the simulator."],
    ["spec:", ""],
    ["  replicas: 2", "How many pods to run. An autoscaler can change this number as traffic goes up and down."],
    ["  strategy:", ""],
    ["    rollingUpdate: {maxSurge: 1, maxUnavailable: 0}", "How to update: start one extra new pod, wait until it's healthy, then stop one old pod. Users never lose service, exactly as in the simulator."],
    ["  template:", "Everything below is the recipe for each pod."],
    ["    spec:", ""],
    ["      containers:", ""],
    ["      - name: model-server", ""],
    ["        image: vllm/vllm-openai:v0.6.3", "The container image: a packaged program. vLLM is a popular open-source server that runs open models and answers with the same API shape as OpenAI. Always pin a version number, so an update never surprises you."],
    ["        args: [\"--model\", \"Qwen/Qwen2.5-7B-Instruct\"]", "Which model to load, here an open 7-billion-parameter model from Hugging Face. Its weights are about 15 GB, which is why pods take a while to start."],
    ["        ports: [{containerPort: 8000}]", "The port the server listens on inside the pod."],
    ["        resources:", ""],
    ["          limits: {nvidia.com/gpu: 1, memory: 32Gi}", "Each pod needs one whole GPU. Kubernetes only places the pod on a node with a free GPU. If none is free, the pod waits (“Pending”), like the waiting pods in the simulator."],
    ["        readinessProbe:", ""],
    ["          httpGet: {path: /health, port: 8000}", "The health check. Kubernetes only sends requests to a pod once /health answers OK, so users never reach a pod that's still loading or broken."],
    ["          initialDelaySeconds: 60", "Wait a minute before the first check, because loading a big model takes time."],
    ["        env:", ""],
    ["        - name: HF_TOKEN", "A secret the server needs (here a Hugging Face token to download the model)."],
    ["          valueFrom: {secretKeyRef: {name: hf-secret, key: token}}", "The value comes from a Kubernetes Secret, never written in this file. Same rule as the Keep keys secret tab: keys don't go in code."],
  ];
  let yl = 1;
  const yamlHTML = () => `<div class="m7code" role="list">${YAML.map(([l, n], i) => n ? `<button role="listitem" class="m7line ${i === yl ? "on" : ""}" data-m8yl="${i}"><span class="ln">${i + 1}</span><code>${esc(l)}</code></button>` : `<div class="m7line blank"><span class="ln">${i + 1}</span><code>${esc(l)}</code></div>`).join("")}</div>
    <div class="qkpanel" aria-live="polite"><p style="margin:0"><b>Line ${yl + 1}.</b> ${esc(YAML[yl][1])}</p></div>`;

  const word = (term, label) => `<button class="wordlink" data-word="${esc(term)}" title="Open in the learning web">${esc(label || term)}</button>`;
  const view = () => `<section class="m2sec">
    <header><p class="kicker">Explore · 25 minutes</p><h2>AI on Kubernetes</h2><p>Big companies that run their <b>own</b> models usually do it on Kubernetes (often written K8s): a system that runs your program on many computers at once and keeps it running, by itself, day and night.</p></header>
    <div class="card2"><p class="kicker">1 · The words</p><h3>Kubernetes in six ideas</h3>
      <div class="m8grid">
        <div><b>📦 Container</b><p>Your program packed with everything it needs, so it runs the same anywhere (made with Docker).</p></div>
        <div><b>🟩 Pod</b><p>One running copy of a container. Here: one copy of the model server, using one GPU.</p></div>
        <div><b>🖥 Node</b><p>One computer in the cluster. AI clusters have GPU nodes, which are fast and very expensive.</p></div>
        <div><b>📋 Deployment</b><p>Your wish: “keep 2 pods of version 1 running”. Kubernetes keeps checking and fixes any difference.</p></div>
        <div><b>🔀 Service</b><p>One fixed address for your app. It shares requests between the pods that are ready.</p></div>
        <div><b>📈 Autoscaler</b><p>Changes how many pods you want as traffic goes up and down.</p></div>
      </div></div>
    <div class="card2"><p class="kicker">2 · Simulator</p><h3>Run a model on a cluster</h3>
      <p class="crit" style="margin:0 0 10px">Push the traffic up and watch pods appear. Crash a pod. Roll out a new version, then a broken one. You're watching the cluster live: nothing here needs pressing “next”.</p>
      <div id="m8k">${simHTML()}</div></div>
    <div class="card2"><p class="kicker">3 · The file behind it</p><h3>A Deployment for a model server</h3>
      <p class="crit" style="margin:0 0 10px">You don't click buttons in Kubernetes: you write a file saying what you want, and Kubernetes makes it happen. Click a line to see what it does.</p>
      <div id="m8yaml">${yamlHTML()}</div></div>
    <div class="card2"><p class="kicker">4 · Why AI is harder</p><h3>Models aren't like websites</h3>
      <ul><li><b>GPUs are scarce and costly.</b> A GPU node can cost more per hour than a hundred web servers, so you can't just add pods. That's why pods sometimes wait for a GPU.</li>
        <li><b>Models are huge, so they start slowly.</b> Loading many gigabytes of weights takes minutes. Health checks stop users reaching a half-loaded pod, and teams keep at least one pod warm instead of scaling to zero.</li>
        <li><b>Scale on the right signal.</b> Websites scale on CPU use. Model servers scale better on waiting requests or GPU use.</li>
        <li><b>Special tools help.</b> vLLM serves models fast; KServe and Ray Serve run them on Kubernetes; the NVIDIA GPU Operator lets Kubernetes see GPUs. Cloud versions (Google GKE, Amazon EKS, Microsoft AKS) run the cluster for you.</li></ul>
      <p class="tip" style="margin:6px 0 0">The same ideas help with ${word("MLOps")} in general: training jobs, ${word("Model Serving", "model serving")} and safe updates all run on clusters like this.</p></div>
    <div class="card2"><p class="kicker">5 · Do you need it?</p><h3>Probably not yet</h3>
      <div class="hrfair"><div><p class="lbl bad">Skip Kubernetes when</p><p style="margin:0">Your app calls a model API (Anthropic, OpenAI, OpenRouter…). The model company runs the GPUs and clusters for you. A static page or a serverless function is far simpler.</p></div>
        <div><p class="lbl good">Use Kubernetes when</p><p style="margin:0">You run your own models, need many services working together, must keep data inside your company, or your team already runs Kubernetes.</p></div></div>
      <div class="btnrow"><button class="btn primary" data-tab="keys">Next: keep keys secret →</button></div></div>
  </section>`;

  let root = null;
  const put = (id, h) => { const x = root && root.querySelector("#" + id); if (x) x.innerHTML = h; };
  const live = () => put("m8klive", liveHTML());
  // The cluster runs on its own while its tab is showing, and pauses when it isn't
  function run() {
    if (timer) return;
    if (!pods.length) { reconcile(); live(); }
    timer = setInterval(() => { const box = root && root.querySelector("#m8klive"); if (!box || !box.offsetParent) { clearInterval(timer); timer = null; return; } tick(); live(); }, 700);
  }
  function mount(el) {
    if (root !== el) {
      root = el;
      el.addEventListener("click", (e) => {
        const y = e.target.closest("[data-m8yl]"); if (y) { yl = +y.dataset.m8yl; put("m8yaml", yamlHTML()); return; }
        const b = e.target.closest("[data-m8k]"); if (!b) return;
        const a = b.dataset.m8k;
        if (a === "crash") { const r = pods.filter((p) => p.st === "ready"); const p = r[Math.floor(Math.random() * r.length)]; if (p) { p.st = "crashed"; p.age = 0; log(`💥 Pod ${p.id} crashed (say, the GPU ran out of memory).`); } }
        else if (a === "roll" || a === "rollbad") { const v = "v" + nextV++; if (a === "rollbad") bad[v] = true; target = v; rolling = true; log(`You changed the Deployment to <b>${v}</b>. Kubernetes starts replacing pods one at a time.`); reconcile(); }
        else if (a === "back") { log(`You rolled back to <b>${good}</b>. The broken pods are stopped.`); target = good; rolling = false; reconcile(); }
        else if (a === "plus" || a === "minus") { manual += a === "plus" ? 1 : -1; reconcile(); }
        live();
      });
      el.addEventListener("input", (e) => {
        if (e.target.matches("[data-m8kt]")) { traffic = +e.target.value; const v = el.querySelector("#m8ktv"); if (v) v.textContent = traffic; reconcile(); live(); }
        else if (e.target.matches("[data-m8ka]")) { if (!e.target.checked) manual = desired(); auto = e.target.checked; log(auto ? "Autoscaler on: the number of pods now follows traffic." : `Autoscaler off: you set the number of pods yourself.`); reconcile(); live(); }
      });
    }
    if (el.querySelector("#m8k")) run();
  }
  window.WB_M8K8S = { view, mount };
})();
