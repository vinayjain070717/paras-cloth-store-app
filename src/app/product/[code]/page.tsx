"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { getWhatsAppLink, buildOrderMessage } from "@/lib/whatsapp";
import ColorDots from "@/components/ui/ColorDots";
import ProductCard from "@/components/public/ProductCard";
import Header from "@/components/public/Header";
import ImageZoom from "@/components/public/ImageZoom";
import { APP_CONFIG } from "@/config/app.config";
import { VALIDATION_CONFIG } from "@/config/validation.config";
import type { Product } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings, t, addToWishlist, removeFromWishlist, isInWishlist, showToast, addToRecentlyViewed } = useApp();
  const code = params.code as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyName, setNotifyName] = useState("");
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState("");

  useEffect(() => {
    fetch(`/api/products?code=${code}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const prod = arr[0];
        setProduct(prod || null);
        if (prod?.colors?.length) setSelectedColor(prod.colors[0]);
        setLoading(false);

        if (prod) {
          addToRecentlyViewed(prod.code);
        }

        if (prod?.category_id) {
          fetch(`/api/products?category=${prod.category_id}&available=true`)
            .then((r) => r.json())
            .then((sims) => {
              const simsArr = Array.isArray(sims) ? sims : [];
              setSimilar(simsArr.filter((s: Product) => s.id !== prod.id).slice(0, APP_CONFIG.product.similarProductsLimit));
            });
        }
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="animate-pulse">
          <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Product not found</p>
      </div>
    );
  }

  const images = product.images?.sort((a, b) => a.display_order - b.display_order) || [];
  const isNew =
    new Date(product.created_at).getTime() > Date.now() - APP_CONFIG.product.newArrivalDays * 24 * 60 * 60 * 1000;
  const inWishlist = isInWishlist(product.code);

  const whatsappLink = settings?.whatsapp_number
    ? getWhatsAppLink(
        settings.whatsapp_number,
        buildOrderMessage({
          name: product.name,
          code: product.code,
          price: product.price,
          color: selectedColor || undefined,
        })
      )
    : "#";

  const handleDownload = async () => {
    const url = images[currentImage]?.cloudinary_url;
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${product.name}-${product.code}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* download failed */ }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${product.code}`;
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: `Check out ${product.name} - ₹${product.price}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      showToast(t("copiedToClipboard"));
    }
  };

  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.code);
      showToast(t("removedFromWishlist"));
    } else {
      addToWishlist(product.code);
      showToast(t("addedToWishlist"));
    }
  };

  const handleNotifySubmit = async () => {
    setNotifyError("");
    if (!VALIDATION_CONFIG.phone.pattern.test(notifyPhone)) {
      setNotifyError("Please enter a valid 10-15 digit phone number");
      return;
    }
    if (notifyName.length < 2) {
      setNotifyError("Please enter your name");
      return;
    }

    setNotifySubmitting(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          whatsapp_number: notifyPhone,
          customer_name: notifyName,
        }),
      });
      if (res.ok) {
        showToast(t("weWillNotify"));
        setShowNotifyForm(false);
        setNotifyName("");
        setNotifyPhone("");
      } else {
        const data = await res.json();
        setNotifyError(data.error || "Failed to submit");
      }
    } catch {
      setNotifyError("Network error. Please try again.");
    }
    setNotifySubmitting(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-between px-3 py-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex gap-1">
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button onClick={toggleWishlist} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg
              className="w-5 h-5"
              fill={inWishlist ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={inWishlist ? { color: "#ef4444" } : {}}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image Gallery with Zoom */}
      <div className="relative bg-white dark:bg-gray-800">
        <div className="overflow-x-auto snap-x snap-mandatory flex hide-scrollbar" onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setCurrentImage(idx);
        }}>
          {images.length > 0 ? images.map((img, i) => (
            <div key={i} className="w-full shrink-0 snap-center aspect-square relative">
              <ImageZoom active={i === currentImage}>
                <Image
                  src={getOptimizedUrl(img.cloudinary_url, 800)}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority={i === 0}
                />
              </ImageZoom>
            </div>
          )) : (
            <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 py-2">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentImage ? "bg-gray-800 dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}
        {images.length > 0 && (
          <p className="text-center text-[10px] text-gray-400 pb-1">{t("pinchToZoom")}</p>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start justify-between">
          <p className="text-xs text-gray-400 font-mono">{product.code}</p>
          {isNew && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {t("newArrival")}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold">{product.name}</h1>

        <p className="text-2xl font-bold" style={{ color: "var(--theme-primary)" }}>
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        {product.stock_count && product.is_available && (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            {t("onlyLeft", { count: product.stock_count })}
          </p>
        )}

        {!product.is_available && (
          <p className="text-sm text-red-500 font-semibold">{t("soldOut")}</p>
        )}

        {product.colors && product.colors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("colors")}:</p>
            <ColorDots
              colors={product.colors}
              size="md"
              selected={selectedColor}
              onSelect={setSelectedColor}
            />
            {selectedColor && (
              <p className="text-xs text-gray-500 mt-1">{selectedColor}</p>
            )}
          </div>
        )}

        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {product.description}
          </p>
        )}

        {product.category && (
          <p className="text-xs text-gray-400">
            {t("category")}: {product.category.name}
          </p>
        )}
      </div>

      {/* Video */}
      {product.video_url && (
        <div className="px-4 mb-4">
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe
              src={product.video_url.replace("watch?v=", "embed/")}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 flex gap-2 mb-6">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t("downloadImage")}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {t("share")}
        </button>
      </div>

      {/* Notify Me (Sold Out) */}
      {!product.is_available && (
        <div className="px-4 mb-6">
          {!showNotifyForm ? (
            <button
              onClick={() => setShowNotifyForm(true)}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
            >
              {t("notifyWhenAvailable")}
            </button>
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t("notifyWhenAvailable")}</p>
              {notifyError && (
                <p className="text-xs text-red-500">{notifyError}</p>
              )}
              <input
                type="text"
                placeholder={t("enterYourName")}
                value={notifyName}
                onChange={(e) => setNotifyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              />
              <input
                type="tel"
                placeholder={t("enterWhatsApp")}
                value={notifyPhone}
                onChange={(e) => setNotifyPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNotifySubmit}
                  disabled={notifySubmitting}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {notifySubmitting ? "..." : t("notifyMe")}
                </button>
                <button
                  onClick={() => setShowNotifyForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Similar Products */}
      {similar.length > 0 && (
        <section className="px-4 mt-4">
          <h2 className="text-sm font-bold mb-3">{t("similarProducts")}</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {similar.map((p) => (
              <div key={p.id} className="w-40 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky WhatsApp Button */}
      {product.is_available && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-40">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-base transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t("orderOnWhatsApp")}
          </a>
        </div>
      )}
    </div>
  );
}
