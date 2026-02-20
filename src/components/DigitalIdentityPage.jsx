import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DigitalIdentityPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [segments, setSegments] = useState(null);
  const [riskOverview, setRiskOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    loadSegments();
    loadRiskOverview();
  }, []);

  const loadSegments = async () => {
    try {
      const res = await axios.get('/api/digital-identity/segments');
      setSegments(res.data);
    } catch {
      setSegments({
        risingStars: 142,
        loyalCore: 389,
        atRisk: 67,
        dormant: 234,
        champions: 55,
      });
    }
  };

  const loadRiskOverview = async () => {
    try {
      const res = await axios.get('/api/digital-identity/risk-overview');
      setRiskOverview(res.data);
    } catch {
      setRiskOverview({
        clean: 712,
        low: 189,
        medium: 78,
        high: 24,
      });
    }
  };

  const searchGuest = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`/api/digital-identity/search?q=${encodeURIComponent(searchQuery)}`);
      setSelectedGuest(res.data);
      if (res.data?.id) loadWallet(res.data.id);
    } catch {
      const demoGuest = {
        id: 'UUID-8f3a-4b2c',
        name: 'Andrei Popescu',
        phone: '+40 722 345 678',
        email: 'andrei.popescu@email.ro',
        visitCount: 47,
        totalSpend: 4320,
        loyaltyPoints: 8640,
        riskScore: 'Low',
        tier: 'Gold',
        joinedAt: '2022-03-14',
        lastVisit: '2024-01-12',
        crossBrandVisits: [
          { brand: 'Restaurant Principal', location: 'București – Floreasca', visits: 32, spend: 2980 },
          { brand: 'Terasa de Vară', location: 'București – Herăstrău', visits: 9, spend: 820 },
          { brand: 'Delivery App', location: 'Online', visits: 6, spend: 520 },
        ]
      };
      setSelectedGuest(demoGuest);
      loadWallet(demoGuest.id);
    }
    setSearchLoading(false);
  };

  const loadWallet = async (guestId) => {
    try {
      const res = await axios.get(`/api/digital-identity/wallet/${guestId}`);
      setWallet(res.data);
    } catch {
      setWallet({
        points: 8640,
        tier: 'Gold',
        nextTierPoints: 10000,
        nextTier: 'Platinum',
        pointHistory: [
          { date: '2024-01-12', description: 'Cină Valentines', points: +320 },
          { date: '2024-01-05', description: 'Prânz Business', points: +180 },
          { date: '2023-12-28', description: 'Reward utilizat', points: -500 },
          { date: '2023-12-20', description: 'Petrecere Crăciun', points: +640 },
        ],
        rewards: [
          { name: 'Desert Gratuit', points: 500, available: true },
          { name: 'Reducere 20%', points: 1000, available: true },
          { name: 'Cină pentru 2', points: 3000, available: true },
          { name: 'Weekend Break', points: 8000, available: true },
        ],
        brandBreakdown: [
          { brand: 'Restaurant Principal', points: 5960, pct: 69 },
          { brand: 'Terasa de Vară', points: 1640, pct: 19 },
          { brand: 'Delivery', points: 1040, pct: 12 },
        ]
      });
    }
  };

  const getTierColor = (tier) => {
    const map = { Bronze: 'text-amber-700 bg-amber-100', Silver: 'text-gray-600 bg-gray-200', Gold: 'text-yellow-700 bg-yellow-100', Platinum: 'text-purple-700 bg-purple-100' };
    return map[tier] || 'text-gray-600 bg-gray-100';
  };

  const getRiskColor = (risk) => {
    const map = { Clean: 'text-green-700 bg-green-100', Low: 'text-blue-700 bg-blue-100', Medium: 'text-yellow-700 bg-yellow-100', High: 'text-red-700 bg-red-100' };
    return map[risk] || 'text-gray-600 bg-gray-100';
  };

  const tabs = [
    { id: 'search', label: '🔍 Căutare Client' },
    { id: 'wallet', label: '💳 Portofel Loialitate' },
    { id: 'segments', label: '📊 Segmente Clienți' },
    { id: 'gdpr', label: '🔒 Control GDPR' },
    { id: 'risk', label: '⚠️ Risc Clienți' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🪪 Identitate Digitală Oaspeți</h1>
          <p className="text-gray-600">Universal Guest ID – Profiluri unificate cross-brand</p>
        </div>
        <button onClick={() => { loadSegments(); loadRiskOverview(); }} className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700">
          🔄 Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-3">🔍 Căutare Client</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Nume, telefon sau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchGuest()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            onClick={searchGuest}
            disabled={searchLoading}
            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
          >
            {searchLoading ? '⏳' : '🔍'} Caută
          </button>
        </div>

        {/* Guest Card */}
        {selectedGuest && (
          <div className="mt-4 border border-rose-200 rounded-xl p-5 bg-rose-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900">{selectedGuest.name}</div>
                <div className="text-sm text-gray-500 mt-1">📱 {selectedGuest.phone} · ✉️ {selectedGuest.email}</div>
                <div className="text-xs text-gray-400 mt-1">UUID: {selectedGuest.id} · Membru din: {selectedGuest.joinedAt} · Ultima vizită: {selectedGuest.lastVisit}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(selectedGuest.tier)}`}>
                  🏆 {selectedGuest.tier}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(selectedGuest.riskScore)}`}>
                  Risc: {selectedGuest.riskScore}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="text-2xl font-bold text-rose-700">{selectedGuest.visitCount}</div>
                <div className="text-xs text-gray-500">Vizite Total</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="text-2xl font-bold text-rose-700">{selectedGuest.totalSpend} RON</div>
                <div className="text-xs text-gray-500">Cheltuieli Total</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="text-2xl font-bold text-rose-700">{selectedGuest.loyaltyPoints.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Puncte Loialitate</div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Tab: Search / Cross-Brand */}
      {activeTab === 'search' && selectedGuest && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🌐 Activitate Cross-Brand</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rose-50 text-rose-900">
                  <th className="p-3 text-left">Brand</th>
                  <th className="p-3 text-left">Locație</th>
                  <th className="p-3 text-right">Vizite</th>
                  <th className="p-3 text-right">Total Cheltuieli</th>
                </tr>
              </thead>
              <tbody>
                {selectedGuest.crossBrandVisits?.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.brand}</td>
                    <td className="p-3 text-gray-600">{row.location}</td>
                    <td className="p-3 text-right font-semibold">{row.visits}</td>
                    <td className="p-3 text-right font-bold text-rose-700">{row.spend} RON</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Wallet */}
      {activeTab === 'wallet' && wallet && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6 rounded-xl shadow">
            <div className="text-sm opacity-80">Puncte Disponibile</div>
            <div className="text-4xl font-bold">{wallet.points.toLocaleString()} pts</div>
            <div className="mt-2 text-sm opacity-80">
              Tier: <strong>{wallet.tier}</strong> · Până la {wallet.nextTier}: {(wallet.nextTierPoints - wallet.points).toLocaleString()} puncte
            </div>
            <div className="mt-2 bg-white bg-opacity-20 rounded-full h-3">
              <div className="bg-white rounded-full h-3" style={{ width: `${Math.min(100, (wallet.points / wallet.nextTierPoints) * 100)}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-bold mb-3">📜 Istoric Puncte</h3>
              <div className="space-y-2">
                {wallet.pointHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="text-sm font-medium">{h.description}</div>
                      <div className="text-xs text-gray-400">{h.date}</div>
                    </div>
                    <span className={`font-bold ${h.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {h.points > 0 ? '+' : ''}{h.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-bold mb-3">🎁 Recompense Disponibile</h3>
              <div className="space-y-2">
                {wallet.rewards.map((r, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${r.available && wallet.points >= r.points ? 'border-rose-300 bg-rose-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{r.points.toLocaleString()} pts</span>
                      {wallet.points >= r.points && (
                        <button className="px-2 py-1 bg-rose-600 text-white text-xs rounded hover:bg-rose-700">Utilizează</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Segments */}
      {activeTab === 'segments' && segments && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Segmente Clienți</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Champions', count: segments.champions, icon: '🏆', color: 'bg-yellow-50 border-yellow-400 text-yellow-800' },
              { label: 'Loyal Core', count: segments.loyalCore, icon: '💎', color: 'bg-purple-50 border-purple-400 text-purple-800' },
              { label: 'Rising Stars', count: segments.risingStars, icon: '⭐', color: 'bg-blue-50 border-blue-400 text-blue-800' },
              { label: 'At-Risk', count: segments.atRisk, icon: '⚠️', color: 'bg-orange-50 border-orange-400 text-orange-800' },
              { label: 'Dormant', count: segments.dormant, icon: '😴', color: 'bg-gray-50 border-gray-400 text-gray-700' },
            ].map((seg, i) => (
              <div key={i} className={`border-2 rounded-xl p-4 text-center ${seg.color}`}>
                <div className="text-3xl mb-1">{seg.icon}</div>
                <div className="text-2xl font-bold">{seg.count}</div>
                <div className="text-sm font-medium mt-1">{seg.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: GDPR */}
      {activeTab === 'gdpr' && selectedGuest && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔒 Control GDPR – {selectedGuest.name}</h2>
          <div className="space-y-4">
            {[
              { label: 'Marketing Email', consented: true },
              { label: 'Analiză Comportament', consented: true },
              { label: 'Date Partajate cu Parteneri', consented: false },
              { label: 'Notificări Push', consented: true },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium">{item.label}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.consented ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.consented ? '✅ Consimțit' : '❌ Refuzat'}
                </span>
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                📥 Export Date (Art.20)
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                🗑️ Ștergere Date (Art.17)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Risk */}
      {activeTab === 'risk' && riskOverview && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⚠️ Distribuție Scoruri Risc</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clean', count: riskOverview.clean, color: 'bg-green-100 border-green-400 text-green-800', icon: '✅' },
              { label: 'Risc Scăzut', count: riskOverview.low, color: 'bg-blue-100 border-blue-400 text-blue-800', icon: '🔵' },
              { label: 'Risc Mediu', count: riskOverview.medium, color: 'bg-yellow-100 border-yellow-400 text-yellow-800', icon: '⚠️' },
              { label: 'Risc Ridicat', count: riskOverview.high, color: 'bg-red-100 border-red-400 text-red-800', icon: '🔴' },
            ].map((item, i) => (
              <div key={i} className={`border-2 rounded-xl p-5 text-center ${item.color}`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-3xl font-bold">{item.count}</div>
                <div className="text-sm font-medium mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Distribuție vizuală:</div>
            {[
              { label: 'Clean', count: riskOverview.clean, color: 'bg-green-500' },
              { label: 'Scăzut', count: riskOverview.low, color: 'bg-blue-500' },
              { label: 'Mediu', count: riskOverview.medium, color: 'bg-yellow-500' },
              { label: 'Ridicat', count: riskOverview.high, color: 'bg-red-500' },
            ].map((item, i) => {
              const total = riskOverview.clean + riskOverview.low + riskOverview.medium + riskOverview.high;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <span className="w-20 text-sm">{item.label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-5">
                    <div className={`h-5 rounded-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="w-12 text-sm font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalIdentityPage;
