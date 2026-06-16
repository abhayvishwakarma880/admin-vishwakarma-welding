import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { adminGetWishlistById, adminDeleteWishlist } from "../apis/wishlist";
import {
  FaArrowLeft, FaHeart, FaTrash, FaUser, FaBox, FaPhone,
  FaEnvelope, FaMapMarkerAlt, FaTag, FaCalendarAlt,
} from "react-icons/fa";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "-";

export default function WishlistDetail() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const { themeColors }   = useTheme();

  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminGetWishlistById(id);
        setItem(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load wishlist item.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Kya aap is wishlist item ko delete karna chahte hain?")) return;
    try {
      setDeleting(true);
      await adminDeleteWishlist(id);
      navigate("/wishlists");
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed.");
      setDeleting(false);
    }
  };

  const cardStyle = { backgroundColor: themeColors.surface, borderColor: themeColors.border };
  const labelStyle = { color: themeColors.text, opacity: 0.5 };
  const valueStyle = { color: themeColors.text };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full"
        style={{ borderColor: themeColors.primary }} />
    </div>
  );

  if (error || !item) return (
    <div className="p-4 rounded-lg border text-sm"
      style={{ backgroundColor: themeColors.danger + "15", color: themeColors.danger, borderColor: themeColors.danger + "50" }}>
      {error || "Item not found."}
    </div>
  );

  const user    = item.userId;
  const product = item.productId;
  const finalPrice = product
    ? (product.finalPrice ?? product.price - (product.price * (product.discount || 0)) / 100)
    : 0;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/wishlists")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
            style={cardStyle}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaHeart style={{ color: "#ef4444" }} /> Wishlist Detail
          </h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50"
          style={{ color: "#ef4444", borderColor: "#ef444440", backgroundColor: "#ef444410" }}
        >
          <FaTrash /> {deleting ? "Deleting..." : "Delete Item"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* Meta info */}
      <div className="rounded-2xl border p-4 flex items-center gap-3" style={cardStyle}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#ef444420" }}>
          <FaHeart style={{ color: "#ef4444" }} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase opacity-50" style={labelStyle}>Wishlisted On</p>
          <p className="text-sm font-medium mt-0.5" style={valueStyle}>{fmtDate(item.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── User Card ────────────────────────────────────── */}
        <div className="rounded-2xl border p-5 space-y-4" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-1.5" style={labelStyle}>
            <FaUser /> User Info
          </p>

          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
              {user?.profilePhoto?.url
                ? <img src={user.profilePhoto.url} alt={user.name} className="h-14 w-14 object-cover" />
                : user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-bold text-base" style={valueStyle}>{user?.name || "-"}</p>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={user?.isActive ? { backgroundColor: "#10b98115", color: "#10b981" } : { backgroundColor: "#ef444415", color: "#ef4444" }}
              >
                {user?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            {/* Mobile — clickable call */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <FaPhone className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Mobile</p>
                <a
                  href={`tel:${user?.mobile}`}
                  className="text-sm font-bold hover:underline"
                  style={{ color: themeColors.primary }}
                >
                  {user?.mobile || "-"}
                </a>
                <span className="ml-2 text-[10px] text-green-500 font-medium">(tap to call)</span>
              </div>
            </div>

            {user?.email && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                <FaEnvelope className="opacity-50 flex-shrink-0" style={{ color: themeColors.text }} />
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Email</p>
                  <p className="text-sm font-medium" style={valueStyle}>{user.email}</p>
                </div>
              </div>
            )}

            {(user?.city || user?.state) && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                <FaMapMarkerAlt className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Location</p>
                  <p className="text-sm font-medium" style={valueStyle}>
                    {[user.city, user.state, user.pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {user?.address && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                <FaMapMarkerAlt className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Address</p>
                  <p className="text-sm font-medium" style={valueStyle}>{user.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Product Card ──────────────────────────────────── */}
        <div className="rounded-2xl border p-5 space-y-4" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-1.5" style={labelStyle}>
            <FaBox /> Product Info
          </p>

          {/* Product image + name */}
          {product ? (
            <>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: themeColors.border }}>
                {product.mainImage?.url
                  ? <img src={product.mainImage.url} alt={product.name} className="w-full h-48 object-cover" />
                  : <div className="w-full h-48 flex items-center justify-center text-slate-300 bg-slate-100">
                      <FaBox className="text-4xl" />
                    </div>
                }
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Product Name</p>
                  <p className="text-sm font-bold mt-0.5" style={valueStyle}>{product.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>MRP</p>
                    <p className="text-sm font-bold mt-0.5" style={valueStyle}>₹{product.price?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Final Price</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: themeColors.primary }}>₹{finalPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {product.discount > 0 && (
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Discount</p>
                    <p className="text-sm font-bold mt-0.5 text-green-600">{product.discount}% OFF</p>
                  </div>
                )}

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <FaTag className="opacity-40 flex-shrink-0" style={{ color: themeColors.text }} />
                  <div>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Status</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={product.isActive ? { backgroundColor: "#10b98115", color: "#10b981" } : { backgroundColor: "#ef444415", color: "#ef4444" }}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={labelStyle}>Description</p>
                    <p className="text-sm mt-0.5 leading-relaxed opacity-80" style={valueStyle}>
                      {product.description.replace(/<[^>]*>/g, "").slice(0, 200)}
                      {product.description.length > 200 ? "..." : ""}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center opacity-40" style={{ color: themeColors.text }}>
              Product deleted ya available nahi hai
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
