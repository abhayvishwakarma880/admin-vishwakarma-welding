import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getOrders } from "../apis/orders";
import { FaShoppingCart, FaSyncAlt, FaEye, FaEdit } from "react-icons/fa";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function Orders() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // To handle frontend pagination if API doesn't support server-side yet
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getOrders();
      setOrders(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Frontend search & pagination
  const filteredOrders = orders.filter(o => 
    o.name?.toLowerCase().includes(search.toLowerCase()) || 
    o.orderFor?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.mobile?.toLowerCase().includes(search.toLowerCase())
  );
  
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredOrders.length / limit) || 1;
  const pagination = { total: filteredOrders.length, page, totalPages };

  const tableColumns = [
    { key: "_id", label: "Order ID", render: (row) => <span className="font-mono text-xs">#{row._id.slice(-6)}</span> },
    { key: "name", label: "Customer Name", render: (row) => <span className="font-semibold">{row.name}</span> },
    { key: "mobile", label: "Mobile", render: (row) => row.mobile || "-" },
    { key: "email", label: "Email", render: (row) => row.email || "-" },
    { key: "orderFor", label: "Order For", render: (row) => <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: themeColors.primary + "20", color: themeColors.primary }}>{row.orderFor}</span> },
    { key: "city", label: "City", render: (row) => row.city || "-" },
    { key: "createdAt", label: "Date", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    { label: "", icon: <FaEye />, onClick: (row) => navigate(`/orders/${row._id}?mode=view`), color: themeColors.primary },
    { label: "", icon: <FaEdit />, onClick: (row) => navigate(`/orders/${row._id}?mode=edit`), color: "#10b981" },
  ];

  const sharedProps = {
    serverSide: false, // Because we fetch all and paginate on frontend for now
    columns: tableColumns,
    data: paginatedOrders,
    actions: tableActions,
    filters: [], // No filters for now
    loading,
    pagination,
    onPageChange: setPage,
    onLimitChange: (l) => { setLimit(l); setPage(1); },
    onSearchChange: (s) => { setSearch(s); setPage(1); },
    searchPlaceholder: "Search by name, email, mobile, order for...",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaShoppingCart style={{ color: themeColors.primary }} /> Orders
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Manage your customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50 transition-all hover:shadow-md"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border bg-red-50 text-red-600 border-red-200">
          {error}
        </div>
      )}

      {/* Render Table for Desktop, TableCard for Mobile */}
      <div className="hidden md:block">
        <Table {...sharedProps} />
      </div>
      <div className="block md:hidden">
        <TableCard {...sharedProps} />
      </div>
    </div>
  );
}
