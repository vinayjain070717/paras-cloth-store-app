import { VALIDATION_CONFIG } from "@/config/validation.config";

const v = VALIDATION_CONFIG;

function getZ() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("zod").z;
}

function lazy<T>(factory: () => T): { readonly value: T } {
  let cached: T | undefined;
  return {
    get value() {
      if (!cached) cached = factory();
      return cached;
    },
  };
}

const _productCreateSchema = lazy(() => {
  const z = getZ();
  return z.object({
    code: z
      .string()
      .regex(v.product.codePattern, "Code must be exactly 6 digits")
      .optional(),
    name: z
      .string()
      .min(v.product.nameMinLength, `Name must be at least ${v.product.nameMinLength} characters`)
      .max(v.product.nameMaxLength, `Name must be at most ${v.product.nameMaxLength} characters`),
    price: z
      .number()
      .min(v.product.priceMin, "Price must be greater than 0")
      .max(v.product.priceMax, "Price is too high"),
    description: z
      .string()
      .max(v.product.descriptionMaxLength, `Description must be at most ${v.product.descriptionMaxLength} characters`)
      .optional()
      .default(""),
    category_id: z.string().uuid("Invalid category ID").nullable().optional(),
    is_available: z.boolean().optional().default(true),
    is_featured: z.boolean().optional().default(false),
    stock_count: z.number().int().min(0).nullable().optional(),
    colors: z
      .array(z.string())
      .max(v.product.maxColors, `Maximum ${v.product.maxColors} colors allowed`)
      .optional()
      .default([]),
    video_url: z.string().url("Invalid video URL").nullable().optional(),
    images: z
      .array(z.string().url("Invalid image URL"))
      .max(v.product.maxImages, `Maximum ${v.product.maxImages} images allowed`)
      .optional()
      .default([]),
  });
});

const _productUpdateSchema = lazy(() => {
  const z = getZ();
  return z.object({
    id: z.string().uuid("Invalid product ID"),
    name: z.string().min(v.product.nameMinLength).max(v.product.nameMaxLength).optional(),
    price: z.number().min(v.product.priceMin).max(v.product.priceMax).optional(),
    description: z.string().max(v.product.descriptionMaxLength).optional(),
    category_id: z.string().uuid().nullable().optional(),
    is_available: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    stock_count: z.number().int().min(0).nullable().optional(),
    colors: z.array(z.string()).max(v.product.maxColors).optional(),
    video_url: z.string().url().nullable().optional(),
    images: z.array(z.string().url()).max(v.product.maxImages).optional(),
  });
});

const _categorySchema = lazy(() => {
  const z = getZ();
  return z.object({
    name: z
      .string()
      .min(v.category.nameMinLength, `Name must be at least ${v.category.nameMinLength} characters`)
      .max(v.category.nameMaxLength, `Name must be at most ${v.category.nameMaxLength} characters`),
    image_url: z.string().url("Invalid URL").nullable().optional(),
  });
});

const _collectionSchema = lazy(() => {
  const z = getZ();
  return z.object({
    name: z
      .string()
      .min(v.collection.nameMinLength, `Name must be at least ${v.collection.nameMinLength} characters`)
      .max(v.collection.nameMaxLength, `Name must be at most ${v.collection.nameMaxLength} characters`),
    description: z
      .string()
      .max(v.collection.descriptionMaxLength, `Description must be at most ${v.collection.descriptionMaxLength} characters`)
      .optional()
      .default(""),
    is_active: z.boolean().optional().default(true),
  });
});

const _installSchema = lazy(() => {
  const z = getZ();
  return z.object({
    username: z
      .string()
      .min(v.auth.usernameMinLength, `Username must be at least ${v.auth.usernameMinLength} characters`)
      .max(v.auth.usernameMaxLength, `Username must be at most ${v.auth.usernameMaxLength} characters`)
      .regex(v.auth.usernamePattern, "Username can only contain letters, numbers, and underscores"),
    password: z
      .string()
      .min(v.auth.passwordMinLength, `Password must be at least ${v.auth.passwordMinLength} characters`)
      .max(v.auth.passwordMaxLength),
    email: z.string().email("Invalid email address"),
    shop_name: z
      .string()
      .min(v.settings.shopNameMinLength, `Shop name must be at least ${v.settings.shopNameMinLength} characters`)
      .max(v.settings.shopNameMaxLength, `Shop name must be at most ${v.settings.shopNameMaxLength} characters`),
    whatsapp_number: z
      .string()
      .regex(v.phone.pattern, "WhatsApp number must be 10-15 digits"),
    primary_color: z.string().regex(v.settings.hexColorPattern, "Invalid color format").optional(),
  });
});

const _loginSchema = lazy(() => {
  const z = getZ();
  return z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    otp: z
      .string()
      .regex(v.auth.otpPattern, "OTP must be 6 digits")
      .optional(),
  });
});

const _settingsUpdateSchema = lazy(() => {
  const z = getZ();
  return z.object({
    shop_name: z.string().min(v.settings.shopNameMinLength).max(v.settings.shopNameMaxLength).optional(),
    whatsapp_number: z.string().regex(v.phone.pattern).optional(),
    logo_url: z.string().url().nullable().optional(),
    primary_color: z.string().regex(v.settings.hexColorPattern).optional(),
    accent_color: z.string().regex(v.settings.hexColorPattern).optional(),
    dark_mode: z.boolean().optional(),
    footer_text: z.string().max(200).optional(),
    banner_text: z.string().max(200).optional(),
    banner_active: z.boolean().optional(),
    shop_address: z.string().max(300).optional(),
    shop_timings: z.string().max(100).optional(),
    instagram_url: z.string().url().or(z.literal("")).optional(),
    facebook_url: z.string().url().or(z.literal("")).optional(),
    change_password: z.boolean().optional(),
    new_password: z.string().min(v.auth.passwordMinLength).optional(),
    change_email: z.boolean().optional(),
    new_email: z.string().email().optional(),
  });
});

const _notifySchema = lazy(() => {
  const z = getZ();
  return z.object({
    product_id: z.string().uuid("Invalid product ID"),
    whatsapp_number: z
      .string()
      .regex(v.phone.pattern, "WhatsApp number must be 10-15 digits"),
    customer_name: z
      .string()
      .min(v.notify.customerNameMinLength, `Name must be at least ${v.notify.customerNameMinLength} characters`)
      .max(v.notify.customerNameMaxLength, `Name must be at most ${v.notify.customerNameMaxLength} characters`),
  });
});

const _csvImportRowSchema = lazy(() => {
  const z = getZ();
  return z.object({
    name: z.string().min(v.product.nameMinLength).max(v.product.nameMaxLength),
    price: z.coerce.number().min(v.product.priceMin).max(v.product.priceMax),
    code: z.string().regex(v.product.codePattern).optional(),
    description: z.string().max(v.product.descriptionMaxLength).optional().default(""),
    category: z.string().optional(),
    stock_count: z.coerce.number().int().min(0).optional(),
    colors: z.string().optional(),
    is_featured: z.coerce.boolean().optional().default(false),
  });
});

export const productCreateSchema = { parse: (data: unknown) => _productCreateSchema.value.parse(data) };
export const productUpdateSchema = { parse: (data: unknown) => _productUpdateSchema.value.parse(data) };
export const categorySchema = { parse: (data: unknown) => _categorySchema.value.parse(data) };
export const collectionSchema = { parse: (data: unknown) => _collectionSchema.value.parse(data) };
export const installSchema = { parse: (data: unknown) => _installSchema.value.parse(data) };
export const loginSchema = { parse: (data: unknown) => _loginSchema.value.parse(data) };
export const settingsUpdateSchema = { parse: (data: unknown) => _settingsUpdateSchema.value.parse(data) };
export const notifySchema = { parse: (data: unknown) => _notifySchema.value.parse(data) };
export const csvImportRowSchema = { parse: (data: unknown) => _csvImportRowSchema.value.parse(data) };
