import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, TrendingUp, BarChart3, Clock, ArrowRight, User, ShieldCheck } from 'lucide-react';

export const PublicPortal = () => {
  const [statsData, setStatsData] = React.useState<any>(null);
  const [resolutions, setResolutions] = React.useState<any[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sRes, rRes, lRes] = await Promise.all([
        fetch('/api/public/stats'),
        fetch('/api/public/recent-resolutions'),
        fetch('/api/rewards/leaderboard')
      ]);
      setStatsData(await sRes.json());
      setResolutions(await rRes.json());
      setLeaderboard(await lRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Complaints', value: statsData?.totalComplaintsMonth || '0', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Resolution Rate', value: `${(statsData?.resolutionRateMonth || 0).toFixed(1)}%`, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg Resolution Time', value: `${(statsData?.averageResolutionTime || 0).toFixed(2)} Days`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Department Efficiency', value: statsData?.departmentSummary?.length || '0', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl"
        >
          <BarChart3 size={14} />
          Transparency Dashboard
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none mb-6 text-balance">
          Public <span className="text-emerald-600">Integrity</span> Portal
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Real-time accountability for municipal services and civic contributions across all departments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl shadow-zinc-200/50 group hover:scale-105 transition-all"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <div className="text-3xl font-black text-zinc-900 mb-1">{isLoading ? '...' : stat.value}</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight italic">Recent Resolutions</h2>
              <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                Audit Trail <ArrowRight size={14} />
              </button>
           </div>
           
           <div className="space-y-4">
              {isLoading ? (
                <div className="h-40 bg-zinc-50 rounded-3xl animate-pulse" />
              ) : resolutions.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 font-bold uppercase tracking-widest italic bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                  No resolutions found in recent history.
                </div>
              ) : resolutions.map((res, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 group-hover:bg-emerald-600 transition-colors rounded-2xl flex items-center justify-center text-white font-black text-xs italic">
                       #{i + 1}
                    </div>
                    <div>
                      <div className="font-black text-zinc-900 uppercase italic leading-none mb-1">{res.category || 'General Service'}</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        RESOLUTION TIME: {res.resolutionTimeDays} DAYS
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Solution</div>
                      <div className="text-xs font-bold text-zinc-500 leading-none">Official Closure</div>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight italic">Citizen Leaders</h2>
           <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Trophy size={140} />
              </div>
              <div className="relative z-10 space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl animate-pulse" />)}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-zinc-500 uppercase text-[10px] font-black italic tracking-widest text-center py-8">
                    No points recorded in registry yet.
                  </div>
                ) : leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between pb-6 border-b border-white/10 last:border-0 last:pb-0 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xs ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-zinc-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-zinc-400'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-black uppercase italic text-sm tracking-tight">{entry.name}</div>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{entry.points} PTS</div>
                      </div>
                    </div>
                    <div className={i < 3 ? 'text-emerald-400' : 'text-zinc-700'}>
                      <TrendingUp size={18} />
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] italic text-center mb-4">Official Community Rankings</p>
                   <button 
                     onClick={() => window.location.href = '/citizen-login'}
                     className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95"
                   >
                     Contribute & Rank Up
                   </button>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

