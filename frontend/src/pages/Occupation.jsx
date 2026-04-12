import { useEffect, useState } from "react";
import axios from 'axios';
import TableSkeleton from "../components/TableSkeleton";
import TableEmpty from "../components/TableEmpty";
import OccupationTable from "../components/occupationTable";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});


const calculateDuration = (start, end) => {
    if (!start || !end) return "-";
    try {
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        const date1 = new Date(0, 0, 0, h1, m1);
        const date2 = new Date(0, 0, 0, h2, m2);
        let diff = (date2 - date1) / 1000 / 60; // en minutes
        if (diff < 0) diff += 1440; // gestion minuit
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`;
    } catch (e) {
        return "-";
    }
};

const COLUMNS = [
    { key: "date", label: "Date" },
    { key: "type_activite", label: "Type Activité" },
    { key: "activite_nom", label: "Nom de l’activité/projet" },
    { key: "activite_pole", label: "Pôle" },
    { key: "activite_filiere", label: "Filière" },
    { key: "zone_occupee", label: "Zone occupée" },
    { key: "outillage_machine", label: "Outillage / Machine utilisée" },
    { key: "heur_debut", label: "Heure Début" },
    { key: "heur_fin", label: "Heure Fin" },
    { key: "duree", label: "Durée (h)", calculate: (row) => calculateDuration(row.heur_debut, row.heur_fin) },
];

function Occupation() {
    const [frequentations, setFrequentations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        api.get("/frequentations/process", { signal: controller.signal })
            .then(res => {
                const data = res.data.map(f => ({
                    ...f,
                    duree: calculateDuration(f.heur_debut, f.heur_fin),
                }));
                setFrequentations(data);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error("Erreur chargement:", err);
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);

    return (
        <>
            {loading ? (
                <TableSkeleton columns={10} rows={8} />
            ) : frequentations.length === 0 ? (
                <TableEmpty message="Aucune donnée trouvée" />
            ) : (
                <OccupationTable data={frequentations} columns={COLUMNS} />
            )}
        </>
    )
}

export default Occupation;
