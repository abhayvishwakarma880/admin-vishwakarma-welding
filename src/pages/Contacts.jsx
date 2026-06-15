import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllContacts, deleteContact, markContactRead } from "../apis/contact";
import { FaAddressBook, FaSyncAlt, FaTrash, FaEnvelopeOpen, FaEnvelope } from "react-icons/fa";
import Table from "../components/Table";
import TableCard from "../components/TableCard";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function Contacts() {
  const { themeColors } = useTheme();

  const [contacts, setContacts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(10);
  const [search, setSearch] = useState("");
  const [isRead, setIsRead] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllContacts({ page, limit, search, isRead });
      setContacts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isRead]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: "Delete Contact?",
      text: `"${row.name}" ko delete karna chahte ho?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      confirmButtonText: "Haan, Delete Karo",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteContact(row._id);
      fetchContacts();
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed.");
    }
  };

  const handleToggleRead = async (row) => {
    try {
      await markContactRead(row._id, !row.isRead);
      fetchContacts();
    } catch (e) {
      setError(e?.response?.data?.message || "Update failed.");
    }
  };

  const tableColumns = [
    {
      key: "name", label: "Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          {!row.isRead && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: themeColors.primary }} />
          )}
          <span className="font-medium text-sm" style={{ color: themeColors.text }}>{row.name || "-"}</span>
        </div>
      ),
    },
    { key: "mobile",          label: "Mobile" },
    { key: "email",           label: "Email",            render: (row) => row.email || "-" },
    { key: "service",         label: "Service",          render: (row) => row.service || "-" },
    { key: "projectLocation", label: "Project Location", render: (row) => row.projectLocation || "-" },
    {
      key: "message", label: "Message",
      render: (row) => (
        <span className="line-clamp-2 text-xs opacity-80" title={row.message}>{row.message || "-"}</span>
      ),
    },
    {
      key: "isRead", label: "Status",
      render: (row) => row.isRead
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Read</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#f9731620", color: "#f97316" }}>Unread</span>,
    },
    { key: "createdAt", label: "Date", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    {
      label: "Mark Read",
      icon: <FaEnvelopeOpen />,
      onClick: handleToggleRead,
      color: themeColors.primary,
      hide: (row) => row.isRead,
    },
    {
      label: "Mark Unread",
      icon: <FaEnvelope />,
      onClick: handleToggleRead,
      color: "#f97316",
      hide: (row) => !row.isRead,
    },
    {
      label: "Delete",
      icon: <FaTrash />,
      onClick: handleDelete,
      color: themeColors.danger,
    },
  ];

  const tableFilters = [
    {
      key: "isRead",
      label: "Status",
      options: [
        { label: "Read",   value: "true"  },
        { label: "Unread", value: "false" },
      ],
    },
  ];

  const handleFilterChange = ({ key, value }) => {
    if (key === "isRead") { setIsRead(value); setPage(1); }
  };

  const sharedProps = {
    serverSide: true,
    columns: tableColumns,
    data: contacts,
    actions: tableActions,
    filters: tableFilters,
    loading,
    pagination,
    onPageChange:   (p) => setPage(p),
    onLimitChange:  (l) => { setLimit(l); setPage(1); },
    onSearchChange: (s) => { setSearch(s); setPage(1); },
    onFilterChange: handleFilterChange,
    searchPlaceholder: "Search name, mobile, email, service...",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaAddressBook style={{ color: themeColors.primary }} /> Contacts
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>
            Website se aaye sabhi contact form enquiries
          </p>
        </div>
        <button onClick={fetchContacts} disabled={loading}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
          <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
        </button>
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
