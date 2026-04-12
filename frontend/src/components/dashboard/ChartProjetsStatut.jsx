import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { api } from './api';
import Modal from './Modal';

const colors = ['#3182ce', '#2f855a', '#d69e2e', '#e53e3e', '#805ad5'];

export default function ChartProjetsStatut() {
  const [months, setMonths] = useState(1); const [includeParticipants, setIncludeParticipants] = useState(false);
  const [rows, setRows] = useState([]); const [open, setOpen] = useState(false);

  useEffect(() => { api.get('/dashboard/projets/statuts?mois=1&includeParticipants=false').then(r => setRows(r.data || [])); }, []);
  useEffect(() => { if (open) api.get(`/dashboard/projets/statuts?mois=${months}&includeParticipants=${includeParticipants}`).then(r => setRows(r.data || [])); }, [open, months, includeParticipants]);

  const pieData = useMemo(() => {
    const totals = {}; rows.forEach(r => { totals[r.statut] = (totals[r.statut] || 0) + Number(r.valeur || 0); });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [rows]);

  return (<>
    <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><h4>Projets par statut</h4><button onClick={() => setOpen(true)}>Détails</button></div>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>{pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
    </div>
    <Modal open={open} onClose={() => setOpen(false)} title="Projets par statut - détails">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input type="number" min="1" max="12" value={months} onChange={(e) => setMonths(e.target.value)} />
        <label><input type="checkbox" checked={includeParticipants} onChange={(e) => setIncludeParticipants(e.target.checked)} /> Participants</label>
      </div>
      <ResponsiveContainer width="100%" height={320}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend /><Bar stackId="a" dataKey="valeur" fill="#805ad5" /></BarChart></ResponsiveContainer>
    </Modal>
  </>);
}
