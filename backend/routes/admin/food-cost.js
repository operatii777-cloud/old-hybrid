import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

// ===== CALCUL FOOD COST =====

// Calculează food cost pentru un produs specific
router.get('/produs/:codProdus', async (req, res) => {
  try {
    const { codProdus } = req.params;
    
    // Obține produsul
    const produs = await db().get(`
      SELECT p.*, pp.pret1, pp.pret2, pp.pret3 
      FROM produse p
      LEFT JOIN produse_pos pp ON p.cod_prod = pp.cod_prod
      WHERE p.cod_prod = ?
    `, [codProdus]);
    
    if (!produs) {
      return res.status(404).json({ error: 'Produs nu a fost găsit' });
    }
    
    // Calculează costul din rețetă
    const costAnalysis = await calculateProductCost(codProdus);
    
    // Calculează profitabilitatea pentru toate prețurile
    const profitability = {
      pret1: calculateProfitability(costAnalysis.cost_total, produs.pret1 || produs.pret_vanzare),
      pret2: calculateProfitability(costAnalysis.cost_total, produs.pret2 || 0),
      pret3: calculateProfitability(costAnalysis.cost_total, produs.pret3 || 0)
    };
    
    res.json({
      produs,
      cost_analysis: costAnalysis,
      profitability,
      recommendations: generateRecommendations(costAnalysis, profitability)
    });
  } catch (error) {
    logger.error('Product food cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analiză food cost pentru toate produsele
router.get('/toate-produsele', async (req, res) => {
  try {
    const { sortBy = 'cost_percent', order = 'DESC', limit = 50 } = req.query;
    
    // Obține toate produsele cu costurile calculate
    const produse = await db().all(`
      SELECT p.cod_prod, p.den_prod as denumire, p.pret_vanzare, pp.pret1, pp.pret2, pp.pret3
      FROM produse p
      LEFT JOIN produse_pos pp ON p.cod_prod = pp.cod_prod
      ORDER BY p.den_prod
    `);
    
    // Calculează food cost pentru fiecare produs
    const foodCostAnalysis = await Promise.all(
      produse.map(async (produs) => {
        const costAnalysis = await calculateProductCost(produs.cod_prod);
        const pret_principal = produs.pret1 || produs.pret_vanzare;
        const profitability = calculateProfitability(costAnalysis.cost_total, pret_principal);
        
        return {
          ...produs,
          cost_total: costAnalysis.cost_total,
          cost_percent: profitability.cost_percent,
          profit_ron: profitability.profit_ron,
          profit_percent: profitability.profit_percent,
          ingredients_count: costAnalysis.ingredients.length,
          status: getProductStatus(profitability.cost_percent)
        };
      })
    );
    
    // Sortează rezultatele
    let sortedResults = foodCostAnalysis.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return order === 'ASC' ? aVal - bVal : bVal - aVal;
    });
    
    // Limitează rezultatele
    if (limit) {
      sortedResults = sortedResults.slice(0, parseInt(limit));
    }
    
    // Calculează statistici generale
    const statistics = calculateOverallStatistics(foodCostAnalysis);
    
    res.json({
      produse: sortedResults,
      statistics,
      total_count: foodCostAnalysis.length
    });
  } catch (error) {
    logger.error('All products food cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Produse cu probleme de cost (food cost prea mare)
router.get('/alerte', async (req, res) => {
  try {
    const { threshold = 35 } = req.query; // 35% food cost threshold implicit
    
    const produse = await db().all(`
      SELECT p.cod_prod, p.den_prod as denumire, p.pret_vanzare, pp.pret1
      FROM produse p
      LEFT JOIN produse_pos pp ON p.cod_prod = pp.cod_prod
    `);
    
    const problematicProducts = [];
    
    for (const produs of produse) {
      const costAnalysis = await calculateProductCost(produs.cod_prod);
      const pret = produs.pret1 || produs.pret_vanzare;
      const profitability = calculateProfitability(costAnalysis.cost_total, pret);
      
      if (profitability.cost_percent > threshold) {
        problematicProducts.push({
          ...produs,
          cost_total: costAnalysis.cost_total,
          cost_percent: profitability.cost_percent,
          profit_percent: profitability.profit_percent,
          ingredients: costAnalysis.ingredients,
          recommended_price: costAnalysis.cost_total / (threshold / 100),
          issue_type: profitability.cost_percent > 50 ? 'CRITIC' : 'WARNING'
        });
      }
    }
    
    // Sortează după cel mai problematic
    problematicProducts.sort((a, b) => b.cost_percent - a.cost_percent);
    
    res.json({
      alerte: problematicProducts,
      threshold_percent: threshold,
      count: problematicProducts.length
    });
  } catch (error) {
    logger.error('Food cost alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== OPTIMIZARE PREȚURI =====

// Sugerează prețuri optimale pentru un produs
router.get('/optimizare-pret/:codProdus', async (req, res) => {
  try {
    const { codProdus } = req.params;
    const { target_cost_percent = 30, target_profit_percent = 70 } = req.query;
    
    const costAnalysis = await calculateProductCost(codProdus);
    
    // Calculează prețuri pentru diferite scenarii
    const priceOptimization = {
      current_cost: costAnalysis.cost_total,
      
      // Preț bazat pe target cost %
      price_by_cost_percent: costAnalysis.cost_total / (target_cost_percent / 100),
      
      // Preț bazat pe target profit %
      price_by_profit_percent: costAnalysis.cost_total / ((100 - target_profit_percent) / 100),
      
      // Scenarii diferite
      scenarios: [
        { name: 'Conservative (35% cost)', price: costAnalysis.cost_total / 0.35, cost_percent: 35, profit_percent: 65 },
        { name: 'Optimal (30% cost)', price: costAnalysis.cost_total / 0.30, cost_percent: 30, profit_percent: 70 },
        { name: 'Premium (25% cost)', price: costAnalysis.cost_total / 0.25, cost_percent: 25, profit_percent: 75 },
        { name: 'Luxury (20% cost)', price: costAnalysis.cost_total / 0.20, cost_percent: 20, profit_percent: 80 }
      ]
    };
    
    res.json(priceOptimization);
  } catch (error) {
    logger.error('Price optimization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RAPOARTE PERIODICE =====

// Raport food cost pentru o perioadă
router.get('/raport-perioada', async (req, res) => {
  try {
    const { data_start, data_end, group_by = 'produs' } = req.query;
    
    if (group_by === 'produs') {
      // Raport pe produse
      const salesData = await db().all(`
        SELECT 
          cl.cod_produs,
          p.den_prod as denumire,
          SUM(cl.cantitate) as cantitate_totala,
          SUM(cl.valoare) as vanzari_totale,
          COUNT(DISTINCT c.id) as numar_comenzi
        FROM comenzi_linii cl
        JOIN comenzi c ON cl.comanda_id = c.id
        JOIN produse p ON cl.cod_produs = p.cod_prod
        WHERE c.data_comanda BETWEEN ? AND ?
        GROUP BY cl.cod_produs, p.den_prod
        ORDER BY vanzari_totale DESC
      `, [data_start || '1900-01-01', data_end || '9999-12-31']);
      
      // Calculează food cost pentru fiecare
      const reportData = await Promise.all(
        salesData.map(async (item) => {
          const costAnalysis = await calculateProductCost(item.cod_produs);
          const totalCost = costAnalysis.cost_total * item.cantitate_totala;
          const profit = item.vanzari_totale - totalCost;
          
          return {
            ...item,
            cost_unitar: costAnalysis.cost_total,
            cost_total: totalCost,
            profit,
            profit_percent: item.vanzari_totale > 0 ? (profit / item.vanzari_totale) * 100 : 0,
            cost_percent: item.vanzari_totale > 0 ? (totalCost / item.vanzari_totale) * 100 : 0
          };
        })
      );
      
      res.json(reportData);
    } else {
      // Alte tipuri de grupare (zi, săptămână, etc.)
      res.json({ message: 'Group by ' + group_by + ' not implemented yet' });
    }
  } catch (error) {
    logger.error('Period report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FUNCȚII HELPER =====

async function calculateProductCost(codProdus) {
  try {
    // Obține rețeta produsului
    const ingredients = await db().all(`
      SELECT 
        r.cod_material,
        r.cantitate,
        r.um,
        mp.denumire,
        mp.pret as pret_kg,
        mp.um as um_material
      FROM retete r
      JOIN materii_prime mp ON r.cod_material = mp.cod
      WHERE r.cod_reteta = ?
    `, [codProdus]);
    
    let cost_total = 0;
    const detailed_ingredients = [];
    
    for (const ingredient of ingredients) {
      // Calculează costul pentru cantitatea necesară
      let cost_ingredient = 0;
      
      if (ingredient.um_material === 'Kg' && ingredient.um === 'grame') {
        // Conversie Kg -> grame
        cost_ingredient = (ingredient.pret_kg / 1000) * ingredient.cantitate;
      } else if (ingredient.um_material === 'Litru' && ingredient.um === 'ml') {
        // Conversie Litru -> ml
        cost_ingredient = (ingredient.pret_kg / 1000) * ingredient.cantitate;
      } else {
        // Aceeași unitate de măsură
        cost_ingredient = ingredient.pret_kg * ingredient.cantitate;
      }
      
      cost_total += cost_ingredient;
      
      detailed_ingredients.push({
        ...ingredient,
        cost_ingredient: Math.round(cost_ingredient * 100) / 100
      });
    }
    
    return {
      cost_total: Math.round(cost_total * 100) / 100,
      ingredients: detailed_ingredients,
      ingredients_count: ingredients.length
    };
  } catch (error) {
    logger.error('Calculate product cost error:', error);
    return {
      cost_total: 0,
      ingredients: [],
      ingredients_count: 0
    };
  }
}

function calculateProfitability(cost, price) {
  const cost_ron = cost || 0;
  const price_ron = price || 0;
  
  if (price_ron <= 0) {
    return {
      cost_percent: 0,
      profit_ron: 0,
      profit_percent: 0
    };
  }
  
  const profit_ron = price_ron - cost_ron;
  const cost_percent = (cost_ron / price_ron) * 100;
  const profit_percent = (profit_ron / price_ron) * 100;
  
  return {
    cost_percent: Math.round(cost_percent * 100) / 100,
    profit_ron: Math.round(profit_ron * 100) / 100,
    profit_percent: Math.round(profit_percent * 100) / 100
  };
}

function getProductStatus(costPercent) {
  if (costPercent > 50) return 'CRITIC';
  if (costPercent > 35) return 'WARNING';
  if (costPercent > 25) return 'OK';
  return 'EXCELLENT';
}

function calculateOverallStatistics(products) {
  const validProducts = products.filter(p => p.cost_percent > 0);
  
  if (validProducts.length === 0) {
    return {
      avg_cost_percent: 0,
      avg_profit_percent: 0,
      products_count: 0
    };
  }
  
  const avgCost = validProducts.reduce((sum, p) => sum + p.cost_percent, 0) / validProducts.length;
  const avgProfit = validProducts.reduce((sum, p) => sum + p.profit_percent, 0) / validProducts.length;
  
  return {
    avg_cost_percent: Math.round(avgCost * 100) / 100,
    avg_profit_percent: Math.round(avgProfit * 100) / 100,
    products_count: validProducts.length,
    excellent_count: validProducts.filter(p => p.status === 'EXCELLENT').length,
    ok_count: validProducts.filter(p => p.status === 'OK').length,
    warning_count: validProducts.filter(p => p.status === 'WARNING').length,
    critical_count: validProducts.filter(p => p.status === 'CRITIC').length
  };
}

function generateRecommendations(costAnalysis, profitability) {
  const recommendations = [];
  
  if (profitability.pret1.cost_percent > 40) {
    recommendations.push({
      type: 'PRICE_INCREASE',
      message: 'Costul alimentar este prea mare (>40%). Considerați mărirea prețului.',
      priority: 'HIGH'
    });
  }
  
  if (costAnalysis.ingredients.length > 10) {
    recommendations.push({
      type: 'SIMPLIFY_RECIPE',
      message: 'Rețeta are multe ingrediente. Considerați simplificarea pentru reducerea costului.',
      priority: 'MEDIUM'
    });
  }
  
  if (profitability.pret1.cost_percent < 20) {
    recommendations.push({
      type: 'OPTIMIZE_PROFIT',
      message: 'Produs foarte profitabil. Considerați promovarea acestuia.',
      priority: 'LOW'
    });
  }
  
  return recommendations;
}

export default router;