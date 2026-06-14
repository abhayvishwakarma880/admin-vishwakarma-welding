import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { getDashboardStats } from "../apis/admin";
import {
  FaUsers, FaHome, FaBriefcase, FaTools,
  FaClock, FaExclamationTriangle, FaFlag,
  FaRupeeSign, FaSyncAlt,
} from "react-icons/fa";

const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "-");
const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : "-";

const StatCard = ({ title, value, sub, icon: Icon, themeColors }) => (
  <div
    className="p-5 rounded-xl border flex items-start gap-4 hover:shadow-md transition-shadow"
    style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
  >
    <div
      className="p-3 rounded-xl"
      style={{ backgroundColor: themeColors.primary + "15" }}
    >
      <Icon className="text-xl" style={{ color: themeColors.primary }} />
    </div>
    <div>
      <p className="text-xs font-medium opacity-60" style={{ color: themeColors.text }}>{title}</p>
      <p className="text-2xl font-bold mt-0.5" style={{ color: themeColors.primary }}>{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5" style={{ color: themeColors.text }}>{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const { themeColors } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const res = await getDashboardStats();
      setStats(res.stats);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load stats.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const s = stats;

  // Role wise users
  const roleMap = {};
  s?.users?.byRole?.forEach(({ _id, count }) => { roleMap[_id] = count; });

  // Booking status
  const bookingMap = {};
  s?.bookings?.byStatus?.forEach(({ _id, count }) => { bookingMap[_id] = count; });

  const summaryCards = s ? [
    { title: "Total Users",      value: fmtNum(s.users.total),         sub: `New today: ${fmtNum(s.users.newToday)}`,                icon: FaUsers },
    { title: "Total Revenue",    value: fmtCurrency(s.revenue),        sub: "Platform earnings",                                     icon: FaRupeeSign },
    { title: "Total Rooms",      value: fmtNum(s.listings.rooms),      sub: `Pending approval: ${fmtNum(s.pending.rooms)}`,          icon: FaHome },
    { title: "Total Jobs",       value: fmtNum(s.listings.jobs),       sub: `Pending approval: ${fmtNum(s.pending.jobs)}`,           icon: FaBriefcase },
    { title: "Total Services",   value: fmtNum(s.listings.services),   sub: `Pending approval: ${fmtNum(s.pending.services)}`,       icon: FaTools },
    { title: "Total Bookings",   value: fmtNum(s.bookings.total),      sub: `Confirmed: ${fmtNum(bookingMap.confirmed)} • Pending: ${fmtNum(bookingMap.pending)}`, icon: FaClock },
    { title: "Fraud Suspected",  value: fmtNum((s.fraud.rooms || 0) + (s.fraud.jobs || 0) + (s.fraud.services || 0)), sub: `Rooms: ${s.fraud.rooms} • Jobs: ${s.fraud.jobs} • Services: ${s.fraud.services}`, icon: FaExclamationTriangle },
    { title: "Pending Reports",  value: fmtNum(s.reports.pending),     sub: "Unresolved reports",                                    icon: FaFlag },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>Dashboard</h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Platform ka overview</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={loading || refreshing}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-4 rounded-lg text-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
          Loading stats...
        </div>
      )}

      {/* Stats Cards */}
      {!loading && s && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <StatCard key={card.title} {...card} themeColors={themeColors} />
            ))}
          </div>

          {/* Users by Role */}
          <div className="p-5 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: themeColors.text }}>Users by Role</h2>
            <div className="flex flex-wrap gap-3">
              {s.users.byRole.map(({ _id, count }) => (
                <div key={_id} className="px-4 py-2 rounded-lg border text-sm"
                  style={{ backgroundColor: themeColors.primary + "10", borderColor: themeColors.primary + "30", color: themeColors.primary }}>
                  <span className="font-semibold capitalize">{_id}</span>
                  <span className="ml-2 font-bold">{fmtNum(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings by Status */}
          <div className="p-5 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: themeColors.text }}>Bookings by Status</h2>
            <div className="flex flex-wrap gap-3">
              {s.bookings.byStatus.map(({ _id, count }) => (
                <div key={_id} className="px-4 py-2 rounded-lg border text-sm"
                  style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
                  <span className="font-semibold capitalize">{_id}</span>
                  <span className="ml-2 font-bold" style={{ color: themeColors.primary }}>{fmtNum(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending + Fraud Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: themeColors.text }}>Pending Approvals</h2>
              <table className="w-full text-sm">
                <tbody>
                  {[["Rooms", s.pending.rooms], ["Jobs", s.pending.jobs], ["Services", s.pending.services]].map(([label, val]) => (
                    <tr key={label} className="border-b last:border-0" style={{ borderColor: themeColors.border }}>
                      <td className="py-2 opacity-70" style={{ color: themeColors.text }}>{label}</td>
                      <td className="py-2 font-bold text-right" style={{ color: themeColors.primary }}>{fmtNum(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: themeColors.text }}>Fraud Suspected</h2>
              <table className="w-full text-sm">
                <tbody>
                  {[["Rooms", s.fraud.rooms], ["Jobs", s.fraud.jobs], ["Services", s.fraud.services]].map(([label, val]) => (
                    <tr key={label} className="border-b last:border-0" style={{ borderColor: themeColors.border }}>
                      <td className="py-2 opacity-70" style={{ color: themeColors.text }}>{label}</td>
                      <td className="py-2 font-bold text-right" style={{ color: val > 0 ? themeColors.danger : themeColors.text }}>{fmtNum(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
