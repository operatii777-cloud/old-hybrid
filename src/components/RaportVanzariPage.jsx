import React, { useState, useEffect } from 'react';
import axios from 'axios';

/** Raport vânzări pe perioadă + Jurnal casă HORECA */
export default function RaportVanzariPage() {
  const [tab, setTab] = useState('vanzari');
  const [dataStart, setDataStart] = useState(new Date().toISOString().slice(0, 10));
  const [dataEnd, setDataEnd] = useState(new Date().toISOString().slice(0, 10));
  const [vanzari, setVanzari] = useState([]);
  const [jurnal, setJurnal] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadVanzari = () => {
    setLoading(true);
    axios.get('/api/rapoarte/vanzari-perioada', { params: { data_start: dataStart, data_end: dataEnd } })
      .then(res => setVanzari(res.data || []))
      .catch(() => setVanzari([]))
      .finally(() => setLoading(false));
  };

  const loadJurnal = () => {
    setLoading(true);
    axios.get('/api/rapoarte/jurnal-casa', { params: { data_start: dataStart, data_end: dataEnd } })
      .then(res => setJurnal(res.data || []))
      .catch(() => setJurnal([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'vanzari') loadVanzari();
    else loadJurnal();
  }, [tab, dataStart, dataEnd]);

  return (
    <div className="bg-gray-100 min-h-full p-6 text-black">
      <h1 className="text-xl font-bold mb-4">Rapoarte vânzări HORECA</h1>
      <div className="flex gap-2 mb-4">
        <label>De la:<input type="date" value={dataStart} onChange={e => setDataStart(e.target.value)} className="ml-1 px-2 py-1 border rounded" /></label>
        <label>Până la:<input type="date" value={dataEnd} onChange={e => setDataEnd(e.target.value)} className="ml-1 px-2 py-1 border rounded" /></label>
        <button onClick={tab === 'vanzari' ? loadVanzari : loadJurnal} className="px-4 py-1 bg-blue-600 text-white rounded">Actualizează</button>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('vanzari')} className={`px-4 py-2 rounded font-bold ${tab === 'vanzari' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Vânzări pe perioadă</button>
        <button onClick={() => setTab('jurnal')} className={`px-4 py-2 rounded font-bold ${tab === 'jurnal' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Jurnal casă</button>
      </div>
      {loading && <div className="py-4 text-gray-600">Se încarcă...</div>}
      {!loading && tab === 'vanzari' && (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-200"><th className="p-2 text-left">Data</th><th className="p-2 text-right">Nr. comenzi</th><th className="p-2 text-right">Total</th><th className="p-2 text-right">CASH</th><th className="p-2 text-right">CARD</th><th className="p-2 text-right">PROTOCOL</th></tr></thead>
            <tbody>
              {vanzari.map((r, i) => (
                <tr key={i} className="border-b"><td className="p-2">{r.data}</td><td className="p-2 text-right">{r.nr_comenzi}</td><td className="p-2 text-right font-bold">{Number(r.total).toFixed(2)}</td><td className="p-2 text-right">{Number(r.cash).toFixed(2)}</td><td className="p-2 text-right">{Number(r.card).toFixed(2)}</td><td className="p-2 text-right">{Number(r.protocol || 0).toFixed(2)}</td></tr>
              ))}
              {vanzari.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-500 text-center">Nicio înregistrare</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {!loading && tab === 'jurnal' && (
        <div className="bg-white rounded shadow overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-200 sticky top-0"><th className="p-2 text-left">Data/Ora</th><th className="p-2">Masa</th><th className="p-2 text-right">Total</th><th className="p-2">Tip plată</th></tr></thead>
            <tbody>
              {jurnal.map((r, i) => (
                <tr key={i} className="border-b"><td className="p-2">{r.data ? new Date(r.data).toLocaleString('ro-RO') : '-'}</td><td className="p-2">{r.masa_id}</td><td className="p-2 text-right font-bold">{Number(r.total || 0).toFixed(2)}</td><td className="p-2">{r.tip_plata_label || r.tip_plata}</td></tr>
              ))}
              {jurnal.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500 text-center">Nicio înregistrare</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
