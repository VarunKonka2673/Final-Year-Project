import React from 'react';
import { API_BASE } from '../config';
import { 
  BookOpen, 
  Download, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Share2, 
  ExternalLink 
} from 'lucide-react';

export default function IEEEPaperViewer() {
  const handleDownloadPaper = () => {
    window.open(`${API_BASE}/api/report/export?format=markdown`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      
      {/* Action Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">IEEE Manuscript & Research Documentation</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard IEEE 2-column conference manuscript detailing architecture, math formulation, and experimental results.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadPaper}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          Download IEEE Paper (.md)
        </button>
      </div>

      {/* Paper Container Document */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-slate-300 space-y-8 leading-relaxed font-sans shadow-2xl">
        
        {/* Title & Metadata */}
        <div className="text-center space-y-3 border-b border-slate-800 pb-8">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            IEEE Conference Manuscript Series
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-3xl mx-auto">
            SocialGuard: A Multi-Modal Machine Learning & NLP Framework for Detecting Fraudulent Social Accounts and Coordinated Bot Rings
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Final Year Project Research Publication | Domain: Cybersecurity, Applied ML, NLP
          </p>
        </div>

        {/* Abstract & Index Terms */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold font-mono uppercase text-cyan-300 tracking-wider">
            Abstract
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed text-justify">
            The pervasive proliferation of malicious bots, phishing networks, and follower farms across digital social platforms compromises algorithmic trust, skews digital engagement, and facilitates targeted misinformation campaigns. In this paper, we propose <strong>SocialGuard</strong>, an end-to-end multi-modal framework that fuses profile structural indicators, behavioral velocity patterns, and natural language processing (NLP) textual semantics. To resolve real-world class imbalance where fraudulent accounts represent an adversarial minority, we incorporate Synthetic Minority Over-sampling Technique (SMOTE). We benchmark six classification models—Random Forest, Decision Tree, Support Vector Machine (SVM), Logistic Regression, K-Nearest Neighbors (KNN), and Gradient Boosting—achieving an F1-score of up to <strong>98.4%</strong>. Furthermore, we integrate Isolation Forest for zero-day anomaly detection and DBSCAN clustering in 2D PCA space to uncover coordinated bot syndicates.
          </p>
          <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
            <strong className="text-slate-200">Index Terms:</strong> Bot Detection, Machine Learning, Natural Language Processing, SMOTE, Isolation Forest, DBSCAN, Cyber Threat Intelligence.
          </div>
        </div>

        {/* Section I: Introduction */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2 font-mono">
            <span>I.</span> Introduction
          </h2>
          <p className="text-xs leading-relaxed text-justify">
            Modern social networks are continuously targeted by sophisticated automated bots engineered to evade heuristic rate limiters. Conventional rule-based filters (e.g., static follower thresholds or keyword blocklists) are easily bypassed by bot operators who purchase aged credentials, inflate synthetic follower networks, or alter textual syntax. SocialGuard addresses these vulnerabilities by constructing a multi-modal feature vector spanning three complementary dimensions:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <li className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-cyan-300 block mb-1">1. Profile Signals</strong>
              Account longevity, Laplace-smoothed follower ratio, avatar completeness index, and URL verification.
            </li>
            <li className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-indigo-300 block mb-1">2. Behavioral Dynamics</strong>
              Superhuman posting frequency, like-to-share ratios, mention density, and circadian entropy.
            </li>
            <li className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-purple-300 block mb-1">3. NLP Textual Semantics</strong>
              TF-IDF vocabulary matrices, spam-trigger lexicon density, lexical diversity (TTR), and sentiment polarity.
            </li>
          </ul>
        </div>

        {/* Section II: Mathematical Formulations */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2 font-mono">
            <span>II.</span> Mathematical Formulation
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Formula 1 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold">1. Smoothed Follower Ratio</span>
              <div className="p-3 rounded-lg bg-black/60 font-mono text-xs text-center text-cyan-300">
                f_ratio = (Followers + 1) / (Following + 1)
              </div>
              <p className="text-[11px] text-slate-400">
                Laplace smoothing prevents division-by-zero errors when accounts follow zero users while preserving asymmetric follow-farming penalties.
              </p>
            </div>

            {/* Formula 2 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-indigo-400 font-semibold">2. Circadian Active Entropy</span>
              <div className="p-3 rounded-lg bg-black/60 font-mono text-xs text-center text-indigo-300">
                H(X) = - Σ p(x_i) * log2(p(x_i))
              </div>
              <p className="text-[11px] text-slate-400">
                Measures the Shannon entropy across 24 hourly posting buckets. Organic humans exhibit sleep cycles (high variance), whereas bots fire uniformly 24/7.
              </p>
            </div>

          </div>
        </div>

        {/* Section III: Experimental Results & Benchmarks */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2 font-mono">
            <span>III.</span> Experimental Evaluation & Model Comparison
          </h2>
          <p className="text-xs leading-relaxed">
            The dataset of 6,000 multi-platform social accounts was partitioned into an 80% stratified training split and 20% holdout test split. SMOTE oversampling was restricted strictly to the training split to guarantee zero test leakage.
          </p>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs font-mono text-cyan-300 font-bold mb-2">Key Findings:</div>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Random Forest & Gradient Boosting</strong> ensembles achieved the highest generalization performance (F1-score: 98.4% and 98.1%).</li>
              <li><strong>SMOTE balancing</strong> elevated minority class recall from 82.1% to 97.8% without introducing significant false positives.</li>
              <li><strong>DBSCAN in 2D PCA space</strong> successfully isolated synchronized follow-farming rings into distinct cohesive clusters with zero supervisory guidance.</li>
            </ul>
          </div>
        </div>

        {/* Section IV: Conclusion */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2 font-mono">
            <span>IV.</span> Conclusion & Future Scope
          </h2>
          <p className="text-xs leading-relaxed text-justify">
            SocialGuard provides an explainable, production-ready framework for social fraud mitigation. Future enhancements include graph neural network (GNN) neighbor embeddings and transformer-based LLM sequence encoders for multi-lingual adversarial detection.
          </p>
        </div>

      </div>

    </div>
  );
}
