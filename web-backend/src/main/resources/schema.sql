-- ============================================================
--  POS SYSTEM - PostgreSQL Schema
--  Clean, normalized, production-ready
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS & ROLES
-- ============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,  -- ADMIN, CASHIER, MANAGER
    description TEXT
);

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username     VARCHAR(100) UNIQUE NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    role_id      INT NOT NULL REFERENCES roles(id),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS & INVENTORY
-- ============================================================
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
    cost_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    selling_price   NUMERIC(12, 2) NOT NULL,
    tax_rate        NUMERIC(5, 2) DEFAULT 0,       -- % e.g. 16.00 for 16%
    stock_quantity  INT NOT NULL DEFAULT 0,
    low_stock_alert INT DEFAULT 10,
    barcode         VARCHAR(100) UNIQUE,
    image_url       VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id),
    movement_type   VARCHAR(20) NOT NULL,  -- SALE, RESTOCK, ADJUSTMENT, RETURN
    quantity        INT NOT NULL,           -- negative for reductions
    reference_id    UUID,                  -- sale_id or purchase_id
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS (Optional but good for loyalty)
-- ============================================================
CREATE TABLE customers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(255) NOT NULL,
    phone        VARCHAR(20) UNIQUE,
    email        VARCHAR(255) UNIQUE,
    loyalty_pts  INT DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALES & TRANSACTIONS
-- ============================================================
CREATE TABLE sales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number  VARCHAR(50) UNIQUE NOT NULL,
    cashier_id      UUID NOT NULL REFERENCES users(id),
    customer_id     UUID REFERENCES customers(id),
    subtotal        NUMERIC(12, 2) NOT NULL,
    tax_total       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_total  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12, 2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL,  -- CASH, CARD, MPESA, MIXED
    amount_tendered NUMERIC(12, 2),
    change_given    NUMERIC(12, 2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'COMPLETED', -- COMPLETED, REFUNDED, VOIDED
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sale_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    product_name    VARCHAR(255) NOT NULL,  -- snapshot at time of sale
    unit_price      NUMERIC(12, 2) NOT NULL,
    quantity        INT NOT NULL,
    discount        NUMERIC(12, 2) DEFAULT 0,
    tax_amount      NUMERIC(12, 2) DEFAULT 0,
    line_total      NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id),
    action       VARCHAR(100) NOT NULL,  -- LOGIN, PRODUCT_CREATE, SALE_VOID, etc.
    entity_type  VARCHAR(100),
    entity_id    VARCHAR(255),
    old_value    JSONB,
    new_value    JSONB,
    ip_address   VARCHAR(45),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_products_sku        ON products(sku);
CREATE INDEX idx_products_barcode    ON products(barcode);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_sales_cashier       ON sales(cashier_id);
CREATE INDEX idx_sales_created_at    ON sales(created_at);
CREATE INDEX idx_sale_items_sale     ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product  ON sale_items(product_id);
CREATE INDEX idx_stock_product       ON stock_movements(product_id);
CREATE INDEX idx_audit_user          ON audit_logs(user_id);
CREATE INDEX idx_audit_created       ON audit_logs(created_at);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO roles (name, description) VALUES
    ('ADMIN',    'Full system access'),
    ('MANAGER',  'Reports + inventory management'),
    ('CASHIER',  'Sales and basic operations');

INSERT INTO categories (name, description) VALUES
    ('Electronics',   'Electronic devices and accessories'),
    ('Food & Beverage', 'Consumables and groceries'),
    ('Clothing',      'Apparel and fashion'),
    ('Stationery',    'Office and school supplies');
