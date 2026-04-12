import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from 'react-router';
import axios from 'axios';
import ExcelTable from "../components/ExcelTable";
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableEmpty from "../components/TableEmpty";
import TableError from "../components/TableError";
import Toast from "../components/Toast";
import { POLES } from '../constants/poles';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

function Frequentations() {
    const [frequentations, setFrequentations] = useState([]);
    const [projects, setProjects] = useState([]);
    const [typeActivites, setTypeActivites] = useState([]);
    const [zoneOccupees, setZoneOccupees] = useState([]);
    const [outillages, setOutillages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ msg: "", visible: false });

    // Colonnes aplaties depuis frequentation + activite + occupation
    const COLUMNS = [
        // ── Fréquentation ──
        { key: "date", label: "Date", type: 'date' },
        { key: "type_activite", label: "Type activité", type: 'datalist', options: typeActivites.map(t => t.name) },
        { key: "activite_nom", label: "Projet/Activité" },
        { key: "etape", label: "Etape/Séance" },
        { key: "intervenant", label: "Intervenant/Résponsable" },
        { key: "role", label: "Rôle" },
        { key: "participants", label: "Participants" },
        { key: "activite_pole", label: "Pôle", type: 'datalist', options: POLES },
        { key: "activite_filiere", label: "Filière" },
        { key: "activite_groupe", label: "Groupe" },
        { key: "zone_occupee", label: "Zone occupée", type: 'datalist', options: zoneOccupees.map(z => z.name) },
        { key: "outillage_machine", label: "Outillage", type: 'datalist', options: outillages.map(o => o.name) },
        { key: "heur_debut", label: "Heure début", type: 'time' },
        { key: "heur_fin", label: "Heure fin", type: 'time' },
    ];

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [frequentationsRes, projectsRes, taRes, zoRes, outRes] = await Promise.all([
                    api.get("/frequentations/process", { signal: controller.signal }),
                    api.get("/projects", { signal: controller.signal }),
                    api.get("/type-activites", { signal: controller.signal }),
                    api.get("/zone-occupees", { signal: controller.signal }),
                    api.get("/outillages", { signal: controller.signal }),
                ]);
                console.log("Fréquentations reçues:", frequentationsRes.data);
                setFrequentations(Array.isArray(frequentationsRes.data) ? frequentationsRes.data : frequentationsRes.data.data || []);
                setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.data || []);
                setTypeActivites(Array.isArray(taRes.data) ? taRes.data : taRes.data.data || []);
                setZoneOccupees(Array.isArray(zoRes.data) ? zoRes.data : zoRes.data.data || []);
                setOutillages(Array.isArray(outRes.data) ? outRes.data : outRes.data.data || []);
            } catch (err) {
                if (err.code === 'ERR_CANCELED') return;
                const errorMsg = err.response?.data?.message || err.message || "Erreur de chargement des données";
                setError(errorMsg);
                console.error("Erreur chargement:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => controller.abort();
    }, []);

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    };

    const refetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [frequentationsRes, projectsRes, taRes, zoRes, outRes] = await Promise.all([
                api.get("/frequentations/process"),
                api.get("/projects"),
                api.get("/type-activites"),
                api.get("/zone-occupees"),
                api.get("/outillages"),
            ]);
            setFrequentations(Array.isArray(frequentationsRes.data) ? frequentationsRes.data : frequentationsRes.data.data || []);
            setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.data || []);
            setTypeActivites(Array.isArray(taRes.data) ? taRes.data : taRes.data.data || []);
            setZoneOccupees(Array.isArray(zoRes.data) ? zoRes.data : zoRes.data.data || []);
            setOutillages(Array.isArray(outRes.data) ? outRes.data : outRes.data.data || []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Erreur de chargement";
            setError(errorMsg);
            console.error("Erreur chargement:", err);
        } finally {
            setLoading(false);
        }
    };

    // Set default values when modal opens
    useEffect(() => {
        if (isModalOpen) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
            setFormData({
                date: dateStr,
                heur_debut: timeStr,
                type_activite: 'Formation', // Default as per request order?
                activite_nom: '',
                participants: []
            });
        }
    }, [isModalOpen]);

    // Handle conditional logic
    useEffect(() => {
        if (formData.activite_nom && formData.activite_nom !== 'autre') {
            const selectedProject = projects.find(p => p.id == formData.activite_nom);
            if (selectedProject) {
                setFormData(prev => ({
                    ...prev,
                    activite_pole: selectedProject.pole || '',
                    activite_filiere: selectedProject.filiere || '',
                    activite_groupe: selectedProject.groupe || '',
                    participants: [] // RàZ des participants lors du changement de projet
                }));
            }
        } else if (formData.activite_nom === 'autre') {
            setFormData(prev => ({
                ...prev,
                activite_pole: '',
                activite_filiere: '',
                activite_groupe: '',
                project_id: null,
                participants: [] // RàZ des participants lors du passage en mode "autre"
            }));
        }
    }, [formData.activite_nom]);

    const isAutre = formData.activite_nom === 'autre';
    const isProjectSelected = formData.activite_nom && formData.activite_nom !== 'autre' && !isNaN(formData.activite_nom);
    const selectedProject = projects.find(p => p.id == formData.activite_nom);
    const projectParticipants = Array.isArray(selectedProject?.participants) ? selectedProject.participants : [];

    const FREQUENTATION_FIELDS = [
        { key: "date", label: "Date", required: false, type: 'date' },
        {
            key: "type_activite", label: "Type activité", required: false, type: 'datalist',
            options: typeActivites.map(t => t.name)
        },
        {
            key: "activite_nom", label: "Projet / Activité", required: false, type: 'select',
            options: [
                { label: '--- Autre Activité ---', value: 'autre' },
                ...projects.map(p => ({ label: p.intitule_projet, value: p.id }))
            ]
        },
        { key: "activite_pole", label: "Pôle", required: false, type: 'datalist', options: POLES, disabled: isProjectSelected },
        { key: "activite_filiere", label: "Filière", required: false, disabled: isProjectSelected },
        { key: "activite_groupe", label: "Groupe", required: false, disabled: isProjectSelected },
        { key: "etape", label: "Etape/Séance", required: false },
        { key: "intervenant", label: "Intervenant/Responsable", required: false },
        { key: "role", label: "Rôle", required: false },
        {
            key: "participants",
            label: "Participants",
            required: false,
            type: isProjectSelected ? 'checkboxes' : 'list',
            options: isProjectSelected ? projectParticipants : []
        },
        { key: "zone_occupee", label: "Zone occupée", required: false, type: 'datalist', options: zoneOccupees.map(z => z.name) },
        { key: "outillage_machine", label: "Outillage", required: false, type: 'datalist', options: outillages.map(o => o.name) },
        { key: "heur_debut", label: "Heure début", required: false, type: 'time' },
        { key: "heur_fin", label: "Heure fin", required: false, type: 'time' },
    ];

    const onSave = async (modifiedRows) => {
        try {
            await Promise.all(
                modifiedRows.map(row => {
                    const payload = {
                        participants: row.participants,
                        type_activite: row.type_activite,
                        project_id: row.project_id,
                        etape: row.etape,
                        intervenant: row.intervenant,
                        role: row.role,
                        heur_debut: row.heur_debut,
                        heur_fin: row.heur_fin,
                        date: row.date,
                        activite: {
                            nom: row.activite_nom,
                            pole: row.activite_pole,
                            filiere: row.activite_filiere,
                            groupe: row.activite_groupe,
                        },
                        occupation: {
                            zone_occupee: row.zone_occupee,
                            outillage_machine: row.outillage_machine,
                        },
                    };
                    
                    // Si c'est une nouvelle ligne (dupliquée), faire un POST
                    if (row._is_new) {
                        return api.post("/frequentations/process", payload);
                    }
                    // Sinon, faire un PUT (modification)
                    return api.put(`/frequentations/process/${row.id}`, payload);
                })
            );
            showToast(`✓ ${modifiedRows.length} modification(s) sauvegardée(s)`);
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la sauvegarde";
            showToast(`❌ ${errorMsg}`);
            console.error("Erreur save:", err);
        }
    };

    const handleAddSubmit = async (data) => {
        try {
            const projectForActivite = data.activite_nom !== 'autre' ? projects.find(p => p.id == data.activite_nom) : null;
            const payload = {
                participants: data.participants || [],
                type_activite: data.type_activite,
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
                occupation: {
                    zone_occupee: data.zone_occupee,
                    outillage_machine: data.outillage_machine,
                },
            };

            await api.post("/frequentations/process", payload);
            showToast("✓ Fréquentation ajoutée avec succès");
            setIsModalOpen(false);
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de l'ajout de la fréquentation";
            showToast(`❌ ${errorMsg}`);
        }
    };

    // If 'autre' is selected, we should probably add a field for the custom name
    // I'll adjust the fields list
    const finalFields = [...FREQUENTATION_FIELDS];
    if (formData.activite_nom === 'autre') {
        finalFields.splice(3, 0, { key: "custom_activite_nom", label: "Nom de l'activité", required: true });
    }

    const onDelete = async (ids) => {
        try {
            await Promise.all(
                ids.map(id => api.delete(`/frequentations/process/${id}`))
            );
            showToast(`✓ ${ids.length} fréquentation(s) supprimée(s)`);
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la suppression";
            showToast(`❌ ${errorMsg}`);
            console.error("Erreur delete:", err);
        }
    };

    const activeSessions = frequentations.filter(f => !f.heur_fin);
    const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);

    const handleFinishSession = async (session) => {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        try {
            await api.put(`/frequentations/process/${session.id}`, {
                ...session,
                heur_fin: timeStr,
                activite: {
                    nom: session.activite_nom,
                    pole: session.activite_pole,
                    filiere: session.activite_filiere,
                    groupe: session.activite_groupe,
                },
                occupation: {
                    zone_occupee: session.zone_occupee,
                    outillage_machine: session.outillage_machine,
                }
            });
            showToast("✓ Session terminée");
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la terminaison de la session";
            showToast(`❌ ${errorMsg}`);
        }
    };

    // Construire initialFilters pour ExcelTable
    const initialFilters = useMemo(() => {
        const filterParam = searchParams.get('filter');

        if (filterParam === 'active') {
            const emptyValues = new Set();
            frequentations.forEach(f => {
                if (!f.heur_fin) emptyValues.add(f.heur_fin ?? '');
            });
            return { heur_fin: [...emptyValues] };
        }

        if (filterParam === 'week') {
            const from = searchParams.get('from');
            const to = searchParams.get('to');
            if (!from || !to) return null;

            // Collecter toutes les dates de la semaine présentes dans les données
            const weekDates = new Set(
                frequentations
                    .filter(f => f.date && f.date >= from && f.date <= to)
                    .map(f => f.date)
            );
            return weekDates.size > 0 ? { date: [...weekDates] } : null;
        }

        return null;
    }, [searchParams, frequentations]);

    return (
        <>
            {activeSessions.length > 0 && (
                <div style={{ margin: '20px', background: '#fff9f0', border: '1px solid #ffd8a8', borderRadius: '12px', overflow: 'scroll', position: 'absolute', bottom: '20px', zIndex: '1000', maxHeight: '70vh', minWidth: '40vw' }}>
                    <div
                        onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
                        style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff5e6' }}
                    >
                        <h3 style={{ margin: 0, color: '#d9480f', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff922b', animation: 'pulse 1.5s infinite' }}></span>
                            Sessions Actives ({activeSessions.length})
                        </h3>
                        <span style={{ fontSize: '12px', color: '#d9480f', fontWeight: 'bold' }}>{isSessionsExpanded ? 'Réduire' : 'Développer'}</span>
                    </div>
                    {isSessionsExpanded && (
                        <div style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeSessions.map(session => (
                                    <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '10px 15px', background: '#fff', borderRadius: '8px', border: '1px solid #ffe8cc' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '600', minWidth: '150px' }}>{session.activite_nom}</span>
                                            <span style={{ fontSize: '13px', color: '#666' }}>Début: {session.heur_debut}</span>
                                            <span style={{ fontSize: '13px', color: '#666' }}>{Array.isArray(session.participants) ? session.participants.length : 0} pers.</span>
                                        </div>
                                        <button
                                            onClick={() => handleFinishSession(session)}
                                            className="btn-primary-solid"
                                            style={{ padding: '6px 15px', fontSize: '12px', background: '#fd7e14' }}
                                        >
                                            Terminer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {loading ? (
                <TableSkeleton columns={12} rows={8} />
            ) : error ? (
                <TableError message={error} onRetry={refetchData} />
            ) : frequentations.length === 0 ? (
                <TableEmpty message="Aucune donnée trouvée" />
            ) : (
                <>
                    <ExcelTable
                        data={frequentations}
                        columns={COLUMNS}
                        onDelete={onDelete}
                        onSave={onSave}
                        addRow={() => setIsModalOpen(true)}
                        getRowClassName={(row) => !row.heur_fin ? 'row-orange-light' : ''}
                        initialFilters={initialFilters}
                        onDuplicate={true}
                    />
                    <AddRowModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleAddSubmit}
                        title="Ajouter une Nouvelle Fréquentation"
                        fields={finalFields}
                        externalFormData={formData}
                        setExternalFormData={setFormData}
                    />
                </>
            )}
            <Toast msg={toast.msg} visible={toast.visible} />
        </>
    );
}

export default Frequentations;