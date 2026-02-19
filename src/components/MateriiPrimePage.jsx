import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CULORI_ALERGENI = {
  A01: 'bg-yellow-100 text-yellow-800', A02: 'bg-red-100 text-red-800',
  A03: 'bg-orange-100 text-orange-800', A04: 'bg-blue-100 text-blue-800',
  A05: 'bg-amber-100 text-amber-800', A06: 'bg-green-100 text-green-800',
  A07: 'bg-indigo-100 text-indigo-800', A08: 'bg-stone-100 text-stone-800',
  A09: 'bg-teal-100 text-teal-800', A10: 'bg-purple-100 text-purple-800',
  A11: 'bg-lime-100 text-lime-800', A12: 'bg-gray-100 text-gray-800',
  A13: 'bg-pink-100 text-pink-800', A14: 'bg-cyan-100 text-cyan-800',
};

const UM_OPTIONS = ['Kg', 'Litru', 'grame', 'ml', 'buc', 'portie', 'l', 'g'];

export default function MateriiPrimePage() {
  const [materiiPrime, setMateriiPrime] = useState([]);
  const [alergeniEu, setAlergeniEu] = useState([]);
  const [aditiviComuni, setAditiviComuni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState(null);
  const [materialAlergeni, setMaterialAlergeni] = useState([]);
  const [nextCod, setNextCod] = useState(null);

  const [formData, setFormData] = useState({
    cod: '', denumire: '', um: 'Kg', pret: '', grupa: '1', st_min: '0', tva: '1.11', barcod: ''
  });

  useEffect(() => {
    loadAll();
    axios.get('/api/logistica/alergeni-eu').then(r => setAlergeniEu(r.data || [])).catch(() => {});
    axios.get('/api/logistica/aditivi-comuni').then(r => setAditiviComuni(r.data || [])).catch(() => {});
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/magazie/materii-prime');
      const data = r.data || [];
      setMateriiPrime(data);
      setLoading(false);
      return data;
    } catch (e) {
      console.error(e);
      setLoading(false);
      return [];
    }
  };

  const loadNextCod = async () => {
    try {
      const r = await axios.get('/api/logistica/next-cod-ingredient');
      setNextCod(r.data.next_cod);
      setFormData(prev => ({ ...prev, cod: String(r.data.next_cod) }));
    } catch (e) {
      console.error(e);
    }
  };

  const loadMaterialAlergeni = async (cod) => {
    try {
      const r = await axios.get(`/api/logistica/alergeni/${cod}`);
      setMaterialAlergeni((r.data || []).map(a => a.cod_alergen));
    } catch (e) {
      setMaterialAlergeni([]);
    }
  };

  const selectMaterial = async (m) => {
    setSelectedMaterial(m);
    setEditMode(false);
    await loadMaterialAlergeni(m.cod);
  };

  const handleAutoDetectAlergeni = async (denumire) => {
    if (!denumire) return;
    try {
      const r = await axios.get(`/api/logistica/alergeni-detectie?denumire=${encodeURIComponent(denumire)}`);
      const detectedCods = (r.data || []).map(a => a.cod);
      if (detectedCods.length > 0) {
        setMaterialAlergeni(prev => {
          const merged = new Set([...prev, ...detectedCods]);
          return Array.from(merged);
        });
      }
    } catch (e) { }
  };

  const saveAlergeni = async (codMaterial) => {
    try {
      await axios.post(`/api/logistica/alergeni/${codMaterial}`, { alergeni: materialAlergeni });
      setMessage({ type: 'success', text: '✅ Alergeni salvați!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Eroare la salvare alergeni' });
    }
  };

  const openAddModal = async () => {
    await loadNextCod();
    setFormData(prev => ({ ...prev, denumire: '', um: 'Kg', pret: '', grupa: '1', st_min: '0', tva: '1.11', barcod: '' }));
    setMaterialAlergeni([]);
    setShowAddModal(true);
  };

  const saveMaterial = async () => {
    if (!formData.denumire || !formData.pret) {
      setMessage({ type: 'error', text: 'Denumire și Preț sunt obligatorii!' });
      return;
    }
    try {
      const r = await axios.post('/api/magazie/materii-prime', {
        ...formData,
        cod: formData.cod ? Number(formData.cod) : undefined,
        pret: parseFloat(formData.pret),
        st_min: parseFloat(formData.st_min) || 0,
        tva: parseFloat(formData.tva) || 1.11,
      });
      const codSalvat = r.data.cod;
      if (materialAlergeni.length > 0 && codSalvat) {
        await axios.post(`/api/logistica/alergeni/${codSalvat}`, { alergeni: materialAlergeni });
      }
      setMessage({ type: 'success', text: `✅ Ingredient adăugat cu codul #${codSalvat}` });
      setShowAddModal(false);
      await loadAll();
      setTimeout(() => setMessage(null), 4000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la salvare' });
    }
  };

  const updateMaterial = async () => {
    if (!selectedMaterial || !formData.denumire || !formData.pret) {
      setMessage({ type: 'error', text: 'Denumire și Preț sunt obligatorii!' });
      return;
    }
    try {
      await axios.put(`/api/magazie/materii-prime/${selectedMaterial.cod}`, {
        denumire: formData.denumire,
        um: formData.um,
        pret: parseFloat(formData.pret),
        grupa: formData.grupa,
        st_min: parseFloat(formData.st_min) || 0,
        tva: parseFloat(formData.tva) || 1.11,
        barcod: formData.barcod || null,
      });
      await saveAlergeni(selectedMaterial.cod);
      setEditMode(false);
      const updated = await loadAll();
      await loadMaterialAlergeni(selectedMaterial.cod);
      const found = updated.find(m => m.cod === selectedMaterial.cod);
      if (found) setSelectedMaterial(found);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la actualizare' });
    }
  };

  const deleteMaterial = async (cod) => {
    if (!confirm(`Ștergeți ingredientul cu codul #${cod}?`)) return;
    try {
      await axios.delete(`/api/magazie/materii-prime/${cod}`);
      setSelectedMaterial(null);
      setMaterialAlergeni([]);
      await loadAll();
      setMessage({ type: 'success', text: '✅ Ingredient șters' });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la ștergere' });
    }
  };

  const filteredMaterii = materiiPrime.filter(m =>
    !searchText ||
    (m.denumire || '').toLowerCase().includes(searchText.toLowerCase()) ||
    String(m.cod).includes(searchText)
  );

  const toggleAlergen = (cod) => {
    setMaterialAlergeni(prev => prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-black">🧪 Ingrediente – Materii Prime</h1>
          <p className="text-sm text-gray-700">Gestionare ingrediente cu cod unic automat și detectare alergeni</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium text-sm"
        >
          + Ingredient nou
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista ingrediente */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-black mb-3">Lista ingrediente ({materiiPrime.length})</h2>
          <input
            type="text"
            placeholder="Caută după denumire sau cod..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm mb-3"
          />
          {loading ? (
            <div className="text-center py-6 text-gray-500">Se încarcă...</div>
          ) : (
            <div className="overflow-y-auto max-h-[480px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-black text-xs">Cod</th>
                    <th className="p-2 text-left text-black text-xs">Denumire</th>
                    <th className="p-2 text-left text-black text-xs">U.M.</th>
                    <th className="p-2 text-right text-black text-xs">Preț</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterii.map(m => (
                    <tr
                      key={m.cod}
                      onClick={() => selectMaterial(m)}
                      className={`cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${selectedMaterial?.cod === m.cod ? 'bg-blue-100 font-semibold' : ''}`}
                    >
                      <td className="p-2 font-mono text-xs text-blue-700 font-bold">#{m.cod}</td>
                      <td className="p-2 text-black">{m.denumire}</td>
                      <td className="p-2 text-gray-600">{m.um}</td>
                      <td className="p-2 text-right text-gray-700">{m.pret}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMaterii.length === 0 && (
                <div className="text-center py-6 text-gray-500">Niciun ingredient găsit.</div>
              )}
            </div>
          )}
        </div>

        {/* Detalii ingredient */}
        <div className="bg-white rounded-lg shadow p-4">
          {!selectedMaterial ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🧪</div>
              <p>Selectați un ingredient din lista din stânga.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-black">
                  <span className="font-mono text-blue-700 text-base mr-2">#{selectedMaterial.cod}</span>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.denumire}
                      onChange={e => setFormData(p => ({ ...p, denumire: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-black text-sm"
                    />
                  ) : selectedMaterial.denumire}
                </h2>
                <div className="flex gap-2">
                  {!editMode ? (
                    <>
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setFormData({
                            denumire: selectedMaterial.denumire || '',
                            um: selectedMaterial.um || 'Kg',
                            pret: String(selectedMaterial.pret || ''),
                            grupa: String(selectedMaterial.grupa || '1'),
                            st_min: String(selectedMaterial.st_min || '0'),
                            tva: String(selectedMaterial.tva || '1.11'),
                            barcod: selectedMaterial.barcod || '',
                          });
                        }}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium"
                      >
                        ✏️ Editează
                      </button>
                      <button
                        onClick={() => deleteMaterial(selectedMaterial.cod)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={updateMaterial} className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium">💾 Salvează</button>
                      <button onClick={() => setEditMode(false)} className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">Anulare</button>
                    </>
                  )}
                </div>
              </div>

              {/* Detalii */}
              {!editMode ? (
                <div className="space-y-2 text-sm mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2 rounded"><span className="text-xs text-gray-600">U.M.:</span><br /><strong>{selectedMaterial.um}</strong></div>
                    <div className="bg-gray-50 p-2 rounded"><span className="text-xs text-gray-600">Preț:</span><br /><strong>{selectedMaterial.pret} lei</strong></div>
                    <div className="bg-gray-50 p-2 rounded"><span className="text-xs text-gray-600">Stoc minim:</span><br /><strong>{selectedMaterial.st_min || 0} {selectedMaterial.um}</strong></div>
                    <div className="bg-gray-50 p-2 rounded"><span className="text-xs text-gray-600">TVA:</span><br /><strong>{selectedMaterial.tva}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-600">U.M.</label>
                    <select value={formData.um} onChange={e => setFormData(p => ({ ...p, um: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm">
                      {UM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Preț (lei)</label>
                    <input type="number" step="0.01" value={formData.pret} onChange={e => setFormData(p => ({ ...p, pret: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Stoc minim</label>
                    <input type="number" step="0.01" value={formData.st_min} onChange={e => setFormData(p => ({ ...p, st_min: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">TVA</label>
                    <input type="number" step="0.01" value={formData.tva} onChange={e => setFormData(p => ({ ...p, tva: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                </div>
              )}

              {/* Alergeni */}
              <div className={`p-3 rounded border ${materialAlergeni.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-700">⚠️ Alergeni declarați:</p>
                  {!editMode && (
                    <button
                      onClick={() => handleAutoDetectAlergeni(selectedMaterial.denumire)}
                      className="text-xs px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300 rounded hover:bg-orange-200"
                    >
                      🔍 Auto-detectare
                    </button>
                  )}
                </div>
                {materialAlergeni.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {alergeniEu.filter(a => materialAlergeni.includes(a.cod)).map(a => (
                      <span key={a.cod} className={`px-2 py-0.5 rounded text-xs font-medium ${CULORI_ALERGENI[a.cod] || 'bg-gray-100 text-gray-700'}`}>
                        {a.cod}: {a.denumire}
                        {(editMode) && (
                          <button onClick={() => toggleAlergen(a.cod)} className="ml-1 text-red-500 hover:text-red-700">×</button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">Niciun alergen declarat. Folosiți auto-detectarea sau adăugați manual.</p>
                )}
                {editMode && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Adaugă alergeni:</p>
                    <div className="flex flex-wrap gap-1">
                      {alergeniEu.filter(a => !materialAlergeni.includes(a.cod)).map(a => (
                        <button key={a.cod} onClick={() => toggleAlergen(a.cod)} className="px-2 py-0.5 rounded text-xs border border-gray-300 bg-white hover:bg-orange-50 text-gray-700">
                          + {a.cod}: {a.denumire}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!editMode && materialAlergeni.length > 0 && (
                  <button onClick={() => saveAlergeni(selectedMaterial.cod)} className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mt-1">
                    💾 Salvează alergeni
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal adăugare ingredient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">🆕 Ingredient nou</h2>
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-4 text-sm text-blue-800">
                💡 Codul ingredientului se alocă automat. Puteți modifica dacă doriți un cod specific.
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-24">
                    <label className="text-xs font-semibold text-gray-700">Cod *</label>
                    <input
                      type="number"
                      value={formData.cod}
                      onChange={e => setFormData(p => ({ ...p, cod: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-blue-300 rounded text-black text-sm font-mono bg-blue-50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-700">Denumire *</label>
                    <input
                      type="text"
                      value={formData.denumire}
                      onChange={e => {
                        setFormData(p => ({ ...p, denumire: e.target.value }));
                        handleAutoDetectAlergeni(e.target.value);
                      }}
                      placeholder="ex: Făină albă tip 650"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">U.M. *</label>
                    <select value={formData.um} onChange={e => setFormData(p => ({ ...p, um: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm">
                      {UM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Preț (lei) *</label>
                    <input type="number" step="0.01" value={formData.pret} onChange={e => setFormData(p => ({ ...p, pret: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Stoc minim</label>
                    <input type="number" step="0.01" value={formData.st_min} onChange={e => setFormData(p => ({ ...p, st_min: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Cod bare (opțional)</label>
                    <input type="text" value={formData.barcod} onChange={e => setFormData(p => ({ ...p, barcod: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                </div>

                {/* Alergeni auto-detectați */}
                {materialAlergeni.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-xs font-bold text-orange-800 mb-2">⚠️ Alergeni detectați automat:</p>
                    <div className="flex flex-wrap gap-1">
                      {alergeniEu.filter(a => materialAlergeni.includes(a.cod)).map(a => (
                        <span key={a.cod} className={`px-2 py-0.5 rounded text-xs font-medium ${CULORI_ALERGENI[a.cod] || 'bg-gray-100 text-gray-700'}`}>
                          {a.cod}: {a.denumire}
                          <button onClick={() => toggleAlergen(a.cod)} className="ml-1 text-red-500 hover:text-red-700">×</button>
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Puteți elimina sau adăuga alergeni după salvare din secțiunea de editare.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={saveMaterial} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium text-sm">
                  💾 Salvează ingredient
                </button>
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
                  Anulare
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
