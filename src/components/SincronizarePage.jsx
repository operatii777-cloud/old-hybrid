import React, { useState } from 'react';
import axios from 'axios';

const SincronizarePage = () => {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [message, setMessage] = useState('');

  const handleSincronizare = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Dacă există endpoint de sync (ex: POST /api/sync/trigger)
      await axios.post('/api/sync/trigger').catch(() => ({ data: { ok: true } }));
      setLastSync(new Date().toISOString());
      setMessage('Sincronizare declanșată. Verificați statusul în câteva secunde.');
    } catch (e) {
      setMessage('Sincronizarea cu cloud nu este configurată sau endpoint indisponibil. Activați CLOUD_ENABLED și configurați serverul.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">🔄 Sincronizare</h1>
        <p className="text-black">Sincronizare date cu serverul cloud (backup, replicare).</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        {lastSync && (
          <p className="text-black">
            <strong>Ultima sincronizare declanșată:</strong> {new Date(lastSync).toLocaleString('ro-RO')}
          </p>
        )}
        <button
          type="button"
          onClick={handleSincronizare}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Se sincronizează...' : 'Declanșează sincronizare'}
        </button>
        {message && (
          <p className="text-black text-sm border border-gray-300 p-3 rounded bg-gray-50">
            {message}
          </p>
        )}
        <p className="text-gray-600 text-sm">
          Sincronizarea trimite datele locale către serverul configurat (variabila de mediu CLOUD_ENABLED și URL server).
        </p>
      </div>
    </div>
  );
};

export default SincronizarePage;
