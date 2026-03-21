import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, TrendingUp, BarChart3, Clock, ArrowRight, User, ShieldCheck } from 'lucide-react';

export const PublicPortal = () => {
  const stats = [
    { label: 'Complaints Resolved', value: '1,284', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Citizen Satisfaction', value: '4.8/5', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg Resolution Time', value: '2.4 Days', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Reports', value: '156', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
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
        <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none mb-6">
          Public <span className="text-emerald-600">Integrity</span> Portal
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
          Real-time accountability for municipal services and civic contributions.
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
            <div className="text-3xl font-black text-zinc-900 mb-1">{stat.value}</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">Recent Resolutions</h2>
              <button className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                View Archive <ArrowRight size={14} />
              </button>
           </div>
           
           <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-xs">
                       #{(4821 + i).toString()}
                    </div>
                    <div>
                      <div className="font-black text-zinc-900">Sanitation Issue Resolved</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Taluk 12 • 4 Hours Ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-black text-emerald-600 uppercase">Verified Solution</div>
                      <div className="text-xs font-bold text-zinc-500">Citizen Confirmed</div>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">Top Contributors</h2>
           <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Trophy size={140} />
              </div>
              <div className="relative z-10 space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between pb-6 border-b border-white/10 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                        {i}
                      </div>
                      <div>
                        <div className="font-bold">Citizen_0{i}</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">{1200 - i*150} PTS</div>
                      </div>
                    </div>
                    <div className="text-emerald-400">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                ))}
                <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest mt-4 hover:bg-emerald-400 transition-colors">
                  Join Leaderboard
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
