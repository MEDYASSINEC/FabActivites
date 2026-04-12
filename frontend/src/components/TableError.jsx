function TableError({ message = "Une erreur est survenue", onRetry = null }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            color: '#7f1d1d',
        }}>
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
            `}</style>

            {/* Illustration */}
            <div style={{ animation: 'shake 0.5s ease-in-out', marginBottom: '24px' }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    {/* Table body */}
                    <rect x="8" y="20" width="64" height="44" rx="6" fill="#fee2e2" />
                    {/* Header */}
                    <rect x="8" y="20" width="64" height="14" rx="6" fill="#fecaca" />
                    {/* Exclamation mark circle */}
                    <circle cx="40" cy="45" r="16" fill="#fff" stroke="#dc2626" strokeWidth="2.5" />
                    {/* Exclamation point */}
                    <rect x="37" y="35" width="6" height="12" rx="2" fill="#dc2626" />
                    <circle cx="40" cy="52" r="2" fill="#dc2626" />
                </svg>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
                Erreur
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#b91c1c', textAlign: 'center', maxWidth: '400px' }}>
                {message}
            </p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        padding: '8px 20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.target.style.background = '#991b1b'}
                    onMouseOut={(e) => e.target.style.background = '#dc2626'}
                >
                    🔄 Réessayer
                </button>
            )}
        </div>
    );
}

export default TableError;
