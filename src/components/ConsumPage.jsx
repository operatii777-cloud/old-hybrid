import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConsumPage = () => {
  const [consumData, setConsumData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dataStart: '2026-02-01',
    dataEnd: '2026-02-03',
    gestiune: 'Toate',
    grupaProdus: 'Toate'
  });

  useEffect(() => {
    loadConsumData();
  }, [filters]);

  const loadConsumData = async () => {
    setLoading(true);
    try {
      // Simulare date consum
      setConsumData([
        {
          id: 1,
          produs: 'CAFEA',
          um: 'Kg',
          stocInitial: 100,
          intrari: 0,
          consum: 10,
          stocFinal: 90,
          valoareConsum: 250.00,
          gestiune: 'BAR'
        },
        {
          id: 2,
          produs: 'ZAHAR',
          um: 'Kg',
          stocInitial: 50,
          intrari: 10,
          consum: 15,
          stocFinal: 45,
          valoareConsum: 45.50,
          gestiune: 'BAR'
        },
        {
          id: 3,
          produs: 'LAPTE',
          um: 'Litru',
          stocInitial: 20,
          intrari: 30,
          consum: 25,
          stocFinal: 25,
          valoareConsum: 87.50,
          gestiune: 'BUCATARIE'
        }
      ]);
    } catch (error) {
      console.error('Error loading consum data:', error);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('Export CSV - Funcționalitate în dezvoltare');
  };

  const totalConsum = consumData.reduce((sum, item) => sum + item.valoareConsum, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📊 Raport Consum</h1>
        <p className="text-black">Analiza consumului de materii prime pe perioadă</p>
      </div>

      {/* Filtre */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-4">🔍 Filtre Raport</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-black font-bold mb-2">Data Start:</label>
            <input
              type="date"
              value={filters.dataStart}
              onChange={(e) => setFilters({...filters, dataStart: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          
          <div>
            <label className="block text-black font-bold mb-2">Data End:</label>
            <input
              type="date"
              value={filters.dataEnd}
              onChange={(e) => setFilters({...filters, dataEnd: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          
          <div>
            <label className="block text-black font-bold mb-2">Gestiune:</label>
            <select
              value={filters.gestiune}
              onChange={(e) => setFilters({...filters, gestiune: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            >
              <option value="Toate">Toate</option>
              <option value="BAR">BAR</option>
              <option value="BUCATARIE">BUCATARIE</option>
              <option value="MAGAZIE">MAGAZIE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-black font-bold mb-2">Grupa Produs:</label>
            <select
              value={filters.grupaProdus}
              onChange={(e) => setFilters({...filters, grupaProdus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            >
              <option value="Toate">Toate</option>
              <option value="CAFEA">CAFEA</option>
              <option value="BAUTURI">BAUTURI</option>
              <option value="DIVERSE">DIVERSE</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={loadConsumData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '⏳ Se încarcă...' : '🔄 Actualizează'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            🖨️ Tipărește
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Tabelul Principal */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-black">📋 Raport Consum Detaliat</h2>
          <p className="text-black text-sm">Perioada: {filters.dataStart} - {filters.dataEnd}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left text-black">
                <th className="p-3 border-b text-black">Produs</th>
                <th className="p-3 border-b text-black">U.M.</th>
                <th className="p-3 border-b text-black">Stoc Inicial</th>
                <th className="p-3 border-b text-black">Intrări</th>
                <th className="p-3 border-b text-black">Consum</th>
                <th className="p-3 border-b text-black">Stoc Final</th>
                <th className="p-3 border-b text-black">Valoare Consum</th>
                <th className="p-3 border-b text-black">Gestiune</th>
              </tr>
            </thead>
            <tbody>
              {consumData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b text-black font-bold">{item.produs}</td>
                  <td className="p-3 border-b text-black text-center">{item.um}</td>
                  <td className="p-3 border-b text-black text-right">{item.stocInitial}</td>
                  <td className="p-3 border-b text-black text-right text-green-600 font-bold">+{item.intrari}</td>
                  <td className="p-3 border-b text-black text-right text-red-600 font-bold">-{item.consum}</td>
                  <td className="p-3 border-b text-black text-right">{item.stocFinal}</td>
                  <td className="p-3 border-b text-black text-right font-bold">{item.valoareConsum.toFixed(2)} RON</td>
                  <td className="p-3 border-b text-black text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {item.gestiune}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="font-bold text-black">
                <td colSpan="6" className="p-3 border-b text-black text-right">TOTAL CONSUM:</td>
                <td className="p-3 border-b text-black text-right font-bold text-lg">{totalConsum.toFixed(2)} RON</td>
                <td className="p-3 border-b"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Statistici Resume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{consumData.length}</div>
          <div className="text-black">Produse Consumate</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">{totalConsum.toFixed(0)} RON</div>
          <div className="text-black">Valoare Totală Consum</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{consumData.reduce((sum, item) => sum + item.consum, 0)}</div>
          <div className="text-black">Cantitate Totală Consumată</div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-bold text-black mb-2">ℹ️ Informații Raport Consum</h4>
        <div className="text-sm text-black space-y-1">
          <div>• <strong>Stoc Inicial:</strong> Cantitatea disponibilă la începutul perioadei</div>
          <div>• <strong>Intrări:</strong> Cantitățile primite în perioada selectată (NIR-uri, transferuri)</div>
          <div>• <strong>Consum:</strong> Cantitatea utilizată în producție sau vândută</div>
          <div>• <strong>Stoc Final:</strong> Cantitatea rămasă la sfârșitul perioadei</div>
          <div>• <strong>Valoare Consum:</strong> Valoarea în RON a cantității consumate</div>
        </div>
      </div>
    </div>
  );
};

export default ConsumPage;