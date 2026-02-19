import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TIP_MISCARE_CULORI = {
  NIR: 'bg-green-100 text-green-800',
  DESCARCARE: 'bg-red-100 text-red-800',
  TRANSFER: 'bg-blue-100 text-blue-800',
  RETUR: 'bg-yellow-100 text-yellow-800',
  INVENTAR: 'bg-purple-100 text-purple-800',
  CONSUM: 'bg-orange-100 text-orange-800',
};

export default function TrasabilitatePage() {
  const [materiiPrime, setMateriiPrime] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [miscare, setMiscare] = useState([]);
  const [reteteFolositIn, setReteteFolositIn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeView, setActiveView] = useState('miscare');

  useEffect(() => {
    axios.get('/api/magazie/materii-prime')
      .then(r => setMateriiPrime(r.data || []))
      .catch(() => {});
  }, []);

  const loadTrasabilitate = async (material) => {
    setSelectedMaterial(material);
    setLoading(true);
    setMiscare([]);
    setReteteFolositIn([]);
    try {
      const [miscareRes, retetRes] = await Promise.all([
        axios.get(`/api/logistica/trasabilitate/${material.cod}`),
        axios.get(`/api/logistica/trasabilitate-retete/${material.cod}`),
      ]);
      setMiscare(miscareRes.data || []);
      setReteteFolositIn(retetRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredMaterii = materiiPrime.filter(m =>
    !searchText ||
    (m.denumire || '').toLowerCase().includes(searchText.toLowerCase()) ||
    String(m.cod).includes(searchText)
  );

  const totalIntrat = miscare.filter(m => ['NIR', 'RETUR'].includes(m.tip_miscare)).reduce((s, m) => s + (m.cantitate || 0), 0);
  const totalIesit = miscare.filter(m => ['DESCARCARE', 'CONSUM', 'TRANSFER'].includes(m.tip_miscare)).reduce((s, m) => s + (m.cantitate || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black">🔍 Trasabilitate Ingrediente</h1>
        <p className="text-sm text-gray-700">Urmărire completă a mișcărilor fiecărui ingredient – de la aprovizionare la consum</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista ingrediente */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-black mb-3">Ingrediente / Materii prime</h2>
          <input
            type="text"
            placeholder="Caută ingredient sau cod..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm mb-3"
          />
          <div className="overflow-y-auto max-h-[500px] space-y-1">
            {filteredMaterii.map(m => (
              <button
                key={m.cod}
                onClick={() => loadTrasabilitate(m)}
                className={`w-full text-left px-3 py-2 text-sm rounded border transition-colors ${
                  selectedMaterial?.cod === m.cod
                    ? 'bg-blue-200 border-blue-400 font-bold text-blue-900'
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-50 text-black'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.denumire}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">#{m.cod}</span>
                </div>
                <div className="text-xs text-gray-500">{m.um}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalii trasabilitate */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedMaterial ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p>Selectați un ingredient din lista din stânga pentru a vedea istoricul complet al mișcărilor.</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Se încarcă...</div>
          ) : (
            <>
              {/* Header ingredient */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold text-black">{selectedMaterial.denumire}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
                  <span>Cod: <strong className="font-mono text-blue-700">#{selectedMaterial.cod}</strong></span>
                  <span>U.M.: <strong>{selectedMaterial.um}</strong></span>
                  {selectedMaterial.pret > 0 && <span>Preț: <strong>{selectedMaterial.pret}</strong> lei</span>}
                </div>
                <div className="flex gap-4 mt-3">
                  <div className="flex-1 bg-green-50 border border-green-200 rounded p-2 text-center">
                    <p className="text-xs text-green-700 font-semibold">Total intrat</p>
                    <p className="text-lg font-bold text-green-800">{totalIntrat.toFixed(2)} {selectedMaterial.um}</p>
                  </div>
                  <div className="flex-1 bg-red-50 border border-red-200 rounded p-2 text-center">
                    <p className="text-xs text-red-700 font-semibold">Total ieșit</p>
                    <p className="text-lg font-bold text-red-800">{totalIesit.toFixed(2)} {selectedMaterial.um}</p>
                  </div>
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-2 text-center">
                    <p className="text-xs text-blue-700 font-semibold">Folosit în</p>
                    <p className="text-lg font-bold text-blue-800">{reteteFolositIn.length} rețete</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('miscare')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeView === 'miscare' ? 'bg-blue-600 text-white' : 'bg-white text-black border border-gray-300 hover:bg-blue-50'}`}
                >
                  📦 Istoric mișcări
                </button>
                <button
                  onClick={() => setActiveView('retete')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeView === 'retete' ? 'bg-blue-600 text-white' : 'bg-white text-black border border-gray-300 hover:bg-blue-50'}`}
                >
                  🍽️ Folosit în rețete ({reteteFolositIn.length})
                </button>
              </div>

              {activeView === 'miscare' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {miscare.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>Nu există mișcări înregistrate pentru acest ingredient.</p>
                      <p className="text-xs mt-1">Mișcările se înregistrează automat la NIR, descărcare și transfer.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-left text-black">Data</th>
                            <th className="p-3 text-left text-black">Tip</th>
                            <th className="p-3 text-right text-black">Cantitate</th>
                            <th className="p-3 text-left text-black">U.M.</th>
                            <th className="p-3 text-left text-black">Gestiune</th>
                            <th className="p-3 text-left text-black">Furnizor</th>
                            <th className="p-3 text-left text-black">Lot/Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {miscare.map(m => (
                            <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 text-gray-600 text-xs whitespace-nowrap">
                                {m.data_miscare ? new Date(m.data_miscare).toLocaleDateString('ro-RO') : '–'}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIP_MISCARE_CULORI[m.tip_miscare] || 'bg-gray-100 text-gray-700'}`}>
                                  {m.tip_miscare}
                                </span>
                              </td>
                              <td className={`p-3 text-right font-medium ${['NIR','RETUR'].includes(m.tip_miscare) ? 'text-green-700' : 'text-red-700'}`}>
                                {['NIR','RETUR'].includes(m.tip_miscare) ? '+' : '-'}{Math.abs(m.cantitate).toFixed(3)}
                              </td>
                              <td className="p-3 text-gray-600">{m.um || '–'}</td>
                              <td className="p-3 text-gray-600">{m.gestiune_nume || '–'}</td>
                              <td className="p-3 text-gray-600 text-xs">{m.furnizor_name || '–'}</td>
                              <td className="p-3 text-gray-500 text-xs">{m.lot || m.nota || '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'retete' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {reteteFolositIn.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Ingredientul nu este folosit în nicio rețetă.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-left text-black">Produs final</th>
                            <th className="p-3 text-right text-black">Cantitate în rețetă</th>
                            <th className="p-3 text-left text-black">U.M.</th>
                            <th className="p-3 text-left text-black">Departament</th>
                            <th className="p-3 text-right text-black">Preț vânzare</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reteteFolositIn.map(r => (
                            <tr key={r.cod_ret} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 text-black font-medium">{r.den_prod || `Produs cod ${r.cod_ret}`}</td>
                              <td className="p-3 text-right text-black font-bold">{r.cant}</td>
                              <td className="p-3 text-gray-600">{r.um}</td>
                              <td className="p-3 text-gray-600">{r.dept === 2 ? 'Bar' : r.dept === 1 ? 'Bucătărie' : '–'}</td>
                              <td className="p-3 text-right text-gray-700">{r.pret1 ? `${r.pret1} lei` : '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
