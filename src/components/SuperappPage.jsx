import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SuperappPage = () => {
  const [modules, setModules] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [userJourneys, setUserJourneys] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadModules(), loadAppStats(), loadUserJourneys(), loadIntegrations()]);
    setLoading(false);
  };

  const loadModules = async () => {
    try {
      const res = await axios.get('/api/superapp/modules');
      setModules(res.data);
    } catch {
      setModules(demoModules());
    }
  };

  const loadAppStats = async () => {
    try {
      const res = await axios.get('/api/superapp/stats');
      setAppStats(res.data);
    } catch {
      setAppStats(demoAppStats());
    }
  };

  const loadUserJourneys = async () => {
    try {
      const res = await axios.get('/api/superapp/user-journeys');
      setUserJourneys(res.data);
    } catch {
      setUserJourneys(demoUserJourneys());
    }
  };

  const loadIntegrations = async () => {
    try {
      const res = await axios.get('/api/superapp/integrations');
      setIntegrations(res.data);
    } catch {
      setIntegrations(demoIntegrations());
    }
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoAppStats = () => ({
    activeUsers: 48200,
    dailyActiveUsers: 12400,
    avgSessionMin: 8.4,
    transactionsMonth: 284000,
    revenueApp: 1840000,
    nps: 72,
    appRating: 4.6,
    retentionRate: 68,
  });

  const demoModules = () => [
    { id: 1, name: 'Rezervări & Mese', icon: '📅', status: 'live', users: 18400, description: 'Rezervare masă, selectare loc, preferințe speciale', category: 'Dining' },
    { id: 2, name: 'Comandă & Plată', icon: '🛒', status: 'live', users: 28400, description: 'Comandă din meniu, plată mobilă, split bill', category: 'Dining' },
    { id: 3, name: 'Delivery', icon: '🛵', status: 'live', users: 22100, description: 'Livrare la domiciliu, tracking în timp real', category: 'Delivery' },
    { id: 4, name: 'Program Loialitate', icon: '💎', status: 'live', users: 34800, description: 'Puncte, recompense, tier gold/platinum', category: 'Loyalty' },
    { id: 5, name: 'Wallet Digital', icon: '💳', status: 'live', users: 12400, description: 'Plată rapidă, credit bonus, abonamente', category: 'Payments' },
    { id: 6, name: 'Experiențe & Events', icon: '🎉', status: 'live', users: 8200, description: 'Cine tematice, chef table, wine tasting', category: 'Experience' },
    { id: 7, name: 'Catering & Corporate', icon: '🏢', status: 'beta', users: 2400, description: 'Comenzi corporate, facturare B2B, gestiune bugete', category: 'B2B' },
    { id: 8, name: 'Ghost Kitchen Order', icon: '👻', status: 'beta', users: 1840, description: 'Comandă din bucătăriile virtuale disponibile', category: 'Delivery' },
    { id: 9, name: 'AI Food Assistant', icon: '🤖', status: 'coming', users: 0, description: 'Recomandări personalizate AI bazate pe preferințe', category: 'AI' },
    { id: 10, name: 'Social Dining', icon: '👥', status: 'coming', users: 0, description: 'Invitații prieteni, group ordering, bill sharing', category: 'Social' },
  ];

  const demoUserJourneys = () => [
    {
      name: 'Cina la Restaurant',
      steps: ['Deschide app', 'Caută restaurant', 'Rezervă masă', 'Comandă din meniu', 'Plătește digital', 'Câștigă puncte'],
      completionRate: 84,
      avgDuration: '12 min',
    },
    {
      name: 'Comandă Delivery',
      steps: ['Deschide app', 'Selectează locație', 'Alege meniu', 'Adaugă în coș', 'Plătește', 'Urmărește livrarea'],
      completionRate: 91,
      avgDuration: '5 min',
    },
    {
      name: 'Rezervare & Eveniment',
      steps: ['Caută eveniment', 'Selectează date', 'Rezervă locuri', 'Plată avans', 'Confirmare email'],
      completionRate: 72,
      avgDuration: '8 min',
    },
  ];

  const demoIntegrations = () => [
    { name: 'Apple Pay / Google Pay', type: 'Plăți', status: 'active', icon: '💳' },
    { name: 'Glovo / Bolt Food / Tazz', type: 'Delivery', status: 'active', icon: '🛵' },
    { name: 'Google Maps', type: 'Navigație', status: 'active', icon: '🗺️' },
    { name: 'Push Notifications', type: 'Marketing', status: 'active', icon: '🔔' },
    { name: 'WhatsApp Business', type: 'Comunicare', status: 'active', icon: '💬' },
    { name: 'TripAdvisor / Google Reviews', type: 'Recenzii', status: 'active', icon: '⭐' },
    { name: 'Stripe / Netopia', type: 'Plăți', status: 'active', icon: '🏦' },
    { name: 'Facebook / Instagram Ads', type: 'Marketing', status: 'beta', icon: '📱' },
  ];

  const getStatusStyle = (status) => {
    const map = {
      live: 'bg-green-100 text-green-700 border-green-300',
      beta: 'bg-blue-100 text-blue-700 border-blue-300',
      coming: 'bg-gray-100 text-gray-500 border-gray-300',
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const tabs = [
    { id: 'overview', label: '📱 Prezentare Generală' },
    { id: 'modules', label: '🧩 Module Active' },
    { id: 'journeys', label: '🛤️ Parcursuri Utilizatori' },
    { id: 'integrations', label: '🔗 Integrări' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📱 Hospitality Superapp Mode</h1>
          <p className="text-gray-600">Aplicație unificată – rezervări, livrări, loialitate, plăți și experiențe într-un singur loc</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50">
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {appStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Utilizatori Activi', value: appStats.activeUsers.toLocaleString(), icon: '👥', color: 'bg-rose-50 border-rose-300' },
            { label: 'Utilizatori Zilnici', value: appStats.dailyActiveUsers.toLocaleString(), icon: '📱', color: 'bg-pink-50 border-pink-300' },
            { label: 'Rating App', value: `${appStats.appRating} ⭐`, icon: '🌟', color: 'bg-yellow-50 border-yellow-300' },
            { label: 'NPS Score', value: appStats.nps, icon: '💚', color: 'bg-green-50 border-green-300' },
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
              activeTab === tab.id ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && appStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">📊 Metrici Cheie</h3>
            <div className="space-y-3">
              {[
                { label: 'Sesiune Medie', value: `${appStats.avgSessionMin} min` },
                { label: 'Tranzacții / Lună', value: appStats.transactionsMonth.toLocaleString() },
                { label: 'Revenue prin App', value: `${(appStats.revenueApp / 1000000).toFixed(2)}M RON` },
                { label: 'Rată Retenție', value: `${appStats.retentionRate}%` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl p-6 shadow">
            <h3 className="font-bold text-lg mb-3">🚀 Viziunea Superapp</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Hospitality Superapp Mode transformă toate punctele de contact cu clienții într-o singură experiență digitală fluidă – de la prima rezervare până la ultima plată, cu loialitate integrată și recomandări AI personalizate.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {['One App', 'All Services', 'AI-Powered', 'Loyalty Native'].map((tag, i) => (
                <div key={i} className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center text-sm font-medium">
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Modules */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🧩 Module Superapp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <div key={mod.id} className={`border-2 rounded-xl p-4 ${mod.status === 'live' ? 'border-green-200 bg-green-50' : mod.status === 'beta' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{mod.icon}</span>
                    <div>
                      <div className="font-bold">{mod.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{mod.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 border rounded-full text-xs font-bold ${getStatusStyle(mod.status)}`}>
                      {mod.status === 'live' ? '🟢 LIVE' : mod.status === 'beta' ? '🔵 BETA' : '⚪ CURÂND'}
                    </span>
                    {mod.users > 0 && (
                      <span className="text-xs text-gray-400">{mod.users.toLocaleString()} utilizatori</span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xs bg-white bg-opacity-70 px-2 py-0.5 rounded border border-current opacity-60">
                    {mod.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: User Journeys */}
      {activeTab === 'journeys' && (
        <div className="space-y-6">
          {userJourneys.map((journey, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{journey.name}</h3>
                <div className="flex gap-3">
                  <span className="text-sm text-gray-500">Durată: <strong>{journey.avgDuration}</strong></span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${journey.completionRate >= 85 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {journey.completionRate}% completare
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {journey.steps.map((step, j) => (
                  <React.Fragment key={j}>
                    <div className="px-3 py-2 bg-rose-100 text-rose-800 rounded-lg text-sm font-medium">
                      {j + 1}. {step}
                    </div>
                    {j < journey.steps.length - 1 && (
                      <span className="text-gray-400 text-lg">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Integrations */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔗 Integrări Superapp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integ, i) => (
              <div key={i} className={`flex items-center justify-between p-4 border-2 rounded-xl ${integ.status === 'active' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integ.icon}</span>
                  <div>
                    <div className="font-medium">{integ.name}</div>
                    <div className="text-xs text-gray-500">{integ.type}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(integ.status)}`}>
                  {integ.status === 'active' ? '🟢 Activ' : '🔵 Beta'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperappPage;
