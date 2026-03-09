import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage = () => {
  const [selectedPortal, setSelectedPortal] = useState<'citizen' | 'officer'>('citizen');
  const navigate = useNavigate();

  const portals = [
    {
      id: 'citizen',
      title: 'Citizen Portal',
      icon: User,
      path: '/citizen',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      id: 'officer',
      title: 'Officer Portal',
      icon: Building2,
      path: '/officer',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  const handleEnterPortal = () => {
    const portal = portals.find(p => p.id === selectedPortal);
    if (portal) {
      navigate(portal.path);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6"
        >
          <CheckCircle2 size={14} />
          Official Public Services CRM
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl font-black text-zinc-900 tracking-tight mb-6 font-display leading-tight"
        >
          Smart Public <br />
          <span className="text-emerald-600">Services CRM</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-zinc-600 max-w-2xl mx-auto font-light leading-relaxed"
        >
          A unified digital platform for transparent governance and faster grievance resolution.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl shadow-zinc-200/50"
      >
        <div className="space-y-4 mb-8">
          {portals.map((portal) => (
            <label
              key={portal.id}
              className={`
                relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                ${selectedPortal === portal.id
                  ? `${portal.borderColor} ${portal.bgColor} shadow-md`
                  : 'border-zinc-100 hover:border-zinc-200 bg-zinc-50/50'
                }
              `}
            >
              <input
                type="radio"
                name="portal-selection"
                className="sr-only"
                checked={selectedPortal === portal.id}
                onChange={() => setSelectedPortal(portal.id as 'citizen' | 'officer')}
              />
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${selectedPortal === portal.id ? 'bg-white shadow-sm' : 'bg-white/50'}
              `}>
                <portal.icon className={portal.color} size={24} />
              </div>
              <div className="flex-1">
                <span className={`text-lg font-bold block ${selectedPortal === portal.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {portal.title}
                </span>
              </div>
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                ${selectedPortal === portal.id ? 'border-emerald-600 bg-emerald-600' : 'border-zinc-300'}
              `}>
                {selectedPortal === portal.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleEnterPortal}
          className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-200 active:scale-[0.98] group"
        >
          Enter Portal
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <div className="mt-16 text-center">
        <p className="text-zinc-400 text-sm font-medium">
          Secure, Transparent, and Citizen-Centric Governance.
        </p>
      </div>
    </div>
  );
};

