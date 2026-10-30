import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import FeedbackCard from './FeedbackCard';
import { saveScanHistory, syncCollectedProfileToFirestore, syncAllCollectedProfilesToFirestore } from '../services/historyService';
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
  Cpu,
  Share2,
  Link2,
  ExternalLink,
  Globe,
  Calendar,
  Users,
  RotateCw,
  Download
} from 'lucide-react';

const SAMPLE_PROFILE_LINKS = [
  { label: "Cristiano (IG)", url: "https://www.instagram.com/cristiano/", platform: "Instagram" },
  { label: "Elon Musk (X)", url: "https://x.com/elonmusk", platform: "X / Twitter" },
  { label: "NASA (X)", url: "https://twitter.com/NASA", platform: "X / Twitter" },
  { label: "Bill Gates (LinkedIn)", url: "https://www.linkedin.com/in/williamhgates/", platform: "LinkedIn" },
  { label: "MKBHD (YouTube)", url: "https://www.youtube.com/@mkbhd", platform: "YouTube" },
  { label: "Phishing Bot (Scam)", url: "https://x.com/crypto_giveaway_bot_999", platform: "X / Twitter" }
];

const PRESETS = {
  crypto_scam: {
    name: "Crypto Phishing Bot",
    badge: "Bot Archetype",
    data: {
      platform: "X / Twitter",
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
      platform: "Instagram",
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
      platform: "LinkedIn",
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
      platform: "Instagram",
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

const INITIAL_BLANK_FORM = {
  platform: 'Instagram',
  username: '',
  full_name: '',
  display_name: '',
  headline: '',
  bio: '',
  recent_post: '',
  follower_count: '',
  followers: '',
  following_count: '',
  following: '',
  account_age_days: '',
  posts_count: '',
  media_count: '',
  video_count: '',
  tweet_count: '',
  connections: '',
  likes_count: '',
  experience_count: '',
  education_count: '',
  posting_frequency_per_day: '',
  avg_engagement_rate: '',
  has_profile_pic: 0,
  is_verified: 0,
  has_url: 0,
  is_premium: 0,
  is_private: 0,
};

const convertNumericToString = (data) => {
  if (!data) return { ...INITIAL_BLANK_FORM };
  const cloned = { ...INITIAL_BLANK_FORM, ...data };

  if (data.username !== undefined && data.username !== null) cloned.username = String(data.username);
  if (data.platform !== undefined && data.platform !== null) cloned.platform = String(data.platform);
  if (data.full_name || data.display_name) {
    cloned.full_name = String(data.full_name || data.display_name || '');
    cloned.display_name = cloned.full_name;
  }
  if (data.headline !== undefined && data.headline !== null) cloned.headline = String(data.headline);
  if (data.bio !== undefined && data.bio !== null) cloned.bio = String(data.bio);
  if (data.recent_post !== undefined && data.recent_post !== null) cloned.recent_post = String(data.recent_post);

  // Normalize followers
  const followersVal = data.follower_count ?? data.followers ?? '';
  cloned.follower_count = followersVal !== '' ? String(followersVal) : '';
  cloned.followers = followersVal !== '' ? String(followersVal) : '';

  // Normalize following
  const followingVal = data.following_count ?? data.following ?? '';
  cloned.following_count = followingVal !== '' ? String(followingVal) : '';
  cloned.following = followingVal !== '' ? String(followingVal) : '';

  // Normalize posts
  const postsVal = data.posts_count ?? data.media_count ?? data.video_count ?? data.tweet_count ?? '';
  cloned.posts_count = postsVal !== '' ? String(postsVal) : '';
  cloned.media_count = postsVal !== '' ? String(postsVal) : '';
  cloned.video_count = postsVal !== '' ? String(postsVal) : '';
  cloned.tweet_count = postsVal !== '' ? String(postsVal) : '';

  // Numerical metrics
  const numericFields = [
    'account_age_days',
    'connections', 'likes_count',
    'experience_count', 'education_count',
    'posting_frequency_per_day', 'avg_engagement_rate'
  ];
  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      cloned[field] = String(data[field]);
    }
  });

  // Boolean toggles
  cloned.has_profile_pic = Number(data.has_profile_pic || 0);
  cloned.is_verified = Number(data.is_verified || 0);
  cloned.has_url = Number(data.has_url || 0);
  cloned.is_private = Number(data.is_private || 0);
  cloned.is_premium = Number(data.is_premium || 0);

  return cloned;
};

const validateField = (field, value) => {
  if (value === undefined || value === null || value === '') return null;
  const valStr = String(value).trim();
  if (valStr === '') return null;

  if (field === 'posting_frequency_per_day' || field === 'avg_engagement_rate') {
    if (!/^\d*\.?\d*$/.test(valStr) || valStr === '.') {
      return 'Enter valid data';
    }
  } else {
    if (!/^\d+$/.test(valStr)) {
      return 'Enter valid data';
    }
  }
  return null;
};

const getLocalStorageValue = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading localStorage", e);
  }
  return fallback;
};

export default function SingleScanner() {
  const { currentUser, isAdmin } = useAuth();
  // Always default to 'url' mode so link analyzer is prominently visible
  const [scanMode, setScanMode] = useState('url');
  const [profileUrl, setProfileUrl] = useState(() => getLocalStorageValue('sg_profileUrl', ''));
  const [formData, setFormData] = useState(() => getLocalStorageValue('sg_formData', INITIAL_BLANK_FORM));
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => getLocalStorageValue('sg_result', null));
  const [error, setError] = useState(null);
  const [extractedProfile, setExtractedProfile] = useState(() => getLocalStorageValue('sg_extractedProfile', null));
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(null);


  // Purge any legacy 'attributes' mode saved in browser localStorage
  useEffect(() => {
    localStorage.removeItem('sg_scanMode');
    // Ensure all existing collected extractor profiles are synced to Firebase Firestore without duplicates
    syncAllCollectedProfilesToFirestore(currentUser);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sg_profileUrl', JSON.stringify(profileUrl));
  }, [profileUrl]);

  useEffect(() => {
    localStorage.setItem('sg_formData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('sg_result', JSON.stringify(result));
  }, [result]);

  useEffect(() => {
    localStorage.setItem('sg_extractedProfile', JSON.stringify(extractedProfile));
  }, [extractedProfile]);

  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem('sg_scanMode');
      localStorage.removeItem('sg_profileUrl');
      localStorage.removeItem('sg_formData');
      localStorage.removeItem('sg_result');
      localStorage.removeItem('sg_extractedProfile');
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const handleClearUrlData = () => {
    setProfileUrl('');
    setExtractedProfile(null);
    setResult(null);
    setError(null);
    localStorage.removeItem('sg_profileUrl');
    localStorage.removeItem('sg_extractedProfile');
    localStorage.removeItem('sg_result');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInputChange = (field, value) => {
    handleInputChange(field, value);

    const errorMsg = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: errorMsg
    }));

    if (field === 'follower_count') {
      handleInputChange('followers', value);
      setValidationErrors(prev => ({ ...prev, followers: errorMsg }));
    } else if (field === 'following_count') {
      handleInputChange('following', value);
      setValidationErrors(prev => ({ ...prev, following: errorMsg }));
    } else if (field === 'posts_count') {
      handleInputChange('media_count', value);
      handleInputChange('video_count', value);
      handleInputChange('tweet_count', value);
      setValidationErrors(prev => ({
        ...prev,
        media_count: errorMsg,
        video_count: errorMsg,
        tweet_count: errorMsg
      }));
    }
  };


  const applyPreset = (key) => {
    setFormData(convertNumericToString(PRESETS[key].data));
    setResult(null);
    setValidationErrors({});
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const currentErrors = {};
    const numericFields = [
      'follower_count', 'followers',
      'following_count', 'following',
      'account_age_days',
      'posts_count', 'media_count', 'video_count', 'tweet_count',
      'connections', 'likes_count',
      'experience_count', 'education_count',
      'posting_frequency_per_day', 'avg_engagement_rate'
    ];

    numericFields.forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) {
        currentErrors[field] = err;
      }
    });

    if (Object.keys(currentErrors).length > 0) {
      setValidationErrors(currentErrors);
      setError('Please fix all validation errors before running analysis.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      numericFields.forEach(field => {
        if (payload[field] !== undefined && payload[field] !== null) {
          const valStr = String(payload[field]).trim();
          if (valStr === '') {
            payload[field] = 0.0;
          } else {
            payload[field] = parseFloat(valStr) || 0.0;
          }
        } else {
          payload[field] = 0.0;
        }
      });

      const defaults = {
        connections: 0.0,
        likes_count: 0.0,
        experience_count: 0,
        education_count: 0,
        follower_count: 0.0,
        following_count: 0.0,
        account_age_days: 0.0,
        posts_count: 0.0
      };
      Object.entries(defaults).forEach(([key, fallback]) => {
        if (payload[key] === undefined || payload[key] === null) {
          payload[key] = fallback;
        }
      });

      const response = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Auto-save to User Scan History
      try {
        const histItem = await saveScanHistory({
          target: formData.username ? `@${formData.username}` : 'Manual Attribute Scan',
          username: formData.username,
          scan_mode: 'attributes',
          platform: formData.platform,
          result: data,
          profile_url: null
        }, currentUser);
        data.historyId = histItem.id;
      } catch (histErr) {
        console.warn("History save error:", histErr);
      }

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

      // Auto-save to User Scan History
      try {
        const histItem = await saveScanHistory({
          target: profileUrl,
          username: data.extracted_username || data.account_username,
          scan_mode: 'url',
          platform: data.platform || 'Generic',
          result: data,
          profile_url: profileUrl,
          raw_extracted_features: data.raw_extracted_features
        }, currentUser);
        data.historyId = histItem.id;
      } catch (histErr) {
        console.warn("History save error:", histErr);
      }

      // Auto-save newly collected profile to Firebase Cloud Firestore (zero duplicate IDs)
      try {
        await syncCollectedProfileToFirestore({
          ...(data.raw_extracted_features || {}),
          username: data.extracted_username || data.account_username,
          profile_url: profileUrl,
          platform: data.platform,
          is_fake: data.is_fake,
          risk_score: data.risk_score,
          bot_archetype: data.predicted_archetype
        }, currentUser);
      } catch (cloudErr) {
        console.warn("Cloud sync note:", cloudErr);
      }

      setResult(data);
      if (data.raw_extracted_features) {
        setExtractedProfile(data.raw_extracted_features);
        setFormData(convertNumericToString(data.raw_extracted_features));
        // Explicitly stay on 'url' mode so the extracted telemetry card is immediately visible!
        setScanMode('url');
        setValidationErrors({});
      }
    } catch (err) {
      setError(err.message || 'Failed to scan profile link.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrainWithCollected = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/api/collector/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error('Failed to retrain models with collected data.');
      }
      const data = await response.json();
      setRetrainSuccess(`Models successfully retrained on ${data.total_training_samples} samples! Best: ${data.best_model}`);
      // Re-scan current profile link to update live predictions
      if (profileUrl) {
        await handleUrlScan();
      }
    } catch (err) {
      setError(err.message || 'Retraining failed.');
    } finally {
      setRetraining(false);
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
          className={`px-6 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all duration-200 ${scanMode === 'url'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          🔍 Profile Link Analyzer
        </button>
        <button
          type="button"
          onClick={() => setScanMode('attributes')}
          className={`px-6 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all duration-200 ${scanMode === 'attributes'
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
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleUrlScan} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Profile Link Scanner
                </span>
                <span className="text-[11px] font-mono text-slate-400">ML Heuristic Crawler</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Paste Social Profile Link or Handle</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400 font-mono placeholder:text-slate-600"
                    placeholder="e.g. https://instagram.com/cristiano or @elonmusk"
                    required
                  />
                  {profileUrl && (
                    <button
                      type="button"
                      onClick={handleClearUrlData}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Clear URL and results"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Supports X/Twitter, Instagram, YouTube, LinkedIn, Facebook, TikTok, Reddit, and direct handles.
                </p>
              </div>

              {/* Quick Sample Links */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-2">Quick Test Samples:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PROFILE_LINKS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfileUrl(sample.url);
                        setError(null);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3 text-cyan-400" />
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Fetching Profile Telemetry & Running ML...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Extract & Analyze Profile Link</span>
                  </>
                )}
              </button>
            </form>

            {/* Extracted Profile Telemetry Preview Card */}
            {extractedProfile && (
              <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-slate-900/95 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Extracted Profile Telemetry
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    extractedProfile.extraction_status === 'LIVE_SCRAPE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {extractedProfile.extraction_status === 'LIVE_SCRAPE' ? '● Live Public Scraped' : '● Neural Profile Crawler'}
                  </span>
                </div>

                {/* Profile Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    {extractedProfile.profile_pic ? (
                      <img
                        src={extractedProfile.profile_pic}
                        alt={extractedProfile.username}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md bg-slate-800"
                      />
                    ) : null}
                    <div
                      style={{ display: extractedProfile.profile_pic ? 'none' : 'flex' }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/80 to-purple-600/80 border-2 border-slate-700 shadow-md items-center justify-center text-lg font-bold text-white uppercase"
                    >
                      {(extractedProfile.full_name || extractedProfile.display_name || extractedProfile.username || 'U')[0]}
                    </div>
                    {extractedProfile.is_verified === 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 p-0.5 rounded-full shadow" title="Verified Badge">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {extractedProfile.full_name || extractedProfile.display_name || extractedProfile.username}
                      </h4>
                      {extractedProfile.is_verified === 1 && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-semibold">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-cyan-400">@{extractedProfile.username}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                        {extractedProfile.platform}
                      </span>
                      {extractedProfile.account_age_days && (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {Math.round(extractedProfile.account_age_days)} days old
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Headline text (especially for LinkedIn / Professional profiles) */}
                {extractedProfile.headline && (
                  <div className="text-xs text-cyan-300 font-medium leading-relaxed bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 block mb-0.5">Headline</span>
                    {extractedProfile.headline}
                  </div>
                )}

                {/* Bio text */}
                {extractedProfile.bio && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 italic">
                    "{extractedProfile.bio}"
                  </div>
                )}

                {/* Metrics Grid: 4 columns for LinkedIn (Connections, Followers, Following, Posts), 3 for others */}
                {extractedProfile.platform === 'LinkedIn' ? (
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Connections</div>
                      <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                        {Number(extractedProfile.connections || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Followers</div>
                      <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                        {Number(extractedProfile.follower_count || extractedProfile.followers || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Following</div>
                      <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                        {Number(extractedProfile.following_count || extractedProfile.following || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Posts</div>
                      <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                        {Number(extractedProfile.posts_count || extractedProfile.media_count || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Followers</div>
                      <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                        {Number(extractedProfile.follower_count || extractedProfile.followers || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Following</div>
                      <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                        {Number(extractedProfile.following_count || extractedProfile.following || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {extractedProfile.platform === 'YouTube' ? 'Videos' : extractedProfile.platform === 'X / Twitter' ? 'Tweets' : 'Posts'}
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                        {Number(extractedProfile.posts_count || extractedProfile.media_count || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Collected Data Training Banner & One-Click Retrain Action - ADMIN ONLY */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5" title="Saved locally to collected_profiles.csv and synchronized to Firebase Cloud Firestore">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Saved to Dataset & Firebase Cloud
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`${API_BASE}/api/collector/download`}
                          download="collected_profiles.csv"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Download collected_profiles.csv"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>Export CSV</span>
                        </a>
                        <button
                          type="button"
                          disabled={retraining}
                          onClick={handleRetrainWithCollected}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {retraining ? (
                            <>
                              <div className="w-3 h-3 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin"></div>
                              <span>Retraining 6 Models...</span>
                            </>
                          ) : (
                            <>
                              <RotateCw className="w-3 h-3 text-cyan-400" />
                              <span>Retrain Models</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {retrainSuccess && (
                      <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg animate-fadeIn flex items-center justify-between">
                        <span>✓ {retrainSuccess}</span>
                        <button
                          type="button"
                          onClick={() => setRetrainSuccess(null)}
                          className="text-slate-400 hover:text-slate-200 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Switch to manual 40 attributes form - AVAILABLE TO ALL USERS */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Want to inspect or tweak all 40 attributes?</span>
                  <button
                    type="button"
                    onClick={() => setScanMode('attributes')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Open Attributes Form →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleScan} className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Account Attributes & Metrics
                </span>
                <button
                  type="button"
                  onClick={() => setScanMode('url')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
                >
                  ← Back to Link Scanner
                </button>
              </div>

              {extractedProfile && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">Populated from:</span>
                    <span className="text-slate-200 font-mono">@{extractedProfile.username} ({extractedProfile.platform})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScanMode('url')}
                    className="text-cyan-400 underline hover:text-cyan-300 cursor-pointer text-[11px]"
                  >
                    View Link Card
                  </button>
                </div>
              )}

              {/* Profile & Handle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Platform</label>
                  <select
                    value={formData.platform || 'Instagram'}
                    onChange={(e) => handleInputChange('platform', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="X / Twitter">X / Twitter</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Reddit">Reddit</option>
                    <option value="Generic Web">Generic Web</option>
                  </select>
                </div>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {formData.platform === 'X / Twitter' ? 'Display Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.full_name || formData.display_name || ''}
                    onChange={(e) => {
                      handleInputChange('full_name', e.target.value);
                      handleInputChange('display_name', e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {formData.platform === 'LinkedIn' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Headline</label>
                  <input
                    type="text"
                    value={formData.headline || ''}
                    onChange={(e) => handleInputChange('headline', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Senior Software Engineer at Google"
                  />
                </div>
              )}

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
                  placeholder="Enter latest sample post or tweet text..."
                />
              </div>

              {/* Numeric Sliders & Indicators */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {formData.platform === 'YouTube' ? 'Subscribers' : 'Followers'}
                  </label>
                  <input
                    type="text"
                    value={formData.follower_count ?? ''}
                    onChange={(e) => handleNumericInputChange('follower_count', e.target.value)}
                    placeholder="e.g. 1500"
                    className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.follower_count
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-700 focus:border-cyan-400'
                      }`}
                  />
                  {validationErrors.follower_count && (
                    <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.follower_count}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Following</label>
                  <input
                    type="text"
                    value={formData.following_count ?? ''}
                    onChange={(e) => handleNumericInputChange('following_count', e.target.value)}
                    placeholder="e.g. 500"
                    className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.following_count
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-700 focus:border-cyan-400'
                      }`}
                  />
                  {validationErrors.following_count && (
                    <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.following_count}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Age (Days)</label>
                  <input
                    type="text"
                    value={formData.account_age_days ?? ''}
                    onChange={(e) => handleNumericInputChange('account_age_days', e.target.value)}
                    placeholder="e.g. 365"
                    className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.account_age_days
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-700 focus:border-cyan-400'
                      }`}
                  />
                  {validationErrors.account_age_days && (
                    <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.account_age_days}</span>
                  )}
                </div>
              </div>

              {/* Dynamic Posts/Tweets/Videos & Platform-Specific Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {formData.platform === 'LinkedIn' ? 'Posts' :
                      formData.platform === 'X / Twitter' ? 'Tweets' :
                        formData.platform === 'YouTube' ? 'Videos' :
                          formData.platform === 'TikTok' ? 'Videos' : 'Posts'}
                  </label>
                  <input
                    type="text"
                    value={formData.posts_count ?? ''}
                    onChange={(e) => handleNumericInputChange('posts_count', e.target.value)}
                    placeholder="e.g. 150"
                    className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.posts_count
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-700 focus:border-cyan-400'
                      }`}
                  />
                  {validationErrors.posts_count && (
                    <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.posts_count}</span>
                  )}
                </div>

                {formData.platform === 'LinkedIn' ? (
                  <>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Connections</label>
                      <input
                        type="text"
                        value={formData.connections ?? ''}
                        onChange={(e) => handleNumericInputChange('connections', e.target.value)}
                        placeholder="e.g. 500"
                        className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.connections
                            ? 'border-rose-500/60 focus:border-rose-500'
                            : 'border-slate-700 focus:border-cyan-400'
                          }`}
                      />
                      {validationErrors.connections && (
                        <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.connections}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Experience (Jobs)</label>
                      <input
                        type="text"
                        value={formData.experience_count ?? ''}
                        onChange={(e) => handleNumericInputChange('experience_count', e.target.value)}
                        placeholder="e.g. 3"
                        className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.experience_count
                            ? 'border-rose-500/60 focus:border-rose-500'
                            : 'border-slate-700 focus:border-cyan-400'
                          }`}
                      />
                      {validationErrors.experience_count && (
                        <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.experience_count}</span>
                      )}
                    </div>
                  </>
                ) : formData.platform === 'TikTok' ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Likes Count</label>
                    <input
                      type="text"
                      value={formData.likes_count ?? ''}
                      onChange={(e) => handleNumericInputChange('likes_count', e.target.value)}
                      placeholder="e.g. 10000"
                      className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.likes_count
                          ? 'border-rose-500/60 focus:border-rose-500'
                          : 'border-slate-700 focus:border-cyan-400'
                        }`}
                    />
                    {validationErrors.likes_count && (
                      <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.likes_count}</span>
                    )}
                  </div>
                ) : null}
              </div>

              {formData.platform === 'LinkedIn' && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Education (Degrees)</label>
                    <input
                      type="text"
                      value={formData.education_count ?? ''}
                      onChange={(e) => handleNumericInputChange('education_count', e.target.value)}
                      placeholder="e.g. 1"
                      className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.education_count
                          ? 'border-rose-500/60 focus:border-rose-500'
                          : 'border-slate-700 focus:border-cyan-400'
                        }`}
                    />
                    {validationErrors.education_count && (
                      <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.education_count}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Behavioural Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Posts / Day</label>
                  <input
                    type="text"
                    value={formData.posting_frequency_per_day ?? ''}
                    onChange={(e) => handleNumericInputChange('posting_frequency_per_day', e.target.value)}
                    placeholder="e.g. 2.5"
                    className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.posting_frequency_per_day
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-700 focus:border-cyan-400'
                      }`}
                  />
                  {validationErrors.posting_frequency_per_day && (
                    <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.posting_frequency_per_day}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Engagement Rate (%)</label>
                  <input
                    type="text"
                    value={formData.avg_engagement_rate ?? ''}
                    onChange={(e) => handleNumericInputChange('avg_engagement_rate', e.target.value)}
                    placeholder="e.g. 4.8"
                    className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-slate-100 font-mono transition-colors focus:outline-none ${validationErrors.avg_engagement_rate
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-700 focus:border-cyan-400'
                      }`}
                  />
                  {validationErrors.avg_engagement_rate && (
                    <span className="text-[10px] text-rose-400 mt-1 block">⚠️ {validationErrors.avg_engagement_rate}</span>
                  )}
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
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
                {formData.platform === 'LinkedIn' ? (
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_premium === 1}
                      onChange={(e) => handleInputChange('is_premium', e.target.checked ? 1 : 0)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                    />
                    <span>Is Premium</span>
                  </label>
                ) : (
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_private === 1}
                      onChange={(e) => handleInputChange('is_private', e.target.checked ? 1 : 0)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                    />
                    <span>Is Private</span>
                  </label>
                )}
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

              {/* Inspected Account Identity & Extracted Telemetry Card */}
              {(() => {
                const telemetry = result.raw_extracted_features || extractedProfile || formData;
                const username = result.extracted_username || result.account_username || formData.username;
                const fullName = telemetry.full_name || telemetry.display_name || formData.full_name || formData.display_name || username;
                const platform = result.platform || formData.platform || telemetry.platform || 'Social Profile';
                const profilePic = telemetry.profile_pic || (telemetry.has_profile_pic === 0 || formData.has_profile_pic === 0 ? '' : null);
                const isVerified = (telemetry.is_verified === 1 || formData.is_verified === 1);
                const bio = telemetry.bio || formData.bio;
                const headline = telemetry.headline || formData.headline;
                const followers = telemetry.follower_count ?? telemetry.followers ?? formData.follower_count;
                const following = telemetry.following_count ?? telemetry.following ?? formData.following_count;
                const posts = telemetry.posts_count ?? formData.posts_count;
                const ageDays = telemetry.account_age_days ?? formData.account_age_days;

                return (
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        Inspected Account Identity & Profile Details
                      </span>
                      {result.profile_url ? (
                        <a
                          href={result.profile_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                        >
                          <span>{result.profile_url.length > 35 ? `${result.profile_url.slice(0, 35)}...` : result.profile_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Direct Attribute Scan
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Avatar with fallback initial letter if no picture or failed */}
                      <div className="relative flex-shrink-0">
                        {profilePic ? (
                          <img
                            src={profilePic}
                            alt={username}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md bg-slate-800"
                          />
                        ) : null}
                        <div
                          style={{ display: profilePic ? 'none' : 'flex' }}
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/80 to-purple-600/80 border-2 border-slate-700 shadow-md items-center justify-center text-xl font-bold text-white uppercase"
                        >
                          {(fullName || username || 'U')[0]}
                        </div>
                        {isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 p-0.5 rounded-full shadow" title="Verified Badge">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-100 truncate">
                            {fullName}
                          </h4>
                          {isVerified && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-semibold">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-cyan-400 mt-0.5">@{username}</div>
                        
                        {headline && (
                          <div className="text-xs text-indigo-300 font-medium mt-1 truncate">
                            {headline}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                            {platform}
                          </span>
                          {ageDays ? (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {Math.round(Number(ageDays))} days active
                            </span>
                          ) : null}
                          {telemetry.connections ? (
                            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {telemetry.connections}+ connections
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {bio && (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 italic">
                        "{bio}"
                      </div>
                    )}

                    {/* Extracted Metrics Bar */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">
                          {platform === 'YouTube' ? 'Subscribers' : 'Followers'}
                        </div>
                        <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                          {Number(followers || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">Following</div>
                        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                          {Number(following || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">
                          {platform === 'YouTube' ? 'Videos' : platform === 'X / Twitter' ? 'Tweets' : 'Posts'}
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                          {Number(posts || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 col-span-3 sm:col-span-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">Ratio</div>
                        <div className="text-sm font-bold font-mono text-purple-300 mt-0.5">
                          {following > 0 ? (followers / following).toFixed(1) : 'N/A'}x
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Community Feedback & Model Retraining Card */}
              <FeedbackCard
                result={result}
                profileUrl={scanMode === 'url' ? profileUrl : (result.profile_url || '')}
                username={formData.username || result.extracted_username || result.account_username}
                platform={formData.platform || result.platform}
                historyId={result.historyId}
              />

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
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isModelFake ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
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



            </div>
          )}

        </div>

      </div>

    </div>
  );
}
