import { useEffect, useState } from 'react';
import { api } from '../components/dashboard/api';
import KpiCard from '../components/dashboard/KpiCard';
import KpiProjets from '../components/dashboard/KpiProjets';
import KpiBeneficiaires from '../components/dashboard/KpiBeneficiaires';
import KpiFormations from '../components/dashboard/KpiFormations';
import ChartBeneficiaires from '../components/dashboard/ChartBeneficiaires';
import ChartProjetsStatut from '../components/dashboard/ChartProjetsStatut';
import ChartSeances from '../components/dashboard/ChartSeances';
import ChartFrequentations from '../components/dashboard/ChartFrequentations';
import ChartOccupations from '../components/dashboard/ChartOccupations';
import ChartOutillage from '../components/dashboard/ChartOutillage';
import { getFormationYearStart, toApiDate } from '../utils/formationYear';

export default function Dashboard() {
  const [projectState, setProjectState] = useState({ count: 0, loading: true, error: null });
  const from = toApiDate(getFormationYearStart());

  useEffect(() => {
    setProjectState({ count: 0, loading: true, error: null });
    api.get('/projects')
      .then((res) => setProjectState({ count: (res.data || []).length, loading: false, error: null }))
      .catch((e) => setProjectState({ count: 0, loading: false, error: e.message }));
  }, []);

  return (
    <div style={{ padding: 20, background: '#f4f7fb', minHeight: '100%' }}>
      <style>{`@keyframes kpiPulse {0%{background-position:0%}100%{background-position:200%}}
.kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}
@media (max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:700px){.kpi-grid{grid-template-columns:1fr;}}`}</style>
      <h1 style={{ marginTop: 0 }}>Dashboard Analytique</h1>

      <div className="kpi-grid">
        <KpiCard title="Total Projets" isLoading={projectState.loading} error={projectState.error}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{projectState.count.toLocaleString('fr-FR')}</div>
        </KpiCard>
        <KpiProjets from={from} />
        <KpiBeneficiaires from={from} />
        <KpiFormations from={from} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14, marginTop: 14 }}>
        <ChartBeneficiaires from={from} />
        <ChartProjetsStatut />
        <ChartSeances from={from} />
        <ChartFrequentations from={from} />
        <ChartOccupations from={from} />
        <ChartOutillage from={from} />
      </div>
    </div>
  );
}
