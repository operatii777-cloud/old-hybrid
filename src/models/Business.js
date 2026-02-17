/**
 * Enum for business types
 */
const BusinessType = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  FASTFOOD: 'fastfood'
};

/**
 * Business model representing a restaurant, cafe, or fast-food establishment
 */
class Business {
  constructor(name, type, address, phone) {
    this.id = this._generateId();
    this.name = name;
    this.type = type; // restaurant, cafe, or fastfood
    this.address = address;
    this.phone = phone;
    this.menu = [];
    this.tables = [];
    this.orders = [];
    this.createdAt = new Date();
  }

  _generateId() {
    return 'BIZ-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  addMenuItem(item) {
    this.menu.push(item);
  }

  addTable(table) {
    this.tables.push(table);
  }

  addOrder(order) {
    this.orders.push(order);
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      address: this.address,
      phone: this.phone,
      menuItems: this.menu.length,
      tables: this.tables.length,
      orders: this.orders.length
    };
  }
}

module.exports = { Business, BusinessType };
