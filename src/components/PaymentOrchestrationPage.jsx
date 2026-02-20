import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentOrchestrationPage = () => {
  const [psps, setPsps] = useState([]);
  const [transactions, setTransactions] = useState(null);
  const [chargebacks, setChargebacks] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('psps');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadPsps(), loadTransactions(), loadChargebacks(), loadGiftCards()]);
    setLoading(false);
  };

  const loadPsps = async () => {
    try {
      const res = await axios.get('/api/payment-orchestration/psps');
      setPsps(res.data);
    } catch {
      setPsps([
        { id: 1, name: 'Stripe', logo: '💳', status: 'Active', priority: 1, feePct: 1.4, settlementDays: 2, currencies: 'EUR, USD, GBP, RON', enabled: true },
        { id: 2, name: 'Adyen', logo: '🌍', status: 'Active', priority: 2, feePct: 0.9, settlementDays: 3, currencies: 'EUR, USD, RON', enabled: true },
        { id: 3, name: 'Worldline', logo: '🔵', status: 'Active', priority: 3, feePct: 1.1, settlementDays: 3, currencies: 'EUR, RON', enabled: true },
        { id: 4, name: 'Netopia', logo: '🇷🇴', status: 'Active', priority: 4, feePct: 1.8, settlementDays: 1, currencies: 'RON', enabled: true },
        { id: 5, name: 'PayU', logo: '💰', status: 'Inactive', priority: 5, feePct: 2.0, settlementDays: 2, currencies: 'RON', enabled: false },
      ]);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await axios.get('/api/payment-orchestration/transactions');
      setTransactions(res.data);
    } catch {
      setTransactions({
        total: 312,
        totalAmount: 28540,
        routingSavings: 342,
        failoverEvents: 3,
        byPsp: [
          { psp: 'Stripe', count: 145, amount: 13200, pct: 46, color: 'bg-blue-500' },
          { psp: 'Adyen', count: 98, amount: 9800, pct: 31, color: 'bg-green-500' },
          { psp: 'Worldline', count: 42, amount: 3840, pct: 14, color: 'bg-purple-500' },
          { psp: 'Netopia', count: 27, amount: 1700, pct: 9, color: 'bg-orange-500' },
        ]
      });
    }
  };

  const loadChargebacks = async () => {
    try {
      const res = await axios.get('/api/payment-orchestration/chargebacks');
      setChargebacks(res.data);
    } catch {
      setChargebacks([
        { id: 'TXN-48291', amount: '245 RON', reason: 'Produs nelivrat', status: 'Open', autoResponse: true, psp: 'Stripe' },
        { id: 'TXN-47853', amount: '89 RON', reason: 'Tranzacție neautorizată', status: 'Won', autoResponse: true, psp: 'Adyen' },
        { id: 'TXN-46201', amount: '520 RON', reason: 'Serviciu nesatisfăcător', status: 'Lost', autoResponse: false, psp: 'Worldline' },
        { id: 'TXN-45990', amount: '120 RON', reason: 'Dublă taxare', status: 'Open', autoResponse: true, psp: 'Netopia' },
      ]);
    }
  };

  const loadGiftCards = async () => {
    try {
      const res = await axios.get('/api/payment-orchestration/gift-cards');
      setGiftCards(res.data);
    } catch {
      setGiftCards([
        { code: 'GIFT-2024-ABCD', balance: 200, issued: '2024-01-01', expires: '2025-01-01', status: 'Active' },
        { code: 'GIFT-2024-EFGH', balance: 0, issued: '2023-06-15', expires: '2024-06-15', status: 'Used' },
        { code: 'GIFT-2024-IJKL', balance: 150, issued: '2024-01-10', expires: '2025-01-10', status: 'Active' },
        { code: 'GIFT-2023-MNOP', balance: 50, issued: '2023-01-05', expires: '2024-01-05', status: 'Expired' },
      ]);
    }
  };

  const togglePsp = (id) => {
    setPsps(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled, status: !p.enabled ? 'Active' : 'Inactive' } : p));
  };

  const getStatusBadge = (status) => {
    const map = {
      Open: 'bg-yellow-100 text-yellow-800',
      Won: 'bg-green-100 text-green-800',
      Lost: 'bg-red-100 text-red-800',
      Active: 'bg-green-100 text-green-800',
      Used: 'bg-gray-100 text-gray-600',
      Expired: 'bg-red-100 text-red-700',
      Inactive: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const tabs = [
    { id: 'psps', label: '🔌 Configurare PSP' },
    { id: 'routing', label: '🔀 Reguli Rutare' },
    { id: 'analytics', label: '📊 Analiză Tranzacții' },
    { id: 'chargebacks', label: '⚔️ Dispute Plăți' },
    { id: 'giftcards', label: '🎁 Carduri Cadou' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">🔄 Se încarcă orchestrarea plăților...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💳 Orchestrare Plăți Globală</h1>
          <p className="text-gray-600">Motor de rutare inteligentă a tranzacțiilor</p>
        </div>
        <button onClick={loadAllData} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
          🔄 Refresh
        </button>
      </div>

      {/* Summary cards */}
      {transactions && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
            <div className="text-sm text-gray-500">Tranzacții Azi</div>
            <div className="text-2xl font-bold text-amber-700">{transactions.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-500">Volum Total</div>
            <div className="text-2xl font-bold text-green-700">{transactions.totalAmount.toLocaleString()} RON</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-500">Economii Rutare</div>
            <div className="text-2xl font-bold text-blue-700">{transactions.routingSavings} RON</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-sm text-gray-500">Failover Events</div>
            <div className="text-2xl font-bold text-red-600">{transactions.failoverEvents}</div>
          </div>
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

      {/* Tab: PSP Config */}
      {activeTab === 'psps' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔌 Configurare Payment Service Providers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-amber-900">
                  <th className="p-3 text-left">PSP</th>
                  <th className="p-3 text-center">Prioritate</th>
                  <th className="p-3 text-right">Comision %</th>
                  <th className="p-3 text-center">Decontare (zile)</th>
                  <th className="p-3 text-left">Valute</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Activ</th>
                </tr>
              </thead>
              <tbody>
                {psps.map(psp => (
                  <tr key={psp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold flex items-center gap-2">
                      <span className="text-xl">{psp.logo}</span> {psp.name}
                    </td>
                    <td className="p-3 text-center">
                      <span className="w-7 h-7 inline-flex items-center justify-center bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                        {psp.priority}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{psp.feePct}%</td>
                    <td className="p-3 text-center">{psp.settlementDays}</td>
                    <td className="p-3 text-xs text-gray-600">{psp.currencies}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(psp.status)}`}>
                        {psp.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => togglePsp(psp.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${psp.enabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${psp.enabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Routing */}
      {activeTab === 'routing' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔀 Reguli de Rutare Tranzacții</h2>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-amber-100 border-2 border-amber-400 rounded-xl px-8 py-4 text-center font-bold text-amber-900">
              💳 Tranzacție Nouă
            </div>
            <div className="text-2xl text-gray-400">↓</div>
            <div className="bg-blue-100 border-2 border-blue-400 rounded-xl px-8 py-4 text-center font-bold text-blue-900">
              🧠 Motor Decizie Rutare
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                { label: '💰 Comision Minim', desc: 'Rută prin PSP cu cel mai mic comision', psp: 'Adyen (0.9%)' },
                { label: '⚡ Decontare Rapidă', desc: 'Prioritizează decontarea în ziua curentă', psp: 'Netopia (1 zi)' },
                { label: '🌍 Geografic', desc: 'Bazat pe locația cardului/clientului', psp: 'Worldline (EU)' },
                { label: '🔄 Failover Auto', desc: 'Dacă PSP principal eșuează', psp: 'Stripe → Adyen' },
              ].map((rule, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="font-bold text-sm">{rule.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{rule.desc}</div>
                  <div className="mt-2 text-xs font-mono bg-gray-100 rounded p-1">{rule.psp}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4 w-full">
              <h3 className="font-bold text-yellow-800 mb-2">💡 Alerte Optimizare Comisioane</h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>• Volum mare RON azi → recomandăm rutare mai mult prin Netopia (-0.9% vs Stripe)</li>
                <li>• 3 failover-uri detectate azi prin Worldline → verificați conectivitatea</li>
                <li>• Activând Adyen ca PSP #1 pentru tranzacții &gt;200 RON → economii estimate 180 RON/zi</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && transactions && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Analiză Tranzacții Azi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Distribuție per PSP</h3>
              <div className="space-y-3">
                {transactions.byPsp.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{p.psp}</span>
                      <span>{p.count} tranzacții · {p.amount.toLocaleString()} RON</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-5">
                      <div className={`h-5 rounded-full ${p.color}`} style={{ width: `${p.pct}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Pie Chart PSP</h3>
              <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                  {transactions.byPsp.reduce((acc, p, i) => {
                    const offset = acc.offset;
                    const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316'];
                    const segment = (
                      <circle
                        key={i}
                        r="14" cx="16" cy="16"
                        fill="transparent"
                        stroke={colors[i]}
                        strokeWidth="4"
                        strokeDasharray={`${p.pct * 0.88} ${88 - p.pct * 0.88}`}
                        strokeDashoffset={-offset * 0.88}
                      />
                    );
                    acc.segments.push(segment);
                    acc.offset += p.pct;
                    return acc;
                  }, { segments: [], offset: 0 }).segments}
                </svg>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {transactions.byPsp.map((p, i) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                  return (
                    <span key={i} className="flex items-center gap-1 text-xs">
                      <span className={`w-3 h-3 rounded-full inline-block ${colors[i]}`}></span>
                      {p.psp} ({p.pct}%)
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Chargebacks */}
      {activeTab === 'chargebacks' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⚔️ Dispute și Chargeback-uri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-amber-900">
                  <th className="p-3 text-left">ID Tranzacție</th>
                  <th className="p-3 text-left">PSP</th>
                  <th className="p-3 text-right">Sumă</th>
                  <th className="p-3 text-left">Motiv</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Răspuns Auto</th>
                </tr>
              </thead>
              <tbody>
                {chargebacks.map((cb, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{cb.id}</td>
                    <td className="p-3">{cb.psp}</td>
                    <td className="p-3 text-right font-semibold">{cb.amount}</td>
                    <td className="p-3 text-gray-600">{cb.reason}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(cb.status)}`}>
                        {cb.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {cb.autoResponse ? <span className="text-green-600">✅ Da</span> : <span className="text-red-500">❌ Nu</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Gift Cards */}
      {activeTab === 'giftcards' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🎁 Carduri Cadou Emise</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-amber-900">
                  <th className="p-3 text-left">Cod</th>
                  <th className="p-3 text-right">Sold</th>
                  <th className="p-3 text-center">Emis</th>
                  <th className="p-3 text-center">Expiră</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.map((gc, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{gc.code}</td>
                    <td className="p-3 text-right font-bold text-amber-700">{gc.balance} RON</td>
                    <td className="p-3 text-center text-gray-500">{gc.issued}</td>
                    <td className="p-3 text-center text-gray-500">{gc.expires}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(gc.status)}`}>
                        {gc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
            🎁 Emite Card Nou
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentOrchestrationPage;
