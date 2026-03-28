"use client";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { getWhatsAppLink, buildOrderMessage } from "@/lib/whatsapp";
import ColorDots from "@/components/ui/ColorDots";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { settings, t } = useApp();

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.cloudinary_url ||
    product.images?.[0]?.cloudinary_url;

  const isNew =
    new Date(product.created_at).getTime() >
    Date.now() - 3 * 24 * 60 * 60 * 1000;

  const whatsappLink = settings?.whatsapp_number
    ? getWhatsAppLink(
        settings.whatsapp_number,
        buildOrderMessage({
          name: product.name,
          code: product.code,
          price: product.price,
        })
      )
    : "#";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
      <Link href={`/product/${product.code}`}>
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          {primaryImage ? (
            <Image
              src={getOptimizedUrl(primaryImage, 400)}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {isNew && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {t("newArrival")}
            </span>
          )}
          {!product.is_available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                {t("soldOut")}
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-3 space-y-1.5">
        <p className="text-[10px] text-gray-400 font-mono">{product.code}</p>
        <Link href={`/product/${product.code}`}>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="font-bold text-base" style={{ color: "var(--theme-primary)" }}>
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        {product.stock_count && product.is_available && (
          <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
            {t("onlyLeft", { count: product.stock_count })}
          </p>
        )}
        {product.colors && product.colors.length > 0 && (
          <ColorDots colors={product.colors} size="sm" />
        )}
        {product.is_available && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t("orderOnWhatsApp")}
          </a>
        )}
      </div>
    </div>
  );
}
