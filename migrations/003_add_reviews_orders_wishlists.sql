-- 003_add_reviews_orders_wishlists.sql

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  code_quality INTEGER NOT NULL CHECK (code_quality BETWEEN 1 AND 5),
  design INTEGER NOT NULL CHECK (design BETWEEN 1 AND 5),
  documentation INTEGER NOT NULL CHECK (documentation BETWEEN 1 AND 5),
  value_for_money INTEGER NOT NULL CHECK (value_for_money BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  helpful INTEGER NOT NULL DEFAULT 0,
  seller_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT (
    'ORD-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 4)) ||
    UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 4))
  ),
  product_id UUID NOT NULL REFERENCES products(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(10, 2) NOT NULL,
  license_type TEXT NOT NULL,
  license_key TEXT NOT NULL DEFAULT (
    UPPER(REPLACE(gen_random_uuid()::TEXT, '-', ''))
  ),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
