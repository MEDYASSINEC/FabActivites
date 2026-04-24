
import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, LabelList, Cell
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';

const STATUS_COLORS = {
    'Terminé': '#22c55e',     // Green (plus vibrant)
    'En cours': '#3b82f6',    // Blue (plus moderne)
    'Abandonné': '#ef4444',   // Red (plus vif)
    'Suspendu': '#f59e0b',    // Amber (plus chaleureux que jaune)
    'Non défini': '#64748b'   // Slate gray (plus élégant)
};
const CustomStackedBar = (props) => {
    const { x, y, width, height, fill, mois, statut, lastStatutPerMois } = props;
    if (!height || height <= 0) return null;

    const isTop = lastStatutPerMois[mois] === statut;
    const r = isTop ? 4 : 0;

    return (
        <path
            d={`
                M ${x + r},${y}
                h ${width - 2 * r}
                q ${r},0 ${r},${r}
                v ${height - r}
                h ${-width}
                v ${-(height - r)}
                q 0,${-r} ${r},${-r}
                Z
            `}
            fill={fill}
        />
    );
};
const ChartContainer = ({ title, children, onExpand }) => {
    const cardRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    const exportImage = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 200)); // plus de temps pour Recharts
        const el = cardRef.current;
        el.offsetHeight; // Forcer un reflow
        try {
            const dataUrl = await domtoimage.toPng(el, {
                bgcolor: '#ffffff',
                scale: 2,
                width: el.offsetWidth,
                height: el.offsetHeight,
                filter: (node) => !(node.hasAttribute && node.hasAttribute('data-html2canvas-ignore'))
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
            {/* Injecter une classe CSS sur le wrapper selon isExporting */}
            <div className={isExporting ? 'chart-exporting' : 'chart-normal'}>
                {typeof children === 'function' ? children(isExporting) : children}
            </div>
        </div>
    );
};

const ProjetsModal = ({ onClose, data, viewMode, setViewMode, includeParticipants, setIncludeParticipants }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false); // ← ajouter

    const exportImage = async () => {
        if (!modalRef.current) return;
        setIsExporting(true); // ← ajouter
        await new Promise(r => setTimeout(r, 50)); // ← ajouter
        const el = modalRef.current;
        el.offsetHeight; // Forcer un reflow
        try {
            const dataUrl = await domtoimage.toPng(el, {
                bgcolor: '#ffffff',
                scale: 2,
                width: el.scrollWidth,
                height: el.scrollHeight,
                filter: (node) => {
                    if (node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) return false;
                    let parent = node.parentElement;
                    while (parent) {
                        if (parent.hasAttribute && parent.hasAttribute('data-html2canvas-ignore')) return false;
                        parent = parent.parentElement;
                    }
                    return true;
                }
            });
            const link = document.createElement('a');
            link.download = `Statuts_Projets.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); } // ← ajouter
    };

    const pivotedData = useMemo(() => {
        const months = {};
        data.forEach(r => {
            if (!months[r.mois]) months[r.mois] = { mois: r.mois };
            months[r.mois][r.statut] = Number(r.valeur || 0);
        });
        return Object.values(months).sort((a, b) => a.mois.localeCompare(b.mois));
    }, [data]);

    const statuts = useMemo(() => Array.from(new Set(data.map(r => r.statut))), [data]);

    const lastStatutPerMois = useMemo(() => {
        const map = {};
        pivotedData.forEach((row) => {
            // On parcourt les statuts en ordre inverse pour trouver le dernier non-nul
            for (let i = statuts.length - 1; i >= 0; i--) {
                if (row[statuts[i]] != null && row[statuts[i]] > 0) {
                    map[row.mois] = statuts[i];
                    break;
                }
            }
        });
        return map;
    }, [pivotedData, statuts]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div ref={modalRef} style={{ background: '#fff', borderRadius: '30px', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>
                <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', gap: '10px' }} data-html2canvas-ignore="true">
                    <button onClick={exportImage} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 15px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    <button onClick={onClose} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', color: '#718096' }}>✕</button>
                </div>

                <h2 style={{ marginBottom: '30px', color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Statuts des Projets</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }} data-html2canvas-ignore="true">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <button onClick={() => setViewMode('stacked')} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: viewMode === 'stacked' ? '#3182ce' : '#fff', color: viewMode === 'stacked' ? '#fff' : '#4a5568' }}>📊 Empilé</button>
                            <button onClick={() => setViewMode('grouped')} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', borderLeft: '1px solid #e2e8f0', background: viewMode === 'grouped' ? '#3182ce' : '#fff', color: viewMode === 'grouped' ? '#fff' : '#4a5568' }}>📉 Groupé</button>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                            <input type="checkbox" checked={includeParticipants} onChange={e => setIncludeParticipants(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3182ce' }} />
                            Compter les participants
                        </label>
                    </div>
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7' }}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={pivotedData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                            {statuts.map((s) => (
                                <Bar
                                    key={s}
                                    dataKey={s}
                                    stackId={viewMode === 'stacked' ? 'a' : undefined}
                                    fill={STATUS_COLORS[s] || STATUS_COLORS['Non défini']}
                                    radius={viewMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                                    isAnimationActive={!isExporting}
                                    barSize={viewMode === 'stacked' ? 40 : 15}
                                    shape={viewMode === 'stacked'
                                        ? (props) => <CustomStackedBar {...props} statut={s} lastStatutPerMois={lastStatutPerMois} />
                                        : undefined
                                    }
                                >
                                    {viewMode === 'grouped' ? (
                                        <LabelList dataKey={s} position="top" className="bar-label" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                    ) : (
                                        <LabelList dataKey={s} position="inside" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} formatter={(v) => v > 0 ? v : ''} className="bar-label" />
                                    )}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default function ChartProjetsStatut() {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState('stacked');
    const [includeParticipants, setIncludeParticipants] = useState(false);

    useEffect(() => {
        api.get(`/dashboard/projets/statuts?mois=12&includeParticipants=${includeParticipants}`).then(r => setData(r.data || []));
    }, [includeParticipants]);

    const previewData = useMemo(() => {
        const months = {};
        data.forEach(r => {
            if (!months[r.mois]) months[r.mois] = { mois: r.mois };
            months[r.mois][r.statut] = Number(r.valeur || 0);
        });
        return Object.values(months).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-4);
    }, [data]);

    const statuts = useMemo(() => Array.from(new Set(data.map(r => r.statut))), [data]);

    const lastStatutPerMois = useMemo(() => {
        const map = {};
        previewData.forEach((row) => {
            for (let i = statuts.length - 1; i >= 0; i--) {
                if (row[statuts[i]] != null && row[statuts[i]] > 0) {
                    map[row.mois] = statuts[i];
                    break;
                }
            }
        });
        return map;
    }, [previewData, statuts]);

    return (
        <>
            <ChartContainer title="Projets par Statut" onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={previewData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#edf2f7" />
                            <XAxis dataKey="mois" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short' })} dy={10} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            {statuts.map(s => (
                                <Bar key={s} dataKey={s} stackId="a" fill={STATUS_COLORS[s] || STATUS_COLORS['Non défini']}
                                    isAnimationActive={!isExporting}
                                    shape={(props) => <CustomStackedBar {...props} statut={s} lastStatutPerMois={lastStatutPerMois} />}
                                >
                                    <LabelList dataKey={s} position="inside" style={{ fill: '#000', fontSize: 10, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} formatter={(v) => v > 0 ? v : ''} className="bar-label" />
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartContainer>

            {open && (
                <ProjetsModal
                    onClose={() => setOpen(false)}
                    data={data}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    includeParticipants={includeParticipants}
                    setIncludeParticipants={setIncludeParticipants}
                />
            )}
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </>
    );
}