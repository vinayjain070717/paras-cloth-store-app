"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { THEME_COLORS, ACCENT_COLORS } from "@/lib/colors";
import { VALIDATION_CONFIG } from "@/config/validation.config";

export default function InstallPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    shop_name: "Paras Cloth Store Online",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    whatsapp_number: "",
    primary_color: "#7c3aed",
    accent_color: "#f59e0b",
  });

  useEffect(() => {
    fetch("/api/install")
      .then((r) => r.json())
      .then((data) => {
        if (data.installed) {
          router.replace("/");
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const v = VALIDATION_CONFIG;
    const errs: Record<string, string> = {};

    if (form.username.length < v.auth.usernameMinLength) {
      errs.username = `Username must be at least ${v.auth.usernameMinLength} characters`;
    } else if (!v.auth.usernamePattern.test(form.username)) {
      errs.username = "Username can only contain letters, numbers, and underscores";
    }
    if (form.password.length < v.auth.passwordMinLength) {
      errs.password = `Password must be at least ${v.auth.passwordMinLength} characters`;
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (!form.email.includes("@")) {
      errs.email = "Invalid email address";
    }
    if (!v.phone.pattern.test(form.whatsapp_number)) {
      errs.whatsapp_number = "WhatsApp number must be 10-15 digits";
    }
    if (form.shop_name.length < v.settings.shopNameMinLength) {
      errs.shop_name = `Shop name must be at least ${v.settings.shopNameMinLength} characters`;
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Installation failed");
        setSubmitting(false);
        return;
      }

      router.replace("/admin");
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            P
          </div>
          <h1 className="text-xl font-bold">Set Up Your Store</h1>
          <p className="text-sm text-gray-500 mt-1">
            One-time setup. Fill in your details to get started.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name</label>
            <input
              type="text"
              value={form.shop_name}
              onChange={(e) => { setForm({ ...form, shop_name: e.target.value }); setFieldErrors((p) => ({ ...p, shop_name: "" })); }}
              className={`w-full px-3 py-2.5 rounded-lg border ${fieldErrors.shop_name ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
            />
            {fieldErrors.shop_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.shop_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => { setForm({ ...form, username: e.target.value }); setFieldErrors((p) => ({ ...p, username: "" })); }}
              className={`w-full px-3 py-2.5 rounded-lg border ${fieldErrors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
            />
            {fieldErrors.username && <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors((p) => ({ ...p, password: "" })); }}
              className={`w-full px-3 py-2.5 rounded-lg border ${fieldErrors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
              minLength={8}
            />
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
              className={`w-full px-3 py-2.5 rounded-lg border ${fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
            />
            {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email (for OTP login)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors((p) => ({ ...p, email: "" })); }}
              className={`w-full px-3 py-2.5 rounded-lg border ${fieldErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number (with country code)</label>
            <input
              type="tel"
              value={form.whatsapp_number}
              onChange={(e) => { setForm({ ...form, whatsapp_number: e.target.value }); setFieldErrors((p) => ({ ...p, whatsapp_number: "" })); }}
              placeholder="919876543210"
              className={`w-full px-3 py-2.5 rounded-lg border ${fieldErrors.whatsapp_number ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
            />
            {fieldErrors.whatsapp_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.whatsapp_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setForm({ ...form, primary_color: c.primary })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    form.primary_color === c.primary
                      ? "border-gray-900 dark:border-white scale-125"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.primary }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setForm({ ...form, accent_color: c.accent })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    form.accent_color === c.accent
                      ? "border-gray-900 dark:border-white scale-125"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.accent }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
