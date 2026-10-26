// Algorithms map: "Words to know" for each algorithm, taken from the Module 1 word bank (names must match the glossary exactly).
(function () {
  "use strict";
  const A = window.WB_ALGOS;
  if (!A) return;
  const esc = A.h.esc;

  const WORDS = {
    linreg: ["Linear Regression", "Regression", "Feature", "Target Variable", "Weights", "Bias (parameter)", "Parameters", "Loss Function", "Mean Squared Error (MSE)", "RMSE (Root Mean Squared Error)", "Mean Absolute Error (MAE)", "R-squared", "Gradient Descent", "Outlier", "Correlation", "Polynomial Regression", "L1 / L2 Regularization", "Overfitting"],
    logreg: ["Logistic Regression", "Classification", "Binary Classification", "Multi-class Classification", "Sigmoid", "Softmax", "Probability", "Logit", "Log Loss (Cross-entropy)", "Weights", "Gradient Descent", "Regularization", "Confusion Matrix", "Precision", "Recall (Sensitivity)", "F1 Score", "ROC Curve", "AUC (Area Under the Curve)"],
    tree: ["Decision Tree", "Classification", "Regression", "Feature", "Entropy", "Overfitting", "Underfitting", "Pruning", "Hyperparameters", "Bias-Variance Tradeoff", "Interpretability", "Explainability (XAI)", "Cross-validation", "Feature Selection", "Random Forest", "Gradient Boosting"],
    forest: ["Random Forest", "Decision Tree", "Ensemble Learning", "Bagging", "Sampling", "Feature", "Variance", "Overfitting", "Bias-Variance Tradeoff", "Hyperparameters", "Hyperparameter Tuning", "Cross-validation", "Imbalanced Data", "Boosting", "Gradient Boosting", "Stacking"],
    boost: ["Gradient Boosting", "Boosting", "XGBoost", "LightGBM / CatBoost", "AdaBoost", "Ensemble Learning", "Decision Tree", "Gradient", "Loss Function", "Learning Rate", "Early Stopping", "Validation Data", "Overfitting", "Hyperparameter Tuning", "Bagging"],
    nb: ["Naive Bayes", "Bayes' Theorem", "Probability", "Probability Distribution", "Classification", "Text Classification", "Bag of Words", "TF-IDF", "Stop Words", "Tokenization", "Feature", "Training Data", "Baseline"],
    knn: ["K-Nearest Neighbors (KNN)", "Euclidean Distance", "Cosine Similarity", "Normalization", "Standardization", "Classification", "Regression", "Hyperparameters", "Dimensionality", "Similarity Search", "Vector Database", "Overfitting", "Underfitting"],
    svm: ["Support Vector Machine (SVM)", "Classification", "Binary Classification", "Vector", "Dot Product", "Regularization", "Hyperparameters", "Grid Search", "Standardization", "Dimensionality", "Overfitting"],
    nn: ["Neural Network", "Neuron (Node)", "Perceptron", "Layer", "Input Layer", "Hidden Layer", "Output Layer", "Weights", "Bias (parameter)", "Activation Function", "ReLU", "Sigmoid", "Forward Propagation", "Backpropagation", "Loss Function", "Gradient Descent", "Learning Rate", "Optimizer", "Adam", "Epoch", "Batch Size", "Vanishing Gradient", "Dropout", "Multilayer Perceptron (MLP)", "Deep Learning"],
    cnn: ["Convolutional Neural Network (CNN)", "Convolution", "Kernel (Filter)", "Feature Map", "Pooling", "Pixel", "ReLU", "Computer Vision", "Image Classification", "Object Detection", "Transfer Learning", "Data Augmentation", "ResNet", "Residual Connection (Skip Connection)", "ImageNet", "AlexNet", "Vision Transformer (ViT)"],
    rnn: ["Recurrent Neural Network (RNN)", "LSTM (Long Short-Term Memory)", "GRU (Gated Recurrent Unit)", "Backpropagation", "Vanishing Gradient", "Exploding Gradient", "Gradient Clipping", "Tanh", "Sigmoid", "Time Series Forecasting", "Natural Language Processing (NLP)", "Transformer"],
    transformer: ["Transformer", "Attention Mechanism", "Self-attention", "Multi-head Attention", "Token", "Tokenization", "Embedding", "Positional Encoding", "Encoder", "Decoder", "Encoder-Decoder", "Softmax", "Layer Normalization", "Residual Connection (Skip Connection)", "Context Window", "Next-token Prediction", "Autoregressive", "Large Language Model (LLM)", "GPT (Generative Pre-trained Transformer)", "BERT", "\"Attention Is All You Need\""],
    kmeans: ["K-Means Clustering", "Clustering", "Unsupervised Learning", "Unlabeled Data", "Euclidean Distance", "Mean, Median, Mode", "Hyperparameters", "Standardization", "Outlier", "Local Minimum", "Convergence", "Hierarchical Clustering", "DBSCAN"],
    hier: ["Hierarchical Clustering", "Clustering", "Unsupervised Learning", "Unlabeled Data", "Euclidean Distance", "Cosine Similarity", "K-Means Clustering", "DBSCAN"],
    dbscan: ["DBSCAN", "Clustering", "Unsupervised Learning", "Anomaly Detection", "Outlier", "Noise", "Euclidean Distance", "Hyperparameters", "K-Means Clustering"],
    pca: ["Principal Component Analysis (PCA)", "Dimensionality Reduction", "Dimensionality", "Variance", "Standard Deviation", "Correlation", "Standardization", "Linear Algebra", "Matrix", "Vector", "Feature Engineering", "Feature Selection", "Latent Space", "t-SNE / UMAP", "Autoencoder"],
    tsne: ["t-SNE / UMAP", "Dimensionality Reduction", "Dimensionality", "Embedding", "Latent Space", "Clustering", "Principal Component Analysis (PCA)", "Probability Distribution", "Stochastic", "Seed"],
    apriori: ["Apriori", "Association Rules", "Data Mining", "Recommendation System", "Collaborative Filtering", "Content-based Filtering", "Personalization", "Probability", "Unsupervised Learning"],
    iforest: ["Anomaly Detection", "Outlier", "Fraud Detection", "Decision Tree", "Random Forest", "Ensemble Learning", "Sampling", "Imbalanced Data", "Unsupervised Learning"],
    ae: ["Autoencoder", "Variational Autoencoder (VAE)", "Encoder", "Decoder", "Latent Space", "Dimensionality Reduction", "Anomaly Detection", "Neural Network", "Loss Function", "Principal Component Analysis (PCA)", "Self-supervised Learning", "Generative AI"],
    emb: ["Embedding", "Word Embedding", "Word2Vec", "Embedding Layer", "Vector", "Cosine Similarity", "Latent Space", "Dimensionality", "Semantic Search", "Similarity Search", "Vector Database", "RAG (Retrieval-Augmented Generation)", "Chunking", "Retriever", "Contrastive Learning", "CLIP"],
    qlearn: ["Q-Learning", "Reinforcement Learning (RL)", "Agent (in RL)", "Environment", "State", "Action", "Reward", "Policy", "Value Function", "Exploration vs Exploitation", "Markov Decision Process (MDP)", "Learning Rate", "Reward Hacking"],
    dqn: ["Deep Q-Network (DQN)", "Q-Learning", "Reinforcement Learning (RL)", "Neural Network", "Deep Learning", "State", "Action", "Reward", "Value Function", "Exploration vs Exploitation", "Pixel", "Simulation"],
    pg: ["Policy", "Reinforcement Learning (RL)", "Agent (in RL)", "Action", "Reward", "Value Function", "Probability Distribution", "Gradient", "Stochastic", "Exploration vs Exploitation", "Robotics", "RLHF (Reinforcement Learning from Human Feedback)"],
    mcts: ["Monte Carlo Tree Search (MCTS)", "Search Algorithm", "Minimax", "Simulation", "Planning", "Exploration vs Exploitation", "Policy", "Value Function", "Reinforcement Learning (RL)", "AlphaGo", "Deep Blue"],
    rlhf: ["RLHF (Reinforcement Learning from Human Feedback)", "Reward Model", "DPO (Direct Preference Optimization)", "RLAIF", "Constitutional AI", "Pre-training", "Base Model", "Supervised Fine-tuning (SFT)", "Instruction Tuning", "Fine-tuning", "Chat Model", "Policy", "Reward Hacking", "Sycophancy", "AI Alignment", "Human Evaluation"],
    connect: ["Machine Learning (ML)", "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning (RL)", "Self-supervised Learning", "Semi-supervised Learning", "Algorithm", "Model", "Training", "Label", "Feature", "Ensemble Learning", "Neural Network", "Deep Learning", "RLHF (Reinforcement Learning from Human Feedback)"],
  };

  // Glossary lookup from the Module 1 word bank on the page: "term|ring|definition" per line
  let gloss = null;
  function lookup() {
    if (gloss) return gloss; gloss = new Map();
    const el = document.getElementById("data");
    if (el) el.textContent.split("\n").forEach((l) => { const [t, ring, def] = l.trim().split("|"); if (t && def) gloss.set(t, { ring, def }); });
    return gloss;
  }
  function box(id, name) {
    const list = (WORDS[id] || []).filter((t) => lookup().has(t));
    if (!list.length) return "";
    return `<details class="plainbox wordsbox" open><summary>Words to know for ${esc(name)} (${list.length})</summary>
      <p class="algonote">From your word bank. Click a word to open it in the learning web. <button type="button" class="choice" data-wtest="1">Test me: hide meanings</button></p>
      <dl>${list.map((t, i) => `<div class="${i === 0 ? "wmain" : ""}"><dt><button type="button" class="wordlink" data-word="${esc(t)}">${esc(t)}</button></dt><dd>${esc(gloss.get(t).def)}</dd></div>`).join("")}</dl></details>`;
  }
  // "Test me" hides the meanings; clicking a card then reveals just that one
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-wtest]");
    if (b) { const bx = b.closest(".wordsbox"); const on = bx.classList.toggle("wtest"); b.textContent = on ? "Show all meanings" : "Test me: hide meanings"; bx.querySelectorAll("dl>div").forEach((d) => d.classList.remove("seen")); return; }
    const card = e.target.closest(".wordsbox.wtest dl>div");
    if (card && !e.target.closest("[data-word]")) card.classList.toggle("seen");
  });
  A.words = { list: WORDS, box, missing: () => Object.entries(WORDS).flatMap(([id, l]) => l.filter((t) => !lookup().has(t)).map((t) => id + ": " + t)) };
})();
