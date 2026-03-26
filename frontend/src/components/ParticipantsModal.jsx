import React, { useState, useEffect } from 'react';

const ParticipantsModal = ({ isOpen, onClose, participants = [], onSave }) => {
    const [list, setList] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setList(Array.isArray(participants) ? [...participants] : []);
            setInputValue('');
        }
    }, [isOpen, participants]);

    if (!isOpen) return null;

    const handleAdd = () => {
        const val = inputValue.trim();
        if (val && !list.includes(val)) {
            setList([...list, val]);
            setInputValue('');
        }
    };

    const handleRemove = (index) => {
        setList(list.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave(list);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2>Liste des Participants</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-form" style={{ padding: '20px' }}>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label>Ajouter un participant</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                placeholder="Nom du participant..."
                                style={{ flex: 1 }}
                            />
                            <button 
                                type="button" 
                                className="btn-primary-solid" 
                                onClick={handleAdd}
                                style={{ padding: '8px 15px' }}
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                    
                    <div className="participants-list" style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        padding: '10px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        border: '1px solid #eee'
                    }}>
                        {list.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>
                                Aucun participant ajouté.
                            </p>
                        ) : (
                            <div className="list-tags-container" style={{ flexDirection: 'column', gap: '5px' }}>
                                {list.map((name, index) => (
                                    <div key={index} className="list-tag" style={{ 
                                        width: '100%', 
                                        justifyContent: 'space-between',
                                        borderRadius: '6px',
                                        padding: '6px 12px'
                                    }}>
                                        <span>{name}</span>
                                        <button onClick={() => handleRemove(index)}>&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Annuler</button>
                    <button className="btn-primary-solid" onClick={handleSave}>Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantsModal;
