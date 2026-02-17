const Validator = require('../utils/Validator');

/**
 * Table model representing a table in the establishment
 */
class Table {
  constructor(number, capacity) {
    this.id = this._generateId();
    this.number = Validator.validateTableNumber(number);
    this.capacity = Validator.validateCapacity(capacity, 'Table capacity');
    this.occupied = false;
    this.currentOrder = null;
  }

  _generateId() {
    return 'TBL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  occupy(order) {
    this.occupied = true;
    this.currentOrder = order;
  }

  vacate() {
    this.occupied = false;
    this.currentOrder = null;
  }

  getInfo() {
    return {
      id: this.id,
      number: this.number,
      capacity: this.capacity,
      occupied: this.occupied,
      hasOrder: this.currentOrder !== null
    };
  }
}

module.exports = Table;
