import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, CheckCircle2, AlertCircle, Building2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Complaint, ComplaintStatus, ComplaintStats } from '../types';

export const AdminDashboard = () => {
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [stats, setStats] = React.useState<ComplaintStats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/complaints');
      const data = await response.json();
      setComplaints(data);
      
      const newStats = data.reduce((acc: any, curr: Complaint) => {
        acc.total++;
        if (curr.status === ComplaintStatus.PENDING) acc.pending++;
        if (curr.status === ComplaintStatus.IN_PROGRESS) acc.inProgress++;
        if (curr.status === ComplaintStatus.RESOLVED) acc.resolved++;
        return acc;
      }, { total: 0, pending: 0, inProgress: 0, resolved: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (id: string, department: string) => {
    try {
      await fetch(`/api/complaints/${id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: LayoutDashboard, color: 'bg-zinc-100 text-zinc-700' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
    { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 font-display">Admin Command Center</h1>
          <p className="text-lg text-zinc-600 mt-1">Overview of all public service grievances and department performance.</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold hover:bg-zinc-50 transition-colors"
        >
          Refresh Data
        </button>
      </div>

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

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="font-bold text-zinc-900">Recent Complaints</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">All Departments</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Complaint ID</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Citizen</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">Loading complaints...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">No complaints found.</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-zinc-900">{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-zinc-900">{c.citizenName}</div>
                      <div className="text-xs text-zinc-500">{c.contactInfo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{c.category}</td>
                    <td className="px-6 py-4">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusUpdate(c.id, e.target.value as ComplaintStatus)}
                        className={`text-xs font-bold rounded-lg border-none focus:ring-2 focus:ring-emerald-500 py-1.5 pl-3 pr-8 cursor-pointer transition-all ${
                          c.status === ComplaintStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                          c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <option value={ComplaintStatus.PENDING}>Pending</option>
                        <option value={ComplaintStatus.IN_PROGRESS}>In Progress</option>
                        <option value={ComplaintStatus.RESOLVED}>Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.department}
                        onChange={(e) => handleAssign(c.id, e.target.value)}
                        className="text-sm bg-transparent border-none focus:ring-0 text-zinc-600 font-medium cursor-pointer"
                      >
                        <option>Unassigned</option>
                        <option>Sanitation</option>
                        <option>Water Supply</option>
                        <option>Electricity</option>
                        <option>Roads & Transport</option>
                        <option>Public Safety</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        to={`/track?id=${c.id}`}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                        title="View Tracking Page"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
