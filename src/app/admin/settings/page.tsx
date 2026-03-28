"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { useApp } from "@/lib/context";
import type { SiteSettings } from "@/lib/types";
import QRCode from "qrcode";

export default function AdminSettingsPage() {
  const { refreshSettings } = useApp();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [emailForm, setEmailForm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      QRCode.toDataURL(window.location.origin, { width: 300, margin: 2 })
        .then(setQrDataUrl);
    }
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    await refreshSettings();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Passwords do not match");
      return;
    }
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change_password: true, new_password: passwordForm.new }),
    });
    setPasswordForm({ current: "", new: "", confirm: "" });
    setShowPassword(false);
    alert("Password updated!");
  };

  const handleChangeEmail = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change_email: true, new_email: emailForm }),
    });
    setEmailForm("");
    setShowEmail(false);
    alert("Email updated!");
  };

  if (!settings) return <AdminShell><div className="p-4 text-center text-gray-400">Loading...</div></AdminShell>;

  return (
    <AdminShell>
      <div className="px-4 py-4 space-y-6">
        <h2 className="font-bold text-lg">Settings</h2>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/theme" className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center text-sm font-medium">
            Theme & Colors
          </Link>
          <Link href="/admin/collections" className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center text-sm font-medium">
            Collections
          </Link>
        </div>

        {/* Shop Info */}
        <Section title="Shop Information">
          <Field label="Shop Name" value={settings.shop_name} onChange={(v) => setSettings({ ...settings, shop_name: v })} />
          <Field label="WhatsApp Number" value={settings.whatsapp_number} onChange={(v) => setSettings({ ...settings, whatsapp_number: v })} placeholder="919876543210" />
          <Field label="Shop Address" value={settings.shop_address} onChange={(v) => setSettings({ ...settings, shop_address: v })} placeholder="Your shop address for Google Maps" />
          <Field label="Shop Timings" value={settings.shop_timings} onChange={(v) => setSettings({ ...settings, shop_timings: v })} placeholder="10 AM - 9 PM, Closed Sundays" />
        </Section>

        {/* Social */}
        <Section title="Social Media">
          <Field label="Instagram URL" value={settings.instagram_url} onChange={(v) => setSettings({ ...settings, instagram_url: v })} placeholder="https://instagram.com/..." />
          <Field label="Facebook URL" value={settings.facebook_url} onChange={(v) => setSettings({ ...settings, facebook_url: v })} placeholder="https://facebook.com/..." />
        </Section>

        {/* Banner */}
        <Section title="Sale Banner">
          <Field label="Banner Text" value={settings.banner_text} onChange={(v) => setSettings({ ...settings, banner_text: v })} placeholder="Diwali Sale - 20% off!" />
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={settings.banner_active}
              onChange={(e) => setSettings({ ...settings, banner_active: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show banner on website</span>
          </label>
        </Section>

        {/* Footer */}
        <Section title="Footer">
          <Field label="Footer Text" value={settings.footer_text} onChange={(v) => setSettings({ ...settings, footer_text: v })} placeholder="© 2024 Paras Cloth Store" />
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>

        {/* Security */}
        <Section title="Security">
          <button onClick={() => setShowPassword(!showPassword)} className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Change Password
          </button>
          {showPassword && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <input type="password" placeholder="New Password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              <input type="password" placeholder="Confirm Password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              <button onClick={handleChangePassword} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Update Password</button>
            </div>
          )}

          <button onClick={() => setShowEmail(!showEmail)} className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-3 block">
            Change Email (for OTP)
          </button>
          {showEmail && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <input type="email" placeholder="New Email" value={emailForm} onChange={(e) => setEmailForm(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              <button onClick={handleChangeEmail} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Update Email</button>
            </div>
          )}
        </Section>

        {/* QR Code */}
        <Section title="QR Code">
          <p className="text-xs text-gray-500 mb-3">Print this QR code and put it in your physical shop. Customers can scan to visit your website.</p>
          {qrDataUrl && (
            <div className="flex flex-col items-center">
              <img src={qrDataUrl} alt="Shop QR Code" className="w-48 h-48 rounded-lg" />
              <a
                href={qrDataUrl}
                download="paras-cloth-store-qr.png"
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
              >
                Download QR Code
              </a>
            </div>
          )}
        </Section>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
      />
    </div>
  );
}
