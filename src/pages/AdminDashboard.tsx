import React from 'react';
import { 
  LayoutDashboard, Users, Clock, CheckCircle2, AlertCircle, Building2, ChevronRight, 
  Sparkles, Shield, Tag, Star, Activity, BarChart3, X, ChevronDown, Check, AlertTriangle,
  Search, Filter, Download, Calendar, SlidersHorizontal, ArrowLeft, ArrowRight, FileText, MapPin, Phone, Plus, Trophy, Gift, UserCheck, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Complaint, ComplaintStatus, ComplaintStats } from '../types';

interface AnomalyReport {
  isAnomaly: boolean;
  reason: string;
  affectedArea: string;
  suggestedAction: string;
}

export const AdminDashboard = () => {
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [stats, setStats] = React.useState<ComplaintStats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedComplaint, setSelectedComplaint] = React.useState<Complaint | null>(null);
  const [isAiInsightsOpen, setIsAiInsightsOpen] = React.useState(true);
  const [anomalyReport, setAnomalyReport] = React.useState<AnomalyReport | null>(null);
  const [isDetectingAnomaly, setIsDetectingAnomaly] = React.useState(false);
  const [slaStats, setSlaStats] = React.useState({ onTrack: 0, atRisk: 0, breached: 0, escalated: 0 });
  
  // New States for Feature 8, 9 & 10
  const [activeTab, setActiveTab] = React.useState<'Overview' | 'Audit' | 'Rewards' | 'Approvals' | 'Database'>('Overview');
  const [pendingOfficers, setPendingOfficers] = React.useState<any[]>([]);
  const [dbStats, setDbStats] = React.useState<any>(null);
  const [dbStatsKey, setDbStatsKey] = React.useState('pscrm-admin-2024');
  const [isLoadingDb, setIsLoadingDb] = React.useState(false);
  const [dbError, setDbError] = React.useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [activeAnomalies, setActiveAnomalies] = React.useState<any[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [auditTotalPages, setAuditTotalPages] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState({
    q: '',
    category: 'All',
    priority: 'All',
    status: 'All',
    department: 'All',
    dateFrom: '',
    dateTo: '',
    slaStatus: 'All',
    minSentiment: 0,
    maxSentiment: 100,
    page: 1
  });
  const [auditFilters, setAuditFilters] = React.useState({
    complaint_id: '',
    user_id: '',
    dateFrom: '',
    dateTo: '',
    page: 1
  });

  const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
  const [redeemedVouchers, setRedeemedVouchers] = React.useState<any[]>([]);
  const [rewardsPage, setRewardsPage] = React.useState(1);
  const rewardsPerPage = 5;
  const paginatedVouchers = Array.isArray(redeemedVouchers) 
    ? redeemedVouchers.slice((rewardsPage - 1) * rewardsPerPage, rewardsPage * rewardsPerPage)
    : [];
  const totalRewardsPages = Array.isArray(redeemedVouchers) 
    ? Math.ceil(redeemedVouchers.length / rewardsPerPage) || 1
    : 1;
  const [voucherTypes, setVoucherTypes] = React.useState<any[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = React.useState(false);
  const [newVoucher, setNewVoucher] = React.useState({ title: '', description: '', points_required: 0, total_available: 0 });

  const fetchPendingOfficers = async () => {
    try {
      const res = await fetch('/api/users/pending-officers', { headers: getAuthHeaders() });
      const data = await res.json();
      setPendingOfficers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching pending officers:', err);
      setPendingOfficers([]);
    }
  };

  const handleApproveOfficer = async (id: string) => {
    try {
      await fetch('/api/users/approve-officer', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ officerId: id })
      });
      fetchPendingOfficers();
    } catch (err) {
      console.error('Error approving officer:', err);
    }
  };

  const fetchDbStats = async (key?: string) => {
    setIsLoadingDb(true);
    setDbError(null);
    try {
      const res = await fetch('/api/admin/db-stats', {
        headers: { 'x-admin-key': key || dbStatsKey }
      });
      if (!res.ok) { setDbError('Invalid Admin Key or server error.'); setIsLoadingDb(false); return; }
      const data = await res.json();
      setDbStats(data);
    } catch (err) {
      setDbError('Could not reach the server.');
    }
    setIsLoadingDb(false);
  };

  const fetchAuditLogs = async () => {
    try {
      const qp = new URLSearchParams({
        ...auditFilters,
        page: auditFilters.page.toString()
      });
      const res = await fetch(`/api/audit?${qp}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      setAuditTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
    }
  };

  const fetchActiveAnomalies = async () => {
    try {
      const res = await fetch('/api/anomalies/active', { headers: getAuthHeaders() });
      const data = await res.json();
      setActiveAnomalies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
      setActiveAnomalies([]);
    }
  };

  const fetchSlaStats = async () => {
    try {
      const res = await fetch('/api/complaints/sla-stats', { headers: getAuthHeaders() });
      const data = await res.json();
      setSlaStats(data || { onTrack: 0, atRisk: 0, breached: 0, escalated: 0 });
    } catch (err) {
      console.error('Error fetching SLA stats:', err);
      setSlaStats({ onTrack: 0, atRisk: 0, breached: 0, escalated: 0 });
    }
  };

  const handleDetectAnomalies = async () => {
    setIsDetectingAnomaly(true);
    try {
      const response = await fetch('/api/ai/detect', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recentComplaints: complaints }),
      });
      const data = await response.json();
      setAnomalyReport(data);
    } catch (error) {
      console.error('Anomaly Detection Error:', error);
    } finally {
      setIsDetectingAnomaly(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rewards/vouchers/types', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newVoucher)
      });
      if (res.ok) {
        setIsVoucherModalOpen(false);
        fetchRewardsData();
      }
    } catch (err) {
      console.error('Error creating voucher:', err);
    }
  };

  const fetchRewardsData = async () => {
    try {
      const headers = getAuthHeaders();
      const [lb, types, red] = await Promise.all([
        fetch('/api/rewards/leaderboard', { headers }).then(r => r.json()),
        fetch('/api/rewards/vouchers/available', { headers }).then(r => r.json()),
        fetch('/api/rewards/vouchers/redeemed', { headers }).then(r => r.json())
      ]);
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setVoucherTypes(Array.isArray(types) ? types : []);
      setRedeemedVouchers(Array.isArray(red) ? red : []);
    } catch (err) {
      console.error('Error fetching rewards data:', err);
      // Reset to empty arrays on error
      setLeaderboard([]);
      setVoucherTypes([]);
      setRedeemedVouchers([]);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page: filters.page.toString()
      });
      const response = await fetch(`/api/complaints/search?${queryParams}`, { headers: getAuthHeaders() });
      const data = await response.json();
      setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      fetchSlaStats();
      fetchActiveAnomalies();
      fetchRewardsData();
      fetchPendingOfficers();
      
      // Basic Overview (all for KPI cards)
      const ovRes = await fetch('/api/analytics/overview', { headers: getAuthHeaders() });
      const ovData = await ovRes.json();
      setStats({
          total: ovData.total || 0,
          pending: ovData.status?.find((s: any) => s.status === 'Pending')?.count || 0,
          inProgress: ovData.status?.find((s: any) => s.status === 'In Progress')?.count || 0,
          resolved: ovData.status?.find((s: any) => s.status === 'Resolved')?.count || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      // Reset to safe defaults
      setComplaints([]);
      setTotalCount(0);
      setTotalPages(1);
      setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || 'anonymous',
      'x-user-role': user?.role || 'visitor'
    };
  };

  // Debounced Search Effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (activeTab === 'Overview') fetchData();
      else fetchAuditLogs();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters, auditFilters, activeTab]);

  // Socket notification listener for anomalies
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || user.role !== 'Admin') return;

    import('socket.io-client').then(({ default: io }) => {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3001';
      const socket = io(socketUrl);
      socket.emit('join-room', 'Admin');
      socket.on('notification', (notif: any) => {
        if (notif.type === 'alert') {
          fetchActiveAnomalies();
        }
      });
      return () => socket.disconnect();
    });
  }, []);

  const handleExport = async () => {
    const queryParams = new URLSearchParams(filters);
    window.open(`/api/complaints/export?${queryParams}`, '_blank');
  };

  const handleAcknowledgeAnomaly = async (id: string) => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      await fetch(`/api/anomalies/${id}/acknowledge`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminId: user?.id })
      });
      fetchActiveAnomalies();
    } catch (err) {
      console.error('Error acknowledging anomaly:', err);
    }
  };

  const handleAssign = async (id: string, department: string) => {
    try {
      await fetch(`/api/complaints/${id}/assign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ department }),
      });
      fetchData();
    } catch (error) {
      console.error('Error assigning:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: ComplaintStatus) => {
    try {
      await fetch(`/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  const handleBulk = async (type: string, value?: string) => {
    if (!selectedIds.length) return;
    await fetch('/api/complaints/bulk', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ complaintIds: selectedIds, action: { type, value } })
    });
    setSelectedIds([]);
    fetchData();
  };

  const getSentimentColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-zinc-300';
    if (score < 30) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    if (score < 70) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const removeFilter = (key: string) => {
    const defaults: any = { category: 'All', priority: 'All', status: 'All', department: 'All', slaStatus: 'All', dateFrom: '', dateTo: '', q: '' };
    updateFilter(key, defaults[key]);
  };

  const slaCards = [
    { label: 'SLA On Track', value: slaStats.onTrack, color: 'text-emerald-500', bg: 'bg-emerald-500/10', status: 'On Track', icon: Shield },
    { label: 'SLA At Risk', value: slaStats.atRisk, color: 'text-amber-500', bg: 'bg-amber-500/10', status: 'At Risk', icon: Activity },
    { label: 'Breached Cases', value: slaStats.breached, color: 'text-rose-500', bg: 'bg-rose-500/10', status: 'Breached', icon: AlertTriangle },
    { label: 'Escalated Cases', value: slaStats.escalated, color: 'text-violet-500', bg: 'bg-violet-500/10', status: 'Escalated', icon: Star },
  ];

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: LayoutDashboard, color: 'bg-zinc-100 text-zinc-700' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
    { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Active Anomalies Banner */}
      <AnimatePresence>
        {activeAnomalies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 space-y-3"
          >
            {activeAnomalies.map((alert) => (
              <div 
                key={alert.id}
                className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <AlertTriangle size={80} className="text-amber-500" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0 animate-pulse">
                     <AlertTriangle size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-3 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">⚠️ Active Anomaly</span>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{alert.detected_at}</span>
                    </div>
                    <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight">
                      Sudden {alert.category} Spike in {alert.area}
                    </h3>
                    <p className="text-amber-900 font-bold text-sm mt-1">
                       Magnitude: <span className="bg-amber-500 text-white px-2 py-0.5 rounded ml-1">{alert.spike_magnitude}</span>
                    </p>
                    <div className="mt-4 p-3 bg-white/40 rounded-xl border border-amber-500/20 text-amber-900 text-xs font-medium italic">
                       "AI Observation: {alert.ai_suggestion}"
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 relative z-10 w-full md:w-auto">
                   <button 
                     onClick={() => handleAcknowledgeAnomaly(alert.id)}
                     className="flex-grow md:flex-initial px-6 py-3 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
                   >
                     Acknowledge Alert
                   </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SLA Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {slaCards.map((card) => (
          <motion.button
            key={card.label}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateFilter('slaStatus', filters.slaStatus === card.status ? 'All' : card.status)}
            className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
              filters.slaStatus === card.status 
                ? 'bg-zinc-900 border-zinc-900 shadow-xl' 
                : 'bg-white/40 backdrop-blur-md border-white shadow-sm hover:border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className={`p-2 rounded-xl ${filters.slaStatus === card.status ? 'bg-white/10' : card.bg}`}>
                <card.icon size={20} className={filters.slaStatus === card.status ? 'text-white' : card.color} />
              </div>
              <div>
                <div className={`text-2xl font-black ${filters.slaStatus === card.status ? 'text-white' : 'text-zinc-950'}`}>
                  {card.value}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${filters.slaStatus === card.status ? 'text-zinc-400' : 'text-zinc-500'}`}>
                   {card.label}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 font-display flex items-center gap-3">
            Admin Command Center
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 shadow-sm animate-pulse">
              AI Enhanced
            </div>
          </h1>
          <p className="text-lg text-zinc-600 mt-1">Overview of all public service grievances and department performance.</p>
          
          {/* Tab Switcher */}
          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setActiveTab('Overview')}
              className={`pb-2 px-1 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'Overview' ? 'text-zinc-950 border-zinc-950' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('Audit')}
              className={`pb-2 px-1 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'Audit' ? 'text-zinc-950 border-zinc-950' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
            >
              Audit Log
            </button>
            <button 
              onClick={() => setActiveTab('Rewards')}
              className={`pb-2 px-1 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'Rewards' ? 'text-zinc-950 border-zinc-950' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
            >
              Rewards
            </button>
            <button 
              onClick={() => setActiveTab('Approvals')}
              className={`pb-2 px-1 flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'Approvals' ? 'text-emerald-600 border-emerald-600' : 'text-zinc-400 border-transparent hover:text-emerald-500'}`}
            >
              Approvals {pendingOfficers.length > 0 && <span className="bg-emerald-500 text-white rounded-full px-2 text-[10px]">{pendingOfficers.length}</span>}
            </button>
            <button 
              onClick={() => { setActiveTab('Database'); fetchDbStats(); }}
              className={`pb-2 px-1 flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'Database' ? 'text-blue-600 border-blue-600' : 'text-zinc-400 border-transparent hover:text-blue-500'}`}
            >
              <Database size={14} /> DB Live
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDetectAnomalies}
            disabled={isDetectingAnomaly}
            className={`px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 border uppercase tracking-widest ${
              isDetectingAnomaly 
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200' 
                : 'bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800'
            }`}
          >
            {isDetectingAnomaly ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : <Sparkles size={16} className="text-emerald-400" />}
            AI Detect Anomalies
          </button>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Activity size={16} className="text-emerald-500" />
            Sync Data
          </button>
        </div>
      </div>

      <AnimatePresence>
        {anomalyReport && anomalyReport.isAnomaly && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-10 p-1 bg-red-500 rounded-[2rem] shadow-2xl shadow-red-500/20"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-[1.95rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <AlertTriangle size={150} />
              </div>
              
              <div className="w-20 h-20 bg-red-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-red-200 flex-shrink-0">
                <AlertTriangle size={40} className="animate-bounce" />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full">High Severity Anomaly Pattern</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">• Intelligence Alert</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-950 uppercase tracking-tight mb-2">
                  Spike Detected in {anomalyReport.affectedArea}
                </h3>
                <p className="text-zinc-600 font-medium max-w-2xl leading-relaxed">
                  {anomalyReport.reason}
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="bg-zinc-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl">
                    <Shield size={16} className="text-red-500" />
                    AI Action Blueprint: {anomalyReport.suggestedAction}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setAnomalyReport(null)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-600"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="text-4xl font-black text-zinc-950 font-display tracking-tight">{stat.value}</div>
            <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider mt-2">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Smart Search & Filters Section */}
      <AnimatePresence mode="wait">
        {activeTab === 'Overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >


            {/* Smart Search & Filters Section (Previous Features) */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-xl overflow-hidden mb-10">
              {/* ... [Existing Search & Filter UI] ... */}
              <div className="p-6 border-b border-zinc-100">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                  <div className="relative flex-grow max-w-2xl w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search by ID, name, or description..."
                      value={filters.q}
                      onChange={(e) => updateFilter('q', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-2 border-transparent focus:border-zinc-900 rounded-2xl outline-none font-bold text-zinc-900 placeholder:text-zinc-400 transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className={`flex-grow md:flex-initial px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isFiltersOpen ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white border-2 border-zinc-100 text-zinc-600 hover:bg-zinc-50'}`}
                    >
                      <Filter size={18} />
                      Filters {Object.values(filters).filter(v => v !== 'All' && v !== '' && typeof v !== 'number').length > 0 && <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] ml-1">!</span>}
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex-grow md:flex-initial px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isFiltersOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 pb-8 border-t border-zinc-100">
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Category</label>
                          <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900">
                            <option>All</option>
                            <option>Sanitation</option>
                            <option>Water Supply</option>
                            <option>Electricity</option>
                            <option>Roads & Transport</option>
                            <option>Public Safety</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Priority</label>
                          <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900">
                            <option>All</option>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Department</label>
                          <select value={filters.department} onChange={(e) => updateFilter('department', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900">
                            <option>All</option>
                            <option>Sanitation</option>
                            <option>Water Supply</option>
                            <option>Electricity</option>
                            <option>Roads & Transport</option>
                            <option>Public Safety</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">SLA Status</label>
                          <select value={filters.slaStatus} onChange={(e) => updateFilter('slaStatus', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900">
                            <option>All</option>
                            <option>On Track</option>
                            <option>At Risk</option>
                            <option>Breached</option>
                            <option>Escalated</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Date Range</label>
                          <div className="flex items-center gap-3">
                            <input type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} className="flex-grow p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" />
                            <span className="text-zinc-400"><ArrowRight size={16} /></span>
                            <input type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} className="flex-grow p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">
                            Sentiment Analysis ({filters.minSentiment}% - {filters.maxSentiment}%)
                          </label>
                          <div className="flex gap-4 items-center pt-2">
                            <input 
                              type="range" min="0" max="100" value={filters.minSentiment} 
                              onChange={(e) => updateFilter('minSentiment', parseInt(e.target.value))} 
                              className="flex-grow accent-zinc-900"
                            />
                            <input 
                              type="range" min="0" max="100" value={filters.maxSentiment} 
                              onChange={(e) => updateFilter('maxSentiment', parseInt(e.target.value))} 
                              className="flex-grow accent-zinc-900"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest"><input type="checkbox" onChange={(e)=>setSelectedIds(e.target.checked ? complaints.map(c=>c.id) : [])} /></th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">ID / AI Insight</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Citizen</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Source</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status / SLA</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Department</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isLoading ? (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-400">Loading Intelligence...</td></tr>
                    ) : complaints.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-400">No records found.</td></tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id} className="group hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={(e)=>setSelectedIds(prev=> e.target.checked ? [...prev, c.id] : prev.filter(id=>id!==c.id))} /></td>
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm font-bold text-zinc-900 mb-1">{c._id || c.id}</div>
                            <div className={`w-2 h-2 rounded-full ${getSentimentColor(c.sentiment_score)}`} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-900">{c.citizenName}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{c.category}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 text-[10px] rounded-full bg-zinc-100">{(c as any).source || 'web'}</span></td>
                          <td className="px-6 py-4">
                            <select
                              value={c.status}
                              onChange={(e) => handleStatusUpdate(c._id || c.id, e.target.value as ComplaintStatus)}
                              className="text-[10px] font-black rounded-lg border-2 border-transparent focus:border-emerald-500 py-1 pl-2 pr-6 cursor-pointer bg-zinc-100"
                            >
                              <option value={ComplaintStatus.PENDING}>Pending</option>
                              <option value={ComplaintStatus.IN_PROGRESS}>In Progress</option>
                              <option value={ComplaintStatus.RESOLVED}>Resolved</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-600">{c.department}</td>
                          <td className="px-6 py-4 text-right">
                             <button onClick={() => setSelectedComplaint(c)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                                <Sparkles size={18} />
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-zinc-100 flex items-center justify-between">
                  {selectedIds.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={() => handleBulk('change_status', 'Resolved')} className="px-3 py-1 rounded bg-zinc-900 text-white text-xs">Bulk Close</button>
                      <button onClick={() => handleBulk('escalate')} className="px-3 py-1 rounded bg-white border text-xs">Bulk Escalate</button>
                    </div>
                  )}
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page {filters.page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={filters.page === 1} onClick={() => updateFilter('page', filters.page - 1)} className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-black disabled:opacity-30">Prev</button>
                    <button disabled={filters.page === totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-black disabled:opacity-30">Next</button>
                  </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Audit Log Filters */}
            <div className="bg-white/80 p-6 rounded-3xl border border-white shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Complaint ID</label>
                  <input type="text" value={auditFilters.complaint_id} onChange={(e) => setAuditFilters(prev => ({...prev, complaint_id: e.target.value, page: 1}))} placeholder="Filter by ID..." className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">User ID</label>
                  <input type="text" value={auditFilters.user_id} onChange={(e) => setAuditFilters(prev => ({...prev, user_id: e.target.value, page: 1}))} placeholder="Filter by User..." className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">From Date</label>
                  <input type="date" value={auditFilters.dateFrom} onChange={(e) => setAuditFilters(prev => ({...prev, dateFrom: e.target.value, page: 1}))} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">To Date</label>
                  <input type="date" value={auditFilters.dateTo} onChange={(e) => setAuditFilters(prev => ({...prev, dateTo: e.target.value, page: 1}))} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" />
               </div>
            </div>

            {/* Timeline View */}
            <div className="relative pl-8 space-y-8 py-4">
               <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200" />
               {auditLogs.length === 0 ? (
                 <div className="p-12 text-center text-zinc-400 font-bold uppercase tracking-widest bg-white/50 rounded-3xl border border-white">
                    No activity records found.
                 </div>
               ) : (
                 auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                       <div className="absolute -left-5 top-2 w-2.5 h-2.5 bg-zinc-950 rounded-full border-2 border-white ring-4 ring-zinc-100" />
                       <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white p-6 shadow-xl hover:shadow-2xl transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg">
                                   {log.user_id.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                   <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                      {log.user_role} • {log.ip_address}
                                   </div>
                                   <h4 className="font-black text-zinc-950 uppercase tracking-tight text-lg">
                                      {log.action}
                                   </h4>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</div>
                                <div className="text-sm font-bold text-zinc-950">{new Date(log.created_at).toLocaleTimeString()}</div>
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center mb-4">
                             {log.complaint_id && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-black text-zinc-600 uppercase">
                                   <FileText size={12} /> Case: {log.complaint_id}
                                </div>
                             )}
                             <button 
                               onClick={() => {
                                 const el = document.getElementById(`diff-${log.id}`);
                                 if (el) el.classList.toggle('hidden');
                               }}
                               className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-950 flex items-center gap-1 transition-colors"
                             >
                               View Snapshot Diff <ChevronDown size={12} />
                             </button>
                          </div>
                          
                          <div id={`diff-${log.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                             <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Original State</span>
                                <pre className="text-[10px] font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap max-h-40">
                                   {JSON.stringify(JSON.parse(log.old_value || '{}'), null, 2)}
                                </pre>
                             </div>
                             <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Updated State</span>
                                <pre className="text-[10px] font-mono text-emerald-700 overflow-x-auto whitespace-pre-wrap max-h-40">
                                   {JSON.stringify(JSON.parse(log.new_value || '{}'), null, 2)}
                                </pre>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))
               )}
            </div>

            {/* Audit Pagination */}
            <div className="flex items-center justify-between bg-white/50 p-6 rounded-3xl border border-white">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">History Management • Page {auditFilters.page} over {auditTotalPages}</span>
                <div className="flex gap-2">
                  <button disabled={auditFilters.page === 1} onClick={() => setAuditFilters(prev => ({...prev, page: prev.page - 1}))} className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-black uppercase hover:bg-zinc-900 hover:text-white disabled:opacity-30 transition-all">Prev</button>
                  <button disabled={auditFilters.page === auditTotalPages} onClick={() => setAuditFilters(prev => ({...prev, page: prev.page + 1}))} className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-black uppercase hover:bg-zinc-900 hover:text-white disabled:opacity-30 transition-all">Next</button>
                </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Rewards' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            {/* Rewards Management Header */}
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Rewards & Civic Engagement</h2>
                  <p className="text-zinc-500 font-medium italic">Configure vouchers and monitor citizen leaderboard performance.</p>
               </div>
               <button 
                 onClick={() => setIsVoucherModalOpen(true)}
                 className="px-6 py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"
               >
                 <Plus size={16} className="text-emerald-400" />
                 Create Voucher Type
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               {/* Leaderboard */}
               <div className="lg:col-span-1 bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl h-fit">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-zinc-950 shadow-lg">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Top Citizens</h3>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest tracking-widest">Global Leaderboard</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                     {leaderboard.map((c, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:scale-105 transition-transform cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                              i === 0 ? 'bg-amber-400 text-zinc-900' : 
                              i === 1 ? 'bg-zinc-300 text-zinc-900' :
                              i === 2 ? 'bg-orange-300 text-zinc-900' :
                              'bg-zinc-100 text-zinc-400'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="font-bold text-zinc-900 group-hover:text-amber-600 transition-colors uppercase italic">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-black text-emerald-600">
                             <Star size={12} fill="currentColor" />
                             {c.points}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Voucher Types & Analytics */}
               <div className="lg:col-span-2 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {voucherTypes.map(type => (
                      <div key={type.id} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                           <Gift size={80} />
                         </div>
                         <div className="flex justify-between items-start mb-6">
                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                               {type.points_required} Points Required
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">{type.total_available} Left</span>
                         </div>
                         <h4 className="text-2xl font-black text-zinc-900 mb-1 leading-tight uppercase italic">{type.title}</h4>
                         <p className="text-zinc-500 text-sm font-medium line-clamp-2">{type.description}</p>
                         <div className="mt-6 pt-6 border-t border-zinc-50 flex gap-2">
                           <button className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Deactivate</button>
                           <button className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Edit Details</button>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Recent Redemptions</h3>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Real-time reward distribution</span>
                        </div>
                        <Calendar size={20} className="text-zinc-400" />
                      </div>

                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                           <thead>
                             <tr className="border-b border-zinc-100">
                               <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Citizen</th>
                               <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reward</th>
                               <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Voucher Code</th>
                               <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</th>
                               <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-50">
                             {paginatedVouchers.map((v, i) => (
                               <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                                 <td className="py-4">
                                   <div className="font-bold text-zinc-900 uppercase italic">{v.citizenName}</div>
                                   <div className="text-[10px] text-zinc-400 italic font-medium">{v.citizen_id}</div>
                                 </td>
                                 <td className="py-4 text-sm font-black text-zinc-700 italic uppercase">{v.title}</td>
                                 <td className="py-4">
                                   <code className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-black font-mono text-zinc-600">{v.code}</code>
                                 </td>
                                 <td className="py-4 text-xs font-bold text-zinc-500 uppercase">{new Date(v.created_at).toLocaleDateString()}</td>
                                 <td className="py-4">
                                   <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${v.is_redeemed ? 'bg-zinc-100 text-zinc-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                      {v.is_redeemed ? 'Redeemed' : 'Issued'}
                                   </span>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-zinc-100">
                         <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page {rewardsPage} of {totalRewardsPages}</span>
                         <div className="flex gap-2">
                           <button disabled={rewardsPage === 1} onClick={() => setRewardsPage(prev => prev - 1)} className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-black disabled:opacity-30">Prev</button>
                           <button disabled={rewardsPage === totalRewardsPages} onClick={() => setRewardsPage(prev => prev + 1)} className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-black disabled:opacity-30">Next</button>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Approvals' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Officer Approvals</h2>
                  <p className="text-zinc-500 font-medium italic">Review and verify new officer accounts before granting access.</p>
               </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl">
               <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-lg">
                   <UserCheck size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Pending Verifications</h3>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Awaiting Admin Action</span>
                 </div>
               </div>

               {pendingOfficers.length === 0 ? (
                 <div className="p-12 text-center text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
                    No pending officers to approve.
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="pb-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Officer Name</th>
                          <th className="pb-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email</th>
                          <th className="pb-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Department</th>
                          <th className="pb-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Verification</th>
                          <th className="pb-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {pendingOfficers.map((officer) => (
                          <tr key={officer._id || officer.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-zinc-900 lowercase capitalize">{officer.name}</td>
                            <td className="py-4 px-6 text-sm text-zinc-600">{officer.email}</td>
                            <td className="py-4 px-6 text-sm font-bold text-zinc-600">{officer.department}</td>
                            <td className="py-4 px-6">
                               <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${officer.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {officer.isVerified ? 'Verified' : 'Pending'}
                               </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => handleApproveOfficer(officer._id || officer.id)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ml-auto"
                              >
                                <Check size={16} /> Approve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'Database' && (
          <motion.div key="database" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter flex items-center gap-3"><Database size={28} /> Live Database Viewer</h2>
              <p className="text-zinc-500 font-medium italic">Real-time snapshot of all tables in the deployed database.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="password"
                placeholder="Admin DB Key"
                value={dbStatsKey}
                onChange={e => setDbStatsKey(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-zinc-200 text-sm font-mono outline-none focus:border-blue-500 transition-all"
              />
              <button onClick={() => fetchDbStats()} disabled={isLoadingDb} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-40 flex items-center gap-2">
                {isLoadingDb ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Database size={14} />}
                Refresh
              </button>
            </div>
          </div>

          {dbError && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-sm">{dbError}</div>}

          {dbStats && (
            <div className="space-y-8">
              {/* Count Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Citizens', value: dbStats.citizens, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Officers', value: dbStats.officers, color: 'bg-violet-50 text-violet-700' },
                  { label: 'Pending Approval', value: dbStats.pendingOfficers, color: 'bg-amber-50 text-amber-700' },
                  { label: 'Complaints', value: dbStats.complaints, color: 'bg-zinc-100 text-zinc-800' },
                  { label: 'Resolved', value: dbStats.resolvedComplaints, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'SLA Breached', value: dbStats.slaBreached, color: 'bg-red-50 text-red-700' },
                  { label: 'Audit Logs', value: dbStats.auditLogs, color: 'bg-zinc-100 text-zinc-600' },
                  { label: 'Feedback Sent', value: dbStats.feedbackTokens, color: 'bg-indigo-50 text-indigo-700' },
                  { label: 'Feedback Done', value: dbStats.feedbackSubmitted, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Notifications', value: dbStats.notifications, color: 'bg-pink-50 text-pink-700' },
                  { label: 'Vouchers', value: dbStats.vouchers, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Admins', value: dbStats.admins, color: 'bg-zinc-900 text-white' },
                ].map((c, i) => (
                  <div key={i} className={`p-4 rounded-2xl ${c.color} shadow-sm border border-white`}>
                    <div className="text-2xl font-black">{c.value}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Users Table */}
              <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl">
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6 flex items-center gap-2"><Users size={18} className="text-blue-500" /> Recent Users (Officers & Admins)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-zinc-100">
                      {['ID','Name','Email','Role','Verified','Approved'].map(h => <th key={h} className="pb-3 px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-50">
                      {dbStats.recentUsers?.map((u: any) => (
                        <tr key={u._id || u.id} className="hover:bg-zinc-50">
                          <td className="py-3 px-3 font-mono text-xs text-zinc-400">{u._id || u.id}</td>
                          <td className="py-3 px-3 font-bold text-zinc-900">{u.name}</td>
                          <td className="py-3 px-3 text-zinc-600 text-xs">{u.email}</td>
                          <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${u.role === 'Admin' ? 'bg-zinc-900 text-white' : 'bg-violet-100 text-violet-700'}`}>{u.role}</span></td>
                          <td className="py-3 px-3"><span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{u.isVerified ? 'Yes' : 'No'}</span></td>
                          <td className="py-3 px-3"><span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${u.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.isApproved ? 'Yes' : 'No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Complaints */}
              <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl">
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6 flex items-center gap-2"><FileText size={18} className="text-emerald-500" /> Recent Complaints</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-zinc-100">
                      {['ID','Citizen','Category','Status','Priority','Filed On'].map(h => <th key={h} className="pb-3 px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-50">
                      {dbStats.recentComplaints?.map((c: any) => (
                        <tr key={c._id || c.id} className="hover:bg-zinc-50">
                          <td className="py-3 px-3 font-mono text-xs text-zinc-400">{c._id || c.id}</td>
                          <td className="py-3 px-3 font-bold text-zinc-900">{c.citizenName}</td>
                          <td className="py-3 px-3 text-zinc-600 text-xs">{c.category}</td>
                          <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span></td>
                          <td className="py-3 px-3 text-xs font-bold text-zinc-600">{c.priority}</td>
                          <td className="py-3 px-3 text-xs text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Citizens */}
              <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl">
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6 flex items-center gap-2"><Star size={18} className="text-amber-500" /> Recent Citizens</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-zinc-100">
                      {['ID','Name','Email','Points','Complaints','Verified'].map(h => <th key={h} className="pb-3 px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-50">
                      {dbStats.recentCitizens?.map((c: any) => (
                        <tr key={c._id || c.id} className="hover:bg-zinc-50">
                          <td className="py-3 px-3 font-mono text-xs text-zinc-400">{c._id || c.id}</td>
                          <td className="py-3 px-3 font-bold text-zinc-900">{c.name}</td>
                          <td className="py-3 px-3 text-zinc-600 text-xs">{c.email}</td>
                          <td className="py-3 px-3 font-black text-emerald-600">+{c.total_points}</td>
                          <td className="py-3 px-3 text-zinc-700 font-bold">{c.total_complaints}</td>
                          <td className="py-3 px-3"><span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${c.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.isVerified ? 'Yes' : 'No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

      <AnimatePresence>
        {isVoucherModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsVoucherModalOpen(false)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white">
                <h3 className="text-2xl font-black text-zinc-950 uppercase tracking-tighter mb-8">Deploy New Voucher</h3>
                <form onSubmit={handleCreateVoucher} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Voucher Title</label>
                      <input 
                        required 
                        type="text" 
                        value={newVoucher.title} 
                        onChange={e => setNewVoucher({...newVoucher, title: e.target.value})}
                        className="w-full px-5 py-3 rounded-2xl border-2 border-zinc-100 focus:border-emerald-500 outline-none transition-all font-bold italic"
                        placeholder="e.g. Free Bus Pass (Weekly)"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Strategy Description</label>
                      <textarea 
                        required 
                        rows={3}
                        value={newVoucher.description} 
                        onChange={e => setNewVoucher({...newVoucher, description: e.target.value})}
                        className="w-full px-5 py-3 rounded-2xl border-2 border-zinc-100 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="Detail the benefits and conditions..."
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Point Cost</label>
                        <input 
                          required 
                          type="number" 
                          value={newVoucher.points_required || ''} 
                          onChange={e => setNewVoucher({...newVoucher, points_required: Number(e.target.value)})}
                          className="w-full px-5 py-3 rounded-2xl border-2 border-zinc-100 focus:border-emerald-500 outline-none transition-all font-bold"
                          placeholder="Points"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Amount</label>
                        <input 
                          required 
                          type="number" 
                          value={newVoucher.total_available || ''} 
                          onChange={e => setNewVoucher({...newVoucher, total_available: Number(e.target.value)})}
                          className="w-full px-5 py-3 rounded-2xl border-2 border-zinc-100 focus:border-emerald-500 outline-none transition-all font-bold"
                          placeholder="Available"
                        />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-4 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all pt-10">Deploy Reward Protocol</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-950 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="text-emerald-500" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Analysis Case File</span>
                  </div>
                  <h3 className="text-2xl font-black font-mono tracking-tight">{selectedComplaint._id || selectedComplaint.id}</h3>
                </div>
                <button 
                  onClick={() => setSelectedComplaint(null)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors shadow-lg active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Citizen Information</span>
                    <div className="text-lg font-bold text-zinc-900">{selectedComplaint.citizenName}</div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="text-sm text-zinc-500 font-semibold flex items-center gap-2">
                        <AlertCircle size={14} className="text-emerald-600" />
                        {selectedComplaint.citizen_email || selectedComplaint.contactInfo}
                      </div>
                      <div className="text-sm text-zinc-600 font-semibold flex items-center gap-2">
                        <Phone size={14} className="text-emerald-600" />
                        {selectedComplaint.citizen_phone || 'Not provided'}
                      </div>
                    </div>
                    { (selectedComplaint as any).address && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-emerald-600">
                        <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                        <span>{(selectedComplaint as any).address}</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-zinc-600 bg-white px-3 py-1 rounded-full w-fit shadow-sm">
                      <Tag size={12} className="text-emerald-500" />
                      {selectedComplaint.category}
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Current Status</span>
                    <div className="flex flex-col gap-2">
                      <div className={`px-4 py-1.5 rounded-xl text-sm font-black w-fit border shadow-sm ${
                        selectedComplaint.status === ComplaintStatus.PENDING ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        selectedComplaint.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                        {selectedComplaint.status.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold ml-1 uppercase">{selectedComplaint.department} Dept.</div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Citizen Statement</h4>
                  <div className="bg-zinc-900 p-6 rounded-3xl text-white/90 italic text-lg shadow-xl shadow-zinc-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
                    "{selectedComplaint.description}"
                  </div>
                </div>

                { (selectedComplaint as any).complaint_image && (
                  <div className="mb-8">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Photo Evidence</h4>
                    <div className="rounded-3xl overflow-hidden border-2 border-zinc-100 shadow-md aspect-video bg-zinc-50">
                      <img 
                        src={(selectedComplaint as any).complaint_image} 
                        alt="Issue" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}

                {/* AI Insights Collapsible Section */}
                <div className="bg-emerald-50/50 backdrop-blur-md rounded-[2rem] border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/5 overflow-hidden">
                  <button 
                    onClick={() => setIsAiInsightsOpen(!isAiInsightsOpen)}
                    className="w-full p-6 flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">AI Insights & Intelligence</h4>
                    </div>
                    <ChevronDown size={20} className={`text-emerald-600 transition-transform duration-300 ${isAiInsightsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isAiInsightsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="p-6 pt-0 space-y-6">
                          <p className="text-zinc-600 text-sm leading-relaxed border-l-3 border-emerald-500 pl-4 py-1 italic bg-white/40 rounded-r-xl">
                            "{selectedComplaint.ai_summary || "Automated analysis pending..."}"
                          </p>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Sentiment</span>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getSentimentColor(selectedComplaint.sentiment_score)}`} />
                                <span className="font-bold text-zinc-900">{selectedComplaint.sentiment_score}% Positive</span>
                              </div>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">AI Priority</span>
                              <div className="flex items-center gap-2">
                                <Star size={14} className="text-emerald-500" />
                                <span className="font-bold text-zinc-900">{selectedComplaint.ai_priority || "Medium"}</span>
                              </div>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Window</span>
                              <div className="flex items-center gap-2 text-zinc-900 font-bold">
                                <Clock size={14} className="text-emerald-500" />
                                {selectedComplaint.estimated_resolution_days || 7} Days
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Urgency Intelligence</span>
                              <div className={`text-sm font-black px-3 py-1 rounded-full w-fit ${
                                selectedComplaint.urgency_level === 'Urgent' ? 'bg-red-50 text-red-600' :
                                selectedComplaint.urgency_level === 'High' ? 'bg-orange-50 text-orange-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {selectedComplaint.urgency_level?.toUpperCase() || "MEDIUM"} PRIORITY DETECTED
                              </div>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Recommended Dept</span>
                              <div className="text-sm font-black text-zinc-900 flex items-center gap-2">
                                <Building2 size={14} className="text-emerald-500" />
                                {selectedComplaint.recommended_department || "General"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(selectedComplaint.ai_tags || '[]').map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-white text-emerald-700 text-[10px] font-black uppercase tracking-tighter rounded-full border border-emerald-100 shadow-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="pt-2">
                            <button 
                              onClick={() => {
                                handleAssign(selectedComplaint._id || selectedComplaint.id, selectedComplaint.recommended_department || 'General');
                                setSelectedComplaint(null);
                              }}
                              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Check size={18} className="text-emerald-500" />
                              Auto-Assign to Recommended Dept
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
