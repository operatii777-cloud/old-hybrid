import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GlobalDataNetworkPage = () => {
  const [networkStats, setNetworkStats] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  const [insights, setInsights] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadNetworkStats(), loadDataPoints(), loadInsights(), loadBenchmarks()]);
    setLoading(false);
  };

  const loadNetworkStats = async () => {
    try {
      const res = await axios.get('/api/global-data-network/stats');
      setNetworkStats(res.data);
    } catch {
      setNetworkStats(demoNetworkStats());
    }
  };

  const loadDataPoints = async () => {
    try {
      const res = await axios.get('/api/global-data-network/data-points');
      setDataPoints(res.data);
    } catch {
      setDataPoints(demoDataPoints());
    }
  };

  const loadInsights = async () => {
    try {
      const res = await axios.get('/api/global-data-network/insights');
      setInsights(res.data);
    } catch {
      setInsights(demoInsights());
    }
  };

  const loadBenchmarks = async () => {
    try {
      const res = await axios.get('/api/global-data-network/benchmarks');
      setBenchmarks(res.data);
    } catch {
      setBenchmarks(demoBenchmarks());
    }
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoNetworkStats = () => ({
    totalProperties: 1840,
    countriesActive: 18,
    dataPointsPerDay: 42800000,
    anonymizedRecords: 98400000,
    networkEffect: '+34%',
    predictiveAccuracy: 91.2,
    sharedInsights: 284,
    lastSync: '2 minute în urmă',
  });

  const demoDataPoints = () => [
    { category: 'Comenzi & POS', records: 42800000, growth: '+22%', freshness: 'Timp real', value: 'Ridicat' },
    { category: 'Comportament Clienți', records: 18400000, growth: '+31%', freshness: '< 1h', value: 'Ridicat' },
    { category: 'Prețuri Competitori', records: 2840000, growth: '+18%', freshness: 'Zilnic', value: 'Mediu' },
    { category: 'Tendințe Menuri', records: 8200000, growth: '+45%', freshness: '< 6h', value: 'Ridicat' },
    { category: 'Date Meteo × Consum', records: 1200000, growth: '+12%', freshness: '< 3h', value: 'Mediu' },
    { category: 'Performanță Livrări', records: 9800000, growth: '+28%', freshness: '< 30min', value: 'Ridicat' },
  ];

  const demoInsights = () => [
    {
      type: 'trend',
      icon: '📈',
      title: 'Creștere demand – burgeri artizanali',
      description: 'Rețeaua globală indică +38% creștere în cerere pentru burgeri premium față de luna trecută. Locațiile din Cluj și București au cel mai mare potențial neexploatat.',
      confidence: 94,
      impact: 'Ridicat',
    },
    {
      type: 'pricing',
      icon: '💰',
      title: 'Oportunitate de reprețuire – pizza',
      description: 'Analiza de rețea arată că prețul mediu la pizza în zona dvs. este cu 12% sub media pieței. Creșterea cu 8-10% nu ar afecta cererea.',
      confidence: 87,
      impact: 'Mediu',
    },
    {
      type: 'operations',
      icon: '⏱️',
      title: 'Timp de așteptare ridicat joi 19:00-21:00',
      description: 'Pattern identificat în 840 de restaurante similare: vârful de joi seara necesită +2 angajați în bucătărie pentru a reduce timpii de așteptare.',
      confidence: 91,
      impact: 'Mediu',
    },
    {
      type: 'loyalty',
      icon: '🎯',
      title: 'Campanie loialitate recomandată – weekend',
      description: 'Clienții din segmentul "At-Risk" au o rată de reactivare de 42% la ofertele de weekend bazate pe date din rețea.',
      confidence: 82,
      impact: 'Ridicat',
    },
  ];

  const demoBenchmarks = () => [
    { metric: 'Bilet Mediu', yourValue: 78, networkAvg: 72, networkTop: 95, unit: 'RON' },
    { metric: 'Timp Preparare', yourValue: 18, networkAvg: 22, networkTop: 12, unit: 'min' },
    { metric: 'Satisfacție Client', yourValue: 4.2, networkAvg: 4.0, networkTop: 4.8, unit: '/5' },
    { metric: 'Rată Retur Clienți', yourValue: 34, networkAvg: 28, networkTop: 52, unit: '%' },
    { metric: 'Consum Ingrediente', yourValue: 31, networkAvg: 34, networkTop: 26, unit: '% waste' },
    { metric: 'Revenue per mp', yourValue: 1840, networkAvg: 1620, networkTop: 2480, unit: 'RON/mp' },
  ];

  const getImpactColor = (impact) => {
    const map = { 'Ridicat': 'bg-red-100 text-red-700', 'Mediu': 'bg-yellow-100 text-yellow-700', 'Scăzut': 'bg-green-100 text-green-700' };
    return map[impact] || 'bg-gray-100 text-gray-600';
  };

  const tabs = [
    { id: 'overview', label: '🌐 Rețea Globală' },
    { id: 'insights', label: '💡 Insights' },
    { id: 'benchmarks', label: '📊 Benchmarking' },
    { id: 'data', label: '📦 Date Colectate' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🌐 Global Data Network Effect</h1>
          <p className="text-gray-600">Efectul de rețea – date anonimizate, insights colective, avantaj competitiv</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {networkStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Proprietăți în Rețea', value: networkStats.totalProperties.toLocaleString(), icon: '🏪', color: 'bg-violet-50 border-violet-300' },
            { label: 'Puncte Date/Zi', value: `${(networkStats.dataPointsPerDay / 1000000).toFixed(1)}M`, icon: '📊', color: 'bg-blue-50 border-blue-300' },
            { label: 'Acuratețe Predicții', value: `${networkStats.predictiveAccuracy}%`, icon: '🎯', color: 'bg-green-50 border-green-300' },
            { label: 'Efect Rețea', value: networkStats.networkEffect, icon: '📈', color: 'bg-orange-50 border-orange-300' },
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
              activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && networkStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">🌍 Acoperire Rețea</h3>
            <div className="space-y-3">
              {[
                { label: 'Țări Active', value: networkStats.countriesActive },
                { label: 'Înregistrări Anonimizate', value: `${(networkStats.anonymizedRecords / 1000000).toFixed(1)}M` },
                { label: 'Insights Partajate', value: networkStats.sharedInsights },
                { label: 'Ultima Sincronizare', value: networkStats.lastSync },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-xl p-6 shadow">
            <h3 className="font-bold text-lg mb-3">🔒 Confidențialitate Date</h3>
            <ul className="space-y-2 text-sm">
              {[
                '✅ Toate datele sunt 100% anonimizate',
                '✅ Conformitate GDPR completă',
                '✅ Nicio informație individuală partajată',
                '✅ Criptare end-to-end în transit',
                '✅ Drept de excludere din rețea oricând',
                '✅ Audit log complet al acceselor',
              ].map((item, i) => (
                <li key={i} className="opacity-90">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.map((insight, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6 border-l-4 border-violet-500">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{insight.icon}</span>
                  <div>
                    <div className="font-bold text-lg">{insight.title}</div>
                    <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getImpactColor(insight.impact)}`}>
                    Impact: {insight.impact}
                  </span>
                  <span className="text-xs text-gray-400">Încredere: {insight.confidence}%</span>
                </div>
              </div>
              <div className="mt-3 bg-violet-50 rounded-full h-2">
                <div className="bg-violet-500 rounded-full h-2" style={{ width: `${insight.confidence}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Benchmarks */}
      {activeTab === 'benchmarks' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Benchmarking față de Rețea</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-50 text-violet-900">
                  <th className="p-3 text-left">Metrică</th>
                  <th className="p-3 text-right">Locația Ta</th>
                  <th className="p-3 text-right">Media Rețea</th>
                  <th className="p-3 text-right">Top 10%</th>
                  <th className="p-3 text-center">Poziție</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b, i) => {
                  const isHigherBetter = !b.metric.includes('waste') && !b.metric.includes('Preparare');
                  const aboveAvg = isHigherBetter ? b.yourValue >= b.networkAvg : b.yourValue <= b.networkAvg;
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{b.metric}</td>
                      <td className="p-3 text-right font-bold">{b.yourValue} {b.unit}</td>
                      <td className="p-3 text-right text-gray-500">{b.networkAvg} {b.unit}</td>
                      <td className="p-3 text-right text-purple-700 font-semibold">{b.networkTop} {b.unit}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${aboveAvg ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {aboveAvg ? '✅ Peste medie' : '📈 Sub medie'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Data Points */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📦 Categorii Date Colectate</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataPoints.map((dp, i) => (
              <div key={i} className="border-2 border-violet-200 rounded-xl p-4 bg-violet-50">
                <div className="flex justify-between items-start">
                  <div className="font-bold">{dp.category}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dp.value === 'Ridicat' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    Valoare: {dp.value}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-violet-800">{(dp.records / 1000000).toFixed(1)}M</span> înregistrări
                  <span className="ml-3 text-green-700 font-medium">{dp.growth}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">Prospețime: {dp.freshness}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalDataNetworkPage;
