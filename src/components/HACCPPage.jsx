import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CULORI_CATEGORII = {
  'Temperaturi': 'bg-red-50 border-red-200',
  'Igienă personală': 'bg-blue-50 border-blue-200',
  'Curățenie': 'bg-green-50 border-green-200',
  'Aprovizionare': 'bg-yellow-50 border-yellow-200',
  'Depozitare': 'bg-purple-50 border-purple-200',
};

const today = () => new Date().toISOString().split('T')[0];

export default function HACCPPage() {
  const [checklist, setChecklist] = useState([]);
  const [inregistrari, setInregistrari] = useState([]);
  const [dataSelectata, setDataSelectata] = useState(today());
  const [activeTab, setActiveTab] = useState('control-zilnic');
  const [loading, setLoading] = useState(false);
  const [completari, setCompletari] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ categorie: 'Temperaturi', punct_control: '', limita_critica: '', actiune_corectiva: '', frecventa: 'zilnic', responsabil: '' });

  useEffect(() => {
    loadChecklist();
  }, []);

  useEffect(() => {
    loadInregistrari(dataSelectata);
  }, [dataSelectata]);

  const loadChecklist = async () => {
    try {
      const r = await axios.get('/api/logistica/haccp-checklist');
      setChecklist(r.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInregistrari = async (data) => {
    setLoading(true);
    try {
      const r = await axios.get(`/api/logistica/haccp-inregistrari?data=${data}`);
      const inreg = r.data || [];
      setInregistrari(inreg);
      // Inițializare stare completări
      const state = {};
      for (const inr of inreg) {
        state[inr.checklist_id] = {
          conform: inr.conform === 1,
          valoare_masurata: inr.valoare_masurata || '',
          actiune_luata: inr.actiune_luata || '',
          observatii: inr.observatii || '',
          saved: true,
          inr_id: inr.id,
        };
      }
      setCompletari(state);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCompletareChange = (checklist_id, field, value) => {
    setCompletari(prev => ({
      ...prev,
      [checklist_id]: { ...(prev[checklist_id] || { conform: true, valoare_masurata: '', actiune_luata: '', observatii: '' }), [field]: value, saved: false }
    }));
  };

  const saveCompletare = async (item) => {
    const c = completari[item.id] || { conform: true, valoare_masurata: '', actiune_luata: '', observatii: '' };
    setSaving(true);
    try {
      await axios.post('/api/logistica/haccp-inregistrari', {
        checklist_id: item.id,
        valoare_masurata: c.valoare_masurata,
        conform: c.conform ? 1 : 0,
        actiune_luata: c.actiune_luata,
        operator: 'Operator',
        observatii: c.observatii,
      });
      setMessage({ type: 'success', text: `✅ Salvat: ${item.punct_control}` });
      setCompletari(prev => ({ ...prev, [item.id]: { ...prev[item.id], saved: true } }));
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la salvare' });
    }
    setSaving(false);
  };

  const addChecklistItem = async () => {
    if (!newItem.punct_control) {
      alert('Punctul de control este obligatoriu.');
      return;
    }
    try {
      await axios.post('/api/logistica/haccp-checklist', newItem);
      await loadChecklist();
      setShowAddItem(false);
      setNewItem({ categorie: 'Temperaturi', punct_control: '', limita_critica: '', actiune_corectiva: '', frecventa: 'zilnic', responsabil: '' });
      setMessage({ type: 'success', text: '✅ Punct de control adăugat!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      alert(e.response?.data?.error || 'Eroare la adăugare');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Dezactivați acest punct de control?')) return;
    try {
      await axios.delete(`/api/logistica/haccp-checklist/${id}`);
      await loadChecklist();
    } catch (e) {
      alert('Eroare la ștergere');
    }
  };

  const byCategorie = checklist.reduce((acc, item) => {
    const cat = item.categorie || 'Altele';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const completareProgress = () => {
    const total = checklist.length;
    const done = Object.values(completari).filter(c => c.saved).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const { total, done, pct } = completareProgress();

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black">🛡️ HACCP – Control Siguranță Alimentară</h1>
        <p className="text-sm text-gray-700">Monitorizare puncte critice de control conform standardelor HACCP</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('control-zilnic')}
          className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'control-zilnic' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-blue-50 border border-gray-300'}`}
        >
          📅 Control Zilnic
        </button>
        <button
          onClick={() => setActiveTab('checklist-config')}
          className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'checklist-config' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-blue-50 border border-gray-300'}`}
        >
          ⚙️ Configurare Checklist
        </button>
        <button
          onClick={() => setActiveTab('istoric')}
          className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'istoric' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-blue-50 border border-gray-300'}`}
        >
          📊 Istoric Înregistrări
        </button>
      </div>

      {activeTab === 'control-zilnic' && (
        <>
          {/* Header control zilnic */}
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mr-2">Data control:</label>
              <input
                type="date"
                value={dataSelectata}
                onChange={e => setDataSelectata(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-black text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">
                Completare: <strong>{done}/{total}</strong> puncte
              </div>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : 'text-gray-600'}`}>{pct}%</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Se încarcă...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(byCategorie).map(([cat, items]) => (
                <div key={cat} className={`rounded-lg border p-4 ${CULORI_CATEGORII[cat] || 'bg-white border-gray-200'}`}>
                  <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">📌 {cat}</h3>
                  <div className="space-y-3">
                    {items.map(item => {
                      const c = completari[item.id] || {};
                      const isSaved = c.saved;
                      return (
                        <div key={item.id} className="bg-white rounded border border-gray-200 p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-black">{item.punct_control}</p>
                              {item.limita_critica && (
                                <p className="text-xs text-red-700 mt-0.5">⚠️ Limită critică: <strong>{item.limita_critica}</strong></p>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5">Frecvență: {item.frecventa} | Responsabil: {item.responsabil}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full mt-1 ml-2 ${isSaved ? 'bg-green-500' : 'bg-gray-300'}`} title={isSaved ? 'Salvat' : 'Nesalvat'} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-xs text-gray-600">Valoare măsurată</label>
                              <input
                                type="text"
                                value={c.valoare_masurata || ''}
                                onChange={e => handleCompletareChange(item.id, 'valoare_masurata', e.target.value)}
                                placeholder={item.limita_critica || 'ex: 3°C'}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-black text-xs"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={c.conform !== false}
                                  onChange={e => handleCompletareChange(item.id, 'conform', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className={(c.conform !== false) ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                                  {(c.conform !== false) ? '✅ Conform' : '❌ Neconform'}
                                </span>
                              </label>
                            </div>
                          </div>
                          {(c.conform === false) && (
                            <div className="mb-2">
                              <label className="text-xs text-gray-600">Acțiune luată</label>
                              <input
                                type="text"
                                value={c.actiune_luata || ''}
                                onChange={e => handleCompletareChange(item.id, 'actiune_luata', e.target.value)}
                                placeholder={item.actiune_corectiva || 'Descrieți acțiunea corectivă...'}
                                className="w-full px-2 py-1 border border-red-300 rounded text-black text-xs"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => saveCompletare(item)}
                            disabled={saving}
                            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${isSaved ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                          >
                            {isSaved ? '✓ Salvat' : '💾 Salvează'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'checklist-config' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black">Puncte de Control HACCP</h2>
            <button
              onClick={() => setShowAddItem(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
            >
              + Adaugă punct control
            </button>
          </div>

          {showAddItem && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-bold text-black mb-3">Punct nou de control</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Categorie</label>
                  <select
                    value={newItem.categorie}
                    onChange={e => setNewItem(p => ({ ...p, categorie: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm"
                  >
                    {Object.keys(CULORI_CATEGORII).map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Altele">Altele</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Frecvență</label>
                  <select
                    value={newItem.frecventa}
                    onChange={e => setNewItem(p => ({ ...p, frecventa: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm"
                  >
                    <option>zilnic</option>
                    <option>de 2x/zi</option>
                    <option>de 3x/zi</option>
                    <option>la fiecare serviciu</option>
                    <option>la fiecare preparare</option>
                    <option>la fiecare livrare</option>
                    <option>săptămânal</option>
                    <option>lunar</option>
                    <option>permanent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <input type="text" placeholder="Punct de control *" value={newItem.punct_control} onChange={e => setNewItem(p => ({ ...p, punct_control: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                <input type="text" placeholder="Limită critică" value={newItem.limita_critica} onChange={e => setNewItem(p => ({ ...p, limita_critica: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                <input type="text" placeholder="Acțiune corectivă" value={newItem.actiune_corectiva} onChange={e => setNewItem(p => ({ ...p, actiune_corectiva: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
                <input type="text" placeholder="Responsabil" value={newItem.responsabil} onChange={e => setNewItem(p => ({ ...p, responsabil: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-black text-sm" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={addChecklistItem} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium">Adaugă</button>
                <button onClick={() => setShowAddItem(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Anulare</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                <div className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${CULORI_CATEGORII[item.categorie] ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
                  {item.categorie}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black">{item.punct_control}</p>
                  {item.limita_critica && <p className="text-xs text-gray-600">Limită: {item.limita_critica}</p>}
                  <p className="text-xs text-gray-500">{item.frecventa} | {item.responsabil}</p>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50">Dezactivează</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'istoric' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-black">Istoric Înregistrări</h2>
            <div>
              <input
                type="date"
                value={dataSelectata}
                onChange={e => setDataSelectata(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-black text-sm"
              />
            </div>
          </div>
          {inregistrari.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nu există înregistrări pentru data selectată.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left text-black">Categorie</th>
                    <th className="p-3 text-left text-black">Punct control</th>
                    <th className="p-3 text-left text-black">Valoare</th>
                    <th className="p-3 text-center text-black">Conform</th>
                    <th className="p-3 text-left text-black">Acțiune</th>
                    <th className="p-3 text-left text-black">Operator</th>
                    <th className="p-3 text-left text-black">Ora</th>
                  </tr>
                </thead>
                <tbody>
                  {inregistrari.map(r => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="p-3 text-black text-xs">{r.categorie}</td>
                      <td className="p-3 text-black">{r.punct_control}</td>
                      <td className="p-3 text-black">{r.valoare_masurata || '–'}</td>
                      <td className="p-3 text-center">{r.conform ? <span className="text-green-600 font-bold">✅</span> : <span className="text-red-600 font-bold">❌</span>}</td>
                      <td className="p-3 text-black text-xs">{r.actiune_luata || '–'}</td>
                      <td className="p-3 text-black">{r.operator || '–'}</td>
                      <td className="p-3 text-gray-500 text-xs">{r.data_control ? new Date(r.data_control).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
