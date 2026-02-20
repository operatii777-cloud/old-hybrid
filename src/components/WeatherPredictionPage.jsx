import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WEATHER_EMOJI = {
  clear: '☀️',
  cloudy: '⛅',
  rain: '🌧️',
  snow: '🌨️',
  storm: '⛈️',
  windy: '🌬️',
  drizzle: '🌦️',
  mist: '🌫️',
};

const conditionEmoji = (cond) => WEATHER_EMOJI[cond] || '🌤️';

const DEMO_CURRENT = {
  temp: 24, feels_like: 26, temp_min: 19, temp_max: 29,
  humidity: 58, wind_speed: 14, wind_direction: 'NV',
  precipitation_prob: 10, uv_index: 6, visibility: 10000,
  condition: 'clear', icon: '☀️', description_ro: 'Cer senin',
  location: 'București', demo: true,
};

const DEMO_FORECAST = Array.from({ length: 7 }, (_, i) => {
  const conds = ['clear', 'cloudy', 'rain', 'clear', 'storm', 'clear', 'cloudy'];
  const descs = ['Cer senin', 'Parțial noros', 'Ploaie moderată', 'Însorit', 'Furtună', 'Cer senin', 'Noros'];
  const d = new Date(); d.setDate(d.getDate() + i);
  return {
    date: d.toISOString().split('T')[0],
    temp_min: 18 - i, temp_max: 28 + 2 - i,
    precipitation_prob: conds[i] === 'rain' ? 80 : conds[i] === 'storm' ? 95 : 10,
    wind_speed: 12 + i * 2, humidity: 55 + i * 3,
    condition: conds[i], icon: conditionEmoji(conds[i]), description_ro: descs[i],
  };
});

const DEMO_MENU = [
  { category: 'Salate și preparate reci', reason: 'Temperatură 24°C — clienții preferă mâncare ușoară', priority: 'HIGH', display_position: 1, suggested_discount: 0 },
  { category: 'Băuturi reci (bere, limonadă)', reason: 'Temperaturi ridicate', priority: 'HIGH', display_position: 2, suggested_discount: 5 },
  { category: 'Specialități BBQ / Grătar', reason: 'Weekend însorit — terasă plină', priority: 'MEDIUM', display_position: 3, suggested_discount: 0 },
];

const DEMO_STOCK = [
  { ingredient: 'Limonadă / citrice', current_stock_days: 3, recommended_order_qty: '+50%', reason: 'Val de căldură prognozat', urgency: 'URGENT' },
  { ingredient: 'Bere (sticle/doze)', current_stock_days: 4, recommended_order_qty: '+40%', reason: 'Temperaturi ridicate săptămâna viitoare', urgency: 'URGENT' },
  { ingredient: 'Înghețată / deserturi reci', current_stock_days: 2, recommended_order_qty: '+60%', reason: 'Caniculă — vânzări estimate crescute', urgency: 'URGENT' },
  { ingredient: 'Ambalaje delivery', current_stock_days: 6, recommended_order_qty: '+30%', reason: 'Ploaie prognozată vineri', urgency: 'MEDIUM' },
];

const DEMO_STAFFING = [
  { date: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })(), change_type: 'INCREASE', reason: 'Caniculă (31°C) — terasă la capacitate maximă', adjustment_percent: 25, role_affected: 'Chelneri terasă', recommended_action: 'Chemați personal suplimentar, deschideți toate mesele' },
  { date: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString().split('T')[0]; })(), change_type: 'REDISTRIBUTE', reason: 'Ploaie (80%) — delivery +40%, dine-in -30%', adjustment_percent: 40, role_affected: 'Curieri / Livratori', recommended_action: 'Alocați 2 curieri suplimentari, reduceți personal sală' },
  { date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(), change_type: 'REDUCE', reason: 'Furtună prognozată — trafic redus semnificativ', adjustment_percent: -30, role_affected: 'Personal sală', recommended_action: 'Reduceți personalul, anulați rezervările terasă' },
];

const DEMO_PRICING = [
  { product_category: 'Terasă', current_price_type: 'Discountat', suggested_change: 'Eliminați discounturile terasă', reason: 'Terasă la capacitate — nu e nevoie de stimulente', expected_revenue_impact: '+5% revenue' },
  { product_category: 'Băuturi reci', current_price_type: 'Standard', suggested_change: 'Promovați pachete combo băuturi', reason: 'Cerere mare pe caniculă', expected_revenue_impact: '+12% vânzări băuturi' },
  { product_category: 'Delivery', current_price_type: 'Standard', suggested_change: 'Reducere 10% comenzi online (vineri)', reason: 'Ploaie vineri reduce traficul natural', expected_revenue_impact: '+15% comenzi delivery' },
];

const DEMO_ALERTS = [
  { id: 1, severity: 'HIGH', message: 'Mâine maximă 34°C — verificați stocul de băuturi reci', action_required: 'Comandați băuturi reci suplimentar', related_module: 'stocuri', date: new Date().toISOString().split('T')[0] },
  { id: 2, severity: 'HIGH', message: 'Vineri furtună — rezervările de terasă trebuie mutate în interior', action_required: 'Mutați rezervările terasă în interior', related_module: 'rezervari', date: new Date().toISOString().split('T')[0] },
  { id: 3, severity: 'MEDIUM', message: 'Weekend ploios — activați oferta delivery +10%', action_required: 'Activați promoția delivery pentru weekend', related_module: 'promotii', date: new Date().toISOString().split('T')[0] },
];

const PriorityBadge = ({ value }) => {
  const colors = { HIGH: 'bg-red-100 text-red-700', MEDIUM: 'bg-yellow-100 text-yellow-700', LOW: 'bg-green-100 text-green-700', URGENT: 'bg-red-100 text-red-700', NORMAL: 'bg-blue-100 text-blue-700', INCREASE: 'bg-orange-100 text-orange-700', REDUCE: 'bg-purple-100 text-purple-700', REDISTRIBUTE: 'bg-cyan-100 text-cyan-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[value] || 'bg-gray-100 text-gray-600'}`}>{value}</span>;
};

const SeverityIcon = ({ severity }) => {
  if (severity === 'HIGH') return <span className="text-red-500 text-lg">🚨</span>;
  if (severity === 'MEDIUM') return <span className="text-orange-400 text-lg">⚠️</span>;
  return <span className="text-blue-400 text-lg">ℹ️</span>;
};

const WeatherPredictionPage = () => {
  const [activeTab, setActiveTab] = useState('meteo');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [menuRecs, setMenuRecs] = useState([]);
  const [stockRecs, setStockRecs] = useState([]);
  const [staffingRecs, setStaffingRecs] = useState([]);
  const [pricingRecs, setPricingRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadCurrent(),
      loadForecast(),
      loadAlerts(),
      loadMenuRecs(),
      loadStockRecs(),
      loadStaffingRecs(),
      loadPricingRecs(),
    ]);
    setLoading(false);
  };

  const loadCurrent = async () => {
    try {
      const res = await axios.get('/api/weather/current');
      setCurrent(res.data.current || DEMO_CURRENT);
      if (res.data.demo) setIsDemo(true);
    } catch {
      setCurrent(DEMO_CURRENT);
      setIsDemo(true);
    }
  };

  const loadForecast = async () => {
    try {
      const res = await axios.get('/api/weather/forecast');
      setForecast(res.data.forecast?.length ? res.data.forecast : DEMO_FORECAST);
      if (res.data.demo) setIsDemo(true);
    } catch {
      setForecast(DEMO_FORECAST);
      setIsDemo(true);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await axios.get('/api/weather/alerts');
      setAlerts(res.data.alerts || DEMO_ALERTS);
    } catch {
      setAlerts(DEMO_ALERTS);
    }
  };

  const loadMenuRecs = async () => {
    try {
      const res = await axios.get('/api/weather/menu-recommendations');
      setMenuRecs(res.data.recommendations || DEMO_MENU);
    } catch {
      setMenuRecs(DEMO_MENU);
    }
  };

  const loadStockRecs = async () => {
    try {
      const res = await axios.get('/api/weather/stock-recommendations');
      setStockRecs(res.data.recommendations || DEMO_STOCK);
    } catch {
      setStockRecs(DEMO_STOCK);
    }
  };

  const loadStaffingRecs = async () => {
    try {
      const res = await axios.get('/api/weather/staffing-recommendations');
      setStaffingRecs(res.data.recommendations || DEMO_STAFFING);
    } catch {
      setStaffingRecs(DEMO_STAFFING);
    }
  };

  const loadPricingRecs = async () => {
    try {
      const res = await axios.get('/api/weather/pricing-recommendations');
      setPricingRecs(res.data.recommendations || DEMO_PRICING);
    } catch {
      setPricingRecs(DEMO_PRICING);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const tabs = [
    { id: 'meteo', label: '🌤️ Meteo' },
    { id: 'meniu', label: '🍽️ Meniu' },
    { id: 'stocuri', label: '📦 Stocuri' },
    { id: 'personal', label: '👥 Personal' },
    { id: 'preturi', label: '💰 Prețuri' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-500 text-xl animate-pulse">⛅ Se încarcă datele meteo...</div>
      </div>
    );
  }

  const highAlerts = alerts.filter(a => a.severity === 'HIGH');
  const otherAlerts = alerts.filter(a => a.severity !== 'HIGH');

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🌦️ Motor de Predicție Meteo</h1>
          <p className="text-slate-500 text-sm">Recomandări inteligente bazate pe prognoza meteo</p>
        </div>
        <button onClick={loadAllData} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm font-medium transition-colors">
          🔄 Actualizează
        </button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sky-700 text-sm">
          <span className="text-lg">ℹ️</span>
          <span>Configurați <code className="bg-sky-100 px-1 rounded font-mono">WEATHER_API_KEY</code> în <code className="bg-sky-100 px-1 rounded font-mono">.env</code> pentru date meteo reale de la OpenWeatherMap. Acum se afișează date demonstrative.</span>
        </div>
      )}

      {/* HIGH alerts */}
      {highAlerts.length > 0 && (
        <div className="space-y-2">
          {highAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <SeverityIcon severity={alert.severity} />
              <div className="flex-1">
                <p className="text-red-800 font-semibold text-sm">{alert.message}</p>
                {alert.action_required && <p className="text-red-600 text-xs mt-0.5">Acțiune: {alert.action_required}</p>}
              </div>
              {alert.action_required && (
                <button className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors whitespace-nowrap">
                  Acționați
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MEDIUM alerts */}
      {otherAlerts.filter(a => a.severity === 'MEDIUM').map(alert => (
        <div key={alert.id} className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <SeverityIcon severity={alert.severity} />
          <div className="flex-1">
            <p className="text-orange-800 font-medium text-sm">{alert.message}</p>
            {alert.action_required && <p className="text-orange-600 text-xs mt-0.5">Acțiune: {alert.action_required}</p>}
          </div>
        </div>
      ))}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: METEO ===== */}
      {activeTab === 'meteo' && (
        <div className="space-y-4">
          {/* Current weather card */}
          {current && (
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium">{current.location || 'București'} — Acum</p>
                  <div className="flex items-end gap-3 mt-1">
                    <span className="text-7xl font-bold">{current.temp}°</span>
                    <span className="text-5xl mb-2">{current.icon || conditionEmoji(current.condition)}</span>
                  </div>
                  <p className="text-sky-100 mt-1 capitalize">{current.description_ro}</p>
                  <p className="text-sky-200 text-sm">Se simte ca {current.feels_like}° · Min {current.temp_min}° / Max {current.temp_max}°</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-sky-400/40">
                <div className="text-center">
                  <p className="text-sky-200 text-xs">Umiditate</p>
                  <p className="text-white font-semibold">{current.humidity}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sky-200 text-xs">Vânt</p>
                  <p className="text-white font-semibold">{current.wind_speed} km/h</p>
                </div>
                <div className="text-center">
                  <p className="text-sky-200 text-xs">Precipitații</p>
                  <p className="text-white font-semibold">{current.precipitation_prob}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sky-200 text-xs">UV Index</p>
                  <p className="text-white font-semibold">{current.uv_index ?? 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 7-day forecast strip */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-slate-700 font-semibold mb-3 text-sm">📅 Prognoză 7 zile</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {forecast.map((day, i) => (
                <div key={day.date} className={`flex-shrink-0 flex flex-col items-center rounded-xl p-3 min-w-[80px] ${i === 0 ? 'bg-sky-50 border border-sky-200' : 'bg-slate-50'}`}>
                  <p className="text-slate-500 text-xs font-medium">{i === 0 ? 'Azi' : formatDate(day.date)}</p>
                  <span className="text-2xl my-1">{day.icon || conditionEmoji(day.condition)}</span>
                  <p className="text-slate-800 font-bold text-sm">{day.temp_max}°</p>
                  <p className="text-slate-400 text-xs">{day.temp_min}°</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    <span className="text-xs">💧</span>
                    <span className="text-slate-500 text-xs">{day.precipitation_prob}%</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs">🌬️</span>
                    <span className="text-slate-400 text-xs">{day.wind_speed}km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: MENIU ===== */}
      {activeTab === 'meniu' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-800 font-semibold">🍽️ Recomandări Meniu bazate pe Meteo</h3>
            <p className="text-slate-500 text-sm mt-0.5">Categorii de promovat în funcție de condițiile meteo actuale și de mâine</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-semibold">#</th>
                  <th className="text-left px-5 py-3 font-semibold">Categorie</th>
                  <th className="text-left px-5 py-3 font-semibold">Motiv</th>
                  <th className="text-left px-5 py-3 font-semibold">Prioritate</th>
                  <th className="text-left px-5 py-3 font-semibold">Discount sugerat</th>
                </tr>
              </thead>
              <tbody>
                {menuRecs.map((rec, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-sky-50/30 transition-colors">
                    <td className="px-5 py-3 text-slate-400">{rec.display_position || i + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{rec.category}</td>
                    <td className="px-5 py-3 text-slate-600">{rec.reason}</td>
                    <td className="px-5 py-3"><PriorityBadge value={rec.priority} /></td>
                    <td className="px-5 py-3">
                      {rec.suggested_discount > 0
                        ? <span className="text-green-600 font-semibold">-{rec.suggested_discount}%</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB: STOCURI ===== */}
      {activeTab === 'stocuri' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-800 font-semibold">📦 Pre-comandă Stocuri bazată pe Prognoză</h3>
            <p className="text-slate-500 text-sm mt-0.5">Recomandări de aprovizionare pentru următoarele 7 zile</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-semibold">Ingredient</th>
                  <th className="text-left px-5 py-3 font-semibold">Stoc curent (zile)</th>
                  <th className="text-left px-5 py-3 font-semibold">Cantitate recomandată</th>
                  <th className="text-left px-5 py-3 font-semibold">Motiv</th>
                  <th className="text-left px-5 py-3 font-semibold">Urgență</th>
                </tr>
              </thead>
              <tbody>
                {stockRecs.map((rec, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-sky-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{rec.ingredient}</td>
                    <td className="px-5 py-3 text-slate-600">{rec.current_stock_days} zile</td>
                    <td className="px-5 py-3 font-semibold text-sky-700">{rec.recommended_order_qty}</td>
                    <td className="px-5 py-3 text-slate-600">{rec.reason}</td>
                    <td className="px-5 py-3"><PriorityBadge value={rec.urgency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB: PERSONAL ===== */}
      {activeTab === 'personal' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4">
            <h3 className="text-slate-800 font-semibold">👥 Ajustări Personal bazate pe Prognoză</h3>
            <p className="text-slate-500 text-sm mt-0.5">Modificări recomandate pentru programul de lucru în funcție de meteo</p>
          </div>
          {staffingRecs.map((rec, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-sm border p-5 ${
              rec.change_type === 'REDUCE' ? 'border-purple-200 bg-purple-50/30' :
              rec.change_type === 'INCREASE' ? 'border-orange-200 bg-orange-50/30' :
              'border-cyan-200 bg-cyan-50/30'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500 text-sm font-medium">{formatDate(rec.date)}</span>
                    <PriorityBadge value={rec.change_type} />
                    <span className="font-semibold text-slate-700 text-sm">{rec.role_affected}</span>
                  </div>
                  <p className="text-slate-700 text-sm">{rec.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Acțiune recomandată:</span>
                    <span className="text-sm text-slate-800 font-medium">{rec.recommended_action}</span>
                  </div>
                </div>
                <div className={`text-2xl font-bold ml-4 ${
                  rec.adjustment_percent > 0 ? 'text-orange-500' :
                  rec.adjustment_percent < 0 ? 'text-purple-500' : 'text-slate-400'
                }`}>
                  {rec.adjustment_percent > 0 ? '+' : ''}{rec.adjustment_percent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TAB: PREȚURI ===== */}
      {activeTab === 'preturi' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-800 font-semibold">💰 Prețuri Dinamice bazate pe Meteo</h3>
            <p className="text-slate-500 text-sm mt-0.5">Recomandări de ajustare a prețurilor și promoțiilor în funcție de condițiile meteo</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-semibold">Categorie produse</th>
                  <th className="text-left px-5 py-3 font-semibold">Tip preț curent</th>
                  <th className="text-left px-5 py-3 font-semibold">Modificare sugerată</th>
                  <th className="text-left px-5 py-3 font-semibold">Motiv</th>
                  <th className="text-left px-5 py-3 font-semibold">Impact estimat</th>
                </tr>
              </thead>
              <tbody>
                {pricingRecs.map((rec, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-sky-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{rec.product_category}</td>
                    <td className="px-5 py-3 text-slate-500">{rec.current_price_type}</td>
                    <td className="px-5 py-3 font-medium text-sky-700">{rec.suggested_change}</td>
                    <td className="px-5 py-3 text-slate-600">{rec.reason}</td>
                    <td className="px-5 py-3 font-semibold text-green-600">{rec.expected_revenue_impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherPredictionPage;
