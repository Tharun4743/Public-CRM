import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Building2, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const roleParam = queryParams.get('role') as UserRole || UserRole.OFFICER;

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    role: roleParam,
    department: roleParam === UserRole.OFFICER ? 'Sanitation' : ''
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const departments = [
    'Sanitation', 'Water Supply', 'Electricity', 'Roads & Transport', 'Public Safety'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data: any = {};
      try { data = await response.json(); } catch { 
        throw new Error('Server is unavailable. Please try again in a moment.');
      }
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success - show verification step
      setIsVerifying(true);
      setSuccessMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });

      let data: any = {};
      try { data = await response.json(); } catch {
        throw new Error('Server is unavailable. Please try again in a moment.');
      }
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Success - redirect to login
      navigate(formData.role === UserRole.ADMIN ? '/admin' : '/officer');
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
      const response = await fetch('/api/users/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setSuccessMessage("A new verification code has been sent!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black text-zinc-950 font-display">Verify Email</h2>
            <p className="text-zinc-600 mt-3 text-lg">We've sent a 6-digit code to <br/><span className="font-bold text-zinc-900">{formData.email}</span></p>
            <button 
              onClick={() => setIsVerifying(false)}
              className="text-xs text-emerald-600 font-bold hover:underline mt-1"
            >
              Change Email Address
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 text-sm font-bold"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 flex items-center gap-3 text-sm font-bold"
            >
              <ShieldCheck size={18} />
              {successMessage}
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-zinc-700 uppercase tracking-widest ml-1">
                Verification Code
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
                  className="text-xs font-bold text-emerald-600 hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Complete Registration'}
            </button>
          </form>

          <button 
            onClick={() => setIsVerifying(false)}
            className="w-full mt-6 text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            ← Back to Registration
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Create {formData.role} Account</h2>
          <p className="text-zinc-500 mt-2">Join the Public Services CRM platform.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <User size={18} className="text-emerald-600" />
              Full Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all text-lg text-zinc-900 font-medium"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <Mail size={18} className="text-emerald-600" />
              Email Address
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all text-lg text-zinc-900 font-medium"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <Lock size={18} className="text-emerald-600" />
              Password
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 pr-12 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all text-lg text-zinc-900 font-medium"
                placeholder={formData.role === UserRole.ADMIN ? "Enter Admin Secret Password" : "Create a password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400 hover:text-emerald-600 transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.role === UserRole.ADMIN && (
              <p className="text-xs text-zinc-500 ml-1 italic">Note: Admin registration requires the specific system password.</p>
            )}
          </div>

          {formData.role === UserRole.OFFICER && (
            <>
              <div className="space-y-2">
                <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
                  <Building2 size={18} className="text-emerald-600" />
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all appearance-none text-lg text-zinc-900 font-medium"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

            </>
          )}

          <button
            disabled={isLoading}
            type="submit"
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : (
              <>
                <ShieldCheck size={20} />
                Register Now
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center space-y-3">
          <p className="text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to={formData.role === UserRole.ADMIN ? '/admin' : '/officer'} className="text-emerald-600 font-bold hover:underline">
              Login here
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
