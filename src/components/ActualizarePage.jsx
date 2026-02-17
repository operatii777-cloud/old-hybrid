import React, { useState } from 'react';

/**
 * Pagină Actualizare – conform RestGest: dialog "Actual" cu
 * 1. Actualizare preturi Materii Prime
 * 2. Actualizare preturi Retete
 * Start, bară progres, Iesire.
 */
const ActualizarePage = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null); // 'materii' | 'retete' | null
  const [done, setDone] = useState(false);

  const runActualizare = async () => {
    setRunning(true);
    setDone(false);
    setProgress(0);
    setCurrentStep('materii');

    // Faza 1: Actualizare preturi Materii Prime
    for (let i = 0; i <= 50; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      setProgress(i);
    }
    setCurrentStep('retete');

    // Faza 2: Actualizare preturi Retete
    for (let i = 55; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      setProgress(i);
    }

    setCurrentStep(null);
    setDone(true);
    setRunning(false);
  };

  const handleIesire = () => {
    if (!running) {
      setProgress(0);
      setCurrentStep(null);
      setDone(false);
    }
  };

  return (
    <div className="p-6 flex items-center justify-center min-h-[400px] bg-gray-100">
      {/* Dialog "Actual" – conform screenshot RestGest */}
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300 w-full max-w-md overflow-hidden">
        {/* Titlu */}
        <div className="bg-gray-200 px-4 py-2 border-b border-gray-400">
          <h2 className="text-lg font-bold text-black">Actual</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Buton Start */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={runActualizare}
              disabled={running}
              className="px-8 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start
            </button>
          </div>

          {/* Bară progres */}
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border border-gray-400">
            <div
              className="h-full bg-blue-600 transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Texte cele două operații – conform foto */}
          <div className="space-y-2 text-black text-sm">
            <p className={currentStep === 'materii' ? 'font-bold' : ''}>
              Actualizare preturi Materii Prime ...
            </p>
            <p className={currentStep === 'retete' ? 'font-bold' : ''}>
              Actualizare preturi Retete ...
            </p>
          </div>

          {/* Buton Iesire */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleIesire}
              disabled={running}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iesire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActualizarePage;
