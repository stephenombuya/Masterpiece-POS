# MasterpiecePOS — Web Frontend

Production-grade React + TypeScript + Tailwind CSS POS frontend.  
Connects to the Spring Boot backend via REST API with JWT authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Forms | React Hook Form |
| HTTP | Axios (with JWT interceptors) |
| Charts | Recharts |
| Notifications | React Hot Toast |
| Build | Vite |

---

## Quick Start

```bash
npm install
npm run dev
```

App runs at **http://localhost:3000**  
Backend proxy target: **http://localhost:8080**

Default login: `admin` / `Admin@1234`

---

## Project Structure

```
src/
├── types/          ← All TypeScript domain types
├── utils/          ← formatCurrency, formatDate, cn(), etc.
├── services/       ← Axios API calls per domain
│   ├── api.ts      ← Base Axios instance + JWT interceptors
│   ├── authService.ts
│   ├── productService.ts
│   ├── saleService.ts
│   ├── reportService.ts
│   └── userService.ts
├── context/
│   ├── AuthContext.tsx   ← Login state, role helpers
│   └── CartContext.tsx   ← Cart state with tax calculation
├── hooks/          ← Data-fetching hooks per domain
├── components/
│   ├── ui/         ← Button, Input, Select, Card, Modal, Table, Badge, etc.
│   └── layout/     ← AppLayout (sidebar + topbar shell)
├── routes/
│   ├── AppRouter.tsx  ← All routes
│   └── Guards.tsx     ← RequireAuth, RequireManager, RedirectIfAuth
└── pages/
    ├── LoginPage.tsx
    ├── SalePage.tsx       ← Checkout with barcode scan, cart, M-PESA
    ├── ProductsPage.tsx   ← Full CRUD with modal form
    ├── InventoryPage.tsx  ← Stock levels + adjust modal
    ├── ReportsPage.tsx    ← Charts + tables with date range filter
    └── UsersPage.tsx      ← User management (admin/manager only)
```

---

## API Proxy

In development, Vite proxies `/api/*` to `http://localhost:8080`.  
Change the target in `vite.config.ts` if your backend runs on a different port.

For production, configure your web server (Nginx/Apache) to proxy `/api` to the backend.

---

## Building for Production

```bash
npm run build
# Output in /dist — serve with any static host or Nginx
```

### Sample Nginx config

```nginx
server {
    listen 80;
    root /var/www/pos/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=/api
VITE_APP_NAME=MasterpiecePOS
```

---

## Features

| Feature | Details |
|---|---|
| **Auth** | JWT login, role-based route guards (Admin / Manager / Cashier) |
| **Sale / Checkout** | Product grid, barcode scan (Enter key), cart with qty controls, CASH/M-PESA/CARD payment, change calculation, success modal |
| **Products** | Search, full CRUD modal, low-stock badge, category filter |
| **Inventory** | Stock table with low-stock highlight, add/remove adjustment modal with audit reason |
| **Reports** | Today/Week/Month/Custom range, stat cards, Line + Bar charts (Recharts), top products table, daily breakdown |
| **Users** | User table with roles, create/edit modal, deactivate with confirm dialog (manager+ only) |

---

*Built for MasterpiecePOS — Kenyan retail context: KES currency, 16% VAT, M-PESA payment*
