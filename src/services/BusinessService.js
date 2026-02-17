const { Business, BusinessType } = require('../models/Business');
const MenuItem = require('../models/MenuItem');
const { Order, OrderStatus } = require('../models/Order');
const Table = require('../models/Table');
const { Payment, PaymentMethod } = require('../models/Payment');
const { Discount, DiscountType } = require('../models/Discount');
const { NotFoundError, BusinessError } = require('../utils/Errors');

/**
 * BusinessService manages all operations for restaurants, cafes, and fast-food establishments
 */
class BusinessService {
  constructor() {
    this.businesses = [];
    this.discounts = []; // Global discounts
  }

  /**
   * Create a new business (restaurant, cafe, or fast-food)
   */
  createBusiness(name, type, address, phone) {
    try {
      const business = new Business(name, type, address, phone);
      this.businesses.push(business);
      return business;
    } catch (error) {
      throw error; // Re-throw validation errors
    }
  }

  /**
   * Get business by ID
   */
  getBusiness(businessId) {
    const business = this.businesses.find(b => b.id === businessId);
    if (!business) {
      throw new NotFoundError(`Business with ID ${businessId} not found`);
    }
    return business;
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
    try {
      const business = this.getBusiness(businessId);
      const menuItem = new MenuItem(name, description, price, category);
      business.addMenuItem(menuItem);
      return menuItem;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get menu for a business
   */
  getMenu(businessId) {
    const business = this.getBusiness(businessId);
    return business.menu.map(item => item.getInfo());
  }

  /**
   * Add table to business
   */
  addTable(businessId, tableNumber, capacity) {
    try {
      const business = this.getBusiness(businessId);
      const table = new Table(tableNumber, capacity);
      business.addTable(table);
      return table;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all tables for a business
   */
  getTables(businessId) {
    const business = this.getBusiness(businessId);
    return business.tables.map(table => table.getInfo());
  }

  /**
   * Create an order
   */
  createOrder(businessId, tableNumber, items) {
    try {
      const business = this.getBusiness(businessId);

      // Validate items exist in menu
      const orderItems = items.map(item => {
        const menuItem = business.menu.find(mi => mi.id === item.menuItemId);
        if (!menuItem) {
          throw new NotFoundError(`Menu item ${item.menuItemId} not found`);
        }
        if (!menuItem.available) {
          throw new BusinessError(`Menu item ${menuItem.name} is not available`);
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update order status
   */
  updateOrderStatus(businessId, orderId, newStatus) {
    try {
      const business = this.getBusiness(businessId);

      const order = business.orders.find(o => o.id === orderId);
      if (!order) {
        throw new NotFoundError(`Order ${orderId} not found`);
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all orders for a business
   */
  getOrders(businessId, status = null) {
    const business = this.getBusiness(businessId);

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

    const order = business.orders.find(o => o.id === orderId);
    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }

    return order.getDetailedInfo();
  }

  /**
   * Get statistics for a business
   */
  getStatistics(businessId) {
    const business = this.getBusiness(businessId);

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

  /**
   * Create a discount
   */
  createDiscount(code, type, value, description = '') {
    try {
      const discount = new Discount(code, type, value, description);
      this.discounts.push(discount);
      return discount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get discount by code
   */
  getDiscountByCode(code) {
    const discount = this.discounts.find(d => d.code === code.toUpperCase() && d.active);
    if (!discount) {
      throw new NotFoundError(`Active discount with code ${code} not found`);
    }
    return discount;
  }

  /**
   * Apply discount to order
   */
  applyDiscount(businessId, orderId, discountCode) {
    try {
      const business = this.getBusiness(businessId);
      const order = business.orders.find(o => o.id === orderId);
      if (!order) {
        throw new NotFoundError(`Order ${orderId} not found`);
      }

      const discount = this.getDiscountByCode(discountCode);
      order.applyDiscount(discount);
      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process payment for an order
   */
  processPayment(businessId, orderId, amount, method, payerName = null) {
    try {
      const business = this.getBusiness(businessId);
      const order = business.orders.find(o => o.id === orderId);
      if (!order) {
        throw new NotFoundError(`Order ${orderId} not found`);
      }

      const payment = new Payment(orderId, amount, method, payerName);
      order.addPayment(payment);
      
      // Automatically mark order as delivered when paid
      if (order.status === OrderStatus.READY) {
        order.updateStatus(OrderStatus.DELIVERED);
        
        // Vacate table
        const table = business.tables.find(t => t.number === order.tableNumber);
        if (table && table.currentOrder && table.currentOrder.id === orderId) {
          table.vacate();
        }
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BusinessService;
