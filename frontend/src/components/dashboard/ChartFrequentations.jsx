import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from './api';

export default function ChartFrequentations({ from }) {
  const [data, setData] = useState([]);
  useEffect(() => { api.get(`/dashboard/frequentations/mois?from=${from}`).then(r => setData(r.data || [])); }, [from]);
  const keys = useMemo(() => [...new Set(data.flatMap(d => Object.keys(d).filter(k => k !== 'mois')))], [data]);

  return <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
    <h4>Fréquentations mensuelles par type d'activité</h4>
    <ResponsiveContainer width="100%" height={300}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend />{keys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={["#3182ce", "#805ad5", "#38a169", "#d69e2e"][i % 4]} />)}</BarChart></ResponsiveContainer>
  </div>;
}
