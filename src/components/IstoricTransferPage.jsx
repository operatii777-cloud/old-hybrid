import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GESTIUNI_FALLBACK = [
  { id: 1, nume: 'Depozit' },
  { id: 2, nume: 'Bucătărie' },
  { id: 3, nume: 'Bar' }
];

const IstoricTransferPage = () => {
  const [list, setList] = useState([]);
  const [gestiuni, setGestiuni] = useState([]);
  const [gestiuneId, setGestiuneId] = useState('toate');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, tRes] = await Promise.all([
          axios.get('/api/magazie/gestiuni'),
          axios.get(`/api/magazie/istoric-transfer?gestiune_id=${gestiuneId === 'toate' ? '' : gestiuneId}`)
        ]);
        const gList = Array.isArray(gRes.data) ? gRes.data : [];
        setGestiuni(gList.length > 0 ? gList : GESTIUNI_FALLBACK);
        setList(Array.isArray(tRes.data) ? tRes.data : []);
      } catch (e) {
        console.error(e);
        setGestiuni(GESTIUNI_FALLBACK);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [gestiuneId]);

  const byGestiune = gestiuneId !== 'toate'
    ? null
    : list.reduce((acc, row) => {
        const key = `${row.din_gestiune || '?'} → ${row.in_gestiune || '?'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">🔄 Istoric TRANSFER</h1>
        <p className="text-black">Toate transferurile dintre gestiuni, separate pe gestiuni</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg mb-6 flex flex-wrap items-center gap-4">
        <label className="font-bold text-black">Gestiune (din sau în):</label>
        <select
          value={gestiuneId}
          onChange={(e) => setGestiuneId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-black"
        >
          <option value="toate">Toate gestiunile</option>
          {gestiuni.map((g) => (
            <option key={String(g.id)} value={String(g.id)}>{g.nume || ('Gestiune ' + g.id)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-black">Se încarcă...</p>
      ) : gestiuneId !== 'toate' || !(byGestiune && Object.keys(byGestiune).length > 0) ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-yellow-100 text-black">
                <tr>
                  <th className="p-2">Data</th>
                  <th className="p-2">Din gestiune</th>
                  <th className="p-2">În gestiune</th>
                  <th className="p-2">Material</th>
                  <th className="p-2">Cantitate</th>
                  <th className="p-2">Notă</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2">{r.data_transfer}</td>
                    <td className="p-2">{r.din_gestiune}</td>
                    <td className="p-2">{r.in_gestiune}</td>
                    <td className="p-2">{r.denumire_material}</td>
                    <td className="p-2">{Number(r.cant_transfer) ?? '-'}</td>
                    <td className="p-2">{r.nota_transfer || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="p-4 text-black">Nu există transferuri.</p>}
        </div>
      ) : (
        Object.entries(byGestiune).map(([label, rows]) => (
          <div key={label} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <h2 className="bg-yellow-200 px-4 py-2 font-bold text-black">{label}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-yellow-100 text-black">
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Material</th>
                    <th className="p-2">Cantitate</th>
                    <th className="p-2">Notă</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2">{r.data_transfer}</td>
                      <td className="p-2">{r.denumire_material}</td>
                      <td className="p-2">{Number(r.cant_transfer) ?? '-'}</td>
                      <td className="p-2">{r.nota_transfer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default IstoricTransferPage;
