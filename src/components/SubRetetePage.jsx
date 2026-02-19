import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SubRetetePage() {
  const [subRetete, setSubRetete] = useState([]);
  const [materiiPrime, setMateriiPrime] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({ denumire: '', um: 'portie', cantitate_rezultata: '1', gestiune_id: '2', nota: '' });
  const [ingForm, setIngForm] = useState({ cod_mat: '', cant: '', um: 'grame' });
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadAll();
    axios.get('/api/magazie/materii-prime').then(r => setMateriiPrime(r.data || [])).catch(() => {});
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/logistica/sub-retete');
      setSubRetete(r.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadSub = async (sub) => {
    try {
      const r = await axios.get(`/api/logistica/sub-retete/${sub.cod_sub_ret}`);
      setSelectedSub(r.data);
    } catch (e) {
      setSelectedSub(sub);
    }
  };

  const saveSub = async () => {
    if (!formData.denumire) {
      setMessage({ type: 'error', text: 'Denumirea este obligatorie!' });
      return;
    }
    try {
      const r = await axios.post('/api/logistica/sub-retete', {
        ...formData,
        cantitate_rezultata: parseFloat(formData.cantitate_rezultata) || 1,
        gestiune_id: parseInt(formData.gestiune_id) || 2,
      });
      setMessage({ type: 'success', text: `✅ Sub-rețetă creată cu codul #${r.data.cod_sub_ret}` });
      setShowAddModal(false);
      setFormData({ denumire: '', um: 'portie', cantitate_rezultata: '1', gestiune_id: '2', nota: '' });
      await loadAll();
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la salvare' });
    }
  };

  const addIngredient = async () => {
    if (!selectedSub || !ingForm.cod_mat || !ingForm.cant) {
      setMessage({ type: 'error', text: 'Selectați ingredientul și introduceți cantitatea.' });
      return;
    }
    const mat = materiiPrime.find(m => m.cod === Number(ingForm.cod_mat));
    try {
      await axios.post(`/api/logistica/sub-retete/${selectedSub.cod_sub_ret}/ingrediente`, {
        cod_mat: Number(ingForm.cod_mat),
        denumire: mat?.denumire || '',
        cant: parseFloat(ingForm.cant),
        um: ingForm.um || 'grame',
      });
      setMessage({ type: 'success', text: '✅ Ingredient adăugat!' });
      setShowAddIngredient(false);
      setIngForm({ cod_mat: '', cant: '', um: 'grame' });
      await loadSub(selectedSub);
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la adăugare' });
    }
  };

  const deleteIngredient = async (id) => {
    if (!confirm('Ștergeți ingredientul din sub-rețetă?')) return;
    try {
      await axios.delete(`/api/logistica/sub-retete-ingrediente/${id}`);
      if (selectedSub) await loadSub(selectedSub);
    } catch (e) {
      alert('Eroare la ștergere');
    }
  };

  const deleteSub = async (cod) => {
    if (!confirm('Dezactivați sub-rețeta?')) return;
    try {
      await axios.delete(`/api/logistica/sub-retete/${cod}`);
      setSelectedSub(null);
      await loadAll();
    } catch (e) {
      alert('Eroare');
    }
  };

  const filtered = subRetete.filter(s =>
    !searchText || (s.denumire || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const GESTIUNI = { 1: 'Depozit', 2: 'Bucătărie', 3: 'Bar' };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-black">🥘 Sub-Rețete (Semi-Preparate)</h1>
          <p className="text-sm text-gray-700">Rețete intermediare (sosuri, creme, baze) care pot fi componente în alte rețete</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium text-sm"
        >
          + Sub-rețetă nouă
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista sub-rețete */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-black mb-3">Lista Sub-Rețete ({subRetete.length})</h2>
          <input
            type="text"
            placeholder="Caută sub-rețetă..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm mb-3"
          />
          {loading ? (
            <div className="text-center py-6 text-gray-500">Se încarcă...</div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[480px]">
              {filtered.map(s => (
                <button
                  key={s.cod_sub_ret}
                  onClick={() => loadSub(s)}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                    selectedSub?.cod_sub_ret === s.cod_sub_ret
                      ? 'bg-blue-200 border-blue-400 font-bold text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-blue-50 text-black'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{s.denumire}</span>
                    <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded font-mono">#{s.cod_sub_ret}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.cantitate_rezultata} {s.um} · {GESTIUNI[s.gestiune_id] || 'Gest. ' + s.gestiune_id}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nicio sub-rețetă. Creați una folosind butonul de mai sus.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalii sub-rețetă */}
        <div className="bg-white rounded-lg shadow p-4">
          {!selectedSub ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🥘</div>
              <p>Selectați o sub-rețetă din lista din stânga.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-lg font-bold text-black">{selectedSub.denumire}</h2>
                  <p className="text-sm text-gray-600">
                    Cod: <strong className="font-mono text-blue-700">#{selectedSub.cod_sub_ret}</strong> ·
                    Cantitate rezultată: <strong>{selectedSub.cantitate_rezultata} {selectedSub.um}</strong> ·
                    {GESTIUNI[selectedSub.gestiune_id] || 'Gestiune ' + selectedSub.gestiune_id}
                  </p>
                  {selectedSub.nota && <p className="text-xs text-gray-500 mt-1">📝 {selectedSub.nota}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddIngredient(true)} className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium">+ Ingredient</button>
                  <button onClick={() => deleteSub(selectedSub.cod_sub_ret)} className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs">🗑️</button>
                </div>
              </div>

              {showAddIngredient && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                  <h4 className="text-sm font-bold text-black mb-2">Adaugă ingredient în sub-rețetă</h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-3">
                      <select
                        value={ingForm.cod_mat}
                        onChange={e => {
                          const m = materiiPrime.find(m => m.cod === Number(e.target.value));
                          setIngForm(p => ({ ...p, cod_mat: e.target.value, um: m?.um || 'grame' }));
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm"
                      >
                        <option value="">-- Selectați ingredientul --</option>
                        {materiiPrime.map(m => (
                          <option key={m.cod} value={m.cod}>[#{m.cod}] {m.denumire} ({m.um})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input type="number" step="0.01" placeholder="Cantitate" value={ingForm.cant} onChange={e => setIngForm(p => ({ ...p, cant: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                    </div>
                    <div>
                      <input type="text" placeholder="U.M." value={ingForm.um} onChange={e => setIngForm(p => ({ ...p, um: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addIngredient} className="flex-1 px-2 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium">Adaugă</button>
                      <button onClick={() => { setShowAddIngredient(false); setIngForm({ cod_mat: '', cant: '', um: 'grame' }); }} className="flex-1 px-2 py-1.5 bg-gray-500 text-white rounded text-xs">Anulare</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ingrediente sub-rețetă */}
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left text-black text-xs">Ingredient</th>
                      <th className="p-2 text-right text-black text-xs">Cantitate</th>
                      <th className="p-2 text-left text-black text-xs">U.M.</th>
                      <th className="p-2 text-center text-black text-xs w-16">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSub.ingrediente || []).map(ing => (
                      <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 text-black">{ing.denumire_material || ing.denumire}</td>
                        <td className="p-2 text-right text-black font-bold">{ing.cant}</td>
                        <td className="p-2 text-gray-600">{ing.um}</td>
                        <td className="p-2 text-center">
                          <button onClick={() => deleteIngredient(ing.id)} className="text-red-500 hover:text-red-700 text-xs">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!selectedSub.ingrediente || selectedSub.ingrediente.length === 0) && (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    Niciun ingredient adăugat. Folosiți butonul "Ingredient" pentru a adăuga.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal adăugare sub-rețetă */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">🆕 Sub-rețetă nouă</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Denumire *</label>
                  <input
                    type="text"
                    value={formData.denumire}
                    onChange={e => setFormData(p => ({ ...p, denumire: e.target.value }))}
                    placeholder="ex: Sos béchamel, Marinadă pui, Cremă patiserie..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Cantitate rezultată</label>
                    <input type="number" step="0.1" value={formData.cantitate_rezultata} onChange={e => setFormData(p => ({ ...p, cantitate_rezultata: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">U.M. rezultat</label>
                    <input type="text" value={formData.um} onChange={e => setFormData(p => ({ ...p, um: e.target.value }))} placeholder="portie, kg, litri..." className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Gestiune</label>
                  <select value={formData.gestiune_id} onChange={e => setFormData(p => ({ ...p, gestiune_id: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm">
                    <option value="1">Depozit</option>
                    <option value="2">Bucătărie</option>
                    <option value="3">Bar</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Note / Instrucțiuni (opțional)</label>
                  <textarea rows={2} value={formData.nota} onChange={e => setFormData(p => ({ ...p, nota: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveSub} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium text-sm">💾 Creează sub-rețetă</button>
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Anulare</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
