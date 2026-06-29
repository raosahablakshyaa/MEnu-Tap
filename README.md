# TapMenu — Restaurant Operating System (Phase 7)

TapMenu is a production-ready, multi-tenant SaaS platform for restaurants. Phase 7 adds **AI Business Intelligence, Inventory ERP, Multi-Branch, POS & Enterprise Finance**.

## What's New in Phase 7

- **AI Business Advisor** — Daily AI reports with insights, recommendations, and sales forecasting
- **Executive Dashboard** — Real-time KPIs: revenue, profit, margin, growth scores
- **Inventory ERP** — Ingredients, stock movements, valuation, low-stock alerts, auto-consumption
- **Recipe & Cost Management** — Map ingredients to menu items, auto profit margin calculation
- **Supplier Management** — Supplier profiles, ratings, outstanding balance tracking
- **Purchase Orders** — Full PO lifecycle: draft → sent → confirmed → partial → received
- **Expense Management** — Category-wise expense tracking with GST support
- **Staff Attendance** — Daily attendance marking, check-in/out, working hours, overtime
- **POS System** — Walk-in billing, GST calculation (CGST/SGST/IGST), split payment, void
- **GST Invoicing** — Auto-generate GST invoices from POS transactions
- **Multi-Branch Management** — Unlimited branches, comparison analytics, HQ dashboard
- **Sales Forecasting** — 7-day revenue forecast with confidence levels

## Phase 7 API Endpoints

All endpoints require `Authorization: Bearer <token>` + approved restaurant.

| Module | Base Path |
|--------|-----------|
| Inventory | `/api/v1/owner/inventory` |
| Recipes | `/api/v1/owner/recipes` |
| Suppliers | `/api/v1/owner/suppliers` |
| Purchase Orders | `/api/v1/owner/purchase-orders` |
| Expenses | `/api/v1/owner/expenses` |
| Branches | `/api/v1/owner/branches` |
| Attendance | `/api/v1/owner/attendance` |
| POS | `/api/v1/owner/pos` |
| AI Reports | `/api/v1/owner/ai` |

### Key AI endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/owner/ai/executive-dashboard` | Real-time KPIs + AI scores |
| GET | `/api/v1/owner/ai/forecast` | 7-day sales forecast |
| GET | `/api/v1/owner/ai/reports/latest` | Latest AI report |
| POST | `/api/v1/owner/ai/reports/generate` | Generate AI report on demand |

### Key Inventory endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/owner/inventory` | List ingredients |
| GET | `/api/v1/owner/inventory/alerts/low-stock` | Low stock alerts |
| GET | `/api/v1/owner/inventory/valuation` | Inventory valuation by category |
| POST | `/api/v1/owner/inventory/:id/adjust` | Adjust stock (purchase/waste/transfer) |
| GET | `/api/v1/owner/inventory/movements` | Full stock movement ledger |
| PUT | `/api/v1/owner/recipes/:menuItemId` | Map ingredients to menu item |
| GET | `/api/v1/owner/recipes/profit-analysis` | Profit margin per dish |

### Key POS endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/owner/pos/bill` | Create bill with GST |
| GET | `/api/v1/owner/pos/daily-summary` | Daily sales by payment method |
| POST | `/api/v1/owner/pos/:id/gst-invoice` | Generate GST invoice |
| PATCH | `/api/v1/owner/pos/:id/void` | Void a bill |

## MongoDB Collections (Phase 7)

| Collection | Purpose |
|------------|---------|
| Ingredient | Raw materials with stock levels and costs |
| Recipe | Ingredient-to-menu-item mappings |
| Supplier | Supplier profiles and analytics |
| PurchaseOrder | Procurement orders with GRN flow |
| StockMovement | Complete inventory ledger |
| Expense | Operating expenses by category |
| Branch | Multi-branch configuration |
| StaffAttendance | Daily attendance and working hours |
| PosTransaction | POS bills and payments |
| GstInvoice | GST-compliant tax invoices |
| AIReport | AI-generated business intelligence reports |

## Phase 7 Frontend Pages

| Page | URL |
|------|-----|
| Executive Dashboard | `/owner/executive` |
| AI Business Advisor | `/owner/ai-advisor` |
| Inventory | `/owner/inventory` |
| Recipes & Profit | `/owner/recipes` |
| Suppliers | `/owner/suppliers` |
| Purchase Orders | `/owner/purchase-orders` |
| Expenses | `/owner/expenses` |
| Branches | `/owner/branches` |
| Attendance | `/owner/attendance` |
| POS | `/owner/pos` |

## AI Business Advisor

The AI generates daily reports automatically at 6 AM for all active restaurants. Reports include:

- Revenue trend vs yesterday with % change
- Top and least-selling items this week
- Low stock ingredient alerts
- Peak hour identification
- Customer growth (new vs repeat)
- Actionable recommendations (priority: high / medium / low)
- Business health scores (0-100) for: Revenue, Operations, Customers, Inventory, Kitchen

Generate on demand:
```bash
POST /api/v1/owner/ai/reports/generate
Authorization: Bearer <token>
```

## Inventory Auto-Consumption

When an order status changes to `completed`, the system automatically deducts ingredients based on the recipe mapping. No manual stock adjustment needed.

To map ingredients to a menu item:
```json
PUT /api/v1/owner/recipes/:menuItemId
{
  "menuItemName": "Burger",
  "ingredients": [
    { "ingredientId": "<id>", "ingredientName": "Bun", "quantity": 1, "unit": "pcs", "wastagePercent": 5, "grossQuantity": 1.05 },
    { "ingredientId": "<id>", "ingredientName": "Patty", "quantity": 1, "unit": "pcs", "wastagePercent": 0, "grossQuantity": 1 }
  ]
}
```

## What's New in Phase 3–6

See previous README sections for Phase 1–6 features including:
- Multi-step restaurant onboarding (Phase 3)
- Super Admin dashboard, subscription management (Phase 2)
- Menu, orders, kitchen display, QR ordering (Phase 4–5)
- CRM, loyalty, campaigns, marketing (Phase 6)

## Quick Start

```bash
# 1. Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 2. Start MongoDB + Redis
docker run -d --name tapmenu-mongo -p 27017:27017 mongo:7
docker run -d --name tapmenu-redis -p 6379:6379 redis:7-alpine

# 3. Seed database
cd server && npm install && npm run seed

# 4. Start backend (port 5001)
npm run dev

# 5. Start frontend (port 3000)
cd ../client && npm install && npm run dev

# 6. Open owner panel
open http://localhost:3000/owner
```

## Environment Variables (Phase 7)

No new required environment variables. All Phase 7 features work with the existing `.env`.

**Optional for full functionality:**
```env
RAZORPAY_KEY_ID=rzp_test_...       # For POS payments
CLOUDINARY_CLOUD_NAME=...           # For attachment uploads
REDIS_URL=redis://localhost:6379    # For token blacklisting
```

## Docker

```bash
cp .env.example .env
docker-compose up --build
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB Atlas / MongoDB, Mongoose |
| Auth | JWT (access + refresh), bcrypt |
| Realtime | Socket.IO |
| Cache | Redis (optional) |
| Payments | Razorpay |
| Storage | Cloudinary |
| Deployment | Docker |

## Project Structure (Phase 7)

```
tapmenu/
├── client/src/app/owner/
│   ├── executive/          # Executive Dashboard
│   ├── ai-advisor/         # AI Business Advisor
│   ├── inventory/          # Inventory Management
│   ├── recipes/            # Recipe & Profit Analysis
│   ├── suppliers/          # Supplier Management
│   ├── purchase-orders/    # Purchase Order Management
│   ├── expenses/           # Expense Tracking
│   ├── branches/           # Multi-Branch Management
│   ├── attendance/         # Staff Attendance
│   └── pos/                # Point of Sale
├── server/src/
│   ├── models/
│   │   ├── ingredient.model.ts
│   │   ├── recipe.model.ts
│   │   ├── supplier.model.ts
│   │   ├── purchaseOrder.model.ts
│   │   ├── stockMovement.model.ts
│   │   ├── expense.model.ts
│   │   ├── branch.model.ts
│   │   ├── staffAttendance.model.ts
│   │   ├── posTransaction.model.ts
│   │   ├── gstInvoice.model.ts
│   │   └── aiReport.model.ts
│   ├── services/
│   │   ├── inventory.service.ts
│   │   ├── recipe.service.ts
│   │   ├── supplier.service.ts
│   │   ├── purchaseOrder.service.ts
│   │   ├── expense.service.ts
│   │   ├── branch.service.ts
│   │   ├── attendance.service.ts
│   │   ├── pos.service.ts
│   │   └── ai.service.ts
│   └── routes/owner/
│       ├── inventory.routes.ts
│       ├── recipes.routes.ts
│       ├── suppliers.routes.ts
│       ├── purchaseOrders.routes.ts
│       ├── expenses.routes.ts
│       ├── branches.routes.ts
│       ├── attendance.routes.ts
│       ├── pos.routes.ts
│       └── ai.routes.ts
```

## Phase 8 Roadmap

- WhatsApp & SMS notifications
- Tally / Zoho Books integration
- Swiggy / Zomato / ONDC aggregator sync
- Mobile apps (React Native)
- Advanced kitchen display system
- Customer-facing web app
- Franchise management

## License

Proprietary — TapMenu Restaurant OS
# MEnu-Tap
