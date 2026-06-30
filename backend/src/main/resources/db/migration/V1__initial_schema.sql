-- ══════════════════════════════════════════════════════════════════════
-- RetailPOS — V1 Initial Schema
-- PostgreSQL 14+
-- ══════════════════════════════════════════════════════════════════════

-- ── roles ─────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── users ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(80)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150),
    role_id       BIGINT NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── categories ────────────────────────────────────────────────────────
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── products ──────────────────────────────────────────────────────────
CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    barcode     VARCHAR(100) UNIQUE,
    description TEXT,
    price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cost_price  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    category_id BIGINT REFERENCES categories(id),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── inventory ─────────────────────────────────────────────────────────
CREATE TABLE inventory (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE REFERENCES products(id),
    quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_stock  INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sales ─────────────────────────────────────────────────────────────
CREATE TABLE sales (
    id           BIGSERIAL PRIMARY KEY,
    sale_number  VARCHAR(50) NOT NULL UNIQUE,
    cashier_id   BIGINT NOT NULL REFERENCES users(id),
    subtotal     NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status       VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
                 CHECK (status IN ('COMPLETED','VOIDED','REFUNDED')),
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sale_items ────────────────────────────────────────────────────────
CREATE TABLE sale_items (
    id           BIGSERIAL PRIMARY KEY,
    sale_id      BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    line_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── payments ──────────────────────────────────────────────────────────
CREATE TABLE payments (
    id         BIGSERIAL PRIMARY KEY,
    sale_id    BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method     VARCHAR(20) NOT NULL CHECK (method IN ('CASH','MPESA','CARD','CREDIT')),
    amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    reference  VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── receipts ──────────────────────────────────────────────────────────
CREATE TABLE receipts (
    id           BIGSERIAL PRIMARY KEY,
    sale_id      BIGINT NOT NULL UNIQUE REFERENCES sales(id),
    receipt_path VARCHAR(255),
    printed      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_logs ────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id),
    action     VARCHAR(100) NOT NULL,
    entity     VARCHAR(100),
    entity_id  BIGINT,
    details    TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX idx_products_barcode    ON products(barcode);
CREATE INDEX idx_products_active     ON products(is_active);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_sales_number        ON sales(sale_number);
CREATE INDEX idx_sales_cashier       ON sales(cashier_id);
CREATE INDEX idx_sales_created       ON sales(created_at);
CREATE INDEX idx_sale_items_sale     ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product  ON sale_items(product_id);
CREATE INDEX idx_payments_sale       ON payments(sale_id);
CREATE INDEX idx_audit_logs_user     ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created  ON audit_logs(created_at);

-- ── Updated_at trigger function ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
