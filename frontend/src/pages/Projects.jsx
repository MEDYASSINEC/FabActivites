import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from 'react-router';
import ExcelTable from "../components/ExcelTable";
import axios from 'axios';
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableError from "../components/TableError";
import Toast from "../components/Toast";
import { POLES } from '../constants/poles';
import { useDirtyTracker } from '../context/DirtyTrackerContext';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

function Projects() {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [projectFormData, setProjectFormData] = useState({});

    const { setDirty } = useDirtyTracker();
    const { showLeaveModal, confirmLeave, cancelLeave } = useNavigationGuard('projets');
    useBeforeUnload('projets');

    const STATUTS = ['En cours', 'Terminé', 'Suspendu', 'Abandonné'];
    const SOURCES = ['Interne', 'Externe', 'Etudiant', 'Partenariat'];

    const COLUMNS = [
        { key: "intitule_projet", label: "Intitulé projet" },
        { key: "source_du_projet", label: "Source" },
        { key: "pole", label: "Pôle", type: 'datalist', options: POLES },
        { key: "filiere", label: "Filière" },
        { key: "groupe", label: "Groupe" },
        { key: "responsable_projet", label: "Responsable" },
        { key: "statut", label: "Statut", type: 'datalist', options: STATUTS },
        { key: "etape", label: "Étape" },
        { key: "participants", label: "Participants" },
        { key: "dt_debut", label: "Début", type: 'date' },
        { key: "dt_fn_prevu", label: "Fin prévue", type: 'date' },
        { key: "dt_suspension", label: "Suspension", type: 'date' },
        { key: "dt_abandon", label: "Abandon", type: 'date' },
        { key: "dt_fn_reel", label: "Fin réelle", type: 'date' },
        { key: "remarques", label: "Remarque" },
    ];

    const PROJECT_FIELDS = [
        { key: "intitule_projet", label: "Intitulé projet", required: true },
        { 
            key: "source_du_projet", label: "Source", required: true, type: 'select', 
            options: [{ label: "--- Autre ---", value: "autre" }, ...SOURCES.map(s => ({ value: s, label: s }))]
        },
        ...(projectFormData.source_du_projet === 'autre' ? [{ key: "custom_source", label: "Précisez la source", required: true }] : []),
        { key: "pole", label: "Pôle", required: true, type: 'datalist', options: POLES },
        { key: "filiere", label: "Filière", required: true },
        { key: "groupe", label: "Groupe", required: true },
        { key: "responsable_projet", label: "Responsable", required: true },
        { 
            key: "statut", label: "Statut", required: true, type: 'select', 
            options: [{ label: "--- Autre ---", value: "autre" }, ...STATUTS.map(s => ({ value: s, label: s }))]
        },
        ...(projectFormData.statut === 'autre' ? [{ key: "custom_statut", label: "Précisez le statut", required: true }] : []),
        { key: "etape", label: "Étape", required: true },
        { key: "participants", label: "Participants", required: true, type: 'list' },
        { key: "dt_debut", label: "Date début", required: true, type: 'date' },
        { key: "dt_fn_prevu", label: "Date fin prévue", type: 'date' },
        { key: "dt_suspension", label: "Date suspension", type: 'date' },
        { key: "dt_abandon", label: "Date abandon", type: 'date' },
        { key: "dt_fn_reel", label: "Date fin réelle", type: 'date' },
        { key: "remarques", label: "Remarque", required: false, type: 'textarea' },
    ];

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await api.get("/projects");
                setProjects(Array.isArray(res.data) ? res.data : res.data.data || []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Erreur de chargement");
            } finally { setLoading(false); }
        };
        fetchProjects();
    }, []);

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    };

    const onSave = async (modifiedRows) => {
        try {
            const results = await Promise.all(
                modifiedRows.map(row => {
                    const cleaned = {
                        ...row,
                        responsable_projet: typeof row.responsable_projet === 'object' && row.responsable_projet !== null
                            ? (row.responsable_projet.value || row.responsable_projet.label || '')
                            : (row.responsable_projet ?? '')
                    };
                    return api.put(`/projects/${row.id}`, cleaned);
                })
            );

            setProjects(prev => {
                const next = [...prev];
                results.forEach(res => {
                    const updated = res.data.project;
                    const idx = next.findIndex(p => p.id === updated.id);
                    if (idx !== -1) next[idx] = updated;
                });
                return next;
            });

            showToast(`✓ Sauvegardé`);
            setDirty('projets', false);
        } catch (err) { showToast(`❌ Erreur sauvegarde`); }
    };

    const handleAddSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                source_du_projet: data.source_du_projet === 'autre' ? data.custom_source : data.source_du_projet,
                statut: data.statut === 'autre' ? data.custom_statut : data.statut,
            };
            const res = await api.post("/projects", payload);
            setProjects(prev => [res.data.project, ...prev]);
            showToast("✓ Projet ajouté");
            setDirty('projets', false);
            setIsModalOpen(false);
        } catch (err) { showToast(`❌ Erreur ajout`); }
    };

    const onDelete = async (ids) => {
        try {
            await Promise.all(ids.map(id => api.delete(`/projects/${id}`)));
            setProjects(prev => prev.filter(p => !ids.includes(p.id)));
            showToast(`✓ Supprimé`);
            setDirty('projets', false);
        } catch (err) { showToast(`❌ Erreur suppression`); }
    };

    const initialFilters = useMemo(() => {
        const statutFilter = searchParams.get('statut');
        return statutFilter ? { statut: [statutFilter] } : null;
    }, [searchParams]);

    if (loading) return <TableSkeleton columns={COLUMNS.length} rows={8} />;
    if (error) return <TableError message={error} onRetry={() => window.location.reload()} />;

    return (
        <>
            <ExcelTable
                data={projects}
                columns={COLUMNS.map(c => c.key === "statut" ? { ...c, options: ["--- Autre ---", ...STATUTS] } : c.key === "source_du_projet" ? { ...c, options: ["--- Autre ---", ...SOURCES] } : c)}
                onDelete={onDelete}
                onSave={onSave}
                addRow={() => { setIsModalOpen(true); setProjectFormData({}); }}
                initialFilters={initialFilters}
                onDirtyChange={(dirty) => setDirty('projets', dirty)}
                onDuplicate={true}
            />

            <AddRowModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setProjectFormData({}); setDirty('projets', false); }}
                onSubmit={handleAddSubmit}
                title="Ajouter Projet"
                fields={PROJECT_FIELDS}
                externalFormData={projectFormData}
                setExternalFormData={(u) => {
                    setDirty('projets', true);
                    setProjectFormData(prev => typeof u === 'function' ? u(prev) : u);
                }}
            />
            <ConfirmLeaveModal isOpen={showLeaveModal} onConfirm={confirmLeave} onCancel={cancelLeave} />
            <Toast msg={toast.msg} visible={toast.visible} />
        </>
    )
};

export default Projects;
