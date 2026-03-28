"use client";
import { useApp } from "@/lib/context";
import type { TranslationKey } from "@/lib/i18n";

export type SortValue = "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

interface SortDropdownProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  options: readonly { value: string; label: string }[];
}

export default function SortDropdown({ value, onChange, options }: SortDropdownProps) {
  const { t } = useApp();

  return (
    <div className="px-3 mt-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.label as TranslationKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
