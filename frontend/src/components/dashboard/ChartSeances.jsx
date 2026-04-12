import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from './api';

export default function ChartSeances({ from }) {
  const [data, setData] = useState([]); const [type, setType] = useState('');
  const [show, setShow] = useState({ seances: true, duree: true, participants: true });

  useEffect(() => {
    const q = new URLSearchParams({ from }); if (type) q.set('type_activite', type);
    api.get(`/dashboard/seances?${q.toString()}`).then(r => setData((r.data || []).map(d => ({ ...d, duree_heures: (d.duree_minutes || 0) / 60 }))));
  }, [from, type]);

  return <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
    <h4>Séances, durée et participants</h4>
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <input placeholder="type_activite" value={type} onChange={(e) => setType(e.target.value)} />
      {Object.keys(show).map(k => <label key={k}><input type="checkbox" checked={show[k]} onChange={() => setShow(s => ({ ...s, [k]: !s[k] }))} /> {k}</label>)}
    </div>
    <ResponsiveContainer width="100%" height={300}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" /><Tooltip /><Legend />{show.seances && <Bar yAxisId="left" dataKey="nb_seances" fill="#3182ce" />}{show.participants && <Bar yAxisId="left" dataKey="nb_participants" fill="#38a169" />}{show.duree && <Line yAxisId="right" type="monotone" dataKey="duree_heures" stroke="#dd6b20" />}</BarChart></ResponsiveContainer>
  </div>;
}
