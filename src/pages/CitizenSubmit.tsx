
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, User, Mail, Phone, Tag, AlertCircle, AlignLeft, Sparkles, 
  Check, Loader2, ArrowRight, ShieldCheck, MapPin, Navigation, X, Camera, Star 
} from 'lucide-react';
import { ComplaintPriority } from '../types';
import { CitizenNavbar } from '../components/CitizenNavbar';
import { getCitizenToken, isCitizenLoggedIn } from '../utils/citizenAuth';

export const CitizenSubmit = () => {
  const navigate = useNavigate();
  const isLoggedIn = isCitizenLoggedIn();

  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/citizen-login?redirect=/citizen');
    }
  }, [isLoggedIn, navigate]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(false);
  const [submittedId, setSubmittedId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    citizenName: '',
    citizen_email: '',
    citizen_phone: '',
    category: 'Sanitation',
    priority: ComplaintPriority.LOW,
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    complaint_image: '',
    citizen_id: ''
  });
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<any>(null);
  const [duplicateData, setDuplicateData] = React.useState<any>(null);
  const [imageError, setImageError] = React.useState('');
  const [pointsPreview, setPointsPreview] = React.useState(10);



  React.useEffect(() => {
    const checkConnectivity = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);
    
    // Fetch citizen profile if logged in
    const fetchMe = async () => {
      if (isLoggedIn) {
        try {
          const token = getCitizenToken();
          const res = await fetch('/api/citizens/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data) {
            setFormData(prev => ({
              ...prev,
              citizenName: data.name,
              citizen_email: data.email,
              citizen_phone: data.phone || '',
              citizen_id: data._id || data.id || ''
            }));
          }
        } catch (err) {}
      }
    };
    fetchMe();

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
    };
  }, [isLoggedIn]);

  // Points preview update
  React.useEffect(() => {
    let p = 10;
    if (formData.complaint_image) p += 5;
    if (formData.latitude) p += 5;
    setPointsPreview(p);
  }, [formData.complaint_image, formData.latitude]);

  const handleAIAnalyze = async () => {
     if (formData.description.length < 10) return;
     setIsAnalyzing(true);
     try {
        const token = getCitizenToken();
        const res = await fetch('/api/ai/analyze', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             ...(token ? { 'Authorization': `Bearer ${token}` } : {})
           },
           body: JSON.stringify({ description: formData.description, category: formData.category })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'AI request failed');
        }
        const data = await res.json();
        setAiAnalysis(data);
     } catch (e: any) {
        alert(e?.message || "AI node unreachable");
     } finally {
        setIsAnalyzing(false);
     }
  };

  const applyAISuggestion = () => {
     if (!aiAnalysis) return;
     setFormData(prev => ({
        ...prev,
        category: aiAnalysis.recommendedDepartment || prev.category,
        priority: aiAnalysis.suggestedPriority || prev.priority
     }));
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          setFormData(prev => ({ ...prev, address: data.display_name }));
        } catch (e) {
          setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        setIsGettingLocation(false);
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image too large — max 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, complaint_image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent, forceSubmit = false) => {
    e?.preventDefault();

    if (!formData.address || !formData.latitude || !formData.longitude || !formData.complaint_image) {
      alert("⚠️ Mandatory Requirements Missing: You must provide a Photo Evidence and GPS Location to deploy this report.");
      return;
    }

    setIsLoading(true);

    try {
      const token = getCitizenToken();
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, forceSubmit })
      });

      const data = await response.json();

      if (response.status === 409 && data.matchedComplaint) {
         setDuplicateData(data);
         setIsLoading(false);
         return;
      }

      if (response.ok) {
        setSubmittedId(data._id || data.id);
      } else {
        alert(data.message || "Registry Failure");
      }
    } catch (error) {
       alert("Connection Interrupted");
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedId) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <CitizenNavbar />
        <div className="max-w-4xl mx-auto py-20 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto p-12 bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-zinc-900 mb-3 tracking-tighter uppercase italic">Case Registered</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-10 italic text-balance">A confirmation email has been dispatched with tracking credentials.</p>
            
            <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-100 mb-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={120} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Secure Tracking ID</span>
              <div className="text-5xl font-mono font-black text-emerald-600 tracking-tighter select-all">{submittedId}</div>
              <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm bg-white py-2 rounded-xl">
                <Star size={16} fill="currentColor" />
                <span>+20 Points Awarded to your profile</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/citizen-dashboard?refresh=true')}
              className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-emerald-100"
            >
              Monitor Deployment
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 bg-zinc-50 text-zinc-900 font-bold italic outline-none focus:border-emerald-600 transition-all text-sm";
  const labelClass = "text-[10px] font-black text-zinc-900 flex items-center gap-2 ml-1 uppercase tracking-widest";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <CitizenNavbar />
      
      <div className="max-w-[1400px] mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-zinc-200 flex flex-col md:flex-row items-center justify-between text-zinc-900 shadow-2xl gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-inner">
                  <User className="text-emerald-600" size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Citizen Identity</div>
                  <div className="text-lg font-black tracking-tight flex items-center gap-2 uppercase italic leading-none">
                    {isLoggedIn ? formData.citizenName : 'Anonymous Portal Access'}
                    <ShieldCheck size={18} className="text-emerald-600" />
                  </div>
                </div>
              </div>
              {isLoggedIn && (
                 <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                    Active Session Verified
                 </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                  <Send size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none">Submit Case</h2>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2">Public accountability protocol</p>
                </div>
              </div>

              <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className={labelClass}>
                      <User size={16} className="text-emerald-600" />
                      Full Identity Name
                    </label>
                    <input
                      required
                      readOnly={isLoggedIn}
                      type="text"
                      className={`${inputClass} ${isLoggedIn ? 'opacity-60 bg-zinc-100 cursor-not-allowed' : ''}`}
                      placeholder={isLoggedIn ? formData.citizenName : "ENTER FULL NAME"}
                      value={formData.citizenName}
                      onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={labelClass}>
                      <Mail size={16} className="text-emerald-600" />
                      Communications Address
                    </label>
                    <input
                      required
                      readOnly={isLoggedIn}
                      type="email"
                      className={`${inputClass} ${isLoggedIn ? 'opacity-60 bg-zinc-100 cursor-not-allowed' : ''}`}
                      placeholder={isLoggedIn ? formData.citizen_email : "ENTER EMAIL"}
                      value={formData.citizen_email}
                      onChange={(e) => setFormData({ ...formData, citizen_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className={labelClass}>
                      <Phone size={16} className="text-emerald-600" />
                      Protocol Contact
                    </label>
                    <input
                      required
                      readOnly={isLoggedIn}
                      type="text"
                      className={`${inputClass} ${isLoggedIn ? 'opacity-60 bg-zinc-100 cursor-not-allowed' : ''}`}
                      placeholder={isLoggedIn ? formData.citizen_phone || 'NOT SET' : "ENTER PHONE"}
                      value={formData.citizen_phone}
                      onChange={(e) => setFormData({ ...formData, citizen_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={labelClass}>
                      <Tag size={16} className="text-emerald-600" />
                      Classification
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:border-emerald-600 outline-none transition-all appearance-none text-sm font-black italic uppercase tracking-tighter cursor-pointer"
                    >
                      <option>Sanitation</option>
                      <option>Water Supply</option>
                      <option>Electricity</option>
                      <option>Roads & Transport</option>
                      <option>Public Safety</option>
                      <option>General</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className={labelClass}>
                      <AlignLeft size={16} className="text-emerald-600" />
                      Incident Intelligence
                    </label>
                    <button 
                      type="button"
                      onClick={handleAIAnalyze}
                      disabled={isAnalyzing || formData.description.length < 10}
                      className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-100 transition-all disabled:opacity-50 border border-sky-100"
                    >
                      {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      AI Co-Pilot
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-6 py-5 rounded-[2rem] border-2 border-zinc-200 bg-zinc-50 focus:border-emerald-600 outline-none transition-all text-base text-zinc-900 font-medium placeholder:text-zinc-400 italic"
                      placeholder="Provide precise details of the structural or civic failure..."
                    />
                    {aiAnalysis && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-lg flex items-center justify-between gap-4"
                      >
                         <div className="flex gap-4">
                            <div>
                               <div className="text-[8px] font-black uppercase text-zinc-400 mb-1">Suggested Mode</div>
                               <div className="text-[10px] font-black text-emerald-600 uppercase italic">Cat: {aiAnalysis.recommendedDepartment || formData.category}</div>
                            </div>
                            <div className="w-px h-8 bg-zinc-100" />
                            <div>
                               <div className="text-[8px] font-black uppercase text-zinc-400 mb-1">Impact Level</div>
                               <div className="text-[10px] font-black text-amber-600 uppercase italic">Priority: {aiAnalysis.suggestedPriority || formData.priority}</div>
                            </div>
                         </div>
                         <button 
                           type="button"
                           onClick={applyAISuggestion}
                           className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                         >
                           Optimize Request
                         </button>
                         <button 
                           type="button" 
                           onClick={() => setAiAnalysis(null)} 
                           className="p-1 text-zinc-400 hover:text-zinc-600"
                         >
                           <X size={14} />
                         </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-zinc-100 p-2 rounded-[2rem] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isGettingLocation}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.address ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-zinc-600 shadow-sm'}`}
                      >
                        {isGettingLocation ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                        {formData.address ? "Precision Target Acquired" : "Request GPS Telemetry"}
                      </button>
                   </div>
                   
                   {formData.address && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                         <Navigation size={14} className="text-emerald-600" />
                         <span className="text-xs font-bold text-emerald-800 truncate italic">{formData.address}</span>
                         <button type="button" onClick={() => setFormData({...formData, address: '', latitude: '', longitude: ''})} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg text-emerald-600"><X size={14} /></button>
                      </motion.div>
                   )}

                   <div className="relative group overflow-hidden">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                      {!formData.complaint_image ? (
                        <div className="p-10 border-4 border-dashed border-zinc-100 rounded-[2.5rem] flex flex-col items-center gap-3 group-hover:bg-zinc-50 transition-all cursor-pointer">
                          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-emerald-600 transition-all">
                            <Camera size={24} />
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none">Evidence Capture</div>
                            <p className="text-[8px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest">MAX 5MB REQUIRED DATA</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-emerald-500/20 group shadow-lg">
                          <img src={formData.complaint_image} alt="Evidence" className="w-full aspect-video object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button type="button" onClick={() => setFormData({...formData, complaint_image: ''})} className="w-10 h-10 bg-white text-rose-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                                <X size={20} />
                             </button>
                          </div>
                        </div>
                      )}
                      {imageError && <p className="text-[10px] font-black text-rose-500 mt-2 px-6 uppercase tracking-widest">{imageError}</p>}
                   </div>
                </div>

                <div className="pt-4 space-y-6">
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                          Deploy Report
                          <ArrowRight size={16} className="text-emerald-400" />
                        </>
                      )}
                    </button>
                    {!isLoggedIn && (
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic animate-pulse">
                        Login to capture merit points for this deployment
                      </p>
                    )}
                    {isLoggedIn && (
                       <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                          <Star size={12} className="text-yellow-500 fill-current" />
                          <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">
                            Estimated Merit Award: +{pointsPreview} PTS
                          </span>
                       </div>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] text-zinc-950 border border-zinc-100 shadow-xl relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 p-10 opacity-5 text-zinc-950">
                <ShieldCheck size={180} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-emerald-600 leading-none">Vault Protocol</h3>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mb-8 italic leading-relaxed">System integration for verified public contribution</p>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xs font-black">01</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Identity Validation</span>
                   </div>
                   <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xs font-black">02</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">SLA Matrix Integration</span>
                   </div>
                   <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xs font-black">03</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Merit-Based Rewards</span>
                   </div>
                </div>
                
                {!isLoggedIn && (
                  <Link 
                    to="/citizen-login"
                    className="w-full mt-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-xl"
                  >
                    Authorize Portal
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] text-zinc-900 border border-zinc-100 shadow-2xl relative overflow-hidden h-fit">
               <div className="flex items-center gap-2 mb-6 text-emerald-600">
                  <Sparkles size={20} />
                  <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Portal Awareness</h3>
               </div>
               <p className="text-zinc-500 text-sm italic font-medium leading-relaxed mb-6">
                 Your reports are verified by city officers and analyzed by AI to ensure rapid resolution protocols are triggered within 24 hours.
               </p>
               <div className="space-y-3">
                  <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Active Intelligence Node</div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                     <span className="text-[10px] font-bold text-zinc-900 uppercase">System Ready & Online</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
