/*
  # Amazon Price Tracker Schema

  ## Overview
  This migration creates the database schema for an intelligent Amazon price tracking system
  that monitors product prices, analyzes trends, predicts price drops, and sends email alerts.

  ## New Tables

  ### 1. `products`
  Stores tracked Amazon products with their current details
  - `id` (uuid, primary key) - Unique identifier
  - `asin` (text, unique) - Amazon Standard Identification Number
  - `title` (text) - Product title
  - `url` (text) - Amazon product URL
  - `current_price` (numeric) - Latest known price
  - `image_url` (text) - Product image URL
  - `is_active` (boolean) - Whether tracking is enabled
  - `last_checked_at` (timestamptz) - Last price check timestamp
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 2. `price_history`
  Stores historical price data for trend analysis and predictions
  - `id` (uuid, primary key) - Unique identifier
  - `product_id` (uuid, foreign key) - References products table
  - `price` (numeric) - Recorded price
  - `checked_at` (timestamptz) - When price was recorded
  - Indexes on product_id and checked_at for efficient queries

  ### 3. `alerts`
  Stores user alert configurations and notification status
  - `id` (uuid, primary key) - Unique identifier
  - `product_id` (uuid, foreign key) - References products table
  - `user_email` (text) - Email address for notifications
  - `target_price` (numeric, nullable) - User-defined target price
  - `use_prediction` (boolean) - Whether to use AI prediction
  - `predicted_price` (numeric, nullable) - AI-predicted optimal price
  - `is_active` (boolean) - Whether alert is enabled
  - `notified_at` (timestamptz, nullable) - Last notification timestamp
  - `created_at` (timestamptz) - Alert creation time

  ## Security
  - RLS enabled on all tables
  - Public access for demo purposes (can be restricted later)

  ## Important Notes
  1. Price data stored as numeric for precision
  2. Timestamps use timestamptz for timezone awareness
  3. ASIN is unique to prevent duplicate product tracking
  4. Indexes added for performance on frequent queries
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asin text UNIQUE NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  current_price numeric(10, 2),
  image_url text,
  is_active boolean DEFAULT true,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price numeric(10, 2) NOT NULL,
  checked_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  target_price numeric(10, 2),
  use_prediction boolean DEFAULT false,
  predicted_price numeric(10, 2),
  is_active boolean DEFAULT true,
  notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_checked_at ON price_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (can be restricted later)
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to products"
  ON products FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to products"
  ON products FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to price_history"
  ON price_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to price_history"
  ON price_history FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to alerts"
  ON alerts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to alerts"
  ON alerts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to alerts"
  ON alerts FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to alerts"
  ON alerts FOR DELETE
  TO public
  USING (true);