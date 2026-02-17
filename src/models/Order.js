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
  constructor(tableNumber, items) {
    this.id = this._generateId();
    this.tableNumber = tableNumber;
    this.items = items; // Array of {menuItem, quantity}
    this.status = OrderStatus.PENDING;
    this.total = this._calculateTotal();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  _generateId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  _calculateTotal() {
    return this.items.reduce((sum, item) => {
      return sum + (item.menuItem.price * item.quantity);
    }, 0);
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  addItem(menuItem, quantity) {
    this.items.push({ menuItem, quantity });
    this.total = this._calculateTotal();
    this.updatedAt = new Date();
  }

  getInfo() {
    return {
      id: this.id,
      tableNumber: this.tableNumber,
      itemCount: this.items.length,
      status: this.status,
      total: this.total.toFixed(2),
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
      total: this.total.toFixed(2),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Order, OrderStatus };
