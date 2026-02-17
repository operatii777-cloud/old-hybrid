const Validator = require('../utils/Validator');
const { ValidationError } = require('../utils/Errors');

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
    // Validate inputs
    this.name = Validator.validateBusinessName(name);
    this.type = Validator.validateEnum(
      type,
      Object.values(BusinessType),
      'Business type'
    );
    this.address = Validator.validateNonEmptyString(address, 'Address');
    this.phone = Validator.validatePhone(phone, 'Phone');
    
    this.id = this._generateId();
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
    // Check for duplicate table numbers
    const existingTable = this.tables.find(t => t.number === table.number);
    if (existingTable) {
      throw new ValidationError(`Table number ${table.number} already exists`);
    }
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
