import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  getRecentSideWorkById, createRecentSideWork, updateRecentSideWork,
} from "../apis/recentSideWorks";
import { getCategories } from "../apis/categories";
import RichTextEditor from "../components/RichTextEditor";
import { FaHammer, FaArrowLeft, FaSave, FaPlus, FaTimes, FaSpinner } from "react-icons/fa";
import Swal from "sweetalert2";

const toSlug = (str) =>
  str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const INITIAL = {
  slug: "", title: "", projectName: "", shortDescription: "", fullDescription: "",
  categoryId: "", pincode: "", district: "", state: "",
  status: "completed", servicesUsed: "", materialsUsed: "",
  isActive: true, featured: false, seoTitle: "", seoDescription: "",
};

export default function RecentSideWorkForm() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();
  const { id }   = useParams();

  const path   = window.location.pathname;
  const isView = !!id && !path.includes("edit") && !path.includes("add");
  const isAdd  = !id;

  const [form, setForm]             = useState(INITIAL);
  const [categories, setCategories] = useState([]);
  const [coverFile, setCoverFile]   = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  const [removeGalleryIds, setRemoveGalleryIds] = useState([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const slugEdited = useRef(false);

  // load categories
  useEffect(() => {
    getCategories({ limit: 100, isActive: "true" })
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // load existing work for edit/view
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRecentSideWorkById(id)
      .then((res) => {
        const w = res.data;
        setForm({
          slug: w.slug || "", title: w.title || "",
          projectName: w.projectName || "",
          shortDescription: w.shortDescription || "",
          fullDescription:  w.fullDescription  || "",
          categoryId: w.categoryId?._id || "",
          pincode:  w.location?.pincode  || "",
          district: w.location?.district || "",
          state:    w.location?.state    || "",
          status: w.status || "completed",
          servicesUsed:  (w.servicesUsed  || []).join(", "),
          materialsUsed: (w.materialsUsed || []).join(", "),
          isActive: w.isActive ?? true,
          featured: w.featured ?? false,
          seoTitle:       w.seoTitle       || "",
          seoDescription: w.seoDescription || "",
        });
        slugEdited.current = true; // don't auto-overwrite slug on edit
        setCoverPreview(w.coverImage?.url || "");
        setExistingGallery(w.galleryImages || []);
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [id]);

  // title → auto slug
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setForm((p) => ({
      ...p,
      title: val,
      slug: slugEdited.current ? p.slug : toSlug(val),
    }));
  };

  // pincode → district + state autofill
  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((p) => ({ ...p, pincode: val }));
    if (val.length === 6) {
      setPincodeLoading(true);
      try {
        const res  = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const json = await res.json();
        const po   = json?.[0]?.PostOffice?.[0];
        if (po) {
          setForm((p) => ({ ...p, district: po.District || "", state: po.State || "" }));
        }
      } catch {}
      finally { setPincodeLoading(false); }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "slug") slugEdited.current = true;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleGalleryAdd = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles((p) => [...p, ...files]);
    setGalleryPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };
  const removeNewGallery = (idx) => {
    setGalleryFiles((p)    => p.filter((_, i) => i !== idx));
    setGalleryPreviews((p) => p.filter((_, i) => i !== idx));
  };
  const toggleRemoveExisting = (publicId) =>
    setRemoveGalleryIds((p) =>
      p.includes(publicId) ? p.filter((x) => x !== publicId) : [...p, publicId]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile && isAdd) { setError("Cover image required."); return; }
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (coverFile) fd.append("coverImage", coverFile);
      galleryFiles.forEach((f) => fd.append("galleryImages", f));
      removeGalleryIds.forEach((rid) => fd.append("removeGalleryIds", rid));

      isAdd ? await createRecentSideWork(fd) : await updateRecentSideWork(id, fd);

      Swal.fire({ icon: "success", title: isAdd ? "Work Added!" : "Work Updated!", timer: 1500, showConfirmButton: false });
      navigate("/recent-side-works");
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const inp  = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none";
  const istyle = { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text };
  const lbl  = { color: themeColors.text };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/recent-side-works")}
          className="p-2 rounded-lg border hover:opacity-70"
          style={{ borderColor: themeColors.border, color: themeColors.text }}>
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
          <FaHammer style={{ color: themeColors.primary }} />
          {isAdd ? "Add New Work" : isView ? "View Work" : "Edit Work"}
        </h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Info ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60" style={lbl}>Basic Info</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title — auto slug */}
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>Title <span className="text-red-500">*</span></label>
              <input name="title" value={form.title} onChange={handleTitleChange} required disabled={isView}
                className={inp} style={istyle} placeholder="e.g. Main Gate Khadda Project" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>Project Name <span className="text-red-500">*</span></label>
              <input name="projectName" value={form.projectName} onChange={handleChange} required disabled={isView}
                className={inp} style={istyle} placeholder="e.g. Residential Gate Project" />
            </div>
          </div>

          {/* Slug — auto-filled from title, editable */}
          <div>
            <label className="block text-sm font-medium mb-1" style={lbl}>Slug <span className="text-red-500">*</span></label>
            <input name="slug" value={form.slug}
              onChange={handleChange} required disabled={isView}
              className={inp} style={{ ...istyle, fontFamily: "monospace" }}
              placeholder="auto-generated from title" />
            <p className="text-[11px] mt-1 opacity-50" style={lbl}>Title type karne pr auto fill hoga, manually bhi edit kar sakte ho</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category dropdown */}
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>Category</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} disabled={isView}
                className={inp} style={istyle}>
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} disabled={isView}
                className={inp} style={istyle}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={lbl}>Short Description <span className="text-red-500">*</span></label>
            <textarea name="shortDescription" value={form.shortDescription} onChange={handleChange} required disabled={isView}
              rows={2} className={inp} style={istyle} placeholder="Brief description shown on cards" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={lbl}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} disabled={isView} />
              Active
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={lbl}>
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} disabled={isView} />
              Featured
            </label>
          </div>
        </div>

        {/* ── Full Description ── */}
        <div className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60" style={lbl}>Full Description</h2>
          {isView ? (
            <div className="prose prose-sm max-w-none ck-content text-sm"
              style={lbl} dangerouslySetInnerHTML={{ __html: form.fullDescription }} />
          ) : (
            <RichTextEditor value={form.fullDescription}
              onChange={(val) => setForm((p) => ({ ...p, fullDescription: val }))}
              placeholder="Detailed project description..." />
          )}
        </div>

        {/* ── Location ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60" style={lbl}>Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>
                Pincode
                {pincodeLoading && <FaSpinner className="inline ml-2 animate-spin text-xs" />}
              </label>
              <input name="pincode" value={form.pincode} onChange={handlePincodeChange}
                disabled={isView} maxLength={6} className={inp} style={istyle} placeholder="274301" />
              {!isView && <p className="text-[11px] mt-1 opacity-50" style={lbl}>6 digit pincode se city/state auto fill hoga</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>District</label>
              <input name="district" value={form.district} onChange={handleChange} disabled={isView}
                className={inp} style={istyle} placeholder="Kushinagar" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>State</label>
              <input name="state" value={form.state} onChange={handleChange} disabled={isView}
                className={inp} style={istyle} placeholder="Uttar Pradesh" />
            </div>
          </div>
        </div>

        {/* ── Services & Materials ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60" style={lbl}>Services & Materials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>Services Used <span className="opacity-40 text-xs">(comma separated)</span></label>
              <input name="servicesUsed" value={form.servicesUsed} onChange={handleChange} disabled={isView}
                className={inp} style={istyle} placeholder="Steel Welding, Gate Fabrication" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={lbl}>Materials Used <span className="opacity-40 text-xs">(comma separated)</span></label>
              <input name="materialsUsed" value={form.materialsUsed} onChange={handleChange} disabled={isView}
                className={inp} style={istyle} placeholder="MS Steel, Iron Rods" />
            </div>
          </div>
        </div>

        {/* ── Images ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60" style={lbl}>Images</h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={lbl}>
              Cover Image {isAdd && <span className="text-red-500">*</span>}
            </label>
            {!isView && (
              <label className="w-full flex flex-col items-center gap-2 py-5 border-2 border-dashed rounded-xl cursor-pointer text-sm"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + "40", color: themeColors.text }}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
                <span className="font-medium">Click to choose cover image</span>
                <span className="text-xs opacity-60">JPG / PNG / WebP</span>
              </label>
            )}
            {coverPreview && (
              <img src={coverPreview} alt="cover" className="mt-3 w-full max-h-52 object-cover rounded-xl border"
                style={{ borderColor: themeColors.border }} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={lbl}>Gallery Images</label>
            {existingGallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {existingGallery.map((img) => (
                  <div key={img.publicId} className="relative">
                    <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-lg border"
                      style={{ borderColor: themeColors.border, opacity: removeGalleryIds.includes(img.publicId) ? 0.3 : 1 }} />
                    {!isView && (
                      <button type="button" onClick={() => toggleRemoveExisting(img.publicId)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: removeGalleryIds.includes(img.publicId) ? "#10b981" : themeColors.danger, color: "#fff" }}>
                        {removeGalleryIds.includes(img.publicId) ? "↩" : <FaTimes />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {galleryPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {galleryPreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border" style={{ borderColor: themeColors.border }} />
                    <button type="button" onClick={() => removeNewGallery(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: themeColors.danger, color: "#fff" }}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!isView && (
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-xs font-medium"
                style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }}>
                <FaPlus /> Add Gallery Images
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
              </label>
            )}
          </div>
        </div>

        {/* ── SEO ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60" style={lbl}>SEO</h2>
          <div>
            <label className="block text-sm font-medium mb-1" style={lbl}>SEO Title</label>
            <input name="seoTitle" value={form.seoTitle} onChange={handleChange} disabled={isView}
              className={inp} style={istyle} placeholder="SEO optimized title" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={lbl}>SEO Description</label>
            <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange} disabled={isView}
              rows={2} className={inp} style={istyle} placeholder="SEO meta description" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate("/recent-side-works")}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: themeColors.border, color: themeColors.text }}>
            {isView ? "Back" : "Cancel"}
          </button>
          {isView ? (
            <button type="button" onClick={() => navigate(`/recent-side-works/edit/${id}`)}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
              Edit This Work
            </button>
          ) : (
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? "Saving..." : isAdd ? "Add Work" : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
