import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditareRetetePage = () => {
  const [produse, setProduse] = useState([]);
  const [ingrediente, setIngrediente] = useState([]);
  const [materiiPrime, setMateriiPrime] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProdus, setSelectedProdus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMaterial, setAddMaterial] = useState(null);
  const [addCant, setAddCant] = useState('');
  const [addUm, setAddUm] = useState('grame');
  const [editLinie, setEditLinie] = useState(null);
  const [editCant, setEditCant] = useState('');
  const [editUm, setEditUm] = useState('');
  const [searchProduse, setSearchProduse] = useState('');

  useEffect(() => {
    loadProduse();
    loadMateriiPrime();
  }, []);

  useEffect(() => {
    if (selectedProdus) loadIngrediente(selectedProdus.cod_prod);
    else setIngrediente([]);
  }, [selectedProdus]);

  const loadProduse = async () => {
    try {
      const res = await axios.get('/api/extended/produse-pos');
      setProduse(res.data || []);
    } catch (e) {
      console.error('Produse POS:', e);
      setProduse([]);
    }
  };

  const loadMateriiPrime = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMateriiPrime(res.data || []);
    } catch (e) {
      console.error('Materii prime:', e);
      setMateriiPrime([]);
    }
  };

  const loadIngrediente = async (codProd) => {
    if (!codProd) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/magazie/retete/${codProd}`);
      setIngrediente(res.data || []);
    } catch (e) {
      console.error('Ingrediente:', e);
      setIngrediente([]);
    }
    setLoading(false);
  };

  const filteredProduse = produse.filter(
    p => !searchProduse || (p.den_prod || '').toLowerCase().includes(searchProduse.toLowerCase())
  );

  // Gestiune rețetă: Bar (dept 2) → gestiune_id 3, rest → 2 (Bucătărie), ca în aplicația originală Rest_Gest
  const getGestiuneIdForProdus = (produs) => {
    if (!produs) return 2;
    const dept = Number(produs.dept);
    return dept === 2 ? 3 : 2;
  };

  const GESTIUNE_NUME = { 1: 'Depozit', 2: 'Bucătărie', 3: 'Bar' };

  const handleAddIngredient = async () => {
    if (!selectedProdus || !addMaterial) {
      alert('Selectați un produs final și un ingredient.');
      return;
    }
    const cant = parseFloat(addCant);
    if (isNaN(cant) || cant <= 0) {
      alert('Introduceți o cantitate (gramaj) validă.');
      return;
    }
    const gestiuneId = getGestiuneIdForProdus(selectedProdus);
    try {
      await axios.post('/api/magazie/retete', {
        cod_ret: selectedProdus.cod_prod,
        cod_mat: addMaterial.cod,
        denumire: addMaterial.denumire,
        cant,
        um: addUm || 'grame',
        gestiune_id: gestiuneId
      });
      await loadIngrediente(selectedProdus.cod_prod);
      setShowAddModal(false);
      setAddMaterial(null);
      setAddCant('');
      setAddUm('grame');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || 'Eroare la adăugare.');
    }
  };

  const handleUpdateIngredient = async () => {
    if (!editLinie) return;
    const cant = parseFloat(editCant);
    if (isNaN(cant) || cant < 0) {
      alert('Cantitate invalidă.');
      return;
    }
    try {
      await axios.put(`/api/magazie/retete/${editLinie.id}`, {
        cant,
        um: editUm || editLinie.um
      });
      if (selectedProdus) await loadIngrediente(selectedProdus.cod_prod);
      setEditLinie(null);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || 'Eroare la actualizare.');
    }
  };

  const handleDeleteIngredient = async (linie) => {
    if (!confirm(`Ștergeți ingredientul "${linie.denumire_material || linie.denumire}" din rețetă?`)) return;
    try {
      await axios.delete(`/api/magazie/retete/${linie.id}`);
      if (selectedProdus) await loadIngrediente(selectedProdus.cod_prod);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || 'Eroare la ștergere.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full text-black">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black">Editare Rețete</h1>
        <p className="text-black text-sm">Produse finale din vânzări – ingrediente și gramaje scăzute din stoc la vânzare/degustare</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista produse finale (POS) */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">📋 Lista Produse Finale (din vânzări)</h2>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Căutare produs..."
              value={searchProduse}
              onChange={(e) => setSearchProduse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left text-black">
                  <th className="p-3 border-b text-black">Denumire</th>
                  <th className="p-3 border-b text-black">Dept.</th>
                  <th className="p-3 border-b text-black">Preț 1</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduse.map(p => (
                  <tr
                    key={p.cod_prod}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selectedProdus?.cod_prod === p.cod_prod ? 'bg-blue-200' : ''
                    }`}
                    onClick={() => setSelectedProdus(p)}
                  >
                    <td className="p-3 border-b text-black font-bold">{p.den_prod}</td>
                    <td className="p-3 border-b text-black text-center">{p.dept === 2 ? 'Bar' : (p.dept === 1 ? 'Bucătărie' : (p.dept || '-'))}</td>
                    <td className="p-3 border-b text-black text-right">{Number(p.pret1) ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {produse.length === 0 && (
            <div className="p-4 text-center text-gray-500">Nu există produse POS. Adăugați produse în meniu.</div>
          )}
        </div>

        {/* Ingrediente pentru produsul selectat */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">
            Ingrediente (scădere din stoc la vânzare)
            {selectedProdus && ` – ${selectedProdus.den_prod}`}
          </h2>

          {!selectedProdus && (
            <div className="text-center text-gray-500 py-8">Selectați un produs din listă.</div>
          )}

          {selectedProdus && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <span className="text-black text-sm">
                  <strong>Departament:</strong> {selectedProdus.dept === 2 ? 'Bar' : (selectedProdus.dept === 1 ? 'Bucătărie' : selectedProdus.dept ?? '-')}
                  {' · '}
                  <strong>Gestiune rețetă:</strong> {GESTIUNE_NUME[getGestiuneIdForProdus(selectedProdus)]}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
                >
                  + Adaugă ingredient
                </button>
              </div>

              {loading ? (
                <div className="py-6 text-center text-gray-500">Se încarcă...</div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr className="text-left text-black">
                        <th className="p-3 border-b text-black">Ingredient</th>
                        <th className="p-3 border-b text-black">Gramaj</th>
                        <th className="p-3 border-b text-black">U.M.</th>
                        <th className="p-3 border-b text-black">Gest.</th>
                        <th className="p-3 border-b text-black w-24">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingrediente.map(linie => (
                        <tr key={linie.id} className="border-b border-gray-200">
                          <td className="p-3 text-black">{linie.denumire_material || linie.denumire}</td>
                          {editLinie?.id === linie.id ? (
                            <>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editCant}
                                  onChange={(e) => setEditCant(e.target.value)}
                                  className="w-24 px-2 py-1 border rounded text-black"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={editUm}
                                  onChange={(e) => setEditUm(e.target.value)}
                                  className="w-20 px-2 py-1 border rounded text-black"
                                  placeholder="grame"
                                />
                              </td>
                              <td className="p-3 text-black">{GESTIUNE_NUME[linie.gestiune_id] ?? linie.gestiune_id ?? '-'}</td>
                              <td className="p-2">
                                <button onClick={handleUpdateIngredient} className="text-green-600 font-medium mr-1">Salvează</button>
                                <button onClick={() => setEditLinie(null)} className="text-gray-600">Anulare</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-black">{linie.cant}</td>
                              <td className="p-3 text-black">{linie.um || 'grame'}</td>
                              <td className="p-3 text-black">{GESTIUNE_NUME[linie.gestiune_id] ?? linie.gestiune_id ?? '-'}</td>
                              <td className="p-2">
                                <button onClick={() => { setEditLinie(linie); setEditCant(linie.cant); setEditUm(linie.um || 'grame'); }} className="text-blue-600 font-medium mr-1">Editează</button>
                                <button onClick={() => handleDeleteIngredient(linie)} className="text-red-600 font-medium">Șterge</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ingrediente.length === 0 && !loading && (
                    <div className="p-6 text-center text-gray-500">
                      Niciun ingredient. Adăugați ingrediente care se scad din stoc la vânzarea acestui produs.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-6 pt-4 border-t border-gray-300">
            <button type="button" onClick={() => window.history.back?.()} className="px-6 py-2 border-2 border-gray-500 bg-white text-black rounded font-bold hover:bg-gray-100">
              Ieșire
            </button>
          </div>
        </div>
      </div>

      {/* Modal Adaugă ingredient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">Adaugă ingredient (scădere din stoc)</h2>
              <div className="mb-4">
                <label className="block text-black font-bold mb-1">Material / Ingredient</label>
                <select
                  value={addMaterial?.cod ?? ''}
                  onChange={(e) => {
                    const cod = e.target.value ? Number(e.target.value) : null;
                    setAddMaterial(materiiPrime.find(m => m.cod === cod) || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                >
                  <option value="">-- Selectați --</option>
                  {materiiPrime.map(m => (
                    <option key={m.cod} value={m.cod}>{m.denumire} ({m.um})</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-black font-bold mb-1">Gramaj / Cantitate</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={addCant}
                  onChange={(e) => setAddCant(e.target.value)}
                  placeholder="ex: 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              <div className="mb-4">
                <label className="block text-black font-bold mb-1">U.M.</label>
                <input
                  type="text"
                  value={addUm}
                  onChange={(e) => setAddUm(e.target.value)}
                  placeholder="grame, ml, buc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddIngredient} disabled={!addMaterial || !addCant} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 font-medium">
                  Adaugă
                </button>
                <button onClick={() => { setShowAddModal(false); setAddMaterial(null); setAddCant(''); setAddUm('grame'); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Anulare
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditareRetetePage;
