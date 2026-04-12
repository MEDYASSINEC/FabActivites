function ConfirmLeaveModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,.25)',
        }}
      >
        <h3 style={{ margin: 0, color: '#1f2937', fontSize: 20 }}>Modifications non sauvegardées</h3>
        <p style={{ margin: '14px 0 0', color: '#4b5563', lineHeight: 1.5 }}>
          Vous avez des données non sauvegardées sur cette page. Si vous quittez maintenant, ces modifications seront perdues.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button
            type='button'
            onClick={onCancel}
            style={{
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#111827',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Rester sur la page
          </button>
          <button
            type='button'
            onClick={onConfirm}
            style={{
              border: '1px solid #E24B4A',
              background: '#E24B4A',
              color: '#fff',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Quitter sans sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmLeaveModal;
