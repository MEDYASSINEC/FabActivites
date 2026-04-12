export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', minWidth: 600, maxWidth: '92vw', maxHeight: '90vh', overflow: 'auto', borderRadius: 12, padding: 20, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: 10, top: 8, border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer' }}>×</button>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
