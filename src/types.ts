export interface Product {
  id: string;
  asin: string;
  title: string;
  url: string;
  current_price: number | null;
  image_url: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
  alerts?: Alert[];
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  checked_at: string;
}

export interface Alert {
  id: string;
  product_id: string;
  user_email: string;
  target_price: number | null;
  use_prediction: boolean;
  predicted_price: number | null;
  is_active: boolean;
  notified_at: string | null;
  created_at: string;
}

export interface AddProductRequest {
  url: string;
  userEmail?: string;
  targetPrice?: number;
}

export interface ProductWithHistory {
  product: Product;
  priceHistory: PriceHistory[];
  alerts: Alert[];
}
