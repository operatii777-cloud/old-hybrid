import { useState } from "react";

const TIERS = {
  CORE: { label: "CORE", color: "#22C55E", bg: "#14532d22" },
  PREMIUM: { label: "PREMIUM", color: "#F59E0B", bg: "#78350f22" },
  ENTERPRISE: { label: "ENTERPRISE", color: "#6366F1", bg: "#312e8122" },
  PLATINUM: { label: "PLATINUM", color: "#EC4899", bg: "#83185722" },
  ULTIMATE: { label: "ULTIMATE", color: "#EF4444", bg: "#7f1d1d22" },
};

const sections = [
  {
    id: "identity",
    emoji: "🧬",
    title: "PROJECT IDENTITY — HOSPITALITY OPERATING SYSTEM",
    color: "#6366F1", tier: "ENTERPRISE",
    content: `VISION: Build the world's most complete Hospitality Operating System (HOS). Not just a POS — a full operating platform for restaurants, hotels, bars, clubs, dark kitchens, food courts, franchise chains, and ghost kitchens globally. White-label + multi-tenant + cloud + offline PWA. Architected to evolve into a full hospitality digital ecosystem — HOS becomes the operating backbone of the entire hospitality economy.

SURPASSES: Freya, Boogit, Toast POS, Lightspeed, Oracle MICROS, Deliverect, SevenRooms, Harbortouch, Revel Systems, Square for Restaurants, Amadeus, Infosys HTNG.

TENANCY: schema-per-tenant PostgreSQL. Subdomain + custom domain per tenant. Full branding (logo/colors/fonts/favicon). 5-step wizard onboarding. Stripe subscription billing + usage metering. Feature flags per plan (Starter/Pro/Enterprise/Franchise/Ultimate).

ENTITY TYPES: Restaurant | Hotel Restaurant | Bar/Club | Dark Kitchen | Food Court | Drive-Thru Chain | Franchise Network | Catering Company | Ghost Kitchen Hub | Cloud Kitchen | Virtual Brand

STACK:
Frontend: React 18+, TypeScript strict, Vite, Tailwind CSS, Zustand, AG Grid Enterprise, TanStack Query, React Hook Form+Zod, Recharts/D3, Socket.io-client, i18next (RO+EN+extendable+RTL), Framer Motion, Workbox (SW+offline), Konva.js (floor plan)
Backend: Node.js 20+, Fastify, Prisma ORM, PostgreSQL 16, Redis 7, BullMQ, Socket.io, Zod, Winston, OpenAPI/Swagger, Meilisearch (full-text search), TimescaleDB (time-series analytics)
Mobile: React Native Expo SDK 50+, React Navigation, Expo Notifications/Camera/Location/SecureStore, Whisper STT (voice ordering)
Infra: Docker+K8s+Helm+KEDA (auto-scaling), GitHub Actions CI/CD, Terraform, Cloudflare CDN/WAF/R2, Sentry, Grafana+Prometheus+Loki, Chaos Engineering (LitmusChaos)
Monorepo: Turborepo`
  },
  {
    id: "structure",
    emoji: "🗂️",
    title: "MONOREPO STRUCTURE",
    color: "#F59E0B", tier: "CORE",
    content: `/apps
  web-admin           → Admin+Supervisor+Waiter
  web-pos             → POS touchscreen
  web-kds             → Kitchen+Bar Display System
  web-kiosk           → Self-service kiosk fullscreen
  web-tv-menu         → TV digital menu + smart signage
  web-ordering        → QR+Online ordering
  web-queue           → Order queue display (McDonald's style)
  web-franchise       → Central franchise + HQ war room
  web-plugin-market   → Plugin marketplace + developer portal
  web-hq-warroom      → Live operation control center (200 locations)
  web-superapp        → Hospitality SuperApp (customer-facing)
  mobile-waiter       → Waiter+Supervisor (React Native)
  mobile-courier      → Courier delivery (React Native)
  mobile-customer     → Customer SuperApp iOS+Android (React Native)

/packages
  api                 → Fastify server + plugin system + public API
  db                  → Prisma schema+migrations+seed+TimescaleDB
  shared              → TS types, utils, constants
  ui                  → Design system + theme engine + UI builder
  queue               → BullMQ workers (orders, notifications, AI, sync)
  notifications       → Email+SMS+Push+WhatsApp+VoiceIP
  fiscal              → ANAF+SAGA+fiscal printers
  ai                  → OpenAI+ML+Voice+Workload+Forecast+Risk AI
  delivery            → GLOVO+BOLT+WOLT+TAZZ+internal adapters
  franchise           → Multi-location franchise logic + compliance
  plugin-sdk          → Public SDK for third-party plugins
  voice               → Voice ordering + AI reservation assistant
  payment-engine      → Multi-PSP orchestration + fraud scoring
  supply-chain        → Cross-location procurement intelligence
  labor-ai            → Labor optimization + burnout detection
  revenue-science     → Menu engineering + elasticity + P&L AI
  digital-identity    → Universal Guest ID + hospitality passport
  experience-engine   → IoT ambient control + smart signage
  risk-engine         → Fraud detection + shrinkage + collusion AI
  financial-control   → CFO layer: P&L, COGS, EBITDA, tax forecast
  data-network        → Anonymized industry benchmarking network

/infra → Docker, K8s+KEDA, Terraform, chaos scripts, runbooks`
  },
  {
    id: "database",
    emoji: "🗃️",
    title: "PRISMA SCHEMA — ALL MODELS",
    color: "#10B981", tier: "CORE",
    content: `Complete schema. All models: tenantId, soft-delete (deletedAt), indexes, cascade rules. Monetary=integers (cents). Dates=UTC. TimescaleDB hypertables for time-series (orders, events, metrics).

TENANT+AUTH: Tenant (plan,featureFlags{},brandingConfig{}), User (roles: SUPER_ADMIN|ADMIN|SUPERVISOR|WAITER|COURIER|KIOSK|KDS|FRANCHISE_MANAGER|CFO|HQ_ANALYST), AuditLog (who/what/when/ip/device/old/new), Session, TwoFactorAuth, ApiKey (scoped permissions, rate limits)

DIGITAL IDENTITY (NEW): GuestIdentity (id=UUID,globalId=GUID,tenantIds[],email,phone,passportQR,gdprConsents[],unifiedLoyaltyBalance,riskScore,fraudFlag,chargebackCount,createdAt), IdentityConsent (guestId,tenantId,purpose,granted,grantedAt,revokedAt), CrossBrandTransfer (fromTenantId,toTenantId,points,status), GlobalBehaviorProfile (guestId,visitFrequency,avgSpend,preferredCuisine[],allergens[],ltv,churnRisk)

RESTAURANT: Location (timezone,currency,autoScaleConfig{},laborCostTarget%,revenueTarget), Area (INDOOR|OUTDOOR|TERRACE|BAR|VIP|DRIVE_THRU), Table (posX,posY,shape,status,qrCode,avgTurnoverMinutes,predictedFreeAt), Station (KITCHEN|BAR|GRILL|PASTRY,printerIp,currentLoad,maxCapacity,workloadScore)

MENU: Category, Product (price,priceVip,priceDiscount,priceProtocol,vatRate,allergens[],additives[],preparationTime,avgPrepActual,menuEngCategory:STAR|DOG|PUZZLE|PLOWHORSE,elasticityScore,marginActual%), Recipe, RecipeIngredient (qty,unit,waste%), SubRecipe, Allergen (14 EU), Additive (E-codes) — AUTO-CALCULATED up chain

INVENTORY: Warehouse, Ingredient (code=ING-001,unit,minStock,costPrice,avgWeightedPrice,allergens[],additives[],supplierReliabilityScore), StockMovement (NIR|CONSUMPTION|TRANSFER|RETURN|INVENTORY|WASTE), NIR+NIRItem (lotNumber,expiryDate,supplierBatchId), InventorySession+InventoryItem, Transfer (supervisorApproval), Supplier (reliabilityScore,priceVolatilityIndex,contractTerms), SupplierProduct (tierPricing[]), LotTracking (FIFO/LIFO)

SUPPLY CHAIN (NEW): SurplusAlert (locationId,ingredientId,surplusQty,suggestedTransferTo), PriceVolatilityAlert (ingredientId,currentPrice,previousPrice,changePercent,trend), ProcurementOrder (auto-generated,supplierId,items[],status,centrallyManaged), ContractOptimization (ingredientId,currentSupplier,betterSupplier,estimatedSaving,recommendedAt)

ORDERS: Order (type:DINE_IN|TAKEAWAY|DELIVERY|DRIVE_THRU|ROOM_SERVICE|VIRTUAL_BRAND, source:POS|WAITER|KIOSK|QR|ONLINE|GLOVO|BOLT|WOLT|TAZZ|VOICE|SUPERAPP, priceType:NORMAL|DISCOUNT|VIP|PROTOCOL, virtualBrandId), OrderItem (status,kdsStation,sentAt,readyAt), Bill, Payment (CASH|CARD|VOUCHER|QR_PAY|ROOM_CHARGE|BNPL|GIFT_CARD|CRYPTO), Void (supervisorId+reason+amount+riskFlag)

PAYMENTS (NEW): PaymentTransaction (pspUsed:STRIPE|ADYEN|WORLDLINE|NETOPIA|PAYU, routingReason:LOWEST_FEE|FAILOVER|CURRENCY, feeAmount, fraudScore, chargebackRisk, settlementCurrency, settlementAmount), PSPConfig (tenantId,pspId,priority,feePercent,currencies[],isActive), ChargebackCase (transactionId,reason,status,autoResponseSent,resolution), GiftCard (code,balance,globalWallet,issuedAt,expiresAt,crossBrand), BNPLTransaction (provider:KLARNA|AFTERPAY,installments,status)

DELIVERY: DeliveryOrder, Courier (efficiencyScore,burnoutRisk), DispatchZone

CRM: Customer, LoyaltyTransaction, Voucher, CustomerSegment, MarketingCampaign

RESERVATIONS: Reservation (noShowProbability,aiHandled,channel:WEB|APP|PHONE|EMAIL|VOICE_AI|SUPERAPP, preAuthAmount,confirmationCode)

DARK KITCHEN (NEW): VirtualBrand (id,tenantId,name,logoUrl,description,activeOnPlatforms[],ghostMenu:bool), VirtualBrandMenu (virtualBrandId,productId,platformPrice,isAvailable), KitchenSharedSlot (locationId,virtualBrandId,timeSlotMinutes,costAllocation%), VirtualBrandPerformance (virtualBrandId,date,orders,revenue,margin,platformFees)

FISCAL: FiscalDocument (type,anafStatus,xmlContent,pdfUrl), CashRegister (brand), DaySession (openingCash,closingCash,zReport), SagaExport

FINANCIAL CONTROL (NEW): DailyPL (locationId,date,revenue,cogs,laborCost,overhead,grossMargin,ebitda,autoGenerated), AccrualEntry (type,amount,period,category,approvedById), CashReconciliation (sessionId,expected,actual,difference,resolvedById,aiFlag), TaxLiability (period,vatOwed,incomeTaxEstimate,status,filedAt), EBITDAProjection (locationId,month,projected,actual,variance,trend)

REVENUE SCIENCE (NEW): PriceElasticity (productId,pricePoint,observedDemand,elasticityCoef,updatedAt), MenuEngineering (productId,period,category:STAR|DOG|PUZZLE|PLOWHORSE,marginContrib,popularityIndex,recommendation), ABPriceTest (productId,variantA_price,variantB_price,startDate,endDate,winner,confidenceLevel), CannibalismDetection (product_a_id,product_b_id,correlationScore,impactEstimate,flag)

FRANCHISE: FranchiseNetwork, FranchiseBenchmark (kpis{}), FranchiseStandard, FranchiseAlert, RoyaltyCalculation (locationId,period,revenue,royaltyRate,amount,paidAt), ComplianceScore (locationId,date,score,breakdown{},autoAuditFindings[]), MysteryShopperReport (locationId,date,score,findings[],photos[])

LABOR (NEW): DemandForecast15min (locationId,datetime,predictedOrders,confidence), ShiftSuggestion (locationId,date,role,suggestedCount,reason,laborCostImpact), LaborCostTracking (locationId,date,actual%,target%,variance,alert), OvertimeRisk (userId,weekHours,riskLevel,alertSent), BurnoutSignal (userId,pattern:LATE_CLOCKINS|HIGH_VOIDS|SHORT_BREAKS|DECLINING_SCORE,detectedAt,severity)

RISK ENGINE (NEW): FraudAlert (type:INTERNAL_FRAUD|SHRINKAGE|COLLUSION|REFUND_CLUSTER|FAKE_RESERVATION, entityId,entityType,confidence,evidence{},resolvedAt), ShrinkageAnomaly (warehouseId,ingredientId,expectedConsumption,actualConsumption,variance%,flaggedAt), CollisionPattern (user1Id,user2Id,pattern,occurrences,firstSeen,lastSeen,severity), RefundCluster (orderId[],totalAmount,timeWindow,operatorId,flaggedAt)

AI MODELS: WorkloadSnapshot, StaffEfficiencyScore, TableTurnoverPrediction, DemandForecast, VoiceLog (transcript,intent,confidence,resolved)

EXPERIENCE ENGINE (NEW): AmbientScene (locationId,name,musicPlaylist,lightingConfig{},signageContent[],activeFrom,activeTo,trigger:TIME|OCCUPANCY|WEATHER|MANUAL), IoTDevice (locationId,type:LIGHT|SPEAKER|DISPLAY|THERMOSTAT,ipAddress,protocol,currentState{}), SmartSignageSchedule (deviceId,contentId,startTime,endTime,priority), OccupancyLevel (locationId,timestamp,tablesFilled%,predictedPeak)

DATA NETWORK (NEW): IndustryBenchmark (city,cuisine,metric,value,period,sampleSize,anonymized:true), FoodTrend (ingredient,trend:RISING|FALLING|STABLE,confidence,region,detectedAt), IngredientCostIndex (ingredientCategory,region,avgPrice,period,changePercent), PeakHourBenchmark (city,cuisine,dayOfWeek,hour,avgOrdersPerTable)

PLUGINS: Plugin, PluginEvent, WebhookEndpoint (tenantId,url,events[],secret,deliveryLog[])

MESSAGING: Message (channel:GENERAL|KITCHEN|BAR|DELIVERY|MANAGEMENT|HQ), Notification`
  },
  {
    id: "digital-identity",
    emoji: "🛂",
    title: "HOSPITALITY DIGITAL IDENTITY LAYER",
    color: "#EC4899", tier: "ULTIMATE",
    content: `CONCEPT: Universal Guest ID — the "hospitality passport". One identity per guest, recognized across all brands, locations, countries using the platform. GDPR-compliant by design.

UNIVERSAL GUEST ID:
- UUID generated on first interaction (any channel, any brand)
- Links: email + phone + device fingerprint + social login (optional)
- QR hospitality passport: scannable at any brand's kiosk/POS
- Cross-brand recognition: if guest visits Brand A in Bucharest then Brand B in Paris → same profile, same history
- GDPR consent per brand per purpose (stored in IdentityConsent table)
- Right to erasure: one-click delete across all tenants → cascades via event

UNIFIED LOYALTY WALLET:
- Single points balance visible across all brands in the network
- Point transfer between brands (configurable rate, fee)
- Brand-specific redemption rules (each brand sets what points buy)
- Wallet displayed in SuperApp + printed on receipts
- Expiry rules configurable per brand (points expire if no activity in X months)

CROSS-BRAND BEHAVIORAL ANALYTICS:
- Spend patterns across brands (with consent)
- Cuisine preferences learned over time
- Visit frequency across network
- Cross-brand upsell: "You love burgers at Brand A — Brand B has a new burger"
- Privacy: analytics use anonymized/aggregated data by default; individual tracking requires explicit consent

LIFETIME VALUE (GLOBAL):
- LTV calculated across all brands (total spend, visit frequency, tenure)
- Projected LTV: ML model predicts future value based on current patterns
- Segments: Rising Star | Loyal Core | At-Risk | Dormant | Champion
- Retention actions triggered automatically by segment change

RISK SCORING:
- Fraud risk: chargeback history, suspicious behavior patterns across brands
- High-risk flag: shared across network (if guest chargebacks at Brand A → flagged at Brand B)
- Score 0-100: shown to staff at check-in, not to customer
- Dispute mechanism: guest can challenge risk score via SuperApp

IMPLEMENTATION:
- Central Identity Service (separate microservice, zero-knowledge to individual tenants)
- Tenant queries identity by token (never sees raw PII unless guest explicitly shares)
- Event-driven sync: consent change → propagates to all tenants within 60s
- Full audit trail per identity: every access, every consent change, every data use`
  },
  {
    id: "payment-engine",
    emoji: "💳",
    title: "GLOBAL PAYMENT ORCHESTRATION ENGINE",
    color: "#F59E0B", tier: "ULTIMATE",
    content: `CONCEPT: Payment as an intelligent layer, not a dumb terminal. Route, optimize, protect, and automate every payment transaction.

MULTI-PSP ROUTER:
- Supported PSPs: Stripe, Adyen, Worldline, Netopia, PayU, Square, Braintree
- Per-transaction routing logic:
  → Lowest fee: compare PSP fees for transaction type+amount+currency → route to cheapest
  → Fastest settlement: prefer PSP with T+1 vs T+3 settlement when cash flow critical
  → Geographic: route to PSP with best coverage in customer's country
  → Failover: if PSP fails (timeout/error) → auto-retry on secondary PSP within 2s
- Config per tenant: PSP priority list, routing rules, fallback chain

SMART FEE OPTIMIZATION:
- Real-time fee calculator: for each transaction shows actual fee before routing
- Monthly savings report: how much saved by smart routing vs single PSP
- Automatic renegotiation alerts: when transaction volume warrants better rates

FRAUD SCORING AI:
- Per-transaction risk score 0-100 (ML model: device, velocity, amount, location, history)
- Low risk (<30): auto-approve
- Medium risk (30-70): flag for manual review or add friction (3DS)
- High risk (>70): auto-decline + alert
- Model trains on: confirmed fraud, chargebacks, false positives over time
- Cross-network signals: suspicious IPs/devices flagged across all tenants

CHARGEBACK AUTOMATION:
- Auto-detect chargeback notification from PSP webhook
- Auto-gather evidence: order receipt, delivery proof, customer consent records
- Auto-submit dispute response to PSP within 24h (configurable)
- Win/loss tracking: dispute rate, win rate, by reason code
- Prevent repeat: flag customer for future risk scoring

BNPL INTEGRATION:
- Providers: Klarna, Afterpay, Zip (configurable by region)
- Available at: kiosk, online ordering, POS (high-value orders)
- Installment plans shown to customer at checkout
- Merchant receives full amount immediately (BNPL provider carries risk)

GIFT CARD GLOBAL WALLET:
- Issue gift cards: physical (barcode) or digital (email/app)
- Global wallet: balance usable across all brands in network
- Cross-brand transfer + top-up via SuperApp
- B2B gift cards: corporate bulk issuance
- Reporting: outstanding liability, redemption rate, expiry schedule

CURRENCY SMART SETTLEMENT:
- Multi-currency: accept payment in customer's currency
- Settle in tenant's base currency at optimal FX rate
- FX hedging alerts: when rate is favorable → notify CFO
- Per-location currency config`
  },
  {
    id: "supply-chain",
    emoji: "🔗",
    title: "REAL-TIME SUPPLY CHAIN NETWORK",
    color: "#22C55E", tier: "ULTIMATE",
    content: `CONCEPT: Cross-location procurement intelligence. Mini-SAP for hospitality. Transforms inventory from isolated silos into a connected supply network.

CROSS-LOCATION SURPLUS DETECTION:
- Continuously monitor stock levels across all locations in network
- Detect: Location A has 50kg flour above par level while Location B is critically low
- Auto-suggest: internal transfer (cost vs delivery time vs urgency calculation)
- Dashboard: network-wide stock map with surplus/deficit heat map
- 1-click approve internal transfer → auto-creates Transfer document both sides

PRICE VOLATILITY MONITOR:
- Track ingredient purchase prices across all suppliers and locations
- Detect: ingredient price spiked 20% this week across supplier network
- Alert: procurement team + suggest alternative suppliers
- Historical price charts per ingredient + trend direction
- Seasonal pattern recognition: "tomato prices historically spike in February"

SUPPLIER RELIABILITY SCORING:
- Per supplier: on-time delivery rate, quality complaint rate, invoice accuracy rate, price consistency
- Score 0-100, updated with every NIR interaction
- Composite network score (aggregated across all tenants using that supplier — anonymized)
- Low-score alert: "Supplier X reliability dropped below 70% — consider alternatives"

CENTRAL CONTRACT OPTIMIZATION:
- Aggregate purchase volumes across franchise network → negotiate as one buyer
- Volume thresholds: "If all locations commit to X kg/month → unlock better rate"
- Contract comparison: current rate vs market rate vs available alternatives
- Recommend: consolidate suppliers to increase leverage
- Auto-generate: purchase recommendations based on contracts

PROCUREMENT AUTOMATION:
- Auto-purchase order when stock hits reorder point (configurable per ingredient)
- Auto-select supplier based on: price + reliability score + lead time + contract terms
- Approval workflow: orders above threshold → manager approval
- EDI integration for major suppliers (auto-confirm, auto-NIR on delivery scan)
- Purchase order tracking: issued → confirmed → in transit → delivered → NIR created`
  },
  {
    id: "labor-ai",
    emoji: "👥",
    title: "LABOR OPTIMIZATION AI",
    color: "#6366F1", tier: "PLATINUM",
    content: `CONCEPT: McDonald's enterprise-level workforce intelligence. Optimize labor cost while preventing burnout and maintaining service quality.

TRAFFIC FORECAST (15-MINUTE GRANULARITY):
- ML model inputs: historical orders by 15min slot, day of week, weather API, local events (concerts, sports, holidays), running promotions, seasonal patterns
- Output: predicted orders per 15min for next 7 days with confidence interval
- Accuracy improves automatically: model retrains weekly on actual vs predicted
- Force majeure override: manager can input unexpected event → model adjusts

AUTO SHIFT SUGGESTION:
- Based on 15min forecast → calculate required staff per role (kitchen, bar, waiter, cashier, courier)
- Generate shift schedule: who works when, covering demand peaks
- Constraints: contracted hours, overtime limits, requested days off, skills matrix
- Output: draft schedule → supervisor approves/modifies → publishes to staff app
- Staff notification: shift confirmed, shift change, pickup available

LABOR COST % TRACKING:
- Real-time: labor cost this hour vs revenue this hour → cost%
- Target: manager sets target% per day type (weekday/weekend/holiday)
- Alert: when actual% exceeds target by X% → "Consider sending one person home early"
- Forecast: projected labor cost% for remainder of day based on current trend
- Weekly/monthly P&L integration: labor cost feeds directly into financial control layer

OVERTIME RISK DETECTION:
- Track hours worked per employee per week in real-time
- Alert at 80% of legal/contracted overtime threshold
- Suggest: reassign tasks, send home early, offer shift swap
- Compliance: flag if schedule would result in legal overtime violation before publishing

STAFF PERFORMANCE BENCHMARKING (CROSS-LOCATION):
- Compare staff efficiency scores between locations (anonymized for staff, named for management)
- Identify: "Waiters at Location B have 40% faster table turnover — what's different?"
- Best practice sharing: top-performing location's processes highlighted as recommendation
- Underperformer coaching: auto-flag for 1:1 meeting suggestion

BURNOUT DETECTION (PATTERN-BASED):
- Signals monitored per employee: increasingly late clock-ins, shortened breaks, declining efficiency score, increasing void rate, reduced shift acceptance rate, unusual absenteeism
- Burnout risk score: Low / Medium / High / Critical
- Trigger: when High → private notification to manager: "Consider checking in with [Name]"
- Never shown to other staff members — strictly manager-level visibility
- Trend tracking: is risk increasing or decreasing over time`
  },
  {
    id: "hq-warroom",
    emoji: "🎯",
    title: "HQ WAR ROOM — LIVE OPERATION CONTROL CENTER",
    color: "#EF4444", tier: "ENTERPRISE",
    content: `CONCEPT: Real-time command center for franchise HQ. One screen to watch 200 locations live. Proactive alerting. Zero blind spots.

LIVE DASHBOARD (web-hq-warroom):
- World/country/city map: all locations as pins with live color status
  → 🟢 Green: all KPIs within targets
  → 🟡 Yellow: one or more KPIs approaching threshold
  → 🔴 Red: alert active, needs attention
  → ⚫ Grey: location offline or closed
- Global metrics bar: total orders live, total revenue today, avg ticket, avg prep time network-wide
- Click any location → drill-down to full live view of that location

PER-LOCATION LIVE METRICS:
- Orders in last 60min | Orders today
- Average preparation time (live, vs SLA target)
- Delivery SLA compliance % (on-time deliveries)
- Kitchen load per station (%)
- Revenue today vs target vs same day last week
- Active alerts count with severity

INTELLIGENT AUTO-ALERTING:
All thresholds configurable per location type. Alerts sent to: HQ dashboard + manager SMS + HQ Slack/Teams webhook.

→ KITCHEN DELAY: avg prep time >15min (configurable) → Red alert + station load details
→ CRITICAL STOCK: any ingredient at 0 or below minimum → stock details + suggested action
→ REFUND SPIKE: refunds in last 30min >3x normal rate → void breakdown + operator details
→ VOID SPIKE: voids >5% of orders in last hour → void reasons + supervisor who approved
→ REVENUE ANOMALY: revenue pace 30%+ below forecast for time of day → current vs expected
→ DELIVERY SLA BREACH: >20% deliveries late in last 30min → average delay + courier count
→ SYSTEM OFFLINE: location stops sending heartbeat >5min → immediate critical alert
→ FRAUD SIGNAL: risk engine flags suspicious activity → details + recommended action
→ CASH DISCREPANCY: reconciliation difference above threshold → amount + responsible staff

TREND ANALYSIS (HQ Level):
- Network revenue trend: last 7 days, last 30 days, YoY comparison
- Best/worst performing locations: ranked by revenue, margin, efficiency, customer rating
- Incident log: all alerts fired across network, resolution time, recurring issues
- Operational health score per location: composite of all KPIs

REMOTE ACTIONS (from HQ):
- Push urgent menu availability change to specific location(s) or all locations
- Broadcast message to location managers
- Trigger emergency stock transfer suggestion
- Lock/unlock specific discounts or price types remotely
- Schedule audit for underperforming location`
  },
  {
    id: "experience-engine",
    emoji: "✨",
    title: "EXPERIENCE ENGINE — IoT AMBIENT CONTROL",
    color: "#06B6D4", tier: "PLATINUM",
    content: `CONCEPT: Transform the physical restaurant into a responsive environment. The HOS controls ambiance, not just transactions. Becomes an experiential operating system.

SMART AMBIENT SCENES:
- Define named scenes per location: "Lunch Rush", "Romantic Evening", "Happy Hour", "Closed"
- Each scene config: music playlist/genre/BPM, lighting preset, digital signage content, thermostat setting
- Trigger types:
  → TIME: "Romantic Evening" activates Mon-Sun 19:00-23:00
  → OCCUPANCY: "Energetic" activates when tables >80% full
  → WEATHER: "Cozy" activates when outdoor temp <10°C (weather API)
  → MANUAL: supervisor triggers from tablet in one tap
  → AI: system detects high dwell time (slow service) → subtly increases music tempo to encourage turnover

IoT DEVICE INTEGRATION:
- Lighting: Philips Hue, LIFX, DMX controllers → dim/color/group control
- Audio: Sonos, Spotify for Business, local audio controllers → volume/playlist/zone
- Displays: smart TVs, digital signage screens → content push
- HVAC: Nest, Ecobee, BACnet protocol → temperature adjustment
- Protocol support: HTTP REST, MQTT, Zigbee gateway, WebSocket
- Device registry: per-location device map with health monitoring

SMART SIGNAGE CONTENT ENGINE:
- Schedule content per screen: time-based, occupancy-based, promotion-based
- Content types: product promos, videos, social media feed, daily specials, countdown timers, live order queue
- Dynamic content: when stock of item runs low → auto-remove from TV menu display
- Contextual: if it's raining → show warm drinks and soups on TV menu

PEAK HOUR ACOUSTIC ADJUSTMENT:
- During peak hours: increase music volume + tempo slightly (scientifically increases table turnover)
- During slow periods: decrease tempo, increase ambiance (encourage longer stays + higher spend)
- Fully configurable: manager sets rules, system executes automatically
- Manual override always available

MOOD AUTOMATION EXAMPLES:
- 12:00 → "Lunch Energy": bright lights + 120BPM playlist + lunch specials on screens
- 15:00 → "Afternoon Calm": softer lights + acoustic playlist + coffee promotions
- 19:00 → "Evening Dining": warm dimmed lights + jazz + dinner menu on screens
- 22:30 → "Closing Wind-Down": gradually dim lights over 30min + slow music → signals closing time

OCCUPANCY SENSING:
- Table occupancy tracked by POS (tables open/closed) → real-time occupancy %
- Optional: camera-based occupancy counting (anonymous, no facial recognition, privacy-compliant)
- Occupancy feeds into: ambient scenes, demand forecast, staff allocation, kitchen load balancing`
  },
  {
    id: "dark-kitchen",
    emoji: "👻",
    title: "DARK KITCHEN + CLOUD KITCHEN MODE",
    color: "#8B5CF6", tier: "ENTERPRISE",
    content: `CONCEPT: One physical kitchen, multiple virtual restaurant brands. Each brand has its own menu, identity, and presence on delivery platforms. Full cost allocation and performance tracking per virtual brand.

VIRTUAL BRAND MANAGEMENT:
- Create unlimited virtual brands per location
- Each brand: name, logo, description, cuisine type, target platform(s)
- Ghost menu: completely different menu from physical restaurant (or overlapping — configurable)
- Platform-specific pricing: same dish can cost different on GLOVO vs WOLT (platform fee compensation)
- Availability control: toggle brand on/off per platform instantly
- Brand-specific packaging instructions: "Use Brand B boxes and stickers for these orders"

SHARED KITCHEN LOGIC:
- Single kitchen serves multiple brands simultaneously
- Orders from all brands flow to same KDS with brand color-coding
- Kitchen time slot allocation: "Brand A gets 60% capacity 12-14h, Brand B gets 40%"
- Rush hour priority: configure which brand takes priority when kitchen is at capacity
- Staff see: brand name + logo on each order card so they use correct packaging

COST ALLOCATION PER VIRTUAL BRAND:
- Ingredient costs: recipes assigned per brand → COGS calculated per brand
- Labor allocation: hours spent on Brand A orders vs Brand B (time-based proportional)
- Overhead allocation: % of kitchen rent/utilities per brand (by order count or revenue share)
- Platform fees: GLOVO/BOLT/WOLT commission tracked per brand separately

PERFORMANCE PER VIRTUAL BRAND:
- Orders, revenue, avg ticket, COGS, margin, platform fees, net margin: all per brand
- Comparison dashboard: which virtual brand is most profitable?
- Platform performance: how does Brand A perform on GLOVO vs WOLT vs TAZZ?
- Product performance per brand: best sellers, low performers, waste contributors
- Recommendation: "Brand B has 8% margin — consider discontinuing or repricing"

GHOST MENU STRATEGY TOOLS:
- Menu performance analysis: which ghost menu items drive most profit?
- Platform A/B testing: launch new item on WOLT only → measure → decide full rollout
- Competitor monitoring: track similar virtual brands' ratings + menu on aggregator platforms
- Seasonal ghost menus: activate "Winter Brand" menu only in cold months`
  },
  {
    id: "revenue-science",
    emoji: "📈",
    title: "REVENUE SCIENCE LAYER",
    color: "#F97316", tier: "ULTIMATE",
    content: `CONCEPT: Not just reporting. Active revenue optimization engine. AI that makes the menu, pricing, and product mix work harder every day.

MENU ENGINEERING AI (BCG Matrix for Menu):
- Classify every product into 4 categories updated weekly:
  → ⭐ STAR: high margin + high popularity → protect, promote, make it a hero
  → 🐄 PLOWHORSE: low margin + high popularity → increase price slightly, reduce waste, optimize recipe cost
  → 🧩 PUZZLE: high margin + low popularity → boost visibility, upsell, move on menu
  → 🐕 DOG: low margin + low popularity → candidate for removal or reformulation
- Dashboard: visual 2x2 matrix with all products plotted (live, interactive)
- Actionable recommendations per product with expected impact
- Track: did following the recommendation improve the KPI? (closed-loop learning)

PRICE ELASTICITY DETECTION:
- For each product: historical orders at different price points → estimate demand elasticity
- Elastic: small price increase → big demand drop (avoid raising this)
- Inelastic: price increase has little demand impact → safe to raise for margin
- Elasticity coefficient per product: updated monthly
- AI suggestion: "Product X has elasticity -0.3 — raising price 10% will reduce orders ~3% but increase revenue 7%"

PRODUCT CANNIBALIZATION DETECTION:
- Detect: when Product A was added, Product B sales dropped 40% → likely cannibalization
- Measure: correlation coefficients between all product pairs
- Flag high cannibalism pairs to manager: "New BBQ Burger is cannibalizing Classic Burger — consider differentiating or removing one"
- Net revenue impact: would removing the cannibalizer increase total revenue?

REAL-TIME MARGIN TRACKING:
- Live gross margin % per product, per category, per order, per location
- Margin drop alert: if actual margin falls below target → investigate ingredient cost or waste
- Food cost variance: expected food cost (from recipe) vs actual (from stock consumption) → flag discrepancy

A/B PRICE TESTING:
- Test two price points simultaneously: Location A gets €12, Location B gets €14 for same product
- Measure: order volume, revenue, margin, customer rating per variant
- Statistical significance threshold: minimum sample before declaring winner
- Auto-apply winner to all locations when test concludes

AUTO-SUGGEST PRODUCT REMOVAL:
- Products flagged as DOG for 4+ consecutive weeks → auto-generate removal recommendation
- Manager receives: product name, weeks as DOG, estimated revenue impact of removal, suggested replacement or gap analysis
- One-click decision: archive product or keep with justification note

REVENUE OPPORTUNITY ALERTS:
- "Table 7 has been dining 90min. Average spend for this table type is €45. Current spend: €28. Suggest: dessert upsell."
- "It's 15:00 on a Tuesday. Historically your slowest hour. Happy hour discount on cocktails would increase avg revenue by €180 based on past data."
- "Weather API: rain forecast tomorrow. Warm drinks historically +60% on rainy days. Pre-promote on TV menu and app."`
  },
  {
    id: "financial-control",
    emoji: "💼",
    title: "FINANCIAL CONTROL LAYER — CFO MODE",
    color: "#14B8A6", tier: "ULTIMATE",
    content: `CONCEPT: Real-time financial intelligence for operators and CFOs. Daily P&L auto-generated. EBITDA live. No waiting for monthly accountant reports.

DAILY P&L AUTO-GENERATED:
- Every night at 23:59 (or on day close): auto-calculate for each location:
  → Revenue: total sales by type (food/drink/delivery/catering)
  → COGS: actual ingredient consumption from stock movements
  → Gross Profit = Revenue - COGS
  → Labor Cost: from staff hours × hourly rates (from ClockEntry)
  → Overhead: rent, utilities, platform fees (configured by manager or imported)
  → Operating Profit (EBITDA approx) = Gross Profit - Labor - Overhead
- Available in dashboard by 00:05 every day
- Drilldown: any line item → transactions, receipts, evidence

CASH RECONCILIATION AI:
- At day close: system knows expected cash = opening cash + cash sales - cash refunds
- Manager counts actual cash → enters in app
- AI compares: if difference >€5 → flag + request explanation
- Pattern detection: recurring shortfalls same shift → fraud risk flag → escalate to risk engine
- Audit trail: every reconciliation stored with who, when, amount, explanation

COGS LIVE TRACKING:
- Every order completed → COGS calculated from recipe ingredient costs (current avg price)
- Live food cost% today: total COGS / total revenue × 100
- Alert: if food cost% >target% → investigate (price changes? waste? portion drift?)
- Per-product COGS: expected vs actual (flags recipe drift or ingredient substitution)

ACCRUAL TRACKING:
- Enter accruals: rent (monthly), utilities (monthly), insurance (annual), licenses
- System distributes: spreads annual costs to daily/monthly for accurate P&L
- Visual: accrual calendar, upcoming payments, cash flow impact
- Integration with bank reconciliation (manual import or Plaid/Salt Edge API)

EBITDA PROJECTION (LIVE):
- Rolling 30-day EBITDA projection based on current trend
- Scenario modeling: "What if we increase avg ticket by €2?" → instant EBITDA impact
- Variance analysis: projected vs actual, with root cause suggestions
- Multi-location: consolidated EBITDA across franchise network for CFO view

TAX LIABILITY FORECAST:
- VAT tracking: collected per period, owed to ANAF, due dates
- Income tax estimate: based on EBITDA projection × applicable tax rate
- Dashboard: next tax payment amount + date + cash required
- Alert: if cash balance may not cover upcoming tax liability

BANK FEED INTEGRATION (optional):
- Connect business bank account via Open Banking (Plaid, Salt Edge, or TrueLayer)
- Auto-match bank transactions to system records (invoices, payouts, expenses)
- Unmatched transactions flagged for review
- Cash flow actual vs system projected`
  },
  {
    id: "risk-engine",
    emoji: "🛡️",
    title: "PREDICTIVE RISK ENGINE",
    color: "#EF4444", tier: "ULTIMATE",
    content: `CONCEPT: Detect fraud, theft, collusion, and suspicious patterns before they become significant losses. Internal security intelligence layer.

INTERNAL FRAUD DETECTION:
- Excessive voids by single operator in short time window → fraud alert
- Voids always approved by same supervisor for same operator → collusion signal
- Orders opened and closed without items → table ghost orders → flag
- Discounts applied at non-standard times (e.g., midnight) → flag
- Manager-level override used more than 3x/hour → suspicious
- All alerts scored + sent to admin (not to the flagged user)

SHRINKAGE DETECTION:
- Expected consumption: orders placed × recipe quantities = expected ingredient use
- Actual consumption: NIR inputs - closing stock = actual ingredient use
- Variance% per ingredient: if actual >115% of expected → shrinkage alert
- Pattern analysis: is variance consistent (portion drift) or random (theft/waste)?
- Per-ingredient trend: is variance getting worse over time?
- Actionable: flag to warehouse manager with evidence (expected vs actual per day)

STAFF COLLUSION PATTERNS:
- Detect: User A always voids orders approved by User B → pair flagged
- Detect: User A always gives discounts when User B is supervisor on shift
- Detect: Same table "re-opened" multiple times → potential re-charge fraud
- Detect: Customer X always gets refunds when Staff Y serves them → relationship flag
- Algorithm: graph-based pattern matching on transaction relationships
- Evidence package: list of suspicious transactions, timestamps, amounts → sent to admin

REFUND/VOID CLUSTER DETECTION:
- Time-window analysis: >5 voids in 15min window → cluster flagged
- Value analysis: suspiciously round-number refunds → flag
- New employee detection: staff in first 30 days with high void rate → alert manager
- Platform refunds: spike in GLOVO/WOLT refunds → possible fraudulent platform abuse

FAKE RESERVATION DETECTION:
- Patterns: same phone number / email making multiple reservations at same time
- No-show history: guest with >3 no-shows flagged → require pre-authorization card
- Bulk reservations: N reservations same evening same party size → possible "blocking" attack
- Bot detection: reservations created in <3s via API → rate limit + CAPTCHA flag

RISK DASHBOARD:
- All active alerts with severity + evidence + recommended action
- Risk score per employee (for manager view only — never visible to employee)
- Risk score per customer (fraud/chargeback history)
- Incident timeline: when alerts fired, who resolved, how
- Monthly risk report: total flagged incidents, resolved, escalated, financial impact prevented`
  },
  {
    id: "franchise-domination",
    emoji: "🏆",
    title: "FRANCHISE DOMINATION SYSTEM",
    color: "#A78BFA", tier: "ENTERPRISE",
    content: `ROYALTY AUTO-CALCULATION:
- Define royalty structure: % of net revenue, tiered by revenue bracket, fixed monthly, or hybrid
- Auto-calculate monthly royalty per location from DaySession totals
- Invoice auto-generated + sent to franchisee with breakdown
- Payment tracking: paid / overdue / disputed
- Dashboard: total royalty income per period, per location, per region

COMPLIANCE SCORING ENGINE:
- Define compliance standards: menu (mandatory items present?), pricing (within allowed range?), branding (logo correct? colors correct?), HACCP (records complete?), staff certifications (training completed?), operating hours (open when required?)
- Auto-audit: system checks compliance daily for each standard that can be automated
- Compliance score 0-100 per location + trend (improving/declining)
- Manual audit checklist: field auditor uses app → scores feed into same compliance model
- Non-compliance alert: automatic + escalation if not resolved within SLA

BRAND GUIDELINE ENFORCEMENT ENGINE:
- Define: allowed color hex codes, logo variants, font families, imagery rules
- Auto-detect violations: screenshot of kiosk/TV menu → AI vision checks compliance
- Report: "Location 14 is using off-brand font on kiosk — corrective action required"
- Template enforcement: can only use HQ-approved templates for customer-facing materials

CENTRAL AUDIT AUTOMATION:
- Scheduled audits: system auto-assigns audit to field auditor monthly
- Audit app: auditor arrives → opens checklist → completes → photos attached → score submitted
- Auto-escalation: score <60% → Regional Manager notified → corrective action plan required
- Repeat offenders: 3 consecutive failed audits → flagged for franchise agreement review

MYSTERY SHOPPER INTEGRATION:
- Assign mystery shop: HQ assigns to third-party mystery shopper service (or internal)
- Report format: standardized score card → imported to system
- Criteria: speed of service, food quality, staff friendliness, cleanliness, upsell attempt, loyalty mention
- Feed into: overall compliance score + staff efficiency records

KPI PENALTY / REWARD AUTOMATION:
- Define: if compliance score >90% for 3 months → franchisee earns marketing co-op fund
- Define: if compliance score <60% for 2 months → penalty fee auto-calculated
- If revenue target exceeded by >20% → performance bonus to franchisee
- All calculations automated, documented, auditable
- Franchisee portal: they see their own scores, targets, penalties/rewards in real-time`
  },
  {
    id: "api-economy",
    emoji: "🌐",
    title: "API ECONOMY + PLUGIN MARKETPLACE",
    color: "#22C55E", tier: "ENTERPRISE",
    content: `PLUGIN SYSTEM ARCHITECTURE:
- Every core module is internally a plugin (demonstrates system eats its own dog food)
- Plugin manifest: id, name, version, permissions[], hooks[], config_schema{}
- Hooks: onOrderCreated, onPaymentCompleted, onStockLow, onReservationNew, beforeKDSRoute, afterBillPrint, onGuestIdentityResolved, onAmbientTrigger, etc.
- Plugin can: add UI panels, add API endpoints, listen to events, modify data pipelines
- Sandboxed: plugins cannot access other tenants' data. Each plugin runs in isolated context.
- Config: per-tenant configuration via schema-driven auto-generated UI form

PLUGIN MARKETPLACE (web-plugin-market):
- Browse by category: Fiscal | Delivery | Loyalty | HR | Analytics | Hardware | IoT | Finance | AI
- Each plugin: description, screenshots, pricing, reviews, version, install count, developer info
- One-click install per tenant with permission review
- Free + Paid plugins (Stripe Connect: developer receives 70%, platform 30%)
- Verified badge: security-audited plugins
- Sandbox: test in staging environment before production install

PUBLIC API FOR DEVELOPERS:
- RESTful: versioned (v1, v2), OpenAPI 3.0, interactive Swagger UI + Postman collection
- Auth: API Keys (scoped permissions) + OAuth 2.0 (for third-party app integrations)
- Rate limiting: per key, per plan tier (Starter: 1000 req/day, Enterprise: unlimited)
- Webhooks: register URLs for any system event with HMAC-SHA256 signature
- Sandbox: full test environment, no production data affected
- GraphQL API: available for complex queries (read-only, for analytics integrations)

API MONETIZATION:
- Free tier: 1000 calls/day (generous to encourage ecosystem growth)
- Paid tiers: 100k/day, 1M/day, unlimited
- Premium endpoints: AI features, identity resolution, benchmarking data → separate pricing
- Revenue dashboard: API usage per key, revenue generated, top consumers

DEVELOPER PORTAL (web-plugin-market + docs subdomain):
- Full documentation: guides, tutorials, reference, changelog
- API explorer: live test any endpoint in browser
- Webhook tester: send test events, inspect payloads
- SDK downloads: TypeScript/JS, Python, PHP
- Community forum: plugin developers help each other
- Certification program: "HOS Certified Developer" badge for high-quality plugin developers

APP STORE MODEL:
- Plugins reviewed before listing (security scan + functionality test)
- Rating system: 1-5 stars, written reviews
- Featured plugins: HQ promotes high-quality plugins
- Bundle deals: "Restaurant Starter Pack" (5 plugins at discount)
- Enterprise plugins: private plugins for specific franchise networks (not public)`
  },
  {
    id: "data-network",
    emoji: "🌍",
    title: "GLOBAL DATA NETWORK EFFECT",
    color: "#F59E0B", tier: "ULTIMATE",
    content: `CONCEPT: With enough locations using the platform, anonymized aggregated data creates industry intelligence that no single restaurant could generate alone. The platform becomes an economic intelligence network for the hospitality industry.

ALL DATA IS STRICTLY ANONYMIZED: No tenant or location can be identified from benchmarks. Minimum sample size before any benchmark is published: N=30 locations. Tenants opt-in to data network (default: on for Enterprise/Franchise plans, off for Starter).

INDUSTRY BENCHMARKING NETWORK:
- Average gross margin % by: city + cuisine type + restaurant size
- Average food cost % by: cuisine + price tier + season
- Average labor cost % by: city + day type (weekday/weekend) + service type
- Table turnover rate: average minutes per cover by: cuisine + meal type + day part
- Average order value by: city + cuisine + channel (dine-in vs delivery vs takeaway)
- Use case: "Are we above or below industry average for our city and cuisine?"

FOOD TREND DETECTION:
- Track ingredient appearance rate in menus across network
- Rising trend: "Yuzu is appearing in 340% more menus this year vs last year in Western Europe"
- Falling trend: "Acai bowls declining -60% in popularity in Eastern Europe"
- Regional variation: what's trending in London may be 18 months from trending in Bucharest
- Alert: "Ingredient X trending rapidly in your city — consider adding to menu"

INGREDIENT COST INDEX:
- Average purchase price per ingredient category by region, updated monthly
- Price trend: is chicken breast getting more expensive industry-wide?
- Alert: "Your chicken purchase price is 23% above regional average — renegotiate or change supplier"
- Forecast: predicted price direction for next 3 months (based on commodity markets + supply data)

PEAK HOUR BENCHMARK:
- Average orders per table per hour: by city, cuisine, day of week, hour of day
- "On a Friday at 20:00, restaurants in your city+cuisine average 2.3 order turns/table. You're at 1.8 — opportunity."
- Staffing benchmark: average staff per 100 covers by restaurant type

COMPETITIVE INTELLIGENCE (ANONYMIZED):
- Where are you vs peers: percentile ranking on key metrics (never names competitors)
- "You're in the top 15% for food cost efficiency in your city"
- "Your delivery NPS is below median for your cuisine type — investigate"
- Trend comparison: are your metrics improving faster or slower than network average?

DATA GOVERNANCE:
- Opt-in/out at any time (no data collected during opt-out periods)
- Data processing agreement automatically included in platform ToS
- Anonymization certification: third-party audit of anonymization methodology annually
- GDPR Article 89: legitimate scientific/statistical processing basis documented`
  },
  {
    id: "superapp",
    emoji: "📲",
    title: "HOSPITALITY SUPERAPP — CUSTOMER MODE",
    color: "#EC4899", tier: "ULTIMATE",
    content: `CONCEPT: The customer-facing super-app. One app, all hospitality needs. Cross-brand, cross-location, cross-country. Combines: discovery, booking, ordering, payment, loyalty, reviews, and gamification into one seamless experience. Think: OpenTable + Uber Eats + Starbucks Rewards + Yelp — but white-label per franchise network.

CORE CUSTOMER FEATURES:
Discovery:
- Browse nearby restaurants (map view + list view)
- Filter: cuisine, price range, open now, accepts loyalty points, has kiosk, delivery available
- Restaurant profile: menu preview, photos, ratings, opening hours, allergen filter
- AI recommendation: "Based on your history, you'll love this" (from behavioral profile)

Reservation:
- Real-time availability calendar (pulls from reservation module)
- Book table: select date, time, party size, special requests
- AI chatbot: natural language booking ("Table for 2 this Saturday evening?")
- Confirmation: instant + SMS + calendar add (iOS/Android)
- Reminders: 24h + 2h before, with 1-tap confirm/cancel
- Pre-order: add food/drinks pre-arrival (available if restaurant enables)

Ordering (all channels in one app):
- QR scan at table → order in app → track kitchen progress
- Delivery order → real-time courier tracking map
- Takeaway → pickup timer countdown
- Schedule order: "Prepare my lunch order for 12:15"

Payment:
- Saved payment methods (cards + Apple/Google Pay)
- Loyalty points redemption at checkout
- BNPL at checkout (Klarna/Afterpay if enabled)
- Gift card balance + top-up
- Split bill: share link → friends pay their share via app
- Digital receipt: stored in app + email

Loyalty Wallet:
- Unified balance across all brands in network
- Point history + transaction log
- Tier status + progress to next tier
- Available rewards: list + redeem
- Cross-brand transfer: send points to friend or family member

AI-Personalized Offers:
- Offers generated based on: visit history, preferences, time of day, location proximity
- "You haven't visited in 3 weeks — here's 20% off your next visit at Brand X"
- "It's raining. Your nearest Brand Y is quiet — 15% off if you arrive in 30min"
- Opt-out from personalization: GDPR-compliant with full granular control

Review + Feedback:
- Post-visit review: 1-5 stars + free text + photo
- AI sentiment analysis routes negative reviews to manager immediately
- Manager response visible in app
- Tip directly in app after visit (goes to staff tip pool or individual)
- NPS survey: quick 1-question after each visit

Gamification:
- Missions: "Visit 3 times this month → unlock Gold status weekend"
- Challenges: "Try 5 different cuisines this year → special badge"
- Streaks: visit every week → streak counter + bonus points
- Leaderboard: among friends (opt-in) → who has the most points this month?
- Achievements: "First visit", "Night owl", "Foodie explorer", "100th order" — with visual badges

TECH:
- React Native (Expo) iOS + Android
- Offline: saved restaurant menus, active reservations, loyalty balance
- Push notifications: order updates, offers, reservation reminders
- Deep links: restaurant shares link → opens specific menu/reservation page in app
- Universal links: web version for users without app installed (same features, PWA)
- Privacy center: full GDPR controls, consent management, data export, account deletion`
  },
  {
    id: "kds-interfaces",
    emoji: "🍳",
    title: "KDS + ALL 15 INTERFACES",
    color: "#EF4444", tier: "CORE",
    content: `KDS (Kitchen+Bar Display):
- Fullscreen grid, configurable columns, filter by station
- Card: order#, table/platform, virtual brand badge, items, elapsed time, countdown timer
- Colors: 🟢 0-5min | 🟡 5-12min | 🔴 12min+ (pulse) | ⚫ done
- Product aggregation across orders in configurable time window
- Station workload bar: current load % from AI workload balancing system
- Actions: tap item=ready → tap order=READY → POP-UP on waiter tablets + sound
- POP-UP: not acknowledged in 2min → escalate to supervisor
- Stats: avg prep time, completed/hour, late count, load vs capacity

ALL 15 INTERFACES:
1. ADMIN — full access, tenant config, user management, audit log, AI dashboard, plugin management, theme builder
2. SUPERVISOR — waiter+ | void (mandatory reason) | price override | real-time revenue | staff efficiency view | risk alerts
3. WAITER (web+mobile) — floor plan (turnover predictions+status) | order management | POP-UP READY notifications | split bill | internal chat | loyalty lookup
4. POS — fullscreen touch, barcode scanner, CRM lookup, loyalty redemption, multi-payment, cash drawer, ESC/POS printer, keyboard shortcuts
5. KIOSK — fullscreen self-service, AI upsell, card terminal, allergen filter, voice ordering, WCAG 2.1 AA, idle promos
6. KDS KITCHEN — station-specific, workload display, aggregation
7. KDS BAR — bar-specific, quick items focus
8. TV MENU — HD/4K digital signage, smart content engine, live updates, QR overlay, promo videos, weather-responsive content
9. QUEUE MONITOR — order number display (McDonald's style), Redis queue, sound chime, animations
10. CUSTOMER DISPLAY — real-time items+total at POS, idle promotions
11. GARDEROBA — ticket system, claim print, unclaimed report
12. LAUNDRY — linen tracking per room, billing per piece/kg
13. RESERVATIONS — calendar+floor plan view, auto-confirm (email/SMS/WhatsApp/VoiceAI), waitlist, no-show scoring, chatbot reservations
14. HQ WAR ROOM — 200-location live control center, alerting, remote actions (separate app)
15. FRANCHISE DASHBOARD — standards, benchmarking, royalties, compliance, mystery shopper`
  },
  {
    id: "delivery",
    emoji: "🚗",
    title: "DELIVERY + DISPATCH + COURIER",
    color: "#FB923C", tier: "CORE",
    content: `DISPATCH: Live map (all couriers + orders) | Auto-assign (nearest+TSP route) | Manual override | ETA (traffic API) | Status pipeline | Auto-SMS tracking to customer | Zone polygons with fee+minOrder+ETA | Courier efficiency scores on map

COURIER APP (React Native): Biometric login | AVAILABLE/BUSY/OFFLINE | Order notification (30s accept/reject) | In-app navigation + multi-stop route optimization | Geofencing auto check-in+confirm | Proof of delivery (photo+signature) | Cash tracking | Earnings dashboard | Offline sync queue | Burnout risk score visible to dispatcher

AGGREGATORS: GLOVO+BOLT+WOLT+TAZZ webhook receivers → all→internal Order model → tablet accept/reject (configurable timer) → menu+availability sync all platforms simultaneously → platform fee tracking per order per brand

CUSTOMER: SMS tracking URL → live map page (no app) → push notifications (if app) → PDF receipt (McDonald's style with QR) → delivery rating → feeds courier efficiency score`
  },
  {
    id: "fiscal",
    emoji: "🧾",
    title: "FISCAL + ACCOUNTING",
    color: "#34D399", tier: "CORE",
    content: `DOCUMENTS (all PDF + cloud + audit trail): BON FISCAL | FACTURĂ FISCALĂ | FACTURĂ PROFORMĂ | NIR | BON CONSUM | TRANSFER GESTIUNI | RETUR FURNIZOR | AVIZ ÎNSOȚIRE | INVENTAR | RAPORT Z | RAPORT X | DECLARAȚIE ALERGENI | FIȘĂ TEHNOLOGICĂ | PLAN HACCP

ANAF: e-Factura XML auto-submit (OAuth2) | e-Transport for deliveries above threshold | retry + status dashboard | RO e-Invoice format

SAGA: .csv direct import | journals: cumpărări+vânzări | stock movements | configurable account mappings | auto-export monthly + manual

FISCAL PRINTERS (ESC/POS TCP/IP or Serial): Datecs DP-150/WP-500/FMP-350 | Epson TM-T88 | Star TSP 700/800 | Sunmi T2/V2 Pro | Generic ESC/POS auto-detect | Commands: drawer open, print, cancel, Z-report, X-report

PAYMENTS: Stripe | Adyen | Worldline | Netopia | PayU | Apple Pay | Google Pay | Cash | Card terminal (Datecs/Ingenico/PAX) | Voucher | QR Pay | Room Charge | BNPL (Klarna/Afterpay) | Gift Card | Crypto (optional)
Price types: NORMAL | DISCOUNT (%) | VIP | PROTOCOL (zero)
Split bill: N customers, mixed payment methods per person`
  },
  {
    id: "inventory",
    emoji: "📦",
    title: "INVENTORY + STOCK + SUPPLY CHAIN",
    color: "#14B8A6", tier: "CORE",
    content: `INGREDIENTS: auto-code (ING-001), name, unit, category, costPrice, avgWeightedPrice, minStock, allergens[], additives[], expiryAlert, supplierReliabilityScore. Allergens (14 EU) + E-additives AUTO-CALCULATED recipe→product.

RECIPES+SUBRECIPES: product→ingredients (qty+unit+waste%). SubRecipe reusable. Auto-calc: food cost/portion, gross margin%. Fișă tehnologică PDF. Yield tracking. menuEngCategory assigned by Revenue Science AI.

MULTI-WAREHOUSE: unlimited per location. All movements: who+when+what+qty+reason+document ref. FIFO/LIFO per warehouse. Lot+expiry per batch = full trasabilitate.

MOVEMENTS: NIR (stock+document) | Production (auto-decreases from recipes on order complete) | Manual consumption | Transfer (supervisor approval) | Supplier return (with NIR ref) | Waste (HACCP tracking)

CROSS-LOCATION SUPPLY CHAIN: surplus detection network-wide → internal transfer suggestion | price volatility monitoring | supplier reliability scoring | central contract optimization | auto purchase orders on reorder | EDI integration for major suppliers

ALERTS: stock below minimum | expiry within X days | supplier price change | auto-purchase order at reorder point | cross-location surplus available`
  },
  {
    id: "infra-selfhealing",
    emoji: "⚡",
    title: "AUTO-SCALING + SELF-HEALING INFRA",
    color: "#22C55E", tier: "ENTERPRISE",
    content: `KEDA AUTO-SCALING (PREDICTIVE + REACTIVE):
- Scale API pods: based on Redis queue depth, CPU%, memory%, WebSocket connections, requests/sec
- Pre-warming: AI demand forecast → scale UP 30min before predicted peak (not reactive, predictive)
- Scale-to-zero: inactive tenants (Starter plan) scale to 0 during off-hours → auto-wake on first request
- Per-tenant isolation: high-traffic tenant scales independently from others
- Cost alert: if scaling costs exceed budget threshold → notify admin

SELF-HEALING INFRASTRUCTURE:
- Health check every 10s: all services (API, queue workers, Socket.io, fiscal services)
- Auto-restart: failed container auto-restarts (K8s restartPolicy=Always) with exponential backoff
- Circuit breaker (opossum library): if external service (ANAF, PSP, aggregator) fails → open circuit → fallback behavior → retry when recovered
- Bulkhead pattern: each tenant's queue workers isolated → one tenant's spike cannot starve others
- Chaos Engineering (LitmusChaos): scheduled random failure injection in staging → validates self-healing
- Runbooks: automated incident response for common failure patterns

DATABASE HA:
- PostgreSQL primary + 2 read replicas (analytics → replica, transactions → primary)
- PgBouncer connection pooling
- Cross-region failover: if primary region goes down → promote replica in secondary region (RTO <2min)
- PITR: point-in-time recovery up to 30 days
- Monthly restore test: automated test that validates backup restoration

OFFLINE-FIRST LOCAL NODE:
- Critical locations (high-revenue) can deploy local node: Raspberry Pi 5 or mini-PC
- Local node runs: PostgreSQL (last 24h sync), Redis, POS+KDS+Waiter PWA
- Operates fully independently during internet outage
- Sync: when internet restored → bidirectional sync with cloud (conflict resolution: timestamp+server-wins for inventory)
- Visual indicator on all interfaces: 🟢 Cloud | 🟠 Local Node | 🔴 Fully Offline

MONITORING:
- Grafana: per-tenant traffic, API latency p50/p95/p99, queue depth, DB connections, scaling events
- Prometheus alerts: API p95 >500ms, error rate >1%, queue stuck >5min, pod restart >3x/hour
- Loki: structured logs searchable by tenantId+userId+orderId+requestId
- Sentry: real-time errors with full context (tenant, user, request, stack trace)
- SLA: 99.9% uptime = max 8.7h downtime/year. Automated incident response + post-mortems.`
  },
  {
    id: "rules",
    emoji: "📋",
    title: "CODING RULES + BUILD ORDER",
    color: "#64748B", tier: "CORE",
    content: `NON-NEGOTIABLE RULES:
✅ TypeScript strict, zero 'any', no implicit any
✅ All routes validated with Zod (request + response schemas)
✅ All errors caught+logged (Winston structured JSON), zero unhandled rejections
✅ Every CUD operation → AuditLog (userId, ip, device, old, new, tenantId)
✅ tenantId injected at Fastify middleware level, on every Prisma query
✅ AG Grid for ALL tabular data (no custom tables ever)
✅ Monetary values as integers (cents) throughout — format only at display layer
✅ Dates stored UTC, displayed in tenant's configured timezone
✅ OpenAPI 3.0 auto-generated for every endpoint (fastify-swagger)
✅ Unit tests 80%+ coverage (Vitest) — business logic priority
✅ E2E tests for: full order→KDS→payment→fiscal receipt (Playwright)
✅ Docker Compose: full local env (PostgreSQL+Redis+all apps) — one command startup
✅ Seed: realistic Romanian restaurant demo data (5 locations, 3 virtual brands, 50 products, 200 orders)
✅ Feature flags for experimental features (never deploy broken features to tenants)
✅ WCAG 2.1 AA for all public interfaces (kiosk, online ordering, SuperApp)
✅ PCI DSS: tokenize cards, never store raw card data, no card data in logs
✅ GDPR: consent tracking, data export API, right to erasure (cascading delete via events)
✅ No console.log in production. No TODO without GitHub issue number. No hardcoded values.
✅ All secrets in environment variables / K8s secrets — never in code or git
✅ API rate limiting + brute force protection on auth endpoints
✅ Plugin sandbox: plugins cannot access cross-tenant data (enforced, not just documented)

BUILD ORDER (follow strictly):
Phase 1 — Foundation:
  1. Prisma schema (all models) + TimescaleDB setup + seed data
  2. Fastify API: auth + tenant middleware + RBAC + AuditLog
  3. Core endpoints: products, categories, tables, orders, payments
  4. BullMQ queue workers: order processing pipeline
  5. Socket.io: real-time rooms, events, heartbeat

Phase 2 — Critical Interfaces:
  6. POS interface (highest revenue impact)
  7. KDS interface (kitchen operations)
  8. Waiter app (web + React Native)
  9. Fiscal: ANAF + ESC/POS printers + SAGA

Phase 3 — Operations:
  10. Inventory + NIR module + multi-warehouse
  11. Delivery + Dispatch + Courier app
  12. CRM + Loyalty + Reservations
  13. Aggregators: GLOVO + BOLT + WOLT + TAZZ

Phase 4 — Intelligence:
  14. AI: workload balancing + demand forecast + staff scoring
  15. Revenue Science: menu engineering + elasticity + A/B pricing
  16. Risk Engine: fraud + shrinkage + collusion detection
  17. Financial Control: daily P&L + cash reconciliation + EBITDA

Phase 5 — Scale:
  18. Franchise Dashboard + HQ War Room
  19. Dark Kitchen + Virtual Brand mode
  20. Digital Identity Layer (Universal Guest ID)
  21. Payment Orchestration Engine (multi-PSP)
  22. Supply Chain Intelligence

Phase 6 — Ecosystem:
  23. Plugin system + Plugin Marketplace + Public API
  24. Developer Portal + API monetization
  25. Data Network (anonymized benchmarking)
  26. Experience Engine (IoT ambient control)
  27. SuperApp (customer-facing React Native)

Phase 7 — Production:
  28. Theme Engine + UI Builder (no-code)
  29. Multi-language i18n (RO+EN first, RTL-ready)
  30. Auto-scaling (KEDA) + Self-healing + Chaos testing
  31. CI/CD pipeline (GitHub Actions) + K8s Helm deployment
  32. k6 load testing: 1000 concurrent users, 50k orders/day, 200 locations

PERFORMANCE TARGETS:
Page load <1.5s LCP | API read <200ms p95 | Order placement <500ms E2E | KDS update <100ms | WebSocket reconnect <3s | 99.9% uptime SLA | Support 200 locations simultaneously

THIS SYSTEM MUST BE ARCHITECTED SO IT CAN EVOLVE INTO A MODULAR HOSPITALITY OPERATING SYSTEM (HOS), SUPPORTING RESTAURANTS, HOTELS, BARS, CLUBS, DARK KITCHENS, FOOD COURTS, AND FRANCHISE CHAINS GLOBALLY.`
  }
];

const TIER_ORDER = ["CORE", "PREMIUM", "ENTERPRISE", "PLATINUM", "ULTIMATE"];

export default function HORECASuperPrompt() {
  const [openId, setOpenId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);
  const [search, setSearch] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [filterTier, setFilterTier] = useState("ALL");

  const fullText = sections.map(s =>
    `${"=".repeat(80)}\n${s.emoji} [${s.tier}] ${s.title}\n${"=".repeat(80)}\n\n${s.content}`
  ).join("\n\n");

  const copyFull = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copySection = (s, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${s.emoji} ${s.title}\n\n${s.content}`);
    setCopiedSection(s.id);
    setTimeout(() => setCopiedSection(null), 1500);
  };

  const filtered = sections.filter(s => {
    const matchesTier = filterTier === "ALL" || s.tier === filterTier;
    const matchesSearch = !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const isOpen = (id) => expandAll || openId === id;

  const highlight = (text) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} style={{ background: "#fbbf2450", color: "#fbbf24", borderRadius: 2, padding: "0 1px" }}>{p}</mark>
        : p
    );
  };

  const tierCounts = TIER_ORDER.reduce((acc, t) => {
    acc[t] = sections.filter(s => s.tier === t).length;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace", background: "#080810", minHeight: "100vh", color: "#CBD5E1", padding: "16px 20px" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#0e0e2a 0%,#141430 50%,#0a1628 100%)", border: "1px solid #1e1e4e", borderRadius: 16, padding: "28px 32px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 400, height: 400, background: "radial-gradient(ellipse,#6366f115 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 5, color: "#6366f1", fontWeight: 900, marginBottom: 6 }}>
              WORLD'S MOST COMPLETE · AI CODING PROMPT · v3.0 ULTIMATE
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#f8fafc", letterSpacing: -1 }}>
              🍽️ HOSPITALITY OPERATING SYSTEM
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#475569" }}>
              HOS · White-label · Multi-tenant · Cloud+Offline · 200 Locations · Cross-brand · Global
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
              {["React","TypeScript","Vite","Prisma","AG Grid","Tailwind","Zustand","Node.js","Redis","BullMQ","Socket.io","React Native","TimescaleDB","KEDA","OpenAI"].map(t => (
                <span key={t} style={{ background: "#1e1b4b", border: "1px solid #3730a380", borderRadius: 4, padding: "1px 7px", fontSize: 10, color: "#a5b4fc" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
            <button onClick={copyFull} style={{ background: copied ? "#065f46" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", border: "none", borderRadius: 8, padding: "11px 20px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 800, letterSpacing: 0.5 }}>
              {copied ? "✅ FULL PROMPT COPIED!" : "📋 COPY FULL PROMPT"}
            </button>
            <button onClick={() => setExpandAll(!expandAll)} style={{ background: "transparent", color: "#475569", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
              {expandAll ? "⊖ Collapse all" : "⊕ Expand all"}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
          {[["45+","MODULES"],["60+","DB MODELS"],["15","INTERFACES"],["30+","INTEGRATIONS"],["9","ORDER CHANNELS"],["15","NEW AI LAYERS"],["200","MAX LOCATIONS"]].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#818cf8", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: "#334155", letterSpacing: 2, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TIER LEGEND */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1e1e3e", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginRight: 4 }}>FILTER:</span>
        <button onClick={() => setFilterTier("ALL")} style={{ background: filterTier === "ALL" ? "#1e293b" : "transparent", color: filterTier === "ALL" ? "#f1f5f9" : "#475569", border: `1px solid ${filterTier === "ALL" ? "#334155" : "#1e293b"}`, borderRadius: 6, padding: "3px 12px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 700 }}>
          ALL ({sections.length})
        </button>
        {TIER_ORDER.map(tier => {
          const t = TIERS[tier];
          const active = filterTier === tier;
          return (
            <button key={tier} onClick={() => setFilterTier(tier)} style={{ background: active ? t.bg : "transparent", color: active ? t.color : "#475569", border: `1px solid ${active ? t.color + "60" : "#1e293b"}`, borderRadius: 6, padding: "3px 12px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 700 }}>
              {tier} ({tierCounts[tier]})
            </button>
          );
        })}
      </div>

      {/* HOW TO USE */}
      <div style={{ background: "#091520", border: "1px solid #0c2a3d", borderRadius: 10, padding: "14px 18px", marginBottom: 12, fontSize: 11 }}>
        <div style={{ color: "#38bdf8", fontWeight: 800, letterSpacing: 2, marginBottom: 8, fontSize: 10 }}>📖 HOW TO USE THIS PROMPT</div>
        <div style={{ color: "#475569", lineHeight: 2 }}>
          <span style={{ color: "#fcd34d" }}>GITHUB COPILOT:</span> Copilot Chat → paste → <span style={{ color: "#86efac" }}>"@workspace implement [MODULE NAME] following this spec"</span><br/>
          <span style={{ color: "#fcd34d" }}>CURSOR:</span> Cmd+L → paste → <span style={{ color: "#86efac" }}>"Start with Phase 1: Prisma schema"</span> · then work through each Phase<br/>
          <span style={{ color: "#fcd34d" }}>WINDSURF/AIDER:</span> Save as <span style={{ color: "#86efac" }}>SPEC.md</span> in project root → <span style={{ color: "#86efac" }}>"Read SPEC.md then implement [section]"</span><br/>
          <span style={{ color: "#fcd34d" }}>BEST PRACTICE:</span> Use TIER filter to scope what you're building now. Build <span style={{ color: "#86efac" }}>CORE</span> first, then <span style={{ color: "#f59e0b" }}>PREMIUM</span>, then <span style={{ color: "#6366f1" }}>ENTERPRISE</span>, etc.
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="🔍 Search entire spec (e.g. ANAF, KDS, Prisma, loyalty, voice, franchise...)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", background: "#0d0d1a", border: "1px solid #1e1e3e", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
      />

      {/* SECTIONS */}
      {filtered.map(s => {
        const open = isOpen(s.id);
        const tier = TIERS[s.tier];
        const hasMatch = search && (s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));

        return (
          <div key={s.id} style={{ background: "#0d0d1a", border: `1px solid ${open ? s.color + "55" : hasMatch ? s.color + "30" : "#1a1a2e"}`, borderRadius: 10, marginBottom: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
            <div
              onClick={() => !expandAll && setOpenId(open ? null : s.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: expandAll ? "default" : "pointer", background: open ? `${s.color}08` : "transparent", borderLeft: `3px solid ${s.color}` }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{s.emoji}</span>
                <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: 0.5, color: s.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
                <span style={{ fontSize: 8, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}40`, padding: "1px 6px", borderRadius: 4, fontWeight: 900, letterSpacing: 1, flexShrink: 0 }}>{s.tier}</span>
                {hasMatch && <span style={{ fontSize: 8, color: "#fbbf24", background: "#fbbf2420", padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>MATCH</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button onClick={e => copySection(s, e)} style={{ background: "transparent", border: "1px solid #1e293b", borderRadius: 5, padding: "3px 8px", color: copiedSection === s.id ? s.color : "#374151", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>
                  {copiedSection === s.id ? "✓" : "copy"}
                </button>
                {!expandAll && <span style={{ color: "#1e293b", fontSize: 12 }}>{open ? "▲" : "▼"}</span>}
              </div>
            </div>

            {open && (
              <div style={{ padding: "0 16px 16px" }}>
                <pre style={{ background: "#060608", border: "1px solid #111827", borderRadius: 7, padding: "14px 16px", fontSize: 11, lineHeight: 1.8, color: "#7c8fa8", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "inherit" }}>
                  {highlight(s.content)}
                </pre>
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#1e293b", fontSize: 13 }}>
          No sections match "{search}" in tier "{filterTier}"
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 24, color: "#1e293b", fontSize: 9, letterSpacing: 2, lineHeight: 2 }}>
        HOSPITALITY OPERATING SYSTEM · ULTIMATE SPEC v3.0<br/>
        45+ MODULES · 60+ DB MODELS · 15 INTERFACES · 200 LOCATIONS<br/>
        <span style={{ color: "#312e81" }}>Surpasses: Freya · Boogit · Toast · Lightspeed · Oracle MICROS · Deliverect · SevenRooms · Amadeus · OpenTable · Revel · Square</span>
      </div>
    </div>
  );
}
