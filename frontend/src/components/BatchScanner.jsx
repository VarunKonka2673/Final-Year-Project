import React, { useState } from 'react';
import { API_BASE } from '../config';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function BatchScanner() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch(`${API_BASE}/api/predict/upload-csv`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setBatchResult(data);
    } catch (err) {
      console.error("Batch upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = "username,bio,recent_post,follower_count,following_count,posts_count,account_age_days,has_profile_pic,has_url,posting_frequency_per_day,avg_engagement_rate,active_hours_entropy\n" +
      "elon_rewards_999,FREE ETH AIRDROP bit.ly/claim,Retweet to win 1 BTC!,15,4500,4,2,0,1,45.0,0.05,0.3\n" +
      "sarah_photography,Travel photographer & explorer,Golden hour over Yosemite,12500,450,280,1200,1,1,0.75,4.8,3.2\n" +
      "user_991283,F4F fast followback,Follow me for follow back,25,6200,2,8,0,0,0.1,0.01,1.0\n" +
      "david_dev_tech,Open source enthusiast & Rust dev,Building distributed systems,850,600,140,890,1,1,0.4,5.2,3.1";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "socialguard_sample_upload.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAuditedCSV = () => {
    if (!batchResult?.results) return;
    const headers = ["Account Username", "Verdict", "Risk Score", "Risk Level", "Predicted Archetype", "Confidence"];
    const rows = batchResult.results.map(r => [
      r.account_username,
      r.verdict,
      r.risk_score,
      r.risk_level,
      r.predicted_archetype,
      `${r.confidence_pct}%`
    ]);

    const csvStr = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `socialguard_audit_${batchResult.filename || 'batch'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const results = batchResult?.results || [];
  const filteredResults = results.filter(r => {
    const matchesSearch = r.account_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.predicted_archetype.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterVerdict === 'fake') return matchesSearch && r.is_fake === 1;
    if (filterVerdict === 'genuine') return matchesSearch && r.is_fake === 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Batch CSV Account Audit</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk ingest social media datasets (Kaggle/Twitter/Instagram) for batch classification and exportable risk audits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSampleCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Sample CSV Template
          </button>
        </div>
      </div>

      {/* Drag and Drop Upload Card */}
      <div className="glass-panel p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-400/60 transition text-center relative flex flex-col items-center justify-center space-y-3 cursor-pointer">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <UploadCloud className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">
            {loading ? "Processing Batch AI Telemetry..." : (file ? file.name : "Upload CSV Account Dataset")}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Drag and drop your .csv file here or click to browse. Max 200 rows per interactive scan.
          </p>
        </div>
      </div>

      {/* Batch Results Overview */}
      {batchResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {batchResult.stored_and_retrained && (
            <div className="glass-panel p-4 rounded-xl border border-cyan-500/35 bg-cyan-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Dataset Updated & Pipeline Autotrained</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Newly audited records have been stored in <code className="text-cyan-300 font-mono text-[9px] bg-slate-900 px-1 rounded">socialguard_dataset.csv</code> (Total size: {batchResult.new_dataset_size.toLocaleString()} samples) and models are retrained.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/30 px-2.5 py-1 border border-cyan-500/30 rounded self-start sm:self-auto">
                Champion Model: {batchResult.updated_best_model}
              </span>
            </div>
          )}

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Total Analyzed</span>
              <div className="text-2xl font-extrabold font-mono text-slate-100 mt-1">
                {batchResult.total_records_processed}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <span className="text-[11px] font-mono text-rose-400">Fraudulent Accounts</span>
              <div className="text-2xl font-extrabold font-mono text-rose-300 mt-1">
                {batchResult.fraudulent_count}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="text-[11px] font-mono text-emerald-400">Genuine Accounts</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-300 mt-1">
                {batchResult.genuine_count}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
              <span className="text-[11px] font-mono text-cyan-400">Fraud Detection Rate</span>
              <div className="text-2xl font-extrabold font-mono text-cyan-300 mt-1">
                {batchResult.fraud_rate_pct}%
              </div>
            </div>
          </div>

          {/* Filter & Export Bar */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search accounts or archetype..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="all">All Verdicts</option>
                <option value="fake">Flagged Bots Only</option>
                <option value="genuine">Genuine Only</option>
              </select>
            </div>

            <button
              onClick={handleExportAuditedCSV}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audited Results (CSV)
            </button>

          </div>

          {/* Results Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950/90 text-slate-400 font-mono border-b border-slate-800 backdrop-blur-md">
                  <tr>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4 text-right">Risk Score</th>
                    <th className="py-3 px-4">Predicted Archetype</th>
                    <th className="py-3 px-4">Key Risk Factor</th>
                    <th className="py-3 px-4 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredResults.map((r, i) => {
                    const isFake = r.is_fake === 1;
                    return (
                      <tr key={i} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                          {isFake ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          )}
                          <span>@{r.account_username}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isFake ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {r.verdict}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-100">
                          {r.risk_score}
                        </td>
                        <td className="py-3 px-4 text-cyan-300 font-sans">
                          {r.predicted_archetype}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans truncate max-w-xs">
                          {r.risk_factors?.[0]?.factor || 'Normal profile'}
                        </td>
                        <td className="py-3 px-4 text-right text-indigo-300">
                          {r.confidence_pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
