import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getCategories } from "../apis/categories";
import {
  listGallery, createGallery, updateGallery,
  toggleGalleryStatus, deleteGallery,
} from "../apis/gallery";
import { FaImages, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaEye, FaTimes } from "react-icons/fa";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

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
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // server-side controls
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // modal
  const [modalMode, setModalMode]   = useState(null); // "add" | "edit" | "view"
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const inputStyle = { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text };

  // ── fetch ──────────────────────────────────────────────────
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listGallery({ page, limit, search, isActive: statusFilter, category: catFilter });
      setItems(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories({ limit: 100 }).then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchItems(); }, [page, limit, search, catFilter, statusFilter]);

  // ── modal helpers ──────────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm); setImageFile(null); setImagePreview(""); setSelected(null); setError(""); setModalMode("add");
  };
  const openEdit = (item) => {
    setSelected(item);
    setForm({ title: item.title || "", description: item.description || "", category: item.category?._id || "" });
    setImageFile(null); setImagePreview(item.image?.url || ""); setError(""); setModalMode("edit");
  };
  const openView = (item) => { setSelected(item); setError(""); setModalMode("view"); };
  const closeModal = () => { setModalMode(null); setSelected(null); setError(""); };

  // ── submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category)                    { setError("Category is required."); return; }
    if (modalMode === "add" && !imageFile) { setError("Image is required."); return; }

    const fd = new FormData();
    fd.append("category",    form.category);
    fd.append("title",       form.title);
    fd.append("description", form.description);
    if (imageFile) fd.append("image", imageFile);

    try {
      setSaving(true); setError("");
      modalMode === "add" ? await createGallery(fd) : await updateGallery(selected._id, fd);
      closeModal(); fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // ── toggle / delete ────────────────────────────────────────
  const handleToggle = async (item) => {
    try { await toggleGalleryStatus(item._id); fetchItems(); }
    catch (e) { setError(e?.response?.data?.message || "Failed to toggle."); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title || "this item"}"?`)) return;
    try { await deleteGallery(item._id); fetchItems(); }
    catch (e) { setError(e?.response?.data?.message || "Failed to delete."); }
  };

  // ── Table config ───────────────────────────────────────────
  const columns = [
    {
      key: "image", label: "Image",
      render: (row) => row.image?.url
        ? <img src={row.image.url} alt={row.title} className="h-12 w-16 object-cover rounded-lg" />
        : <div className="h-12 w-16 rounded-lg flex items-center justify-center text-xs opacity-40"
            style={{ backgroundColor: themeColors.border, color: themeColors.text }}>No img</div>,
    },
    { key: "title", label: "Title", render: (row) => row.title || "-" },
    { key: "category", label: "Category", render: (row) => row.category?.name || "-" },
    {
      key: "isActive", label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: row.isActive ? "#10b98115" : "#ef444415", color: row.isActive ? "#10b981" : "#ef4444" }}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "createdAt", label: "Created", render: (row) => fmtDate(row.createdAt) },
  ];

  const actions = [
    { label: "View",   icon: <FaEye />,                  onClick: openView,   color: themeColors.primary },
    { label: "Edit",   icon: <FaEdit />,                 onClick: openEdit,   color: themeColors.primary },
    {
      label: "", icon: (row) => row?.isActive ? <FaToggleOn /> : <FaToggleOff />,
      onClick: handleToggle,
      color: "#f59e0b",
      // per-row icon via render trick below
    },
    { label: "Delete", icon: <FaTrash />, onClick: handleDelete, color: "#ef4444", disabled: () => saving },
  ];

  // toggle action with dynamic icon
  const tableActions = [
    { label: "View",   icon: <FaEye />,   onClick: openView,   color: themeColors.primary },
    { label: "Edit",   icon: <FaEdit />,  onClick: openEdit,   color: themeColors.primary },
    {
      label: "Toggle",
      icon: <FaToggleOn />,
      onClick: handleToggle,
      color: "#f59e0b",
      // dynamic icon not supported in actions — handled via render column below
    },
    { label: "Delete", icon: <FaTrash />, onClick: handleDelete, color: "#ef4444", disabled: () => saving },
  ];

  // Use columns with actions baked-in for toggle dynamic icon
  const finalActions = [
    { label: "View",   icon: <FaEye />,   onClick: openView,   color: themeColors.primary },
    { label: "Edit",   icon: <FaEdit />,  onClick: openEdit,   color: themeColors.primary },
    {
      label: "Toggle Status",
      icon: <FaToggleOn />,
      onClick: handleToggle,
      color: "#f59e0b",
      render: (row) => row.isActive ? <FaToggleOn /> : <FaToggleOff />,
    },
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
    if (key === "category") setCatFilter(value);
    if (key === "status")   setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Server-side Table — desktop */}
      <Table
        serverSide
        columns={columns}
        data={items}
        actions={finalActions}
        filters={tableFilters}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search title, description..."
      />

      {/* Card view — mobile */}
      <TableCard
        serverSide
        columns={columns}
        data={items}
        actions={finalActions}
        filters={tableFilters}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search title, description..."
      />

      {/* Modal — Add / Edit / View */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4 rounded-2xl border shadow-xl flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: themeColors.text }}>
                {modalMode === "add"  && <><FaPlus />  Add Gallery Image</>}
                {modalMode === "edit" && <><FaEdit />  Edit Gallery Image</>}
                {modalMode === "view" && <><FaEye />   Gallery Image</>}
              </h2>
              <button onClick={closeModal} style={{ color: themeColors.text }}><FaTimes /></button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-5 py-4">
              {error && (
                <div className="mb-3 p-3 rounded-lg text-sm border"
                  style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
                  {error}
                </div>
              )}

              {/* VIEW */}
              {modalMode === "view" && selected && (
                <div className="space-y-4">
                  {selected.image?.url && <img src={selected.image.url} alt={selected.title} className="w-full max-h-60 object-cover rounded-xl" />}
                  <div className="grid grid-cols-2 gap-3">
                    {[["Title", selected.title || "-"], ["Category", selected.category?.name || "-"],
                      ["Status", selected.isActive ? "Active" : "Inactive"], ["Created", fmtDate(selected.createdAt)]
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

              {/* ADD / EDIT */}
              {(modalMode === "add" || modalMode === "edit") && (
                <form id="gallery-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Image */}
                  <div>
                    <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
                      Image {modalMode === "add" && <span className="text-red-500">*</span>}
                    </label>
                    {imagePreview && <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover rounded-xl mb-2" />}
                    <label className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed cursor-pointer hover:opacity-80"
                      style={{ borderColor: themeColors.border }}>
                      <FaImages className="opacity-40" style={{ color: themeColors.text }} />
                      <span className="text-sm opacity-60" style={{ color: themeColors.text }}>
                        {imageFile ? imageFile.name : modalMode === "edit" ? "Click to replace" : "Click to upload"}
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
                      placeholder="Optional title" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3} placeholder="Optional description..."
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none" style={inputStyle} />
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: themeColors.border }}>
              {modalMode === "view" ? (
                <>
                  <button onClick={() => openEdit(selected)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                    <FaEdit /> Edit
                  </button>
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border text-sm"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}>Close</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={closeModal} disabled={saving}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}>Cancel</button>
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
