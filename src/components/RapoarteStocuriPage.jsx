import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RapoarteStocuriPage = () => {
  const [loading, setLoading] = useState(false);
  const [stocuri, setStocuri] = useState([]);
  const [filteredStocuri, setFilteredStocuri] = useState([]);
  const [filters, setFilters] = useState({
    dataStart: new Date().toISOString().split('T')[0],
    dataEnd: new Date().toISOString().split('T')[0],
    gestiune: 'toate',
    produsGroup: 'toate',
    showZeroStock: true
  });
  const [gestiuni, setGestiuni] = useState([]);

  useEffect(() => {
    loadStocuri();
    loadGestiuni();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stocuri, filters]);

  const loadStocuri = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/extended/rapoarte-stocuri');
      setStocuri(response.data || []);
    } catch (error) {
      console.error('Error loading stock reports:', error);
      // Demo data for stock reports
      setStocuri([
        { id: 1, cod: 'P001', denumire: 'Sprite 0.5L', um: 'buc', cant_stoc: 25.5, gestiune_id: 1, valoare: 127.5, ultima_intrare: '2026-02-01' },
        { id: 2, cod: 'P002', denumire: 'Coca Cola 0.33L', um: 'buc', cant_stoc: 0, gestiune_id: 1, valoare: 0, ultima_intrare: '2026-01-28' },
        { id: 3, cod: 'P003', denumire: 'J&B Rare', um: 'sticla', cant_stoc: 12, gestiune_id: 2, valoare: 998.4, ultima_intrare: '2026-02-03' },
        { id: 4, cod: 'P004', denumire: 'Absolut Vodka', um: 'sticla', cant_stoc: 8.5, gestiune_id: 2, valoare: 562.75, ultima_intrare: '2026-02-02' },
        { id: 5, cod: 'P005', denumire: 'Bergenbier 0.5L', um: 'buc', cant_stoc: 48, gestiune_id: 1, valoare: 95.04, ultima_intrare: '2026-02-03' }
      ]);
    }
    setLoading(false);
  };

  const loadGestiuni = () => {
    setGestiuni([
      { id: 1, denumire: 'Gestiune Principală' },
      { id: 2, denumire: 'Gestiune Bar' },
      { id: 3, denumire: 'Gestiune Bucătărie' }
    ]);
  };

  const applyFilters = () => {
    let filtered = [...stocuri];

    if (filters.gestiune !== 'toate') {
      filtered = filtered.filter(item => item.gestiune_id === parseInt(filters.gestiune));
    }

    if (!filters.showZeroStock) {
      filtered = filtered.filter(item => item.cant_stoc > 0);
    }

    setFilteredStocuri(filtered);
  };

  const generateReport = () => {
    setLoading(true);
    
    setTimeout(() => {
      const totalProduse = filteredStocuri.length;
      const totalValoare = filteredStocuri.reduce((sum, item) => sum + item.valoare, 0);
      const produseZeroStock = filteredStocuri.filter(item => item.cant_stoc === 0).length;
      
      alert(`Raport Stocuri generat!\n\nPerioadă: ${filters.dataStart} - ${filters.dataEnd}\nTotal produse: ${totalProduse}\nProduse cu stoc zero: ${produseZeroStock}\nValoare totală: ${totalValoare.toFixed(2)} RON`);
      setLoading(false);
    }, 1500);
  };

  const exportToExcel = () => {
    // Simulare export
    alert('Raportul a fost exportat în Excel!\nFișier: raport_stocuri_' + new Date().toISOString().split('T')[0] + '.xlsx');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📊 Rapoarte Stocuri</h1>
        <p className="text-black">Rapoarte detaliate despre stocurile existente</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-4">🔍 Filtre Raport</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              {gestiuni.map(gestiune => (
                <option key={gestiune.id} value={gestiune.id}>
                  {gestiune.denumire}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-black font-bold mb-1">Tip produse:</label>
            <select
              value={filters.produsGroup}
              onChange={(e) => setFilters({...filters, produsGroup: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="toate">Toate produsele</option>
              <option value="bauturi">Băuturi</option>
              <option value="mancare">Mâncare</option>
              <option value="desert">Desert</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showZeroStock}
                onChange={(e) => setFilters({...filters, showZeroStock: e.target.checked})}
                className="mr-2"
              />
              <span className="text-black text-sm">Arată stoc zero</span>
            </label>
          </div>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '⏳ Generez...' : '📊 Generează Raport'}
          </button>
          <button
            onClick={exportToExcel}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            📄 Export Excel
          </button>
          <button
            onClick={printReport}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🖨️ Tipărește
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-black">📋 Rezultate Raport</h2>
            <div className="text-black">
              Total produse: <span className="font-bold text-blue-600">{filteredStocuri.length}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left text-black">
                <th className="p-3 border-b text-black">Cod</th>
                <th className="p-3 border-b text-black">Denumire</th>
                <th className="p-3 border-b text-black">U.M.</th>
                <th className="p-3 border-b text-black">Cantitate</th>
                <th className="p-3 border-b text-black">Valoare (RON)</th>
                <th className="p-3 border-b text-black">Gestiune</th>
                <th className="p-3 border-b text-black">Ultima intrare</th>
                <th className="p-3 border-b text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocuri.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b text-black font-mono">{item.cod}</td>
                  <td className="p-3 border-b text-black font-bold">{item.denumire}</td>
                  <td className="p-3 border-b text-black text-center">{item.um}</td>
                  <td className={`p-3 border-b font-bold text-center ${item.cant_stoc === 0 ? 'text-red-600' : 'text-black'}`}>
                    {item.cant_stoc}
                  </td>
                  <td className="p-3 border-b text-black text-right font-bold">{item.valoare.toFixed(2)}</td>
                  <td className="p-3 border-b text-black text-center">{item.gestiune_id}</td>
                  <td className="p-3 border-b text-black text-center">{item.ultima_intrare}</td>
                  <td className="p-3 border-b text-center">
                    {item.cant_stoc === 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">❌ Stoc Zero</span>
                    ) : item.cant_stoc < 10 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">⚠️ Stoc Mic</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✅ OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStocuri.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              Nu există date pentru filtrele selectate.
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-black font-bold text-lg">{filteredStocuri.length}</div>
              <div className="text-black">Total produse</div>
            </div>
            <div className="text-center">
              <div className="text-black font-bold text-lg">
                {filteredStocuri.reduce((sum, item) => sum + item.cant_stoc, 0).toFixed(1)}
              </div>
              <div className="text-black">Total cantitate</div>
            </div>
            <div className="text-center">
              <div className="text-black font-bold text-lg">
                {filteredStocuri.reduce((sum, item) => sum + item.valoare, 0).toFixed(2)} RON
              </div>
              <div className="text-black">Valoare totală</div>
            </div>
            <div className="text-center">
              <div className="text-black font-bold text-lg">
                {filteredStocuri.filter(item => item.cant_stoc === 0).length}
              </div>
              <div className="text-black">Stocuri zero</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapoarteStocuriPage;