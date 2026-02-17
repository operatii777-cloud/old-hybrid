/**
 * Display utilities for console output
 */
class DisplayUtils {
  static displayBusinessInfo(business) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  ${business.name.toUpperCase()}`);
    console.log(`  Type: ${business.type.toUpperCase()}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Address: ${business.address}`);
    console.log(`  Phone: ${business.phone}`);
    console.log(`  Menu Items: ${business.menuItems}`);
    console.log(`  Tables: ${business.tables}`);
    console.log(`  Orders: ${business.orders}`);
    console.log('═══════════════════════════════════════════════════════\n');
  }

  static displayMenu(menuItems) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                      MENU                             ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    const categories = {};
    menuItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    Object.keys(categories).forEach(category => {
      console.log(`\n  ═ ${category.toUpperCase()} ═`);
      categories[category].forEach(item => {
        const status = item.available ? '✓' : '✗';
        console.log(`  ${status} ${item.name.padEnd(30)} ${item.price.toFixed(2)} RON`);
        console.log(`     ${item.description}`);
      });
    });
    console.log('\n');
  }

  static displayTables(tables) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                    TABLES                             ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    tables.forEach(table => {
      const status = table.occupied ? '🔴 OCCUPIED' : '🟢 AVAILABLE';
      console.log(`  Table ${table.number} (${table.capacity} seats): ${status}`);
    });
    console.log('\n');
  }

  static displayOrders(orders) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                    ORDERS                             ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    if (orders.length === 0) {
      console.log('  No orders found.\n');
      return;
    }

    orders.forEach(order => {
      console.log(`  Order #${order.id}`);
      console.log(`  Table: ${order.tableNumber} | Status: ${order.status.toUpperCase()}`);
      console.log(`  Items: ${order.itemCount} | Total: ${order.total} RON`);
      console.log(`  Created: ${order.createdAt.toLocaleString()}`);
      console.log('  ─────────────────────────────────────────────────────');
    });
    console.log('\n');
  }

  static displayOrderDetails(order) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                  ORDER DETAILS                        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    console.log(`  Order #${order.id}`);
    console.log(`  Table: ${order.tableNumber}`);
    console.log(`  Status: ${order.status.toUpperCase()}`);
    console.log(`  Created: ${order.createdAt.toLocaleString()}`);
    console.log('\n  Items:');
    console.log('  ─────────────────────────────────────────────────────');
    
    order.items.forEach(item => {
      console.log(`  ${item.quantity}x ${item.name.padEnd(30)} ${item.subtotal} RON`);
      console.log(`     (${item.price.toFixed(2)} RON each)`);
    });
    
    console.log('  ─────────────────────────────────────────────────────');
    console.log(`  TOTAL: ${order.total} RON`);
    console.log('\n');
  }

  static displayStatistics(stats) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                   STATISTICS                          ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    console.log(`  Business: ${stats.businessInfo.name}`);
    console.log(`  Type: ${stats.businessInfo.type.toUpperCase()}`);
    console.log('\n  ═ Orders ═');
    console.log(`  Total Orders: ${stats.totalOrders}`);
    console.log(`  Total Revenue: ${stats.totalRevenue} RON`);
    console.log('\n  Orders by Status:');
    Object.entries(stats.ordersByStatus).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`);
    });
    console.log('\n  ═ Tables ═');
    console.log(`  Occupied: ${stats.occupiedTables} / ${stats.totalTables}`);
    console.log('\n');
  }

  static displayHeader(title) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log(`║  ${title.padEnd(52)} ║`);
    console.log('╚═══════════════════════════════════════════════════════╝\n');
  }
}

module.exports = DisplayUtils;
