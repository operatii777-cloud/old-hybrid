import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

// ===== DASHBOARD PRINCIPAL - KPI-uri în timp real =====

// Dashboard overview - KPI-uri pentru ziua curentă
router.get('/dashboard/overview', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = req.query;
    const targetDate = data || today;
    
    // Calculează KPI-urile pentru ziua specificată
    const kpis = await calculateDailyKPIs(targetDate);
    
    // Obține și comparația cu ziua precedentă
    const yesterday = new Date(new Date(targetDate).getTime() - 24*60*60*1000)
      .toISOString().split('T')[0];
    const yesterdayKPIs = await calculateDailyKPIs(yesterday);
    
    // Calculează procentaje de creștere
    const growth = {
      vanzari: calculateGrowthPercent(kpis.total_vanzari, yesterdayKPIs.total_vanzari),
      comenzi: calculateGrowthPercent(kpis.numar_comenzi, yesterdayKPIs.numar_comenzi),
      profit: calculateGrowthPercent(kpis.profit_brut, yesterdayKPIs.profit_brut),
      aov: calculateGrowthPercent(kpis.average_order_value, yesterdayKPIs.average_order_value)
    };
    
    res.json({
      date: targetDate,
      kpis,
      growth,
      comparison: {
        yesterday: yesterdayKPIs,
        yesterday_date: yesterday
      }
    });
  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Eroare la preluarea dashboard-ului' });
  }
});

// KPI-uri detaliate pentru o perioadă
router.get('/kpis/perioada', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    
    if (!data_start || !data_end) {
      return res.status(400).json({ error: 'data_start și data_end sunt obligatorii' });
    }
    
    const kpis = await db().all(`
      SELECT * FROM kpi_zilnic 
      WHERE data BETWEEN ? AND ?
      ORDER BY data DESC
    `, [data_start, data_end]);
    
    // Calculează totale și medii pentru perioadă
    const summary = kpis.reduce((acc, kpi) => ({
      total_vanzari: acc.total_vanzari + (kpi.total_vanzari || 0),
      total_comenzi: acc.total_comenzi + (kpi.numar_comenzi || 0),
      total_profit: acc.total_profit + (kpi.profit_brut || 0),
      avg_food_cost: acc.avg_food_cost + (kpi.food_cost_percent || 0),
      days: acc.days + 1
    }), { total_vanzari: 0, total_comenzi: 0, total_profit: 0, avg_food_cost: 0, days: 0 });
    
    if (summary.days > 0) {
      summary.avg_order_value = summary.total_vanzari / Math.max(summary.total_comenzi, 1);
      summary.avg_food_cost = summary.avg_food_cost / summary.days;
      summary.profit_margin = (summary.total_profit / Math.max(summary.total_vanzari, 1)) * 100;
    }
    
    res.json({ kpis, summary });
  } catch (error) {
    logger.error('KPI perioada error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ANALIZA VÂNZĂRI =====

// Vânzări per oră (pentru analiza traficului)
router.get('/sales/hourly/:data', async (req, res) => {
  try {
    const { data } = req.params;
    
    // Obține vânzările reale din tranzacții
    const hourlySales = await db().all(`
      SELECT 
        CAST(strftime('%H', t.ora) AS INTEGER) as ora,
        COUNT(*) as numar_comenzi,
        SUM(t.suma) as vanzari,
        AVG(t.suma) as aov
      FROM tranzactii_sesiune t
      JOIN sesiuni_casa s ON t.sesiune_id = s.id
      WHERE t.data = ?
      GROUP BY CAST(strftime('%H', t.ora) AS INTEGER)
      ORDER BY ora
    `, [data]);
    
    // Completează orele lipsă cu 0
    const completeHours = Array.from({length: 24}, (_, i) => {
      const existing = hourlySales.find(h => h.ora === i);
      return existing || {
        ora: i,
        numar_comenzi: 0,
        vanzari: 0,
        aov: 0
      };
    });
    
    res.json(completeHours);
  } catch (error) {
    logger.error('Hourly sales error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Top produse pentru o perioadă
router.get('/sales/top-produse', async (req, res) => {
  try {
    const { data_start, data_end, limit = 10 } = req.query;
    
    const topProducts = await db().all(`
      SELECT 
        pp.cod_prod,
        pp.den_prod,
        SUM(pp.cantitate_vanduta) as total_cantitate,
        SUM(pp.valoare_vanzari) as total_vanzari,
        SUM(pp.profit) as total_profit,
        AVG(pp.profit_percent) as avg_profit_percent,
        AVG(pp.ranking_popularitate) as avg_ranking
      FROM performance_produse pp
      WHERE pp.data BETWEEN ? AND ?
      GROUP BY pp.cod_produs, pp.denumire_produs
      ORDER BY total_vanzari DESC
      LIMIT ?
    `, [data_start || '1900-01-01', data_end || '9999-12-31', limit]);
    
    res.json(topProducts);
  } catch (error) {
    logger.error('Top products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ANALIZA PROFITABILITATE =====

// Food cost analysis
router.get('/profitability/food-cost', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    const foodCostData = await db().all(`
      SELECT 
        data,
        food_cost,
        total_vanzari,
        food_cost_percent,
        profit_brut,
        profit_percent
      FROM kpi_zilnic 
      WHERE data BETWEEN ? AND ?
      ORDER BY data DESC
    `, [data_start || today, data_end || today]);
    
    // Calculează mediile
    const avgFoodCost = foodCostData.reduce((sum, day) => sum + (day.food_cost_percent || 0), 0) / Math.max(foodCostData.length, 1);
    const avgProfit = foodCostData.reduce((sum, day) => sum + (day.profit_percent || 0), 0) / Math.max(foodCostData.length, 1);
    
    res.json({
      daily_data: foodCostData,
      averages: {
        avg_food_cost_percent: Math.round(avgFoodCost * 100) / 100,
        avg_profit_percent: Math.round(avgProfit * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Food cost analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== TRENDS ȘI COMPARAȚII =====

// Trends săptămânale
router.get('/trends/weekly', async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    
    const weeklyTrends = await db().all(`
      SELECT * FROM trends_perioada 
      WHERE tip_perioada = 'saptamana'
      ORDER BY an DESC, perioada DESC
      LIMIT ?
    `, [weeks]);
    
    res.json(weeklyTrends);
  } catch (error) {
    logger.error('Weekly trends error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trends lunare
router.get('/trends/monthly', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const monthlyTrends = await db().all(`
      SELECT * FROM trends_perioada 
      WHERE tip_perioada = 'luna'
      ORDER BY an DESC, perioada DESC
      LIMIT ?
    `, [months]);
    
    res.json(monthlyTrends);
  } catch (error) {
    logger.error('Monthly trends error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== MANAGEMENT ACTIONS =====

// Recalculează KPI-urile pentru o dată
router.post('/kpis/recalculate/:data', async (req, res) => {
  try {
    const { data } = req.params;
    const kpis = await calculateDailyKPIs(data);
    
    await db().run(`
      INSERT OR REPLACE INTO kpi_zilnic (
        data, total_vanzari, numar_comenzi, average_order_value, vanzari_cash, vanzari_card,
        food_cost_percent, profit_brut, profit_percent, calculat_la
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data, kpis.total_vanzari, kpis.numar_comenzi, kpis.average_order_value,
      kpis.vanzari_cash, kpis.vanzari_card, kpis.food_cost_percent,
      kpis.profit_brut, kpis.profit_percent
    ]);
    
    res.json({ success: true, kpis });
  } catch (error) {
    logger.error('Recalculate KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FUNCȚII HELPER =====

async function calculateDailyKPIs(data) {
  try {
    // Calculează din tranzacțiile reale
    const salesData = await db().get(`
      SELECT 
        COUNT(*) as numar_comenzi,
        COALESCE(SUM(suma), 0) as total_vanzari,
        COALESCE(AVG(suma), 0) as average_order_value,
        COALESCE(SUM(CASE WHEN tip_plata = 'CASH' THEN suma ELSE 0 END), 0) as vanzari_cash,
        COALESCE(SUM(CASE WHEN tip_plata = 'CARD' THEN suma ELSE 0 END), 0) as vanzari_card
      FROM tranzactii_sesiune 
      WHERE data = ?
    `, [data]);
    
    // Calculează costuri estimate (30% food cost default dacă nu avem date reale)
    const foodCostPercent = 30.0; // Default - va fi calculat din rețete în viitor
    const food_cost = (salesData.total_vanzari * foodCostPercent) / 100;
    const profit_brut = salesData.total_vanzari - food_cost;
    const profit_percent = salesData.total_vanzari > 0 ? (profit_brut / salesData.total_vanzari) * 100 : 0;
    
    return {
      ...salesData,
      food_cost,
      food_cost_percent: foodCostPercent,
      profit_brut,
      profit_percent,
      // Placeholder values - vor fi calculate din date reale
      numar_mese_utilizate: 0,
      rata_ocupare_mese: 0,
      timp_mediu_masa: 0,
      numar_ospetari_activi: 1,
      clienti_noi: 0,
      clienti_regulari: 0,
      rata_returnare_clienti: 0
    };
  } catch (error) {
    logger.error('Calculate KPIs error:', error);
    return {
      total_vanzari: 0,
      numar_comenzi: 0,
      average_order_value: 0,
      vanzari_cash: 0,
      vanzari_card: 0,
      food_cost: 0,
      food_cost_percent: 0,
      profit_brut: 0,
      profit_percent: 0
    };
  }
}

function calculateGrowthPercent(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

export default router;