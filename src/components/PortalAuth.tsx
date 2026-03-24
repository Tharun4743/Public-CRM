import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ShieldCheck, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

interface PortalAuthProps {
  children: React.ReactNode;
  portalName: string;
  role: UserRole;
}

export const PortalAuth: React.FC<PortalAuthProps> = ({ children, portalName, role }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = React.useState<null | 'email' | 'reset'>(null);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotCode, setForgotCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [forgotDevCode, setForgotDevCode] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsVerification(false);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
        }
        throw new Error(data.message || 'Invalid credentials');
      }

      // In a real app, we'd store the user/token in context or localStorage
      localStorage.setItem('user', JSON.stringify(data));
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null); setSuccessMessage(null);
    try {
      const res = await fetch('/api/users/forgot-password', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: forgotEmail }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMessage(data.message);
      if (data.devCode) { setForgotDevCode(data.devCode); setForgotCode(data.devCode); }
      setForgotStep('reset');
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const res = await fetch('/api/users/reset-password', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMessage(data.message);
      setTimeout(() => { setForgotStep(null); setSuccessMessage(null); }, 2000);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Define shared classes for better style reuse
  const inputClass = "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all text-lg text-zinc-900 font-medium placeholder:text-zinc-400";
  const labelClass = "text-base font-bold text-zinc-900 block ml-1";

  // ── Forgot Password Flow ──────────────────────────────────────────
  if (forgotStep) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 shadow-xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-2">{forgotStep === 'email' ? 'Reset Password' : 'Change Password'}</h2>
            <p className="text-zinc-500 text-sm font-semibold">{forgotStep === 'email' ? 'Enter your registered email to receive an OTP.' : `Enter the verification code sent to ${forgotEmail}.`}</p>
          </div>
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
          {successMessage && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2"><ShieldCheck size={16} />{successMessage}</div>}
          
          {forgotDevCode && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">⚠️ Delivery Interrupted — Use this OTP</p>
              <div className="text-3xl font-black text-amber-900 tracking-[0.5rem] font-mono">{forgotDevCode}</div>
            </div>
          )}

          {forgotStep === 'email' ? (
            <form onSubmit={handleForgotRequest} className="space-y-6">
              <div className="space-y-2">
                <label className={labelClass}><Mail size={16} className="inline mr-2" />Verification Email</label>
                <div className="relative"><Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" /><input required type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputClass} placeholder="officer@gov.in" /></div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
                {isLoading ? 'Sending OTP...' : 'Send OTP Request →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotReset} className="space-y-5">
              <div className="space-y-2">
                <label className={labelClass}>OTP Verification Code</label>
                <input required type="text" maxLength={6} value={forgotCode} onChange={e => setForgotCode(e.target.value)} className="w-full px-6 py-4 rounded-xl border-2 border-zinc-300 focus:border-amber-500 bg-white outline-none text-2xl text-center font-black tracking-[0.8rem]" placeholder="000000" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}><Lock size={16} className="inline mr-2" />Create New Password</label>
                <div className="relative"><Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" /><input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="New security password" minLength={6} /></div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:opacity-50">
                {isLoading ? 'Updating...' : 'Complete Password Reset →'}
              </button>
            </form>
          )}
          <button onClick={() => { setForgotStep(null); setError(null); setSuccessMessage(null); setForgotDevCode(null); }} className="w-full mt-6 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors">← Back to Login Screen</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">{portalName} Login</h2>
          <p className="text-zinc-500 mt-2">Enter your credentials to access the portal.</p>
        </div>

        {error && error.includes('pending') && error.includes('Admin') ? (
          <div className="p-8 bg-amber-50/80 rounded-2xl border border-amber-200 shadow-sm text-center space-y-4 mt-6">
             <div className="w-16 h-16 bg-white text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-amber-100">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-xl font-black text-amber-900 tracking-tight">⏳ Account Pending Approval</h3>
             <p className="text-sm font-semibold text-amber-800/80 leading-relaxed">
               Your officer account has been registered successfully. Please wait for an Admin to approve your access. Contact your department administrator if this takes more than 24 hours.
             </p>
             <button 
               onClick={() => { setError(null); setEmail(''); setPassword(''); }}
               className="mt-6 w-full py-4 bg-white text-zinc-900 rounded-xl font-black hover:bg-zinc-50 border-2 border-zinc-200 transition-all shadow-sm active:scale-95"
             >
               Return to Login
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mr-1">
                <label className={labelClass}>Password</label>
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline mb-1"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400 hover:text-emerald-600 transition-colors"
                  title={showPassword ? "Hide Password" : "Show Password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2 mt-2 ml-1"
              >
                <div className="flex items-center gap-2 text-red-600 text-sm font-bold">
                  <AlertCircle size={16} />
                  {error}
                </div>
                {needsVerification && (
                  <Link
                    to={`/register?role=${role}`}
                    className="block text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Go to verification page →
                  </Link>
                )}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : (
                <>
                  <ShieldCheck size={20} />
                  Login to Portal
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center space-y-3">
          <p className="text-sm text-zinc-500">
            First time here?{' '}
            <Link to={`/register?role=${role}`} className="text-emerald-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
          <Link to="/" className="block text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Back to Portal Selection
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
