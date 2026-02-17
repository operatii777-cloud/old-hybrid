const Validator = require('../utils/Validator');
const { ValidationError } = require('../utils/Errors');

/**
 * Order status enum
 */
const OrderStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

/**
 * Order model representing a customer order
 */
class Order {
  constructor(tableNumber, items, taxRate = 0.19) {
    this.id = this._generateId();
    this.tableNumber = Validator.validateTableNumber(tableNumber);
    
    // Validate items array
    Validator.validateNonEmptyArray(items, 'Order items');
    
    // Validate each item
    this.items = items.map(item => {
      if (!item.menuItem || !item.quantity) {
        throw new ValidationError('Each order item must have menuItem and quantity');
      }
      
      const validQuantity = Validator.validateQuantity(item.quantity, 'Item quantity');
      
      return {
        menuItem: item.menuItem,
        quantity: validQuantity
      };
    });
    
    this.status = OrderStatus.PENDING;
    this.taxRate = this._validateTaxRate(taxRate);
    this.discount = null;
    this.discountAmount = 0;
    this.subtotal = this._calculateSubtotal();
    this.taxAmount = this._calculateTax();
    this.total = this._calculateTotal();
    this.payment = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  _validateTaxRate(rate) {
    const taxRate = Number(rate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
      throw new ValidationError('Tax rate must be between 0 and 1 (e.g., 0.19 for 19%)');
    }
    return taxRate;
  }

  _generateId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  _calculateSubtotal() {
    return this.items.reduce((sum, item) => {
      return sum + (item.menuItem.price * item.quantity);
    }, 0);
  }

  _calculateTax() {
    return this.subtotal * this.taxRate;
  }

  _calculateTotal() {
    return this.subtotal + this.taxAmount - this.discountAmount;
  }

  /**
   * Apply discount to the order
   */
  applyDiscount(discount) {
    this.discount = discount;
    this.discountAmount = discount.calculateDiscount(this.subtotal);
    this.total = this._calculateTotal();
    this.updatedAt = new Date();
  }

  /**
   * Remove discount from order
   */
  removeDiscount() {
    this.discount = null;
    this.discountAmount = 0;
    this.total = this._calculateTotal();
    this.updatedAt = new Date();
  }

  /**
   * Add payment to order
   */
  addPayment(payment) {
    if (this.payment) {
      throw new ValidationError('Order already has a payment');
    }
    if (payment.amount < this.total) {
      throw new ValidationError('Payment amount is less than order total');
    }
    this.payment = payment;
    this.updatedAt = new Date();
  }

  updateStatus(newStatus) {
    Validator.validateEnum(
      newStatus,
      Object.values(OrderStatus),
      'Order status'
    );
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  addItem(menuItem, quantity) {
    const validQuantity = Validator.validateQuantity(quantity, 'Quantity');
    this.items.push({ menuItem, quantity: validQuantity });
    this.subtotal = this._calculateSubtotal();
    this.taxAmount = this._calculateTax();
    if (this.discount) {
      this.discountAmount = this.discount.calculateDiscount(this.subtotal);
    }
    this.total = this._calculateTotal();
    this.updatedAt = new Date();
  }

  getInfo() {
    return {
      id: this.id,
      tableNumber: this.tableNumber,
      itemCount: this.items.length,
      status: this.status,
      subtotal: this.subtotal.toFixed(2),
      taxAmount: this.taxAmount.toFixed(2),
      discountAmount: this.discountAmount.toFixed(2),
      total: this.total.toFixed(2),
      paid: this.payment !== null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  getDetailedInfo() {
    return {
      id: this.id,
      tableNumber: this.tableNumber,
      items: this.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        subtotal: (item.menuItem.price * item.quantity).toFixed(2)
      })),
      status: this.status,
      subtotal: this.subtotal.toFixed(2),
      taxRate: (this.taxRate * 100).toFixed(0) + '%',
      taxAmount: this.taxAmount.toFixed(2),
      discount: this.discount ? this.discount.getInfo() : null,
      discountAmount: this.discountAmount.toFixed(2),
      total: this.total.toFixed(2),
      payment: this.payment ? this.payment.getInfo() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Order, OrderStatus };
