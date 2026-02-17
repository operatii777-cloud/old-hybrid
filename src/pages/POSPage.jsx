import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRestaurantStore } from '../stores/restaurantStore';

export default function POSPage() {
  const { ospatar, mese, currentComanda, addProdusToComanda, selectMasa } = useRestaurantStore();
  const [produse, setProduse] = useState([]);
  const [categorie, setCategorie] = useState('RACORITOARE');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ospatar) return;

    // Fetch products by category
    const fetchProduse = async () => {
      try {
        setError('');
        const response = await axios.get(`/api/produse/categoria/${categorie}`);
        setProduse(response.data || []);
      } catch (err) {
        console.error('Fetch produse error:', err);
        setError(`Error loading products: ${err.message}`);
      }
    };

    fetchProduse();
  }, [categorie, ospatar]);

  if (!ospatar) {
    return <div className="flex items-center justify-center h-screen">Nu ești logat!</div>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 bg-gray-800 p-4 rounded">
        <h1 className="text-2xl font-bold">🍽️ Restaurant POS</h1>
        <div className="text-right">
          <p className="text-sm">Ospătar: <span className="font-bold">{ospatar.nume}</span></p>
          <p className="text-xs text-gray-400">Mode: Hibrid (Local + Cloud)</p>
        </div>
      </header>

      {error && <div className="bg-red-600 p-2 rounded mb-4 text-sm">{error}</div>}

      {/* Main Layout */}
      <div className="grid grid-cols-4 gap-4">
        {/* Left: Tables Grid */}
        <div className="col-span-1">
          <h2 className="text-lg font-bold mb-2">Mese</h2>
          <div className="grid grid-cols-4 gap-2 bg-gray-800 p-2 rounded h-96 overflow-y-auto">
            {mese.map(masa => (
              <button
                key={masa.id}
                onClick={() => selectMasa(masa.id)}
                className={`p-2 font-bold rounded text-sm ${
                  masa.status === 'ocupata' ? 'bg-red-600' : 'bg-green-600'
                } hover:opacity-80`}
              >
                {masa.id}
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Products */}
        <div className="col-span-2">
          <h2 className="text-lg font-bold mb-2">Produse ({produse.length})</h2>
          
          {/* Categories */}
          <div className="grid grid-cols-5 gap-1 mb-2 bg-gray-800 p-2 rounded">
            {['RACORITOARE', 'VINURI', 'ALCOOLICE', 'PREP PUI', 'DIVERSE'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className={`p-2 rounded text-xs font-bold ${
                  categorie === cat ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-4 gap-2 bg-gray-800 p-2 rounded h-96 overflow-y-auto">
            {produse.length === 0 ? (
              <div className="col-span-4 text-center text-gray-400">No products in this category</div>
            ) : (
              produse.map(produs => (
                <button
                  key={produs.cod_prod}
                  onClick={() => addProdusToComanda(produs)}
                  className="bg-orange-500 hover:bg-orange-600 p-2 rounded text-sm font-bold text-black"
                >
                  <div>{produs.den_prod}</div>
                  <div className="text-xs">{produs.pret_vanzare} RON</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Current Order */}
        <div className="col-span-1">
          <h2 className="text-lg font-bold mb-2">Comandă</h2>
          <div className="bg-gray-800 p-3 rounded h-96 overflow-y-auto">
            {currentComanda.linii.length === 0 ? (
              <p className="text-gray-400 text-sm">Nicio comandă</p>
            ) : (
              <div>
                {currentComanda.linii.map((linie, idx) => (
                  <div key={idx} className="border-b border-gray-600 py-2 text-sm">
                    <div className="font-bold">{linie.den_prod}</div>
                    <div className="text-xs text-gray-400">
                      {linie.cant}x {linie.pret_unitar} = {linie.valoare}
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-gray-600 font-bold text-lg">
                  Total: {currentComanda.total} RON
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
