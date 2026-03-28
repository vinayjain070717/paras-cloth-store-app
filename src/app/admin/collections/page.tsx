"use client";
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { buildCatalogMessage, getWhatsAppLink } from "@/lib/whatsapp";
import { useApp } from "@/lib/context";
import type { Collection, Product } from "@/lib/types";

export default function AdminCollectionsPage() {
  const { settings } = useApp();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const [showProductPicker, setShowProductPicker] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);

  const loadCollections = async () => {
    const res = await fetch("/api/collections");
    const data = await res.json();
    setCollections(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadCollections(); }, []);

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await fetch("/api/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ name: "", description: "" });
    setEditing(null);
    setShowForm(false);
    setSaving(false);
    loadCollections();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
    loadCollections();
  };

  const handleToggle = async (col: Collection) => {
    await fetch("/api/collections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: col.id, name: col.name, description: col.description, is_active: !col.is_active }),
    });
    loadCollections();
  };

  const openProductPicker = async (collectionId: string) => {
    setShowProductPicker(collectionId);
    const [prods, colData] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch(`/api/collections?id=${collectionId}&withProducts=true`).then((r) => r.json()),
    ]);
    setAllProducts(prods);
    setCollectionProducts(colData.products || []);
  };

  const toggleProduct = async (productId: string, isIn: boolean) => {
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isIn
          ? { removeProduct: true, collection_id: showProductPicker, product_id: productId }
          : { addProduct: true, collection_id: showProductPicker, product_id: productId }
      ),
    });
    openProductPicker(showProductPicker!);
  };

  const handleShareCollection = async (collectionId: string) => {
    const res = await fetch(`/api/collections?id=${collectionId}&withProducts=true`);
    const data = await res.json();
    if (!data.products?.length) return;
    const msg = buildCatalogMessage(
      settings?.shop_name || "Paras Cloth Store",
      data.products,
      typeof window !== "undefined" ? window.location.origin : ""
    );
    const link = getWhatsAppLink(settings?.whatsapp_number || "", msg);
    window.open(link, "_blank");
  };

  return (
    <AdminShell>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Collections</h2>
          <button
            onClick={() => { setForm({ name: "", description: "" }); setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold"
          >
            + Add
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-fade-in space-y-3">
            <input placeholder="Collection Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" autoFocus />
            <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!form.name || saving} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {collections.map((col) => (
            <div key={col.id} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{col.name}</h3>
                  {col.description && <p className="text-xs text-gray-500">{col.description}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${col.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {col.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openProductPicker(col.id)} className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                  Manage Products
                </button>
                <button onClick={() => handleShareCollection(col.id)} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-full font-medium">
                  Share on WhatsApp
                </button>
                <button onClick={() => handleToggle(col)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-full font-medium">
                  {col.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => { setEditing(col); setForm({ name: col.name, description: col.description }); setShowForm(true); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-full font-medium">
                  Edit
                </button>
                <button onClick={() => handleDelete(col.id)} className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-full font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Product Picker Modal */}
        {showProductPicker && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-4 animate-slide-up">
              <h3 className="font-bold mb-3">Manage Products in Collection</h3>
              <div className="space-y-2 mb-4">
                {allProducts.map((p) => {
                  const isIn = collectionProducts.some((cp) => cp.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id, isIn)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        isIn ? "bg-purple-50 dark:bg-purple-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isIn ? "border-purple-600 bg-purple-600" : "border-gray-300"}`}>
                        {isIn && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm truncate">{p.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">₹{p.price}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowProductPicker(null)} className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold">Done</button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
