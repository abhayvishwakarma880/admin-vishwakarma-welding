import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  getAllRecentSideWorks, toggleRecentSideWorkStatus, deleteRecentSideWork,
} from "../apis/recentSideWorks";
import {
  FaHammer, FaPlus, FaEdit, FaTrash,
  FaSyncAlt, FaToggleOn, FaToggleOff, FaEye,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function RecentSideWorks() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [works, setWorks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(10);
  const [search, setSearch]   = useState("");
  const [isActive, setIsActive] = useState("");
  const [status, setStatus]   = useState("");

  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllRecentSideWorks({ page, limit, search, isActive, status });
      setWorks(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load works.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive, status]);

  useEffect(() => { fetchWorks(); }, [fetchWorks]);

  const handleToggle = async (row) => {
    try {
      await toggleRecentSideWorkStatus(row._id);
      fetchWorks();
    } catch (e) {
      setError(e?.response?.data?.message || "Status change failed.");
    }
  };

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: "Delete karna chahte ho?",
      text: "Ye action undo nahi hoga.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      confirmButtonText: "Haan, Delete Karo",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteRecentSideWork(row._id);
      fetchWorks();
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed.");
    }
  };

  const tableColumns = [
    {
      key: "coverImage", label: "Cover",
      render: (row) => (
        <img src={row.coverImage?.url} alt={row.title}
          className="h-12 w-20 object-cover rounded-lg border"
          style={{ borderColor: themeColors.border }} />
      ),
    },
    { key: "title", label: "Title" },
    { key: "projectName", label: "Project Name" },
    {
      key: "status", label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
          style={{
            backgroundColor: row.status === "completed" ? "#10b98115" : "#f59e0b15",
            color: row.status === "completed" ? "#10b981" : "#f59e0b",
          }}>
          {row.status}
        </span>
      ),
    },
    {
      key: "isActive", label: "Active",
      render: (row) => row.isActive
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>,
    },
    {
      key: "featured", label: "Featured",
      render: (row) => row.featured
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#6366f115", color: "#6366f1" }}>Yes</span>
        : <span className="text-xs opacity-40" style={{ color: themeColors.text }}>No</span>,
    },
    { key: "createdAt", label: "Created", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    { label: "View",   icon: <FaEye />,      onClick: (row) => navigate(`/recent-side-works/${row._id}`), color: themeColors.primary },
    { label: "Edit",   icon: <FaEdit />,     onClick: (row) => navigate(`/recent-side-works/edit/${row._id}`), color: "#f59e0b" },
    { label: "Activate",   icon: <FaToggleOff />, onClick: handleToggle, color: "#10b981", hide: (row) => row.isActive },
    { label: "Deactivate", icon: <FaToggleOn />,  onClick: handleToggle, color: "#f97316", hide: (row) => !row.isActive },
    { label: "Delete", icon: <FaTrash />,    onClick: handleDelete, color: themeColors.danger },
  ];

  const tableFilters = [
    { key: "isActive", label: "Active", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
    { key: "status",   label: "Status", options: [{ label: "Completed", value: "completed" }, { label: "Pending", value: "pending" }] },
  ];

  const sharedProps = {
    serverSide: true,
    columns: tableColumns,
    data: works,
    actions: tableActions,
    filters: tableFilters,
    loading,
    pagination,
    onPageChange:   (p) => setPage(p),
    onLimitChange:  (l) => { setLimit(l); setPage(1); },
    onSearchChange: (s) => { setSearch(s); setPage(1); },
    onFilterChange: ({ key, value }) => {
      if (key === "isActive") { setIsActive(value); setPage(1); }
      if (key === "status")   { setStatus(value);   setPage(1); }
    },
    searchPlaceholder: "Search by title or project name...",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaHammer style={{ color: themeColors.primary }} /> Recent Side Works
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>
            Client projects aur side works manage karo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchWorks} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => navigate("/recent-side-works/add")}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            <FaPlus /> Add Work
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
