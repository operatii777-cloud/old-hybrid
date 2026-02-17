const Validator = require('../utils/Validator');

/**
 * MenuItem model representing a food or beverage item
 */
class MenuItem {
  constructor(name, description, price, category) {
    this.id = this._generateId();
    this.name = Validator.validateMenuItemName(name);
    this.description = Validator.validateDescription(description);
    this.price = Validator.validatePrice(price, 'Price');
    this.category = Validator.validateNonEmptyString(category, 'Category');
    this.available = true;
    this.createdAt = new Date();
  }

  _generateId() {
    return 'ITEM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  setAvailability(available) {
    this.available = available;
  }

  updatePrice(newPrice) {
    this.price = Validator.validatePrice(newPrice, 'New price');
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      available: this.available
    };
  }
}

module.exports = MenuItem;
