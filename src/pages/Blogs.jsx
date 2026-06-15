import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  getAllBlogs, toggleBlogStatus, toggleBlogPublished, deleteBlog,
} from "../apis/blogs";
import Table from "../components/Table";
import TableCard from "../components/TableCard";
import {
  FaBlog, FaPlus, FaEdit, FaTrash, FaSyncAlt,
  FaEye, FaToggleOn, FaToggleOff,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function Blogs() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [blogs, setBlogs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [search, setSearch]       = useState("");
  const [isPublished, setIsPublished] = useState("");
  const [isActive, setIsActive]   = useState("");

  // ── Fetch ─────────────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllBlogs({ page, limit, search, isPublished, isActive });
      setBlogs(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isPublished, isActive]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  // ── Actions ────────────────────────────────────────────────
  const handleToggleStatus = async (row) => {
    try {
      await toggleBlogStatus(row._id);
      fetchBlogs();
    } catch (e) { setError(e?.response?.data?.message || "Failed."); }
  };

  const handleTogglePublished = async (row) => {
    try {
      await toggleBlogPublished(row._id);
      fetchBlogs();
    } catch (e) { setError(e?.response?.data?.message || "Failed."); }
  };

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: "Blog delete karna chahte ho?",
      text: `"${row.title}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      confirmButtonText: "Haan, Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteBlog(row._id);
      fetchBlogs();
    } catch (e) { setError(e?.response?.data?.message || "Delete failed."); }
  };

  const openAdd  = () => navigate("/blogs/add");
  const openView = (row) => navigate(`/blogs/${row._id}`);
  const openEdit = (row) => navigate(`/blogs/edit/${row._id}`);

  // ── Table config ───────────────────────────────────────────
  const tableColumns = [
    {
      key: "image", label: "Image",
      render: (row) => (
        <img src={row.image?.url} alt={row.title}
          className="h-12 w-20 object-cover rounded-lg border"
          style={{ borderColor: themeColors.border }} />
      ),
    },
    {
      key: "title", label: "Title",
      render: (row) => (
        <div>
          <p className="font-medium text-sm leading-tight" style={{ color: themeColors.text }}>{row.title}</p>
          <p className="text-xs opacity-50 mt-0.5" style={{ color: themeColors.text }}>
            {row.category?.name || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "readTime", label: "Read Time",
      render: (row) => <span className="text-xs">{row.readTime} min</span>,
    },
    {
      key: "isPublished", label: "Published",
      render: (row) => row.isPublished
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Yes</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#f9731620", color: "#f97316" }}>No</span>,
    },
    {
      key: "isActive", label: "Status",
      render: (row) => row.isActive
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>,
    },
    {
      key: "views", label: "Views",
      render: (row) => <span className="text-xs">{row.views || 0}</span>,
    },
    { key: "createdAt", label: "Date", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    { label: "View",       icon: <FaEye />,        onClick: openView,              color: themeColors.primary },
    { label: "Edit",       icon: <FaEdit />,       onClick: openEdit,              color: "#f59e0b" },
    { label: "Publish",    icon: <FaToggleOff />,  onClick: handleTogglePublished, color: "#10b981", hide: (r) => r.isPublished },
    { label: "Unpublish",  icon: <FaToggleOn />,   onClick: handleTogglePublished, color: "#f97316", hide: (r) => !r.isPublished },
    { label: "Deactivate", icon: <FaToggleOn />,   onClick: handleToggleStatus,    color: "#f97316", hide: (r) => !r.isActive },
    { label: "Activate",   icon: <FaToggleOff />,  onClick: handleToggleStatus,    color: "#10b981", hide: (r) => r.isActive },
    { label: "Delete",     icon: <FaTrash />,      onClick: handleDelete,          color: themeColors.danger },
  ];

  const tableFilters = [
    {
      key: "isPublished", label: "Published",
      options: [{ label: "Published", value: "true" }, { label: "Draft", value: "false" }],
    },
    {
      key: "isActive", label: "Status",
      options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }],
    },
  ];

  const handleFilterChange = ({ key, value }) => {
    if (key === "isPublished") { setIsPublished(value); setPage(1); }
    if (key === "isActive")    { setIsActive(value);    setPage(1); }
  };

  const sharedProps = {
    serverSide: true,
    columns: tableColumns,
    data: blogs,
    actions: tableActions,
    filters: tableFilters,
    loading,
    pagination,
    onPageChange:   (p) => setPage(p),
    onLimitChange:  (l) => { setLimit(l); setPage(1); },
    onSearchChange: (s) => { setSearch(s); setPage(1); },
    onFilterChange: handleFilterChange,
    searchPlaceholder: "Search title, description, tags...",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaBlog style={{ color: themeColors.primary }} /> Blogs
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>
            Sabhi blog posts manage karo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchBlogs} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openAdd}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            <FaPlus /> Add Blog
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
