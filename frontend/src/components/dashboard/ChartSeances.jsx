import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, LabelList, Cell
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';
import MonthPicker from './MonthPicker';

const COLORS = {
    formations: '#3182ce',
    seances: '#4fd1c5',
    participants: '#63b3ed',
    duree: '#f6ad55'
};

const METRICS = [
    { id: 'seances', label: 'Séances (Total)', key: 'nb_seances' },
    { id: 'participants', label: 'Participants (Impactés)', key: 'nb_participants' },
    { id: 'formations', label: 'Formations (Uniques)', key: 'nb_formations' },
    { id: 'duree', label: 'Durée Totale (h)', key: 'duree_heures' }
];

const ChartContainer = ({ title, children, onExpand }) => {
    const [isExporting, setIsExporting] = useState(false);
    const cardRef = useRef(null);

    const exportImage = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 200));
        const el = cardRef.current;
        try {
            const dataUrl = await domtoimage.toPng(el, {
                bgcolor: '#ffffff',
                scale: 2,
                width: el.offsetWidth,
                height: el.offsetHeight,
                filter: (node) => {
                    const tag = node.tagName;
                    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'INPUT') return false;
                    if (node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) return false;
                    return true;
                }
            });
            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); }
    };

    return (
        <div ref={cardRef} style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px', fontWeight: '700' }}>{title}</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={exportImage} data-html2canvas-ignore="true" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#718096', fontSize: '13px', fontWeight: '500' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    {onExpand && (
                        <button onClick={onExpand} data-html2canvas-ignore="true" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#718096', fontSize: '13px', fontWeight: '500' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg> Détails
                        </button>
                    )}
                </div>
            </div>
            <div className={isExporting ? 'chart-exporting' : 'chart-normal'}>
                {typeof children === 'function' ? children(isExporting) : children}
            </div>
        </div>
    );
};

const SeancesModal = ({ onClose, data, visibleMetrics, setVisibleMetrics, from }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'
    const [tableData, setTableData] = useState([]);

    const allMonths = useMemo(() => data.map(d => d.mois).sort(), [data]);
    const [selectedMonths, setSelectedMonths] = useState(allMonths);

    useEffect(() => {
        api.get(`/dashboard/formations/table?from=${from}`).then(r => setTableData(r.data || []));
    }, [from]);

    const filteredData = useMemo(() => {
        return data.filter(d => selectedMonths.includes(d.mois));
    }, [data, selectedMonths]);

    const { compactData, maxBars } = useMemo(() => {
        let max = 0;
        const activeMetricIds = METRICS.filter(m => visibleMetrics[m.id]).map(m => m.id);

        const compact = filteredData.map(row => {
            const active = activeMetricIds
                .map(mId => {
                    const m = METRICS.find(x => x.id === mId);
                    return { id: mId, label: m.label, val: Number(row[m.key] || 0), color: COLORS[mId] };
                })
                .filter(item => item.val > 0);

            if (active.length > max) max = active.length;

            const newRow = { ...row };
            active.forEach((item, i) => {
                newRow[`val${i}`] = item.val;
                newRow[`color${i}`] = item.color;
                newRow[`name${i}`] = item.label;
            });
            return newRow;
        });
        return { compactData: compact, maxBars: max };
    }, [filteredData, visibleMetrics]);

    const exportImage = async () => {
        if (!modalRef.current) return;
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 50));
        const el = modalRef.current;
        try {
            const dataUrl = await domtoimage.toPng(el, {
                bgcolor: '#ffffff',
                scale: 2,
                width: el.scrollWidth,
                height: el.scrollHeight,
                filter: (node) => {
                    const tag = node.tagName;
                    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'INPUT') return false;
                    if (node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) return false;
                    return true;
                }
            });
            const link = document.createElement('a');
            link.download = `Analyse_Seances_Formations.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div ref={modalRef} style={{ background: '#fff', borderRadius: '30px', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>
                <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', gap: '10px' }}>
                    <button onClick={exportImage} data-html2canvas-ignore="true" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 15px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    <button onClick={onClose} data-html2canvas-ignore="true" style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', color: '#718096' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Analyse des Formations</h2>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }} data-html2canvas-ignore="true">
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setViewMode('chart')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: viewMode === 'chart' ? '#fff' : 'transparent', color: viewMode === 'chart' ? '#3182ce' : '#718096', boxShadow: viewMode === 'chart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>Graphique</button>
                            <button onClick={() => setViewMode('table')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: viewMode === 'table' ? '#fff' : 'transparent', color: viewMode === 'table' ? '#3182ce' : '#718096', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>Tableau</button>
                        </div>

                        {viewMode === 'chart' && (
                            <>
                                <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '8px', border: '1px solid #e2e8f0', paddingRight: '15px' }}>
                                    {METRICS.map(m => (
                                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>
                                            <input type="checkbox" checked={visibleMetrics[m.id]} onChange={() => setVisibleMetrics(s => ({ ...s, [m.id]: !s[m.id] }))} style={{ width: '16px', height: '16px', accentColor: COLORS[m.id] }} />
                                            {m.label}
                                        </label>
                                    ))}
                                </div>
                                <button onClick={() => setShowMonthPicker(!showMonthPicker)} style={{ background: showMonthPicker ? '#3182ce' : '#f7fafc', color: showMonthPicker ? '#fff' : '#4a5568', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    {showMonthPicker ? 'Masquer les mois' : 'Filtrer les mois'}
                                </button>
                            </>
                        )}
                    </div>

                    {showMonthPicker && viewMode === 'chart' && (
                        <div data-html2canvas-ignore="true" style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease' }}>
                            <MonthPicker mois={selectedMonths} setMois={setSelectedMonths} />
                        </div>
                    )}
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7' }}>
                    {viewMode === 'chart' ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={compactData} barGap={2}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value, name, props) => {
                                        const index = name.replace('val', '');
                                        const realName = props.payload[`name${index}`];
                                        return [value, realName];
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{ paddingBottom: '20px' }}
                                    content={() => (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                            {METRICS.filter(m => visibleMetrics[m.id]).map(m => (
                                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: COLORS[m.id] }} />
                                                    {m.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                                {[...Array(maxBars)].map((_, i) => (
                                    <Bar key={i} dataKey={`val${i}`} isAnimationActive={!isExporting} radius={[4, 4, 0, 0]} barSize={15}>
                                        {compactData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry[`color${i}`]} />
                                        ))}
                                        <LabelList dataKey={`val${i}`} position="top" className="bar-label" style={{ fill: '#4a5568', fontSize: 10, fontWeight: '700' }} formatter={(v) => v > 0 ? v : ''} />
                                    </Bar>
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', color: '#4a5568' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '15px', background: '#f1f5f9', borderRadius: '12px 0 0 12px', fontSize: '13px', fontWeight: '700' }}>Nom de la Formation</th>
                                        <th style={{ textAlign: 'center', padding: '15px', background: '#f1f5f9', fontSize: '13px', fontWeight: '700' }}>Participants</th>
                                        <th style={{ textAlign: 'center', padding: '15px', background: '#f1f5f9', fontSize: '13px', fontWeight: '700' }}>Nombre de Séances</th>
                                        <th style={{ textAlign: 'right', padding: '15px', background: '#f1f5f9', borderRadius: '0 12px 12px 0', fontSize: '13px', fontWeight: '700' }}>Durée Totale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, idx) => (
                                        <tr key={idx} style={{ transition: '0.2s' }}>
                                            <td style={{ padding: '15px', borderBottom: '1px solid #edf2f7', fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>{row.nom}</td>
                                            <td style={{ padding: '15px', borderBottom: '1px solid #edf2f7', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#3182ce' }}>{row.max_participants}</td>
                                            <td style={{ padding: '15px', borderBottom: '1px solid #edf2f7', textAlign: 'center', fontSize: '13px' }}>{row.nb_seances}</td>
                                            <td style={{ padding: '15px', borderBottom: '1px solid #edf2f7', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>{Math.round(row.duree_minutes / 60 * 10) / 10}h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .bar-label { pointer-events: none; }
            `}</style>
        </div>
    );
};

export default function ChartSeances({ from }) {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [visibleMetrics, setVisibleMetrics] = useState({ formations: false, seances: true, participants: true, duree: false });

    useEffect(() => {
        api.get(`/dashboard/seances?from=${from || ''}`).then(r => {
            const raw = r.data || [];
            const processed = raw.map(d => ({
                ...d,
                duree_heures: Math.round((d.duree_minutes || 0) / 60 * 10) / 10
            }));
            setData(processed);
        });
    }, [from]);

    const formationYearStart = useMemo(() => {
        const now = new Date();
        const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}-09`;
    }, []);

    const modalData = useMemo(() => {
        return data.filter(d => d.mois >= formationYearStart).sort((a, b) => a.mois.localeCompare(b.mois));
    }, [data, formationYearStart]);

    const dashboardData = useMemo(() => {
        return data.sort((a, b) => a.mois.localeCompare(b.mois)).slice(-3);
    }, [data]);

    const { compactData, maxBars } = useMemo(() => {
        let max = 0;
        const activeMetricIds = METRICS.filter(m => visibleMetrics[m.id]).map(m => m.id);
        const compact = dashboardData.map(row => {
            const active = activeMetricIds
                .map(mId => {
                    const m = METRICS.find(x => x.id === mId);
                    return { id: mId, label: m.label, val: Number(row[m.key] || 0), color: COLORS[mId] };
                })
                .filter(item => item.val > 0);

            if (active.length > max) max = active.length;

            const newRow = { ...row };
            active.forEach((item, i) => {
                newRow[`val${i}`] = item.val;
                newRow[`color${i}`] = item.color;
                newRow[`name${i}`] = item.label;
            });
            return newRow;
        });
        return { compactData: compact, maxBars: max };
    }, [dashboardData, visibleMetrics]);

    return (
        <>
            <ChartContainer title="Analyse des Formations" onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <div style={{ height: 320, display: 'flex', flexDirection: 'column' }}>

                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={compactData} barGap={2}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#edf2f7" />
                                    <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        formatter={(value, name, props) => {
                                            const index = name.replace('val', '');
                                            const realName = props.payload[`name${index}`];
                                            return [value, realName];
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        content={() => (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {METRICS.filter(m => visibleMetrics[m.id]).map(m => (
                                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: '#4a5568' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: COLORS[m.id] }} />
                                                        {m.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />
                                    {[...Array(maxBars)].map((_, i) => (
                                        <Bar key={i} dataKey={`val${i}`} isAnimationActive={!isExporting} barSize={40} radius={[4, 4, 0, 0]}>
                                            {compactData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry[`color${i}`]} />
                                            ))}
                                            <LabelList dataKey={`val${i}`} position="top" className="bar-label" style={{ fill: '#4a5568', fontSize: 11, fontWeight: '700' }} formatter={(v) => v > 0 ? v : ''} />
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </ChartContainer>

            {open && (
                <SeancesModal
                    onClose={() => setOpen(false)}
                    data={modalData}
                    visibleMetrics={visibleMetrics}
                    setVisibleMetrics={setVisibleMetrics}
                    from={formationYearStart}
                />
            )}
            <style>{`
                .bar-label { pointer-events: none; }
            `}</style>
        </>
    );
}
