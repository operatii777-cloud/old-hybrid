import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRestaurantStore } from '../stores/restaurantStore';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import SepModal from '../components/SepModal';
import PluSearchModal from '../components/PluSearchModal';
import { printBon } from '../utils/printBon';

const TIP_PRETURI = {
  PRET1: { label: 'Preț 1 (Normal)', color: 'bg-blue-100 text-blue-800' },
  PRET2: { label: 'Preț 2 (Premium)', color: 'bg-green-100 text-green-800' },
  PRET3: { label: 'Preț 3 (VIP)', color: 'bg-purple-100 text-purple-800' }
};

const TIP_PLATA_LABELS = { 1: 'CASH', 2: 'CARD', 3: 'VIRAMENT', 4: 'PROF', 5: 'PROTOCOL' };

const CATEGORII_IMPLICIT = [
  'RACORITOARE', 'VINURI', 'ALCOOLICE', 'PREP PORC/VITA/PESTE', 'GARNITURI/SALATE',
  'CAFEA', 'CIORBE/MIC DEJ/PIZZA', 'PREP PUI', 'VINURI/METAXA', 'DIVERSE/DESERT/SPEC'
];

export default function ComandaPage() {
  const navigate = useNavigate();
  const { ospatar, mese, currentComanda, addProdusToComanda, updateMasaStatus, resetComanda, setCurrentComanda, updateLinieCantitate, removeLinie } = useRestaurantStore();
  const [finalizareLoading, setFinalizareLoading] = useState(false);
  const [showSep, setShowSep] = useState(false);
  const [showPlu, setShowPlu] = useState(false);
  const [printDupaPlata, setPrintDupaPlata] = useState(true);
  useInactivityLogout();
  const [allProduse, setAllProduse] = useState([]);
  const [categoriiLista, setCategoriiLista] = useState(['TOATE', ...CATEGORII_IMPLICIT, 'Altele']);
  const [categorie, setCategorie] = useState('TOATE');
  const [tipPret, setTipPret] = useState('PRET1');
  const [barcode, setBarcode] = useState('');
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedMasa = mese.find(m => m.selectata);

  useEffect(() => {
    axios.get('/api/extended/categorii-pos')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) setCategoriiLista(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ospatar || !selectedMasa) {
      navigate('/plan-mese');
      return;
    }
    setLoading(true);
    axios.get('/api/extended/produse-pos')
      .then(res => {
        setAllProduse(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [ospatar, selectedMasa, navigate]);

  const categorii = categoriiLista;
  const produse = React.useMemo(() => {
    if (!categorie || categorie === 'TOATE') return allProduse;
    if (categorie === 'Altele') return (allProduse || []).filter(p => (p.grupa || '').trim() === 'Altele' || !(p.grupa || '').trim());
    return (allProduse || []).filter(p => (p.grupa || '').trim() === categorie);
  }, [allProduse, categorie]);

  useEffect(() => {
    if (categorii.length && !categorii.includes(categorie)) setCategorie(categorii[0]);
  }, [categorii]);

  if (!ospatar || !selectedMasa) return null;

  const getPretProdus = (produs) => {
    switch (tipPret) {
      case 'PRET2': return Number(produs.pret2) ?? Number(produs.pret1);
      case 'PRET3': return Number(produs.pret3) ?? Number(produs.pret1);
      default: return Number(produs.pret1);
    }
  };

  const handleAnulare = () => {
    if (currentComanda.linii.length > 0) resetComanda();
  };

  const handleMemo = async () => {
    if (currentComanda.linii.length === 0) {
      alert('Nicio comandă de memorat!');
      return;
    }
    setFinalizareLoading(true);
    try {
      const linii = currentComanda.linii.map(l => ({
        cod_prod: l.cod_prod,
        cant: l.cant,
        pret_unitar: l.pret_unitar,
        valoare: l.valoare
      }));
      await axios.post('/api/comenzi', {
        masa_id: selectedMasa.id,
        ospatar_id: ospatar.id,
        linii,
        status: 'memorata'
      });
      updateMasaStatus(selectedMasa.id, 'ocupata');
      resetComanda();
      alert('Comandă memorată pentru masa ' + selectedMasa.id);
      navigate('/plan-mese');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Eroare la memorare');
    } finally {
      setFinalizareLoading(false);
    }
  };

  const handleBarcodeSearch = () => {
    if (barcode.trim()) {
      const produs = allProduse.find(p => (p.barcod || '').toString().trim() === barcode.trim());
      if (produs) {
        addProdusToComanda({ ...produs, pret_vanzare: getPretProdus(produs) });
        setBarcode('');
        setShowBarcodeInput(false);
      } else alert('Produs cu barcode-ul ' + barcode + ' nu a fost găsit!');
    }
  };

  const handlePlata = async (tipPlata, liniiOverride = null) => {
    const linii = liniiOverride || currentComanda.linii;
    if (linii.length === 0) {
      alert('Adaugă produse mai întâi!');
      return;
    }
    setFinalizareLoading(true);
    try {
      const payload = linii.map(l => ({
        cod_prod: l.cod_prod,
        cant: l.cant,
        pret_unitar: l.pret_unitar,
        valoare: (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0)
      }));
      let comandaId = currentComanda.id && !liniiOverride ? currentComanda.id : null;
      if (comandaId) {
        await axios.put(`/api/comenzi/${comandaId}/linii`, { linii: payload });
      } else {
        const createRes = await axios.post('/api/comenzi', {
          masa_id: selectedMasa.id,
          ospatar_id: ospatar.id,
          linii: payload
        });
        comandaId = createRes.data?.comanda_id;
        if (!comandaId) throw new Error('Nu s-a primit id comandă');
      }

      const finalRes = await axios.put(`/api/comenzi/${comandaId}/finalizare`, { tip_plata: tipPlata });
      if (finalRes.data?.success) {
        const totalPlata = linii.reduce((s, l) => s + (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0), 0);
        if (!liniiOverride) {
          resetComanda();
          updateMasaStatus(selectedMasa.id, 'libera');
        }
        if (printDupaPlata) printBon({ linii, total: tipPlata === 5 ? 0 : totalPlata, tipPlata, masaId: selectedMasa.id, ospatar });
        const label = TIP_PLATA_LABELS[tipPlata] || 'CASH';
        alert(`Comandă încasată (${label}). Total: ${(tipPlata === 5 ? 0 : totalPlata).toFixed(2)} RON`);
        if (!liniiOverride) navigate('/plan-mese');
      } else throw new Error(finalRes.data?.error || 'Eroare finalizare');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Eroare la încasare';
      const detalii = err.response?.data?.detalii;
      alert(detalii ? `${msg}\n${detalii}` : msg);
    } finally {
      setFinalizareLoading(false);
    }
  };

  const handlePlataSep = async (liniiBon, tipPlata) => {
    await handlePlata(tipPlata, liniiBon.map(l => ({ cod_prod: l.cod_prod, cant: l.cant, pret_unitar: l.pret_unitar, valoare: (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0), den_prod: l.den_prod })));
  };

  const handleSepClose = (remaining) => {
    setShowSep(false);
    if (remaining && remaining.length > 0) {
      const total = remaining.reduce((s, l) => s + (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0), 0);
      setCurrentComanda({ ...currentComanda, linii: remaining, total: Math.round(total * 100) / 100 });
    } else {
      resetComanda();
      updateMasaStatus(selectedMasa.id, 'libera');
      navigate('/plan-mese');
    }
  };

  const handleCash = () => handlePlata(1);
  const handleCard = () => handlePlata(2);
  const handleVirament = () => handlePlata(3);
  const handleProf = () => handlePlata(4);
  const handleProtocol = () => handlePlata(5);

  const linii = currentComanda.linii || [];
  const totalCalculat = linii.reduce((s, l) => s + (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0), 0);
  const totalAfisat = Math.round(totalCalculat * 100) / 100;

  return (
    <div className="bg-black text-white min-h-screen p-2 text-sm">
      <div className="bg-gray-800 p-2 rounded mb-2 flex justify-between items-center">
        <div>
          <div className="text-yellow-400 font-bold">🍽️ RESTAURANT APP HYBRID</div>
          <div className="text-xs text-gray-400">Ospătar: {ospatar.nume} | Masa: {selectedMasa.id}</div>
        </div>
        <div className="text-xs text-gray-500">Powered by QrOms</div>
      </div>

      <div className="bg-gray-700 p-2 rounded mb-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-400 font-bold">TIP PREȚ:</span>
          {Object.keys(TIP_PRETURI).map(key => (
            <button
              key={key}
              onClick={() => setTipPret(key)}
              className={`px-2 py-1 text-xs rounded font-bold ${tipPret === key ? 'bg-yellow-400 text-black' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
            >{key}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {showBarcodeInput ? (
            <div className="flex items-center gap-1">
              <input type="text" placeholder="Scanează..." value={barcode} onChange={e => setBarcode(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleBarcodeSearch()} className="px-2 py-1 border border-gray-500 rounded text-xs w-24 bg-black text-white" autoFocus />
              <button onClick={handleBarcodeSearch} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-bold">OK</button>
              <button onClick={() => { setShowBarcodeInput(false); setBarcode(''); }} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-bold">✕</button>
            </div>
          ) : (
            <button onClick={() => setShowBarcodeInput(true)} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-bold flex items-center gap-1">📱 BARCODE</button>
          )}
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={printDupaPlata} onChange={e => setPrintDupaPlata(e.target.checked)} />
            Print bon
          </label>
        </div>
      </div>

      <div className="bg-gray-700 p-2 rounded mb-2">
        <div className="text-gray-300 text-xs font-bold mb-1.5">Categorii:</div>
        <div className="flex flex-wrap gap-1.5">
          {categorii.map(cat => (
            <button key={cat} onClick={() => setCategorie(cat)} className={`py-2 px-3 font-bold text-xs rounded ${categorie === cat ? 'bg-blue-600 text-white ring-2 ring-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-7">
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 min-h-[320px]">
            <div className="text-gray-400 text-xs mb-2 font-bold">
              {categorie === 'TOATE' ? 'Toate produsele' : `Categorie: ${categorie}`} ({produse.length})
            </div>
            {loading ? <div className="flex justify-center py-16 text-gray-400">Se încarcă meniul...</div> : produse.length === 0 ? <div className="flex justify-center py-16 text-gray-400">Niciun produs în această categorie.</div> : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto">
                {produse.map(produs => (
                  <button key={produs.cod_prod} onClick={() => addProdusToComanda({ ...produs, pret_vanzare: getPretProdus(produs) })} className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 p-2 rounded font-bold text-xs text-black text-left">
                    <div className="truncate" title={produs.den_prod}>{produs.den_prod}</div>
                    <div className="text-yellow-200 font-bold mt-0.5">{Number(getPretProdus(produs)).toFixed(2)} RON</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 mt-2">
            <button onClick={handleMemo} disabled={finalizareLoading} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded text-xs disabled:opacity-50">MEMO</button>
            <button onClick={handleAnulare} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded text-xs">ANULARE</button>
            <button onClick={() => setShowPlu(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs">PLU</button>
            <button onClick={() => setShowSep(true)} disabled={linii.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded text-xs disabled:opacity-50">SEP</button>
            <button onClick={() => navigate('/plan-mese')} className="col-span-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded text-xs">IESIRE</button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-gray-800 p-2 rounded border border-gray-600">
            <div className="bg-red-600 text-white p-1 rounded mb-2 font-bold text-center text-xs">MASA {selectedMasa.id}</div>

            <div className="bg-black p-1 rounded mb-2 max-h-56 overflow-y-auto border border-gray-600">
              {linii.length === 0 ? <div className="text-gray-400 text-center py-4 text-xs">Nicio comandă</div> : linii.map((linie, idx) => {
                const pret = Number(linie.pret_unitar) || 0;
                const cant = Number(linie.cant) || 0;
                const valoareLinie = Math.round(cant * pret * 100) / 100;
                return (
                  <div key={idx} className="border-b border-gray-600 py-1 text-xs mb-1 flex justify-between items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{linie.den_prod}</div>
                      <div className="text-yellow-400">{cant} x {pret.toFixed(2)} = {valoareLinie.toFixed(2)} RON</div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => updateLinieCantitate(idx, -1)} className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-xs font-bold">−</button>
                      <button onClick={() => updateLinieCantitate(idx, 1)} className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-xs font-bold">+</button>
                      <button onClick={() => removeLinie(idx)} className="w-6 h-6 bg-red-700 hover:bg-red-600 rounded text-xs" title="Șterge">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-black p-2 rounded border border-yellow-600 mb-2">
              <div className="flex justify-between text-xs font-bold mb-1"><span>Subtotal:</span><span className="text-yellow-400">{totalAfisat.toFixed(2)} RON</span></div>
              <div className="flex justify-between text-xs font-bold text-lg"><span>TOTAL:</span><span className="text-red-400 text-xl">{totalAfisat.toFixed(2)} RON</span></div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button onClick={handleCash} disabled={finalizareLoading} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-1 rounded text-xs">{finalizareLoading ? '...' : 'CASH'}</button>
              <button onClick={handleCard} disabled={finalizareLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-1 rounded text-xs">{finalizareLoading ? '...' : 'CARD'}</button>
              <button onClick={handleVirament} disabled={finalizareLoading} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-1 rounded text-xs">{finalizareLoading ? '...' : 'VIRAMENT'}</button>
              <button onClick={handleProf} disabled={finalizareLoading} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-1 rounded text-xs">{finalizareLoading ? '...' : 'PROF'}</button>
              <button onClick={handleProtocol} disabled={finalizareLoading} className="col-span-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-1 rounded text-xs">{finalizareLoading ? '...' : 'PROTOCOL'}</button>
            </div>
          </div>
        </div>
      </div>

      <SepModal isOpen={showSep} onClose={handleSepClose} liniiInitiale={linii} onPlataBon={handlePlataSep} loading={finalizareLoading} />
      <PluSearchModal isOpen={showPlu} onClose={() => setShowPlu(false)} produse={allProduse} onSelect={p => addProdusToComanda({ ...p, pret_vanzare: getPretProdus(p) })} getPret={getPretProdus} />
    </div>
  );
}
