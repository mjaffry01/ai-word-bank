// Algorithms map: "Interview guide" tabs for the unsupervised and reinforcement-learning algorithms.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A || !A.guide) return;

  A.guide("kmeans", {
    s30: "K-means splits data into k groups. It places k centre points, assigns every point to its nearest centre, moves each centre to the average of its points, and repeats until nothing changes. You must choose k, and it works best for round, similar-sized groups.",
    steps: ["Choose k and place k starting centres (k-means++ spreads them out sensibly).", "Assign every point to its nearest centre.", "Move each centre to the mean of the points assigned to it.", "Repeat steps 2–3 until assignments stop changing.", "Run several times from different starts and keep the best result (lowest within-group distance)."],
    formula: [["Inertia = Σ (distance from each point to its centre)²", "The total spread inside the groups. K-means tries to make it as small as possible."]],
    knobs: [["k", "Number of groups.", "Choose with the elbow method, the silhouette score, or business sense."], ["init", "How starting centres are chosen.", "k-means++ (the default) avoids bad starts."], ["n_init", "How many fresh starts to try.", "10 or more; keep the best."]],
    good: ["Simple, fast and scales to millions of points.", "Easy to explain: each group has a centre you can describe.", "A good first try for segmentation."],
    bad: ["You must choose k in advance.", "Assumes round, similar-sized groups; fails on odd shapes.", "Sensitive to outliers and to feature scaling; can get stuck in a poor solution."],
    qa: [
      ["How do you choose k?", "Plot inertia against k and look for the elbow where improvements flatten; use the silhouette score (how much closer points are to their own group than the next one); and check the groups make business sense."],
      ["Does K-means always find the best answer?", "No. It always converges, but to a local optimum that depends on the starting centres. Use k-means++ initialisation and several restarts."],
      ["Why must you scale features?", "It uses distances, so a feature measured in thousands would dominate one measured in single digits."],
      ["When does K-means fail?", "With non-round shapes (crescents, rings), very different group sizes or densities, and many outliers. Use DBSCAN, Gaussian mixtures or hierarchical clustering instead."],
      ["K-means vs Gaussian mixture models?", "K-means gives hard assignments and assumes round groups. A Gaussian mixture gives soft probabilities of belonging and allows stretched, elliptical groups."],
      ["How would you evaluate clustering without labels?", "Internal scores (silhouette, Davies–Bouldin), stability across runs or samples, and most importantly whether the groups are useful and interpretable for the business question."],
    ],
  });

  A.guide("hier", {
    s30: "Hierarchical (agglomerative) clustering starts with every point as its own group and keeps merging the two closest groups until only one is left. The history of merges forms a tree called a dendrogram. Cut the tree at any height to get as many groups as you want, without choosing k up front.",
    steps: ["Treat every point as its own cluster.", "Find the two closest clusters (using a linkage rule) and merge them.", "Repeat until everything is one cluster, recording each merge and its distance.", "Draw the dendrogram; cut it where there's a big jump in merge distance."],
    knobs: [["Linkage", "How the distance between two groups is measured: single (closest pair), complete (farthest pair), average, or Ward (smallest increase in spread).", "Ward for compact groups; single can find long chains but suffers \"chaining\"."], ["Distance metric", "Euclidean, Manhattan, cosine…", "Match it to the data."], ["Where to cut", "The number of clusters or a distance threshold.", "Look for the longest vertical gap in the dendrogram."]],
    good: ["No need to choose k in advance.", "The dendrogram shows structure at every level (e.g. a taxonomy).", "Works with any distance measure."],
    bad: ["Slow and memory-heavy: at least O(n²), so impractical for very large data.", "Merges can never be undone, so early mistakes stick.", "Results depend strongly on the linkage choice."],
    qa: [
      ["Agglomerative vs divisive?", "Agglomerative is bottom-up (merge); divisive is top-down (split). Agglomerative is far more common."],
      ["Compare the linkage methods.", "Single: distance of the closest pair, finds elongated shapes but chains clusters together. Complete: the farthest pair, gives compact clusters. Average: a balance. Ward: merges that least increase within-cluster variance, similar to K-means."],
      ["How do you read a dendrogram?", "The height of each join is the distance at which two groups merged. Cutting horizontally gives clusters; a long stretch with no joins suggests a natural number of groups."],
      ["Why doesn't it scale?", "It needs all pairwise distances (n² memory) and repeated merging. For big data, cluster a sample or use K-means or BIRCH first."],
    ],
  });

  A.guide("dbscan", {
    s30: "DBSCAN finds clusters as crowded areas separated by empty space. A point with at least minPts neighbours within radius ε is a core point; clusters grow from core points through their neighbours. Points in sparse areas are labelled noise. It finds clusters of any shape and decides the number of clusters itself.",
    steps: ["For each point, count the neighbours within distance ε.", "Points with at least minPts neighbours are core points.", "Connect core points that are within ε of each other into one cluster, and attach their nearby non-core (border) points.", "Anything not reachable from a core point is noise."],
    knobs: [["ε (eps)", "The neighbourhood radius.", "Use a k-distance plot: sort each point's distance to its k-th neighbour and pick the elbow."], ["minPts", "Neighbours needed to be a core point.", "A rule of thumb is about 2 × the number of features, at least 3–5."]],
    good: ["Finds clusters of any shape.", "Detects outliers as noise automatically.", "No need to choose the number of clusters."],
    bad: ["Struggles when clusters have very different densities (one ε can't fit all).", "Sensitive to ε and minPts.", "Distances get less meaningful in high dimensions."],
    qa: [
      ["Core, border and noise points?", "Core: at least minPts neighbours within ε. Border: within ε of a core point but with too few neighbours itself. Noise: neither."],
      ["When would you use DBSCAN instead of K-means?", "When clusters have irregular shapes, when there are outliers to ignore, or when you don't know how many clusters there are."],
      ["How do you choose ε?", "Plot the sorted distance from each point to its minPts-th nearest neighbour; the elbow of that curve is a good ε."],
      ["What if densities vary a lot?", "A single ε either merges sparse clusters or breaks dense ones. HDBSCAN handles varying densities by trying many ε values and keeping the most stable clusters."],
    ],
  });

  A.guide("pca", {
    s30: "Principal component analysis finds the directions in which the data varies most and rotates the data onto them. The first principal component (PC1) captures the most variation, PC2 the next most at right angles, and so on. Keeping only the top few compresses many features into a few while losing as little information as possible.",
    steps: ["Centre the data (subtract each feature's mean); usually standardise as well.", "Compute the covariance matrix (how features vary together).", "Find its eigenvectors (the directions) and eigenvalues (how much variation each direction holds). In practice this is done with SVD.", "Sort by eigenvalue and keep the top k directions.", "Project the data onto those directions to get the new, smaller set of features."],
    formula: [["Explained variance ratio = λᵢ / Σλ", "The share of the total spread captured by component i."]],
    knobs: [["n_components", "How many components to keep.", "Enough to explain about 90–95% of the variance, or use the elbow of the scree plot."], ["Standardisation", "Scale features before PCA.", "Almost always, unless the features share units."], ["whiten", "Rescale components to equal variance.", "Sometimes helps downstream models."]],
    good: ["Fast, deterministic and well understood.", "Removes redundancy from correlated features; reduces noise.", "Good for compression, speed-ups and quick visualisation."],
    bad: ["Only finds straight-line (linear) structure.", "Components are mixes of the original features, so harder to interpret.", "Sensitive to scaling and outliers; high variance isn't always what matters for prediction."],
    qa: [
      ["What is a principal component?", "A new axis: a weighted combination of the original features, chosen so the data spreads out as much as possible along it, and at right angles to the earlier components."],
      ["Why standardise before PCA?", "PCA chases variance. A feature in large units has huge variance and would dominate PC1 just because of its units."],
      ["How do you choose the number of components?", "Keep enough to reach a target explained variance (say 95%), look for the elbow in the scree plot, or pick the number that works best for the downstream model."],
      ["Is PCA feature selection?", "No. It's feature extraction: it creates new features from all the old ones rather than choosing a subset."],
      ["PCA vs t-SNE/UMAP?", "PCA is linear, fast and keeps global structure, and you can apply it to new data. t-SNE and UMAP are non-linear and keep local neighbourhoods, which makes them better for visualising clusters but not for compression or measuring distances."],
      ["How does PCA relate to SVD and autoencoders?", "PCA is usually computed via the singular value decomposition of the centred data. A linear autoencoder with squared error learns the same subspace as PCA."],
    ],
  });

  A.guide("tsne", {
    s30: "t-SNE and UMAP draw high-dimensional data as a 2D or 3D map for exploration. They keep each point's close neighbours close on the map, so hidden groups show up as islands. They're for looking, not measuring: the sizes of islands and the distances between them don't mean much.",
    steps: ["In the original space, measure how similar each point is to its neighbours (as probabilities, for t-SNE).", "Start with a random 2D layout.", "Repeatedly move points so that neighbours in the original space become neighbours on the map, and non-neighbours are pushed apart.", "Stop when the layout settles; colour points by labels afterwards to interpret."],
    knobs: [["Perplexity (t-SNE)", "Roughly how many neighbours each point pays attention to.", "Typically 5–50; try several."], ["n_neighbors / min_dist (UMAP)", "Local vs global focus; how tightly points pack.", "More neighbours = more global structure."], ["Random seed", "The starting layout.", "Run a few seeds: different-looking maps are normal."]],
    good: ["Reveals clusters and structure that PCA can miss.", "Great for exploring embeddings and checking whether classes separate.", "UMAP is fast and keeps more global structure than t-SNE."],
    bad: ["Distances between clusters and cluster sizes are not meaningful.", "Results change with settings and random seeds.", "t-SNE can't map new points onto an existing layout (UMAP partly can); not for feature engineering."],
    qa: [
      ["Can you trust distances on a t-SNE plot?", "Only locally: points close together are similar. The gap between two islands, or how big an island looks, carries little meaning."],
      ["What does perplexity do?", "It sets the effective number of neighbours each point considers. Low values emphasise very local structure; high values look more broadly."],
      ["t-SNE vs UMAP?", "Both keep local neighbourhoods. UMAP is usually faster, scales better, preserves more global structure and can transform new data; t-SNE is older and very good at separating local clusters."],
      ["Should you cluster on the t-SNE output?", "Generally no. The map distorts density and distance; cluster in the original space (or a PCA-reduced one) and use t-SNE only to visualise."],
    ],
  });

  A.guide("apriori", {
    s30: "Apriori finds items that are often bought together and turns them into rules such as \"bread → butter\". It counts how often item sets appear (support) and how often the rule holds (confidence). Its trick: if a small set is rare, any bigger set containing it must be rare too, so it never checks those.",
    steps: ["Count single items; keep those above the minimum support.", "Combine surviving items into pairs; count them; keep the frequent ones.", "Grow to triples and beyond, only from frequent smaller sets (the Apriori property).", "From each frequent set, generate rules and keep those above the minimum confidence (and lift)."],
    formula: [["Support(A) = baskets with A ÷ all baskets", "How common an item set is."], ["Confidence(A → B) = support(A and B) ÷ support(A)", "Of the baskets with A, the share that also have B."], ["Lift(A → B) = confidence(A → B) ÷ support(B)", "How much more often B appears with A than by chance. Above 1 = a real association."]],
    knobs: [["Minimum support", "How common a set must be.", "Too low = explosion of rules; too high = only obvious ones."], ["Minimum confidence", "How reliable a rule must be.", "Combine with lift to avoid misleading rules."]],
    good: ["Easy to understand rules that the business can act on.", "No labels needed.", "The pruning idea is simple and effective."],
    bad: ["Many passes over the data; slow on big datasets (FP-Growth is faster).", "Can produce huge numbers of rules, many trivial.", "High confidence can be misleading for very common items; check lift."],
    qa: [
      ["Explain support, confidence and lift.", "Support: how often the items appear together. Confidence: how often B appears when A does. Lift: confidence compared with B's normal rate; lift > 1 means A genuinely raises the chance of B."],
      ["What is the Apriori property?", "Every subset of a frequent item set must also be frequent. Equivalently, if a set is infrequent, all its supersets are too, which lets the algorithm prune the search."],
      ["Why is confidence alone misleading?", "If almost everyone buys milk, \"anything → milk\" has high confidence without any real link. Lift corrects for how common the consequent is."],
      ["Apriori vs FP-Growth?", "FP-Growth compresses the data into a tree and finds frequent sets without generating candidates, so it's much faster on large data, with the same results."],
    ],
  });

  A.guide("iforest", {
    s30: "Isolation forest finds anomalies by trying to isolate each point with random cuts. Unusual points sit far from the crowd, so a few random cuts are enough to cut them off; normal points are surrounded by others and need many cuts. Averaged over many random trees, a short path means a high anomaly score.",
    steps: ["Take a random sample of the data.", "Build a random tree: pick a random feature and a random cut between its min and max; repeat until each point is alone.", "Record how many cuts (the path length) each point needed.", "Repeat for many trees; average the path lengths.", "Turn the average into an anomaly score: shorter path = more anomalous."],
    knobs: [["n_estimators", "Number of random trees.", "100 is usually enough."], ["max_samples", "Rows per tree.", "Small samples (e.g. 256) work well and are fast."], ["contamination", "Expected share of anomalies.", "Sets the score threshold; estimate it from domain knowledge."]],
    good: ["Fast, scales well, works in many dimensions.", "Needs no labels and no distance or density calculations.", "Good default for tabular anomaly detection."],
    bad: ["Axis-aligned cuts can miss anomalies that only show up in combinations of features.", "The contamination threshold needs a sensible guess.", "Scores aren't probabilities."],
    qa: [
      ["Why are anomalies isolated faster?", "They are few and different, so a random cut is likely to separate them from the rest early. Normal points sit in dense regions and need many cuts."],
      ["How is it different from other anomaly detectors?", "Most methods model what's normal (density, distance, reconstruction). Isolation forest directly measures how easy a point is to isolate, which is cheaper and scales better."],
      ["Why use small subsamples?", "Small samples reduce swamping (normal points near anomalies) and masking (clusters of anomalies hiding each other), and make it fast."],
      ["How would you validate an unsupervised anomaly detector?", "Check the top-scored cases with domain experts, use any known labelled incidents to compute precision at the top k, and monitor for drift over time."],
    ],
  });

  A.guide("ae", {
    s30: "An autoencoder is a neural network trained to copy its input to its output through a narrow bottleneck. To succeed it must learn a compact summary (the code) of the data. Uses: compression, denoising, learning features, and anomaly detection, because inputs unlike the training data rebuild badly.",
    steps: ["The encoder squeezes the input into a small code (the bottleneck).", "The decoder rebuilds the input from the code.", "Train both together to minimise reconstruction error (input vs rebuilt output).", "For anomaly detection: train on normal data only, then flag inputs with high reconstruction error."],
    knobs: [["Bottleneck size", "How many numbers the code has.", "Too big = it just copies; too small = it loses important detail."], ["Architecture", "Dense, convolutional (images), recurrent or transformer (sequences).", "Match it to the data type."], ["Variants", "Denoising, sparse, variational (VAE).", "A VAE can also generate new examples."], ["Anomaly threshold", "The error above which input counts as unusual.", "Set from the error distribution on normal validation data."]],
    good: ["Learns non-linear compression (more powerful than PCA).", "Needs no labels.", "Flexible: images, signals, logs, tabular data."],
    bad: ["Can learn to copy without learning anything useful if the bottleneck is too wide.", "Needs more data and tuning than PCA.", "Anomaly thresholds can be tricky; sometimes it rebuilds anomalies well too."],
    qa: [
      ["How does an autoencoder detect anomalies?", "It's trained only on normal examples, so it learns to rebuild those well. An unusual input doesn't fit the learned patterns, gives a large reconstruction error, and gets flagged."],
      ["Autoencoder vs PCA?", "A linear autoencoder with squared error learns the same subspace as PCA. Non-linear layers let an autoencoder capture curved structure that PCA can't."],
      ["What is a denoising autoencoder?", "One trained to rebuild clean inputs from deliberately corrupted ones, which forces it to learn robust features rather than copy."],
      ["What makes a variational autoencoder (VAE) different?", "It encodes each input as a probability distribution rather than a single point, with a penalty that keeps the code space smooth. You can then sample from that space to generate new data."],
    ],
  });

  A.guide("emb", {
    s30: "An embedding represents a word, sentence, image or product as a list of numbers (a vector), learned so that similar things end up close together. Directions can carry meaning, as in king − man + woman ≈ queen. Embeddings power semantic search, recommendations, clustering and retrieval-augmented generation (RAG).",
    steps: ["Train a model on a task where similar items should behave alike (predict neighbouring words, match a caption to an image, match a query to a document).", "Use one of its internal layers as the vector for each item.", "Compare vectors with cosine similarity: close vectors = similar meaning.", "Store vectors in a vector index to find the nearest ones quickly."],
    formula: [["cosine similarity = (a · b) / (‖a‖ ‖b‖)", "The angle between two vectors: 1 = same direction (very similar), 0 = unrelated."]],
    knobs: [["Embedding model", "word2vec/GloVe (words), sentence transformers or API models (sentences and documents), CLIP (images + text).", "Use a modern sentence-embedding model for search and RAG."], ["Dimensions", "Length of each vector, from a few hundred to a few thousand.", "Larger can be more accurate but costs storage and speed."], ["Chunking (for RAG)", "How documents are split before embedding.", "Paragraph-sized chunks with some overlap is a common start."]],
    good: ["Turns meaning into numbers that any model can use.", "Enables search by meaning, not just keywords.", "Reusable across many tasks."],
    bad: ["Absorbs biases present in the training data.", "Not human-readable; individual dimensions rarely mean anything.", "Quality depends on the domain: general embeddings may miss specialised jargon."],
    qa: [
      ["Why cosine similarity rather than Euclidean distance?", "Cosine compares direction and ignores length, which often reflects things like document length rather than meaning. With normalised vectors the two rank results the same way."],
      ["How do word2vec-style embeddings learn?", "By predicting a word from its neighbours (CBOW) or the neighbours from a word (skip-gram). Words used in similar contexts end up with similar vectors."],
      ["Static vs contextual embeddings?", "Static (word2vec, GloVe) give one vector per word, so \"bank\" is the same in \"river bank\" and \"bank account\". Contextual embeddings from transformers change with the sentence."],
      ["How are embeddings used in RAG?", "Documents are chunked and embedded into a vector database. A question is embedded too, the nearest chunks are retrieved, and they're given to the language model as context for its answer."],
      ["How do you search millions of vectors quickly?", "Approximate nearest-neighbour indexes such as HNSW, IVF or product quantisation (FAISS, vector databases) trade a tiny bit of accuracy for huge speed-ups."],
    ],
  });

  A.guide("qlearn", {
    s30: "Q-learning teaches an agent by trial and error. It keeps a table of Q-values: for each situation and action, how much total future reward to expect. After each move it nudges that value towards the reward received plus the best value of where it landed. Balancing exploring new moves with using the best-known ones, it gradually learns the best action everywhere.",
    steps: ["Start with a table of Q-values (all zeros).", "In the current state, choose an action: usually the best-known one, but a random one with probability ε (exploration).", "Take the action; observe the reward and the new state.", "Update: Q(state, action) ← Q + α × (reward + γ × best Q in the new state − Q).", "Repeat over many episodes, gradually lowering ε."],
    formula: [["Q(s,a) ← Q(s,a) + α [r + γ · maxₐ′ Q(s′,a′) − Q(s,a)]", "Move the old estimate part of the way (α) towards a better one: the reward now plus the discounted value of the best next move."]],
    knobs: [["α (learning rate)", "How far each update moves the estimate.", "0.1 is a common start."], ["γ (discount)", "How much future rewards count compared with immediate ones.", "0.9–0.99 for long-term planning."], ["ε (exploration)", "Share of random moves.", "Start high, decay over time."]],
    good: ["Simple and proven to converge to the best policy (with enough exploration, in small problems).", "Learns from experience without a model of the environment.", "Off-policy: can learn the best strategy while behaving exploratorily."],
    bad: ["A table can't handle huge or continuous state spaces (hence DQN).", "Needs many episodes; slow to learn.", "Sensitive to reward design and exploration settings."],
    qa: [
      ["What is a Q-value?", "The expected total (discounted) future reward of taking action a in state s and then acting optimally."],
      ["What is the exploration–exploitation trade-off?", "Exploit: pick the best-known action to collect reward. Explore: try other actions in case they're better. Too little exploration gets stuck on a mediocre strategy; too much wastes time. ε-greedy with decaying ε is the classic balance."],
      ["What does the discount factor γ do?", "It sets how far-sighted the agent is. γ near 0 cares only about immediate reward; near 1 values long-term reward."],
      ["On-policy vs off-policy (Q-learning vs SARSA)?", "Q-learning updates towards the best next action (off-policy), whatever it actually does next. SARSA updates towards the action it really takes (on-policy), so it learns safer behaviour when exploration is risky."],
      ["Model-free vs model-based RL?", "Model-free methods (Q-learning) learn values or policies directly from experience. Model-based methods learn or are given a model of how the environment behaves and plan with it."],
    ],
  });

  A.guide("dqn", {
    s30: "A Deep Q-Network replaces Q-learning's table with a neural network that takes the state (e.g. game pixels) and outputs a Q-value for each action. Two tricks make it stable: experience replay (learn from random samples of past moves) and a target network (a slowly updated copy used for the learning target). DeepMind used it to master Atari games from pixels.",
    steps: ["The network takes a state and outputs a Q-value per action.", "Act ε-greedily and store every (state, action, reward, next state) in a replay buffer.", "Sample a random batch from the buffer.", "Target = reward + γ × max Q from the target network; train the main network towards it.", "Every so often, copy the main network's weights into the target network."],
    knobs: [["Replay buffer size", "How many past moves are kept.", "Large (e.g. 100k–1M) for diversity."], ["Target update frequency", "How often the target network is refreshed.", "Every few thousand steps, or a soft update."], ["ε schedule", "How exploration decays.", "Decay from 1.0 to about 0.05."]],
    good: ["Handles huge state spaces such as images.", "Learns directly from raw input.", "Foundation for many later improvements (Double DQN, Dueling, Rainbow)."],
    bad: ["Unstable and sensitive to settings.", "Needs lots of interaction data.", "Only for discrete actions; overestimates Q-values without fixes."],
    qa: [
      ["Why use experience replay?", "Consecutive moves are highly correlated, which destabilises training. Sampling random past experiences breaks the correlation and reuses data efficiently."],
      ["Why a target network?", "If the same network produces both the prediction and the target, the target moves every update, like chasing your own tail. A slowly updated copy keeps the target steady."],
      ["What is the overestimation problem and Double DQN?", "Taking the max of noisy estimates is biased upwards. Double DQN uses the main network to choose the best action and the target network to evaluate it, reducing the bias."],
      ["Why can't DQN handle continuous actions?", "It needs the max over all actions, which isn't feasible for continuous ones (like a steering angle). Use policy-gradient or actor-critic methods (DDPG, SAC, PPO) instead."],
    ],
  });

  A.guide("pg", {
    s30: "Policy-gradient methods learn the policy directly: a probability for each action. After acting, they increase the probability of actions that turned out better than expected and decrease the others. Actor-critic adds a critic that estimates what's expected (the baseline), which steadies learning. PPO limits how much the policy can change per update, and is the workhorse of modern RL, including RLHF.",
    steps: ["The actor (policy network) outputs action probabilities; sample an action.", "Collect rewards over an episode or a batch of steps.", "Compute the advantage: how much better the result was than the critic expected.", "Raise the log-probability of actions with positive advantage, lower it for negative ones.", "PPO: clip the probability ratio between new and old policy (e.g. to 0.8–1.2) so each update stays small.", "Update the critic to predict returns better."],
    formula: [["∇J = E[∇ log π(a|s) · A(s,a)]", "Push up the probability of each action in proportion to its advantage."], ["PPO: min(r·A, clip(r, 1−ε, 1+ε)·A), r = π_new / π_old", "Take the benefit of a change only up to a limit, so the policy can't jump too far in one update."]],
    knobs: [["Learning rate", "Step size of policy updates.", "Small; policy methods are sensitive."], ["Clip ε (PPO)", "Maximum ratio change per update.", "0.1–0.3, commonly 0.2."], ["γ and GAE λ", "Discounting and the bias/variance balance of the advantage estimate.", "γ ≈ 0.99, λ ≈ 0.95."], ["Entropy bonus", "Rewards keeping some randomness.", "Small values keep exploration alive."]],
    good: ["Works with continuous and very large action spaces.", "Learns stochastic policies naturally.", "PPO is stable and relatively easy to tune."],
    bad: ["High-variance gradients without a good baseline; needs many samples.", "On-policy methods can't reuse old data well.", "Can converge to a local optimum."],
    qa: [
      ["Value-based vs policy-based methods?", "Value-based (Q-learning, DQN) learn how good actions are and pick the best. Policy-based learn the action probabilities directly, which handles continuous actions and stochastic strategies."],
      ["What is the advantage, and why subtract a baseline?", "Advantage = actual return − expected return. Subtracting the baseline doesn't change the expected gradient but greatly reduces its variance, so learning is faster and steadier."],
      ["What problem does PPO solve?", "Plain policy gradients can take a step so big that the policy collapses. PPO clips the update so the new policy stays close to the old one, giving reliable improvement without complex constraints (as in TRPO)."],
      ["What is actor-critic?", "Two parts: the actor chooses actions (the policy) and the critic estimates value to judge them. The critic's estimate supplies the baseline/advantage for the actor's updates."],
      ["Why is PPO used in RLHF?", "It's stable for huge networks, works with a learned reward, and the clipping (plus a KL penalty) keeps the language model from drifting too far from its original behaviour."],
    ],
  });

  A.guide("mcts", {
    s30: "Monte Carlo Tree Search picks a move by simulating many possible futures. It grows a search tree from the current position, repeatedly choosing promising moves (while still exploring others), playing out a game to the end, and recording who won. After many simulations, the most-visited move is chosen. AlphaGo combined it with neural networks.",
    steps: ["Selection: from the root, follow moves using UCB (win rate + exploration bonus) down to a node not yet fully expanded.", "Expansion: add a new child move.", "Simulation (rollout): play randomly (or with a policy network) to the end of the game.", "Backpropagation: update win counts and visit counts along the path.", "Repeat many times; play the move with the most visits."],
    formula: [["UCB1 = wins/visits + c · √(ln(parent visits) / visits)", "Exploit moves that win often, but give a bonus to moves that haven't been tried much."]],
    knobs: [["Number of simulations", "Thinking time per move.", "More = stronger play, slower."], ["Exploration constant c", "Balance between exploiting and exploring.", "√2 is the classic value; tune per game."], ["Rollout policy", "How simulated games are played.", "Random works; a learned policy (AlphaGo) is much stronger."]],
    good: ["Needs no hand-written evaluation function, only the rules.", "Anytime: stop whenever you like and use the best answer so far.", "Focuses effort on promising moves; works in huge game trees."],
    bad: ["Needs a simulator (a model of the environment).", "Expensive at decision time.", "Random rollouts can be misleading in tactical positions."],
    qa: [
      ["What are the four steps of MCTS?", "Selection, expansion, simulation (rollout) and backpropagation."],
      ["What role does UCB play?", "It decides which branch to explore, balancing moves with a high win rate against moves that have been tried too few times to judge."],
      ["How did AlphaGo/AlphaZero improve MCTS?", "A policy network suggests promising moves (narrowing the search) and a value network estimates who's winning (replacing slow random rollouts). Self-play trains those networks, and MCTS improves on them in turn."],
      ["MCTS vs minimax?", "Minimax searches every move to a fixed depth using an evaluation function. MCTS samples selectively and needs no evaluation function, which suits games like Go with enormous branching factors."],
    ],
  });

  A.guide("rlhf", {
    s30: "Reinforcement learning from human feedback aligns a language model with what people prefer. Humans compare pairs of answers; a reward model learns to predict which answer people would choose; then the language model is tuned with PPO to produce high-reward answers, with a penalty to stay close to the original model. DPO reaches a similar result directly from the preference pairs, without a separate reward model or RL loop.",
    steps: ["Start from a pre-trained model, then supervised fine-tuning on good example answers.", "Collect comparisons: people pick the better of two model answers.", "Train a reward model to score answers so preferred ones score higher.", "Optimise the language model with PPO to maximise reward, minus a KL penalty for drifting from the fine-tuned model.", "Alternative (DPO): skip the reward model and adjust the model directly to make preferred answers more likely than rejected ones."],
    formula: [["Reward model: P(A preferred over B) = σ(r(A) − r(B))", "The bigger the score gap, the more confident the prediction that people prefer A (the Bradley–Terry model)."], ["Objective = reward − β · KL(new model ‖ reference model)", "Get high reward, but don't wander too far from the original model's style and knowledge."]],
    knobs: [["β (KL coefficient)", "How strongly to stay close to the reference model.", "Too low = reward hacking; too high = little change."], ["Preference data", "Who labels, what guidelines, how many comparisons.", "Quality and diversity matter more than sheer volume."], ["Method", "PPO-based RLHF, DPO, or AI feedback (RLAIF / Constitutional AI).", "DPO is simpler; PPO is more flexible."]],
    good: ["Teaches qualities that are hard to write as rules: helpfulness, tone, safety.", "Comparisons are easier and more consistent for people than writing perfect answers.", "Made chat assistants dramatically more useful."],
    bad: ["Expensive human labelling.", "Reward hacking: the model can exploit flaws in the reward model.", "Can make models over-cautious or sycophantic; inherits labellers' biases."],
    qa: [
      ["Why use comparisons instead of ratings or written answers?", "People are much more consistent at choosing the better of two answers than at giving absolute scores, and it's faster than writing ideal answers."],
      ["What is the reward model?", "A model (often a copy of the language model with a scoring head) trained on preference pairs to give higher scores to the answers people preferred."],
      ["Why the KL penalty?", "Without it, the model drifts towards whatever fools the reward model (reward hacking), losing fluency and knowledge. The penalty keeps it close to the reference model."],
      ["How does DPO differ from PPO-based RLHF?", "DPO shows that the RLHF objective can be optimised with a simple classification-style loss on preferred vs rejected pairs, so there's no separate reward model and no RL sampling loop. It's simpler and more stable, and often comparable in quality."],
      ["What is reward hacking? Give an example.", "When the policy finds ways to score high that don't match what people actually want, for example longer answers or flattering language that the reward model happens to like."],
      ["What is RLAIF / Constitutional AI?", "Using an AI model, guided by a written set of principles, to produce the preference labels instead of (or alongside) humans, which scales feedback more cheaply."],
    ],
  });
})();
