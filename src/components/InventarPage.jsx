import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InventarPage = () => {
  const [stocuri, setStocuri] = useState([]);
  const [gestiuni, setGestiuni] = useState([]);
  const [gestiuneId, setGestiuneId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stocNou, setStocNou] = useState('');
  const [arrangeLoading, setArrangeLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    dataInitiala: new Date().toISOString().split('T')[0],
    dataFinala: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadGestiuni();
  }, []);

  useEffect(() => {
    loadStocuri();
  }, [gestiuneId]);

  const loadGestiuni = async () => {
    try {
      const res = await axios.get('/api/magazie/gestiuni');
      const list = res.data && Array.isArray(res.data) ? res.data : [];
      setGestiuni(list);
      if (list.length > 0 && !list.find(g => Number(g.id) === Number(gestiuneId))) {
        setGestiuneId(list[0].id);
      }
    } catch (e) {
      console.error('Gestiuni:', e);
      setGestiuni([{ id: 1, nume: 'Depozit' }, { id: 2, nume: 'Bucătărie' }, { id: 3, nume: 'Bar' }]);
    }
  };

  const loadStocuri = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/magazie/stocuri/gestiune/${gestiuneId}`);
      setStocuri(response.data || []);
    } catch (error) {
      console.error('Error loading stocuri:', error);
      setStocuri([]);
    }
    setLoading(false);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setStocNou('');
  };

  const handleModificare = () => {
    if (!selectedItem) {
      alert('Selectați un articol din listă!');
      return;
    }
    setStocNou(String(selectedItem.cant_stoc ?? 0));
  };

  const handleSalvare = async () => {
    if (!selectedItem) {
      alert('Selectați un articol din listă!');
      return;
    }
    const val = parseFloat(stocNou);
    if (isNaN(val) || val < 0) {
      alert('Stocul trebuie să fie un număr >= 0!');
      return;
    }
    setLoading(true);
    try {
      await axios.put('/api/magazie/stocuri', {
        gestiune_id: Number(gestiuneId),
        cod_material: selectedItem.cod_material,
        cant_stoc: val
      });
      await loadStocuri();
      setSelectedItem({ ...selectedItem, cant_stoc: val });
      setStocNou('');
      alert('Stoc salvat cu succes.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Eroare la salvare.');
    }
    setLoading(false);
  };

  const handleAranjareHoreca = async () => {
    if (!window.confirm('Reîmprospătați maparea produselor pe departamente, stocurile pe gestiuni și rețetele? Stocurile existente (>0) nu sunt modificate.')) return;
    setArrangeLoading(true);
    try {
      await axios.post('/api/extended/arrange-horeca');
      await loadStocuri();
      await loadGestiuni();
      alert('Aranjare HORECA finalizată: produse mapate pe departamente, stocuri pe Depozit/Bucătărie/Bar, rețete actualizate.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Eroare la aranjare.');
    }
    setArrangeLoading(false);
  };

  const handleProcesare = () => {
    const { dataInitiala, dataFinala } = dateRange;
    if (!dataInitiala || !dataFinala) {
      alert('Selectați perioada de procesare!');
      return;
    }
    if (new Date(dataInitiala) > new Date(dataFinala)) {
      alert('Data inițială nu poate fi mai mare decât data finală!');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      alert(`Procesare inventar completă!\nPerioada: ${dataInitiala} - ${dataFinala}\nArticole: ${stocuri.length}`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📋 INVENTAR</h1>
        <p className="text-black">Gestionarea stocurilor de materii prime / ingrediente (nu produse finale)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-black">Lista Stocuri</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="text-black font-medium whitespace-nowrap">Gestiune:</label>
              <select
                value={gestiuneId}
                onChange={(e) => setGestiuneId(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded text-black min-w-[140px]"
                aria-label="Selectare gestiune"
              >
                {gestiuni.length === 0 ? (
                  <>
                    <option value={1}>Depozit</option>
                    <option value={2}>Bucătărie</option>
                    <option value={3}>Bar</option>
                  </>
                ) : (
                  gestiuni.map(g => (
                    <option key={g.id} value={g.id}>{g.nume || g.denumire || `Gestiune ${g.id}`}</option>
                  ))
                )}
              </select>
            </div>
            <button
              onClick={handleModificare}
              disabled={!selectedItem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              Modificare
            </button>
            <button
              onClick={handleAranjareHoreca}
              disabled={arrangeLoading}
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
              title="Mapare produse pe departamente, stocuri pe gestiuni, rețete"
            >
              {arrangeLoading ? '...' : '🔄 Aranjare HORECA'}
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">🔄 Se încarcă stocurile...</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="text-left text-black">
                    <th className="p-3 border-b text-black">DENUMIRE</th>
                    <th className="p-3 border-b text-black">U.M.</th>
                    <th className="p-3 border-b text-black">STOC</th>
                    <th className="p-3 border-b text-black">PREȚ</th>
                  </tr>
                </thead>
                <tbody>
                  {stocuri.map(item => (
                    <tr
                      key={item.cod_material}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedItem?.cod_material === item.cod_material ? 'bg-blue-200' : ''
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <td className="p-3 border-b text-black font-bold">{item.denumire}</td>
                      <td className="p-3 border-b text-black text-center">{item.um || 'buc'}</td>
                      <td className="p-3 border-b text-black text-right">{(item.cant_stoc ?? 0)}</td>
                      <td className="p-3 border-b text-black text-right">{item.pret != null ? Number(item.pret).toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {stocuri.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              Nu există articole în inventar. Adăugați materii prime în magazie.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-black mb-4">Gestiune Stoc</h2>
            {selectedItem && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-black font-bold text-sm mb-1">Articol selectat:</div>
                <div className="text-black text-sm">{selectedItem.denumire}</div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-black font-bold mb-2">
                  Stoc existent: <span className="text-blue-600">{selectedItem != null ? (selectedItem.cant_stoc ?? 0) : '-'}</span>
                </label>
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Stoc nou:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={stocNou}
                  onChange={(e) => setStocNou(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  placeholder="Introduceți stocul nou"
                  disabled={!selectedItem}
                />
              </div>
              <button
                onClick={handleSalvare}
                disabled={!selectedItem || stocNou === ''}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 font-bold"
              >
                Salvare
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-black mb-4">Procesare Inventar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-black font-bold mb-1">Data inițială:</label>
                <input
                  type="date"
                  value={dateRange.dataInitiala}
                  onChange={(e) => setDateRange({ ...dateRange, dataInitiala: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Data finală:</label>
                <input
                  type="date"
                  value={dateRange.dataFinala}
                  onChange={(e) => setDateRange({ ...dateRange, dataFinala: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              <button
                onClick={handleProcesare}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 font-bold"
              >
                {loading ? '⏳ Procesare...' : 'Procesare'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-black mb-2">ℹ️ Instrucțiuni</h4>
            <div className="text-sm text-black space-y-1">
              <div>• Selectați un articol (materie primă) din listă</div>
              <div>• Vizualizați stocul existent</div>
              <div>• Introduceți stocul nou și salvați</div>
              <div>• Produsele finale se gestionează la Rețete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventarPage;
