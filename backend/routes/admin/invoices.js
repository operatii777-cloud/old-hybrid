import express from 'express';
import { getReceiptData } from '../../services/invoice-service.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * GET /api/invoices/:orderId
 * Generate invoice data for an order
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const invoiceData = await getReceiptData(orderId);
    
    res.json({
      success: true,
      data: invoiceData
    });
  } catch (error) {
    logger.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/invoices/:orderId/text
 * Get text-format receipt for thermal printer
 */
router.get('/:orderId/text', async (req, res) => {
  try {
    const { orderId } = req.params;
    const invoiceData = await getReceiptData(orderId);
    
    res.set('Content-Type', 'text/plain');
    res.send(invoiceData.receiptText);
  } catch (error) {
    logger.error('Receipt text generation error:', error);
    res.status(500).send('Error generating receipt');
  }
});

export default router;
