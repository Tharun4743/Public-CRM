import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Clock, CheckCircle2, Shield, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, PieChart as PieIcon,
  Calendar, Building2, Star
} from 'lucide-react';
import { motion } from 'motion/react';

export const AnalyticsDashboard = () => {
  const [overview, setOverview] = React.useState<any>(null);
  const [trends, setTrends] = React.useState<any[]>([]);
  const [performance, setPerformance] = React.useState<any[]>([]);
  const [sentiment, setSentiment] = React.useState<any[]>([]);
  const [days, setDays] = React.useState(30);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sortField, setSortField] = React.useState('total');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'map' | 'leaderboard'>('analytics');
  const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
  const [geoData, setGeoData] = React.useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, trRes, pfRes, snRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch(`/api/analytics/trends?days=${days}`),
        fetch('/api/analytics/performance'),
        fetch('/api/analytics/sentiment')
      ]);

      const [ovData, trData, pfData, snData] = await Promise.all([
        ovRes.json(), trRes.json(), pfRes.json(), snRes.json()
      ]);
      const [lb, geo] = await Promise.all([
        fetch('/api/leaderboard').then((r) => r.json()),
        fetch('/api/complaints/geodata').then((r) => r.json())
      ]);

      setOverview(ovData);
      setTrends(trData);
      setPerformance(pfData);
      setSentiment(snData);
      setLeaderboard(lb);
      setGeoData(geo);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [days]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedPerformance = [...performance].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  if (isLoading || !overview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-spin w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full mb-4" />
        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Processing Master Analytics...</span>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-12">
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-xl ${activeTab === 'analytics' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Analytics</button>
        <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-xl ${activeTab === 'map' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Map View</button>
        <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2 rounded-xl ${activeTab === 'leaderboard' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Leaderboard</button>
      </div>
      {activeTab === 'map' && (
        <div className="bg-white/80 p-6 rounded-3xl">
          <h3 className="font-black mb-4">Geospatial Complaint Points</h3>
          {geoData.map((g, i) => <div key={i} className="text-sm border-b border-zinc-100 py-1">{g.id} - {g.status} ({g.latitude}, {g.longitude})</div>)}
        </div>
      )}
      {activeTab === 'leaderboard' && (
        <div className="bg-white/80 p-6 rounded-3xl">
          <h3 className="font-black mb-4">Department Rankings</h3>
          {leaderboard.map((l) => <div key={l.department} className="py-2 border-b border-zinc-100">{l.rank}. {l.department} - {l.score} ({l.tier})</div>)}
        </div>
      )}
      {activeTab === 'analytics' && (
      <>
      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Complaints', value: overview.total, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Resolution Rate', value: `${overview.resolvedRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Resolution Time', value: '4.2 Days', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'SLA Compliance', value: '94%', icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl shadow-zinc-200/50 group hover:y-[-4px] transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
              <kpi.icon size={24} />
            </div>
            <div className="text-3xl font-black text-zinc-950 mb-1">{kpi.value}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Volume Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-zinc-950 flex items-center gap-3 italic">
              <TrendingUp className="text-indigo-500" />
              Volume Intelligence Trend
            </h3>
            <div className="flex bg-zinc-100 p-1 rounded-xl">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${days === d ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl"
        >
          <h3 className="text-xl font-black text-zinc-950 flex items-center gap-3 italic mb-8">
            <PieIcon className="text-violet-500" />
            Core Analytics Orbit
          </h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview.status}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {overview.status.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl font-black text-zinc-950">{overview.total}</div>
              <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-tight">Grievance<br/>Population</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl"
        >
          <h3 className="text-xl font-black text-zinc-950 flex items-center gap-3 italic mb-8">
            <Activity className="text-rose-500" />
            Complaint Vector Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.category}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" hide />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sentiment Sentiment Trends */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl"
        >
          <h3 className="text-xl font-black text-zinc-950 flex items-center gap-3 italic mb-8">
            <Star className="text-amber-500" />
            Citizen Sentiment Velocity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentiment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="avgSentiment" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#f59e0b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Performance Table */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl overflow-hidden"
      >
        <h3 className="text-xl font-black text-zinc-950 flex items-center gap-3 italic mb-8">
          <Building2 className="text-emerald-500" />
          Departmental Operational Efficiency
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-y border-zinc-100">
                <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600" onClick={() => handleSort('department')}>Department Sector</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600" onClick={() => handleSort('total')}>Total Assigned</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600" onClick={() => handleSort('resolved')}>Resolved</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600" onClick={() => handleSort('avgDays')}>Avg Cycle</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600" onClick={() => handleSort('slaCompliance')}>SLA %</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600" onClick={() => handleSort('avgSentiment')}>Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sortedPerformance.map((dept, i) => (
                <tr key={i} className="hover:bg-zinc-50 group transition-all">
                  <td className="px-6 py-5 font-bold text-zinc-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-600 transition-colors">
                      {dept.department.substring(0,2).toUpperCase()}
                    </div>
                    {dept.department}
                  </td>
                  <td className="px-6 py-5 font-black text-zinc-900">{dept.total}</td>
                  <td className="px-6 py-5 text-emerald-600 font-bold">{dept.resolved}</td>
                  <td className="px-6 py-5 text-zinc-500 font-medium">
                    {dept.avgDays ? `${dept.avgDays.toFixed(1)} Days` : 'N/A'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className={`font-black ${dept.slaCompliance > 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {dept.slaCompliance.toFixed(1)}%
                       </span>
                       <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className={`h-full ${dept.slaCompliance > 90 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${dept.slaCompliance}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      {dept.avgSatisfaction ? dept.avgSatisfaction.toFixed(1) : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      </>
      )}
    </div>
  );
};
