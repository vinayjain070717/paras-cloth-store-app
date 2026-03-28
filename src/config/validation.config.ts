export const VALIDATION_CONFIG = {
  product: {
    nameMinLength: 2,
    nameMaxLength: 100,
    descriptionMaxLength: 500,
    codePattern: /^\d{6}$/,
    priceMin: 0.01,
    priceMax: 10000000,
    maxColors: 20,
    maxImages: 10,
  },

  category: {
    nameMinLength: 2,
    nameMaxLength: 50,
  },

  collection: {
    nameMinLength: 2,
    nameMaxLength: 50,
    descriptionMaxLength: 200,
  },

  auth: {
    usernameMinLength: 3,
    usernameMaxLength: 30,
    usernamePattern: /^[a-zA-Z0-9_]+$/,
    passwordMinLength: 8,
    passwordMaxLength: 100,
    otpPattern: /^\d{6}$/,
  },

  settings: {
    shopNameMinLength: 2,
    shopNameMaxLength: 50,
    hexColorPattern: /^#[0-9a-fA-F]{6}$/,
  },

  phone: {
    pattern: /^\d{10,15}$/,
    minLength: 10,
    maxLength: 15,
  },

  notify: {
    customerNameMinLength: 2,
    customerNameMaxLength: 50,
  },

  upload: {
    maxFileSizeMb: 10,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
} as const;
