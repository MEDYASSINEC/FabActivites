import React, { useEffect, useState } from "react";
import axios from "axios";
import AddRowModal from "../components/form";
import OccupationTable from "../components/occupationTable";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const OccupationsTable = () => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [occupations, setOccupations] = useState([]);
  const [frequentations, setFrequentations] = useState([]);
  const [zoneOccupees, setZoneOccupees] = useState([]);
  const [outillages, setOutillages] = useState([]);

  const formatLocalTime = () => {
    const d = new Date();
    const pad = (n) => n < 10 ? '0'+n : n;
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  const [form, setForm] = useState({
    id: null,
    frequentation_id: "",
    zone_occupee: "",
    outillage_machine: "",
    heur_debut: "",
    heur_fin: "",
    participants: [],
  });
  const [editMode, setEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch refs
  useEffect(() => {
    api.get("/zone-occupees").then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setZoneOccupees(Array.from(new Map(data.map(z => [z.name, z])).values()));
    });
    api.get("/outillages").then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setOutillages(Array.from(new Map(data.map(o => [o.name, o])).values()));
    });
  }, []);

  // Fetch frequentations and occupations by date
  useEffect(() => {
    if (date) {
      api.get(`/frequentations/process?date=${date}`).then((res) => {
        setFrequentations(res.data);
      });
      api.get(`/occupations?date=${date}`).then((res) => {
        setOccupations(res.data);
      });
    }
  }, [date]);

  const resetForm = () => {
    setForm({
      id: null,
      frequentation_id: "",
      zone_occupee: "",
      outillage_machine: "",
      heur_debut: formatLocalTime(),
      heur_fin: "",
      participants: [],
    });
  };

  const selectedFrequentation = frequentations.find(f => f.id === parseInt(form.frequentation_id));
  const isProject = !!selectedFrequentation?.project_id;
  const projectParticipants = isProject && selectedFrequentation?.project?.participants 
    ? (Array.isArray(selectedFrequentation.project.participants) 
        ? selectedFrequentation.project.participants 
        : [])
    : (Array.isArray(selectedFrequentation?.participants) ? selectedFrequentation.participants : []);

  const handleSubmit = (row) => {
    const payload = {
      ...row,
      participants: row.participants || [],
    };
    if (editMode && row.id) {
      api.put(`/occupations/${row.id}`, payload).then((res) => {
        setOccupations((prev) =>
          prev.map((o) => (o.id === row.id ? res.data.occupation : o))
        );
        setIsModalOpen(false);
        setEditMode(false);
        resetForm();
      });
    } else {
      api.post(`/occupations`, payload).then((res) => {
        setOccupations((prev) => [...prev, res.data.occupation]);
        setIsModalOpen(false);
        resetForm();
      });
    }
  };

  useEffect(() => {
    if (!editMode && isModalOpen) {
      setForm(prev => ({ ...prev, heur_debut: formatLocalTime() }));
    }
  }, [editMode, isModalOpen]);

  const OCCUPATION_COLUMNS = [
    { key: "date", label: "Date" },
    { key: "zone_occupee", label: "Zone occupée" },
    { key: "outillage_machine", label: "Outillage / Machine" },
    { key: "heur_debut", label: "Heure début" },
    { key: "heur_fin", label: "Heure fin" },
    { key: "participants_list", label: "Participants" },
    { key: "type_activite", label: "Type activité" },
    { key: "projet_activite", label: "Projet / Activité" },
    { key: "pole", label: "Pôle" },
    { key: "filiere", label: "Filière" },
  ];

  const tableData = occupations.map(o => ({
      ...o,
      date: o.frequentation?.date || '-',
      participants_list: o.participants?.join(", ") || "",
      type_activite: o.frequentation?.type_activite || '-',
      projet_activite: o.frequentation?.activite?.nom || o.frequentation?.project?.intitule_projet || '-',
      pole: o.frequentation?.activite?.pole || o.frequentation?.project?.pole || '-',
      filiere: o.frequentation?.activite?.filiere || o.frequentation?.project?.filiere || '-'
  }));

  const formFields = [
    {
      key: "frequentation_id",
      label: "Fréquentation Associée",
      type: "select",
      required: true,
      options: frequentations.map(f => ({
        value: f.id,
        label: `${f.id} - ${f.activite?.nom || f.project?.intitule_projet || 'Projet'} (${f.type_activite})`
      }))
    },
    {
      key: "zone_occupee",
      label: "Zone occupée",
      type: "select",
      required: true,
      options: zoneOccupees.map(z => z.name)
    },
    {
      key: "outillage_machine",
      label: "Outillage / Machine",
      type: "select",
      required: true,
      options: outillages.map(o => ({ value: o.name, label: o.name }))
    },
    { key: "heur_debut", label: "Heure début", type: "time", required: true },
    { key: "heur_fin", label: "Heure fin", type: "time", required: false },
  ];

  if (form.frequentation_id) {
     formFields.push({
         key: "participants",
         label: "Participants",
         required: false,
         type: isProject ? 'checkboxes' : 'list',
         options: isProject ? projectParticipants.map(p => p.name || p) : []
     });
  }

  return (
    <>
      <div style={{ padding: '0 20px', marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Gestion des occupations</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <b>Date :</b>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>
        <button 
          onClick={() => { resetForm(); setEditMode(false); setIsModalOpen(true); }}
          className="btn-primary-solid"
          style={{ marginLeft: 'auto', padding: '8px 16px', background: '#0061AA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Ajouter une occupation
        </button>
      </div>

      <OccupationTable 
         data={tableData} 
         columns={OCCUPATION_COLUMNS} 
      />

      <AddRowModal
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         onSubmit={handleSubmit}
         title={editMode ? "Modifier l'Occupation" : "Ajouter une Occupation"}
         fields={formFields}
         externalFormData={form}
         setExternalFormData={setForm}
      />
    </>
  );
};

export default OccupationsTable;
