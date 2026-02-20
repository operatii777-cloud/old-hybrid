import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LaborAIPage = () => {
  const [demandForecast, setDemandForecast] = useState([]);
  const [shiftSuggestions, setShiftSuggestions] = useState([]);
  const [laborCost, setLaborCost] = useState(null);
  const [overtimeRisk, setOvertimeRisk] = useState([]);
  const [burnoutSignals, setBurnoutSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forecastTab, setForecastTab] = useState('today');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadDemandForecast(),
      loadShiftSuggestions(),
      loadLaborCost(),
      loadOvertimeRisk(),
      loadBurnoutSignals(),
    ]);
    setLoading(false);
  };

  const loadDemandForecast = async () => {
    try {
      const res = await axios.get('/api/labor-ai/demand-forecast');
      setDemandForecast(res.data);
    } catch {
      setDemandForecast(demoDemandForecast());
    }
  };

  const loadShiftSuggestions = async () => {
    try {
      const res = await axios.get('/api/labor-ai/shift-suggestions');
      setShiftSuggestions(res.data);
    } catch {
      setShiftSuggestions(demoShiftSuggestions());
    }
  };

  const loadLaborCost = async () => {
    try {
      const res = await axios.get('/api/labor-ai/labor-cost');
      setLaborCost(res.data);
    } catch {
      setLaborCost(demoLaborCost());
    }
  };

  const loadOvertimeRisk = async () => {
    try {
      const res = await axios.get('/api/labor-ai/overtime-risk');
      setOvertimeRisk(res.data);
    } catch {
      setOvertimeRisk(demoOvertimeRisk());
    }
  };

  const loadBurnoutSignals = async () => {
    try {
      const res = await axios.get('/api/labor-ai/burnout-signals');
      setBurnoutSignals(res.data);
    } catch {
      setBurnoutSignals(demoBurnoutSignals());
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/api/labor-ai/shift-suggestions/${id}/approve`);
    } catch {
      console.log('Demo: approved', id);
    }
    setShiftSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`/api/labor-ai/shift-suggestions/${id}/reject`);
    } catch {
      console.log('Demo: rejected', id);
    }
    setShiftSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoDemandForecast = () => {
    const days = ['today', 'tomorrow', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day, di) => ({
      day,
      label: day === 'today' ? 'Azi' : day === 'tomorrow' ? 'Mâine' : day,
      slots: Array.from({ length: 32 }, (_, i) => {
        const hour = 8 + Math.floor(i * 0.5);
        const min = (i % 2) * 30;
        const isPeak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
        const base = isPeak ? 18 : 5;
        return {
          time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
          demand: Math.max(0, base + Math.floor(Math.random() * 8) - 3),
          isPeak,
        };
      }),
      peakHours: ['12:00-14:00', '19:00-21:00'],
      maxDemand: 26,
    }));
  };

  const demoShiftSuggestions = () => [
    { id: 1, role: 'Kitchen', date: 'Azi 18:00', headcount: 3, reason: 'Cerere ridicată estimată vineri seară', laborCostImpact: '+120 RON', status: 'pending' },
    { id: 2, role: 'Waiter', date: 'Mâine 12:00', headcount: 4, reason: 'Prânz weekend – istoric +40% comenzi', laborCostImpact: '+80 RON', status: 'pending' },
    { id: 3, role: 'Bar', date: 'Sâmbătă 20:00', headcount: 2, reason: 'Event rezervat – 60 persoane', laborCostImpact: '+60 RON', status: 'approved' },
    { id: 4, role: 'Courier', date: 'Azi 19:00', headcount: 2, reason: 'Spike de livrări estimat', laborCostImpact: '+50 RON', status: 'pending' },
    { id: 5, role: 'Cashier', date: 'Duminică 11:00', headcount: 1, reason: 'Reducere trafic – oră liniștită', laborCostImpact: '-30 RON', status: 'pending' },
  ];

  const demoLaborCost = () => ({
    currentHour: { percent: 34.2, target: 30, alert: true },
    dailyTrend: [
      { day: 'L', percent: 28.1 }, { day: 'M', percent: 29.5 }, { day: 'Mi', percent: 31.2 },
      { day: 'J', percent: 27.8 }, { day: 'V', percent: 33.4 }, { day: 'S', percent: 30.1 },
      { day: 'D', percent: 34.2 },
    ],
    target: 30,
  });

  const demoOvertimeRisk = () => [
    { id: 1, name: 'Andrei Popa', role: 'Bucătar', hours_this_week: 38, threshold: 40, risk_level: 'HIGH' },
    { id: 2, name: 'Maria Ionescu', role: 'Ospătar', hours_this_week: 36, threshold: 40, risk_level: 'MEDIUM' },
    { id: 3, name: 'Cosmin Radu', role: 'Barman', hours_this_week: 33, threshold: 40, risk_level: 'LOW' },
    { id: 4, name: 'Elena Dumitrescu', role: 'Casier', hours_this_week: 39, threshold: 40, risk_level: 'HIGH' },
    { id: 5, name: 'Florin Munteanu', role: 'Curier', hours_this_week: 35, threshold: 40, risk_level: 'MEDIUM' },
  ];

  const demoBurnoutSignals = () => [
    { id: 1, name: 'Andrei Popa', role: 'Bucătar', burnoutScore: 82, lateClockIns: 7, efficiencyDrop: -18, voids: 12, managerNote: 'A cerut 3 zile libere luna trecută. Sugerăm o discuție.' },
    { id: 2, name: 'Elena Dumitrescu', role: 'Casier', burnoutScore: 67, lateClockIns: 4, efficiencyDrop: -11, voids: 8, managerNote: 'Performanță în scădere constantă ultimele 2 săptămâni.' },
    { id: 3, name: 'Maria Ionescu', role: 'Ospătar', burnoutScore: 45, lateClockIns: 2, efficiencyDrop: -5, voids: 3, managerNote: null },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const riskColor = (level) => {
    if (level === 'HIGH') return 'bg-red-100 text-red-700 font-bold';
    if (level === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 font-bold';
    return 'bg-green-100 text-green-700';
  };

  const burnoutColor = (score) => {
    if (score >= 75) return 'text-red-600 font-bold';
    if (score >= 50) return 'text-yellow-600 font-bold';
    return 'text-green-600';
  };

  const statusBadge = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs';
    if (status === 'rejected') return 'bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs';
    return 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs';
  };

  const todayForecast = demandForecast.find(d => d.day === 'today') || demandForecast[0];
  const tomorrowForecast = demandForecast.find(d => d.day === 'tomorrow') || demandForecast[1];
  const weekForecast = demandForecast;

  const getTabData = () => {
    if (forecastTab === 'today') return todayForecast ? [todayForecast] : [];
    if (forecastTab === 'tomorrow') return tomorrowForecast ? [tomorrowForecast] : [];
    return weekForecast;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg text-indigo-600">🔄 Se încarcă Optimizare Personal AI...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🤖 Optimizare Personal AI</h1>
          <p className="text-gray-600">Prognoze și sugestii inteligente pentru managementul echipei</p>
        </div>
        <button
          onClick={loadAll}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Labor Cost Alert Banner */}
      {laborCost?.currentHour?.alert && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <span className="font-bold text-red-700">Alertă Cost Personal: </span>
            <span className="text-red-600">
              Cost ora curentă {laborCost.currentHour.percent}% depășește ținta de {laborCost.currentHour.target}%
            </span>
          </div>
        </div>
      )}

      {/* Section 1: Demand Forecast */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Prognoză Cerere (intervale 15 min)</h2>
        <div className="flex gap-2 mb-4">
          {['today', 'tomorrow', 'week'].map(tab => (
            <button
              key={tab}
              onClick={() => setForecastTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                forecastTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              {tab === 'today' ? 'Azi' : tab === 'tomorrow' ? 'Mâine' : 'Săptămâna'}
            </button>
          ))}
        </div>

        {getTabData().map((dayData, di) => (
          <div key={di} className="mb-6">
            {forecastTab === 'week' && (
              <div className="text-sm font-semibold text-indigo-700 mb-2">{dayData.label}</div>
            )}
            <div className="flex items-end gap-0.5 h-24 overflow-x-auto pb-1">
              {dayData.slots?.map((slot, si) => {
                const pct = dayData.maxDemand > 0 ? (slot.demand / dayData.maxDemand) * 100 : 0;
                return (
                  <div key={si} className="flex flex-col items-center flex-shrink-0" style={{ width: 14 }}>
                    <div
                      title={`${slot.time}: ${slot.demand} comenzi`}
                      className={`w-full rounded-t transition-all ${slot.isPeak ? 'bg-indigo-500' : 'bg-indigo-200'}`}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                    {si % 8 === 0 && (
                      <span className="text-xs text-gray-400 mt-1" style={{ fontSize: 9 }}>{slot.time}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Ore de vârf</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-200 inline-block" /> Normal</span>
              <span className="text-indigo-600 font-medium">Vârfuri: {dayData.peakHours?.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Shift Suggestions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🗓️ Sugestii Ture</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-50 text-left">
                <th className="px-4 py-2 font-semibold text-gray-700">Rol</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Dată / Oră</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Personal Sugerat</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Motiv AI</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Impact Cost</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {shiftSuggestions.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-indigo-700">{s.role}</td>
                  <td className="px-4 py-3">{s.date}</td>
                  <td className="px-4 py-3 text-center font-bold">{s.headcount}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{s.reason}</td>
                  <td className={`px-4 py-3 font-semibold ${s.laborCostImpact?.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                    {s.laborCostImpact}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(s.status)}>
                      {s.status === 'approved' ? 'Aprobat' : s.status === 'rejected' ? 'Respins' : 'În așteptare'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(s.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >✓ Aprobă</button>
                        <button
                          onClick={() => handleReject(s.id)}
                          className="px-3 py-1 bg-red-400 text-white rounded text-xs hover:bg-red-500"
                        >✗ Respinge</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Labor Cost % Tracking */}
      {laborCost && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💼 Cost Personal %</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-lg p-5 ${laborCost.currentHour.alert ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="text-sm text-gray-600 mb-1">Cost personal ora curentă</div>
              <div className={`text-4xl font-bold ${laborCost.currentHour.alert ? 'text-red-600' : 'text-green-600'}`}>
                {laborCost.currentHour.percent}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Țintă: {laborCost.currentHour.target}%</div>
              <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${laborCost.currentHour.alert ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (laborCost.currentHour.percent / 50) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">Trend zilnic (% Cost Personal)</div>
              <div className="flex items-end gap-2 h-24">
                {laborCost.dailyTrend.map((d, i) => {
                  const pct = (d.percent / 50) * 100;
                  const over = d.percent > laborCost.target;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div
                        title={`${d.day}: ${d.percent}%`}
                        className={`w-full rounded-t ${over ? 'bg-red-400' : 'bg-indigo-400'}`}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-1">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Peste țintă</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-400 inline-block" /> Sub țintă</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Overtime Risk */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⏰ Risc Ore Suplimentare</h2>
        <div className="space-y-3">
          {overtimeRisk.map(emp => {
            const pct = (emp.hours_this_week / emp.threshold) * 100;
            return (
              <div key={emp.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-sm text-gray-500">{emp.role}</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${emp.risk_level === 'HIGH' ? 'bg-red-500' : emp.risk_level === 'MEDIUM' ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{emp.hours_this_week}h / {emp.threshold}h săptămânal</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${riskColor(emp.risk_level)}`}>
                  {emp.risk_level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Burnout Detection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">🧠 Detecție Burnout</h2>
        <p className="text-sm text-gray-500 mb-4">Semnale: întârzieri la pontaj, eficiență în scădere, voiduri frecvente</p>
        <div className="space-y-4">
          {burnoutSignals.map(emp => (
            <div key={emp.id} className="border rounded-lg p-4 hover:shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-semibold text-gray-800">{emp.name}</span>
                  <span className="ml-2 text-sm text-gray-500">{emp.role}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Scor Burnout</div>
                  <div className={`text-2xl font-bold ${burnoutColor(emp.burnoutScore)}`}>{emp.burnoutScore}/100</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div className="bg-indigo-50 rounded p-2 text-center">
                  <div className="font-bold text-indigo-700">{emp.lateClockIns}</div>
                  <div className="text-gray-500 text-xs">Întârzieri pontaj</div>
                </div>
                <div className="bg-orange-50 rounded p-2 text-center">
                  <div className="font-bold text-orange-700">{emp.efficiencyDrop}%</div>
                  <div className="text-gray-500 text-xs">Scădere eficiență</div>
                </div>
                <div className="bg-red-50 rounded p-2 text-center">
                  <div className="font-bold text-red-700">{emp.voids}</div>
                  <div className="text-gray-500 text-xs">Voiduri</div>
                </div>
              </div>
              {emp.managerNote && (
                <div className="bg-purple-50 border border-purple-200 rounded p-2 text-sm text-purple-800">
                  🔒 <span className="font-semibold">Notă manager:</span> {emp.managerNote}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LaborAIPage;
