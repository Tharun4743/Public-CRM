
import React from 'react';
import { 
  FileText, CheckCircle2, Clock, Star, Trophy, ArrowRight,
  TrendingUp, Gift, Shield, List, Search, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { CitizenNavbar } from '../components/CitizenNavbar';

export const CitizenDashboard = () => {
  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({ total_points: 0, total_complaints: 0, badges: [] });
  const [vouchers, setVouchers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('citizen_token');
      if (!token) return;

      const [compRes, summRes, vouchRes] = await Promise.all([
        fetch('/api/citizens/my-complaints', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/rewards/summary', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/rewards/vouchers/available', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const compData = await compRes.json();
      const summData = await summRes.json();
      const vouchData = await vouchRes.json();

      setComplaints(compData.complaints || []);
      setSummary(summData);
      setVouchers(vouchData);

    } catch (err) {}
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchRewards();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh')) {
      fetchRewards();
      window.history.replaceState({}, '', '/citizen-dashboard');
    }

    const handleFocus = () => fetchRewards();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const statCards = [
    { label: 'Cases Filed', value: summary.total_complaints || 0, icon: FileText, color: 'text-zinc-900', bg: 'bg-zinc-100' },
    { label: 'Resolved', value: (complaints || []).filter(c => c.status === 'Resolved').length, icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Merit Points', value: summary.total_points || 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Badge Tier', value: summary.rank || 'Bronze', icon: Trophy, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <CitizenNavbar />
      
      <main className="max-w-7xl mx-auto py-10 px-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-950 tracking-tighter uppercase italic leading-none mb-3">
              Citizen Command
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">
              Your Public Contribution Oversight Panel
            </p>
          </div>
          <Link
            to="/citizen"
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl hover:shadow-emerald-200 active:scale-95"
          >
            <Plus size={18} />
            File New Case
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl flex items-center gap-6"
            >
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon size={28} />
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-950 tracking-tighter italic">{stat.value}</div>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* My Complaints List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-black text-zinc-950 tracking-tight flex items-center gap-3 uppercase italic">
                <List size={20} className="text-emerald-600" />
                Case History
              </h2>
              <Link to="/track" className="text-[10px] font-black uppercase text-emerald-600 hover:underline tracking-widest">Universal Tracking</Link>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-zinc-50/50">
                       <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Case ID</th>
                       <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Category</th>
                       <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest text-right">Merit</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100">
                     {isLoading ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 uppercase text-[10px] font-black tracking-widest italic animate-pulse">Initializing Data Stream...</td></tr>
                     ) : complaints.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 uppercase text-[10px] font-black tracking-widest italic">No cases recorded under this identity.</td></tr>
                     ) : (
                        complaints.map((c) => (
                           <tr 
                             key={c._id} 
                             onClick={() => navigate(`/track?id=${c._id}`)}
                             className="group hover:bg-emerald-50/50 cursor-pointer transition-colors"
                           >
                             <td className="px-6 py-5">
                               <div className="font-mono text-sm font-black text-zinc-900 leading-none">#{c._id}</div>
                               <div className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">Filed on {new Date(c.created_at).toLocaleDateString()}</div>
                             </td>
                             <td className="px-6 py-5">
                               <div className="text-sm font-bold text-zinc-900 uppercase italic">{c.category}</div>
                             </td>
                             <td className="px-6 py-5">
                               <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${getStatusColor(c.status)}`}>
                                 {c.status}
                               </span>
                             </td>
                             <td className="px-6 py-5 text-right">
                               <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                                 <span className="text-sm font-black">+{c.points_earned || 10}</span>
                                 <Star size={12} fill="currentColor" />
                               </div>
                             </td>
                           </tr>
                        ))
                     )}
                   </tbody>
                 </table>
               </div>
               <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-center">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">Audit Authenticated Profile</p>
               </div>
            </div>
          </div>

          {/* Rewards Panel */}
          <div className="space-y-8">
            <div className="px-4">
              <h2 className="text-xl font-black text-zinc-950 tracking-tight flex items-center gap-3 uppercase italic">
                <Gift size={20} className="text-emerald-600" />
                Rewards Tier
              </h2>
            </div>

            <motion.div 
               whileHover={{ y: -4 }}
               className="bg-white rounded-[2.5rem] p-8 text-zinc-950 border border-zinc-100 shadow-xl relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform text-zinc-950">
                 <Trophy size={180} />
               </div>
               
               <div className="relative z-10">
                 <div className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 italic">Cumulative Recognition</div>
                 <div className="text-6xl font-black tracking-tighter italic flex items-end gap-2 mb-8 text-zinc-950">
                   {summary.total_points || 0}
                   <span className="text-lg font-bold uppercase tracking-widest text-sky-600/40 mb-2">PTS</span>
                 </div>
                 
                 <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 px-1 text-zinc-400">
                        <span>Progress to Next Tier</span>
                        <span className="text-sky-600 font-bold">{Math.floor(Number(summary.total_points || 0) % 100)} / 100</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all duration-1000" 
                          style={{ width: `${Math.floor(Number(summary.total_points || 0) % 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 grid grid-cols-4 gap-3">
                       {['Bronze', 'Silver', 'Gold', 'Diamond'].map((tier, idx) => {
                          const tiers = ['Bronze', 'Silver', 'Gold', 'Diamond'];
                          const currentRankIdx = tiers.indexOf(summary.rank || 'Bronze');
                          const isEarned = (summary.badges || []).includes(tier) || currentRankIdx >= idx;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${isEarned ? 'bg-sky-50 border-sky-500 text-sky-500 shadow-lg shadow-sky-500/10' : 'bg-zinc-50 border-zinc-100 text-zinc-300'}`}>
                                 <Shield size={20} className={isEarned ? 'fill-current' : ''} />
                               </div>
                               <span className={`text-[8px] font-black uppercase tracking-widest ${isEarned ? 'text-zinc-900' : 'text-zinc-400'}`}>{tier}</span>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               </div>

            </motion.div>

            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white p-8 shadow-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-zinc-950">Active Vouchers</h3>
               </div>
               
               <div className="space-y-4">
                  {vouchers.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">No redemption paths available</p>
                    </div>
                  ) : vouchers.slice(0, 3).map((v, i) => (
                    <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-emerald-200 transition-all">
                       <div>
                         <div className="text-xs font-black text-zinc-900 uppercase italic leading-none mb-1">{v.title}</div>
                         <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">{v.points_required} PTS Required</div>
                       </div>
                       <button className="p-2 bg-white text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                         <ArrowRight size={16} />
                       </button>
                    </div>
                  ))}
                  <button className="w-full py-4 mt-2 border-2 border-zinc-100 text-zinc-400 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-zinc-50 transition-all italic">
                    View Entire Registry
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
