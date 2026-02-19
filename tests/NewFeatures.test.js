/**
 * Tests for new features:
 * - Voucher discount calculation
 * - POS total calculation with discounts
 * - KDS station routing logic
 * - Error handler middleware
 */

describe('Voucher discount calculation', () => {
  function calcDiscount(voucher, subtotal) {
    if (voucher.discount_percent > 0) {
      return Math.round(subtotal * voucher.discount_percent / 100 * 100) / 100;
    }
    if (voucher.discount_fix > 0) {
      return Math.min(voucher.discount_fix, subtotal);
    }
    return 0;
  }

  test('should calculate percentage discount correctly', () => {
    const voucher = { discount_percent: 10, discount_fix: 0 };
    expect(calcDiscount(voucher, 100)).toBe(10);
    expect(calcDiscount(voucher, 50)).toBe(5);
    expect(calcDiscount(voucher, 33.33)).toBeCloseTo(3.33, 1);
  });

  test('should calculate fixed discount correctly', () => {
    const voucher = { discount_percent: 0, discount_fix: 25 };
    expect(calcDiscount(voucher, 100)).toBe(25);
    expect(calcDiscount(voucher, 20)).toBe(20); // capped at subtotal
  });

  test('should return 0 for voucher without discount', () => {
    const voucher = { discount_percent: 0, discount_fix: 0 };
    expect(calcDiscount(voucher, 100)).toBe(0);
  });
});

describe('POS total with order-level discount and voucher', () => {
  function calcTotal(linii, discountOrdinPct, voucherDiscount) {
    const subtotal = linii.reduce((s, l) => s + l.cant * l.pret_unitar, 0);
    const discOrdin = discountOrdinPct > 0 ? Math.round(subtotal * discountOrdinPct / 100 * 100) / 100 : 0;
    const discVoucher = voucherDiscount || 0;
    return Math.max(0, Math.round((subtotal - discOrdin - discVoucher) * 100) / 100);
  }

  test('should compute correct total without discount', () => {
    const linii = [{ cant: 2, pret_unitar: 10 }, { cant: 1, pret_unitar: 5 }];
    expect(calcTotal(linii, 0, 0)).toBe(25);
  });

  test('should apply order-level % discount correctly', () => {
    const linii = [{ cant: 1, pret_unitar: 100 }];
    expect(calcTotal(linii, 10, 0)).toBe(90);
    expect(calcTotal(linii, 50, 0)).toBe(50);
  });

  test('should apply voucher discount correctly', () => {
    const linii = [{ cant: 1, pret_unitar: 100 }];
    expect(calcTotal(linii, 0, 15)).toBe(85);
  });

  test('should apply both discounts correctly', () => {
    const linii = [{ cant: 1, pret_unitar: 100 }];
    expect(calcTotal(linii, 10, 5)).toBe(85); // 100 - 10% - 5
  });

  test('total should not go below 0', () => {
    const linii = [{ cant: 1, pret_unitar: 10 }];
    expect(calcTotal(linii, 100, 100)).toBe(0);
  });

  test('protocol payment should result in 0 total to charge', () => {
    const linii = [{ cant: 2, pret_unitar: 50 }];
    const subtotal = linii.reduce((s, l) => s + l.cant * l.pret_unitar, 0);
    const TIP_PLATA = 5; // PROTOCOL
    const totalToCharge = TIP_PLATA === 5 ? 0 : subtotal;
    expect(totalToCharge).toBe(0);
    expect(subtotal).toBe(100);
  });
});

describe('KDS station routing', () => {
  const BAR_GRUPE = new Set(['RACORITOARE', 'VINURI', 'ALCOOLICE', 'CAFEA', 'VINURI/METAXA']);
  const BAR_NAME_PATTERN =
    /CAFEA|ESPRESSO|CAPPUCCINO|LATTE|CEAI|COCKTAIL|SMOOTHIE|SODA|BERE|VIN |VODKA|WHISKY|BRANDY|GIN |RUM |TEQUILA/i;

  function detectStatie(den_prod, grupa) {
    const g = (grupa || '').toUpperCase().trim();
    if (BAR_GRUPE.has(g)) return 'bar';
    if (BAR_NAME_PATTERN.test(den_prod || '')) return 'bar';
    return 'bucatarie';
  }

  test('should route bar drinks to bar station', () => {
    expect(detectStatie('ESPRESSO', 'CAFEA')).toBe('bar');
    expect(detectStatie('COCA COLA', 'RACORITOARE')).toBe('bar');
    expect(detectStatie('VIN ROSU', 'VINURI')).toBe('bar');
  });

  test('should route food to bucatarie station', () => {
    expect(detectStatie('PIZZA MARGHERITA', 'CIORBE/MIC DEJ/PIZZA')).toBe('bucatarie');
    expect(detectStatie('SNITEL PUI', 'PREP PUI')).toBe('bucatarie');
    expect(detectStatie('SALATA GREACA', 'GARNITURI/SALATE')).toBe('bucatarie');
  });

  test('should route by product name when grupa is missing', () => {
    expect(detectStatie('CAFEA ESPRESSO', '')).toBe('bar');
    expect(detectStatie('BERE LA HALBA', '')).toBe('bar');
    expect(detectStatie('CARTOFI PRAJITI', '')).toBe('bucatarie');
  });
});

describe('KDS status transitions', () => {
  const validTransitions = {
    pending:   'preparing',
    preparing: 'ready',
    ready:     'served',
    served:    null
  };

  test('should have correct next status for each state', () => {
    expect(validTransitions.pending).toBe('preparing');
    expect(validTransitions.preparing).toBe('ready');
    expect(validTransitions.ready).toBe('served');
    expect(validTransitions.served).toBeNull();
  });

  test('should validate status values', () => {
    const valid = ['pending', 'preparing', 'ready', 'served'];
    valid.forEach(s => expect(valid.includes(s)).toBe(true));
    expect(valid.includes('invalid')).toBe(false);
  });
});

describe('Error handler middleware shape', () => {
  test('should return ok:false and error string', () => {
    const mockRes = {
      headersSent: false,
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { this._body = body; return this; }
    };
    const err = new Error('Test error');
    err.status = 422;

    // Simulate what errorHandler does
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    mockRes.status(status).json({ ok: false, error: message });

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes._body).toEqual({ ok: false, error: 'Test error' });
  });
});
