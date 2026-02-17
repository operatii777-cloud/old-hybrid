import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { ospatar_pin } = req.body;

  if (!ospatar_pin) {
    return res.status(400).json({ error: 'PIN required' });
  }

  try {
    const db = getDatabase();
    
    const ospatar = await db.get(
      'SELECT * FROM ospetari WHERE pin = ?',
      [ospatar_pin]
    );

    if (!ospatar) {
      logger.warn(`Login failed: invalid PIN`);
      return res.status(401).json({ error: 'PIN incorect' });
    }

    const mese = await db.all('SELECT * FROM mese');

    logger.info(`Login success: ${ospatar.nume} (${ospatar.rol || 'OSPATAR'})`);

    res.json({
      success: true,
      ospatar: {
        id: ospatar.id,
        nume: ospatar.nume,
        pin: ospatar.pin,
        rol: ospatar.rol || 'OSPATAR'
      },
      mese: mese
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
