import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FacturiPage = () => {
  const [facturi, setFacturi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    data_start: '',
    data_end: '',
    anaf_status: ''
  });
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadFacturi = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.data_start) params.set('data_start', filters.data_start);
      if (filters.data_end) params.set('data_end', filters.data_end);
      if (filters.anaf_status) params.set('anaf_status', filters.anaf_status);
      params.set('limit', '100');
      const res = await axios.get(`/api/ubl/facturi?${params.toString()}`);
      setFacturi(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setFacturi([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacturi();
  }, []);

  const viewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/ubl/facturi/${id}`);
      setSelectedFactura(res.data);
    } catch (e) {
      console.error(e);
      setSelectedFactura(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalGeneral = facturi.reduce((s, f) => s + (f.total_cu_tva || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📄 Gestionare Facturi</h1>
        <p className="text-black">Lista facturi UBL / electronică. Filtrare după dată și status ANAF.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-4">🔍 Filtre</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-black font-bold mb-1">Status ANAF:</label>
            <select
              value={filters.anaf_status}
              onChange={(e) => setFilters((f) => ({ ...f, anaf_status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            >
              <option value="">Toate</option>
              <option value="draft">Draft</option>
              <option value="sent">Trimis</option>
              <option value="accepted">Acceptat</option>
              <option value="rejected">Respins</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadFacturi}
              className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
            >
              Actualizează
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-black mb-4">Listă facturi</h2>
        {loading ? (
          <p className="text-black">Se încarcă...</p>
        ) : facturi.length === 0 ? (
          <p className="text-black">Nu există facturi pentru filtrele selectate.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-black border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Nr. factură</th>
                    <th className="p-2 border">Data</th>
                    <th className="p-2 border">Client</th>
                    <th className="p-2 border">Total cu TVA (RON)</th>
                    <th className="p-2 border">Status ANAF</th>
                    <th className="p-2 border">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {facturi.map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="p-2 border">{f.numar_factura || f.serie_factura}</td>
                      <td className="p-2 border">{f.data_emitere}</td>
                      <td className="p-2 border">{f.client_nume || '-'}</td>
                      <td className="p-2 border">{(f.total_cu_tva || 0).toFixed(2)}</td>
                      <td className="p-2 border">{f.anaf_status || 'draft'}</td>
                      <td className="p-2 border">
                        <button
                          type="button"
                          onClick={() => viewDetail(f.id)}
                          className="text-blue-600 hover:underline"
                        >
                          Detalii
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-black font-bold">
              Total general: {totalGeneral.toFixed(2)} RON ({facturi.length} facturi)
            </p>
          </>
        )}
      </div>

      {selectedFactura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">Factură {selectedFactura.numar_factura}</h3>
              <button
                type="button"
                onClick={() => setSelectedFactura(null)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-black"
              >
                Închide
              </button>
            </div>
            {detailLoading ? (
              <p className="text-black">Se încarcă...</p>
            ) : (
              <div className="text-black space-y-2">
                <p><strong>Client:</strong> {selectedFactura.client_nume}</p>
                <p><strong>Data emitere:</strong> {selectedFactura.data_emitere}</p>
                <p><strong>Subtotal fără TVA:</strong> {(selectedFactura.subtotal_fara_tva || 0).toFixed(2)} RON</p>
                <p><strong>TVA:</strong> {(selectedFactura.total_tva || 0).toFixed(2)} RON</p>
                <p><strong>Total cu TVA:</strong> {(selectedFactura.total_cu_tva || 0).toFixed(2)} RON</p>
                <p><strong>Status ANAF:</strong> {selectedFactura.anaf_status || 'draft'}</p>
                {selectedFactura.linii && selectedFactura.linii.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold">Linii factură:</h4>
                    <ul className="list-disc pl-6">
                      {selectedFactura.linii.map((l, i) => (
                        <li key={i}>{l.denumire} – {l.cantitate} x {(l.pret_unitar_fara_tva || 0).toFixed(2)} = {(l.valoare_cu_tva || l.valoare_fara_tva || 0).toFixed(2)} RON</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturiPage;
