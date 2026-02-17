import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditareProdusePage = () => {
  const [produse, setProduse] = useState([]);
  const [categorii, setCategorii] = useState([]);
  const [departamente, setDepartamente] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProdus, setSelectedProdus] = useState(null);
  const [editForm, setEditForm] = useState({
    cod: '',
    denumire: '',
    departament: null,
    categorie: '',
    pret1: 0,
    pret2: 0,
    pret3: 0,
    tva: 0
  });

  useEffect(() => {
    loadProduse();
    loadCategorii();
    loadDepartamente();
  }, []);

  const loadProduse = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/extended/produse-pos');
      setProduse(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setLoading(false);
  };

  const loadCategorii = async () => {
    try {
      const res = await axios.get('/api/extended/produse-pos/categorii');
      setCategorii(res.data || []);
    } catch (e) {
      console.error('Categorii:', e);
    }
  };

  const loadDepartamente = async () => {
    try {
      const res = await axios.get('/api/departamente');
      setDepartamente(res.data || []);
    } catch (e) {
      console.error('Departamente:', e);
    }
  };

  const handleSelectProdus = (produs) => {
    setSelectedProdus(produs);
    const deptId = produs.dept != null && produs.dept !== '' ? Number(produs.dept) : null;
    setEditForm({
      cod: produs.cod_prod,
      denumire: produs.den_prod,
      departament: deptId || (departamente.length ? departamente[0].id : null),
      categorie: produs.grupa ?? '',
      pret1: Number(produs.pret1) || 0,
      pret2: Number(produs.pret2) || Number(produs.pret1) || 0,
      pret3: Number(produs.pret3) || Number(produs.pret1) || 0,
      tva: produs.tva ?? 19
    });
  };

  const handleSave = async () => {
    if (!selectedProdus) {
      alert('Selectați un produs pentru editare!');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`/api/extended/produse-pos/${editForm.cod}`, {
        den_prod: editForm.denumire,
        dept: editForm.departament != null ? editForm.departament : undefined,
        grupa: editForm.categorie || undefined,
        pret1: editForm.pret1,
        pret2: editForm.pret2,
        pret3: editForm.pret3,
        tva: editForm.tva
      });
      await loadProduse();
      setSelectedProdus({ ...selectedProdus, den_prod: editForm.denumire, dept: editForm.departament, grupa: editForm.categorie, pret1: editForm.pret1, pret2: editForm.pret2, pret3: editForm.pret3 });
      alert(`Produs "${editForm.denumire}" actualizat cu succes!`);
    } catch (err) {
      console.error('Error saving product:', err);
      alert(err.response?.data?.error || 'Eroare la salvare.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">✏️ Editare Produse</h1>
        <p className="text-black">Editarea produselor din meniu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista Produse */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">📋 Lista Produse</h2>
          
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="text-left text-black">
                  <th className="p-3 border-b text-black">Cod</th>
                  <th className="p-3 border-b text-black">Denumire</th>
                  <th className="p-3 border-b text-black">Categorie</th>
                  <th className="p-3 border-b text-black">Dept</th>
                  <th className="p-3 border-b text-black">Preț 1</th>
                </tr>
              </thead>
              <tbody>
                {produse.map(produs => (
                  <tr 
                    key={produs.cod_prod}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selectedProdus?.cod_prod === produs.cod_prod ? 'bg-blue-200' : ''
                    }`}
                    onClick={() => handleSelectProdus(produs)}
                  >
                    <td className="p-3 border-b text-black font-mono">{produs.cod_prod}</td>
                    <td className="p-3 border-b text-black font-bold">{produs.den_prod}</td>
                    <td className="p-3 border-b text-black text-center">{produs.grupa || '–'}</td>
                    <td className="p-3 border-b text-black text-center">{departamente.find(d => d.id === produs.dept)?.denumire ?? produs.dept ?? '–'}</td>
                    <td className="p-3 border-b text-black text-right">{[produs.pret1, produs.pret2 ?? produs.pret1, produs.pret3 ?? produs.pret1].join(' | ')} RON</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Editare */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">🔧 Editare Produs</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-black font-bold mb-1">Cod:</label>
              <input
                type="text"
                value={editForm.cod}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">Denumire:</label>
              <input
                type="text"
                value={editForm.denumire}
                onChange={(e) => setEditForm({...editForm, denumire: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">Categorie (din care face parte produsul):</label>
              <select
                value={categorii.includes(editForm.categorie) ? editForm.categorie : (editForm.categorie ? '__altul__' : '')}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm({ ...editForm, categorie: v === '__altul__' ? (editForm.categorie || '') : v });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              >
                <option value="">-- Selectați categorie --</option>
                {categorii.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__altul__">Altele (introduceți mai jos)</option>
              </select>
              {!categorii.includes(editForm.categorie) && (
                <input
                  type="text"
                  value={editForm.categorie}
                  onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}
                  placeholder="Nume categorie (când alegeți Altele)"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-black"
                />
              )}
            </div>

            <div>
              <label className="block text-black font-bold mb-1">Departament:</label>
              <select
                value={editForm.departament ?? ''}
                onChange={(e) => setEditForm({ ...editForm, departament: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              >
                <option value="">-- Selectați departament --</option>
                {departamente.map((d) => (
                  <option key={d.id} value={d.id}>{d.denumire}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">Preț 1 (principal):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.pret1}
                onChange={(e) => setEditForm({...editForm, pret1: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            <div>
              <label className="block text-black font-bold mb-1">Preț 2:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.pret2}
                onChange={(e) => setEditForm({...editForm, pret2: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            <div>
              <label className="block text-black font-bold mb-1">Preț 3:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.pret3}
                onChange={(e) => setEditForm({...editForm, pret3: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">T.V.A. (%):</label>
              <input
                type="number"
                value={editForm.tva}
                onChange={(e) => setEditForm({...editForm, tva: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!selectedProdus}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 font-bold"
            >
              💾 Salvează Produsul
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditareProdusePage;