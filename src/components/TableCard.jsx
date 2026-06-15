/**
 * TableCard — Mobile card view, exact same props as Table.jsx
 *
 * Use both together in every page:
 *   <Table     {...props} />   ← hidden on mobile, visible on md+
 *   <TableCard {...props} />   ← visible on mobile, hidden on md+
 *
 * Props are 100% identical to Table.jsx (client-side & server-side both supported).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { FaChevronLeft, FaChevronRight, FaSearch, FaChevronDown, FaCheck } from "react-icons/fa";

// ── Custom Select (same as Table) ─────────────────────────────
function CustomSelect({ value, onChange, options, placeholder }) {
  const { themeColors } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium w-full"
        style={{ backgroundColor: themeColors.background, borderColor: open ? themeColors.primary : themeColors.border, color: themeColors.text }}>
        <span className="flex-1 text-left truncate">{selected ? selected.label : placeholder}</span>
        <FaChevronDown style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden w-full"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, top: "100%", left: 0 }}>
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:opacity-80"
              style={{ backgroundColor: String(value) === String(opt.value) ? themeColors.primary + "15" : "transparent", color: String(value) === String(opt.value) ? themeColors.primary : themeColors.text }}>
              <span>{opt.label}</span>
              {String(value) === String(opt.value) && <FaCheck className="text-[10px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getPageNumbers(current, total) {
  const max = 5;
  let start = Math.max(1, current - Math.floor(max / 2));
  let end   = Math.min(total, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

const DEFAULT_ENTRIES = [10, 25, 50, 100];

export default function TableCard({
  columns        = [],
  data           = [],
  actions        = [],
  filters        = [],
  loading        = false,
  rowKey         = "_id",
  entriesOptions = DEFAULT_ENTRIES,
  searchPlaceholder = "Search...",
  debounceMs     = 500,

  // server-side
  serverSide     = false,
  pagination     = null,
  onPageChange   = null,
  onLimitChange  = null,
  onSearchChange = null,
  onFilterChange = null,
}) {
  const { themeColors } = useTheme();

  const [limit, setLimit]             = useState(entriesOptions[0]);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef                   = useRef(null);

  const [clientPage, setClientPage]     = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const [filterValues, setFilterValues] = useState(() =>
    filters.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})
  );

  const activePage = serverSide ? (pagination?.page ?? 1) : clientPage;
  const totalPages = serverSide
    ? (pagination?.totalPages ?? 1)
    : Math.max(1, Math.ceil((() => {
        let rows = data;
        filters.forEach((f) => { if (filterValues[f.key]) rows = rows.filter((r) => String(r[f.key]) === filterValues[f.key]); });
        if (clientSearch.trim()) {
          const q = clientSearch.toLowerCase();
          rows = rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
        }
        return rows.length;
      })() / limit));

  const total = serverSide ? (pagination?.total ?? 0) : data.length;

  const displayRows = useMemo(() => {
    if (serverSide) return data;
    let rows = data;
    filters.forEach((f) => { if (filterValues[f.key]) rows = rows.filter((r) => String(r[f.key]) === filterValues[f.key]); });
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      rows = rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
    }
    return rows.slice((clientPage - 1) * limit, clientPage * limit);
  }, [serverSide, data, filters, filterValues, clientSearch, clientPage, limit, columns]);

  const from = total === 0 ? 0 : (activePage - 1) * limit + 1;
  const to   = Math.min(activePage * limit, total);
  const pageNumbers = getPageNumbers(activePage, totalPages);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (serverSide) { onSearchChange?.(val); onPageChange?.(1); }
      else { setClientSearch(val); setClientPage(1); }
    }, debounceMs);
  };

  const handleLimit = (val) => {
    const n = Number(val);
    setLimit(n);
    if (serverSide) { onLimitChange?.(n); onPageChange?.(1); }
    else setClientPage(1);
  };

  const handleFilter = (key, value) => {
    if (serverSide) { onFilterChange?.({ key, value }); onPageChange?.(1); }
    else { setFilterValues((prev) => ({ ...prev, [key]: value })); setClientPage(1); }
  };

  const handlePage = (p) => {
    if (serverSide) onPageChange?.(p);
    else setClientPage(p);
  };

  const inputStyle = { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text };

  return (
    <div className="md:hidden flex flex-col gap-3">

      {/* ── Top Bar ── */}
      <div className="rounded-xl border px-4 py-3 flex flex-col gap-3"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

        {/* Entries */}
        <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
          <span className="opacity-60">Show</span>
          <div className="w-24">
            <CustomSelect
              value={String(limit)}
              onChange={handleLimit}
              options={entriesOptions.map((n) => ({ label: String(n), value: String(n) }))}
              placeholder={String(entriesOptions[0])}
            />
          </div>
          <span className="opacity-60">entries</span>
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex flex-col gap-2">
            {filters.map((f) => (
              <CustomSelect
                key={f.key}
                value={serverSide ? undefined : filterValues[f.key]}
                onChange={(val) => handleFilter(f.key, val)}
                options={[{ label: `${f.label}: All`, value: "" }, ...f.options]}
                placeholder={`${f.label}: All`}
              />
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: themeColors.text }} />
          <input type="text" value={searchInput} onChange={handleSearch}
            placeholder={searchPlaceholder}
            className="w-full pl-7 pr-3 py-2 rounded-lg border text-xs focus:outline-none"
            style={inputStyle} />
        </div>
      </div>

      {/* ── Cards ── */}
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
          <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Loading...</span>
        </div>
      ) : displayRows.length === 0 ? (
        <div className="rounded-xl border px-4 py-10 text-center text-sm opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
          No data found.
        </div>
      ) : (
        displayRows.map((row, idx) => (
          <div key={row[rowKey] ?? idx} className="rounded-xl border p-4 flex flex-col gap-3"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

            {/* Column fields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.map((col) => (
                <div key={col.key}>
                  <p className="text-[10px] uppercase font-semibold opacity-50 mb-0.5" style={{ color: themeColors.text }}>
                    {col.label}
                  </p>
                  <div className="text-sm" style={{ color: themeColors.text }}>
                    {col.render ? col.render(row) : (row[col.key] ?? "-")}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t" style={{ borderColor: themeColors.border }}>
                {actions.map((action, i) => {
                  if (action.hide?.(row)) return null;
                  return (
                    <button key={i} onClick={() => action.onClick(row)}
                      disabled={action.disabled?.(row)}
                      title={action.label}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        color: action.color || themeColors.primary,
                        borderColor: (action.color || themeColors.primary) + "40",
                        backgroundColor: (action.color || themeColors.primary) + "10",
                      }}>
                      {action.icon && <span className="text-xs">{action.icon}</span>}
                      {action.label && <span>{action.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}

      {/* ── Pagination ── */}
      <div className="rounded-xl border px-4 py-3 flex flex-col gap-2 items-center"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
          Showing <b>{from}</b> to <b>{to}</b> of <b>{total}</b> entries
        </p>
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <button onClick={() => handlePage(Math.max(1, activePage - 1))} disabled={activePage <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30"
            style={{ borderColor: themeColors.border, color: themeColors.text }}>
            <FaChevronLeft /> Prev
          </button>
          {pageNumbers.map((n) => (
            <button key={n} onClick={() => handlePage(n)}
              className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border"
              style={{
                backgroundColor: activePage === n ? themeColors.primary : "transparent",
                color: activePage === n ? themeColors.onPrimary : themeColors.text,
                borderColor: activePage === n ? themeColors.primary : themeColors.border,
              }}>
              {n}
            </button>
          ))}
          <button onClick={() => handlePage(Math.min(totalPages, activePage + 1))} disabled={activePage >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30"
            style={{ borderColor: themeColors.border, color: themeColors.text }}>
            Next <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
