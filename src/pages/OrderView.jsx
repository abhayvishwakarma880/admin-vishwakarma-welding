import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getOrderById, updateOrder } from "../apis/orders";
import { FaArrowLeft, FaSave, FaShoppingCart, FaUser, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";

export default function OrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeColors } = useTheme();

  const [order, setOrder] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getOrderById(id);
        const data = res.data || res;
        setOrder(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          orderFor: data.orderFor || "",
          message: data.message || "",
          address: data.address || "",
          pincode: data.pincode || "",
          city: data.city || "",
          state: data.state || "",
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateOrder(id, formData);
      setSuccess("Order updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  if (error && !order) {
    return <div className="text-red-500 text-center p-5">{error}</div>;
  }

  const inputClass = "w-full p-3 rounded-lg border outline-none focus:ring-2 transition-all bg-transparent";

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/orders")}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: themeColors.textSecondary }}>
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaShoppingCart style={{ color: themeColors.primary }} /> Order Details
            </h1>
            <p className="text-sm font-mono opacity-60 mt-0.5" style={{ color: themeColors.text }}>#{id}</p>
          </div>
        </div>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
          style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg border border-green-200">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info Card */}
        <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.primary }}>
            <FaUser /> Customer Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>Customer Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3.5 opacity-50" style={{ color: themeColors.text }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClass} pl-10`} style={{ borderColor: themeColors.border, color: themeColors.text }} />
              </div>
            </div>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.primary }}>
            <FaShoppingCart /> Order Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>Order For (Item/Service)</label>
              <input type="text" name="orderFor" value={formData.orderFor} onChange={handleChange} className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>Message / Notes</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows="3" className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="md:col-span-2 p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.primary }}>
            <FaMapMarkerAlt /> Delivery Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>Full Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: themeColors.text }}>Pincode</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={inputClass} style={{ borderColor: themeColors.border, color: themeColors.text }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
