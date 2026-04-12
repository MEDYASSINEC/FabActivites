import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from 'react-router';
import ExcelTable from "../components/ExcelTable";
import axios from 'axios';
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableEmpty from "../components/TableEmpty";
import TableError from "../components/TableError";
import Toast from "../components/Toast";
import { POLES } from '../constants/poles';

// instance axios avec baseURL propre
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

    const COLUMNS = [
        { key: "intitule_projet", label: "Intitulé projet" },
        { key: "source_du_projet", label: "Source" },
        { key: "pole", label: "Pôle", type: 'datalist', options: POLES },
        { key: "filiere", label: "Filière" },
        { key: "groupe", label: "Groupe" },
        { key: "responsable_projet", label: "Responsable" },
        { key: "statut", label: "Statut", type: 'datalist', options: ['En cours', 'Terminé', 'Suspendu', 'Abandonné'] },
        { key: "etape", label: "Étape" },
        { key: "participants", label: "Participants" },
        { key: "dt_debut", label: "Début", type: 'date' },
        { key: "dt_fn_prevu", label: "Fin prévue", type: 'date' },
        { key: "dt_fn_reel", label: "Fin réelle", type: 'date' },
    ];

    const PROJECT_FIELDS = [
        { key: "intitule_projet", label: "Intitulé projet", required: true },
        { key: "source_du_projet", label: "Source", required: true },
        { key: "pole", label: "Pôle", required: true, type: 'datalist', options: POLES },
        { key: "filiere", label: "Filière", required: true },
        { key: "groupe", label: "Groupe", required: true },
        { key: "responsable_projet", label: "Responsable", required: true },
        { key: "statut", label: "Statut", required: true, type: 'datalist', options: ['En cours', 'Terminé', 'Suspendu', 'Abandonné'] },
        { key: "etape", label: "Étape", required: true },
        { key: "participants", label: "Participants", required: true, type: 'list' },
        { key: "dt_debut", label: "Date début", required: true, type: 'date' },
        { key: "dt_fn_prevu", label: "Date fin prévue", type: 'date' },
    ];

    useEffect(() => {
        const controller = new AbortController();

        const fetchProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get("/projects", {
                    signal: controller.signal,
                });
                setProjects(Array.isArray(res.data) ? res.data : res.data.data || []);
            } catch (err) {
                if (err.code === 'ERR_CANCELED') return;
                const errorMsg = err.response?.data?.message || err.message || "Erreur de chargement des projets";
                setError(errorMsg);
                console.error("Erreur chargement projets:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();

        return () => controller.abort();
    }, []);

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    };

    const refetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/projects");
            setProjects(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Erreur de chargement";
            setError(errorMsg);
            console.error("Erreur chargement projets:", err);
        } finally {
            setLoading(false);
        }
    };

    const onSave = async (modifiedRows) => {
        try {
            await Promise.all(
                modifiedRows.map(row => api.put(`/projects/${row.id}`, row))
            );
            showToast(`✓ ${modifiedRows.length} modification(s) sauvegardée(s)`);
            await refetchProjects();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la sauvegarde";
            showToast(`❌ ${errorMsg}`);
            console.error("Erreur save:", err);
        }
    };

    const handleAddSubmit = async (formData) => {
        try {
            await api.post("/projects", formData);
            showToast("✓ Projet ajouté avec succès");
            setIsModalOpen(false);
            await refetchProjects();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de l'ajout du projet";
            showToast(`❌ ${errorMsg}`);
            console.error("Erreur ajout projet:", err);
        }
    };

    const onDelete = async (ids) => {
        try {
            await Promise.all(
                ids.map(id => api.delete(`/projects/${id}`))
            );
            showToast(`✓ ${ids.length} projet(s) supprimé(s)`);
            await refetchProjects();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la suppression";
            showToast(`❌ ${errorMsg}`);
            console.error("Erreur delete:", err);
        }
    };

    // Construire initialFilters pour ExcelTable
    const initialFilters = useMemo(() => {
        const statutFilter = searchParams.get('statut');
        if (statutFilter) {
            return { statut: [statutFilter] };
        }
        return null;
    }, [searchParams]);

    return (
        <>
        {loading === true ? (
            <TableSkeleton columns={10} rows={8} />
        ) : error ? (
            <TableError message={error} onRetry={refetchProjects} />
        ) : projects.length === 0 ? (
                <TableEmpty message="Aucune donnée trouvée" />
        ) : (
            <>
                <ExcelTable
                    data={projects}
                    columns={COLUMNS}
                    onDelete={onDelete}
                    onSave={onSave}
                    addRow={() => setIsModalOpen(true)}
                    initialFilters={initialFilters}
                />
                <AddRowModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAddSubmit}
                    title="Ajouter un Nouveau Projet"
                    fields={PROJECT_FIELDS}
                />
            </>
        )}
        <Toast msg={toast.msg} visible={toast.visible} />
        </>
    );
}

export default Projects;