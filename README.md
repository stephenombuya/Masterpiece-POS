# Masterpiece-POS

A full-stack solution featuring a Spring Boot + PostgreSQL backend, React (Vite + Zustand) web app, and a JavaFX desktop application with offline support. Designed for scalability, security, and performance — with JWT authentication, role-based access control, inventory management, sales processing, reporting, and audit logging built in. Supports both online (web) and offline-first (desktop) workflows, with a clear path to multi-store SaaS architecture.

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WEB-BASED POS SYSTEM                        │
│                                                                     │
│   ┌──────────────────┐    HTTPS/REST    ┌─────────────────────────┐ │
│   │   React Frontend │ ◄──────────────► │  Spring Boot Backend    │ │
│   │  (Vite + Zustand)│                  │  (REST API, JWT Auth)   │ │
│   │                  │                  │                         │ │
│   │  ┌────────────┐  │                  │  ┌───────────────────┐  │ │
│   │  │ Auth Store │  │                  │  │  SecurityConfig   │  │ │
│   │  │ Cart Store │  │                  │  │  JwtFilter        │  │ │
│   │  └────────────┘  │                  │  └───────────────────┘  │ │
│   │  ┌────────────┐  │                  │  ┌───────────────────┐  │ │
│   │  │ React Query│  │                  │  │  Controllers      │  │ │
│   │  │ API Layer  │  │                  │  │  Services         │  │ │
│   │  └────────────┘  │                  │  │  Repositories     │  │ │
│   └──────────────────┘                  │  └───────────────────┘  │ │
│                                         │           │             │ │
│                                         │    ┌──────▼──────┐      │ │
│                                         │    │ PostgreSQL  │      │ │
│                                         │    └─────────────┘      │ │
│                                         └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        DESKTOP POS SYSTEM                           │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    JavaFX Application                        │  │
│   │                                                              │  │
│   │   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │  │
│   │   │  Controllers  │   │   Services   │   │     DAOs      │  │  │
│   │   │  (FXML/UI)   │──►│  (Business   │──►│  (SQLite via  │  │  │
│   │   │              │   │   Logic)     │   │   JDBC)       │  │  │
│   │   └──────────────┘   └──────────────┘   └───────────────┘  │  │
│   │                                                 │            │  │
│   │                                         ┌───────▼──────┐    │  │
│   │                                         │  SQLite DB   │    │  │
│   │                                         │  (local file)│    │  │
│   │                                         └──────────────┘    │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                  Works fully OFFLINE | Sync-ready                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. PROJECT STRUCTURE

### 2A. Spring Boot Backend

```
web-backend/
├── pom.xml
└── src/main/
    ├── java/com/pos/
    │   ├── config/
    │   │   ├── SecurityConfig.java        ← JWT + CORS + route protection
    │   │   └── AppConfig.java             ← Auth beans (AuthManager, PasswordEncoder)
    │   ├── controller/
    │   │   ├── AuthController.java        ← POST /auth/login, /register, /refresh
    │   │   ├── ProductController.java     ← CRUD + stock adjust + low-stock
    │   │   ├── SaleController.java        ← Process sales, void, receipt lookup
    │   │   ├── ReportController.java      ← Daily/weekly reports, top products
    │   │   └── UserController.java        ← Admin user management
    │   ├── service/
    │   │   ├── AuthService.java           ← Register, authenticate, refresh
    │   │   ├── ProductService.java        ← Product CRUD + inventory
    │   │   ├── SaleService.java           ← Sale processing + receipt generation
    │   │   ├── ReportService.java         ← Analytics queries
    │   │   └── AuditService.java          ← Audit log writes
    │   ├── repository/
    │   │   ├── UserRepository.java
    │   │   ├── ProductRepository.java     ← Custom @Query for search + low-stock
    │   │   ├── SaleRepository.java        ← Date-range queries, cashier filter
    │   │   └── StockMovementRepository.java
    │   ├── entity/
    │   │   ├── User.java                  ← Implements UserDetails
    │   │   ├── Role.java
    │   │   ├── Product.java
    │   │   ├── Category.java
    │   │   ├── Sale.java
    │   │   ├── SaleItem.java
    │   │   ├── Customer.java
    │   │   ├── StockMovement.java
    │   │   └── AuditLog.java
    │   ├── dto/
    │   │   ├── auth/     AuthRequest, AuthResponse, RegisterRequest
    │   │   ├── product/  CreateProductRequest, UpdateProductRequest, ProductResponse
    │   │   ├── sale/     CreateSaleRequest, SaleItemRequest, SaleResponse
    │   │   ├── report/   DailySummaryResponse, SalesReportResponse
    │   │   └── shared/   ApiResponse, PageResponse
    │   ├── security/
    │   │   ├── JwtService.java            ← Token generation + validation
    │   │   └── JwtAuthenticationFilter.java ← Per-request JWT extraction
    │   └── exception/
    │       └── GlobalExceptionHandler.java ← @RestControllerAdvice
    └── resources/
        ├── application.properties
        └── schema.sql                     ← PostgreSQL DDL + seed data
```

### 2B. React Frontend

```
web-frontend/
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx                            ← Router + QueryClient + Toaster
    ├── main.jsx
    ├── services/
    │   └── api.js                         ← Axios + interceptors + typed API modules
    ├── store/
    │   ├── authStore.js                   ← Zustand: token, user, login/logout
    │   └── cartStore.js                   ← Zustand: items, totals, add/remove/clear
    ├── pages/
    │   ├── LoginPage.jsx                  ← Auth form with validation
    │   ├── DashboardPage.jsx              ← KPI cards + charts + low-stock alerts
    │   ├── SalesPage.jsx                  ← POS: product grid + cart + checkout
    │   ├── ProductsPage.jsx               ← Product table + search + CRUD
    │   ├── ReportsPage.jsx                ← Date-range reports + charts
    │   ├── UsersPage.jsx                  ← Admin: user management
    │   └── ReceiptPage.jsx                ← Printable receipt
    └── components/
        ├── layout/
        │   └── AppLayout.jsx              ← Sidebar + topbar shell
        ├── products/
        │   ├── ProductModal.jsx           ← Create/edit product form
        │   └── StockAdjustModal.jsx       ← Restock / adjustment form
        └── shared/
            ├── Modal.jsx
            ├── Spinner.jsx
            └── Badge.jsx
```

### 2C. JavaFX Desktop

```
desktop/
├── pom.xml
└── src/main/
    ├── java/com/pos/desktop/
    │   ├── MainApp.java                   ← JavaFX Application entry point
    │   ├── dao/
    │   │   ├── DatabaseManager.java       ← SQLite singleton connection
    │   │   ├── ProductDao.java            ← Product CRUD + stock
    │   │   ├── SaleDao.java               ← Transactional sale + items
    │   │   ├── UserDao.java               ← User auth
    │   │   └── CategoryDao.java
    │   ├── service/
    │   │   ├── AuthService.java           ← BCrypt login, session management
    │   │   ├── ProductService.java        ← Business logic over ProductDao
    │   │   ├── SaleService.java           ← Sale processing + validation
    │   │   ├── ReportService.java         ← Daily summaries
    │   │   └── SessionService.java        ← Current user singleton
    │   ├── controller/
    │   │   ├── LoginController.java       ← FXML: login form
    │   │   ├── MainController.java        ← FXML: tab/nav shell
    │   │   ├── PosController.java         ← FXML: cashier screen
    │   │   ├── ProductController.java     ← FXML: product management
    │   │   └── ReportController.java      ← FXML: daily summary view
    │   ├── model/
    │   │   ├── User.java
    │   │   ├── Product.java
    │   │   ├── Sale.java
    │   │   ├── SaleItem.java
    │   │   └── CartItem.java              ← UI-only model with recalculate()
    │   └── util/
    │       ├── DatabaseManager.java
    │       ├── ViewManager.java           ← FXML scene switching
    │       ├── ReceiptPrinter.java        ← Text receipt + Java AWT print
    │       ├── CurrencyUtil.java          ← KES formatting
    │       └── AlertUtil.java             ← JavaFX alert helpers
    └── resources/
        ├── schema.sql                     ← SQLite DDL + seed
        ├── fxml/
        │   ├── login.fxml
        │   ├── main.fxml
        │   ├── pos.fxml
        │   ├── products.fxml
        │   └── reports.fxml
        └── css/
            └── style.css                  ← Dark theme for JavaFX
```

---

## 3. REST API REFERENCE

### Authentication
| Method | Endpoint         | Auth | Description               |
|--------|-----------------|------|---------------------------|
| POST   | /auth/login     | ✗    | Login → returns JWT       |
| POST   | /auth/register  | ✗    | Register new cashier       |
| POST   | /auth/refresh   | JWT  | Refresh access token       |

### Products
| Method | Endpoint                    | Role       | Description                  |
|--------|----------------------------|------------|------------------------------|
| GET    | /products                  | Any        | List + search (paginated)    |
| GET    | /products/{id}             | Any        | Get single product           |
| GET    | /products/barcode/{code}   | Any        | Look up by barcode           |
| POST   | /products                  | ADMIN/MGR  | Create product               |
| PUT    | /products/{id}             | ADMIN/MGR  | Update product               |
| PATCH  | /products/{id}/stock       | ADMIN/MGR  | Adjust stock (+/-)           |
| DELETE | /products/{id}             | ADMIN      | Deactivate product           |
| GET    | /products/low-stock        | ADMIN/MGR  | Products below alert level   |

### Sales
| Method | Endpoint                     | Role       | Description                  |
|--------|------------------------------|------------|------------------------------|
| POST   | /sales                       | Any        | Process a sale               |
| GET    | /sales                       | ADMIN/MGR  | List sales (date filter)     |
| GET    | /sales/{id}                  | Any        | Get sale by ID               |
| GET    | /sales/receipt/{number}      | Any        | Get by receipt number        |
| POST   | /sales/{id}/void             | ADMIN/MGR  | Void a sale                  |
| GET    | /sales/my-sales              | Any        | Cashier's own sales          |

### Reports
| Method | Endpoint                       | Role       | Description                  |
|--------|-------------------------------|------------|------------------------------|
| GET    | /reports/daily?date=          | ADMIN/MGR  | Daily revenue summary        |
| GET    | /reports/sales?from=&to=      | ADMIN/MGR  | Date-range report            |
| GET    | /reports/top-products         | ADMIN/MGR  | Top-selling products         |
| GET    | /reports/cashier-performance  | ADMIN      | Revenue per cashier          |

---

## 4. KEY REQUEST/RESPONSE EXAMPLES

### Login Request
```json
POST /api/v1/auth/login
{
  "username": "cashier01",
  "password": "secure123"
}

Response 200:
{
  "token": "eyJhbGci...",
  "id": "uuid",
  "username": "cashier01",
  "email": "cashier@store.com",
  "fullName": "John Doe",
  "role": "CASHIER"
}
```

### Create Sale Request
```json
POST /api/v1/sales
Authorization: Bearer <token>
{
  "items": [
    { "productId": "uuid-1", "quantity": 2, "discount": 0 },
    { "productId": "uuid-2", "quantity": 1, "discount": 50.00 }
  ],
  "paymentMethod": "CASH",
  "amountTendered": 1500.00,
  "notes": null
}

Response 201:
{
  "id": "uuid",
  "receiptNumber": "RCP-20250117-0042",
  "cashierName": "John Doe",
  "items": [...],
  "subtotal": 1200.00,
  "taxTotal": 192.00,
  "discountTotal": 50.00,
  "totalAmount": 1342.00,
  "paymentMethod": "CASH",
  "amountTendered": 1500.00,
  "changeGiven": 158.00,
  "status": "COMPLETED",
  "createdAt": "2025-01-17T10:23:45Z"
}
```

---

## 5. DATABASE SCHEMA SUMMARY

### PostgreSQL (Web)
```
roles           → id, name, description
users           → id (UUID), username, email, password, full_name, role_id, is_active
categories      → id, name, description
products        → id (UUID), sku, name, category_id, cost_price, selling_price,
                  tax_rate, stock_quantity, low_stock_alert, barcode, is_active
sales           → id (UUID), receipt_number, cashier_id, customer_id, subtotal,
                  tax_total, discount_total, total_amount, payment_method,
                  amount_tendered, change_given, status
sale_items      → id (UUID), sale_id, product_id, product_name (snapshot),
                  unit_price, quantity, discount, tax_amount, line_total
stock_movements → id, product_id, movement_type, quantity, reference_id, notes
customers       → id, name, phone, email, loyalty_pts
audit_logs      → id, user_id, action, entity_type, entity_id, old_value, new_value
```

### SQLite (Desktop)
Same logical structure, simplified:
- UUIDs stored as TEXT
- Timestamps as TEXT (ISO 8601)
- No sequences (AUTOINCREMENT for numeric PKs)
- WAL mode enabled for better concurrent read performance

---

## 6. SHARED DOMAIN CONCEPTS

Both systems implement the same business rules:

| Concept         | Rule                                                          |
|----------------|---------------------------------------------------------------|
| Stock Deduction | On every sale, stock is reduced atomically with items saved   |
| Receipt Number  | Format: `RCP-YYYYMMDD-NNNN` (web) / `DSK-YYYYMMDD-NNNN` (desktop) |
| Tax Calculation | Per-line: `(unitPrice × qty - discount) × taxRate%`          |
| Total Formula   | `subtotal + taxTotal - discountTotal`                         |
| Void Sale       | Sets status=VOIDED, restores stock, records RETURN movement   |
| Low Stock Alert | Triggered when `stock_quantity ≤ low_stock_alert`             |
| Soft Delete     | Products are deactivated (`is_active=false`), never deleted   |

---

## 7. SETUP & RUN INSTRUCTIONS

### Prerequisites
```
Java 17+
Node.js 18+
PostgreSQL 15+
Maven 3.9+
```

---

### 7A. Web Backend Setup

**1. Create the database**
```bash
psql -U postgres
CREATE DATABASE pos_db;
CREATE USER pos_user WITH PASSWORD 'pos_password';
GRANT ALL PRIVILEGES ON DATABASE pos_db TO pos_user;
\q
```

**2. Run the schema**
```bash
psql -U pos_user -d pos_db -f web-backend/src/main/resources/schema.sql
```

**3. Configure environment**
```bash
export DB_USERNAME=pos_user
export DB_PASSWORD=pos_password
export JWT_SECRET=your-super-secret-256-bit-key-replace-me
```

Or edit `application.properties` directly for local dev.

**4. Build and run**
```bash
cd web-backend
mvn clean install -DskipTests
mvn spring-boot:run
```
API available at: `http://localhost:8080/api/v1`

**Seed a first admin user:**
```sql
-- Password: Admin@123 (bcrypt hash below)
INSERT INTO users (id, username, email, password, full_name, role_id)
VALUES (
  gen_random_uuid(), 'admin', 'admin@store.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  'Administrator',
  (SELECT id FROM roles WHERE name = 'ADMIN')
);
```

---

### 7B. React Frontend Setup

**1. Install dependencies**
```bash
cd web-frontend
npm install
```

**2. Configure API URL**
Create `.env`:
```
VITE_API_URL=http://localhost:8080/api/v1
```

**3. Start development server**
```bash
npm run dev
```
App available at: `http://localhost:5173`

**4. Build for production**
```bash
npm run build
# Output in dist/ — deploy to Nginx, Vercel, or any static host
```

---

### 7C. Desktop Application Setup

**1. Build the fat JAR**
```bash
cd desktop
mvn clean package assembly:single -DskipTests
```

**2. Run the desktop app**
```bash
java -jar target/pos-desktop-1.0.0-jar-with-dependencies.jar
```

Database is auto-created at `~/.retailpos/pos.db` on first launch.

**Default login:** `admin` / `admin123`

**To run with JavaFX Maven plugin (during dev):**
```bash
mvn javafx:run
```

---

## 8. ENVIRONMENT VARIABLES (Web Backend)

| Variable         | Default          | Description                   |
|-----------------|------------------|-------------------------------|
| DB_USERNAME     | pos_user         | PostgreSQL username            |
| DB_PASSWORD     | pos_password     | PostgreSQL password            |
| JWT_SECRET      | (required)       | 256-bit secret for JWT signing |
| SERVER_PORT     | 8080             | HTTP port                     |

---

## 9. SECURITY DESIGN

### Web Backend
- **JWT Authentication** — stateless, 24-hour expiry, refresh token support
- **Role-Based Access Control** — ADMIN > MANAGER > CASHIER hierarchy
- **Password Hashing** — BCrypt with strength 10
- **CORS** — whitelist-only origins
- **Input Validation** — Bean Validation on all DTOs
- **Audit Logging** — all significant actions logged with user + IP

### Desktop
- **Local BCrypt** — passwords stored hashed in SQLite
- **Session Singleton** — current user held in memory, cleared on logout
- **No Network** — fully offline, no attack surface for remote exploits
- **File Permissions** — DB file in user home directory

---

## 10. SCALING PATH TO SAAS

The system is designed to evolve cleanly:

```
Phase 1 (Current)    → Single-store deployment, self-hosted
Phase 2 (Multi-store)→ Add "store_id" FK to products/sales tables
                        → Backend: tenant filter on every query
                        → Frontend: store selector in header
Phase 3 (SaaS)       → Extract auth to Auth0/Keycloak
                        → Separate schema per tenant (schema-per-tenant strategy)
                        → Add subscription/billing module
                        → Desktop sync: push SQLite batches to REST API via sync_log table
Phase 4 (Scale)      → Add Redis cache for product catalog
                        → Read replicas for reports
                        → Event-driven stock updates via Kafka
```

---

## 11. TECH DECISION RATIONALE

| Decision                    | Rationale                                              |
|----------------------------|--------------------------------------------------------|
| Spring Boot + PostgreSQL    | Battle-tested, strong ecosystem, excellent JPA support |
| JWT (not sessions)          | Stateless → horizontally scalable from day one         |
| React + Zustand             | Lightweight state, no Redux boilerplate                |
| TanStack Query              | Smart caching + background refetch for fresh data      |
| JavaFX + SQLite             | Native Java UI, zero external DB dependency for desktop|
| WAL mode (SQLite)           | Better concurrent reads while writing                  |
| Soft deletes everywhere     | Preserves history for audit + reporting integrity      |
| Product name snapshot       | sale_items stores name at time of sale (price history) |

---

*Masterpiece-POS v1.0 — Designed for real retail businesses, built to grow.*
