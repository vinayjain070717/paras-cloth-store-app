"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/public/Header";
import ProductCard from "@/components/public/ProductCard";
import type { Product, Collection } from "@/lib/types";

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections?id=${id}&withProducts=true`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setCollection(data);
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen pb-4">
      <Header />
      <div className="px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : collection ? (
          <>
            <h1 className="text-xl font-bold mb-1">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-gray-500 mb-4">{collection.description}</p>
            )}
            <p className="text-xs text-gray-400 mb-4">{products.length} products</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-400">Collection not found</p>
        )}
      </div>
    </div>
  );
}
