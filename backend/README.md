# RetailPOS — Spring Boot Backend

Production-grade REST API for the RetailPOS system. Built with Spring Boot 3, Java 17, PostgreSQL, and JWT authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.3 |
| Language | Java 17 |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| Security | Spring Security + JWT (jjwt) |
| ORM | Spring Data JPA / Hibernate |
| Validation | Jakarta Bean Validation |
| PDF | iText 5 (receipts) |
| Testing | JUnit 5 + Testcontainers (real Postgres in tests) |
| Build | Maven |

---

## Why PostgreSQL

Chosen over MySQL/H2 for: strict transactional isolation (critical for concurrent inventory decrements), native support for `NUMERIC` precision on money fields, and first-class Spring Boot + Flyway support. See the schema in `db/migration/V1__initial_schema.sql`.

---

## Quick Start

### 1. Start PostgreSQL

```bash
# Using Docker
docker run --name retailpos-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=retailpos_db -p 5432:5432 -d postgres:16-alpine
```

Or install PostgreSQL locally and run:
```bash
createdb retailpos_db
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DB credentials and a real JWT_SECRET for production
```

### 3. Run

```bash
mvn spring-boot:run
```

Flyway runs migrations automatically on startup. The API is live at **http://localhost:8080**

Default login: `admin` / `Admin@1234`

---

## Project Structure

```
src/main/java/com/pos/
├── PosApplication.java
├── config/              ← SecurityConfig, JwtProperties, AppProperties
├── security/             ← JwtService, JwtAuthFilter, UserDetailsServiceImpl
├── entity/                ← JPA entities (User, Product, Sale, Inventory, ...)
├── repository/            ← Spring Data JPA repositories
├── service/               ← Business logic (SaleService is the core transaction)
├── controller/            ← REST controllers
├── dto/
│   ├── request/            ← Validated inbound DTOs
│   └── response/           ← Outbound DTOs
├── mapper/                ← Entity ↔ DTO mapping
└── exception/              ← Custom exceptions + GlobalExceptionHandler

src/main/resources/
├── application.yml
├── application-test.yml
├── logback-spring.xml
└── db/migration/
    ├── V1__initial_schema.sql
    └── V2__seed_defaults.sql
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |

### Products
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/products` | Authenticated |
| GET | `/api/products/search?q=` | Authenticated |
| GET | `/api/products/barcode/{barcode}` | Authenticated |
| GET | `/api/products/low-stock` | Authenticated |
| GET | `/api/products/{id}` | Authenticated |
| POST | `/api/products` | Authenticated |
| PUT | `/api/products/{id}` | Authenticated |
| DELETE | `/api/products/{id}` | Manager+ |

### Categories
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/categories` | Authenticated |
| POST | `/api/categories` | Authenticated |
| PUT | `/api/categories/{id}` | Authenticated |

### Inventory
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/inventory/adjust` | Authenticated |

### Sales
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/sales` | Authenticated |
| GET | `/api/sales` | Authenticated |
| GET | `/api/sales/today` | Authenticated |
| GET | `/api/sales/range?from=&to=` | Authenticated |
| GET | `/api/sales/{id}` | Authenticated |
| GET | `/api/sales/{id}/receipt` | Authenticated (PDF download) |
| POST | `/api/sales/{id}/void` | Authenticated |

### Reports
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/reports/daily?date=` | Manager+ |
| GET | `/api/reports/weekly?weekStart=` | Manager+ |
| GET | `/api/reports/custom?from=&to=` | Manager+ |

### Users
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users` | Authenticated |
| GET | `/api/users/{id}` | Authenticated |
| POST | `/api/users` | Admin only |
| PUT | `/api/users/{id}` | Authenticated |
| DELETE | `/api/users/{id}` | Admin only |
| POST | `/api/users/{id}/change-password` | Authenticated |

### Roles
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/roles` | Authenticated |

---

## Authentication

All endpoints except `/api/auth/login` and `/actuator/health` require a JWT bearer token:

```
Authorization: Bearer <token>
```

Tokens are obtained from `/api/auth/login` and expire after 24 hours by default (`JWT_EXPIRY_MS`).

---

## Concurrency Safety

The sale checkout flow (`SaleService.completeSale`) handles concurrent cashiers correctly:

1. Stock sufficiency is checked in Java first (fast-fail UX)
2. The actual decrement uses a SQL-level guarded update:
   ```sql
   UPDATE inventory SET quantity = quantity - :qty
   WHERE product_id = :productId AND quantity >= :qty
   ```
3. If two cashiers race for the last unit, only one `UPDATE` succeeds (`rowsAffected = 1`); the other gets `rowsAffected = 0` and the transaction throws `InsufficientStockException`, rolling back the entire sale.

This relies on PostgreSQL's row-level locking and works correctly under `READ COMMITTED` isolation (the default).

---

## Running Tests

```bash
mvn test
```

Tests use **Testcontainers** to spin up a real PostgreSQL container — no mocking the database, no H2 dialect drift. Requires Docker running locally.

Test coverage:
- `SaleServiceTest` — full checkout flow, inventory decrement, insufficient stock/payment, M-PESA validation
- `ProductServiceTest` — CRUD, duplicate barcode rejection, stock adjustment bounds
- `AuthControllerTest` / `ProductControllerTest` — `@WebMvcTest` slice tests for HTTP layer

---

## Building for Production

```bash
mvn clean package -DskipTests
java -jar target/pos-backend-1.0.0.jar
```

Or with Docker:

```dockerfile
FROM eclipse-temurin:17-jre-alpine
COPY target/pos-backend-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

---

## Deployment Notes

- Set `JWT_SECRET` to a long random value in production — never use the default.
- Set `spring.jpa.hibernate.ddl-auto=validate` (already default) — Flyway, not Hibernate, owns schema changes.
- For free PostgreSQL hosting: [Supabase](https://supabase.com), [Railway](https://railway.app), or [Render](https://render.com).
- Receipts are saved to the local filesystem (`RECEIPTS_DIR`) — mount a persistent volume in containerized deployments.

---

## Roadmap

- [ ] M-PESA STK Push direct integration (Daraja API)
- [ ] Multi-branch / multi-tenant support
- [ ] WebSocket live inventory updates
- [ ] Scheduled DB backups
- [ ] Rate limiting on `/api/auth/login`

---

*Built for RetailPOS — Kenyan retail context: KES currency, 16% VAT, M-PESA payments*
