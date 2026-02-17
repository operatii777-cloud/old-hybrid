import React, { useState } from 'react';

const CuratareDatePage = () => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState(null);

  const handleCuratare = async () => {
    if (confirmText !== 'CONFIRM') {
      alert('Scrie CONFIRM în câmp pentru a confirma curățarea datelor vechi.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Backend poate expune POST /api/admin/curatare-date cu parametri (ex: păstrează ultimele X zile)
      await new Promise((r) => setTimeout(r, 1500));
      setResult({ ok: true, message: 'Curățare date vechi finalizată (demo). În producție se va apela API-ul dedicat.' });
    } catch (e) {
      setResult({ ok: false, message: e.message || 'Eroare la curățare' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">🧹 Curățare date</h1>
        <p className="text-black">Ștergere sau arhivare date vechi (bonuri, jurnale, log-uri) conform politicii de păstrare.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-black mb-4">
          Această acțiune poate șterge sau arhiva date mai vechi de o anumită perioadă. Asigurați-vă că aveți backup înainte.
        </p>
        <div className="mb-4">
          <label className="block text-black font-bold mb-1">Scrie CONFIRM pentru a confirma:</label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="CONFIRM"
            className="w-full px-3 py-2 border border-gray-300 rounded text-black"
          />
        </div>
        <button
          type="button"
          onClick={handleCuratare}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white font-bold rounded hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Se execută...' : 'Execută curățare date vechi'}
        </button>
        {result && (
          <p className={`mt-4 font-bold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default CuratareDatePage;
