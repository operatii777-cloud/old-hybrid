const Validator = require('../utils/Validator');
const { ValidationError } = require('../utils/Errors');

/**
 * Payment methods enum
 */
const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile',
  VOUCHER: 'voucher'
};

/**
 * Payment model representing a payment transaction
 */
class Payment {
  constructor(orderId, amount, method, payerName = null) {
    this.id = this._generateId();
    this.orderId = Validator.validateNonEmptyString(orderId, 'Order ID');
    this.amount = Validator.validatePrice(amount, 'Payment amount');
    this.method = Validator.validateEnum(
      method,
      Object.values(PaymentMethod),
      'Payment method'
    );
    this.payerName = payerName ? Validator.validateNonEmptyString(payerName, 'Payer name') : null;
    this.status = 'completed';
    this.createdAt = new Date();
  }

  _generateId() {
    return 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  getInfo() {
    return {
      id: this.id,
      orderId: this.orderId,
      amount: this.amount.toFixed(2),
      method: this.method,
      payerName: this.payerName,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}

module.exports = { Payment, PaymentMethod };
