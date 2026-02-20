import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiEconomyPage = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadApiKeys(), loadEndpoints(), loadUsageStats(), loadWebhooks()]);
    setLoading(false);
  };

  const loadApiKeys = async () => {
    try {
      const res = await axios.get('/api/api-economy/keys');
      setApiKeys(res.data);
    } catch {
      setApiKeys(demoApiKeys());
    }
  };

  const loadEndpoints = async () => {
    try {
      const res = await axios.get('/api/api-economy/endpoints');
      setEndpoints(res.data);
    } catch {
      setEndpoints(demoEndpoints());
    }
  };

  const loadUsageStats = async () => {
    try {
      const res = await axios.get('/api/api-economy/usage');
      setUsageStats(res.data);
    } catch {
      setUsageStats(demoUsageStats());
    }
  };

  const loadWebhooks = async () => {
    try {
      const res = await axios.get('/api/api-economy/webhooks');
      setWebhooks(res.data);
    } catch {
      setWebhooks(demoWebhooks());
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      await axios.post('/api/api-economy/keys', { name: newKeyName });
      loadApiKeys();
    } catch {
      console.log('Demo: key created:', newKeyName);
    }
    setNewKeyName('');
    setShowNewKey(false);
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoUsageStats = () => ({
    totalCalls: 2847392,
    callsToday: 48721,
    avgResponseMs: 87,
    errorRate: 0.12,
    activeKeys: 14,
    webhooksFired: 1284,
    topEndpoint: '/api/orders',
    revenueFromAPI: 12400,
  });

  const demoApiKeys = () => [
    { id: 1, name: 'Delivery Partner – Glovo', key: 'sk_live_glo_****8f3a', calls: 142800, status: 'active', tier: 'Premium', created: '2023-08-15' },
    { id: 2, name: 'Accounting – Saga', key: 'sk_live_sag_****c4d2', calls: 28400, status: 'active', tier: 'Standard', created: '2023-11-01' },
    { id: 3, name: 'POS Terminal – Verifone', key: 'sk_live_vfn_****7e1b', calls: 892100, status: 'active', tier: 'Premium', created: '2022-06-20' },
    { id: 4, name: 'Loyalty App – Mobile', key: 'sk_live_mob_****a9f5', calls: 384200, status: 'active', tier: 'Standard', created: '2023-02-14' },
    { id: 5, name: 'Rezervări – TripAdvisor', key: 'sk_live_ta_****3b88', calls: 21600, status: 'suspended', tier: 'Basic', created: '2024-01-05' },
  ];

  const demoEndpoints = () => [
    { path: '/api/orders', method: 'GET/POST', calls: 892100, avgMs: 45, errorPct: 0.05, description: 'Gestionare comenzi' },
    { path: '/api/menu', method: 'GET', calls: 584300, avgMs: 32, errorPct: 0.01, description: 'Meniu & prețuri' },
    { path: '/api/inventory', method: 'GET', calls: 284200, avgMs: 78, errorPct: 0.08, description: 'Stocuri în timp real' },
    { path: '/api/reservations', method: 'GET/POST', calls: 148900, avgMs: 62, errorPct: 0.02, description: 'Rezervări mese' },
    { path: '/api/loyalty', method: 'GET/POST/PUT', calls: 384200, avgMs: 95, errorPct: 0.15, description: 'Program loialitate' },
    { path: '/api/payments', method: 'POST', calls: 228400, avgMs: 210, errorPct: 0.31, description: 'Procesare plăți' },
  ];

  const demoWebhooks = () => [
    { id: 1, event: 'order.created', url: 'https://glovo.com/webhook/order', status: 'active', firedToday: 284 },
    { id: 2, event: 'order.completed', url: 'https://glovo.com/webhook/complete', status: 'active', firedToday: 271 },
    { id: 3, event: 'payment.success', url: 'https://saga.ro/api/payment', status: 'active', firedToday: 228 },
    { id: 4, event: 'reservation.new', url: 'https://tripadvisor.com/hook/res', status: 'inactive', firedToday: 0 },
    { id: 5, event: 'inventory.low', url: 'https://erp.supplier.ro/alert', status: 'active', firedToday: 12 },
  ];

  const getMethodColor = (method) => {
    if (method.includes('POST')) return 'bg-green-100 text-green-700';
    if (method.includes('PUT')) return 'bg-blue-100 text-blue-700';
    if (method.includes('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const tabs = [
    { id: 'overview', label: '📊 Utilizare API' },
    { id: 'keys', label: '🔑 Chei API' },
    { id: 'endpoints', label: '🔌 Endpoint-uri' },
    { id: 'webhooks', label: '🪝 Webhook-uri' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔌 API Economy Mode</h1>
          <p className="text-gray-600">Ecosistem de integrări externe – monitorizare și management API</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {usageStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Apeluri Totale', value: usageStats.totalCalls.toLocaleString(), icon: '📡', color: 'bg-indigo-50 border-indigo-300' },
            { label: 'Apeluri Azi', value: usageStats.callsToday.toLocaleString(), icon: '⚡', color: 'bg-cyan-50 border-cyan-300' },
            { label: 'Timp Mediu Răspuns', value: `${usageStats.avgResponseMs}ms`, icon: '⏱️', color: 'bg-green-50 border-green-300' },
            { label: 'Rată Erori', value: `${usageStats.errorRate}%`, icon: '⚠️', color: 'bg-yellow-50 border-yellow-300' },
          ].map((kpi, i) => (
            <div key={i} className={`border-2 rounded-xl p-5 ${kpi.color}`}>
              <div className="text-3xl mb-2">{kpi.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-3">📈 Statistici Generale</h3>
            <div className="space-y-3">
              {[
                { label: 'Chei API Active', value: usageStats.activeKeys },
                { label: 'Webhook-uri Declanșate Azi', value: usageStats.webhooksFired },
                { label: 'Endpoint cel mai activ', value: usageStats.topEndpoint },
                { label: 'Revenue din API (RON)', value: `${usageStats.revenueFromAPI.toLocaleString()} RON` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-3">🌐 Parteneri Integrați</h3>
            <div className="space-y-2">
              {['Glovo', 'Bolt Food', 'Tazz', 'Saga Accounting', 'Verifone POS', 'TripAdvisor'].map((p, i) => (
                <div key={i} className="flex justify-between items-center p-2 border rounded-lg">
                  <span className="font-medium">{p}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${i < 4 ? 'bg-green-100 text-green-700' : i < 5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {i < 5 ? '🟢 Activ' : '🟡 Limitat'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Keys */}
      {activeTab === 'keys' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🔑 Chei API</h2>
            <button onClick={() => setShowNewKey(!showNewKey)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              + Cheie Nouă
            </button>
          </div>
          {showNewKey && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Nume partener / aplicație..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={handleCreateKey} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Generează
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900">
                  <th className="p-3 text-left">Nume</th>
                  <th className="p-3 text-left">Cheie</th>
                  <th className="p-3 text-right">Apeluri</th>
                  <th className="p-3 text-center">Tier</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{k.name}</td>
                    <td className="p-3 font-mono text-xs text-gray-500">{k.key}</td>
                    <td className="p-3 text-right">{k.calls.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${k.tier === 'Premium' ? 'bg-purple-100 text-purple-700' : k.tier === 'Standard' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {k.tier}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${k.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {k.status === 'active' ? '🟢 Activ' : '🔴 Suspendat'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔌 Endpoint-uri Disponibile</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-3 text-left">Endpoint</th>
                  <th className="p-3 text-left">Metodă</th>
                  <th className="p-3 text-left">Descriere</th>
                  <th className="p-3 text-right">Apeluri</th>
                  <th className="p-3 text-right">Timp Mediu</th>
                  <th className="p-3 text-right">Erori</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs font-bold">{ep.path}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMethodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{ep.description}</td>
                    <td className="p-3 text-right font-semibold">{ep.calls.toLocaleString()}</td>
                    <td className="p-3 text-right">{ep.avgMs}ms</td>
                    <td className="p-3 text-right">
                      <span className={ep.errorPct > 0.2 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {ep.errorPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🪝 Configurare Webhook-uri</h2>
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className={`border-2 rounded-xl p-4 ${wh.status === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">{wh.event}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{wh.url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{wh.firedToday} azi</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${wh.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {wh.status === 'active' ? '🟢 Activ' : '⏸️ Inactiv'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiEconomyPage;
