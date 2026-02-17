import React, { useState, useMemo } from 'react';

/**
 * Modal PLU - căutare produs rapid (cod, denumire, barcode)
 */
export default function PluSearchModal({ isOpen, onClose, produse, onSelect, getPret }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query || !produse?.length) return produse?.slice(0, 20) || [];
    const q = query.trim().toLowerCase();
    return produse.filter(p => 
      String(p.cod_prod).includes(q) ||
      (p.den_prod || '').toLowerCase().includes(q) ||
      (String(p.barcod || '')).includes(q)
    ).slice(0, 30);
  }, [produse, query]);

  const handleSelect = (p) => {
    onSelect(p);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl border-2 border-blue-500 p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-blue-400">PLU - Căutare produs</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white px-2">✕</button>
        </div>
        <input
          type="text"
          placeholder="Cod, denumire sau barcode..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white mb-2"
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto border border-gray-600 rounded">
          {filtered.map(p => (
            <button
              key={p.cod_prod}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm flex justify-between"
            >
              <span className="truncate">{p.den_prod}</span>
              <span className="text-yellow-400 font-bold">{Number(getPret?.(p) ?? p.pret1).toFixed(2)} RON</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="p-4 text-gray-500 text-center">Niciun rezultat</div>}
        </div>
      </div>
    </div>
  );
}
