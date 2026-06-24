export default function KpiCard({ title, children, isLoading, error }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, minHeight: 120, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 10px', color: '#243b53', fontSize: 16 }}>{title}</h3>
      {isLoading ? (
        <div style={{ height: 70, borderRadius: 8, background: 'linear-gradient(90deg,#edf2f7,#f7fafc,#edf2f7)', backgroundSize: '200% 100%', animation: 'kpiPulse 1.2s infinite' }} />
      ) : error ? (
        <div style={{ color: '#c53030', fontSize: 13 }}>{error}</div>
      ) : (
        children
      )}
    </div>
  );
}
