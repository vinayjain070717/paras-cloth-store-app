"use client";
import { useApp } from "@/lib/context";

export interface PriceRange {
  min?: number;
  max?: number;
  label: string;
}

interface PriceFilterProps {
  selected: PriceRange | null;
  onSelect: (range: PriceRange | null) => void;
}

export const PRICE_RANGES: PriceRange[] = [
  { max: 500, label: "under500" },
  { min: 500, max: 1000, label: "range500to1000" },
  { min: 1000, max: 2000, label: "range1000to2000" },
  { min: 2000, label: "above2000" },
];

export default function PriceFilter({ selected, onSelect }: PriceFilterProps) {
  const { t } = useApp();

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 px-3">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          !selected
            ? "border-[var(--theme-primary)] text-[var(--theme-primary)] bg-purple-50 dark:bg-purple-900/20"
            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
        }`}
      >
        {t("all")}
      </button>
      {PRICE_RANGES.map((range) => (
        <button
          key={range.label}
          onClick={() =>
            onSelect(selected?.label === range.label ? null : range)
          }
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected?.label === range.label
              ? "border-[var(--theme-primary)] text-[var(--theme-primary)] bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
          }`}
        >
          {t(range.label as import("@/lib/i18n").TranslationKey)}
        </button>
      ))}
    </div>
  );
}
