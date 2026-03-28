"use client";
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, name }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    }
    setName("");
    setEditing(null);
    setShowForm(false);
    setSaving(false);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in this category won't be deleted.")) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    loadCategories();
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newCats = [...categories];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newCats.length) return;

    const tempOrder = newCats[index].display_order;
    newCats[index].display_order = newCats[swapIdx].display_order;
    newCats[swapIdx].display_order = tempOrder;

    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reorder: [
          { id: newCats[index].id, display_order: newCats[index].display_order },
          { id: newCats[swapIdx].id, display_order: newCats[swapIdx].display_order },
        ],
      }),
    });
    loadCategories();
  };

  return (
    <AdminShell>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Categories ({categories.length})</h2>
          <button
            onClick={() => { setName(""); setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-fade-in">
            <input
              placeholder="Category Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!name || saving}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update" : "Add"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditing(null); setName(""); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(i, "up")}
                  disabled={i === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMove(i, "down")}
                  disabled={i === categories.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <span className="flex-1 text-sm font-medium">{cat.name}</span>
              <button
                onClick={() => { setEditing(cat); setName(cat.name); setShowForm(true); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
