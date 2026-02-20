import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

const DEFAULT_LAT = 44.4268;
const DEFAULT_LON = 26.1025;

const WEATHER_EMOJI = {
  clear: '☀️',
  clouds: '⛅',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  snow: '🌨️',
  mist: '🌫️',
  wind: '🌬️',
};

function getCondition(weatherId) {
  // OpenWeatherMap condition ID ranges: 2xx=thunderstorm, 3xx=drizzle,
  // 5xx=rain, 6xx=snow, 7xx=atmosphere (mist/fog), 800=clear, 80x=clouds
  if (weatherId >= 200 && weatherId < 300) return 'storm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId >= 700 && weatherId < 800) return 'cloudy';
  if (weatherId === 800) return 'clear';
  if (weatherId > 800) return 'cloudy';
  return 'clear';
}

function getConditionEmoji(condition) {
  const map = { clear: '☀️', cloudy: '⛅', rain: '🌧️', snow: '🌨️', storm: '⛈️', windy: '🌬️' };
  return map[condition] || '☀️';
}

// ===== DEMO FALLBACK DATA =====

function getDemoForecast() {
  const days = [];
  const conditions = ['clear', 'cloudy', 'rain', 'clear', 'storm', 'clear', 'cloudy'];
  const descs = [
    'Cer senin', 'Parțial noros', 'Ploaie moderată', 'Însorit',
    'Furtună cu tunete', 'Cer senin', 'Noros',
  ];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const cond = conditions[i];
    days.push({
      date: d.toISOString().split('T')[0],
      temp_min: 18 - i + Math.floor(Math.random() * 4),
      temp_max: 28 + Math.floor(Math.random() * 6) - i,
      precipitation_prob: cond === 'rain' ? 80 : cond === 'storm' ? 95 : cond === 'cloudy' ? 30 : 5,
      wind_speed: 10 + Math.floor(Math.random() * 15),
      humidity: 50 + Math.floor(Math.random() * 30),
      uv_index: cond === 'clear' ? 7 + Math.floor(Math.random() * 3) : 3,
      condition: cond,
      icon: getConditionEmoji(cond),
      description_ro: descs[i],
    });
  }
  return days;
}

function getDemoCurrent() {
  return {
    temp: 24,
    feels_like: 26,
    temp_min: 19,
    temp_max: 29,
    humidity: 58,
    wind_speed: 14,
    wind_direction: 'NV',
    precipitation_prob: 10,
    uv_index: 6,
    visibility: 10000,
    condition: 'clear',
    icon: '☀️',
    description_ro: 'Cer senin',
    location: 'București',
    demo: true,
  };
}

// ===== HELPERS =====

async function fetchCurrentWeather(lat, lon, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ro`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status}`);
  return res.json();
}

async function fetchForecast(lat, lon, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ro`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeatherMap forecast error: ${res.status}`);
  return res.json();
}

function parseForecastByDay(data) {
  const byDay = {};
  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!byDay[date]) byDay[date] = [];
    byDay[date].push(item);
  }
  return Object.entries(byDay).slice(0, 7).map(([date, items]) => {
    const temps = items.map(i => i.main.temp);
    const mainItem = items[Math.floor(items.length / 2)] || items[0];
    const weatherId = mainItem.weather[0].id;
    const cond = getCondition(weatherId);
    return {
      date,
      temp_min: Math.round(Math.min(...temps)),
      temp_max: Math.round(Math.max(...temps)),
      precipitation_prob: Math.round((items.filter(i => i.pop > 0.3).length / items.length) * 100),
      wind_speed: Math.round(mainItem.wind.speed * 3.6),
      humidity: mainItem.main.humidity,
      uv_index: null,
      condition: cond,
      icon: getConditionEmoji(cond),
      description_ro: mainItem.weather[0].description,
    };
  });
}

// ===== ROUTES =====

// GET /forecast - 7-day forecast grouped by day
router.get('/forecast', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    if (!apiKey) {
      return res.json({ forecast: getDemoForecast(), demo: true, message: 'WEATHER_API_KEY neconfigurate — date demo' });
    }
    const data = await fetchForecast(lat, lon, apiKey);
    const forecast = parseForecastByDay(data);
    res.json({ forecast, demo: false });
  } catch (error) {
    logger.error('Weather forecast error:', error);
    res.json({ forecast: getDemoForecast(), demo: true, message: 'API indisponibil — date demo' });
  }
});

// GET /current - current weather
router.get('/current', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    if (!apiKey) {
      return res.json({ current: getDemoCurrent(), demo: true, message: 'WEATHER_API_KEY neconfigurate — date demo' });
    }
    const data = await fetchCurrentWeather(lat, lon, apiKey);
    const weatherId = data.weather[0].id;
    const cond = getCondition(weatherId);
    const current = {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 3.6),
      wind_direction: data.wind.deg ? degToCompass(data.wind.deg) : 'N/A',
      precipitation_prob: data.rain ? Math.min(100, Math.round((data.rain['1h'] || 0) * 10)) : 0,
      uv_index: null,
      visibility: data.visibility,
      condition: cond,
      icon: getConditionEmoji(cond),
      description_ro: data.weather[0].description,
      location: data.name,
      demo: false,
    };
    res.json({ current, demo: false });
  } catch (error) {
    logger.error('Weather current error:', error);
    res.json({ current: getDemoCurrent(), demo: true, message: 'API indisponibil — date demo' });
  }
});

function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV'];
  return dirs[Math.round(deg / 45) % 8];
}

// GET /menu-recommendations
router.get('/menu-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    let temp = 24;
    let condition = 'clear';
    let isWeekend = false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (apiKey) {
      try {
        const data = await fetchCurrentWeather(lat, lon, apiKey);
        temp = Math.round(data.main.temp);
        condition = getCondition(data.weather[0].id);
      } catch (_) { /* fallback to defaults */ }
    }

    const recommendations = [];

    if (temp < 5) {
      recommendations.push(
        { category: 'Supe și ciorbe', reason: 'Temperatură sub 5°C — clienții caută mâncare caldă', priority: 'HIGH', display_position: 1, suggested_discount: 0 },
        { category: 'Tocănițe și mâncăruri cu sos', reason: 'Vreme rece — mâncare comfort', priority: 'HIGH', display_position: 2, suggested_discount: 0 },
        { category: 'Băuturi calde (ceai, cafea, vin fiert)', reason: 'Temperaturi scăzute', priority: 'MEDIUM', display_position: 3, suggested_discount: 10 }
      );
    } else if (temp > 28) {
      recommendations.push(
        { category: 'Salate și preparate reci', reason: `Temperatură ${temp}°C — clienții preferă mâncare ușoară`, priority: 'HIGH', display_position: 1, suggested_discount: 0 },
        { category: 'Înghețată și deserturi reci', reason: 'Caniculă — vânzări crescute la rece', priority: 'HIGH', display_position: 2, suggested_discount: 0 },
        { category: 'Sucuri naturale și smoothie-uri', reason: 'Hidratare în sezon cald', priority: 'HIGH', display_position: 3, suggested_discount: 5 },
        { category: 'Băuturi reci (bere, limonadă)', reason: 'Temperaturi ridicate', priority: 'MEDIUM', display_position: 4, suggested_discount: 0 }
      );
    } else {
      recommendations.push(
        { category: 'Preparate principale', reason: 'Vreme moderată — cerere normală', priority: 'MEDIUM', display_position: 1, suggested_discount: 0 }
      );
    }

    if (condition === 'rain') {
      recommendations.push(
        { category: 'Comfort food (pizza, paste, burgeri)', reason: 'Ploaie — clienții comandă mai mult delivery', priority: 'HIGH', display_position: recommendations.length + 1, suggested_discount: 0 },
        { category: 'Promoție delivery', reason: 'Ziua ploioasă crește comenzile online cu ~40%', priority: 'HIGH', display_position: recommendations.length + 2, suggested_discount: 10 }
      );
    }

    if ((condition === 'clear') && isWeekend) {
      recommendations.push(
        { category: 'Specialități BBQ / Grătar', reason: 'Weekend însorit — terasă plină', priority: 'HIGH', display_position: recommendations.length + 1, suggested_discount: 0 },
        { category: 'Promoție terasă', reason: 'Vreme frumoasă weekend — trafic pietonal crescut', priority: 'MEDIUM', display_position: recommendations.length + 2, suggested_discount: 5 }
      );
    }

    res.json({ recommendations, weather_context: { temp, condition, is_weekend: isWeekend }, demo: !apiKey });
  } catch (error) {
    logger.error('Menu recommendations error:', error);
    res.json({
      recommendations: [
        { category: 'Supe și ciorbe', reason: 'Date demo — temperatură scăzută simulată', priority: 'HIGH', display_position: 1, suggested_discount: 0 },
        { category: 'Băuturi calde', reason: 'Date demo', priority: 'MEDIUM', display_position: 2, suggested_discount: 10 },
      ],
      demo: true,
    });
  }
});

// GET /stock-recommendations
router.get('/stock-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    let forecast = getDemoForecast();

    if (apiKey) {
      try {
        const data = await fetchForecast(lat, lon, apiKey);
        forecast = parseForecastByDay(data);
      } catch (_) { /* fallback */ }
    }

    const recommendations = [];
    const heatDays = forecast.filter(d => d.temp_max > 28).length;
    const coldDays = forecast.filter(d => d.temp_max < 5).length;
    const rainDays = forecast.filter(d => d.condition === 'rain' || d.condition === 'storm').length;
    const weekendRain = forecast.filter(d => {
      const dow = new Date(d.date).getDay();
      return (dow === 5 || dow === 6) && (d.condition === 'rain' || d.condition === 'storm');
    }).length;

    if (heatDays >= 2) {
      recommendations.push(
        { ingredient: 'Limonadă / citrice', current_stock_days: 3, recommended_order_qty: '+50%', reason: `${heatDays} zile cu temp >28°C prognozate`, urgency: 'URGENT' },
        { ingredient: 'Bere (sticle/doze)', current_stock_days: 4, recommended_order_qty: '+40%', reason: 'Val de căldură prognozat săptămâna viitoare', urgency: 'URGENT' },
        { ingredient: 'Înghețată / deserturi reci', current_stock_days: 2, recommended_order_qty: '+60%', reason: 'Caniculă — vânzări crescute estimate', urgency: 'URGENT' },
        { ingredient: 'Apă minerală', current_stock_days: 5, recommended_order_qty: '+30%', reason: 'Hidratare sporită în sezon cald', urgency: 'MEDIUM' }
      );
    }

    if (coldDays >= 2) {
      recommendations.push(
        { ingredient: 'Ingrediente supă (legume, oase)', current_stock_days: 3, recommended_order_qty: '+35%', reason: `${coldDays} zile reci prognozate`, urgency: 'URGENT' },
        { ingredient: 'Ceai și vin fiert', current_stock_days: 5, recommended_order_qty: '+25%', reason: 'Băuturi calde — cerere crescută', urgency: 'MEDIUM' }
      );
    }

    if (rainDays >= 1) {
      recommendations.push(
        { ingredient: 'Ingrediente pizza / paste', current_stock_days: 4, recommended_order_qty: '+25%', reason: `${rainDays} zile cu ploaie — delivery crescut`, urgency: 'MEDIUM' },
        { ingredient: 'Ambalaje delivery', current_stock_days: 6, recommended_order_qty: '+30%', reason: 'Ploaie prognozată — mai multe comenzi online', urgency: 'MEDIUM' }
      );
    }

    if (weekendRain >= 1) {
      recommendations.push(
        { ingredient: 'Produse terasă (napolitane, snacks)', current_stock_days: 7, recommended_order_qty: '-20%', reason: 'Ploaie weekend — terasă închisă parțial', urgency: 'LOW' }
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        { ingredient: 'Stocuri generale', current_stock_days: 5, recommended_order_qty: 'Normal', reason: 'Vreme stabilă prognozată', urgency: 'LOW' }
      );
    }

    res.json({ recommendations, forecast_summary: { heat_days: heatDays, cold_days: coldDays, rain_days: rainDays, weekend_rain: weekendRain }, demo: !apiKey });
  } catch (error) {
    logger.error('Stock recommendations error:', error);
    res.json({
      recommendations: [
        { ingredient: 'Limonadă / citrice', current_stock_days: 3, recommended_order_qty: '+50%', reason: 'Date demo — val de căldură simulat', urgency: 'URGENT' },
        { ingredient: 'Bere', current_stock_days: 4, recommended_order_qty: '+40%', reason: 'Date demo', urgency: 'URGENT' },
      ],
      demo: true,
    });
  }
});

// GET /staffing-recommendations
router.get('/staffing-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    let forecast = getDemoForecast();

    if (apiKey) {
      try {
        const data = await fetchForecast(lat, lon, apiKey);
        forecast = parseForecastByDay(data);
      } catch (_) { /* fallback */ }
    }

    const recommendations = [];

    for (const day of forecast) {
      if (day.condition === 'rain') {
        recommendations.push({
          date: day.date,
          change_type: 'REDISTRIBUTE',
          reason: `Ploaie prognozată (${day.precipitation_prob}%) — delivery +40%, dine-in -30%`,
          adjustment_percent: 40,
          role_affected: 'Curieri / Livratori',
          recommended_action: 'Alocați 2 curieri suplimentari, reduceți personal sală cu 1 persoană',
        });
      } else if (day.condition === 'storm') {
        recommendations.push({
          date: day.date,
          change_type: 'REDUCE',
          reason: `Furtună prognozată — trafic redus semnificativ`,
          adjustment_percent: -30,
          role_affected: 'Personal sală',
          recommended_action: 'Reduceți personalul proactiv, anulați rezervările de terasă',
        });
      } else if (day.temp_max > 28) {
        recommendations.push({
          date: day.date,
          change_type: 'INCREASE',
          reason: `Caniculă (${day.temp_max}°C) — terasă la capacitate maximă`,
          adjustment_percent: 25,
          role_affected: 'Chelneri terasă',
          recommended_action: 'Chemați personal suplimentar pentru terasă, asigurați stații de răcire',
        });
      } else if (day.condition === 'clear') {
        const dow = new Date(day.date).getDay();
        if (dow === 5 || dow === 6 || dow === 0) {
          recommendations.push({
            date: day.date,
            change_type: 'INCREASE',
            reason: 'Weekend însorit — aflux mare de clienți terasă',
            adjustment_percent: 15,
            role_affected: 'Chelneri / Ospătari',
            recommended_action: 'Asigurați acoperire completă terasă, deschideți toate mesele',
          });
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        date: forecast[0]?.date || new Date().toISOString().split('T')[0],
        change_type: 'NORMAL',
        reason: 'Vreme normală — personal standard',
        adjustment_percent: 0,
        role_affected: 'Toate rolurile',
        recommended_action: 'Nicio modificare necesară',
      });
    }

    res.json({ recommendations, demo: !apiKey });
  } catch (error) {
    logger.error('Staffing recommendations error:', error);
    res.json({
      recommendations: [
        { date: new Date().toISOString().split('T')[0], change_type: 'REDISTRIBUTE', reason: 'Date demo — ploaie simulată', adjustment_percent: 40, role_affected: 'Curieri', recommended_action: 'Alocați curieri suplimentari' },
      ],
      demo: true,
    });
  }
});

// GET /pricing-recommendations
router.get('/pricing-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    let temp = 24;
    let condition = 'clear';
    let tomorrowCondition = 'clear';

    if (apiKey) {
      try {
        const [curr, fore] = await Promise.all([
          fetchCurrentWeather(lat, lon, apiKey),
          fetchForecast(lat, lon, apiKey),
        ]);
        temp = Math.round(curr.main.temp);
        condition = getCondition(curr.weather[0].id);
        const forecastDays = parseForecastByDay(fore);
        tomorrowCondition = forecastDays[1]?.condition || 'clear';
      } catch (_) { /* fallback */ }
    }

    const recommendations = [];

    if (condition === 'rain' || tomorrowCondition === 'rain') {
      recommendations.push(
        { product_category: 'Toate categoriile', current_price_type: 'Standard', suggested_change: 'Extinde Happy Hour 15:00-18:00', reason: 'Ploaie reduce traficul natural', expected_revenue_impact: '+8%' },
        { product_category: 'Delivery', current_price_type: 'Standard', suggested_change: 'Reducere 10% comenzi online', reason: 'Ploaie stimulează delivery', expected_revenue_impact: '+15% comenzi delivery' }
      );
    }

    if (condition === 'clear' && temp > 25) {
      recommendations.push(
        { product_category: 'Terasă', current_price_type: 'Discountat', suggested_change: 'Eliminați discounturile terasă', reason: 'Terasă la capacitate — nu e nevoie de stimulente', expected_revenue_impact: '+5% revenue' },
        { product_category: 'Băuturi reci', current_price_type: 'Standard', suggested_change: 'Promovați pachete combo băuturi', reason: 'Cerere mare pe caniculă', expected_revenue_impact: '+12% vânzări băuturi' }
      );
    }

    if (condition === 'storm') {
      recommendations.push(
        { product_category: 'Toate categoriile', current_price_type: 'Standard', suggested_change: 'Activați promoție "Stay Home" — delivery gratuit', reason: 'Furtună — clienții nu ies din casă', expected_revenue_impact: '+20% comenzi delivery' }
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        { product_category: 'Toate categoriile', current_price_type: 'Standard', suggested_change: 'Prețuri standard recomandate', reason: 'Vreme stabilă — cerere normală', expected_revenue_impact: 'Neutru' }
      );
    }

    res.json({ recommendations, weather_context: { temp, condition, tomorrow_condition: tomorrowCondition }, demo: !apiKey });
  } catch (error) {
    logger.error('Pricing recommendations error:', error);
    res.json({
      recommendations: [
        { product_category: 'Delivery', current_price_type: 'Standard', suggested_change: 'Reducere 10% comenzi online', reason: 'Date demo — ploaie simulată', expected_revenue_impact: '+15%' },
      ],
      demo: true,
    });
  }
});

// GET /alerts
router.get('/alerts', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    let forecast = getDemoForecast();

    if (apiKey) {
      try {
        const data = await fetchForecast(lat, lon, apiKey);
        forecast = parseForecastByDay(data);
      } catch (_) { /* fallback */ }
    }

    const alerts = [];
    let idCounter = 1;

    for (const day of forecast) {
      const dateLabel = new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

      if (day.temp_max >= 34) {
        alerts.push({
          id: idCounter++,
          severity: 'HIGH',
          message: `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} maximă ${day.temp_max}°C — verificați stocul de băuturi reci`,
          action_required: 'Comandați băuturi reci suplimentar',
          related_module: 'stocuri',
          date: day.date,
        });
      } else if (day.temp_max > 28) {
        alerts.push({
          id: idCounter++,
          severity: 'MEDIUM',
          message: `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} temperatură ridicată (${day.temp_max}°C) — activați meniul de vară`,
          action_required: 'Activați promoțiile de vară',
          related_module: 'meniu',
          date: day.date,
        });
      }

      if (day.condition === 'storm') {
        const dow = new Date(day.date).getDay();
        const isWeekend = dow === 5 || dow === 6 || dow === 0;
        alerts.push({
          id: idCounter++,
          severity: 'HIGH',
          message: `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} furtună prognozată — ${isWeekend ? 'rezervările de terasă trebuie mutate în interior' : 'reduceți personalul preventiv'}`,
          action_required: isWeekend ? 'Mutați rezervările terasă în interior' : 'Ajustați programul personalului',
          related_module: isWeekend ? 'rezervari' : 'personal',
          date: day.date,
        });
      } else if (day.condition === 'rain') {
        const dow = new Date(day.date).getDay();
        if (dow === 5 || dow === 6) {
          alerts.push({
            id: idCounter++,
            severity: 'MEDIUM',
            message: `Weekend ploios (${dateLabel}) — activați oferta delivery +10%`,
            action_required: 'Activați promoția delivery pentru weekend',
            related_module: 'promotii',
            date: day.date,
          });
        }
      }
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 1,
        severity: 'LOW',
        message: 'Nicio alertă meteo pentru următoarele 7 zile — vreme stabilă prognozată',
        action_required: null,
        related_module: null,
        date: new Date().toISOString().split('T')[0],
      });
    }

    res.json({ alerts, demo: !apiKey });
  } catch (error) {
    logger.error('Weather alerts error:', error);
    res.json({
      alerts: [
        { id: 1, severity: 'HIGH', message: 'Mâine maximă 34°C — verificați stocul de băuturi reci', action_required: 'Comandați băuturi reci', related_module: 'stocuri', date: new Date().toISOString().split('T')[0] },
        { id: 2, severity: 'HIGH', message: 'Vineri furtună — rezervările de terasă trebuie mutate în interior', action_required: 'Mutați rezervările', related_module: 'rezervari', date: new Date().toISOString().split('T')[0] },
        { id: 3, severity: 'MEDIUM', message: 'Weekend ploios — activați oferta delivery +10%', action_required: 'Activați promoția', related_module: 'promotii', date: new Date().toISOString().split('T')[0] },
      ],
      demo: true,
    });
  }
});

export default router;
