import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  getAllSliders, createSlider, updateSlider,
  toggleSliderStatus, deleteSlider,
} from "../apis/sliders";
import {
  FaImages, FaPlus, FaEdit, FaTrash,
  FaSyncAlt, FaToggleOn, FaToggleOff, FaEye, FaTimes,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Table from "../components/Table";
import TableCard from "../components/TableCard";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

// ── Modal modes: "add" | "view" | "edit"
export default function Sliders() {
  const { themeColors } = useTheme();

  const [sliders, setSliders]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(10);
  const [isActive, setIsActive] = useState("");

  // modal state
  const [modal, setModal]           = useState(null);   // null | { mode, slider? }
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fetchSliders = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllSliders({ page, limit, isActive });
      setSliders(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load sliders.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, isActive]);

  useEffect(() => { fetchSliders(); }, [fetchSliders]);

  // ── Modal helpers ─────────────────────────────────────────
  const openAdd = () => {
    setImageFile(null);
    setImagePreview("");
    setError("");
    setModal({ mode: "add" });
  };

  const openView = (slider) => {
    setError("");
    setModal({ mode: "view", slider });
  };

  const openEdit = (slider) => {
    setImageFile(null);
    setImagePreview(slider.image?.url || "");
    setError("");
    setModal({ mode: "edit", slider });
  };

  const closeModal = () => {
    setModal(null);
    setImageFile(null);
    setImagePreview("");
    setError("");
  };

  // ── Submit (add / edit) ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modal.mode === "add" && !imageFile) {
      setError("Image is required.");
      return;
    }
    if (modal.mode === "edit" && !imageFile) {
      setError("New image choose karo replace karne ke liye.");
      return;
    }
    try {
      setSaving(true); setError("");
      const fd = new FormData();
      fd.append("image", imageFile);

      if (modal.mode === "add") {
        await createSlider(fd);
      } else {
        await updateSlider(modal.slider._id, fd);
      }

      closeModal();
      fetchSliders();
      Swal.fire({
        icon: "success",
        title: modal.mode === "add" ? "Slider Added!" : "Slider Updated!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ─────────────────────────────────────────
  const handleToggle = async (row) => {
    try {
      await toggleSliderStatus(row._id);
      fetchSliders();
    } catch (e) {
      setError(e?.response?.data?.message || "Status change failed.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: "Slider delete karna chahte ho?",
      text: "Ye action undo nahi hoga.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger,
      confirmButtonText: "Haan, Delete Karo",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSlider(row._id);
      fetchSliders();
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed.");
    }
  };

  // ── Table config ──────────────────────────────────────────
  const tableColumns = [
    {
      key: "image", label: "Image",
      render: (row) => (
        <img
          src={row.image?.url}
          alt="slider"
          className="h-14 w-28 object-cover rounded-lg border"
          style={{ borderColor: themeColors.border }}
        />
      ),
    },
    {
      key: "isActive", label: "Status",
      render: (row) => row.isActive
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>,
    },
    { key: "createdAt", label: "Added On", render: (row) => fmtDate(row.createdAt) },
  ];

  const tableActions = [
    { label: "View",   icon: <FaEye />,       onClick: openView,   color: themeColors.primary },
    { label: "Edit",   icon: <FaEdit />,      onClick: openEdit,   color: "#f59e0b" },
    {
      label: "Activate", icon: <FaToggleOff />, onClick: handleToggle,
      color: "#10b981", hide: (row) => row.isActive,
    },
    {
      label: "Deactivate", icon: <FaToggleOn />, onClick: handleToggle,
      color: "#f97316", hide: (row) => !row.isActive,
    },
    { label: "Delete", icon: <FaTrash />,     onClick: handleDelete, color: themeColors.danger },
  ];

  const tableFilters = [
    {
      key: "isActive", label: "Status",
      options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }],
    },
  ];

  const sharedProps = {
    serverSide: true,
    columns: tableColumns,
    data: sliders,
    actions: tableActions,
    filters: tableFilters,
    loading,
    pagination,
    onPageChange:   (p) => setPage(p),
    onLimitChange:  (l) => { setLimit(l); setPage(1); },
    onSearchChange: () => {},           // no search on sliders
    onFilterChange: ({ key, value }) => { if (key === "isActive") { setIsActive(value); setPage(1); } },
    searchPlaceholder: "Search...",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaImages style={{ color: themeColors.primary }} /> Sliders
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>
            Homepage banner sliders manage karo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSliders} disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openAdd}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            <FaPlus /> Add Slider
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      <Table     {...sharedProps} />
      <TableCard {...sharedProps} />

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl shadow-xl border flex flex-col max-h-[90vh]"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: themeColors.text }}>
                {modal.mode === "add"  && <><FaPlus />  Add Slider</>}
                {modal.mode === "view" && <><FaEye />   Slider Details</>}
                {modal.mode === "edit" && <><FaEdit />  Edit Slider</>}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:opacity-70" style={{ color: themeColors.text }}>
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-5 py-4 flex-1">

              {/* ── VIEW mode ── */}
              {modal.mode === "view" && (
                <div className="space-y-4">
                  <img
                    src={modal.slider.image?.url}
                    alt="slider"
                    className="w-full rounded-xl border object-cover"
                    style={{ borderColor: themeColors.border, maxHeight: "300px" }}
                  />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase font-semibold opacity-50 mb-0.5" style={{ color: themeColors.text }}>Status</p>
                      {modal.slider.isActive
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#10b98115", color: "#10b981" }}>Active</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>Inactive</span>
                      }
                    </div>
                    <div>
                      <p className="text-xs uppercase font-semibold opacity-50 mb-0.5" style={{ color: themeColors.text }}>Added On</p>
                      <p style={{ color: themeColors.text }}>{fmtDate(modal.slider.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEdit(modal.slider)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-2"
                      style={{ borderColor: "#f59e0b40", backgroundColor: "#f59e0b10", color: "#f59e0b" }}>
                      <FaEdit /> Edit Image
                    </button>
                    <button onClick={() => { closeModal(); handleDelete(modal.slider); }}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-2"
                      style={{ borderColor: themeColors.danger + "40", backgroundColor: themeColors.danger + "10", color: themeColors.danger }}>
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              )}

              {/* ── ADD / EDIT mode ── */}
              {(modal.mode === "add" || modal.mode === "edit") && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-2 rounded-lg text-xs border"
                      style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
                      {error}
                    </div>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                      Slider Image {modal.mode === "add" && <span className="text-red-500">*</span>}
                    </label>

                    <label
                      className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer text-sm"
                      style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + "40", color: themeColors.text }}>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                        }} />
                      <FaImages className="text-2xl opacity-50" />
                      <span className="font-medium">{imageFile ? "Change Image" : "Click to choose image"}</span>
                      <span className="text-xs opacity-60">Wide banner image (JPG/PNG/WebP)</span>
                    </label>

                    {imagePreview && (
                      <div className="mt-3">
                        <p className="text-xs opacity-60 mb-1" style={{ color: themeColors.text }}>Preview:</p>
                        <img src={imagePreview} alt="preview"
                          className="w-full object-cover rounded-xl border"
                          style={{ borderColor: themeColors.border, maxHeight: "200px" }} />
                      </div>
                    )}
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-2 justify-end pt-1">
                    <button type="button" onClick={closeModal} disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
                      style={{ borderColor: themeColors.border, color: themeColors.text }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                      {saving ? "Saving..." : modal.mode === "add" ? "Add Slider" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
