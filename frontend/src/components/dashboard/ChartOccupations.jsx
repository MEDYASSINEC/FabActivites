import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, LabelList, Cell
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';
import MonthPicker from './MonthPicker';

const MONTH_COLORS = ['#3b82f6', '#f97316', '#64748b', '#eab308', '#0ea5e9', '#6366f1', '#a855f7'];
const ZONE_PALETTE = ['#ef4444', '#8b5cf6', '#f59e0b', '#2563eb', '#16a34a', '#ea580c', '#ec4899', '#14b8a6', '#a16207', '#6366f1'];
const TOTAL_COLOR = '#22c55e';

const METRICS = [
    { id: 'utilisations', label: 'Utilisations', key: 'nb_utilisations', unit: '' },
    { id: 'duree', label: 'Heures', key: 'heures', unit: 'h' },
];

const CustomBarShape = (props) => {
    const { x, y, width, height, fill, isStacked, dataKey, payload, lastKeysPerX } = props;
    if (!height || height <= 0 || !payload) return null;

    const xValue = payload.zone || payload.mois;
    const isTop = !isStacked || (lastKeysPerX && xValue && lastKeysPerX[xValue] === dataKey);
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

const OccupationsModal = ({ onClose, rawData, zoneKeys, monthKeys, metric, setMetric, pivot, setPivot, isStacked, setIsStacked }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [view, setView] = useState('chart');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState(monthKeys);
    const [showTotalOnly, setShowTotalOnly] = useState(false);

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
            link.download = `Occupations_${metric.id}_${pivot}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); }
    };

    const formatMonth = (m) => new Date(m + "-01").toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    const processedData = useMemo(() => {
        // On ne prend que les mois sélectionnés
        const activeMonths = monthKeys.filter(m => selectedMonths.includes(m));

        if (pivot === 'zone') {
            return zoneKeys.map(zone => {
                const row = { zone };
                let total = 0;
                activeMonths.forEach(month => {
                    const found = rawData.find(d => d.zone === zone && d.mois === month);
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
                zoneKeys.forEach(zone => {
                    const found = rawData.find(d => d.zone === zone && d.mois === month);
                    const val = found ? Number(found[metric.key] || 0) : 0;
                    row[zone] = val;
                    total += val;
                });
                row.total = metric.id === 'duree' ? Math.round(total * 10) / 10 : Math.round(total);
                return row;
            });
        }
    }, [pivot, rawData, zoneKeys, monthKeys, metric, selectedMonths]);

    const activeKeys = pivot === 'zone' ? monthKeys.filter(m => selectedMonths.includes(m)) : zoneKeys;
    const xKey = pivot === 'zone' ? 'zone' : 'mois';

    const { compactData, maxBars, lastKeysPerX } = useMemo(() => {
        let max = 0;
        const lastKeys = {};
        const compact = processedData.map(row => {
            const xValue = row[xKey];
            const active = activeKeys
                .map((k, idx) => ({
                    key: k,
                    val: Number(row[k] || 0),
                    color: pivot === 'zone' ? MONTH_COLORS[idx % MONTH_COLORS.length] : ZONE_PALETTE[idx % ZONE_PALETTE.length]
                }))
                .filter(item => item.val > 0);

            if (active.length > max) max = active.length;

            const newRow = { ...row };
            active.forEach((item, i) => {
                newRow[`val${i}`] = item.val;
                newRow[`color${i}`] = item.color;
                newRow[`name${i}`] = item.key;
                if (i === active.length - 1) lastKeys[xValue] = `val${i}`;
            });
            return newRow;
        });
        return { compactData: compact, maxBars: max, lastKeysPerX: lastKeys };
    }, [processedData, activeKeys, xKey, pivot]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div ref={modalRef} style={{ background: '#fff', borderRadius: '30px', width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>
                <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', gap: '10px' }}>
                    <button onClick={exportImage} data-html2canvas-ignore="true" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 15px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    <button onClick={onClose} data-html2canvas-ignore="true" style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', color: '#718096' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Occupation des zones du FabLab</h2>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }} data-html2canvas-ignore="true">
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            {METRICS.map(m => (
                                <button key={m.id} onClick={() => setMetric(m)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: metric.id === m.id ? '#fff' : 'transparent', color: metric.id === m.id ? '#3182ce' : '#718096', boxShadow: metric.id === m.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>{m.label}</button>
                            ))}
                        </div>
                        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setPivot('zone')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: pivot === 'zone' ? '#fff' : 'transparent', color: pivot === 'zone' ? '#3182ce' : '#718096', boxShadow: pivot === 'zone' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Par Zone</button>
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f7fafc', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>
                                <input type="checkbox" checked={showTotalOnly} onChange={(e) => setShowTotalOnly(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#3182ce' }} />
                                Afficher uniquement le total
                            </label>
                        </div>
                    </div>

                    {showMonthPicker && (
                        <div data-html2canvas-ignore="true" style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease' }}>
                            <MonthPicker mois={selectedMonths} setMois={setSelectedMonths} />
                        </div>
                    )}
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7', minHeight: '500px' }}>
                    {view === 'chart' ? (
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={isStacked || showTotalOnly ? processedData : compactData} margin={{ bottom: 60 }} barGap={2}>
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
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value, name, props) => {
                                        if (isStacked || showTotalOnly) return [value, name];
                                        const index = name.replace('val', '');
                                        const realName = props.payload[`name${index}`];
                                        return [value, pivot === 'zone' ? formatMonth(realName) : realName];
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{ paddingBottom: '30px' }}
                                    content={() => (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                            {activeKeys.map((k, i) => (
                                                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: pivot === 'zone' ? MONTH_COLORS[i % MONTH_COLORS.length] : ZONE_PALETTE[i % ZONE_PALETTE.length] }} />
                                                    {pivot === 'zone' ? formatMonth(k) : k}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                                {!showTotalOnly && (isStacked ? (
                                    activeKeys.map((k, i) => (
                                        <Bar
                                            key={k}
                                            dataKey={k}
                                            name={pivot === 'zone' ? formatMonth(k) : k}
                                            stackId="a"
                                            fill={pivot === 'zone' ? MONTH_COLORS[i % MONTH_COLORS.length] : ZONE_PALETTE[i % ZONE_PALETTE.length]}
                                            isAnimationActive={!isExporting}
                                            shape={(props) => <CustomBarShape {...props} isStacked={true} lastKeysPerX={lastKeysPerX} />}
                                        >
                                            <LabelList dataKey={k} position="inside" formatter={(val) => val > 0 ? `${val}${metric.unit}` : ''} className="bar-label" style={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                    ))
                                ) : (
                                    [...Array(maxBars)].map((_, i) => (
                                        <Bar key={i} dataKey={`val${i}`} isAnimationActive={!isExporting} radius={[4, 4, 0, 0]} barSize={15} shape={(props) => <CustomBarShape {...props} isStacked={false} lastKeysPerX={lastKeysPerX} />}>
                                            {compactData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry[`color${i}`]} />
                                            ))}
                                            <LabelList dataKey={`val${i}`} position="top" className="bar-label" style={{ fill: '#4a5568', fontSize: 10, fontWeight: '700' }} formatter={(v) => v > 0 ? `${v}${metric.unit}` : ''} />
                                        </Bar>
                                    ))
                                ))}
                                {showTotalOnly && (
                                    <Bar dataKey="total" name="Total général" fill={TOTAL_COLOR} isAnimationActive={!isExporting} shape={(props) => <CustomBarShape {...props} isStacked={false} />}>
                                        <LabelList dataKey="total" position="top" formatter={(val) => `${val}${metric.unit}`} className="bar-label" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold' }} />
                                    </Bar>
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
                                <thead>
                                    <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 15px' }}>{pivot === 'zone' ? 'Zone' : 'Mois'}</th>
                                        {activeKeys.map(k => <th key={k} style={{ padding: '12px 15px' }}>{pivot === 'zone' ? formatMonth(k) : k}</th>)}
                                        <th style={{ padding: '12px 15px', background: '#c6f6d5' }}>Total général</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedData.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px 15px', fontWeight: '600' }}>{pivot === 'zone' ? row.zone : formatMonth(row.mois)}</td>
                                            {activeKeys.map(k => <td key={k} style={{ padding: '12px 15px' }}>{row[k] ? (metric.id === 'duree' ? Number(row[k]).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : row[k]) : '-'}{row[k] ? metric.unit : ''}</td>)}
                                            <td style={{ padding: '12px 15px', fontWeight: '700', background: '#f0fff4' }}>{metric.id === 'duree' ? Number(row.total).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : row.total}{metric.unit}</td>
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

export default function ChartOccupations({ from }) {
    const [rawData, setRawData] = useState([]);
    const [open, setOpen] = useState(false);
    const [metric, setMetric] = useState(METRICS[0]);
    const [pivot, setPivot] = useState('zone');
    const [isStacked, setIsStacked] = useState(false);

    useEffect(() => {
        api.get(`/dashboard/occupations/zones?from=${from || ''}`).then(r => {
            const data = (r.data || []).map(d => ({
                ...d,
                heures: Math.round((d.heures || 0) * 10) / 10
            }));
            setRawData(data);
        });
    }, [from]);

    const { zoneKeys, monthKeys } = useMemo(() => {
        const zk = new Set();
        const mk = new Set();
        rawData.forEach(d => {
            zk.add(d.zone);
            mk.add(d.mois);
        });
        return { zoneKeys: Array.from(zk).sort(), monthKeys: Array.from(mk).sort() };
    }, [rawData]);

    const dashboardData = useMemo(() => {
        const lastMonths = monthKeys.slice(-3);
        const withTotal = zoneKeys.map(zone => {
            const row = { zone };
            let total = 0;
            lastMonths.forEach(month => {
                const found = rawData.find(d => d.zone === zone && d.mois === month);
                const val = found ? found[metric.key] : 0;
                row[month] = val;
                total += val;
            });
            row._total = total;
            return row;
        });
        return withTotal.sort((a, b) => b._total - a._total).slice(0, 5);
    }, [rawData, zoneKeys, monthKeys, metric]);

    const { compactData, maxBars, lastKeysPerX } = useMemo(() => {
        let max = 0;
        const lastKeys = {};
        const lastMonths = monthKeys.slice(-3);
        const compact = dashboardData.map(row => {
            const active = lastMonths
                .map((m, i) => ({ key: m, val: Number(row[m] || 0), color: MONTH_COLORS[i % MONTH_COLORS.length] }))
                .filter(item => item.val > 0);

            if (active.length > max) max = active.length;

            const newRow = { ...row };
            active.forEach((item, i) => {
                newRow[`val${i}`] = item.val;
                newRow[`color${i}`] = item.color;
                newRow[`name${i}`] = item.key;
                if (i === active.length - 1) lastKeys[row.zone] = `val${i}`;
            });
            return newRow;
        });
        return { compactData: compact, maxBars: max, lastKeysPerX: lastKeys };
    }, [dashboardData, monthKeys]);

    const formatMonth = (m) => new Date(m + "-01").toLocaleDateString('fr-FR', { month: 'short' });

    return (
        <>
            <ChartContainer title={`Occupation des zones (${metric.label})`} onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <div style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={compactData} margin={{ bottom: 40 }} barGap={2}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#edf2f7" />
                                    <XAxis
                                        dataKey="zone"
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        tick={<CustomXAxisTick allText={false} />}
                                    />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        formatter={(value, name, props) => {
                                            const index = name.replace('val', '');
                                            const realName = props.payload[`name${index}`];
                                            return [value, formatMonth(realName)];
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        content={() => (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {monthKeys.slice(-3).map((m, i) => (
                                                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: '#4a5568' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: MONTH_COLORS[i % MONTH_COLORS.length] }} />
                                                        {formatMonth(m)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />
                                    {[...Array(maxBars)].map((_, i) => (
                                        <Bar
                                            key={i}
                                            dataKey={`val${i}`}
                                            isAnimationActive={!isExporting}
                                            barSize={15}
                                            radius={[3, 3, 0, 0]}
                                            shape={(props) => <CustomBarShape {...props} isStacked={false} lastKeysPerX={lastKeysPerX} />}
                                        >
                                            {compactData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry[`color${i}`]} />
                                            ))}
                                            <LabelList dataKey={`val${i}`} position="top" formatter={(val) => val > 0 ? `${val}${metric.unit}` : ''} className="bar-label" style={{ fill: '#4a5568', fontSize: 10, fontWeight: '700' }} />
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </ChartContainer>

            {open && (
                <OccupationsModal
                    onClose={() => setOpen(false)}
                    rawData={rawData}
                    zoneKeys={zoneKeys}
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
                .bar-label { pointer-events: none; }
            `}</style>
        </>
    );
}
