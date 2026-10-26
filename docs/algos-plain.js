// Algorithms map: plain-English meanings for the statistics and maths words used in the demos.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A) return;

  // m = words that count as this term (matched as whole words, any case), p = plain meaning, e = everyday example
  const WORDS = [
    { t: "Average (mean)", m: ["mean", "average", "averages", "averaging", "flat average"], p: "Add up all the numbers and divide by how many there are. It is the \"typical\" value.", e: "Test scores 6, 8 and 10 have an average of 8." },
    { t: "Squared error", m: ["squared error", "squared errors", "squared distance", "mean squared error", "MSE"], p: "How far off a prediction is, multiplied by itself. Squaring makes every miss positive and makes big misses count much more than small ones. Mean squared error is the average of these over all points.", e: "Missing by 2 costs 4; missing by 10 costs 100. That's why one far-away point drags the line." },
    { t: "Error", m: ["error", "errors"], p: "The gap between what the model predicted and the real answer. Training tries to make the errors small.", e: "The app predicted 30 minutes, the trip took 35: the error is 5 minutes." },
    { t: "Outlier", m: ["outlier", "outliers"], p: "A data point that sits far away from all the others. It might be a mistake or a rare case.", e: "In a list of house prices around $300k, one $20 million mansion." },
    { t: "Noise", m: ["noise", "chasing noise", "memorise noise"], p: "Random wobble in data that doesn't follow any real pattern. A good model ignores it; a bad one learns it by heart.", e: "Your weight on the scale goes up and down a little each morning even though nothing really changed." },
    { t: "Probability", m: ["probability", "probabilities", "probability-based"], p: "How likely something is, written as a number from 0 (impossible) to 1 (certain), or 0% to 100%.", e: "A weather forecast of 0.7 (70%) chance of rain." },
    { t: "Parameter", m: ["parameter", "parameters"], p: "A number inside the model that training adjusts. Learning = finding good values for these numbers.", e: "In \"price = 50 + 2 × size\", 50 and 2 are the parameters." },
    { t: "Slope and intercept", m: ["slope", "intercept"], p: "Slope: how much the line goes up for each step to the right. Intercept: where the line starts when x is 0.", e: "A taxi charges $3 to start (intercept) plus $2 per km (slope)." },
    { t: "Regression", m: ["regression", "linear regression"], p: "Predicting a number on a sliding scale, rather than a category.", e: "Predicting tomorrow's temperature, or a house price." },
    { t: "Classification", m: ["classification", "classify", "classes", "class"], p: "Predicting which group (class) something belongs to.", e: "Spam or not spam; cat, dog or bird." },
    { t: "Weights", m: ["weight", "weights", "weighted sum"], p: "Numbers saying how much each input matters. A weighted sum multiplies each input by its weight and adds them up.", e: "A final grade = 0.3 × homework + 0.7 × exam: 0.3 and 0.7 are weights." },
    { t: "Sigmoid", m: ["sigmoid"], p: "An S-shaped curve that squeezes any number into the range 0 to 1, so it can be read as a probability.", e: "A very big score becomes almost 1, a very negative score almost 0, a score of 0 becomes 0.5." },
    { t: "Gradient descent", m: ["gradient descent"], p: "The standard way to train: work out which small change to the weights makes the error go down, take that step, and repeat.", e: "Walking down a foggy hill by always stepping in the direction that feels most downhill." },
    { t: "Learning rate", m: ["learning rate"], p: "How big each training step is. Too small and learning is slow; too big and the model overshoots and jumps around.", e: "Adjusting the shower temperature: tiny turns take forever, huge turns go from freezing to scalding." },
    { t: "Feature", m: ["feature", "features"], p: "One measurable property of an example that the model uses as input. A column in a spreadsheet.", e: "For a house: size, number of bedrooms, distance to town." },
    { t: "Majority vote", m: ["majority", "majority vote", "votes", "vote"], p: "Pick the answer that most voters (points, trees, neighbours) chose.", e: "3 friends say pizza, 2 say sushi: pizza wins." },
    { t: "Overfitting", m: ["overfitting", "overfit"], p: "When a model memorises the training examples, including their noise, instead of learning the general pattern. It looks great on old data and fails on new data.", e: "A student who memorises last year's exam answers but can't solve a new question." },
    { t: "Random sample (bootstrap)", m: ["random sample", "bootstrap", "bootstrap sample"], p: "A random selection of rows from the data. A bootstrap sample picks rows at random with replacement, so some rows appear twice and some not at all.", e: "Drawing names from a hat and putting each name back before the next draw." },
    { t: "Residual", m: ["residual", "residuals", "remaining error", "remaining errors"], p: "What's left over: the real answer minus the current prediction. Boosting trains each new tree to predict these leftovers.", e: "You guessed 90, the answer was 100: the residual is 10 still to fix." },
    { t: "Independent", m: ["independent"], p: "Two things are independent when knowing one tells you nothing about the other. Naive Bayes pretends every word is independent, which is not really true but works well.", e: "Two coin flips are independent; \"cloudy\" and \"rain\" are not." },
    { t: "Evidence", m: ["evidence"], p: "Each clue that makes an answer more or less likely. The model adds the clues up.", e: "\"Free\" and \"prize\" are clues towards spam; \"meeting\" is a clue towards normal." },
    { t: "Bayes' theorem", m: ["bayes' theorem", "bayes"], p: "A rule for updating how likely something is when you see new evidence: start with how common it is, then adjust for each clue.", e: "Most emails aren't spam, but if one says \"free prize\", the chance it's spam goes up." },
    { t: "Accuracy", m: ["accuracy", "training accuracy"], p: "The share of answers the model got right. \"Training\" accuracy is measured on the examples it learned from, so it can look better than reality.", e: "90 right out of 100 = 90% accuracy." },
    { t: "Confidence (model)", m: ["confident"], p: "How sure the model is about an answer, usually shown as a probability.", e: "\"80% sure this is a cat\" is more confident than \"55% sure\"." },
    { t: "Distance", m: ["distance", "distances", "closest", "nearest", "within-group distance"], p: "How far apart two points are on the chart, measured with a ruler. Close points are similar; far points are different.", e: "Two people with similar age and income sit close together on the chart." },
    { t: "Margin", m: ["margin", "margin width"], p: "The width of the empty gap between the two groups and the boundary. A wider gap means a safer, more confident boundary.", e: "The width of the no-man's-land between two fences." },
    { t: "Regularisation", m: ["regularisation", "softness"], p: "A penalty that stops the model becoming too complicated or too extreme, which helps prevent overfitting.", e: "A word limit on an essay forces you to keep only the important points." },
    { t: "Linear / non-linear", m: ["linear", "non-linear", "straight line"], p: "Linear means a straight line (or flat surface). Non-linear means it can bend and curve.", e: "\"Double the hours, double the pay\" is linear; tax brackets are not." },
    { t: "Loss", m: ["loss"], p: "One number that sums up how wrong the model is right now. Training tries to push it down. Lower is better.", e: "Like a golf score: you want it as low as possible." },
    { t: "Epoch", m: ["epoch", "epochs"], p: "One full pass through all the training examples.", e: "Reading the whole textbook once = one epoch. Most models read it many times." },
    { t: "Variance / spread", m: ["varies", "variance", "spread"], p: "How spread out the values are. Low spread: everything is bunched together. High spread: values are all over the place.", e: "Heights in a basketball team have a small spread; heights in a school have a large one." },
    { t: "Principal component", m: ["principal component", "principal components", "components", "pc1", "pc2"], p: "A new direction that summarises the data. PC1 is the direction along which points are most spread out; PC2 is the next best, at right angles to PC1.", e: "For people, \"overall size\" (height and weight together) is a good PC1." },
    { t: "Dimensions", m: ["dimensions", "dimension", "high-dimensional", "dimensionality", "2d"], p: "How many numbers describe each item. 2 dimensions fit on a flat chart; real data often has hundreds.", e: "A point on a map has 2 (east, north); a song might be described by 100 numbers." },
    { t: "Compression", m: ["compression", "compresses", "compress"], p: "Storing the same information with fewer numbers, ideally losing as little as possible.", e: "A ZIP file or a JPEG photo." },
    { t: "Cluster", m: ["cluster", "clusters", "clustering"], p: "A group of points that sit close together, found without being told the groups in advance.", e: "Customers who naturally fall into \"bargain hunters\" and \"big spenders\"." },
    { t: "Density", m: ["densely", "density"], p: "How crowded an area is: many points in a small space = high density.", e: "A city centre is dense; the countryside is not." },
    { t: "Support vectors", m: ["support vector", "support vectors"], p: "The few points closest to the boundary, on the edge of the empty street. They alone decide where the boundary goes.", e: "Only the tent pegs at the edge hold the tent in place; the grass in the middle doesn't matter." },
    { t: "Support (patterns)", m: ["support", "minimum support"], p: "How often an item set appears: the share of all baskets that contain it.", e: "If 30 of 100 baskets contain bread and butter, their support is 30%." },
    { t: "Confidence (rules)", m: ["confidence", "minimum confidence"], p: "For a rule A → B: of the baskets that have A, the share that also have B.", e: "Of 40 baskets with bread, 30 also had butter: confidence is 75%." },
    { t: "Anomaly", m: ["anomaly", "anomalies", "anomaly score", "unusual"], p: "Something that doesn't fit the normal pattern. The anomaly score says how strange a point looks: higher = more unusual.", e: "A credit card suddenly used in two countries an hour apart." },
    { t: "Reconstruction error", m: ["reconstruction error"], p: "How different the rebuilt copy is from the original. Small = the model knows this kind of input; large = it's something new.", e: "Redrawing a picture from memory: easy for a familiar face, hard for a stranger's." },
    { t: "Expected value", m: ["expected", "expects", "baseline"], p: "The average result you'd get if you repeated something many times. A baseline is this \"normal\" result, used to judge whether an action did better or worse than usual.", e: "A game that pays $10 half the time and $0 otherwise has an expected value of $5." },
    { t: "Reward", m: ["reward", "rewards", "high-reward"], p: "The score the environment gives the agent after an action: positive for good, negative for bad.", e: "A dog gets a treat for sitting and nothing for jumping on the sofa." },
    { t: "Q-value", m: ["q-value", "q-values"], p: "The agent's estimate of the total future reward if it takes a given action now and plays well afterwards.", e: "\"If I turn left here, I expect to score about 7 points in total.\"" },
    { t: "Episode", m: ["episode", "episodes"], p: "One complete attempt, from start to finish.", e: "One full game of chess, or one run through a maze." },
    { t: "Policy", m: ["policy"], p: "The agent's strategy: for each situation, the probability of choosing each action.", e: "\"At a red light: stop 100% of the time.\"" },
    { t: "Exploration", m: ["exploration", "exploration bonus"], p: "Trying something new instead of the best-known option, to find out whether it is better.", e: "Ordering a new dish at your favourite restaurant once in a while." },
    { t: "ε (epsilon)", m: ["ε"], p: "A Greek letter used for a small setting you choose. In DBSCAN it is the radius of the circle drawn around each point. In Q-learning it is the share of moves made at random, to explore.", e: "ε = 0.1 in Q-learning means 1 move in 10 is a random try." },
    { t: "Simulation", m: ["simulation", "simulations", "simulated"], p: "A quick pretend run of what might happen, used to estimate the result without doing it for real.", e: "Playing out a few imaginary moves in your head before moving a chess piece." },
    { t: "Win rate", m: ["win rate"], p: "The share of games won.", e: "Won 6 out of 10 = 60% win rate." },
    { t: "UCB (Upper Confidence Bound)", m: ["ucb"], p: "A rule for choosing between options: take the win rate, add a bonus for options tried only a few times, and pick the highest. It balances \"go with what works\" and \"give others a chance\".", e: "Mostly going back to your favourite café, but sometimes trying the new one that has few reviews." },
    { t: "Similarity", m: ["similar", "similarities", "dissimilar"], p: "How alike two items are, often measured as how close their numbers are.", e: "\"Cat\" and \"kitten\" are very similar; \"cat\" and \"car\" are not (in meaning)." },
  ];

  const index = new Map();
  WORDS.forEach((w, i) => w.m.forEach((s) => index.set(s.toLowerCase(), i)));
  const keys = [...index.keys()].sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Whole words only; letters, digits and hyphens on either side stop a match
  const RE = new RegExp(`(?<![\\p{L}\\p{N}-])(${keys.join("|")})(?![\\p{L}\\p{N}-])`, "giu");

  // Already-escaped HTML text in, text with clickable stats words out
  function wrap(escaped) {
    return escaped.replace(RE, (m) => { const i = index.get(m.toLowerCase()); return `<button type="button" class="stword" data-st="${i}" title="${WORDS[i].p.replace(/"/g, "&quot;")}">${m}</button>`; });
  }
  function find(text) {
    const found = new Set(); String(text).replace(RE, (m) => { found.add(index.get(m.toLowerCase())); return m; });
    return [...found].sort((a, b) => a - b);
  }
  function box(ids, esc) {
    if (!ids.length) return "";
    return `<details class="plainbox" open><summary>Statistics words on this page, in plain English (${ids.length})</summary><dl>${ids.map((i) => `<div data-stdef="${i}"><dt>${esc(WORDS[i].t)}</dt><dd>${esc(WORDS[i].p)}<span class="eg">Example: ${esc(WORDS[i].e)}</span></dd></div>`).join("")}</dl></details>`;
  }
  A.plain = { words: WORDS, wrap, find, box };
})();
