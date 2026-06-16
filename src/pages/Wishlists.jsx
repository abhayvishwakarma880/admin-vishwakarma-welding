import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { adminGetAllWishlists, adminDeleteWishlist } from "../apis/wishlist";
import { FaHeart, FaSyncAlt, FaEye, FaTrash } from "react-icons/fa";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function Wishlists() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(10);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await adminGetAllWishlists({ page, limit, search });
      setItems(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load wishlists.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (row) => {
    if (!window.confirm(`Delete this wishlist item?`)) return;
    try {
      setDeleting(true);
      await adminDeleteWishlist(row._id);
      fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Table Columns ───────────────────────────────────────────
  const tableColumns = [
    {
      key: "user", label: "User",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
          >
            {row.userId?.profilePhoto?.url
              ? <img src={row.userId.profilePhoto.url} alt={row.userId.name} className="h-8 w-8 object-cover" />
              : row.userId?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-medium text-sm leading-tight" style={{ color: themeColors.text }}>
              {row.userId?.name || "-"}
            </p>
            <a
              href={`tel:${row.userId?.mobile}`}
              className="text-xs font-semibold hover:underline"
              style={{ color: themeColors.primary }}
              onClick={(e) => e.stopPropagation()}
            >
              {row.userId?.mobile || "-"}
            </a>
          </div>
        </div>
      ),
    },
    {
      key: "product", label: "Product",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.productId?.mainImage?.url && (
            <img
              src={row.productId.mainImage.url}
              alt={row.productId.name}
              className="h-8 w-8 object-cover rounded flex-shrink-0"
            />
          )}
          <span className="text-sm font-medium" style={{ color: themeColors.text }}>
            {row.productId?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "price", label: "Price",
      render: (row) => row.productId
        ? `₹${(row.productId.price - (row.productId.price * (row.productId.discount || 0)) / 100).toLocaleString("en-IN")}`
        : "-",
    },
    {
      key: "productStatus", label: "Product Status",
      render: (row) => row.productId?.isActive
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>,
    },
    {
      key: "createdAt", label: "Wishlisted On",
      render: (row) => fmtDate(row.createdAt),
    },
  ];

  const tableActions = [
    {
      label: "View",
      icon: <FaEye />,
      onClick: (row) => navigate(`/wishlists/${row._id}`),
      color: themeColors.primary,
    },
    {
      label: "Delete",
      icon: <FaTrash />,
      onClick: handleDelete,
      color: "#ef4444",
    },
  ];

  const sharedProps = {
    serverSide: true,
    columns: tableColumns,
    data: items,
    actions: tableActions,
    loading,
    pagination,
    onPageChange: setPage,
    onLimitChange: (l) => { setLimit(l); setPage(1); },
    onSearchChange: (s) => { setSearch(s); setPage(1); },
    searchPlaceholder: "Search user name, mobile, product...",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaHeart style={{ color: "#ef4444" }} /> Wishlists
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>
            Sabhi users ki wishlist items
          </p>
        </div>
        <button
          onClick={fetchItems}
          disabled={loading}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}
        >
          {error}
        </div>
      )}

      <Table     {...sharedProps} />
      <TableCard {...sharedProps} />
    </div>
  );
}
