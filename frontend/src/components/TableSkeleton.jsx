function TableSkeleton({ columns = 5, rows = 8 }) {
    return (
        <div style={{ width: '100%', fontFamily: 'Segoe UI, sans-serif' }}>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                .skeleton-cell {
                    background: linear-gradient(90deg, #e8edf2 25%, #f5f7fa 50%, #e8edf2 75%);
                    background-size: 1000px 100%;
                    animation: shimmer 1.6s infinite linear;
                    border-radius: 4px;
                    height: 12px;
                }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', background: '#0061AA', padding: '0' }}>
                <div style={{ width: 36, flexShrink: 0 }} />
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} style={{
                        flex: 1, padding: '10px 15px',
                        borderLeft: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        <div style={{
                            height: 12, borderRadius: 4,
                            background: 'rgba(255,255,255,0.25)',
                            width: `${50 + Math.random() * 40}%`,
                        }} />
                    </div>
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, ri) => (
                <div key={ri} style={{
                    display: 'flex',
                    background: ri % 2 === 0 ? '#fff' : '#f5fbfd',
                    borderBottom: '1px solid #d0d0d0',
                }}>
                    {/* N° ligne */}
                    <div style={{
                        width: 36, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: '1px solid #c0c0c0',
                        padding: '8px 4px',
                    }}>
                        <div style={{
                            width: 16, height: 10, borderRadius: 3,
                            background: '#e2e8f0',
                        }} />
                    </div>

                    {/* Cells */}
                    {Array.from({ length: columns }).map((_, ci) => (
                        <div key={ci} style={{
                            flex: 1, padding: '8px 15px',
                            borderRight: '1px solid #d0d0d0',
                            display: 'flex', alignItems: 'center',
                        }}>
                            <div
                                className="skeleton-cell"
                                style={{
                                    width: `${30 + Math.random() * 60}%`,
                                    animationDelay: `${(ri * columns + ci) * 0.05}s`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default TableSkeleton;