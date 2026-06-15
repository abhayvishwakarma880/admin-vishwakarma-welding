import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getCategories } from "../apis/categories";
import {
  listGallery, getGalleryById, createGallery,
  updateGallery, toggleGalleryStatus, deleteGallery,
} from "../apis/gallery";
import {
  FaImages, FaPlus, FaEdit, FaTrash,
  FaToggleOn, FaToggleOff, FaEye, FaTimes, FaSearch,
} from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const emptyForm = { title: "", description: "", category: "" };

export default function Gallery() {
  const { themeColors } = useTheme();

  const [items, setItems]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);
  const [catFilter, setCatFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // modal
  const [modalMode, setModalMode]   = useState(null); // "add" | "edit" | "view"
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const inputStyle = {
    backgroundColor: themeColors.background,
    borderColor: themeColors.border,
    color: themeColors.text,
  };

  // ── fetch ──────────────────────────────────────────────────
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listGallery({ page, limit: 10, search, isActive: statusFilter, category: catFilter });
      setItems(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories({ limit: 100 }).then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchItems(); }, [page, search, catFilter, statusFilter]);

  // ── modal helpers ──────────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setSelected(null);
    setError("");
    setModalMode("add");
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({ title: item.title || "", description: item.description || "", category: item.category?._id || "" });
    setImageFile(null);
    setImagePreview(item.image?.url || "");
    setError("");
    setModalMode("edit");
  };

  const openView = (item) => {
    setSelected(item);
    setError("");
    setModalMode("view");
  };

  const closeModal = () => { setModalMode(null); setSelected(null); setError(""); };

  // ── submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category)              { setError("Category is required."); return; }
    if (modalMode === "add" && !imageFile) { setError("Image is required."); return; }

    const fd = new FormData();
    fd.append("category",    form.category);
    fd.append("title",       form.title);
    fd.append("description", form.description);
    if (imageFile) fd.append("image", imageFile);

    try {
      setSaving(true);
      setError("");
      if (modalMode === "add") {
        await createGallery(fd);
      } else {
        await updateGallery(selected._id, fd);
      }
      closeModal();
      fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // ── toggle ─────────────────────────────────────────────────
  const handleToggle = async (item) => {
    try {
      await toggleGalleryStatus(item._id);
      fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle status.");
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title || "this item"}"?`)) return;
    try {
      await deleteGallery(item._id);
      fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
          <FaImages style={{ color: themeColors.primary }} /> Gallery
        </h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
          <FaPlus /> Add Image
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-2.5 text-xs opacity-50" style={{ color: themeColors.text }} />
          <input value={searchInput} onChange={(e) => {
            setSearchInput(e.target.value);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 500);
          }}
            placeholder="Search..." className="pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={inputStyle} />
        </div>

        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border text-sm focus:outline-none" style={inputStyle}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border text-sm focus:outline-none" style={inputStyle}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: themeColors.background }}>
                {["Image", "Title", "Category", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm opacity-60" style={{ color: themeColors.text }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm opacity-60" style={{ color: themeColors.text }}>No gallery items found.</td></tr>
              ) : items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3">
                    {item.image?.url
                      ? <img src={item.image.url} alt={item.title} className="h-14 w-20 object-cover rounded-lg" />
                      : <div className="h-14 w-20 rounded-lg flex items-center justify-center text-xs opacity-40"
                          style={{ backgroundColor: themeColors.border, color: themeColors.text }}>No img</div>}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: themeColors.text }}>{item.title || "-"}</td>
                  <td className="px-4 py-3 text-xs opacity-70" style={{ color: themeColors.text }}>{item.category?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: item.isActive ? "#10b98115" : "#ef444415", color: item.isActive ? "#10b981" : "#ef4444" }}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs opacity-70" style={{ color: themeColors.text }}>{fmtDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openView(item)} title="View"
                        className="p-1.5 rounded-lg border hover:opacity-80"
                        style={{ borderColor: themeColors.border, color: themeColors.text }}>
                        <FaEye />
                      </button>
                      <button onClick={() => openEdit(item)} title="Edit"
                        className="p-1.5 rounded-lg border hover:opacity-80"
                        style={{ borderColor: themeColors.border, color: themeColors.text }}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleToggle(item)} title="Toggle Status"
                        className="p-1.5 rounded-lg border hover:opacity-80"
                        style={{ borderColor: themeColors.border, color: item.isActive ? "#f59e0b" : "#10b981" }}>
                        {item.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button onClick={() => handleDelete(item)} title="Delete"
                        className="p-1.5 rounded-lg border hover:opacity-80"
                        style={{ borderColor: themeColors.border, color: "#ef4444" }}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: themeColors.border }}>
            <span className="text-xs opacity-60" style={{ color: themeColors.text }}>
              Total: {pagination.total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border text-xs disabled:opacity-40"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>Prev</button>
              <span className="px-3 py-1 text-xs" style={{ color: themeColors.text }}>{page} / {pagination.totalPages}</span>
              <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border text-xs disabled:opacity-40"
                style={{ borderColor: themeColors.border, color: themeColors.text }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal — Add / Edit / View */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4 rounded-2xl border shadow-xl flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: themeColors.text }}>
                {modalMode === "add" && <><FaPlus /> Add Gallery Image</>}
                {modalMode === "edit" && <><FaEdit /> Edit Gallery Image</>}
                {modalMode === "view" && <><FaEye /> View Gallery Image</>}
              </h2>
              <button onClick={closeModal} className="text-xl leading-none" style={{ color: themeColors.text }}>
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-5 py-4">
              {error && (
                <div className="mb-3 p-3 rounded-lg text-sm border"
                  style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
                  {error}
                </div>
              )}

              {/* VIEW MODE */}
              {modalMode === "view" && selected && (
                <div className="space-y-4">
                  {selected.image?.url && (
                    <img src={selected.image.url} alt={selected.title}
                      className="w-full max-h-64 object-cover rounded-xl" />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Title",       selected.title || "-"],
                      ["Category",    selected.category?.name || "-"],
                      ["Status",      selected.isActive ? "Active" : "Inactive"],
                      ["Created",     fmtDate(selected.createdAt)],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                        <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: themeColors.text }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {selected.description && (
                    <div className="p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                      <p className="text-[10px] uppercase opacity-50 font-semibold mb-1" style={{ color: themeColors.text }}>Description</p>
                      <p className="text-sm" style={{ color: themeColors.text }}>{selected.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ADD / EDIT FORM */}
              {(modalMode === "add" || modalMode === "edit") && (
                <form id="gallery-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Image */}
                  <div>
                    <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
                      Image {modalMode === "add" && <span className="text-red-500">*</span>}
                    </label>
                    {imagePreview && (
                      <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover rounded-xl mb-2" />
                    )}
                    <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed cursor-pointer hover:opacity-80"
                      style={{ borderColor: themeColors.border }}>
                      <FaImages className="opacity-50" style={{ color: themeColors.text }} />
                      <span className="text-sm opacity-60" style={{ color: themeColors.text }}>
                        {imageFile ? imageFile.name : modalMode === "edit" ? "Click to replace image" : "Click to upload image"}
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setImageFile(f || null);
                          setImagePreview(f ? URL.createObjectURL(f) : (selected?.image?.url || ""));
                        }} />
                    </label>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={inputStyle}>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Title</label>
                    <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Optional title" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={inputStyle} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3} placeholder="Optional description..."
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
                      style={inputStyle} />
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: themeColors.border }}>
              {modalMode === "view" ? (
                <>
                  <button onClick={() => openEdit(selected)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                    <FaEdit /> Edit
                  </button>
                  <button onClick={closeModal}
                    className="px-4 py-2 rounded-lg border text-sm"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={closeModal} disabled={saving}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}>
                    Cancel
                  </button>
                  <button type="submit" form="gallery-form" disabled={saving}
                    className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                    {saving ? "Saving..." : modalMode === "add" ? "Add Image" : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
