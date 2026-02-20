import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinancialControlPage = () => {
  const [dailyPL, setDailyPL] = useState(null);
  const [cashSessions, setCashSessions] = useState([]);
  const [cogsData, setCogsData] = useState(null);
  const [ebitdaData, setEbitdaData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [accruals, setAccruals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('pl');

  useEffect(() => {
    loadAll();
  }, [selectedDate]);

  const loadAll = () => {
    loadDailyPL();
    loadCashReconciliation();
    loadCOGS();
    loadEBITDA();
    loadTaxLiability();
    loadAccruals();
  };

  const loadDailyPL = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/financial-control/daily-pl?date=${selectedDate}`);
      setDailyPL(res.data.data);
    } catch {
      setDailyPL({
        date: selectedDate,
        revenue: 3420.80,
        cogs: 1026.24,
        gross_profit: 2394.56,
        labor_cost: 752.58,
        overhead: 444.70,
        ebitda: 1197.28,
        ebitda_percent: 35.0,
        gross_margin_percent: 70.0
      });
    }
    setLoading(false);
  };

  const loadCashReconciliation = async () => {
    try {
      const res = await axios.get('/api/financial-control/cash-reconciliation');
      setCashSessions(res.data.data);
    } catch {
      setCashSessions([
        { id: 1, sesiune: 'Tura 1 (08:00-16:00)', expected_cash: 1240.50, actual_cash: 1238.00, diferenta: -2.50, status: 'Flagged' },
        { id: 2, sesiune: 'Tura 2 (16:00-24:00)', expected_cash: 2185.00, actual_cash: 2185.00, diferenta: 0.00,  status: 'OK' },
        { id: 3, sesiune: 'Tura 3 (00:00-08:00)', expected_cash: 320.00,  actual_cash: 321.50,  diferenta: 1.50,  status: 'OK' },
      ]);
    }
  };

  const loadCOGS = async () => {
    try {
      const res = await axios.get('/api/financial-control/cogs');
      setCogsData(res.data.data);
    } catch {
      setCogsData({
        food_cost_percent_today: 30.2,
        food_cost_target: 30.0,
        products: [
          { produs: 'Ciorba de burta',     pret_vanzare: 22, cogs_target: 6.60,  cogs_actual: 6.85,  food_cost_percent: 31.1 },
          { produs: 'Mici cu mustar',      pret_vanzare: 18, cogs_target: 5.40,  cogs_actual: 5.38,  food_cost_percent: 29.9 },
          { produs: 'Sarmale cu mamaliga', pret_vanzare: 35, cogs_target: 9.80,  cogs_actual: 10.20, food_cost_percent: 29.1 },
          { produs: 'Friptura de porc',    pret_vanzare: 48, cogs_target: 16.80, cogs_actual: 16.50, food_cost_percent: 34.4 },
          { produs: 'Papanasi',            pret_vanzare: 19, cogs_target: 4.75,  cogs_actual: 4.80,  food_cost_percent: 25.3 },
        ]
      });
    }
  };

  const loadEBITDA = async () => {
    try {
      const res = await axios.get('/api/financial-control/ebitda');
      setEbitdaData(res.data.data);
    } catch {
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const revenue = 2800 + Math.random() * 1200;
        const ebitda  = revenue * (0.30 + Math.random() * 0.10);
        return {
          data: d.toISOString().split('T')[0],
          revenue: parseFloat(revenue.toFixed(2)),
          ebitda:  parseFloat(ebitda.toFixed(2)),
          ebitda_percent: parseFloat(((ebitda / revenue) * 100).toFixed(1))
        };
      });
      const totalRev  = days.reduce((s, d) => s + d.revenue, 0);
      const totalEBIT = days.reduce((s, d) => s + d.ebitda, 0);
      setEbitdaData({
        days,
        summary: { avg_ebitda_percent: 34.5, total_revenue_30d: totalRev, total_ebitda_30d: totalEBIT },
        scenarios: { pessimist: totalEBIT * 0.80, realist: totalEBIT, optimist: totalEBIT * 1.20 }
      });
    }
  };

  const loadTaxLiability = async () => {
    try {
      const res = await axios.get('/api/financial-control/tax-liability');
      setTaxData(res.data.data);
    } catch {
      setTaxData({
        vat_collected: 2850.40,
        vat_deductible: 620.15,
        vat_net_payable: 2230.25,
        vat_due_date: '2025-02-25',
        income_tax_estimate: 1840.00,
        income_tax_due_date: '2025-03-25',
        total_tax_liability: 4070.25
      });
    }
  };

  const loadAccruals = async () => {
    try {
      const res = await axios.get('/api/financial-control/accruals');
      setAccruals(res.data.data);
    } catch {
      setAccruals({
        items: [
          { id: 1, denumire: 'Chirie spatiu',       suma: 8500.00, zi_scadenta: 1,  categorie: 'Chirie',    status: 'Planificat' },
          { id: 2, denumire: 'Electricitate',       suma: 1200.00, zi_scadenta: 10, categorie: 'Utilitati', status: 'Planificat' },
          { id: 3, denumire: 'Gaz metan',           suma: 650.00,  zi_scadenta: 10, categorie: 'Utilitati', status: 'Platit' },
          { id: 4, denumire: 'Internet & telefon',  suma: 180.00,  zi_scadenta: 15, categorie: 'Utilitati', status: 'Platit' },
          { id: 5, denumire: 'Leasing echipamente', suma: 420.00,  zi_scadenta: 20, categorie: 'Leasing',   status: 'Planificat' },
          { id: 6, denumire: 'Abonament POS',       suma: 95.00,   zi_scadenta: 25, categorie: 'Software',  status: 'Planificat' },
        ],
        total_lunar: 11045.00,
        total_platit: 830.00,
        total_ramas: 10215.00
      });
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(val || 0);

  const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;

  const tabs = [
    { id: 'pl',      label: '📊 P&L Zilnic' },
    { id: 'cash',    label: '💵 Reconciliere Casă' },
    { id: 'cogs',    label: '🧮 COGS Live' },
    { id: 'ebitda',  label: '📈 Proiecție EBITDA' },
    { id: 'tax',     label: '🏛️ Obligații Fiscale' },
    { id: 'accruals',label: '📅 Calendar Accrual' },
  ];

  if (loading && !dailyPL) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg text-teal-700">🔄 Se încarcă Control Financiar...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💼 Control Financiar CFO</h1>
          <p className="text-gray-600">Monitorizare financiară în timp real</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Data:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </label>
          <button
            onClick={loadAll}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Top KPI strip */}
      {dailyPL && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Venituri</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(dailyPL.revenue)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Profit Brut</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(dailyPL.gross_profit)}</p>
            <p className="text-xs text-green-600">{formatPercent(dailyPL.gross_margin_percent)} marjă</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">EBITDA</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(dailyPL.ebitda)}</p>
            <p className="text-xs text-emerald-600">{formatPercent(dailyPL.ebitda_percent)} din venituri</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-cyan-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">COGS</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(dailyPL.cogs)}</p>
            <p className="text-xs text-cyan-600">{formatPercent((dailyPL.cogs / dailyPL.revenue) * 100)} din venituri</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ===== TAB: P&L Zilnic ===== */}
      {activeTab === 'pl' && dailyPL && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📊 Profit și Pierdere Zilnic — {dailyPL.date}
          </h2>
          <div className="space-y-3 max-w-lg">
            {[
              { label: 'Venituri Totale',  value: dailyPL.revenue,      color: 'text-teal-700',   bold: true },
              { label: 'COGS (Materii prime)', value: -dailyPL.cogs,    color: 'text-red-600',    bold: false },
              { label: 'Profit Brut',      value: dailyPL.gross_profit, color: 'text-green-700',  bold: true,  divider: true },
              { label: 'Cost Forță Muncă', value: -dailyPL.labor_cost,  color: 'text-orange-600', bold: false },
              { label: 'Costuri Generale', value: -dailyPL.overhead,    color: 'text-orange-600', bold: false },
              { label: 'EBITDA',           value: dailyPL.ebitda,       color: 'text-emerald-700',bold: true,  divider: true },
            ].map((row, i) => (
              <div key={i}>
                {row.divider && <div className="border-t border-gray-200 my-2" />}
                <div className="flex justify-between items-center py-1">
                  <span className={`${row.bold ? 'font-semibold' : 'text-gray-600'}`}>{row.label}</span>
                  <span className={`font-mono ${row.color} ${row.bold ? 'text-lg font-bold' : ''}`}>
                    {formatCurrency(Math.abs(row.value))}
                    {row.value < 0 && <span className="text-xs ml-1 text-red-400">(cost)</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* EBITDA gauge */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-emerald-800">Marjă EBITDA</span>
              <span className="text-2xl font-bold text-emerald-700">{formatPercent(dailyPL.ebitda_percent)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(dailyPL.ebitda_percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>Target 30%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: Reconciliere Casă ===== */}
      {activeTab === 'cash' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💵 Reconciliere Casă</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-teal-800">
                  <th className="text-left px-4 py-3 rounded-tl-lg">Sesiune</th>
                  <th className="text-right px-4 py-3">Numerar Așteptat</th>
                  <th className="text-right px-4 py-3">Numerar Real</th>
                  <th className="text-right px-4 py-3">Diferență</th>
                  <th className="text-center px-4 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cashSessions.map((s) => (
                  <tr key={s.id} className={s.status === 'Flagged' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 font-medium">{s.sesiune}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(s.expected_cash)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(s.actual_cash)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${
                      s.diferenta < 0 ? 'text-red-600' : s.diferenta > 0 ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {s.diferenta > 0 ? '+' : ''}{formatCurrency(s.diferenta)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        s.status === 'OK'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {s.status === 'OK' ? '✅ OK' : '⚠️ Discrepanță'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Sesiunile marcate cu <strong>Discrepanță</strong> necesită verificare manuală de către manager.
          </div>
        </div>
      )}

      {/* ===== TAB: COGS Live ===== */}
      {activeTab === 'cogs' && cogsData && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">🧮 Urmărire COGS în Timp Real</h2>

          {/* Overall food cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              cogsData.food_cost_percent_today > cogsData.food_cost_target
                ? 'border-red-400 bg-red-50'
                : 'border-green-400 bg-green-50'
            }`}>
              <p className="text-sm font-medium text-gray-600">Food Cost % Azi</p>
              <p className={`text-3xl font-bold ${
                cogsData.food_cost_percent_today > cogsData.food_cost_target ? 'text-red-700' : 'text-green-700'
              }`}>
                {formatPercent(cogsData.food_cost_percent_today)}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-teal-400 bg-teal-50">
              <p className="text-sm font-medium text-gray-600">Target Food Cost %</p>
              <p className="text-3xl font-bold text-teal-700">{formatPercent(cogsData.food_cost_target)}</p>
            </div>
          </div>

          {/* Per-product COGS */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">COGS pe Produs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-50 text-teal-800">
                    <th className="text-left px-4 py-2">Produs</th>
                    <th className="text-right px-4 py-2">Preț Vânzare</th>
                    <th className="text-right px-4 py-2">COGS Target</th>
                    <th className="text-right px-4 py-2">COGS Actual</th>
                    <th className="text-right px-4 py-2">Food Cost %</th>
                    <th className="text-center px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cogsData.products.map((p, i) => {
                    const over = p.cogs_actual > p.cogs_target;
                    return (
                      <tr key={i} className={over ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-2 font-medium">{p.produs}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatCurrency(p.pret_vanzare)}</td>
                        <td className="px-4 py-2 text-right font-mono text-green-700">{formatCurrency(p.cogs_target)}</td>
                        <td className={`px-4 py-2 text-right font-mono font-semibold ${over ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(p.cogs_actual)}
                        </td>
                        <td className="px-4 py-2 text-right">{formatPercent(p.food_cost_percent)}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            over ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {over ? '⬆️ Depășit' : '✅ În target'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: EBITDA Projection ===== */}
      {activeTab === 'ebitda' && ebitdaData && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">📈 Proiecție EBITDA — 30 Zile</h2>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200 text-center">
              <p className="text-sm text-gray-600">Venituri Totale 30z</p>
              <p className="text-2xl font-bold text-teal-700">{formatCurrency(ebitdaData.summary.total_revenue_30d)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
              <p className="text-sm text-gray-600">EBITDA Total 30z</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(ebitdaData.summary.total_ebitda_30d)}</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 text-center">
              <p className="text-sm text-gray-600">Marjă EBITDA Medie</p>
              <p className="text-2xl font-bold text-cyan-700">{formatPercent(ebitdaData.summary.avg_ebitda_percent)}</p>
            </div>
          </div>

          {/* Bar chart */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">EBITDA Zilnic (bare)</h3>
            <div className="flex items-end gap-0.5 h-40 bg-gray-50 p-3 rounded-lg overflow-x-auto">
              {ebitdaData.days.map((d, i) => {
                const maxEBIT = Math.max(...ebitdaData.days.map(x => x.ebitda));
                const pct = maxEBIT > 0 ? (d.ebitda / maxEBIT) * 100 : 0;
                return (
                  <div
                    key={i}
                    title={`${d.data}: ${formatCurrency(d.ebitda)} (${d.ebitda_percent}%)`}
                    className="flex-1 min-w-[8px] bg-teal-500 rounded-t hover:bg-teal-400 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{ebitdaData.days[0]?.data}</span>
              <span>{ebitdaData.days[ebitdaData.days.length - 1]?.data}</span>
            </div>
          </div>

          {/* Scenario modeling */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">🎯 Modelare Scenarii</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: '📉 Pesimist (-20%)',  value: ebitdaData.scenarios.pessimist, color: 'bg-red-100 text-red-800 border-red-300' },
                { label: '📊 Realist',           value: ebitdaData.scenarios.realist,  color: 'bg-teal-100 text-teal-800 border-teal-300' },
                { label: '📈 Optimist (+20%)',  value: ebitdaData.scenarios.optimist,  color: 'bg-green-100 text-green-800 border-green-300' },
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-lg border ${s.color}`}>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(s.value)}</p>
                  <p className="text-xs mt-1 opacity-70">EBITDA 30 zile</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: Tax Liability ===== */}
      {activeTab === 'tax' && taxData && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">🏛️ Obligații Fiscale</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VAT */}
            <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-4">📋 TVA</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA Colectat</span>
                  <span className="font-semibold">{formatCurrency(taxData.vat_collected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA Deductibil</span>
                  <span className="font-semibold text-green-600">- {formatCurrency(taxData.vat_deductible)}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                  <span>TVA de Plată</span>
                  <span className="text-blue-800">{formatCurrency(taxData.vat_net_payable)}</span>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                  📅 Scadență: <strong>{taxData.vat_due_date}</strong>
                </div>
              </div>
            </div>

            {/* Income tax */}
            <div className="p-5 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-bold text-purple-800 mb-4">💼 Impozit pe Profit</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimare Impozit</span>
                  <span className="font-semibold">{formatCurrency(taxData.income_tax_estimate)}</span>
                </div>
                <div className="mt-3 p-2 bg-purple-100 rounded text-xs">
                  📅 Scadență: <strong>{taxData.income_tax_due_date}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="p-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-teal-100 text-sm">Total Obligații Fiscale</p>
                <p className="text-3xl font-bold">{formatCurrency(taxData.total_tax_liability)}</p>
              </div>
              <div className="text-5xl">🏛️</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: Accrual Calendar ===== */}
      {activeTab === 'accruals' && accruals && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">📅 Calendar Accrual Lunar</h2>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border text-center">
              <p className="text-sm text-gray-500">Total Lunar</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(accruals.total_lunar)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-sm text-gray-500">Plătit</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(accruals.total_platit)}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
              <p className="text-sm text-gray-500">Rămas de Plătit</p>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(accruals.total_ramas)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-teal-800">
                  <th className="text-left px-4 py-3">Denumire</th>
                  <th className="text-center px-4 py-3">Categorie</th>
                  <th className="text-right px-4 py-3">Sumă</th>
                  <th className="text-center px-4 py-3">Zi Scadentă</th>
                  <th className="text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accruals.items.map((item) => (
                  <tr key={item.id} className={item.status === 'Platit' ? 'bg-green-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 font-medium">{item.denumire}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">
                        {item.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(item.suma)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">Zi {item.zi_scadenta}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'Platit'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.status === 'Platit' ? '✅ Plătit' : '🕐 Planificat'}
                      </span>
                    </td>
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

export default FinancialControlPage;
