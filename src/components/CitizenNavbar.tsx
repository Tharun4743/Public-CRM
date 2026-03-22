
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, LayoutDashboard, Search, LogOut, Star, User, Bell, Menu, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logoutCitizen, getCitizenUser } from '../utils/citizenAuth';

export const CitizenNavbar = () => {
  const [points, setPoints] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({ name: '', phone: '', ward: '', address: '' });
  const [isSaving, setIsSaving] = React.useState(false);

  const user = getCitizenUser();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('citizen_token');
      if (!token) return;
      
      const res = await fetch('/api/citizens/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        ward: data.ward || '',
        address: data.address || ''
      });
    } catch (err) {}
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('citizen_token');
        if (!token) return;
        const res = await fetch('/api/rewards/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPoints(data.total_points || 0);
      } catch (err) {}
    };
    fetchData();
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('citizen_token');
      const res = await fetch('/api/citizens/update-profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchProfile();
        setIsProfileOpen(false);
        // Update local storage user name if changed
        const currentUser = JSON.parse(localStorage.getItem('citizen_user') || '{}');
        localStorage.setItem('citizen_user', JSON.stringify({ ...currentUser, name: formData.name }));
      }
    } catch (err) {}
    setIsSaving(false);
  };

  const navItems = [
    { name: 'File Complaint', path: '/citizen', icon: FileText },
    { name: 'My Dashboard', path: '/citizen-dashboard', icon: LayoutDashboard },
    { name: 'Track Complaint', path: '/track', icon: Search },
  ];

  const handleLogout = () => {
    logoutCitizen();
    navigate('/citizen-login');
  };

  return (
    <>
      <nav className="bg-white/80 border-b border-zinc-200 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  PS
                </div>
                <span className="font-bold text-xl tracking-tight text-zinc-900 hidden sm:block">
                  Citizen Portal
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    location.pathname === item.path
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                <Star size={14} className="text-yellow-500 fill-current" />
                <span className="text-xs font-black text-yellow-600 tracking-tight">{points} PTS</span>
              </div>
              
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full hover:bg-zinc-200 transition-colors group"
              >
                <User size={14} className="text-zinc-500 group-hover:text-zinc-900" />
                <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">{profile?.name || user?.name}</span>
              </button>

              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100"
                title="Logout"
              >
                <LogOut size={20} />
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-zinc-500 p-2"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-zinc-200 overflow-hidden px-4 pb-4 space-y-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                  <Star size={16} className="text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-yellow-600">{points} PTS</span>
                </div>
                <button 
                  onClick={() => { setIsProfileOpen(true); setIsOpen(false); }}
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-zinc-100 rounded-xl text-zinc-700 font-bold"
                >
                  <User size={18} />
                  Profile Settings
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-zinc-200 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-950 tracking-tight uppercase italic">Citizen Profile</h2>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Managed Public Identity</p>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Full Name</label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="Your Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Phone Number</label>
                       <input 
                         type="tel"
                         value={formData.phone}
                         onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                         className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                         placeholder="+91 XXXXX XXXXX"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Email Address (Registry)</label>
                    <input 
                      type="email"
                      value={profile?.email || ''}
                      className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Ward / Zone</label>
                      <input 
                        type="text"
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="e.g. Ward 42"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Account Status</label>
                       <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                         <Star size={14} className="text-emerald-600 fill-current" />
                         <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">{profile?.total_points || 0} Points • Verified</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Residential Address</label>
                    <textarea 
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                      placeholder="Enter your permanent address for verification"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex-1 py-4 border-2 border-zinc-100 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-[2] py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50"
                    >
                      {isSaving ? 'Synchronizing Registry...' : 'Update Official Registry'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
