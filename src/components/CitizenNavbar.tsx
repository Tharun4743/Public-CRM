
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
  const user = getCitizenUser();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchPoints = async () => {
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
    fetchPoints();
  }, []);

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
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full">
                <User size={14} className="text-zinc-500" />
                <span className="text-xs font-bold text-zinc-700">{user?.name}</span>
              </div>

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
              <div className="pt-2 flex gap-2">
                <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                  <Star size={16} className="text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-yellow-600">{points} PTS</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
