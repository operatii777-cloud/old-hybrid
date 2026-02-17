import React, { useState, useEffect } from 'react';

const JurnalIntrariPage = () => {
  const [loading, setLoading] = useState(false);
  const [intrari, setIntrari] = useState([]);
  const [filters, setFilters] = useState({
    dataStart: new Date().toISOString().split('T')[0],
    dataEnd: new Date().toISOString().split('T')[0],
    furnizor: 'toti',
    tipDocument: 'toate'
  });

  useEffect(() => {
    loadIntrari();
  }, [filters]);

  const loadIntrari = () => {
    // Simulare date jurnal intrări
    setIntrari([
      {
        id: 1,
        data: '2026-02-03',
        document: 'NIR001',
        furnizor: 'SC BAUTURI SRL',
        tip: 'NIR',
        valoare: 2450.50,
        tva: 465.60,
        total: 2916.10
      },
      {
        id: 2,
        data: '2026-02-02',
        document: 'FACT002',
        furnizor: 'SC ALIMENTE SA',
        tip: 'FACTURA',
        valoare: 1230.00,
        tva: 233.70,
        total: 1463.70
      },
      {
        id: 3,
        data: '2026-02-01',
        document: 'NIR003',
        furnizor: 'SC LACTATE SRL',
        tip: 'NIR',
        valoare: 890.25,
        tva: 169.15,
        total: 1059.40
      }
    ]);
  };

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      const totalValoare = intrari.reduce((sum, item) => sum + item.valoare, 0);
      const totalTva = intrari.reduce((sum, item) => sum + item.tva, 0);
      const totalGeneral = intrari.reduce((sum, item) => sum + item.total, 0);
      
      alert(`Jurnal Intrări generat!\n\nPerioadă: ${filters.dataStart} - ${filters.dataEnd}\nTotal intrări: ${intrari.length}\nValoare fără TVA: ${totalValoare.toFixed(2)} RON\nTVA total: ${totalTva.toFixed(2)} RON\nTotal general: ${totalGeneral.toFixed(2)} RON`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📔 Jurnal Intrări</h1>
        <p className="text-black">Jurnalul tuturor intrărilor în gestiune</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-4">🔍 Filtre</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-black font-bold mb-1">Furnizor:</label>
            <select
              value={filters.furnizor}
              onChange={(e) => setFilters({...filters, furnizor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="toti">Toți furnizorii</option>
              <option value="1">SC BAUTURI SRL</option>
              <option value="2">SC ALIMENTE SA</option>
              <option value="3">SC LACTATE SRL</option>
            </select>
          </div>
          <div>
            <label className="block text-black font-bold mb-1">Tip document:</label>
            <select
              value={filters.tipDocument}
              onChange={(e) => setFilters({...filters, tipDocument: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="toate">Toate tipurile</option>
              <option value="nir">NIR</option>
              <option value="factura">Factură</option>
              <option value="aviz">Aviz</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '⏳ Generez...' : '📊 Generează Jurnal'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🖨️ Tipărește
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-black">📋 Jurnalul Intrărilor</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left text-black">
                <th className="p-3 border-b text-black">Data</th>
                <th className="p-3 border-b text-black">Document</th>
                <th className="p-3 border-b text-black">Furnizor</th>
                <th className="p-3 border-b text-black">Tip</th>
                <th className="p-3 border-b text-black">Valoare</th>
                <th className="p-3 border-b text-black">TVA</th>
                <th className="p-3 border-b text-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {intrari.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b text-black">{item.data}</td>
                  <td className="p-3 border-b text-black font-mono">{item.document}</td>
                  <td className="p-3 border-b text-black">{item.furnizor}</td>
                  <td className="p-3 border-b text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.tip === 'NIR' ? 'bg-blue-100 text-blue-800' : 
                      item.tip === 'FACTURA' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.tip}
                    </span>
                  </td>
                  <td className="p-3 border-b text-black text-right font-bold">{item.valoare.toFixed(2)}</td>
                  <td className="p-3 border-b text-black text-right">{item.tva.toFixed(2)}</td>
                  <td className="p-3 border-b text-black text-right font-bold">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-black font-bold text-lg">{intrari.length}</div>
              <div className="text-black">Total intrări</div>
            </div>
            <div className="text-center">
              <div className="text-black font-bold text-lg">
                {intrari.reduce((sum, item) => sum + item.valoare, 0).toFixed(2)} RON
              </div>
              <div className="text-black">Valoare fără TVA</div>
            </div>
            <div className="text-center">
              <div className="text-black font-bold text-lg">
                {intrari.reduce((sum, item) => sum + item.tva, 0).toFixed(2)} RON
              </div>
              <div className="text-black">TVA total</div>
            </div>
            <div className="text-center">
              <div className="text-black font-bold text-lg">
                {intrari.reduce((sum, item) => sum + item.total, 0).toFixed(2)} RON
              </div>
              <div className="text-black">Total general</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JurnalIntrariPage;