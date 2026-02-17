import React from 'react';

/**
 * Componentă pentru print bon / chitanță
 * Se renderează într-un iframe sau div hidden și se printează
 */
export default function BonPrint({ linii, total, tipPlata, masaId, dataOra, ospatar, tipPlataLabel, onPrinted }) {
  const tipLabels = { 1: 'CASH', 2: 'CARD', 3: 'VIRAMENT', 4: 'PROF', 5: 'PROTOCOL' };
  const label = tipPlataLabel || tipLabels[tipPlata] || 'CASH';

  const handlePrint = () => {
    window.print();
    onPrinted?.();
  };

  return (
    <div className="print:block hidden print:p-4">
      <div id="bon-print-content" className="bg-white text-black p-6 font-mono text-sm max-w-sm">
        <div className="text-center font-bold text-lg mb-4">RESTAURANT APP HYBRID</div>
        <div className="text-center text-xs mb-2">Bon / Chitanță</div>
        <div className="border-b border-gray-400 pb-2 mb-2">
          <div>Data: {dataOra || new Date().toLocaleString('ro-RO')}</div>
          <div>Masa: {masaId} | Ospătar: {ospatar?.nume || '-'}</div>
          <div>Plată: {label}</div>
        </div>
        {linii?.map((l, i) => (
          <div key={i} className="flex justify-between py-1 text-xs">
            <span>{l.den_prod || l.cod_prod} x{Number(l.cant) || 0}</span>
            <span>{(Number(l.cant) || 0) * (Number(l.pret_unitar) || 0).toFixed(2)} RON</span>
          </div>
        ))}
        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>{(total ?? 0).toFixed(2)} RON</span>
        </div>
        <div className="text-center text-xs mt-4">Mulțumim!</div>
      </div>
    </div>
  );
}
