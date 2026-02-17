/**
 * Validation utilities for input data
 */

const { ValidationError } = require('./Errors');

class Validator {
  /**
   * Validate that a string is not empty
   */
  static validateNonEmptyString(value, fieldName) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ValidationError(`${fieldName} must be a non-empty string`);
    }
    return value.trim();
  }

  /**
   * Validate that a number is positive
   */
  static validatePositiveNumber(value, fieldName) {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
    return num;
  }

  /**
   * Validate that a number is non-negative
   */
  static validateNonNegativeNumber(value, fieldName) {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      throw new ValidationError(`${fieldName} must be a non-negative number`);
    }
    return num;
  }

  /**
   * Validate price (must be positive, max 2 decimal places)
   */
  static validatePrice(price, fieldName = 'Price') {
    const validPrice = this.validatePositiveNumber(price, fieldName);
    
    // Check for reasonable maximum price (e.g., 10000 RON)
    if (validPrice > 10000) {
      throw new ValidationError(`${fieldName} cannot exceed 10000 RON`);
    }
    
    // Round to 2 decimal places
    return Math.round(validPrice * 100) / 100;
  }

  /**
   * Validate quantity (must be positive integer)
   */
  static validateQuantity(quantity, fieldName = 'Quantity') {
    const num = Number(quantity);
    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }
    
    // Check for reasonable maximum quantity
    if (num > 1000) {
      throw new ValidationError(`${fieldName} cannot exceed 1000`);
    }
    
    return num;
  }

  /**
   * Validate table capacity (must be positive integer)
   */
  static validateCapacity(capacity, fieldName = 'Capacity') {
    const num = Number(capacity);
    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }
    
    // Check for reasonable maximum capacity
    if (num > 100) {
      throw new ValidationError(`${fieldName} cannot exceed 100 seats`);
    }
    
    return num;
  }

  /**
   * Validate phone number (Romanian format)
   */
  static validatePhone(phone, fieldName = 'Phone') {
    const cleaned = phone.replace(/\s+/g, '');
    
    // Basic validation for Romanian phone numbers - more lenient
    // Accepts: +40..., 0040..., or 0...
    const phoneRegex = /^(\+?40|0)\d{9,10}$/;
    if (!phoneRegex.test(cleaned)) {
      throw new ValidationError(
        `${fieldName} must be a valid Romanian phone number (e.g., +40 21 123 4567 or 0721234567)`
      );
    }
    
    return phone;
  }

  /**
   * Validate enum value
   */
  static validateEnum(value, validValues, fieldName) {
    if (!validValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${validValues.join(', ')}`
      );
    }
    return value;
  }

  /**
   * Validate array is not empty
   */
  static validateNonEmptyArray(arr, fieldName) {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty array`);
    }
    return arr;
  }

  /**
   * Validate business name (specific rules)
   */
  static validateBusinessName(name) {
    const trimmed = this.validateNonEmptyString(name, 'Business name');
    
    if (trimmed.length < 2) {
      throw new ValidationError('Business name must be at least 2 characters');
    }
    
    if (trimmed.length > 100) {
      throw new ValidationError('Business name cannot exceed 100 characters');
    }
    
    return trimmed;
  }

  /**
   * Validate menu item name
   */
  static validateMenuItemName(name) {
    const trimmed = this.validateNonEmptyString(name, 'Menu item name');
    
    if (trimmed.length < 2) {
      throw new ValidationError('Menu item name must be at least 2 characters');
    }
    
    if (trimmed.length > 100) {
      throw new ValidationError('Menu item name cannot exceed 100 characters');
    }
    
    return trimmed;
  }

  /**
   * Validate description
   */
  static validateDescription(description) {
    if (typeof description !== 'string') {
      throw new ValidationError('Description must be a string');
    }
    
    if (description.length > 500) {
      throw new ValidationError('Description cannot exceed 500 characters');
    }
    
    return description.trim();
  }

  /**
   * Validate table number (must be positive integer)
   */
  static validateTableNumber(tableNumber) {
    const num = Number(tableNumber);
    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError('Table number must be a positive integer');
    }
    
    if (num > 1000) {
      throw new ValidationError('Table number cannot exceed 1000');
    }
    
    return num;
  }
}

module.exports = Validator;
