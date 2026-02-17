const BusinessService = require('./services/BusinessService');
const { BusinessType } = require('./models/Business');
const { OrderStatus } = require('./models/Order');
const { PaymentMethod } = require('./models/Payment');
const { DiscountType } = require('./models/Discount');
const DisplayUtils = require('./utils/DisplayUtils');

/**
 * Universal Application for Restaurants, Cafes, and Fast-Food Establishments
 * Aplicatie Universala pentru Restaurante, Cafenele, si Fast-Food
 */

// Initialize the business service
const businessService = new BusinessService();

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                                                               ║');
console.log('║     UNIVERSAL APPLICATION FOR RESTAURANTS & CAFES             ║');
console.log('║     Aplicatie Universala pentru Restaurante, Cafenele        ║');
console.log('║                   si Fast-Food                                ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Demo: Create different types of businesses
console.log('Creating businesses...\n');

// 1. Create a Restaurant
const restaurant = businessService.createBusiness(
  'La Strada',
  BusinessType.RESTAURANT,
  'Str. Victoriei Nr. 25, Bucuresti',
  '+40 21 123 4567'
);
console.log(`✓ Created restaurant: ${restaurant.name}`);

// 2. Create a Cafe
const cafe = businessService.createBusiness(
  'Cafe Boheme',
  BusinessType.CAFE,
  'Str. Franceza Nr. 10, Cluj-Napoca',
  '+40 264 987 6543'
);
console.log(`✓ Created cafe: ${cafe.name}`);

// 3. Create a Fast-Food
const fastfood = businessService.createBusiness(
  'Quick Bite',
  BusinessType.FASTFOOD,
  'Bulevardul Magheru Nr. 50, Bucuresti',
  '+40 21 555 1234'
);
console.log(`✓ Created fast-food: ${fastfood.name}`);

// Demo with Restaurant: La Strada
DisplayUtils.displayHeader('RESTAURANT: LA STRADA');

// Add menu items to restaurant
console.log('Adding menu items to restaurant...\n');
businessService.addMenuItem(restaurant.id, 'Supa de vita', 'Traditional Romanian beef soup', 25.00, 'appetizer');
businessService.addMenuItem(restaurant.id, 'Sarmale', 'Cabbage rolls with polenta and sour cream', 45.00, 'main');
businessService.addMenuItem(restaurant.id, 'Mici cu mustar', 'Grilled minced meat rolls with mustard', 35.00, 'main');
businessService.addMenuItem(restaurant.id, 'Papanasi', 'Traditional Romanian doughnuts with jam', 20.00, 'dessert');
businessService.addMenuItem(restaurant.id, 'Vin alb', 'White wine - glass', 15.00, 'beverage');
businessService.addMenuItem(restaurant.id, 'Bere la draft', 'Draft beer - 500ml', 12.00, 'beverage');
console.log('✓ Menu items added');

// Display restaurant info
const restaurantInfo = businessService.getBusiness(restaurant.id).getInfo();
DisplayUtils.displayBusinessInfo(restaurantInfo);

// Display menu
const restaurantMenu = businessService.getMenu(restaurant.id);
DisplayUtils.displayMenu(restaurantMenu);

// Add tables to restaurant
console.log('Setting up tables...\n');
businessService.addTable(restaurant.id, 1, 2);
businessService.addTable(restaurant.id, 2, 4);
businessService.addTable(restaurant.id, 3, 4);
businessService.addTable(restaurant.id, 4, 6);
businessService.addTable(restaurant.id, 5, 8);
console.log('✓ Tables configured');

const restaurantTables = businessService.getTables(restaurant.id);
DisplayUtils.displayTables(restaurantTables);

// Create orders
console.log('Processing orders...\n');

// Order 1: Table 2
const menuItems = businessService.getBusiness(restaurant.id).menu;
const order1 = businessService.createOrder(restaurant.id, 2, [
  { menuItemId: menuItems[0].id, quantity: 2 }, // Supa de vita x2
  { menuItemId: menuItems[1].id, quantity: 2 }, // Sarmale x2
  { menuItemId: menuItems[5].id, quantity: 2 }  // Bere x2
]);
console.log(`✓ Order created: ${order1.id} for Table 2`);

// Order 2: Table 4
const order2 = businessService.createOrder(restaurant.id, 4, [
  { menuItemId: menuItems[0].id, quantity: 3 }, // Supa x3
  { menuItemId: menuItems[2].id, quantity: 3 }, // Mici x3
  { menuItemId: menuItems[3].id, quantity: 3 }, // Papanasi x3
  { menuItemId: menuItems[4].id, quantity: 2 }  // Vin x2
]);
console.log(`✓ Order created: ${order2.id} for Table 4`);

// Display all orders
const allOrders = businessService.getOrders(restaurant.id);
DisplayUtils.displayOrders(allOrders);

// Display detailed order information
DisplayUtils.displayOrderDetails(businessService.getOrderDetails(restaurant.id, order1.id));

// Create discounts
console.log('Creating promotional discounts...\n');
const discount1 = businessService.createDiscount('SAVE10', DiscountType.PERCENTAGE, 10, '10% off entire order');
console.log(`✓ Created discount: ${discount1.code} - ${discount1.description}`);

const discount2 = businessService.createDiscount('SUMMER25', DiscountType.FIXED, 25.00, '25 RON off');
console.log(`✓ Created discount: ${discount2.code} - ${discount2.description}`);

// Apply discount to order 2
console.log('\nApplying discount to order...\n');
businessService.applyDiscount(restaurant.id, order2.id, 'SAVE10');
console.log(`✓ Discount applied to order ${order2.id}`);

// Display updated order with discount
DisplayUtils.displayOrderDetails(businessService.getOrderDetails(restaurant.id, order2.id));

// Update order status
console.log('Updating order status...\n');
businessService.updateOrderStatus(restaurant.id, order1.id, OrderStatus.PREPARING);
console.log(`✓ Order ${order1.id} is now PREPARING`);
businessService.updateOrderStatus(restaurant.id, order1.id, OrderStatus.READY);
console.log(`✓ Order ${order1.id} is now READY`);

// Process payment for order 1
console.log('\nProcessing payment...\n');
const payment1 = businessService.processPayment(
  restaurant.id,
  order1.id,
  200.00,
  PaymentMethod.CARD,
  'Ion Popescu'
);
console.log(`✓ Payment processed: ${payment1.amount} RON via ${payment1.method}`);

// Display order after payment
DisplayUtils.displayOrderDetails(businessService.getOrderDetails(restaurant.id, order1.id));

// Process payment for order 2
businessService.updateOrderStatus(restaurant.id, order2.id, OrderStatus.PREPARING);
businessService.updateOrderStatus(restaurant.id, order2.id, OrderStatus.READY);
const payment2 = businessService.processPayment(
  restaurant.id,
  order2.id,
  300.00,
  PaymentMethod.CASH
);
console.log(`✓ Payment processed for order ${order2.id}: ${payment2.amount} RON via ${payment2.method}\n`);

// Display updated tables status
console.log('\n');
const updatedTables = businessService.getTables(restaurant.id);
DisplayUtils.displayTables(updatedTables);

// Display statistics
const stats = businessService.getStatistics(restaurant.id);
DisplayUtils.displayStatistics(stats);

// Demo with Cafe
DisplayUtils.displayHeader('CAFE: CAFE BOHEME');

// Add menu items to cafe
console.log('Adding menu items to cafe...\n');
businessService.addMenuItem(cafe.id, 'Espresso', 'Strong Italian coffee', 8.00, 'beverage');
businessService.addMenuItem(cafe.id, 'Cappuccino', 'Espresso with steamed milk foam', 12.00, 'beverage');
businessService.addMenuItem(cafe.id, 'Latte', 'Espresso with steamed milk', 14.00, 'beverage');
businessService.addMenuItem(cafe.id, 'Croissant', 'Buttery French pastry', 10.00, 'dessert');
businessService.addMenuItem(cafe.id, 'Cheesecake', 'New York style cheesecake', 18.00, 'dessert');
console.log('✓ Menu items added');

const cafeInfo = businessService.getBusiness(cafe.id).getInfo();
DisplayUtils.displayBusinessInfo(cafeInfo);

const cafeMenu = businessService.getMenu(cafe.id);
DisplayUtils.displayMenu(cafeMenu);

// Demo with Fast-Food
DisplayUtils.displayHeader('FAST-FOOD: QUICK BITE');

// Add menu items to fast-food
console.log('Adding menu items to fast-food...\n');
businessService.addMenuItem(fastfood.id, 'Burger Classic', 'Beef burger with lettuce and tomato', 22.00, 'main');
businessService.addMenuItem(fastfood.id, 'Cheeseburger', 'Burger with cheese', 25.00, 'main');
businessService.addMenuItem(fastfood.id, 'Cartofi prajiti', 'French fries - large', 12.00, 'appetizer');
businessService.addMenuItem(fastfood.id, 'Chicken Nuggets', '8 pieces with sauce', 18.00, 'main');
businessService.addMenuItem(fastfood.id, 'Cola', 'Soft drink - 500ml', 8.00, 'beverage');
businessService.addMenuItem(fastfood.id, 'Milkshake', 'Chocolate or vanilla', 15.00, 'beverage');
console.log('✓ Menu items added');

const fastfoodInfo = businessService.getBusiness(fastfood.id).getInfo();
DisplayUtils.displayBusinessInfo(fastfoodInfo);

const fastfoodMenu = businessService.getMenu(fastfood.id);
DisplayUtils.displayMenu(fastfoodMenu);

// Summary of all businesses
DisplayUtils.displayHeader('SUMMARY - ALL BUSINESSES');
const allBusinesses = businessService.getAllBusinesses();
console.log(`Total businesses managed: ${allBusinesses.length}\n`);
allBusinesses.forEach(biz => {
  console.log(`  • ${biz.name} (${biz.type.toUpperCase()})`);
  console.log(`    Menu items: ${biz.menuItems} | Tables: ${biz.tables} | Orders: ${biz.orders}`);
  console.log('');
});

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                                                               ║');
console.log('║          Application successfully demonstrated!               ║');
console.log('║     Aplicatia a fost demonstrata cu succes!                   ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');
