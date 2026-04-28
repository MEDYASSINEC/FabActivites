import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
    Tooltip, XAxis, YAxis, AreaChart, Area, LabelList
} from 'recharts';
import { api } from './api';
import domtoimage from 'dom-to-image-more';
import MonthPicker from './MonthPicker';

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

const BeneficiaireModal = ({ onClose, from, initialAllMonths }) => {
    const modalRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [viewMode, setViewMode] = useState('month');

    const [selectedMonths, setSelectedMonths] = useState(initialAllMonths || []);
    const [chartData, setChartData] = useState([]);

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
            link.download = `Analyse_Beneficiaires_${viewMode}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error("Export error:", err); }
        finally { setIsExporting(false); }
    };

    useEffect(() => {
        if (selectedMonths.length === 0) {
            setChartData([]);
            return;
        }

        let url = `/dashboard/beneficiaires/mois?from=${from || ''}`;
        if (viewMode === 'pole') url += '&groupBy=pole';
        else if (viewMode === 'type') url += '&groupBy=type';

        selectedMonths.forEach(m => {
            url += `&mois[]=${m}`;
        });

        api.get(url).then(r => {
            let formatted;
            if (viewMode === 'month') {
                formatted = r.data.map(d => ({ name: d.mois, value: Number(d.total) }));
            } else {
                formatted = r.data.map(d => ({ name: d.categorie, value: Number(d.total) }));
            }
            setChartData(formatted);
        }).catch(err => console.error(err));
    }, [viewMode, selectedMonths, from]);

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
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: '800' }}>Analyse des Bénéficiaires</h2>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }} data-html2canvas-ignore="true">
                        <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            {[{ id: 'month', label: 'Par Mois', icon: '📅' }, { id: 'pole', label: 'Par Pôle', icon: '🏢' }, { id: 'type', label: 'Par Type', icon: '⚙️' }].map(btn => (
                                <button key={btn.id} onClick={() => setViewMode(btn.id)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: viewMode === btn.id ? '#3182ce' : '#fff', color: viewMode === btn.id ? '#fff' : '#4a5568', borderRight: btn.id !== 'type' ? '1px solid #e2e8f0' : 'none' }}>
                                    {btn.icon} {btn.label}
                                </button>
                            ))}
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
                        <BarChart data={chartData} layout={viewMode === 'pole' ? 'vertical' : 'horizontal'}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={viewMode !== 'pole'} vertical={viewMode === 'pole'} />
                            {viewMode === 'pole' ? (
                                <><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} />
                                    <Bar dataKey="value" fill="#4fd1c5" radius={[0, 6, 6, 0]} barSize={25} isAnimationActive={!isExporting}>
                                        <LabelList dataKey="value" position="right" className="bar-label" style={{ fill: '#000', fontSize: 11, fontWeight: 'bold' }} />
                                    </Bar></>
                            ) : (
                                <><XAxis dataKey="name" axisLine={false} tickLine={false} tickFormatter={(t) => viewMode === 'month' ? new Date(t + "-01").toLocaleDateString('fr-FR', { month: 'short' }) : t} /><YAxis axisLine={false} tickLine={false} />
                                    <Bar dataKey="value" fill={viewMode === 'month' ? '#3182ce' : '#63b3ed'} radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={!isExporting}>
                                        <LabelList dataKey="value" position="top" className="bar-label" style={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
                                    </Bar></>
                            )}
                            <Tooltip cursor={{ fill: 'rgba(49,130,206,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
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

export default function ChartBeneficiaires({ from }) {
    const [open, setOpen] = useState(false);
    const [allMonthsData, setAllMonthsData] = useState([]);

    useEffect(() => {
        api.get(`/dashboard/beneficiaires/mois?from=${from || ''}`).then(r => {
            setAllMonthsData(r.data || []);
        }).catch(err => console.error(err));
    }, [from]);

    const formationYearStart = useMemo(() => {
        const now = new Date();
        const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}-09`;
    }, []);

    const allMonths = useMemo(() => {
        return allMonthsData.map(d => d.mois).filter(m => m >= formationYearStart).sort();
    }, [allMonthsData, formationYearStart]);

    const monthlyData = useMemo(() => {
        const filtered = allMonthsData.filter(d => d.mois >= formationYearStart).sort((a, b) => a.mois.localeCompare(b.mois));
        return filtered.slice(-3).map(d => ({
            name: new Date(d.mois + "-01").toLocaleDateString('fr-FR', { month: 'short' }),
            value: Number(d.total)
        }));
    }, [allMonthsData, formationYearStart]);

    return (
        <>
            <ChartContainer title="Bénéficiaires" onExpand={() => setOpen(true)}>
                {(isExporting) => (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3182ce" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={!isExporting}>
                                <LabelList dataKey="value" position="top" className="bar-label" style={{ fill: '#000', fontSize: 11, fontWeight: 'bold' }} formatter={(v) => v > 0 ? v : ''} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartContainer>

            {open && (
                <BeneficiaireModal
                    onClose={() => setOpen(false)}
                    from={from}
                    initialAllMonths={allMonths}
                />
            )}
            <style>{`
                .bar-label { pointer-events: none; }
            `}</style>
        </>
    );
}
