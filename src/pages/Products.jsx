import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getCategories } from "../apis/categories";
import { listProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from "../apis/products";
import {
  FaBoxOpen, FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch,
  FaToggleOn, FaToggleOff, FaEye, FaChevronLeft, FaChevronRight, FaChevronDown, FaCheck,
} from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const fmtCurrency = (n) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-";

const LIMIT_OPTIONS = ["10", "25", "50", "100"];

const emptyForm = {
  name: "", category: "", price: "", discount: "",
  description: "", aboutThisProduct: "",
};

function CustomSelect({ value, onChange, options, placeholder }) {
  const { themeColors } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium min-w-[120px]"
        style={{ backgroundColor: themeColors.background, borderColor: open ? themeColors.primary : themeColors.border, color: themeColors.text }}
      >
        <span className="flex-1 text-left truncate">{selected ? selected.label : placeholder}</span>
        <FaChevronDown style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, minWidth: "150px", top: "100%", right: 0 }}>
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:opacity-80"
              style={{ backgroundColor: String(value) === String(opt.value) ? themeColors.primary + "15" : "transparent", color: String(value) === String(opt.value) ? themeColors.primary : themeColors.text }}
            >
              <span>{opt.label}</span>
              {String(value) === String(opt.value) && <FaCheck className="text-[10px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Products() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  const [categories, setCategories]   = useState([]);
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [pagination, setPagination]   = useState({ total: 0, page: 1, totalPages: 1 });

  // server-side controls
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(10);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isActive, setIsActive]       = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const debounceRef                   = useRef(null);

  // modal
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [mainImageFile, setMainImageFile]       = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryFiles, setGalleryFiles]         = useState([]);

  // view modal
  const [viewProduct, setViewProduct] = useState(null);

  // load categories once
  useEffect(() => {
    getCategories({ limit: 100 })
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listProducts({ page, limit, search, isActive, category: categoryFilter });
      setProducts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 500);
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryFiles([]);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditing(prod);
    setForm({
      name:             prod.name            || "",
      category:         prod.category?._id   || "",
      price:            String(prod.price)   || "",
      discount:         String(prod.discount || 0),
      description:      prod.description     || "",
      aboutThisProduct: prod.aboutThisProduct || "",
    });
    setMainImageFile(null);
    setMainImagePreview(prod.mainImage?.url || null);
    setGalleryFiles([]);
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryFiles([]);
    setError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    setMainImageFile(file || null);
    setMainImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleGalleryChange = (e) => {
    setGalleryFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price)       { setError("Price is required."); return; }
    if (!form.category)    { setError("Category is required."); return; }
    if (!editing && !mainImageFile) { setError("Main image is required."); return; }

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
      if (editing) {
        await updateProduct(editing._id, fd);
      } else {
        await createProduct(fd);
      }
      closeModal();
      setPage(1);
      fetchProducts();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (prod) => {
    try {
      await toggleProductStatus(prod._id);
      fetchProducts();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Delete product "${prod.name}"?`)) return;
    try {
      setSaving(true);
      await deleteProduct(prod._id);
      fetchProducts();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  const pageNumbers = (() => {
    const max = 5;
    let start = Math.max(1, pagination.page - Math.floor(max / 2));
    let end   = Math.min(pagination.totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1;
  const to   = Math.min(pagination.page * limit, pagination.total);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaBoxOpen style={{ color: themeColors.primary }} /> Products
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Sabhi products manage karo</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => navigate("/products/add")}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
          >
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-xl border flex flex-col" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
            <span className="opacity-60">Show</span>
            <CustomSelect value={String(limit)} onChange={(v) => { setLimit(Number(v)); setPage(1); }}
              options={LIMIT_OPTIONS.map((n) => ({ label: n, value: n }))} placeholder="10" />
            <span className="opacity-60">entries</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CustomSelect value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1); }}
              options={[{ label: "Category: All", value: "" }, ...categories.map((c) => ({ label: c.name, value: c._id }))]}
              placeholder="Category: All"
            />
            <CustomSelect value={isActive} onChange={(v) => { setIsActive(v); setPage(1); }}
              options={[{ label: "Status: All", value: "" }, { label: "Active", value: "true" }, { label: "Inactive", value: "false" }]}
              placeholder="Status: All"
            />
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: themeColors.text }} />
              <input type="text" value={searchInput} onChange={handleSearchInput}
                placeholder="Search name, description..."
                className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-52 focus:outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1" style={{ maxHeight: "500px" }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: themeColors.surface }}>
                {["Actions", "Image", "Name", "Category", "Price", "Discount", "Status", "Created"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                    style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
                    <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Loading...</span>
                  </div>
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm opacity-50" style={{ color: themeColors.text }}>No products found.</td></tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-black/5 transition-colors border-b" style={{ borderColor: themeColors.border }}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/products/${prod._id}`)} title="View"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer"
                          style={{ color: themeColors.primary, borderColor: themeColors.primary + "40", backgroundColor: themeColors.primary + "10" }}>
                          <FaEye />
                        </button>
                        <button onClick={() => handleToggle(prod)} title={prod.isActive ? "Deactivate" : "Activate"}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer"
                          style={{ color: prod.isActive ? "#f59e0b" : "#10b981", borderColor: (prod.isActive ? "#f59e0b" : "#10b981") + "40", backgroundColor: (prod.isActive ? "#f59e0b" : "#10b981") + "10" }}>
                          {prod.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button onClick={() => navigate(`/products/edit/${prod._id}`)} title="Edit"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer"
                          style={{ color: themeColors.primary, borderColor: themeColors.primary + "40", backgroundColor: themeColors.primary + "10" }}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(prod)} disabled={saving} title="Delete"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer disabled:opacity-40"
                          style={{ color: "#ef4444", borderColor: "#ef444440", backgroundColor: "#ef444410" }}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {prod.mainImage?.url
                        ? <img src={prod.mainImage.url} alt={prod.name} className="h-10 w-10 rounded-lg object-cover" />
                        : <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: themeColors.border, color: themeColors.text }}>N/A</div>}
                    </td>
                    <td className="px-4 py-2 font-medium max-w-[150px] truncate" style={{ color: themeColors.text }}>{prod.name}</td>
                    <td className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>{prod.category?.name || "-"}</td>
                    <td className="px-4 py-2 text-xs font-medium" style={{ color: themeColors.text }}>{fmtCurrency(prod.price)}</td>
                    <td className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>{prod.discount ? `${prod.discount}%` : "-"}</td>
                    <td className="px-4 py-2">
                      {prod.isActive
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>}
                    </td>
                    <td className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>{fmtDate(prod.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: themeColors.border }}>
          <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
            Showing <b>{from}</b> to <b>{to}</b> of <b>{pagination.total}</b> entries
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1 || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              <FaChevronLeft /> Prev
            </button>
            {pageNumbers.map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all"
                style={{ backgroundColor: pagination.page === n ? themeColors.primary : "transparent", color: pagination.page === n ? themeColors.onPrimary : themeColors.text, borderColor: pagination.page === n ? themeColors.primary : themeColors.border }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              Next <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border flex flex-col"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-bold" style={{ color: themeColors.text }}>
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={closeModal} className="text-xl px-1" style={{ color: themeColors.text }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-2 rounded-lg text-xs border" style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Name <span className="text-red-500">*</span></label>
                  <input name="name" type="text" value={form.name} onChange={handleFormChange} required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="Product name"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Category <span className="text-red-500">*</span></label>
                  <select name="category" value={form.category} onChange={handleFormChange} required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Price (₹) <span className="text-red-500">*</span></label>
                  <input name="price" type="number" min="0" value={form.price} onChange={handleFormChange} required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="0"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Discount (%)</label>
                  <input name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="0"
                  />
                </div>

                {/* Final price preview */}
                {form.price && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                    <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Final Price:</span>
                    <span className="text-sm font-bold" style={{ color: themeColors.primary }}>
                      {fmtCurrency(form.price - (form.price * (form.discount || 0)) / 100)}
                    </span>
                  </div>
                )}

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Description</label>
                  <textarea name="description" value={form.description} onChange={handleFormChange} rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="Short description..."
                  />
                </div>

                {/* About */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>About This Product</label>
                  <textarea name="aboutThisProduct" value={form.aboutThisProduct} onChange={handleFormChange} rows={3}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="Detailed info about product..."
                  />
                </div>

                {/* Main Image */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
                    Main Image {!editing && <span className="text-red-500">*</span>}
                  </label>
                  {mainImagePreview && <img src={mainImagePreview} alt="preview" className="h-20 w-20 rounded-lg object-cover mb-2" />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMainImageChange}
                    className="w-full text-xs" style={{ color: themeColors.text }} />
                </div>

                {/* Gallery Images */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Gallery Images (optional, multiple)</label>
                  {editing && (prod => prod?.galleryImages?.length > 0 ? (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {editing.galleryImages.map((g, i) => <img key={i} src={g.url} alt="" className="h-12 w-12 rounded object-cover" />)}
                    </div>
                  ) : null)(editing)}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryChange}
                    className="w-full text-xs" style={{ color: themeColors.text }} />
                  {galleryFiles.length > 0 && <p className="text-xs mt-1 opacity-60" style={{ color: themeColors.text }}>{galleryFiles.length} file(s) selected</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} disabled={saving}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                  style={{ borderColor: themeColors.border, color: themeColors.text }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border flex flex-col"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold" style={{ color: themeColors.text }}>{viewProduct.name}</h2>
                {viewProduct.isActive
                  ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
                  : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>}
              </div>
              <button onClick={() => setViewProduct(null)} className="text-xl px-1" style={{ color: themeColors.text }}>×</button>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Images */}
                <div className="space-y-3">
                  {viewProduct.mainImage?.url && (
                    <img src={viewProduct.mainImage.url} alt={viewProduct.name} className="w-full h-56 object-cover rounded-xl" />
                  )}
                  {viewProduct.galleryImages?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {viewProduct.galleryImages.map((g, i) => (
                        <img key={i} src={g.url} alt="" className="h-14 w-14 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {[
                    ["Category",    viewProduct.category?.name || "-"],
                    ["Price",       fmtCurrency(viewProduct.price)],
                    ["Discount",    viewProduct.discount ? `${viewProduct.discount}%` : "-"],
                    ["Final Price", fmtCurrency(viewProduct.finalPrice)],
                    ["Created",     fmtDate(viewProduct.createdAt)],
                    ["Updated",     fmtDate(viewProduct.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                      <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: themeColors.text }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {viewProduct.description && (
                <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-[10px] uppercase opacity-50 font-semibold mb-1" style={{ color: themeColors.text }}>Description</p>
                  <p className="text-sm" style={{ color: themeColors.text }}>{viewProduct.description}</p>
                </div>
              )}
              {viewProduct.aboutThisProduct && (
                <div className="mt-3 p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <p className="text-[10px] uppercase opacity-50 font-semibold mb-1" style={{ color: themeColors.text }}>About This Product</p>
                  <p className="text-sm" style={{ color: themeColors.text }}>{viewProduct.aboutThisProduct}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: themeColors.border }}>
              <button onClick={() => { navigate(`/products/edit/${viewProduct._id}`); setViewProduct(null); }}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>
                <FaEdit /> Edit
              </button>
              <button onClick={() => setViewProduct(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
