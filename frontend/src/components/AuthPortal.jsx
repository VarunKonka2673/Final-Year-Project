import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Cpu,
  Layers,
  Info
} from 'lucide-react';

export default function AuthPortal() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Authentication failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background cyber ambient gradients & grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/70 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#080d18] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                SocialGuard AI
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Enterprise Fraud Account Detection Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-400">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>RBAC Protected Access</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Portal Gate */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10">
        <div className="w-full max-w-md bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 space-y-6">

          {/* Portal Title & Subtitle */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {mode === 'login' ? 'Authentication Required' : 'Register New User'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {mode === 'login' 
                ? 'Sign in to access SocialGuard telemetry, fraud predictors, and forensic audit.' 
                : 'Create your account to unlock the Predict / Inspector and Personal Search History.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-cyan-500/40 shadow-md transition duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center">
            <div className="flex-1 border-t border-slate-800" />
            <span className="px-3 text-[10px] font-mono text-slate-400 uppercase">or with email</span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to SocialGuard' : 'Register User Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Access & Security Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-start gap-2.5 text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="leading-snug text-[11px]">
              <span className="text-slate-300 font-semibold">Security Notice:</span> Access to forensic detection modules is governed by Role-Based Access Control (RBAC). All standard registrations are provisioned with User inspection clearance.
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-4 text-xs text-slate-400 text-center font-mono">
        <p>SocialGuard AI Sentinel — Final Year Project | IEEE ML + NLP Fraud Detection Framework</p>
      </footer>

    </div>
  );
}
