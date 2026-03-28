"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { SiteSettings } from "@/lib/types";
import type { Language } from "@/lib/i18n";
import { t as translate, type TranslationKey } from "@/lib/i18n";
import { APP_CONFIG } from "@/config/app.config";
import { UI_CONFIG } from "@/config/ui.config";

interface AppContextType {
  settings: SiteSettings | null;
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  refreshSettings: () => Promise<void>;
  wishlist: string[];
  addToWishlist: (code: string) => void;
  removeFromWishlist: (code: string) => void;
  isInWishlist: (code: string) => boolean;
  toast: string | null;
  showToast: (msg: string) => void;
  recentlyViewed: string[];
  addToRecentlyViewed: (code: string) => void;
  isOffline: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [lang, setLang] = useState<Language>("en");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.primary_color) {
          document.documentElement.style.setProperty("--theme-primary", data.primary_color);
        }
        if (data.accent_color) {
          document.documentElement.style.setProperty("--theme-accent", data.accent_color);
        }
        if (data.dark_mode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch { /* settings not ready yet */ }
  }, []);

  useEffect(() => {
    refreshSettings();
    const saved = localStorage.getItem("lang");
    if (saved === "hi" || saved === "en") setLang(saved);
    const wl = localStorage.getItem(APP_CONFIG.wishlist.storageKey);
    if (wl) setWishlist(JSON.parse(wl));
    const rv = localStorage.getItem(APP_CONFIG.recentlyViewed.storageKey);
    if (rv) setRecentlyViewed(JSON.parse(rv));

    fetch("/api/visitors", { method: "POST" }).catch(() => {});

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [refreshSettings]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const addToWishlist = (code: string) => {
    setWishlist((prev) => {
      const updated = [...prev, code];
      localStorage.setItem(APP_CONFIG.wishlist.storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWishlist = (code: string) => {
    setWishlist((prev) => {
      const updated = prev.filter((c) => c !== code);
      localStorage.setItem(APP_CONFIG.wishlist.storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const addToRecentlyViewed = (code: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((c) => c !== code);
      const updated = [code, ...filtered].slice(0, APP_CONFIG.recentlyViewed.maxItems);
      localStorage.setItem(APP_CONFIG.recentlyViewed.storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const isInWishlist = (code: string) => wishlist.includes(code);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), UI_CONFIG.toast.durationMs);
  };

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);

  return (
    <AppContext.Provider
      value={{
        settings,
        lang,
        setLang,
        t,
        refreshSettings,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toast,
        showToast,
        recentlyViewed,
        addToRecentlyViewed,
        isOffline,
      }}
    >
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-500 text-white text-center text-xs py-1.5 font-medium">
          You are offline. Some features may not work.
        </div>
      )}
      {children}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg bg-green-600 text-white text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
