import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Search, Building2, Menu, X, UserPlus, 
  BarChart3, Bell, Inbox, AlertCircle, CheckCircle, TrendingUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [hasBreached, setHasBreached] = React.useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { t } = useLanguage();
  const location = useLocation();

  React.useEffect(() => {
    const checkBreach = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        // Only check breach status if user is authenticated
        if (!user || (user.role !== 'Admin' && user.role !== 'Officer')) {
          return;
        }
        
        const token = localStorage.getItem('token') || localStorage.getItem('citizen_token');
        if (!token) return;
        
        const res = await fetch('/api/complaints/breach-status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setHasBreached(data.hasBreached);
        }
      } catch (err) {
        console.log('Breach status check failed:', err);
      }
    };
    checkBreach();
    const interval = setInterval(checkBreach, 60000);
    return () => clearInterval(interval);
  }, []);

  const getNavItems = () => {
    if (location.pathname === '/citizen-login') return [];
    if (location.pathname.startsWith('/citizen') || location.pathname === '/track') {
      return [
        { name: t('nav_submit'), path: '/citizen', icon: FileText },
        { name: t('nav_track'), path: '/track', icon: Search },
      ];
    }
    if (location.pathname.startsWith('/admin') || location.pathname === '/analytics') {
      return [
        { name: t('nav_admin'), path: '/admin', icon: LayoutDashboard },
        { name: t('nav_analytics'), path: '/analytics', icon: BarChart3 },
      ];
    }
    if (location.pathname.startsWith('/officer')) {
      return [
        { name: t('nav_officer'), path: '/officer', icon: Building2 },
      ];
    }
    if (location.pathname === '/register') {
      return [
        { name: t('nav_register'), path: '/register', icon: UserPlus },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'assignment': return <Inbox className="text-blue-500" size={16} />;
      case 'sla_breach': return <AlertCircle className="text-rose-500" size={16} />;
      case 'escalation': return <TrendingUp className="text-violet-500" size={16} />;
      case 'alert': return <AlertCircle className="text-amber-500" size={16} />;
      default: return <Bell className="text-zinc-400" size={16} />;
    }
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
                  PS-CRM
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
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
                    <div className="relative">
                      <item.icon size={18} />
                      {item.name === 'Admin Dashboard' && hasBreached && (
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                        />
                      )}
                    </div>
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                {navItems.length > 0 && (
                  <button
                    onClick={() => setIsNotifOpen(true)}
                    className="relative p-2 text-zinc-400 hover:bg-zinc-50 rounded-xl transition-colors active:scale-90 border border-zinc-100"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-zinc-500 hover:text-zinc-900 p-2"
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-zinc-200 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Notification Drawer */}
      <AnimatePresence>
        {isNotifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifOpen(false)}
              className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-zinc-900 uppercase tracking-tight">Intelligence Feed</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{unreadCount} UNREAD ALERTS</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={markAllRead}
                    className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => setIsNotifOpen(false)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 pb-20">
                    <Inbox size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No active intelligence</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-2xl border transition-all group relative ${
                        n.is_read ? 'bg-zinc-50/50 border-zinc-100' : 'bg-white border-zinc-200 shadow-md ring-1 ring-emerald-500/5'
                      }`}
                    >
                      {!n.is_read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full" />
                      )}
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-50 flex-shrink-0`}>
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                              {n.type.replace('_', ' ')} • {new Date(n.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${n.is_read ? 'text-zinc-500' : 'text-zinc-900 font-bold'}`}>
                            {n.message}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[9px] font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-500">{n.complaint_id}</span>
                            {!n.is_read && (
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                              >
                                Dismiss Alert
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/30">
                <p className="text-[8px] text-center font-bold text-zinc-400 uppercase tracking-[0.2em]">Operational Oversight Network v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
