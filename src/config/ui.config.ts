export const UI_CONFIG = {
  theme: {
    defaultPrimaryColor: "#7c3aed",
    defaultAccentColor: "#f59e0b",
  },

  priceFilterRanges: [
    { label: "under500", min: 0, max: 500 },
    { label: "range500to1000", min: 500, max: 1000 },
    { label: "range1000to2000", min: 1000, max: 2000 },
    { label: "above2000", min: 2000, max: null },
  ],

  sortOptions: [
    { value: "newest", label: "newest" },
    { value: "price_asc", label: "priceLowHigh" },
    { value: "price_desc", label: "priceHighLow" },
    { value: "name_asc", label: "nameAZ" },
    { value: "name_desc", label: "nameZA" },
  ] as const,

  adminSortOptions: [
    { value: "newest", label: "newest" },
    { value: "oldest", label: "oldest" },
    { value: "price_asc", label: "priceLowHigh" },
    { value: "price_desc", label: "priceHighLow" },
    { value: "available_first", label: "availableFirst" },
    { value: "soldout_first", label: "soldOutFirst" },
    { value: "name_asc", label: "nameAZ" },
  ] as const,

  skeleton: {
    productCount: 6,
  },

  toast: {
    durationMs: 3000,
  },

  imageZoom: {
    maxScale: 3,
    minScale: 1,
    doubleTapDelay: 300,
    hintStorageKey: "seen_zoom_hint",
  },

  csvExport: {
    columns: ["Code", "Name", "Price", "Category", "Available", "Featured", "Stock Count", "Colors", "Description"],
  },

  productDetail: {
    desktopMaxWidth: "max-w-5xl",
    imageMaxHeightDesktop: "max-h-[70vh]",
  },

  upload: {
    galleryButtonLabel: "chooseFromGallery",
    cameraButtonLabel: "takePhoto",
  },
} as const;
