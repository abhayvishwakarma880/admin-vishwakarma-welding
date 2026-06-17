import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getAllUsers, adminToggleUserStatus } from "../apis/user";
import { FaUsers, FaSyncAlt, FaEye, FaEdit, FaPlus, FaToggleOn, FaToggleOff } from "react-icons/fa";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function Users() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(10);
  const [search, setSearch]     = useState("");
  const [isActive, setIsActive] = useState("");

  // Track which user IDs are currently being toggled to show loader
  const [togglingIds, setTogglingIds] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true); setError("");
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

  // ── toggle ─────────────────────────────────────────────────
  const handleToggle = async (user) => {
    // Add user ID to loading list
    setTogglingIds((prev) => [...prev, user._id]);
    try {
      await adminToggleUserStatus(user._id);
      await fetchUsers();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle status.");
    } finally {
      // Remove from loading list irrespective of success/failure
      setTogglingIds((prev) => prev.filter((id) => id !== user._id));
    }
  };

  // ── table config ───────────────────────────────────────────
  const tableColumns = [
    {
      key: "name", label: "User",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            {row.profilePhoto?.url
              ? <img src={row.profilePhoto.url} alt={row.name} className="h-8 w-8 object-cover" />
              : row.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-medium text-sm leading-tight" style={{ color: themeColors.text }}>{row.name || "-"}</p>
            <p className="text-xs opacity-50" style={{ color: themeColors.text }}>{row.mobile}</p>
          </div>
        </div>
      ),
    },
    { key: "email",  label: "Email",  render: (row) => row.email  || "-" },
    { key: "city",   label: "City",   render: (row) => row.city   || "-" },
    { key: "state",  label: "State",  render: (row) => row.state  || "-" },
    {
      key: "isActive", label: "Status",
      render: (row) => row.isActive
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>,
    },
    { key: "createdAt", label: "Joined", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    { label: "View",   icon: <FaEye />,      onClick: (row) => navigate(`/users/${row._id}`),       color: themeColors.primary },
    { label: "Edit",   icon: <FaEdit />,     onClick: (row) => navigate(`/users/edit/${row._id}`),  color: themeColors.primary },
    {
      label: "",
      // Render icon with spinner or toggle state
      icon: (row) => (
        togglingIds.includes(row._id) ? (
          <FaSyncAlt className="animate-spin" />
        ) : (
          row.isActive ? <FaToggleOn /> : <FaToggleOff />
        )
      ),
      onClick: (row) => handleToggle(row),
      color: "#f59e0b",
    },
  ];

  const tableFilters = [
    { key: "status", label: "Status", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
  ];

  const handleFilterChange = ({ key, value }) => {
    if (key === "status") setIsActive(value);
    setPage(1);
  };

  const sharedProps = {
    serverSide: true,
    columns: tableColumns,
    data: users,
    actions: tableActions,
    filters: tableFilters,
    loading,
    pagination,
    onPageChange: setPage,
    onLimitChange: (l) => { setLimit(l); setPage(1); },
    onSearchChange: (s) => { setSearch(s); setPage(1); },
    onFilterChange: handleFilterChange,
    searchPlaceholder: "Search name, mobile, email...",
  };

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
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => navigate("/users/add")}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            <FaPlus /> Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      <Table     {...sharedProps} />
      <TableCard {...sharedProps} />
    </div>
  );
}
