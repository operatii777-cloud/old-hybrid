const Validator = require('../utils/Validator');
const { ValidationError } = require('../utils/Errors');

/**
 * Discount types
 */
const DiscountType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
};

/**
 * Discount model representing a discount or promotion
 */
class Discount {
  constructor(code, type, value, description = '') {
    this.id = this._generateId();
    this.code = Validator.validateNonEmptyString(code, 'Discount code').toUpperCase();
    this.type = Validator.validateEnum(
      type,
      Object.values(DiscountType),
      'Discount type'
    );
    
    if (type === DiscountType.PERCENTAGE) {
      if (value <= 0 || value > 100) {
        throw new ValidationError('Percentage discount must be between 0 and 100');
      }
    } else {
      value = Validator.validatePrice(value, 'Discount value');
    }
    
    this.value = value;
    this.description = description;
    this.active = true;
    this.createdAt = new Date();
  }

  _generateId() {
    return 'DSC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Calculate discount amount for a given total
   */
  calculateDiscount(total) {
    if (!this.active) {
      return 0;
    }

    if (this.type === DiscountType.PERCENTAGE) {
      return (total * this.value) / 100;
    } else {
      return Math.min(this.value, total); // Don't exceed total
    }
  }

  deactivate() {
    this.active = false;
  }

  activate() {
    this.active = true;
  }

  getInfo() {
    return {
      id: this.id,
      code: this.code,
      type: this.type,
      value: this.value,
      description: this.description,
      active: this.active
    };
  }
}

module.exports = { Discount, DiscountType };
