import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

const DEFAULT_LAT = parseFloat(process.env.WEATHER_DEFAULT_LAT) || 44.4268;
const DEFAULT_LON = parseFloat(process.env.WEATHER_DEFAULT_LON) || 26.1025;

// ===== FREE WEATHER API: Open-Meteo (no API key required) =====
// Docs: https://open-meteo.com/en/docs
// License: CC BY 4.0 — 100% free, non-commercial & commercial use
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const OPEN_METEO_GEO_BASE = 'https://geocoding-api.open-meteo.com/v1';

// WMO Weather interpretation codes → internal condition names
// https://open-meteo.com/en/docs#weathervariables
function wmoToCondition(wmo) {
  if (wmo === 0) return 'clear';
  if (wmo <= 3) return 'cloudy';
  if (wmo <= 49) return 'cloudy'; // fog / mist
  if (wmo <= 67) return 'rain';
  if (wmo <= 77) return 'snow';
  if (wmo <= 82) return 'rain';
  if (wmo <= 86) return 'snow';
  if (wmo <= 99) return 'storm';
  return 'clear';
}

function wmoToDescRo(wmo) {
  if (wmo === 0) return 'Cer senin';
  if (wmo <= 3) return 'Parțial noros';
  if (wmo <= 49) return 'Ceață';
  if (wmo <= 57) return 'Burniță ușoară';
  if (wmo <= 67) return 'Ploaie';
  if (wmo <= 77) return 'Ninsoare';
  if (wmo <= 82) return 'Ploi torențiale';
  if (wmo <= 86) return 'Viscol';
  if (wmo <= 99) return 'Furtună cu tunete';
  return 'Necunoscut';
}

const WEATHER_EMOJI = {
  clear: '☀️',
  cloudy: '⛅',
  rain: '🌧️',
  drizzle: '🌦️',
  storm: '⛈️',
  snow: '🌨️',
  mist: '🌫️',
  wind: '🌬️',
};

function getConditionEmoji(condition) {
  return WEATHER_EMOJI[condition] || '🌤️';
}

// ===== OPEN-METEO API CALLS =====

async function fetchOpenMeteoForecast(lat, lon) {
  const url = new URL(`${OPEN_METEO_BASE}/forecast`);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('daily', [
    'weathercode', 'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'precipitation_probability_max',
    'windspeed_10m_max', 'uv_index_max',
  ].join(','));
  url.searchParams.set('hourly', 'relativehumidity_2m');
  url.searchParams.set('timezone', 'Europe/Bucharest');
  url.searchParams.set('forecast_days', '7');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
  return res.json();
}

async function fetchOpenMeteoCurrentWeather(lat, lon) {
  const url = new URL(`${OPEN_METEO_BASE}/forecast`);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('hourly', [
    'relativehumidity_2m', 'apparent_temperature',
    'precipitation_probability', 'visibility',
  ].join(','));
  url.searchParams.set('timezone', 'Europe/Bucharest');
  url.searchParams.set('forecast_days', '1');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo current error: ${res.status}`);
  return res.json();
}

function parseOpenMeteoForecast(data) {
  const d = data.daily;
  return d.time.map((date, i) => {
    const wmo = d.weathercode[i];
    const cond = wmoToCondition(wmo);
    // Avg humidity from hourly (first 24h slice for day i)
    const humHourly = data.hourly?.relativehumidity_2m;
    const humidity = humHourly
      ? Math.round(humHourly.slice(i * 24, i * 24 + 24).reduce((a, b) => a + b, 0) / 24)
      : 60;
    return {
      date,
      temp_min: Math.round(d.temperature_2m_min[i]),
      temp_max: Math.round(d.temperature_2m_max[i]),
      precipitation_prob: d.precipitation_probability_max[i] ?? 0,
      wind_speed: Math.round(d.windspeed_10m_max[i]),
      humidity,
      uv_index: Math.round(d.uv_index_max?.[i] ?? 0),
      condition: cond,
      icon: getConditionEmoji(cond),
      description_ro: wmoToDescRo(wmo),
    };
  });
}

function parseOpenMeteoCurrentWeather(data) {
  const cw = data.current_weather;
  const wmo = cw.weathercode;
  const cond = wmoToCondition(wmo);

  // Get current hour index to fetch matching hourly values
  const currentTime = cw.time; // ISO string like "2024-01-15T14:00"
  const hourIndex = data.hourly?.time?.findIndex(t => t === currentTime) ?? 0;

  return {
    temp: Math.round(cw.temperature),
    feels_like: Math.round(data.hourly?.apparent_temperature?.[hourIndex] ?? cw.temperature),
    humidity: data.hourly?.relativehumidity_2m?.[hourIndex] ?? 60,
    wind_speed: Math.round(cw.windspeed),
    wind_direction: degToCompass(cw.winddirection),
    precipitation_prob: data.hourly?.precipitation_probability?.[hourIndex] ?? 0,
    visibility: data.hourly?.visibility?.[hourIndex] ?? 10000,
    condition: cond,
    icon: getConditionEmoji(cond),
    description_ro: wmoToDescRo(wmo),
    location: `${DEFAULT_LAT.toFixed(2)}°N, ${DEFAULT_LON.toFixed(2)}°E`,
    source: 'open-meteo',
    demo: false,
  };
}

// ===== OPTIONAL FALLBACK: OpenWeatherMap (requires WEATHER_API_KEY) =====
function getConditionFromOWM(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return 'storm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId >= 700 && weatherId < 800) return 'cloudy';
  if (weatherId === 800) return 'clear';
  if (weatherId > 800) return 'cloudy';
  return 'clear';
}

async function fetchOWMCurrent(lat, lon, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ro`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status}`);
  return res.json();
}

async function fetchOWMForecast(lat, lon, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ro`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeatherMap forecast error: ${res.status}`);
  return res.json();
}

function parseOWMForecastByDay(data) {
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
    const cond = getConditionFromOWM(weatherId);
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

// ===== SHARED HELPERS =====

function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV'];
  return dirs[Math.round(deg / 45) % 8];
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
    temp: 24, feels_like: 26, temp_min: 19, temp_max: 29,
    humidity: 58, wind_speed: 14, wind_direction: 'NV',
    precipitation_prob: 10, uv_index: 6, visibility: 10000,
    condition: 'clear', icon: '☀️', description_ro: 'Cer senin',
    location: 'București', source: 'demo', demo: true,
  };
}

// ===== WEATHER FETCHER: tries Open-Meteo first (free), then OWM if key present =====

// Capitalize first letter of a string (for Romanian date labels)
function capitalize(s) {
  return s && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

async function getForecast(lat, lon) {
  // 1) Try Open-Meteo (free, no key needed)
  try {
    const data = await fetchOpenMeteoForecast(lat, lon);
    return { forecast: parseOpenMeteoForecast(data), source: 'open-meteo', demo: false };
  } catch (e) {
    logger.warn('Open-Meteo forecast failed, trying OWM fallback:', e.message);
  }

  // 2) Try OpenWeatherMap if API key is configured
  const owmKey = process.env.WEATHER_API_KEY;
  if (owmKey) {
    try {
      const data = await fetchOWMForecast(lat, lon, owmKey);
      return { forecast: parseOWMForecastByDay(data), source: 'openweathermap', demo: false };
    } catch (e) {
      logger.warn('OpenWeatherMap forecast failed:', e.message);
    }
  }

  // 3) Demo fallback
  return { forecast: getDemoForecast(), source: 'demo', demo: true };
}

async function getCurrentWeather(lat, lon) {
  // 1) Try Open-Meteo (free, no key needed)
  try {
    const data = await fetchOpenMeteoCurrentWeather(lat, lon);
    return { current: parseOpenMeteoCurrentWeather(data), source: 'open-meteo', demo: false };
  } catch (e) {
    logger.warn('Open-Meteo current failed, trying OWM fallback:', e.message);
  }

  // 2) Try OpenWeatherMap if API key is configured
  const owmKey = process.env.WEATHER_API_KEY;
  if (owmKey) {
    try {
      const data = await fetchOWMCurrent(lat, lon, owmKey);
      const weatherId = data.weather[0].id;
      const cond = getConditionFromOWM(weatherId);
      return {
        current: {
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          wind_speed: Math.round(data.wind.speed * 3.6),
          wind_direction: degToCompass(data.wind.deg || 0),
          precipitation_prob: data.rain ? Math.min(100, Math.round((data.rain['1h'] || 0) * 10)) : 0,
          visibility: data.visibility,
          condition: cond,
          icon: getConditionEmoji(cond),
          description_ro: data.weather[0].description,
          location: data.name,
          source: 'openweathermap',
          demo: false,
        },
        source: 'openweathermap',
        demo: false,
      };
    } catch (e) {
      logger.warn('OpenWeatherMap current failed:', e.message);
    }
  }

  // 3) Demo fallback
  return { current: getDemoCurrent(), source: 'demo', demo: true };
}

// ===== ROUTES =====

// GET /forecast - 7-day forecast
router.get('/forecast', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    const result = await getForecast(lat, lon);
    res.json({ ...result, message: result.demo ? 'Date demo — Open-Meteo indisponibil temporar' : null });
  } catch (error) {
    logger.error('Weather forecast error:', error);
    res.json({ forecast: getDemoForecast(), source: 'demo', demo: true });
  }
});

// GET /current - current weather
router.get('/current', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    const result = await getCurrentWeather(lat, lon);
    res.json({ ...result, message: result.demo ? 'Date demo — Open-Meteo indisponibil temporar' : null });
  } catch (error) {
    logger.error('Weather current error:', error);
    res.json({ current: getDemoCurrent(), source: 'demo', demo: true });
  }
});

// GET /menu-recommendations
router.get('/menu-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    let temp = 24;
    let condition = 'clear';
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    const { current } = await getCurrentWeather(lat, lon);
    temp = current.temp;
    condition = current.condition;

    const recommendations = [];

    if (temp < 5) {
      recommendations.push(
        { category: 'Supe și ciorbe', reason: `Temperatură ${temp}°C — vreme rece`, priority: 'HIGH', display_position: 1, suggested_discount: 0 },
        { category: 'Tocănițe și mâncăruri cu sos', reason: 'Comfort food pe vreme rece', priority: 'HIGH', display_position: 2, suggested_discount: 0 },
        { category: 'Băuturi calde (ceai, cafea, vin fiert)', reason: 'Temperaturi scăzute', priority: 'MEDIUM', display_position: 3, suggested_discount: 10 }
      );
    } else if (temp > 28) {
      recommendations.push(
        { category: 'Salate și preparate reci', reason: `Temperatură ${temp}°C — preferințe ușoare`, priority: 'HIGH', display_position: 1, suggested_discount: 0 },
        { category: 'Înghețată și deserturi reci', reason: 'Caniculă — vânzări crescute', priority: 'HIGH', display_position: 2, suggested_discount: 0 },
        { category: 'Sucuri naturale și smoothie-uri', reason: 'Hidratare în sezon cald', priority: 'HIGH', display_position: 3, suggested_discount: 5 },
        { category: 'Băuturi reci (bere, limonadă)', reason: 'Temperaturi ridicate', priority: 'MEDIUM', display_position: 4, suggested_discount: 0 }
      );
    } else {
      recommendations.push({ category: 'Preparate principale', reason: 'Vreme moderată — cerere normală', priority: 'MEDIUM', display_position: 1, suggested_discount: 0 });
    }

    if (condition === 'rain') {
      recommendations.push(
        { category: 'Comfort food (pizza, paste, burgeri)', reason: 'Ploaie — delivery crescut cu ~40%', priority: 'HIGH', display_position: recommendations.length + 1, suggested_discount: 0 },
        { category: 'Promoție delivery', reason: 'Ploaia stimulează comenzile online', priority: 'HIGH', display_position: recommendations.length + 2, suggested_discount: 10 }
      );
    }

    if (condition === 'clear' && isWeekend) {
      recommendations.push(
        { category: 'Specialități BBQ / Grătar', reason: 'Weekend însorit — terasă plină', priority: 'HIGH', display_position: recommendations.length + 1, suggested_discount: 0 },
        { category: 'Promoție terasă', reason: 'Vreme frumoasă weekend', priority: 'MEDIUM', display_position: recommendations.length + 2, suggested_discount: 5 }
      );
    }

    res.json({ recommendations, weather_context: { temp, condition, is_weekend: isWeekend }, source: current.source, demo: current.demo });
  } catch (error) {
    logger.error('Menu recommendations error:', error);
    res.json({ recommendations: [
      { category: 'Supe și ciorbe', reason: 'Date demo', priority: 'HIGH', display_position: 1, suggested_discount: 0 },
    ], demo: true });
  }
});

// GET /stock-recommendations
router.get('/stock-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    const { forecast } = await getForecast(lat, lon);

    const heatDays = forecast.filter(d => d.temp_max > 28).length;
    const coldDays = forecast.filter(d => d.temp_max < 5).length;
    const rainDays = forecast.filter(d => d.condition === 'rain' || d.condition === 'storm').length;
    const weekendRain = forecast.filter(d => {
      const dow = new Date(d.date).getDay();
      return (dow === 5 || dow === 6) && (d.condition === 'rain' || d.condition === 'storm');
    }).length;

    const recommendations = [];
    if (heatDays >= 2) {
      recommendations.push(
        { ingredient: 'Limonadă / citrice', current_stock_days: 3, recommended_order_qty: '+50%', reason: `${heatDays} zile cu temp >28°C prognozate`, urgency: 'URGENT' },
        { ingredient: 'Bere (sticle/doze)', current_stock_days: 4, recommended_order_qty: '+40%', reason: 'Val de căldură prognozat', urgency: 'URGENT' },
        { ingredient: 'Înghețată / deserturi reci', current_stock_days: 2, recommended_order_qty: '+60%', reason: 'Caniculă — vânzări crescute', urgency: 'URGENT' },
        { ingredient: 'Apă minerală', current_stock_days: 5, recommended_order_qty: '+30%', reason: 'Hidratare sporită', urgency: 'MEDIUM' }
      );
    }
    if (coldDays >= 2) {
      recommendations.push(
        { ingredient: 'Ingrediente supă (legume, oase)', current_stock_days: 3, recommended_order_qty: '+35%', reason: `${coldDays} zile reci prognozate`, urgency: 'URGENT' },
        { ingredient: 'Ceai și vin fiert', current_stock_days: 5, recommended_order_qty: '+25%', reason: 'Băuturi calde în sezon rece', urgency: 'MEDIUM' }
      );
    }
    if (rainDays >= 1) {
      recommendations.push(
        { ingredient: 'Ingrediente pizza / paste', current_stock_days: 4, recommended_order_qty: '+25%', reason: `${rainDays} zile cu ploaie — delivery crescut`, urgency: 'MEDIUM' },
        { ingredient: 'Ambalaje delivery', current_stock_days: 6, recommended_order_qty: '+30%', reason: 'Ploaie prognozată — mai multe comenzi online', urgency: 'MEDIUM' }
      );
    }
    if (weekendRain >= 1) {
      recommendations.push({ ingredient: 'Produse terasă', current_stock_days: 7, recommended_order_qty: '-20%', reason: 'Ploaie weekend — terasă închisă parțial', urgency: 'LOW' });
    }
    if (!recommendations.length) {
      recommendations.push({ ingredient: 'Stocuri generale', current_stock_days: 5, recommended_order_qty: 'Normal', reason: 'Vreme stabilă', urgency: 'LOW' });
    }

    res.json({ recommendations, forecast_summary: { heat_days: heatDays, cold_days: coldDays, rain_days: rainDays, weekend_rain: weekendRain } });
  } catch (error) {
    logger.error('Stock recommendations error:', error);
    res.json({ recommendations: [{ ingredient: 'Limonadă / citrice', current_stock_days: 3, recommended_order_qty: '+50%', reason: 'Date demo', urgency: 'URGENT' }], demo: true });
  }
});

// GET /staffing-recommendations
router.get('/staffing-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    const { forecast } = await getForecast(lat, lon);
    const recommendations = [];

    for (const day of forecast) {
      if (day.condition === 'rain') {
        recommendations.push({ date: day.date, change_type: 'REDISTRIBUTE', reason: `Ploaie prognozată (${day.precipitation_prob}%) — delivery +40%, dine-in -30%`, adjustment_percent: 40, role_affected: 'Curieri / Livratori', recommended_action: 'Alocați 2 curieri suplimentari, reduceți personal sală cu 1 persoană' });
      } else if (day.condition === 'storm') {
        recommendations.push({ date: day.date, change_type: 'REDUCE', reason: 'Furtună prognozată — trafic redus semnificativ', adjustment_percent: -30, role_affected: 'Personal sală', recommended_action: 'Reduceți personalul proactiv, anulați rezervările de terasă' });
      } else if (day.temp_max > 28) {
        recommendations.push({ date: day.date, change_type: 'INCREASE', reason: `Caniculă (${day.temp_max}°C) — terasă la capacitate maximă`, adjustment_percent: 25, role_affected: 'Chelneri terasă', recommended_action: 'Chemați personal suplimentar pentru terasă' });
      } else if (day.condition === 'clear') {
        const dow = new Date(day.date).getDay();
        if (dow === 5 || dow === 6 || dow === 0) {
          recommendations.push({ date: day.date, change_type: 'INCREASE', reason: 'Weekend însorit — aflux mare de clienți terasă', adjustment_percent: 15, role_affected: 'Chelneri / Ospătari', recommended_action: 'Asigurați acoperire completă terasă' });
        }
      }
    }

    if (!recommendations.length) {
      recommendations.push({ date: forecast[0]?.date || new Date().toISOString().split('T')[0], change_type: 'NORMAL', reason: 'Vreme normală — personal standard', adjustment_percent: 0, role_affected: 'Toate rolurile', recommended_action: 'Nicio modificare necesară' });
    }

    res.json({ recommendations });
  } catch (error) {
    logger.error('Staffing recommendations error:', error);
    res.json({ recommendations: [{ date: new Date().toISOString().split('T')[0], change_type: 'REDISTRIBUTE', reason: 'Date demo', adjustment_percent: 40, role_affected: 'Curieri', recommended_action: 'Alocați curieri suplimentari' }], demo: true });
  }
});

// GET /pricing-recommendations
router.get('/pricing-recommendations', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    const [currResult, foreResult] = await Promise.all([
      getCurrentWeather(lat, lon),
      getForecast(lat, lon),
    ]);
    const { temp, condition } = currResult.current;
    const tomorrowCondition = foreResult.forecast[1]?.condition || 'clear';
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
      recommendations.push({ product_category: 'Toate categoriile', current_price_type: 'Standard', suggested_change: 'Activați promoție delivery gratuit', reason: 'Furtună — clienții nu ies din casă', expected_revenue_impact: '+20% comenzi delivery' });
    }
    if (!recommendations.length) {
      recommendations.push({ product_category: 'Toate categoriile', current_price_type: 'Standard', suggested_change: 'Prețuri standard recomandate', reason: 'Vreme stabilă', expected_revenue_impact: 'Neutru' });
    }

    res.json({ recommendations, weather_context: { temp, condition, tomorrow_condition: tomorrowCondition }, source: currResult.source });
  } catch (error) {
    logger.error('Pricing recommendations error:', error);
    res.json({ recommendations: [{ product_category: 'Delivery', current_price_type: 'Standard', suggested_change: 'Reducere 10%', reason: 'Date demo', expected_revenue_impact: '+15%' }], demo: true });
  }
});

// GET /alerts
router.get('/alerts', async (req, res) => {
  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;
  try {
    const { forecast, demo } = await getForecast(lat, lon);
    const alerts = [];
    let idCounter = 1;

    for (const day of forecast) {
      const dateLabel = new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

      if (day.temp_max >= 34) {
        alerts.push({ id: idCounter++, severity: 'HIGH', message: `${capitalize(dateLabel)} maximă ${day.temp_max}°C — verificați stocul de băuturi reci`, action_required: 'Comandați băuturi reci suplimentar', related_module: 'stocuri', date: day.date });
      } else if (day.temp_max > 28) {
        alerts.push({ id: idCounter++, severity: 'MEDIUM', message: `${capitalize(dateLabel)} temperatură ridicată (${day.temp_max}°C) — activați meniul de vară`, action_required: 'Activați promoțiile de vară', related_module: 'meniu', date: day.date });
      }

      if (day.condition === 'storm') {
        const isWeekend = [5, 6, 0].includes(new Date(day.date).getDay());
        alerts.push({ id: idCounter++, severity: 'HIGH', message: `${capitalize(dateLabel)} furtună prognozată — ${isWeekend ? 'rezervările de terasă trebuie mutate în interior' : 'reduceți personalul preventiv'}`, action_required: isWeekend ? 'Mutați rezervările terasă în interior' : 'Ajustați programul personalului', related_module: isWeekend ? 'rezervari' : 'personal', date: day.date });
      } else if (day.condition === 'rain' && [5, 6].includes(new Date(day.date).getDay())) {
        alerts.push({ id: idCounter++, severity: 'MEDIUM', message: `Weekend ploios (${capitalize(dateLabel)}) — activați oferta delivery +10%`, action_required: 'Activați promoția delivery pentru weekend', related_module: 'promotii', date: day.date });
      }
    }

    if (!alerts.length) {
      alerts.push({ id: 1, severity: 'LOW', message: 'Nicio alertă meteo pentru următoarele 7 zile — vreme stabilă prognozată', action_required: null, related_module: null, date: new Date().toISOString().split('T')[0] });
    }

    res.json({ alerts, demo });
  } catch (error) {
    logger.error('Weather alerts error:', error);
    res.json({ alerts: [
      { id: 1, severity: 'HIGH', message: 'Mâine maximă 34°C — verificați stocul de băuturi reci', action_required: 'Comandați băuturi reci', related_module: 'stocuri', date: new Date().toISOString().split('T')[0] },
      { id: 2, severity: 'HIGH', message: 'Vineri furtună — rezervările de terasă trebuie mutate în interior', action_required: 'Mutați rezervările', related_module: 'rezervari', date: new Date().toISOString().split('T')[0] },
      { id: 3, severity: 'MEDIUM', message: 'Weekend ploios — activați oferta delivery +10%', action_required: 'Activați promoția', related_module: 'promotii', date: new Date().toISOString().split('T')[0] },
    ], demo: true });
  }
});

export default router;
