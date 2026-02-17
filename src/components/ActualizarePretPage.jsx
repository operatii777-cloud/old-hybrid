import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Utilitare → Actualizare Preț:
 * - Preț 1 = preț standard (valabil pentru toți clienții).
 * - Preț 2 = discount procentual fixat de admin (ex. 20%) → Preț 2 = Preț 1 × (1 - discount%).
 * - Preț 3 = preț VIP (ex. 50% discount) → Preț 3 = Preț 1 × (1 - discount%).
 * - Opțiune: stabilire manuală a Preț 2 și Preț 3 în tabel (fără procent).
 */
const ActualizarePretPage = () => {
  const [produse, setProduse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [localEdits, setLocalEdits] = useState({});
  // Discount % față de Preț 1: Preț 2 = Preț 1 × (1 - discount2/100)
  const [discountPret2, setDiscountPret2] = useState(20);
  const [discountPret3, setDiscountPret3] = useState(50);

  useEffect(() => {
    loadProduse();
  }, []);

  const loadProduse = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/extended/produse-pos');
      setProduse(res.data || []);
      setLocalEdits({});
      setMessage({ type: '', text: '' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Eroare la încărcarea produselor.' });
    }
    setLoading(false);
  };

  const codKey = (p) => String(p.cod_prod ?? '');

  const getPret2 = (p) => {
    const key = codKey(p);
    if (localEdits[key]?.hasOwnProperty('pret2')) return localEdits[key].pret2;
    const v = Number(p.pret2) ?? Number(p.pret1) ?? 0;
    return isNaN(v) ? 0 : v;
  };

  const getPret3 = (p) => {
    const key = codKey(p);
    if (localEdits[key]?.hasOwnProperty('pret3')) return localEdits[key].pret3;
    const v = Number(p.pret3) ?? Number(p.pret1) ?? 0;
    return isNaN(v) ? 0 : v;
  };

  const setPretForCod = (cod, field, value) => {
    const key = String(cod ?? '');
    const v = value === '' ? '' : Number(value);
    if (v !== '' && isNaN(v)) return;
    setLocalEdits(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: v }
    }));
  };

  // Aplică discount % pentru Preț 2 la toate: Preț 2 = Preț 1 × (1 - discount/100)
  const aplicaDiscountPret2 = () => {
    const d = Math.max(0, Math.min(100, Number(discountPret2) || 0));
    const next = {};
    produse.forEach(p => {
      const pret1 = Number(p.pret1) || 0;
      const key = codKey(p);
      next[key] = { ...(localEdits[key] || {}), pret2: Math.round(pret1 * (1 - d / 100) * 100) / 100 };
    });
    setLocalEdits(prev => ({ ...prev, ...next }));
    setMessage({ type: 'info', text: `Preț 2 aplicat cu ${d}% discount la toate produsele (Preț 2 = Preț 1 × (1 - ${d}%)). Salvează pentru a scrie în baza de date.` });
  };

  // Aplică discount % pentru Preț 3 (VIP) la toate
  const aplicaDiscountPret3 = () => {
    const d = Math.max(0, Math.min(100, Number(discountPret3) || 0));
    const next = {};
    produse.forEach(p => {
      const pret1 = Number(p.pret1) || 0;
      const key = codKey(p);
      next[key] = { ...(localEdits[key] || {}), pret3: Math.round(pret1 * (1 - d / 100) * 100) / 100 };
    });
    setLocalEdits(prev => ({ ...prev, ...next }));
    setMessage({ type: 'info', text: `Preț 3 (VIP) aplicat cu ${d}% discount la toate produsele. Salvează pentru a scrie în baza de date.` });
  };

  const hasEdits = Object.keys(localEdits).length > 0;

  const handleSave = async () => {
    const toSave = Object.entries(localEdits).filter(([, v]) => {
      const p2 = v.pret2, p3 = v.pret3;
      return (typeof p2 === 'number' && !isNaN(p2)) || (typeof p3 === 'number' && !isNaN(p3));
    });
    if (toSave.length === 0) {
      setMessage({ type: 'warning', text: 'Nu există modificări de salvat.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    let ok = 0;
    let err = null;
    for (const [key, v] of toSave) {
      try {
        const payload = {};
        if (typeof v.pret2 === 'number' && !isNaN(v.pret2)) payload.pret2 = Number(v.pret2);
        if (typeof v.pret3 === 'number' && !isNaN(v.pret3)) payload.pret3 = Number(v.pret3);
        if (Object.keys(payload).length === 0) continue;
        const cod = key;
        await axios.put(`/api/extended/produse-pos/${encodeURIComponent(cod)}`, payload);
        ok++;
      } catch (e) {
        err = e.response?.data?.error || e.message || String(e);
        break;
      }
    }
    setSaving(false);
    if (err) {
      setMessage({ type: 'error', text: `Eroare la salvare: ${err}` });
      return;
    }
    setMessage({ type: 'success', text: `${ok} produse actualizate. Reîncărcare listă...` });
    setLocalEdits({});
    await loadProduse();
    setMessage({ type: 'success', text: `${ok} produse actualizate.` });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px] bg-gray-100">
        <p className="text-black">Se încarcă produsele...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">💰 Actualizare Prețuri</h1>
        <p className="text-black">
          <strong>Preț 1</strong> = preț standard (valabil pentru toți clienții). &nbsp;
          <strong>Preț 2</strong> = discount procentual stabilit de admin (ex. 20%). &nbsp;
          <strong>Preț 3</strong> = preț VIP (ex. 50% discount). Poți aplica discountul la toate sau seta manual Preț 2 și Preț 3 în tabel.
        </p>
      </div>

      {/* Discount procentual față de Preț 1 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 border border-orange-200">
        <h2 className="text-lg font-bold text-black mb-3">Discount procentual (față de Preț 1 standard)</h2>
        <p className="text-sm text-gray-700 mb-3">Preț 2 și Preț 3 se calculează: Preț = Preț 1 × (1 − discount%).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-bold text-black mb-2">Preț 2 (discount)</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={discountPret2}
                onChange={e => setDiscountPret2(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-black"
              />
              <span className="text-black">% discount</span>
              <button type="button" onClick={aplicaDiscountPret2} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium">
                Aplică Preț 2 la toate
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Preț 2 = Preț 1 × (1 − {discountPret2}%)</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-bold text-black mb-2">Preț 3 (VIP)</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={discountPret3}
                onChange={e => setDiscountPret3(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-black"
              />
              <span className="text-black">% discount</span>
              <button type="button" onClick={aplicaDiscountPret3} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium">
                Aplică Preț 3 (VIP) la toate
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Preț 3 = Preț 1 × (1 − {discountPret3}%)</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded text-black ${
          message.type === 'error' ? 'bg-red-100 border border-red-300' :
          message.type === 'success' ? 'bg-green-100 border border-green-300' : 'bg-blue-100 border border-blue-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stabilire manuală – fără procent */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-bold text-black">Stabilire manuală Preț 2 și Preț 3 (fără procent)</h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasEdits}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {saving ? 'Se salvează...' : 'Salvează modificările'}
          </button>
        </div>
        <p className="px-4 py-2 text-sm text-gray-600 border-b">Poți introduce direct valorile în RON; nu se folosește niciun discount procentual.</p>
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="text-left text-black">
                <th className="p-3 border-b border-gray-300">Cod</th>
                <th className="p-3 border-b border-gray-300">Denumire</th>
                <th className="p-3 border-b border-gray-300 text-right">Preț 1 standard (RON)</th>
                <th className="p-3 border-b border-gray-300 text-right">Preț 2 (RON)</th>
                <th className="p-3 border-b border-gray-300 text-right">Dif. P2</th>
                <th className="p-3 border-b border-gray-300 text-right">Preț 3 VIP (RON)</th>
                <th className="p-3 border-b border-gray-300 text-right">Dif. P3</th>
              </tr>
            </thead>
            <tbody>
              {produse.map(p => {
                const pret1 = Number(p.pret1) || 0;
                const orig2 = Number(p.pret2) ?? Number(p.pret1) ?? 0;
                const orig3 = Number(p.pret3) ?? Number(p.pret1) ?? 0;
                const pret2 = getPret2(p);
                const pret3 = getPret3(p);
                const num2 = typeof pret2 === 'number' && !isNaN(pret2) ? pret2 : orig2;
                const num3 = typeof pret3 === 'number' && !isNaN(pret3) ? pret3 : orig3;
                const diff2 = num2 - orig2;
                const diff3 = num3 - orig3;
                const fmt = (x) => (x > 0 ? `+${x.toFixed(2)}` : x < 0 ? x.toFixed(2) : '—');
                return (
                  <tr key={codKey(p)} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-3 text-black font-mono">{p.cod_prod}</td>
                    <td className="p-3 text-black font-medium">{p.den_prod}</td>
                    <td className="p-3 text-black text-right">{pret1.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pret2 === '' ? '' : pret2}
                        onChange={e => setPretForCod(p.cod_prod, 'pret2', e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-black text-right"
                      />
                    </td>
                    <td className="p-3 text-right text-sm text-black">{fmt(diff2)}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pret3 === '' ? '' : pret3}
                        onChange={e => setPretForCod(p.cod_prod, 'pret3', e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-black text-right"
                      />
                    </td>
                    <td className="p-3 text-right text-sm text-black">{fmt(diff3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActualizarePretPage;
