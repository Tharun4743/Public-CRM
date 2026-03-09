import React from 'react';
import { Send, User, Phone, Tag, AlignLeft, AlertCircle, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { ComplaintPriority } from '../types';

export const CitizenSubmit = () => {
  const [formData, setFormData] = React.useState({
    citizenName: '',
    contactInfo: '',
    category: 'General',
    description: '',
    priority: ComplaintPriority.MEDIUM,
    department: 'Unassigned'
  });
  const [submittedId, setSubmittedId] = React.useState<string | null>(null);
  const [submittedData, setSubmittedData] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDownload = () => {
    if (!submittedData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add Branding
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PS-CRM', 20, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Public Services - Complaint Acknowledgement', 20, 33);

    // Content Section
    doc.setTextColor(39, 39, 42); // zinc-900
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TRACKING ID:', 20, 60);

    doc.setFontSize(28);
    doc.setTextColor(5, 150, 105);
    doc.text(submittedData.id, 20, 75);

    doc.setDrawColor(228, 228, 231); // zinc-200
    doc.line(20, 85, pageWidth - 20, 85);

    doc.setTextColor(39, 39, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Citizen Information', 20, 100);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${submittedData.citizenName}`, 20, 110);
    doc.text(`Contact: ${submittedData.contactInfo}`, 20, 118);

    doc.setFont('helvetica', 'bold');
    doc.text('Complaint Details', 20, 135);

    doc.setFont('helvetica', 'normal');
    doc.text(`Category: ${submittedData.category}`, 20, 145);
    doc.text(`Priority: ${submittedData.priority}`, 20, 153);
    doc.text(`Status: ${submittedData.status || 'Pending'}`, 20, 161);
    doc.text(`Submitted On: ${new Date().toLocaleString()}`, 20, 169);

    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, 185);

    doc.setFont('helvetica', 'normal');
    const splitDescription = doc.splitTextToSize(submittedData.description, pageWidth - 40);
    doc.text(splitDescription, 20, 195);

    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122); // zinc-500
    doc.text('Please save this document for future reference. Use your Tracking ID to monitor status.', 20, 270);

    doc.save(`acknowledgement-${submittedData.id}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setSubmittedId(data.id);
      setSubmittedData(data);
      setFormData({
        citizenName: '',
        contactInfo: '',
        category: 'General',
        description: '',
        priority: ComplaintPriority.MEDIUM,
        department: 'Unassigned'
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-12 p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Send size={32} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Complaint Submitted Successfully!</h2>
        <p className="text-zinc-600 mb-6">A confirmation email with your tracking ID has been sent to your contact address.</p>
        <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-200 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Send size={80} />
          </div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">Your Unique Tracking ID</span>
          <div className="text-4xl font-mono font-black text-emerald-800 tracking-tighter">{submittedId}</div>
          <p className="text-xs text-emerald-600 mt-3 font-medium">Please save this ID. You will need it to track your complaint status.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownload}
            className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Acknowledgement
          </button>
          <button
            onClick={() => {
              setSubmittedId(null);
              setSubmittedData(null);
            }}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            Submit Another Complaint
          </button>
        </div>
      </motion.div >
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-zinc-900">Submit a Complaint</h1>
        <p className="text-xl text-zinc-600 mt-3">Your feedback helps us improve public services. Please provide as much detail as possible.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/20 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <User size={18} className="text-emerald-600" />
              Full Name
            </label>
            <input
              required
              type="text"
              value={formData.citizenName}
              onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 bg-white/90 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-lg text-zinc-900 font-medium placeholder:text-zinc-400"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-3">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <Phone size={18} className="text-emerald-600" />
              Contact Info (Email/Phone)
            </label>
            <input
              required
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 bg-white/90 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-lg text-zinc-900 font-medium placeholder:text-zinc-400"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <Tag size={18} className="text-emerald-600" />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 bg-white/90 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none text-lg text-zinc-900 font-medium"
            >
              <option>Sanitation</option>
              <option>Water Supply</option>
              <option>Electricity</option>
              <option>Roads & Transport</option>
              <option>Public Safety</option>
              <option>General</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
              <AlertCircle size={18} className="text-emerald-600" />
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as ComplaintPriority })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 bg-white/90 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none text-lg text-zinc-900 font-medium"
            >
              <option value={ComplaintPriority.LOW}>Low</option>
              <option value={ComplaintPriority.MEDIUM}>Medium</option>
              <option value={ComplaintPriority.HIGH}>High</option>
              <option value={ComplaintPriority.URGENT}>Urgent</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-base font-bold text-zinc-900 flex items-center gap-2 ml-1">
            <AlignLeft size={18} className="text-emerald-600" />
            Description
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-300 bg-white/90 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-lg text-zinc-900 font-medium placeholder:text-zinc-400"
            placeholder="Describe your issue in detail..."
          />
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Submitting...' : (
            <>
              <Send size={18} />
              Submit Complaint
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
};
