# SocialGuard: A Multi-Modal Machine Learning and Natural Language Processing Framework for Detecting Fraudulent Social Media Accounts and Coordinated Bot Networks

**Abstract**—The rapid proliferation of automated bot accounts, phishing rings, and follower-farming syndicates across social media platforms threatens digital trust, compromises algorithmic integrity, and amplifies coordinated disinformation. Conventional defense mechanisms relying on superficial thresholding or static blacklists fail against modern adversarial bots that emulate organic behavioral dynamics and cycle synthetic credentials. In this paper, we propose **SocialGuard**, a multi-modal defense framework that synthesizes three orthogonal analytical dimensions: (i) structural profile integrity indicators, (ii) behavioral interaction velocity metrics, and (iii) natural language processing (NLP) semantics extracted from profile biographies and post streams. To overcome severe real-world class imbalance where fraudulent accounts constitute an adversarial minority, we introduce a stratified Synthetic Minority Over-sampling Technique (SMOTE) pipeline. We benchmark six prominent machine learning classifiers—Random Forest, Decision Tree, Support Vector Machine (SVM), Logistic Regression, K-Nearest Neighbors (KNN), and Gradient Boosting—demonstrating superior classification performance (F1-score of 98.4% and ROC-AUC of 99.1% with Random Forest). Additionally, we incorporate Isolation Forest for unsupervised zero-day anomaly scoring and DBSCAN density clustering in 2D Principal Component Analysis (PCA) space to uncover synchronized bot clusters. We evaluate the proposed system on a multi-platform dataset of 6,000 accounts and deploy it via a high-performance REST API and real-time interactive sentinel dashboard.

**Index Terms**—Bot Detection, Fraud Detection, Multi-Modal Machine Learning, Natural Language Processing, SMOTE, Isolation Forest, DBSCAN, Cyber Threat Intelligence.

---

## I. INTRODUCTION

Digital social platforms have become primary vectors for social engineering, financial cryptocurrency scams, identity impersonation, and orchestrated astroturfing campaigns. Sophisticated bot syndicates routinely generate thousands of accounts designed to mimic authentic users while executing high-velocity spamming, follow-farming, or link-injection operations.

Existing detection methodologies frequently suffer from three core limitations:
1. **Unimodal Dependency**: Relying solely on textual spam detection ignores non-textual follow-farms, while relying strictly on follower counts leaves platforms vulnerable to bots with purchased or inflated metrics.
2. **Adversarial Class Imbalance**: In legitimate social datasets, organic users heavily outnumber fraudulent accounts. Training vanilla classifiers on unweighted imbalanced corpora yields high nominal accuracy but catastrophically low minority recall (Type II errors).
3. **Absence of Coordinated Anomaly Detection**: Supervised models evaluate accounts in isolation, failing to detect coordinated botnets that execute synchronized actions in feature space.

To address these challenges, **SocialGuard** introduces an end-to-end framework featuring:
- **Multi-Modal Feature Engineering**: Integrating Laplace-smoothed follower ratios ($f_{ratio} = \frac{followers+1}{following+1}$), profile completeness indices, Shannon circadian entropy across active hours, TF-IDF lexical matrices, and spam trigger density.
- **Leakage-Free SMOTE Balancing**: Synthetic minority oversampling applied exclusively to training partitions during stratified cross-validation.
- **Multi-Model Arena**: Comprehensive comparative evaluation of 6 classifiers with precision-recall trade-off analysis.
- **Dual Unsupervised Engines**: Isolation Forest for statistical outlier detection alongside DBSCAN in 2D PCA space for coordinated ring discovery.
- **Production-Ready Serving**: FastAPI backend with WebSocket stream support and a React-based monitoring dashboard.

---

## II. PROPOSED SYSTEM ARCHITECTURE

```
  +-------------------------------------------------------------+
  |                   Multi-Source Social Ingest                |
  |             (Profile, Behavioural, Textual Posts)          |
  +------------------------------+------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |              Feature Engineering & Preprocessing           |
  |  - Profile Completeness Index                               |
  |  - Laplace-Smoothed Follower/Following Ratio                |
  |  - Circadian Active Hours Entropy H(X)                      |
  |  - NLP: TF-IDF + Sentiment Polarity + Spam Keyword Density  |
  +------------------------------+------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |            SMOTE-Based Class Imbalance Mitigation           |
  |     (Synthetic Minority Over-sampling on Training Split)    |
  +------------------------------+------------------------------+
                                 |
         +-----------------------+-----------------------+
         |                                               |
         v                                               v
+-------------------------------+             +-------------------------------+
|  Supervised Classifier Suite  |             |  Unsupervised Anomaly Engine  |
|  - Random Forest (Champion)   |             |  - Isolation Forest (Outliers)|
|  - Gradient Boosting          |             |  - DBSCAN 2D PCA Clustering   |
|  - Linear / Calibrated SVM    |             |    (Coordinated Bot Rings)    |
|  - Logistic Regression (L2)   |             +-------------------------------+
|  - Decision Tree & KNN        |
+---------------+---------------+
                |
                v
+---------------------------------------------------------------+
|                 Ensemble Consensus & Inference                |
|       - Real/Fake Classification & Risk Score (0 - 100)       |
|       - Archetype Categorization & Explainable Factors        |
+-------------------------------+-------------------------------+
                                |
                                v
+---------------------------------------------------------------+
|          FastAPI Serving & React Real-Time Sentinel           |
+---------------------------------------------------------------+
```

---

## III. MATHEMATICAL FORMULATION

### A. Laplace-Smoothed Follower-to-Following Ratio
Standard ratio calculations divide followers by following count, which fails when an account follows zero users. We implement Laplace smoothing:

$$f_{ratio} = \frac{N_{followers} + 1}{N_{following} + 1}$$

This metric penalizes follow-farming bots with thousands of followings and near-zero followers ($f_{ratio} \ll 0.05$) while remaining numerically stable.

### B. Circadian Active Hours Entropy
Human sleep-wake circadian rhythms produce non-uniform activity distributions over a 24-hour cycle. Automated bot scripts operating on cron jobs exhibit uniform 24/7 activity. We quantify this using Shannon Entropy:

$$H(X) = - \sum_{i=1}^{24} P(h_i) \log_2 P(h_i)$$

Where $P(h_i)$ is the probability of a post occurring in hour $i$. Low entropy ($H(X) < 1.5$) indicates robotic scheduling.

### C. TF-IDF & Spam Lexicon Density
For textual bio and post content, Term Frequency-Inverse Document Frequency (TF-IDF) weights discriminative n-grams:

$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1$$

Combined with a normalized spam trigger density score $S_{lex} \in [0, 1]$ targeting cryptocurrency phishing, giveaway keywords, and external redirect links.

---

## IV. EXPERIMENTAL RESULTS & COMPARATIVE BENCHMARKS

The benchmark evaluation was performed on 6,000 labeled multi-platform accounts with an 80/20 stratified split (1,200 test accounts).

| Model Architecture | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | ROC-AUC (%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Random Forest (Ensemble)** | **98.42%** | **97.85%** | **98.92%** | **98.38%** | **99.14%** |
| **Gradient Boosting** | 98.08% | 97.28% | 98.65% | 97.96% | 99.02% |
| **Support Vector Machine (Calibrated)** | 96.50% | 95.12% | 97.30% | 96.19% | 98.25% |
| **Logistic Regression (L2 Regularized)**| 95.75% | 94.38% | 96.22% | 95.29% | 97.80% |
| **K-Nearest Neighbors (k=7, Distance)** | 95.17% | 93.82% | 95.95% | 94.87% | 96.90% |
| **Decision Tree (Max Depth=8)** | 94.83% | 93.18% | 95.41% | 94.28% | 94.95% |

### Key Experimental Insights:
1. **Tree Ensembles Outperform Distance Baselines**: Random Forest and Gradient Boosting captured complex non-linear feature interactions (e.g., young account age combined with high post velocity and URL density) with minimal overfitting.
2. **SMOTE Impact**: Applying SMOTE oversampling to the training split increased the minority fraud recall from 82.3% to 98.92%, ensuring adversarial bots are not misclassified as organic users.
3. **Unsupervised Ring Discovery**: DBSCAN density clustering successfully grouped synchronized follower-farms and phishing rings into cohesive 2D coordinate clusters without requiring manual supervision.

---

## V. CONCLUSION & FUTURE SCOPE

The **SocialGuard** hybrid ML + NLP framework demonstrates that multi-modal fusion of profile heuristics, behavioral velocity, and textual NLP semantics provides resilient and explainable protection against fraudulent social accounts. The full architecture is modular, production-ready, and accompanied by live telemetry dashboards. Future research will explore graph neural networks (GNNs) for multi-hop account topology analysis and multilingual transformer fine-tuning.
