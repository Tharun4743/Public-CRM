import React from 'react';
import { Search, Loader2, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Info, Download, Sparkles, X, Camera, Phone, Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import io from 'socket.io-client';
import { Complaint, ComplaintStatus } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const CitizenTrack = () => {
  const [searchId, setSearchId] = React.useState('');
  const [complaint, setComplaint] = React.useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<{ url: string; title: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const location = useLocation();
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  const performSearch = async (id: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/complaints/${id.toUpperCase()}`);
      if (!response.ok) throw new Error('Complaint not found. Please check your ID.');
      const data = await response.json();
      setComplaint(data);
    } catch (err: any) {
      setError(err.message);
      setComplaint(null);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setSearchId(id);
      performSearch(id);
    }
  }, [location.search]);

  React.useEffect(() => {
    if (!complaint?.id) return;
    const socket = io();
    socket.emit('join-room', complaint.id);
    socket.on('notification', () => performSearch(complaint.id, true));
    return () => { socket.disconnect(); };
  }, [complaint?.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    performSearch(searchId);
  };

  const downloadInvoice = async () => {
    if (!complaint || !invoiceRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${complaint.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case ComplaintStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case ComplaintStatus.RESOLVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-zinc-900">Track Your Complaint</h1>
        <p className="text-xl text-zinc-500 mt-3">Enter your tracking ID to see real-time updates.</p>
      </div>

      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Tracking ID (e.g., CMP-ABC123XYZ)"
            className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-zinc-200 bg-white shadow-lg focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 outline-none transition-all text-lg font-mono text-zinc-900"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      {complaint && (
        <div className="space-y-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={downloadInvoice}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-70"
            >
              <Download size={20} />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </button>
          </div>

          {(complaint as any).sla_deadline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 text-zinc-900 shadow-2xl relative overflow-hidden border border-zinc-100"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Clock size={80} />
              </div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Service Level Agreement</h3>
                  <div className="text-2xl font-black uppercase tracking-tight">Resolution Countdown</div>
                </div>
                <div className="text-right">
                   <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Status</div>
                   <div className={`text-sm font-black uppercase px-3 py-1 rounded-full border ${
                     (complaint as any).sla_status === 'Breached' ? 'bg-rose-500/10 text-rose-600 border-rose-200' :
                     (complaint as any).sla_status === 'At Risk' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                     'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                   }`}>
                     {(complaint as any).sla_status}
                   </div>
                </div>
              </div>
              
              <SLABar deadline={(complaint as any).sla_deadline} createdAt={complaint.createdAt} />
              
              <div className="mt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <span>Registration: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                <span className="text-emerald-600">Target: {new Date((complaint as any).sla_deadline).toLocaleString()}</span>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} ref={invoiceRef} className="bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden">
            <div className="p-8 border-b-4 border-emerald-600 bg-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tracking Record</span>
                <h2 className="text-3xl font-mono font-black text-zinc-900 mt-1">{complaint.id}</h2>
              </div>
              <div className={`px-6 py-2 rounded-full text-base font-black border shadow-sm ${getStatusColor(complaint.status)}`}>
                {complaint.status.toUpperCase()}
              </div>
            </div>

            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-2">Subject Information</span>
                  <div className="text-zinc-900 font-bold text-lg">{complaint.citizenName}</div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                      <AlertCircle size={12} className="text-emerald-500" />
                      {complaint.citizen_email || (complaint as any).contactInfo}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-2">Target Sector</span>
                  <div className="text-zinc-900 font-bold text-lg">{complaint.department}</div>
                  <div className="text-zinc-500 text-sm font-medium">{complaint.category} Category</div>
                </div>
              </div>

              { (complaint as any).address && (
                <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-sm">
                  <MapPin size={20} className="flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70 mb-0.5">Reported Location</span>
                    <span className="text-sm font-bold">{ (complaint as any).address }</span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">Grievance Profile</span>
                <div className="bg-zinc-900 p-8 rounded-[2rem] text-white/95 italic text-xl border-l-8 border-emerald-500 shadow-2xl">
                  "{complaint.description}"
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxImage(null)} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/20 bg-black">
              <img src={lightboxImage.url} alt="Proof" className="w-full h-full object-contain" />
              <button onClick={() => setLightboxImage(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center backdrop-blur-md transition-all">
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SLABar = ({ deadline, createdAt }: { deadline: string; createdAt: string }) => {
  const [progress, setProgress] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = new Date(createdAt).getTime();
      const end = new Date(deadline).getTime();
      
      const total = end - start;
      const elapsed = now - start;
      const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      setProgress(pct);

      const remaining = end - now;
      if (remaining <= 0) {
        setTimeLeft('SLA Breached');
      } else {
        const h = Math.floor(remaining / (1000 * 60 * 60));
        const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s remaining`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline, createdAt]);

  return (
    <div className="space-y-4">
      <div className="h-6 w-full bg-zinc-100 rounded-full overflow-hidden p-1 shadow-inner ring-1 ring-zinc-200">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`h-full rounded-full shadow-lg relative ${
            progress > 90 ? 'bg-gradient-to-r from-rose-500 to-rose-400' :
            progress > 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
            'bg-gradient-to-r from-emerald-500 to-emerald-400'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse" />
        </motion.div>
      </div>
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
         <span className="text-zinc-500">Utilization Strategy: {Math.round(progress)}%</span>
         <span className={progress > 90 ? 'text-rose-400' : 'text-emerald-400'}>{timeLeft}</span>
      </div>
    </div>
  );
};
