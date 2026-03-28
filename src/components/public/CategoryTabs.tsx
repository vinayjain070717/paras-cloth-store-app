"use client";
import { useApp } from "@/lib/context";
import type { Category } from "@/lib/types";

interface CategoryTabsProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryTabs({
  categories,
  selected,
  onSelect,
}: CategoryTabsProps) {
  const { t } = useApp();

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2 px-3">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? "text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
        style={
          selected === null
            ? { backgroundColor: "var(--theme-primary)" }
            : undefined
        }
      >
        {t("allCategories")}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === cat.id
              ? "text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          style={
            selected === cat.id
              ? { backgroundColor: "var(--theme-primary)" }
              : undefined
          }
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
