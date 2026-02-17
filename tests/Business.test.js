const { Business, BusinessType } = require('../src/models/Business');
const MenuItem = require('../src/models/MenuItem');
const Table = require('../src/models/Table');
const { ValidationError } = require('../src/utils/Errors');

describe('Business Model', () => {
  test('should create a valid business', () => {
    const business = new Business(
      'Test Restaurant',
      BusinessType.RESTAURANT,
      'Test Address',
      '+40 21 123 4567'
    );

    expect(business.name).toBe('Test Restaurant');
    expect(business.type).toBe(BusinessType.RESTAURANT);
    expect(business.address).toBe('Test Address');
    expect(business.phone).toBe('+40 21 123 4567');
    expect(business.id).toBeDefined();
    expect(business.menu).toEqual([]);
    expect(business.tables).toEqual([]);
    expect(business.orders).toEqual([]);
  });

  test('should reject invalid business type', () => {
    expect(() => new Business(
      'Test',
      'invalid',
      'Address',
      '+40 21 123 4567'
    )).toThrow(ValidationError);
  });

  test('should reject invalid phone', () => {
    expect(() => new Business(
      'Test',
      BusinessType.RESTAURANT,
      'Address',
      '123'
    )).toThrow(ValidationError);
  });

  test('should add menu items', () => {
    const business = new Business('Test', BusinessType.RESTAURANT, 'Addr', '+40 21 123 4567');
    const item = new MenuItem('Pizza', 'Delicious', 25.00, 'main');
    
    business.addMenuItem(item);
    expect(business.menu).toHaveLength(1);
    expect(business.menu[0]).toBe(item);
  });

  test('should add tables', () => {
    const business = new Business('Test', BusinessType.RESTAURANT, 'Addr', '+40 21 123 4567');
    const table = new Table(1, 4);
    
    business.addTable(table);
    expect(business.tables).toHaveLength(1);
    expect(business.tables[0]).toBe(table);
  });

  test('should reject duplicate table numbers', () => {
    const business = new Business('Test', BusinessType.RESTAURANT, 'Addr', '+40 21 123 4567');
    const table1 = new Table(1, 4);
    const table2 = new Table(1, 6);
    
    business.addTable(table1);
    expect(() => business.addTable(table2)).toThrow(ValidationError);
  });

  test('should get business info', () => {
    const business = new Business('Test', BusinessType.RESTAURANT, 'Addr', '+40 21 123 4567');
    const info = business.getInfo();

    expect(info.name).toBe('Test');
    expect(info.type).toBe(BusinessType.RESTAURANT);
    expect(info.menuItems).toBe(0);
    expect(info.tables).toBe(0);
    expect(info.orders).toBe(0);
  });
});
