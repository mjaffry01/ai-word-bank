// Algorithms map: the "Interview guide" tab for every algorithm (renderer + supervised-learning guides).
// Unsupervised and reinforcement-learning guides are in algos-guides2.js.
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A || !A.addView) return;
  const esc = A.h.esc;

  // g = { s30, steps[], knobs[[name, what it does, rule of thumb]], good[], bad[], qa[[question, answer]], formula? [[formula, plain meaning]] }
  function render(host, g, a) {
    const P = A.plain, txt = (s) => (P ? P.wrap(esc(s)) : esc(s));
    host.innerHTML = `<div class="guide">
      <div class="g30"><p class="lbl">Say it in 30 seconds</p><p>${txt(g.s30)}</p></div>
      <h4 class="csec">How it works, step by step</h4><ol class="gsteps">${g.steps.map((s) => `<li>${txt(s)}</li>`).join("")}</ol>
      ${g.formula ? `<h4 class="csec">The maths, in plain words</h4><div class="gform">${g.formula.map(([f, m]) => `<div><code>${esc(f)}</code><p>${txt(m)}</p></div>`).join("")}</div>` : ""}
      <h4 class="csec">Settings you'll be asked about</h4><div class="gtable" role="table">${g.knobs.map(([k, w, r]) => `<div role="row"><b role="cell">${esc(k)}</b><span role="cell">${txt(w)}</span><span role="cell" class="grule">${txt(r)}</span></div>`).join("")}</div>
      <div class="gpros"><div><h5>✓ Strengths</h5><ul>${g.good.map((s) => `<li>${txt(s)}</li>`).join("")}</ul></div><div><h5>✗ Weaknesses</h5><ul>${g.bad.map((s) => `<li>${txt(s)}</li>`).join("")}</ul></div></div>
      <h4 class="csec">Interview questions <span class="gcount">${g.qa.length}</span></h4>
      <p class="algonote">Try answering out loud first, then open the model answer. <button type="button" class="choice" data-gall="1">Open all answers</button> <button type="button" class="choice" data-gall="0">Close all</button></p>
      <div class="gqa">${g.qa.map(([q, ans], i) => `<details><summary><b>Q${i + 1}.</b> ${esc(q)}</summary><p>${txt(ans)}</p></details>`).join("")}</div></div>`;
    host.querySelectorAll("[data-gall]").forEach((b) => b.addEventListener("click", () => host.querySelectorAll(".gqa details").forEach((d) => { d.open = b.dataset.gall === "1"; })));
    void a;
  }
  A.guide = function (id, g) {
    const a = A.list.find((x) => x.id === id); if (!a) return;
    A.addView(id, { key: "guide", label: "Interview guide", order: 3, page: true, how: `Everything you need to explain ${a.name} clearly and answer interview questions about it: the 30-second version, the steps, the settings, the trade-offs and the questions interviewers actually ask.`, mount: (host) => render(host, g, a) });
  };

  A.guide("linreg", {
    s30: "Linear regression predicts a number by drawing the best straight line (or flat surface, with many inputs) through the data. \"Best\" means the total of the squared errors between the line and the points is as small as possible. Each weight tells you how much the prediction changes when that input goes up by one.",
    steps: ["Write the prediction as: intercept + weight₁ × input₁ + weight₂ × input₂ + …", "Measure how wrong it is with mean squared error (the average of the squared gaps).", "Find the weights that make that error smallest: either solve directly with a formula (ordinary least squares) or step towards it with gradient descent.", "Check the leftovers (residuals): they should look like random noise with no pattern.", "Use the line to predict new values."],
    formula: [["ŷ = b + w₁x₁ + w₂x₂ + …", "The prediction is a starting value plus each input times its weight."], ["MSE = average of (y − ŷ)²", "Square every miss, then average. Big misses count much more than small ones."], ["R² = 1 − (model's error ÷ error of just guessing the average)", "The share of the ups and downs in the data that the model explains. 1 = perfect, 0 = no better than the average."]],
    knobs: [["Regularisation (Ridge / L2)", "Penalises big weights, shrinking them all a bit.", "Use when inputs are correlated or there are many of them."], ["Lasso (L1)", "Penalises the size of weights in a way that pushes some to exactly zero.", "Use when you suspect only a few inputs matter: it selects features."], ["Elastic Net", "A mix of Ridge and Lasso.", "A safe default when you're unsure."], ["Polynomial features", "Adds x², x³ … so a \"linear\" model can fit curves.", "Watch for overfitting at high degrees."]],
    good: ["Fast, simple and easy to explain to anyone.", "Weights are directly readable: \"+1 bedroom adds $20k\".", "A strong baseline: always try it first."],
    bad: ["Assumes a straight-line relationship.", "Very sensitive to outliers, because errors are squared.", "Correlated inputs make the weights unstable and hard to interpret (multicollinearity)."],
    qa: [
      ["What are the assumptions of linear regression?", "Roughly: the relationship is linear; errors are independent of each other; errors have the same spread everywhere (homoscedasticity); errors are roughly normally distributed (mainly matters for confidence intervals); and inputs are not too strongly correlated with each other."],
      ["Why do we minimise squared errors rather than plain errors?", "Plain errors cancel out (+5 and −5 sum to 0). Squaring makes every error positive, punishes big misses more, and gives a smooth bowl-shaped error surface with a single best answer that can be solved exactly."],
      ["What is R², and can it be misleading?", "R² is the share of variation the model explains. It always goes up when you add more inputs, even useless ones, so use adjusted R² or a held-out test set to compare models."],
      ["Ridge vs Lasso?", "Both shrink weights to fight overfitting. Ridge (L2) shrinks all weights smoothly but rarely to zero. Lasso (L1) can set weights to exactly zero, so it also does feature selection."],
      ["What is multicollinearity and why is it a problem?", "When two inputs are strongly correlated (house size in m² and in ft²), the model can't tell which one deserves the credit, so weights swing wildly and their signs may flip. Predictions can still be fine; interpretation suffers. Fix by dropping one, combining them, or using Ridge."],
      ["Closed-form solution vs gradient descent?", "The normal equation solves it in one step but needs inverting a d×d matrix, which is slow for many features. Gradient descent scales to huge data and is how the same idea is trained inside neural networks."],
      ["How do you handle outliers?", "Investigate them first (errors or real?), then consider removing, capping, transforming (log), or using a robust loss such as Huber or absolute error."],
      ["Does linear regression need feature scaling?", "Not for the plain closed-form solution. It does for gradient descent (to converge well) and for Ridge/Lasso (so the penalty treats all features fairly)."],
      ["How do you know if a linear model is the right choice?", "Plot residuals against predictions: a random cloud is good; a curve means the relationship isn't linear; a funnel means the error spread changes."],
    ],
  });

  A.guide("logreg", {
    s30: "Logistic regression is a classifier, despite its name. It adds up the inputs with weights into a score, then squashes the score through an S-shaped sigmoid curve into a probability between 0 and 1. Above a threshold (usually 0.5) it predicts \"yes\". Its boundary between the classes is a straight line.",
    steps: ["Compute a score: intercept + weights × inputs (exactly like linear regression).", "Turn the score into a probability with the sigmoid: 1 / (1 + e^(−score)).", "Measure error with log loss (cross-entropy): confident wrong answers are punished heavily.", "Adjust the weights by gradient descent to lower the log loss.", "Pick a threshold to turn probabilities into yes/no; tune it for the cost of mistakes."],
    formula: [["p = 1 / (1 + e^(−(b + w·x)))", "The sigmoid turns any score into a probability between 0 and 1."], ["log-odds = log(p / (1 − p)) = b + w·x", "Each weight is how much the log-odds change per unit of input; e^weight is the odds ratio."], ["Log loss = −[y·log p + (1 − y)·log(1 − p)]", "Small when you give the right answer high probability, huge when you're confidently wrong."]],
    knobs: [["C or λ (regularisation strength)", "Controls the penalty on big weights (in scikit-learn, smaller C = stronger penalty).", "Tune with cross-validation."], ["Penalty (L1 / L2)", "L2 shrinks all weights; L1 can zero some out.", "L1 for feature selection."], ["Decision threshold", "The probability above which you say \"yes\".", "Lower it when missing a positive is costly (fraud, disease)."], ["class_weight", "Gives the rare class more importance.", "Use for imbalanced data."]],
    good: ["Outputs probabilities, not just labels.", "Fast, stable and easy to explain (odds ratios).", "Excellent baseline for text and tabular classification."],
    bad: ["Only a straight boundary unless you add features by hand.", "Struggles when classes are not linearly separable (like XOR).", "Sensitive to correlated inputs and outliers in the inputs."],
    qa: [
      ["Why is it called regression if it does classification?", "Because it fits a linear regression on the log-odds of the outcome. The regression output is then turned into a probability and a class."],
      ["Why not just use linear regression for classification?", "Linear regression can output values below 0 or above 1, which aren't probabilities, and squared error on 0/1 labels is a poor fit. The sigmoid plus log loss fixes both."],
      ["Why log loss instead of mean squared error?", "With the sigmoid, MSE gives a bumpy error surface with flat regions where learning stalls. Log loss is convex (one bowl, one best answer) and punishes confident mistakes."],
      ["How do you interpret a coefficient?", "A one-unit increase in that input multiplies the odds of \"yes\" by e^weight, holding the others fixed. A weight of 0.7 means the odds roughly double."],
      ["How do you handle more than two classes?", "Either one-vs-rest (one model per class) or multinomial (softmax) logistic regression, which gives a probability for each class that sums to 1."],
      ["How do you choose the threshold?", "Not always 0.5. Use the precision–recall trade-off: pick the threshold that gives acceptable recall (catch rate) at acceptable precision, based on the business cost of each error."],
      ["What metrics would you use?", "Accuracy only if classes are balanced. Otherwise precision, recall, F1, ROC-AUC, or PR-AUC for very rare positives; and log loss or a calibration curve if probabilities matter."],
      ["What if the data is perfectly separable?", "Weights grow without limit because the model keeps getting more confident. Regularisation stops this."],
    ],
  });

  A.guide("tree", {
    s30: "A decision tree learns a flowchart of yes/no questions. Starting with all the data, it picks the one question (feature + cut-off) that best separates the classes, splits the data in two, and repeats on each half until the groups are pure or a limit is hit. To predict, a new example follows the questions down to a leaf, which gives the majority class (or the average value, for regression).",
    steps: ["Start with all training rows at the root.", "For every feature and every possible cut-off, measure how much the split reduces impurity (Gini or entropy for classes, variance for numbers).", "Keep the best split (this is greedy: it's best right now, not necessarily best overall).", "Repeat on each child group (recursive binary splitting).", "Stop when a group is pure, too small, or the maximum depth is reached; that group becomes a leaf.", "Optionally prune: remove branches that don't improve results on validation data."],
    formula: [["Gini = 1 − Σ pₖ²", "Chance of mislabelling a random member if you labelled it randomly by the group's proportions. 0 = pure; 0.5 = a 50/50 mix of two classes."], ["Entropy = − Σ pₖ log₂ pₖ", "How surprised you'd be, on average, by a member's class. 0 = pure; 1 = 50/50 for two classes."], ["Information gain = impurity(parent) − weighted impurity(children)", "How much tidier the split makes things. The tree picks the split with the biggest gain."]],
    knobs: [["max_depth", "How many questions in a row the tree may ask.", "The main overfitting control: start around 3–8."], ["min_samples_split / min_samples_leaf", "The smallest group allowed to be split / allowed as a leaf.", "Raise to stop tiny, noisy leaves."], ["criterion", "Gini or entropy (log loss) for classification; squared error for regression.", "Gini is the default; results are usually nearly identical."], ["max_features", "How many features to consider at each split.", "Mostly used inside random forests."], ["ccp_alpha", "Cost-complexity pruning: the penalty per extra leaf.", "Tune with cross-validation to prune after growing."]],
    good: ["Easy to read and explain: you can print the rules.", "No feature scaling needed; handles mixed numeric and categorical data.", "Captures non-linear patterns and interactions automatically.", "Fast to predict: just a few comparisons."],
    bad: ["Overfits easily if grown deep (high variance).", "Unstable: a small change in data can produce a very different tree.", "Boundaries are axis-aligned boxes, so diagonal patterns need many steps.", "Cannot extrapolate beyond the training range (regression trees predict flat values)."],
    qa: [
      ["How does a decision tree choose a split?", "It tries every feature and every candidate cut-off, computes the weighted impurity (Gini or entropy) of the two resulting groups, and picks the split with the largest drop in impurity, i.e. the highest information gain."],
      ["Gini vs entropy: what's the difference?", "Both measure how mixed a group is and both are 0 when it's pure. Entropy uses logarithms (slightly slower) and penalises mixed groups a little more; Gini is the default in CART/scikit-learn. In practice they give very similar trees."],
      ["Why do decision trees overfit, and how do you stop it?", "A tree can keep splitting until every leaf holds one training example, memorising noise. Control it with pre-pruning (max_depth, min_samples_leaf, min_impurity_decrease) or post-pruning (cost-complexity pruning), or use an ensemble such as a random forest."],
      ["Pre-pruning vs post-pruning?", "Pre-pruning stops growth early using limits. Post-pruning grows a full tree, then cuts back branches that don't help on validation data. Post-pruning avoids stopping too early but costs more compute."],
      ["Is the tree-building algorithm optimal?", "No. It's greedy: it picks the best split at each step without looking ahead. Finding the truly optimal tree is NP-hard, so greedy search is the practical compromise."],
      ["Do trees need feature scaling or normalisation?", "No. A split only asks \"is x below t?\", which works the same whatever the units. Scaling changes nothing."],
      ["How does a regression tree work?", "Splits are chosen to reduce variance (squared error) instead of Gini, and each leaf predicts the average of the training values in it. The prediction is a step function."],
      ["How are categorical features and missing values handled?", "Depends on the library. CART-style trees need categories encoded (one-hot or ordinal); some libraries (LightGBM, CatBoost, R's rpart) split on categories directly. Missing values: impute them, use surrogate splits (rpart), or learn a default direction (XGBoost, newer scikit-learn)."],
      ["How do you get feature importance from a tree?", "Add up the impurity reduction each feature produces across all its splits, weighted by how many samples pass through. Beware: this favours features with many unique values; permutation importance is a fairer check."],
      ["Why are trees called unstable / high variance?", "Because the first split decides everything below it. Change a few rows and a different first split may win, giving a completely different tree. That's exactly why we average many trees in a random forest."],
      ["What does the decision boundary of a tree look like?", "Rectangles (boxes) with edges parallel to the axes, because each split uses one feature. A diagonal boundary needs a staircase of many splits."],
      ["What is the training and prediction cost?", "Training is roughly O(n · d · log n) for n rows and d features (sorting candidates per feature). Prediction is O(depth): just follow one path."],
      ["When would you choose a single tree over a random forest?", "When people must understand or audit every decision (credit, medicine, regulation), when you need a quick explainable baseline, or when the data is small and simple."],
    ],
  });

  A.guide("forest", {
    s30: "A random forest is a crowd of decision trees that vote. Each tree trains on its own random bootstrap sample of the rows, and at each split it may only consider a random subset of the features. The trees end up different, their mistakes partly cancel out, and the vote (or average, for regression) is far more accurate and stable than one tree.",
    steps: ["Choose how many trees to grow (for example 100–500).", "For each tree, draw a bootstrap sample: n rows picked at random with replacement (about 63% unique rows; the other ~37% are \"out-of-bag\").", "Grow the tree on that sample, usually deep, but at every split only look at a random subset of features (max_features).", "Repeat for all trees; they're independent, so they can be trained in parallel.", "Predict by majority vote for classification (scikit-learn averages the trees' probabilities) or by averaging for regression.", "Use the out-of-bag rows to estimate accuracy for free, without a separate validation set."],
    formula: [["P(a row is never picked) = (1 − 1/n)ⁿ ≈ 1/e ≈ 0.368", "Each bootstrap sample contains about 63.2% of the unique rows; the rest are out-of-bag."], ["Variance of the average = ρσ² + (1 − ρ)σ² / B", "Averaging B trees shrinks the error caused by randomness, but only the part not shared between trees. ρ is how similar (correlated) the trees are, so feature randomness, which lowers ρ, is what makes the forest work."]],
    knobs: [["n_estimators", "Number of trees.", "More is never worse for accuracy, just slower. 100–500 is typical; stop when the out-of-bag score plateaus."], ["max_features", "Features considered at each split.", "√(number of features) for classification, about 1/3 for regression. Lower = more different trees."], ["max_depth / min_samples_leaf", "How big each tree may grow.", "Forests usually use deep trees; raise min_samples_leaf for noisy data or to shrink the model."], ["bootstrap / max_samples", "Whether to sample rows, and how many.", "Keep bootstrap on; smaller samples speed up training on huge data."], ["class_weight", "Extra weight for rare classes.", "\"balanced\" or \"balanced_subsample\" for imbalanced data."], ["oob_score", "Compute out-of-bag accuracy.", "Turn on to get a free validation estimate."]],
    good: ["Strong accuracy out of the box with little tuning.", "Much less overfitting than a single tree; robust to noise and outliers.", "No scaling needed; handles many features and non-linear interactions.", "Trains in parallel, and gives out-of-bag error and feature importance for free."],
    bad: ["Harder to explain than one tree (you can't print 500 trees).", "Bigger and slower to predict than a single tree or a linear model.", "Can't extrapolate beyond the training range.", "Usually beaten by gradient boosting on tuned tabular benchmarks; weak on very sparse, high-dimensional data like raw text."],
    qa: [
      ["What is a random forest, and why is it better than one decision tree?", "An ensemble of decision trees, each trained on a bootstrap sample with random feature subsets, combined by voting or averaging. A single deep tree has low bias but high variance; averaging many decorrelated trees keeps the low bias and cuts the variance, so it generalises much better."],
      ["What is bagging?", "Bootstrap aggregating: train the same kind of model on many bootstrap samples (random rows with replacement) and combine their predictions. Random forest = bagging of trees + random feature selection at each split."],
      ["Why do we also pick random features at each split?", "If one feature is very strong, every bagged tree would split on it first and they'd all look alike. Similar trees make similar mistakes, so averaging wouldn't help much. Random feature subsets force variety (decorrelation), which is what makes the average powerful."],
      ["Why does a bootstrap sample contain about 63% of the rows?", "Each draw misses a given row with probability 1 − 1/n. After n draws, it's missed with probability (1 − 1/n)ⁿ, which tends to 1/e ≈ 36.8%. So about 63.2% of rows appear at least once."],
      ["What is out-of-bag (OOB) error?", "Each row is left out of about a third of the trees. Predict each row using only the trees that didn't see it, and compare with the truth. It's a nearly free, honest estimate of test error, similar to cross-validation."],
      ["Does adding more trees cause overfitting?", "No. More trees make the vote more stable and the error levels off; the only cost is compute and memory. Overfitting in a forest comes from the individual trees being too complex on very noisy data, not from the number of trees."],
      ["Random forest vs gradient boosting?", "Forest: trees trained independently, in parallel, usually deep; reduces variance; robust with little tuning. Boosting: trees trained one after another, each fixing the previous errors, usually shallow; reduces bias; often more accurate but more sensitive to hyperparameters and noise, and needs early stopping."],
      ["Which hyperparameters matter most, and how would you tune them?", "max_features (diversity), min_samples_leaf / max_depth (tree size), and n_estimators (just enough to plateau). Tune with randomised search plus cross-validation or the OOB score."],
      ["How does a random forest measure feature importance, and what are the pitfalls?", "Default: mean decrease in impurity across all trees. It's biased towards continuous or high-cardinality features and computed on training data. Prefer permutation importance on validation data, or SHAP values; and remember correlated features split the importance between them."],
      ["How would you handle an imbalanced dataset with a random forest?", "Use class_weight=\"balanced\" or \"balanced_subsample\", a balanced random forest (undersample each bootstrap), adjust the decision threshold on predicted probabilities, and judge with precision/recall or PR-AUC rather than accuracy."],
      ["Does a random forest reduce bias or variance?", "Mainly variance. Each deep tree already has low bias; averaging removes much of the variance. If the trees are too simple (high bias), a forest won't fix it, which is when boosting helps."],
      ["Can a random forest extrapolate?", "No. For regression, the prediction is an average of training values in the leaves, so it can never go beyond the highest or lowest value seen in training. For trends over time, use linear models or add trend features."],
      ["Are random forest probabilities well calibrated?", "Not always: they tend to be pulled away from 0 and 1. If you need reliable probabilities, calibrate with Platt scaling or isotonic regression on validation data."],
      ["What are Extra Trees, and how do they differ?", "Extremely Randomised Trees also pick random cut-off values instead of searching for the best one (and by default don't bootstrap). They're even more random, train faster and are sometimes as accurate."],
      ["How would you explain a random forest's prediction to a business stakeholder?", "Show global feature importance (permutation or SHAP), partial dependence plots for the key features, and per-prediction SHAP explanations: \"income pushed this towards approval, recent missed payments pushed it away\"."],
    ],
  });

  A.guide("boost", {
    s30: "Gradient boosting builds a team of small trees one after another. It starts with a simple guess (the average), then each new tree is trained to predict what the current team still gets wrong (the residuals), and its answer is added in, scaled down by a learning rate. Hundreds of small corrections add up to a very accurate model. XGBoost, LightGBM and CatBoost are popular versions.",
    steps: ["Start with a constant prediction, such as the average.", "Compute the residuals (more generally, the negative gradient of the loss): what's still wrong.", "Fit a small tree (depth 3–8) to those residuals.", "Add the tree's prediction × learning rate to the model.", "Repeat for many rounds, watching validation error; stop when it stops improving (early stopping)."],
    formula: [["F_m(x) = F_{m−1}(x) + η · tree_m(x)", "The new model = the old model + a small step (learning rate η) in the direction the new tree suggests."]],
    knobs: [["n_estimators (rounds)", "How many trees to add.", "Use early stopping on a validation set rather than guessing."], ["learning_rate (η)", "How much each tree counts.", "Smaller (0.01–0.1) with more trees usually generalises better."], ["max_depth / num_leaves", "Size of each tree.", "Shallow trees (3–8) are typical."], ["subsample / colsample", "Random share of rows / features per tree.", "0.6–0.9 adds randomness and reduces overfitting."], ["Regularisation (lambda, alpha, min_child_weight)", "Penalties on leaf values and splits.", "Raise for noisy data."]],
    good: ["Often the most accurate method for tabular data.", "Flexible: works with any differentiable loss (regression, classification, ranking).", "Modern libraries handle missing values and categories and are very fast."],
    bad: ["Sequential, so less parallel than a forest.", "More hyperparameters, and easier to overfit if you don't use early stopping.", "Sensitive to noisy labels and outliers.", "Less interpretable than a single tree."],
    qa: [
      ["How does boosting differ from bagging?", "Bagging trains models independently on random samples and averages them (reduces variance). Boosting trains models sequentially, each focusing on the previous errors (reduces bias)."],
      ["Why is it called gradient boosting?", "Each new tree is fitted to the negative gradient of the loss with respect to the current predictions. For squared error that gradient is simply the residual, so it's gradient descent where each step is a tree."],
      ["What does the learning rate do?", "It shrinks each tree's contribution. A small learning rate needs more trees but usually gives a smoother, better-generalising model."],
      ["How do you prevent overfitting in boosting?", "Early stopping on validation data, a lower learning rate, shallow trees, row and column subsampling, and regularisation terms (L1/L2 on leaf weights, min_child_weight)."],
      ["XGBoost vs LightGBM vs CatBoost?", "XGBoost: regularised objective, robust and widely used. LightGBM: histogram-based and grows leaf-wise, so very fast on large data. CatBoost: handles categorical features natively with ordered boosting, good defaults."],
      ["Why are boosting trees shallow but random forest trees deep?", "Boosting reduces bias by adding many weak learners, so each tree only needs to be slightly better than chance. Forests reduce variance by averaging, so each tree should be strong (deep, low bias)."],
      ["What is AdaBoost and how does it relate?", "An earlier boosting method that reweights the training examples, giving misclassified ones more weight for the next model. Gradient boosting generalises this idea to any loss using gradients."],
      ["Can you train boosting in parallel?", "Not across trees, as each depends on the previous one. But building a single tree is parallelised across features and data, which is how XGBoost and LightGBM are fast."],
    ],
  });

  A.guide("nb", {
    s30: "Naive Bayes classifies by asking: \"Given these clues, which class is most likely?\" It uses Bayes' theorem, starting from how common each class is and updating for each clue, and naively assumes the clues are independent of each other. Despite that unrealistic assumption it works surprisingly well, especially for text like spam filtering.",
    steps: ["From training data, count how common each class is (the prior).", "For each feature (e.g. each word), count how often it appears in each class (the likelihood).", "For a new example, multiply the prior by the likelihood of each feature it has, for each class. In practice we add logarithms to avoid tiny numbers.", "Pick the class with the highest result."],
    formula: [["P(class | features) ∝ P(class) × Π P(featureᵢ | class)", "How likely a class is after seeing the clues = how common the class is × how typical each clue is for that class."], ["Laplace smoothing: (count + 1) / (total + vocabulary size)", "Add one to every count so a word never seen in a class doesn't make its probability exactly zero."]],
    knobs: [["Variant", "Multinomial (word counts), Bernoulli (word present or not), Gaussian (continuous numbers).", "Multinomial for text; Gaussian for numeric features."], ["alpha (smoothing)", "How much to add to every count.", "1.0 is the classic default; tune lightly."]],
    good: ["Extremely fast to train and predict; just counting.", "Works well with little data and many features (text).", "Simple, robust baseline."],
    bad: ["The independence assumption is usually false, so its probabilities are poorly calibrated (often overconfident).", "Can't learn interactions between features.", "Correlated features get double-counted."],
    qa: [
      ["Why is it called \"naive\"?", "Because it assumes every feature is independent of the others given the class. For text that means \"free\" and \"prize\" are treated as unrelated clues, which is false, but the shortcut makes the maths simple."],
      ["Why does it work well despite the wrong assumption?", "Classification only needs the right class to score highest, not accurate probabilities. The errors from the independence assumption often affect all classes similarly, so the ranking stays right."],
      ["What is the zero-frequency problem?", "If a word never appeared in spam during training, its probability is 0, and multiplying by 0 wipes out all other evidence. Laplace (add-one) smoothing fixes this."],
      ["Why use log probabilities?", "Multiplying many small probabilities underflows to 0 on a computer. Adding logs is numerically safe and gives the same winner."],
      ["Naive Bayes vs logistic regression?", "Naive Bayes is generative (models how each class produces the features); logistic regression is discriminative (models the boundary directly). Naive Bayes wins with very little data; logistic regression usually wins with more."],
      ["Which variant would you use for what?", "Multinomial for word counts (documents), Bernoulli for yes/no word presence (short texts), Gaussian for continuous numeric features assumed to be bell-shaped."],
    ],
  });

  A.guide("knn", {
    s30: "K-nearest neighbours doesn't really train: it remembers all the examples. To classify a new point it finds the k most similar stored examples and takes a majority vote (or the average, for regression). Small k follows every wiggle; large k gives smoother, more general boundaries.",
    steps: ["Store the training data (and scale the features).", "For a new point, compute its distance to every stored point.", "Take the k closest.", "Vote (classification) or average (regression), optionally weighting closer neighbours more."],
    formula: [["Euclidean distance = √(Σ (aᵢ − bᵢ)²)", "Straight-line distance, like a ruler on the chart."]],
    knobs: [["k", "How many neighbours vote.", "Pick by cross-validation; odd numbers avoid ties in two-class problems."], ["Distance metric", "Euclidean, Manhattan, cosine…", "Cosine for text or embeddings."], ["weights", "Uniform, or closer neighbours count more.", "\"distance\" often helps."], ["Feature scaling", "Puts all features on the same scale.", "Essential: otherwise the largest-unit feature dominates."]],
    good: ["No training time; very simple to understand.", "Naturally handles complex boundaries and many classes.", "Easy to update: just add new examples."],
    bad: ["Slow and memory-hungry at prediction time (compares with every point).", "Breaks down with many features (the curse of dimensionality).", "Needs scaled features; sensitive to irrelevant features and noise."],
    qa: [
      ["Why is KNN called a lazy learner?", "It does no work at training time, just stores the data, and does all the work when predicting."],
      ["How do you choose k?", "Cross-validation. Small k = low bias, high variance (overfits noise); large k = high bias, low variance (over-smooths)."],
      ["Why must features be scaled?", "Distance adds up differences across features. Income in dollars would swamp age in years, so scale with standardisation or min-max first."],
      ["What is the curse of dimensionality?", "In many dimensions, all points end up roughly equally far apart, so \"nearest\" stops meaning \"similar\". Reduce dimensions (PCA, feature selection) or use another model."],
      ["How do you make KNN fast on big data?", "Use spatial indexes (KD-tree, ball tree) for low dimensions, or approximate nearest neighbour search (HNSW, FAISS) for high dimensions. That's how vector databases work."],
      ["KNN vs K-means?", "Different problems that both use k and distance. KNN is supervised (k = neighbours that vote on a label); K-means is unsupervised (k = number of groups to discover)."],
    ],
  });

  A.guide("svm", {
    s30: "A support vector machine finds the boundary that separates two classes with the widest possible gap (margin). Only the points on the edge of that gap, the support vectors, decide where it goes. With the kernel trick it can draw curved boundaries by quietly working in a higher-dimensional space.",
    steps: ["Look for a straight boundary that separates the classes.", "Among all such boundaries, choose the one with the widest margin to the nearest points.", "Allow some points inside the margin or on the wrong side (soft margin), paying a penalty controlled by C.", "For non-linear data, use a kernel (e.g. RBF) to measure similarity in a richer space.", "Predict by which side of the boundary a new point falls."],
    formula: [["Minimise ½‖w‖² + C · Σ hinge losses", "Keep the weights small (which means a wide margin) while paying for every point that breaks the margin."], ["Hinge loss = max(0, 1 − y · score)", "Zero for points safely on the right side; grows for points too close or on the wrong side."]],
    knobs: [["C", "Penalty for margin violations.", "Large C = strict, narrow margin (may overfit); small C = wider, softer margin."], ["kernel", "Linear, polynomial, RBF…", "Linear for text and many features; RBF as the default for curved boundaries."], ["gamma (RBF)", "How far each point's influence reaches.", "Large gamma = very wiggly boundary (overfits); tune with C."]],
    good: ["Effective in high dimensions, even with more features than rows.", "Memory-efficient prediction: only the support vectors matter.", "Kernels give flexible boundaries with a solid theoretical basis."],
    bad: ["Training slows down badly beyond tens of thousands of rows (with kernels).", "No native probabilities (needs extra calibration).", "Needs feature scaling and careful tuning of C and gamma."],
    qa: [
      ["What is the margin and why maximise it?", "The distance between the boundary and the closest points. A wider margin means the boundary is less sensitive to small changes, which tends to generalise better."],
      ["What are support vectors?", "The training points that lie on or inside the margin. They alone define the boundary; removing any other point changes nothing."],
      ["What is the kernel trick?", "Instead of transforming the data into a high-dimensional space explicitly, a kernel function computes the similarity there directly. You get curved boundaries without the cost of building the new features."],
      ["Hard margin vs soft margin?", "Hard margin requires perfect separation and fails with noise or overlap. Soft margin allows violations with a penalty C, which is what's used in practice."],
      ["How do C and gamma interact?", "Both control complexity. High C and high gamma give a tight, wiggly boundary (overfitting); low values give a smooth one (possibly underfitting). Tune them together with a grid search."],
      ["SVM vs logistic regression?", "Both give linear boundaries. Logistic regression uses all points and gives probabilities; SVM focuses on the edge points and maximises the margin. Results are often similar; SVM shines with kernels on small-to-medium data."],
    ],
  });

  A.guide("nn", {
    s30: "A neural network is layers of simple units. Each unit takes a weighted sum of its inputs and passes it through a non-linear activation. Stacking layers lets the network build up complex patterns from simple ones. It learns by backpropagation: measure the error, work out how much each weight contributed to it, and nudge every weight with gradient descent.",
    steps: ["Forward pass: inputs flow through the layers to produce a prediction.", "Compute the loss (how wrong the prediction is).", "Backward pass (backpropagation): use the chain rule to find each weight's share of the error (its gradient).", "Update every weight a small step against its gradient (gradient descent, usually Adam).", "Repeat over many batches and epochs, watching validation loss to avoid overfitting."],
    formula: [["output = activation(w · inputs + b)", "Each neuron: weigh the inputs, add a bias, and pass the result through a non-linear function such as ReLU."], ["w ← w − learning rate × ∂loss/∂w", "Move each weight a little in the direction that reduces the loss."]],
    knobs: [["Layers and neurons", "The network's size (depth and width).", "Start small; grow until validation stops improving."], ["Activation", "ReLU, GELU, sigmoid, tanh…", "ReLU / GELU for hidden layers."], ["Learning rate and optimiser", "Step size, and how steps are taken (SGD, Adam).", "Adam with ~1e-3 is a common start; the learning rate is the most important setting."], ["Batch size and epochs", "Examples per update / passes over the data.", "Use early stopping."], ["Regularisation", "Dropout, weight decay, batch normalisation, data augmentation.", "Add when validation loss rises while training loss falls."]],
    good: ["Can learn almost any pattern given enough data (universal approximator).", "Learns its own features from raw data: images, audio, text.", "Scales with data and compute; the basis of modern AI."],
    bad: ["Needs lots of data and compute.", "Many settings to tune; training can be unstable.", "Hard to interpret (a \"black box\").", "On small tabular data, tree ensembles usually win."],
    qa: [
      ["Why do we need non-linear activation functions?", "Without them, stacked layers collapse into one linear function, so depth adds nothing. Non-linearity lets the network bend boundaries and model complex patterns."],
      ["Explain backpropagation.", "After a forward pass, the error is passed backwards layer by layer using the chain rule, giving the gradient of the loss with respect to every weight. Gradient descent then updates the weights."],
      ["What are vanishing and exploding gradients?", "In deep networks gradients are multiplied through many layers and can shrink to nearly zero (early layers stop learning) or blow up. Fixes: ReLU-type activations, careful initialisation, batch/layer normalisation, residual connections, gradient clipping."],
      ["How do you prevent overfitting?", "More data or data augmentation, dropout, weight decay (L2), early stopping, smaller networks, and batch normalisation."],
      ["What's the difference between an epoch, a batch and an iteration?", "A batch is a small group of examples used for one update (iteration). An epoch is one full pass over the training data."],
      ["SGD vs Adam?", "SGD uses the raw gradient with one learning rate. Adam keeps running averages of gradients and their squares to adapt the step for each weight, usually converging faster with less tuning."],
      ["Why does a neural network with no hidden layer equal logistic regression?", "One layer with a sigmoid output is exactly a weighted sum passed through a sigmoid, trained with log loss: the definition of logistic regression."],
      ["When would you not use a neural network?", "Small tabular datasets (use gradient boosting), when interpretability is essential, or when compute and latency budgets are tight."],
    ],
  });

  A.guide("cnn", {
    s30: "A convolutional neural network is a neural network built for images. Small filters slide across the image looking for local patterns like edges; each filter produces a feature map showing where its pattern appears. Layers stack up: edges → textures → parts → objects. Pooling shrinks the maps, and a final layer classifies.",
    steps: ["Slide each small filter (e.g. 3×3) across the image; at each position, multiply and sum to get one number.", "Apply an activation (ReLU) to the resulting feature map.", "Pool (e.g. take the max in each 2×2 block) to shrink the map and gain tolerance to small shifts.", "Repeat with more filters in deeper layers to detect more complex patterns.", "Flatten (or global-average) and pass to fully connected layers to classify."],
    knobs: [["Filter size and count", "How big each pattern detector is, and how many per layer.", "3×3 filters, with counts doubling as maps shrink."], ["Stride and padding", "Step size of the slide; adding a border so edges are covered.", "\"same\" padding keeps the size."], ["Pooling", "Max or average pooling.", "Max pooling 2×2 is classic."], ["Transfer learning", "Start from a network pre-trained on millions of images.", "Almost always better than starting from scratch with small data."]],
    good: ["Far fewer weights than a fully connected network, thanks to weight sharing.", "Detects a pattern wherever it appears (translation equivariance).", "Proven for vision: classification, detection, segmentation, medical imaging."],
    bad: ["Needs lots of labelled images (or transfer learning).", "Computationally heavy to train.", "Vision transformers now match or beat CNNs at large scale."],
    qa: [
      ["Why use convolutions instead of fully connected layers for images?", "A fully connected layer on a 224×224×3 image needs a weight for every pixel per neuron, which is huge and ignores locality. Convolutions reuse the same small filter everywhere (weight sharing) and focus on nearby pixels."],
      ["What does a filter learn?", "Early filters learn edges and colour blobs; middle layers learn textures and parts; deep layers respond to whole objects. The filters are learned by backpropagation, not hand-written."],
      ["What is the receptive field?", "The area of the original image that influences one unit. It grows with depth, which is how deep layers \"see\" whole objects."],
      ["What does pooling do?", "It downsamples feature maps, reducing compute and making the network more tolerant to small shifts."],
      ["What is transfer learning and why is it so common with CNNs?", "Reusing a network trained on a big dataset (ImageNet) and fine-tuning it on your task. The general visual features transfer, so you need far fewer labelled images."],
      ["What problem did ResNet solve?", "Very deep networks were hard to train (degradation, vanishing gradients). Residual (skip) connections let layers learn small changes on top of their input, allowing 100+ layers."],
    ],
  });

  A.guide("rnn", {
    s30: "Recurrent neural networks read sequences one step at a time, carrying a hidden state (memory) from step to step. A plain RNN forgets quickly because of vanishing gradients. LSTMs and GRUs add gates that decide what to keep, forget and output, so they remember longer. Transformers have since replaced them for most language tasks.",
    steps: ["Start with an empty memory (hidden state).", "Read the first item; update the memory from the input and the previous memory.", "Repeat for each item in the sequence, reusing the same weights at every step.", "Use the final memory (or every step's output) to make predictions.", "Train with backpropagation through time (unrolling the sequence)."],
    knobs: [["Cell type", "Plain RNN, LSTM or GRU.", "LSTM or GRU; plain RNNs forget too fast."], ["Hidden size and layers", "Memory capacity.", "Tune like any network."], ["Bidirectional", "Also read the sequence backwards.", "Useful when the whole sequence is available (not for live prediction)."], ["Gradient clipping", "Caps exploding gradients.", "Almost always on."]],
    good: ["Handles sequences of any length with a fixed model size.", "Natural for streaming data: process step by step.", "LSTMs are still useful for small time-series and on-device tasks."],
    bad: ["Slow: steps must be processed in order, so poor GPU parallelism.", "Struggles with very long-range dependencies, even with LSTMs.", "Largely replaced by transformers for language."],
    qa: [
      ["Why do plain RNNs forget long-range information?", "Gradients are multiplied through every time step during backpropagation through time and shrink exponentially (vanishing gradients), so early inputs barely affect learning."],
      ["How does an LSTM fix that?", "It keeps a separate cell state that flows through time with only small, gated changes. A forget gate, an input gate and an output gate learn what to erase, what to add and what to reveal, so information and gradients can survive many steps."],
      ["LSTM vs GRU?", "A GRU merges gates (update and reset) and has no separate cell state: fewer parameters, faster, often similar accuracy. LSTMs can be slightly better on longer or more complex sequences."],
      ["What is backpropagation through time?", "Unroll the RNN across the sequence into a deep network with shared weights, then apply ordinary backpropagation and add up the gradients for the shared weights."],
      ["Why did transformers replace RNNs?", "Attention links any two positions directly (no fading memory), and all positions are processed in parallel, so training on GPUs is much faster and scales to huge datasets."],
    ],
  });

  A.guide("transformer", {
    s30: "A transformer reads all the tokens of a sequence at once. Its key part, self-attention, lets every token look at every other token and pull in the relevant information, weighted by relevance. Stacking many attention + feed-forward layers builds deep contextual understanding. It's the architecture behind GPT, Claude, Gemini and BERT.",
    steps: ["Split text into tokens and turn each into an embedding vector; add positional information.", "In each layer, every token makes a query, a key and a value.", "Attention scores = how well each query matches every key; softmax turns them into weights.", "Each token's new representation = the weighted mix of all values. Many heads do this in parallel.", "A feed-forward network processes each token; residual connections and layer normalisation keep training stable.", "Repeat for many layers; the final layer predicts (e.g. the next token)."],
    formula: [["Attention(Q, K, V) = softmax(Q·Kᵀ / √d) · V", "Compare each token's question (Q) with every token's label (K), turn the scores into weights, and mix the contents (V) accordingly. Dividing by √d keeps the scores from getting too large."]],
    knobs: [["Layers, heads, model width", "The model's size.", "Bigger models need more data and compute (scaling laws)."], ["Context length", "How many tokens it can attend to at once.", "Attention cost grows with the square of the length."], ["Architecture type", "Encoder-only (BERT), decoder-only (GPT), encoder–decoder (T5).", "Decoder-only for text generation."]],
    good: ["Captures long-range relationships directly.", "Highly parallel, so it trains efficiently at huge scale.", "Works across text, images, audio and code."],
    bad: ["Attention cost grows quadratically with sequence length.", "Needs enormous data and compute to train from scratch.", "Hard to interpret; can hallucinate when used as a language model."],
    qa: [
      ["Explain self-attention simply.", "For each word, the model asks \"which other words matter for understanding me?\", scores every word, turns the scores into weights, and builds a new representation as a weighted mix. In \"The animal didn't cross the street because it was tired\", \"it\" attends strongly to \"animal\"."],
      ["What are Q, K and V?", "Three learned projections of each token. The query is what I'm looking for, the key is what I contain, and the value is what I pass on. Attention matches queries to keys to decide how much of each value to take."],
      ["Why divide by √d in attention?", "Dot products grow with the vector size; large scores make the softmax extremely peaked, and gradients vanish. Scaling keeps them in a healthy range."],
      ["Why multi-head attention?", "Different heads can focus on different relationships at the same time (grammar, coreference, position), and their results are combined."],
      ["Why do transformers need positional encodings?", "Attention by itself ignores order: it treats the input as a set. Positional encodings (sinusoidal, learned, or rotary/RoPE) add order information."],
      ["Encoder vs decoder?", "Encoders see the whole input in both directions (good for understanding, as in BERT). Decoders use causal masking so each token sees only earlier tokens (good for generating, as in GPT)."],
      ["What limits context length?", "Attention compares every token with every other one, so memory and compute grow with n². Tricks include efficient attention kernels, sparse or sliding-window attention, and KV caching for generation."],
    ],
  });
})();
