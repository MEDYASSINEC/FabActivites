function TableEmpty({ message = "Aucune donnée trouvée" }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            color: '#94a3b8',
        }}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>

            {/* Illustration */}
            <div style={{ animation: 'float 3s ease-in-out infinite', marginBottom: '24px' }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    {/* Table body */}
                    <rect x="8" y="20" width="64" height="44" rx="6" fill="#e2e8f0" />
                    {/* Header */}
                    <rect x="8" y="20" width="64" height="14" rx="6" fill="#cbd5e1" />
                    <rect x="8" y="28" width="64" height="6" fill="#cbd5e1" />
                    {/* Lignes vides */}
                    <rect x="18" y="42" width="28" height="4" rx="2" fill="#e8edf2" />
                    <rect x="18" y="52" width="20" height="4" rx="2" fill="#e8edf2" />
                    {/* Loupe */}
                    <circle cx="54" cy="54" r="14" fill="#fff" stroke="#94a3b8" strokeWidth="2.5" />
                    <circle cx="54" cy="54" r="7" fill="#f1f5f9" />
                    <line x1="64" y1="64" x2="72" y2="72" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                    {/* Point d'interrogation */}
                    <text x="51" y="58" fontSize="10" fill="#94a3b8" fontWeight="700">?</text>
                </svg>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#64748b' }}>
                {message}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#b0bec5' }}>
                Essayez de modifier vos filtres ou d'ajouter des données
            </p>
        </div>
    );
}

export default TableEmpty;