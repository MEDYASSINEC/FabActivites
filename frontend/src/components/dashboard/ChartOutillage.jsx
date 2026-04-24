import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, LabelList
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';
import MonthPicker from './MonthPicker';

const MONTH_COLORS = ['#3b82f6', '#f97316', '#64748b', '#eab308', '#0ea5e9', '#6366f1', '#a855f7'];
const MACHINE_PALETTE = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#2563eb', '#16a34a', '#ea580c', '#a16207', '#6366f1'];
const TOTAL_COLOR = '#22c55e';

const METRICS = [
    { id: 'utilisations', label: 'Utilisations', key: 'nb_utilisations', unit: '' },
    { id: 'utilisateurs', label: 'Utilisateurs', key: 'nb_utilisateurs', unit: '' },
    { id: 'duree', label: 'Durée (h)', key: 'duree_heures', unit: 'h' },
];

const CustomBarShape = (props) => {
    const { x, y, width, height, fill, isStacked, dataKey, payload, lastKeysPerX } = props;
    if (!height || height <= 0) return null;

    const xValue = payload.machine || payload.mois;
    const isTop = !isStacked || (lastKeysPerX && lastKeysPerX[xValue] === dataKey);
    const r = isTop ? 6 : 0;

    return (
        <path
            d={`
                M ${x},${y + r}
                Q ${x},${y} ${x + r},${y}
                L ${x + width - r},${y}
                Q ${x + width},${y} ${x + width},${y + r}
                L ${x + width},${y + height}
                L ${x},${y + height}
                Z
            `}
            fill={fill}
        />
    );
};

const CustomXAxisTick = ({ x, y, payload, allText }) => {
    const text = payload.value;
    if (allText) {
        const maxChars = 15;
        const lines = [];
        const words = text.split(' ');
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            if ((currentLine + ' ' + words[i]).length <= maxChars) {
                currentLine += ' ' + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return (
            <g transform={`translate(${x},${y})`}>
                <text textAnchor="middle" fill="#666" style={{ fontSize: '10px', fontWeight: '600' }}>
                    {lines.map((line, i) => (
                        <tspan key={i} x={0} dy={i === 0 ? 12 : 12}>{line}</tspan>
                    ))}
                </text>
            </g>
        );
    } else {
        const maxChars = 5;
        const displayText = text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" style={{ fontSize: '10px', fontWeight: '600' }}>
                    {displayText}
                </text>
            </g>
        );
    }
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

const OutillagesModal = ({ onClose, data, machineKeys, monthKeys, metric, setMetric, pivot, setPivot, isStacked, setIsStacked }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [view, setView] = useState('chart');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState(monthKeys);

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
            link.download = `Outillages_${metric.id}_${pivot}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); }
    };

    const formatMonth = (m) => new Date(m + "-01").toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    const processedData = useMemo(() => {
        const activeMonths = monthKeys.filter(m => selectedMonths.includes(m));

        if (pivot === 'machine') {
            return machineKeys.map(machine => {
                const row = { machine };
                let total = 0;
                activeMonths.forEach(month => {
                    const found = data.find(d => d.machine === machine && d.mois === month);
                    const val = found ? Number(found[metric.key] || 0) : 0;
                    row[month] = val;
                    total += val;
                });
                row.total = metric.id === 'duree' ? Math.round(total * 10) / 10 : Math.round(total);
                return row;
            });
        } else {
            return activeMonths.map(month => {
                const row = { mois: month };
                let total = 0;
                machineKeys.forEach(machine => {
                    const found = data.find(d => d.machine === machine && d.mois === month);
                    const val = found ? Number(found[metric.key] || 0) : 0;
                    row[machine] = val;
                    total += val;
                });
                row.total = metric.id === 'duree' ? Math.round(total * 10) / 10 : Math.round(total);
                return row;
            });
        }
    }, [pivot, data, machineKeys, monthKeys, metric, selectedMonths]);

    const activeKeys = pivot === 'machine' ? monthKeys.filter(m => selectedMonths.includes(m)) : machineKeys;
    const xKey = pivot === 'machine' ? 'machine' : 'mois';

    const lastKeysPerX = useMemo(() => {
        if (!isStacked) return {};
        const map = {};
        processedData.forEach((row) => {
            const xValue = row[xKey];
            for (let i = activeKeys.length - 1; i >= 0; i--) {
                if (row[activeKeys[i]] > 0) {
                    map[xValue] = activeKeys[i];
                    break;
                }
            }
        });
        return map;
    }, [isStacked, processedData, activeKeys, xKey]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div ref={modalRef} style={{ background: '#fff', borderRadius: '30px', width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>
                <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', gap: '10px' }} data-html2canvas-ignore="true">
                    <button onClick={exportImage} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 15px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    <button onClick={onClose} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', color: '#718096' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }} data-html2canvas-ignore="true">
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Analyse de l'Outillage</h2>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            {METRICS.map(m => (
                                <button key={m.id} onClick={() => setMetric(m)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: metric.id === m.id ? '#fff' : 'transparent', color: metric.id === m.id ? '#3182ce' : '#718096', boxShadow: metric.id === m.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>{m.label}</button>
                            ))}
                        </div>
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setPivot('machine')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: pivot === 'machine' ? '#fff' : 'transparent', color: pivot === 'machine' ? '#3182ce' : '#718096', boxShadow: pivot === 'machine' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Par Machine</button>
                            <button onClick={() => setPivot('month')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: pivot === 'month' ? '#fff' : 'transparent', color: pivot === 'month' ? '#3182ce' : '#718096', boxShadow: pivot === 'month' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Par Mois</button>
                        </div>
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setView('chart')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: view === 'chart' ? '#fff' : 'transparent', color: view === 'chart' ? '#3182ce' : '#718096', boxShadow: view === 'chart' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Graphique</button>
                            <button onClick={() => setView('table')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: view === 'table' ? '#fff' : 'transparent', color: view === 'table' ? '#3182ce' : '#718096', boxShadow: view === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Tableau</button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {view === 'chart' && (
                                <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                                    <button onClick={() => setIsStacked(true)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: isStacked ? '#fff' : 'transparent', color: isStacked ? '#3182ce' : '#718096', boxShadow: isStacked ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Empilé</button>
                                    <button onClick={() => setIsStacked(false)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: !isStacked ? '#fff' : 'transparent', color: !isStacked ? '#3182ce' : '#718096', boxShadow: !isStacked ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Groupé</button>
                                </div>
                            )}
                            <button onClick={() => setShowMonthPicker(!showMonthPicker)} style={{ background: showMonthPicker ? '#3182ce' : '#f7fafc', color: showMonthPicker ? '#fff' : '#4a5568', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                {showMonthPicker ? 'Masquer les mois' : 'Filtrer les mois'}
                            </button>
                        </div>
                    </div>

                    {showMonthPicker && (
                        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease' }}>
                            <MonthPicker mois={selectedMonths} setMois={setSelectedMonths} />
                        </div>
                    )}
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7', minHeight: '500px' }}>
                    {view === 'chart' ? (
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={processedData} margin={{ bottom: 60 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey={xKey} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    interval={0} 
                                    tick={<CustomXAxisTick allText={true} isMonth={pivot === 'month'} />}
                                    tickFormatter={(t) => pivot === 'month' ? formatMonth(t) : t} 
                                />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px' }} />
                                {activeKeys.map((k, i) => (
                                    <Bar 
                                        key={k} 
                                        dataKey={k} 
                                        name={pivot === 'machine' ? formatMonth(k) : k} 
                                        stackId={isStacked ? "a" : undefined} 
                                        fill={pivot === 'machine' ? MONTH_COLORS[i % MONTH_COLORS.length] : MACHINE_PALETTE[i % MACHINE_PALETTE.length]} 
                                        isAnimationActive={!isExporting}
                                        shape={<CustomBarShape isStacked={isStacked} lastKeysPerX={lastKeysPerX} />}
                                    >
                                        <LabelList dataKey={k} position={isStacked ? "inside" : "top"} formatter={(val) => val > 0 ? `${val}${metric.unit}` : ''} className="bar-label" style={{ fill: isStacked ? '#fff' : '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                    </Bar>
                                ))}
                                {!isStacked && (
                                    <Bar dataKey="total" name="Total général" fill={TOTAL_COLOR} isAnimationActive={!isExporting} shape={<CustomBarShape isStacked={false} />}>
                                        <LabelList dataKey="total" position="top" formatter={(val) => `${val}${metric.unit}`} className="bar-label" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                    </Bar>
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
                                <thead>
                                    <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 15px' }}>{pivot === 'machine' ? 'Machine' : 'Mois'}</th>
                                        {activeKeys.map(k => <th key={k} style={{ padding: '12px 15px' }}>{pivot === 'machine' ? formatMonth(k) : k}</th>)}
                                        <th style={{ padding: '12px 15px', background: '#c6f6d5' }}>Total général</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedData.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px 15px', fontWeight: '600' }}>{pivot === 'machine' ? row.machine : formatMonth(row.mois)}</td>
                                            {activeKeys.map(k => <td key={k} style={{ padding: '12px 15px' }}>{row[k] || '-'}{row[k] ? metric.unit : ''}</td>)}
                                            <td style={{ padding: '12px 15px', fontWeight: '700', background: '#f0fff4' }}>{row.total}{metric.unit}</td>
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
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </div>
    );
};

export default function ChartOutillage({ from }) {
    const [rawData, setRawData] = useState([]);
    const [open, setOpen] = useState(false);
    const [metric, setMetric] = useState(METRICS[0]);
    const [pivot, setPivot] = useState('machine');
    const [isStacked, setIsStacked] = useState(false);

    useEffect(() => {
        api.get(`/dashboard/outillages/mois?from=${from || ''}`).then(r => {
            const data = (r.data || []).map(d => ({
                ...d,
                duree_heures: Math.round((d.duree_minutes || 0) / 60 * 10) / 10
            }));
            setRawData(data);
        });
    }, [from]);

    const { machineKeys, monthKeys } = useMemo(() => {
        const mk = new Set();
        const th = new Set();
        rawData.forEach(d => {
            mk.add(d.machine);
            th.add(d.mois);
        });
        return { machineKeys: Array.from(mk).sort(), monthKeys: Array.from(th).sort() };
    }, [rawData]);

    const dashboardData = useMemo(() => {
        return machineKeys.map(machine => {
            const row = { machine };
            monthKeys.slice(-4).forEach(month => {
                const found = rawData.find(d => d.machine === machine && d.mois === month);
                row[month] = found ? found[metric.key] : 0;
            });
            return row;
        });
    }, [rawData, machineKeys, monthKeys, metric]);

    const lastKeysPerMachine = useMemo(() => {
        const map = {};
        dashboardData.forEach((row) => {
            const lastMonths = monthKeys.slice(-4);
            for (let i = lastMonths.length - 1; i >= 0; i--) {
                if (row[lastMonths[i]] > 0) {
                    map[row.machine] = lastMonths[i];
                    break;
                }
            }
        });
        return map;
    }, [dashboardData, monthKeys]);

    const formatMonth = (m) => new Date(m + "-01").toLocaleDateString('fr-FR', { month: 'short' });

    return (
        <>
            <ChartContainer title={`Utilisation de l'Outillage (${metric.label})`} onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <div style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData} margin={{ bottom: 40 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#edf2f7" />
                                    <XAxis 
                                        dataKey="machine" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        interval={0}
                                        tick={<CustomXAxisTick allText={false} />}
                                    />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Legend verticalAlign="top" align="right" />
                                    {monthKeys.slice(-4).map((m, i) => (
                                        <Bar 
                                            key={m} 
                                            dataKey={m} 
                                            name={formatMonth(m)} 
                                            stackId="a" 
                                            fill={MONTH_COLORS[i % MONTH_COLORS.length]} 
                                            isAnimationActive={!isExporting}
                                            shape={<CustomBarShape isStacked={true} lastKeysPerX={lastKeysPerMachine} />}
                                        >
                                            <LabelList dataKey={m} position="inside" formatter={(val) => val > 0 ? `${val}${metric.unit}` : ''} className="bar-label" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </ChartContainer>

            {open && (
                <OutillagesModal
                    onClose={() => setOpen(false)}
                    data={rawData}
                    machineKeys={machineKeys}
                    monthKeys={monthKeys}
                    metric={metric}
                    setMetric={setMetric}
                    pivot={pivot}
                    setPivot={setPivot}
                    isStacked={isStacked}
                    setIsStacked={setIsStacked}
                />
            )}
            <style>{`
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </>
    );
}
