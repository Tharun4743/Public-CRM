import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Send, Loader2, CheckCircle2, AlertCircle, Info, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Feedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [complaint, setComplaint] = React.useState<any>(null);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setError('Invalid Feedback Link');
      setIsLoading(false);
      return;
    }

    const fetchComplaint = async () => {
      try {
        const res = await fetch(`/api/feedback/complaint?token=${token}`);
        if (!res.ok) throw new Error('Invalid or expired feedback token');
        const data = await res.json();
        setComplaint(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaint();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Feedback Loop...</p>
        </div>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-2">Access Denied</h2>
          <p className="text-zinc-600 mb-8">{error}</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all">Return Home</button>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-emerald-100 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-4 uppercase tracking-tight">Feedback Received</h2>
          <p className="text-zinc-600 text-lg mb-10 font-medium">Thank you for helping us improve our public services. Your voice drives our growth.</p>
          {rating < 3 && (
             <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-10 text-left">
               <div className="flex items-center gap-3 mb-2">
                 <Info className="text-amber-600" size={20} />
                 <span className="text-xs font-black text-amber-900 uppercase tracking-widest">Automatic Re-Opening</span>
               </div>
               <p className="text-sm text-amber-800 font-medium leading-relaxed">System Intelligence detected a low satisfaction score. Your case <strong>{complaint?.id}</strong> has been automatically re-opened for senior management review.</p>
             </div>
          )}
          <button onClick={() => navigate('/')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200">Close Portal</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl border border-zinc-100 overflow-hidden">
          <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Sparkles size={14} /> Compliance Satisfaction Portal
              </div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">{complaint?.category}</h2>
              <p className="text-sm font-mono font-bold text-zinc-400 mt-1">{complaint?.id}</p>
            </div>
            <div className="bg-emerald-100 px-4 py-2 rounded-xl text-emerald-700 text-xs font-black uppercase tracking-widest shadow-sm">Status: Resolved</div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-10">
            <div>
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" /> Overall Experience
              </h3>
              <div className="flex items-center justify-between gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-2 transition-transform active:scale-90"
                  >
                    <Star
                      size={48}
                      className={`transition-all duration-300 ${
                        (hoverRating || rating) >= s
                          ? 'fill-amber-400 text-amber-400 drop-shadow-lg scale-110'
                          : 'text-zinc-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
                <span>Poor</span>
                <span>Exceptional</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <MessageSquare size={16} /> Optional Comments
              </h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How can we further improve your experience?"
                rows={4}
                className="w-full px-6 py-4 rounded-3xl border-2 border-zinc-100 bg-zinc-50 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-zinc-900 placeholder:text-zinc-300"
              />
            </div>

            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full py-5 bg-zinc-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="text-emerald-400" />}
              {isSubmitting ? 'Transmitting Data...' : 'Submit Satisfaction Feedback'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
