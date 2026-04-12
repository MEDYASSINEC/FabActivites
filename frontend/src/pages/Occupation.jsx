import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ExcelTable from "../components/ExcelTable";
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableEmpty from "../components/TableEmpty";
import TableError from "../components/TableError";
import Toast from "../components/Toast";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

const COLUMNS = [
    { key: "date", label: "Date", type: "date" },
    { key: "type_activite", label: "Type activité" },
    { key: "activite_nom", label: "Projet/Activité" },
    { key: "zone_occupee", label: "Zone occupée", type: "datalist" },
    { key: "outillage_machine", label: "Outillage", type: "datalist" },
    { key: "heur_debut", label: "Heure début", type: "time" },
    { key: "heur_fin", label: "Heure fin", type: "time" },
    { key: "participants", label: "Participants" },
];

function Occupation({ onUnsavedChange }) {
    const [rows, setRows] = useState([]);
    const [frequentations, setFrequentations] = useState([]);
    const [zoneOccupees, setZoneOccupees] = useState([]);
    const [outillages, setOutillages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ msg: "", visible: false });

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
    };

    const mapFrequentationsToOccupations = (frequentationsData) => {
        return frequentationsData.flatMap((f) => {
            if (!Array.isArray(f.occupations) || f.occupations.length === 0) return [];
            return f.occupations.map((occ) => ({
                id: occ.id,
                occupation_id: occ.id,
                frequentation_id: f.id,
                date: f.date,
                type_activite: f.type_activite,
                activite_nom: f.activite?.nom ?? f.project?.intitule_projet ?? "",
                zone_occupee: occ.zone_occupee,
                outillage_machine: occ.outillage_machine,
                heur_debut: occ.heur_debut,
                heur_fin: occ.heur_fin,
                participants: Array.isArray(occ.participants) ? occ.participants : [],
                project_id: f.project_id,
                project_participants: Array.isArray(f.project?.participants) ? f.project.participants : [],
            }));
        });
    };

    const refetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [frequentationsRes, zonesRes, outillagesRes] = await Promise.all([
                api.get("/frequentations"),
                api.get("/zone-occupees"),
                api.get("/outillages"),
            ]);

            const frequentationsData = Array.isArray(frequentationsRes.data) ? frequentationsRes.data : [];
            setFrequentations(frequentationsData);
            setRows(mapFrequentationsToOccupations(frequentationsData));
            setZoneOccupees(Array.isArray(zonesRes.data) ? zonesRes.data : []);
            setOutillages(Array.isArray(outillagesRes.data) ? outillagesRes.data : []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Erreur de chargement des occupations";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetchData();
    }, []);

    useEffect(() => {
        if (!isModalOpen) return;
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toTimeString().split(" ")[0].slice(0, 5);
        setFormData({
            date: dateStr,
            frequentation_id: "",
            zone_occupee: "",
            outillage_machine: "",
            heur_debut: timeStr,
            heur_fin: "",
            participants: [],
        });
    }, [isModalOpen]);

    const frequentationsForDate = useMemo(() => {
        if (!formData.date) return [];
        return frequentations
            .filter(f => f.date === formData.date)
            .map(f => ({
                value: f.id,
                label: `${f.activite?.nom ?? f.project?.intitule_projet ?? "Activité"} (${f.type_activite || "Type N/A"})`,
                participants: Array.isArray(f.project?.participants) ? f.project.participants : [],
                isProject: Boolean(f.project_id),
            }));
    }, [formData.date, frequentations]);

    const selectedFrequentation = useMemo(() => {
        if (!formData.frequentation_id) return null;
        return frequentationsForDate.find(f => String(f.value) === String(formData.frequentation_id)) || null;
    }, [formData.frequentation_id, frequentationsForDate]);

    const occupationFields = [
        { key: "date", label: "Date", required: true, type: "date" },
        {
            key: "frequentation_id",
            label: "Fréquentation (projet/activité)",
            required: true,
            type: "select",
            options: frequentationsForDate,
        },
        {
            key: "participants",
            label: "Participants",
            required: false,
            type: selectedFrequentation?.isProject ? "checkboxes" : "list",
            options: selectedFrequentation?.isProject ? selectedFrequentation.participants : [],
        },
        {
            key: "zone_occupee",
            label: "Zone occupée",
            required: true,
            type: "select",
            options: zoneOccupees.map(z => ({ value: z.name, label: z.name })),
        },
        {
            key: "outillage_machine",
            label: "Outillage",
            required: true,
            type: "select",
            options: outillages.map(o => ({ value: o.name, label: o.name })),
        },
        { key: "heur_debut", label: "Heure début", required: true, type: "time" },
        { key: "heur_fin", label: "Heure fin", required: false, type: "time" },
    ];

    const onSave = async (modifiedRows) => {
        try {
            await Promise.all(modifiedRows.map((row) => {
                const payload = {
                    frequentation_id: row.frequentation_id,
                    zone_occupee: row.zone_occupee,
                    outillage_machine: row.outillage_machine,
                    heur_debut: row.heur_debut,
                    heur_fin: row.heur_fin,
                    participants: row.participants || [],
                };

                if (row._is_new) {
                    return api.post("/occupations", payload);
                }

                return api.put(`/occupations/${row.id}`, payload);
            }));

            showToast(`✓ ${modifiedRows.length} occupation(s) sauvegardée(s)`);
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la sauvegarde";
            showToast(`❌ ${errorMsg}`);
        }
    };

    const onDelete = async (ids) => {
        try {
            await Promise.all(ids.map(id => api.delete(`/occupations/${id}`)));
            showToast(`✓ ${ids.length} occupation(s) supprimée(s)`);
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la suppression";
            showToast(`❌ ${errorMsg}`);
        }
    };

    const handleAddSubmit = async (data) => {
        try {
            await api.post("/occupations", {
                frequentation_id: data.frequentation_id,
                zone_occupee: data.zone_occupee,
                outillage_machine: data.outillage_machine,
                heur_debut: data.heur_debut,
                heur_fin: data.heur_fin,
                participants: data.participants || [],
            });
            showToast("✓ Occupation ajoutée avec succès");
            setIsModalOpen(false);
            await refetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de l'ajout de l'occupation";
            showToast(`❌ ${errorMsg}`);
        }
    };

    if (loading) {
        return <TableSkeleton columns={8} rows={8} />;
    }

    if (error) {
        return <TableError message={error} onRetry={refetchData} />;
    }

    return (
        <>
            {rows.length === 0 ? (
                <TableEmpty message="Aucune occupation trouvée" />
            ) : (
                <ExcelTable
                    data={rows}
                    columns={COLUMNS.map(col => {
                        if (col.key === "zone_occupee") {
                            return { ...col, options: zoneOccupees.map(z => z.name) };
                        }
                        if (col.key === "outillage_machine") {
                            return { ...col, options: outillages.map(o => o.name) };
                        }
                        return col;
                    })}
                    onDelete={onDelete}
                    onSave={onSave}
                    addRow={() => setIsModalOpen(true)}
                    onDuplicate={true}
                    persistenceKey="occupations"
                    onUnsavedChange={onUnsavedChange}
                />
            )}

            <AddRowModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddSubmit}
                title="Ajouter une nouvelle occupation"
                fields={occupationFields}
                externalFormData={formData}
                setExternalFormData={setFormData}
            />

            <Toast msg={toast.msg} visible={toast.visible} />
        </>
    );
}

export default Occupation;
