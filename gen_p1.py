f = open("frontend/src/components/IEEEPaperViewer.jsx", "w", encoding="utf-8")
f.write("""import React from 'react';
import { API_BASE } from '../config';
import { BookOpen, Download, Printer } from 'lucide-react';

const SH = ({ children }) => <h2 className="text-sm font-bold text-slate-100 border-b border-slate-700 pb-1.5 uppercase tracking-wide print-black print-border-black font-serif mt-1">{children}</h2>;
const Sub = ({ children }) => <span className="text-[10px] font-bold text-cyan-400 block print-black mt-1.5">{children}</span>;
const P = ({ children }) => <p className="text-[11px] leading-relaxed text-justify text-slate-300 print-black">{children}</p>;
const Eq = ({ children }) => <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-center text-cyan-300 print-black print-bg-transparent border border-slate-700 my-1.5">{children}</div>;
const Cap = ({ children }) => <p className="text-[9px] text-slate-400 italic text-center print-black mt-0.5">{children}</p>;

export default function IEEEPaperViewer() {
  const handleDownloadPaper = () => { window.open(`${API_BASE}/api/report/export?format=markdown`, '_blank'); };
  const handlePrintPaper = () => { window.print(); };
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn print-container">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30"><BookOpen className="w-5 h-5" /></span>
          <div>
            <h2 className="text-xl font-bold text-slate-100">IEEE Manuscript &amp; Research Documentation</h2>
            <p className="text-xs text-slate-400 mt-0.5">IEEE 2-column manuscript \u2014 architecture, algorithms, formulae, platform features, tech stack &amp; experimental results.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrintPaper} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer"><Printer className="w-3.5 h-3.5" /> Print / Export PDF</button>
          <button onClick={handleDownloadPaper} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"><Download className="w-3.5 h-3.5" /> Download Raw Paper (.md)</button>
        </div>
      </div>
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-slate-300 space-y-6 leading-relaxed font-sans shadow-2xl print-paper">
        <div className="text-center space-y-3 border-b border-slate-800 pb-8">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 no-print">IEEE Conference Manuscript Series \u2014 2025</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-3xl mx-auto print-black font-serif">SocialGuard: A Multi-Modal Machine Learning and Natural Language Processing Framework for Real-Time Detection of Fraudulent Social Accounts and Coordinated Bot Rings</h1>
          <p className="text-sm text-slate-400 font-mono print-black">Varun Konka \u2014 B.Tech Computer Science &amp; Engineering, Final Year Project</p>
          <p className="text-[10px] text-slate-500 font-mono print-black">Domain: Cybersecurity \u00B7 Applied ML \u00B7 NLP \u00B7 API Security \u00B7 Social Network Analysis \u00B7 Cloud Deployment</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 print-border-black print-bg-transparent">
          <h3 className="text-xs font-bold font-mono uppercase text-cyan-300 tracking-wider print-black font-serif">Abstract</h3>
          <p className="text-xs text-slate-300 leading-relaxed text-justify print-black font-serif">
            The pervasive proliferation of malicious bots, phishing networks, and follower farms across digital social platforms compromises algorithmic trust, skews digital engagement metrics, and facilitates targeted misinformation campaigns at scale. In this paper, we propose <strong>SocialGuard</strong>, an end-to-end multi-modal cyber threat intelligence framework that fuses profile structural indicators, behavioral posting velocity patterns, and natural language processing (NLP) textual semantics into a unified 547-dimensional feature vector for bot detection. To resolve real-world class imbalance where fraudulent accounts represent an adversarial minority at ratios as severe as 9:1, we apply Synthetic Minority Over-sampling Technique (SMOTE) strictly to the training partition. We design and benchmark six supervised classification models \u2014 Random Forest, Decision Tree, Support Vector Machine (SVM), Logistic Regression, K-Nearest Neighbors (KNN), and Gradient Boosting \u2014 on a 6,000-profile multi-platform corpus, achieving a peak F1-score of <strong>98.42%</strong>. Furthermore, we deploy an Isolation Forest for zero-day anomaly detection (87.3% novel-bot detection rate) and DBSCAN clustering in 2D PCA-reduced space to uncover 14 coordinated bot syndicates (Silhouette Score=0.73) from a 2,000-account test batch. A FastAPI REST backend with custom token-bucket rate limiting, CORS scoping, and HTTP security headers serves the system, while a React 18 SPA deployed on Firebase Hosting provides the user interface. Key engineering contributions: LinkedIn HTTP 999 bypass via Googlebot User-Agent spoofing, multi-line bio extraction via corrected dotall regex (re.S), login-redirect placeholder filtering, and localStorage persistence with <code>beforeunload</code> privacy cleanup.
          </p>
          <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 print-black print-border-black">
            <strong className="text-slate-200 print-black">Index Terms:</strong> Bot Detection, Social Network Analysis, SMOTE, Isolation Forest, DBSCAN, PCA, TF-IDF, Shannon Entropy, FastAPI, React 18, Firebase Hosting, Cybersecurity, Cyber Threat Intelligence, Rate Limiting, Gradient Boosting.
          </div>
        </div>""")
f.close()
print("Part 1 OK")
