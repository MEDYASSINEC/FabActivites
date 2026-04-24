
import { useEffect, useMemo, useState, useRef } from 'react';
import { 
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, 
    Tooltip, XAxis, YAxis, AreaChart, Area, LabelList 
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';

// Reuse the premium ChartContainer logic
const ChartContainer = ({ title, children, onExpand }) => {
    const [isExporting, setIsExporting] = useState(false);
    const cardRef = useRef(null);

    const exportImage = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 200));
        const el = cardRef.current;
        el.offsetHeight; // Force reflow
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
                    <button onClick={exportImage} data-html2canvas-ignore="true" title="Exporter en image PNG" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#718096', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> PNG
                    </button>
                    {onExpand && (
                        <button onClick={onExpand} title="Voir plus de détails" data-html2canvas-ignore="true" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#718096', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}>
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

// Premium Modal based on logic from Dashboard.jsx
const BeneficiaireModal = ({ onClose, frequentations, viewMode, setViewMode, selectedMonth, setSelectedMonth }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const formationYearStart = useMemo(() => {
        const now = new Date();
        const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}-09`;
    }, []);

    const exportImage = async () => {
        if (!modalRef.current) return;
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 50));
        const el = modalRef.current;
        el.offsetHeight; // Force reflow
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
            link.download = `Analyse_Beneficiaires_${viewMode}_${selectedMonth}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); }
    };

    const monthsList = useMemo(() => {
        const months = {};
        frequentations.forEach(f => {
            if (!f.date) return;
            const m = f.date.substring(0, 7);
            if (m >= formationYearStart) {
                const d = new Date(m + "-01");
                months[m] = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            }
        });
        return Object.entries(months).sort().reverse();
    }, [frequentations, formationYearStart]);

    const filteredData = useMemo(() => {
        let list = frequentations.filter(f => f.date && f.date.substring(0, 7) >= formationYearStart);
        if (selectedMonth !== 'all' && viewMode !== 'month') {
            list = list.filter(f => f.date.substring(0, 7) === selectedMonth);
        }
        return list;
    }, [frequentations, selectedMonth, formationYearStart, viewMode]);

    const chartData = useMemo(() => {
        if (viewMode === 'month') {
            const months = {};
            const [y, m] = formationYearStart.split('-').map(Number);
            for (let i = 0; i < 12; i++) {
                const d = new Date(y, m - 1 + i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months[key] = 0;
            }
            filteredData.forEach(f => {
                const m = f.date.substring(0, 7);
                if (months[m] !== undefined) months[m] += Number(f.nb_participants || 0);
            });
            return Object.entries(months).sort().map(([name, value]) => ({ name, value }));
        } else if (viewMode === 'pole') {
            const poles = {};
            filteredData.forEach(f => {
                const p = f.activite_pole || "Autre";
                poles[p] = (poles[p] || 0) + Number(f.nb_participants || 0);
            });
            return Object.entries(poles).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
        } else {
            const types = {};
            filteredData.forEach(f => {
                const t = f.type_activite || "Autre";
                types[t] = (types[t] || 0) + Number(f.nb_participants || 0);
            });
            return Object.entries(types).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
        }
    }, [filteredData, viewMode, formationYearStart]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div ref={modalRef} style={{ background: '#fff', borderRadius: '30px', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>
                    <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', gap: '10px' }} data-html2canvas-ignore="true">
                        <button 
                            onClick={exportImage}
                            title="Exporter en image PNG"
                            style={{ 
                                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', 
                                padding: '0 15px', height: '40px', cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '13px', fontWeight: '600', color: '#4a5568',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            PNG
                        </button>
                        <button onClick={onClose} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', color: '#718096' }}>✕</button>
                    </div>
                
                <h2 style={{ marginBottom: '30px', color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Analyse des Bénéficiaires</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }} data-html2canvas-ignore="true">
                    <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        {[ { id: 'month', label: 'Par Mois', icon: '📅' }, { id: 'pole', label: 'Par Pôle', icon: '🏢' }, { id: 'type', label: 'Par Type', icon: '⚙️' } ].map(btn => (
                            <button key={btn.id} onClick={() => setViewMode(btn.id)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: viewMode === btn.id ? '#3182ce' : '#fff', color: viewMode === btn.id ? '#fff' : '#4a5568', borderRight: btn.id !== 'type' ? '1px solid #e2e8f0' : 'none' }}>
                                {btn.icon} {btn.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>Période :</span>
                        <select 
                            disabled={viewMode === 'month'}
                            value={viewMode === 'month' ? 'all' : selectedMonth} 
                            onChange={e => setSelectedMonth(e.target.value)} 
                            style={{ 
                                padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', 
                                fontSize: '14px', fontWeight: '600', 
                                cursor: viewMode === 'month' ? 'not-allowed' : 'pointer',
                                opacity: viewMode === 'month' ? 0.6 : 1
                            }}
                        >
                            <option value="all">Toute l'année</option>
                            {monthsList.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                    </div>
                </div>

                <div className={isExporting ? 'chart-exporting' : 'chart-normal'} style={{ background: '#f8fafc', borderRadius: '20px', padding: '25px', border: '1px solid #edf2f7' }}>
                    <ResponsiveContainer width="100%" height={400}>
                        {viewMode === 'month' ? (
                            <BarChart data={chartData}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tickFormatter={(t) => new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short' })} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#3182ce" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={!isExporting}>
                                    <LabelList dataKey="value" position="top" className="bar-label" style={{ fill: '#000', fontSize: 12, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                </Bar>
                            </BarChart>
                        ) : (
                            <BarChart data={chartData} layout={viewMode === 'pole' ? 'vertical' : 'horizontal'}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={viewMode !== 'pole'} vertical={viewMode === 'pole'} />
                                {viewMode === 'pole' ? (
                                    <><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} />
                                    <Bar dataKey="value" fill="#4fd1c5" radius={[0, 6, 6, 0]} barSize={25} isAnimationActive={!isExporting}>
                                        <LabelList dataKey="value" position="right" className="bar-label" style={{ fill: '#000', fontSize: 11, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                    </Bar></>
                                ) : (
                                    <><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} />
                                    <Bar dataKey="value" fill="#63b3ed" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={!isExporting}>
                                        <LabelList dataKey="value" position="top" className="bar-label" style={{ fill: '#000', fontSize: 12, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                                    </Bar></>
                                )}
                                <Tooltip cursor={{ fill: 'rgba(49,130,206,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </div>
    );
};

export default function ChartBeneficiaires({ frequentations: propFrequentations }) {
    const [frequentations, setFrequentations] = useState(propFrequentations || []);
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState('month');
    const [selectedMonth, setSelectedMonth] = useState('all');

    useEffect(() => {
        if (!propFrequentations) {
            api.get("/frequentations/process").then(r => setFrequentations(r.data || []));
        } else {
            setFrequentations(propFrequentations);
        }
    }, [propFrequentations]);

    const monthlyData = useMemo(() => {
        const now = new Date();
        const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const startMonth = `${startYear}-09`;
        
        const months = {};
        frequentations.forEach(f => {
            if (!f.date) return;
            const m = f.date.substring(0, 7);
            if (m >= startMonth) {
                months[m] = (months[m] || 0) + Number(f.nb_participants || 0);
            }
        });
        return Object.entries(months).sort().slice(-3).map(([name, value]) => ({ 
            name: new Date(name + "-01").toLocaleDateString('fr-FR', { month: 'short' }), 
            value 
        }));
    }, [frequentations]);

    return (
        <>
            <ChartContainer title="Bénéficiaires (Fréquentation)" onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3182ce" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={!isExporting}>
                                <LabelList dataKey="value" position="top" className="bar-label" style={{ fill: '#000', fontSize: 11, fontWeight: 'bold', visibility: isExporting ? 'visible' : 'hidden' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartContainer>

            {open && (
                <BeneficiaireModal 
                    onClose={() => setOpen(false)}
                    frequentations={frequentations}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                />
            )}
            <style>{`
                .chart-normal .bar-label { visibility: hidden; pointer-events: none; }
                .chart-exporting .bar-label { visibility: visible !important; }
            `}</style>
        </>
    );
}
