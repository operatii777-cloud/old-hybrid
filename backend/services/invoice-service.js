import { getDatabase } from '../database/init-db.js';
import { logger } from '../utils/logger.js';

/**
 * Generate invoice/receipt data for an order
 */
export async function generateInvoiceData(orderId) {
  const db = getDatabase();
  
  try {
    // Get order details
    const order = await db.get(`
      SELECT c.*, m.nume as masa_nume, o.nume as ospatar_nume
      FROM comenzi c
      LEFT JOIN mese m ON c.masa_id = m.id
      LEFT JOIN ospetari o ON c.ospatar_id = o.id
      WHERE c.id = ?
    `, [orderId]);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Get order items
    const items = await db.all(`
      SELECT cl.*, p.den_prod as produs_nume, p.tva
      FROM comenzi_linii cl
      LEFT JOIN produse p ON cl.cod_prod = p.cod_prod
      WHERE cl.comanda_id = ?
    `, [orderId]);
    
    // Calculate totals
    let subtotal = 0;
    let totalTVA = 0;
    
    const processedItems = items.map(item => {
      const itemSubtotal = item.cant * item.pret_unitar;
      const itemTVA = itemSubtotal * ((item.tva_snap || 1.19) - 1);
      
      subtotal += itemSubtotal;
      totalTVA += itemTVA;
      
      return {
        name: item.produs_nume,
        quantity: item.cant,
        unitPrice: item.pret_unitar,
        tva: ((item.tva_snap || 1.19) - 1) * 100,
        total: itemSubtotal
      };
    });
    
    const discount = order.discount || 0;
    const total = order.total || subtotal;
    
    return {
      invoice: {
        number: `INV-${order.id}`,
        date: new Date(order.data).toLocaleDateString('ro-RO'),
        time: new Date(order.data).toLocaleTimeString('ro-RO')
      },
      restaurant: {
        name: 'Restaurant Hybrid',
        address: 'Str. Exemplu Nr. 1',
        city: 'București',
        phone: '+40 21 123 4567',
        cui: 'RO12345678'
      },
      order: {
        id: order.id,
        table: order.masa_nume,
        waiter: order.ospatar_nume,
        status: order.status
      },
      items: processedItems,
      totals: {
        subtotal: subtotal.toFixed(2),
        tva: totalTVA.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2)
      }
    };
    
  } catch (error) {
    logger.error('Error generating invoice data:', error);
    throw error;
  }
}

/**
 * Format invoice for receipt printer (text-based)
 */
export function formatReceiptText(invoiceData) {
  const { invoice, restaurant, order, items, totals } = invoiceData;
  
  let receipt = '';
  receipt += '========================================\n';
  receipt += `       ${restaurant.name}\n`;
  receipt += `       ${restaurant.address}\n`;
  receipt += `       ${restaurant.city}\n`;
  receipt += `       Tel: ${restaurant.phone}\n`;
  receipt += `       CUI: ${restaurant.cui}\n`;
  receipt += '========================================\n';
  receipt += `BON FISCAL: ${invoice.number}\n`;
  receipt += `Data: ${invoice.date} ${invoice.time}\n`;
  receipt += `Masa: ${order.table} | Ospatar: ${order.waiter}\n`;
  receipt += '========================================\n';
  receipt += 'Produs                 Cant   Pret   Total\n';
  receipt += '----------------------------------------\n';
  
  items.forEach(item => {
    const name = item.name.padEnd(20).substring(0, 20);
    const qty = item.quantity.toFixed(1).padStart(5);
    const price = item.unitPrice.toFixed(2).padStart(6);
    const total = item.total.toFixed(2).padStart(8);
    receipt += `${name} ${qty} ${price} ${total}\n`;
  });
  
  receipt += '========================================\n';
  receipt += `Subtotal:                      ${totals.subtotal} RON\n`;
  receipt += `TVA:                           ${totals.tva} RON\n`;
  if (parseFloat(totals.discount) > 0) {
    receipt += `Discount:                     -${totals.discount} RON\n`;
  }
  receipt += `TOTAL:                         ${totals.total} RON\n`;
  receipt += '========================================\n';
  receipt += '      Multumim pentru comanda!\n';
  receipt += '        Va asteptam din nou!\n';
  receipt += '========================================\n';
  
  return receipt;
}

/**
 * Get receipt metadata for PDF generation
 * (PDF generation will be handled client-side with jsPDF)
 */
export async function getReceiptData(orderId) {
  const invoiceData = await generateInvoiceData(orderId);
  return {
    ...invoiceData,
    receiptText: formatReceiptText(invoiceData)
  };
}
