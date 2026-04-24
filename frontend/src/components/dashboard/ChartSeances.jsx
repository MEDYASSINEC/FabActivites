import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, LabelList
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
    { id: 'formations', label: 'Formations (Uniques)', key: 'nb_formations' },
    { id: 'seances', label: 'Séances (Total)', key: 'nb_seances' },
    { id: 'participants', label: 'Participants (Impactés)', key: 'nb_participants' },
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

const SeancesModal = ({ onClose, data, visibleMetrics, setVisibleMetrics }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const allMonths = useMemo(() => data.map(d => d.mois).sort(), [data]);
    const [selectedMonths, setSelectedMonths] = useState(allMonths);

    const filteredData = useMemo(() => {
        return data.filter(d => selectedMonths.includes(d.mois));
    }, [data, selectedMonths]);

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
                <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', gap: '10px' }} data-html2canvas-ignore="true">
                    <button onClick={exportImage} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 15px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    <button onClick={onClose} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', color: '#718096' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }} data-html2canvas-ignore="true">
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Analyse des Formations</h2>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                    </div>

                    {showMonthPicker && (
                        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease' }}>
                            <MonthPicker mois={selectedMonths} setMois={setSelectedMonths} />
                        </div>
                    )}
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7' }}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={filteredData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                            {METRICS.map(m => visibleMetrics[m.id] && (
                                <Bar key={m.id} dataKey={m.key} name={m.label} fill={COLORS[m.id]} radius={[4, 4, 0, 0]} isAnimationActive={!isExporting}>
                                    <LabelList dataKey={m.key} position="top" className="bar-label" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </div>
    );
};

export default function ChartSeances({ from }) {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [visibleMetrics, setVisibleMetrics] = useState({ formations: true, seances: true, participants: true, duree: true });

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
        if (data.length === 0) return [];
        return [data.sort((a, b) => b.mois.localeCompare(a.mois))[0]];
    }, [data]);

    return (
        <>
            <ChartContainer title="Analyse des Formations (Dernier Mois)" onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <div style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }} data-html2canvas-ignore="true">
                            {METRICS.map(m => (
                                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#718096' }}>
                                    <input type="checkbox" checked={visibleMetrics[m.id]} onChange={() => setVisibleMetrics(s => ({ ...s, [m.id]: !s[m.id] }))} style={{ width: '15px', height: '15px', accentColor: COLORS[m.id] }} />
                                    {m.label}
                                </label>
                            ))}
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#edf2f7" />
                                    <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    {METRICS.map(m => visibleMetrics[m.id] && (
                                        <Bar key={m.id} dataKey={m.key} name={m.label} fill={COLORS[m.id]} radius={[4, 4, 0, 0]} isAnimationActive={!isExporting} barSize={40}>
                                            <LabelList dataKey={m.key} position="top" className="bar-label" style={{ fill: '#000', fontSize: 11, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
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
                />
            )}
            <style>{`
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </>
    );
}
