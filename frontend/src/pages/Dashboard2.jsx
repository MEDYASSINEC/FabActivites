import { useEffect, useState, lazy, Suspense, use } from 'react';
import { api } from '../components/dashboard/api';
import KpiCard from '../components/dashboard/KpiCard';
import { getFormationYearStart, toApiDate } from '../utils/formationYear';

// Lazy load heavy chart components
const ChartBeneficiaires = lazy(() => import('../components/dashboard/ChartBeneficiaires'));
const ChartProjetsStatut = lazy(() => import('../components/dashboard/ChartProjetsStatut'));
const ChartSeances = lazy(() => import('../components/dashboard/ChartSeances'));
const ChartFrequentations = lazy(() => import('../components/dashboard/ChartFrequentations'));
const ChartOccupations = lazy(() => import('../components/dashboard/ChartOccupations'));
const ChartOutillage = lazy(() => import('../components/dashboard/ChartOutillage'));

// Simple Skeleton Loader for Charts
const ChartSkeleton = () => (
  <div style={{
    height: '350px', background: '#fff', borderRadius: '20px', padding: '24px',
    border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px'
  }}>
    <div style={{ width: '40%', height: '24px', background: '#f0f4f8', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
    <div style={{ flex: 1, width: '100%', background: '#f7fafc', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: '0.2s' }}></div>
    <style>{`
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        `}</style>
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState({ data: null, loading: true, error: null });
  const from = toApiDate(getFormationYearStart());

  console.log('from date for API:', from);
  console.log('full year start date:', getFormationYearStart());

  useEffect(() => {
    setSummary(s => ({ ...s, loading: true }));
    api.get(`/dashboard/summary?from=${from}`)
      .then((res) => setSummary({ data: res.data, loading: false, error: null }))
      .catch((e) => setSummary({ data: null, loading: false, error: e.message }));
  }, [from]);

  useEffect(() => {
    console.log('Summary data updated:', summary.data);
  }, [summary.data]);

  return (
    <div style={{ padding: '30px', background: '#f0f4f8', flex: 1, fontFamily: 'Inter, system-ui, sans-serif', overflowY: 'auto' }}>

      <style>{`
        .kpi-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;}
        @media (max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
        @media (max-width:700px){.kpi-grid{grid-template-columns:1fr;}}
      `}</style>

      <h1 style={{ marginTop: 0, fontSize: '28px', color: '#1a202c', fontWeight: '800', marginBottom: '24px' }}>Dashboard Analytique</h1>

      <div className="kpi-grid">
        {/* Total Projets */}
        <KpiCard title="Total Projets" isLoading={summary.loading} error={summary.error}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#2d3748' }}>
            {summary.data?.projets?.toLocaleString('fr-FR') || 0}
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: '4px' }}>
            {summary.data?.projets_encours?.toLocaleString('fr-FR') || 0} en cours
          </div>
        </KpiCard>

        {/* Bénéficiaires */}
        <KpiCard title="Bénéficiaires" isLoading={summary.loading} error={summary.error}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#38a169' }}>
            {summary.data?.beneficiaires?.total?.toLocaleString('fr-FR') || 0}
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: '4px' }}>
            {summary.data?.beneficiaires?.last_month?.toLocaleString('fr-FR') || 0} ce mois-ci
          </div>
        </KpiCard>

        {/* Formations */}
        <KpiCard title="Formations" isLoading={summary.loading} error={summary.error}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#3182ce' }}>
            {summary.data?.formations?.nombre || 0}
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: '4px' }}>
            <span style={{ fontWeight: 'bold', fontSize: 14 }}>{(Number(summary.data?.formations?.duree_minutes || 0) / 60).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</span> Cumulées sur l'année
          </div>
        </KpiCard>

        {/* Fréquentation */}
        <KpiCard title="Fréquentation" isLoading={summary.loading} error={summary.error}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#f6ad55' }}>
            {summary.data?.frequentations?.total?.toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: '4px' }}>
            {summary.data?.frequentations?.last_month?.toLocaleString('fr-FR')} ce mois-ci
          </div>
        </KpiCard>

        {/* Occupations */}
        <KpiCard title="Occupations" isLoading={summary.loading} error={summary.error}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#f6ad55' }}>
            {Number(summary.data?.occupations?.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: '4px' }}>
            {Number(summary.data?.occupations?.last_month || 0).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h ce mois-ci
          </div>
        </KpiCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14, marginTop: 14 }}>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartBeneficiaires from={from} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartProjetsStatut />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartSeances from={from} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartFrequentations from={from} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartOccupations from={from} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChartOutillage from={from} />
        </Suspense>
      </div>
    </div>
  );
}
