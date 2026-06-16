import { useState, useEffect } from 'react';
import axios from 'axios';
import AccordionItem from '../components/AccordionItem';
import { useDirtyTracker } from '../context/DirtyTrackerContext';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

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
    const [projectFile, setProjectFile] = useState(null);
    const [frequentationFile, setFrequentationFile] = useState(null);
    const [loading, setLoading] = useState({ projects: false, frequentations: false });
    const [status, setStatus] = useState({ projects: "", frequentations: "" });

    const handleImport = async (type) => {
        const file = type === 'projects' ? projectFile : frequentationFile;
        if (!file) return;

        setLoading(prev => ({ ...prev, [type]: true }));
        setStatus(prev => ({ ...prev, [type]: "Importation en cours..." }));

        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = type === 'projects' ? '/import/projects' : '/import/frequentations';
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus(prev => ({ ...prev, [type]: `✓ ${res.data.message}` }));
            onDirty(false);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Erreur lors de l'import";
            setStatus(prev => ({ ...prev, [type]: `❌ ${msg}` }));
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
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
        gap: '10px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #eee'
    };

    return (
        <div style={sectionStyle}>
            {/* Import Projets */}
            <div style={groupStyle}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Importer des Projets</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Format supporté: .xlsx, .xls, .csv (Feuille "projets")</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                    <input 
                        type="file" 
                        onChange={(e) => { setProjectFile(e.target.files[0]); onDirty(true); }}
                        style={{ fontSize: '12px', flex: 1 }}
                        accept=".xlsx, .xls, .csv"
                    />
                    <button 
                        onClick={() => handleImport('projects')}
                        disabled={!projectFile || loading.projects}
                        style={{ 
                            padding: '8px 16px', 
                            background: '#0061AA', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: projectFile && !loading.projects ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            opacity: projectFile && !loading.projects ? 1 : 0.6
                        }}
                    >
                        {loading.projects ? 'Import...' : 'Importer Projets'}
                    </button>
                </div>
                {status.projects && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: status.projects.includes('✓') ? '#28a745' : '#dc3545', fontWeight: '500' }}>{status.projects}</p>}
            </div>

            {/* Import Fréquentations */}
            <div style={groupStyle}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Importer des Fréquentations</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Format supporté: .xlsx, .xls, .csv (Feuille "frequentations")</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                    <input 
                        type="file" 
                        onChange={(e) => { setFrequentationFile(e.target.files[0]); onDirty(true); }}
                        style={{ fontSize: '12px', flex: 1 }}
                        accept=".xlsx, .xls, .csv"
                    />
                    <button 
                        onClick={() => handleImport('frequentations')}
                        disabled={!frequentationFile || loading.frequentations}
                        style={{ 
                            padding: '8px 16px', 
                            background: '#0061AA', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: frequentationFile && !loading.frequentations ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            opacity: frequentationFile && !loading.frequentations ? 1 : 0.6
                        }}
                    >
                        {loading.frequentations ? 'Import...' : 'Importer Fréquentations'}
                    </button>
                </div>
                {status.frequentations && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: status.frequentations.includes('✓') ? '#28a745' : '#dc3545', fontWeight: '500' }}>{status.frequentations}</p>}
            </div>

            <div style={{ padding: '10px', background: '#fff9db', borderRadius: '4px', border: '1px solid #fab005', fontSize: '11px', color: '#856404' }}>
                <strong>Note:</strong> L'import des fréquentations tentera de lier chaque ligne à un projet existant par son nom. Si aucun projet ne correspond, une nouvelle activité sera créée.
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
                </div>
            </div>
            <ConfirmLeaveModal isOpen={showLeaveModal} onConfirm={confirmLeave} onCancel={cancelLeave} />
        </div>
    );
}

export default Settings;
