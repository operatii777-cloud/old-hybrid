# Old Hybrid - Universal Restaurant Application

## Aplicatie Universala pentru Restaurante, Cafenele si Fast-Food

A comprehensive universal application for managing restaurants, cafes, and fast-food establishments. This system provides complete functionality for menu management, order processing, table management, and business statistics.

## Features / Functionalitati

### 🏪 Multi-Business Support
- **Restaurant** - Full-service dining establishments
- **Cafe** - Coffee shops and cafes
- **Fast-Food** - Quick service restaurants

### 📋 Menu Management
- Create and manage menu items
- Categorize items (appetizers, mains, desserts, beverages)
- Set prices and availability
- Update menu items dynamically

### 🍽️ Order Management
- Create customer orders
- Track order status (pending, preparing, ready, delivered, cancelled)
- Calculate order totals automatically
- View detailed order information
- Associate orders with tables

### 🪑 Table Management
- Configure tables with capacity
- Track table occupancy status
- Link orders to specific tables
- Automatic table management (occupy/vacate)

### 📊 Business Statistics
- Total orders and revenue tracking
- Orders by status breakdown
- Table occupancy statistics
- Business performance metrics

## Installation / Instalare

```bash
# Clone the repository
git clone <repository-url>
cd old-hybrid

# Install dependencies (if any added in future)
npm install
```

## Usage / Utilizare

### Running the Application

```bash
# Start the application
npm start

# Or run directly with Node.js
node src/index.js
```

### Demo Output
The application includes a comprehensive demonstration that:
1. Creates three different business types (restaurant, cafe, fast-food)
2. Adds menu items to each business
3. Sets up table configurations
4. Processes orders
5. Updates order statuses
6. Displays statistics and summaries

## Project Structure / Structura Proiectului

```
old-hybrid/
├── src/
│   ├── models/              # Data models
│   │   ├── Business.js      # Business entity (restaurant/cafe/fastfood)
│   │   ├── MenuItem.js      # Menu item entity
│   │   ├── Order.js         # Order entity with status tracking
│   │   └── Table.js         # Table entity
│   ├── services/            # Business logic layer
│   │   └── BusinessService.js  # Main service for all operations
│   ├── utils/               # Utility functions
│   │   └── DisplayUtils.js  # Console display utilities
│   └── index.js             # Main application entry point
├── package.json             # Project configuration
└── README.md               # This file
```

## API / Interfata

### BusinessService Methods

#### Business Operations
- `createBusiness(name, type, address, phone)` - Create a new business
- `getBusiness(businessId)` - Get business by ID
- `getAllBusinesses()` - Get all businesses
- `getStatistics(businessId)` - Get business statistics

#### Menu Operations
- `addMenuItem(businessId, name, description, price, category)` - Add menu item
- `getMenu(businessId)` - Get all menu items

#### Table Operations
- `addTable(businessId, tableNumber, capacity)` - Add a table
- `getTables(businessId)` - Get all tables

#### Order Operations
- `createOrder(businessId, tableNumber, items)` - Create new order
- `updateOrderStatus(businessId, orderId, newStatus)` - Update order status
- `getOrders(businessId, status)` - Get orders (optionally filtered by status)
- `getOrderDetails(businessId, orderId)` - Get detailed order information

## Business Types / Tipuri de Business

The application supports three business types:
- `BusinessType.RESTAURANT` - Traditional restaurants
- `BusinessType.CAFE` - Coffee shops and cafes
- `BusinessType.FASTFOOD` - Fast-food establishments

## Order Status Flow / Flux Status Comanda

Orders progress through the following statuses:
1. `PENDING` - Order placed, awaiting preparation
2. `PREPARING` - Order is being prepared
3. `READY` - Order ready for delivery/pickup
4. `DELIVERED` - Order delivered to customer
5. `CANCELLED` - Order cancelled

## Example Use Case / Exemplu de Utilizare

```javascript
const businessService = new BusinessService();

// Create a restaurant
const restaurant = businessService.createBusiness(
  'La Strada',
  BusinessType.RESTAURANT,
  'Str. Victoriei Nr. 25',
  '+40 21 123 4567'
);

// Add menu items
businessService.addMenuItem(
  restaurant.id,
  'Sarmale',
  'Traditional cabbage rolls',
  45.00,
  'main'
);

// Add tables
businessService.addTable(restaurant.id, 1, 4);

// Create an order
const order = businessService.createOrder(restaurant.id, 1, [
  { menuItemId: menuItem.id, quantity: 2 }
]);

// Update order status
businessService.updateOrderStatus(
  restaurant.id,
  order.id,
  OrderStatus.PREPARING
);
```

## Technologies / Tehnologii

- **Node.js** - JavaScript runtime
- **Pure JavaScript** - No external dependencies for core functionality
- **Object-Oriented Design** - Clean, maintainable architecture

## Future Enhancements / Imbunatatiri Viitoare

Potential additions:
- Web interface (React/Vue)
- Database integration (MongoDB/PostgreSQL)
- User authentication and roles
- Payment processing
- Reporting and analytics
- Multi-language support
- Mobile application
- Kitchen display system
- Reservation management

## License / Licenta

MIT

## Contributing / Contributii

Contributions are welcome! Please feel free to submit pull requests or open issues.

---

**Note**: This is a demonstration application showcasing the core functionality of a universal restaurant management system. It can be extended and customized based on specific business requirements.
