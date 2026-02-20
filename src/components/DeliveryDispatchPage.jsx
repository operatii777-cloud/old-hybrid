import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Leaflet CSS must be injected — no bundler plugin needed
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// ===== DEMO DATA =====
const demoCouriersList = [
  { id: 1, name: 'Andrei Popescu', phone: '0722 111 222', status: 'disponibil', lat: 44.4268, lon: 26.1025, orders: 0, efficiency: 92 },
  { id: 2, name: 'Maria Ionescu', phone: '0733 222 333', status: 'ocupat', lat: 44.4320, lon: 26.1080, orders: 1, efficiency: 87 },
  { id: 3, name: 'Ion Dumitrescu', phone: '0744 333 444', status: 'ocupat', lat: 44.4180, lon: 26.0950, orders: 2, efficiency: 95 },
  { id: 4, name: 'Elena Stoica', phone: '0755 444 555', status: 'offline', lat: 44.4400, lon: 26.1200, orders: 0, efficiency: 78 },
];

const demoOrders = [
  { id: 1, order_number: 'DEL-001', customer: 'Restaurant Piața Romană', address: 'Piața Romană 5', lat: 44.4500, lon: 26.0800, status: 'in_livrare', courier_id: 2, total: 145.50, platform: 'Propriu', eta: '12 min' },
  { id: 2, order_number: 'DEL-002', customer: 'Client Cotroceni', address: 'Bd. Geniului 3', lat: 44.4100, lon: 26.0700, status: 'gata_livrare', courier_id: null, total: 89.00, platform: 'GLOVO', eta: '—' },
  { id: 3, order_number: 'DEL-003', customer: 'Firma Victoriei', address: 'Calea Victoriei 100', lat: 44.4450, lon: 26.1000, status: 'in_preparare', courier_id: null, total: 230.00, platform: 'BOLT', eta: '—' },
  { id: 4, order_number: 'DEL-004', customer: 'Client Floreasca', address: 'Str. Floreasca 22', lat: 44.4600, lon: 26.1100, status: 'in_livrare', courier_id: 3, total: 67.00, platform: 'WOLT', eta: '20 min' },
];

const demoZones = [
  { id: 1, name: 'Zona Centrală', color: '#3B82F6', fee: 8, min_order: 30, eta: 20 },
  { id: 2, name: 'Zona Nordică', color: '#10B981', fee: 10, min_order: 40, eta: 30 },
  { id: 3, name: 'Zona Sudică', color: '#F59E0B', fee: 12, min_order: 50, eta: 35 },
];

const STATUS_COLORS = {
  disponibil: 'bg-green-100 text-green-700',
  ocupat: 'bg-yellow-100 text-yellow-700',
  offline: 'bg-gray-100 text-gray-500',
  in_livrare: 'bg-blue-100 text-blue-700',
  gata_livrare: 'bg-orange-100 text-orange-700',
  in_preparare: 'bg-indigo-100 text-indigo-700',
  nou: 'bg-purple-100 text-purple-700',
};

const PLATFORM_COLORS = {
  Propriu: 'bg-blue-100 text-blue-700',
  GLOVO: 'bg-orange-100 text-orange-700',
  BOLT: 'bg-green-100 text-green-700',
  WOLT: 'bg-cyan-100 text-cyan-700',
  TAZZ: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ value }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[value] || 'bg-gray-100 text-gray-600'}`}>
    {value}
  </span>
);

// ===== OSM MAP (loaded via script tag to avoid bundler conflicts) =====
const OSMMapWidget = ({ couriers, orders, restaurantLat, restaurantLon }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Inject Leaflet CSS if not already injected
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not already loaded
    const initMap = () => {
      if (!window.L) return;
      if (mapInstanceRef.current) return; // already initialized

      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      // OSM tile layer — free, no API key required
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      map.setView([restaurantLat, restaurantLon], 14);

      // Restaurant marker
      const restaurantIcon = L.divIcon({
        html: '<div style="background:#1D4ED8;color:white;padding:4px 7px;border-radius:8px;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.4)">🍽️</div>',
        className: '',
        iconAnchor: [20, 20],
      });
      L.marker([restaurantLat, restaurantLon], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup('<strong>Restaurant</strong><br>Locație principală');
    };

    if (window.L) {
      initMap();
    } else if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      // Script already loading — poll briefly
      const poll = setInterval(() => {
        if (window.L) { clearInterval(poll); initMap(); }
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // restaurantLat/restaurantLon are constant module-level values

  // Update markers when couriers/orders change
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear existing dynamic markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Courier markers
    couriers.forEach(c => {
      if (!c.lat || !c.lon) return;
      const color = c.status === 'disponibil' ? '#10B981' : c.status === 'ocupat' ? '#F59E0B' : '#9CA3AF';
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;padding:3px 6px;border-radius:50%;font-size:14px;box-shadow:0 2px 5px rgba(0,0,0,0.3)" title="${c.name}">🛵</div>`,
        className: '',
        iconAnchor: [14, 14],
      });
      const marker = L.marker([c.lat, c.lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>${c.name}</strong><br>Status: ${c.status}<br>Comenzi active: ${c.orders}<br>Eficiență: ${c.efficiency}%`);
      markersRef.current.push(marker);
    });

    // Order markers
    orders.forEach(o => {
      if (!o.lat || !o.lon) return;
      const statusEmoji = o.status === 'in_livrare' ? '🚀' : o.status === 'gata_livrare' ? '📦' : '⏳';
      const icon = L.divIcon({
        html: `<div style="background:#6366F1;color:white;padding:3px 6px;border-radius:6px;font-size:13px;box-shadow:0 2px 5px rgba(0,0,0,0.3)">${statusEmoji}</div>`,
        className: '',
        iconAnchor: [12, 12],
      });
      const marker = L.marker([o.lat, o.lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>${o.order_number}</strong><br>${o.address}<br>Status: ${o.status}<br>Total: ${o.total} RON<br>Platformă: ${o.platform}`);
      markersRef.current.push(marker);
    });
  }, [couriers, orders]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '420px', borderRadius: '8px', zIndex: 0 }}
    />
  );
};

// ===== MAIN COMPONENT =====
const DeliveryDispatchPage = () => {
  const [couriers, setCouriers] = useState(demoCouriersList);
  const [orders, setOrders] = useState(demoOrders);
  const [zones, setZones] = useState(demoZones);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('harta');
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignMsg, setAssignMsg] = useState('');

  const restaurantLat = parseFloat(import.meta.env?.VITE_LAT || '44.4268');
  const restaurantLon = parseFloat(import.meta.env?.VITE_LON || '26.1025');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [couriersRes, ordersRes] = await Promise.all([
        axios.get('/api/delivery/curieri'),
        axios.get('/api/delivery/comenzi?status=activ&limit=20'),
      ]);
      if (couriersRes.data?.length) setCouriers(couriersRes.data);
      if (ordersRes.data?.data?.length) setOrders(ordersRes.data.data);
    } catch {
      // keep demo data
    }
    setLoading(false);
  };

  const handleAssign = async (orderId, courierId) => {
    try {
      await axios.put(`/api/delivery/comenzi/${orderId}/assign`, { curier_id: courierId });
      setAssignMsg(`✅ Comandă ${orderId} atribuită curierului ${courierId}`);
      loadData();
    } catch {
      // update local state optimistically
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, courier_id: courierId, status: 'in_livrare' } : o
      ));
      setAssignMsg(`✅ Atribuit (demo)`);
    }
    setTimeout(() => setAssignMsg(''), 3000);
  };

  const availableCouriers = couriers.filter(c => c.status === 'disponibil');
  const activeOrders = orders.filter(o => ['nou', 'confirmat', 'in_preparare', 'gata_livrare', 'in_livrare'].includes(o.status));
  const unassignedOrders = orders.filter(o => !o.courier_id && ['gata_livrare', 'in_preparare'].includes(o.status));

  const handleAssignChange = (orderId, e) => {
    const courierId = parseInt(e.target.value, 10);
    if (!isNaN(courierId) && courierId > 0) handleAssign(orderId, courierId);
  };

  const tabs = [
    { id: 'harta', label: '🗺️ Hartă Live', badge: null },
    { id: 'comenzi', label: '📦 Comenzi', badge: activeOrders.length },
    { id: 'curieri', label: '🛵 Curieri', badge: availableCouriers.length },
    { id: 'zone', label: '📍 Zone Livrare', badge: null },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚗 Dispatch Livrări — Hartă OSM Live</h1>
          <p className="text-sm text-gray-500">Harta OpenStreetMap · Fără cheie API · Date actualizate la 30s</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${loading ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {loading ? '⟳ Actualizare...' : '🟢 Live'}
          </span>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
          >
            ↻ Reîmprospătare
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Comenzi Active', value: activeOrders.length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Neatribuite', value: unassignedOrders.length, color: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Curieri Disponibili', value: availableCouriers.length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Curieri Ocupați', value: couriers.filter(c => c.status === 'ocupat').length, color: 'text-yellow-700', bg: 'bg-yellow-50' },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-3 text-center border border-opacity-40`}>
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {assignMsg && (
        <div className="mb-3 p-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">{assignMsg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeTab === tab.id ? 'bg-white border-t border-l border-r border-gray-200 text-blue-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {tab.label}
            {tab.badge != null && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200 p-4">
        {/* MAP TAB */}
        {activeTab === 'harta' && (
          <div>
            <div className="mb-3 flex items-start gap-3 flex-wrap text-xs text-gray-500">
              <span>🍽️ Restaurant</span>
              <span className="text-green-600">🛵 Curier disponibil</span>
              <span className="text-yellow-600">🛵 Curier ocupat</span>
              <span className="text-purple-600">🚀 Comandă în livrare</span>
              <span className="text-purple-600">📦 Gata pentru livrare</span>
              <span className="text-gray-400 ml-auto">Hartă: © OpenStreetMap contributors</span>
            </div>
            <OSMMapWidget
              couriers={couriers}
              orders={orders}
              restaurantLat={restaurantLat}
              restaurantLon={restaurantLon}
            />

            {/* Unassigned orders quick-assign */}
            {unassignedOrders.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-gray-700 mb-2 text-sm">⚡ Atribuire Rapidă — Comenzi Neatribuite</h3>
                <div className="space-y-2">
                  {unassignedOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-gray-800">{order.order_number}</span>
                        <span className="text-xs text-gray-500 ml-2">{order.address}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${PLATFORM_COLORS[order.platform] || 'bg-gray-100 text-gray-600'}`}>{order.platform}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{order.total} RON</div>
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                        defaultValue=""
                        onChange={e => handleAssignChange(order.id, e)}
                      >
                        <option value="">— Selectează curier —</option>
                        {availableCouriers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'comenzi' && (
          <div>
            <h3 className="font-bold text-gray-700 mb-3">Comenzi Active ({activeOrders.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {['#Comandă', 'Client / Adresă', 'Platformă', 'Status', 'Curier', 'ETA', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const courier = couriers.find(c => c.id === order.courier_id);
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-blue-700">{order.order_number}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-800">{order.customer}</div>
                          <div className="text-xs text-gray-400">{order.address}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLATFORM_COLORS[order.platform] || 'bg-gray-100 text-gray-600'}`}>{order.platform}</span>
                        </td>
                        <td className="px-3 py-2"><StatusBadge value={order.status} /></td>
                        <td className="px-3 py-2 text-xs">{courier ? courier.name : <span className="text-orange-500 font-medium">Neatribuit</span>}</td>
                        <td className="px-3 py-2 text-xs font-medium">{order.eta || '—'}</td>
                        <td className="px-3 py-2 font-bold">{order.total} RON</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COURIERS TAB */}
        {activeTab === 'curieri' && (
          <div>
            <h3 className="font-bold text-gray-700 mb-3">Curieri ({couriers.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {couriers.map(c => (
                <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-gray-800">🛵 {c.name}</div>
                      <div className="text-xs text-gray-400">{c.phone}</div>
                    </div>
                    <StatusBadge value={c.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-400">Comenzi active</div>
                      <div className="font-bold text-gray-800">{c.orders}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-400">Eficiență</div>
                      <div className={`font-bold ${c.efficiency >= 90 ? 'text-green-600' : c.efficiency >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{c.efficiency}%</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    📍 {c.lat?.toFixed(4)}, {c.lon?.toFixed(4)} · <span className="text-blue-500">Track live pe hartă</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ZONES TAB */}
        {activeTab === 'zone' && (
          <div>
            <h3 className="font-bold text-gray-700 mb-3">Zone Livrare</h3>
            <p className="text-xs text-gray-400 mb-3">Zonele sunt afișate pe hartă. Pentru editarea poligoanelor, folosiți editorul OSM integrat.</p>
            <div className="space-y-3">
              {zones.map(z => (
                <div key={z.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-4 h-4 rounded-full" style={{ background: z.color }} />
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{z.name}</div>
                  </div>
                  <div className="text-sm text-gray-600">Taxă: <strong>{z.fee} RON</strong></div>
                  <div className="text-sm text-gray-600">Min comandă: <strong>{z.min_order} RON</strong></div>
                  <div className="text-sm text-gray-600">ETA: <strong>{z.eta} min</strong></div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>📍 Geocodificare adrese:</strong> Folosind Nominatim (OSM) — gratuit, fără cheie API.<br />
              <strong>🗺️ Hartă tile:</strong> OpenStreetMap — gratuit, fără cheie API.<br />
              <strong>🛣️ Rutare:</strong> OSRM (Open Source Routing Machine) — gratuit, fără cheie API.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDispatchPage;
