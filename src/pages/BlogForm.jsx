import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getCategories } from "../apis/categories";
import { createBlog, updateBlog, getBlogById, getAllBlogs } from "../apis/blogs";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { FaArrowLeft, FaPlus, FaEdit, FaEye, FaImages } from "react-icons/fa";
import Swal from "sweetalert2";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const emptyForm = {
  title: "", readTime: 1, category: "", tags: "", isPublished: false, isActive: true,
};

export default function BlogForm() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // mode: "add" | "edit" | "view"
  const mode = location.pathname.includes("/add")
    ? "add"
    : location.pathname.includes("/edit")
    ? "edit"
    : "view";

  const [categories, setCategories]   = useState([]);
  const [allBlogs, setAllBlogs]        = useState([]);
  const [form, setForm]               = useState(emptyForm);
  const [description, setDescription] = useState("");
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [blog, setBlog]               = useState(null);
  const [loading, setLoading]         = useState(mode !== "add");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    getCategories({ limit: 100, isActive: "true" })
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
    getAllBlogs({ limit: 1000 })
      .then((res) => setAllBlogs(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === "add") return;
    getBlogById(id)
      .then((res) => {
        const b = res.data;
        setBlog(b);
        setForm({
          title:       b.title       || "",
          readTime:    b.readTime    || 1,
          category:    b.category?._id || b.category || "",
          tags:        (b.tags || []).join(", "),
          isPublished: b.isPublished ?? false,
          isActive:    b.isActive    ?? true,
        });
        setDescription(b.description || "");
        setImagePreview(b.image?.url || "");
        setRelatedBlogs((b.relatedBlogs || []).map((r) => r._id || r));
      })
      .catch((e) => setError(e?.response?.data?.message || "Blog load nahi hua."))
      .finally(() => setLoading(false));
  }, [id, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())  { setError("Title required."); return; }
    if (!form.category)      { setError("Category required."); return; }
    if (!description.trim()) { setError("Description required."); return; }
    if (mode === "add" && !imageFile) { setError("Image required."); return; }

    try {
      setSaving(true); setError("");
      const fd = new FormData();
      fd.append("title",       form.title.trim());
      fd.append("category",    form.category);
      fd.append("description", description.trim());
      fd.append("readTime",    form.readTime);
      fd.append("isPublished", form.isPublished);
      fd.append("isActive",    form.isActive);
      if (form.tags.trim()) {
        fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)));
      }
      if (relatedBlogs.length) {
        fd.append("relatedBlogs", JSON.stringify(relatedBlogs));
      }
      if (imageFile) fd.append("image", imageFile);

      if (mode === "add") {
        await createBlog(fd);
      } else {
        await updateBlog(id, fd);
      }

      Swal.fire({ icon: "success", title: mode === "add" ? "Blog Created!" : "Blog Updated!", timer: 1500, showConfirmButton: false });
      navigate("/blogs");
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none";
  const inpStyle = { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }} />
      </div>
    );
  }

  if (mode !== "add" && !blog && !loading) {
    return (
      <div className="p-4 rounded-lg border text-sm" style={{ backgroundColor: themeColors.danger + "15", color: themeColors.danger, borderColor: themeColors.danger + "50" }}>
        {error || "Blog not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/blogs")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:opacity-80"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
          {mode === "add"  && <><FaPlus  style={{ color: themeColors.primary }} /> Add Blog</>}
          {mode === "edit" && <><FaEdit  style={{ color: themeColors.primary }} /> Edit Blog</>}
          {mode === "view" && <><FaEye   style={{ color: themeColors.primary }} /> Blog Details</>}
        </h1>
        {mode === "view" && (
          <button onClick={() => navigate(`/blogs/edit/${id}`)}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2"
            style={{ borderColor: "#f59e0b40", backgroundColor: "#f59e0b10", color: "#f59e0b" }}>
            <FaEdit /> Edit
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* ── VIEW MODE ── */}
      {mode === "view" && blog && (
        <div className="space-y-5">
          {/* Image */}
          {blog.image?.url && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: themeColors.border }}>
              <img src={blog.image.url} alt={blog.title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          {/* Meta */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Title",      blog.title],
                ["Category",   blog.category?.name || "-"],
                ["Read Time",  `${blog.readTime} min`],
                ["Views",      blog.views || 0],
                ["Published",  blog.isPublished ? "Yes" : "No"],
                ["Status",     blog.isActive    ? "Active" : "Inactive"],
                ["Tags",       (blog.tags || []).join(", ") || "-"],
                ["Date",       fmtDate(blog.createdAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs uppercase font-semibold opacity-50 mb-0.5" style={{ color: themeColors.text }}>{label}</p>
                  <p style={{ color: themeColors.text }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Blogs */}
          {blog.relatedBlogs?.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60 mb-3" style={{ color: themeColors.text }}>Related Blogs</h2>
              <div className="flex flex-wrap gap-2">
                {blog.relatedBlogs.map((rb) => (
                  <span key={rb._id} className="px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
                    {rb.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {blog.description && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60 mb-3" style={{ color: themeColors.text }}>Description</h2>
              <div className="prose prose-sm max-w-none text-sm"
                style={{ color: themeColors.text }}
                dangerouslySetInnerHTML={{ __html: blog.description }} />
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT MODE ── */}
      {(mode === "add" || mode === "edit") && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>Basic Info</h2>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Title <span className="text-red-500">*</span>
              </label>
              <input className={inp} style={inpStyle}
                value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Blog title..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select className={inp} style={inpStyle}
                  value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Read Time (minutes)</label>
                <input type="number" min="1" className={inp} style={inpStyle}
                  value={form.readTime} onChange={(e) => setForm((p) => ({ ...p, readTime: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Tags <span className="text-xs opacity-50">(comma separated)</span>
              </label>
              <input className={inp} style={inpStyle}
                value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="welding, tips, guide" />
            </div>

            <div className="flex items-center gap-6">
              {[{ label: "Published", key: "isPublished" }, { label: "Active", key: "isActive" }].map(({ label, key }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4"
                    checked={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))} />
                  <span className="text-sm" style={{ color: themeColors.text }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Related Blogs */}
          {allBlogs.filter((b) => b._id !== id).length > 0 && (
            <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>Related Blogs</h2>
              <p className="text-xs opacity-50" style={{ color: themeColors.text }}>Jo blogs select karoge woh related blogs mein show honge</p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {allBlogs
                  .filter((b) => b._id !== id)
                  .map((b) => {
                    const selected = relatedBlogs.includes(b._id);
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() =>
                          setRelatedBlogs((prev) =>
                            selected ? prev.filter((rid) => rid !== b._id) : [...prev, b._id]
                          )
                        }
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                        style={{
                          backgroundColor: selected ? themeColors.primary : themeColors.background,
                          borderColor:     selected ? themeColors.primary : themeColors.border,
                          color:           selected ? themeColors.onPrimary : themeColors.text,
                        }}
                      >
                        {b.title.length > 40 ? b.title.slice(0, 40) + "..." : b.title}
                      </button>
                    );
                  })}
              </div>
              {relatedBlogs.length > 0 && (
                <p className="text-xs" style={{ color: themeColors.primary }}>
                  {relatedBlogs.length} blog{relatedBlogs.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Image */}
          <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>
              Image {mode === "add" && <span className="text-red-500">*</span>}
            </h2>
            <label className="w-full flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed rounded-xl cursor-pointer"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + "40", color: themeColors.text }}>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                }} />
              <FaImages className="text-xl opacity-50" />
              <span className="text-sm">{imageFile ? "Change Image" : "Click to choose image"}</span>
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-full max-h-52 object-cover rounded-xl border" style={{ borderColor: themeColors.border }} />
            )}
          </div>

          {/* Description */}
          <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60" style={{ color: themeColors.text }}>
              Description <span className="text-red-500">*</span>
            </h2>
            <div className="ck-wrapper">
              <CKEditor
                editor={ClassicEditor}
                data={description}
                onChange={(_, editor) => setDescription(editor.getData())}
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
            <button type="button" onClick={() => navigate("/blogs")} disabled={saving}
              className="px-5 py-2.5 rounded-xl border text-sm disabled:opacity-50"
              style={{ borderColor: themeColors.border, color: themeColors.text }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
              {saving ? "Saving..." : mode === "add" ? "Create Blog" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
