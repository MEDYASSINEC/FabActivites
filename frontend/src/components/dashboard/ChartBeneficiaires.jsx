import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from './api';
import Modal from './Modal';
import { monthLabel } from '../../utils/formationYear';

export default function ChartBeneficiaires({ from }) {
  const [data, setData] = useState([]);
  const [detail, setDetail] = useState([]);
  const [open, setOpen] = useState(false);
  const [groupBy, setGroupBy] = useState('pole');
  const [mois, setMois] = useState('');

  useEffect(() => { api.get(`/dashboard/beneficiaires/mois?from=${from}`).then(r => setData(r.data || [])); }, [from]);
  useEffect(() => {
    if (!open) return;
    const q = new URLSearchParams({ from, groupBy });
    if (mois) q.set('mois', mois);
    api.get(`/dashboard/beneficiaires/mois?${q.toString()}`).then(r => setDetail(r.data || []));
  }, [open, groupBy, mois, from]);

  const small = useMemo(() => data.slice(-3).map(d => ({ ...d, libelle: monthLabel(d.mois) })), [data]);

  return (<>
    <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><h4>Bénéficiaires par mois</h4><button onClick={() => setOpen(true)}>Détails</button></div>
      <ResponsiveContainer width="100%" height={280}><BarChart data={small}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="libelle" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#3182ce" /></BarChart></ResponsiveContainer>
    </div>
    <Modal open={open} onClose={() => setOpen(false)} title="Bénéficiaires - détails">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}><option value="pole">Par pôle</option><option value="type_activite">Par type d'activité</option></select>
        <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} />
      </div>
      <ResponsiveContainer width="100%" height={320}><BarChart data={detail}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="categorie" /><YAxis /><Tooltip /><Legend /><Bar dataKey="total" fill="#00a3c4" /></BarChart></ResponsiveContainer>
    </Modal>
  </>);
}
