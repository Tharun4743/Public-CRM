import React from 'react';
import { ShieldCheck, Wrench, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const BackgroundDecoration = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large Rectifying Shield */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ 
          opacity: 0.03, 
          scale: 1, 
          rotate: 5,
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear",
          opacity: { duration: 2 }
        }}
        className="absolute -top-20 -right-20 text-emerald-900"
      >
        <ShieldCheck size={600} strokeWidth={0.5} />
      </motion.div>

      {/* Subtle Wrench for 'Fixing' */}
      <motion.div
        initial={{ opacity: 0, rotate: 45 }}
        animate={{ 
          opacity: 0.02, 
          rotate: [45, 60, 45],
          x: [0, 30, 0]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: "easeInOut"
        }}
        className="absolute -bottom-40 -left-20 text-zinc-900"
      >
        <Wrench size={500} strokeWidth={0.5} />
      </motion.div>

      {/* Floating Check Circle */}
      <motion.div
        animate={{ 
          y: [0, 50, 0],
          opacity: [0.01, 0.03, 0.01]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/4 text-emerald-600"
      >
        <CheckCircle2 size={300} strokeWidth={0.3} />
      </motion.div>

      {/* Central 'Rectifying' Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] select-none">

        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[40px] border-dashed border-emerald-900 rounded-full scale-[2]"
          />
          <h1 className="text-[20vw] font-black tracking-tighter uppercase font-display">
            RECTIFY
          </h1>
        </div>
      </div>
    </div>
  );
};
