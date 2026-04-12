import { useEffect, useState } from 'react';
import { api } from './api';
import KpiCard from './KpiCard';

export default function KpiBeneficiaires({ from }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    api.get(`/dashboard/beneficiaires?from=${from}`)
      .then((res) => setState({ data: res.data, loading: false, error: null }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [from]);

  return (
    <KpiCard title="Nombre de bénéficiaires" isLoading={state.loading} error={state.error}>
      <div style={{ fontSize: 30, fontWeight: 700 }}>{(state.data?.total ?? 0).toLocaleString('fr-FR')}</div>
      <div style={{ color: '#627d98', fontSize: 12 }}>
        Projets: {(state.data?.par_projets ?? 0).toLocaleString('fr-FR')} · Activités: {(state.data?.par_activites ?? 0).toLocaleString('fr-FR')}
      </div>
    </KpiCard>
  );
}
