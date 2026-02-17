import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RaportFurnizoriPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    data_start: '',
    data_end: ''
  });

  const loadRaport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.data_start) params.set('data_start', filters.data_start);
      if (filters.data_end) params.set('data_end', filters.data_end);
      const res = await axios.get(`/api/rapoarte/furnizori?${params.toString()}`);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRaport();
  }, []);

  const totalValoare = rows.reduce((s, r) => s + (r.total_valoare || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📊 Raport Furnizori</h1>
        <p className="text-black">Total NIR și valoare pe furnizor. Opțional filtrare după perioadă.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-4">🔍 Filtre perioadă (NIR)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-black font-bold mb-1">Data start:</label>
            <input
              type="date"
              value={filters.data_start}
              onChange={(e) => setFilters((f) => ({ ...f, data_start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          <div>
            <label className="block text-black font-bold mb-1">Data end:</label>
            <input
              type="date"
              value={filters.data_end}
              onChange={(e) => setFilters((f) => ({ ...f, data_end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadRaport}
              className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
            >
              Actualizează raport
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-black mb-4">Rezultate</h2>
        {loading ? (
          <p className="text-black">Se încarcă...</p>
        ) : rows.length === 0 ? (
          <p className="text-black">Nu există date pentru raportul furnizori.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-black border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Cod</th>
                    <th className="p-2 border">Denumire furnizor</th>
                    <th className="p-2 border">Reg. com.</th>
                    <th className="p-2 border">Nr. NIR</th>
                    <th className="p-2 border">Total cantitate</th>
                    <th className="p-2 border">Total valoare (RON)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2 border">{r.cod_client || '-'}</td>
                      <td className="p-2 border">{r.denumire}</td>
                      <td className="p-2 border">{r.reg_com || '-'}</td>
                      <td className="p-2 border">{r.nr_nir || 0}</td>
                      <td className="p-2 border">{(r.total_cantitate || 0).toFixed(2)}</td>
                      <td className="p-2 border">{(r.total_valoare || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-black font-bold">
              Total valoare: {totalValoare.toFixed(2)} RON
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default RaportFurnizoriPage;
