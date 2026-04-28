import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, LabelList, Cell
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';
import MonthPicker from './MonthPicker';

const COLORS = {
    // Types
    'Formation': '#3182ce',
    'Développement de projet': '#63b3ed',
    'Projet de classe': '#4fd1c5',
    'Visite': '#38a169',
    'Autre': '#f6ad55',
    // Pôles (Palette ordonnée)
    'color1': '#ef4444',   // Rouge moderne
    'color2': '#8b5cf6',   // Violet vibrant
    'color3': '#f59e0b',   // Or / amber stylé
    'color4': '#2563eb',   // Bleu profond moderne
    'color5': '#16a34a',   // Vert profond clean
    'color6': '#ea580c',   // Orange énergique
    'color7': '#ec4899',   // Rose moderne
    'color8': '#14b8a6',   // Teal lumineux
    'color9': '#a16207',   // Brun chaud
    'color10': '#6366f1',  // Indigo moderne
    'Default': '#a0aec0'
};

const getBarColor = (key, mode, index) => {
    if (mode === 'type') {
        return COLORS[key] || COLORS.Default;
    }
    const polePalette = Object.keys(COLORS).filter(k => k.startsWith('color'));
    const colorKey = polePalette[index % polePalette.length];
    return COLORS[colorKey];
};

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

const FrequentationsModal = ({ onClose, data, keys, viewMode, setViewMode, isStacked, setIsStacked }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Tous les mois disponibles dans les données
    const allMonths = useMemo(() => data.map(d => d.mois).sort(), [data]);
    const [selectedMonths, setSelectedMonths] = useState(allMonths);

    const filteredData = useMemo(() => {
        return data.filter(d => selectedMonths.includes(d.mois));
    }, [data, selectedMonths]);

    const { compactData, maxBars } = useMemo(() => {
        let max = 0;
        const compact = filteredData.map(row => {
            const active = keys
                .map((k, idx) => ({ key: k, val: Number(row[k] || 0), color: getBarColor(k, viewMode, idx) }))
                .filter(item => item.val > 0);

            if (active.length > max) max = active.length;

            const newRow = { ...row };
            active.forEach((item, i) => {
                newRow[`val${i}`] = item.val;
                newRow[`color${i}`] = item.color;
                newRow[`name${i}`] = item.key;
            });
            return newRow;
        });
        return { compactData: compact, maxBars: max };
    }, [filteredData, keys, viewMode]);

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
            link.download = `Frequentations_${viewMode}_${isStacked ? 'Stacked' : 'Grouped'}.png`;
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
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Analyse des Fréquentations</h2>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }} data-html2canvas-ignore="true">
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setViewMode('type')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: viewMode === 'type' ? '#fff' : 'transparent', color: viewMode === 'type' ? '#3182ce' : '#718096', boxShadow: viewMode === 'type' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>Par Type</button>
                            <button onClick={() => setViewMode('pole')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: viewMode === 'pole' ? '#fff' : 'transparent', color: viewMode === 'pole' ? '#3182ce' : '#718096', boxShadow: viewMode === 'pole' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>Par Pôle</button>
                        </div>
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setIsStacked(true)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: isStacked ? '#fff' : 'transparent', color: isStacked ? '#3182ce' : '#718096', boxShadow: isStacked ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>Empilé</button>
                            <button onClick={() => setIsStacked(false)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: !isStacked ? '#fff' : 'transparent', color: !isStacked ? '#3182ce' : '#718096', boxShadow: !isStacked ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>Groupé</button>
                        </div>
                        <button onClick={() => setShowMonthPicker(!showMonthPicker)} style={{ background: showMonthPicker ? '#3182ce' : '#f7fafc', color: showMonthPicker ? '#fff' : '#4a5568', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {showMonthPicker ? 'Masquer les mois' : 'Filtrer les mois'}
                        </button>
                    </div>

                    {showMonthPicker && (
                        <div data-html2canvas-ignore="true" style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease' }}>
                            <MonthPicker mois={selectedMonths} setMois={setSelectedMonths} />
                        </div>
                    )}
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7' }}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={isStacked ? filteredData : compactData} barGap={2}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value, name, props) => {
                                    if (isStacked) return [value, name];
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
                                        {keys.map((k, idx) => (
                                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: getBarColor(k, viewMode, idx) }} />
                                                {k}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                            {isStacked ? (
                                keys.map((k, idx) => (
                                    <Bar key={k} dataKey={k} name={k} stackId="a" fill={getBarColor(k, viewMode, idx)} isAnimationActive={!isExporting}>
                                        <LabelList dataKey={k} position="inside" className="bar-label" style={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }} formatter={(v) => v > 0 ? v : ''} />
                                    </Bar>
                                ))
                            ) : (
                                [...Array(maxBars)].map((_, i) => (
                                    <Bar key={i} dataKey={`val${i}`} isAnimationActive={!isExporting} radius={[4, 4, 0, 0]} barSize={15}>
                                        {compactData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry[`color${i}`]} />
                                        ))}
                                        <LabelList dataKey={`val${i}`} position="top" className="bar-label" style={{ fill: '#4a5568', fontSize: 10, fontWeight: '700' }} formatter={(v) => v > 0 ? v : ''} />
                                    </Bar>
                                ))
                            )}
                        </BarChart>
                    </ResponsiveContainer>
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

export default function ChartFrequentations({ from }) {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState('type');
    const [isStacked, setIsStacked] = useState(false);

    useEffect(() => {
        api.get(`/dashboard/frequentations/mois?from=${from || ''}&groupBy=${viewMode}`).then(r => setData(r.data || []));
    }, [from, viewMode]);

    const keys = useMemo(() => {
        const set = new Set();
        data.forEach(d => Object.keys(d).forEach(k => {
            if (k !== 'mois') set.add(k);
        }));
        return Array.from(set);
    }, [data]);

    const dashboardData = useMemo(() => {
        return data.slice(-3).map(row => {
            const total = keys.reduce((sum, k) => sum + Number(row[k] || 0), 0);
            return { ...row, total };
        });
    }, [data, keys]);

    return (
        <>
            <ChartContainer title="Fréquentations" onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboardData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#edf2f7" />
                            <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short' })} dy={10} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar dataKey="total" name="Total" fill="#3182ce" isAnimationActive={!isExporting} barSize={35} radius={[6, 6, 0, 0]}>
                                <LabelList dataKey="total" position="top" className="bar-label" style={{ fill: '#4a5568', fontSize: 11, fontWeight: '800' }} formatter={(v) => v > 0 ? v : ''} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartContainer>

            {open && (
                <FrequentationsModal
                    onClose={() => setOpen(false)}
                    data={data}
                    keys={keys}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    isStacked={isStacked}
                    setIsStacked={setIsStacked}
                />
            )}
            <style>{`
                .bar-label { pointer-events: none; }
            `}</style>
        </>
    );
}
