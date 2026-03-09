import React from 'react';
import { Building2, CheckCircle2, Clock, AlertCircle, Filter, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Complaint, ComplaintStatus } from '../types';

export const DepartmentDashboard = () => {
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [selectedDept, setSelectedDept] = React.useState('Sanitation');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/complaints');
      const data = await response.json();
      // Filter by department on frontend for this demo
      setComplaints(data.filter((c: Complaint) => c.department === selectedDept));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
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

  const departments = [
    'Sanitation', 'Water Supply', 'Electricity', 'Roads & Transport', 'Public Safety'
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 font-display">Officer Portal</h1>
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
        {/* Statistics Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-emerald-500/20">
            <h3 className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-6">Department Performance</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-black font-display">{complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length}</span>
              <span className="text-emerald-100 text-base mb-2 font-medium">Resolved this month</span>
            </div>
            <div className="w-full bg-emerald-500/30 h-2 rounded-full mt-4">
              <div 
                className="bg-white h-full rounded-full" 
                style={{ width: `${(complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length / (complaints.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6">Current Workload</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-base font-bold text-zinc-600">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  Pending
                </div>
                <span className="text-2xl font-black text-zinc-950 font-display">{complaints.filter(c => c.status === ComplaintStatus.PENDING).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-base font-bold text-zinc-600">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <AlertCircle size={20} className="text-blue-600" />
                  </div>
                  In Progress
                </div>
                <span className="text-2xl font-black text-zinc-950 font-display">{complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-zinc-900">Assigned Tasks</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <Filter size={14} />
              FILTERED BY {selectedDept.toUpperCase()}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-100">Loading tasks...</div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-100">No tasks assigned to this department.</div>
          ) : (
            complaints.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm hover:border-emerald-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{c.id}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        c.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                        c.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-zinc-50 text-zinc-600 border-zinc-100'
                      }`}>
                        {c.priority} Priority
                      </span>
                    </div>
                    <h3 className="font-bold text-zinc-900">{c.category}</h3>
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
                
                <p className="text-sm text-zinc-600 mb-4 line-clamp-2 group-hover:line-clamp-none transition-all">
                  {c.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {c.citizenName.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-zinc-500">{c.citizenName}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    View Details
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
