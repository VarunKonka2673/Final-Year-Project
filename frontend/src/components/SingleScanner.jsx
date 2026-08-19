import React, { useState } from 'react';
import { API_BASE } from '../config';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Sparkles, 
  Sliders, 
  FileText, 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';

const PRESETS = {
  crypto_scam: {
    name: "Crypto Phishing Bot",
    badge: "Bot Archetype",
    data: {
      username: "binance_rewards_official_99",
      full_name: "Binance Airdrop Support",
      bio: "🔥 OFFICIAL $5,000 AIRDROP! Claim your token allocation now! Click link 👇 bit.ly/claim-crypto-now",
      recent_post: "MASSIVE GIVEAWAY! Retweet, like and submit wallet address at link to claim 500 USDT! 🚀💎",
      has_profile_pic: 0,
      is_verified: 0,
      account_age_days: 4,
      follower_count: 18,
      following_count: 4200,
      posts_count: 9,
      has_url: 1,
      has_contact_info: 0,
      posting_frequency_per_day: 38.5,
      avg_engagement_rate: 0.08,
      avg_likes_per_post: 2.0,
      avg_retweets_or_shares: 0.2,
      mention_count_avg: 7.5,
      hashtag_count_avg: 12.0,
      url_in_post_ratio: 0.95,
      active_hours_entropy: 0.45
    }
  },
  follower_farm: {
    name: "Follower Farm Bot",
    badge: "Bot Archetype",
    data: {
      username: "user_8912409",
      full_name: "User 89124",
      bio: "Follow for follow back 100%! Instant follow back within seconds 🔥",
      recent_post: "F4F fast! #followforfollow #gainwithus #followback",
      has_profile_pic: 0,
      is_verified: 0,
      account_age_days: 12,
      follower_count: 34,
      following_count: 6800,
      posts_count: 3,
      has_url: 0,
      has_contact_info: 0,
      posting_frequency_per_day: 0.1,
      avg_engagement_rate: 0.02,
      avg_likes_per_post: 1.0,
      avg_retweets_or_shares: 0.0,
      mention_count_avg: 0.2,
      hashtag_count_avg: 9.0,
      url_in_post_ratio: 0.0,
      active_hours_entropy: 1.1
    }
  },
  genuine_influencer: {
    name: "Genuine Creator / Influencer",
    badge: "Organic Profile",
    data: {
      username: "elena_design_studio",
      full_name: "Elena Rostova",
      bio: "Lead Product Designer @FinTech 🎨 | UI/UX & Design Systems | Speaker & Mentor | elenarostova.design",
      recent_post: "Just published a case study on micro-interactions in financial mobile apps! Check out the full breakdown on Medium.",
      has_profile_pic: 1,
      is_verified: 1,
      account_age_days: 1420,
      follower_count: 24800,
      following_count: 420,
      posts_count: 380,
      has_url: 1,
      has_contact_info: 1,
      posting_frequency_per_day: 0.85,
      avg_engagement_rate: 4.8,
      avg_likes_per_post: 850.0,
      avg_retweets_or_shares: 95.0,
      mention_count_avg: 0.4,
      hashtag_count_avg: 2.0,
      url_in_post_ratio: 0.15,
      active_hours_entropy: 3.45
    }
  },
  genuine_casual: {
    name: "Genuine Casual User",
    badge: "Organic Profile",
    data: {
      username: "alex_miller_24",
      full_name: "Alex Miller",
      bio: "Software developer, marathon runner, coffee addict ☕ Seattle, WA.",
      recent_post: "Great weekend trail run around Mount Rainier. Fresh air and crisp autumn colors 🌲🏃‍♂️",
      has_profile_pic: 1,
      is_verified: 0,
      account_age_days: 890,
      follower_count: 320,
      following_count: 280,
      posts_count: 145,
      has_url: 0,
      has_contact_info: 0,
      posting_frequency_per_day: 0.25,
      avg_engagement_rate: 6.5,
      avg_likes_per_post: 22.0,
      avg_retweets_or_shares: 2.0,
      mention_count_avg: 0.6,
      hashtag_count_avg: 1.0,
      url_in_post_ratio: 0.05,
      active_hours_entropy: 3.1
    }
  }
};

export default function SingleScanner() {
  const [scanMode, setScanMode] = useState('url'); // 'url' or 'attributes'
  const [profileUrl, setProfileUrl] = useState('');
  const [formData, setFormData] = useState(PRESETS.crypto_scam.data);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (key) => {
    setFormData(PRESETS[key].data);
    setResult(null);
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to scan account.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlScan = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/predict/profile-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_url: profileUrl })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.statusText}`);
      }
      const data = await response.json();
      setResult(data);
      if (data.raw_extracted_features) {
        setFormData(data.raw_extracted_features);
      }
    } catch (err) {
      setError(err.message || 'Failed to scan profile link.');
    } finally {
      setLoading(false);
    }
  };

  // Compute color scheme based on risk
  const getRiskColor = (score) => {
    if (score >= 75) return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', glow: 'glow-border-rose' };
    if (score >= 45) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', glow: 'border-amber-500/40' };
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', glow: 'glow-border-emerald' };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner & Preset Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Live Account Risk Inspector
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Test social media profiles against our hybrid 6-model ensemble, NLP spam analyzer, and Isolation Forest engine.
            </p>
          </div>

          {/* Quick Archetype Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Load Archetype Preset:</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Mode Tabs */}
      <div className="flex border-b border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setScanMode('url')}
          className={`px-6 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all duration-200 ${
            scanMode === 'url'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🔍 Profile Link Analyzer
        </button>
        <button
          type="button"
          onClick={() => setScanMode('attributes')}
          className={`px-6 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all duration-200 ${
            scanMode === 'attributes'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚙️ Detailed Attributes Form
        </button>
      </div>

      {/* Main Grid: Input Form & Result Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Section (5 cols) */}
        {scanMode === 'url' ? (
          <form onSubmit={handleUrlScan} className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Profile Link Scanner
                </span>
                <span className="text-[11px] font-mono text-slate-400">ML Heuristic Crawler</span>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Paste Social Profile URL</label>
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400 font-mono placeholder:text-slate-600"
                  placeholder="e.g. https://x.com/elonmusk"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Supports X/Twitter, Instagram, Facebook, LinkedIn, TikTok, and Reddit. Parses profile metadata and runs semantic ML checks to detect artificial accounts.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Profile Metadata...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Scan Profile Link</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleScan} className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Account Attributes & Metrics
                </span>
                <span className="text-[11px] font-mono text-slate-400">Input Feature Vector</span>
              </div>

              {/* Profile & Handle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Username Handle</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="e.g. crypto_bot_99"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* Bio Text (NLP Target) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Account Bio Description</span>
                  <span className="text-[10px] text-cyan-400 font-mono">NLP Keyword & Sentiment Scan</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                  placeholder="Enter user bio..."
                />
              </div>

              {/* Recent Post Sample */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Recent Post / Tweet Snippet</span>
                  <span className="text-[10px] text-indigo-400 font-mono">TF-IDF Vectorized</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.recent_post}
                  onChange={(e) => handleInputChange('recent_post', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                  placeholder="Enter latest sample post..."
                />
              </div>

              {/* Numeric Sliders & Indicators */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Followers</label>
                  <input
                    type="number"
                    value={formData.follower_count}
                    onChange={(e) => handleInputChange('follower_count', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Following</label>
                  <input
                    type="number"
                    value={formData.following_count}
                    onChange={(e) => handleInputChange('following_count', parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Age (Days)</label>
                  <input
                    type="number"
                    value={formData.account_age_days}
                    onChange={(e) => handleInputChange('account_age_days', parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Behavioural Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Posts / Day</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.posting_frequency_per_day}
                    onChange={(e) => handleInputChange('posting_frequency_per_day', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Engagement Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.avg_engagement_rate}
                    onChange={(e) => handleInputChange('avg_engagement_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_profile_pic === 1}
                    onChange={(e) => handleInputChange('has_profile_pic', e.target.checked ? 1 : 0)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                  />
                  <span>Has Avatar</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_verified === 1}
                    onChange={(e) => handleInputChange('is_verified', e.target.checked ? 1 : 0)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                  />
                  <span>Verified Badge</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_url === 1}
                    onChange={(e) => handleInputChange('has_url', e.target.checked ? 1 : 0)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                  />
                  <span>Bio Link URL</span>
                </label>
              </div>

              {/* Scan Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Running Hybrid AI Matrix...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Execute Fraud & Bot Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Right Column: Dynamic Diagnosis & Multi-Model Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu className="w-8 h-8 animate-pulse-slow" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Awaiting Account Telemetry</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Select a preset archetype above or fill in custom parameters to run real-time classification.
                </p>
              </div>
              <button
                type="button"
                onClick={handleScan}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-cyan-500/30"
              >
                Scan Preset Account Now
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Verdict Header Hero Card */}
              {(() => {
                const colors = getRiskColor(result.risk_score);
                const isFake = result.is_fake === 1;
                return (
                  <div className={`glass-panel p-6 rounded-2xl border ${colors.border} ${colors.glow} relative overflow-hidden`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Verdict Text */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {result.risk_level} RISK LEVEL
                          </span>
                          {result.platform && (
                            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                              Platform: {result.platform}
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400">
                            Archetype: <span className="text-cyan-300 font-semibold">{result.predicted_archetype}</span>
                          </span>
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 pt-1">
                          {isFake ? (
                            <>
                              <ShieldAlert className="w-7 h-7 text-rose-400" />
                              <span className="text-rose-300">Fraudulent / Bot Account Flagged</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-7 h-7 text-emerald-400" />
                              <span className="text-emerald-300">Genuine / Organic User Verified</span>
                            </>
                          )}
                        </h3>
                        <p className="text-xs text-slate-300">
                          {result.risk_badge} — Ensemble Confidence: <strong className="font-mono text-cyan-300">{result.confidence_pct}%</strong>
                        </p>
                      </div>

                      {/* Right: Circular Gauge */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-800"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={isFake ? 'text-rose-500' : 'text-emerald-500'}
                              strokeDasharray={`${result.risk_score}, 100`}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-lg font-extrabold font-mono text-white leading-none">
                              {Math.round(result.risk_score)}
                            </span>
                            <span className="text-[9px] uppercase font-mono text-slate-400">Risk</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* Contributing Explainability Factors */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Key Behavioral & NLP Risk Factors
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.risk_factors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5">
                      {factor.severity === 'CRITICAL' && <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />}
                      {factor.severity === 'HIGH' && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />}
                      {factor.severity === 'MEDIUM' && <HelpCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />}
                      {factor.severity === 'SAFE' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{factor.factor}</div>
                        <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{factor.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Model Ensemble Consensus Arena */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    Individual Model Classifier Breakdown
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">6 Models Evaluated</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.model_breakdown).map(([modelName, data]) => {
                    const isModelFake = data.is_fake === 1;
                    return (
                      <div key={modelName} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
                        <div className="text-xs font-semibold text-slate-300">{modelName}</div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isModelFake ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {data.prediction}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {data.fake_probability}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Radar Normalized Metrics */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Normalized Risk Vector Indices (0 - 100)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.radar_metrics).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 mb-1">{key}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-200 w-8 text-right">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
