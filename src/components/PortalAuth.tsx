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

  if (isAuthenticated) {
    return <>{children}</>;
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
              <label className="text-base font-bold text-zinc-900 block ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all text-lg text-zinc-900 font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base font-bold text-zinc-900 block ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-zinc-300 focus:border-emerald-500 bg-white outline-none transition-all text-lg text-zinc-900 font-medium"
                  placeholder="••••••••"
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
