export const APP_CONFIG = {
  shopDefaults: {
    name: "Paras Cloth Store Online",
    whatsappNumber: "",
    primaryColor: "#7c3aed",
    accentColor: "#f59e0b",
  },

  product: {
    codeLength: 6,
    codeMin: 100000,
    codeMax: 999999,
    maxImagesPerProduct: 10,
    maxColorsPerProduct: 20,
    similarProductsLimit: 6,
    newArrivalDays: 3,
  },

  recentlyViewed: {
    maxItems: 10,
    storageKey: "recently_viewed",
  },

  wishlist: {
    storageKey: "wishlist",
  },

  visitor: {
    maxPerIpPerMinute: 1,
  },

  pagination: {
    defaultLimit: 50,
    activityLogLimit: 50,
    activityLogDashboardLimit: 10,
  },
} as const;
