import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
    } catch (err) {
      setError(err.message || `Failed to ${mode}. Please check your credentials.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background highlights */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] flex items-center justify-center shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-[#080d18] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              SocialGuard Identity & RBAC
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Role-Based Access Control Protected
            </p>
          </div>
        </div>

        {/* Tab switch between Sign In & Register */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
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
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Primary Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-cyan-500/40 shadow-md transition duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-[11px] font-mono text-slate-400 uppercase">or with email</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Account' : 'Register & Get Started'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security & Access Information */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-2 text-slate-400 leading-relaxed">
            <Lock className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>
              <strong className="text-slate-300">RBAC Clearance:</strong> Standard registrations create verified User accounts. Administrative rights are managed internally by administrators.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
