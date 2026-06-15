import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getUserById, adminCreateUser, adminUpdateUser, adminToggleUserStatus } from "../apis/user";
import { FaArrowLeft, FaUser, FaEdit, FaSave, FaTimes, FaToggleOn, FaToggleOff } from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const emptyForm = { name: "", mobile: "", email: "", city: "", state: "", pincode: "", address: "" };

export default function UserDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { themeColors } = useTheme();

  const isAddMode  = location.pathname === "/users/add";
  const isEditMode = location.pathname.startsWith("/users/edit/");

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(!isAddMode && !isEditMode);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [isEditing, setIsEditing] = useState(isAddMode || isEditMode);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [form, setForm]               = useState(emptyForm);
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const inputStyle = {
    backgroundColor: themeColors.background,
    borderColor: themeColors.border,
    color: themeColors.text,
  };

  // ── fetch user ─────────────────────────────────────────────
  useEffect(() => {
    if (isAddMode) return;
    (async () => {
      try {
        const res = await getUserById(id);
        setUser(res.data);
        setPhotoPreview(res.data.profilePhoto?.url || "");
        if (isEditMode) {
          setForm({
            name: res.data.name || "", mobile: res.data.mobile || "", email: res.data.email || "",
            city: res.data.city || "", state: res.data.state || "", pincode: res.data.pincode || "", address: res.data.address || "",
          });
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load user.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAddMode, isEditMode]);

  // ── pincode auto-fill ──────────────────────────────────────
  const handlePincode = async (val) => {
    setForm((p) => ({ ...p, pincode: val }));
    if (val.length !== 6) return;
    try {
      setPincodeLoading(true);
      const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
      const data = await res.json();
      const post = data?.[0]?.PostOffice?.[0];
      if (post) {
        setForm((p) => ({ ...p, city: post.District || p.city, state: post.State || p.state }));
      }
    } catch (_) {}
    finally { setPincodeLoading(false); }
  };

  // ── start edit ─────────────────────────────────────────────
  const startEdit = () => {
    setForm({
      name: user.name || "", mobile: user.mobile || "", email: user.email || "",
      city: user.city || "", state: user.state || "", pincode: user.pincode || "", address: user.address || "",
    });
    setPhotoFile(null);
    setPhotoPreview(user.profilePhoto?.url || "");
    setError("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (isEditMode) { navigate(`/users/${id}`); return; }
    setIsEditing(false);
    setPhotoFile(null);
    setPhotoPreview(user?.profilePhoto?.url || "");
    setError("");
  };

  // ── submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile.trim()) { setError("Mobile number is required."); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (photoFile) fd.append("profilePhoto", photoFile);

    try {
      setSaving(true); setError("");
      if (isAddMode) {
        await adminCreateUser(fd);
        navigate("/users");
      } else {
        const res = await adminUpdateUser(id, fd);
        setUser(res.data);
        if (isEditMode) { navigate(`/users/${id}`); return; }
        setIsEditing(false);
        setPhotoPreview(res.data.profilePhoto?.url || "");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  // ── toggle ─────────────────────────────────────────────────
  const handleToggle = async () => {
    try {
      const res = await adminToggleUserStatus(id);
      setUser(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle status.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
    </div>
  );

  if (!isAddMode && !isEditMode && !loading && (error || !user)) return (
    <div className="p-4 rounded-lg border text-sm"
      style={{ backgroundColor: themeColors.danger + "15", color: themeColors.danger, borderColor: themeColors.danger + "50" }}>
      {error || "User not found."}
    </div>
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/users")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaUser style={{ color: themeColors.primary }} />
            {isAddMode ? "Add User" : isEditMode ? "Edit User" : isEditing ? "Edit User" : "User Detail"}
          </h1>
        </div>

        {!isAddMode && !isEditMode && !isEditing && user && (
          <div className="flex items-center gap-2">
            <button onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:opacity-80"
              style={{
                color: user.isActive ? "#f59e0b" : "#10b981",
                borderColor: (user.isActive ? "#f59e0b" : "#10b981") + "40",
                backgroundColor: (user.isActive ? "#f59e0b" : "#10b981") + "10",
              }}>
              {user.isActive ? <FaToggleOn /> : <FaToggleOff />}
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
            <button onClick={startEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:opacity-80"
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
              <FaEdit /> Edit
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* ── VIEW MODE ─────────────────────────────────────── */}
      {!isAddMode && !isEditMode && !isEditing && user && (
        <>
          <div className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0"
              style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
              {user.profilePhoto?.url
                ? <img src={user.profilePhoto.url} alt={user.name} className="h-16 w-16 object-cover" />
                : user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>{user.name || "-"}</h2>
              <p className="text-xs opacity-60 mt-0.5" style={{ color: themeColors.text }}>{user.mobile}</p>
              <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={user.isActive ? { backgroundColor: "#10b98115", color: "#10b981" } : { backgroundColor: "#ef444415", color: "#ef4444" }}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <p className="text-xs font-semibold mb-3 opacity-60 uppercase tracking-wide" style={{ color: themeColors.text }}>Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                ["Mobile",  user.mobile],
                ["Email",   user.email   || "-"],
                ["City",    user.city    || "-"],
                ["State",   user.state   || "-"],
                ["Pincode", user.pincode || "-"],
                ["Status",  user.isActive ? "Active" : "Inactive"],
                ["Joined",  fmtDate(user.createdAt)],
                ["Updated", fmtDate(user.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="p-2.5 rounded-xl border"
                  style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
                  <p className="text-sm font-medium mt-0.5 break-words" style={{ color: themeColors.text }}>{value}</p>
                </div>
              ))}
            </div>
            {user.address && (
              <div className="mt-3 p-2.5 rounded-xl border"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>Address</p>
                <p className="text-sm font-medium mt-0.5 break-words" style={{ color: themeColors.text }}>{user.address}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ADD / EDIT FORM ───────────────────────────────── */}
      {(isAddMode || isEditMode || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Photo + Basic */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <p className="text-xs font-semibold opacity-60 uppercase tracking-wide" style={{ color: themeColors.text }}>Basic Info</p>

            {/* Photo row */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                {photoPreview ? <img src={photoPreview} alt="preview" className="h-12 w-12 object-cover" /> : <FaUser />}
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 text-xs"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>
                {photoFile ? photoFile.name : "Choose Photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setPhotoFile(f || null);
                    setPhotoPreview(f ? URL.createObjectURL(f) : (user?.profilePhoto?.url || ""));
                  }} />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>Name</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name" className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>
                  Mobile <span className="text-red-500">*</span>
                </label>
                <input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                  placeholder="10-digit" disabled={!isAddMode}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none disabled:opacity-50" style={inputStyle} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>Email</label>
                <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email" type="email"
                  className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <p className="text-xs font-semibold opacity-60 uppercase tracking-wide" style={{ color: themeColors.text }}>Address Info</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>
                  Pincode {pincodeLoading && <span className="opacity-50">(loading...)</span>}
                </label>
                <input value={form.pincode} onChange={(e) => handlePincode(e.target.value)}
                  placeholder="6-digit" maxLength={6}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>City</label>
                <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City" className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>State</label>
                <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="State" className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium" style={{ color: themeColors.text }}>Address</label>
              <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                rows={2} placeholder="Full address"
                className="w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none resize-none" style={inputStyle} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {!isAddMode && (
              <button type="button" onClick={cancelEdit} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>
                <FaTimes /> Cancel
              </button>
            )}
            <button type="button" onClick={() => navigate("/users")} disabled={saving}
              className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              Back
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
              <FaSave /> {saving ? "Saving..." : isAddMode ? "Create User" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
