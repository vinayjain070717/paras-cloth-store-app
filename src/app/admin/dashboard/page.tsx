"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { useApp } from "@/lib/context";
import { DB_CONFIG } from "@/config/database.config";
import type { Product, ActivityLog, NotifyRequest } from "@/lib/types";

interface Stats {
  total: number;
  available: number;
  soldOut: number;
  categories: number;
  visitors: number;
  todayVisitors: number;
  notifyRequests: number;
}

export default function AdminDashboard() {
  const { settings } = useApp();
  const [stats, setStats] = useState<Stats>({
    total: 0, available: 0, soldOut: 0, categories: 0, visitors: 0, todayVisitors: 0, notifyRequests: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifyRequests, setNotifyRequests] = useState<NotifyRequest[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/visitors").then((r) => r.json()),
      fetch(`/api/activity-log?limit=${DB_CONFIG.queryLimits.recentProductsDashboard * 2}`).then((r) => r.json()).catch(() => []),
      fetch("/api/notify").then((r) => r.json()).catch(() => []),
    ]).then(([products, categories, visitors, activityData, notifyData]) => {
      const prods = Array.isArray(products) ? products : [];
      const cats = Array.isArray(categories) ? categories : [];
      const available = prods.filter((p: Product) => p.is_available).length;
      setStats({
        total: prods.length,
        available,
        soldOut: prods.length - available,
        categories: cats.length,
        visitors: visitors?.total || 0,
        todayVisitors: visitors?.today || 0,
        notifyRequests: Array.isArray(notifyData) ? notifyData.length : 0,
      });
      setRecentProducts(prods.slice(0, DB_CONFIG.queryLimits.recentProductsDashboard));
      setActivities(Array.isArray(activityData) ? activityData : []);
      setNotifyRequests(Array.isArray(notifyData) ? notifyData : []);
    });
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_available: !currentStatus }),
    });
    setRecentProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_available: !currentStatus } : p))
    );
    setStats((prev) => ({
      ...prev,
      available: prev.available + (currentStatus ? -1 : 1),
      soldOut: prev.soldOut + (currentStatus ? 1 : -1),
    }));
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "product_added": return { icon: "+", color: "bg-green-100 text-green-700" };
      case "product_edited": return { icon: "E", color: "bg-blue-100 text-blue-700" };
      case "product_deleted": return { icon: "D", color: "bg-red-100 text-red-700" };
      case "product_sold": return { icon: "S", color: "bg-orange-100 text-orange-700" };
      case "product_restocked": return { icon: "R", color: "bg-green-100 text-green-700" };
      case "csv_imported": return { icon: "C", color: "bg-purple-100 text-purple-700" };
      default: return { icon: "?", color: "bg-gray-100 text-gray-700" };
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleNotifyWhatsApp = (req: NotifyRequest) => {
    if (!settings?.whatsapp_number) return;
    const productName = (req.product as unknown as { name: string })?.name || "product";
    const msg = `Hi ${req.customer_name}! Great news - *${productName}* is back in stock at ${settings.shop_name || "our store"}! Order now before it's gone. 🎉`;
    const link = getWhatsAppLink(req.whatsapp_number, msg);
    window.open(link, "_blank");
  };

  return (
    <AdminShell>
      <div className="px-4 py-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Products" value={stats.total} color="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" />
          <StatCard label="Available" value={stats.available} color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" />
          <StatCard label="Sold Out" value={stats.soldOut} color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" />
          <StatCard label="Visitors" value={stats.visitors} sub={`${stats.todayVisitors} today`} color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" />
        </div>

        {/* Notify Requests */}
        {stats.notifyRequests > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <h3 className="font-bold text-sm mb-2 text-yellow-800 dark:text-yellow-300">
              Notify Requests ({stats.notifyRequests})
            </h3>
            <div className="space-y-2">
              {notifyRequests.slice(0, 5).map((nr) => {
                const prod = nr.product as unknown as { name: string; code: string; is_available: boolean } | undefined;
                return (
                  <div key={nr.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">
                      <span className="font-medium">{nr.customer_name}</span>
                      <span className="text-gray-500"> wants </span>
                      <span className="font-medium">{prod?.name || "Unknown"}</span>
                    </span>
                    <button
                      onClick={() => handleNotifyWhatsApp(nr)}
                      className="shrink-0 px-2 py-1 text-xs bg-green-500 text-white rounded-full"
                    >
                      WhatsApp
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin/products?action=add"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
          <Link
            href="/admin/collections"
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Collections
          </Link>
        </div>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <div>
            <h2 className="font-bold text-sm mb-3">Recent Activity</h2>
            <div className="space-y-2">
              {activities.slice(0, 10).map((act) => {
                const { icon, color } = getActivityIcon(act.action);
                return (
                  <div key={act.id} className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {act.action.replace(/_/g, " ")}
                        {act.entity_name && <span className="text-gray-500"> - {act.entity_name}</span>}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {getRelativeTime(act.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Recent Products</h2>
            <Link href="/admin/products" className="text-xs text-purple-600 dark:text-purple-400">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recentProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0].cloudinary_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">₹{p.price.toLocaleString("en-IN")}</p>
                </div>
                <button
                  onClick={() => handleToggle(p.id, p.is_available)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    p.is_available
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  {p.is_available ? "Available" : "Sold"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/admin/theme" className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-xs font-medium text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Theme
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-xs font-medium text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
          <Link href="/" target="_blank" className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-xs font-medium text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Site
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className={`p-4 rounded-xl ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}
