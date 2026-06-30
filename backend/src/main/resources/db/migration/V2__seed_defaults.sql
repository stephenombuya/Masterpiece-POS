-- ══════════════════════════════════════════════════════════════════════
-- MasterpiecePOS — V2 Seed Default Data
-- ══════════════════════════════════════════════════════════════════════

-- Roles
INSERT INTO roles (name) VALUES ('ADMIN'), ('MANAGER'), ('CASHIER')
ON CONFLICT (name) DO NOTHING;

-- Default admin user: admin / Admin@1234
-- BCrypt hash of "Admin@1234" with strength 12
INSERT INTO users (username, password_hash, full_name, email, role_id, is_active)
VALUES (
    'admin',
    '$2a$12$iW5dJFjr6bfSoP0MrT5ZUewNGqEzIZuGqhbMqrHORPsJJCbCFgSwm',
    'System Administrator',
    'admin@retailpos.local',
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Default category
INSERT INTO categories (name, description)
VALUES ('General', 'Default product category')
ON CONFLICT (name) DO NOTHING;
