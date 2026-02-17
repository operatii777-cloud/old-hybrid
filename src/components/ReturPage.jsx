/**
 * Fereastra Retur – conform aplicației originale RestWin/RestGest.
 * Layout: listă stocuri (sus), două panouri MAGAZIE / GESTIUNI (mijloc), buton RETUR, Iesire (jos).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const COLS_PANOU = [
  { key: 'nr_fact', label: 'NR_FACT' },
  { key: 'nr_n', label: 'NR_N' },
  { key: 'data_fac', label: 'DATA_FAC' },
  { key: 'cant', label: 'CANT' },
  { key: 'cant2', label: 'CANT' },
  { key: 'pret', label: 'PRET' },
];

export default function ReturPage({ onIesire }) {
  const navigate = useNavigate();
  const [stocuri, setStocuri] = useState([]);
  const [returi, setReturi] = useState([]);
  const [gestiuni, setGestiuni] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialogRetur, setShowDialogRetur] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formRetur, setFormRetur] = useState({
    cant_retur: '',
    din_gestiune_id: '',
    pret_retur: '',
    motiv: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rStoc, rRetur, rGest] = await Promise.all([
        axios.get('/api/magazie/stocuri').catch(() => ({ data: [] })),
        axios.get('/api/magazie/retur-materiale').catch(() => ({ data: [] })),
        axios.get('/api/magazie/gestiuni').catch(() => ({ data: [] })),
      ]);
      setStocuri(rStoc.data || []);
      setReturi(rRetur.data || []);
      setGestiuni(rGest.data?.length ? rGest.data : [{ id: 1, nume: 'Magazie' }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Împarte retururile: gestiune_id 1 = MAGAZIE, restul = GESTIUNI
  const returMagazie = returi.filter((r) => r.din_gestiune_id === 1 || r.din_gestiune_id == null);
  const returGestiuni = returi.filter((r) => r.din_gestiune_id && r.din_gestiune_id !== 1);

  const mapReturToRow = (r) => ({
    nr_fact: r.nr_factura || '-',
    nr_n: r.id ?? '-',
    data_fac: r.data_retur ? r.data_retur.split('T')[0] : '-',
    cant: r.cant_retur != null ? Number(r.cant_retur).toFixed(2) : '-',
    cant2: r.cant_retur != null ? Number(r.cant_retur).toFixed(2) : '-',
    pret: r.pret_retur != null ? Number(r.pret_retur).toFixed(2) : '-',
  });

  const handleIesire = () => {
    if (typeof onIesire === 'function') onIesire();
    else navigate('/admin-dashboard');
  };

  const openDialogRetur = () => {
    if (!selectedMaterial) {
      alert('Selectați un material din lista de stocuri.');
      return;
    }
    const gestId = gestiuni.length ? String(gestiuni[0].id) : '1';
    setFormRetur({
      cant_retur: '',
      din_gestiune_id: gestId,
      pret_retur: selectedMaterial.pret ?? '',
      motiv: '',
    });
    setShowDialogRetur(true);
  };

  const closeDialogRetur = () => {
    setShowDialogRetur(false);
    setFormRetur({ cant_retur: '', din_gestiune_id: '', pret_retur: '', motiv: '' });
  };

  const handleSalveazaRetur = async () => {
    const cant = parseFloat(formRetur.cant_retur);
    const gestId = parseInt(formRetur.din_gestiune_id, 10);
    if (!selectedMaterial || isNaN(cant) || cant <= 0 || !gestId) {
      alert('Completați cantitatea și selectați gestiunea (din care se face returul).');
      return;
    }
    const stocDisponibil = selectedMaterial.stoc != null ? Number(selectedMaterial.stoc) : 0;
    if (cant > stocDisponibil) {
      alert(`Cantitatea nu poate depăși stocul disponibil (${stocDisponibil}).`);
      return;
    }
    setSaving(true);
    try {
      await axios.post('/api/magazie/retur-materiale', {
        cod_material: selectedMaterial.cod,
        cant_retur: cant,
        din_gestiune_id: gestId,
        motiv: formRetur.motiv || 'Retur manual',
        pret_retur: formRetur.pret_retur !== '' ? parseFloat(formRetur.pret_retur) : 0,
      });
      await loadData();
      closeDialogRetur();
      setSelectedMaterial(null);
      alert('Retur înregistrat cu succes.');
    } catch (err) {
      alert('Eroare la înregistrarea returului: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-black">
      <div className="p-4 border-b border-gray-300 bg-white">
        <h1 className="text-2xl font-bold text-center">Retur</h1>
      </div>

      {/* Lista stocuri (sus) */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="bg-white rounded border border-gray-300 overflow-hidden mb-4 flex-shrink-0">
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="p-2 text-left border-b border-gray-400 font-bold">Denumire</th>
                  <th className="p-2 text-left border-b border-gray-400 font-bold w-24">UM</th>
                  <th className="p-2 text-right border-b border-gray-400 font-bold w-24">Cantitate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="p-4 text-center">Se încarcă...</td></tr>
                ) : stocuri.length === 0 ? (
                  <tr><td colSpan={3} className="p-4 text-center text-gray-500">Niciun material în stoc</td></tr>
                ) : (
                  stocuri.map((s) => (
                    <tr
                      key={s.cod}
                      onClick={() => setSelectedMaterial(s)}
                      className={`cursor-pointer hover:bg-blue-50 ${selectedMaterial?.cod === s.cod ? 'bg-blue-100' : ''}`}
                    >
                      <td className="p-2 border-b border-gray-200">{s.denumire || '-'}</td>
                      <td className="p-2 border-b border-gray-200">{s.um || 'Kg'}</td>
                      <td className="p-2 border-b border-gray-200 text-right">{s.stoc != null ? Number(s.stoc).toFixed(2) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panouri MAGAZIE | <RETUR< | GESTIUNI */}
        <div className="flex flex-1 min-h-0 gap-2">
          <div className="flex-1 flex flex-col bg-white rounded border border-gray-300 overflow-hidden">
            <div className="p-2 bg-gray-200 border-b border-gray-400 text-center font-bold">MAGAZIE</div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {COLS_PANOU.map((c) => (
                      <th key={c.key} className="p-1.5 text-left border-b border-gray-300 font-semibold text-xs">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returMagazie.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-400">—</td></tr>
                  ) : (
                    returMagazie.map((r) => (
                      <tr key={r.id || r.data_retur + r.cod_material}>
                        {COLS_PANOU.map((c) => (
                          <td key={c.key} className="p-1.5 border-b border-gray-200">{mapReturToRow(r)[c.key]}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={openDialogRetur}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm whitespace-nowrap rounded border-2 border-red-800"
              title="Execută retur"
            >
              &lt;RETUR&lt;
            </button>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded border border-gray-300 overflow-hidden">
            <div className="p-2 bg-gray-200 border-b border-gray-400 text-center font-bold">GESTIUNI</div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {COLS_PANOU.map((c) => (
                      <th key={c.key} className="p-1.5 text-left border-b border-gray-300 font-semibold text-xs">{c.label === 'NR_N' ? 'NR_NI' : c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returGestiuni.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-400">—</td></tr>
                  ) : (
                    returGestiuni.map((r) => (
                      <tr key={r.id || r.data_retur + r.cod_material}>
                        {COLS_PANOU.map((c) => (
                          <td key={c.key} className="p-1.5 border-b border-gray-200">{mapReturToRow(r)[c.key]}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4 pb-2">
          <button
            type="button"
            onClick={handleIesire}
            className="px-8 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded"
          >
            Iesire
          </button>
        </div>
      </div>

      {/* Dialog înregistrare retur */}
      {showDialogRetur && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDialogRetur}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 text-black" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Înregistrare retur</h3>
            <p className="text-sm text-gray-600 mb-4">
              Material: <strong>{selectedMaterial.denumire}</strong> (stoc: {selectedMaterial.stoc != null ? Number(selectedMaterial.stoc).toFixed(2) : '-'} {selectedMaterial.um || 'Kg'})
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Cantitate retur *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formRetur.cant_retur}
                  onChange={(e) => setFormRetur((f) => ({ ...f, cant_retur: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Din gestiune *</label>
                <select
                  value={formRetur.din_gestiune_id}
                  onChange={(e) => setFormRetur((f) => ({ ...f, din_gestiune_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {gestiuni.map((g) => (
                    <option key={g.id} value={g.id}>{g.nume || g.denumire || `Gestiune ${g.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preț retur (RON)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formRetur.pret_retur}
                  onChange={(e) => setFormRetur((f) => ({ ...f, pret_retur: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motiv</label>
                <input
                  type="text"
                  value={formRetur.motiv}
                  onChange={(e) => setFormRetur((f) => ({ ...f, motiv: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Opțional"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeDialogRetur}
                className="flex-1 py-2 border border-gray-400 rounded font-medium hover:bg-gray-100"
              >
                Anulare
              </button>
              <button
                type="button"
                onClick={handleSalveazaRetur}
                disabled={saving}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded"
              >
                {saving ? 'Se salvează...' : 'Salvează retur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
