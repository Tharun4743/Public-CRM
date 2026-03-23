import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, BarChart3, Database, Save, CheckCircle2 } from 'lucide-react';

export const ReportsPage = () => {
  const [dimensions, setDimensions] = React.useState<string[]>(['category']);
  const [metrics, setMetrics] = React.useState<string[]>(['count']);
  const [rows, setRows] = React.useState<any[]>([]);
  const [configs, setConfigs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadConfigs = () => fetch('/api/reports/config').then((r) => r.json()).then(setConfigs);
  React.useEffect(() => { loadConfigs(); }, []);

  const generate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimensions, metrics })
      });
      const data = await res.json();
      setRows(data.rows || []);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-100 pb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 mb-4">
            <Database size={12} /> Analytical Suite
          </div>
          <h1 className="text-5xl font-black text-zinc-950 tracking-tighter uppercase italic leading-none">
            Digital Governance <br /> <span className="text-zinc-500">Reports Console</span>
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-4 max-w-lg">Custom dimension-based data aggregation for performance audit and policy planning.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={generate}
             disabled={isLoading}
             className="px-8 py-5 bg-zinc-950 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
           >
             {isLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <BarChart3 size={18} />}
             Compute Data Analytics
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Report Configuration Side Panel */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white/80 p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl space-y-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950 mb-6 flex items-center gap-2">
                 <FileText size={18} className="text-emerald-500" />
                 Report DNA (Config)
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block italic">Pivot Dimensions</label>
                    <div className="flex flex-wrap gap-2">
                       {['category', 'department', 'status', 'priority'].map(d => (
                         <button 
                           key={d} 
                           onClick={() => setDimensions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dimensions.includes(d) ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}
                         >
                           {d}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-zinc-50">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block italic">Measurement Metrics</label>
                    <div className="flex flex-wrap gap-2">
                       {['count', 'avg_resolution', 'satisfaction_avg'].map(m => (
                         <button 
                           key={m}
                           onClick={() => setMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${metrics.includes(m) ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}
                         >
                           {m.replace('_', ' ')}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-8 block">
                 <button className="w-full py-4 border-2 border-dashed border-zinc-200 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-500 transition-all flex items-center justify-center gap-2">
                   <Save size={16} /> Save Data Signature
                 </button>
              </div>
           </div>

           <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 italic">Registry of Saved Configs</h3>
              <div className="space-y-3">
                 {configs.length === 0 ? (
                   <div className="text-[10px] text-zinc-400 font-bold uppercase italic p-4 text-center">Empty Registry</div>
                 ) : configs.map((c) => (
                   <div key={c.id} className="p-3 bg-white rounded-xl border border-zinc-200 flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-colors">
                      <span className="text-xs font-black text-zinc-900 group-hover:text-emerald-600 uppercase italic">{c.name}</span>
                      <CheckCircle2 size={14} className="text-zinc-200 group-hover:text-emerald-600" />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
           <div className="bg-white/80 rounded-[3rem] border border-zinc-100 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
              {rows.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center p-20 text-center opacity-30">
                   <BarChart3 size={80} strokeWidth={1} />
                   <div className="mt-6 text-xl font-black uppercase italic tracking-widest">Awaiting Parameter Selection</div>
                   <p className="text-xs font-bold max-w-xs mt-2 uppercase">Please select your dimensions and metrics then execute the computational process.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/80 border-b border-zinc-100">
                          {Object.keys(rows[0]).map(key => (
                            <th key={key} className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">
                               {key.replace('_', ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="px-8 py-5 text-sm font-black text-zinc-950 uppercase italic tracking-tight">
                                {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(2) : val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-10 bg-zinc-50 mt-auto flex justify-between items-center border-t border-zinc-100">
                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic flex items-center gap-2">
                        <Download size={14} /> Result Set Size: {rows.length} Records Verified
                     </p>
                     <button className="px-6 py-2 bg-white text-zinc-950 border border-zinc-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                        Export to CSV Profile
                     </button>
                  </div>
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

