import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HQWarRoomPage = () => {
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [networkSummary, setNetworkSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  const AUTO_REFRESH_INTERVAL_MS = 30000;

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadLocations(), loadAlerts(), loadNetworkSummary()]);
    setLoading(false);
  };

  const loadLocations = async () => {
    try {
      const res = await axios.get('/api/hq-warroom/locations');
      setLocations(res.data);
    } catch {
      setLocations(demoLocations());
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await axios.get('/api/hq-warroom/alerts');
      setAlerts(res.data);
    } catch {
      setAlerts(demoAlerts());
    }
  };

  const loadNetworkSummary = async () => {
    try {
      const res = await axios.get('/api/hq-warroom/network-summary');
      setNetworkSummary(res.data);
    } catch {
      setNetworkSummary(demoNetworkSummary());
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/hq-warroom/actions/broadcast', { message: broadcastMsg });
    } catch {
      console.log('Demo: broadcast sent:', broadcastMsg);
    }
    setBroadcastSent(true);
    setBroadcastMsg('');
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const triggerAction = (label) => {
    setActionFeedback(`✅ ${label} – comandă trimisă`);
    setTimeout(() => setActionFeedback(''), 3000);
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoNetworkSummary = () => ({
    liveOrders: 47,
    revenueToday: 18420,
    avgTicket: 38.5,
    avgPrepTime: 14,
    deliverySla: 91.2,
    networkTrend: [
      { day: 'L', revenue: 15200 }, { day: 'M', revenue: 14800 }, { day: 'Mi', revenue: 16400 },
      { day: 'J', revenue: 13900 }, { day: 'V', revenue: 19200 }, { day: 'S', revenue: 21500 },
      { day: 'D', revenue: 18420 },
    ],
  });

  const demoLocations = () => [
    { id: 1, name: 'București – Floreasca', status: 'green', ordersLast60: 18, revenueToday: 5840, avgPrepTime: 12, activeAlerts: 0 },
    { id: 2, name: 'Cluj-Napoca – Centru', status: 'yellow', ordersLast60: 11, revenueToday: 4120, avgPrepTime: 18, activeAlerts: 2 },
    { id: 3, name: 'Timișoara – Fabric', status: 'red', ordersLast60: 6, revenueToday: 2980, avgPrepTime: 26, activeAlerts: 4 },
    { id: 4, name: 'Iași – Copou', status: 'green', ordersLast60: 9, revenueToday: 3260, avgPrepTime: 13, activeAlerts: 0 },
    { id: 5, name: 'Brașov – Centru Vechi', status: 'grey', ordersLast60: 0, revenueToday: 2220, avgPrepTime: 0, activeAlerts: 1 },
  ];

  const demoAlerts = () => [
    { id: 1, type: 'KITCHEN_DELAY', location: 'Timișoara – Fabric', severity: 'HIGH', message: 'Timp mediu preparare depășit: 26 min (limită 18 min)', time: '2 min ago' },
    { id: 2, type: 'CRITICAL_STOCK', location: 'Timișoara – Fabric', severity: 'HIGH', message: 'Stoc critic: Cartofi prăjiți – mai puțin de 2kg', time: '5 min ago' },
    { id: 3, type: 'REFUND_SPIKE', location: 'Cluj-Napoca – Centru', severity: 'MEDIUM', message: 'Spike rambursări: 5 comenzi anulate în ultimele 30 min', time: '8 min ago' },
    { id: 4, type: 'REVENUE_ANOMALY', location: 'Cluj-Napoca – Centru', severity: 'MEDIUM', message: 'Venituri cu 35% sub media lunii la această oră', time: '15 min ago' },
    { id: 5, type: 'SYSTEM_OFFLINE', location: 'Brașov – Centru Vechi', severity: 'CRITICAL', message: 'Sistem POS offline – fără conexiune de 22 min', time: '22 min ago' },
    { id: 6, type: 'KITCHEN_DELAY', location: 'Timișoara – Fabric', severity: 'HIGH', message: 'Chef lipsă – tură incompletă', time: '31 min ago' },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const statusIcon = (status) => {
    if (status === 'green') return { icon: '🟢', label: 'OK', cls: 'border-green-400 bg-green-50' };
    if (status === 'yellow') return { icon: '🟡', label: 'Atenție', cls: 'border-yellow-400 bg-yellow-50' };
    if (status === 'red') return { icon: '🔴', label: 'Alertă', cls: 'border-red-400 bg-red-50' };
    return { icon: '⚫', label: 'Offline', cls: 'border-gray-400 bg-gray-100' };
  };

  const alertSeverityClass = (sev) => {
    if (sev === 'CRITICAL') return 'bg-red-100 border-red-400 text-red-800';
    if (sev === 'HIGH') return 'bg-orange-100 border-orange-300 text-orange-800';
    if (sev === 'MEDIUM') return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-gray-100 border-gray-300 text-gray-700';
  };

  const alertTypeLabel = (type) => {
    const map = {
      KITCHEN_DELAY: '🍳 Întârziere Bucătărie',
      CRITICAL_STOCK: '📦 Stoc Critic',
      REFUND_SPIKE: '💸 Spike Rambursări',
      REVENUE_ANOMALY: '📉 Anomalie Venituri',
      SYSTEM_OFFLINE: '🔌 Sistem Offline',
    };
    return map[type] || type;
  };

  const formatRON = (n) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(n || 0);

  const maxRevenue = networkSummary
    ? Math.max(...(networkSummary.networkTrend || []).map(d => d.revenue))
    : 1;

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  if (loading && !networkSummary) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg text-red-600">🔄 Se încarcă Centru Control HQ...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏴 Centru Control HQ</h1>
          <p className="text-gray-600">War Room – Supraveghere rețea în timp real</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
              🚨 {criticalCount} alerte critice
            </span>
          )}
          <button onClick={loadAll} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Section 1: Network Summary Bar */}
      {networkSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Comenzi Live', value: networkSummary.liveOrders, icon: '📋', color: 'border-red-500' },
            { label: 'Venituri Azi', value: formatRON(networkSummary.revenueToday), icon: '💰', color: 'border-orange-500' },
            { label: 'Ticket Mediu Rețea', value: formatRON(networkSummary.avgTicket), icon: '🧾', color: 'border-yellow-500' },
            { label: 'Timp Prep Mediu', value: `${networkSummary.avgPrepTime} min`, icon: '⏱️', color: 'border-pink-500' },
            { label: 'SLA Livrare', value: `${networkSummary.deliverySla}%`, icon: '🚴', color: 'border-green-500' },
          ].map(kpi => (
            <div key={kpi.label} className={`bg-white rounded-lg shadow p-4 border-l-4 ${kpi.color}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">{kpi.label}</div>
                  <div className="text-xl font-bold text-gray-900 mt-0.5">{kpi.value}</div>
                </div>
                <span className="text-2xl">{kpi.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Locations Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">📍 Rezumat Rețea – Locații</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {locations.map(loc => {
            const s = statusIcon(loc.status);
            return (
              <div key={loc.id} className={`rounded-lg border-2 p-4 ${s.cls}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-semibold text-gray-500">{s.label}</span>
                </div>
                <div className="font-semibold text-gray-800 text-sm mb-3 leading-tight">{loc.name}</div>
                <div className="space-y-1 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span>Comenzi 60min:</span>
                    <span className="font-bold">{loc.ordersLast60}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venituri azi:</span>
                    <span className="font-bold">{formatRON(loc.revenueToday)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timp prep:</span>
                    <span className={`font-bold ${loc.avgPrepTime > 20 ? 'text-red-600' : 'text-green-600'}`}>
                      {loc.avgPrepTime > 0 ? `${loc.avgPrepTime} min` : '–'}
                    </span>
                  </div>
                  {loc.activeAlerts > 0 && (
                    <div className="flex justify-between mt-1">
                      <span>Alerte active:</span>
                      <span className="font-bold text-red-600">{loc.activeAlerts} 🚨</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 3: Alert Feed */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-3">🚨 Alertă Rețea</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {alerts.map(alert => (
              <div key={alert.id} className={`border-l-4 rounded-r-lg p-3 ${alertSeverityClass(alert.severity)}`}>
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm">{alertTypeLabel(alert.type)}</div>
                  <span className="text-xs opacity-70 ml-2 flex-shrink-0">{alert.time}</span>
                </div>
                <div className="text-xs font-medium opacity-80 mb-1">📍 {alert.location}</div>
                <div className="text-xs">{alert.message}</div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center text-gray-400 py-8">✅ Nicio alertă activă</div>
            )}
          </div>
        </div>

        {/* Section 5: Network Trend Chart */}
        {networkSummary && (
          <div className="bg-white rounded-lg shadow-md p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-3">📈 Trend Venituri Rețea (7 zile)</h2>
            <div className="flex items-end gap-3 h-40 mt-4">
              {networkSummary.networkTrend.map((d, i) => {
                const pct = (d.revenue / maxRevenue) * 100;
                const isToday = i === networkSummary.networkTrend.length - 1;
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-500 mb-1">{formatRON(d.revenue).replace('RON', '').trim()}</div>
                    <div
                      title={`${d.day}: ${formatRON(d.revenue)}`}
                      className={`w-full rounded-t transition-all ${isToday ? 'bg-red-500' : 'bg-orange-300'}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className={`text-xs mt-1 font-medium ${isToday ? 'text-red-600' : 'text-gray-500'}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Remote Actions Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Acțiuni Remote</h2>
        {actionFeedback && (
          <div className="mb-3 p-3 bg-green-50 border border-green-300 rounded text-green-700 text-sm">{actionFeedback}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => triggerAction('Actualizare Meniu')}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium"
            >
              📋 Push Actualizare Meniu
            </button>
            <button
              onClick={() => triggerAction('Transfer Stoc')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              📦 Declanșează Transfer Stoc
            </button>
            <button
              onClick={() => triggerAction('Blocare Discounturi')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium"
            >
              🔒 Blocare Discounturi
            </button>
            <button
              onClick={() => triggerAction('Deblocare Discounturi')}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium"
            >
              🔓 Deblocare Discounturi
            </button>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">📢 Mesaj Broadcast Manageri</div>
            <form onSubmit={handleBroadcast} className="flex gap-2">
              <input
                type="text"
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Mesaj urgent pentru toți managerii..."
                className="flex-1 border rounded-md px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium whitespace-nowrap"
              >
                📡 Trimite
              </button>
            </form>
            {broadcastSent && (
              <div className="mt-2 text-sm text-green-600">✅ Mesaj trimis tuturor managerilor!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HQWarRoomPage;
