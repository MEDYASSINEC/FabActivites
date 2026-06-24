import { useState } from 'react';

const MONTHS = (() => {
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        });
    }
    return result;
})();

const MODES = [
    { key: 'single', label: 'Mois unique', hint: 'Sélectionnez un mois' },
    { key: 'successive', label: 'Successifs', hint: 'Sélectionnez le mois de début — jusqu\'au mois actuel' },
    { key: 'all', label: 'Tous', hint: 'Tous les mois sont sélectionnés' },
];

export default function MonthPicker({ mois, setMois }) {
    const [mode, setMode] = useState('single');

    const handleModeChange = (m) => {
        setMode(m);
        setMois(m === 'all' ? MONTHS.map(x => x.value) : []);
    };

    const handleChipClick = (val) => {
        if (mode === 'single') {
            setMois(mois[0] === val ? [] : [val]);
        } else if (mode === 'successive') {
            const idx = MONTHS.findIndex(m => m.value === val);
            setMois(MONTHS.slice(idx).map(m => m.value));
        }
    };

    const hint = MODES.find(m => m.key === mode)?.hint;

    const getChipStyle = (val) => {
        const isFirst = mode === 'successive' && mois[0] === val;
        const isInRange = mode === 'successive' && mois.includes(val) && !isFirst;
        const isSelected = mode !== 'successive' && mois.includes(val);

        if (isFirst || isSelected) return { background: '#3182ce', color: '#fff', borderColor: '#3182ce' };
        if (isInRange) return { background: '#bee3f8', color: '#2b6cb0', borderColor: '#90cdf4' };
        return {};
    };

    return (
        <div>
            {/* Mode toggle */}
            <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', width: 'fit-content', marginBottom: '16px' }}>
                {MODES.map(({ key, label }, i) => (
                    <button key={key} onClick={() => handleModeChange(key)} style={{
                        padding: '8px 16px', border: 'none',
                        borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none',
                        cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                        background: mode === key ? '#3182ce' : '#fff',
                        color: mode === key ? '#fff' : '#4a5568',
                        transition: 'all 0.15s'
                    }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Hint */}
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '10px', marginTop: 0 }}>{hint}</p>

            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {MONTHS.map(m => (
                    <div key={m.value}
                        onClick={() => mode !== 'all' && handleChipClick(m.value)}
                        style={{
                            padding: '7px 14px', fontSize: '13px', fontWeight: '500',
                            borderRadius: '999px', border: '1px solid #e2e8f0',
                            cursor: mode === 'all' ? 'default' : 'pointer',
                            background: '#fff', color: '#4a5568',
                            opacity: mode === 'all' ? 0.6 : 1,
                            transition: 'all 0.15s', userSelect: 'none',
                            ...getChipStyle(m.value)
                        }}>
                        {m.label}
                    </div>
                ))}
            </div>
        </div>
    );
}