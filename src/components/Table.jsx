/**
 * Reusable Table Component — Client-side & Server-side both supported
 *
 * ─── COMMON PROPS ────────────────────────────────────────────────────────────
 * columns        {Array}   Required.
 *   [{ key, label, render?: (row) => ReactNode }]
 *
 * data           {Array}   Required. Rows to display.
 *
 * actions        {Array}   Optional. Buttons per row.
 *   [{ label, icon, onClick: (row) => void, color?, hide?: (row) => bool, disabled?: (row) => bool }]
 *
 * loading        {Boolean} Optional.
 * rowKey         {String}  Optional. Default: '_id'
 * entriesOptions {Array}   Optional. Default: [10, 25, 50, 100]
 * searchPlaceholder {String} Optional.
 * debounceMs     {Number}  Optional. Default: 500
 *
 * ─── CLIENT-SIDE MODE (serverSide = false, default) ──────────────────────────
 * serverSide     {Boolean} false (default)
 * filters        {Array}   Optional. Dropdown filters (client-side).
 *   [{ key, label, options: [{ label, value }] }]
 *
 * ─── SERVER-SIDE MODE (serverSide = true) ────────────────────────────────────
 * serverSide     {Boolean} true
 * pagination     {Object}  Required. { total, page, totalPages }
 * onPageChange   {Function}  (page) => void
 * onLimitChange  {Function}  (limit) => void
 * onSearchChange {Function}  (search) => void   — called after debounce
 * filters        {Array}   Optional. Dropdown filters (server-side).
 *   [{ key, label, options: [{ label, value }] }]
 * onFilterChange {Function}  ({ key, value }) => void
 *
 * ─── USAGE EXAMPLES ──────────────────────────────────────────────────────────
 *
 * // Client-side:
 * <Table columns={cols} data={rows} actions={acts} loading={loading} />
 *
 * // Server-side:
 * <Table
 *   serverSide
 *   columns={cols} data={rows} actions={acts} loading={loading}
 *   pagination={{ total: 100, page: 2, totalPages: 10 }}
 *   onPageChange={setPage}
 *   onLimitChange={setLimit}
 *   onSearchChange={setSearch}
 *   filters={[{ key: 'status', label: 'Status', options: [{ label: 'Active', value: 'true' }] }]}
 *   onFilterChange={({ key, value }) => key === 'status' && setStatus(value)}
 * />
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { FaChevronLeft, FaChevronRight, FaSearch, FaChevronDown, FaCheck } from "react-icons/fa";

// ── Custom Select ─────────────────────────────────────────────
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
        style={{ backgroundColor: themeColors.background, borderColor: open ? themeColors.primary : themeColors.border, color: themeColors.text, minWidth: "120px" }}>
        <span className="flex-1 text-left truncate">{selected ? selected.label : placeholder}</span>
        <FaChevronDown style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, minWidth: "140px", top: "100%", right: 0 }}>
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

// ── Page numbers helper ───────────────────────────────────────
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

// ── Main Table ────────────────────────────────────────────────
export default function Table({
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
  pagination     = null,        // { total, page, totalPages }
  onPageChange   = null,
  onLimitChange  = null,
  onSearchChange = null,
  onFilterChange = null,
}) {
  const { themeColors } = useTheme();

  // ── Local state (used in both modes) ─────────────────────
  const [limit, setLimit]             = useState(entriesOptions[0]);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef                   = useRef(null);

  // client-side only state
  const [clientPage, setClientPage]     = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const [filterValues, setFilterValues] = useState(() =>
    filters.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})
  );

  // ── Derived values ─────────────────────────────────────────
  const activePage = serverSide ? (pagination?.page ?? 1) : clientPage;
  const totalPages = serverSide ? (pagination?.totalPages ?? 1) : Math.max(1, Math.ceil(
    (() => {
      let rows = data;
      filters.forEach((f) => {
        if (filterValues[f.key]) rows = rows.filter((r) => String(r[f.key]) === filterValues[f.key]);
      });
      if (clientSearch.trim()) {
        const q = clientSearch.toLowerCase();
        rows = rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
      }
      return rows.length;
    })() / limit
  ));
  const total = serverSide ? (pagination?.total ?? 0) : data.length;

  // client-side filtered + paginated rows
  const displayRows = useMemo(() => {
    if (serverSide) return data;
    let rows = data;
    filters.forEach((f) => {
      if (filterValues[f.key]) rows = rows.filter((r) => String(r[f.key]) === filterValues[f.key]);
    });
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      rows = rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
    }
    return rows.slice((clientPage - 1) * limit, clientPage * limit);
  }, [serverSide, data, filters, filterValues, clientSearch, clientPage, limit, columns]);

  const from = total === 0 ? 0 : (activePage - 1) * limit + 1;
  const to   = Math.min(activePage * limit, total);
  const pageNumbers = getPageNumbers(activePage, totalPages);

  // ── Handlers ───────────────────────────────────────────────
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (serverSide) {
        onSearchChange?.(val);
        onPageChange?.(1);
      } else {
        setClientSearch(val);
        setClientPage(1);
      }
    }, debounceMs);
  };

  const handleLimit = (val) => {
    const n = Number(val);
    setLimit(n);
    if (serverSide) {
      onLimitChange?.(n);
      onPageChange?.(1);
    } else {
      setClientPage(1);
    }
  };

  const handleFilter = (key, value) => {
    if (serverSide) {
      onFilterChange?.({ key, value });
      onPageChange?.(1);
    } else {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setClientPage(1);
    }
  };

  const handlePage = (p) => {
    if (serverSide) onPageChange?.(p);
    else setClientPage(p);
  };

  const inputStyle = { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text };

  return (
    <div className="hidden md:flex rounded-xl border flex-col"
      style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

      {/* ── Top Bar ── */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: themeColors.border }}>

        {/* Entries select */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: themeColors.text }}>
          <span className="opacity-60">Show</span>
          <CustomSelect
            value={String(limit)}
            onChange={handleLimit}
            options={entriesOptions.map((n) => ({ label: String(n), value: String(n) }))}
            placeholder={String(entriesOptions[0])}
          />
          <span className="opacity-60">entries</span>
        </div>

        {/* Filters + Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <CustomSelect
              key={f.key}
              value={serverSide ? undefined : filterValues[f.key]}
              onChange={(val) => handleFilter(f.key, val)}
              options={[{ label: `${f.label}: All`, value: "" }, ...f.options]}
              placeholder={`${f.label}: All`}
            />
          ))}
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: themeColors.text }} />
            <input type="text" value={searchInput} onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-48 focus:outline-none"
              style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-auto flex-1" style={{ maxHeight: "500px" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: themeColors.surface }}>
              {actions.length > 0 && (
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                  style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                  Actions
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key}
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                  style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
                    <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm opacity-50" style={{ color: themeColors.text }}>
                  No data found.
                </td>
              </tr>
            ) : (
              displayRows.map((row, idx) => (
                <tr key={row[rowKey] ?? idx} className="hover:bg-black/5 transition-colors">
                  {actions.length > 0 && (
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {actions.map((action, i) => {
                          if (action.hide?.(row)) return null;
                          return (
                            <button key={i} onClick={() => action.onClick(row)}
                              disabled={action.disabled?.(row)}
                              title={action.label}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              style={{
                                color: action.color || themeColors.primary,
                                borderColor: (action.color || themeColors.primary) + "40",
                                backgroundColor: (action.color || themeColors.primary) + "10",
                              }}>
                              {typeof action.icon === "function" ? (
              action.icon(row)
            ) : (
              action.icon
            )}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 text-sm" style={{ color: themeColors.text }}>
                      {col.render ? col.render(row) : (row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t"
        style={{ borderColor: themeColors.border }}>
        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
          Showing <b>{from}</b> to <b>{to}</b> of <b>{total}</b> entries
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => handlePage(Math.max(1, activePage - 1))} disabled={activePage <= 1 || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            style={{ borderColor: themeColors.border, color: themeColors.text }}>
            <FaChevronLeft /> Prev
          </button>
          {pageNumbers.map((n) => (
            <button key={n} onClick={() => handlePage(n)}
              className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={{
                backgroundColor: activePage === n ? themeColors.primary : "transparent",
                color: activePage === n ? themeColors.onPrimary : themeColors.text,
                borderColor: activePage === n ? themeColors.primary : themeColors.border,
              }}>
              {n}
            </button>
          ))}
          <button onClick={() => handlePage(Math.min(totalPages, activePage + 1))} disabled={activePage >= totalPages || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            style={{ borderColor: themeColors.border, color: themeColors.text }}>
            Next <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
