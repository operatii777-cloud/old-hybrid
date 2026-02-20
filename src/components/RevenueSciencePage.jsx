import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RevenueSciencePage = () => {
  const [menuEngineering, setMenuEngineering] = useState([]);
  const [elasticity, setElasticity] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix');
  const [newTest, setNewTest] = useState({ produs: '', pret_original: '', pret_test: '', durata_zile: 7 });
  const [showNewTestForm, setShowNewTestForm] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadMenuEngineering(),
      loadElasticity(),
      loadAbTests(),
      loadOpportunities(),
    ]);
    setLoading(false);
  };

  const loadMenuEngineering = async () => {
    try {
      const response = await axios.get('/api/revenue-science/menu-engineering');
      setMenuEngineering(response.data);
    } catch {
      setMenuEngineering(getDemoMenuEngineering());
    }
  };

  const loadElasticity = async () => {
    try {
      const response = await axios.get('/api/revenue-science/elasticity');
      setElasticity(response.data);
    } catch {
      setElasticity(getDemoElasticity());
    }
  };

  const loadAbTests = async () => {
    try {
      const response = await axios.get('/api/revenue-science/ab-tests');
      setAbTests(response.data);
    } catch {
      setAbTests(getDemoAbTests());
    }
  };

  const loadOpportunities = async () => {
    try {
      const response = await axios.get('/api/revenue-science/opportunities');
      setOpportunities(response.data);
    } catch {
      setOpportunities(getDemoOpportunities());
    }
  };

  const handleCreateTest = async () => {
    try {
      await axios.post('/api/revenue-science/ab-tests', newTest);
      setShowNewTestForm(false);
      setNewTest({ produs: '', pret_original: '', pret_test: '', durata_zile: 7 });
      loadAbTests();
    } catch {
      alert('Eroare la crearea testului A/B');
    }
  };

  // ---- Demo data ----

  const getDemoMenuEngineering = () => [
    { id: 1, produs: 'Ciorba de burta', categorie: 'STAR', marja_profit: 72, popularitate: 89, vanzari_saptamana: 45, pret: 22, weeks_as_dog: 0 },
    { id: 2, produs: 'Mici cu mustar', categorie: 'STAR', marja_profit: 68, popularitate: 94, vanzari_saptamana: 61, pret: 18, weeks_as_dog: 0 },
    { id: 3, produs: 'Papanasi', categorie: 'STAR', marja_profit: 75, popularitate: 82, vanzari_saptamana: 38, pret: 19, weeks_as_dog: 0 },
    { id: 4, produs: 'Sarmale cu mamaliga', categorie: 'PLOWHORSE', marja_profit: 38, popularitate: 91, vanzari_saptamana: 53, pret: 35, weeks_as_dog: 0 },
    { id: 5, produs: 'Friptura de porc', categorie: 'PLOWHORSE', marja_profit: 42, popularitate: 78, vanzari_saptamana: 34, pret: 48, weeks_as_dog: 0 },
    { id: 6, produs: 'Tiramisu', categorie: 'PUZZLE', marja_profit: 81, popularitate: 29, vanzari_saptamana: 12, pret: 24, weeks_as_dog: 0 },
    { id: 7, produs: 'Friptura de vitel', categorie: 'PUZZLE', marja_profit: 76, popularitate: 22, vanzari_saptamana: 8, pret: 65, weeks_as_dog: 0 },
    { id: 8, produs: 'Salata greceasca', categorie: 'DOG', marja_profit: 31, popularitate: 18, vanzari_saptamana: 5, pret: 22, weeks_as_dog: 6 },
    { id: 9, produs: 'Supa crema de ciuperci', categorie: 'DOG', marja_profit: 28, popularitate: 14, vanzari_saptamana: 3, pret: 18, weeks_as_dog: 5 },
  ];

  const getDemoElasticity = () => [
    { produs: 'Ciorba de burta', pret_curent: 22, coeficient: -0.4, sensibilitate: 'Scazuta', recomandare: 'Creste pretul cu 10-15%', impact_vanzari: '+2%', impact_profit: '+12%' },
    { produs: 'Mici cu mustar', pret_curent: 18, coeficient: -1.2, sensibilitate: 'Ridicata', recomandare: 'Mentine pretul actual', impact_vanzari: '-18%', impact_profit: '-8%' },
    { produs: 'Papanasi', pret_curent: 19, coeficient: -0.6, sensibilitate: 'Medie', recomandare: 'Creste pretul cu 5%', impact_vanzari: '-3%', impact_profit: '+7%' },
    { produs: 'Sarmale cu mamaliga', pret_curent: 35, coeficient: -0.8, sensibilitate: 'Medie', recomandare: 'Creste pretul cu 5%', impact_vanzari: '-4%', impact_profit: '+6%' },
    { produs: 'Friptura de porc', pret_curent: 48, coeficient: -1.5, sensibilitate: 'Ridicata', recomandare: 'Considera reducere 5%', impact_vanzari: '+8%', impact_profit: '-3%' },
    { produs: 'Tiramisu', pret_curent: 24, coeficient: -0.3, sensibilitate: 'Scazuta', recomandare: 'Creste pretul cu 15-20%', impact_vanzari: '-2%', impact_profit: '+18%' },
    { produs: 'Friptura de vitel', pret_curent: 65, coeficient: -0.5, sensibilitate: 'Scazuta', recomandare: 'Creste pretul cu 10%', impact_vanzari: '-2%', impact_profit: '+11%' },
    { produs: 'Salata greceasca', pret_curent: 22, coeficient: -2.1, sensibilitate: 'Foarte ridicata', recomandare: 'Reformuleaza sau elimina', impact_vanzari: '-42%', impact_profit: '-35%' },
  ];

  const getDemoAbTests = () => [
    { id: 1, produs: 'Papanasi', pret_original: 19, pret_test: 22, status: 'activ', zile_ramase: 4, vanzari_original: 38, vanzari_test: 36, castigator: null, creat_la: '2025-01-10' },
    { id: 2, produs: 'Tiramisu', pret_original: 24, pret_test: 28, status: 'finalizat', zile_ramase: 0, vanzari_original: 11, vanzari_test: 13, castigator: 'test', creat_la: '2025-01-01' },
    { id: 3, produs: 'Ciorba de burta', pret_original: 20, pret_test: 22, status: 'finalizat', zile_ramase: 0, vanzari_original: 42, vanzari_test: 45, castigator: 'test', creat_la: '2024-12-20' },
  ];

  const getDemoOpportunities = () => [
    { id: 1, tip: 'upsell', mesaj: 'Clienții care comandă Mici cumpără deseori Bere — sugerează combo!', prioritate: 'inalta', potential_roi: '+340 RON/săpt.' },
    { id: 2, tip: 'timing', mesaj: 'Vineri 19:00-21:00 generează 38% din vânzările săptămânale — promovează meniu special!', prioritate: 'medie', potential_roi: '+180 RON/săpt.' },
    { id: 3, tip: 'pret', mesaj: 'Tiramisu are elasticitate scazuta — oportunitate de crestere pret cu 15%.', prioritate: 'inalta', potential_roi: '+210 RON/săpt.' },
    { id: 4, tip: 'upsell', mesaj: 'Oferta de desert la finalul mesei creste valoarea medie cu 18%.', prioritate: 'medie', potential_roi: '+150 RON/săpt.' },
  ];

  // ---- Helpers ----

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(amount || 0);

  const getCategoryConfig = (cat) => {
    const configs = {
      STAR:      { label: '⭐ STAR',      bg: 'bg-green-50',  border: 'border-green-400',  badge: 'bg-green-100 text-green-800',  desc: 'Marjă mare + Popularitate mare' },
      PLOWHORSE: { label: '🐄 PLOWHORSE', bg: 'bg-blue-50',   border: 'border-blue-400',   badge: 'bg-blue-100 text-blue-800',    desc: 'Marjă mică + Popularitate mare' },
      PUZZLE:    { label: '🧩 PUZZLE',    bg: 'bg-yellow-50', border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-800', desc: 'Marjă mare + Popularitate mică' },
      DOG:       { label: '🐕 DOG',       bg: 'bg-red-50',    border: 'border-red-400',    badge: 'bg-red-100 text-red-800',      desc: 'Marjă mică + Popularitate mică' },
    };
    return configs[cat] || configs.DOG;
  };

  const getElasticityColor = (coeficient) => {
    const abs = Math.abs(coeficient);
    if (abs < 0.5) return 'text-green-600 font-semibold';
    if (abs < 1.0) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getPriorityBadge = (prioritate) => {
    if (prioritate === 'inalta') return 'bg-red-100 text-red-700';
    if (prioritate === 'medie') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const dogProducts = menuEngineering.filter(p => p.categorie === 'DOG' && p.weeks_as_dog >= 4);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">🔄 Se încarcă Revenue Science...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'matrix',       label: '🧮 Inginerie Meniu' },
    { id: 'elasticity',   label: '📉 Elasticitate Preț' },
    { id: 'abtests',      label: '🔬 Teste A/B Prețuri' },
    { id: 'opportunities',label: '💡 Oportunități Venituri' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔬 Revenue Science</h1>
          <p className="text-gray-600">Optimizare prețuri și inginerie meniu bazată pe date</p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Dog product removal alert */}
      {dogProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-800">Sugestie Eliminare Produse</p>
              <p className="text-red-700 text-sm mt-1">
                Următoarele produse sunt în categoria DOG de 4+ săptămâni și sunt candidate la eliminare din meniu:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {dogProducts.map(p => (
                  <span key={p.id} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    🐕 {p.produs} ({p.weeks_as_dog} săpt.)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== BCG MATRIX ===== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['STAR', 'PUZZLE', 'PLOWHORSE', 'DOG'].map(cat => {
              const cfg = getCategoryConfig(cat);
              const products = menuEngineering.filter(p => p.categorie === cat);
              return (
                <div key={cat} className={`${cfg.bg} border-2 ${cfg.border} rounded-xl p-5`}>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cfg.label}</h3>
                      <p className="text-xs text-gray-500">{cfg.desc}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                      {products.length} produse
                    </span>
                  </div>
                  <div className="space-y-2">
                    {products.length === 0 && (
                      <p className="text-gray-400 text-sm italic">Niciun produs în această categorie</p>
                    )}
                    {products.map(p => (
                      <div key={p.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.produs}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(p.pret)} · {p.vanzari_saptamana} vânz./săpt.</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">Marjă {p.marja_profit}%</div>
                          <div className="text-xs text-gray-500">Pop. {p.popularitate}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">📌 Ghid Inginerie Meniu</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2 items-start"><span>⭐</span><span><strong>STAR</strong> — Promovează activ, menține calitatea, poate crește ușor prețul</span></div>
              <div className="flex gap-2 items-start"><span>🐄</span><span><strong>PLOWHORSE</strong> — Crește marja prin optimizarea rețetei sau pricing</span></div>
              <div className="flex gap-2 items-start"><span>🧩</span><span><strong>PUZZLE</strong> — Promovează mai mult, plasează strategic în meniu</span></div>
              <div className="flex gap-2 items-start"><span>🐕</span><span><strong>DOG</strong> — Elimină sau reformulează dacă e în această categorie 4+ săptămâni</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ELASTICITATE PREȚ ===== */}
      {activeTab === 'elasticity' && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">📉 Elasticitate Preț pe Produs</h2>
            <p className="text-sm text-gray-500 mt-1">
              Coeficient {'<'} 0 = cererea scade când prețul crește. {'|coef| < 1'} = inelastic (oportunitate de creștere preț).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Produs</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Preț curent</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Coeficient</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Sensibilitate</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Recomandare</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Impact Vânzări</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Impact Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {elasticity.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{row.produs}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.pret_curent)}</td>
                    <td className={`px-4 py-3 text-right ${getElasticityColor(row.coeficient)}`}>{row.coeficient}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.sensibilitate === 'Scazuta' ? 'bg-green-100 text-green-700' :
                        row.sensibilitate === 'Medie' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{row.sensibilitate}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.recomandare}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">{row.impact_vanzari}</td>
                    <td className={`px-4 py-3 text-right font-bold ${row.impact_profit?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {row.impact_profit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TESTE A/B PREȚURI ===== */}
      {activeTab === 'abtests' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">🔬 Teste A/B Prețuri</h2>
            <button
              onClick={() => setShowNewTestForm(!showNewTestForm)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
            >
              ➕ Test Nou
            </button>
          </div>

          {showNewTestForm && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Creează Test A/B Nou</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produs</label>
                  <input
                    type="text"
                    value={newTest.produs}
                    onChange={e => setNewTest({ ...newTest, produs: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Denumire produs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preț Original (RON)</label>
                  <input
                    type="number"
                    value={newTest.pret_original}
                    onChange={e => setNewTest({ ...newTest, pret_original: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preț Test (RON)</label>
                  <input
                    type="number"
                    value={newTest.pret_test}
                    onChange={e => setNewTest({ ...newTest, pret_test: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durată (zile)</label>
                  <input
                    type="number"
                    value={newTest.durata_zile}
                    onChange={e => setNewTest({ ...newTest, durata_zile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="1"
                    max="30"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateTest}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  ✅ Salvează Test
                </button>
                <button
                  onClick={() => setShowNewTestForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Anulează
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {abTests.map(test => (
              <div key={test.id} className={`bg-white rounded-xl shadow-md border-2 p-5 ${
                test.status === 'activ' ? 'border-blue-300' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900">{test.produs}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    test.status === 'activ' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {test.status === 'activ' ? '🔵 Activ' : '✅ Finalizat'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Preț A (original)</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(test.pret_original)}</div>
                    <div className="text-xs text-gray-500 mt-1">{test.vanzari_original} vânz.</div>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${test.castigator === 'test' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <div className="text-xs text-gray-500 mb-1">Preț B (test)</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(test.pret_test)}</div>
                    <div className="text-xs text-gray-500 mt-1">{test.vanzari_test} vânz.</div>
                  </div>
                </div>

                {test.status === 'activ' ? (
                  <div className="text-sm text-blue-600 font-medium">⏳ {test.zile_ramase} zile rămase</div>
                ) : (
                  <div className={`text-sm font-bold ${test.castigator === 'test' ? 'text-green-600' : 'text-gray-600'}`}>
                    {test.castigator === 'test'
                      ? `🏆 Câștigător: Preț B (${formatCurrency(test.pret_test)})`
                      : `📊 Câștigător: Preț A (${formatCurrency(test.pret_original)})`}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">Creat: {test.creat_la}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== OPORTUNITĂȚI VENITURI ===== */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">💡 Oportunități de Creștere a Veniturilor</h2>
          {opportunities.map(op => (
            <div key={op.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-5 flex items-start gap-4">
              <div className="text-3xl">
                {op.tip === 'upsell' ? '🛒' : op.tip === 'timing' ? '⏰' : '💰'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-gray-900 font-medium">{op.mesaj}</p>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold ${getPriorityBadge(op.prioritate)}`}>
                    {op.prioritate === 'inalta' ? '🔴 Prioritate înaltă' : '🟡 Prioritate medie'}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-green-600">
                  📈 Potențial: {op.potential_roi}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RevenueSciencePage;
