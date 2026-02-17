import React, { useState } from 'react';

/**
 * Modal pentru NOTE SEPARATE (Split Bill)
 * Două coloane: Bon principal | Bon separat
 * TRANSFER mută linia selectată între coloane
 * Plăți separate per bon
 */
export default function SepModal({ isOpen, onClose, liniiInitiale, onPlataBon, loading }) {
  const [leftList, setLeftList] = useState([]);
  const [rightList, setRightList] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(-1);
  const [selectedRight, setSelectedRight] = useState(-1);

  React.useEffect(() => {
    if (isOpen && liniiInitiale) {
      setLeftList(liniiInitiale.map(l => ({ ...l, _id: Math.random() })));
      setRightList([]);
      setSelectedLeft(-1);
      setSelectedRight(-1);
    }
  }, [isOpen, liniiInitiale]);

  const totalList = (list) => list.reduce((s, l) => s + (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0), 0);

  const transferToRight = () => {
    if (selectedLeft < 0 || selectedLeft >= leftList.length) return;
    const [moved] = leftList.splice(selectedLeft, 1);
    setLeftList([...leftList]);
    setRightList([...rightList, moved]);
    setSelectedLeft(-1);
  };

  const transferToLeft = () => {
    if (selectedRight < 0 || selectedRight >= rightList.length) return;
    const [moved] = rightList.splice(selectedRight, 1);
    setRightList([...rightList]);
    setLeftList([...leftList, moved]);
    setSelectedRight(-1);
  };

  const handlePayBon = async (list, tipPlata) => {
    if (list.length === 0) return;
    await onPlataBon(list, tipPlata);
    const ids = new Set(list.map(x => x._id));
    setLeftList(prev => prev.filter(l => !ids.has(l._id)));
    setRightList(prev => prev.filter(l => !ids.has(l._id)));
  };

  const handleClose = () => {
    const remaining = [...leftList, ...rightList].map(({ _id, ...r }) => r);
    onClose(remaining);
  };

  if (!isOpen) return null;

  const t1 = totalList(leftList);
  const t2 = totalList(rightList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => handleClose()}>
      <div className="bg-gray-900 rounded-xl border-2 border-purple-500 p-4 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-400">NOTE SEPARATE (SEP)</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white px-2">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Bon principal */}
          <div className="bg-gray-800 rounded p-3">
            <div className="font-bold text-yellow-400 mb-2">BON PRINCIPAL</div>
            <div className="max-h-40 overflow-y-auto border border-gray-600 rounded mb-2">
              {leftList.map((l, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedLeft(i); setSelectedRight(-1); }}
                  className={`p-2 cursor-pointer text-xs ${selectedLeft === i ? 'bg-purple-700' : 'hover:bg-gray-700'}`}
                >
                  {l.den_prod || l.cod_prod} · {l.cant}×{Number(l.pret_unitar || 0).toFixed(2)} = {(Number(l.cant) || 0) * (Number(l.pret_unitar) || 0).toFixed(2)} RON
                </div>
              ))}
              {leftList.length === 0 && <div className="p-4 text-gray-500 text-center">Gol</div>}
            </div>
            <div className="text-lg font-bold text-green-400 mb-2">Total: {t1.toFixed(2)} RON</div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => handlePayBon(leftList, 1)} disabled={loading || leftList.length === 0} className="px-2 py-1 bg-red-600 text-white text-xs rounded disabled:opacity-50">CASH</button>
              <button onClick={() => handlePayBon(leftList, 2)} disabled={loading || leftList.length === 0} className="px-2 py-1 bg-blue-600 text-white text-xs rounded disabled:opacity-50">CARD</button>
              <button onClick={() => handlePayBon(leftList, 3)} disabled={loading || leftList.length === 0} className="px-2 py-1 bg-green-600 text-white text-xs rounded disabled:opacity-50">VIRAMENT</button>
            </div>
          </div>

          {/* Butoane TRANSFER */}
          <div className="flex flex-col justify-center items-center gap-2">
            <button onClick={transferToRight} disabled={leftList.length === 0} className="px-4 py-2 bg-purple-600 text-white rounded font-bold disabled:opacity-50">→</button>
            <span className="text-xs text-gray-400">TRANSFER</span>
            <button onClick={transferToLeft} disabled={rightList.length === 0} className="px-4 py-2 bg-purple-600 text-white rounded font-bold disabled:opacity-50">←</button>
          </div>

          {/* Bon separat */}
          <div className="bg-gray-800 rounded p-3">
            <div className="font-bold text-cyan-400 mb-2">BON SEPARAT</div>
            <div className="max-h-40 overflow-y-auto border border-gray-600 rounded mb-2">
              {rightList.map((l, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedRight(i); setSelectedLeft(-1); }}
                  className={`p-2 cursor-pointer text-xs ${selectedRight === i ? 'bg-purple-700' : 'hover:bg-gray-700'}`}
                >
                  {l.den_prod || l.cod_prod} · {l.cant}×{Number(l.pret_unitar || 0).toFixed(2)} = {(Number(l.cant) || 0) * (Number(l.pret_unitar) || 0).toFixed(2)} RON
                </div>
              ))}
              {rightList.length === 0 && <div className="p-4 text-gray-500 text-center">Gol</div>}
            </div>
            <div className="text-lg font-bold text-cyan-400 mb-2">Total: {t2.toFixed(2)} RON</div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => handlePayBon(rightList, 1)} disabled={loading || rightList.length === 0} className="px-2 py-1 bg-red-600 text-white text-xs rounded disabled:opacity-50">CASH</button>
              <button onClick={() => handlePayBon(rightList, 2)} disabled={loading || rightList.length === 0} className="px-2 py-1 bg-blue-600 text-white text-xs rounded disabled:opacity-50">CARD</button>
              <button onClick={() => handlePayBon(rightList, 3)} disabled={loading || rightList.length === 0} className="px-2 py-1 bg-green-600 text-white text-xs rounded disabled:opacity-50">VIRAMENT</button>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">Plătește fiecare bon separat. După plata ambelor, închide fereastra.</div>
      </div>
    </div>
  );
}
