import React from 'react';

export const ReportsPage = () => {
  const [dimensions, setDimensions] = React.useState<string[]>(['Department']);
  const [metrics, setMetrics] = React.useState<string[]>(['Count']);
  const [rows, setRows] = React.useState<any[]>([]);
  const [configs, setConfigs] = React.useState<any[]>([]);

  const loadConfigs = () => fetch('/api/reports/config').then((r) => r.json()).then(setConfigs);
  React.useEffect(() => { loadConfigs(); }, []);

  const generate = async () => {
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dimensions, metrics })
    });
    const data = await res.json();
    setRows(data.rows || []);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-4">
      <h1 className="text-3xl font-black">Dynamic Reports</h1>
      <div className="bg-white/80 p-4 rounded-2xl">
        <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg" onClick={generate}>Generate Report</button>
      </div>
      <div className="bg-white/80 rounded-2xl p-4">
        {rows.map((r, idx) => <pre key={idx} className="text-xs border-b border-zinc-100 py-2">{JSON.stringify(r)}</pre>)}
      </div>
      <div className="bg-white/80 rounded-2xl p-4">
        <h3 className="font-bold mb-2">Saved Configs</h3>
        {configs.map((c) => <div key={c.id} className="text-sm">{c.name}</div>)}
      </div>
    </div>
  );
};
