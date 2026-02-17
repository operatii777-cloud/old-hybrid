const Validator = require('../src/utils/Validator');
const { ValidationError } = require('../src/utils/Errors');

describe('Validator', () => {
  describe('validateNonEmptyString', () => {
    test('should accept valid strings', () => {
      expect(Validator.validateNonEmptyString('test', 'Field')).toBe('test');
      expect(Validator.validateNonEmptyString('  test  ', 'Field')).toBe('test');
    });

    test('should reject empty strings', () => {
      expect(() => Validator.validateNonEmptyString('', 'Field'))
        .toThrow(ValidationError);
      expect(() => Validator.validateNonEmptyString('   ', 'Field'))
        .toThrow(ValidationError);
    });

    test('should reject non-strings', () => {
      expect(() => Validator.validateNonEmptyString(123, 'Field'))
        .toThrow(ValidationError);
      expect(() => Validator.validateNonEmptyString(null, 'Field'))
        .toThrow(ValidationError);
    });
  });

  describe('validatePositiveNumber', () => {
    test('should accept positive numbers', () => {
      expect(Validator.validatePositiveNumber(1, 'Field')).toBe(1);
      expect(Validator.validatePositiveNumber(100.5, 'Field')).toBe(100.5);
      expect(Validator.validatePositiveNumber('50', 'Field')).toBe(50);
    });

    test('should reject zero and negative numbers', () => {
      expect(() => Validator.validatePositiveNumber(0, 'Field'))
        .toThrow(ValidationError);
      expect(() => Validator.validatePositiveNumber(-5, 'Field'))
        .toThrow(ValidationError);
    });

    test('should reject non-numbers', () => {
      expect(() => Validator.validatePositiveNumber('abc', 'Field'))
        .toThrow(ValidationError);
    });
  });

  describe('validatePrice', () => {
    test('should accept valid prices', () => {
      expect(Validator.validatePrice(10.99, 'Price')).toBe(10.99);
      expect(Validator.validatePrice(100, 'Price')).toBe(100);
    });

    test('should round to 2 decimal places', () => {
      expect(Validator.validatePrice(10.999, 'Price')).toBe(11);
      expect(Validator.validatePrice(10.994, 'Price')).toBe(10.99);
    });

    test('should reject prices over 10000', () => {
      expect(() => Validator.validatePrice(10001, 'Price'))
        .toThrow(ValidationError);
    });

    test('should reject negative prices', () => {
      expect(() => Validator.validatePrice(-10, 'Price'))
        .toThrow(ValidationError);
    });
  });

  describe('validateQuantity', () => {
    test('should accept positive integers', () => {
      expect(Validator.validateQuantity(1, 'Quantity')).toBe(1);
      expect(Validator.validateQuantity(100, 'Quantity')).toBe(100);
    });

    test('should reject decimals', () => {
      expect(() => Validator.validateQuantity(1.5, 'Quantity'))
        .toThrow(ValidationError);
    });

    test('should reject quantities over 1000', () => {
      expect(() => Validator.validateQuantity(1001, 'Quantity'))
        .toThrow(ValidationError);
    });

    test('should reject zero and negative', () => {
      expect(() => Validator.validateQuantity(0, 'Quantity'))
        .toThrow(ValidationError);
      expect(() => Validator.validateQuantity(-5, 'Quantity'))
        .toThrow(ValidationError);
    });
  });

  describe('validatePhone', () => {
    test('should accept valid Romanian phone numbers', () => {
      expect(Validator.validatePhone('+40 21 123 4567')).toBe('+40 21 123 4567');
      expect(Validator.validatePhone('+40721234567')).toBe('+40721234567');
      expect(Validator.validatePhone('0721234567')).toBe('0721234567');
    });

    test('should reject invalid phone numbers', () => {
      expect(() => Validator.validatePhone('123'))
        .toThrow(ValidationError);
      expect(() => Validator.validatePhone('+1 234 567 8901'))
        .toThrow(ValidationError);
    });
  });

  describe('validateEnum', () => {
    test('should accept valid enum values', () => {
      const validValues = ['option1', 'option2', 'option3'];
      expect(Validator.validateEnum('option1', validValues, 'Field')).toBe('option1');
    });

    test('should reject invalid enum values', () => {
      const validValues = ['option1', 'option2'];
      expect(() => Validator.validateEnum('option3', validValues, 'Field'))
        .toThrow(ValidationError);
    });
  });

  describe('validateBusinessName', () => {
    test('should accept valid business names', () => {
      expect(Validator.validateBusinessName('La Strada')).toBe('La Strada');
      expect(Validator.validateBusinessName('  Test  ')).toBe('Test');
    });

    test('should reject names that are too short', () => {
      expect(() => Validator.validateBusinessName('A'))
        .toThrow(ValidationError);
    });

    test('should reject names that are too long', () => {
      const longName = 'A'.repeat(101);
      expect(() => Validator.validateBusinessName(longName))
        .toThrow(ValidationError);
    });
  });

  describe('validateTableNumber', () => {
    test('should accept valid table numbers', () => {
      expect(Validator.validateTableNumber(1)).toBe(1);
      expect(Validator.validateTableNumber(100)).toBe(100);
    });

    test('should reject table number 0 and negative', () => {
      expect(() => Validator.validateTableNumber(0))
        .toThrow(ValidationError);
      expect(() => Validator.validateTableNumber(-1))
        .toThrow(ValidationError);
    });

    test('should reject table numbers over 1000', () => {
      expect(() => Validator.validateTableNumber(1001))
        .toThrow(ValidationError);
    });
  });

  describe('validateCapacity', () => {
    test('should accept valid capacities', () => {
      expect(Validator.validateCapacity(4)).toBe(4);
      expect(Validator.validateCapacity(50)).toBe(50);
    });

    test('should reject capacities over 100', () => {
      expect(() => Validator.validateCapacity(101))
        .toThrow(ValidationError);
    });

    test('should reject capacity 0 and negative', () => {
      expect(() => Validator.validateCapacity(0))
        .toThrow(ValidationError);
    });
  });
});
