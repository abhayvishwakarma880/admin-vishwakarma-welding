import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../apis/user";
import { FaUsers, FaSyncAlt, FaEye, FaSearch, FaChevronLeft, FaChevronRight, FaChevronDown, FaCheck } from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const LIMIT_OPTIONS = ["10", "25", "50", "100"];

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
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium min-w-[120px]"
        style={{ backgroundColor: themeColors.background, borderColor: open ? themeColors.primary : themeColors.border, color: themeColors.text }}
      >
        <span className="flex-1 text-left truncate">{selected ? selected.label : placeholder}</span>
        <FaChevronDown style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, minWidth: "140px", top: "100%", right: 0 }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:opacity-80"
              style={{ backgroundColor: String(value) === String(opt.value) ? themeColors.primary + "15" : "transparent", color: String(value) === String(opt.value) ? themeColors.primary : themeColors.text }}
            >
              <span>{opt.label}</span>
              {String(value) === String(opt.value) && <FaCheck className="text-[10px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Users() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // server-side controls
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isActive, setIsActive]   = useState("");
  const debounceRef               = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllUsers({ page, limit, search, isActive });
      setUsers(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 500);
  };

  const handleFilter = (val) => {
    setIsActive(val);
    setPage(1);
  };

  const handleLimit = (val) => {
    setLimit(Number(val));
    setPage(1);
  };

  const pageNumbers = (() => {
    const max = 5;
    let start = Math.max(1, pagination.page - Math.floor(max / 2));
    let end   = Math.min(pagination.totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1;
  const to   = Math.min(pagination.page * limit, pagination.total);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaUsers style={{ color: themeColors.primary }} /> Users
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Sabhi registered users ka data</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-xl border flex flex-col" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
            <span className="opacity-60">Show</span>
            <CustomSelect
              value={String(limit)}
              onChange={handleLimit}
              options={LIMIT_OPTIONS.map((n) => ({ label: n, value: n }))}
              placeholder="10"
            />
            <span className="opacity-60">entries</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <CustomSelect
              value={isActive}
              onChange={handleFilter}
              options={[
                { label: "Status: All",      value: "" },
                { label: "Active",           value: "true" },
                { label: "Inactive",         value: "false" },
              ]}
              placeholder="Status: All"
            />
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: themeColors.text }} />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInput}
                placeholder="Search name, mobile, email..."
                className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-52 focus:outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1" style={{ maxHeight: "500px" }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: themeColors.surface }}>
                {["Actions", "User", "Email", "City", "State", "Status", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                    style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
                      <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm opacity-50" style={{ color: themeColors.text }}>No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-black/5 transition-colors border-b" style={{ borderColor: themeColors.border }}>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => navigate(`/users/${user._id}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80 cursor-pointer"
                        style={{ color: themeColors.primary, borderColor: themeColors.primary + "40", backgroundColor: themeColors.primary + "10" }}
                      >
                        <FaEye className="text-xs" /> View
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-sm" style={{ color: themeColors.text }}>{user.name || "-"}</p>
                      <p className="text-xs opacity-50" style={{ color: themeColors.text }}>{user.mobile}</p>
                    </td>
                    <td className="px-4 py-2 text-sm" style={{ color: themeColors.text }}>{user.email || "-"}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: themeColors.text }}>{user.city  || "-"}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: themeColors.text }}>{user.state || "-"}</td>
                    <td className="px-4 py-2">
                      {user.isActive
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>}
                    </td>
                    <td className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>{fmtDate(user.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar - Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: themeColors.border }}>
          <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
            Showing <b>{from}</b> to <b>{to}</b> of <b>{pagination.total}</b> entries
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ borderColor: themeColors.border, color: themeColors.text }}
            >
              <FaChevronLeft /> Prev
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: pagination.page === n ? themeColors.primary : "transparent",
                  color: pagination.page === n ? themeColors.onPrimary : themeColors.text,
                  borderColor: pagination.page === n ? themeColors.primary : themeColors.border,
                }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ borderColor: themeColors.border, color: themeColors.text }}
            >
              Next <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
