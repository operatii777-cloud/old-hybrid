import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GESTIUNI_FALLBACK = [
  { id: 1, nume: 'Depozit' },
  { id: 2, nume: 'Bucătărie' },
  { id: 3, nume: 'Bar' }
];

const IstoricReturPage = () => {
  const [list, setList] = useState([]);
  const [gestiuni, setGestiuni] = useState([]);
  const [gestiuneId, setGestiuneId] = useState('toate');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, rRes] = await Promise.all([
          axios.get('/api/magazie/gestiuni'),
          axios.get(`/api/magazie/istoric-retur?gestiune_id=${gestiuneId === 'toate' ? '' : gestiuneId}`)
        ]);
        const gList = Array.isArray(gRes.data) ? gRes.data : [];
        setGestiuni(gList.length > 0 ? gList : GESTIUNI_FALLBACK);
        setList(Array.isArray(rRes.data) ? rRes.data : []);
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
    ? list
    : list.reduce((acc, row) => {
        const key = row.gestiune || 'Fără gestiune';
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">↩️ Istoric RETUR</h1>
        <p className="text-black">Toate retururile dintr-o gestiune, separate pe gestiuni</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg mb-6 flex flex-wrap items-center gap-4">
        <label className="font-bold text-black">Gestiune (din care s-a făcut returul):</label>
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
      ) : Array.isArray(byGestiune) ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-yellow-100 text-black">
                <tr>
                  <th className="p-2">Data retur</th>
                  <th className="p-2">Gestiune</th>
                  <th className="p-2">Material</th>
                  <th className="p-2">Cantitate</th>
                  <th className="p-2">Motiv</th>
                  <th className="p-2">Preț retur</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2">{r.data_retur}</td>
                    <td className="p-2">{r.gestiune}</td>
                    <td className="p-2">{r.denumire_material}</td>
                    <td className="p-2">{Number(r.cant_retur) ?? '-'}</td>
                    <td className="p-2">{r.motiv || '-'}</td>
                    <td className="p-2">{Number(r.pret_retur) != null ? Number(r.pret_retur).toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="p-4 text-black">Nu există retururi.</p>}
        </div>
      ) : (
        Object.entries(byGestiune).map(([numeGestiune, rows]) => (
          <div key={numeGestiune} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <h2 className="bg-yellow-200 px-4 py-2 font-bold text-black">{numeGestiune}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-yellow-100 text-black">
                  <tr>
                    <th className="p-2">Data retur</th>
                    <th className="p-2">Material</th>
                    <th className="p-2">Cantitate</th>
                    <th className="p-2">Motiv</th>
                    <th className="p-2">Preț retur</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2">{r.data_retur}</td>
                      <td className="p-2">{r.denumire_material}</td>
                      <td className="p-2">{Number(r.cant_retur) ?? '-'}</td>
                      <td className="p-2">{r.motiv || '-'}</td>
                      <td className="p-2">{Number(r.pret_retur) != null ? Number(r.pret_retur).toFixed(2) : '-'}</td>
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

export default IstoricReturPage;
