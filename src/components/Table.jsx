/**
 * Reusable Table Component
 *
 * Props:
 * ─────────────────────────────────────────────────────────────
 * columns      {Array}   Required. Array of column definitions:
 *   [
 *     { key: 'name', label: 'Name', render: (row) => <b>{row.name}</b> },
 *     { key: 'status', label: 'Status' },   // render optional, shows row[key] by default
 *   ]
 *
 * data         {Array}   Required. Array of row objects.
 *
 * actions      {Array}   Optional. Action buttons per row:
 *   [
 *     { label: 'Edit',   icon: <FaEdit />,  onClick: (row) => {},  color: '#3b82f6' },
 *     { label: 'Delete', icon: <FaTrash />, onClick: (row) => {},  color: '#ef4444',
 *       hide: (row) => row.isDeleted  // optional: hide button conditionally
 *     },
 *   ]
 *
 * filters      {Array}   Optional. Dropdown filters above table:
 *   [
 *     { key: 'role', label: 'Role', options: [{ label: 'Admin', value: 'admin' }, ...] },
 *   ]
 *
 * loading      {Boolean} Optional. Shows loading state.
 * title        {String}  Optional. Table heading.
 * searchPlaceholder {String} Optional.
 * rowKey       {String}  Optional. Unique key field (default: '_id').
 * entriesOptions {Array} Optional. Default: [10, 25, 75, 100]
 * ─────────────────────────────────────────────────────────────
 *
 * Usage Example:
 * ─────────────────────────────────────────────────────────────
 * <Table
 *   title="Users"
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'phone', label: 'Phone' },
 *     { key: 'role', label: 'Role', render: (row) => <b>{row.role}</b> },
 *   ]}
 *   data={users}
 *   loading={loading}
 *   actions={[
 *     { label: 'Edit',   icon: <FaEdit />,  onClick: (row) => handleEdit(row) },
 *     { label: 'Delete', icon: <FaTrash />, onClick: (row) => handleDelete(row), color: '#ef4444' },
 *   ]}
 *   filters={[
 *     { key: 'role', label: 'Role', options: [{ label: 'Admin', value: 'admin' }] },
 *   ]}
 * />
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { FaChevronLeft, FaChevronRight, FaSearch, FaChevronDown, FaCheck } from "react-icons/fa";

// ── Modern Custom Select ───────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder }) {
  const { themeColors } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer"
        style={{
          backgroundColor: themeColors.background,
          borderColor: open ? themeColors.primary : themeColors.border,
          color: themeColors.text,
          minWidth: "110px",
        }}
      >
        <span className="flex-1 text-left truncate">
          {selected ? selected.label : placeholder}
        </span>
        <FaChevronDown
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            minWidth: "140px",
            top: "100%",
            right: 0,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:opacity-80 transition-colors cursor-pointer"
              style={{
                backgroundColor: value === opt.value ? themeColors.primary + "15" : "transparent",
                color: value === opt.value ? themeColors.primary : themeColors.text,
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <FaCheck className="text-[10px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ENTRIES_OPTIONS = [10, 25, 75, 100];

export default function Table({
  columns = [],
  data = [],
  actions = [],
  filters = [],
  loading = false,
  title = "",
  searchPlaceholder = "Search...",
  rowKey = "_id",
  entriesOptions = ENTRIES_OPTIONS,
}) {
  const { themeColors } = useTheme();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);
  const [pageSize, setPageSize] = useState(entriesOptions[0]);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState(() =>
    filters.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})
  );

  // ── Filter + Search (client-side) ──────────────────────────
  const filtered = useMemo(() => {
    let rows = data;

    // Apply dropdown filters
    filters.forEach((f) => {
      if (filterValues[f.key]) {
        rows = rows.filter((row) => {
          const val = row[f.key];
          return String(val).toLowerCase() === filterValues[f.key].toLowerCase();
        });
      }
    });

    // Apply global search across all column keys
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        })
      );
    }

    return rows;
  }, [data, search, filterValues, columns, filters]);

  // ── Pagination ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handlePageSize = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  // ── Page numbers ───────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    const max = 5;
    let start = Math.max(1, safePage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, filtered.length);

  // ── Styles ─────────────────────────────────────────────────
  const inputStyle = {
    backgroundColor: themeColors.background,
    borderColor: themeColors.border,
    color: themeColors.text,
  };

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, maxHeight: "600px" }}
    >
      {/* ── Top Bar ── */}
      <div
        className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: themeColors.border }}
      >
        {/* Left: title + entries */}
        <div className="flex items-center gap-3 flex-wrap">
          {title && (
            <h2 className="text-sm font-semibold" style={{ color: themeColors.text }}>
              {title}
            </h2>
          )}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: themeColors.text }}>
            <span className="opacity-60">Show</span>
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => { setPageSize(Number(val)); setPage(1); }}
              options={entriesOptions.map((n) => ({ label: String(n), value: String(n) }))}
              placeholder="10"
            />
            <span className="opacity-60">entries</span>
          </div>
        </div>

        {/* Right: filters + search */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <CustomSelect
              key={f.key}
              value={filterValues[f.key]}
              onChange={(val) => handleFilterChange(f.key, val)}
              options={[{ label: `${f.label}: All`, value: "" }, ...f.options]}
              placeholder={`${f.label}: All`}
            />
          ))}

          <div className="relative">
            <FaSearch
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40"
              style={{ color: themeColors.text }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-48"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: themeColors.surface }}>
              {actions.length > 0 && (
                <th
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                  style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}
                >
                  Actions
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                  style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-4 py-10 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: themeColors.primary }}
                    />
                    <span className="text-xs opacity-60" style={{ color: themeColors.text }}>
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm opacity-50"
                  style={{ color: themeColors.text }}
                >
                  No data found.
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row[rowKey] ?? idx}
                  className="hover:bg-black/5 transition-colors"
                >
                  {actions.length > 0 && (
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {actions.map((action, i) => {
                          if (action.hide?.(row)) return null;
                          return (
                            <button
                              key={i}
                              onClick={() => action.onClick(row)}
                              disabled={action.disabled?.(row)}
                              title={action.label}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              style={{
                                color: action.color || themeColors.primary,
                                borderColor: (action.color || themeColors.primary) + "40",
                                backgroundColor: (action.color || themeColors.primary) + "10",
                              }}
                            >
                              {action.icon && <span className="text-xs">{action.icon}</span>}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-2 text-sm"
                      style={{ color: themeColors.text }}
                    >
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
      <div
        className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t"
        style={{ borderColor: themeColors.border }}
      >
        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
          Showing <b>{from}</b> to <b>{to}</b> of <b>{filtered.length}</b> entries
          {filtered.length !== data.length && (
            <span> (filtered from <b>{data.length}</b> total)</span>
          )}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 transition-colors cursor-pointer"
            style={{ borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaChevronLeft /> Prev
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={{
                backgroundColor: safePage === n ? themeColors.primary : "transparent",
                color: safePage === n ? themeColors.onPrimary : themeColors.text,
                borderColor: safePage === n ? themeColors.primary : themeColors.border,
              }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 transition-colors cursor-pointer"
            style={{ borderColor: themeColors.border, color: themeColors.text }}
          >
            Next <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
