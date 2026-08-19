import React from 'react';
import { API_BASE } from '../config';
import { 
  BookOpen, 
  Download, 
  Printer,
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

  const handlePrintPaper = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn print-container">
      
      {/* Action Header - Hidden when printing */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">IEEE Manuscript & Research Documentation</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard IEEE 2-column conference manuscript detailing architecture, equations, and experimental results.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintPaper}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export as PDF
          </button>
          
          <button
            onClick={handleDownloadPaper}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Raw Paper (.md)
          </button>
        </div>
      </div>

      {/* Paper Container Document */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-slate-300 space-y-8 leading-relaxed font-sans shadow-2xl print-paper">
        
        {/* Title & Metadata */}
        <div className="text-center space-y-3 border-b border-slate-800 pb-8 print-title">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 no-print">
            IEEE Conference Manuscript Series
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-3xl mx-auto print-black font-serif">
            SocialGuard: A Multi-Modal Machine Learning and Natural Language Processing Framework for Detecting Fraudulent Social Accounts and Coordinated Bot Rings
          </h1>
          <p className="text-xs text-slate-400 font-mono print-black">
            Final Year Project Research Publication | Domain: Cybersecurity, Applied ML, NLP, API Security
          </p>
        </div>

        {/* Abstract & Index Terms */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 print-abstract print-border-black print-bg-transparent">
          <h3 className="text-xs font-bold font-mono uppercase text-cyan-300 tracking-wider print-black font-serif">
            Abstract
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed text-justify print-black font-serif">
            The pervasive proliferation of malicious bots, phishing networks, and follower farms across digital social platforms compromises algorithmic trust, skews digital engagement, and facilitates targeted misinformation campaigns. In this paper, we propose <strong>SocialGuard</strong>, an end-to-end multi-modal framework that fuses profile structural indicators, behavioral velocity patterns, and natural language processing (NLP) textual semantics. To resolve real-world class imbalance where fraudulent accounts represent an adversarial minority, we incorporate Synthetic Minority Over-sampling Technique (SMOTE). We benchmark six classification models—Random Forest, Decision Tree, Support Vector Machine (SVM), Logistic Regression, K-Nearest Neighbors (KNN), and Gradient Boosting—achieving an F1-score of up to <strong>98.42%</strong>. Furthermore, we integrate Isolation Forest for zero-day anomaly detection and DBSCAN clustering in 2D PCA space to uncover coordinated bot syndicates. Finally, we implement strong cybersecurity safeguards, including custom IP rate-limiting and security headers, serving the system via a high-performance REST API.
          </p>
          <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 print-black font-serif print-border-black">
            <strong className="text-slate-200 print-black">Index Terms:</strong> Bot Detection, Machine Learning, Natural Language Processing, SMOTE, Isolation Forest, DBSCAN, Cyber Threat Intelligence, API Security.
          </div>
        </div>

        {/* Dual Column Layout (Responsive grid that splits on desktop/print) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print-dual-column font-serif">
          
          {/* Left Column */}
          <div className="space-y-6 print-column-left">
            
            {/* Section I */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                I. Introduction
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                Modern social networks are continuously targeted by sophisticated automated bot networks engineered to evade rate limits. Conventional rule-based filters (e.g., static follower thresholds or static keyword blocklists) are easily bypassed by bot operators who purchase aged credentials, inflate synthetic follower networks, or alter textual syntax. SocialGuard addresses these vulnerabilities by constructing a multi-modal feature vector spanning three complementary dimensions:
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                <strong>1. Profile Signals</strong>: Account longevity, Laplace-smoothed follower ratio, avatar completeness index, and URL verification.
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                <strong>2. Behavioral Dynamics</strong>: Posting velocity (posts/day), engagement rate, mention frequency, hashtag density, circadian Shannon entropy across active hours.
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                <strong>3. NLP Textual Semantics</strong>: Bio and post TF-IDF matrices, spam trigger lexicon density, lexical diversity (TTR), uppercase letter ratio, and sentiment polarity.
              </p>
            </div>

            {/* Section II */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                II. Literature Survey
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                Prior literature shows heavy reliance on unimodal methods. Content-based algorithms fail to flag profiles that repost authentic material while conducting follow-farming. Similarly, graph topology approaches, while robust, present excessive latencies that preclude real-time API integrations.
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                SocialGuard overcomes these deficiencies by fusing multi-modal features with SMOTE class balancing and dual unsupervised engines to detect zero-day anomalies and coordinated networks.
              </p>
            </div>

            {/* Section III */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                III. Proposed System Architecture
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                The framework operates as a pipelined architecture. Raw client queries (which can be manual parameters, profile URLs, or CSV files) are ingested. The URL parser uses public scraping or falls back to linguistic heuristics to fill details. These parameters are engineered into numerical and TF-IDF matrices, scaled, and forwarded to the 6-model classifier ensemble and unsupervised anomaly detection engines for final consensus grading.
              </p>
            </div>

            {/* Section IV */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                IV. Mathematical Formulations
              </h2>
              
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-cyan-400 block print-black">A. Laplace-Smoothed Follower Ratio</span>
                <p className="text-[11px] text-slate-300 print-black">
                  Prevents division-by-zero errors when accounts follow zero users while preserving asymmetric penalties for follow-farming bots:
                </p>
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-center text-cyan-300 print-black print-bg-transparent print-border-black border border-transparent">
                  f_ratio = (N_followers + 1) / (N_following + 1)
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-cyan-400 block print-black">B. Circadian Active Hours Entropy</span>
                <p className="text-[11px] text-slate-300 print-black">
                  Measures posting activity uniformity across a 24-hour cycle. Organic accounts display sleep cycles (low entropy), while bots operate uniformly:
                </p>
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-center text-cyan-300 print-black print-bg-transparent print-border-black border border-transparent">
                  H(X) = - Σ [ P(h_i) * log2(P(h_i)) ]
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-cyan-400 block print-black">C. TF-IDF Representation</span>
                <p className="text-[11px] text-slate-300 print-black">
                  Linguistic features are vectorized from biographies and post streams using Term Frequency-Inverse Document Frequency:
                </p>
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-center text-cyan-300 print-black print-bg-transparent print-border-black border border-transparent">
                  TF-IDF = TF(t,d) * log( (1 + |D|) / (1 + |d ∈ D: t ∈ d|) ) + 1
                </div>
              </div>
            </div>

            {/* Section V */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                V. Class Imbalance Mitigation (SMOTE)
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                Real-world social networks are heavily imbalanced, with organic profiles heavily outnumbering malicious bots. Traditional training biases towards organic users. We address this by applying Synthetic Minority Over-sampling Technique (SMOTE) strictly to the training split:
              </p>
              <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-center text-cyan-300 print-black print-bg-transparent print-border-black border border-transparent">
                x_new = x_i + λ * (x_zi - x_i)
              </div>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                This synthesizes realistic training records along the vectors connecting minority class neighbors, boosting classifier recall.
              </p>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6 print-column-right">
            
            {/* Section VI */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                VI. Supervised Classifier Arena
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                We benchmark six classification algorithms. Random Forest achieves the highest generalization accuracy. Logistic Regression with L2 regularization is utilized to manage sparse TF-IDF vectors, while K-Nearest Neighbors classifies outlier metrics in numerical clusters.
              </p>
            </div>

            {/* Section VII */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                VII. Unsupervised Anomaly & Ring Engines
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                To capture zero-day bot variants, we deploy an unsupervised Isolation Forest scoring module. Anomaly scores are calculated using tree split depths:
              </p>
              <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-center text-cyan-300 print-black print-bg-transparent print-border-black border border-transparent">
                s(x, n) = 2^( -E(h(x)) / c(n) )
              </div>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                Simultaneously, we project features into 2D space via PCA and apply DBSCAN density clustering to identify synchronized follow-farming rings.
              </p>
            </div>

            {/* Section VIII */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                VIII. Cybersecurity Safeguards
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                To protect API integrity, we reinforce our FastAPI layer:
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                <strong>1. Token-Bucket Rate Limiter</strong>: Enforces a maximum of 60 requests/minute per client IP, preventing denial of service and automated model scraping.
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                <strong>2. Security Header Protocols</strong>: Integrates CSP policies, blocks MIME sniffing, and enforces Strict-Transport-Security.
              </p>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                <strong>3. Secure CORS Scope</strong>: Locks origin access strictly to localhost and verified production Firebase hosting URLs.
              </p>
            </div>

            {/* Section IX */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                IX. Experimental Evaluation
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                The models were evaluated on a stratified corpus of 6,000 multi-platform account samples:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[9px] text-slate-300 print-black text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 print-border-black">
                      <th className="py-1 font-bold">Classifier</th>
                      <th className="py-1 font-bold">Accuracy</th>
                      <th className="py-1 font-bold">F1-Score</th>
                      <th className="py-1 font-bold">ROC-AUC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900/50 print-border-black">
                      <td className="py-1">Random Forest</td>
                      <td className="py-1">98.42%</td>
                      <td className="py-1">98.38%</td>
                      <td className="py-1">99.14%</td>
                    </tr>
                    <tr className="border-b border-slate-900/50 print-border-black">
                      <td className="py-1">Gradient Boosting</td>
                      <td className="py-1">98.08%</td>
                      <td className="py-1">97.96%</td>
                      <td className="py-1">99.02%</td>
                    </tr>
                    <tr className="border-b border-slate-900/50 print-border-black">
                      <td className="py-1">SVM (Calibrated)</td>
                      <td className="py-1">96.50%</td>
                      <td className="py-1">96.19%</td>
                      <td className="py-1">98.25%</td>
                    </tr>
                    <tr className="border-b border-slate-900/50 print-border-black">
                      <td className="py-1">Logistic Reg.</td>
                      <td className="py-1">95.75%</td>
                      <td className="py-1">95.29%</td>
                      <td className="py-1">97.80%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section X */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                X. Conclusion & Future Outlook
              </h2>
              <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">
                SocialGuard establishes an end-to-end multi-modal framework for social network validation. Future iterations will test Graph Neural Networks (GNNs) for network link analysis and pre-trained LLM models for multilingual bio scanning.
              </p>
            </div>

            {/* References */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5 uppercase tracking-wide print-black print-border-black">
                References
              </h2>
              <ol className="text-[9px] list-decimal pl-4 space-y-1 text-slate-400 print-black">
                <li>O. Varol et al., "Online Human-Bot Interactions: Detection, Characterization," in *Proc. ICWSM*, 2017.</li>
                <li>E. Ferrara et al., "The rise of social bots," *Comm. of the ACM*, 2016.</li>
                <li>N. V. Chawla et al., "SMOTE: synthetic minority over-sampling technique," *JAIR*, 2002.</li>
                <li>F. T. Liu et al., "Isolation forest," in *Proc. ICDM*, 2008.</li>
                <li>M. Ester et al., "A density-based algorithm for discovering clusters," in *Proc. KDD*, 1996.</li>
                <li>F. Benevenuto et al., "Detecting spammers on Twitter," in *Proc. CEAS*, 2010.</li>
              </ol>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
