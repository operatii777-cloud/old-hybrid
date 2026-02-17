import React, { useState } from 'react';

const RAPOARTE_ZILNICE = [
  { value: '', label: '— Selectează —' },
  { value: 'vanzari', label: 'Raport vânzări zilnic' },
  { value: 'incasari', label: 'Raport încasări zilnic' },
  { value: 'produse', label: 'Raport produse vândute' },
];

const DescarcareVanzarePage = () => {
  const [luna, setLuna] = useState('');
  const [raportZilnic, setRaportZilnic] = useState('');
  const [loading, setLoading] = useState(false);
  const [randuri, setRanduri] = useState([]);

  const handleDescarcare = () => {
    if (!luna.trim()) {
      alert('Introduceți luna.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setRanduri([
        { id: 1, denumire: 'ESPRESSO', cant: 12, pret: 5, observ: '-', cod_oper: '1', data: '01.02.2026', ora: '14', min: '30' },
        { id: 2, denumire: 'CAPUCINO', cant: 8, pret: 6, observ: '-', cod_oper: '1', data: '01.02.2026', ora: '14', min: '35' },
      ]);
      setLoading(false);
    }, 800);
  };

  const handleIesire = () => window.history.back?.() || window.close?.();

  return (
    <div className="flex flex-col h-full bg-gray-200 text-black">
      <div className="p-4 border-b border-gray-400 bg-white">
        <h1 className="text-lg font-bold text-black mb-3">Descarcare vânzare</h1>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-1">Luna</label>
            <input
              type="text"
              value={luna}
              onChange={(e) => setLuna(e.target.value)}
              placeholder="ex. 02.2026"
              className="w-32 px-3 py-2 border border-gray-400 rounded text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Raportul zilnic</label>
            <select
              value={raportZilnic}
              onChange={(e) => setRaportZilnic(e.target.value)}
              className="min-w-[200px] px-3 py-2 border border-gray-400 rounded text-black bg-white"
            >
              {RAPOARTE_ZILNICE.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleDescarcare}
            disabled={loading}
            className="px-8 py-2 font-bold text-red-600 border-2 border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? 'Se încarcă...' : 'DESCARCARE'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] overflow-auto mx-4 my-2 bg-white border border-gray-400 rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr className="text-left text-black">
              <th className="p-2 border-b border-gray-400">DENUMIRE</th>
              <th className="p-2 border-b border-gray-400 w-20">CANT</th>
              <th className="p-2 border-b border-gray-400 w-20">PRET</th>
              <th className="p-2 border-b border-gray-400">OBSERV</th>
              <th className="p-2 border-b border-gray-400 w-20">COD_OPER</th>
              <th className="p-2 border-b border-gray-400 w-24">DATA</th>
              <th className="p-2 border-b border-gray-400 w-16">ORA</th>
              <th className="p-2 border-b border-gray-400 w-16">MIN</th>
            </tr>
          </thead>
          <tbody>
            {randuri.length === 0 ? (
              <tr><td colSpan={8} className="p-4 text-gray-500 text-center">—</td></tr>
            ) : (
              randuri.map((r) => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="p-2 text-black">{r.denumire}</td>
                  <td className="p-2 text-black">{r.cant}</td>
                  <td className="p-2 text-black">{r.pret}</td>
                  <td className="p-2 text-black">{r.observ}</td>
                  <td className="p-2 text-black">{r.cod_oper}</td>
                  <td className="p-2 text-black">{r.data}</td>
                  <td className="p-2 text-black">{r.ora}</td>
                  <td className="p-2 text-black">{r.min}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center px-4 py-2 border-t border-gray-400 bg-gray-100">
        <button
          type="button"
          onClick={handleIesire}
          className="px-4 py-2 bg-gray-300 border border-gray-500 rounded font-medium text-black hover:bg-gray-400"
        >
          Iesire
        </button>
        <p className="text-xs text-gray-600">Restaurant App Hybrid v1.0</p>
      </div>
    </div>
  );
};

export default DescarcareVanzarePage;
