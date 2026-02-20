import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SelfHealingPage = () => {
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [healingLog, setHealingLog] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadServices(), loadIncidents(), loadHealingLog(), loadSystemHealth()]);
    setLoading(false);
  };

  const loadServices = async () => {
    try {
      const res = await axios.get('/api/self-healing/services');
      setServices(res.data);
    } catch {
      setServices(demoServices());
    }
  };

  const loadIncidents = async () => {
    try {
      const res = await axios.get('/api/self-healing/incidents');
      setIncidents(res.data);
    } catch {
      setIncidents(demoIncidents());
    }
  };

  const loadHealingLog = async () => {
    try {
      const res = await axios.get('/api/self-healing/log');
      setHealingLog(res.data);
    } catch {
      setHealingLog(demoHealingLog());
    }
  };

  const loadSystemHealth = async () => {
    try {
      const res = await axios.get('/api/self-healing/health');
      setSystemHealth(res.data);
    } catch {
      setSystemHealth(demoSystemHealth());
    }
  };

  const triggerManualHeal = async (serviceId) => {
    try {
      await axios.post(`/api/self-healing/heal/${serviceId}`);
    } catch {
      console.log('Demo: manual heal triggered for', serviceId);
    }
    loadAll();
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoSystemHealth = () => ({
    uptime: 99.97,
    healingEventsToday: 3,
    servicesHealthy: 18,
    servicesTotal: 20,
    avgResponseMs: 142,
    selfHealedLast24h: 5,
  });

  const demoServices = () => [
    { id: 1, name: 'API Gateway', status: 'healthy', uptime: 99.99, responseMs: 45, autoHeal: true, lastCheck: '2s ago' },
    { id: 2, name: 'POS Service', status: 'healthy', uptime: 99.95, responseMs: 78, autoHeal: true, lastCheck: '2s ago' },
    { id: 3, name: 'KDS Service', status: 'healthy', uptime: 99.91, responseMs: 62, autoHeal: true, lastCheck: '5s ago' },
    { id: 4, name: 'Payment Processor', status: 'degraded', uptime: 98.72, responseMs: 1240, autoHeal: true, lastCheck: '3s ago' },
    { id: 5, name: 'Inventory DB', status: 'healthy', uptime: 99.98, responseMs: 18, autoHeal: true, lastCheck: '1s ago' },
    { id: 6, name: 'Delivery Tracker', status: 'healing', uptime: 97.40, responseMs: 0, autoHeal: true, lastCheck: '8s ago' },
    { id: 7, name: 'Analytics Engine', status: 'healthy', uptime: 99.80, responseMs: 320, autoHeal: false, lastCheck: '10s ago' },
    { id: 8, name: 'Notification Service', status: 'healthy', uptime: 99.85, responseMs: 95, autoHeal: true, lastCheck: '4s ago' },
  ];

  const demoIncidents = () => [
    { id: 1, service: 'Delivery Tracker', type: 'Timeout', detected: '14:32:07', status: 'Auto-healing', duration: '1m 12s', resolved: false },
    { id: 2, service: 'Payment Processor', type: 'High Latency', detected: '14:28:44', status: 'Monitoring', duration: '4m 35s', resolved: false },
    { id: 3, service: 'KDS Service', type: 'Memory Leak', detected: '13:15:22', status: 'Resolved', duration: '2m 08s', resolved: true },
    { id: 4, service: 'API Gateway', type: 'CPU Spike', detected: '11:44:10', status: 'Resolved', duration: '0m 43s', resolved: true },
    { id: 5, service: 'POS Service', type: 'Connection Drop', detected: '09:07:55', status: 'Resolved', duration: '1m 55s', resolved: true },
  ];

  const demoHealingLog = () => [
    { time: '14:32:09', service: 'Delivery Tracker', action: 'Container restart', result: 'In progress', automated: true },
    { time: '13:17:30', service: 'KDS Service', action: 'Memory flush + restart', result: 'Success', automated: true },
    { time: '11:44:53', service: 'API Gateway', action: 'Load balancer rebalance', result: 'Success', automated: true },
    { time: '09:09:50', service: 'POS Service', action: 'DB connection pool reset', result: 'Success', automated: true },
    { time: '08:02:11', service: 'Analytics Engine', action: 'Manual restart', result: 'Success', automated: false },
  ];

  const getStatusColor = (status) => {
    const map = {
      healthy: 'bg-green-100 text-green-800 border-green-300',
      degraded: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      healing: 'bg-blue-100 text-blue-800 border-blue-300',
      down: 'bg-red-100 text-red-800 border-red-300',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const map = { healthy: '✅', degraded: '⚠️', healing: '🔄', down: '❌' };
    return map[status] || '❓';
  };

  const tabs = [
    { id: 'status', label: '🖥️ Status Servicii' },
    { id: 'incidents', label: '🚨 Incidente' },
    { id: 'log', label: '📋 Jurnal Auto-Heal' },
    { id: 'config', label: '⚙️ Configurare' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔧 Self-Healing Infrastructure</h1>
          <p className="text-gray-600">Monitorizare și recuperare automată a serviciilor critice</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* KPI Summary */}
      {systemHealth && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Uptime Global', value: `${systemHealth.uptime}%`, icon: '📡', color: 'bg-green-50 border-green-300 text-green-800' },
            { label: 'Servicii Sănătoase', value: `${systemHealth.servicesHealthy}/${systemHealth.servicesTotal}`, icon: '✅', color: 'bg-blue-50 border-blue-300 text-blue-800' },
            { label: 'Auto-Heal Azi', value: systemHealth.healingEventsToday, icon: '🔄', color: 'bg-purple-50 border-purple-300 text-purple-800' },
            { label: 'Self-Healed 24h', value: systemHealth.selfHealedLast24h, icon: '🛠️', color: 'bg-orange-50 border-orange-300 text-orange-800' },
            { label: 'Răspuns Mediu', value: `${systemHealth.avgResponseMs}ms`, icon: '⚡', color: 'bg-cyan-50 border-cyan-300 text-cyan-800' },
            { label: 'Stare Sistem', value: 'OPERAȚIONAL', icon: '🟢', color: 'bg-green-50 border-green-400 text-green-900' },
          ].map((kpi, i) => (
            <div key={i} className={`border-2 rounded-xl p-4 text-center ${kpi.color}`}>
              <div className="text-2xl mb-1">{kpi.icon}</div>
              <div className="text-xl font-bold">{kpi.value}</div>
              <div className="text-xs font-medium mt-1">{kpi.label}</div>
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
              activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Status */}
      {activeTab === 'status' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🖥️ Status Servicii în Timp Real</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <div key={svc.id} className={`border-2 rounded-xl p-4 ${getStatusColor(svc.status)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-base">{getStatusIcon(svc.status)} {svc.name}</div>
                    <div className="text-sm mt-1">Uptime: <strong>{svc.uptime}%</strong> · Răspuns: <strong>{svc.responseMs > 0 ? `${svc.responseMs}ms` : 'N/A'}</strong></div>
                    <div className="text-xs mt-1 opacity-70">Ultima verificare: {svc.lastCheck}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(svc.status)}`}>
                      {svc.status.toUpperCase()}
                    </span>
                    {svc.status !== 'healthy' && (
                      <button
                        onClick={() => triggerManualHeal(svc.id)}
                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                      >
                        🔧 Repară
                      </button>
                    )}
                    {svc.autoHeal && (
                      <span className="text-xs opacity-60">🤖 Auto-heal activ</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Incidents */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚨 Incidente Active &amp; Recente</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-3 text-left">Serviciu</th>
                  <th className="p-3 text-left">Tip Incident</th>
                  <th className="p-3 text-left">Detectat</th>
                  <th className="p-3 text-left">Durată</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className={`border-b ${inc.resolved ? 'opacity-60' : ''}`}>
                    <td className="p-3 font-medium">{inc.service}</td>
                    <td className="p-3">{inc.type}</td>
                    <td className="p-3 font-mono text-xs">{inc.detected}</td>
                    <td className="p-3">{inc.duration}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        inc.resolved ? 'bg-green-100 text-green-700' :
                        inc.status === 'Auto-healing' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inc.resolved ? '✅ Rezolvat' : inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Healing Log */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📋 Jurnal Acțiuni Auto-Healing</h2>
          <div className="space-y-3">
            {healingLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="text-2xl">{entry.automated ? '🤖' : '👤'}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold">{entry.service}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-sm">{entry.action}</span>
                    </div>
                    <span className="font-mono text-xs text-gray-400">{entry.time}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      entry.result === 'Success' ? 'bg-green-100 text-green-700' :
                      entry.result === 'In progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {entry.result}
                    </span>
                    <span className="text-xs text-gray-400">{entry.automated ? 'Automat' : 'Manual'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Config */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⚙️ Configurare Politici Auto-Healing</h2>
          <div className="space-y-4">
            {[
              { label: 'Restart automat la timeout', enabled: true, threshold: '5s' },
              { label: 'Restart la erori consecutive', enabled: true, threshold: '3 erori' },
              { label: 'Alertă SMS la downtime', enabled: true, threshold: '> 30s' },
              { label: 'Scalare automată la trafic ridicat', enabled: true, threshold: 'CPU > 85%' },
              { label: 'Backup DB automat la incident', enabled: false, threshold: 'Manual' },
              { label: 'Notificare email incident critic', enabled: true, threshold: 'Imediat' },
            ].map((policy, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{policy.label}</div>
                  <div className="text-sm text-gray-500">Prag: {policy.threshold}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${policy.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {policy.enabled ? '✅ Activ' : '⏸️ Inactiv'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfHealingPage;
