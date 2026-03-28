"use client";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import ProductCard from "@/components/public/ProductCard";
import CategoryTabs from "@/components/public/CategoryTabs";
import SearchBar from "@/components/public/SearchBar";
import PriceFilter, { type PriceRange } from "@/components/public/PriceFilter";
import SortDropdown, { type SortValue } from "@/components/public/SortDropdown";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { useApp } from "@/lib/context";
import { UI_CONFIG } from "@/config/ui.config";
import { APP_CONFIG } from "@/config/app.config";
import type { Product, Category, Collection } from "@/lib/types";
import Link from "next/link";

export default function HomePage() {
  const { t, settings, recentlyViewed } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [loading, setLoading] = useState(true);
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/collections").then((r) => r.json()),
      fetch("/api/visitors").then((r) => r.json()),
    ]).then(([prods, cats, colls, visitors]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setCollections(
        Array.isArray(colls) ? colls.filter((c: Collection) => c.is_active) : []
      );
      setVisitorCount(visitors?.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      );
    }
    if (priceRange) {
      result = result.filter((p) => {
        if (priceRange.min && p.price < priceRange.min) return false;
        if (priceRange.max && p.price > priceRange.max) return false;
        return true;
      });
    }

    const sorted = [...result];
    switch (sortBy) {
      case "price_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [products, selectedCategory, search, priceRange, sortBy]);

  const featured = useMemo(
    () => products.filter((p) => p.is_featured && p.is_available),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.is_available &&
            new Date(p.created_at).getTime() >
              Date.now() - APP_CONFIG.product.newArrivalDays * 24 * 60 * 60 * 1000
        )
        .slice(0, APP_CONFIG.product.similarProductsLimit),
    [products]
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewed
        .map((code) => products.find((p) => p.code === code))
        .filter(Boolean) as Product[],
    [recentlyViewed, products]
  );

  const isFiltering = !!(search || selectedCategory || priceRange);

  return (
    <div className="min-h-screen pb-4">
      <Header />

      <SearchBar value={search} onChange={setSearch} />

      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <PriceFilter selected={priceRange} onSelect={setPriceRange} />

      <SortDropdown value={sortBy} onChange={setSortBy} options={UI_CONFIG.sortOptions} />

      {!isFiltering && (
        <>
          {featured.length > 0 && (
            <section className="px-3 mt-4">
              <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: "var(--theme-accent)" }} />
                {t("featuredProducts")}
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {newArrivals.length > 0 && (
            <section className="px-3 mt-6">
              <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full bg-red-500" />
                {t("newArrivals")}
              </h2>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {newArrivals.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {recentlyViewedProducts.length > 0 && (
            <section className="px-3 mt-6">
              <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full bg-blue-500" />
                {t("recentlyViewed")}
              </h2>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {recentlyViewedProducts.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {collections.length > 0 && (
            <section className="px-3 mt-6">
              <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: "var(--theme-primary)" }} />
                {t("collections")}
              </h2>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/collection/${col.id}`}
                    className="shrink-0 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-md"
                    style={{ backgroundColor: "var(--theme-primary)" }}
                  >
                    {col.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="px-3 mt-6">
        <h2 className="text-sm font-bold mb-2">
          {isFiltering
            ? `${filtered.length} ${t("products").toLowerCase()}`
            : t("products")}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: UI_CONFIG.skeleton.productCount }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {visitorCount > 0 && (
        <div className="text-center mt-6 text-xs text-gray-400">
          {visitorCount.toLocaleString()} {t("visitors").toLowerCase()}
        </div>
      )}

      <Footer />
    </div>
  );
}
