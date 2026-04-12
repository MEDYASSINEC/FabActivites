import React, { useState, useEffect } from 'react';

const AddRowModal = ({ isOpen, onClose, onSubmit, title, fields, externalFormData, setExternalFormData }) => {
    // Si externalFormData est fourni, on l'utilise (composant contrôlé)
    // Sinon on utilise un état interne (composant non contrôlé, backward compatibility)
    const [internalFormData, setInternalFormData] = useState({});
    
    const [pendingParticipant, setPendingParticipant] = useState('');
    
    const formData = externalFormData || internalFormData;
    const setFormData = setExternalFormData || setInternalFormData;

    const handleAddParticipant = (fieldKey) => {
        const val = pendingParticipant.trim();
        if (val) {
            const currentList = formData[fieldKey] || [];
            if (!currentList.includes(val)) {
                setFormData(prev => ({
                    ...prev,
                    [fieldKey]: [...currentList, val]
                }));
                setPendingParticipant('');
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            if (!setExternalFormData) setInternalFormData({});
            setPendingParticipant('');
        }
    }, [isOpen, setExternalFormData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
        if (!setExternalFormData) setInternalFormData({});
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" type="button" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        {fields.map(field => {
                            if (field.hidden) return null;
                            return (
                                <div key={field.key} className="form-group">
                                    <label>{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select 
                                            name={field.key} 
                                            onChange={handleChange} 
                                            required={field.required}
                                            value={formData[field.key] || ''}
                                            disabled={field.disabled}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {field.options.map(opt => (
                                                <option key={opt.value || opt} value={opt.value || opt}>
                                                    {opt.label || opt}
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === 'list' ? (
                                        <div className="list-input-container">
                                            <div className="list-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Ajouter un nom..."
                                                    value={pendingParticipant}
                                                    onChange={(e) => setPendingParticipant(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddParticipant(field.key);
                                                        }
                                                    }}
                                                    style={{ flex: 1 }}
                                                />
                                                <button 
                                                    type="button" 
                                                    className="btn-primary-solid"
                                                    style={{ padding: '8px 15px', fontSize: '12px' }}
                                                    onClick={() => handleAddParticipant(field.key)}
                                                >
                                                    Ajouter
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0 4px italic' }}>
                                                (Appuyez sur Entrée ou cliquez sur Ajouter)
                                            </p>
                                            <div className="list-tags-container">
                                                {(Array.isArray(formData[field.key]) ? formData[field.key] : []).map((item, idx) => (
                                                    <span key={idx} className="list-tag">
                                                        {item}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const currentList = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    [field.key]: currentList.filter((_, i) => i !== idx)
                                                                }));
                                                            }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : field.type === 'checkboxes' ? (
                                        <div className="checkboxes-container" style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                                            gap: '10px',
                                            padding: '10px',
                                            background: '#f9f9f9',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            maxHeight: '150px',
                                            overflowY: 'auto'
                                        }}>
                                            {field.options && field.options.length > 0 ? (
                                                (Array.isArray(field.options) ? field.options : []).map(opt => {
                                                    const val = opt.value || opt;
                                                    const label = opt.label || opt;
                                                    const currentSelection = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                                    const isChecked = currentSelection.includes(val);
                                                    
                                                    return (
                                                        <label key={val} style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '8px',
                                                            fontSize: '13px', 
                                                            cursor: 'pointer',
                                                            userSelect: 'none'
                                                        }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            [field.key]: [...currentSelection, val]
                                                                        }));
                                                                    } else {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            [field.key]: currentSelection.filter(v => v !== val)
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            {label}
                                                        </label>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '10px', color: '#666', fontSize: '13px' }}>
                                                    Aucun participant à sélectionner pour ce projet.
                                                </div>
                                            )}
                                        </div>
                                    ) : field.type === 'datalist' ? (
                                        <>
                                            <input
                                                type="text"
                                                name={field.key}
                                                placeholder={field.label}
                                                onChange={handleChange}
                                                required={field.required}
                                                value={formData[field.key] || ''}
                                                disabled={field.disabled}
                                                list={`${field.key}-list`}
                                            />
                                            <datalist id={`${field.key}-list`}>
                                                {field.options && Array.isArray(field.options) && field.options.map(opt => (
                                                    <option key={opt.value || opt} value={opt.value || opt}>
                                                        {opt.label || opt}
                                                    </option>
                                                ))}
                                            </datalist>
                                        </>
                                    ) : (
                                        <input
                                            type={field.type || 'text'}
                                            name={field.key}
                                            placeholder={field.label}
                                            onChange={handleChange}
                                            required={field.required}
                                            value={formData[field.key] || ''}
                                            disabled={field.disabled}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn-primary-solid">Ajouter</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRowModal;
