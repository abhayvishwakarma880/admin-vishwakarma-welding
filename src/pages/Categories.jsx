import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../apis/categories";
import {
  FaBox, FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch,
  FaToggleOn, FaToggleOff, FaChevronLeft, FaChevronRight, FaChevronDown, FaCheck,
} from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const LIMIT_OPTIONS = ["10", "25", "50", "100"];

const emptyForm = { name: "", description: "", isActive: true, image: null };

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
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, minWidth: "140px", top: "100%", right: 0 }}>
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

export default function Categories() {
  const { themeColors } = useTheme();

  const [categories, setCategories]   = useState([]);
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
  const debounceRef                   = useRef(null);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCategories({ page, limit, search, isActive });
      setCategories(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 500);
  };

  const handleFilter = (val) => { setIsActive(val); setPage(1); };
  const handleLimit  = (val) => { setLimit(Number(val)); setPage(1); };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name || "", description: cat.description || "", isActive: cat.isActive, image: null });
    setImagePreview(cat.image?.url || null);
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setImagePreview(null);
    setError("");
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Category name is required."); return; }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("isActive", form.isActive);
    if (form.image) formData.append("image", form.image);

    try {
      setSaving(true);
      setError("");
      if (editing) {
        await updateCategory(editing._id, formData);
      } else {
        await createCategory(formData);
      }
      closeModal();
      setPage(1);
      fetchCategories();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      const formData = new FormData();
      formData.append("isActive", !cat.isActive);
      await updateCategory(cat._id, formData);
      fetchCategories();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      setSaving(true);
      await deleteCategory(cat._id);
      fetchCategories();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete category.");
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
            <FaBox style={{ color: themeColors.primary }} /> Categories
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Sabhi categories manage karo</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCategories} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openAddModal}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
          >
            <FaPlus /> Add Category
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
            <CustomSelect
              value={String(limit)}
              onChange={handleLimit}
              options={LIMIT_OPTIONS.map((n) => ({ label: n, value: n }))}
              placeholder="10"
            />
            <span className="opacity-60">entries</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CustomSelect
              value={isActive}
              onChange={handleFilter}
              options={[
                { label: "Status: All",  value: "" },
                { label: "Active",       value: "true" },
                { label: "Inactive",     value: "false" },
              ]}
              placeholder="Status: All"
            />
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: themeColors.text }} />
              <input
                type="text" value={searchInput} onChange={handleSearchInput}
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
                {["Actions", "Image", "Name", "Description", "Status", "Created"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b"
                    style={{ color: themeColors.text + "99", borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
                      <span className="text-xs opacity-60" style={{ color: themeColors.text }}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm opacity-50" style={{ color: themeColors.text }}>No categories found.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-black/5 transition-colors border-b" style={{ borderColor: themeColors.border }}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleToggleStatus(cat)} disabled={saving}
                          title={cat.isActive ? "Deactivate" : "Activate"}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer disabled:opacity-40"
                          style={{ color: cat.isActive ? "#f59e0b" : "#10b981", borderColor: (cat.isActive ? "#f59e0b" : "#10b981") + "40", backgroundColor: (cat.isActive ? "#f59e0b" : "#10b981") + "10" }}
                        >
                          {cat.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button onClick={() => openEditModal(cat)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer"
                          style={{ color: themeColors.primary, borderColor: themeColors.primary + "40", backgroundColor: themeColors.primary + "10" }}
                        >
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(cat)} disabled={saving}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 cursor-pointer disabled:opacity-40"
                          style={{ color: "#ef4444", borderColor: "#ef444440", backgroundColor: "#ef444410" }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {cat.image?.url
                        ? <img src={cat.image.url} alt={cat.name} className="h-10 w-10 rounded-lg object-cover" />
                        : <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: themeColors.border, color: themeColors.text }}>N/A</div>}
                    </td>
                    <td className="px-4 py-2 font-medium" style={{ color: themeColors.text }}>{cat.name}</td>
                    <td className="px-4 py-2 text-xs max-w-[200px] truncate" style={{ color: themeColors.text }}>{cat.description || "-"}</td>
                    <td className="px-4 py-2">
                      {cat.isActive
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>}
                    </td>
                    <td className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>{fmtDate(cat.createdAt)}</td>
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
              style={{ borderColor: themeColors.border, color: themeColors.text }}
            >
              <FaChevronLeft /> Prev
            </button>
            {pageNumbers.map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className="min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: pagination.page === n ? themeColors.primary : "transparent",
                  color: pagination.page === n ? themeColors.onPrimary : themeColors.text,
                  borderColor: pagination.page === n ? themeColors.primary : themeColors.border,
                }}
              >{n}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ borderColor: themeColors.border, color: themeColors.text }}
            >
              Next <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl shadow-2xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-bold" style={{ color: themeColors.text }}>
                {editing ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={closeModal} className="text-xl px-1" style={{ color: themeColors.text }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-2 rounded-lg text-xs border" style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input name="name" type="text" value={form.name} onChange={handleFormChange} required
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                  placeholder="Category name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                  placeholder="Short description..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>Image</label>
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="h-20 w-20 rounded-lg object-cover mb-2" />
                )}
                <input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFormChange}
                  className="w-full text-xs"
                  style={{ color: themeColors.text }}
                />
              </div>

              {/* isActive */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} className="w-4 h-4" />
                <span className="text-sm" style={{ color: themeColors.text }}>Active</span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} disabled={saving}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                  style={{ borderColor: themeColors.border, color: themeColors.text }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
