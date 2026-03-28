"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PRESET_COLORS } from "@/lib/colors";
import { buildCatalogMessage, getWhatsAppLink } from "@/lib/whatsapp";
import { useApp } from "@/lib/context";
import { UI_CONFIG } from "@/config/ui.config";
import { VALIDATION_CONFIG } from "@/config/validation.config";
import type { Product, Category } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

type AdminSort = "newest" | "oldest" | "price_asc" | "price_desc" | "available_first" | "soldout_first" | "name_asc";

export default function AdminProductsPageWrapper() {
  return (
    <Suspense fallback={<AdminShell><div className="p-8 text-center text-gray-400">Loading...</div></AdminShell>}>
      <AdminProductsPage />
    </Suspense>
  );
}

function AdminProductsPage() {
  const searchParams = useSearchParams();
  const { settings, t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get("action") === "add");
  const [editing, setEditing] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<AdminSort>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: { row: number; message: string }[] } | null>(null);
  const [importUploading, setImportUploading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    price: "",
    description: "",
    category_id: "",
    stock_count: "",
    colors: [] as string[],
    video_url: "",
    is_featured: false,
    images: [] as string[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(Array.isArray(prods) ? prods : []);
    setCategories(Array.isArray(cats) ? cats : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setForm({
      code: "", name: "", price: "", description: "", category_id: "",
      stock_count: "", colors: [], video_url: "", is_featured: false, images: [],
    });
    setFormErrors({});
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setForm({
      code: product.code,
      name: product.name,
      price: String(product.price),
      description: product.description,
      category_id: product.category_id || "",
      stock_count: product.stock_count ? String(product.stock_count) : "",
      colors: product.colors || [],
      video_url: product.video_url || "",
      is_featured: product.is_featured,
      images: product.images?.map((i) => i.cloudinary_url) || [],
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleCopy = (product: Product) => {
    setEditing(null);
    setForm({
      code: "",
      name: `Copy of ${product.name}`,
      price: String(product.price),
      description: product.description,
      category_id: product.category_id || "",
      stock_count: product.stock_count ? String(product.stock_count) : "",
      colors: product.colors || [],
      video_url: product.video_url || "",
      is_featured: product.is_featured,
      images: product.images?.map((i) => i.cloudinary_url) || [],
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > VALIDATION_CONFIG.upload.maxFileSizeBytes) {
        setFormErrors((prev) => ({ ...prev, images: `File ${file.name} is too large (max ${VALIDATION_CONFIG.upload.maxFileSizeMb}MB)` }));
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) {
          setForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
        }
      } catch { /* upload failed */ }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const toggleColor = (colorName: string) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter((c) => c !== colorName)
        : [...prev.colors, colorName],
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const v = VALIDATION_CONFIG;

    if (!form.name || form.name.length < v.product.nameMinLength) {
      errors.name = `Name must be at least ${v.product.nameMinLength} characters`;
    }
    if (form.name.length > v.product.nameMaxLength) {
      errors.name = `Name must be at most ${v.product.nameMaxLength} characters`;
    }
    if (!form.price || Number(form.price) < v.product.priceMin) {
      errors.price = "Price must be greater than 0";
    }
    if (form.stock_count && Number(form.stock_count) < 0) {
      errors.stock_count = "Stock count cannot be negative";
    }
    if (form.video_url && !/^https?:\/\//.test(form.video_url)) {
      errors.video_url = "Invalid URL format";
    }
    if (form.description.length > v.product.descriptionMaxLength) {
      errors.description = `Description must be at most ${v.product.descriptionMaxLength} characters`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const body = {
      ...(editing ? { id: editing.id } : {}),
      code: form.code || undefined,
      name: form.name,
      price: Number(form.price),
      description: form.description,
      category_id: form.category_id || null,
      stock_count: form.stock_count ? Number(form.stock_count) : null,
      colors: form.colors,
      video_url: form.video_url || null,
      is_featured: form.is_featured,
      images: form.images,
    };

    const res = await fetch("/api/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormErrors({ _general: data.error || "Failed to save" });
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const handleToggle = async (id: string, available: boolean) => {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_available: !available }),
    });
    loadData();
  };

  const handleBulkSold = async () => {
    for (const id of selectedIds) {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_available: false }),
      });
    }
    setSelectedIds(new Set());
    loadData();
  };

  const handleShare = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;
    const msg = buildCatalogMessage(
      settings?.shop_name || "Paras Cloth Store",
      selected,
      typeof window !== "undefined" ? window.location.origin : ""
    );
    const link = getWhatsAppLink(settings?.whatsapp_number || "", msg);
    window.open(link, "_blank");
  };

  const handleCopyMessage = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;
    const msg = buildCatalogMessage(
      settings?.shop_name || "Paras Cloth Store",
      selected,
      typeof window !== "undefined" ? window.location.origin : ""
    );
    navigator.clipboard.writeText(msg);
    setShowSharePreview(false);
  };

  const handleExportCSV = async () => {
    const res = await fetch("/api/products/export");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportUploading(true);
    setImportResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/products/import", { method: "POST", body: fd });
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) loadData();
    } catch {
      setImportResult({ imported: 0, errors: [{ row: 0, message: "Upload failed" }] });
    }
    setImportUploading(false);
  };

  const downloadTemplate = () => {
    const headers = "Name,Price,Code,Description,Category,Stock Count,Colors,Is Featured";
    const example = '"Red Silk Saree",2500,100099,"Beautiful saree","Sarees",2,"Red|Gold",false';
    const csv = headers + "\n" + example;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  let filtered = products.filter((p) => {
    if (filterCategory && p.category_id !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.code.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (sortBy) {
    case "oldest":
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case "price_asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "available_first":
      sorted.sort((a, b) => (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0));
      break;
    case "soldout_first":
      sorted.sort((a, b) => (a.is_available ? 1 : 0) - (b.is_available ? 1 : 0));
      break;
    case "name_asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  filtered = sorted;

  return (
    <AdminShell>
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Products ({products.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-medium"
              title="Export CSV"
            >
              Export
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-medium"
              title="Import CSV"
            >
              Import
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Search, Filter, Sort */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as AdminSort)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            {UI_CONFIG.adminSortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label as TranslationKey)}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex gap-2 mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl animate-fade-in">
            <span className="text-sm font-medium flex-1">{selectedIds.size} selected</span>
            <button onClick={handleBulkSold} className="px-3 py-1 text-xs bg-red-500 text-white rounded-full font-medium">Mark Sold</button>
            <button onClick={() => { setShowSharePreview(true); }} className="px-3 py-1 text-xs bg-green-500 text-white rounded-full font-medium">Share</button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 text-xs border border-gray-300 rounded-full font-medium">Clear</button>
          </div>
        )}

        {/* Share Preview Modal */}
        {showSharePreview && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-4 animate-slide-up">
              <h3 className="font-bold mb-3">Share on WhatsApp</h3>
              <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4 whitespace-pre-wrap overflow-x-auto">
                {buildCatalogMessage(
                  settings?.shop_name || "Paras Cloth Store",
                  products.filter((p) => selectedIds.has(p.id)),
                  typeof window !== "undefined" ? window.location.origin : ""
                )}
              </pre>
              <div className="flex gap-2">
                <button onClick={handleShare} className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold">Send on WhatsApp</button>
                <button onClick={handleCopyMessage} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold">Copy Message</button>
              </div>
              <button onClick={() => setShowSharePreview(false)} className="w-full mt-2 py-2 text-sm text-gray-500">Cancel</button>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 animate-slide-up">
              <h3 className="font-bold mb-3">{t("importCSV")}</h3>
              <p className="text-xs text-gray-500 mb-3">
                Upload a CSV file to add products in bulk. Use the template for the correct format.
              </p>
              <button onClick={downloadTemplate} className="text-xs text-purple-600 font-medium mb-3 block">
                {t("downloadTemplate")}
              </button>
              <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-400 transition-colors mb-3">
                <span className="text-sm text-gray-500">
                  {importUploading ? "Importing..." : "Choose CSV File"}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  disabled={importUploading}
                />
              </label>
              {importResult && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm mb-3">
                  <p className="font-medium text-green-600">{importResult.imported} products imported</p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-500 font-medium">{importResult.errors.length} errors:</p>
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-xs text-red-400">Row {err.row}: {err.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-semibold">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Product Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 animate-slide-up">
              <h3 className="font-bold mb-4">{editing ? "Edit Product" : "Add Product"}</h3>

              {formErrors._general && (
                <p className="text-xs text-red-500 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">{formErrors._general}</p>
              )}

              <div className="space-y-3">
                <div>
                  <input
                    placeholder="Product Code (auto-generated if empty)"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <input
                    placeholder="Product Name *"
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors((p) => ({ ...p, name: "" })); }}
                    className={`w-full px-3 py-2.5 rounded-lg border ${formErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm`}
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Price *"
                    value={form.price}
                    onChange={(e) => { setForm({ ...form, price: e.target.value }); setFormErrors((p) => ({ ...p, price: "" })); }}
                    className={`w-full px-3 py-2.5 rounded-lg border ${formErrors.price ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm`}
                  />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormErrors((p) => ({ ...p, description: "" })); }}
                    rows={2}
                    className={`w-full px-3 py-2.5 rounded-lg border ${formErrors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm`}
                  />
                  {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                </div>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div>
                  <input
                    type="number"
                    placeholder="Stock Count (optional)"
                    value={form.stock_count}
                    onChange={(e) => { setForm({ ...form, stock_count: e.target.value }); setFormErrors((p) => ({ ...p, stock_count: "" })); }}
                    className={`w-full px-3 py-2.5 rounded-lg border ${formErrors.stock_count ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm`}
                  />
                  {formErrors.stock_count && <p className="text-xs text-red-500 mt-1">{formErrors.stock_count}</p>}
                </div>

                {/* Colors */}
                <div>
                  <p className="text-sm font-medium mb-2">Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleColor(c.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          form.colors.includes(c.name)
                            ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-600 font-semibold"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ background: c.hex }}
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    placeholder="YouTube Video URL (optional)"
                    value={form.video_url}
                    onChange={(e) => { setForm({ ...form, video_url: e.target.value }); setFormErrors((p) => ({ ...p, video_url: "" })); }}
                    className={`w-full px-3 py-2.5 rounded-lg border ${formErrors.video_url ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-sm`}
                  />
                  {formErrors.video_url && <p className="text-xs text-red-500 mt-1">{formErrors.video_url}</p>}
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Featured product (pin to top)</span>
                </label>

                {/* Image Upload */}
                <div>
                  <p className="text-sm font-medium mb-2">Photos</p>
                  {formErrors.images && <p className="text-xs text-red-500 mb-2">{formErrors.images}</p>}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-400 transition-colors">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {uploading ? "Uploading..." : "Add Photos"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handleUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.price || saving}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={resetForm} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product List */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                      return next;
                    });
                  }}
                  className="rounded shrink-0"
                />
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                  {p.images?.[0] && (
                    <img src={p.images[0].cloudinary_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.code} · ₹{p.price.toLocaleString("en-IN")}
                    {p.is_featured && " · ⭐"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(p.id, p.is_available)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      p.is_available
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.is_available ? "✓" : "✗"}
                  </button>
                  <button onClick={() => handleCopy(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Copy">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Quick Share Buttons */}
        {categories.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-sm mb-2">Quick Share by Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const catProducts = products.filter((p) => p.category_id === cat.id && p.is_available);
                if (catProducts.length === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const msg = buildCatalogMessage(
                        settings?.shop_name || "Paras Cloth Store",
                        catProducts,
                        typeof window !== "undefined" ? window.location.origin : ""
                      );
                      const link = getWhatsAppLink(settings?.whatsapp_number || "", msg);
                      window.open(link, "_blank");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share {cat.name} ({catProducts.length})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
