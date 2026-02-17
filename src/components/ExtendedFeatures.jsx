import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RAPOARTE_STOCURI_PER_PAGE = 50;

const ExtendedFeatures = () => {
  const [activeSection, setActiveSection] = useState('um-conversie');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [rapoarteStocuriPage, setRapoarteStocuriPage] = useState(1);
  const [configForm, setConfigForm] = useState({
    denumire: '', cui: '', adresa: '', cont: '', banca: ''
  });

  // Sections configuration
  const sections = {
    'um-conversie': {
      title: '🔄 Conversii Unități Măsură',
      endpoint: '/api/extended/um-conversie',
      color: 'bg-blue-500'
    },
    'produse-pos': {
      title: '💰 Produse POS (3 Preturi)',
      endpoint: '/api/extended/produse-pos',
      color: 'bg-green-500'
    },
    'bonuri-istoric': {
      title: '🧾 Bonuri Istoric', 
      endpoint: '/api/extended/bonuri-istoric',
      color: 'bg-purple-500'
    },
    'comenzi-istoric': {
      title: '📋 Comenzi Istoric',
      endpoint: '/api/extended/comenzi-istoric',
      color: 'bg-yellow-500'
    },
    'rapoarte-stocuri': {
      title: '📊 Rapoarte Stocuri (8 Perioade)',
      endpoint: '/api/extended/rapoarte-stocuri',
      color: 'bg-red-500'
    },
    'material-cost': {
      title: '💵 Material Cost Analysis',
      endpoint: '/api/extended/material-cost',
      color: 'bg-indigo-500'
    },
    'config-sistem': {
      title: '⚙️ Configurare Sistem',
      endpoint: '/api/extended/config-sistem',
      color: 'bg-gray-500'
    }
  };

  const loadData = async (section) => {
    setLoading(true);
    try {
      const response = await axios.get(sections[section].endpoint);
      setData(prev => ({ ...prev, [section]: response.data }));
    } catch (error) {
      console.error('Error loading data:', error);
      setData(prev => ({ ...prev, [section]: { error: error.message } }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'rapoarte-stocuri') setRapoarteStocuriPage(1);
  }, [activeSection]);

  useEffect(() => {
    const cfg = data['config-sistem'];
    if (cfg && typeof cfg === 'object' && !cfg.error) {
      setConfigForm(prev => ({
        ...prev,
        denumire: cfg.denumire ?? '',
        cui: cfg.cui ?? '',
        adresa: cfg.adresa ?? '',
        cont: cfg.cont ?? '',
        banca: cfg.banca ?? ''
      }));
    }
  }, [data['config-sistem']]);

  const renderUMConversie = () => {
    const items = data['um-conversie'] || [];
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">🔄 Conversii Automate</h3>
          <p className="text-sm text-blue-700 mb-3">7 unități de măsură cu conversii automate implementate din aplicația originală:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(item => (
              <div key={item.id} className="bg-white p-3 rounded border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-900">{item.um1}</span>
                  <span className="text-xs bg-blue-100 px-2 py-1 rounded">↔️</span>
                  <span className="font-bold text-blue-900">{item.um2}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Coef 1: <span className="font-mono text-blue-600">{item.coef1}</span></div>
                  <div>Coef 2: <span className="font-mono text-blue-600">{item.coef2}</span></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <h4 className="font-bold text-blue-800 mb-2">🧮 Test Conversie:</h4>
            <div className="text-sm text-blue-700">
              <div>• 2 Kg → {2 * 1000} grame (1 Kg = 1000 grame)</div>
              <div>• 1.5 Litru → {1.5 * 1000} ml (1 Litru = 1000 ml)</div>
              <div>• 3 st. 0,5 → {3 * 500} ml (1 st. 0,5 = 500 ml)</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProdusePos = () => {
    const items = (data['produse-pos'] || []).slice(0, 10);
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800 mb-2">💰 Produse POS cu 3 Preturi</h3>
          <p className="text-sm text-green-700 mb-3">119 produse POS din aplicația originală cu sistem avansat de preturi:</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100">
                <tr className="text-left text-black">
                  <th className="p-2 border border-green-200 text-black">Cod</th>
                  <th className="p-2 border border-green-200 text-black">Produs</th>
                  <th className="p-2 border border-green-200 text-black">PREȚ 1</th>
                  <th className="p-2 border border-green-200 text-black">PREȚ 2</th>
                  <th className="p-2 border border-green-200 text-black">PREȚ 3</th>
                  <th className="p-2 border border-green-200 text-black">Cost</th>
                  <th className="p-2 border border-green-200 text-black">Barcode</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.cod_prod} className="hover:bg-green-50">
                    <td className="p-2 border border-green-200 font-mono text-black">{item.cod_prod}</td>
                    <td className="p-2 border border-green-200 font-bold text-black">{item.den_prod}</td>
                    <td className="p-2 border border-green-200 text-black font-bold">{item.pret1} RON</td>
                    <td className="p-2 border border-green-200 text-black font-bold">{item.pret2} RON</td>
                    <td className="p-2 border border-green-200 text-black font-bold">{item.pret3} RON</td>
                    <td className="p-2 border border-green-200 text-black">{item.pr_cost}</td>
                    <td className="p-2 border border-green-200 font-mono text-xs text-black">{item.barcod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded">
            <div className="text-sm text-black">
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="text-center">
                  <div className="font-bold text-black">PREȚ 1 (Normal)</div>
                  <div className="text-black">Prețul standard pentru clienți obișnuiți</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-black">PREȚ 2 (Premium)</div>
                  <div className="text-black">Prețul pentru clienți fideli/membri</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-black">PREȚ 3 (VIP)</div>
                  <div className="text-black">Prețul pentru clienți VIP/corporativi</div>
                </div>
              </div>
              <div className="text-center font-bold text-black">📱 Suport complet pentru scanare barcode în POS!</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRapoarteStocuri = () => {
    const allItems = data['rapoarte-stocuri'] || [];
    const totalPages = Math.max(1, Math.ceil(allItems.length / RAPOARTE_STOCURI_PER_PAGE));
    const currentPage = Math.min(Math.max(1, rapoarteStocuriPage), totalPages);
    const start = (currentPage - 1) * RAPOARTE_STOCURI_PER_PAGE;
    const items = allItems.slice(start, start + RAPOARTE_STOCURI_PER_PAGE);

    return (
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-bold text-red-800 mb-2">📊 Rapoarte Stocuri cu 8 Perioade</h3>
          <p className="text-sm text-red-700 mb-3">
            {allItems.length} rapoarte stocuri – 50 pe pagină. Pagina {currentPage} din {totalPages}.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-100">
                <tr className="text-left text-black">
                  <th className="p-2 border border-red-200 text-black">Cod</th>
                  <th className="p-2 border border-red-200 text-black">Denumire</th>
                  <th className="p-2 border border-red-200 text-black">UM</th>
                  <th className="p-2 border border-red-200 text-black">P1</th>
                  <th className="p-2 border border-red-200 text-black">P2</th>
                  <th className="p-2 border border-red-200 text-black">P3</th>
                  <th className="p-2 border border-red-200 text-black">P4</th>
                  <th className="p-2 border border-red-200 text-black">P5</th>
                  <th className="p-2 border border-red-200 text-black">P6</th>
                  <th className="p-2 border border-red-200 text-black">P7</th>
                  <th className="p-2 border border-red-200 text-black">P8</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-red-50">
                    <td className="p-2 border border-red-200 font-mono text-black">{item.cod ?? item.id ?? '–'}</td>
                    <td className="p-2 border border-red-200 font-bold text-black">{item.denumire ?? '–'}</td>
                    <td className="p-2 border border-red-200 text-black">{item.um ?? '–'}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num1}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num2}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num3}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num4}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num5}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num6}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num7}</td>
                    <td className="p-2 border border-red-200 text-center text-black">{item.num8}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-red-200 pt-3">
              <span className="text-sm text-red-800">
                Afișate {start + 1}–{start + items.length} din {allItems.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRapoarteStocuriPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded border border-red-300 bg-white text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-red-800 font-medium">
                  Pagina {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setRapoarteStocuriPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded border border-red-300 bg-white text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100"
                >
                  Următoare →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMaterialCost = () => {
    const items = (data['material-cost'] || []).slice(0, 10);
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-2">💵 Analiza Cost Materiale</h3>
          <p className="text-sm text-indigo-700 mb-3">48+ materiale cu analiză de cost din aplicația originală:</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-indigo-100">
                <tr className="text-left text-black">
                  <th className="p-2 border border-indigo-200 text-black">Cod</th>
                  <th className="p-2 border border-indigo-200 text-black">Denumire</th>
                  <th className="p-2 border border-indigo-200 text-black">Grupă</th>
                  <th className="p-2 border border-indigo-200 text-black">Preț</th>
                  <th className="p-2 border border-indigo-200 text-black">UM</th>
                  <th className="p-2 border border-indigo-200 text-black">Stoc Min</th>
                  <th className="p-2 border border-indigo-200 text-black">TVA</th>
                  <th className="p-2 border border-indigo-200 text-black">Zile</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-indigo-50">
                    <td className="p-2 border border-indigo-200 font-mono text-black">{item.cod}</td>
                    <td className="p-2 border border-indigo-200 font-bold text-black">{item.denumire}</td>
                    <td className="p-2 border border-indigo-200 text-black">{item.grupa}</td>
                    <td className="p-2 border border-indigo-200 font-bold text-black">{item.pret} RON</td>
                    <td className="p-2 border border-indigo-200 text-black">{item.um}</td>
                    <td className="p-2 border border-indigo-200 text-black">{item.st_min}</td>
                    <td className="p-2 border border-indigo-200 text-black">{item.tva}%</td>
                    <td className="p-2 border border-indigo-200 text-black">{item.zile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveDateFirma = async () => {
    setSavingConfig(true);
    try {
      const config = data['config-sistem'] || {};
      await axios.put('/api/extended/config-sistem', {
        denumire: configForm.denumire,
        cui: configForm.cui,
        adresa: configForm.adresa,
        cont: configForm.cont,
        banca: configForm.banca,
        fifo: config.fifo ?? 1,
        lifo: config.lifo ?? 0,
        mediu: config.mediu ?? 0
      });
      await loadData('config-sistem');
    } catch (err) {
      console.error('Error saving config:', err);
    }
    setSavingConfig(false);
  };

  const renderConfigSistem = () => {
    const config = data['config-sistem'] || {};
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-bold text-black mb-2">⚙️ Configurare Sistem</h3>
          <p className="text-sm text-black mb-3">Configurare completă din aplicația originală Restaurant App Hybrid:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold text-black mb-3">🏢 Date Firmă</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-black font-bold mb-1">Denumire:</label>
                  <input type="text" value={configForm.denumire} onChange={e => setConfigForm(f => ({ ...f, denumire: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded text-black" placeholder="Nume firmă" />
                </div>
                <div>
                  <label className="block text-black font-bold mb-1">CUI:</label>
                  <input type="text" value={configForm.cui} onChange={e => setConfigForm(f => ({ ...f, cui: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded text-black" placeholder="Cod fiscal" />
                </div>
                <div>
                  <label className="block text-black font-bold mb-1">Adresa:</label>
                  <input type="text" value={configForm.adresa} onChange={e => setConfigForm(f => ({ ...f, adresa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded text-black" placeholder="Adresă sediu" />
                </div>
                <div>
                  <label className="block text-black font-bold mb-1">Cont:</label>
                  <input type="text" value={configForm.cont} onChange={e => setConfigForm(f => ({ ...f, cont: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded text-black" placeholder="Cont bancar" />
                </div>
                <div>
                  <label className="block text-black font-bold mb-1">Banca:</label>
                  <input type="text" value={configForm.banca} onChange={e => setConfigForm(f => ({ ...f, banca: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded text-black" placeholder="Bancă" />
                </div>
                <button type="button" onClick={handleSaveDateFirma} disabled={savingConfig} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium">
                  {savingConfig ? 'Se salvează...' : 'Salvează Date Firmă'}
                </button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold text-black mb-2">📊 Metoda Evaluare Stocuri</h4>
              <div className="space-y-2 text-sm">
                <div className={`p-2 rounded ${config.fifo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-black'}`}>
                  <strong className="text-black">FIFO:</strong> {config.fifo ? '✅ Activ' : '❌ Inactiv'}
                </div>
                <div className={`p-2 rounded ${config.lifo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'}`}>
                  <strong className="text-black">LIFO:</strong> {config.lifo ? '✅ Activ' : '❌ Inactiv'}
                </div>
                <div className={`p-2 rounded ${config.mediu ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-black'}`}>
                  <strong className="text-black">MEDIU:</strong> {config.mediu ? '✅ Activ' : '❌ Inactiv'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBonuriIstoric = () => {
    const items = (data['bonuri-istoric'] || []).slice(0, 10);
    return (
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-black mb-2">🧾 Bonuri Istoric</h3>
          <p className="text-sm text-black mb-3">Istoric complet al bonurilor emise în sistem:</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-100">
                <tr className="text-left text-black">
                  <th className="p-2 border border-purple-200 text-black">ID</th>
                  <th className="p-2 border border-purple-200 text-black">Denumire</th>
                  <th className="p-2 border border-purple-200 text-black">Cantitate</th>
                  <th className="p-2 border border-purple-200 text-black">Preț Unit</th>
                  <th className="p-2 border border-purple-200 text-black">Valoare</th>
                  <th className="p-2 border border-purple-200 text-black">Status</th>
                  <th className="p-2 border border-purple-200 text-black">Dept</th>
                  <th className="p-2 border border-purple-200 text-black">Barcode</th>
                  <th className="p-2 border border-purple-200 text-black">Data</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-purple-50">
                    <td className="p-2 border border-purple-200 text-black font-mono">{item.id || index + 1}</td>
                    <td className="p-2 border border-purple-200 text-black font-bold">{item.denumire || 'N/A'}</td>
                    <td className="p-2 border border-purple-200 text-black text-center">{item.cantitate || 1}</td>
                    <td className="p-2 border border-purple-200 text-black text-right">{(item.pret_unitar || 0).toFixed(2)} RON</td>
                    <td className="p-2 border border-purple-200 text-black text-right font-bold">{(item.valoare || 0).toFixed(2)} RON</td>
                    <td className="p-2 border border-purple-200 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.status === 1 ? '✅ Activ' : '❌ Inactiv'}
                      </span>
                    </td>
                    <td className="p-2 border border-purple-200 text-black text-center">{item.dep || 1}</td>
                    <td className="p-2 border border-purple-200 text-black font-mono text-xs">{item.barcode || '---'}</td>
                    <td className="p-2 border border-purple-200 text-black text-center">{item.data_bon || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Nu există bonuri în istoric.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComenziIstoric = () => {
    const items = (data['comenzi-istoric'] || []).slice(0, 10);
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-bold text-black mb-2">📋 Comenzi Istoric</h3>
          <p className="text-sm text-black mb-3">Istoric complet al comenzilor procesate:</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100">
                <tr className="text-left text-black">
                  <th className="p-2 border border-yellow-200 text-black">ID</th>
                  <th className="p-2 border border-yellow-200 text-black">Masa</th>
                  <th className="p-2 border border-yellow-200 text-black">Dept</th>
                  <th className="p-2 border border-yellow-200 text-black">Cod Prod</th>
                  <th className="p-2 border border-yellow-200 text-black">Produs</th>
                  <th className="p-2 border border-yellow-200 text-black">Cant</th>
                  <th className="p-2 border border-yellow-200 text-black">Preț</th>
                  <th className="p-2 border border-yellow-200 text-black">Valoare</th>
                  <th className="p-2 border border-yellow-200 text-black">Data</th>
                  <th className="p-2 border border-yellow-200 text-black">Ora</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-yellow-50">
                    <td className="p-2 border border-yellow-200 text-black font-mono">{item.id || index + 1}</td>
                    <td className="p-2 border border-yellow-200 text-black text-center font-bold">{item.nr_masa || 5}</td>
                    <td className="p-2 border border-yellow-200 text-black text-center">{item.nr_dep || 1}</td>
                    <td className="p-2 border border-yellow-200 text-black font-mono">{item.cod_prod || 201}</td>
                    <td className="p-2 border border-yellow-200 text-black font-bold">{item.den_prod || 'CASTRAVEȚI VERZI'}</td>
                    <td className="p-2 border border-yellow-200 text-black text-center">{item.cantitate || 0}</td>
                    <td className="p-2 border border-yellow-200 text-black text-right">{(item.pr_unitar || 0).toFixed(2)} RON</td>
                    <td className="p-2 border border-yellow-200 text-black text-right font-bold">{(item.valoare || 0).toFixed(2)} RON</td>
                    <td className="p-2 border border-yellow-200 text-black text-center">{item.data || '2005-10-14'}</td>
                    <td className="p-2 border border-yellow-200 text-black text-center">{item.ora || '12:22'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Nu există comenzi în istoric.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGenericData = (sectionKey) => {
    const items = data[sectionKey] || [];
    if (items.error) {
      return <div className="text-red-600 p-4">Eroare: {items.error}</div>;
    }

    if (Array.isArray(items)) {
      return (
        <div className="overflow-x-auto">
          <div className="text-sm text-black mb-2">Total înregistrări: {items.length}</div>
          <pre className="bg-gray-100 p-4 rounded text-xs text-black overflow-auto max-h-96">
            {JSON.stringify(items.slice(0, 5), null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <pre className="bg-gray-100 p-4 rounded text-xs text-black overflow-auto max-h-96">
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">🔄 Se încarcă...</div>;
    }

    switch(activeSection) {
      case 'um-conversie': return renderUMConversie();
      case 'produse-pos': return renderProdusePos();
      case 'bonuri-istoric': return renderBonuriIstoric();
      case 'comenzi-istoric': return renderComenziIstoric();
      case 'rapoarte-stocuri': return renderRapoarteStocuri();
      case 'material-cost': return renderMaterialCost();
      case 'config-sistem': return renderConfigSistem();
      default: return renderGenericData(activeSection);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Funcționalități Extinse</h1>
        <p className="text-gray-600">
          Toate funcționalitățile din aplicațiile originale Restaurant App Hybrid & Restaurant POS implementate în versiunea hibridă
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(sections).map(([key, section]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === key
                ? `${section.color} text-white shadow-lg`
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-4 h-4 rounded ${sections[activeSection].color}`}></div>
          <h2 className="text-xl font-bold text-gray-800">
            {sections[activeSection].title}
          </h2>
          <button
            onClick={() => loadData(activeSection)}
            className="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            🔄 Refresh
          </button>
        </div>
        
        {renderContent()}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-black">7</div>
          <div className="text-sm text-black">Unități Măsură</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-black">119</div>
          <div className="text-sm text-black">Produse POS</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-black">173+</div>
          <div className="text-sm text-black">Rapoarte Stocuri</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-black">48+</div>
          <div className="text-sm text-black">Materiale Cost</div>
        </div>
      </div>
    </div>
  );
};

export default ExtendedFeatures;