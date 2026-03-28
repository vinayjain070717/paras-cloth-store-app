"use client";
import { PRESET_COLORS } from "@/lib/colors";

interface ColorDotsProps {
  colors: string[];
  size?: "sm" | "md";
  selected?: string;
  onSelect?: (color: string) => void;
}

export default function ColorDots({
  colors,
  size = "sm",
  selected,
  onSelect,
}: ColorDotsProps) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-7 h-7";

  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((colorName) => {
        const preset = PRESET_COLORS.find(
          (c) => c.name.toLowerCase() === colorName.toLowerCase()
        );
        const bg = preset?.hex || "#9CA3AF";
        const isGradient = bg.startsWith("linear");
        const isSelected = selected === colorName;

        return (
          <button
            key={colorName}
            type="button"
            title={colorName}
            onClick={() => onSelect?.(colorName)}
            className={`${sizeClass} rounded-full border-2 transition-transform ${
              isSelected
                ? "border-gray-900 dark:border-white scale-125"
                : "border-gray-300 dark:border-gray-600"
            } ${onSelect ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
            style={{
              background: isGradient ? bg : bg,
              ...(bg === "#F9FAFB" ? { border: "2px solid #d1d5db" } : {}),
            }}
          />
        );
      })}
    </div>
  );
}
