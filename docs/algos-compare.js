// Algorithms map: the "how they connect" overview page and the often-confused pairs.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A) return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const name = (id) => (A.list.find((x) => x.id === id) || { name: id }).name;
  const chip = (id) => `<button type="button" class="cchip" data-go="${id}">${esc(name(id))}</button>`;

  // a, b = demo ids; same = what they share; da / db = how each one differs; pick = rule of thumb
  const PAIRS = [
    { a: "linreg", b: "logreg", same: "Both multiply each input by a weight and add them up.", da: "Outputs a number on a sliding scale (a price, a temperature).", db: "Squashes that sum into a probability and picks a class (spam / not spam). Despite the name, it's classification.", pick: "Predicting \"how much\"? Linear. Predicting \"which one\"? Logistic." },
    { a: "tree", b: "forest", same: "A forest is made of decision trees.", da: "One tree: easy to read, but jumpy and likely to overfit.", db: "Hundreds of trees, each trained on a random sample, that vote. Smoother and more reliable, but harder to explain.", pick: "Need to explain every decision? One tree. Need accuracy? A forest." },
    { a: "forest", b: "boost", same: "Both combine many decision trees.", da: "Trees are trained separately, side by side, and their votes are averaged. Fixes jumpiness.", db: "Trees are trained one after another, each one fixing the errors the earlier ones left. Fixes stubborn mistakes.", pick: "Random forest = a crowd voting. Boosting = a team where each member fixes the last one's mistakes." },
    { a: "knn", b: "kmeans", same: "Both use distance and a number called k. That's where the confusion comes from.", da: "Supervised: the points already have answers. k = how many neighbours vote on a new point.", db: "Unsupervised: no answers. k = how many groups to split the data into.", pick: "KNN predicts a label for a new point. K-means discovers groups." },
    { a: "kmeans", b: "dbscan", same: "Both find groups without answers (clustering).", da: "You choose the number of groups; it finds round blobs and puts every point in some group.", db: "Finds dense crowds of any shape, decides the number of groups itself, and labels lonely points as noise.", pick: "Round groups and you know how many? K-means. Odd shapes or outliers? DBSCAN." },
    { a: "kmeans", b: "hier", same: "Both find groups without answers.", da: "Must choose k before starting.", db: "Builds a full family tree of merges; you choose how many groups afterwards by cutting it.", pick: "Not sure how many groups? Hierarchical lets you look first." },
    { a: "pca", b: "tsne", same: "Both squeeze many features down to 2 so you can draw them.", da: "Keeps the overall shape and spread; distances still mean something. Also used to compress data for other models.", db: "Only keeps who is next to whom, so groups appear as islands. Good for a picture, not for measuring.", pick: "Compressing data? PCA. Just want to see the groups? t-SNE / UMAP." },
    { a: "pca", b: "ae", same: "Both compress data into a few numbers and rebuild it. A linear autoencoder is mathematically PCA.", da: "Straight-line directions only, solved directly with maths.", db: "A neural network, so it can learn curved, complex patterns (faces, sounds).", pick: "Simple numbers? PCA. Images, audio, complex data? Autoencoder." },
    { a: "ae", b: "iforest", same: "Both are used to spot anomalies without labelled examples of fraud.", da: "Learns to rebuild normal data; a big rebuild error means \"unusual\".", db: "Makes random cuts; a point that is cut off quickly is unusual.", pick: "Images or signals? Autoencoder. Rows in a table? Isolation forest." },
    { a: "logreg", b: "svm", same: "Both draw a straight boundary between two classes.", da: "Every point pulls on the boundary, and you get a probability for each prediction.", db: "Only the edge points (support vectors) matter, and it chooses the widest gap.", pick: "Need probabilities? Logistic. Want the safest boundary with few examples? SVM." },
    { a: "nb", b: "logreg", same: "Both classify text, for example spam filters.", da: "Just counts words and assumes they're independent. Fast, works with little data, no training loop.", db: "Learns a weight per word by gradient descent. Usually more accurate with more data.", pick: "Tiny dataset or quick baseline? Naive Bayes. Otherwise logistic." },
    { a: "logreg", b: "nn", same: "A neural network with no hidden layers is logistic regression.", da: "One straight boundary.", db: "Hidden layers let the boundary bend into any shape.", pick: "A neural network is many logistic regressions stacked in layers." },
    { a: "nn", b: "cnn", same: "A CNN is a neural network.", da: "General purpose: every input connects to every neuron.", db: "Special wiring for images: small filters slide across the picture, looking for the same pattern everywhere.", pick: "CNN = a neural network built for images." },
    { a: "rnn", b: "transformer", same: "Both are neural networks for sequences such as sentences.", da: "Reads one word at a time, carrying a memory that can fade.", db: "Reads all the words at once and uses attention to link any word with any other.", pick: "Transformers replaced RNNs for language: faster to train and better at long text." },
    { a: "emb", b: "transformer", same: "Both are part of how language models handle words.", da: "Embeddings are the lists of numbers that stand for words. They are the input.", db: "The transformer is the machine that reads those numbers and refines them using context.", pick: "Embeddings = the ingredients. Transformer = the kitchen." },
    { a: "qlearn", b: "dqn", same: "Same idea: score every action (Q-value) and pick the best.", da: "Stores the scores in a table, one row per situation.", db: "Uses a neural network to estimate the scores, because a game screen has too many situations for a table.", pick: "DQN = Q-learning + a neural network." },
    { a: "qlearn", b: "pg", same: "Both learn from reward by trial and error.", da: "Value-based: learns how good each action is, then picks the best.", db: "Policy-based: directly learns how likely it should be to choose each action.", pick: "Few clear actions? Q-learning. Many or continuous actions (steering, robot arms, text)? Policy gradient / PPO." },
    { a: "pg", b: "rlhf", same: "RLHF uses PPO (a policy gradient method) inside it.", da: "The reward comes from the environment (a game score, a slot machine).", db: "The reward comes from a reward model trained on which answers people preferred.", pick: "RLHF = PPO where the reward is human taste." },
    { a: "qlearn", b: "mcts", same: "Both choose actions to win at the end.", da: "Learns from experience over many episodes, then acts quickly.", db: "Thinks before every move by simulating many possible futures.", pick: "Learn ahead of time vs. plan at the moment. AlphaGo used both." },
  ];

  // The three kinds of learning and where they overlap
  const KINDS = [
    { k: "sup", t: "Supervised", q: "Learns from examples that come with the right answer.", eg: "Photos labelled cat/dog → predict the label." },
    { k: "uns", t: "Unsupervised", q: "Gets data with no answers and finds structure by itself.", eg: "Customer records → discover 4 natural groups." },
    { k: "rl", t: "Reinforcement", q: "Learns by acting, with a score (reward) instead of answers.", eg: "Play a game 10,000 times → learn what wins." },
  ];
  const OVERLAPS = [
    { t: "Self-supervised (supervised + unsupervised)", p: "The data creates its own answers: hide the next word, then predict it. No human labels, but trained like supervised learning. This is how ChatGPT, Claude and Gemini are pre-trained.", ids: ["transformer", "emb", "ae"] },
    { t: "RLHF (supervised + reinforcement)", p: "First a reward model learns from human-labelled preferences (supervised), then the chatbot is tuned with PPO to score well (reinforcement).", ids: ["rlhf", "pg"] },
    { t: "Unsupervised features for supervised models", p: "Compress or embed the data first (unsupervised), then train a classifier on the result (supervised).", ids: ["pca", "emb", "logreg"] },
    { t: "Neural networks: the tool used by all three", p: "A neural network is not a kind of learning: it's a model. It can be trained supervised (image classifier), unsupervised (autoencoder) or with reinforcement (DQN).", ids: ["nn", "ae", "dqn"] },
  ];

  // Family trees: each step says what was added
  const FAMILIES = [
    { t: "The tree family", steps: [["tree"], ["forest", "many trees voting side by side"], ["boost", "or: trees in a row, each fixing the last"]] },
    { t: "The neural-network family", steps: [["logreg"], ["nn", "add hidden layers"], ["cnn", "wired for images"], ["rnn", "wired for sequences"], ["transformer", "attention instead of memory"]] },
    { t: "The compression family", steps: [["pca"], ["ae", "make it a neural network"], ["emb", "learned number-lists for meaning"]] },
    { t: "The reward family", steps: [["qlearn"], ["dqn", "replace the table with a network"], ["pg", "learn the policy directly"], ["rlhf", "reward = human preference"]] },
  ];

  function box(id) {
    const ps = PAIRS.filter((p) => p.a === id || p.b === id);
    if (!ps.length) return "";
    return `<details class="plainbox confbox"><summary>Often confused with (${ps.length})</summary>${ps.map((p) => { const other = p.a === id ? p.b : p.a, mine = p.a === id ? p.da : p.db, theirs = p.a === id ? p.db : p.da; return `<div class="conf"><p><b>${esc(name(id))} vs ${chip(other)}</b></p><p><span class="clbl">Same:</span> ${esc(p.same)}</p><p><span class="clbl">This one:</span> ${esc(mine)}</p><p><span class="clbl">${esc(name(other))}:</span> ${esc(theirs)}</p><p class="cpick">${esc(p.pick)}</p></div>`; }).join("")}</details>`;
  }

  function compareCard(p) {
    return `<div class="cmp"><div class="cmphead">${chip(p.a)}<span>vs</span>${chip(p.b)}</div><p class="cmpsame"><span class="clbl">What they share:</span> ${esc(p.same)}</p>
      <div class="cmpgrid"><div><h5>${esc(name(p.a))}</h5><p>${esc(p.da)}</p></div><div><h5>${esc(name(p.b))}</h5><p>${esc(p.db)}</p></div></div><p class="cpick">Rule of thumb: ${esc(p.pick)}</p></div>`;
  }

  A.add({
    id: "connect", group: "map", page: true, name: "How they connect", kind: "Overview", term: "Machine Learning (ML)",
    how: "Many algorithms sound alike or are built from each other. This page maps the three kinds of learning, where they overlap, which algorithm grows out of which, and the pairs people mix up most. Click any name to open its demo.",
    try: "Pick two algorithms you find confusing in the compare tool at the bottom, then open each one's demo and play with them side by side.",
    mount(host) {
      host.innerHTML = `<h4 class="csec">1 · Three kinds of learning, and where they overlap</h4>
        <div class="kinds">${KINDS.map((k) => `<div class="kind k-${k.k}"><h5>${k.t}</h5><p>${esc(k.q)}</p><p class="eg">${esc(k.eg)}</p><div class="chips">${A.list.filter((x) => x.group === k.k).map((x) => chip(x.id)).join("")}</div></div>`).join("")}</div>
        <div class="overlaps">${OVERLAPS.map((o) => `<div class="ovl"><h5>${esc(o.t)}</h5><p>${esc(o.p)}</p><div class="chips">${o.ids.map(chip).join("")}</div></div>`).join("")}</div>
        <h4 class="csec">2 · Family trees: what each one adds</h4>
        <div class="fams">${FAMILIES.map((f) => `<div class="fam"><h5>${esc(f.t)}</h5><ol>${f.steps.map(([id, how]) => `<li>${how ? `<span class="fstep">↓ ${esc(how)}</span>` : ""}${chip(id)}</li>`).join("")}</ol></div>`).join("")}</div>
        <h4 class="csec">3 · Compare any two</h4>
        <div class="cmppick"><select class="field" data-k="pair">${PAIRS.map((p, i) => `<option value="${i}">${esc(name(p.a))} vs ${esc(name(p.b))}</option>`).join("")}</select><button type="button" class="choice" data-k="all">Show all ${PAIRS.length}</button></div>
        <div class="cmpout"></div>
        ${A.uses ? `<h4 class="csec">4 · Where each one is used</h4><p class="algonote">Popular, real examples of each algorithm that you may know. Click a name to open its page and read more.</p>${A.uses.table()}` : ""}`;
      const out = host.querySelector(".cmpout"), sel = host.querySelector('[data-k="pair"]');
      const show = () => { out.innerHTML = compareCard(PAIRS[+sel.value]); };
      sel.addEventListener("change", show);
      host.querySelector('[data-k="all"]').addEventListener("click", () => { out.innerHTML = PAIRS.map(compareCard).join(""); });
      show();
    },
  });
  // Put the overview first in the list
  A.list.unshift(A.list.pop());
  A.compare = { pairs: PAIRS, box };
})();
