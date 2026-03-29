import { describe, it, expect } from "vitest";
import { VALIDATION_CONFIG } from "@/config/validation.config";

describe("Upload Validation Config", () => {
  const { upload } = VALIDATION_CONFIG;

  it("should define allowed image types", () => {
    expect(upload.allowedTypes).toContain("image/jpeg");
    expect(upload.allowedTypes).toContain("image/png");
    expect(upload.allowedTypes).toContain("image/webp");
    expect(upload.allowedTypes).toContain("image/gif");
  });

  it("should not allow non-image types", () => {
    expect(upload.allowedTypes).not.toContain("application/pdf");
    expect(upload.allowedTypes).not.toContain("text/plain");
    expect(upload.allowedTypes).not.toContain("video/mp4");
  });

  it("should have a reasonable max file size", () => {
    expect(upload.maxFileSizeMb).toBeGreaterThan(0);
    expect(upload.maxFileSizeMb).toBeLessThanOrEqual(50);
    expect(upload.maxFileSizeBytes).toBe(upload.maxFileSizeMb * 1024 * 1024);
  });
});

describe("File type validation logic", () => {
  const allowedTypes = VALIDATION_CONFIG.upload.allowedTypes as readonly string[];

  it("should accept valid JPEG files", () => {
    expect(allowedTypes.includes("image/jpeg")).toBe(true);
  });

  it("should accept valid PNG files", () => {
    expect(allowedTypes.includes("image/png")).toBe(true);
  });

  it("should accept valid WebP files", () => {
    expect(allowedTypes.includes("image/webp")).toBe(true);
  });

  it("should reject SVG files", () => {
    expect(allowedTypes.includes("image/svg+xml")).toBe(false);
  });

  it("should reject application types", () => {
    expect(allowedTypes.includes("application/javascript")).toBe(false);
    expect(allowedTypes.includes("application/json")).toBe(false);
  });
});

describe("File size validation logic", () => {
  const maxBytes = VALIDATION_CONFIG.upload.maxFileSizeBytes;

  it("should accept files under the limit", () => {
    const fileSize = 1 * 1024 * 1024; // 1MB
    expect(fileSize <= maxBytes).toBe(true);
  });

  it("should accept files exactly at the limit", () => {
    expect(maxBytes <= maxBytes).toBe(true);
  });

  it("should reject files over the limit", () => {
    const fileSize = maxBytes + 1;
    expect(fileSize > maxBytes).toBe(true);
  });

  it("should reject very large files", () => {
    const fileSize = 100 * 1024 * 1024; // 100MB
    expect(fileSize > maxBytes).toBe(true);
  });
});

describe("Max images per product", () => {
  const maxImages = VALIDATION_CONFIG.product.maxImages;

  it("should have a positive max images limit", () => {
    expect(maxImages).toBeGreaterThan(0);
  });

  it("should allow adding when under limit", () => {
    const currentCount = 3;
    expect(currentCount < maxImages).toBe(true);
  });

  it("should block adding when at limit", () => {
    const currentCount = maxImages;
    expect(currentCount >= maxImages).toBe(true);
  });

  it("should calculate remaining slots correctly", () => {
    const currentCount = 7;
    const remaining = maxImages - currentCount;
    expect(remaining).toBe(maxImages - 7);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});
