import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import FilterPopup from "./FilterPopup";
import Toast from "./Toast";


function parseNum(s) {
    const n = parseFloat((s || "").replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? s.toLowerCase() : n;
}


// ── Main Component ────────────────────────────────────────────
export default function OccupationTable({ data, columns, getRowClassName, initialFilters }) {
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
    const tableWrapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });


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
    }, [data, rowFromApi]);

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
            const m = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
            if (m[e.key]) {
                e.preventDefault();
                const [dr, dc] = m[e.key];
                setSelCell(s => ({ row: Math.max(1, s.row + dr), col: Math.max(1, Math.min(columns.length, s.col + dc)) }));
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [selCell, visibleRows]);

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
        <div style={{ display: "flex", flexDirection: "column", fontFamily: F, fontSize: 13, flex: 1, overflow: 'auto'  }}>


            {/* Ribbon bar */}
            <div style={{ background: "#f3f3f3", borderBottom: "1px solid #c8c8c8", display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", minHeight: 38, flexWrap: "wrap" }}>


                {/* Clear filters */}
                <button onClick={clearAll} className="btn-ribbon" style={{ paddingRight: 10, borderRight: "1px solid #d0d0d0", marginRight: 4 }}>
                    ✕ Effacer filtres
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
                <table style={{ borderCollapse: "collapse", marginBottom: '25px', width: '100vw' }}>
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
                                        const isSel = selCell.row === ri + 2 && selCell.col === ci;

                                        return (
                                            <td key={ci}
                                                onClick={() => setSelCell({ row: ri + 2, col: ci })}
                                                style={{
                                                    border: "1px solid #d0d0d0", borderTop: "none", borderLeft: "none",
                                                    height: 20, padding: "0 5px",
                                                    cursor: "cell", whiteSpace: "nowrap", overflow: "hidden",
                                                    fontSize: 12, verticalAlign: "middle",
                                                    background: isSel ? "#e6f3f9" : isRowSel ? "#cce8f4" : ri % 2 === 1 ? "#f5fbfd" : "#fff",
                                                    outline: isSel ? "2px solid #2B9CB8" : undefined,
                                                    outlineOffset: isSel ? -2 : undefined,
                                                    textAlign: ci >= 2 && ci <= 6 ? "right" : ci === 7 ? "right" : "left",
                                                    fontWeight: 400,
                                                }}
                                            >
                                                {val}
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
        </div>
    );
}