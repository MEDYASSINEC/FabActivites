import { useState, useEffect, useRef } from "react";

function FilterPopup({ col, allValues, currentFilter, currentSort, position, onClose, onApply }) {
  const [search, setSearch]       = useState("");
  const [checked, setChecked]     = useState(() => new Set(currentFilter || allValues));
  const [sortDir, setSortDir]     = useState(currentSort || null);
  const popupRef = useRef(null);

  const visible = search
    ? allValues.filter(v => v.toLowerCase().includes(search.toLowerCase()))
    : allValues;

  const toggleOne = (val) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  const toggleAll = () => {
    const allChecked = allValues.every(v => checked.has(v));
    setChecked(allChecked ? new Set() : new Set(allValues));
  };

  const handleOk = () => {
    onApply({
      filter: checked.size === allValues.length ? null : checked,
      sort: sortDir,
    });
  };

  const handleClear = () => onApply({ filter: null, sort: null });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 230),
        width: 220,
        background: "#fff",
        border: "1px solid #b0b0b0",
        borderRadius: 3,
        boxShadow: "2px 4px 12px rgba(0,0,0,0.18)",
        zIndex: 1000,
        fontSize: 12,
        fontFamily: "Segoe UI, Calibri, sans-serif",
      }}
    >
      {/* Sort section */}
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #e0e0e0" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#0061AA", marginBottom:5, textTransform:"uppercase", letterSpacing:".3px" }}>Trier</div>
        <div style={{ display:"flex", gap:4 }}>
          {["asc","desc"].map(dir => (
            <button key={dir}
              onClick={() => setSortDir(sortDir === dir ? null : dir)}
              className="btn-action"
              style={{
                flex:1, padding:"4px 6px",
                background: sortDir === dir ? "#0061AA" : "#f7f7f7",
                color: sortDir === dir ? "#fff" : "#333",
                fontSize:11,
              }}
            >
              {dir === "asc" ? "▲ A → Z" : "▼ Z → A"}
            </button>
          ))}
        </div>
      </div>

      {/* Filter section */}
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #e0e0e0" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#0061AA", marginBottom:5, textTransform:"uppercase", letterSpacing:".3px" }}>Filtrer par valeur</div>
        <span
          onClick={toggleAll}
          style={{ fontSize:11, color:"#0061AA", cursor:"pointer", display:"block", marginBottom:4 }}
        >
          {allValues.every(v => checked.has(v)) ? "Désélectionner tout" : "Sélectionner tout"}
        </span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{ width:"100%", border:"1px solid #c0c0c0", borderRadius:2, padding:"3px 6px", fontSize:12, outline:"none", marginBottom:5, fontFamily:"inherit" }}
        />
        <div style={{ maxHeight:140, overflowY:"auto" }}>
          {visible.map((val, i) => (
            <div key={val} className="filter-item" onClick={() => toggleOne(val)}>
              <input type="checkbox" id={`filt${i}`} checked={checked.has(val)} onChange={() => {}}
                style={{ accentColor:"#0061AA", cursor:"pointer" }} />
              <label htmlFor={`filt${i}`} style={{ cursor:"pointer", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {val || "(vide)"}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "6px 8px" }}>
        <button onClick={handleClear}
          className="btn-action btn-danger"
          style={{ width:"100%", padding:4, fontSize:11, marginBottom:5, background:"none", border:"1px solid #f0b0b0" }}>
          ✕ Effacer le filtre de cette colonne
        </button>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={onClose}
            className="btn-action"
            style={{ flex:1, padding:4, background:"#f3f3f3", color:"#333", border:"1px solid #c0c0c0" }}>
            Annuler
          </button>
          <button onClick={handleOk}
            className="btn-action btn-solid-primary"
            style={{ flex:1, padding:4, border:"none" }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterPopup;