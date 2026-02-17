import React, { useState } from 'react';

const RapoarteInventarPage = () => {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dataStart: new Date().toISOString().split('T')[0],
    dataEnd: new Date().toISOString().split('T')[0],
    gestiune: 'toate'
  });

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      alert(`Raport Inventar generat!\nPerioadă: ${filters.dataStart} - ${filters.dataEnd}`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📋 Rapoarte Inventar</h1>
        <p className="text-black">Rapoarte pentru inventarul periodic</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-black mb-4">Generare Raport Inventar</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-black font-bold mb-1">Data start:</label>
            <input
              type="date"
              value={filters.dataStart}
              onChange={(e) => setFilters({...filters, dataStart: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          <div>
            <label className="block text-black font-bold mb-1">Data end:</label>
            <input
              type="date"
              value={filters.dataEnd}
              onChange={(e) => setFilters({...filters, dataEnd: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          <div>
            <label className="block text-black font-bold mb-1">Gestiune:</label>
            <select
              value={filters.gestiune}
              onChange={(e) => setFilters({...filters, gestiune: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="toate">Toate gestiunile</option>
              <option value="1">Gestiune Principală</option>
              <option value="2">Gestiune Bar</option>
              <option value="3">Gestiune Bucătărie</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '⏳ Generez...' : '📊 Generează Raport'}
        </button>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-bold text-black mb-2">ℹ️ Despre acest raport</h4>
          <div className="text-sm text-black space-y-1">
            <div>• Afișează diferențele de inventar față de stocul teoretic</div>
            <div>• Calculează pierderile și câștigurile de inventar</div>
            <div>• Generează valorile pentru regularizare contabilă</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapoarteInventarPage;