import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from './api';

export default function ChartOccupations({ from }) {
  const [data, setData] = useState([]);
  useEffect(() => { api.get(`/dashboard/occupations/mois?from=${from}`).then(r => setData(r.data || [])); }, [from]);
  return <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}><h4>Occupations par mois</h4><ResponsiveContainer width="100%" height={280}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#00a3c4" /></BarChart></ResponsiveContainer></div>;
}
