import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getCategories } from "../apis/categories";
import { listProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from "../apis/products";
import {
  FaBoxOpen, FaPlus, FaEdit, FaTrash, FaSyncAlt,
  FaToggleOn, FaToggleOff, FaEye,
} from "react-icons/fa";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const fmtCurrency = (n) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-";

const emptyForm = {
  name: "", category: "", price: "", discount: "",
  description: "", aboutThisProduct: "",
};

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
  const [isActive, setIsActive]       = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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

  const tableColumns = [
    {
      key: "mainImage", label: "Image",
      render: (row) => row.mainImage?.url
        ? <img src={row.mainImage.url} alt={row.name} className="h-10 w-10 rounded-lg object-cover" />
        : <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: themeColors.border, color: themeColors.text }}>N/A</div>,
    },
    { key: "name",     label: "Name",     render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "category", label: "Category", render: (row) => row.category?.name || "-" },
    { key: "price",    label: "Price",    render: (row) => fmtCurrency(row.price) },
    { key: "discount", label: "Discount", render: (row) => row.discount ? `${row.discount}%` : "-" },
    {
      key: "isActive", label: "Status",
      render: (row) => row.isActive
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>,
    },
    { key: "createdAt", label: "Created", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    { label: "View",   icon: <FaEye />,   onClick: (row) => navigate(`/products/${row._id}`), color: themeColors.primary },
    { label: "Toggle", icon: <FaToggleOn />, onClick: handleToggle, color: "#f59e0b",
      render: (row) => row.isActive ? <FaToggleOn /> : <FaToggleOff /> },
    { label: "Edit",   icon: <FaEdit />,  onClick: (row) => navigate(`/products/edit/${row._id}`), color: themeColors.primary },
    { label: "Delete", icon: <FaTrash />, onClick: handleDelete, color: "#ef4444", disabled: () => saving },
  ];

  const tableFilters = [
    {
      key: "category", label: "Category",
      options: categories.map((c) => ({ label: c.name, value: c._id })),
    },
    {
      key: "status", label: "Status",
      options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }],
    },
  ];

  const handleFilterChange = ({ key, value }) => {
    if (key === "category") setCategoryFilter(value);
    if (key === "status")   setIsActive(value);
    setPage(1);
  };

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

      {/* Table — desktop */}
      <Table
        serverSide
        columns={tableColumns}
        data={products}
        actions={tableActions}
        filters={tableFilters}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search name, description..."
      />

      {/* TableCard — mobile */}
      <TableCard
        serverSide
        columns={tableColumns}
        data={products}
        actions={tableActions}
        filters={tableFilters}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search name, description..."
      />

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
