import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConfigurareSystemPage = () => {
  const [loading, setLoading] = useState(false);
  const [dateFirma, setDateFirma] = useState({
    nume: 'Restaurant Elite',
    cui: 'RO12345678',
    adresa: 'Strada Principală nr. 123, București',
    telefon: '0723456789',
    email: 'contact@restaurant-elite.ro',
    cod_fiscal: 'RO12345678',
    reg_com: 'J40/1234/2020',
    banca: 'BCR',
    cont: 'RO49RNCB0082003412345678',
    capital_social: '10000',
    administrator: 'Ion Popescu'
  });

  const [metodaEvaluare, setMetodaEvaluare] = useState('MEDIU');
  const [configGeneral, setConfigGeneral] = useState({
    tva_standard: 21,
    tva_redus: 11,
    valuta: 'RON',
    decimal_places: 2,
    auto_backup: true,
    tip_facturare: 'Standard'
  });

  const handleSaveDateFirma = async () => {
    setLoading(true);
    try {
      // Simulare salvare
      setTimeout(() => {
        alert('Datele firmei au fost salvate cu succes!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving company data:', error);
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      // Simulare salvare configurație
      setTimeout(() => {
        alert(`Configurația sistemului a fost salvată!\n\nMetoda evaluare stocuri: ${metodaEvaluare}\nTVA Standard: ${configGeneral.tva_standard}%\nTVA Redus: ${configGeneral.tva_redus}%`);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving config:', error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">⚙️ Configurare Sistem</h1>
        <p className="text-black">Configurarea completă din aplicația originală Restaurant App Hybrid</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Date Firmă - Editabile */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">🏢 Date Firmă</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-black font-bold mb-1">Nume Firmă:</label>
              <input
                type="text"
                value={dateFirma.nume}
                onChange={(e) => setDateFirma({...dateFirma, nume: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">C.U.I.:</label>
              <input
                type="text"
                value={dateFirma.cui}
                onChange={(e) => setDateFirma({...dateFirma, cui: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">Adresă:</label>
              <input
                type="text"
                value={dateFirma.adresa}
                onChange={(e) => setDateFirma({...dateFirma, adresa: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-black font-bold mb-1">Telefon:</label>
                <input
                  type="text"
                  value={dateFirma.telefon}
                  onChange={(e) => setDateFirma({...dateFirma, telefon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Email:</label>
                <input
                  type="email"
                  value={dateFirma.email}
                  onChange={(e) => setDateFirma({...dateFirma, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-black font-bold mb-1">Reg. Com.:</label>
                <input
                  type="text"
                  value={dateFirma.reg_com}
                  onChange={(e) => setDateFirma({...dateFirma, reg_com: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Capital Social:</label>
                <input
                  type="text"
                  value={dateFirma.capital_social}
                  onChange={(e) => setDateFirma({...dateFirma, capital_social: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">Bancă + Cont:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={dateFirma.banca}
                  onChange={(e) => setDateFirma({...dateFirma, banca: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded text-black"
                  placeholder="Bancă"
                />
                <input
                  type="text"
                  value={dateFirma.cont}
                  onChange={(e) => setDateFirma({...dateFirma, cont: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded text-black"
                  placeholder="IBAN"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-black font-bold mb-1">Administrator:</label>
              <input
                type="text"
                value={dateFirma.administrator}
                onChange={(e) => setDateFirma({...dateFirma, administrator: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>

            <button
              onClick={handleSaveDateFirma}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 font-bold"
            >
              {loading ? '⏳ Se salvează...' : '💾 Salvează Date Firmă'}
            </button>
          </div>
        </div>

        {/* Metoda Evaluare Stocuri - TEXT NEGRU */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">📊 Metoda Evaluare Stocuri</h2>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="metodaEvaluare"
                  value="FIFO"
                  checked={metodaEvaluare === 'FIFO'}
                  onChange={(e) => setMetodaEvaluare(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-bold text-black">FIFO (First In, First Out)</div>
                  <div className="text-black text-sm">Prima intrare, prima ieșire</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="metodaEvaluare"
                  value="LIFO"
                  checked={metodaEvaluare === 'LIFO'}
                  onChange={(e) => setMetodaEvaluare(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-bold text-black">LIFO (Last In, First Out)</div>
                  <div className="text-black text-sm">Ultima intrare, prima ieșire</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="metodaEvaluare"
                  value="MEDIU"
                  checked={metodaEvaluare === 'MEDIU'}
                  onChange={(e) => setMetodaEvaluare(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-bold text-black">COST MEDIU PONDERAT</div>
                  <div className="text-black text-sm">Preț mediu ponderat pe perioada selectată</div>
                </div>
              </label>
            </div>

            {/* Configurări Generale */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-bold text-black">⚙️ Configurări Generale</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-black font-bold mb-1">TVA Standard (%):</label>
                  <input
                    type="number"
                    value={configGeneral.tva_standard}
                    onChange={(e) => setConfigGeneral({...configGeneral, tva_standard: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-black font-bold mb-1">TVA Redus (%):</label>
                  <input
                    type="number"
                    value={configGeneral.tva_redus}
                    onChange={(e) => setConfigGeneral({...configGeneral, tva_redus: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-black font-bold mb-1">Valută:</label>
                  <select
                    value={configGeneral.valuta}
                    onChange={(e) => setConfigGeneral({...configGeneral, valuta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  >
                    <option value="RON">RON</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-black font-bold mb-1">Zecimale:</label>
                  <select
                    value={configGeneral.decimal_places}
                    onChange={(e) => setConfigGeneral({...configGeneral, decimal_places: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  >
                    <option value="2">2 zecimale</option>
                    <option value="3">3 zecimale</option>
                    <option value="4">4 zecimale</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-black">
                  <input
                    type="checkbox"
                    checked={configGeneral.auto_backup}
                    onChange={(e) => setConfigGeneral({...configGeneral, auto_backup: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="font-bold text-black">Auto-backup zilnic</span>
                </label>
                
                <div>
                  <label className="block text-black font-bold mb-1">Tip Facturare:</label>
                  <select
                    value={configGeneral.tip_facturare}
                    onChange={(e) => setConfigGeneral({...configGeneral, tip_facturare: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Simplificata">Simplificată</option>
                    <option value="Electronica">Electronică (e-Factura)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 font-bold"
            >
              {loading ? '⏳ Se salvează...' : '💾 Salvează Configurația'}
            </button>
          </div>
        </div>
      </div>

      {/* Rezumat Current Config */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-bold text-black mb-4">📋 Configurația Curentă</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-black mb-2">🏢 Date Firmă:</h4>
            <div className="text-sm text-black space-y-1">
              <div><strong>Nume:</strong> {dateFirma.nume}</div>
              <div><strong>C.U.I.:</strong> {dateFirma.cui}</div>
              <div><strong>Telefon:</strong> {dateFirma.telefon}</div>
              <div><strong>Email:</strong> {dateFirma.email}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-black mb-2">⚙️ Sistem:</h4>
            <div className="text-sm text-black space-y-1">
              <div><strong>Metodă Evaluare:</strong> <span className="font-bold text-blue-600">{metodaEvaluare}</span></div>
              <div><strong>TVA Standard:</strong> {configGeneral.tva_standard}%</div>
              <div><strong>TVA Redus:</strong> {configGeneral.tva_redus}%</div>
              <div><strong>Valută:</strong> {configGeneral.valuta}</div>
              <div><strong>Auto-backup:</strong> {configGeneral.auto_backup ? '✅ Activ' : '❌ Inactiv'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-bold text-black mb-2">ℹ️ Explicații Metode Evaluare</h4>
        <div className="text-sm text-black space-y-2">
          <div><strong>FIFO:</strong> Stocurile sunt evaluate la prețul primelor intrări (cel mai vechi)</div>
          <div><strong>LIFO:</strong> Stocurile sunt evaluate la prețul ultimelor intrări (cel mai nou)</div>
          <div><strong>COST MEDIU PONDERAT:</strong> Stocurile sunt evaluate la prețul mediu calculat din toate intrările</div>
          <div className="text-red-600 font-bold">⚠️ Modificarea metodei afectează calculele de preț pentru toate stocurile!</div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurareSystemPage;