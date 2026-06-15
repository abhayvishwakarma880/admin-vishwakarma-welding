import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getCategories } from "../apis/categories";
import { getProductById, updateProduct } from "../apis/products";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
// import "@ckeditor/ckeditor5-build-classic/build/ckeditor.css";

const fmtCurrency = (n) =>
  typeof n === "number" && !isNaN(n)
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : "-";

export default function EditProduct() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [form, setForm]             = useState(null);
  const [mainImageFile, setMainImageFile]       = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryFiles, setGalleryFiles]         = useState([]);
  const [galleryPreviews, setGalleryPreviews]   = useState([]);
  const [existingGallery, setExistingGallery]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    Promise.all([
      getCategories({ limit: 100 }),
      getProductById(id),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data || []);
      const p = prodRes.data;
      setForm({
        name:             p.name            || "",
        category:         p.category?._id   || "",
        price:            String(p.price)   || "",
        discount:         String(p.discount || 0),
        description:      p.description     || "",
        aboutThisProduct: p.aboutThisProduct || "",
      });
      setMainImagePreview(p.mainImage?.url || null);
      setExistingGallery(p.galleryImages   || []);
    }).catch((e) => {
      setError(e?.response?.data?.message || "Failed to load product.");
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleMainImage = (e) => {
    const file = e.target.files?.[0];
    setMainImageFile(file || null);
    setMainImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleGallery = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewGallery = (idx) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const finalPrice = form?.price
    ? Number(form.price) - (Number(form.price) * (Number(form.discount) || 0)) / 100
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price)        { setError("Price is required.");        return; }
    if (!form.category)     { setError("Category is required.");     return; }

    const fd = new FormData();
    fd.append("name",             form.name.trim());
    fd.append("category",         form.category);
    fd.append("price",            form.price);
    fd.append("discount",         form.discount || 0);
    fd.append("description",      form.description.trim());
    fd.append("aboutThisProduct", form.aboutThisProduct.trim());
    if (mainImageFile) fd.append("mainImage", mainImageFile);
    galleryFiles.forEach((f) => fd.append("galleryImages", f));

    try {
      setSaving(true);
      setError("");
      await updateProduct(id, fd);
      navigate("/products");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: themeColors.background,
    borderColor: themeColors.border,
    color: themeColors.text,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-4 rounded-lg border text-sm" style={{ backgroundColor: themeColors.danger + "15", color: themeColors.danger, borderColor: themeColors.danger + "50" }}>
        {error || "Product not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/products")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
          <FaEdit style={{ color: themeColors.primary }} /> Edit Product
        </h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>Basic Info</h2>

          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Name <span className="text-red-500">*</span></label>
            <input name="name" type="text" value={form.name} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
              style={inputStyle} placeholder="Product name" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Category <span className="text-red-500">*</span></label>
            <select name="category" value={form.category} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
              style={inputStyle}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
              style={inputStyle} placeholder="Short description..." />
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>Pricing</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Price (₹) <span className="text-red-500">*</span></label>
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Discount (%)</label>
              <input name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={inputStyle} placeholder="0" />
            </div>
          </div>

          {finalPrice !== null && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
              <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Final Price:</span>
              <span className="text-lg font-bold" style={{ color: themeColors.primary }}>{fmtCurrency(finalPrice)}</span>
              {Number(form.discount) > 0 && (
                <span className="text-xs line-through opacity-50" style={{ color: themeColors.text }}>{fmtCurrency(Number(form.price))}</span>
              )}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>Images</h2>

          {/* Main Image */}
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Main Image</label>
            <div className="flex items-start gap-4">
              {mainImagePreview && (
                <img src={mainImagePreview} alt="main" className="h-28 w-28 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs opacity-50 mb-2" style={{ color: themeColors.text }}>Upload new image to replace existing</p>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:opacity-80 w-fit text-xs"
                  style={{ borderColor: themeColors.border, color: themeColors.text }}>
                  Choose File
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMainImage} className="hidden" />
                </label>
                {mainImageFile && <p className="text-xs mt-1 opacity-60" style={{ color: themeColors.text }}>{mainImageFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Existing Gallery */}
          {existingGallery.length > 0 && (
            <div>
              <label className="block mb-2 text-sm font-medium" style={{ color: themeColors.text }}>Existing Gallery</label>
              <div className="flex flex-wrap gap-3">
                {existingGallery.map((g, i) => (
                  <img key={i} src={g.url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                ))}
              </div>
            </div>
          )}

          {/* Add More Gallery */}
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Add More Gallery Images</label>
            <div className="flex flex-wrap gap-3">
              {galleryPreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <button type="button" onClick={() => removeNewGallery(idx)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center"
                    style={{ backgroundColor: "#ef4444" }}>×</button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center h-20 w-20 rounded-xl border-2 border-dashed cursor-pointer hover:opacity-80"
                style={{ borderColor: themeColors.border }}>
                <span className="text-xl opacity-30" style={{ color: themeColors.text }}>+</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGallery} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* About This Product - CKEditor */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>About This Product</h2>
          <div className="ck-wrapper">
            <CKEditor
              editor={ClassicEditor}
              data={form.aboutThisProduct}
              onChange={(_, editor) =>
                setForm((prev) => ({ ...prev, aboutThisProduct: editor.getData() }))
              }
              config={{
                toolbar: [
                  "heading", "|",
                  "bold", "italic", "underline", "strikethrough", "|",
                  "link", "|",
                  "bulletedList", "numberedList", "|",
                  "blockQuote", "insertTable", "|",
                  "undo", "redo",
                ],
                table: {
                  contentToolbar: [
                    "tableColumn", "tableRow", "mergeTableCells",
                    "|", "tableProperties", "tableCellProperties",
                  ],
                },
              }}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate("/products")} disabled={saving}
            className="px-5 py-2.5 rounded-xl border text-sm disabled:opacity-50"
            style={{ borderColor: themeColors.border, color: themeColors.text }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
