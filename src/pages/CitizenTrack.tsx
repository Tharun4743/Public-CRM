import React from 'react';
import { Search, Loader2, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Complaint, ComplaintStatus } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const CitizenTrack = () => {
  const [searchId, setSearchId] = React.useState('');
  const [complaint, setComplaint] = React.useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const location = useLocation();

  const invoiceRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setSearchId(id);
      performSearch(id);
    }
  }, [location.search]);

  const performSearch = async (id: string) => {
    setIsLoading(true);
    setError(null);
    setComplaint(null);

    try {
      const response = await fetch(`/api/complaints/${id.toUpperCase()}`);
      if (!response.ok) {
        throw new Error('Complaint not found. Please check your ID.');
      }
      const data = await response.json();
      setComplaint(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    performSearch(searchId);
  };

  const downloadInvoice = async () => {
    if (!complaint || !invoiceRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

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
        <p className="text-xl text-zinc-600 mt-3">Enter your unique tracking ID to see the real-time status of your grievance.</p>
      </div>

      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Tracking ID (e.g., CMP-ABC123XYZ)"
            className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-zinc-300 bg-white shadow-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-lg font-mono text-zinc-900 placeholder:text-zinc-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3"
        >
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      {complaint && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={downloadInvoice}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              {isGenerating ? 'Generating PDF...' : 'Download Invoice'}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            ref={invoiceRef}
            className="bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden"
          >
            {/* Invoice Header */}
            <div className="p-8 border-b-4 border-emerald-500 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black">PS</div>
                  <span className="text-lg font-black text-zinc-900 tracking-tight">PUBLIC SERVICES CRM</span>
                </div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Official Complaint Invoice</span>
                <h2 className="text-3xl font-mono font-black text-zinc-900 mt-1">{complaint.id}</h2>
              </div>
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className={`px-6 py-2 rounded-full text-base font-black border shadow-sm ${getStatusColor(complaint.status)}`}>
                  {complaint.status.toUpperCase()}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Priority Level</span>
                  <span className={`text-sm font-black ${complaint.priority === 'Urgent' ? 'text-red-600' :
                    complaint.priority === 'High' ? 'text-orange-600' : 'text-zinc-600'
                    }`}>{complaint.priority.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-10">
              {/* Call Details / Citizen Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                      Citizen Information ("Call Details")
                    </h3>
                    <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                          <Info size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Full Name</div>
                          <div className="text-zinc-900 font-bold text-lg">{complaint.citizenName}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Contact Details</div>
                          <div className="text-zinc-900 font-bold text-lg">{complaint.contactInfo}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                      Complaint Timeline
                    </h3>
                    <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Submission Date</div>
                          <div className="text-zinc-900 font-bold text-lg">
                            {new Date(complaint.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                          <Clock size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Last System Update</div>
                          <div className="text-zinc-900 font-bold text-lg">
                            {new Date(complaint.updatedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department & Category */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-zinc-100">
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Target Department</div>
                  <div className="text-xl font-black text-zinc-900">{complaint.department}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Issue Category</div>
                  <div className="text-xl font-black text-zinc-900">{complaint.category}</div>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Detailed Description</h3>
                <div className="bg-zinc-900 p-8 rounded-[2rem] text-white/90 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                  <p className="text-xl leading-relaxed italic font-serif">
                    "{complaint.description}"
                  </p>
                </div>
              </div>

              {/* Resolution Track (Visual Only for Invoice) */}
              <div className="pt-6">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 text-center">Authentication & Verification</h3>
                <div className="flex justify-between items-center max-w-xl mx-auto relative px-10">
                  <div className="absolute left-10 right-10 top-5 h-0.5 bg-zinc-100 -z-0"></div>
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={20} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Verified</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${complaint.status !== ComplaintStatus.PENDING ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-zinc-200 border-2 border-zinc-50'}`}>
                      {complaint.status !== ComplaintStatus.PENDING ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${complaint.status !== ComplaintStatus.PENDING ? 'text-emerald-600' : 'text-zinc-300'}`}>Assigned</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${complaint.status === ComplaintStatus.RESOLVED ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-zinc-200 border-2 border-zinc-50'}`}>
                      {complaint.status === ComplaintStatus.RESOLVED ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${complaint.status === ComplaintStatus.RESOLVED ? 'text-emerald-600' : 'text-zinc-300'}`}>Completed</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-10 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Generated On</p>
                  <p className="text-xs font-black text-zinc-900">{new Date().toLocaleString()}</p>
                </div>
                <div className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Official Record
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">System Signature</p>
                  <p className="text-xs font-mono font-bold text-zinc-900">{Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
