import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllRooms, approveRoom, rejectRoom } from "../apis/rooms";
import Spinner from "../components/Spinner";
import {
  FaHome, FaSyncAlt, FaCheckCircle, FaTimesCircle, FaEye,
  FaSearch, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const Badge = ({ color, bg, border, children }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border"
    style={{ color, backgroundColor: bg, borderColor: border || color }}
  >
    {children}
  </span>
);

const FURNISHING_MAP = {
  "fully-furnished": { color: "#10b981", bg: "#10b98115", label: "Fully Furnished" },
  "semi-furnished":  { color: "#f59e0b", bg: "#f59e0b15", label: "Semi Furnished" },
  "unfurnished":     { color: "#ef4444", bg: "#ef444415", label: "Unfurnished" },
};

const STATUS_MAP = {
  approved: { color: "#10b981", bg: "#10b98115", label: "Approved" },
  rejected: { color: "#ef4444", bg: "#ef444415", label: "Rejected" },
  pending:  { color: "#f59e0b", bg: "#f59e0b15", label: "Pending" },
};

const LIMIT = 20;

export default function Rooms() {
  const { themeColors } = useTheme();

  const [rooms, setRooms]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // filters
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [furnishingFilter, setFurnishingFilter] = useState("");
  const debounceRef = useRef(null);

  // modals
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rejectModal, setRejectModal]   = useState({ open: false, room: null, reason: "", loading: false, error: "", visible: false });

  // per-row action loading
  const [actionLoading, setActionLoading] = useState({});

  const fetchRooms = useCallback(async (pg = page) => {
    try {
      setLoading(true);
      setError("");
      const params = { page: pg, limit: LIMIT };
      if (search)          params.search   = search;
      if (statusFilter)    params.status   = statusFilter;
      if (typeFilter)      params.type     = typeFilter;
      if (furnishingFilter) params.furnishing = furnishingFilter;
      const res = await getAllRooms(params);
      setRooms(res.rooms || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, furnishingFilter]);

  useEffect(() => { fetchRooms(page); }, [page, search, statusFilter, typeFilter, furnishingFilter]);

  // reset to page 1 on filter/search change
  const applyFilter = (setter, val) => { setter(val); setPage(1); };

  const handleSearchInput = (e) => {
    setSearchInput(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 400);
  };

  const handleApprove = async (row) => {
    setActionLoading((p) => ({ ...p, [row._id + "_approve"]: true }));
    try {
      await approveRoom(row._id);
      setRooms((prev) => prev.map((r) => r._id === row._id ? { ...r, isApproved: true, isActive: true } : r));
    } catch (e) {
      alert(e?.response?.data?.message || "Approve failed");
    } finally {
      setActionLoading((p) => ({ ...p, [row._id + "_approve"]: false }));
    }
  };

  const openRejectModal = (room) => {
    setRejectModal({ open: true, room, reason: "", loading: false, error: "", visible: false });
    setTimeout(() => setRejectModal((p) => ({ ...p, visible: true })), 10);
  };

  const closeRejectModal = () => {
    setRejectModal((p) => ({ ...p, visible: false }));
    setTimeout(() => setRejectModal({ open: false, room: null, reason: "", loading: false, error: "", visible: false }), 200);
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) return;
    setRejectModal((p) => ({ ...p, loading: true, error: "" }));
    try {
      await rejectRoom(rejectModal.room._id, rejectModal.reason);
      setRooms((prev) => prev.map((r) => r._id === rejectModal.room._id ? { ...r, isApproved: false, isActive: false, rejectionReason: rejectModal.reason } : r));
      closeRejectModal();
    } catch (e) {
      setRejectModal((p) => ({ ...p, loading: false, error: e?.response?.data?.message || "Reject failed" }));
    }
  };

  const getRowStatus = (row) => {
    if (!row.isActive)  return STATUS_MAP.rejected;
    if (row.isApproved) return STATUS_MAP.approved;
    return STATUS_MAP.pending;
  };

  // page numbers
  const pageNumbers = (() => {
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    let end   = Math.min(pages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  })();

  const inputStyle = { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaHome style={{ color: themeColors.primary }} /> Rooms
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Sabhi room listings ka data</p>
        </div>
        <button
          onClick={() => fetchRooms(page)}
          disabled={loading}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          {loading ? <Spinner size={14} /> : <FaSyncAlt />} Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: "#ef444415", borderColor: "#ef444430", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-xl border flex flex-col" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

        {/* Top Bar — filters + search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: themeColors.border }}>
          <h2 className="text-sm font-semibold" style={{ color: themeColors.text }}>
            All Rooms {!loading && <span className="opacity-50 font-normal">({total})</span>}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => applyFilter(setStatusFilter, e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-xs"
              style={inputStyle}
            >
              <option value="">Status: All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => applyFilter(setTypeFilter, e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-xs"
              style={inputStyle}
            >
              <option value="">Type: All</option>
              {["room","pg","flat","hostel","villa","studio"].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>

            {/* Furnishing filter */}
            <select
              value={furnishingFilter}
              onChange={(e) => applyFilter(setFurnishingFilter, e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-xs"
              style={inputStyle}
            >
              <option value="">Furnishing: All</option>
              <option value="fully-furnished">Fully Furnished</option>
              <option value="semi-furnished">Semi Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: themeColors.text }} />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInput}
                placeholder="Search by title..."
                className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-44 focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1" style={{ maxHeight: "520px" }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: themeColors.surface }}>
                {["Actions","Room","Owner","Rent","Location","Furnishing","For","Status","Posted"].map((h) => (
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
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size={24} />
                      <span className="text-xs opacity-50" style={{ color: themeColors.text }}>Loading rooms...</span>
                    </div>
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm opacity-50" style={{ color: themeColors.text }}>
                    No rooms found.
                  </td>
                </tr>
              ) : rooms.map((row) => {
                const furnishing = FURNISHING_MAP[row.furnishing];
                const status     = getRowStatus(row);
                const approvingId = actionLoading[row._id + "_approve"];
                return (
                  <tr key={row._id} className="border-b hover:bg-black/5 transition-colors" style={{ borderColor: themeColors.border }}>
                    {/* Actions */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelectedRoom(row)} title="View"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80"
                          style={{ color: themeColors.primary, borderColor: themeColors.primary + "40", backgroundColor: themeColors.primary + "10" }}>
                          <FaEye /> View
                        </button>
                        {!row.isApproved && row.isActive && (
                          <button onClick={() => handleApprove(row)} disabled={approvingId} title="Approve"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ color: "#10b981", borderColor: "#10b98140", backgroundColor: "#10b98110" }}>
                            {approvingId ? <Spinner size={12} color="#10b981" /> : <FaCheckCircle />} Approve
                          </button>
                        )}
                        {row.isActive && !row.isApproved && (
                          <button onClick={() => openRejectModal(row)} title="Reject"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80"
                            style={{ color: "#ef4444", borderColor: "#ef444440", backgroundColor: "#ef444410" }}>
                            <FaTimesCircle /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Room */}
                    <td className="px-4 py-2">
                      <p className="font-medium text-sm whitespace-nowrap" style={{ color: themeColors.text }}>{row.title}</p>
                      <p className="text-xs opacity-50" style={{ color: themeColors.text }}>{row.type} • {row.bhk || "-"}</p>
                    </td>
                    {/* Owner */}
                    <td className="px-4 py-2">
                      <p className="text-sm whitespace-nowrap" style={{ color: themeColors.text }}>{row.owner?.name || "-"}</p>
                      <p className="text-xs opacity-50" style={{ color: themeColors.text }}>{row.owner?.phone || "-"}</p>
                    </td>
                    {/* Rent */}
                    <td className="px-4 py-2">
                      <p className="text-sm font-semibold whitespace-nowrap" style={{ color: themeColors.text }}>₹{row.rent?.toLocaleString()}/mo</p>
                      {row.deposit > 0 && <p className="text-xs opacity-50" style={{ color: themeColors.text }}>Dep: ₹{row.deposit?.toLocaleString()}</p>}
                    </td>
                    {/* Location */}
                    <td className="px-4 py-2">
                      <p className="text-sm whitespace-nowrap" style={{ color: themeColors.text }}>{row.location?.city || "-"}</p>
                      <p className="text-xs opacity-50" style={{ color: themeColors.text }}>{row.location?.area || "-"}</p>
                    </td>
                    {/* Furnishing */}
                    <td className="px-4 py-2">
                      {furnishing
                        ? <Badge color={furnishing.color} bg={furnishing.bg}>{furnishing.label}</Badge>
                        : <span className="text-sm" style={{ color: themeColors.text }}>{row.furnishing || "-"}</span>}
                    </td>
                    {/* For */}
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border capitalize"
                        style={{ color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.border }}>
                        {row.for?.replace(/-/g, " ") || "-"}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-2">
                      <Badge color={status.color} bg={status.bg}>{status.label}</Badge>
                    </td>
                    {/* Posted */}
                    <td className="px-4 py-2">
                      <span className="text-xs whitespace-nowrap" style={{ color: themeColors.text }}>{fmtDate(row.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar — pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: themeColors.border }}>
          <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
            Page <b>{page}</b> of <b>{pages}</b> — <b>{total}</b> total rooms
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-black/5 transition-colors"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              <FaChevronLeft /> Prev
            </button>
            {pageNumbers.map((n) => (
              <button key={n} onClick={() => setPage(n)} disabled={loading}
                className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: page === n ? themeColors.primary : "transparent",
                  color: page === n ? themeColors.onPrimary : themeColors.text,
                  borderColor: page === n ? themeColors.primary : themeColors.border,
                }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-black/5 transition-colors"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              Next <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col" style={{ backgroundColor: themeColors.surface }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: themeColors.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>{selectedRoom.title}</h2>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: themeColors.text }}>{selectedRoom.type} • {selectedRoom.location?.city}</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-xl px-2" style={{ color: themeColors.text }}>×</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {selectedRoom.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedRoom.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="h-32 w-48 rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Rent",             `₹${selectedRoom.rent?.toLocaleString()}/mo`],
                  ["Deposit",          `₹${selectedRoom.deposit?.toLocaleString()}`],
                  ["Maintenance",      `₹${selectedRoom.maintenanceCharges}`],
                  ["Electricity",      selectedRoom.electricityCharges],
                  ["Furnishing",       selectedRoom.furnishing],
                  ["For",              selectedRoom.for],
                  ["BHK",              selectedRoom.bhk || "-"],
                  ["Floor",            selectedRoom.floor != null ? `${selectedRoom.floor}/${selectedRoom.totalFloors}` : "-"],
                  ["Area",             selectedRoom.area ? `${selectedRoom.area} sq ft` : "-"],
                  ["Facing",           selectedRoom.facing || "-"],
                  ["Available From",   fmtDate(selectedRoom.availableFrom)],
                  ["Negotiable",       selectedRoom.negotiable ? "Yes" : "No"],
                  ["Views",            selectedRoom.views],
                  ["Contact Views",    selectedRoom.contactViews],
                  ["Rating",           selectedRoom.rating],
                  ["Owner",            selectedRoom.owner?.name || "-"],
                  ["Owner Phone",      selectedRoom.owner?.phone || "-"],
                  ["Posted",           fmtDate(selectedRoom.createdAt)],
                  ["Rejection Reason", selectedRoom.rejectionReason || "-"],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: themeColors.text }}>{value}</p>
                  </div>
                ))}
              </div>
              {selectedRoom.amenities?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold opacity-60 mb-2" style={{ color: themeColors.text }}>Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities.map((a) => (
                      <span key={a} className="px-2 py-1 rounded-lg text-xs border capitalize" style={{ borderColor: themeColors.border, color: themeColors.text }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedRoom.description && (
                <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-[10px] uppercase opacity-50 font-semibold mb-1" style={{ color: themeColors.text }}>Description</p>
                  <p className="text-sm" style={{ color: themeColors.text }}>{selectedRoom.description}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: themeColors.border }}>
              {!selectedRoom.isApproved && selectedRoom.isActive && (
                <>
                  <button onClick={() => { handleApprove(selectedRoom); setSelectedRoom(null); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                    style={{ backgroundColor: "#10b981", color: "#fff" }}>
                    <FaCheckCircle /> Approve
                  </button>
                  <button onClick={() => { setSelectedRoom(null); openRejectModal(selectedRoom); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                    <FaTimesCircle /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setSelectedRoom(null)}
                className="px-6 py-2 rounded-lg font-semibold text-sm border"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
          style={{ opacity: rejectModal.visible ? 1 : 0 }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl border transition-all duration-200"
            style={{
              backgroundColor: themeColors.surface, borderColor: themeColors.border,
              opacity: rejectModal.visible ? 1 : 0,
              transform: rejectModal.visible ? "scale(1)" : "scale(0.92)",
            }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-bold" style={{ color: themeColors.text }}>Reject Room</h2>
              <button onClick={closeRejectModal} className="text-xl px-1" style={{ color: themeColors.text }}>×</button>
            </div>
            <div className="p-5 space-y-4">
              {rejectModal.error && (
                <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: "#ef444415", borderColor: "#ef444430", color: "#ef4444" }}>
                  {rejectModal.error}
                </div>
              )}
              <p className="text-sm" style={{ color: themeColors.text }}>
                Rejection reason for <span className="font-semibold">{rejectModal.room?.title}</span>:
              </p>
              <textarea rows={3} value={rejectModal.reason}
                onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button onClick={closeRejectModal} className="px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>
                Cancel
              </button>
              <button onClick={handleRejectSubmit} disabled={!rejectModal.reason.trim() || rejectModal.loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                {rejectModal.loading ? <><Spinner size={14} color="#fff" /> Rejecting...</> : "Reject Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
