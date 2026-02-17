const MenuItem = require('../src/models/MenuItem');
const { ValidationError } = require('../src/utils/Errors');

describe('MenuItem Model', () => {
  test('should create a valid menu item', () => {
    const item = new MenuItem('Pizza', 'Delicious pizza', 25.50, 'main');

    expect(item.name).toBe('Pizza');
    expect(item.description).toBe('Delicious pizza');
    expect(item.price).toBe(25.50);
    expect(item.category).toBe('main');
    expect(item.available).toBe(true);
    expect(item.id).toBeDefined();
  });

  test('should reject empty name', () => {
    expect(() => new MenuItem('', 'Description', 10, 'main'))
      .toThrow(ValidationError);
  });

  test('should reject negative price', () => {
    expect(() => new MenuItem('Pizza', 'Description', -10, 'main'))
      .toThrow(ValidationError);
  });

  test('should reject price over 10000', () => {
    expect(() => new MenuItem('Pizza', 'Description', 10001, 'main'))
      .toThrow(ValidationError);
  });

  test('should set availability', () => {
    const item = new MenuItem('Pizza', 'Description', 25, 'main');
    expect(item.available).toBe(true);
    
    item.setAvailability(false);
    expect(item.available).toBe(false);
  });

  test('should update price', () => {
    const item = new MenuItem('Pizza', 'Description', 25, 'main');
    
    item.updatePrice(30);
    expect(item.price).toBe(30);
  });

  test('should reject invalid price update', () => {
    const item = new MenuItem('Pizza', 'Description', 25, 'main');
    
    expect(() => item.updatePrice(-5)).toThrow(ValidationError);
  });

  test('should get item info', () => {
    const item = new MenuItem('Pizza', 'Description', 25.50, 'main');
    const info = item.getInfo();

    expect(info.name).toBe('Pizza');
    expect(info.price).toBe(25.50);
    expect(info.category).toBe('main');
    expect(info.available).toBe(true);
  });
});
