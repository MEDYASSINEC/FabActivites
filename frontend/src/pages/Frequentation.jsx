import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from 'react-router';
import { api } from '../api';
import ExcelTable from "../components/ExcelTable";
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableError from "../components/TableError";
import Toast from "../components/Toast";
import { POLES } from '../constants/poles';
import { useDirtyTracker } from '../context/DirtyTrackerContext';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';

function Frequentations() {
    const [frequentations, setFrequentations] = useState([]);
    const [projects, setProjects] = useState([]);
    const [typeActivites, setTypeActivites] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ msg: "", visible: false });

    const { setDirty } = useDirtyTracker();
    const { showLeaveModal, confirmLeave, cancelLeave } = useNavigationGuard('frequentations');
    useBeforeUnload('frequentations');

    const COLUMNS = [
        { key: "date", label: "Date", type: 'date' },
        { key: "type_activite", label: "Type activité", type: 'select', options: ["--- Autre ---", ...typeActivites.map(t => t.name)] },
        { key: "activite_nom", label: "Projet/Activité" },
        { key: "etape", label: "Etape/Séance" },
        { key: "intervenant", label: "Intervenant/Résponsable" },
        { key: "role", label: "Rôle" },
        { key: "activite_pole", label: "Pôle", type: 'datalist', options: POLES },
        { key: "activite_filiere", label: "Filière" },
        { key: "activite_groupe", label: "Groupe" },
        { key: "heur_debut", label: "Heure début", type: 'time' },
        { key: "heur_fin", label: "Heure fin", type: 'time' },
        { key: "participants", label: "Participants" },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [freqRes, projRes, taRes] = await Promise.all([
                    api.get("/frequentations/process"),
                    api.get("/projects"),
                    api.get("/type-activites"),
                ]);
                setFrequentations(freqRes.data);
                setProjects(projRes.data);
                const uniqueTypes = Array.from(new Map((taRes.data || []).map(t => [t.name, t])).values());
                setTypeActivites(uniqueTypes);
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Erreur de chargement");
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    };

    const handleAddSubmit = async (data) => {
        try {
            const projectForActivite = data.activite_nom !== 'autre' ? projects.find(p => p.id == data.activite_nom) : null;
            const payload = {
                type_activite: data.type_activite === 'autre' ? data.custom_type : data.type_activite,
                project_id: data.activite_nom === 'autre' ? null : data.activite_nom,
                etape: data.etape,
                intervenant: data.intervenant,
                role: data.role,
                heur_debut: data.heur_debut,
                heur_fin: data.heur_fin,
                date: data.date,
                activite: {
                    nom: data.activite_nom === 'autre' ? (data.custom_activite_nom || 'Autre Activité') : projectForActivite?.intitule_projet || 'Activité',
                    pole: data.activite_pole || projectForActivite?.pole || '',
                    filiere: data.activite_filiere || projectForActivite?.filiere || '',
                    groupe: data.activite_groupe || projectForActivite?.groupe || '',
                },
                participants: data.participants || [],
            };

            const res = await api.post("/frequentations/process", payload);
            setFrequentations(prev => [res.data.data, ...prev]);
            showToast("✓ Ajouté");
            setIsModalOpen(false);
            setDirty('frequentations', false);
        } catch (err) { showToast(`❌ Erreur`); }
    };

    const onSave = async (modifiedRows) => {
        try {
            const results = await Promise.all(modifiedRows.map(row => {
                const payload = {
                    ...row,
                    project_id: row.project_id || row.projet_id,
                    activite: { nom: row.activite_nom, pole: row.activite_pole, filiere: row.activite_filiere, groupe: row.activite_groupe },
                    participants: row.participants || [],
                };
                return row._is_new ? api.post("/frequentations/process", payload) : api.put(`/frequentations/process/${row.id}`, payload);
            }));

            setFrequentations(prev => {
                let next = [...prev];
                results.forEach(res => {
                    const updated = res.data.data;
                    const idx = next.findIndex(f => f.id === updated.id);
                    if (idx !== -1) next[idx] = updated;
                    else next = [updated, ...next];
                });
                return next;
            });

            showToast(`✓ Sauvegardé`);
            setDirty('frequentations', false);
        } catch (err) { showToast(`❌ Erreur`); }
    };

    const onDelete = async (ids) => {
        try {
            await Promise.all(ids.map(id => api.delete(`/frequentations/process/${id}`)));
            setFrequentations(prev => prev.filter(f => !ids.includes(f.id)));
            showToast(`✓ Supprimé`);
            setDirty('frequentations', false);
        } catch (err) { showToast(`❌ Erreur`); }
    };

    const handleFinishSession = async (session) => {
        const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
        try {
            const res = await api.put(`/frequentations/process/${session.id}`, {
                ...session, heur_fin: timeStr,
                activite: { nom: session.activite_nom, pole: session.activite_pole, filiere: session.activite_filiere, groupe: session.activite_groupe }
            });
            setFrequentations(prev => prev.map(f => f.id === res.data.data.id ? res.data.data : f));
            showToast("✓ Session terminée");
        } catch (err) { showToast(`❌ Erreur`); }
    };

    const isProjectSelected = formData.activite_nom && formData.activite_nom !== 'autre' && !isNaN(formData.activite_nom);
    const FREQUENTATION_FIELDS = [
        { key: "date", label: "Date", type: 'date' },
        { 
            key: "type_activite", label: "Type activité", type: 'select', 
            options: [{ label: "--- Autre ---", value: "autre" }, ...typeActivites.map(t => ({ value: t.name, label: t.name }))] 
        },
        ...(formData.type_activite === 'autre' ? [{ key: "custom_type", label: "Précisez le type", required: true }] : []),
        { 
            key: "activite_nom", label: "Projet / Activité", type: 'select', 
            options: [{ label: '--- Autre ---', value: 'autre' }, ...projects.map(p => ({ label: p.intitule_projet, value: p.id }))] 
        },
        ...(formData.activite_nom === 'autre' ? [{ key: "custom_activite_nom", label: "Nom activité", required: true }] : []),
        { key: "activite_pole", label: "Pôle", type: 'datalist', options: POLES, disabled: isProjectSelected },
        { key: "activite_filiere", label: "Filière", disabled: isProjectSelected },
        { key: "activite_groupe", label: "Groupe", disabled: isProjectSelected },
        { key: "etape", label: "Etape/Séance" },
        { key: "intervenant", label: "Intervenant" },
        { key: "role", label: "Rôle" },
        { key: "heur_debut", label: "Heure début", type: 'time' },
        { key: "heur_fin", label: "Heure fin", type: 'time' },
        { 
            key: "participants", 
            label: "Participants", 
            type: isProjectSelected ? 'checkboxes' : 'list',
            options: isProjectSelected ? (projects.find(p => p.id == formData.activite_nom)?.participants || []) : undefined
        },
    ];

    useEffect(() => {
        if (isModalOpen) {
            const now = new Date();
            setFormData({ date: now.toISOString().split('T')[0], heur_debut: now.toTimeString().split(' ')[0].substring(0, 5), type_activite: 'Formation', activite_nom: '' });
        }
    }, [isModalOpen]);

    useEffect(() => {
        if (formData.activite_nom && formData.activite_nom !== 'autre') {
            const p = projects.find(x => x.id == formData.activite_nom);
            if (p) setFormData(prev => ({ ...prev, activite_pole: p.pole || '', activite_filiere: p.filiere || '', activite_groupe: p.groupe || '' }));
        }
    }, [formData.activite_nom, projects]);

    const activeSessions = useMemo(() => frequentations.filter(f => !f.heur_fin), [frequentations]);
    const [isExpanded, setIsExpanded] = useState(false);

    if (loading) return <TableSkeleton columns={12} rows={8} />;
    if (error) return <TableError message={error} onRetry={() => window.location.reload()} />;

    return (
        <>
            {activeSessions.length > 0 && (
                <div style={{ margin: '20px', background: '#fff9f0', border: '1px solid #ffd8a8', borderRadius: '12px', overflow: 'hidden', position: 'fixed', bottom: '20px', right: '20px', zIndex: '1000', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
                    <div onClick={() => setIsExpanded(!isExpanded)} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff5e6' }}>
                        <h3 style={{ margin: 0, color: '#d9480f', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff922b', animation: 'pulse 1.5s infinite' }}></span>
                            Sessions Actives ({activeSessions.length})
                        </h3>
                        <span style={{ fontSize: '12px', color: '#d9480f' }}>{isExpanded ? '▼' : '▲'}</span>
                    </div>
                    {isExpanded && (
                        <div style={{ padding: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                            {activeSessions.map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #ffe8cc' }}>
                                    <div style={{ fontSize: '13px' }}>
                                        <div style={{ fontWeight: '600' }}>{s.activite_nom}</div>
                                        <div style={{ color: '#666' }}>{s.heur_debut}</div>
                                    </div>
                                    <button onClick={() => handleFinishSession(s)} style={{ padding: '4px 10px', fontSize: '11px', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Finir</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ExcelTable
                data={frequentations}
                columns={COLUMNS}
                onDelete={onDelete}
                onSave={onSave}
                addRow={() => setIsModalOpen(true)}
                getRowClassName={(row) => !row.heur_fin ? 'row-orange-light' : ''}
                onDirtyChange={(dirty) => setDirty('frequentations', dirty)}
                onDuplicate={true}
            />

            <AddRowModal
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddSubmit} title="Ajouter Fréquentation"
                fields={FREQUENTATION_FIELDS} externalFormData={formData}
                setExternalFormData={(u) => setFormData(p => typeof u === 'function' ? u(p) : u)}
            />
            <ConfirmLeaveModal isOpen={showLeaveModal} onConfirm={confirmLeave} onCancel={cancelLeave} />
            <Toast msg={toast.msg} visible={toast.visible} />
            <style>{`
                @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.7; } }
                .row-orange-light { background-color: #fff9f0 !important; }
            `}</style>
        </>
    );
}

export default Frequentations;
