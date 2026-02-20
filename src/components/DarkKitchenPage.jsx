import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DarkKitchenPage = () => {
  const [brands, setBrands] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [capacitySlots, setCapacitySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '', description: '', cuisineType: '',
    platforms: [], ghostMenu: false,
  });

  const PLATFORMS = ['GLOVO', 'BOLT', 'WOLT', 'TAZZ'];
  const PLATFORM_COLORS = {
    GLOVO: 'bg-yellow-100 text-yellow-800',
    BOLT: 'bg-green-100 text-green-800',
    WOLT: 'bg-blue-100 text-blue-800',
    TAZZ: 'bg-orange-100 text-orange-800',
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadBrands(), loadPerformance(), loadCapacitySlots()]);
    setLoading(false);
  };

  const loadBrands = async () => {
    try {
      const res = await axios.get('/api/dark-kitchen/brands');
      setBrands(res.data);
    } catch {
      setBrands(demoBrands());
    }
  };

  const loadPerformance = async () => {
    try {
      const res = await axios.get('/api/dark-kitchen/performance');
      setPerformance(res.data);
    } catch {
      setPerformance(demoPerformance());
    }
  };

  const loadCapacitySlots = async () => {
    try {
      const res = await axios.get('/api/dark-kitchen/capacity-slots');
      setCapacitySlots(res.data);
    } catch {
      setCapacitySlots(demoCapacitySlots());
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/dark-kitchen/brands', newBrand);
      setBrands(prev => [...prev, res.data]);
    } catch {
      setBrands(prev => [...prev, { ...newBrand, id: Date.now(), status: 'active', todayOrders: 0, todayRevenue: 0, emoji: '🍽️' }]);
    }
    setNewBrand({ name: '', description: '', cuisineType: '', platforms: [], ghostMenu: false });
    setShowAddForm(false);
  };

  const togglePlatform = (platform) => {
    setNewBrand(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  // ── Demo data ──────────────────────────────────────────────────────────────

  const demoBrands = () => [
    {
      id: 1, name: 'BurgerCity', emoji: '🍔', description: 'Burgeri artizanali cu ingrediente locale',
      cuisineType: 'Fast Food', platforms: ['GLOVO', 'BOLT', 'WOLT'],
      status: 'active', todayOrders: 87, todayRevenue: 2610,
    },
    {
      id: 2, name: 'PizzaExpress Virtual', emoji: '🍕', description: 'Pizzerie virtuală – cuptoare tradiționale',
      cuisineType: 'Italiană', platforms: ['GLOVO', 'TAZZ', 'WOLT'],
      status: 'active', todayOrders: 64, todayRevenue: 1920,
    },
    {
      id: 3, name: 'SaladBar Online', emoji: '🥗', description: 'Salate fresh & bowl-uri sănătoase',
      cuisineType: 'Healthy', platforms: ['BOLT', 'WOLT'],
      status: 'inactive', todayOrders: 0, todayRevenue: 0,
    },
  ];

  const demoPerformance = () => [
    { id: 1, name: 'BurgerCity', emoji: '🍔', ordersToday: 87, revenue: 2610, avgTicket: 30, cogs: 912, platformFees: 418, netMargin: 49.2 },
    { id: 2, name: 'PizzaExpress Virtual', emoji: '🍕', ordersToday: 64, revenue: 1920, avgTicket: 30, cogs: 672, platformFees: 307, netMargin: 49.0 },
    { id: 3, name: 'SaladBar Online', emoji: '🥗', ordersToday: 0, revenue: 0, avgTicket: 0, cogs: 0, platformFees: 0, netMargin: 0 },
  ];

  const demoCapacitySlots = () => {
    const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    return hours.map(hour => ({
      hour,
      slots: [
        { brand: 'BurgerCity', emoji: '🍔', pct: hour >= '12:00' && hour <= '14:00' ? 50 : 35, color: 'bg-purple-400' },
        { brand: 'PizzaExpress Virtual', emoji: '🍕', pct: hour >= '19:00' && hour <= '21:00' ? 45 : 30, color: 'bg-violet-400' },
        { brand: 'SaladBar Online', emoji: '🥗', pct: 20, color: 'bg-fuchsia-300' },
      ],
    }));
  };

  const demoPlatformComparison = () => [
    { platform: 'GLOVO', orders: 98, revenue: 2940, avgDelivery: 28, color: 'bg-yellow-400' },
    { platform: 'BOLT', orders: 72, revenue: 2160, avgDelivery: 24, color: 'bg-green-400' },
    { platform: 'WOLT', orders: 61, revenue: 1830, avgDelivery: 31, color: 'bg-blue-400' },
    { platform: 'TAZZ', orders: 20, revenue: 600, avgDelivery: 35, color: 'bg-orange-400' },
  ];

  const formatRON = (n) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(n || 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg text-purple-600">🔄 Se încarcă Bucătărie Virtuală...</div>
      </div>
    );
  }

  const platformComparison = demoPlatformComparison();
  const maxOrders = Math.max(...platformComparison.map(p => p.orders));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👻 Bucătărie Virtuală</h1>
          <p className="text-gray-600">Dark Kitchen & Branduri Virtuale – management centralizat</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            ➕ Brand Nou
          </button>
          <button onClick={loadAll} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Section 1: Virtual Brands List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">🏪 Branduri Virtuale</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className={`bg-white rounded-lg shadow-md p-5 border-t-4 ${brand.status === 'active' ? 'border-purple-500' : 'border-gray-300'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{brand.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-800">{brand.name}</div>
                    <div className="text-xs text-gray-500">{brand.cuisineType}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${brand.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {brand.status === 'active' ? '● Activ' : '● Inactiv'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{brand.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {brand.platforms?.map(p => (
                  <span key={p} className={`text-xs px-2 py-0.5 rounded ${PLATFORM_COLORS[p] || 'bg-gray-100 text-gray-600'}`}>{p}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="text-center">
                  <div className="font-bold text-purple-700 text-lg">{brand.todayOrders}</div>
                  <div className="text-xs text-gray-500">Comenzi azi</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-700 text-lg">{formatRON(brand.todayRevenue)}</div>
                  <div className="text-xs text-gray-500">Venituri azi</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Brand Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Brand Virtual Nou</h3>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume brand</label>
                <input
                  required
                  value={newBrand.name}
                  onChange={e => setNewBrand(p => ({ ...p, name: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="ex: SushiDelivery Ro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                <textarea
                  value={newBrand.description}
                  onChange={e => setNewBrand(p => ({ ...p, description: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Scurtă descriere..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip bucătărie</label>
                <input
                  value={newBrand.cuisineType}
                  onChange={e => setNewBrand(p => ({ ...p, cuisineType: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="ex: Japoneză, Fast Food..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platforme active</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        newBrand.platforms.includes(p)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ghostMenu"
                  checked={newBrand.ghostMenu}
                  onChange={e => setNewBrand(p => ({ ...p, ghostMenu: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="ghostMenu" className="text-sm text-gray-700">Ghost Menu (meniu ascuns publicului general)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  💾 Salvează
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 3: Performance Per Brand */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Performanță Brand</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 text-left">
                {['Brand', 'Comenzi Azi', 'Venituri', 'Ticket Mediu', 'COGS', 'Comisioane Platformă', 'Marjă Netă %'].map(h => (
                  <th key={h} className="px-4 py-2 font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {performance.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.emoji} {p.name}</td>
                  <td className="px-4 py-3">{p.ordersToday}</td>
                  <td className="px-4 py-3 font-semibold text-purple-700">{formatRON(p.revenue)}</td>
                  <td className="px-4 py-3">{formatRON(p.avgTicket)}</td>
                  <td className="px-4 py-3 text-red-600">{formatRON(p.cogs)}</td>
                  <td className="px-4 py-3 text-orange-600">{formatRON(p.platformFees)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.netMargin >= 40 ? 'text-green-600' : p.netMargin > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {p.netMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Kitchen Capacity Slots */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🍳 Alocare Capacitate Bucătărie</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {capacitySlots.map((slot, si) => (
              <div key={si} className="flex flex-col items-center" style={{ width: 56 }}>
                <div className="w-full flex flex-col gap-0.5 h-32">
                  {slot.slots.map((s, i) => (
                    <div
                      key={i}
                      title={`${s.brand}: ${s.pct}%`}
                      className={`w-full rounded ${s.color} flex items-center justify-center text-xs text-white font-bold`}
                      style={{ height: `${s.pct}%` }}
                    >
                      {s.pct >= 30 ? s.emoji : ''}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500 mt-1">{slot.hour}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {brands.map(b => (
              <span key={b.id} className="flex items-center gap-1 text-xs text-gray-600">
                <span>{b.emoji}</span> {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Platform Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Comparație Platforme (Comenzi Azi)</h2>
        <div className="space-y-3">
          {platformComparison.map(p => (
            <div key={p.platform} className="flex items-center gap-4">
              <div className="w-16 text-sm font-semibold text-gray-700">{p.platform}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                <div
                  className={`h-full ${p.color} rounded-full flex items-center pl-3 text-white text-xs font-bold transition-all`}
                  style={{ width: `${(p.orders / maxOrders) * 100}%` }}
                >
                  {p.orders} comenzi
                </div>
              </div>
              <div className="w-28 text-sm text-right text-gray-600">{formatRON(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DarkKitchenPage;
