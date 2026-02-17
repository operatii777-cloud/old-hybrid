import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCompatibleUnits, getConversionFactor, UNIT_CONVERSIONS } from '../utils/unitConversions';
import TransferModal from './TransferModal';

// Componentă Modal pentru Selecție sau Creare Ingrediente
const IngredientSelectorModal = ({ isOpen, onClose, onSelect, ingrediente, onCreeazaIngredient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // State pentru formularul de creare noua
  const [newIng, setNewIng] = useState({
    denumire: '',
    um: 'kg',
    pret: 0,
    tva: 9,
    barcod: ''
  });

  if (!isOpen) return null;

  // Reset la deschidere daca nu e in mod creare
  const handleClose = () => {
    setShowCreateForm(false);
    setNewIng({ denumire: '', um: 'kg', pret: 0, tva: 9, barcod: '' });
    onClose();
  }

  const handleCreate = () => {
    if (!newIng.denumire) return alert("Introduceți denumirea!");
    onCreeazaIngredient(newIng); // Trimitem la parinte sa se ocupe de salvare si selectie
    handleClose();
  }

  const filteredIngrediente = ingrediente.filter(item =>
    item.denumire.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.cod && item.cod.toString().includes(searchTerm)) ||
    (item.barcod && item.barcod.toString().includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">
            {showCreateForm ? '✨ Creează Ingredient Nou' : '🔍 Selectează Ingredient din Stoc'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>
        </div>

        {!showCreateForm ? (
          <>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Caută după denumire sau cod..."
                className="flex-1 p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => {
                  setNewIng(prev => ({ ...prev, denumire: searchTerm })); // Precompletam cu ce a cautat
                  setShowCreateForm(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-green-700 whitespace-nowrap"
              >
                + Ingredient Nou
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border rounded bg-gray-50">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-200 sticky top-0 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="p-3 border-b">Cod</th>
                    <th className="p-3 border-b">Denumire</th>
                    <th className="p-3 border-b text-center">U.M.</th>
                    <th className="p-3 border-b text-right">Ultimul Preț</th>
                    <th className="p-3 border-b text-right">Stoc</th>
                    <th className="p-3 border-b text-center">Acțiune</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngrediente.map(ing => (
                    <tr key={ing.cod} className="hover:bg-blue-100 border-b bg-white transition-colors cursor-pointer" onClick={() => { onSelect(ing); handleClose(); }}>
                      <td className="p-3 font-mono text-xs text-gray-500">{ing.cod}</td>
                      <td className="p-3 font-bold text-gray-800">{ing.denumire}</td>
                      <td className="p-3 text-center">{ing.um}</td>
                      <td className="p-3 text-right">{ing.pret} RON</td>
                      <td className="p-3 text-right">{ing.st_min || 0}</td>
                      <td className="p-3 text-center">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs uppercase font-bold"
                        >
                          Alege
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredIngrediente.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <span>Nu s-au găsit ingrediente pentru "{searchTerm}".</span>
                        <button
                          onClick={() => {
                            setNewIng(prev => ({ ...prev, denumire: searchTerm }));
                            setShowCreateForm(true);
                          }}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          Creează "{searchTerm}" acum
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800 mb-2">
              ℹ️ Se va genera automat un cod nou și ingredientul va fi salvat în Nomenclator.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Denumire Produs</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500"
                  value={newIng.denumire}
                  onChange={(e) => setNewIng({ ...newIng, denumire: e.target.value })}
                  placeholder="Ex: Faina Alba 000"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Unitate de Măsură (Bază)</label>
                <select
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 bg-white"
                  value={newIng.um}
                  onChange={(e) => setNewIng({ ...newIng, um: e.target.value })}
                >
                  <option value="kg">kilogram (kg)</option>
                  <option value="grame">grame</option>
                  <option value="litru">litru (l)</option>
                  <option value="ml">mililitru (ml)</option>
                  <option value="buc">bucăţi (buc)</option>
                  <option value="bax">bax</option>
                  <option value="portie">porție</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preț Referință (fără TVA)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500"
                  value={newIng.pret}
                  onChange={(e) => setNewIng({ ...newIng, pret: parseFloat(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cota TVA (%)</label>
                  <select
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 bg-white"
                    value={newIng.tva}
                    onChange={(e) => setNewIng({ ...newIng, tva: parseFloat(e.target.value) })}
                  >
                    <option value="9">9% (Alimente)</option>
                    <option value="19">19% (General)</option>
                    <option value="5">5% (Special)</option>
                    <option value="0">0%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cod Bare (Optional)</label>
                  <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" value={newIng.barcod} onChange={e => setNewIng({ ...newIng, barcod: e.target.value })} placeholder="Scanați sau introduceți..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold"
              >
                Anulează
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 font-bold flex items-center gap-2"
              >
                💾 Salvează și Adaugă în NIR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NIRPage = ({ mode = 'magazie' }) => {
  const [activeTab, setActiveTab] = useState(mode || 'magazie'); // 'magazie' sau 'gestiuni'

  // Data
  const [ingredienteList, setIngredienteList] = useState([]);
  const [gestiuni, setGestiuni] = useState([]);
  const [furnizori, setFurnizori] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  // Form Data
  const [headerData, setHeaderData] = useState({
    data: new Date().toISOString().split('T')[0],
    fact_nr: '',
    nir_nr: '',
    furnizor_id: '',
    gestiune_id: '',
    observatii: ''
  });

  const [defaultAdaos, setDefaultAdaos] = useState(300);

  // Table Data (NIR Items)
  const [items, setItems] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Barcode Scanner Logic
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignoram daca suntem intr-un input field (pentru a nu interfera cu tastarea normala)
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        // Totusi, daca e un scanner, de obicei scrie foarte repede. 
        // Putem lasa bufferul sa lucreze global daca nu e focusat un input crucial.
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastScanTime;

      if (e.key === 'Enter') {
        if (scanBuffer.length > 2) { // Minimum length to avoid accidental single key presses
          processBarcode(scanBuffer);
        }
        setScanBuffer('');
      } else if (e.key.length === 1) { // Only process single character keys
        // If time between key presses is very small (< 50ms), it's likely a scanner
        if (timeDiff < 50 || scanBuffer === '') {
          setScanBuffer(prev => prev + e.key);
        } else {
          // If a long pause, reset buffer and start new scan
          setScanBuffer(e.key);
        }
      }
      setLastScanTime(currentTime);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanBuffer, lastScanTime, ingredienteList]); // Depend on ingredienteList to have latest data

  const processBarcode = (code) => {
    console.log("Scanned Barcode:", code);
    const found = ingredienteList.find(ing =>
      (ing.barcod && ing.barcod.toString() === code) ||
      (ing.cod && ing.cod.toString() === code)
    );
    if (found) {
      handleAddItem(found);
      // Optional: sound or visual feedback
    } else {
      // alert(`Codul ${code} nu a fost găsit în baza de date.`); // Uncomment for user feedback
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/parser/parse-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setImportResults(response.data);
        setIsImportModalOpen(true);
      }
    } catch (err) {
      console.error("PDF Import error:", err);
      alert("Eroare la procesarea PDF: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const addImportedItem = (sugg) => {
    // Incearca sa gaseasca un ingredient existent cu nume similar
    let found = ingredienteList.find(ing =>
      ing.denumire.toLowerCase().includes(sugg.suggested_name.toLowerCase()) ||
      sugg.suggested_name.toLowerCase().includes(ing.denumire.toLowerCase())
    );

    if (found) {
      handleAddItem({
        ...found,
        pret: parseFloat(sugg.suggested_price.replace(',', '.')) || found.pret,
        cantitate: parseFloat(sugg.suggested_qty.replace(',', '.')) || 1
      });
    } else {
      // Daca nu il gasim, cream un item generic in tabel (utilizatorul il va asocia manual)
      const newItem = {
        id: Date.now() + Math.random(),
        cod_prod: '?',
        denumire: sugg.suggested_name,
        um: '?',
        um_intrare: 'kg',
        um_stoc: 'kg',
        cantitate: parseFloat(sugg.suggested_qty.replace(',', '.')) || 1,
        pret_unitar: parseFloat(sugg.suggested_price.replace(',', '.')) || 0,
        cota_tva: 9,
        valoare: (parseFloat(sugg.suggested_qty) || 1) * (parseFloat(sugg.suggested_price) || 0),
        tva_valoare: 0,
        adaos_proc: 300
      };
      setItems([...items, newItem]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Materii Prime (Ingrediente)
      const respMat = await axios.get('/api/magazie/materii-prime'); // sau endpoint-ul corect
      setIngredienteList(respMat.data || []);

      // 2. Gestiuni
      const respGest = await axios.get('/api/magazie/gestiuni');
      setGestiuni(respGest.data || []);

      // 3. Furnizori
      const respFurn = await axios.get('/api/magazie/furnizori');
      setFurnizori(respFurn.data || []);

      // Select prima gestiune default
      if (respGest.data && respGest.data.length > 0) {
        setHeaderData(prev => ({
          ...prev,
          gestiune_id: respGest.data[0].id
        }));
      }

      if (respFurn.data && respFurn.data.length > 0) {
        setHeaderData(prev => ({
          ...prev,
          furnizor_id: respFurn.data[0].id
        }));
      }

    } catch (err) {
      console.error("Eroare incarcare date:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleAddItem = (ingredient) => {
    const umDb = ingredient.um || 'kg';

    // Găsim unitățile compatibile (ex: dacă umDb='grame', găsim ['kg', 'mg', 'grame'])
    // Dacă nu găsim compatibile, punem doar unitatea din db
    const compatibleUnits = getCompatibleUnits(umDb);
    // Dacă lista e goală (nu e definită unitatea), punem unitatea originală ca unică opțiune
    const unitOptions = compatibleUnits.length > 0 ? compatibleUnits : [umDb];

    const newItem = {
      id: Date.now(),
      cod_prod: ingredient.cod,
      denumire: ingredient.denumire,
      um_stoc: umDb,          // Unitatea de bază (stoc)
      um_intrare: umDb,       // Unitatea de pe factură (default baza)
      unit_options: unitOptions, // Lista de opțiuni
      cantitate: 0,
      pret_unitar: ingredient.pret || 0,
      cota_tva: 9,
      valoare: 0,
      tva_valoare: 0,
      adaos_proc: 300,
      pret_vanzare: 0,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      // Dacă schimbăm UM Intrare, poate vrem să recalculăm conversia? 
      // De fapt, doar cantitatea de stoc se schimbă la final.
      // Aici nu resetăm cantitatea sau prețul, userul le introduce manual conform facturii.

      // Calcul Valoric (rămâne la fel: cantitate * pret din factură)
      if (['cantitate', 'pret_unitar', 'cota_tva'].includes(field)) {
        const cant = parseFloat(updatedItem.cantitate) || 0;
        const pret = parseFloat(updatedItem.pret_unitar) || 0;
        const cota = parseFloat(updatedItem.cota_tva) || 0;

        updatedItem.valoare = cant * pret;
        updatedItem.tva_valoare = updatedItem.valoare * (cota / 100);
      }

      return updatedItem;
    }));
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  // --- Creare Ingredient Nou ---
  const handleCreateIngredient = async (newIngData) => {
    try {
      // 1. Generare Cod Nou (Max + 1)
      // Cautam cel mai mare cod numeric existent
      let maxCod = 0;
      ingredienteList.forEach(ing => {
        const codNum = parseInt(ing.cod);
        if (!isNaN(codNum) && codNum > maxCod) maxCod = codNum;
      });
      const newCod = (maxCod + 1).toString();

      // 2. Salvare in Backend
      const payload = {
        cod: newCod,
        denumire: newIngData.denumire,
        um: newIngData.um,
        pret: newIngData.pret,
        grupa: 1, // Implicit Materii Prime
        tva: 1 + (newIngData.tva / 100), // Backend asteapta coeficient si e posibil sa fie float
        barcod: newIngData.barcod || null // Add barcode
      };

      await axios.post('/api/magazie/materii-prime', payload);

      // 3. Adaugare locala si selectare
      const newIngredientFull = { ...payload, cod: newCod, tva: newIngData.tva }; // Ajustam pt frontend
      setIngredienteList([...ingredienteList, newIngredientFull]);
      handleAddItem(newIngredientFull); // Adaugam direct in NIR

      alert(`Ingredientul "${newIngData.denumire}" a fost creat cu codul ${newCod}!`);

    } catch (e) {
      console.error("Eroare creare ingredient:", e);
      alert("Eroare la crearea ingredientului: " + e.message);
    }
  };


  // --- Calcule Totale ---
  const totalBaza = items.reduce((acc, item) => acc + (item.valoare || 0), 0);
  const totalTVA = items.reduce((acc, item) => acc + (item.tva_valoare || 0), 0);
  const totalGeneral = totalBaza + totalTVA;

  // --- Generare NIR Extins ---
  const handleGenerateExtended = () => {
    // Calculam valorile extinse pentru fiecare item inainte de afisare
    // Deocamdata doar setam flag-ul, calculele se pot face si on-the-fly in render
    setShowExtended(true);
  };

  const handleSaveToDatabase = async () => {
    if (!headerData.fact_nr) return alert("Introduceți numărul facturii!");
    if (!headerData.furnizor_id) return alert("Selectați un furnizor!");
    if (!window.confirm("Confirmi salvarea NIR-ului în baza de date?")) return;

    try {
      setLoading(true);

      const bulkItems = items.map(item => {
        const factor = getConversionFactor(item.um_intrare, item.um_stoc);
        return {
          cod_prod: item.cod_prod,
          cant_factura: item.cantitate,
          cant_stoc: parseFloat(item.cantitate) * factor,
          pret_stoc: parseFloat(item.pret_unitar) / factor,
          valoare: item.valoare,
          adaos: item.adaos_proc || defaultAdaos
        };
      });

      const response = await axios.post('/api/magazie/nir-bulk', {
        header: headerData,
        items: bulkItems
      });

      alert(response.data.message || "NIR salvat cu succes!");
      setItems([]);
      setShowExtended(false);
      setHeaderData(prev => ({ ...prev, fact_nr: '', nir_nr: '' })); // Reset dupa succes
    } catch (e) {
      console.error(e);
      alert("Eroare la salvare: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-[95%] mx-auto font-sans text-gray-800">

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📄 Notă de Intrare și Recepție (NIR)</h1>
          <p className="text-gray-500 text-sm">Introduceți datele recepției conform facturii fiscale.</p>
        </div>
        <div className="space-x-2 flex">
          <input
            type="file"
            id="pdf-upload"
            className="hidden"
            accept=".pdf"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="pdf-upload"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded shadow font-bold cursor-pointer flex items-center gap-2"
            title="Încarcă Factură PDF"
          >
            {loading ? '⏳ Se procesează...' : '📄 Import Factură'}
          </label>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2 mr-2"
          >
            📦 Transfer Gestiuni
          </button>

          {!showExtended ? (
            <button
              onClick={handleGenerateExtended}
              disabled={items.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:bg-gray-400 font-bold"
            >
              ⚙️ Generează NIR Extins
            </button>
          ) : (
            <button
              onClick={() => setShowExtended(false)}
              className="bg-gray-500 text-white px-6 py-2 rounded shadow hover:bg-gray-600 font-bold"
            >
              ✏️ Înanpoi la Editare
            </button>
          )}
        </div>
      </div>

      {/* --- FORM HEADER (Data, Furnizor, etc) --- */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">📅 Data Facturii</label>
          <input
            type="date"
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
            value={headerData.data}
            onChange={e => setHeaderData({ ...headerData, data: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">📄 Nr. Factură</label>
          <input
            type="text"
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 12345"
            value={headerData.fact_nr}
            onChange={e => setHeaderData({ ...headerData, fact_nr: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nr. NIR (Intern)</label>
          <input
            type="text"
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Automat sau Manual"
            value={headerData.nir_nr}
            onChange={e => setHeaderData({ ...headerData, nir_nr: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">🚚 Furnizor</label>
          <select
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 bg-white"
            value={headerData.furnizor_id}
            onChange={e => setHeaderData({ ...headerData, furnizor_id: e.target.value })}
          >
            <option value="">- Alege furnizor -</option>
            {furnizori.map(f => <option key={f.id} value={f.id}>{f.denumire}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">🏭 Gestiune Destinație</label>
          <select
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
            value={headerData.gestiune_id}
            onChange={e => setHeaderData({ ...headerData, gestiune_id: e.target.value })}
          >
            {gestiuni.map(g => <option key={g.id} value={g.id}>{g.nume}</option>)}
          </select>
        </div>
      </div>

      {/* --- TABEL INPUT --- */}
      {!showExtended && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-700">1️⃣ Introducere Date Recepție</h3>
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 font-bold"
            >
              ➕ Adaugă Ingredient din Stoc
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="p-3 border-b text-center w-12">Nr.</th>
                  <th className="p-3 border-b w-1/4">Denumire Produs (Materie Primă)</th>
                  <th className="p-3 border-b w-24">Cod</th>
                  <th className="p-3 border-b w-32">Cant. Intrare</th>
                  <th className="p-3 border-b w-24 text-center">U.M. Intrare</th>
                  <th className="p-3 border-b w-32">Preț Unitar (pe UM selectată)</th>
                  <th className="p-3 border-b w-24">Cotă TVA %</th>
                  <th className="p-3 border-b w-32">Valoare (fără TVA)</th>
                  <th className="p-3 border-b w-32">Valoare TVA</th>
                  <th className="p-3 border-b w-12 text-center">🗑️</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="11" className="p-8 text-center text-gray-400 italic">Niciun produs adăugat. Folosiți butonul "Adaugă Ingredient".</td></tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 group">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {item.denumire}
                        <div className="text-xs text-blue-600 font-mono">
                          (Bază: {item.um_stoc})
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-xs">{item.cod_prod}</td>

                      {/* INPUTS EDITABILE */}
                      <td className="p-2 bg-blue-50 border-l border-blue-100">
                        <input
                          type="number"
                          className="w-full text-right p-1 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                          value={item.cantitate}
                          onChange={e => handleUpdateItem(item.id, 'cantitate', e.target.value)}
                          min="0" step="0.01"
                        />
                      </td>
                      <td className="p-2 text-center bg-blue-50">
                        {item.unit_options && item.unit_options.length > 1 ? (
                          <select
                            className="w-full text-sm p-1 border rounded bg-white"
                            value={item.um_intrare}
                            onChange={e => handleUpdateItem(item.id, 'um_intrare', e.target.value)}
                          >
                            {item.unit_options.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        ) : (
                          <span>{item.um_intrare}</span>
                        )}
                      </td>
                      <td className="p-2 bg-blue-50">
                        <input
                          type="number"
                          className="w-full text-right p-1 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                          value={item.pret_unitar}
                          onChange={e => handleUpdateItem(item.id, 'pret_unitar', e.target.value)}
                          min="0" step="0.01"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          className="w-full text-right p-1 border rounded"
                          value={item.cota_tva}
                          onChange={e => handleUpdateItem(item.id, 'cota_tva', e.target.value)}
                        >
                          <option value="9">9%</option>
                          <option value="19">19%</option>
                          <option value="5">5%</option>
                          <option value="0">0%</option>
                        </select>
                      </td>

                      {/* CALULATE READONLY */}
                      <td className="p-3 text-right font-mono font-medium">{item.valoare.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-gray-600">{item.tva_valoare.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-700">&times;</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALURI INPUT */}
          <div className="bg-gray-100 p-4 flex justify-end gap-8 border-t">
            <div className="text-right">
              <div className="text-gray-500 text-xs uppercase font-bold">Total Valoare (Fără TVA)</div>
              <div className="text-xl font-bold text-gray-800">{totalBaza.toFixed(2)} RON</div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-xs uppercase font-bold">Total TVA</div>
              <div className="text-xl font-bold text-gray-800">{totalTVA.toFixed(2)} RON</div>
            </div>
            <div className="text-right border-l pl-8 border-gray-300">
              <div className="text-gray-500 text-xs uppercase font-bold">Total Factură</div>
              <div className="text-2xl font-black text-blue-700">{totalGeneral.toFixed(2)} RON</div>
            </div>
          </div>
        </div>
      )}


      {/* --- TABEL EXTINS (GENERAT) --- */}
      {showExtended && (
        <div className="bg-white rounded-lg shadow-xl border border-blue-200 overflow-hidden animation-fade-in-up">
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg">2️⃣ NIR Extins - Calcul Comercial & Export</h3>
            <div className="text-sm opacity-90">Mod: Vizualizare & Validare Finală</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold border-b-2 border-gray-300">
                <tr>
                  <th className="p-2 border-r">Nr.</th>
                  <th className="p-2 border-r w-1/4">Denumire Produs</th>
                  <th className="p-2 border-r text-center">U.M.</th>
                  <th className="p-2 border-r text-right">Cantitate</th>
                  <th className="p-2 border-r text-right">Preț Unitar</th>
                  <th className="p-2 border-r text-right bg-yellow-50">Valoare</th>
                  <th className="p-2 border-r text-right bg-yellow-50">TVA</th>
                  <th className="p-2 border-r text-right bg-yellow-100 font-bold">Valoare + TVA</th>

                  {/* Coloane Comerciale */}
                  <th className="p-2 border-r text-center bg-green-50 text-green-800">Adaos %</th>
                  <th className="p-2 border-r text-right bg-green-50 text-green-800">Valoare Adaos</th>
                  <th className="p-2 border-r text-right bg-green-50 text-green-800 font-bold">Preț Vânzare</th>
                  <th className="p-2 text-right bg-green-100 text-green-900 font-black">Valoare Vânzare</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  // Calcule Extinse per rând (doar vizualizare in tabel extins)
                  // Putem adauga input pentru Adaos % daca userul vrea sa editeze aici
                  const valCuTva = item.valoare + item.tva_valoare;
                  const adaos = item.adaos_proc || defaultAdaos;
                  const valoareAdaos = item.valoare * (adaos / 100);
                  const pretVanzare = item.pret_unitar * (1 + adaos / 100);
                  const valoareVanzare = item.cantitate * pretVanzare;

                  // Calcul conversie pentru afisare (optional, doar informativ in tabel extins)
                  const factor = getConversionFactor(item.um_intrare, item.um_stoc);
                  const cantitateStoc = item.cantitate * factor;

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 border-r text-center text-gray-500">{idx + 1}</td>
                      <td className="p-2 border-r font-medium border-l-4 border-l-green-500">
                        {item.denumire}
                        {factor !== 1 && (
                          <div className="text-xs text-gray-500">
                            Convertit: {cantitateStoc} {item.um_stoc}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r text-center">{item.um_intrare}</td>
                      <td className="p-2 border-r text-right">{item.cantitate}</td>
                      <td className="p-2 border-r text-right">{item.pret_unitar.toFixed(2)}</td>
                      <td className="p-2 border-r text-right bg-yellow-50 font-mono">{item.valoare.toFixed(2)}</td>
                      <td className="p-2 border-r text-right bg-yellow-50 font-mono text-xs">{item.tva_valoare.toFixed(2)}</td>
                      <td className="p-2 border-r text-right bg-yellow-100 font-bold font-mono text-gray-800">{valCuTva.toFixed(2)}</td>

                      <td className="p-2 border-r text-center bg-green-50">
                        <input
                          type="number"
                          className="w-16 p-1 border rounded text-right bg-white"
                          value={item.adaos_proc}
                          onChange={(e) => handleUpdateItem(item.id, 'adaos_proc', e.target.value)}
                        />%
                      </td>
                      <td className="p-2 border-r text-right bg-green-50 text-xs">{valoareAdaos.toFixed(2)}</td>
                      <td className="p-2 border-r text-right bg-green-50 font-bold">{pretVanzare.toFixed(2)}</td>
                      <td className="p-2 text-right bg-green-100 font-black">{valoareVanzare.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-gray-50 border-t flex justify-end gap-4">
            <div className="mr-8 text-sm text-gray-500 max-w-md text-right">
              * Valorile de vânzare sunt calculate cu un adaos comercial standard de referință (300%) sau conform setărilor produsului.<br />
              * TVA din NIR este informativ și nu afectează gestiunea cantitativ-valorică la recepție.
            </div>
            <button onClick={() => setShowExtended(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-bold text-gray-700">
              ⬅️ Modifică Datele
            </button>
            <button onClick={handleSaveToDatabase} className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded shadow-lg font-bold flex items-center gap-2">
              💾 SALVEAZĂ RECEPȚIA FINALĂ
            </button>
          </div>
        </div>
      )}

      {/* --- REZUMAT CONTABIL (Legendă) --- */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75">
        <div className="bg-white p-4 rounded border border-l-4 border-l-blue-500 shadow-sm">
          <h4 className="font-bold text-blue-800 mb-2">VALIDARE RECEPȚIE (Intrare Stoc)</h4>
          <div className="flex justify-between text-sm py-1 border-b">
            <span>Valoare stoc (Ct. 301/371):</span>
            <span className="font-bold">{totalBaza.toFixed(2)} RON</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>TVA Neexigibil (Info):</span>
            <span>{totalTVA.toFixed(2)} RON</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded border border-l-4 border-l-green-500 shadow-sm">
          <h4 className="font-bold text-green-800 mb-2">SUME DE PLATĂ (Furnizor)</h4>
          <div className="flex justify-between text-sm py-1 border-b">
            <span>Bază (Ct. 401):</span>
            <span className="font-bold">{totalBaza.toFixed(2)} RON</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>TVA Deductibil (Ct. 4426):</span>
            <span className="font-bold">{totalTVA.toFixed(2)} RON</span>
          </div>
        </div>
      </div>

      {/* --- MODAL SELECTIE --- */}
      <IngredientSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        ingrediente={ingredienteList}
        onSelect={handleAddItem}
        onCreeazaIngredient={handleCreateIngredient}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        gestiuni={gestiuni}
        ingrediente={ingredienteList}
        onTransferSucces={() => {
          // Putem reincarca lista de ingrediente pentru a actualiza stocul in cache daca e cazul
          fetchData();
        }}
      />

      {/* Modal Import PDF Results */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-700">🔍 Date identificate în {importResults?.filename}</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-2xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <p className="text-sm text-gray-600 mb-4 bg-orange-50 p-2 rounded">
                Sistemul a identificat următoarele rânduri care par a fi produse. Faceți click pe <b>Adaugă</b> pentru a le introduce în NIR.
              </p>

              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border text-left">Denumire Detectată</th>
                    <th className="p-2 border text-right">Cant.</th>
                    <th className="p-2 border text-right">Preț</th>
                    <th className="p-2 border">Acțiune</th>
                  </tr>
                </thead>
                <tbody>
                  {importResults?.items.map((sugg, i) => (
                    <tr key={i} className="hover:bg-gray-50 border-b">
                      <td className="p-2 text-xs truncate max-w-[200px]" title={sugg.raw}>{sugg.suggested_name || 'N/A'}</td>
                      <td className="p-2 text-right">{sugg.suggested_qty}</td>
                      <td className="p-2 text-right font-mono text-green-700">{sugg.suggested_price}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => addImportedItem(sugg)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          + Adaugă
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="bg-gray-200 px-6 py-2 rounded font-bold"
              >
                Gata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style>{`
        .animation-fade-in-up {
            animation: fadeInUp 0.5s ease-out;
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
     `}</style>

    </div>
  );
};

export default NIRPage;