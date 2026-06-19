import { useState, useEffect } from 'react';
import { api } from '../api';
import AccordionItem from '../components/AccordionItem';
import { useDirtyTracker } from '../context/DirtyTrackerContext';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';

function CrudSection({ title, endpoint, onDirty }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get(endpoint);
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, [endpoint]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        try {
            await api.post(endpoint, { name: newItemName });
            setNewItemName('');
            onDirty(false);
            fetchItems();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
        try {
            await api.delete(`${endpoint}/${id}`);
            onDirty(false);
            fetchItems();
        } catch (err) { console.error(err); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingItem || !editingItem.name.trim()) return;
        try {
            await api.put(`${endpoint}/${editingItem.id}`, { name: editingItem.name });
            setEditingItem(null);
            onDirty(false);
            fetchItems();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px'}}>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder={`Ajouter ${title.toLowerCase()}...`}
                    value={newItemName}
                    onChange={(e) => { setNewItemName(e.target.value); onDirty(true); }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button type="submit" style={{ padding: '8px 16px', background: '#0061AA', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Ajouter</button>
            </form>

            {loading ? (
                <p style={{ color: '#666', fontSize: '14px' }}>Chargement...</p>
            ) : items.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic', fontSize: '13px' }}>Aucun élément trouvé.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(item => (
                        <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
                            {editingItem?.id === item.id ? (
                                <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '10px' }}>
                                    <input 
                                        type="text" 
                                        value={editingItem.name} 
                                        onChange={(e) => { setEditingItem({ ...editingItem, name: e.target.value }); onDirty(true); }}
                                        style={{ flex: 1, padding: '6px 8px', border: '1px solid #aaa', borderRadius: '4px' }}
                                        autoFocus
                                    />
                                    <button type="submit" style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>Enregistrer</button>
                                    <button type="button" onClick={() => setEditingItem(null)} style={{ background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>Annuler</button>
                                </form>
                            ) : (
                                <>
                                    <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{item.name}</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => { setEditingItem(item); onDirty(true); }} style={{ background: 'rgba(0, 97, 170, 0.1)', border: 'none', color: '#0061AA', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Modifier</button>
                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'rgba(220, 53, 69, 0.1)', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Supprimer</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ImportSection({ onDirty }) {
    const [file, setFile] = useState(null);
    const [importProjects, setImportProjects] = useState(false);
    const [importFrequentations, setImportFrequentations] = useState(false);
    const [importOccupations, setImportOccupations] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleImport = async () => {
        if (!file) return;
        if (!importProjects && !importFrequentations && !importOccupations) {
            setStatus("❌ Veuillez sélectionner au moins une table à importer.");
            return;
        }

        setLoading(true);
        setStatus("Importation en cours... (cette opération peut prendre quelques secondes)");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('projects', importProjects);
        formData.append('frequentations', importFrequentations);
        formData.append('occupations', importOccupations);

        try {
            const res = await api.post('/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data = res.data;
            let successMsg = `✓ ${data.message || 'Import réussi !'}`;

            // Check if we received ignored occupations in the JSON response
            if (data.ignored_occupations && data.ignored_occupations.length > 0) {
                const ignoredCount = data.ignored_occupations.length;
                
                // Construct the CSV of ignored rows in Javascript
                const headers = [
                    'Date',
                    'Heure Début',
                    'Heure Fin',
                    'Nom de l\'activité/projet',
                    'Type_activité',
                    'Zone occupée',
                    'Outillage / Machine utilisée',
                    'Raison du Rejet'
                ];
                
                // Helper to escape values for CSV
                const csvRows = [headers.join(';')];
                for (const row of data.ignored_occupations) {
                    const values = [
                        row.date || '',
                        row.heure_debut || row.heur_debut || '',
                        row.heure_fin || row.heur_fin || '',
                        row.nom_de_lactiviteprojet || row.nom_activite || row.projet || '',
                        row.type_activite || '',
                        row.zone_occupee || '',
                        row.outillage_machine_utilisee || row.outillage_machine || '',
                        row.raison_rejet || ''
                    ].map(val => {
                        const cleaned = String(val).replace(/"/g, '""');
                        return `"${cleaned}"`;
                    });
                    csvRows.push(values.join(';'));
                }
                
                const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
                const csvContent = csvRows.join('\n');
                const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "occupations_ignorees.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                successMsg += ` ${ignoredCount} lignes d'occupations ignorées (projet/activité non enregistré en BDD) ont été téléchargées dans 'occupations_ignorees.csv'.`;
            }

            setStatus(successMsg);
            onDirty(false);
        } catch (err) {
            console.error(err);
            let msg = "Erreur lors de l'import";
            if (err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    msg = Object.values(data.errors).flat().join(', ');
                } else if (data.error) {
                    msg = `${data.message || 'Erreur'} : ${data.error}`;
                } else if (data.message) {
                    msg = data.message;
                }
            } else {
                msg = err.message || msg;
            }
            setStatus(`❌ ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const sectionStyle = {
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    };

    const groupStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #eee'
    };

    const checkboxGroupStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    };

    const checkboxLabelStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: '#495057',
        cursor: 'pointer',
        fontWeight: '500'
    };

    const isButtonDisabled = !file || loading || (!importProjects && !importFrequentations && !importOccupations);

    return (
        <div style={sectionStyle}>
            <div style={groupStyle}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Importer des données (Excel)</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Format supporté: .xlsx, .xls, .csv</p>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                    <input 
                        type="file" 
                        onChange={(e) => { setFile(e.target.files[0]); onDirty(true); }}
                        style={{ fontSize: '12px', flex: 1 }}
                        accept=".xlsx, .xls, .csv"
                    />
                </div>

                <div style={checkboxGroupStyle}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tables à importer :</span>
                    <label style={checkboxLabelStyle}>
                        <input 
                            type="checkbox" 
                            checked={importProjects} 
                            onChange={(e) => setImportProjects(e.target.checked)} 
                        />
                        Projets (Feuille "Liste de projets" ou "projets")
                    </label>
                    <label style={checkboxLabelStyle}>
                        <input 
                            type="checkbox" 
                            checked={importFrequentations} 
                            onChange={(e) => setImportFrequentations(e.target.checked)} 
                        />
                        Fréquentations (Feuille "Fréquentation" ou "frequentations")
                    </label>
                    <label style={checkboxLabelStyle}>
                        <input 
                            type="checkbox" 
                            checked={importOccupations} 
                            onChange={(e) => setImportOccupations(e.target.checked)} 
                        />
                        Occupations (Feuille "Occupation" ou "occupations")
                    </label>
                </div>

                <div style={{ marginTop: '15px' }}>
                    <button 
                        onClick={handleImport}
                        disabled={isButtonDisabled}
                        style={{ 
                            padding: '10px 20px', 
                            background: '#0061AA', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            opacity: isButtonDisabled ? 0.6 : 1,
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        {loading ? 'Importation en cours...' : 'Lancer l\'importation'}
                    </button>
                </div>

                {status && (
                    <p style={{ 
                        margin: '10px 0 0 0', 
                        fontSize: '12px', 
                        color: status.includes('✓') ? '#28a745' : '#dc3545', 
                        fontWeight: '500',
                        lineHeight: 1.4
                    }}>
                        {status}
                    </p>
                )}
            </div>

            <div style={{ padding: '12px', background: '#fff9db', borderRadius: '4px', border: '1px solid #fab005', fontSize: '11px', color: '#856404', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Ordre d'importation automatique :</strong> L'importation s'exécute de manière sécurisée dans l'ordre de dépendance des données : <strong>Projets ➔ Fréquentations ➔ Occupations</strong>.</div>
                <div><strong>Note Import Fréquentations :</strong> L'import des fréquentations liera chaque ligne à un projet existant (par son nom). Si aucun projet ne correspond, une nouvelle activité sera créée.</div>
                <div style={{ borderTop: '1px solid #ffe3e3', paddingTop: '8px', marginTop: '4px' }}><strong>Note Import Occupations :</strong> L'import des occupations requiert que le projet ou l'activité soit déjà enregistré(e) en base de données. Les lignes d'occupations non reconnues seront ignorées et téléchargées dans un fichier CSV de rejet. Les occupations sont rattachées automatiquement aux fréquentations du même projet/activité et du même jour.</div>
            </div>
        </div>
    );
}


function BackupSection() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleBackup = async () => {
        setLoading(true);
        setStatus("Préparation de la sauvegarde...");
        try {
            const response = await api.get('/backup/download', {
                responseType: 'blob'
            });
            
            // Create a blob link to download the file
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Get content-disposition header to parse filename
            const contentDisposition = response.headers['content-disposition'];
            let filename = `backup_database_${new Date().toISOString().slice(0, 10)}.sqlite`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setStatus("✓ Sauvegarde téléchargée avec succès");
        } catch (err) {
            console.error(err);
            setStatus("❌ Échec de la création de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    const groupStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #eee'
    };

    return (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={groupStyle}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Sauvegarder les données</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Télécharge une copie complète de la base de données actuelle dans votre dossier Téléchargements.</p>
                <div style={{ marginTop: '10px' }}>
                    <button 
                        onClick={handleBackup}
                        disabled={loading}
                        style={{ 
                            padding: '10px 20px', 
                            background: '#28a745', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>💾</span> {loading ? 'Génération...' : 'Télécharger la sauvegarde'}
                    </button>
                </div>
                {status && <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: status.includes('✓') ? '#28a745' : '#dc3545', fontWeight: '500' }}>{status}</p>}
            </div>
        </div>
    );
}


function ResetDatabaseSection() {
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const triggerBackupAndDownload = async () => {
        try {
            const response = await api.get('/backup/download', { responseType: 'blob' });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let filename = `backup_database_${new Date().toISOString().slice(0, 10)}.sqlite`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) filename = match[1];
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Backup failed during reset flow", err);
        }
    };

    const handleClearDatabase = async () => {
        if (confirmText !== 'supprimer') return;
        setLoading(true);
        setStatus("Réinitialisation en cours...");
        try {
            const res = await api.post('/database/clear', { confirm: true });
            setStatus(`✓ ${res.data.message}`);
            setShowConfirmModal(false);
            setConfirmText('');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Erreur lors de la réinitialisation";
            setStatus(`❌ ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const modalBackdropStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16
    };

    const modalContentStyle = {
        width: '100%',
        maxWidth: 520,
        background: '#fff',
        borderRadius: 10,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
    };

    return (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: '#fff0f0', borderRadius: '6px', border: '1px solid #ffc9c9' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#c92a2a' }}>Zone de danger</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#862e2e', lineHeight: 1.4 }}>
                    Cette action effacera toutes les données dynamiques liées aux visites (fréquentations, occupations de machines, participants et projets).
                    Les configurations de base (comptes d'utilisateurs, zones, outillages et types d'activité) seront conservées.
                </p>
                <div style={{ marginTop: '10px' }}>
                    <button 
                        onClick={() => { setShowWarningModal(true); setStatus(''); }}
                        style={{ 
                            padding: '10px 20px', 
                            background: '#dc3545', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '13px'
                        }}
                    >
                        🗑️ Vider la base de données
                    </button>
                </div>
                {status && <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: status.includes('✓') ? '#2b8a3e' : '#c92a2a', fontWeight: '500' }}>{status}</p>}
            </div>

            {/* Modal Étape 1 : Avertissement de sauvegarde */}
            {showWarningModal && (
                <div style={modalBackdropStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ margin: 0, color: '#c92a2a', fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            ⚠️ Attention requise
                        </h3>
                        <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.5, fontSize: 14 }}>
                            Vous êtes sur le point de réinitialiser la base de données. 
                            <strong>Il est fortement recommandé de télécharger une sauvegarde (backup)</strong> avant de supprimer définitivement vos données.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                            <button
                                type="button"
                                onClick={() => setShowWarningModal(false)}
                                style={{ border: '1px solid #d1d5db', background: '#fff', color: '#111827', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await triggerBackupAndDownload();
                                    setShowWarningModal(false);
                                    setShowConfirmModal(true);
                                }}
                                style={{ border: '1px solid #2b8a3e', background: '#2b8a3e', color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                            >
                                Sauvegarder & Continuer
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowWarningModal(false);
                                    setShowConfirmModal(true);
                                }}
                                style={{ border: '1px solid #dc3545', background: '#dc3545', color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                            >
                                Continuer sans sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Étape 2 : Confirmation textuelle */}
            {showConfirmModal && (
                <div style={modalBackdropStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ margin: 0, color: '#1f2937', fontSize: 20 }}>
                            Confirmation de la suppression
                        </h3>
                        <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.5, fontSize: 14 }}>
                            Pour confirmer la suppression définitive des données des visiteurs, veuillez saisir le mot exact <strong style={{ color: '#dc3545' }}>supprimer</strong> ci-dessous :
                        </p>
                        <input 
                            type="text" 
                            placeholder="Saisissez 'supprimer'"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmText('');
                                }}
                                style={{ border: '1px solid #d1d5db', background: '#fff', color: '#111827', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setShowWarningModal(true);
                                }}
                                style={{ border: '1px solid #d1d5db', background: '#f8f9fa', color: '#111827', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
                            >
                                Retour
                            </button>
                            <button
                                type="button"
                                onClick={handleClearDatabase}
                                disabled={confirmText !== 'supprimer' || loading}
                                style={{ 
                                    border: '1px solid #dc3545', 
                                    background: '#dc3545', 
                                    color: '#fff', 
                                    borderRadius: 6, 
                                    padding: '8px 16px', 
                                    cursor: confirmText === 'supprimer' && !loading ? 'pointer' : 'not-allowed', 
                                    fontWeight: 600, 
                                    fontSize: 13,
                                    opacity: confirmText === 'supprimer' && !loading ? 1 : 0.5
                                }}
                            >
                                {loading ? 'Suppression...' : 'Confirmer la suppression'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function Settings() {
    const { setDirty } = useDirtyTracker();
    const { showLeaveModal, confirmLeave, cancelLeave } = useNavigationGuard('settings');
    useBeforeUnload('settings');

    return (
        <div style={{ width: "100%", overflow: 'scroll' }} >
            <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#0061AA', fontSize: '24px' }}>Paramètres & Configurations</h2>
                </div>
                
                <div style={{
                    width: "100%",
                    maxWidth: "640px",
                    display: "flex",
                    flexDirection: "column",
                    padding: "1rem 0",
                    gap: "8px"
                    }}>
                    <AccordionItem title="Types d'Activité" content={<CrudSection title="Types d'Activité" endpoint="/type-activites" onDirty={(dirty) => setDirty('settings', dirty)} />} />
                    <AccordionItem title="Zones Occupées" content={<CrudSection title="Zones Occupées" endpoint="/zone-occupees" onDirty={(dirty) => setDirty('settings', dirty)} />} />
                    <AccordionItem title="Outillage / Machine" content={<CrudSection title="Outillage / Machine" endpoint="/outillages" onDirty={(dirty) => setDirty('settings', dirty)} />} />
                    <AccordionItem title="Import de données (Excel)" content={<ImportSection onDirty={(dirty) => setDirty('settings', dirty)} />} />
                    <AccordionItem title="Sauvegarde de la base de données" content={<BackupSection />} />
                    <AccordionItem title="Réinitialisation de la base de données" content={<ResetDatabaseSection />} />
                </div>
            </div>
            <ConfirmLeaveModal isOpen={showLeaveModal} onConfirm={confirmLeave} onCancel={cancelLeave} />
        </div>
    );
}

export default Settings;
