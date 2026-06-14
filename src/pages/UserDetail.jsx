import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getUserById } from "../apis/user";
import { FaArrowLeft, FaUser } from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeColors } = useTheme();

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getUserById(id);
        setUser(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load user.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-4 rounded-lg border text-sm" style={{ backgroundColor: themeColors.danger + "15", color: themeColors.danger, borderColor: themeColors.danger + "50" }}>
        {error || "User not found."}
      </div>
    );
  }

  const fields = [
    ["Mobile",  user.mobile],
    ["Email",   user.email   || "-"],
    ["City",    user.city    || "-"],
    ["State",   user.state   || "-"],
    ["Pincode", user.pincode || "-"],
    ["Address", user.address || "-"],
    ["Status",  user.isActive ? "Active" : "Inactive"],
    ["Joined",  fmtDate(user.createdAt)],
    ["Updated", fmtDate(user.updatedAt)],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all hover:opacity-80"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
          <FaUser style={{ color: themeColors.primary }} /> User Detail
        </h1>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border p-6 flex items-center gap-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden flex-shrink-0"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
        >
          {user.profilePhoto?.url
            ? <img src={user.profilePhoto.url} alt={user.name} className="h-20 w-20 object-cover" />
            : user.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{user.name || "-"}</h2>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>{user.mobile}</p>
          <span
            className="inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={user.isActive
              ? { backgroundColor: "#10b98115", color: "#10b981" }
              : { backgroundColor: "#ef444415", color: "#ef4444" }}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="rounded-2xl border p-6" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <h3 className="text-sm font-semibold mb-4 opacity-60 uppercase tracking-wide" style={{ color: themeColors.text }}>Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fields.map(([label, value]) => (
            <div key={label} className="p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
              <p className="text-sm font-medium mt-0.5 break-words" style={{ color: themeColors.text }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
