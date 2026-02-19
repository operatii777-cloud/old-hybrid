import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CULORI_ALERGENI = {
  A01: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  A02: 'bg-red-100 text-red-800 border-red-300',
  A03: 'bg-orange-100 text-orange-800 border-orange-300',
  A04: 'bg-blue-100 text-blue-800 border-blue-300',
  A05: 'bg-amber-100 text-amber-800 border-amber-300',
  A06: 'bg-green-100 text-green-800 border-green-300',
  A07: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  A08: 'bg-brown-100 text-brown-800 border-brown-300',
  A09: 'bg-teal-100 text-teal-800 border-teal-300',
  A10: 'bg-purple-100 text-purple-800 border-purple-300',
  A11: 'bg-lime-100 text-lime-800 border-lime-300',
  A12: 'bg-gray-100 text-gray-800 border-gray-300',
  A13: 'bg-pink-100 text-pink-800 border-pink-300',
  A14: 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

const EMPTY_FISA = {
  descriere: '', mod_preparare: '', conditii_pastrare: '', temperatura_servire: '',
  termen_valabilitate: '', valoare_energetica_kcal: '', proteine_g: '', grasimi_g: '',
  carbohidrati_g: '', fibre_g: '', sare_g: '', portie_g: '', observatii: ''
};

export default function FisaTehnicaPage() {
  const [produse, setProduse] = useState([]);
  const [selectedProdus, setSelectedProdus] = useState(null);
  const [fisa, setFisa] = useState(null);
  const [editData, setEditData] = useState({ ...EMPTY_FISA });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    axios.get('/api/extended/produse-pos').then(r => setProduse(r.data || [])).catch(() => {});
  }, []);

  const loadFisa = async (produs) => {
    setSelectedProdus(produs);
    setEditMode(false);
    setFisa(null);
    setLoading(true);
    try {
      const r = await axios.get(`/api/logistica/fise-tehnice/${produs.cod_prod}`);
      setFisa(r.data);
      if (r.data) {
        setEditData({
          descriere: r.data.descriere || '',
          mod_preparare: r.data.mod_preparare || '',
          conditii_pastrare: r.data.conditii_pastrare || '',
          temperatura_servire: r.data.temperatura_servire || '',
          termen_valabilitate: r.data.termen_valabilitate || '',
          valoare_energetica_kcal: r.data.valoare_energetica_kcal ?? '',
          proteine_g: r.data.proteine_g ?? '',
          grasimi_g: r.data.grasimi_g ?? '',
          carbohidrati_g: r.data.carbohidrati_g ?? '',
          fibre_g: r.data.fibre_g ?? '',
          sare_g: r.data.sare_g ?? '',
          portie_g: r.data.portie_g ?? '',
          observatii: r.data.observatii || ''
        });
      } else {
        setEditData({ ...EMPTY_FISA });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const saveFisa = async () => {
    if (!selectedProdus) return;
    setSaving(true);
    try {
      await axios.post('/api/logistica/fise-tehnice', {
        cod_produs: selectedProdus.cod_prod,
        denumire_produs: selectedProdus.den_prod,
        ...editData
      });
      setMessage({ type: 'success', text: '✅ Fișa tehnică salvată cu succes!' });
      await loadFisa(selectedProdus);
      setEditMode(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Eroare la salvare' });
    }
    setSaving(false);
  };

  const filteredProduse = produse.filter(p =>
    !searchText || (p.den_prod || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const fieldLabel = (label, field, type = 'text') => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={editData[field]}
          onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm"
        />
      ) : (
        <input
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          value={editData[field]}
          onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm"
        />
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black">📋 Fișe Tehnice de Produs</h1>
        <p className="text-sm text-gray-700">Date tehnice, nutriționale și alergeni pentru fiecare produs final</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista produse */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-black mb-3">Produse finale</h2>
          <input
            type="text"
            placeholder="Caută produs..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm mb-3"
          />
          <div className="overflow-y-auto max-h-[500px]">
            {filteredProduse.map(p => (
              <button
                key={p.cod_prod}
                onClick={() => loadFisa(p)}
                className={`w-full text-left px-3 py-2 text-sm rounded mb-1 border transition-colors ${
                  selectedProdus?.cod_prod === p.cod_prod
                    ? 'bg-blue-200 border-blue-400 font-bold text-blue-900'
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-50 text-black'
                }`}
              >
                <span className="text-xs text-gray-500 font-mono">[{p.cod_prod}]</span> {p.den_prod}
              </button>
            ))}
          </div>
        </div>

        {/* Detalii fișă tehnică */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          {!selectedProdus ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>Selectați un produs din lista din stânga pentru a vedea sau edita fișa tehnică.</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-gray-500">Se încarcă...</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-black">{selectedProdus.den_prod}</h2>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                  >
                    ✏️ {fisa ? 'Editează' : 'Creează fișă'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveFisa}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium disabled:bg-gray-400"
                    >
                      {saving ? 'Se salvează...' : '💾 Salvează'}
                    </button>
                    <button
                      onClick={() => { setEditMode(false); loadFisa(selectedProdus); }}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      Anulare
                    </button>
                  </div>
                )}
              </div>

              {/* Alergeni detectați automat */}
              {fisa?.alergeni?.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm font-bold text-orange-800 mb-2">⚠️ Alergeni detectați automat din rețetă:</p>
                  <div className="flex flex-wrap gap-2">
                    {fisa.alergeni.map(a => (
                      <span key={a.cod} className={`px-2 py-1 rounded border text-xs font-medium ${CULORI_ALERGENI[a.cod] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {a.cod}: {a.denumire}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rețetă */}
              {fisa?.reteta?.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm font-bold text-gray-700 mb-2">🧪 Rețetă (ingrediente):</p>
                  <div className="grid grid-cols-2 gap-1">
                    {fisa.reteta.map(r => (
                      <div key={r.id} className="text-xs text-gray-700">
                        • {r.denumire_material || r.denumire}: <strong>{r.cant} {r.um}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {fieldLabel('Porție (g)', 'portie_g', 'number')}
                    {fieldLabel('Termen de valabilitate', 'termen_valabilitate')}
                    {fieldLabel('Temperatura de servire', 'temperatura_servire')}
                    {fieldLabel('Condiții de păstrare', 'conditii_pastrare')}
                  </div>
                  {fieldLabel('Descriere produs', 'descriere', 'textarea')}
                  {fieldLabel('Mod de preparare', 'mod_preparare', 'textarea')}
                  <p className="text-xs font-bold text-gray-600 mt-2">Valori nutritionale (per 100g):</p>
                  <div className="grid grid-cols-3 gap-3">
                    {fieldLabel('Energie (kcal)', 'valoare_energetica_kcal', 'number')}
                    {fieldLabel('Proteine (g)', 'proteine_g', 'number')}
                    {fieldLabel('Grăsimi (g)', 'grasimi_g', 'number')}
                    {fieldLabel('Carbohidrați (g)', 'carbohidrati_g', 'number')}
                    {fieldLabel('Fibre (g)', 'fibre_g', 'number')}
                    {fieldLabel('Sare (g)', 'sare_g', 'number')}
                  </div>
                  {fieldLabel('Observații', 'observatii', 'textarea')}
                </div>
              ) : fisa ? (
                <div className="space-y-3 text-sm">
                  {fisa.portie_g && <p><strong>Porție:</strong> {fisa.portie_g} g</p>}
                  {fisa.descriere && <p><strong>Descriere:</strong> {fisa.descriere}</p>}
                  {fisa.mod_preparare && <p><strong>Mod preparare:</strong> {fisa.mod_preparare}</p>}
                  {fisa.conditii_pastrare && <p><strong>Condiții păstrare:</strong> {fisa.conditii_pastrare}</p>}
                  {fisa.temperatura_servire && <p><strong>Temperatura servire:</strong> {fisa.temperatura_servire}</p>}
                  {fisa.termen_valabilitate && <p><strong>Termen valabilitate:</strong> {fisa.termen_valabilitate}</p>}
                  {(fisa.valoare_energetica_kcal || fisa.proteine_g || fisa.grasimi_g) && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <p className="font-bold text-gray-700 mb-1">Valori nutritionale / 100g:</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {fisa.valoare_energetica_kcal != null && <span>Energie: <strong>{fisa.valoare_energetica_kcal} kcal</strong></span>}
                        {fisa.proteine_g != null && <span>Proteine: <strong>{fisa.proteine_g} g</strong></span>}
                        {fisa.grasimi_g != null && <span>Grăsimi: <strong>{fisa.grasimi_g} g</strong></span>}
                        {fisa.carbohidrati_g != null && <span>Carbohidrați: <strong>{fisa.carbohidrati_g} g</strong></span>}
                        {fisa.fibre_g != null && <span>Fibre: <strong>{fisa.fibre_g} g</strong></span>}
                        {fisa.sare_g != null && <span>Sare: <strong>{fisa.sare_g} g</strong></span>}
                      </div>
                    </div>
                  )}
                  {fisa.observatii && <p><strong>Observații:</strong> {fisa.observatii}</p>}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nu există fișă tehnică pentru acest produs.</p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    + Creează fișă tehnică
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
