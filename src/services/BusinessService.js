const { Business, BusinessType } = require('../models/Business');
const MenuItem = require('../models/MenuItem');
const { Order, OrderStatus } = require('../models/Order');
const Table = require('../models/Table');

/**
 * BusinessService manages all operations for restaurants, cafes, and fast-food establishments
 */
class BusinessService {
  constructor() {
    this.businesses = [];
  }

  /**
   * Create a new business (restaurant, cafe, or fast-food)
   */
  createBusiness(name, type, address, phone) {
    if (!Object.values(BusinessType).includes(type)) {
      throw new Error('Invalid business type. Must be restaurant, cafe, or fastfood');
    }

    const business = new Business(name, type, address, phone);
    this.businesses.push(business);
    return business;
  }

  /**
   * Get business by ID
   */
  getBusiness(businessId) {
    return this.businesses.find(b => b.id === businessId);
  }

  /**
   * Get all businesses
   */
  getAllBusinesses() {
    return this.businesses.map(b => b.getInfo());
  }

  /**
   * Add menu item to business
   */
  addMenuItem(businessId, name, description, price, category) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const menuItem = new MenuItem(name, description, price, category);
    business.addMenuItem(menuItem);
    return menuItem;
  }

  /**
   * Get menu for a business
   */
  getMenu(businessId) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    return business.menu.map(item => item.getInfo());
  }

  /**
   * Add table to business
   */
  addTable(businessId, tableNumber, capacity) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const table = new Table(tableNumber, capacity);
    business.addTable(table);
    return table;
  }

  /**
   * Get all tables for a business
   */
  getTables(businessId) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    return business.tables.map(table => table.getInfo());
  }

  /**
   * Create an order
   */
  createOrder(businessId, tableNumber, items) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    // Validate items exist in menu
    const orderItems = items.map(item => {
      const menuItem = business.menu.find(mi => mi.id === item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }
      return {
        menuItem,
        quantity: item.quantity
      };
    });

    const order = new Order(tableNumber, orderItems);
    business.addOrder(order);

    // Update table status if table exists
    const table = business.tables.find(t => t.number === tableNumber);
    if (table) {
      table.occupy(order);
    }

    return order;
  }

  /**
   * Update order status
   */
  updateOrderStatus(businessId, orderId, newStatus) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const order = business.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.updateStatus(newStatus);

    // If order is delivered or cancelled, vacate the table
    if (newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.CANCELLED) {
      const table = business.tables.find(t => t.number === order.tableNumber);
      if (table && table.currentOrder && table.currentOrder.id === orderId) {
        table.vacate();
      }
    }

    return order;
  }

  /**
   * Get all orders for a business
   */
  getOrders(businessId, status = null) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    let orders = business.orders;
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    return orders.map(order => order.getInfo());
  }

  /**
   * Get detailed order information
   */
  getOrderDetails(businessId, orderId) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const order = business.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return order.getDetailedInfo();
  }

  /**
   * Get statistics for a business
   */
  getStatistics(businessId) {
    const business = this.getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const totalOrders = business.orders.length;
    const totalRevenue = business.orders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + o.total, 0);
    
    const ordersByStatus = {};
    Object.values(OrderStatus).forEach(status => {
      ordersByStatus[status] = business.orders.filter(o => o.status === status).length;
    });

    return {
      businessInfo: business.getInfo(),
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      ordersByStatus,
      occupiedTables: business.tables.filter(t => t.occupied).length,
      totalTables: business.tables.length
    };
  }
}

module.exports = BusinessService;
