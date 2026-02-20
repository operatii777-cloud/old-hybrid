import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FranchisePage = () => {
  const [locations, setLocations] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [compliance, setCompliance] = useState([]);
  const [royalties, setRoyalties] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadLocations(), loadKpis(), loadCompliance(), loadRoyalties()]);
    setLoading(false);
  };

  const loadLocations = async () => {
    try {
      const res = await axios.get('/api/franchise/locations');
      setLocations(res.data);
    } catch {
      setLocations(demoLocations());
    }
  };

  const loadKpis = async () => {
    try {
      const res = await axios.get('/api/franchise/kpis');
      setKpis(res.data);
    } catch {
      setKpis(demoKpis());
    }
  };

  const loadCompliance = async () => {
    try {
      const res = await axios.get('/api/franchise/compliance');
      setCompliance(res.data);
    } catch {
      setCompliance(demoCompliance());
    }
  };

  const loadRoyalties = async () => {
    try {
      const res = await axios.get('/api/franchise/royalties');
      setRoyalties(res.data);
    } catch {
      setRoyalties(demoRoyalties());
    }
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoKpis = () => ({
    totalLocations: 24,
    activeLocations: 22,
    totalRevenue: 4820000,
    totalRoyalties: 289200,
    avgScore: 87.4,
    newThisYear: 5,
    topPerformer: 'Cluj-Napoca – Centru',
    networkGrowth: '+18%',
  });

  const demoLocations = () => [
    { id: 1, name: 'București – Floreasca', city: 'București', status: 'active', score: 94, revenue: 285000, royalty: 17100, opened: '2020-03-15' },
    { id: 2, name: 'Cluj-Napoca – Centru', city: 'Cluj-Napoca', status: 'active', score: 97, revenue: 312000, royalty: 18720, opened: '2019-09-01' },
    { id: 3, name: 'Timișoara – Iulius', city: 'Timișoara', status: 'active', score: 88, revenue: 198000, royalty: 11880, opened: '2021-05-20' },
    { id: 4, name: 'Iași – Palas', city: 'Iași', status: 'active', score: 82, revenue: 176000, royalty: 10560, opened: '2021-11-08' },
    { id: 5, name: 'Brașov – Centrul Nou', city: 'Brașov', status: 'active', score: 91, revenue: 221000, royalty: 13260, opened: '2022-02-14' },
    { id: 6, name: 'Constanța – Mamaia', city: 'Constanța', status: 'seasonal', score: 79, revenue: 143000, royalty: 8580, opened: '2022-06-01' },
  ];

  const demoCompliance = () => [
    { category: 'Standarde Igienă', score: 96, maxScore: 100, lastAudit: '2024-01-08', status: 'pass' },
    { category: 'Identitate Vizuală', score: 92, maxScore: 100, lastAudit: '2024-01-08', status: 'pass' },
    { category: 'Meniu Standard', score: 88, maxScore: 100, lastAudit: '2024-01-08', status: 'pass' },
    { category: 'Training Personal', score: 74, maxScore: 100, lastAudit: '2023-12-15', status: 'warning' },
    { category: 'Raportare Financiară', score: 100, maxScore: 100, lastAudit: '2024-01-10', status: 'pass' },
    { category: 'Securitate Date', score: 83, maxScore: 100, lastAudit: '2024-01-05', status: 'pass' },
  ];

  const demoRoyalties = () => [
    { month: 'Ian 2024', total: 24200, paid: 24200, status: 'paid' },
    { month: 'Dec 2023', total: 22800, paid: 22800, status: 'paid' },
    { month: 'Nov 2023', total: 21400, paid: 21400, status: 'paid' },
    { month: 'Oct 2023', total: 23600, paid: 23600, status: 'paid' },
    { month: 'Sep 2023', total: 19800, paid: 14200, status: 'partial' },
  ];

  const getStatusBadge = (status) => {
    const map = {
      active: 'bg-green-100 text-green-700',
      seasonal: 'bg-yellow-100 text-yellow-700',
      inactive: 'bg-red-100 text-red-700',
      pass: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      fail: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const tabs = [
    { id: 'overview', label: '🗺️ Rețea Franciză' },
    { id: 'compliance', label: '✅ Conformitate' },
    { id: 'royalties', label: '💰 Redevențe' },
    { id: 'expansion', label: '🚀 Expansiune' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👑 Franchise Domination System</h1>
          <p className="text-gray-600">Management centralizat rețea franciză – control complet din HQ</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50">
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Locații Totale', value: kpis.totalLocations, sub: `${kpis.activeLocations} active`, icon: '🏪', color: 'bg-amber-50 border-amber-300' },
            { label: 'Revenue Total', value: `${(kpis.totalRevenue / 1000000).toFixed(2)}M RON`, sub: `Creștere: ${kpis.networkGrowth}`, icon: '💰', color: 'bg-green-50 border-green-300' },
            { label: 'Redevențe Totale', value: `${(kpis.totalRoyalties / 1000).toFixed(0)}K RON`, sub: 'Lunar', icon: '📊', color: 'bg-blue-50 border-blue-300' },
            { label: 'Scor Mediu Rețea', value: `${kpis.avgScore}/100`, sub: kpis.topPerformer, icon: '⭐', color: 'bg-purple-50 border-purple-300' },
          ].map((kpi, i) => (
            <div key={i} className={`border-2 rounded-xl p-5 ${kpi.color}`}>
              <div className="text-3xl mb-2">{kpi.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{kpi.sub}</div>
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
              activeTab === tab.id ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🗺️ Locații Rețea Franciză</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-amber-900">
                  <th className="p-3 text-left">Locație</th>
                  <th className="p-3 text-left">Oraș</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Scor</th>
                  <th className="p-3 text-right">Revenue (RON)</th>
                  <th className="p-3 text-right">Redevență</th>
                  <th className="p-3 text-left">Deschis</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{loc.name}</td>
                    <td className="p-3 text-gray-600">{loc.city}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(loc.status)}`}>
                        {loc.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-bold ${loc.score >= 90 ? 'text-green-700' : loc.score >= 75 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {loc.score}/100
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">{loc.revenue.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-700 font-bold">{loc.royalty.toLocaleString()}</td>
                    <td className="p-3 text-gray-500 text-xs">{loc.opened}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Compliance */}
      {activeTab === 'compliance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">✅ Scor Conformitate Rețea</h2>
          <div className="space-y-4">
            {compliance.map((item, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{item.category}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Audit: {item.lastAudit}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(item.status)}`}>
                      {item.status === 'pass' ? '✅ PASS' : item.status === 'warning' ? '⚠️ WARN' : '❌ FAIL'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${item.score >= 90 ? 'bg-green-500' : item.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className="font-bold text-sm w-16 text-right">{item.score}/{item.maxScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Royalties */}
      {activeTab === 'royalties' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">💰 Redevențe Lunare</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 text-green-900">
                  <th className="p-3 text-left">Lună</th>
                  <th className="p-3 text-right">Total Datorat</th>
                  <th className="p-3 text-right">Încasat</th>
                  <th className="p-3 text-right">Rest</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {royalties.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.month}</td>
                    <td className="p-3 text-right">{row.total.toLocaleString()} RON</td>
                    <td className="p-3 text-right text-green-700 font-semibold">{row.paid.toLocaleString()} RON</td>
                    <td className="p-3 text-right text-red-600">{(row.total - row.paid).toLocaleString()} RON</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(row.status)}`}>
                        {row.status === 'paid' ? '✅ Achitat' : row.status === 'partial' ? '⚠️ Parțial' : '❌ Restanță'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Expansion */}
      {activeTab === 'expansion' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Plan Expansiune Franciză</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-5 bg-blue-50">
              <h3 className="font-bold text-lg mb-3 text-blue-900">📍 Orașe Țintă 2024</h3>
              <div className="space-y-2">
                {['Oradea', 'Sibiu', 'Galați', 'Ploiești', 'Râmnicu Vâlcea'].map((city, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-white rounded border border-blue-200">
                    <span className="font-medium">{city}</span>
                    <span className="text-xs text-blue-600 font-bold">
                      {i < 2 ? '🟢 În negociere' : i < 4 ? '🟡 Prospect' : '⚪ Identificat'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-xl p-5 bg-amber-50">
              <h3 className="font-bold text-lg mb-3 text-amber-900">📋 Criterii Francizie</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Capital minim franchisee', value: '150.000 EUR' },
                  { label: 'Suprafața minimă locație', value: '150 mp' },
                  { label: 'Taxă intrare franciză', value: '25.000 EUR' },
                  { label: 'Redevență lunară', value: '6% din revenue' },
                  { label: 'Contribuție marketing', value: '2% din revenue' },
                  { label: 'Durată contract', value: '5 ani (reînnoire)' },
                ].map((c, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-amber-200">
                    <span className="text-gray-700">{c.label}</span>
                    <span className="font-bold text-amber-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchisePage;
