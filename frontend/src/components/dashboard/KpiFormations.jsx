import { use, useEffect, useState } from 'react';
import { api } from './api';
import KpiCard from './KpiCard';

const formatMinutes = (m = 0) => `${Math.floor(m / 60)}h ${m % 60}min`;

export default function KpiFormations({ from }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    api.get(`/dashboard/formations?from=${from}`)
      .then((res) => setState({ data: res.data, loading: false, error: null }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [from]);


  return (
    <KpiCard title="Formations réalisées" isLoading={state.loading} error={state.error}>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{(state.data?.nombre_formations ?? 0).toLocaleString('fr-FR')} formations</div>
      <div style={{ color: '#627d98' }}>{formatMinutes(state.data?.duree_totale_minutes ?? 0)} totales</div>
    </KpiCard>
  );
}
