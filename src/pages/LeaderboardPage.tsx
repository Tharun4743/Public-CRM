import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, TrendingUp, BarChart3, Clock, ArrowRight, User, ShieldCheck } from 'lucide-react';

export const LeaderboardPage = () => {
    const departments = [
        { name: 'Sanitation', complaints: 482, resolution: '98%', score: 940, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'Public Works', complaints: 356, resolution: '92%', score: 880, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Water Board', complaints: 124, resolution: '88%', score: 820, color: 'text-violet-500', bg: 'bg-violet-50' },
        { name: 'Electricity', complaints: 89, resolution: '85%', score: 790, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl"
                >
                    <Trophy size={14} />
                    Performance Leaderboard
                </motion.div>
                <h1 className="text-6xl md:text-8xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none mb-6">
                    Department <span className="text-emerald-600">Global</span> Rankings
                </h1>
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
                    Tracking real-time performance and accountability across all public service sectors.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 space-y-4"
                >
                    {departments.map((dept, i) => (
                        <div key={dept.name} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 flex items-center justify-between gap-6 hover:shadow-2xl transition-all group overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-2 h-full ${dept.bg.replace('bg-', 'bg-')}`} />
                            <div className="flex items-center gap-8">
                                <div className="text-4xl font-black text-zinc-200 italic">0{i + 1}</div>
                                <div>
                                    <div className="text-3xl font-black text-zinc-900 uppercase tracking-tight">{dept.name}</div>
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{dept.complaints} REPORTS MANAGED</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight">Resolution</div>
                                    <div className={`text-2xl font-black ${dept.color}`}>{dept.resolution}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight">Civic Points</div>
                                    <div className="text-2xl font-black text-zinc-900">{dept.score}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="space-y-8">
                    <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Star size={180} fill="currentColor" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-4 leading-none">Global Sector <br /> Benchmark</h3>
                                <p className="text-zinc-400 font-medium mb-12">Total resolved cases this month across all municipal departments.</p>

                                <div className="space-y-10">
                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Efficiency Score</span>
                                            <span className="text-2xl font-black italic">92.4%</span>
                                        </div>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden p-1 border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '92.4%' }}
                                                className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Active Oversight</span>
                                            <span className="text-2xl font-black italic">1,402</span>
                                        </div>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden p-1 border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '78%' }}
                                                className="h-full bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-colors">
                                View Intelligence Reports
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
