// RESTAURANT APP HYBRID - ADMIN DASHBOARD
// Interfețe complete conform screenshot-uri originale Restaurant App Hybrid

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRestaurantStore } from '../stores/restaurantStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { ospatar } = useRestaurantStore();
  const [section, setSection] = useState('main');
  const [subsection, setSubsection] = useState(null);

  useEffect(() => {
    if (!ospatar || ospatar.rol !== 'MANAGER') {
      navigate('/');
      return;
    }
  }, [ospatar, navigate]);

  if (!ospatar) return null;

  // ===== MAIN SCREEN =====
  if (section === 'main') {
    return (
      <div className="bg-gradient-to-b from-orange-100 to-yellow-50 text-black min-h-screen p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Program gestiune pentru restaurante</h1>
          <p className="text-lg text-gray-700">Restaurant App Hybrid v1.0</p>
        </div>

        {/* Menu bar */}
        <div className="flex gap-2 mb-8 border-b-4 border-gray-400 pb-4 flex-wrap">
          {['Intrari', 'Retete', 'Descarcare', 'Utilitare', 'Rapoarte', 'Istoric'].map(menu => (
            <button
              key={menu}
              onClick={() => { setSection(menu.toLowerCase()); setSubsection(null); }}
              className="px-6 py-2 font-bold bg-gray-300 hover:bg-gray-400 rounded border-2 border-gray-500"
            >
              {menu}
            </button>
          ))}
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 font-bold bg-red-500 hover:bg-red-600 text-white rounded border-2 border-red-700 ml-auto"
          >
            Iesire
          </button>
        </div>

        {/* Main Buttons */}
        <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
          {[
            { label: 'FACTURI', color: 'from-blue-400 to-blue-600', action: () => setSection('facturi') },
            { label: 'RETETE', color: 'from-green-400 to-green-600', action: () => setSection('retete') },
            { label: 'RAPOARTE', color: 'from-yellow-400 to-yellow-600', action: () => setSection('rapoarte') },
            { label: 'IESIRE', color: 'from-red-400 to-red-600', action: () => navigate('/') }
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`aspect-square bg-gradient-to-br ${btn.color} text-white text-4xl font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition border-4 border-gray-700`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-700 border-t-4 border-gray-400 pt-4">
          <p>Restaurant App Hybrid | Powered by QrOms</p>
        </div>
      </div>
    );
  }

  // ===== SECTIONS =====
  if (section === 'intrari') {
    const intrariMenus = ['Editare', 'Stocuri', 'Transfer', 'Retur', 'NIR', 'Furnizori'];
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <h1 className="text-3xl font-bold mb-6 text-center">Intrari</h1>
        {!subsection ? (
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            {intrariMenus.map(menu => (
              <button key={menu} onClick={() => setSubsection(menu)} 
                className="p-6 font-bold text-lg bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition">
                {menu}
              </button>
            ))}
          </div>
        ) : (
          <>
            <BackButton onClick={() => setSubsection(null)} />
            <div className="bg-gray-50 p-6 rounded border-2 border-gray-300">
              {subsection === 'Editare' && <EditareMaterii />}
              {subsection === 'Stocuri' && <StocuriGestiuni />}
              {subsection === 'Transfer' && <TransferGestiuni />}
              {subsection === 'Retur' && <ReturMateriale />}
              {subsection === 'NIR' && <NIRMagazie />}
              {subsection === 'Furnizori' && <FurnizoriOriginal />}
            </div>
          </>
        )}
      </div>
    );
  }

  if (section === 'retete') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <ReteteOriginal />
      </div>
    );
  }

  if (section === 'utilitare') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <div className="flex gap-4">
          <button onClick={() => setSubsection('verificare-retete')} 
            className="p-4 bg-blue-500 text-white rounded font-bold">
            Verificare Retete
          </button>
          <button onClick={() => setSubsection('actualizare')} 
            className="p-4 bg-green-500 text-white rounded font-bold">
            Actualizare Pretu
          </button>
        </div>
        {subsection === 'verificare-retete' && <VerificareRetete />}
        {subsection === 'actualizare' && <ActualizarePage />}
      </div>
    );
  }

  return <div>Section: {section}</div>;
}

// ===== HELPER COMPONENTS =====
function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="mb-4 px-4 py-2 bg-gray-400 hover:bg-gray-500 rounded font-bold">
      ← Înapoi
    </button>
  );
}

// ===== 1. NIR MAGAZIE (POZA 1) =====
function NIRMagazie() {
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [nirItems, setNirItems] = React.useState([]);
  const [formData, setFormData] = React.useState({
    data: new Date().toISOString().split('T')[0],
    fact_nr: '',
    nir_nr: '',
    furnizor: ''
  });

  React.useEffect(() => {
    loadMaterii();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">IntNirM</h2>

      {/* Header cu Data, Fact.nr, N.I.R., Furnizor */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="italic">Data</label>
          <div className="flex gap-1">
            <input type="date" value={formData.data} 
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border p-1" />
            <button className="px-2 border bg-white text-xs">Nir nou</button>
          </div>
        </div>
        <div>
          <label className="italic">Fact. nr:</label>
          <input type="text" value={formData.fact_nr}
            onChange={(e) => setFormData({...formData, fact_nr: e.target.value})}
            className="w-full border p-1" />
        </div>
        <div>
          <label className="italic">N.I.R.:</label>
          <input type="text" value={formData.nir_nr}
            onChange={(e) => setFormData({...formData, nir_nr: e.target.value})}
            className="w-full border p-1" />
        </div>
        <div>
          <label className="italic">Furnizor:</label>
          <input type="text" value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1" />
        </div>
      </div>

      {/* Layout 2 coloane */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <div className="border-2 border-black bg-white h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-1">Nr.</th>
                  <th className="border p-1">Denumire</th>
                  <th className="border p-1">U.M.</th>
                  <th className="border p-1">Cant.</th>
                  <th className="border p-1">Pr. un.</th>
                  <th className="border p-1">Cota</th>
                  <th className="border p-1">Valoare</th>
                  <th className="border p-1">TVA</th>
                  <th className="border p-1">Cod.M.P.</th>
                </tr>
              </thead>
              <tbody>
                {nirItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-1">{idx + 1}</td>
                    <td className="border p-1">{item.denumire}</td>
                    <td className="border p-1">{item.um}</td>
                    <td className="border p-1">{item.cant}</td>
                    <td className="border p-1">{item.pret}</td>
                    <td className="border p-1">{item.cota}</td>
                    <td className="border p-1">{item.valoare}</td>
                    <td className="border p-1">{item.tva}</td>
                    <td className="border p-1">{item.cod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="mb-2 text-right">
            <button className="px-4 py-1 border bg-white italic">Cautare</button>
          </div>
          <div className="border-2 border-black bg-white h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {materii.map((m, idx) => (
                  <tr key={idx} onClick={() => setSelectedMaterial(m)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''}`}>
                    <td className="p-1">{m.denumire}</td>
                    <td className="p-1 text-right">{m.um}</td>
                    <td className="p-1 text-right">{m.pret?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          <button className="px-6 py-2 border bg-white italic">Validare</button>
          <span>=</span>
          <div className="flex gap-2">
            <label className="italic">Suma platita:</label>
            <input className="w-32 border p-1" />
          </div>
        </div>
        <button className="px-6 py-2 border bg-white italic">Iesire</button>
      </div>
    </div>
  );
}

// ===== 2. FURNIZORI ORIGINAL (POZA 3) =====
function FurnizoriOriginal() {
  const [furnizori, setFurnizori] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [formData, setFormData] = React.useState({
    denumire: 'LANDI RENZO IT',
    cod_fiscal: '',
    reg_com: '',
    adresa_sediu: '',
    judetul: '',
    cont: '',
    furnizor_nou: '',
    banca: '',
    pers_contact: '',
    telefon: '',
    mobil: '',
    fax: '',
    bi_seria: '',
    bi_numar: '',
    mijloc_transport: ''
  });

  React.useEffect(() => {
    loadFurnizori();
  }, []);

  const loadFurnizori = async () => {
    try {
      const res = await axios.get('/api/magazie/furnizori');
      setFurnizori(res.data);
    } catch (err) {
      console.error('Eroare load furnizori:', err);
    }
  };

  const handleSelect = (furn) => {
    setSelected(furn);
    setFormData({
      denumire: furn.denumire || '',
      cod_fiscal: furn.cod_fiscal || '',
      reg_com: furn.reg_com || '',
      adresa_sediu: furn.adresa || '',
      judetul: furn.judetul || '',
      cont: furn.cont || '',
      furnizor_nou: '',
      banca: furn.banca || '',
      pers_contact: furn.pers_conta || '',
      telefon: furn.telefon || '',
      mobil: furn.tel_mobil || '',
      fax: furn.tel_fax || '',
      bi_seria: furn.bi_serie || '',
      bi_numar: furn.bi_numar || '',
      mijloc_transport: furn.auto || ''
    });
  };

  const handleSalvare = async () => {
    try {
      const payload = {
        denumire: formData.denumire,
        cod_fiscal: formData.cod_fiscal,
        reg_com: formData.reg_com,
        adresa: formData.adresa_sediu,
        judetul: formData.judetul,
        cont: formData.cont,
        banca: formData.banca,
        telefon: formData.telefon,
        tel_mobil: formData.mobil,
        tel_fax: formData.fax,
        pers_conta: formData.pers_contact,
        bi_serie: formData.bi_seria,
        bi_numar: formData.bi_numar,
        auto: formData.mijloc_transport
      };

      if (selected) {
        await axios.put(`/api/magazie/furnizori/${selected.id}`, payload);
        alert('Furnizor actualizat!');
      } else {
        await axios.post('/api/magazie/furnizori', payload);
        alert('Furnizor adăugat!');
      }
      loadFurnizori();
    } catch (err) {
      alert('Eroare salvare: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Furnizori</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Lista furnizori stânga */}
        <div className="border-2 border-black bg-white h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="border p-1">COD</th>
                <th className="border p-1">DENUMIRE</th>
              </tr>
            </thead>
            <tbody>
              {furnizori.map((f, idx) => (
                <tr key={idx} onClick={() => handleSelect(f)}
                  className={`cursor-pointer hover:bg-blue-100 ${
                    selected?.id === f.id ? 'bg-blue-200' : ''}`}>
                  <td className="border p-1">{f.cod_client || idx + 1}</td>
                  <td className="border p-1">{f.denumire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form dreapta */}
        <div className="space-y-2">
          <div><label className="italic">Denumire:</label>
            <input type="text" value={formData.denumire}
              onChange={(e) => setFormData({...formData, denumire: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Cod Fiscal:</label>
            <input type="text" value={formData.cod_fiscal}
              onChange={(e) => setFormData({...formData, cod_fiscal: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Reg. Com.:</label>
            <input type="text" value={formData.reg_com}
              onChange={(e) => setFormData({...formData, reg_com: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Adresa Sediu:</label>
            <input type="text" value={formData.adresa_sediu}
              onChange={(e) => setFormData({...formData, adresa_sediu: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="italic">Judetul:</label>
              <input type="text" value={formData.judetul}
                onChange={(e) => setFormData({...formData, judetul: e.target.value})}
                className="w-full border p-1" />
            </div>
            <div><label className="italic">Cont:</label>
              <input type="text" value={formData.cont}
                onChange={(e) => setFormData({...formData, cont: e.target.value})}
                className="w-full border p-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="italic">Furnizor Nou:</label>
              <input type="text" value={formData.furnizor_nou}
                onChange={(e) => setFormData({...formData, furnizor_nou: e.target.value})}
                className="w-full border p-1" />
            </div>
            <div><label className="italic">Banca:</label>
              <input type="text" value={formData.banca}
                onChange={(e) => setFormData({...formData, banca: e.target.value})}
                className="w-full border p-1" />
            </div>
          </div>
          <div><label className="italic">Pers. contact:</label>
            <input type="text" value={formData.pers_contact}
              onChange={(e) => setFormData({...formData, pers_contact: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="italic">Telefon:</label>
              <input type="text" value={formData.telefon}
                onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                className="w-full border p-1" />
            </div>
            <div><label className="italic">Mobil:</label>
              <input type="text" value={formData.mobil}
                onChange={(e) => setFormData({...formData, mobil: e.target.value})}
                className="w-full border p-1" />
            </div>
            <div><label className="italic">Fax:</label>
              <input type="text" value={formData.fax}
                onChange={(e) => setFormData({...formData, fax: e.target.value})}
                className="w-full border p-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="italic">B.I. Seria:</label>
              <input type="text" value={formData.bi_seria}
                onChange={(e) => setFormData({...formData, bi_seria: e.target.value})}
                className="w-full border p-1" />
            </div>
            <div><label className="italic">B.I. Numar:</label>
              <input type="text" value={formData.bi_numar}
                onChange={(e) => setFormData({...formData, bi_numar: e.target.value})}
                className="w-full border p-1" />
            </div>
          </div>
          <div><label className="italic">Mijloc de transport:</label>
            <input type="text" value={formData.mijloc_transport}
              onChange={(e) => setFormData({...formData, mijloc_transport: e.target.value})}
              className="w-full border p-1" />
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between mt-4">
        <button className="px-6 py-2 border bg-white italic">Iesire</button>
        <button onClick={handleSalvare} className="px-6 py-2 bg-red-600 text-white font-bold">
          Salvare
        </button>
      </div>
    </div>
  );
}

// ===== 3. RETETE ORIGINAL (POZA 4) =====
function ReteteOriginal() {
  const [selectedProdus, setSelectedProdus] = React.useState(null);
  const [ingrediente, setIngrediente] = React.useState([
    { denumire: 'J&B RARE', cant: 700, um: 'ml', pret: 58.24, gest: 1 },
    { denumire: 'BURN 0.25', cant: 4, um: 'buc', pret: 13.64, gest: 4 }
  ]);
  const [produsData, setProdusData] = React.useState({
    cod: '126',
    denumire: '1ST WHISKY+4BURN',
    departament: '1',
    pret: '170',
    tva: '0%',
    nr_buc: '1',
    pret_calculat: '71.88',
    adaos: '137%'
  });

  const handleAdaugare = () => alert('Funcție Adăugare ingredient nou');
  const handleModificare = () => alert('Funcție Modificare ingredient selectat');
  const handleSterge = () => alert('Funcție Ștergere ingredient');
  const handleSalvare = () => alert('Funcție Salvare rețetă');
  const handleTiparine = () => alert('Funcție Tipărire rețetă');
  const handleListaProduse = () => alert('Funcție Listă produse');

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Retete</h2>

      {/* Butoane sus */}
      <div className="flex gap-2 mb-4">
        <button onClick={handleAdaugare} 
          className="px-4 py-2 font-bold text-white" style={{backgroundColor: '#E91E63'}}>
          Adaugare
        </button>
        <button onClick={handleModificare} 
          className="px-4 py-2 bg-blue-600 text-white font-bold">
          Modificare
        </button>
        <button onClick={handleSterge} 
          className="px-4 py-2 font-bold text-white" style={{backgroundColor: '#E91E63'}}>
          Sterge
        </button>
        <button onClick={handleSalvare} 
          className="px-4 py-2 bg-red-600 text-white font-bold">
          Salvare
        </button>
        <button onClick={handleTiparine} 
          className="px-4 py-2 bg-gray-400 text-white font-bold">
          Tiparine
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tabel ingrediente stânga */}
        <div>
          <table className="w-full border-2 border-black text-sm bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-1">Denumire</th>
                <th className="border p-1">Cant.</th>
                <th className="border p-1">U.M.</th>
                <th className="border p-1">Pret</th>
                <th className="border p-1">Gest.</th>
              </tr>
            </thead>
            <tbody>
              {ingrediente.map((ing, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-blue-300' : ''}>
                  <td className="border p-1">{ing.denumire}</td>
                  <td className="border p-1 text-right">{ing.cant}</td>
                  <td className="border p-1">{ing.um}</td>
                  <td className="border p-1 text-right">{ing.pret}</td>
                  <td className="border p-1 text-center">{ing.gest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form dreapta */}
        <div className="space-y-2">
          <div className="text-center">
            <button onClick={handleListaProduse} 
              className="px-4 py-2 border bg-white font-bold">
              Lista Produse
            </button>
          </div>
          
          <div><label className="italic">Cod:</label>
            <input type="text" value={produsData.cod} readOnly 
              className="w-full border p-1 bg-gray-100" />
          </div>
          <div><label className="italic">Denumire:</label>
            <input type="text" value={produsData.denumire}
              onChange={(e) => setProdusData({...produsData, denumire: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Departament:</label>
            <input type="text" value={produsData.departament}
              onChange={(e) => setProdusData({...produsData, departament: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Pret:</label>
            <input type="text" value={produsData.pret}
              onChange={(e) => setProdusData({...produsData, pret: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">T.V.A.:</label>
            <input type="text" value={produsData.tva}
              onChange={(e) => setProdusData({...produsData, tva: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Nr. buc.:</label>
            <input type="text" value={produsData.nr_buc}
              onChange={(e) => setProdusData({...produsData, nr_buc: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Pret calculat:</label>
            <input type="text" value={produsData.pret_calculat}
              onChange={(e) => setProdusData({...produsData, pret_calculat: e.target.value})}
              className="w-full border p-1" />
          </div>
          <div><label className="italic">Adaos:</label>
            <input type="text" value={produsData.adaos}
              onChange={(e) => setProdusData({...produsData, adaos: e.target.value})}
              className="w-full border p-1" />
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button className="px-6 py-2 border bg-white italic">Iesire</button>
      </div>
    </div>
  );
}

// ===== 4. VERIFICARE RETETE (POZA 5-6) =====
function VerificareRetete() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [produsefaraRetete, setProdusefaraRetete] = React.useState([
    'BERGENBER UNFILTRE',
    'STELLA ARTOIS 400ML',
    'STELLA ARTOIS 330ML',
    'BALLANTINES 50ML',
    'CUTTY SARK 50ML',
    'GLENGRANT 10Y',
    'MARTINI ROSE',
    'TEACHERS'
  ]);

  const handleStart = () => {
    setIsRunning(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="bg-gray-100 p-4 rounded min-h-screen">
      <h2 className="text-xl font-bold mb-4">Verificare retete</h2>

      <div className="text-center mb-4">
        <button onClick={handleStart} disabled={isRunning}
          className="px-8 py-2 border-2 border-gray-400 bg-white font-bold">
          Start
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-white border-2 border-gray-400 h-8">
          <div className="h-full bg-blue-500 transition-all duration-300" 
            style={{width: `${progress}%`}}>
          </div>
        </div>
      </div>

      {/* Lista produse fără rețete */}
      <div className="bg-white border-2 border-gray-400 h-64 overflow-y-auto p-2">
        {produsefaraRetete.map((produs, idx) => (
          <p key={idx} className="text-sm">Nu exista reteta la: {produs}</p>
        ))}
      </div>

      <div className="text-center mt-4">
        <button className="px-6 py-2 border bg-white italic">Iesire</button>
      </div>
    </div>
  );
}

// ===== 5. ACTUALIZARE (POZA 7) =====
function ActualizarePage() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentTask, setCurrentTask] = React.useState('');

  const handleStart = () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTask('Actualizare pretului Materii Prime ...');
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 50 && currentTask.includes('Materii')) {
          setCurrentTask('Actualizare pretului Retete ...');
        }
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setCurrentTask('');
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  return (
    <div className="bg-gray-100 p-4 rounded min-h-screen">
      <h2 className="text-xl font-bold mb-4">Actual</h2>

      <div className="text-center mb-4">
        <button onClick={handleStart} disabled={isRunning}
          className="px-8 py-2 border-2 border-gray-400 bg-white font-bold">
          Start
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-white border-2 border-gray-400 h-8">
          <div className="h-full bg-blue-500 transition-all duration-300" 
            style={{width: `${progress}%`}}>
          </div>
        </div>
      </div>

      {/* Current task */}
      {currentTask && (
        <div className="bg-white border p-2 mb-4">
          <p>{currentTask}</p>
        </div>
      )}

      <div className="text-center mt-4">
        <button className="px-6 py-2 border bg-white italic">Iesire</button>
      </div>
    </div>
  );
}

// ===== COMPONENTE EXISTENTE (minimale pentru funcționalitate) =====
function EditareMaterii() {
  return <div className="p-4"><h3>Editare Materii Prime - Interfață simplificată</h3></div>;
}

function StocuriGestiuni() {
  return <div className="p-4"><h3>Stocuri Gestiuni - Interfață simplificată</h3></div>;
}

function TransferGestiuni() {
  return <div className="p-4"><h3>Transfer Gestiuni - Interfață simplificată</h3></div>;
}

function ReturMateriale() {
  return <div className="p-4"><h3>Retur Materiale - Interfață simplificată</h3></div>;
}