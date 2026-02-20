import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SupplyChainPage = () => {
  const [surplus, setSurplus] = useState([]);
  const [priceVolatility, setPriceVolatility] = useState([]);
  const [supplierScores, setSupplierScores] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('surplus');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadSurplus(), loadPriceVolatility(), loadSupplierScores(), loadPurchaseOrders()]);
    setLoading(false);
  };

  const loadSurplus = async () => {
    try {
      const res = await axios.get('/api/supply-chain/surplus');
      setSurplus(res.data);
    } catch {
      setSurplus([
        { id: 1, location: 'București – Floreasca', ingredient: 'Cartofi', surplusQty: '15 kg', deficitLocation: 'Cluj – Centru', suggestedTransfer: '10 kg', costSavings: '42 RON', status: 'Pending' },
        { id: 2, location: 'Timișoara – Fabric', ingredient: 'Roșii Cherry', surplusQty: '8 kg', deficitLocation: 'Iași – Copou', suggestedTransfer: '6 kg', costSavings: '28 RON', status: 'Approved' },
        { id: 3, location: 'Brașov – Centru', ingredient: 'Ulei Măsline', surplusQty: '4 L', deficitLocation: 'Timișoara – Fabric', suggestedTransfer: '3 L', costSavings: '55 RON', status: 'Pending' },
        { id: 4, location: 'Cluj – Centru', ingredient: 'Parmezan', surplusQty: '2 kg', deficitLocation: 'București – Floreasca', suggestedTransfer: '1.5 kg', costSavings: '120 RON', status: 'Pending' },
      ]);
    }
  };

  const loadPriceVolatility = async () => {
    try {
      const res = await axios.get('/api/supply-chain/price-volatility');
      setPriceVolatility(res.data);
    } catch {
      setPriceVolatility([
        { ingredient: 'Ulei Floarea Soarelui', currentPrice: 12.50, previousPrice: 10.20, changePct: 22.5, trend: '↑', alertLevel: 'HIGH' },
        { ingredient: 'Ouă (30 buc)', currentPrice: 18.00, previousPrice: 17.50, changePct: 2.9, trend: '↑', alertLevel: 'LOW' },
        { ingredient: 'Carne Vită', currentPrice: 42.00, previousPrice: 45.00, changePct: -6.7, trend: '↓', alertLevel: 'LOW' },
        { ingredient: 'Făină Albă', currentPrice: 3.80, previousPrice: 3.20, changePct: 18.8, trend: '↑', alertLevel: 'HIGH' },
        { ingredient: 'Roșii', currentPrice: 5.50, previousPrice: 5.60, changePct: -1.8, trend: '↓', alertLevel: 'LOW' },
        { ingredient: 'Somon', currentPrice: 88.00, previousPrice: 75.00, changePct: 17.3, trend: '↑', alertLevel: 'HIGH' },
        { ingredient: 'Lapte (1L)', currentPrice: 7.20, previousPrice: 7.20, changePct: 0, trend: '→', alertLevel: 'NONE' },
      ]);
    }
  };

  const loadSupplierScores = async () => {
    try {
      const res = await axios.get('/api/supply-chain/supplier-scores');
      setSupplierScores(res.data);
    } catch {
      setSupplierScores([
        { supplier: 'Metro Cash & Carry', onTime: 95, quality: 92, invoiceAccuracy: 98, score: 95, trend: '↑' },
        { supplier: 'Selgros', onTime: 88, quality: 85, invoiceAccuracy: 90, score: 88, trend: '→' },
        { supplier: 'Fornetti Distribution', onTime: 72, quality: 78, invoiceAccuracy: 82, score: 77, trend: '↑' },
        { supplier: 'AgroFresh SRL', onTime: 55, quality: 60, invoiceAccuracy: 70, score: 61, trend: '↓' },
        { supplier: 'FreshBio Import', onTime: 45, quality: 50, invoiceAccuracy: 55, score: 50, trend: '↓' },
      ]);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const res = await axios.get('/api/supply-chain/purchase-orders');
      setPurchaseOrders(res.data);
    } catch {
      setPurchaseOrders([
        { id: 'PO-2024-001', supplier: 'Metro Cash & Carry', items: 'Cartofi 50kg, Ceapă 20kg', total: '285 RON', createdAt: '2024-01-15 08:00', status: 'Approved' },
        { id: 'PO-2024-002', supplier: 'Selgros', items: 'Ulei 12L, Făină 25kg', total: '198 RON', createdAt: '2024-01-15 08:15', status: 'Sent' },
        { id: 'PO-2024-003', supplier: 'AgroFresh SRL', items: 'Roșii 30kg, Ardei 15kg', total: '342 RON', createdAt: '2024-01-15 09:00', status: 'Pending' },
        { id: 'PO-2024-004', supplier: 'Fornetti Distribution', items: 'Pâine 200 buc', total: '160 RON', createdAt: '2024-01-15 06:30', status: 'Delivered' },
      ]);
    }
  };

  const approveTransfer = async (id) => {
    setSurplus(prev => prev.map(s => s.id === id ? { ...s, status: 'Approved' } : s));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status) => {
    const map = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-gray-100 text-gray-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'surplus', label: '🔄 Surplus Inter-Locații' },
    { id: 'prices', label: '📈 Volatilitate Prețuri' },
    { id: 'suppliers', label: '⭐ Scoruri Furnizori' },
    { id: 'orders', label: '📦 Comenzi Automate' },
    { id: 'contracts', label: '📝 Optimizare Contracte' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">🔄 Se încarcă rețeaua de aprovizionare...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🌐 Rețea Lanț Aprovizionare</h1>
          <p className="text-gray-600">Real-Time Supply Chain Network – monitorizare și optimizare</p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <div className="text-sm text-gray-500">Transferuri Sugerate</div>
          <div className="text-2xl font-bold text-teal-700">{surplus.filter(s => s.status === 'Pending').length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm text-gray-500">Alerte Preț</div>
          <div className="text-2xl font-bold text-red-600">{priceVolatility.filter(p => p.alertLevel === 'HIGH').length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-sm text-gray-500">Furnizori Sub 60</div>
          <div className="text-2xl font-bold text-yellow-700">{supplierScores.filter(s => s.score < 60).length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-500">Comenzi Auto Astăzi</div>
          <div className="text-2xl font-bold text-green-700">{purchaseOrders.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white border-b-2 border-teal-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Surplus */}
      {activeTab === 'surplus' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔄 Detecție Surplus Inter-Locații</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-teal-900">
                  <th className="p-3 text-left">Locație</th>
                  <th className="p-3 text-left">Ingredient</th>
                  <th className="p-3 text-left">Surplus</th>
                  <th className="p-3 text-left">Locație Deficit</th>
                  <th className="p-3 text-left">Transfer Sugerat</th>
                  <th className="p-3 text-left">Economii</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Acțiune</th>
                </tr>
              </thead>
              <tbody>
                {surplus.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.location}</td>
                    <td className="p-3">{row.ingredient}</td>
                    <td className="p-3 text-green-700 font-semibold">{row.surplusQty}</td>
                    <td className="p-3 text-red-600">{row.deficitLocation}</td>
                    <td className="p-3">{row.suggestedTransfer}</td>
                    <td className="p-3 text-green-600 font-semibold">{row.costSavings}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {row.status === 'Pending' && (
                        <button
                          onClick={() => approveTransfer(row.id)}
                          className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700"
                        >
                          ✅ Aprobă Transfer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Prices */}
      {activeTab === 'prices' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Monitor Volatilitate Prețuri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-teal-900">
                  <th className="p-3 text-left">Ingredient</th>
                  <th className="p-3 text-right">Preț Curent</th>
                  <th className="p-3 text-right">Preț Anterior</th>
                  <th className="p-3 text-right">Variație %</th>
                  <th className="p-3 text-center">Trend</th>
                  <th className="p-3 text-center">Alert</th>
                </tr>
              </thead>
              <tbody>
                {priceVolatility.map((row, i) => {
                  const isSpike = Math.abs(row.changePct) > 15;
                  return (
                    <tr key={i} className={`border-b ${isSpike ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="p-3 font-medium">
                        {isSpike && <span className="mr-1">⚠️</span>}
                        {row.ingredient}
                      </td>
                      <td className="p-3 text-right font-semibold">{row.currentPrice.toFixed(2)} RON</td>
                      <td className="p-3 text-right text-gray-500">{row.previousPrice.toFixed(2)} RON</td>
                      <td className={`p-3 text-right font-bold ${row.changePct > 0 ? 'text-red-600' : row.changePct < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {row.changePct > 0 ? '+' : ''}{row.changePct.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center text-xl">{row.trend}</td>
                      <td className="p-3 text-center">
                        {row.alertLevel === 'HIGH' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">🔴 SPIKE</span>}
                        {row.alertLevel === 'LOW' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Normal</span>}
                        {row.alertLevel === 'NONE' && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">Stabil</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⭐ Scoruri Fiabilitate Furnizori</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-teal-900">
                  <th className="p-3 text-left">Furnizor</th>
                  <th className="p-3 text-right">Livrare la Timp %</th>
                  <th className="p-3 text-right">Calitate %</th>
                  <th className="p-3 text-right">Acuratețe Facturi %</th>
                  <th className="p-3 text-center">Scor Global</th>
                  <th className="p-3 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {supplierScores.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.supplier}</td>
                    <td className="p-3 text-right">{row.onTime}%</td>
                    <td className="p-3 text-right">{row.quality}%</td>
                    <td className="p-3 text-right">{row.invoiceAccuracy}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(row.score)}`}>
                        {row.score}
                      </span>
                    </td>
                    <td className="p-3 text-center text-lg">{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-full inline-block"></span> ≥80 Excelent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full inline-block"></span> 60-79 Acceptabil</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-full inline-block"></span> &lt;60 Risc</span>
          </div>
        </div>
      )}

      {/* Tab: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Comenzi de Achiziție Auto-Generate</h2>
          <div className="space-y-4">
            {purchaseOrders.map(po => (
              <div key={po.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-semibold text-gray-900">{po.id} – {po.supplier}</div>
                  <div className="text-sm text-gray-600 mt-1">{po.items}</div>
                  <div className="text-xs text-gray-400 mt-1">Generat: {po.createdAt}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-teal-700">{po.total}</div>
                  <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(po.status)}`}>
                    {po.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Contract Optimization */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Optimizare Contracte Furnizori</h2>
          <div className="space-y-4">
            {[
              { icon: '💡', title: 'Consolidare Furnizori Legume', desc: 'Poți consolida achizițiile de legume de la 3 furnizori diferiți la Metro, economisind ~15% prin volum crescut.', savings: '~1.200 RON/lună', action: 'Analizează' },
              { icon: '🔁', title: 'Renegociere Contract Ulei', desc: 'Prețul uleiului a crescut cu 22.5%. Recomandăm renegocierea contractului cu clauze de plafonare a prețului.', savings: '~680 RON/lună', action: 'Contactează Furnizorul' },
              { icon: '⚡', title: 'Eliminare Furnizor FreshBio', desc: 'FreshBio Import are scor 50/100 și livrări întârziate constant. Se recomandă înlocuirea cu un furnizor certificat.', savings: 'Risc redus', action: 'Vezi Alternative' },
            ].map((rec, i) => (
              <div key={i} className="border-l-4 border-teal-400 bg-teal-50 p-4 rounded-r-lg flex justify-between items-center">
                <div>
                  <div className="font-semibold text-teal-900">{rec.icon} {rec.title}</div>
                  <div className="text-sm text-teal-800 mt-1">{rec.desc}</div>
                  <div className="text-sm font-bold text-green-700 mt-2">Economii estimate: {rec.savings}</div>
                </div>
                <button className="ml-4 px-4 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 whitespace-nowrap">
                  {rec.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChainPage;
