import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from './api';

export default function ChartOutillage({ from }) {
  const [data, setData] = useState([]); const [machine, setMachine] = useState('');
  const [show, setShow] = useState({ util: true, duree: false, users: false });
  useEffect(() => {
    const q = new URLSearchParams({ from }); if (machine) q.set('machine', machine);
    api.get(`/dashboard/outillages/mois?${q.toString()}`).then(r => setData(r.data || []));
  }, [from, machine]);
  const machines = useMemo(() => [...new Set(data.map(d => d.machine))], [data]);

  return <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
    <h4>Outillage / Machines par mois</h4>
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      <select value={machine} onChange={(e) => setMachine(e.target.value)}><option value="">Toutes</option>{machines.map(m => <option key={m} value={m}>{m}</option>)}</select>
      {Object.keys(show).map(k => <label key={k}><input type="checkbox" checked={show[k]} onChange={() => setShow(s => ({ ...s, [k]: !s[k] }))} /> {k}</label>)}
    </div>
    <ResponsiveContainer width="100%" height={300}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend />{show.util && <Bar dataKey="nb_utilisations" fill="#805ad5" />}{show.duree && <Bar dataKey="duree_minutes" fill="#dd6b20" />}{show.users && <Bar dataKey="nb_utilisateurs" fill="#2f855a" />}</BarChart></ResponsiveContainer>
  </div>;
}
