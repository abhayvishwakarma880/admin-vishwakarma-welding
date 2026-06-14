import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useUserData } from "../context/UserDataContext";
import { updateProfile } from "../apis/auth";
import {
  FaUserCircle, FaMapMarkerAlt, FaWallet, FaStar,
  FaShieldAlt, FaCalendarAlt, FaIdBadge, FaEdit, FaSave, FaTimes, FaEye, FaEyeSlash,
} from "react-icons/fa";
import { formatDate, formatTime } from "../utils/format";

// ── Read-only field ────────────────────────────────────────────
const Field = ({ label, value, themeColors }) => (
  <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
    <p className="text-[10px] uppercase font-semibold opacity-50 mb-0.5" style={{ color: themeColors.text }}>{label}</p>
    <p className="text-sm font-medium" style={{ color: themeColors.text }}>{value || "-"}</p>
  </div>
);

// ── Editable field ─────────────────────────────────────────────
const EditField = ({ label, name, value, onChange, themeColors, type = "text" }) => (
  <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.primary + "60", backgroundColor: themeColors.background }}>
    <p className="text-[10px] uppercase font-semibold opacity-50 mb-1" style={{ color: themeColors.text }}>{label}</p>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full text-sm bg-transparent outline-none"
      style={{ color: themeColors.text }}
    />
  </div>
);

// ── Section wrapper ────────────────────────────────────────────
const Section = ({ title, icon, themeColors, children }) => (
  <div className="p-5 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
    <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: themeColors.text }}>
      <span style={{ color: themeColors.primary }}>{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

export default function Profile() {
  const { themeColors } = useTheme();
  const { userData, userLoading, fetchUserData } = useUserData();

  const [editMode, setEditMode]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [form, setForm]           = useState({});

  const u = userData;

  const startEdit = () => {
    setForm({
      name:     u.name     || "",
      email:    u.email    || "",
      bio:      u.bio      || "",
      gender:   u.gender   || "",
      location: {
        address: u.location?.address || "",
        area:    u.location?.area    || "",
        city:    u.location?.city    || "",
        state:   u.location?.state   || "",
        pincode: u.location?.pincode || "",
      },
      newPassword:     "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setError(""); setSuccess(""); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setForm((p) => ({ ...p, location: { ...p.location, [key]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (form.newPassword && form.newPassword !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (form.newPassword && form.newPassword.length < 8)
      return setError("Password must be at least 8 characters.");

    try {
      setSaving(true);
      setError("");
      const payload = {
        name:     form.name,
        email:    form.email,
        bio:      form.bio,
        gender:   form.gender,
        location: form.location,
        ...(form.newPassword && { password: form.newPassword }),
      };
      await updateProfile(payload);
      await fetchUserData();
      setSuccess("Profile updated successfully.");
      setEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
    </div>
  );

  if (!u) return (
    <div className="text-center py-20 text-sm opacity-50" style={{ color: themeColors.text }}>Failed to load profile.</div>
  );

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header Card ── */}
      <div className="p-6 rounded-xl border flex items-center gap-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
        >
          {u.avatar
            ? <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
            : u.name?.[0]?.toUpperCase() || <FaUserCircle />}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>{u.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: themeColors.primary + "20", color: themeColors.primary }}>{u.role}</span>
            {u.isVerified && <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98120", color: "#10b981" }}>✓ Verified</span>}
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: u.isActive ? "#10b98115" : "#ef444415", color: u.isActive ? "#10b981" : "#ef4444" }}>
              {u.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-xs opacity-50 mt-1" style={{ color: themeColors.text }}>Member since {formatDate(u.createdAt)}</p>
        </div>

        {/* Edit / Save / Cancel buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
              style={{ backgroundColor: themeColors.primary + "15", borderColor: themeColors.primary + "40", color: themeColors.primary }}
            >
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
              >
                <FaSave /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                <FaTimes /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error / Success */}
      {error   && <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: "#ef444415", borderColor: "#ef444430", color: "#ef4444" }}>{error}</div>}
      {success && <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: "#10b98115", borderColor: "#10b98130", color: "#10b981" }}>{success}</div>}

      {/* ── Basic Info ── */}
      <Section title="Basic Information" icon={<FaIdBadge />} themeColors={themeColors}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {editMode ? (
            <>
              <EditField label="Full Name"  name="name"   value={form.name}   onChange={handleChange} themeColors={themeColors} />
              <Field     label="Phone"      value={u.phone}                    themeColors={themeColors} />
              <EditField label="Email"      name="email"  value={form.email}  onChange={handleChange} themeColors={themeColors} />
              <EditField label="Gender"     name="gender" value={form.gender} onChange={handleChange} themeColors={themeColors} />
              <Field label="Date of Birth"  value={formatDate(u.dateOfBirth)}  themeColors={themeColors} />
              <Field label="Last Seen"      value={`${formatDate(u.lastSeen)} ${formatTime(u.lastSeen)}`} themeColors={themeColors} />
            </>
          ) : (
            <>
              <Field label="Full Name"     value={u.name}                                              themeColors={themeColors} />
              <Field label="Phone"         value={u.phone}                                             themeColors={themeColors} />
              <Field label="Email"         value={u.email}                                             themeColors={themeColors} />
              <Field label="Gender"        value={u.gender}                                            themeColors={themeColors} />
              <Field label="Date of Birth" value={formatDate(u.dateOfBirth)}                           themeColors={themeColors} />
              <Field label="Last Seen"     value={`${formatDate(u.lastSeen)} ${formatTime(u.lastSeen)}`} themeColors={themeColors} />
            </>
          )}
        </div>
      </Section>

      {/* ── Location ── */}
      <Section title="Location" icon={<FaMapMarkerAlt />} themeColors={themeColors}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {editMode ? (
            <>
              <EditField label="Address" name="location.address" value={form.location?.address} onChange={handleChange} themeColors={themeColors} />
              <EditField label="Area"    name="location.area"    value={form.location?.area}    onChange={handleChange} themeColors={themeColors} />
              <EditField label="City"    name="location.city"    value={form.location?.city}    onChange={handleChange} themeColors={themeColors} />
              <EditField label="State"   name="location.state"   value={form.location?.state}   onChange={handleChange} themeColors={themeColors} />
              <EditField label="Pincode" name="location.pincode" value={form.location?.pincode} onChange={handleChange} themeColors={themeColors} />
            </>
          ) : (
            <>
              <Field label="Address" value={u.location?.address} themeColors={themeColors} />
              <Field label="Area"    value={u.location?.area}    themeColors={themeColors} />
              <Field label="City"    value={u.location?.city}    themeColors={themeColors} />
              <Field label="State"   value={u.location?.state}   themeColors={themeColors} />
              <Field label="Pincode" value={u.location?.pincode} themeColors={themeColors} />
            </>
          )}
        </div>
      </Section>

      {/* ── Bio ── */}
      <Section title="Bio" icon={<FaUserCircle />} themeColors={themeColors}>
        {editMode ? (
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.primary + "60", color: themeColors.text }}
          />
        ) : (
          <p className="text-sm" style={{ color: themeColors.text }}>{u.bio || "-"}</p>
        )}
      </Section>

      {/* ── Change Password (only in edit mode) ── */}
      {editMode && (
        <Section title="Change Password" icon={<FaShieldAlt />} themeColors={themeColors}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.primary + "60", backgroundColor: themeColors.background }}>
              <p className="text-[10px] uppercase font-semibold opacity-50 mb-1" style={{ color: themeColors.text }}>New Password</p>
              <div className="flex items-center gap-2">
                <input
                  type={showPass ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: themeColors.text }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="opacity-50 hover:opacity-100" style={{ color: themeColors.text }}>
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.primary + "60", backgroundColor: themeColors.background }}>
              <p className="text-[10px] uppercase font-semibold opacity-50 mb-1" style={{ color: themeColors.text }}>Confirm Password</p>
              <input
                type={showPass ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className="w-full text-sm bg-transparent outline-none"
                style={{ color: themeColors.text }}
              />
            </div>
          </div>
        </Section>
      )}

      {/* ── Verification (read-only) ── */}
      <Section title="Verification" icon={<FaShieldAlt />} themeColors={themeColors}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Phone Verified"     value={u.isPhoneVerified ? "Yes" : "No"} themeColors={themeColors} />
          <Field label="Email Verified"     value={u.isEmailVerified ? "Yes" : "No"} themeColors={themeColors} />
          <Field label="Verification Badge" value={u.verificationBadge}              themeColors={themeColors} />
          <Field label="KYC Status"         value={u.kyc?.status}                    themeColors={themeColors} />
        </div>
      </Section>

      {/* ── Wallet & Earnings (read-only) ── */}
      <Section title="Wallet & Earnings" icon={<FaWallet />} themeColors={themeColors}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Wallet Balance"  value={`₹${u.wallet ?? 0}`}           themeColors={themeColors} />
          <Field label="Total Earnings"  value={`₹${u.totalEarnings ?? 0}`}    themeColors={themeColors} />
          <Field label="Total Spent"     value={`₹${u.totalSpent ?? 0}`}       themeColors={themeColors} />
          <Field label="Plan"            value={u.plan}                         themeColors={themeColors} />
          <Field label="Plan Expiry"     value={formatDate(u.planExpiry)}       themeColors={themeColors} />
        </div>
      </Section>

      {/* ── Ratings (read-only) ── */}
      <Section title="Ratings & Reviews" icon={<FaStar />} themeColors={themeColors}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Rating"        value={u.rating ?? 0}       themeColors={themeColors} />
          <Field label="Total Reviews" value={u.totalReviews ?? 0} themeColors={themeColors} />
          <Field label="Report Count"  value={u.reportCount ?? 0}  themeColors={themeColors} />
        </div>
      </Section>

      {/* ── Referral (read-only) ── */}
      <Section title="Referral" icon={<FaCalendarAlt />} themeColors={themeColors}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Referral Code"     value={u.referralCode}                 themeColors={themeColors} />
          <Field label="Referral Count"    value={u.referralCount ?? 0}           themeColors={themeColors} />
          <Field label="Referral Earnings" value={`₹${u.referralEarnings ?? 0}`} themeColors={themeColors} />
        </div>
      </Section>

    </div>
  );
}
