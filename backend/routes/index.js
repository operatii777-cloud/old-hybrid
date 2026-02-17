import loginRoutes from './auth/login.js';
import meseRoutes from './pos/mese.js';
import comenziRoutes from './pos/comenzi.js';
import produsRoute from './pos/produse.js';
import adminRoutes from './admin/dashboard.js';
import magazieRoutes from './admin/magazie.js';
import historyRoutes from './admin/history.js';
import extendedRoutes from './admin/extended.js';
import cashRegisterRoutes from './admin/cash-register.js';
import biRoutes from './admin/business-intelligence.js';
import foodCostRoutes from './admin/food-cost.js';
import deliveryRoutes from './admin/delivery.js';
import auditRoutes from './admin/audit.js';
import ublRoutes from './admin/ubl-anaf.js';
import rapoarteRoutes from './admin/rapoarte.js';
import clientiRoutes from './admin/clienti.js';
import departamenteRoutes from './admin/departamente.js';
import grupeRoutes from './admin/grupe.js';
import observatiiRoutes from './admin/observatii.js';
import promotiiRoutes from './admin/promotii.js';
import utilizatoriRoutes from './admin/utilizatori.js';
import parserRoutes from './admin/parser.js';

export function setupRoutes(app) {
  // Auth
  app.use('/api/auth', loginRoutes);

  // Parser
  app.use('/api/parser', parserRoutes);

  // POS
  app.use('/api/mese', meseRoutes);
  app.use('/api/comenzi', comenziRoutes);
  app.use('/api/produse', produsRoute);

  // Admin
  app.use('/api/admin', adminRoutes);
  app.use('/api/magazie', magazieRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/extended', extendedRoutes);
  app.use('/api/cash-register', cashRegisterRoutes);
  app.use('/api/bi', biRoutes);
  app.use('/api/food-cost', foodCostRoutes);
  app.use('/api/delivery', deliveryRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/ubl', ublRoutes);
  app.use('/api/rapoarte', rapoarteRoutes);
  app.use('/api/clienti', clientiRoutes);
  app.use('/api/departamente', departamenteRoutes);
  app.use('/api/grupe', grupeRoutes);
  app.use('/api/observatii', observatiiRoutes);
  app.use('/api/promotii', promotiiRoutes);
  app.use('/api/utilizatori', utilizatoriRoutes);

  // Not found
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}
