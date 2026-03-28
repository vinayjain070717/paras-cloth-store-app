"use client";
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { THEME_COLORS, ACCENT_COLORS } from "@/lib/colors";
import { useApp } from "@/lib/context";

export default function AdminThemePage() {
  const { refreshSettings } = useApp();
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setPrimaryColor(data.primary_color || "#7c3aed");
        setAccentColor(data.accent_color || "#f59e0b");
        setDarkMode(data.dark_mode || false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primary_color: primaryColor,
        accent_color: accentColor,
        dark_mode: darkMode,
      }),
    });
    await refreshSettings();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminShell>
      <div className="px-4 py-4 space-y-6">
        <h2 className="font-bold text-lg">Theme Customization</h2>

        {/* Preview */}
        <div className="rounded-xl overflow-hidden shadow-lg">
          <div
            className="p-4 text-white text-center"
            style={{ backgroundColor: primaryColor }}
          >
            <p className="font-bold">Paras Cloth Store Online</p>
          </div>
          <div className={`p-4 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
            <p className="text-sm mb-2">Preview of your store</p>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-white text-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Category
              </span>
              <span
                className="px-3 py-1 rounded-full text-white text-xs"
                style={{ backgroundColor: accentColor }}
              >
                Sale!
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <div className={`flex-1 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="w-full h-16 rounded bg-gray-300 dark:bg-gray-600 mb-2" />
                <p className="text-xs font-medium">Product Name</p>
                <p className="text-xs font-bold" style={{ color: primaryColor }}>₹1,200</p>
              </div>
              <div className={`flex-1 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="w-full h-16 rounded bg-gray-300 dark:bg-gray-600 mb-2" />
                <p className="text-xs font-medium">Product Name</p>
                <p className="text-xs font-bold" style={{ color: primaryColor }}>₹800</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Color */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3">Primary Color</h3>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setPrimaryColor(c.primary)}
                className={`w-10 h-10 rounded-full border-3 transition-all ${
                  primaryColor === c.primary
                    ? "border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-400"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.primary }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3">Accent Color (for badges & banners)</h3>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setAccentColor(c.accent)}
                className={`w-10 h-10 rounded-full border-3 transition-all ${
                  accentColor === c.accent
                    ? "border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-400"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.accent }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Dark Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Dark Mode</h3>
              <p className="text-xs text-gray-500 mt-0.5">Enable dark theme for the public website</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                darkMode ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  darkMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Theme Updated!" : "Save Theme"}
        </button>
      </div>
    </AdminShell>
  );
}
