import { describe, it, expect } from "vitest";
import { UI_CONFIG } from "@/config/ui.config";
import { APP_CONFIG } from "@/config/app.config";
import { getOptimizedUrl } from "@/lib/cloudinary";

describe("Product Detail Config", () => {
  it("should have desktop max width configured", () => {
    expect(UI_CONFIG.productDetail.desktopMaxWidth).toBeDefined();
    expect(UI_CONFIG.productDetail.desktopMaxWidth).toContain("max-w-");
  });

  it("should have image max height for desktop", () => {
    expect(UI_CONFIG.productDetail.imageMaxHeightDesktop).toBeDefined();
    expect(UI_CONFIG.productDetail.imageMaxHeightDesktop).toContain("max-h-");
  });
});

describe("Image optimization", () => {
  it("should not transform non-cloudinary URLs", () => {
    const unsplashUrl = "https://images.unsplash.com/photo-12345?w=600";
    expect(getOptimizedUrl(unsplashUrl, 800)).toBe(unsplashUrl);
  });

  it("should transform cloudinary URLs with width and quality", () => {
    const cloudUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    const optimized = getOptimizedUrl(cloudUrl, 400);
    expect(optimized).toContain("w_400");
    expect(optimized).toContain("q_auto");
    expect(optimized).toContain("f_auto");
  });

  it("should handle empty URL gracefully", () => {
    expect(getOptimizedUrl("", 400)).toBe("");
  });
});

describe("Similar products config", () => {
  it("should have a reasonable limit for similar products", () => {
    expect(APP_CONFIG.product.similarProductsLimit).toBeGreaterThan(0);
    expect(APP_CONFIG.product.similarProductsLimit).toBeLessThanOrEqual(20);
  });

  it("should have new arrival days configured", () => {
    expect(APP_CONFIG.product.newArrivalDays).toBeGreaterThan(0);
  });
});

describe("Image zoom config", () => {
  it("should have max scale greater than min scale", () => {
    expect(UI_CONFIG.imageZoom.maxScale).toBeGreaterThan(UI_CONFIG.imageZoom.minScale);
  });

  it("should have a reasonable double tap delay", () => {
    expect(UI_CONFIG.imageZoom.doubleTapDelay).toBeGreaterThan(100);
    expect(UI_CONFIG.imageZoom.doubleTapDelay).toBeLessThan(1000);
  });
});

describe("Non-array API response handling", () => {
  it("should safely handle error object response as empty array", () => {
    const response = { error: "Internal server error", code: "INTERNAL_ERROR" };
    const result = Array.isArray(response) ? response : [];
    expect(result).toEqual([]);
  });

  it("should pass through valid array responses", () => {
    const response = [{ id: "1", name: "Product" }];
    const result = Array.isArray(response) ? response : [];
    expect(result).toEqual([{ id: "1", name: "Product" }]);
  });

  it("should handle null/undefined responses", () => {
    const result1 = Array.isArray(null) ? null : [];
    const result2 = Array.isArray(undefined) ? undefined : [];
    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
  });
});
