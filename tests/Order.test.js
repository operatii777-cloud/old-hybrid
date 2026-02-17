const { Order, OrderStatus } = require('../src/models/Order');
const MenuItem = require('../src/models/MenuItem');
const { Discount, DiscountType } = require('../src/models/Discount');
const { Payment, PaymentMethod } = require('../src/models/Payment');
const { ValidationError } = require('../src/utils/Errors');

describe('Order Model', () => {
  let menuItem1, menuItem2;

  beforeEach(() => {
    menuItem1 = new MenuItem('Pizza', 'Delicious', 100, 'main');
    menuItem2 = new MenuItem('Salad', 'Fresh', 50, 'appetizer');
  });

  test('should create a valid order', () => {
    const items = [
      { menuItem: menuItem1, quantity: 2 },
      { menuItem: menuItem2, quantity: 1 }
    ];
    
    const order = new Order(1, items, 0.19);

    expect(order.tableNumber).toBe(1);
    expect(order.items).toHaveLength(2);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.subtotal).toBe(250); // 100*2 + 50*1
    expect(order.taxAmount).toBe(47.5); // 250 * 0.19
    expect(order.total).toBe(297.5); // 250 + 47.5
  });

  test('should reject empty items array', () => {
    expect(() => new Order(1, []))
      .toThrow(ValidationError);
  });

  test('should reject invalid quantity', () => {
    const items = [
      { menuItem: menuItem1, quantity: -1 }
    ];
    
    expect(() => new Order(1, items))
      .toThrow(ValidationError);
  });

  test('should reject invalid table number', () => {
    const items = [{ menuItem: menuItem1, quantity: 1 }];
    
    expect(() => new Order(0, items))
      .toThrow(ValidationError);
  });

  test('should update order status', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 1 }]);
    
    order.updateStatus(OrderStatus.PREPARING);
    expect(order.status).toBe(OrderStatus.PREPARING);
  });

  test('should reject invalid order status', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 1 }]);
    
    expect(() => order.updateStatus('invalid'))
      .toThrow(ValidationError);
  });

  test('should add items to order', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 1 }]);
    expect(order.items).toHaveLength(1);
    
    order.addItem(menuItem2, 2);
    expect(order.items).toHaveLength(2);
    // Subtotal: 100 + (50*2) = 200
    // Tax: 200 * 0.19 = 38
    // Total: 200 + 38 = 238
    expect(order.total).toBe(238);
  });

  test('should apply percentage discount', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 2 }], 0.19);
    const discount = new Discount('SAVE10', DiscountType.PERCENTAGE, 10, '10% off');
    
    order.applyDiscount(discount);
    
    expect(order.discountAmount).toBe(20); // 10% of 200
    expect(order.total).toBe(218); // 200 + 38 (tax) - 20 (discount)
  });

  test('should apply fixed discount', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 2 }], 0.19);
    const discount = new Discount('SAVE25', DiscountType.FIXED, 25, '25 RON off');
    
    order.applyDiscount(discount);
    
    expect(order.discountAmount).toBe(25);
    expect(order.total).toBe(213); // 200 + 38 - 25
  });

  test('should remove discount', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 2 }], 0.19);
    const discount = new Discount('SAVE10', DiscountType.PERCENTAGE, 10);
    
    order.applyDiscount(discount);
    expect(order.discountAmount).toBe(20);
    
    order.removeDiscount();
    expect(order.discountAmount).toBe(0);
    expect(order.discount).toBe(null);
  });

  test('should add payment', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 1 }]);
    const payment = new Payment(order.id, 150, PaymentMethod.CARD, 'John Doe');
    
    order.addPayment(payment);
    expect(order.payment).toBe(payment);
  });

  test('should reject payment less than total', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 1 }]);
    const payment = new Payment(order.id, 50, PaymentMethod.CARD);
    
    expect(() => order.addPayment(payment))
      .toThrow(ValidationError);
  });

  test('should reject duplicate payment', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 1 }]);
    const payment1 = new Payment(order.id, 150, PaymentMethod.CARD);
    const payment2 = new Payment(order.id, 150, PaymentMethod.CASH);
    
    order.addPayment(payment1);
    expect(() => order.addPayment(payment2))
      .toThrow(ValidationError);
  });

  test('should get order info', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 2 }]);
    const info = order.getInfo();

    expect(info.tableNumber).toBe(1);
    expect(info.itemCount).toBe(1);
    expect(info.status).toBe(OrderStatus.PENDING);
    expect(info.paid).toBe(false);
    expect(parseFloat(info.subtotal)).toBe(200);
    expect(parseFloat(info.total)).toBe(238);
  });

  test('should get detailed order info', () => {
    const order = new Order(1, [{ menuItem: menuItem1, quantity: 2 }]);
    const detailed = order.getDetailedInfo();

    expect(detailed.items).toHaveLength(1);
    expect(detailed.items[0].name).toBe('Pizza');
    expect(detailed.items[0].quantity).toBe(2);
    expect(detailed.taxRate).toBe('19%');
  });
});
