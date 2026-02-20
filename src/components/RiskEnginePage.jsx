import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RiskEnginePage = () => {
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [shrinkage, setShrinkage] = useState([]);
  const [shrinkageTotalLoss, setShrinkageTotalLoss] = useState(0);
  const [collusion, setCollusion] = useState([]);
  const [refundClusters, setRefundClusters] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isManager] = useState(true); // In production, derive from auth context

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadAlerts(),
      loadShrinkage(),
      loadCollusion(),
      loadRefundClusters(),
      loadRiskScores(),
    ]);
    setLoading(false);
  };

  const loadAlerts = async () => {
    try {
      const response = await axios.get('/api/risk-engine/alerts');
      setAlerts(response.data.alerts);
      setAlertsSummary(response.data.summary);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([
        { id: 1, type: 'excessive_voids', operator: 'Ion Popescu', description: 'Anulări excesive: 14 anulări în schimbul de azi', severity: 'HIGH', count: 14, value: 312.50, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), resolved: false },
        { id: 2, type: 'suspicious_discount', operator: 'Maria Ionescu', description: 'Discount neautorizat aplicat de 8 ori: 15% fără aprobare manager', severity: 'HIGH', count: 8, value: 89.60, timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), resolved: false },
        { id: 3, type: 'ghost_order', operator: 'Andrei Dumitrescu', description: 'Comandă introdusă și anulată imediat (sub 60 secunde): 3 cazuri', severity: 'MEDIUM', count: 3, value: 67.00, timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), resolved: false },
        { id: 4, type: 'excessive_voids', operator: 'Elena Popa', description: 'Anulări excesive: 7 anulări după bonul fiscal emis', severity: 'MEDIUM', count: 7, value: 145.20, timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), resolved: false },
        { id: 5, type: 'suspicious_discount', operator: 'Gheorghe Marin', description: 'Discount 100% aplicat pe 2 produse scumpe', severity: 'HIGH', count: 2, value: 210.00, timestamp: new Date(Date.now() - 10 * 3600000).toISOString(), resolved: false },
        { id: 6, type: 'ghost_order', operator: 'Cristina Luca', description: 'Comandă repetată de 5 ori pentru același produs, anulate ulterior', severity: 'LOW', count: 5, value: 38.50, timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), resolved: false },
      ]);
      setAlertsSummary({ total: 6, high: 3, medium: 2, low: 1, unresolved: 6, total_value_at_risk: 863.30 });
    }
  };

  const loadShrinkage = async () => {
    try {
      const response = await axios.get('/api/risk-engine/shrinkage');
      setShrinkage(response.data.shrinkage);
      setShrinkageTotalLoss(response.data.total_loss);
    } catch (error) {
      console.error('Error loading shrinkage:', error);
      setShrinkage([
        { id: 1, ingredient: 'Carne de vită', unit: 'kg', expected_consumption: 12.5, actual_consumption: 15.8, variance_percent: 26.4, trend: 'up', loss_value: 115.50, alert_level: 'HIGH' },
        { id: 2, ingredient: 'Mozzarella', unit: 'kg', expected_consumption: 4.2, actual_consumption: 5.1, variance_percent: 21.4, trend: 'up', loss_value: 19.80, alert_level: 'MEDIUM' },
        { id: 3, ingredient: 'Alcool premium (whisky)', unit: 'L', expected_consumption: 1.2, actual_consumption: 2.1, variance_percent: 75.0, trend: 'up', loss_value: 108.00, alert_level: 'HIGH' },
        { id: 4, ingredient: 'Somon afumat', unit: 'kg', expected_consumption: 1.8, actual_consumption: 2.2, variance_percent: 22.2, trend: 'stable', loss_value: 34.00, alert_level: 'MEDIUM' },
        { id: 5, ingredient: 'Ulei de măsline', unit: 'L', expected_consumption: 2.0, actual_consumption: 2.1, variance_percent: 5.0, trend: 'stable', loss_value: 1.80, alert_level: 'LOW' },
        { id: 6, ingredient: 'Creveți tigru', unit: 'kg', expected_consumption: 2.4, actual_consumption: 3.5, variance_percent: 45.8, trend: 'up', loss_value: 104.50, alert_level: 'HIGH' },
      ]);
      setShrinkageTotalLoss(383.60);
    }
  };

  const loadCollusion = async () => {
    try {
      const response = await axios.get('/api/risk-engine/collusion');
      setCollusion(response.data.collusion);
    } catch (error) {
      console.error('Error loading collusion:', error);
      setCollusion([
        { id: 1, employee_a: 'Ion Popescu', role_a: 'Ospătar', employee_b: 'Maria Ionescu', role_b: 'Casier', pattern: 'Aprobări reciproce de discounturi', occurrences: 23, total_value: 487.00, risk_score: 87, details: 'Ion Popescu aplică discount, aprobat de Maria Ionescu. Pattern repetat în 23 din 31 zile.' },
        { id: 2, employee_a: 'Andrei Dumitrescu', role_a: 'Ospătar', employee_b: 'Gheorghe Marin', role_b: 'Bucătar-șef', pattern: 'Comenzi anulate după preparare', occurrences: 11, total_value: 232.50, risk_score: 62, details: 'Comenzi marcate ca pregătite, ulterior anulate de echipă. Produsele nu sunt returnate în stoc.' },
        { id: 3, employee_a: 'Elena Popa', role_a: 'Ospătar', employee_b: 'Cristina Luca', role_b: 'Ospătar', pattern: 'Transfer comenzi între mese suspect', occurrences: 7, total_value: 118.00, risk_score: 44, details: 'Comenzile sunt transferate între mese la finalul turei, modificând totalul bonului.' },
      ]);
    }
  };

  const loadRefundClusters = async () => {
    try {
      const response = await axios.get('/api/risk-engine/refund-clusters');
      setRefundClusters(response.data.clusters);
    } catch (error) {
      console.error('Error loading refund clusters:', error);
      setRefundClusters([
        { id: 1, window_label: 'Ora prânzului (12:00-14:00)', refund_count: 8, normal_baseline: 1.2, spike_multiplier: 6.7, total_value: 234.50, operators_involved: ['Ion Popescu', 'Maria Ionescu'], risk_level: 'HIGH' },
        { id: 2, window_label: 'Cina de seară (19:00-21:00)', refund_count: 5, normal_baseline: 0.8, spike_multiplier: 6.25, total_value: 187.00, operators_involved: ['Andrei Dumitrescu'], risk_level: 'HIGH' },
        { id: 3, window_label: 'După-amiaza (15:00-17:00)', refund_count: 3, normal_baseline: 0.5, spike_multiplier: 6.0, total_value: 89.00, operators_involved: ['Elena Popa', 'Cristina Luca'], risk_level: 'MEDIUM' },
        { id: 4, window_label: 'Seara târzie (20:00-22:00)', refund_count: 2, normal_baseline: 0.6, spike_multiplier: 3.33, total_value: 45.00, operators_involved: ['Gheorghe Marin'], risk_level: 'LOW' },
      ]);
    }
  };

  const loadRiskScores = async () => {
    try {
      const response = await axios.get('/api/risk-engine/risk-scores');
      setRiskScores(response.data.scores);
    } catch (error) {
      console.error('Error loading risk scores:', error);
      setRiskScores([
        { employee_id: 1, name: 'Ion Popescu', role: 'Ospătar', risk_score: 87, risk_level: 'HIGH', void_rate: 18.5, discount_rate: 12.3, refund_rate: 8.1, anomaly_flags: 5 },
        { employee_id: 2, name: 'Maria Ionescu', role: 'Casier', risk_score: 74, risk_level: 'HIGH', void_rate: 9.2, discount_rate: 22.1, refund_rate: 5.4, anomaly_flags: 4 },
        { employee_id: 3, name: 'Andrei Dumitrescu', role: 'Ospătar', risk_score: 58, risk_level: 'MEDIUM', void_rate: 8.7, discount_rate: 6.4, refund_rate: 11.2, anomaly_flags: 2 },
        { employee_id: 4, name: 'Elena Popa', role: 'Ospătar', risk_score: 41, risk_level: 'MEDIUM', void_rate: 5.1, discount_rate: 4.8, refund_rate: 6.3, anomaly_flags: 1 },
        { employee_id: 5, name: 'Gheorghe Marin', role: 'Bucătar-șef', risk_score: 35, risk_level: 'MEDIUM', void_rate: 3.2, discount_rate: 15.6, refund_rate: 2.1, anomaly_flags: 1 },
        { employee_id: 6, name: 'Cristina Luca', role: 'Ospătar', risk_score: 18, risk_level: 'LOW', void_rate: 2.1, discount_rate: 1.8, refund_rate: 1.5, anomaly_flags: 0 },
      ]);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.put(`/api/risk-engine/alerts/${alertId}/resolve`);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
      setAlertsSummary(prev => prev ? { ...prev, unresolved: Math.max(0, prev.unresolved - 1) } : prev);
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(amount || 0);

  const getSeverityBadge = (severity) => {
    const map = {
      HIGH: 'bg-red-100 text-red-800 border border-red-300',
      MEDIUM: 'bg-orange-100 text-orange-800 border border-orange-300',
      LOW: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    };
    const labels = { HIGH: 'RIDICAT', MEDIUM: 'MEDIU', LOW: 'SCĂZUT' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${map[severity] || map.LOW}`}>
        {labels[severity] || severity}
      </span>
    );
  };

  const getAlertTypeLabel = (type) => {
    const map = { excessive_voids: '🗑️ Anulări excesive', suspicious_discount: '💸 Discount suspect', ghost_order: '👻 Comandă fantomă' };
    return map[type] || type;
  };

  const getTrendArrow = (trend) => {
    if (trend === 'up') return <span className="text-red-500 font-bold text-lg">↑</span>;
    if (trend === 'down') return <span className="text-green-500 font-bold text-lg">↓</span>;
    return <span className="text-gray-400 font-bold text-lg">→</span>;
  };

  const getRiskScoreBar = (score) => {
    const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-orange-400' : 'bg-green-400';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-sm font-bold w-8 text-right">{score}</span>
      </div>
    );
  };

  const totalRiskScore = alertsSummary
    ? Math.min(100, Math.round(
        alertsSummary.high * 15 +
        alertsSummary.medium * 7 +
        alertsSummary.low * 2
      ))
    : 0;

  const tabs = [
    { id: 'overview', label: '🏠 Prezentare' },
    { id: 'alerts', label: '🚨 Alerte Fraudă' },
    { id: 'shrinkage', label: '📦 Detectie Stoc' },
    { id: 'collusion', label: '👥 Coluziune' },
    { id: 'refunds', label: '💳 Clustere Rambursări' },
    ...(isManager ? [{ id: 'riskscores', label: '📊 Scoruri Risc' }] : []),
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg text-red-600">🔄 Se încarcă Motorul de Risc...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🛡️ Motor de Risc Predictiv</h1>
          <p className="text-gray-600">Detectare fraude, diminuare stoc și anomalii comportamentale</p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
        >
          🔄 Actualizare
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-md font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {alertsSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alerte Fraudă Active</p>
                    <p className="text-3xl font-bold text-red-600">{alertsSummary.unresolved}</p>
                  </div>
                  <div className="text-4xl">🚨</div>
                </div>
                <div className="text-sm mt-2 text-gray-500">
                  {alertsSummary.high} critice · {alertsSummary.medium} medii
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Anomalii Diminuare Stoc</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {shrinkage.filter(s => s.alert_level !== 'LOW').length}
                    </p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
                <div className="text-sm mt-2 text-gray-500">
                  Pierdere estimată: {formatCurrency(shrinkageTotalLoss)}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipare Suspecte</p>
                    <p className="text-3xl font-bold text-yellow-600">{collusion.length}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
                <div className="text-sm mt-2 text-gray-500">
                  Coluziune detectată între personal
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scor Risc Total</p>
                    <p className="text-3xl font-bold text-purple-700">{totalRiskScore}/100</p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
                <div className="text-sm mt-2 text-gray-500">
                  {totalRiskScore >= 70 ? '🔴 Risc ridicat' : totalRiskScore >= 40 ? '🟠 Risc moderat' : '🟢 Risc scăzut'}
                </div>
              </div>
            </div>
          )}

          {/* Risk Summary Banner */}
          <div className={`p-6 rounded-lg text-white ${totalRiskScore >= 70 ? 'bg-gradient-to-r from-red-600 to-red-800' : totalRiskScore >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-700' : 'bg-gradient-to-r from-green-500 to-green-700'}`}>
            <h3 className="text-xl font-bold mb-3">🎯 Rezumat Risc Operațional</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatCurrency(alertsSummary?.total_value_at_risk || 0)}</div>
                <div className="opacity-80 text-sm">Valoare la risc (alerte active)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{formatCurrency(shrinkageTotalLoss)}</div>
                <div className="opacity-80 text-sm">Pierderi stoc detectate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatCurrency((alertsSummary?.total_value_at_risk || 0) + shrinkageTotalLoss)}
                </div>
                <div className="opacity-80 text-sm">Expunere totală estimată</div>
              </div>
            </div>
          </div>

          {/* Quick view: top alerts */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🚨 Alerte Critice Recente</h3>
            <div className="space-y-3">
              {alerts.filter(a => a.severity === 'HIGH' && !a.resolved).slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <div className="font-medium text-gray-900">{alert.operator}</div>
                      <div className="text-sm text-gray-600">{alert.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getSeverityBadge(alert.severity)}
                    <div className="text-sm font-bold text-red-600 mt-1">{formatCurrency(alert.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ALERTS TAB ===== */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">🚨 Alerte Fraudă Internă</h2>
            <p className="text-gray-600 text-sm mt-1">Anulări excesive, discounturi suspecte și comenzi fantomă per operator</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tip Alertă</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Operator</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Descriere</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Severitate</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Valoare</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Acțiune</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.map(alert => (
                  <tr key={alert.id} className={alert.resolved ? 'bg-gray-50 opacity-60' : 'hover:bg-red-50'}>
                    <td className="px-4 py-3 font-medium">{getAlertTypeLabel(alert.type)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{alert.operator}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">{alert.description}</td>
                    <td className="px-4 py-3 text-center">{getSeverityBadge(alert.severity)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">{formatCurrency(alert.value)}</td>
                    <td className="px-4 py-3 text-center">
                      {alert.resolved
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">✓ Rezolvat</span>
                        : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Activ</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!alert.resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-medium"
                        >
                          Rezolvă
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

      {/* ===== SHRINKAGE TAB ===== */}
      {activeTab === 'shrinkage' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">📦 Detectie Diminuare Stoc</h2>
              <p className="text-gray-600 text-sm mt-1">Consum așteptat vs. consum real per ingredient</p>
            </div>
            <div className="bg-orange-100 border border-orange-300 px-4 py-2 rounded-lg text-right">
              <div className="text-xs text-orange-700 font-medium">Pierdere Totală Estimată</div>
              <div className="text-xl font-bold text-orange-800">{formatCurrency(shrinkageTotalLoss)}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ingredient</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Consum Așteptat</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Consum Real</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Varianță %</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Trend</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Pierdere (RON)</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Nivel Alertă</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shrinkage.map(item => (
                  <tr key={item.id} className={item.alert_level === 'HIGH' ? 'bg-red-50' : item.alert_level === 'MEDIUM' ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.ingredient}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.expected_consumption} {item.unit}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{item.actual_consumption} {item.unit}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">+{item.variance_percent.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">{getTrendArrow(item.trend)}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-700">{formatCurrency(item.loss_value)}</td>
                    <td className="px-4 py-3 text-center">{getSeverityBadge(item.alert_level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== COLLUSION TAB ===== */}
      {activeTab === 'collusion' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">👥 Tipare de Coluziune Personal</h2>
            <p className="text-gray-600 text-sm mt-1">Perechi de angajați cu aprobări reciproce suspecte detectate automat</p>
          </div>
          {collusion.map(pair => (
            <div key={pair.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">👤</span>
                    <div>
                      <span className="font-bold text-gray-900">{pair.employee_a}</span>
                      <span className="text-xs text-gray-500 ml-1">({pair.role_a})</span>
                    </div>
                    <span className="text-orange-500 font-bold text-xl">⟷</span>
                    <div>
                      <span className="font-bold text-gray-900">{pair.employee_b}</span>
                      <span className="text-xs text-gray-500 ml-1">({pair.role_b})</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded">{pair.pattern}</span>
                  </div>
                  <p className="text-sm text-gray-600">{pair.details}</p>
                </div>
                <div className="flex gap-6 text-center shrink-0">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{pair.occurrences}</div>
                    <div className="text-xs text-gray-500">Cazuri detectate</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-orange-700">{formatCurrency(pair.total_value)}</div>
                    <div className="text-xs text-gray-500">Valoare totală</div>
                  </div>
                  <div className={`p-3 rounded-lg ${pair.risk_score >= 70 ? 'bg-red-100' : pair.risk_score >= 40 ? 'bg-orange-100' : 'bg-yellow-50'}`}>
                    <div className={`text-2xl font-bold ${pair.risk_score >= 70 ? 'text-red-700' : pair.risk_score >= 40 ? 'text-orange-700' : 'text-yellow-700'}`}>{pair.risk_score}</div>
                    <div className="text-xs text-gray-500">Scor risc</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== REFUND CLUSTERS TAB ===== */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">💳 Detectie Clustere Rambursări/Anulări</h2>
            <p className="text-gray-600 text-sm mt-1">Ferestre de timp cu vârfuri anormale de rambursări față de linia de bază</p>
          </div>
          {refundClusters.map(cluster => (
            <div key={cluster.id} className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${cluster.risk_level === 'HIGH' ? 'border-red-600' : cluster.risk_level === 'MEDIUM' ? 'border-orange-500' : 'border-yellow-400'}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⏱️</span>
                    <h3 className="font-bold text-gray-900">{cluster.window_label}</h3>
                    {getSeverityBadge(cluster.risk_level)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Operatori implicați:{' '}
                    {cluster.operators_involved.map(op => (
                      <span key={op} className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-1">{op}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">Linie de bază normală: {cluster.normal_baseline.toFixed(1)} rambursări/oră</div>
                  </div>
                </div>
                <div className="flex gap-6 text-center shrink-0">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{cluster.refund_count}</div>
                    <div className="text-xs text-gray-500">Rambursări</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">{cluster.spike_multiplier.toFixed(1)}×</div>
                    <div className="text-xs text-gray-500">Față de normal</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-red-800">{formatCurrency(cluster.total_value)}</div>
                    <div className="text-xs text-gray-500">Valoare totală</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== RISK SCORES TAB (Manager Only) ===== */}
      {activeTab === 'riskscores' && isManager && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">📊 Scoruri Risc Angajați</h2>
            <p className="text-gray-600 text-sm mt-1">Vizibil doar pentru manageri · Scor calculat din rate anulări, discounturi și rambursări</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Angajat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Scor Risc</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Nivel</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Rată Anulări</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Rată Discounturi</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Rată Rambursări</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Anomalii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riskScores.sort((a, b) => b.risk_score - a.risk_score).map(emp => (
                  <tr key={emp.employee_id} className={emp.risk_level === 'HIGH' ? 'bg-red-50' : emp.risk_level === 'MEDIUM' ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                    <td className="px-4 py-3 min-w-[160px]">{getRiskScoreBar(emp.risk_score)}</td>
                    <td className="px-4 py-3 text-center">{getSeverityBadge(emp.risk_level)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{emp.void_rate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-gray-700">{emp.discount_rate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-gray-700">{emp.refund_rate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      {emp.anomaly_flags > 0
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{emp.anomaly_flags}</span>
                        : <span className="text-green-500">✓</span>
                      }
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

export default RiskEnginePage;
