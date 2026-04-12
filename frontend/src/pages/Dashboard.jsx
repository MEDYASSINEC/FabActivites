import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from 'react-router';
import axios from 'axios';
import domtoimage from 'dom-to-image-more';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#e53e3e', '#d69e2e', '#38b2ac', '#805ad5', '#ed64a6'];

const STATUS_COLORS = {
    'Terminé': '#0088FE',
    'En cours': '#FF8042',
    'Abandonné': '#8884d8',
    'Suspendu': '#FFBB28',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getDefaultBilanMonth = () => {
    const now = new Date();
    if (now.getDate() > 15) {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
};

const getDefaultComment = (statut, data) => {
    switch (statut) {
        case 'Terminé': return 'Projets finalisés avec succès.';
        case 'En cours': return `${data.count} projet(s) en cours d'exécution.`;
        case 'Abandonné': return 'Abandon pour différentes raisons : difficultés techniques, indisponibilité ou manque d\'engagement.';
        case 'Suspendu': return 'Suspension liée au non-engagement des porteurs de projets.';
        default: return '';
    }
};

const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
        from: monday.toISOString().split('T')[0],
        to: sunday.toISOString().split('T')[0],
    };
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useStatsCalculations = (projects, frequentations) => {
    // Stats projets par statut
    const projectStatusData = useMemo(() => {
        const stats = {};
        projects.forEach(p => {
            stats[p.statut] = (stats[p.statut] || 0) + 1;
        });
        return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }, [projects]);

    // Fréquentation mensuelle (année de formation: sept → août)
    const monthlyDataFull = useMemo(() => {
        const now = new Date();
        const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const startMonth = `${startYear}-09`;
        const endMonth = `${startYear + 1}-08`;

        const months = {};
        frequentations.forEach(f => {
            if (!f.date) return;
            const month = f.date.substring(0, 7);
            if (month >= startMonth && month <= endMonth) {
                months[month] = (months[month] || 0) + (f.nb_participants || 0);
            }
        });
        return Object.entries(months).sort().map(([name, value]) => ({ name, value }));
    }, [frequentations]);

    const monthlyDataReduced = useMemo(() => monthlyDataFull.slice(-3), [monthlyDataFull]);

    // Stats par pôle
    const poleDataFull = useMemo(() => {
        const poles = {};
        frequentations.forEach(f => {
            const p = f.activite_pole || "Autre";
            poles[p] = (poles[p] || 0) + 1;
        });
        return Object.entries(poles).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    }, [frequentations]);

    const poleDataReduced = useMemo(() => poleDataFull.slice(0, 4), [poleDataFull]);

    // Stats par pôle -> filière
    const poleFiliereGrouped = useMemo(() => {
        const grouped = {};
        frequentations.forEach(f => {
            const pole = f.activite_pole || "Autre";
            const filiere = f.activite_filiere || "Non définie";
            if (!grouped[pole]) grouped[pole] = {};
            grouped[pole][filiere] = (grouped[pole][filiere] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([pole, filieres]) => ({
                pole,
                total: Object.values(filieres).reduce((a, b) => a + b, 0),
                filieres: Object.entries(filieres)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, value]) => ({ name, value }))
            }))
            .sort((a, b) => b.total - a.total);
    }, [frequentations]);

    // Participants de la semaine
    const weeklyParticipantsCount = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return frequentations
            .filter(f => {
                if (!f.date) return false;
                const d = new Date(f.date);
                return d >= monday && d <= sunday;
            })
            .reduce((acc, f) => acc + (f.nb_participants || 0), 0);
    }, [frequentations]);

    const activeSessionsCount = useMemo(
        () => frequentations.filter(f => !f.heur_fin).length,
        [frequentations]
    );

    return {
        projectStatusData,
        monthlyDataFull,
        monthlyDataReduced,
        poleDataFull,
        poleDataReduced,
        poleFiliereGrouped,
        weeklyParticipantsCount,
        activeSessionsCount,
    };
};

const useRepartitionData = (projects) => {
    return useMemo(() => {
        const poles = {};
        projects.forEach(p => {
            const pole = p.pole || 'Autre';
            if (!poles[pole]) poles[pole] = { participants: 0, projets: 0 };
            poles[pole].projets += 1;
            poles[pole].participants += Array.isArray(p.participants) ? p.participants.length : 0;
        });

        const rows = Object.entries(poles)
            .sort((a, b) => b[1].participants - a[1].participants)
            .map(([pole, data]) => ({ pole, ...data }));

        const total = rows.reduce((acc, r) => ({
            participants: acc.participants + r.participants,
            projets: acc.projets + r.projets,
        }), { participants: 0, projets: 0 });

        const barData = rows.map(r => ({ name: r.pole, Participants: r.participants, Projets: r.projets }));

        return { rows, total, barData };
    }, [projects]);
};

const useComparaisonData = (projects, nbMoisComparaison) => {
    return useMemo(() => {
        const now = new Date();
        const currentMonth = now.getDate() > 15
            ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            : (() => { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();

        const months = [];
        const [cy, cm] = currentMonth.split('-').map(Number);
        for (let i = nbMoisComparaison - 1; i >= 0; i--) {
            const d = new Date(cy, cm - 1 - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            months.push({ val, label });
        }

        const getIndicators = (monthVal) => {
            const [y, m] = monthVal.split('-').map(Number);

            const enCours = projects.filter(p => {
                const started = p.dt_debut && new Date(p.dt_debut) <= new Date(y, m - 1, 31);
                const notFinished = !p.dt_fn_reel || new Date(p.dt_fn_reel) >= new Date(y, m - 1, 1);
                return started && notFinished && p.statut === 'En cours';
            }).length;

            const inMonth = (date) => {
                if (!date) return false;
                const d = new Date(date);
                return d.getFullYear() === y && d.getMonth() + 1 === m;
            };

            const nouveaux = projects.filter(p => inMonth(p.dt_debut)).length;
            const realises = projects.filter(p => p.statut === 'Terminé' && inMonth(p.dt_fn_reel)).length;
            const suspendus = projects.filter(p => p.statut === 'Suspendu' && inMonth(p.dt_fn_reel)).length;
            const abandonnes = projects.filter(p => p.statut === 'Abandonné' && inMonth(p.dt_fn_reel)).length;

            const participantsActifs = projects
                .filter(p => {
                    const started = p.dt_debut && new Date(p.dt_debut) <= new Date(y, m - 1, 31);
                    const notFinished = !p.dt_fn_reel || new Date(p.dt_fn_reel) >= new Date(y, m - 1, 1);
                    return started && notFinished && p.statut === 'En cours';
                })
                .reduce((acc, p) => acc + (Array.isArray(p.participants) ? p.participants.length : 0), 0);
            const poles = {};

            projects.filter(p => {
                const started = p.dt_debut && new Date(p.dt_debut) <= new Date(y, m - 1, 31);
                const notFinished = !p.dt_fn_reel || new Date(p.dt_fn_reel) >= new Date(y, m - 1, 1);
                return started && notFinished && p.statut === 'En cours';
            }).forEach(p => {
                if (p.pole) poles[p.pole] = (poles[p.pole] || 0) + 1;
            });
            const poleDominant = Object.entries(poles).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

            return { nouveaux, enCours, realises, suspendus, abandonnes, participantsActifs, poleDominant };
        };

        const monthsData = months.map(m => ({ ...m, indicators: getIndicators(m.val) }));

        const last = monthsData[monthsData.length - 1];
        const prev = monthsData[monthsData.length - 2];

        const evolution = (key) => {
            if (!prev) return null;
            const diff = last.indicators[key] - prev.indicators[key];
            return diff;
        };

        const barData = monthsData.map(m => ({
            name: m.label,
            'Nouveaux': m.indicators.nouveaux,
            'En cours': m.indicators.enCours,
            'Terminés': m.indicators.realises,
        }));

        const INDICATORS = [
            { key: 'nouveaux', label: 'Nouveaux projets' },
            { key: 'enCours', label: 'Projets actifs (En cours)' },
            { key: 'realises', label: 'Projets réalisés' },
            { key: 'suspendus', label: 'Projets suspendus' },
            { key: 'abandonnes', label: 'Projets abandonnés' },
            { key: 'participantsActifs', label: 'Participants (actifs)' },
            { key: 'poleDominant', label: 'Pôle dominant' },
        ];

        return { monthsData, barData, last, prev, evolution, INDICATORS };
    }, [projects, nbMoisComparaison]);
};

const useBilanData = (projects, bilanMonth, bilanComments) => {
    return useMemo(() => {
        const [year, month] = bilanMonth.split('-').map(Number);

        const projectsInMonth = projects.filter(p => {
            if (!p.dt_fn_reel && p.statut === 'En cours') return true;
            if (!p.dt_fn_reel) return false;
            const refDate = new Date(p.dt_fn_reel);
            return refDate.getFullYear() === year && refDate.getMonth() + 1 === month;
        });

        const getStatut = (p) => {
            if (!p.dt_fn_reel && p.statut === 'En cours') return 'En cours';
            return p.statut;
        };

        const stats = {};
        projectsInMonth.forEach(p => {
            const s = getStatut(p);
            if (!stats[s]) stats[s] = { count: 0, participants: 0, projects: [] };
            stats[s].count += 1;
            stats[s].participants += Array.isArray(p.participants) ? p.participants.length : 0;
            stats[s].projects.push(p);
        });

        const rows = Object.entries(stats).map(([statut, data]) => ({
            statut,
            count: data.count,
            participants: data.participants,
            projects: data.projects,
            comment: bilanComments[`${bilanMonth}-${statut}`] || getDefaultComment(statut, data),
        }));

        const total = rows.reduce((acc, r) => ({ count: acc.count + r.count, participants: acc.participants + r.participants }), { count: 0, participants: 0 });
        const pieData = rows.map(r => ({ name: r.statut, value: r.count }));

        return { rows, total, pieData };
    }, [projects, bilanMonth, bilanComments]);
};


const availableMonths = (() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            val: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        });
    }
    return months;
})();

// ============================================================================
// COMPONENTS
// ============================================================================

// KPI Card Component
const Card = ({ title, value, color, icon, subtitle, isPulse, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0,0,0,0.12)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
        >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '60px', opacity: 0.05 }}>{icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span style={{ color: '#718096', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a202c' }}>
                {value}
                {isPulse && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: color, margin: '0 10px', animation: 'pulse 1.5s infinite' }}></span>}
            </div>
            {subtitle && <div style={{ color: '#a0aec0', fontSize: '12px', marginTop: '4px' }}>{subtitle}</div>}
        </div>
    );
};

// Chart Container Component
const ChartContainer = ({ title, children, onExpand }) => {
    const cardRef = useRef(null);

    const exportImage = async () => {
        if (!cardRef.current) return;

        const el = cardRef.current;
        const ignored = el.querySelectorAll('[data-html2canvas-ignore]');
        ignored.forEach(b => b.style.visibility = 'hidden');

        await new Promise(r => setTimeout(r, 50));

        try {
            const dataUrl = await domtoimage.toPng(el, {
                bgcolor: '#ffffff',
                scale: 2,
                width: el.offsetWidth,
                height: el.offsetHeight,
                style: {
                    margin: '0',
                    position: 'relative',
                    top: '0',
                    left: '0',
                    transform: 'none',
                },
            });

            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = dataUrl;
            link.click();
        } finally {
            ignored.forEach(b => b.style.visibility = '');
        }
    };

    return (
        <div
            ref={cardRef}
            style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.05)',
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
            }}>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px', fontWeight: '700' }}>
                    {title}
                </h3>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={exportImage}
                        data-html2canvas-ignore="true"
                        title="Exporter en image PNG"
                        style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#718096',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#edf2f7';
                            e.currentTarget.style.color = '#2d3748';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#718096';
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        PNG
                    </button>

                    {onExpand && (
                        <button
                            onClick={onExpand}
                            title="Voir plus de détails"
                            data-html2canvas-ignore="true"
                            style={{
                                background: 'none',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#718096',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#edf2f7';
                                e.currentTarget.style.color = '#2d3748';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = '#718096';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 3 21 3 21 9" />
                                <polyline points="9 21 3 21 3 15" />
                                <line x1="21" y1="3" x2="14" y2="10" />
                                <line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                            Détails
                        </button>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};

// Expand Modal Component
const ExpandModal = ({ title, onClose, children }) => {
    const contentRef = useRef(null);

    const exportImage = async () => {
        if (!contentRef.current) return;

        const el = contentRef.current;

        const prevOverflowY = el.style.overflowY;
        const prevOverflowX = el.style.overflowX;
        const prevMaxHeight = el.style.maxHeight;
        const prevTransform = el.style.transform;
        const prevWidth = el.style.width;
        const prevMaxWidth = el.style.maxWidth;

        el.style.overflowY = 'visible';
        el.style.overflowX = 'visible';
        el.style.maxHeight = 'none';
        el.style.transform = 'none';
        el.style.width = 'max-content';
        el.style.maxWidth = 'none';

        const ignored = el.querySelectorAll('[data-html2canvas-ignore]');
        ignored.forEach(b => b.style.visibility = 'hidden');

        await new Promise(r => setTimeout(r, 80));

        try {
            const dataUrl = await domtoimage.toPng(el, {
                bgcolor: '#ffffff',
                scale: 2,
                width: el.scrollWidth,
                height: el.scrollHeight,
                style: {
                    margin: '0',
                    position: 'relative',
                    top: '0',
                    left: '0',
                    transform: 'none',
                    overflowX: 'visible',
                    overflowY: 'visible',
                    width: el.scrollWidth + 'px',
                },
            });

            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = dataUrl;
            link.click();
        } finally {
            el.style.overflowY = prevOverflowY;
            el.style.overflowX = prevOverflowX;
            el.style.maxHeight = prevMaxHeight;
            el.style.transform = prevTransform;
            el.style.width = prevWidth;
            el.style.maxWidth = prevMaxWidth;
            ignored.forEach(b => b.style.visibility = '');
        }
    };

    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                padding: '20px',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.2s ease',
                overflowY: 'auto',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                ref={contentRef}
                style={{
                    background: '#fff',
                    borderRadius: '24px',
                    margin: 'auto',
                    padding: '32px',
                    width: '90vw',
                    maxWidth: '900px',
                    height: 'fit-content',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    animation: 'slideUp 0.25s ease'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, color: '#1a365d', fontSize: '22px', fontWeight: '700' }}>{title}</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button data-html2canvas-ignore="true" onClick={exportImage} title="Exporter en PNG"
                            style={{
                                background: 'none',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#718096',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            PNG
                        </button>
                        <button
                            data-html2canvas-ignore="true"
                            onClick={onClose}
                            style={{
                                background: '#f7fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                width: '36px',
                                height: '36px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: '#718096',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#edf2f7'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f7fafc'; }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
                {children}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

const CartGrid = ({ vertical, horizontal, strokeDasharray }) => {
    return <CartesianGrid vertical={vertical} horizontal={horizontal} strokeDasharray={strokeDasharray} stroke="#edf2f7" />;
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

function Dashboard() {
    const navigate = useNavigate();

    // State
    const [expandedModal, setExpandedModal] = useState(null);
    const [poleViewMode, setPoleViewMode] = useState('pole');
    const [bilanModal, setBilanModal] = useState(false);
    const [bilanView, setBilanView] = useState('chart');
    const [bilanComments, setBilanComments] = useState({});
    const [editingComment, setEditingComment] = useState(null);
    const [comparaisonModal, setComparaisonModal] = useState(false);
    const [nbMoisComparaison, setNbMoisComparaison] = useState(2);
    const [repartitionModal, setRepartitionModal] = useState(false);
    const [bilanMonth, setBilanMonth] = useState(getDefaultBilanMonth);

    // Data fetching
    const [projects, setProjects] = useState([]);
    const [frequentations, setFrequentations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, frequentationsRes] = await Promise.all([
                    api.get("/projects"),
                    api.get("/frequentations/process")
                ]);
                setProjects(projectsRes.data);
                setFrequentations(frequentationsRes.data);
            } catch (err) {
                console.error("Erreur lors du chargement des stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Reset view mode when modal closes
    useEffect(() => {
        if (!expandedModal) setPoleViewMode('pole');
    }, [expandedModal]);

    // Data calculations
    const stats = useStatsCalculations(projects, frequentations);
    const repartitionData = useRepartitionData(projects);
    const comparaisonData = useComparaisonData(projects, nbMoisComparaison);
    const bilanData = useBilanData(projects, bilanMonth, bilanComments);


    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement du Dashboard...</div>;

    return (
        <div style={{ padding: '30px', background: '#f0f4f8', height: '100%', fontFamily: 'Inter, system-ui, sans-serif', overflowY: 'auto', overflowX: 'hidden' }}>
            <h1 style={{ marginBottom: '30px', color: '#1a365d', fontSize: '28px', fontWeight: '800' }}>Dashboard Analytique</h1>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <Card title="Total Projets" value={projects.length} color="#3182ce" icon="📁" onClick={() => navigate('/projects')} />
                <Card title="Sessions Actives" value={stats.activeSessionsCount} color="#dd6b20" icon="⚡" isPulse={stats.activeSessionsCount > 0} onClick={() => navigate('/frequentation?filter=active')} />
                <Card title="Fréquentations cette semaine" value={stats.weeklyParticipantsCount} color="#38a169" icon="👥"
                    onClick={() => {
                        const { from, to } = getWeekRange();
                        navigate(`/frequentation?filter=week&from=${from}&to=${to}`);
                    }}
                />
                <Card title="Nombre des projets en cours" value={projects.filter(p => p.statut === 'En cours').length} color="#805ad5" icon="🎓" subtitle="Année 2025/2026" onClick={() => navigate('/projects?statut=En+cours')} />
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginBottom: '100px' }}>

                {/* Evolution Mensuelle */}
                <ChartContainer title="Évolution de la Fréquentation" onExpand={() => setExpandedModal('frequentation')}>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.monthlyDataReduced}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3182ce" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} />
                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#3182ce" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Statut des Projets */}
                <ChartContainer title="Statut des Projets">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.projectStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.projectStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Distribution par Pôle */}
                <ChartContainer title="Fréquentation par Pôle" onExpand={() => setExpandedModal('pole')}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.poleDataReduced} layout="vertical">
                            <CartGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4a5568' }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#4fd1c5" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Bilan des projets */}
                <ChartContainer title={`Bilan des projets — ${availableMonths.find(m => m.val === bilanMonth)?.label}`} onExpand={() => setBilanModal(true)}>
                    {bilanData.pieData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 0' }}>
                            Aucun projet pour ce mois
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={bilanData.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={90}
                                    dataKey="value"
                                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                                    labelLine={false}
                                >
                                    {bilanData.pieData.map((entry) => (
                                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartContainer>

                {/* Comparaison */}
                <ChartContainer
                    title={`Comparaison — ${comparaisonData.prev?.label ?? '—'} vs ${comparaisonData.last?.label ?? '—'}`}
                    onExpand={() => setComparaisonModal(true)}
                >
                    {comparaisonData.barData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 0' }}>Pas de données</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparaisonData.barData} barGap={4}>
                                <CartGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                                <Bar dataKey="Nouveaux" fill="#3182ce" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="En cours" fill="#FF8042" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="Terminés" fill="#00C49F" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartContainer>

                {/* Répartition par pôle */}
                <ChartContainer
                    title="Répartition par pôle"
                    onExpand={() => setRepartitionModal(true)}
                >
                    {repartitionData.barData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 0' }}>Pas de données</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={repartitionData.barData} layout="vertical" barGap={4}>
                                <CartGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
                                <YAxis
                                    dataKey="name" type="category" width={110}
                                    axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: '#4a5568' }}
                                />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                                <Bar dataKey="Participants" fill="#3182ce" radius={[0, 4, 4, 0]} barSize={14} />
                                <Bar dataKey="Projets" fill="#00C49F" radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartContainer>
            </div>

            {/* Modals */}
            {expandedModal === 'frequentation' && (
                <FrequentationModal
                    onClose={() => setExpandedModal(null)}
                    data={stats.monthlyDataFull}
                />
            )}

            <PoleModal
                isOpen={expandedModal === 'pole'}
                onClose={() => setExpandedModal(null)}
                poleViewMode={poleViewMode}
                setPoleViewMode={setPoleViewMode}
                poleDataFull={stats.poleDataFull}
                poleFiliereGrouped={stats.poleFiliereGrouped}
                COLORS={COLORS}
            />

            <BilanModal
                isOpen={bilanModal}
                onClose={() => setBilanModal(false)}
                bilanView={bilanView}
                setBilanView={setBilanView}
                bilanMonth={bilanMonth}
                setBilanMonth={setBilanMonth}
                bilanData={bilanData}
                availableMonths={availableMonths}
                bilanComments={bilanComments}
                setBilanComments={setBilanComments}
                editingComment={editingComment}
                setEditingComment={setEditingComment}
            />

            <ComparaisonModal
                isOpen={comparaisonModal}
                onClose={() => setComparaisonModal(false)}
                comparaisonData={comparaisonData}
                nbMoisComparaison={nbMoisComparaison}
                setNbMoisComparaison={setNbMoisComparaison}
            />

            <RepartitionModal
                isOpen={repartitionModal}
                onClose={() => setRepartitionModal(false)}
                repartitionData={repartitionData}
            />
        </div>
    );
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

const FrequentationModal = ({ onClose, data }) => {

    return (
        <ExpandModal title="Évolution de la Fréquentation — Année complète" onClose={onClose}>
            <ResponsiveContainer width="100%" height={420}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValFull" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3182ce" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#3182ce" strokeWidth={3} fillOpacity={1} fill="url(#colorValFull)" />
                </AreaChart>
            </ResponsiveContainer>
        </ExpandModal>
    );
};

const PoleModal = ({ isOpen, onClose, poleViewMode, setPoleViewMode, poleDataFull, poleFiliereGrouped, COLORS }) => {
    if (!isOpen) return null;

    return (
        <ExpandModal title="Fréquentation par Pôle — Vue complète" onClose={onClose}>
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                <button
                    onClick={() => setPoleViewMode('pole')}
                    style={{
                        padding: '10px 24px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                        background: poleViewMode === 'pole' ? '#3182ce' : '#fff',
                        color: poleViewMode === 'pole' ? '#fff' : '#4a5568',
                    }}
                >
                    Par Pôle
                </button>
                <button
                    onClick={() => setPoleViewMode('filiere')}
                    style={{
                        padding: '10px 24px',
                        border: 'none',
                        borderLeft: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                        background: poleViewMode === 'filiere' ? '#3182ce' : '#fff',
                        color: poleViewMode === 'filiere' ? '#fff' : '#4a5568',
                    }}
                >
                    Par Filière
                </button>
            </div>

            {poleViewMode === 'pole' ? (
                <ResponsiveContainer width="100%" height={Math.max(420, poleDataFull.length * 40)}>
                    <BarChart data={poleDataFull} layout="vertical">
                        <CartGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} />
                        <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4a5568' }} />
                        <Tooltip cursor={{ fill: 'rgba(49,130,206,0.05)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#4fd1c5" radius={[0, 6, 6, 0]} barSize={22} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {poleFiliereGrouped.map((group, gi) => {
                        const maxVal = Math.max(...group.filieres.map(f => f.value));
                        return (
                            <div key={group.pole} style={{ background: '#f7fafc', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>{group.pole}</span>
                                    <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600', background: '#edf2f7', borderRadius: '8px', padding: '3px 10px' }}>{group.total} total</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {group.filieres.map((fil, fi) => (
                                        <div key={fil.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ width: '140px', fontSize: '12px', color: '#4a5568', fontWeight: '500', textAlign: 'right', flexShrink: 0 }}>{fil.name}</span>
                                            <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '6px', height: '22px', overflow: 'hidden', paddingRight: '8px' }}>
                                                <div style={{
                                                    width: `${(fil.value / maxVal) * 100}%`,
                                                    height: '100%',
                                                    background: COLORS[gi % COLORS.length],
                                                    borderRadius: '6px',
                                                    transition: 'width 0.4s ease',
                                                    minWidth: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    paddingRight: '8px',
                                                }}>
                                                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: '700' }}>{fil.value}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </ExpandModal>
    );
};

const BilanModal = ({
    isOpen, onClose, bilanView, setBilanView, bilanMonth, setBilanMonth,
    bilanData, availableMonths, bilanComments, setBilanComments,
    editingComment, setEditingComment
}) => {
    if (!isOpen) return null;

    return (
        <ExpandModal title="Bilan global des projets" onClose={onClose}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                    <button
                        onClick={() => setBilanView('chart')}
                        style={{
                            padding: '10px 24px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
                            background: bilanView === 'chart' ? '#3182ce' : '#fff',
                            color: bilanView === 'chart' ? '#fff' : '#4a5568',
                        }}
                    >
                        Graphique
                    </button>
                    <button
                        onClick={() => setBilanView('table')}
                        style={{
                            padding: '10px 24px', border: 'none', borderLeft: '1px solid #e2e8f0',
                            cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
                            background: bilanView === 'table' ? '#3182ce' : '#fff',
                            color: bilanView === 'table' ? '#fff' : '#4a5568',
                        }}
                    >
                        Tableau
                    </button>
                </div>

                <select
                    value={bilanMonth}
                    onChange={e => setBilanMonth(e.target.value)}
                    style={{
                        padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                        fontSize: '13px', color: '#2d3748', background: '#fff',
                        cursor: 'pointer', fontWeight: '500', outline: 'none',
                    }}
                >
                    {availableMonths.map(m => (
                        <option key={m.val} value={m.val}>{m.label}</option>
                    ))}
                </select>
            </div>

            {bilanData.pieData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a0aec0', padding: '80px 0', fontSize: '15px' }}>
                    Aucun projet pour ce mois
                </div>
            ) : bilanView === 'chart' ? (
                <ResponsiveContainer width="100%" height={420}>
                    <PieChart>
                        <Pie
                            data={bilanData.pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                        >
                            {bilanData.pieData.map((entry) => (
                                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr>
                            {['Statut', 'Nombre de projets', 'Total participants', 'Commentaires'].map((h, i) => (
                                <th key={i} style={{
                                    background: '#2b6cb0', color: '#fff', padding: '12px 16px',
                                    textAlign: i === 0 ? 'left' : 'center', fontWeight: '600',
                                    border: '1px solid #2c5282',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bilanData.rows.map((row, ri) => (
                            <tr key={row.statut} style={{ background: ri % 2 === 0 ? '#fff' : '#ebf4ff' }}>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', fontWeight: '500' }}>
                                    <span style={{
                                        display: 'inline-block', width: '10px', height: '10px',
                                        borderRadius: '50%', background: STATUS_COLORS[row.statut] || '#ccc',
                                        marginRight: '8px'
                                    }} />
                                    {row.statut}
                                </td>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>
                                    {row.count}
                                </td>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>
                                    {row.participants}
                                </td>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', minWidth: '200px' }}>
                                    {editingComment === `${bilanMonth}-${row.statut}` ? (
                                        <input
                                            autoFocus
                                            defaultValue={row.comment}
                                            onBlur={e => {
                                                setBilanComments(prev => ({
                                                    ...prev,
                                                    [`${bilanMonth}-${row.statut}`]: e.target.value
                                                }));
                                                setEditingComment(null);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') e.target.blur();
                                                if (e.key === 'Escape') setEditingComment(null);
                                            }}
                                            style={{
                                                width: '100%', border: '1.5px solid #3182ce',
                                                borderRadius: '6px', padding: '4px 8px',
                                                fontSize: '13px', outline: 'none',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                    ) : (
                                        <span
                                            onClick={() => setEditingComment(`${bilanMonth}-${row.statut}`)}
                                            title="Cliquer pour modifier"
                                            style={{
                                                cursor: 'pointer', display: 'block',
                                                padding: '2px 4px', borderRadius: '4px',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#ebf8ff'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {row.comment}
                                            <span style={{ marginLeft: '6px', fontSize: '11px', color: '#a0aec0' }}>✎</span>
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ background: '#2b6cb0' }}>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', border: '1px solid #2c5282' }}>
                                Total
                            </td>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', textAlign: 'center', border: '1px solid #2c5282' }}>
                                {bilanData.total.count}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', textAlign: 'center', border: '1px solid #2c5282' }}>
                                {bilanData.total.participants}
                            </td>
                            <td style={{ border: '1px solid #2c5282' }} />
                        </tr>
                    </tbody>
                </table>
            )}
        </ExpandModal>
    );
};

const ComparaisonModal = ({ isOpen, onClose, comparaisonData, nbMoisComparaison, setNbMoisComparaison }) => {
    if (!isOpen) return null;

    return (
        <ExpandModal title="Bilan comparatif mensuel" onClose={onClose}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: '600' }}>
                    Comparer les
                </span>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    {[2, 3, 4, 5, 6].map(n => (
                        <button
                            key={n}
                            onClick={() => setNbMoisComparaison(n)}
                            style={{
                                padding: '8px 16px', border: 'none',
                                borderLeft: n !== 2 ? '1px solid #e2e8f0' : 'none',
                                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                background: nbMoisComparaison === n ? '#3182ce' : '#fff',
                                color: nbMoisComparaison === n ? '#fff' : '#4a5568',
                                transition: 'all 0.2s',
                            }}
                        >
                            {n}
                        </button>
                    ))}
                </div>
                <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: '600' }}>derniers mois</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#2b6cb0', color: '#fff', padding: '12px 16px', textAlign: 'left', fontWeight: '600', border: '1px solid #2c5282', minWidth: '180px' }}>
                                Indicateur
                            </th>
                            {comparaisonData.monthsData.map((m, i) => (
                                <th key={m.val} style={{
                                    background: i === comparaisonData.monthsData.length - 1 ? '#1a365d' : '#2b6cb0',
                                    color: '#fff', padding: '12px 16px', textAlign: 'center',
                                    fontWeight: '600', border: '1px solid #2c5282',
                                    minWidth: '100px',
                                }}>
                                    {m.label}
                                    {i === comparaisonData.monthsData.length - 1 && (
                                        <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>← dernier</div>
                                    )}
                                </th>
                            ))}
                            <th style={{ background: '#276749', color: '#fff', padding: '12px 16px', textAlign: 'center', fontWeight: '600', border: '1px solid #276749', minWidth: '120px' }}>
                                Évolution
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {comparaisonData.INDICATORS.map((ind, ri) => {
                            const evol = ind.key !== 'poleDominant' ? comparaisonData.evolution(ind.key) : null;
                            return (
                                <tr key={ind.key} style={{ background: ri % 2 === 0 ? '#fff' : '#ebf4ff' }}>
                                    <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#2d3748' }}>
                                        {ind.label}
                                    </td>
                                    {comparaisonData.monthsData.map((m, i) => (
                                        <td key={m.val} style={{
                                            padding: '11px 16px', border: '1px solid #e2e8f0',
                                            textAlign: 'center', fontWeight: '500',
                                            background: i === comparaisonData.monthsData.length - 1
                                                ? (ri % 2 === 0 ? '#edf7ff' : '#dbeafe')
                                                : undefined,
                                        }}>
                                            {m.indicators[ind.key]}
                                        </td>
                                    ))}
                                    <td style={{
                                        padding: '11px 16px', border: '1px solid #e2e8f0',
                                        textAlign: 'center', fontWeight: '700',
                                        color: evol === null ? '#718096' : evol > 0 ? '#276749' : evol < 0 ? '#c53030' : '#718096',
                                    }}>
                                        {evol === null ? '—'
                                            : evol > 0 ? `▲ +${evol}`
                                                : evol < 0 ? `▼ ${evol}`
                                                    : '= 0'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </ExpandModal>
    );
};

const RepartitionModal = ({ isOpen, onClose, repartitionData }) => {
    if (!isOpen) return null;

    return (
        <ExpandModal title="Répartition des participants aux projets par pôle" onClose={onClose}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr>
                            {['Pôle', 'Nombre de participants', 'Nombre de projets'].map((h, i) => (
                                <th key={i} style={{
                                    background: '#2b6cb0', color: '#fff',
                                    padding: '12px 16px',
                                    textAlign: i === 0 ? 'left' : 'center',
                                    fontWeight: '600',
                                    border: '1px solid #2c5282',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {repartitionData.rows.map((row, ri) => (
                            <tr key={row.pole} style={{ background: ri % 2 === 0 ? '#fff' : '#ebf4ff' }}>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#2d3748' }}>
                                    {row.pole}
                                </td>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>
                                    {row.participants}
                                </td>
                                <td style={{ padding: '11px 16px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>
                                    {row.projets}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ background: '#2b6cb0' }}>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', border: '1px solid #2c5282' }}>
                                Total général
                            </td>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', textAlign: 'center', border: '1px solid #2c5282' }}>
                                {repartitionData.total.participants}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', textAlign: 'center', border: '1px solid #2c5282' }}>
                                {repartitionData.total.projets}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </ExpandModal>
    );
};

export default Dashboard;