import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getProductById, toggleProductStatus, deleteProduct } from "../apis/products";
import { FaArrowLeft, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const fmtCurrency = (n) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-";

export default function ProductDetail() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [activeImg, setActiveImg] = useState(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await getProductById(id);
      setProduct(res.data);
      setActiveImg(res.data?.mainImage?.url || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const handleToggle = async () => {
    try {
      await toggleProductStatus(id);
      fetchProduct();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await deleteProduct(id);
      navigate("/products");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 rounded-lg border text-sm" style={{ backgroundColor: themeColors.danger + "15", color: themeColors.danger, borderColor: themeColors.danger + "50" }}>
        {error || "Product not found."}
      </div>
    );
  }

  const allImages = [
    ...(product.mainImage?.url ? [product.mainImage.url] : []),
    ...(product.galleryImages?.map((g) => g.url) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/products")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>{product.name}</h1>
          {product.isActive
            ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
            : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleToggle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
            style={{ color: product.isActive ? "#f59e0b" : "#10b981", borderColor: (product.isActive ? "#f59e0b" : "#10b981") + "40", backgroundColor: (product.isActive ? "#f59e0b" : "#10b981") + "10" }}>
            {product.isActive ? <FaToggleOn /> : <FaToggleOff />}
            {product.isActive ? "Deactivate" : "Activate"}
          </button>
          <button onClick={() => navigate(`/products/edit/${id}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaEdit /> Edit
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
            style={{ color: "#ef4444", borderColor: "#ef444440", backgroundColor: "#ef444410" }}>
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: themeColors.border }}>
            {activeImg
              ? <img src={activeImg} alt={product.name} className="w-full h-72 object-cover" />
              : <div className="w-full h-72 flex items-center justify-center" style={{ backgroundColor: themeColors.border }}>
                  <span className="text-xs opacity-50" style={{ color: themeColors.text }}>No Image</span>
                </div>}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {allImages.map((url, i) => (
                <button key={i} onClick={() => setActiveImg(url)}
                  className="rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: activeImg === url ? themeColors.primary : themeColors.border }}>
                  <img src={url} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Pricing card */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <p className="text-xs uppercase opacity-50 font-semibold mb-3" style={{ color: themeColors.text }}>Pricing</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ color: themeColors.primary }}>{fmtCurrency(product.finalPrice)}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-sm line-through opacity-50" style={{ color: themeColors.text }}>{fmtCurrency(product.price)}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>{product.discount}% OFF</span>
                </>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Category", product.category?.name || "-"],
              ["Created",  fmtDate(product.createdAt)],
              ["Updated",  fmtDate(product.updatedAt)],
              ["Status",   product.isActive ? "Active" : "Inactive"],
            ].map(([label, value]) => (
              <div key={label} className="p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: themeColors.text }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description & About */}
      {(product.description || product.aboutThisProduct) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.description && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <p className="text-xs uppercase opacity-50 font-semibold mb-2" style={{ color: themeColors.text }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: themeColors.text }}>{product.description}</p>
            </div>
          )}
          {product.aboutThisProduct && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <p className="text-xs uppercase opacity-50 font-semibold mb-2" style={{ color: themeColors.text }}>About This Product</p>
              <p className="text-sm leading-relaxed" style={{ color: themeColors.text }}>{product.aboutThisProduct}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
