"use client";
import Link from "next/link";
import { useApp } from "@/lib/context";

export default function Header() {
  const { settings, lang, setLang, t } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
      {settings?.banner_active && settings.banner_text && (
        <div
          className="text-center text-white text-xs py-1.5 px-2 font-medium"
          style={{ backgroundColor: settings.accent_color || "#f59e0b" }}
        >
          {settings.banner_text}
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: settings?.primary_color || "#7c3aed" }}
          >
            {(settings?.shop_name || "P")[0]}
          </div>
          <h1 className="font-bold text-sm truncate">
            {settings?.shop_name || t("shopName")}
          </h1>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/wishlist"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            title={t("wishlist")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="text-xs font-bold px-2.5 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {lang === "en" ? "हिंदी" : "EN"}
          </button>
        </div>
      </div>
    </header>
  );
}
