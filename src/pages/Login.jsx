// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../apis/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SAVED_CREDS_KEY = "admin-saved-creds";

const Login = () => {
  const saved = JSON.parse(localStorage.getItem(SAVED_CREDS_KEY) || "null");

  const [credentials, setCredentials] = useState({
    email: saved?.email || "",
    password: saved?.password || "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(!!saved);

  const { setLoginData } = useAuth();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await adminLogin({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      const adminObject = {
        ...res.data,
        token: res.token,
      };

      setLoginData(adminObject);

      if (savePassword) {
        localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify({ email: credentials.email.trim(), password: credentials.password }));
      } else {
        localStorage.removeItem(SAVED_CREDS_KEY);
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: themeColors.background,
        fontFamily: currentFont.family,
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-lg border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Branding Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.webp"
              alt="Vishwakarma Welding Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: themeColors.primary }}
          >
            Vishwakarma Welding
          </h1>

          <p
            className="text-sm"
            style={{ color: themeColors.textSecondary }}
          >
            Admin Panel
          </p>
        </div>

        {/* Error Box */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-center text-sm"
            style={{
              backgroundColor: themeColors.danger + "15",
              color: themeColors.danger,
              border: `1px solid ${themeColors.danger}30`,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin ID */}
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium"
              style={{ color: themeColors.text }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border,
              }}
              placeholder="Enter admin email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium"
              style={{ color: themeColors.text }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full p-3 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                }}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ color: themeColors.text }}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Save Password */}
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <div
              onClick={() => setSavePassword((p) => !p)}
              className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
              style={{
                backgroundColor: savePassword ? themeColors.primary : "transparent",
                borderColor: savePassword ? themeColors.primary : themeColors.border,
              }}
            >
              {savePassword && (
                <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs" style={{ color: themeColors.text }}>Remember credentials</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 cursor-pointer px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;