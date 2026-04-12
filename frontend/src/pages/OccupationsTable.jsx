import React, { useEffect, useState } from "react";
import axios from "axios";

const OccupationsTable = () => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [occupations, setOccupations] = useState([]);
  const [frequentations, setFrequentations] = useState([]);
  const [dropdowns, setDropdowns] = useState({
    typeActivites: [],
    projets: [],
    poles: [],
    filieres: [],
    participants: [],
  });
  const [form, setForm] = useState({
    id: null,
    zone_occupee: "",
    outillage_machine: "",
    heur_debut: "",
    heur_fin: "",
    frequentation_id: "",
    participants: [],
    type_activite: "",
    project_id: "",
    pole: "",
    filiere: "",
  });
  const [editMode, setEditMode] = useState(false);

  // Fetch frequentations by date
  useEffect(() => {
    if (date) {
      axios
        .get(`/api/frequentations?date=${date}`)
        .then((res) => {
          setFrequentations(res.data);
          // Extract dropdowns from frequentations
          const typeActivites = [
            ...new Set(res.data.map((f) => f.type_activite)),
          ];
          const projets = [
            ...new Set(res.data.map((f) => f.project?.intitule_projet || f.project_id)),
          ];
          const poles = [...new Set(res.data.map((f) => f.pole))];
          const filieres = [...new Set(res.data.map((f) => f.filiere))];
          // Flatten all participants arrays (which are now JSON arrays)
          const participants = [
            ...new Set(
              res.data.flatMap((f) => (Array.isArray(f.occupations) 
                ? f.occupations.flatMap(occ => Array.isArray(occ.participants) ? occ.participants : []) 
                : []))
            ),
          ];
          setDropdowns({
            typeActivites,
            projets,
            poles,
            filieres,
            participants,
          });
        });
      // Fetch occupations for the date
      axios.get(`/api/occupations?date=${date}`).then((res) => {
        setOccupations(res.data);
      });
    }
  }, [date]);

  // Handlers for form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleParticipantsChange = (e) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setForm((prev) => ({ ...prev, participants: values }));
  };
  const handleEdit = (occupation) => {
    setForm({ ...occupation, participants: occupation.participants || [] });
    setEditMode(true);
  };
  const handleDelete = (id) => {
    if (window.confirm("Supprimer cette occupation ?")) {
      axios.delete(`/api/occupations/${id}`).then(() => {
        setOccupations((prev) => prev.filter((o) => o.id !== id));
      });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      participants: form.participants,
    };
    if (editMode && form.id) {
      axios.put(`/api/occupations/${form.id}`, payload).then((res) => {
        setOccupations((prev) =>
          prev.map((o) => (o.id === form.id ? res.data.occupation : o))
        );
        setEditMode(false);
        setForm({
          id: null,
          zone_occupee: "",
          outillage_machine: "",
          heur_debut: "",
          heur_fin: "",
          frequentation_id: "",
          participants: [],
          type_activite: "",
          project_id: "",
          pole: "",
          filiere: "",
        });
      });
    } else {
      axios.post(`/api/occupations`, payload).then((res) => {
        setOccupations((prev) => [...prev, res.data.occupation]);
        setForm({
          id: null,
          zone_occupee: "",
          outillage_machine: "",
          heur_debut: "",
          heur_fin: "",
          frequentation_id: "",
          participants: [],
          type_activite: "",
          project_id: "",
          pole: "",
          filiere: "",
        });
      });
    }
  };

  return (
    <div>
      <h2>Gestion des occupations</h2>
      <label>
        Date :
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <form onSubmit={handleSubmit}>
        <select
          name="type_activite"
          value={form.type_activite}
          onChange={handleChange}
          required
        >
          <option value="">Type activité</option>
          {dropdowns.typeActivites.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="project_id"
          value={form.project_id}
          onChange={handleChange}
          required
        >
          <option value="">Projet</option>
          {dropdowns.projets.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          name="pole"
          value={form.pole}
          onChange={handleChange}
          required
        >
          <option value="">Pôle</option>
          {dropdowns.poles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          name="filiere"
          value={form.filiere}
          onChange={handleChange}
          required
        >
          <option value="">Filière</option>
          {dropdowns.filieres.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="zone_occupee"
          value={form.zone_occupee}
          onChange={handleChange}
          placeholder="Zone occupée"
          required
        />
        <input
          type="text"
          name="outillage_machine"
          value={form.outillage_machine}
          onChange={handleChange}
          placeholder="Outillage/Machine"
          required
        />
        <input
          type="datetime-local"
          name="heur_debut"
          value={form.heur_debut}
          onChange={handleChange}
          required
        />
        <input
          type="datetime-local"
          name="heur_fin"
          value={form.heur_fin}
          onChange={handleChange}
          required
        />
        <select
          name="frequentation_id"
          value={form.frequentation_id}
          onChange={handleChange}
          required
        >
          <option value="">Fréquentation</option>
          {frequentations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} - {f.activite?.nom || f.project?.intitule_projet || 'Projet'} ({f.type_activite})
            </option>
          ))}
        </select>
        <select
          multiple
          name="participants"
          value={form.participants}
          onChange={handleParticipantsChange}
          required
        >
          {dropdowns.participants.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="submit">{editMode ? "Modifier" : "Ajouter"} occupation</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Zone occupée</th>
            <th>Outillage/Machine</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Participants</th>
            <th>Type activité</th>
            <th>Projet</th>
            <th>Pôle</th>
            <th>Filière</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {occupations.map((o) => (
            <tr key={o.id}>
              <td>{o.frequentation?.date || ""}</td>
              <td>{o.zone_occupee}</td>
              <td>{o.outillage_machine}</td>
              <td>{o.heur_debut}</td>
              <td>{o.heur_fin}</td>
              <td>
                {o.participants && o.participants.length > 0
                  ? o.participants.join(", ")
                  : ""}
              </td>
              <td>{o.frequentation?.type_activite || ""}</td>
              <td>{o.frequentation?.project_id || ""}</td>
              <td>{o.frequentation?.pole || ""}</td>
              <td>{o.frequentation?.filiere || ""}</td>
              <td>
                <button onClick={() => handleEdit(o)}>Éditer</button>
                <button onClick={() => handleDelete(o.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OccupationsTable;
