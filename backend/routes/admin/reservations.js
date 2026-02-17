import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * GET /api/reservations
 * Get all reservations with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { status, date, table_id } = req.query;
    
    let query = `
      SELECT r.*, m.nume as table_name
      FROM reservations r
      LEFT JOIN mese m ON r.table_id = m.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    if (date) {
      query += ' AND r.date = ?';
      params.push(date);
    }
    
    if (table_id) {
      query += ' AND r.table_id = ?';
      params.push(table_id);
    }
    
    query += ' ORDER BY r.date DESC, r.time DESC';
    
    const reservations = await db.all(query, params);
    
    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    logger.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reservations
 * Create a new reservation
 */
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const {
      client_name,
      client_phone,
      client_email,
      date,
      time,
      num_people,
      table_id,
      notes
    } = req.body;
    
    // Validation
    if (!client_name || !client_phone || !date || !time || !num_people) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Check if table is available (if specified)
    if (table_id) {
      const existingReservation = await db.get(`
        SELECT * FROM reservations
        WHERE table_id = ? AND date = ? AND time = ? AND status != 'cancelled'
      `, [table_id, date, time]);
      
      if (existingReservation) {
        return res.status(400).json({
          success: false,
          error: 'Table already reserved for this time'
        });
      }
    }
    
    const reservationId = uuidv4();
    
    await db.run(`
      INSERT INTO reservations (
        id, client_name, client_phone, client_email,
        date, time, num_people, table_id, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      reservationId,
      client_name,
      client_phone,
      client_email,
      date,
      time,
      num_people,
      table_id,
      notes
    ]);
    
    const reservation = await db.get(
      'SELECT * FROM reservations WHERE id = ?',
      [reservationId]
    );
    
    logger.info(`Reservation created: ${reservationId} for ${client_name}`);
    
    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    logger.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/reservations/:id
 * Update reservation status or details
 */
router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { status, table_id, notes } = req.body;
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (table_id !== undefined) {
      updates.push('table_id = ?');
      params.push(table_id);
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    await db.run(
      `UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const reservation = await db.get(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );
    
    logger.info(`Reservation updated: ${id}`);
    
    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    logger.error('Error updating reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/reservations/:id
 * Delete a reservation
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    await db.run('DELETE FROM reservations WHERE id = ?', [id]);
    
    logger.info(`Reservation deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Reservation deleted'
    });
  } catch (error) {
    logger.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reservations/availability/:date
 * Check table availability for a specific date
 */
router.get('/availability/:date', async (req, res) => {
  try {
    const db = getDatabase();
    const { date } = req.params;
    
    const tables = await db.all('SELECT * FROM mese');
    
    const reservations = await db.all(`
      SELECT * FROM reservations
      WHERE date = ? AND status != 'cancelled'
    `, [date]);
    
    const availability = tables.map(table => {
      const tableReservations = reservations.filter(r => r.table_id === table.id);
      return {
        table_id: table.id,
        table_name: table.nume,
        capacity: table.capacitate,
        reservations: tableReservations.map(r => ({
          time: r.time,
          num_people: r.num_people
        }))
      };
    });
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
