export const DB_CONFIG = {
  tables: {
    siteSettings: "site_settings",
    admin: "admin",
    otpCodes: "otp_codes",
    categories: "categories",
    products: "products",
    productImages: "product_images",
    collections: "collections",
    collectionProducts: "collection_products",
    visitorCount: "visitor_count",
    activityLog: "activity_log",
    notifyRequests: "notify_requests",
  },

  defaults: {
    productDescription: "",
    colorsJson: "[]",
    displayOrder: 0,
    visitorCount: 0,
  },

  queryLimits: {
    maxProducts: 500,
    maxActivityLog: 50,
    maxNotifyRequests: 100,
    recentProductsDashboard: 5,
  },
} as const;
