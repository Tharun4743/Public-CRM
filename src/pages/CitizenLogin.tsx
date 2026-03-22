import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Lock, Phone, MapPin, ArrowRight, ShieldCheck, 
  AlertCircle, UserPlus, LogIn, Eye, EyeOff, Star 
} from 'lucide-react';

export const CitizenLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  // Forgot password states
  const [forgotStep, setForgotStep] = useState<null | 'email' | 'reset'>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/citizen-dashboard';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ward: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/citizens/login' : '/api/citizens/register';
      console.log(`[LOGIN] Attempting ${endpoint} with:`, { email: formData.email, password: '***' });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log(`[LOGIN] Response status:`, response.status);
      const data = await response.json();
      console.log(`[LOGIN] Response data:`, data);

      if (response.ok) {
        if (!isLogin) {
          setIsVerifying(true);
          setSuccessMessage(data.message);
          if (data.devCode) {
            setDevCode(data.devCode);
            setVerificationCode(data.devCode); // auto-fill OTP field
          }
        } else {
          localStorage.setItem('citizen_token', data.token);
          navigate(redirectPath);
        }
      } else {
        if (data.needsVerification) {
          setIsVerifying(true);
          setError(data.message);
        } else {
          setError(data.message || (isLogin ? 'Authentication failed' : 'Registration failed'));
        }
      }
    } catch (err) {
      console.error('[LOGIN] Network error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Network error. Server may be starting up. Please wait 30 seconds and try again.");
      } else if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check your internet connection.");
      } else {
        setError("Connection error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/citizens/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      localStorage.setItem('citizen_token', data.token);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/citizens/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }
      setSuccessMessage(data.message || 'A new verification code has been sent!');
      if (data.devCode) {
        setDevCode(data.devCode);
        setVerificationCode(data.devCode);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-zinc-50/50 outline-none transition-all text-base text-zinc-900 font-medium placeholder:text-zinc-400";
  const labelClass = "text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block ml-1";

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null); setSuccessMessage(null);
    try {
      const res = await fetch('/api/citizens/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
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
      const res = await fetch('/api/citizens/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMessage(data.message);
      setTimeout(() => { setForgotStep(null); setIsLogin(true); setSuccessMessage(null); }, 2000);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  // ── Forgot Password Flow ──────────────────────────────────────────
  if (forgotStep) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">🔐</div>
            <h2 className="text-3xl font-black text-zinc-950 tracking-tight leading-none mb-3">{forgotStep === 'email' ? 'Forgot Password' : 'Reset Password'}</h2>
            <p className="text-zinc-500 text-sm">{forgotStep === 'email' ? 'Enter your registered email to receive an OTP.' : `Enter the OTP sent to ${forgotEmail} and your new password.`}</p>
          </div>
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-black uppercase tracking-widest flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
          {successMessage && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16} />{successMessage}</div>}
          {forgotDevCode && (
            <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">⚠️ Email failed — Use this OTP</p>
              <div className="text-3xl font-black text-amber-900 tracking-[0.5rem] font-mono">{forgotDevCode}</div>
            </div>
          )}
          {forgotStep === 'email' ? (
            <form onSubmit={handleForgotRequest} className="space-y-6">
              <div className="space-y-2">
                <label className={labelClass}><Mail size={12} className="inline mr-1" />Registered Email</label>
                <div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input required type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputClass} placeholder="your@email.com" /></div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50">
                {isLoading ? 'Sending OTP...' : 'Send Reset OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotReset} className="space-y-5">
              <div className="space-y-2">
                <label className={labelClass}>OTP Code</label>
                <input required type="text" maxLength={6} value={forgotCode} onChange={e => setForgotCode(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-200 focus:border-amber-500 bg-zinc-50 outline-none text-2xl text-center font-black tracking-[0.8rem]" placeholder="000000" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}><Lock size={12} className="inline mr-1" />New Password</label>
                <div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="New password (min 6 chars)" minLength={6} /></div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50">
                {isLoading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </form>
          )}
          <button onClick={() => { setForgotStep(null); setError(null); setSuccessMessage(null); setForgotDevCode(null); }} className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">← Back to Login</button>
        </motion.div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black text-zinc-950 font-display tracking-tight leading-none mb-3">Verify Email</h2>
            <p className="text-zinc-600 mt-3 text-sm px-4 leading-relaxed">
              We've sent a 6-digit code to <br/>
              <span className="font-bold text-zinc-900">{formData.email}</span>
            </p>
            <button 
              onClick={() => setIsVerifying(false)}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline mt-2"
            >
              Change Email Address
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
            >
              <ShieldCheck size={18} />
              {successMessage}
            </motion.div>
          )}

          {devCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center"
            >
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">⚠️ Email not sent — Use this code instead</p>
              <div className="text-4xl font-black text-amber-900 tracking-[0.5rem] font-mono">{devCode}</div>
              <p className="text-[9px] text-amber-500 mt-2 font-bold italic">Already auto-filled below. Just click Verify.</p>
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="space-y-3">
              <label className={labelClass}>
                VERIFICATION CODE
              </label>
              <input
                required
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl border-2 border-zinc-200 focus:border-emerald-500 bg-zinc-50 outline-none transition-all text-3xl text-center font-black tracking-[1rem] text-zinc-900"
                placeholder="000000"
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-xs text-zinc-500 italic">Check your email logs.</p>
                <button 
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4.5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-zinc-200 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Complete Registration'}
            </button>
          </form>

          <button 
            onClick={() => setIsVerifying(false)}
            className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            ← Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100"
          >
            {isLogin ? <Lock size={36} /> : <UserPlus size={36} />}
          </motion.div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-none mb-3">
            {isLogin ? 'Citizen Portal Login' : 'Create Citizen Account'}
          </h2>
          <p className="text-zinc-500 font-medium text-sm px-4 leading-relaxed">
            {isLogin 
              ? 'Enter your credentials to access your secure dashboard.' 
              : 'Join the digital governance network to earn merit points.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              className="space-y-5"
            >
              {!isLogin ? (
                <>
                  <div className="space-y-2">
                    <label className={labelClass}>FULL IDENTITY NAME</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input
                        required
                        type="text"
                        className={inputClass}
                        placeholder="ENTER FULL NAME"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>EMAIL ADDRESS</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                      <input
                        required
                        type="email"
                        className={inputClass}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={labelClass}>PHONE</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                          required
                          type="tel"
                          className={inputClass}
                          placeholder="PH NO"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>TALUK / WARD</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                          required
                          type="text"
                          className={inputClass}
                          placeholder="TALUK NO"
                          value={formData.ward}
                          onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>RESIDENTIAL ADDRESS</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-zinc-400" size={18} />
                      <textarea
                        required
                        className={`${inputClass} min-h-[100px] py-4 resize-none`}
                        placeholder="ENTER YOUR FULL RESIDENTIAL ADDRESS"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className={labelClass}>EMAIL ADDRESS</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                    <input
                      required
                      type="email"
                      className={inputClass}
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>PASSWORD</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline mb-2"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className={inputClass}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className={labelClass}>CONFIRM PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                      required
                      type="password"
                      className={inputClass}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                {isLogin ? 'Login to Portal' : 'Register Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-100 text-center space-y-4">
          <p className="text-sm text-zinc-500 font-medium">
            {isLogin ? "First time here?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 font-bold hover:underline"
            >
              {isLogin ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 mx-auto text-zinc-400 hover:text-zinc-600 transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowRight className="rotate-180" size={14} />
            Back to Portal Selection
          </button>
        </div>
        
        <div className="mt-8 flex justify-center">
          <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
            <Star size={12} className="text-yellow-500" fill="currentColor" />
            <span className="text-yellow-600 font-black text-[9px] uppercase tracking-widest italic leading-none">
              Earn merit points for every report
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
