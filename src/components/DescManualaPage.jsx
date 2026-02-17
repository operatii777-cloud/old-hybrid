import React, { useState, useMemo } from 'react';

// Produse exemplu ca în interfața originală (DEN_PROD, DEP, PRET1)
const PRODUSE_INITIALE = [
  { id: 1, den_prod: 'ESPRESSO', dep: 1, pret1: 5 },
  { id: 2, den_prod: 'CAPUCINO', dep: 1, pret1: 6 },
  { id: 3, den_prod: 'IRISH COFFEE', dep: 1, pret1: 9 },
  { id: 4, den_prod: 'RUM COFFEE', dep: 1, pret1: 8 },
  { id: 5, den_prod: 'PARIZIAN COFEE', dep: 1, pret1: 7 },
  { id: 6, den_prod: 'AMERICAN COFFEE', dep: 1, pret1: 6 },
  { id: 7, den_prod: 'WIENER COFFEE', dep: 1, pret1: 8 },
  { id: 8, den_prod: 'CAFE LATE', dep: 1, pret1: 6 },
];

const DescManualaPage = () => {
  const [cautare, setCautare] = useState('');
  const [produsSelectat, setProdusSelectat] = useState(null);
  const [cantitate, setCantitate] = useState('');
  const [observatii, setObservatii] = useState('');
  const [listaDescarcate, setListaDescarcate] = useState([]);

  const produseFiltrate = useMemo(() => {
    if (!cautare.trim()) return PRODUSE_INITIALE;
    const c = cautare.toUpperCase();
    return PRODUSE_INITIALE.filter(p => p.den_prod.includes(c));
  }, [cautare]);

  const handleSelectProdus = (p) => {
    setProdusSelectat(p);
    setCantitate('');
  };

  const handleDescarcare = () => {
    if (!produsSelectat || !cantitate || Number(cantitate) <= 0) {
      alert('Selectați un produs și introduceți cantitatea de descărcat.');
      return;
    }
    const q = Number(cantitate);
    setListaDescarcate(prev => [...prev, {
      id: Date.now(),
      denumire: produsSelectat.den_prod,
      cant: q,
      pret: produsSelectat.pret1,
      observ: observatii || '-'
    }]);
    setCantitate('');
    setObservatii('');
  };

  const handleIesire = () => window.history.back?.() || window.close?.();
  const handleDescarcaLista = () => {
    if (listaDescarcate.length === 0) {
      alert('Lista este goală.');
      return;
    }
    alert('Funcția Descarcă Lista (export) va fi conectată la backend.');
  };

  return (
    <div className="flex flex-col h-full bg-gray-200 text-black">
      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Stânga: Lista produse */}
        <div className="w-80 flex flex-col bg-white border border-gray-400 rounded shadow">
          <div className="p-2 border-b border-gray-400 flex items-center justify-between gap-2">
            <span className="font-bold text-black">Produs</span>
            <div className="flex items-center gap-1">
              <label className="text-sm text-black whitespace-nowrap">Cautare</label>
              <input
                type="text"
                value={cautare}
                onChange={(e) => setCautare(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 border border-gray-400 rounded text-black text-sm"
                placeholder="..."
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="text-left text-black">
                  <th className="p-1 border-b border-gray-300">DEN_PROD</th>
                  <th className="p-1 border-b border-gray-300 w-12">DEP</th>
                  <th className="p-1 border-b border-gray-300 w-12">PRET1</th>
                </tr>
              </thead>
              <tbody>
                {produseFiltrate.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectProdus(p)}
                    className={`cursor-pointer border-b border-gray-200 hover:bg-blue-100 ${produsSelectat?.id === p.id ? 'bg-blue-200' : ''}`}
                  >
                    <td className="p-1 text-black">{p.den_prod}</td>
                    <td className="p-1 text-black">{p.dep}</td>
                    <td className="p-1 text-black">{p.pret1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dreapta: Detalii și acțiune */}
        <div className="w-80 flex flex-col bg-white border border-gray-400 rounded shadow p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Denumire</label>
              <input
                type="text"
                readOnly
                value={produsSelectat ? produsSelectat.den_prod : ''}
                className="w-full px-3 py-2 border border-gray-400 rounded bg-gray-50 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Cantitate de descarcat</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cantitate}
                onChange={(e) => setCantitate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">OBSERVATII</label>
              <textarea
                value={observatii}
                onChange={(e) => setObservatii(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-400 rounded text-black resize-none"
              />
            </div>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleDescarcare}
                className="px-8 py-2 font-bold text-red-600 border-2 border-red-600 rounded hover:bg-red-50"
              >
                DESCARCARE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel listă descărcate */}
      <div className="flex-1 min-h-[200px] flex flex-col mx-4 mb-2 bg-white border border-gray-400 rounded shadow overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="text-left text-black">
                <th className="p-2 border-b border-gray-400">DENUMIRE</th>
                <th className="p-2 border-b border-gray-400 w-24">CANT</th>
                <th className="p-2 border-b border-gray-400 w-24">PRET</th>
                <th className="p-2 border-b border-gray-400">OBSERV</th>
              </tr>
            </thead>
            <tbody>
              {listaDescarcate.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-gray-500 text-center">—</td></tr>
              ) : (
                listaDescarcate.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200">
                    <td className="p-2 text-black">{r.denumire}</td>
                    <td className="p-2 text-black">{r.cant}</td>
                    <td className="p-2 text-black">{r.pret}</td>
                    <td className="p-2 text-black">{r.observ}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: Iesire + Descarca Lista */}
      <div className="flex justify-between items-center px-4 py-2 border-t border-gray-400 bg-gray-100">
        <button
          type="button"
          onClick={handleIesire}
          className="px-4 py-2 bg-gray-300 border border-gray-500 rounded font-medium text-black hover:bg-gray-400"
        >
          Iesire
        </button>
        <button
          type="button"
          onClick={handleDescarcaLista}
          className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600"
        >
          Descarca Lista
        </button>
      </div>
    </div>
  );
};

export default DescManualaPage;
