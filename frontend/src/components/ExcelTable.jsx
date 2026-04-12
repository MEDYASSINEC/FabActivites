import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import FilterPopup from "./FilterPopup";
import Toast from "./Toast";
import ParticipantsModal from "./ParticipantsModal";


function parseNum(s) {
    const n = parseFloat((s || "").replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? s.toLowerCase() : n;
}


// ── Main Component ────────────────────────────────────────────
export default function ExcelTable({ data, columns, onDelete, onSave, addRow, getRowClassName, initialFilters, onDuplicate, onDirtyChange }) {
    const rowFromApi = useCallback((obj) => ({
        id: obj.id,
        cells: ["", ...columns.map(c => obj[c.key] ?? "")],
        _raw: obj,
    }), [columns]);

    const [dataRows, setDataRows] = useState(() => data.map(rowFromApi));
    const [colFilters, setColFilters] = useState({});
    const [colSorts, setColSorts] = useState({});
    const [selCell, setSelCell] = useState({ row: 1, col: 1 });
    const [selRows, setSelRows] = useState(new Set()); // selected row ids
    const [popup, setPopup] = useState(null);
    const [toast, setToast] = useState({ msg: "", visible: false });
    const toastTimer = useRef(null);
    const [editCell, setEditCell] = useState(null); // { row, col } or null
    const [editValue, setEditValue] = useState("");
    const editRef = useRef(null);
    const [pendingChanges, setPendingChanges] = useState(new Map()); // id -> row modifiée
    const [pendingDeletes, setPendingDeletes] = useState(new Set()); // ids supprimés
    const tableWrapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
    const [participantsModal, setParticipantsModal] = useState({ isOpen: false, data: [], rowId: null });

    const startEdit = (ri, ci, val) => {
        setEditCell({ row: ri, col: ci });
        setEditValue(val);
        setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 0);
    };

    const commitEdit = (ri, ci) => {
        setDataRows(prev => prev.map((r, idx) => {
            if (idx !== ri - 2) return r;
            const cells = [...r.cells];
            cells[ci] = editValue;
            const updated = { ...r, cells };
            // reconstruire l'objet _raw avec la nouvelle valeur
            const colKey = columns[ci - 1]?.key;
            const newRaw = { ...r._raw, [colKey]: editValue };
            updated._raw = newRaw;
            // tracker la modification
            setPendingChanges(prev => new Map(prev).set(r.id, newRaw));
            return updated;
        }));
        setEditCell(null);
    };

    const cancelEdit = () => setEditCell(null);

    const onMouseDown = e => {
        if (e.button !== 2) return; // clic droit uniquement
        e.preventDefault();
        const wrap = tableWrapRef.current;
        setIsDragging(true);
        setDragStart({ x: e.clientX, scrollLeft: wrap.scrollLeft });
        wrap.style.cursor = "grabbing";
        wrap.style.userSelect = "none";
    };

    const onMouseMove = e => {
        if (!isDragging) return;
        const wrap = tableWrapRef.current;
        const dx = e.clientX - dragStart.x;
        wrap.scrollLeft = dragStart.scrollLeft - dx;
    };

    const onMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const wrap = tableWrapRef.current;
        wrap.style.cursor = "";
        wrap.style.userSelect = "";
    };

    const onContextMenu = e => e.preventDefault(); // bloquer le menu contextuel

    useEffect(() => {
        const h = () => onMouseUp();
        window.addEventListener("mouseup", h);
        return () => window.removeEventListener("mouseup", h);
    }, [isDragging]);

    const showToast = msg => {
        clearTimeout(toastTimer.current);
        setToast({ msg, visible: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    };



    // ── Visible rows after filter+sort ──
    const visibleRows = useMemo(() => {
        let rows = [...dataRows];
        Object.entries(colFilters).forEach(([ci, allowed]) => {
            if (allowed?.size > 0) rows = rows.filter(r => allowed.has(r.cells[+ci]));
        });
        const se = Object.entries(colSorts);
        if (se.length) {
            const [ci, dir] = se[se.length - 1];
            const colDef = columns[+ci - 1];
            const isDate = colDef?.type === 'date';

            rows.sort((a, b) => {
                const av = a.cells[+ci];
                const bv = b.cells[+ci];

                if (isDate) {
                    const da = av ? new Date(av).getTime() : 0;
                    const db = bv ? new Date(bv).getTime() : 0;
                    return dir === "asc" ? da - db : db - da;
                }

                const an = parseNum(av), bn = parseNum(bv);
                if (typeof an === "number" && typeof bn === "number")
                    return dir === "asc" ? an - bn : bn - an;
                return dir === "asc"
                    ? String(av).localeCompare(String(bv), "fr")
                    : String(bv).localeCompare(String(av), "fr");
            });
        }
        return rows;
    }, [dataRows, colFilters, colSorts]);


    // ── Row selection ──
    const toggleRowSel = (id, e) => {
        if (e.ctrlKey || e.metaKey) {
            setSelRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        } else {
            setSelRows(prev => prev.size === 1 && prev.has(id) ? new Set() : new Set([id]));
        }
    };

    // ── Duplicate selected rows (for Frequentation) ──
    const duplicateSelected = () => {
        if (selRows.size === 0) { showToast("Aucune ligne sélectionnée"); return; }
        if (!onDuplicate) { showToast("Duplication non disponible"); return; }

        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        const newRows = [];
        selRows.forEach(id => {
            const originalRow = dataRows.find(r => r.id === id);
            if (!originalRow) return;

            // Créer une copie avec des données modifiées
            const newId = `new-${Date.now()}-${Math.random()}`; // ID temporaire unique
            const newCells = [...originalRow.cells];

            // Trouver les indices pour heur_debut et heur_fin
            const heurDebutIdx = columns.findIndex(c => c.key === 'heur_debut') + 1;
            const heurFinIdx = columns.findIndex(c => c.key === 'heur_fin') + 1;

            // Modifier les cellules
            if (heurDebutIdx > 0) newCells[heurDebutIdx] = currentTime;
            if (heurFinIdx > 0) newCells[heurFinIdx] = '';

            // Créer le nouvel objet brut
            const newRaw = { ...originalRow._raw };
            newRaw._is_new = true; // Flag pour indiquer que c'est une nouvelle ligne
            newRaw.heur_debut = currentTime;
            newRaw.heur_fin = '';
            delete newRaw.id; // supprimer l'id pour créer un nouvel enregistrement

            newRows.push({
                id: newId,
                cells: newCells,
                _raw: newRaw,
            });
        });

        setDataRows(prev => [...prev, ...newRows]);

        // Tracker les nouvelles lignes comme changements
        newRows.forEach(row => {
            setPendingChanges(prev => new Map(prev).set(row.id, row._raw));
        });

        showToast(`${newRows.length} ligne${newRows.length > 1 ? "s" : ""} dupliquée${newRows.length > 1 ? "s" : ""}`);
    };

    // ── Delete selected rows ──
    const deleteSelected = () => {
        if (selRows.size === 0) { showToast("Aucune ligne sélectionnée"); return; }
        const n = selRows.size;
        // tracker les suppressions
        setPendingDeletes(prev => {
            const next = new Set(prev);
            selRows.forEach(id => next.add(id));
            return next;
        });
        // retirer aussi des pendingChanges si modifié puis supprimé
        setPendingChanges(prev => {
            const next = new Map(prev);
            selRows.forEach(id => next.delete(id));
            return next;
        });
        setDataRows(prev => prev.filter(r => !selRows.has(r.id)));
        showToast(`${n} ligne${n > 1 ? "s" : ""} supprimée${n > 1 ? "s" : ""}`);
        setSelRows(new Set());
    };

    // ── Copy to clipboard ──
    const copyToClipboard = () => {
        const rows = selRows.size > 0 ? visibleRows.filter(r => selRows.has(r.id)) : visibleRows;
        const lines = [columns.map(c => c.label).join("\t"), ...rows.map(r => r.cells.slice(1).join("\t"))];
        navigator.clipboard.writeText(lines.join("\n")).then(() => showToast("Copié dans le presse-papiers ✓")).catch(() => showToast("Erreur de copie"));
    };

    // ── Export XLSX (via SheetJS) ──
    const exportXlsx = () => {
        if (!window.XLSX) { showToast("Chargement de SheetJS…"); return; }
        const rows = selRows.size > 0 ? visibleRows.filter(r => selRows.has(r.id)) : visibleRows;
        const wsData = [
            columns.map(c => c.label),
            ...rows.map(r => r.cells.slice(1)),
        ];
        const wb = window.XLSX.utils.book_new();
        const ws = window.XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = columns.map(c => ({ wch: Math.max(c.label.length + 2, 14) }));
        window.XLSX.utils.book_append_sheet(wb, ws, "Projets");
        window.XLSX.writeFile(wb, "projets.xlsx");
        showToast("Export Excel téléchargé ✓");
    };

    // ── Filter popup ──
    const openPopup = (ci, e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        if (popup?.col === ci) { setPopup(null); return; }
        setPopup({ col: ci, position: { top: rect.bottom + 2, left: rect.left } });
    };

    const applyFilter = ({ filter, sort }) => {
        setColFilters(prev => { const n = { ...prev }; filter === null ? delete n[popup.col] : (n[popup.col] = filter); return n; });
        setColSorts(prev => { const n = {}; sort === null ? delete n[popup.col] : (n[popup.col] = sort); return n; });
        setPopup(null);
    };

    const clearAll = () => { setColFilters({}); setColSorts({}); };

    useEffect(() => {
        setDataRows(data.map(rowFromApi));
    }, [data]);

    useEffect(() => {
        if (!onDirtyChange) return;
        onDirtyChange(pendingChanges.size > 0 || pendingDeletes.size > 0);
    }, [onDirtyChange, pendingChanges, pendingDeletes]);

    // ── Apply initial filters from URL params ──
    useEffect(() => {
        if (!initialFilters || Object.keys(initialFilters).length === 0) return;
        const filters = {};
        Object.entries(initialFilters).forEach(([key, allowedValues]) => {
            const colIdx = columns.findIndex(c => c.key === key);
            if (colIdx !== -1) {
                filters[colIdx + 1] = new Set(allowedValues);
            }
        });
        setColFilters(filters);
    }, [initialFilters]);

    // ── Keyboard nav ──
    useEffect(() => {
        const h = e => {
            if (editCell) return; // laisser l'input gérer les touches
            const m = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
            if (m[e.key]) {
                e.preventDefault();
                const [dr, dc] = m[e.key];
                setSelCell(s => ({ row: Math.max(1, s.row + dr), col: Math.max(1, Math.min(columns.length, s.col + dc)) }));
            }
            if (e.key === "F2") {
                // entrer en mode édition sur la cellule sélectionnée
                const vis = visibleRows;
                if (selCell.row >= 2 && selCell.row <= vis.length + 1) {
                    const val = vis[selCell.row - 2]?.cells[selCell.col] || "";
                    startEdit(selCell.row, selCell.col, val);
                }
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [editCell, selCell, visibleRows]);

    // ── Load SheetJS ──
    useEffect(() => {
        if (window.XLSX) return;
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        document.head.appendChild(s);
    }, []);

    // ── Styles helpers ──
    const F = "Segoe UI,Calibri,sans-serif";

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: 'auto', fontFamily: F, fontSize: 13 }}>


            {/* Ribbon bar */}
            <div style={{ background: "#f3f3f3", borderBottom: "1px solid #c8c8c8", display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", minHeight: 38, flexWrap: "wrap" }}>


                <button
                    onClick={addRow}
                    title="Ajouter une ligne"
                    className="btn-action btn-primary"
                >
                    <span style={{ fontSize: 20, fontWeight: "bold" }}>+</span>
                    <span style={{ fontSize: 13 }}>Ajouter</span>
                </button>

                {/* Clear filters */}
                <button onClick={clearAll} className="btn-ribbon" style={{ paddingRight: 10, borderRight: "1px solid #d0d0d0", marginRight: 4 }}>
                    ✕ Effacer filtres
                </button>

                {/* ── Action buttons ── */}
                {onDuplicate && (
                    <button
                        onClick={duplicateSelected}
                        disabled={selRows.size === 0}
                        title={selRows.size > 0 ? `Dupliquer ${selRows.size} ligne(s)` : "Sélectionnez des lignes d'abord"}
                        className={`btn-action ${selRows.size > 0 ? 'btn-primary' : ''}`}
                    >
                        <span style={{ fontSize: 14 }}>📋</span>
                        Dupliquer{selRows.size > 0 ? ` (${selRows.size})` : ""}
                    </button>
                )}

                <button
                    onClick={deleteSelected}
                    disabled={selRows.size === 0}
                    title={selRows.size > 0 ? `Supprimer ${selRows.size} ligne(s)` : "Sélectionnez des lignes d'abord"}
                    className={`btn-action ${selRows.size > 0 ? 'btn-danger' : ''}`}
                >
                    <span style={{ fontSize: 14 }}>🗑</span>
                    Supprimer{selRows.size > 0 ? ` (${selRows.size})` : ""}
                </button>

                <button
                    onClick={copyToClipboard}
                    title="Copier dans le presse-papiers"
                    className="btn-action btn-primary"
                >
                    <span style={{ fontSize: 13 }}>⧉</span>
                    {selRows.size > 0 ? `Copier (${selRows.size})` : "Copier tout"}
                </button>

                <button
                    onClick={exportXlsx}
                    title="Exporter en .xlsx"
                    className="btn-action btn-success"
                >
                    <span style={{ fontSize: 13 }}>↓</span>
                    {selRows.size > 0 ? `Exporter (${selRows.size})` : "Exporter .xlsx"}
                </button>

                <div style={{ width: 1, height: 22, background: "#d0d0d0", margin: "0 2px" }} />
                <button
                    onClick={async () => {
                        const changes = [...pendingChanges.values()];
                        const deletes = [...pendingDeletes];
                        if (changes.length === 0 && deletes.length === 0) {
                            showToast("Aucune modification à sauvegarder");
                            return;
                        }
                        try {
                            if (deletes.length > 0 && onDelete) await onDelete(deletes);
                            if (changes.length > 0 && onSave) await onSave(changes);
                            setPendingChanges(new Map());
                            setPendingDeletes(new Set());
                            showToast(`Sauvegardé — ${changes.length} modif., ${deletes.length} suppression(s) ✓`);
                        } catch (err) {
                            showToast("Erreur lors de la sauvegarde ✗");
                            console.error(err);
                        }
                    }}
                    className="btn-action btn-solid-primary"
                    style={{ position: "relative", padding: "4px 14px" }}
                >
                    <span style={{ fontSize: 13 }}>💾</span>
                    Sauvegarder
                    {(pendingChanges.size > 0 || pendingDeletes.size > 0) && (
                        <span style={{
                            position: "absolute", top: -6, right: -6,
                            background: "#e74c3c", color: "#fff",
                            borderRadius: "50%", width: 16, height: 16,
                            fontSize: 10, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {pendingChanges.size + pendingDeletes.size}
                        </span>
                    )}
                </button>

                {/* Selection hint */}
                {selRows.size === 0 && (
                    <span style={{ fontSize: 11, color: "#999", marginLeft: 4 }}>
                        Cliquez sur № de ligne pour sélectionner · Ctrl+clic pour multi-sélection
                    </span>
                )}
            </div>

            {/* Table */}
            <div
                ref={tableWrapRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onContextMenu={onContextMenu}
                style={{ flex: 1, overflow: "auto", background: "#F0F4F8", cursor: isDragging ? "grabbing" : "default" }}
            >
                <table style={{ borderCollapse: "collapse", tableLayout: "fixed", marginBottom: "25px" }}>
                    <thead>
                        {/* Column header row — avec filtres */}
                        <tr>
                            <td style={{ background: "#f0f0f0", border: "1px solid #c0c0c0", borderTop: "none", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#444", width: 36, padding: "0 4px", position: "sticky", left: 0, top: 0, zIndex: 15 }}></td>
                            {columns.map((col, i) => {
                                const ci = i + 1;
                                const val = col.label;
                                const hasF = colFilters[ci]?.size > 0;
                                const hasS = colSorts[ci];
                                return (
                                    <td key={i}
                                        onClick={e => openPopup(ci, e)}
                                        style={{
                                            background: hasF ? "#004f8a" : "#0061AA",
                                            color: "#fff", fontWeight: 700,
                                            border: "1px solid rgba(0,0,0,0.15)", borderTop: "none", borderLeft: "none",
                                            height: 20, padding: "0 5px", fontSize: 12, verticalAlign: "middle",
                                            cursor: "pointer", userSelect: "none",
                                            position: "sticky", top: 0, zIndex: 10,
                                            outline: selCell.row === 1 && selCell.col === ci ? "2px solid #2B9CB8" : undefined,
                                            outlineOffset: -2,
                                            padding: '2px 15px'
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
                                            <span>{val}</span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 2, opacity: 0.85 }}>
                                                {hasS && <span style={{ fontSize: 8 }}>{hasS === "asc" ? "▲" : "▼"}</span>}
                                                <span style={{ fontSize: 9 }}>{hasF ? "●" : ""}</span>
                                            </span>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>

                    </thead>
                    <tbody>

                        {/* Data rows */}
                        {visibleRows.map((row, ri) => {
                            const isRowSel = selRows.has(row.id);
                            const customRowClass = getRowClassName ? getRowClassName(row._raw) : '';
                            return (
                                <tr key={row.id} className={customRowClass} style={{ background: isRowSel ? "#cce8f4" : ri % 2 === 1 ? "#f5fbfd" : "#fff" }}>
                                    <td
                                        onClick={e => toggleRowSel(row.id, e)}
                                        title="Cliquez pour sélectionner · Ctrl+clic pour multi"
                                        style={{ background: isRowSel ? "#2B9CB8" : "#f0f0f0", border: "1px solid #c0c0c0", borderTop: "none", textAlign: "center", fontSize: 11, fontWeight: 600, color: isRowSel ? "#fff" : "#444", padding: "0 4px", position: "sticky", left: 0, zIndex: 5, cursor: "pointer", userSelect: "none", transition: "background .1s" }}
                                    >
                                        {ri + 1}
                                    </td>
                                    {row.cells.slice(1).map((val, idx) => {
                                        const ci = idx + 1;
                                        const isPct = false;
                                        const isNeg = false;
                                        const isPos = false;
                                        const isSel = selCell.row === ri + 2 && selCell.col === ci;
                                        const isEditing = editCell?.row === ri + 2 && editCell?.col === ci;

                                        return (
                                            <td key={ci}
                                                onClick={() => setSelCell({ row: ri + 2, col: ci })}
                                                onDoubleClick={() => startEdit(ri + 2, ci, val)}
                                                style={{
                                                    border: "1px solid #d0d0d0", borderTop: "none", borderLeft: "none",
                                                    height: 20, padding: isEditing ? 0 : "0 5px",
                                                    cursor: "cell", whiteSpace: "nowrap", overflow: "hidden",
                                                    fontSize: 12, verticalAlign: "middle",
                                                    background: isSel && !isEditing ? "#e6f3f9" : isRowSel ? "#cce8f4" : ri % 2 === 1 ? "#f5fbfd" : "#fff",
                                                    outline: isSel && !isEditing ? "2px solid #2B9CB8" : undefined,
                                                    outlineOffset: isSel ? -2 : undefined,
                                                    textAlign: "left",
                                                    fontWeight: isPct ? 600 : 400,
                                                    color: isNeg ? "#c0392b" : isPos ? "#27ae60" : isPct ? "#0061AA" : undefined,
                                                }}
                                            >
                                                {isEditing ? (
                                                    columns[ci - 1]?.type === 'select' || columns[ci - 1]?.type === 'datalist' ? (
                                                        <>
                                                            <input
                                                                ref={editRef}
                                                                list={`datalist-${ci}`}
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                onBlur={() => commitEdit(ri + 2, ci)}
                                                                onKeyDown={e => {
                                                                    if (e.key === "Enter") {
                                                                        commitEdit(ri + 2, ci);
                                                                    } else if (e.key === "Tab") {
                                                                        e.preventDefault();
                                                                        commitEdit(ri + 2, ci);
                                                                        const nextCol = ci + 1;
                                                                        setSelCell(s => ({ ...s, col: Math.min(columns.length, s.col + 1) }));
                                                                        if (nextCol <= columns.length) startEdit(ri + 2, nextCol, row.cells[nextCol] || "");
                                                                    } else if (e.key === "Escape") {
                                                                        cancelEdit();
                                                                    }
                                                                }}
                                                                style={{
                                                                    width: "100%", height: "100%",
                                                                    border: "none", outline: "2px solid #0061AA",
                                                                    outlineOffset: -1,
                                                                    padding: "0 4px",
                                                                    fontSize: 12, fontFamily: "Segoe UI,Calibri,sans-serif",
                                                                    background: "#fff",
                                                                    color: "#1a1a1a",
                                                                    boxSizing: "border-box",
                                                                }}
                                                            />
                                                            <datalist id={`datalist-${ci}`}>
                                                                {columns[ci - 1].options?.map((opt, oIdx) => (
                                                                    <option key={oIdx} value={typeof opt === 'object' ? opt.value : opt}>
                                                                        {typeof opt === 'object' ? opt.label : opt}
                                                                    </option>
                                                                ))}
                                                            </datalist>
                                                        </>
                                                    ) : (
                                                        <input
                                                            ref={editRef}
                                                            type={columns[ci - 1]?.type === 'date' ? 'date' : columns[ci - 1]?.type === 'time' ? 'time' : 'text'}
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onBlur={() => commitEdit(ri + 2, ci)}
                                                            onKeyDown={e => {
                                                                if (e.key === "Enter") {
                                                                    commitEdit(ri + 2, ci);
                                                                } else if (e.key === "Tab") {
                                                                    e.preventDefault();
                                                                    commitEdit(ri + 2, ci);
                                                                    const nextCol = ci + 1;
                                                                    setSelCell(s => ({ ...s, col: Math.min(columns.length, s.col + 1) }));
                                                                    if (nextCol <= columns.length) startEdit(ri + 2, nextCol, row.cells[nextCol] || "");
                                                                } else if (e.key === "Escape") {
                                                                    cancelEdit();
                                                                }
                                                            }}
                                                            style={{
                                                                width: "100%", height: "100%",
                                                                border: "none", outline: "2px solid #0061AA",
                                                                outlineOffset: -1,
                                                                padding: "0 4px",
                                                                fontSize: 12, fontFamily: "Segoe UI,Calibri,sans-serif",
                                                                background: "#fff",
                                                                color: isNeg ? "#c0392b" : isPos ? "#27ae60" : isPct ? "#0061AA" : "#1a1a1a",
                                                                fontWeight: isPct ? 600 : 400,
                                                                textAlign: columns[ci - 1]?.type === 'date' ? "left" : (!isNaN(parseFloat((val || "").replace(/\s/g, ""))) ? "right" : "left"),
                                                                boxSizing: "border-box",
                                                            }}
                                                        />
                                                    )
                                                ) : columns[ci - 1]?.key === 'participants' ? (
                                                    <span
                                                        className="participant-count-cell"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setParticipantsModal({
                                                                isOpen: true,
                                                                data: Array.isArray(val) ? val : [],
                                                                rowId: row.id,
                                                                colIdx: ci
                                                            });
                                                        }}
                                                    >
                                                        {Array.isArray(val) ? val.length : 0} participant(s)
                                                    </span>
                                                ) : val}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Filter popup */}
            {popup && (
                <FilterPopup
                    col={popup.col}
                    allValues={(() => {
                        const colDef = columns[popup.col - 1];
                        const vals = [...new Set(dataRows.map(r => r.cells[popup.col]))];
                        if (colDef?.type === 'date') {
                            return vals.sort((a, b) => {
                                const da = a ? new Date(a).getTime() : 0;
                                const db = b ? new Date(b).getTime() : 0;
                                return da - db;
                            });
                        }
                        return vals.sort((a, b) =>
                            String(a ?? '').localeCompare(String(b ?? ''), "fr")
                        );
                    })()}
                    currentFilter={colFilters[popup.col] || null}
                    currentSort={colSorts[popup.col] || null}
                    position={popup.position}
                    onClose={() => setPopup(null)}
                    onApply={applyFilter}
                />
            )}

            {/* Toast */}
            <Toast msg={toast.msg} visible={toast.visible} />

            {/* Participants Modal */}
            <ParticipantsModal
                isOpen={participantsModal.isOpen}
                participants={participantsModal.data}
                onClose={() => setParticipantsModal({ ...participantsModal, isOpen: false })}
                onSave={(newList) => {
                    const { rowId, colIdx } = participantsModal;
                    setDataRows(prev => prev.map(r => {
                        if (r.id !== rowId) return r;
                        const cells = [...r.cells];
                        cells[colIdx] = newList;
                        const newRaw = { ...r._raw, [columns[colIdx - 1].key]: newList };
                        setPendingChanges(prev => new Map(prev).set(rowId, newRaw));
                        return { ...r, cells, _raw: newRaw };
                    }));
                }}
            />
        </div>
    );
}