import { useEffect, useState } from 'react';
import { api } from './api';
import KpiCard from './KpiCard';

export default function KpiProjets({ from }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    api.get(`/dashboard/projets/statuts-annee?from=${from}`)
      .then((res) => setState({ data: res.data, loading: false, error: null }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [from]);

  return (
    <KpiCard title="Projets (année formation)" isLoading={state.loading} error={state.error}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center' }}>
        <div><div style={{ color: '#486581' }}>En cours</div><div style={{ fontSize: 28, fontWeight: 700 }}>{(state.data?.en_cours ?? 0).toLocaleString('fr-FR')}</div></div>
        <div><div style={{ color: '#486581' }}>Terminés</div><div style={{ fontSize: 28, fontWeight: 700 }}>{(state.data?.termines ?? 0).toLocaleString('fr-FR')}</div></div>
      </div>
    </KpiCard>
  );
}
