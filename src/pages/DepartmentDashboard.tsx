import React from 'react';
import { Building2, CheckCircle2, Clock, AlertCircle, Filter, Search, Sparkles, ChevronDown, ListCheck, Layers, Boxes, Activity, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Complaint, ComplaintStatus } from '../types';

export const DepartmentDashboard = () => {
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [selectedDept, setSelectedDept] = React.useState('Sanitation');
  const [isLoading, setIsLoading] = React.useState(true);
  const [resolutionData, setResolutionData] = React.useState<Record<string, any>>({});
  const [loadingAi, setLoadingAi] = React.useState<Record<string, boolean>>({});
  const [expandedAi, setExpandedAi] = React.useState<Record<string, boolean>>({});
  const [deptRank, setDeptRank] = React.useState<any>(null);

  // Resolution Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = React.useState(false);
  const [resolvingComplaint, setResolvingComplaint] = React.useState<Complaint | null>(null);
  const [resolveNotes, setResolveNotes] = React.useState('');
  const [resolveProofBase64, setResolveProofBase64] = React.useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/complaints');
      const data = await response.json();
      setComplaints(data.filter((c: Complaint) => c.department === selectedDept));
      const lb = await fetch('/api/leaderboard').then((r) => r.json());
      setDeptRank(lb.find((x: any) => x.department === selectedDept) || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (Max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setResolveProofBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResolveSubmit = async () => {
    if (!resolvingComplaint || !resolveProofBase64 || !resolveNotes) return;
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const res = await fetch(`/api/complaints/${resolvingComplaint.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proof: resolveProofBase64, 
          notes: resolveNotes, 
          officerId: user?.id || 'System' 
        }),
      });
      if (res.ok) {
        setIsResolveModalOpen(false);
        setResolvingComplaint(null);
        setResolveNotes('');
        setResolveProofBase64('');
        fetchData();
      }
    } catch (error) {
      console.error('Error resolving:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedComplaints = [...complaints].sort((a, b) => {
    if (a.sla_status === 'Breached' && b.sla_status !== 'Breached') return -1;
    if (b.sla_status === 'Breached' && a.sla_status !== 'Breached') return 1;
    if (a.sla_status === 'At Risk' && b.sla_status !== 'At Risk') return -1;
    if (b.sla_status === 'At Risk' && a.sla_status !== 'At Risk') return 1;
    const priorities: Record<string, number> = { 'Urgent': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
    return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
  });

  const handleGetAiResolution = async (complaintId: string, description: string, category: string) => {
    if (resolutionData[complaintId]) {
      setExpandedAi(prev => ({ ...prev, [complaintId]: !prev[complaintId] }));
      return;
    }
    setLoadingAi(prev => ({ ...prev, [complaintId]: true }));
    try {
      const response = await fetch('/api/ai/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, category, complaintId }),
      });
      const data = await response.json();
      setResolutionData(prev => ({ ...prev, [complaintId]: data }));
      setExpandedAi(prev => ({ ...prev, [complaintId]: true }));
    } catch (error) {
      console.error('AI Resolution Error:', error);
    } finally {
      setLoadingAi(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleStatusUpdate = async (id: string, status: ComplaintStatus) => {
    try {
      await fetch(`/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const departments = ['Sanitation', 'Water Supply', 'Electricity', 'Roads & Transport', 'Public Safety'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 font-display flex items-center gap-3">
            Officer Command
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200">
              Departmental
            </div>
          </h1>
          <p className="text-lg text-zinc-600 mt-1">Manage and resolve grievances assigned to your department.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-zinc-200 shadow-sm">
          <Building2 size={18} className="ml-2 text-zinc-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-zinc-900 pr-8"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
              <CheckCircle2 size={120} />
            </div>
            <h3 className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-6">Performance Index</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-black font-display">{complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length}</span>
              <span className="text-emerald-100 text-base mb-2 font-medium">Resolutions</span>
            </div>
            <div className="w-full bg-emerald-500/30 h-2 rounded-full mt-4">
              <div 
                className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.7)]" 
                style={{ width: `${(complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length / (complaints.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
          {deptRank && (
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-white shadow-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Department Rank</div>
              <div className="text-3xl font-black text-zinc-900 mt-2">#{deptRank.rank}</div>
              <div className="text-sm text-zinc-600">Score {deptRank.score} ({deptRank.tier})</div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl">
            <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              Real-time Queue Status
            </h3>
            <div className="space-y-8">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-4 text-base font-bold text-zinc-600">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors shadow-sm">
                    <Clock size={24} className="text-amber-600" />
                  </div>
                  Pending
                </div>
                <div className="text-3xl font-black text-zinc-950 font-display transition-transform group-hover:scale-110">
                  {complaints.filter(c => c.status === ComplaintStatus.PENDING).length}
                </div>
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-4 text-base font-bold text-zinc-600">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-sm">
                    <AlertCircle size={24} className="text-blue-600" />
                  </div>
                  Active Tasks
                </div>
                <div className="text-3xl font-black text-zinc-950 font-display transition-transform group-hover:scale-110">
                  {complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black text-xl text-zinc-950 flex items-center gap-2">
              Queue Master
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">• {complaints.length} TASKS</span>
            </h2>
          </div>

          {!isLoading && sortedComplaints.map((c) => (
            <motion.div
              key={c.id}
              className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] border-2 border-white shadow-xl hover:border-emerald-200 transition-all group overflow-hidden relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 shadow-sm tracking-tighter">{c.id}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
                      c.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                      c.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      'bg-zinc-50 text-zinc-600 border-zinc-100'
                    }`}>
                      {c.priority} Priority
                    </span>
                    {c.sla_deadline && <SLACountdown deadline={c.sla_deadline} />}
                  </div>
                  <h3 className="text-2xl font-black text-zinc-950 font-display tracking-tight group-hover:text-emerald-700 transition-colors uppercase">{c.category}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusUpdate(c.id, e.target.value as ComplaintStatus)}
                    className={`text-[10px] font-black rounded-xl border-2 border-transparent focus:border-emerald-500 py-2.5 pl-4 pr-10 cursor-pointer transition-all shadow-lg uppercase tracking-tight ${
                      c.status === ComplaintStatus.PENDING ? 'bg-amber-50 text-amber-700' :
                      c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <option value={ComplaintStatus.PENDING}>Pending Activation</option>
                    <option value={ComplaintStatus.IN_PROGRESS}>Work In Progress</option>
                    <option value={ComplaintStatus.RESOLVED}>Case Resolved</option>
                  </select>
                </div>
              </div>
              
              <p className="text-zinc-600 text-lg leading-relaxed mb-4 font-medium border-l-3 border-zinc-100 pl-6 italic line-clamp-2 hover:line-clamp-none transition-all">
                "{c.description}"
              </p>

              {(c as any).complaint_image && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-50 shadow-inner group-hover:border-emerald-200 transition-colors">
                  <img 
                    src={(c as any).complaint_image} 
                    alt="Issue" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              {(c as any).ai_summary && (
                 <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-3">
                    <Sparkles size={16} className="text-emerald-500 mt-0.5" />
                    <div>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">AI Intelligence Summary</span>
                       <p className="text-sm font-bold text-zinc-700">{(c as any).ai_summary}</p>
                    </div>
                 </div>
              )}

              <div className="mb-8">
                 <button 
                   onClick={() => handleGetAiResolution(c.id, c.description, c.category)}
                   disabled={loadingAi[c.id]}
                   className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border border-emerald-100 disabled:opacity-50"
                 >
                   {loadingAi[c.id] ? (
                     <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                   ) : <Sparkles size={16} />}
                   {expandedAi[c.id] ? 'Hide AI Resolution Plan' : 'Generate AI Resolution Plan'}
                 </button>
                 
                 <AnimatePresence>
                   {expandedAi[c.id] && resolutionData[c.id] && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden mt-4"
                     >
                       <div className="p-6 bg-zinc-950 text-white rounded-2xl shadow-xl space-y-4">
                          <div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Recommended Steps</span>
                            <ul className="space-y-2">
                               {resolutionData[c.id].steps?.map((step: string, i: number) => (
                                 <li key={i} className="flex items-start gap-2 text-sm font-medium">
                                   <span className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] font-black text-emerald-400 flex-shrink-0">{i + 1}</span>
                                   <span className="mt-0.5 opacity-90">{step}</span>
                                 </li>
                               ))}
                            </ul>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Est. Effort</span>
                               <span className="text-sm font-bold text-emerald-400">{resolutionData[c.id].estimatedEffort}</span>
                            </div>
                            <div>
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Resources</span>
                               <span className="text-sm font-bold text-zinc-300">{resolutionData[c.id].requiredResources?.join(', ')}</span>
                            </div>
                          </div>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-zinc-200">
                      {c.citizenName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-zinc-900 uppercase tracking-tight">{c.citizenName}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{c.citizen_email || c.contactInfo}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">{c.citizen_phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {c.status !== ComplaintStatus.RESOLVED && (
                    <button 
                      onClick={() => {
                        setResolvingComplaint(c);
                        setIsResolveModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-xl flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      Upload Proof
                    </button>
                  )}
                  <button className="px-5 py-2.5 bg-zinc-100 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200">
                    Access File
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isResolveModalOpen && resolvingComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResolveModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] p-8 shadow-2xl border border-white"
            >
              <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-2 mb-6 uppercase tracking-tight">
                <CheckCircle2 size={24} className="text-emerald-500" />
                Submit Resolution Proof
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2">Evidence Capture (Image)</label>
                  <label className="w-full h-40 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group overflow-hidden bg-zinc-50 relative">
                    {resolveProofBase64 ? (
                      <img src={resolveProofBase64} alt="Proof preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-xs font-bold text-zinc-400 mt-2">Click to select photo</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2">Resolution Intelligence (Notes)</label>
                  <textarea
                    rows={4}
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Describe the resolution steps taken..."
                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 bg-zinc-50 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-zinc-900"
                  />
                </div>

                <button
                  disabled={isLoading || !resolveProofBase64 || !resolveNotes}
                  onClick={handleResolveSubmit}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Mark as Resolved with Proof'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SLACountdown = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = React.useState('');
  const [colorClass, setColorClass] = React.useState('text-emerald-500');

  React.useEffect(() => {
    const target = new Date(deadline).getTime();
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('BREACHED');
        setColorClass('text-rose-500 bg-rose-50 border-rose-100');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      if (diff < 2 * 60 * 60 * 1000) setColorClass('text-rose-500 bg-rose-50 border-rose-100');
      else if (diff < 6 * 60 * 60 * 1000) setColorClass('text-amber-500 bg-amber-50 border-amber-100');
      else setColorClass('text-emerald-500 bg-emerald-50 border-emerald-100');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm font-mono text-[10px] font-black ${colorClass}`}>
      <Activity size={12} className="animate-pulse" />
      {timeLeft}
    </div>
  );
};
