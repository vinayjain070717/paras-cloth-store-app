"use client";
import { useState } from "react";
import Link from "next/link";

export default function SeedPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<string>("");

  const handleSeed = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setResult(JSON.stringify(data, null, 2));
      } else {
        setStatus("error");
        setResult(data.error || "Failed to seed");
      }
    } catch (err) {
      setStatus("error");
      setResult(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl">
          P
        </div>
        <h1 className="text-xl font-bold mb-2">Seed Demo Data</h1>
        <p className="text-sm text-gray-500 mb-6">
          This will populate your database with 24 sample products, 8 categories,
          4 collections, and 1 admin account so you can explore all features.
        </p>

        {status === "idle" && (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 text-left">
              <p className="font-semibold mb-1">What will be created:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>8 Categories: Sarees, Shirts, Pants, Kurtas, Towels, Bedsheets, Dupattas, Kids Wear</li>
                <li>24 Products with prices, colors, stock counts & images</li>
                <li>4 Collections: Wedding, Summer, Festival, Budget</li>
                <li>Site settings with banner, timings, social links</li>
                <li>Admin login: <strong>admin</strong> / <strong>admin123</strong></li>
                <li>Sample visitor counts</li>
              </ul>
            </div>
            <button
              onClick={handleSeed}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
            >
              Load Demo Data
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="py-8">
            <div className="w-10 h-10 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Creating demo data...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 text-sm">
              Demo data loaded successfully!
            </div>
            <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-left overflow-x-auto">
              {result}
            </pre>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold text-center"
              >
                View Store
              </Link>
              <Link
                href="/admin"
                className="py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-center"
              >
                Admin Panel
              </Link>
            </div>
            <p className="text-xs text-gray-400">
              Admin login: <strong>admin</strong> / <strong>admin123</strong>
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {result}
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
