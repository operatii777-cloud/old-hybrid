import { useState } from "react";

const sections = [
  {
    id: "project-identity",
    emoji: "🧬",
    title: "PROJECT IDENTITY",
    color: "#FF6B35",
    content: `You are a world-class senior software architect specializing in enterprise HORECA platforms. Your task is to build the most complete, scalable, production-ready, white-label, multi-tenant restaurant management platform ever created — surpassing Freya, Boogit, Toast POS, Lightspeed, Deliverect, SevenRooms, and McDonald's internal systems combined.

This platform must work as:
- A cloud-hosted SaaS (multi-tenant, schema-per-tenant isolation)
- A fully offline-capable PWA (IndexedDB + Service Workers + sync queue)
- A white-label product (fully brandable per tenant: logo, colors, fonts, domain)
- A mobile app (React Native, iOS + Android)

Every module must be production-grade: no placeholders, no TODOs, no mock data in final output.`
  },
  {
    id: "tech-stack",
    emoji: "⚙️",
    title: "TECH STACK (MANDATORY)",
    color: "#4ECDC4",
    content: `FRONTEND (Web):
├── React 18+ with TypeScript (strict mode)
├── Vite (build tool)
├── Tailwind CSS (styling)
├── Zustand (global state management)
├── AG Grid Enterprise (all data tables — sorting, filtering, grouping, Excel export)
├── React Query / TanStack Query (server state)
├── React Hook Form + Zod (forms + validation)
├── Recharts / D3.js (charts and analytics)
├── Socket.io-client (real-time)
├── i18next + react-i18next (RO + EN, extensible)
├── Framer Motion (animations)
└── Workbox (Service Workers, offline)

BACKEND:
├── Node.js 20+ with TypeScript
├── Fastify (HTTP server — faster than Express)
├── Prisma ORM (PostgreSQL)
├── PostgreSQL 16 (main DB, schema-per-tenant)
├── Redis 7 (cache + pub/sub + queues)
├── Bull / BullMQ (job queues — order processing, notifications)
├── Socket.io (WebSockets real-time)
├── Zod (validation)
├── Winston (logging)
└── Swagger / OpenAPI 3.0 (auto-generated docs)

MOBILE:
├── React Native (Expo SDK 50+)
├── React Navigation
└── Expo Notifications + Camera + Location + SecureStore

INFRASTRUCTURE:
├── Docker + Docker Compose (dev)
├── Kubernetes + Helm (production)
├── GitHub Actions (CI/CD)
├── Terraform (IaC)
├── Cloudflare (CDN + WAF + R2 storage)
├── AWS RDS PostgreSQL / Supabase
├── Redis Cloud / Upstash
├── Sentry (error tracking)
└── Grafana + Prometheus + Loki (monitoring)

REPOSITORY STRUCTURE: Turborepo monorepo`
  },
  {
    id: "monorepo",
    emoji: "🗂️",
    title: "MONOREPO STRUCTURE",
    color: "#A78BFA",
    content: `/apps
  /web-admin          → Admin + Supervisor + Waiter (React + Vite)
  /web-pos            → POS touchscreen optimized (React + Vite)
  /web-kds            → Kitchen & Bar Display System (React + Vite)
  /web-kiosk          → Self-service kiosk fullscreen (React + Vite)
  /web-tv-menu        → TV digital menu display (React + Vite)
  /web-ordering       → QR + Online ordering (React + Vite)
  /web-queue-monitor  → Order queue display (React + Vite)
  /mobile-waiter      → Waiter + Supervisor app (React Native)
  /mobile-courier     → Courier delivery app (React Native)

/packages
  /api                → Fastify API server
  /db                 → Prisma schema + migrations + seed
  /shared             → Shared TypeScript types, utils, constants
  /ui                 → Shared component library (design system)
  /queue              → BullMQ workers (orders, notifications, sync)
  /notifications      → Email + SMS + Push + WhatsApp + VoiceIP
  /fiscal             → ANAF + SAGA + fiscal printers
  /ai                 → OpenAI integration + ML helpers
  /delivery           → GLOVO + BOLT + WOLT + TAZZ adapters

/infra
  /docker             → Dockerfiles per app
  /k8s                → Kubernetes manifests + Helm charts
  /terraform          → Cloud infrastructure as code
  /scripts            → DB migrations, seed, backup scripts`
  },
  {
    id: "database",
    emoji: "🗃️",
    title: "DATABASE SCHEMA (PRISMA — COMPLETE)",
    color: "#F59E0B",
    content: `Build the complete Prisma schema with ALL the following models (with proper relations, indexes, and constraints):

TENANT & AUTH:
- Tenant (id, name, slug, domain, logoUrl, colors, plan, settings, createdAt)
- User (id, tenantId, email, passwordHash, role, name, pin, isActive, 2faSecret)
- Role (SUPER_ADMIN | ADMIN | SUPERVISOR | WAITER | COURIER | KIOSK | KDS)
- AuditLog (id, tenantId, userId, action, entity, entityId, oldData, newData, ip, userAgent, createdAt)
- Session (id, userId, token, refreshToken, expiresAt, device, ip)

RESTAURANT STRUCTURE:
- Location (id, tenantId, name, address, timezone, currency, settings)
- Area (id, locationId, name, type: INDOOR|OUTDOOR|TERRACE|BAR|VIP)
- Table (id, areaId, number, seats, posX, posY, shape, status, qrCode)
- Station (id, locationId, name, type: KITCHEN|BAR|GRILL|PASTRY, printerIp)

MENU & PRODUCTS:
- Category (id, tenantId, name, nameEn, sortOrder, isActive, image)
- Product (id, tenantId, categoryId, name, nameEn, description, price, priceVip, priceDiscount, priceProtocol, vatRate, image, isActive, preparationTime, allergens[], additives[], type: FOOD|DRINK|DESSERT)
- Recipe (id, productId, yield, unit, instructions)
- RecipeIngredient (id, recipeId, ingredientId, quantity, unit, wastePercent)
- SubRecipe (id, tenantId, name, yield, unit)
- SubRecipeIngredient (id, subRecipeId, ingredientId, quantity, unit)
- Allergen (id, name, nameEn, code, icon) — 14 EU allergens
- Additive (id, eCode, name, description) — E-number additives
- ProductAllergen, ProductAdditive (join tables — auto-calculated from recipe)

INVENTORY & STOCK:
- Warehouse (id, locationId, name, type: MAIN|BAR|KITCHEN|EXTERNAL)
- Ingredient (id, tenantId, code, name, unit, category, minStock, currentStock, expiryAlert, costPrice, allergens[], additives[])
- StockMovement (id, warehouseId, ingredientId, type: NIR|CONSUMPTION|TRANSFER|RETURN|INVENTORY|WASTE, quantity, unit, reason, documentRef, userId, createdAt)
- NIR (id, tenantId, warehouseId, supplierId, number, date, totalValue, status, items[])
- NIRItem (id, nirId, ingredientId, quantity, unitPrice, totalPrice, lotNumber, expiryDate)
- InventorySession (id, warehouseId, userId, status, startedAt, closedAt)
- InventoryItem (id, sessionId, ingredientId, scriptQty, countedQty, difference)
- Transfer (id, fromWarehouseId, toWarehouseId, userId, status, items[], approvedById)
- Supplier (id, tenantId, name, code, address, email, phone, vatNumber, contractTerms)
- SupplierProduct (id, supplierId, ingredientId, supplierCode, price, minOrderQty, leadDays)
- LotTracking (id, ingredientId, lotNumber, expiryDate, quantity, nirId) — FIFO/LIFO

ORDERS:
- Order (id, tenantId, locationId, tableId, type: DINE_IN|TAKEAWAY|DELIVERY|DRIVE_THRU, status, source: POS|WAITER|KIOSK|QR|ONLINE|GLOVO|BOLT|WOLT, waiterId, courierId, customerId, priceType: NORMAL|DISCOUNT|VIP|PROTOCOL, subtotal, discountAmount, vatAmount, total, notes, scheduledAt, createdAt)
- OrderItem (id, orderId, productId, quantity, unitPrice, totalPrice, notes, status: PENDING|SENT_TO_KDS|PREPARING|READY|SERVED|CANCELLED, kdsStation, sentAt, readyAt)
- OrderItemModifier (id, orderItemId, name, price)
- Bill (id, orderId, number, subtotal, vat, total, paidAmount, change, status, splitGroup)
- Payment (id, billId, method: CASH|CARD|VOUCHER|QR_PAY|ROOM_CHARGE, amount, reference, terminalId, status)
- Void (id, orderItemId, userId, supervisorId, reason, amount, approvedAt) — anulare cu aprobare supervisor

DELIVERY:
- DeliveryOrder (id, orderId, platform: INTERNAL|GLOVO|BOLT|WOLT|TAZZ, externalId, customerId, address, lat, lng, estimatedTime, actualTime, courierId, status, trackingCode)
- Courier (id, userId, vehicleType, licensePlate, isAvailable, currentLat, currentLng, earnings)
- DispatchZone (id, locationId, name, polygon, deliveryFee, minOrder, estimatedMinutes)

CUSTOMERS & CRM:
- Customer (id, tenantId, name, email, phone, allergens[], preferences, loyaltyPoints, tier: BRONZE|SILVER|GOLD|VIP, totalOrders, totalSpent, lastVisit, gdprConsent, birthDate)
- LoyaltyTransaction (id, customerId, type: EARN|REDEEM|EXPIRE, points, orderId, description)
- Voucher (id, tenantId, code, type: PERCENT|FIXED|FREE_ITEM, value, minOrder, maxUses, usedCount, validFrom, validTo, isActive)

RESERVATIONS:
- Reservation (id, tenantId, locationId, customerId, tableId, date, time, duration, partySize, status: NEW|CONFIRMED|CHECKED_IN|COMPLETED|CANCELLED|NO_SHOW, channel: WEB|APP|PHONE|WALK_IN|EMAIL, notes, confirmationCode, reminderSent)

FISCAL & ACCOUNTING:
- FiscalDocument (id, tenantId, type: RECEIPT|INVOICE|PROFORMA|NIR|CONSUMPTION|TRANSFER|RETURN|INVENTORY_REPORT, number, series, date, totalNet, totalVat, totalGross, status, anafStatus, xmlContent, pdfUrl, orderId, customerId)
- CashRegister (id, locationId, name, serialNumber, fiscalCode, brand: DATECS|EPSON|STAR|SUNMI)
- DaySession (id, locationId, registerId, openedAt, closedAt, openingCash, closingCash, totalCash, totalCard, totalVoucher, zReportNumber, openedById, closedById)
- SagaExport (id, tenantId, period, status, fileUrl, createdAt)

NOTIFICATIONS & MESSAGING:
- Message (id, tenantId, senderId, channel: GENERAL|KITCHEN|BAR|DELIVERY|MANAGEMENT, content, attachments[], readBy[], createdAt)
- Notification (id, userId, type, title, body, data, isRead, createdAt)

HACCP & COMPLIANCE:
- HACCPRecord (id, locationId, type: TEMPERATURE|CLEANING|PEST_CONTROL|DELIVERY_CHECK, value, unit, station, userId, recordedAt, status: OK|WARNING|CRITICAL, notes)
- HACCPAlert (id, recordId, severity, resolvedAt, resolvedById)

STAFF:
- Shift (id, userId, locationId, startTime, endTime, role, breakMinutes)
- ClockEntry (id, userId, type: CLOCK_IN|BREAK_START|BREAK_END|CLOCK_OUT, timestamp, locationId, approvedById)

All models must include: proper foreign keys, cascade rules, @index for frequently queried fields, soft delete (deletedAt) where appropriate, and multi-tenant isolation via tenantId.`
  },
  {
    id: "ordering-channels",
    emoji: "📱",
    title: "ORDERING CHANNELS (ALL)",
    color: "#10B981",
    content: `Implement ALL ordering channels with unified Order model:

1. QR CODE ORDERING
   - Generate unique QR per table (embedded table + location + tenant info)
   - Customer scans → opens web app → browses menu → orders without account
   - Real-time order tracking via WebSocket
   - Supports: add items, split bill request, call waiter, pay online

2. ONLINE WEBSITE ORDERING
   - Embeddable widget OR standalone site
   - Pickup time slot selection
   - Address input with Google Maps autocomplete + delivery fee calculation
   - Guest checkout + account registration
   - Proof of order PDF sent via email/SMS with QR tracking code (McDonald's style)

3. MOBILE APP ORDERING (React Native)
   - Full menu browsing with search + filters + allergen filter
   - Saved addresses, saved payment methods
   - Loyalty points display + redemption
   - Order history + reorder
   - Real-time tracking map for delivery

4. TABLET WAITER ORDERING
   - Optimized for 10" tablet, landscape orientation
   - Table plan view → tap table → manage order
   - Course management (starters, mains, desserts sent separately)
   - Product search + category browsing
   - Add notes per item, per order
   - POP-UP notification when KDS marks items as READY (with sound)

5. POS ORDERING
   - Fullscreen touchscreen optimized
   - Numeric keypad for quantity
   - Barcode scanner support (USB/Bluetooth HID)
   - Quick product buttons (configurable per tenant)
   - Cash drawer trigger on payment
   - Thermal receipt printer integration (ESC/POS protocol)
   - Keyboard shortcuts for speed

6. KIOSK ORDERING
   - Fullscreen self-service mode
   - Large product images + descriptions + allergen badges
   - Upsell suggestions ("Add a drink?")
   - Integrated card payment terminal
   - Print receipt + display order number
   - Idle screen with promotional content
   - Accessibility: font size controls, high contrast mode

7. DRIVE-THRU
   - Fast order entry interface
   - Queue display (car count)
   - Timer per car
   - Integration with outdoor display board
   - Payment at window confirmation

8. THIRD-PARTY AGGREGATORS
   - GLOVO: webhook receiver + menu sync + order status updates
   - BOLT FOOD: same pattern
   - WOLT: same pattern
   - TAZZ: same pattern
   - All converted to internal Order model automatically
   - Tablet display for aggregator orders (with accept/reject + timer)
   - Menu availability sync (mark item as unavailable on all platforms simultaneously)`
  },
  {
    id: "kds",
    emoji: "🍳",
    title: "KDS — KITCHEN & BAR DISPLAY (HIGH-END)",
    color: "#EF4444",
    content: `Build a world-class Kitchen Display System:

LAYOUT:
- Fullscreen grid of order cards
- Configurable columns (2, 3, 4, 6 cards per row)
- Each card shows: order number, table/platform, items, time elapsed, timer
- Filter by station (e.g., bar sees only drinks, grill sees only grill items)

COLOR CODING (real-time, auto-updating):
- 🟢 Green: 0–5 minutes (fresh order)
- 🟡 Yellow: 5–12 minutes (approaching target)
- 🔴 Red + pulse animation: 12+ minutes (LATE — needs attention)
- ⚫ Grey: completed / bumped

PRODUCT AGGREGATION:
- Group identical items across multiple orders within configurable time window (e.g., "3x Burger" from 3 tables shown together)
- Toggleable aggregation mode

ACTIONS:
- Tap item → mark as READY (individual item)
- Tap card → mark entire order as READY → triggers POP-UP on waiter tablet
- Bump order (complete + archive)
- Recall last bumped order
- Priority flag (supervisor can escalate)

NOTIFICATIONS:
- Sound: configurable per event (new order, ready, late)
- Different sounds per source (Glovo vs dine-in)
- Visual flash on new order arrival
- No-touch mode: auto-bump after N minutes (configurable)

STATISTICS PANEL (collapsible):
- Average prep time per product (live)
- Orders completed this hour / today
- Late orders count

WAITER NOTIFICATION:
- When "READY" is marked in KDS → WebSocket push → POP-UP appears on all waiter tablets assigned to that table
- POP-UP shows: table number, items ready, sound alert
- Waiter must acknowledge (dismiss) the pop-up
- If not acknowledged in 2 min → escalate to supervisor`
  },
  {
    id: "delivery-dispatch",
    emoji: "🚗",
    title: "DELIVERY + DISPATCH + COURIER APP",
    color: "#6366F1",
    content: `DISPATCH DASHBOARD (web):
- Live map with all couriers (Google Maps / Mapbox)
- All pending delivery orders in queue
- Auto-assign: nearest available courier algorithm
- Manual override: drag order to courier
- ETA calculation based on distance + traffic API
- Order status timeline: Placed → Confirmed → Preparing → Ready → Picked Up → Delivered
- Customer tracking link (SMS sent automatically): live map page
- Zone management: draw delivery zones on map with fee and min order

COURIER MOBILE APP (React Native):
- Login + biometric unlock
- Status toggle: AVAILABLE / BUSY / OFFLINE
- Incoming order notification with: restaurant address, customer address, total, estimated earnings
- Accept / Reject with timer (30s auto-reject)
- Navigation: Google Maps / Waze deep-link OR in-app navigation
- Multi-stop route optimization (if multiple deliveries)
- Geofencing: auto check-in at restaurant, auto confirm delivery at customer
- Proof of delivery: photo capture + optional customer signature
- Cash collection: track cash received vs expected, end-of-day balance
- Offline: queue actions locally, sync when connection restored
- Earnings dashboard: per trip, per day, per week, total

CUSTOMER EXPERIENCE:
- SMS with tracking link immediately after order confirmed
- Live map page (no app needed) showing courier location
- Estimated arrival time (updating live)
- Delivery confirmation with PDF receipt (McDonald's style proof of order)`
  },
  {
    id: "fiscal",
    emoji: "🧾",
    title: "FISCAL & ACCOUNTING INTEGRATION",
    color: "#F97316",
    content: `DOCUMENTS (all generated as PDF + stored in cloud):
- BON FISCAL: ESC/POS format for all major brands (Datecs DP-150, WP-500, Epson TM-T88, Star TSP, Sunmi T2)
- FACTURĂ FISCALĂ: series/number auto-increment, ANAF e-Invoice XML (RO e-Factura format)
- FACTURĂ PROFORMĂ: for events and corporate clients
- NIR (Notă de Intrare-Recepție): full document with supplier, warehouse, items, prices
- BON DE CONSUM: internal consumption from stock
- TRANSFER GESTIUNI: inter-warehouse with approval workflow
- RETUR FURNIZOR: with reference to original NIR
- AVIZ DE ÎNSOȚIRE: transport document
- INVENTAR: stock count with differences (scriptic vs faptic)
- RAPORT Z: end-of-day fiscal report
- RAPORT X: intraday report without closing
- DECLARAȚIE ALERGENI: per order or full menu
- FIȘĂ TEHNOLOGICĂ: recipe card with costs

ANAF INTEGRATION:
- e-Factura API: auto-submit XML invoices
- e-Transport: auto-generate for deliveries above threshold
- OAuth 2.0 authentication with ANAF
- Retry mechanism for failed submissions
- Status tracking (submitted, validated, rejected with error details)
- Dashboard ANAF sync status

SAGA EXPORT:
- Generate .csv files compatible with SAGA C import
- Journals: purchases (jurnal cumpărări), sales (jurnal vânzări)
- Stock movements export
- Configurable account mappings per tenant (contul de TVA, furnizori, etc.)
- Monthly automated export + manual trigger

CASH REGISTERS (ESC/POS over TCP/IP or Serial):
- Datecs DP-150 / WP-500 / FMP-350
- Epson TM-T88 series
- Star TSP 700/800 series
- Sunmi T2 / V2 Pro
- Generic ESC/POS (auto-detect)
- Commands: open drawer, print receipt, cancel receipt, daily report Z/X`
  },
  {
    id: "inventory",
    emoji: "📦",
    title: "INVENTORY & STOCK MANAGEMENT",
    color: "#14B8A6",
    content: `INGREDIENTS (Materii Prime):
- Each ingredient has: unique auto-generated CODE (e.g., FAINA_ALBA = ING-001), name, unit, category, cost price, average weighted price, min stock level, current stock, allergens[], additives[]
- Allergens and additives AUTO-CALCULATED from ingredient → recipe → product
- All 14 EU allergens tracked: Gluten, Crustaceans, Eggs, Fish, Peanuts, Soybeans, Milk, Nuts, Celery, Mustard, Sesame, Sulphur dioxide, Lupin, Molluscs
- E-number additives tracked per ingredient

RECIPES & SUB-RECIPES:
- Recipe: product → list of ingredients with quantity + unit + waste%
- Sub-recipe: intermediate preparation (e.g., "Sos Béchamel") reusable in multiple recipes
- Auto-calculate: food cost per portion, gross profit margin
- Yield tracking: expected vs actual output
- Fișă tehnologică PDF generation

MULTI-WAREHOUSE:
- Unlimited warehouses per location (kitchen, bar, dry storage, freezer, external)
- Each movement tracked with: who, when, what, quantity, reason, document reference
- FIFO / LIFO configurable per warehouse
- Lot number + expiry date tracking per batch (trasabilitate completă)

MOVEMENTS:
- NIR → increases stock + creates document
- Production → decreases ingredients stock based on recipe (auto-calculated from orders)
- Manual consumption → with reason code
- Transfer → between warehouses (needs approval for high-value transfers)
- Return → to supplier, with original NIR reference
- Waste → tracked separately for HACCP

ALERTS:
- Stock below minimum → notification to manager + purchasing suggestion
- Product expiry within X days → configurable threshold
- Supplier price change alert
- Auto-purchase order suggestion when stock hits reorder point

INVENTORY SESSION:
- Open session → freeze script quantities → count actual → calculate differences
- Partial inventory by category or warehouse
- Multiple counters can work simultaneously (split by area)
- Supervisor approval required to confirm differences above threshold`
  },
  {
    id: "interfaces",
    emoji: "🖥️",
    title: "ALL INTERFACES (COMPLETE SPEC)",
    color: "#8B5CF6",
    content: `1. ADMIN INTERFACE
   - Full access to all modules
   - Tenant configuration: branding, integrations, pricing, taxes
   - User management + role assignment
   - Audit log viewer (filterable by user, action, date, entity)
   - All reports and exports
   - AI dashboard (predictions, insights)

2. SUPERVISOR INTERFACE
   - All waiter functions + override capabilities
   - Void/cancel with mandatory reason selection
   - Price override per order item
   - View all active orders across all tables
   - Staff performance view
   - Real-time revenue dashboard

3. WAITER INTERFACE (Web + Mobile)
   - Floor plan view with color-coded table status
   - Tap table → manage order (add items, notes, courses)
   - POP-UP notification when KDS marks order READY (sound + visual)
   - Request bill, split bill tool
   - Call for payment (terminal integration)
   - Internal chat with kitchen/bar/management

4. POS INTERFACE
   - Fullscreen, optimized for 15" touch or 24" touch
   - Quick categories + product grid
   - Customer search (CRM lookup)
   - Loyalty points display + redemption at checkout
   - Multiple payment methods in one transaction
   - Cash drawer + thermal printer control
   - Barcode scanning for products

5. KIOSK INTERFACE
   - Full-page product showcase with large images
   - Category navigation + search
   - Allergen filter (customer selects their allergens → hides incompatible items)
   - Upsell engine (AI-powered: "customers also ordered...")
   - Payment terminal integration
   - Print: receipt + queue number ticket
   - Idle screen with promotional video/images

6. KDS — KITCHEN DISPLAY
   - As specified in KDS section above
   - Dedicated per station (kitchen, bar, grill, pastry)

7. TV MENU DISPLAY
   - Digital signage for HD/4K screens
   - Rotating pages: categories, promotions, featured items
   - Real-time updates (price changes, unavailable items go grey)
   - Promotional videos support
   - QR code overlay for ordering

8. QUEUE MONITOR (Gen fast-food)
   - Large display showing order numbers being prepared / ready for pickup
   - Redis-based queue
   - Sound chime when order is ready
   - Animated transitions

9. CUSTOMER DISPLAY (at POS)
   - Shows items being added in real-time
   - Subtotal + VAT + total
   - Promotional message during idle

10. CUSTOMER MONITOR (general)
    - Promotional content, menu highlights
    - Weather widget, social media feed (optional)

11. GARDEROBA (Wardrobe)
    - Ticket system: item number, description, customer name
    - Claim ticket printing
    - End-of-shift unclaimed items report

12. LAUNDRY (for hotel integration)
    - Linen tracking per room / per department
    - In/Out register with weights
    - Billing per piece or per kg
    - Integration with hotel PMS

13. RESERVATIONS INTERFACE
    - Calendar view + floor plan view simultaneously
    - Quick-add reservation panel
    - Auto-send confirmation (email + SMS + WhatsApp)
    - Waitlist management
    - Customer history shown when making reservation
    - Reminder automation (24h + 2h before)`
  },
  {
    id: "advanced",
    emoji: "🚀",
    title: "ADVANCED SYSTEMS",
    color: "#EC4899",
    content: `QUEUE SYSTEM (Redis + BullMQ):
- Every order placed → enters Redis queue immediately (nothing is lost)
- Workers process: order routing to KDS, aggregator sync, notifications, fiscal printing
- Dead letter queue for failed jobs (with retry + alerting)
- Bull Board dashboard for monitoring queues
- Priority levels: VIP > NORMAL > DELIVERY
- Configurable concurrency per worker type

REAL-TIME ARCHITECTURE (Socket.io):
- Room per table, per location, per tenant
- Events: order:new, order:updated, kds:item_ready, kds:order_ready, stock:alert, message:new, courier:location_update, reservation:new
- Heartbeat + reconnection with state sync

OFFLINE CAPABILITY:
- Service Worker (Workbox) caches: app shell, menu, active orders
- IndexedDB stores: pending orders, menu snapshot, customer data
- Sync queue: all offline actions queued → replayed on reconnection
- Visual indicator: green dot (online) / orange dot (offline, N pending)
- Conflict resolution: timestamp-based, server wins for inventory, last-write for UI preferences

AI INTEGRATION (OpenAI API + optional local LLM):
- Smart menu suggestions based on customer history
- Stock demand forecasting (analyze sales patterns → predict next week's needs)
- Chatbot for online ordering (natural language: "I want a burger without onions")
- Automatic product descriptions in RO + EN
- Sentiment analysis on customer reviews
- Dynamic pricing suggestions (optional, supervisor approval required)
- Anomaly detection: unusual voids, unusual discounts → alert management

NOTIFICATIONS ENGINE:
- Channels: Push (FCM/APNs), SMS (Twilio), Email (SendGrid), WhatsApp (Twilio/360dialog), VoiceIP (Twilio Voice), In-app popup, Slack webhook
- All configurable per event type + per tenant + per user preference
- Template engine with variables: {customer_name}, {order_number}, {table}, {eta}
- Email template builder (drag & drop, visual)
- VoiceIP: auto-call for reservation confirmation with spoken message

CRM & LOYALTY:
- Customer profile: full order history, allergens, preferences, notes
- Loyalty tiers: Bronze (0–100pts) | Silver (101–500pts) | Gold (501–2000pts) | VIP (2000+)
- Points: earn on every purchase (configurable rate), redeem for discounts
- Digital loyalty card (Apple Wallet / Google Wallet pass)
- Birthday automation: auto-send discount on birthday
- Re-engagement: auto-send offer after 30 days of inactivity
- NPS survey: auto-send 30 min after order completion

SECURITY:
- JWT access token (15min) + Refresh token (7 days) in HttpOnly cookie
- 2FA (TOTP) mandatory for Admin and Supervisor
- Role-Based Access Control (RBAC) with granular permissions per module + action
- Audit log: every CUD operation logged with user, IP, device, old value, new value
- Rate limiting: per IP, per user, per tenant
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (DOMPurify + CSP headers)
- CORS configured per tenant domain
- Data encryption at rest (AES-256) for sensitive fields
- PCI DSS compliance for card data (tokenization, never store raw card data)
- GDPR: consent tracking, data export, right to erasure workflow

BUSINESS INTELLIGENCE:
- Sales by: hour, day, week, month, year, product, category, waiter, table, location
- Voids/cancellations: by hour, by reason, by operator (searchable, exportable)
- Food cost %: actual vs target with alerts
- Revenue per available seat hour (RevPASH)
- Customer analytics: frequency, average spend, CLV, churn risk
- Delivery analytics: avg time, by zone, by courier, by platform
- Stock analytics: waste %, turnover rate, days of supply
- All dashboards: AG Grid tables + Recharts charts + PDF/Excel export
- Real-time vs historical toggle
- Multi-location comparison (for chains)

PDF MENU BUILDER:
- Drag & drop visual builder
- Pulls products directly from database (live sync)
- Templates: Fine Dining | Casual | Fast Food | Cocktail Menu | Breakfast
- Sections: with background colors, images, dividers
- Per product: image, name (RO/EN), description, allergen icons, price
- Multi-page support
- QR code embed for digital ordering
- Export: PDF (A4, A5, folded brochure), PNG for social media

PLAN MESE (Floor Plan):
- Canvas editor (Konva.js or Fabric.js)
- Add up to 200 tables
- Table shapes: circle, square, rectangle, bar stool, booth
- Group tables: drag to combine for large parties
- Areas/sections with background colors + labels
- Save multiple layout configurations (e.g., normal vs event mode)
- Real-time status overlay: Free (green) | Occupied (red) | Reserved (blue) | Awaiting payment (orange)
- Tap table → see active order summary + customer name if reservation
- Supervisor can lock/unlock tables

MULTI-TENANT WHITE-LABEL:
- Each tenant gets: subdomain, custom domain support, logo, brand colors (primary/secondary/accent), font selection, favicon
- Wizard onboarding: 5 steps to full setup
- Tenant-level feature flags (enable/disable modules per plan)
- Super-admin panel: manage all tenants, usage metrics, billing, support tickets
- Billing integration (Stripe): subscription plans (Starter/Professional/Enterprise)
- Usage metering: orders/month, locations, users, storage`
  },
  {
    id: "implementation",
    emoji: "📋",
    title: "IMPLEMENTATION INSTRUCTIONS",
    color: "#64748B",
    content: `DEVELOPMENT PRINCIPLES (non-negotiable):
✅ TypeScript strict mode everywhere (no 'any' types)
✅ All API routes validated with Zod schemas
✅ All errors caught and logged (Winston) — no unhandled rejections
✅ Every CUD operation creates an AuditLog entry
✅ Multi-tenant isolation enforced at middleware level (tenant context injected per request)
✅ Prisma queries always include tenantId filter
✅ AG Grid used for ALL tabular data (no custom tables)
✅ All monetary values stored as integers (cents) — no floating point
✅ All dates stored as UTC, displayed in tenant's timezone
✅ OpenAPI docs auto-generated for all endpoints
✅ Unit tests for all business logic (Vitest, 80%+ coverage)
✅ E2E tests for critical flows: full order → payment → fiscal receipt (Playwright)
✅ Docker Compose for full local dev environment (PostgreSQL + Redis + all apps)
✅ Seed script with realistic Romanian restaurant demo data
✅ README per app/package with: purpose, env vars, run instructions
✅ No hardcoded values — everything in environment variables or DB config
✅ Feature flags for experimental features (never deploy broken features to tenants)
✅ Accessibility: WCAG 2.1 AA for all public interfaces (kiosk, online ordering)

BUILD ORDER (recommended sequence):
1. Prisma schema + migrations + seed data
2. API: authentication + tenant middleware + RBAC
3. Core API endpoints: products, categories, tables, orders
4. BullMQ queue workers (order processing pipeline)
5. WebSocket rooms + events (real-time layer)
6. POS interface (most critical — start here for UI)
7. KDS interface (second most critical)
8. Waiter app (web + mobile)
9. Delivery + Dispatch + Courier app
10. Fiscal integration (ANAF, printers, SAGA)
11. Inventory & NIR module
12. CRM, Loyalty, Reservations
13. Analytics dashboards (AG Grid + Recharts)
14. Aggregator integrations (GLOVO, BOLT, WOLT, TAZZ)
15. Kiosk interface
16. AI features
17. PDF Menu Builder
18. TV Menu + Queue Monitor
19. Multi-language (apply i18n to all interfaces)
20. Theme system + white-label configuration
21. CI/CD pipeline + K8s deployment
22. Performance optimization + load testing (k6)
23. Security audit + penetration testing checklist

PERFORMANCE TARGETS:
- Page load: < 1.5s (LCP)
- API response: < 200ms (p95) for read operations
- Order placement: < 500ms end-to-end
- KDS update: < 100ms (WebSocket delivery)
- Handle: 1000 concurrent users per tenant
- Support: 50,000 orders/day per location

OUTPUT QUALITY STANDARD:
Every component, every API endpoint, every worker must be production-ready.
No console.log in production code.
No unused imports.
No TODO comments without associated GitHub issue reference.
Every function must have JSDoc comment for public APIs.
This platform will serve real restaurants with real money — quality is mandatory.`
  }
];

export default function HORECAPrompt() {
  const [activeSection, setActiveSection] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandAll, setExpandAll] = useState(false);

  const fullPromptText = sections.map(s => `${"=".repeat(80)}\n${s.emoji} ${s.title}\n${"=".repeat(80)}\n\n${s.content}`).join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSections = sections.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSection = (id) => {
    if (expandAll) return;
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      background: "#0A0A0F",
      minHeight: "100vh",
      color: "#E2E8F0",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        border: "1px solid #2D3748",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.15) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#6366F1", marginBottom: "8px", fontWeight: 700 }}>
              AI CODING PROMPT — WORLD-CLASS
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
              🍽️ HORECA ULTRA PLATFORM
            </h1>
            <p style={{ color: "#94A3B8", marginTop: "8px", fontSize: "13px", maxWidth: "600px" }}>
              Prompt complet pentru Cursor, GitHub Copilot, Windsurf, Aider, Continue.dev sau orice AI editor.
              White-label · Multi-tenant · Cloud + Offline · Enterprise-grade
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {["React", "TypeScript", "Vite", "Prisma", "AG Grid", "Tailwind", "Zustand", "Node.js", "Redis", "BullMQ"].map(tech => (
                <span key={tech} style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "6px",
                  padding: "2px 10px",
                  fontSize: "11px",
                  color: "#A5B4FC",
                  fontWeight: 600,
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? "#059669" : "#6366F1",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "12px 24px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "inherit",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {copied ? "✅ COPIED!" : "📋 COPY FULL PROMPT"}
            </button>
            <button
              onClick={() => setExpandAll(!expandAll)}
              style={{
                background: "transparent",
                color: "#94A3B8",
                border: "1px solid #2D3748",
                borderRadius: "10px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "inherit",
              }}
            >
              {expandAll ? "⊖ Collapse all" : "⊕ Expand all"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "24px", marginTop: "24px", flexWrap: "wrap" }}>
          {[
            { label: "MODULES", value: "30+" },
            { label: "DB MODELS", value: "50+" },
            { label: "INTERFACES", value: "13" },
            { label: "INTEGRATIONS", value: "20+" },
            { label: "LINES OF SPEC", value: "1500+" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#6366F1" }}>{stat.value}</div>
              <div style={{ fontSize: "10px", color: "#64748B", letterSpacing: "2px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔍 Caută în prompt (ex: ANAF, KDS, Prisma...)"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            background: "#111827",
            border: "1px solid #2D3748",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#E2E8F0",
            fontSize: "13px",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* HOW TO USE */}
      <div style={{
        background: "#0F1923",
        border: "1px solid #1E3A5F",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        fontSize: "12px",
      }}>
        <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: "12px", letterSpacing: "2px" }}>
          📖 CUM SĂ FOLOSEȘTI ACEST PROMPT
        </div>
        <div style={{ color: "#94A3B8", lineHeight: 1.8 }}>
          <div><span style={{ color: "#FCD34D" }}>CURSOR:</span> Deschide Cursor Chat (Cmd+L) → cole promptul complet → adaugă: <span style={{ color: "#86EFAC" }}>"Start with the Prisma schema"</span></div>
          <div><span style={{ color: "#FCD34D" }}>GITHUB COPILOT:</span> Copilot Chat → cole prompt → <span style={{ color: "#86EFAC" }}>"@workspace implement the [MODULE NAME] module"</span></div>
          <div><span style={{ color: "#FCD34D" }}>WINDSURF/AIDER:</span> Cole prompt în fișier <span style={{ color: "#86EFAC" }}>SPEC.md</span> → referențiază-l în fiecare sesiune de chat</div>
          <div><span style={{ color: "#FCD34D" }}>BEST PRACTICE:</span> Salvează prompt-ul ca <span style={{ color: "#86EFAC" }}>SPEC.md</span> în root proiect → construiește modul cu modul în ordinea din secțiunea IMPLEMENTATION</div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredSections.map((section) => {
          const isOpen = expandAll || activeSection === section.id;
          const isHighlighted = searchTerm && (
            section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.content.toLowerCase().includes(searchTerm.toLowerCase())
          );

          return (
            <div
              key={section.id}
              style={{
                background: "#111827",
                border: `1px solid ${isOpen ? section.color + "60" : isHighlighted ? section.color + "40" : "#1F2937"}`,
                borderRadius: "12px",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  cursor: expandAll ? "default" : "pointer",
                  background: isOpen ? `linear-gradient(90deg, ${section.color}10 0%, transparent 100%)` : "transparent",
                  borderLeft: `3px solid ${section.color}`,
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>{section.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: "13px", letterSpacing: "1px", color: section.color }}>
                    {section.title}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {searchTerm && isHighlighted && (
                    <span style={{ fontSize: "10px", color: section.color, background: section.color + "20", padding: "2px 8px", borderRadius: "4px" }}>
                      MATCH
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${"=".repeat(60)}\n${section.emoji} ${section.title}\n${"=".repeat(60)}\n\n${section.content}`);
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      color: "#6B7280",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "inherit",
                    }}
                  >
                    copy
                  </button>
                  {!expandAll && (
                    <span style={{ color: "#4B5563", fontSize: "16px" }}>{isOpen ? "▲" : "▼"}</span>
                  )}
                </div>
              </div>

              {/* Section Content */}
              {isOpen && (
                <div style={{ padding: "0 20px 20px 20px" }}>
                  <pre style={{
                    background: "#0A0A0F",
                    border: "1px solid #1F2937",
                    borderRadius: "8px",
                    padding: "16px",
                    fontSize: "12px",
                    lineHeight: "1.7",
                    color: "#94A3B8",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                    fontFamily: "inherit",
                  }}>
                    {searchTerm
                      ? section.content.split(new RegExp(`(${searchTerm})`, "gi")).map((part, i) =>
                          part.toLowerCase() === searchTerm.toLowerCase()
                            ? <mark key={i} style={{ background: section.color + "40", color: section.color, borderRadius: "2px" }}>{part}</mark>
                            : part
                        )
                      : section.content
                    }
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        marginTop: "32px",
        padding: "20px",
        color: "#374151",
        fontSize: "11px",
        letterSpacing: "1px",
      }}>
        HORECA ULTRA PLATFORM SPEC v2.0 — 30 MODULES — WHITE-LABEL — MULTI-TENANT — ENTERPRISE
        <br />
        <span style={{ color: "#6366F1", marginTop: "4px", display: "block" }}>
          Built to surpass: Freya · Boogit · Toast POS · Lightspeed · Oracle MICROS · Deliverect · SevenRooms
        </span>
      </div>
    </div>
  );
}