import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from '../api';
import ExcelTable from "../components/ExcelTable";
import AddRowModal from "../components/form";
import TableSkeleton from "../components/TableSkeleton";
import TableError from "../components/TableError";
import Toast from "../components/Toast";
import { useDirtyTracker } from '../context/DirtyTrackerContext';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';

const calculateDuration = (heurDebut, heurFin) => {
    if (!heurDebut || !heurFin) return "";
    const parseTime = (timeStr) => {
        const parts = timeStr.split(":");
        if (parts.length < 2) return null;
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return null;
        return h * 60 + m;
    };
    const startMin = parseTime(heurDebut);
    const endMin = parseTime(heurFin);
    if (startMin === null || endMin === null) return "";
    
    let diffMin = endMin - startMin;
    if (diffMin < 0) {
        diffMin += 24 * 60;
    }
    
    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;
    
    if (hours === 0) {
        return `${minutes} min`;
    }
    if (minutes === 0) {
        return `${hours} h`;
    }
    return `${hours} h ${minutes} min`;
};

const COLUMNS = [
    { key: "date", label: "Date", type: "date" },
    { key: "type_activite", label: "Type activité" },
    { key: "activite_nom", label: "Projet/Activité" },
    { key: "zone_occupee", label: "Zone occupée", type: "datalist" },
    { key: "outillage_machine", label: "Outillage / Machine utilisée", type: "datalist" },
    { key: "heur_debut", label: "Heure début", type: "time" },
    { key: "heur_fin", label: "Heure fin", type: "time" },
    { key: "duree", label: "Durée", readOnly: true, compute: (row) => calculateDuration(row.heur_debut, row.heur_fin) },
];

function Occupation() {
    const [frequentations, setFrequentations] = useState([]);
    const [zoneOccupees, setZoneOccupees] = useState([]);
    const [outillages, setOutillages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ msg: "", visible: false });

    const { setDirty } = useDirtyTracker();
    const { showLeaveModal, confirmLeave, cancelLeave } = useNavigationGuard('occupations');
    useBeforeUnload('occupations');

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
    };

    // Calcul dynamique des lignes du tableau à partir des fréquentations
    const rows = useMemo(() => {
        return frequentations.flatMap((f) => {
            if (!Array.isArray(f.occupations)) return [];
            return f.occupations.map((occ) => ({
                id: occ.id,
                occupation_id: occ.id,
                frequentation_id: f.id,
                date: occ.date, // Priorité stricte à la colonne date de la table occupations
                type_activite: f.type_activite,
                activite_nom: f.activite?.nom ?? f.project?.intitule_projet ?? "",
                zone_occupee: occ.zone_occupee,
                outillage_machine: occ.outillage_machine,
                heur_debut: occ.heur_debut,
                heur_fin: occ.heur_fin,
                duree: calculateDuration(occ.heur_debut, occ.heur_fin),
                project_id: f.project_id,
                project_participants: Array.isArray(f.project?.participants) ? f.project.participants : [],
            }));
        });
    }, [frequentations]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [freqRes, zonesRes, outRes] = await Promise.all([
                    api.get("/frequentations"),
                    api.get("/zone-occupees"),
                    api.get("/outillages"),
                ]);
                setFrequentations(freqRes.data || []);
                setZoneOccupees(Array.from(new Map((zonesRes.data || []).map(z => [z.name, z])).values()));
                setOutillages(Array.from(new Map((outRes.data || []).map(o => [o.name, o])).values()));
            } catch (err) {
                setError("Erreur chargement");
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleAddSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                zone_occupee: data.zone_occupee === 'autre' ? data.custom_zone : data.zone_occupee,
                outillage_machine: data.outillage_machine === 'autre' ? data.custom_outillage : data.outillage_machine
            };
            await api.post("/occupations", payload);
            // Recharge la liste complète pour garantir la cohérence
            const freqRes = await api.get("/frequentations");
            setFrequentations(freqRes.data || []);
            showToast("✓ Ajouté");
            setIsModalOpen(false);
            setDirty('occupations', false);
        } catch (err) { 
            console.error(err);
            showToast(`❌ Erreur`); 
        }
    };

    const onSave = async (modifiedRows) => {
        try {
            const results = await Promise.all(modifiedRows.map(row => {
                const payload = { ...row };
                return row._is_new ? api.post("/occupations", payload) : api.put(`/occupations/${row.id}`, payload);
            }));

            setFrequentations(prev => {
                let next = [...prev];
                results.forEach(res => {
                    const occ = res.data.occupation;
                    next = next.map(f => {
                        if (f.id !== occ.frequentation_id) return f;
                        const others = (f.occupations || []).filter(o => o.id !== occ.id);
                        return { ...f, occupations: [...others, occ] };
                    });
                });
                return next;
            });

            showToast(`✓ Sauvegardé`);
            setDirty('occupations', false);
        } catch (err) { showToast(`❌ Erreur`); }
    };

    const onDelete = async (ids) => {
        try {
            await Promise.all(ids.map(id => api.delete(`/occupations/${id}`)));
            setFrequentations(prev => prev.map(f => ({
                ...f, occupations: (f.occupations || []).filter(o => !ids.includes(o.id))
            })));
            showToast(`✓ Supprimé`);
            setDirty('occupations', false);
        } catch (err) { showToast(`❌ Erreur`); }
    };

    const frequentationsForDate = useMemo(() => {
        return frequentations.filter(f => f.date === formData.date).map(f => ({
            value: f.id,
            label: `${f.activite?.nom ?? f.project?.intitule_projet ?? "Activité"} (${f.type_activite})`,
            isProject: !!f.project_id
        }));
    }, [formData.date, frequentations]);

    const occupationFields = [
        { key: "date", label: "Date", type: "date" },
        { key: "frequentation_id", label: "Fréquentation", type: "select", options: frequentationsForDate },
        { 
            key: "zone_occupee", label: "Zone occupée", type: "select", 
            options: [{ label: "--- Autre ---", value: "autre" }, ...zoneOccupees.map(z => ({ value: z.name, label: z.name }))] 
        },
        ...(formData.zone_occupee === 'autre' ? [{ key: "custom_zone", label: "Précisez la zone", required: false }] : []),
        { 
            key: "outillage_machine", label: "Outillage", type: "select", 
            options: [{ label: "--- Autre ---", value: "autre" }, ...outillages.map(o => ({ value: o.name, label: o.name }))] 
        },
        ...(formData.outillage_machine === 'autre' ? [{ key: "custom_outillage", label: "Précisez l'outillage", required: false }] : []),
        { key: "heur_debut", label: "Heure début", type: "time" },
        { key: "heur_fin", label: "Heure fin", type: "time" },
    ];

    useEffect(() => {
        if (isModalOpen) {
            const now = new Date();
            setFormData({ date: now.toISOString().split("T")[0], heur_debut: now.toTimeString().slice(0, 5), frequentation_id: "" });
        }
    }, [isModalOpen]);

    if (loading) return <TableSkeleton columns={8} rows={8} />;
    if (error) return <TableError message={error} onRetry={() => window.location.reload()} />;

    return (
        <>
            <ExcelTable
                data={rows}
                columns={COLUMNS.map(c => c.key === "zone_occupee" ? { ...c, options: ["--- Autre ---", ...zoneOccupees.map(z => z.name)] } : c.key === "outillage_machine" ? { ...c, options: ["--- Autre ---", ...outillages.map(o => o.name)] } : c)}
                onDelete={onDelete}
                onSave={onSave}
                addRow={() => setIsModalOpen(true)}
                onDuplicate={true}
                onDirtyChange={(d) => setDirty('occupations', d)}
            />
            <AddRowModal
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddSubmit} title="Ajouter occupation"
                fields={occupationFields} externalFormData={formData}
                setExternalFormData={(u) => setFormData(p => typeof u === 'function' ? u(p) : u)}
            />
            <ConfirmLeaveModal isOpen={showLeaveModal} onConfirm={confirmLeave} onCancel={cancelLeave} />
            <Toast msg={toast.msg} visible={toast.visible} />
        </>
    );
}

export default Occupation;
