import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const STATII = [
  { key: 'bucatarie', label: '🍳 BUCĂTĂRIE', color: 'border-orange-500 bg-orange-900/20' },
  { key: 'bar', label: '🍹 BAR', color: 'border-blue-500 bg-blue-900/20' }
];

const STATUS_INFO = {
  pending:   { label: 'ÎN AȘTEPTARE', color: 'bg-yellow-600 text-white', next: 'preparing' },
  preparing: { label: 'ÎN PREPARARE', color: 'bg-orange-500 text-white', next: 'ready' },
  ready:     { label: 'GATA',          color: 'bg-green-600 text-white',  next: 'served' },
  served:    { label: 'SERVIT',         color: 'bg-gray-500 text-white',  next: null }
};

/** Compute SLA flag: items pending > 15 min or preparing > 20 min are highlighted */
function isSlaWarning(item) {
  if (item.status === 'served') return false;
  const creat = new Date(item.creat_la).getTime();
  const elapsed = (Date.now() - creat) / 60000; // minutes
  if (item.status === 'pending' && elapsed > 15) return true;
  if (item.status === 'preparing' && elapsed > 20) return true;
  return false;
}

function formatTime(dt) {
  if (!dt) return '';
  try { return new Date(dt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function KDSCard({ item, onStatusChange }) {
  const info = STATUS_INFO[item.status] || STATUS_INFO.pending;
  const sla = isSlaWarning(item);

  return (
    <div className={`rounded-lg border-2 p-3 mb-2 ${sla ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-800'}`}>
      <div className="flex justify-between items-start mb-1">
        <div>
          <span className="font-bold text-white text-sm">{item.den_prod}</span>
          <span className="text-yellow-400 font-bold ml-2 text-sm">×{item.cant}</span>
        </div>
        <span className="text-xs text-gray-400">Masa {item.masa_id || '?'}</span>
      </div>
      <div className="text-xs text-gray-400 mb-2">
        {formatTime(item.creat_la)}
        {sla && <span className="ml-2 text-red-400 font-bold animate-pulse">⚠ SLA</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${info.color}`}>{info.label}</span>
        {info.next && (
          <button
            onClick={() => onStatusChange(item.id, info.next)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold"
          >
            {STATUS_INFO[info.next].label} →
          </button>
        )}
      </div>
    </div>
  );
}

export default function KDSPage() {
  const [activeStatie, setActiveStatie] = useState('bucatarie');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/kds/board?statie=${activeStatie}`);
      setItems(res.data?.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('KDS load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeStatie]);

  useEffect(() => {
    loadItems();
    const iv = setInterval(loadItems, 10000); // auto-refresh every 10s
    return () => clearInterval(iv);
  }, [loadItems]);

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await axios.put(`/api/kds/${itemId}/status`, { status: newStatus });
      setItems(prev => prev.map(it => it.id === itemId ? { ...it, status: newStatus } : it));
    } catch (err) {
      alert('Eroare la actualizare status KDS: ' + (err.response?.data?.error || err.message));
    }
  };

  const grouped = React.useMemo(() => {
    const g = { pending: [], preparing: [], ready: [] };
    for (const item of items) {
      if (g[item.status]) g[item.status].push(item);
    }
    return g;
  }, [items]);

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded">
        <h1 className="text-2xl font-bold text-yellow-400">🖥 KDS – Kitchen Display System</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{lastRefresh && `Refresh: ${formatTime(lastRefresh.toISOString())}`}</span>
          <button onClick={loadItems} disabled={loading} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-bold disabled:opacity-50">
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Station selector */}
      <div className="flex gap-3 mb-4">
        {STATII.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveStatie(s.key)}
            className={`px-5 py-2 rounded-lg font-bold text-sm border-2 transition-all ${activeStatie === s.key ? s.color + ' text-white ring-2 ring-white' : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* KDS Board: 3 columns - pending | preparing | ready */}
      <div className="grid grid-cols-3 gap-4">
        {(['pending', 'preparing', 'ready']).map(status => (
          <div key={status} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className={`font-bold text-center mb-3 py-1 rounded text-sm ${STATUS_INFO[status].color}`}>
              {STATUS_INFO[status].label} ({grouped[status]?.length || 0})
            </div>
            {grouped[status]?.length === 0 && (
              <div className="text-gray-500 text-center text-xs py-8">Nimic în această coloană</div>
            )}
            {grouped[status]?.map(item => (
              <KDSCard key={item.id} item={item} onStatusChange={handleStatusChange} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
