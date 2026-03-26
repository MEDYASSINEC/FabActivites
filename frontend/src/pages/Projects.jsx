import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from 'react-router';
import ExcelTable from "../components/ExcelTable";
import axios from 'axios';
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableEmpty from "../components/TableEmpty";

// instance axios avec baseURL propre
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

function Projects() {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);

    const COLUMNS = [
        { key: "intitule_projet", label: "Intitulé projet" },
        { key: "source_du_projet", label: "Source" },
        { key: "pole", label: "Pôle" },
        { key: "filiere", label: "Filière" },
        { key: "groupe", label: "Groupe" },
        { key: "responsable_projet", label: "Responsable" },
        { key: "statut", label: "Statut" },
        { key: "etape", label: "Étape" },
        { key: "participants", label: "Participants" },
        { key: "dt_debut", label: "Début", type: 'date' },
        { key: "dt_fn_prevu", label: "Fin prévue", type: 'date' },
        { key: "dt_fn_reel", label: "Fin réelle", type: 'date' },
    ];

    const PROJECT_FIELDS = [
        { key: "intitule_projet", label: "Intitulé projet", required: true },
        { key: "source_du_projet", label: "Source", required: true },
        { key: "pole", label: "Pôle", required: true },
        { key: "filiere", label: "Filière", required: true },
        { key: "groupe", label: "Groupe", required: true },
        { key: "responsable_projet", label: "Responsable", required: true },
        { key: "statut", label: "Statut", required: true, type: 'select', options: ['En cours', 'Terminé', 'Suspendu', 'Abandonné'] },
        { key: "etape", label: "Étape", required: true },
        { key: "participants", label: "Participants", required: true, type: 'list' },
        { key: "dt_debut", label: "Date début", required: true, type: 'date' },
        { key: "dt_fn_prevu", label: "Date fin prévue", type: 'date' },
    ];

    useEffect(() => {
        const controller = new AbortController();

        const fetchProjects = async () => {
            try {
                const res = await api.get("/projects", {
                    signal: controller.signal,
                });
                setProjects(res.data);
            } catch (err) {
                if (err.code === 'ERR_CANCELED') return;
                console.error("Erreur chargement projets:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();

        return () => controller.abort();
    }, []);

    const onSave = async (modifiedRows) => {
        await Promise.all(
            modifiedRows.map(row => api.put(`/projects/${row.id}`, row))
        );
    };

    const handleAddSubmit = async (formData) => {
        try {
            await api.post("/projects", formData);
            fetchProjects();
        } catch (err) {
            console.error("Erreur lors de l'ajout du projet:", err);
        }
    };

    const onDelete = async (ids) => {
        await Promise.all(
            ids.map(id => api.delete(`/projects/${id}`))
        );
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
        </>
    );
}

export default Projects;