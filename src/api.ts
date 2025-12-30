import { AddProductRequest, Product, ProductWithHistory } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function addProduct(data: AddProductRequest): Promise<{ product: Product }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/add-product`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add product');
  }

  return response.json();
}

export async function getProducts(): Promise<{ products: Product[] }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-products`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function getProductDetails(productId: string): Promise<ProductWithHistory> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-products?id=${productId}`,
    { method: 'GET', headers }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch product details');
  }

  return response.json();
}

export async function checkPrices(): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/check-prices`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to check prices');
  }

  return response.json();
}
