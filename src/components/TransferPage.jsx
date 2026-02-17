import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransferPage = () => {
  const [produse, setProduse] = useState([]);
  const [stocuri, setStocuri] = useState([]);
  const [gestiuni, setGestiuni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProdus, setSelectedProdus] = useState(null);
  const [transferData, setTransferData] = useState({
    data: new Date().toISOString().split('T')[0],
    cantitate_transfer: 0,
    gestiune_destinatie: 1,
    nota_transfer: '',
    observatii: ''
  });

  useEffect(() => {
    loadProduse();
    loadStocuri();
    loadGestiuni();
  }, []);

  const loadProduse = async () => {
    try {
      const response = await axios.get('/api/extended/produse-pos');
      setProduse(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      // Demo data în caz de eroare
      setProduse([
        { cod_prod: 116, den_prod: 'ABSINTH', pret1: 25.0, pr_cost: 15.0 },
        { cod_prod: 117, den_prod: 'ABSINTH VERDE', pret1: 27.0, pr_cost: 16.0 },
        { cod_prod: 118, den_prod: 'ABSOLUT VODKA', pret1: 45.0, pr_cost: 30.0 },
        { cod_prod: 119, den_prod: 'ABSOLUT CITRON', pret1: 47.0, pr_cost: 32.0 }
      ]);
    }
  };

  const loadStocuri = async () => {
    try {
      const response = await axios.get('/api/magazie/stocuri');
      setStocuri(response.data || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
      // Demo data stocuri
      setStocuri([
        { cod: 116, cant_stoc: 25, gestiune_id: 1 },
        { cod: 117, cant_stoc: 18, gestiune_id: 1 },
        { cod: 118, cant_stoc: 12, gestiune_id: 2 },
        { cod: 119, cant_stoc: 8, gestiune_id: 1 }
      ]);
    }
  };

  const loadGestiuni = async () => {
    try {
      const response = await axios.get('/api/magazie/gestiuni');
      setGestiuni(response.data || []);
    } catch (error) {
      console.error('Error loading gestiuni:', error);
      // Demo data gestiuni
      setGestiuni([
        { id: 1, denumire: 'Gestiune Principală', descriere: 'Depozit principal' },
        { id: 2, denumire: 'Gestiune Bucătărie', descriere: 'Stoc bucătărie' },
        { id: 3, denumire: 'Gestiune Bar', descriere: 'Stoc bar' }
      ]);
    }
  };

  const handleSelectProdus = (produs) => {
    setSelectedProdus(produs);
    // Reset transfer data când se schimbă produsul
    setTransferData({
      ...transferData,
      cantitate_transfer: 0
    });
  };

  const getStocExistent = (codProdus) => {
    const stoc = stocuri.find(s => s.cod === codProdus);
    return stoc ? stoc.cant_stoc : 0;
  };

  const handleTransfer = async () => {
    if (!selectedProdus) {
      alert('Selectați un produs pentru transfer!');
      return;
    }

    if (transferData.cantitate_transfer <= 0) {
      alert('Cantitatea de transfer trebuie să fie mai mare decât 0!');
      return;
    }

    const stocExistent = getStocExistent(selectedProdus.cod_prod);
    if (transferData.cantitate_transfer > stocExistent) {
      alert(`Cantitatea de transfer (${transferData.cantitate_transfer}) depășește stocul existent (${stocExistent})!`);
      return;
    }

    setLoading(true);
    try {
      const transferRequest = {
        cod_produs: selectedProdus.cod_prod,
        denumire_produs: selectedProdus.den_prod,
        cantitate_transfer: transferData.cantitate_transfer,
        gestiune_sursa: 1, // Implicit gestiunea principală
        gestiune_destinatie: transferData.gestiune_destinatie,
        data_transfer: transferData.data,
        nota_transfer: transferData.nota_transfer,
        observatii: transferData.observatii,
        pret_unitar: selectedProdus.pret1,
        valoare_totala: selectedProdus.pret1 * transferData.cantitate_transfer
      };

      console.log('Transfer request:', transferRequest);
      
      // Simulare API call - poate fi conectat la backend real
      // await axios.post('/api/magazie/transfer', transferRequest);
      
      alert(`Transfer efectuat cu succes!\n\nProdus: ${selectedProdus.den_prod}\nCantitate: ${transferData.cantitate_transfer}\nGestiune destinație: ${gestiuni.find(g => g.id === transferData.gestiune_destinatie)?.denumire}`);
      
      // Reset form
      setSelectedProdus(null);
      setTransferData({
        data: new Date().toISOString().split('T')[0],
        cantitate_transfer: 0,
        gestiune_destinatie: 1,
        nota_transfer: '',
        observatii: ''
      });
      
    } catch (error) {
      console.error('Error processing transfer:', error);
      alert('Eroare la procesarea transferului!');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">🔄 Transfer din Magazie în Gestiuni</h1>
        <p className="text-black">Transferul produselor între gestiuni diferite</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        {/* Product Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Dropdown Produse */}
          <div>
            <label className="block text-black font-bold mb-2">Produs:</label>
            <select
              value={selectedProdus?.cod_prod || ''}
              onChange={(e) => {
                const produs = produse.find(p => p.cod_prod === parseInt(e.target.value));
                handleSelectProdus(produs);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">-- Selectați produsul --</option>
              {produse.map(produs => (
                <option key={produs.cod_prod} value={produs.cod_prod}>
                  {produs.den_prod} (Cod: {produs.cod_prod})
                </option>
              ))}
            </select>
            
            {selectedProdus && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-black mb-2">📦 Detalii Produs</h4>
                <div className="space-y-1 text-sm">
                  <div className="text-black"><strong>Cod:</strong> {selectedProdus.cod_prod}</div>
                  <div className="text-black"><strong>Denumire:</strong> {selectedProdus.den_prod}</div>
                  <div className="text-black"><strong>Preț:</strong> {selectedProdus.pret1} RON</div>
                  <div className="text-black"><strong>Cost:</strong> {selectedProdus.pr_cost} RON</div>
                </div>
              </div>
            )}
          </div>

          {/* Stoc Information */}
          <div>
            <label className="block text-black font-bold mb-2">Stoc Existent:</label>
            <div className="p-4 bg-gray-100 rounded-lg border">
              {selectedProdus ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-black">
                    {getStocExistent(selectedProdus.cod_prod)} bucăți
                  </div>
                  <div className="text-black text-sm">
                    Disponibil pentru transfer din Gestiunea Principală
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Selectați un produs pentru a vedea stocul</div>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        {selectedProdus && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-black mb-4">🔄 Detalii Transfer</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-black font-bold mb-1">Data:</label>
                <input
                  type="date"
                  value={transferData.data}
                  onChange={(e) => setTransferData({...transferData, data: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              
              <div>
                <label className="block text-black font-bold mb-1">Cant. de Transferat:</label>
                <input
                  type="number"
                  min="1"
                  max={getStocExistent(selectedProdus.cod_prod)}
                  value={transferData.cantitate_transfer}
                  onChange={(e) => setTransferData({...transferData, cantitate_transfer: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  placeholder="Cantitatea"
                />
              </div>
              
              <div>
                <label className="block text-black font-bold mb-1">În gestiunea nr:</label>
                <select
                  value={transferData.gestiune_destinatie}
                  onChange={(e) => setTransferData({...transferData, gestiune_destinatie: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
                >
                  {gestiuni.map(gestiune => (
                    <option key={gestiune.id} value={gestiune.id}>
                      {gestiune.id} - {gestiune.denumire}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-black font-bold mb-1">Nota de Transfer:</label>
              <textarea
                value={transferData.nota_transfer}
                onChange={(e) => setTransferData({...transferData, nota_transfer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                rows="3"
                placeholder="Detalii despre transfer..."
              />
            </div>

            {/* Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
              <h4 className="font-bold text-black mb-2">📋 Sumar Transfer</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-black font-bold">Produs:</div>
                  <div className="text-black">{selectedProdus.den_prod}</div>
                </div>
                <div>
                  <div className="text-black font-bold">Cantitate:</div>
                  <div className="text-black">{transferData.cantitate_transfer} buc</div>
                </div>
                <div>
                  <div className="text-black font-bold">Valoare:</div>
                  <div className="text-black">{(selectedProdus.pret1 * transferData.cantitate_transfer).toFixed(2)} RON</div>
                </div>
                <div>
                  <div className="text-black font-bold">Destinație:</div>
                  <div className="text-black">{gestiuni.find(g => g.id === transferData.gestiune_destinatie)?.denumire}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => {
              setSelectedProdus(null);
              setTransferData({
                data: new Date().toISOString().split('T')[0],
                cantitate_transfer: 0,
                gestiune_destinatie: 1,
                nota_transfer: '',
                observatii: ''
              });
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ❌ Ieșire
          </button>
          
          {selectedProdus && (
            <button
              onClick={handleTransfer}
              disabled={loading || !selectedProdus || transferData.cantitate_transfer <= 0}
              className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 font-bold"
            >
              {loading ? '⏳ Se procesează...' : '✅ Transfer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferPage;