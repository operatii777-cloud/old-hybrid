import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Lista exemplu produse fără rețetă (ca în foto 4)
const PRODUSE_FARA_RETETA_DEMO = [
  'BERGENBIER UNFILTRE',
  'STELA ARTOIS 400ML',
  'LEFE 400ML',
  'BALLANTINES 50ML',
  'CUTTY SARK 50ML',
  'GLENGRANT 10Y',
  'MARTINI ROSE',
  'TEACHERS'
];

const VerificareRetetePage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [produseFaraReteta, setProduseFaraReteta] = useState([]);

  const handleStart = () => {
    setIsRunning(true);
    setProgress(0);
    setProduseFaraReteta([]);

    const step = 100 / 20;
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= 100) {
        clearInterval(interval);
        setProgress(100);
        setIsRunning(false);
        // După finalizare, afișăm produsele fără rețetă (din API sau listă demo)
        loadProduseFaraReteta();
        return;
      }
      setProgress(Math.round(current));
    }, 100);
  };

  const loadProduseFaraReteta = async () => {
    try {
      const [produseRes, reteteRes] = await Promise.all([
        axios.get('/api/extended/produse-pos').catch(() => ({ data: [] })),
        axios.get('/api/magazie/retete').catch(() => ({ data: [] }))
      ]);
      const produse = produseRes.data || [];
      const retete = reteteRes.data || [];
      // Produsele care au rețetă sunt cele care au cel puțin o linie în retete (cod_ret = cod_prod)
      const coduriCuReteta = new Set(
        (retete || [])
          .map(r => String(r.cod_ret ?? '').trim())
          .filter(Boolean)
      );
      const faraReteta = (produse || [])
        .filter(p => !coduriCuReteta.has(String(p.cod_prod ?? '').trim()))
        .map(p => (p.den_prod || p.denumire || '').trim())
        .filter(Boolean);
      setProduseFaraReteta(faraReteta);
    } catch {
      setProduseFaraReteta(PRODUSE_FARA_RETETA_DEMO);
    }
  };

  return (
    <div className="bg-gray-100 min-h-full p-6 text-black" style={{ minHeight: '100%' }}>
      <h1 className="text-xl font-bold mb-4 text-black">Verificare retete</h1>

      <div className="max-w-2xl">
        <div className="text-center mb-4">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-8 py-2 border-2 border-gray-400 bg-white font-bold text-black shadow-lg hover:bg-gray-50 disabled:opacity-70"
          >
            Start
          </button>
        </div>

        <div className="mb-4">
          <div className="w-full bg-white border-2 border-gray-400 h-8 overflow-hidden rounded">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-400 rounded p-4 min-h-[200px]">
          {produseFaraReteta.map((denumire, i) => (
            <div key={i} className="text-black py-1">
              Nu exista reteta la: {denumire}
            </div>
          ))}
          {!isRunning && progress === 0 && produseFaraReteta.length === 0 && (
            <div className="text-gray-500 py-4">Apăsați Start pentru a verifica prezența rețetelor.</div>
          )}
          {!isRunning && progress === 100 && produseFaraReteta.length === 0 && (
            <div className="text-green-600 py-4">Toate produsele au rețetă definită.</div>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => window.history.back?.()}
            className="px-6 py-2 border-2 border-gray-500 bg-white text-black rounded font-bold hover:bg-gray-100"
          >
            Iesire
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificareRetetePage;
