export interface SiteSettings {
  id: string;
  shop_name: string;
  whatsapp_number: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  dark_mode: boolean;
  footer_text: string;
  banner_text: string;
  banner_active: boolean;
  shop_address: string;
  shop_timings: string;
  instagram_url: string;
  facebook_url: string;
  is_installed: boolean;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

export interface Category {
  id: string;
  name: string;
  image_url: string | null;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  description: string;
  category_id: string | null;
  is_available: boolean;
  is_featured: boolean;
  stock_count: number | null;
  colors: string[];
  video_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  cloudinary_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  product_id: string;
}

export interface OtpCode {
  id: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface VisitorCount {
  id: string;
  date: string;
  count: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface NotifyRequest {
  id: string;
  product_id: string;
  whatsapp_number: string;
  customer_name: string;
  notified: boolean;
  created_at: string;
  product?: Product;
}
