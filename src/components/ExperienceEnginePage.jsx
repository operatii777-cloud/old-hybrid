import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExperienceEnginePage = () => {
  const [scenes, setScenes] = useState([]);
  const [devices, setDevices] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [signageSchedule, setSignageSchedule] = useState([]);
  const [activeScene, setActiveScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scenes');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadScenes(), loadDevices(), loadOccupancy(), loadSignageSchedule()]);
    setLoading(false);
  };

  const loadScenes = async () => {
    try {
      const res = await axios.get('/api/experience-engine/scenes');
      setScenes(res.data);
      const active = res.data.find(s => s.active);
      if (active) setActiveScene(active);
    } catch {
      const demoScenes = [
        { id: 1, name: 'Prânz Energic', music: 'Pop/Electronic', lighting: 'Luminos 100%', signage: 'Meniu Prânz Special', temp: '20°C', trigger: 'time:12:00', active: false, icon: '☀️' },
        { id: 2, name: 'Seara Romantică', music: 'Jazz/Lounge', lighting: 'Cald 40%', signage: 'Meniu Cină & Vinuri', temp: '22°C', trigger: 'time:19:00', active: true, icon: '🕯️' },
        { id: 3, name: 'Happy Hour', music: 'R&B/Soul', lighting: 'Colorat 70%', signage: 'Oferte Băuturi -30%', temp: '21°C', trigger: 'time:17:00', active: false, icon: '🎉' },
        { id: 4, name: 'Închidere Treptată', music: 'Ambient/Chill', lighting: 'Dimmer 20%', signage: 'Mulțumim! Ne vedem mâine', temp: '19°C', trigger: 'time:22:30', active: false, icon: '🌙' },
      ];
      setScenes(demoScenes);
      setActiveScene(demoScenes.find(s => s.active) || null);
    }
  };

  const loadDevices = async () => {
    try {
      const res = await axios.get('/api/experience-engine/devices');
      setDevices(res.data);
    } catch {
      setDevices([
        { id: 1, type: 'light', name: 'Lumini Sală Principală', icon: '💡', status: 'Online', value: 40, unit: '%' },
        { id: 2, type: 'light', name: 'Lumini Bar', icon: '💡', status: 'Online', value: 75, unit: '%' },
        { id: 3, type: 'speaker', name: 'Sound System Main', icon: '🔊', status: 'Online', value: 60, unit: '%' },
        { id: 4, type: 'speaker', name: 'Terasă Exterior', icon: '🔊', status: 'Offline', value: 0, unit: '%' },
        { id: 5, type: 'display', name: 'Afișaj Intrare', icon: '📺', status: 'Online', value: 100, unit: '%' },
        { id: 6, type: 'display', name: 'Meniu Digital Bar', icon: '📺', status: 'Online', value: 100, unit: '%' },
        { id: 7, type: 'hvac', name: 'Climatizare Sală', icon: '🌡️', status: 'Online', value: 22, unit: '°C' },
        { id: 8, type: 'hvac', name: 'Climatizare Bucătărie', icon: '🌡️', status: 'Online', value: 18, unit: '°C' },
      ]);
    }
  };

  const loadOccupancy = async () => {
    try {
      const res = await axios.get('/api/experience-engine/occupancy');
      setOccupancy(res.data);
    } catch {
      setOccupancy({
        current: 68,
        capacity: 80,
        pct: 85,
        prediction: [
          { hour: '18:00', pct: 70 },
          { hour: '19:00', pct: 90 },
          { hour: '20:00', pct: 100 },
          { hour: '21:00', pct: 85 },
          { hour: '22:00', pct: 50 },
        ]
      });
    }
  };

  const loadSignageSchedule = async () => {
    try {
      const res = await axios.get('/api/experience-engine/signage-schedule');
      setSignageSchedule(res.data);
    } catch {
      setSignageSchedule([
        { time: '08:00–11:00', mon: 'Mic Dejun', tue: 'Mic Dejun', wed: 'Mic Dejun', thu: 'Mic Dejun', fri: 'Mic Dejun', sat: 'Brunch', sun: 'Brunch' },
        { time: '11:00–15:00', mon: 'Prânz Special', tue: 'Prânz Special', wed: 'Prânz Special', thu: 'Prânz Special', fri: 'Prânz Special', sat: 'Meniu Complet', sun: 'Meniu Complet' },
        { time: '15:00–17:00', mon: 'Cafea & Desert', tue: 'Cafea & Desert', wed: 'Cafea & Desert', thu: 'Cafea & Desert', fri: 'Cafea & Desert', sat: 'Cafea & Desert', sun: 'Cafea & Desert' },
        { time: '17:00–19:00', mon: 'Happy Hour', tue: 'Happy Hour', wed: 'Happy Hour', thu: 'Happy Hour', fri: 'Happy Hour 2x', sat: 'Happy Hour 2x', sun: '-' },
        { time: '19:00–23:00', mon: 'Cină', tue: 'Cină', wed: 'Cină', thu: 'Cină', fri: 'Cină Romantică', sat: 'Cină Gală', sun: 'Cină' },
      ]);
    }
  };

  const activateScene = async (sceneId) => {
    try {
      await axios.post(`/api/experience-engine/scenes/${sceneId}/activate`);
    } catch {
      // demo fallback – update locally
    }
    const updated = scenes.map(s => ({ ...s, active: s.id === sceneId }));
    setScenes(updated);
    setActiveScene(updated.find(s => s.id === sceneId));
  };

  const updateDevice = (id, value) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, value } : d));
  };

  const tabs = [
    { id: 'scenes', label: '🎭 Scene Ambientale' },
    { id: 'devices', label: '📡 Dispozitive IoT' },
    { id: 'signage', label: '📺 Program Afișaj' },
    { id: 'occupancy', label: '👥 Nivel Ocupare' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">🔄 Se încarcă motorul de experiență...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">✨ Motor Experiență – Ambient IoT</h1>
          <p className="text-gray-600">Controlul atmosferei în timp real prin IoT</p>
        </div>
        <button onClick={loadAllData} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">
          🔄 Refresh
        </button>
      </div>

      {/* Active Scene Card */}
      {activeScene && (
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm uppercase tracking-widest opacity-80 mb-1">Scenă Activă</div>
          <div className="text-3xl font-bold mb-3">{activeScene.icon} {activeScene.name}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-80">Muzică</div>
              <div className="font-semibold">{activeScene.music}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-80">Iluminat</div>
              <div className="font-semibold">{activeScene.lighting}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-80">Afișaj</div>
              <div className="font-semibold">{activeScene.signage}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-80">Temperatură</div>
              <div className="font-semibold">{activeScene.temp}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Scene Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => activateScene(scene.id)}
            className={`p-4 rounded-xl text-left transition-all shadow ${
              scene.active
                ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                : 'bg-white text-gray-800 hover:bg-cyan-50 border border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">{scene.icon}</div>
            <div className="font-semibold text-sm">{scene.name}</div>
            <div className="text-xs mt-1 opacity-70">⏰ {scene.trigger}</div>
            {scene.active && <div className="text-xs mt-1 font-bold">● ACTIV</div>}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Scenes */}
      {activeTab === 'scenes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🎭 Scene Predefinite</h2>
          <div className="space-y-3">
            {scenes.map(scene => (
              <div key={scene.id} className={`border rounded-lg p-4 flex items-center justify-between ${scene.active ? 'border-cyan-400 bg-cyan-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{scene.icon}</span>
                  <div>
                    <div className="font-semibold">{scene.name}</div>
                    <div className="text-sm text-gray-500">🎵 {scene.music} | 💡 {scene.lighting} | 🌡️ {scene.temp}</div>
                    <div className="text-sm text-gray-500">📺 {scene.signage} | ⏰ Trigger: {scene.trigger}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${scene.active ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {scene.active ? 'ACTIV' : 'INACTIV'}
                  </span>
                  {!scene.active && (
                    <button
                      onClick={() => activateScene(scene.id)}
                      className="px-3 py-1 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700"
                    >
                      Activează
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Devices */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📡 Dispozitive IoT Conectate</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map(device => (
              <div key={device.id} className={`border rounded-lg p-4 ${device.status === 'Offline' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{device.icon}</span>
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${device.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {device.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-cyan-700">{device.value}{device.unit}</div>
                </div>
                {device.status === 'Online' && (
                  <input
                    type="range"
                    min={device.type === 'hvac' ? 16 : 0}
                    max={device.type === 'hvac' ? 30 : 100}
                    value={device.value}
                    onChange={(e) => updateDevice(device.id, Number(e.target.value))}
                    className="w-full accent-cyan-600"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Signage */}
      {activeTab === 'signage' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📺 Program Afișaj Săptămânal</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-cyan-50">
                  <th className="p-2 text-left">Interval</th>
                  {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(d => (
                    <th key={d} className="p-2 text-center text-cyan-800">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signageSchedule.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium text-gray-700">{row.time}</td>
                    {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun].map((cell, j) => (
                      <td key={j} className={`p-2 text-center rounded ${cell === '-' ? 'text-gray-300' : 'bg-cyan-50 text-cyan-800'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Occupancy */}
      {activeTab === 'occupancy' && occupancy && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👥 Nivel Ocupare</h2>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Ocupare Curentă: {occupancy.current}/{occupancy.capacity} locuri</span>
              <span className={`text-lg font-bold ${occupancy.pct >= 90 ? 'text-red-600' : occupancy.pct >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                {occupancy.pct}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all ${occupancy.pct >= 90 ? 'bg-red-500' : occupancy.pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${occupancy.pct}%` }}
              ></div>
            </div>
          </div>
          <h3 className="font-semibold mb-3">📊 Predicții Ocupare</h3>
          <div className="space-y-2">
            {occupancy.prediction.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium">{p.hour}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${p.pct >= 90 ? 'bg-red-400' : p.pct >= 70 ? 'bg-yellow-400' : 'bg-cyan-400'}`}
                    style={{ width: `${p.pct}%` }}
                  ></div>
                </div>
                <span className="w-10 text-sm font-bold">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceEnginePage;
