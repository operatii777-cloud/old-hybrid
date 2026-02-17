import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRestaurantStore } from '../stores/restaurantStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { ospatar } = useRestaurantStore();
  const [section, setSection] = useState('main');
  const [subsection, setSubsection] = useState(null);
  const [data, setData] = useState({
    products: [],
    stock: [],
    facturi: [],
    nir: [],
    retete: [],
    rapoarte: []
  });

  useEffect(() => {
    if (!ospatar || ospatar.rol !== 'MANAGER') {
      navigate('/');
      return;
    }

    // Load initial data
    loadData();
  }, [ospatar, navigate]);

  const loadData = async () => {
    try {
      const prodResponse = await axios.get('/api/produse');
      setData(prev => ({ ...prev, products: prodResponse.data }));
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

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

  // ===== INTRARI SECTION =====
  if (section === 'intrari') {
    const intrariMenus = ['Editare', 'Stocuri', 'Transfer', 'Retur', 'NIR', 'Furnizori'];
    
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <h1 className="text-3xl font-bold mb-6 text-center">Intrari</h1>

        {!subsection ? (
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            {intrariMenus.map(menu => (
              <button
                key={menu}
                onClick={() => setSubsection(menu)}
                className="p-6 font-bold text-lg bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition"
              >
                {menu}
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              onClick={() => setSubsection(null)}
              className="mb-4 px-4 py-2 bg-gray-400 hover:bg-gray-500 rounded font-bold"
            >
              ← Înapoi la Intrari
            </button>
            <div className="bg-gray-50 p-6 rounded border-2 border-gray-300">
              {subsection === 'Editare' && <EditareMaterii />}
              {subsection === 'Stocuri' && <StocuriGestiuni />}
              {subsection === 'Transfer' && <TransferGestiuni />}
              {subsection === 'Retur' && <ReturMateriale />}
              {subsection === 'NIR' && <NIRMagazie />}
              {subsection === 'Furnizori' && <FurnizoriManager />}
            </div>
          </>
        )}
      </div>
    );
  }

  // ===== RETETE =====
  if (section === 'retete') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <RetetePage />
      </div>
    );
  }

  // ===== DESCARCARE =====
  if (section === 'descarcare') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <h1 className="text-3xl font-bold mb-6">Descarcare Date</h1>
        <DescarcareInterface />
      </div>
    );
  }

  // ===== UTILITARE =====
  if (section === 'utilitare') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <h1 className="text-3xl font-bold mb-6">Utilitare Sistem</h1>
        <UtilitareInterface />
      </div>
    );
  }

  // ===== RAPOARTE =====
  if (section === 'rapoarte') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <h1 className="text-3xl font-bold mb-6">Rapoarte și Analize</h1>
        <RapoarteInterface />
      </div>
    );
  }

  // ===== ISTORIC =====
  if (section === 'istoric') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <IstoricInterface />
      </div>
    );
  }

  // ===== FACTURI =====
  if (section === 'facturi') {
    return (
      <div className="bg-white text-black min-h-screen p-6">
        <BackButton onClick={() => setSection('main')} />
        <h1 className="text-3xl font-bold mb-6">Gestionare Facturi</h1>
        <FacturiInterface />
      </div>
    );
  }
}

// ===== HELPER COMPONENTS =====

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 px-4 py-2 bg-gray-400 hover:bg-gray-500 rounded font-bold"
    >
      ← Înapoi
    </button>
  );
}

function EditareMaterii() {
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [formData, setFormData] = React.useState({
    cod: '',
    denumire: '',
    um: 'Kg',
    pret: '',
    grupa: 1,
    st_min: 0,
    coef: 1,
    zile: 0,
    tva: 1.11
  });
  const [searchTerm, setSearchTerm] = React.useState('');

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

  const handleSelectMaterial = (material) => {
    setSelectedMaterial(material);
    setFormData({
      cod: material.cod,
      denumire: material.denumire,
      um: material.um,
      pret: material.pret,
      grupa: material.grupa,
      st_min: material.st_min || 0,
      coef: material.coef || 1,
      zile: material.zile || 0,
      tva: material.tva || 1.11
    });
  };

  const handleAdaugare = async () => {
    try {
      if (!formData.denumire || !formData.pret) {
        alert('Completează Denumire și Preț!');
        return;
      }

      const newCod = materii.length > 0 ? Math.max(...materii.map(m => m.cod)) + 1 : 1;
      
      await axios.post('/api/magazie/materii-prime', {
        ...formData,
        cod: newCod
      });

      alert('Material adăugat cu succes!');
      loadMaterii();
      resetForm();
    } catch (err) {
      alert('Eroare la adăugare: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleModificare = async () => {
    try {
      if (!selectedMaterial) {
        alert('Selectează un material din listă!');
        return;
      }

      await axios.put(`/api/magazie/materii-prime/${selectedMaterial.cod}`, formData);

      alert('Material modificat cu succes!');
      loadMaterii();
      resetForm();
    } catch (err) {
      alert('Eroare la modificare: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStergere = async () => {
    try {
      if (!selectedMaterial) {
        alert('Selectează un material din listă!');
        return;
      }

      if (!window.confirm(`Ștergi materialul "${selectedMaterial.denumire}"?`)) {
        return;
      }

      await axios.delete(`/api/magazie/materii-prime/${selectedMaterial.cod}`);

      alert('Material șters cu succes!');
      loadMaterii();
      resetForm();
    } catch (err) {
      alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetForm = () => {
    setSelectedMaterial(null);
    setFormData({
      cod: '',
      denumire: '',
      um: 'Kg',
      pret: '',
      grupa: 1,
      st_min: 0,
      coef: 1,
      zile: 0,
      tva: 1.11
    });
  };

  const filteredMaterii = materii.filter(m => 
    m.denumire.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cod.toString().includes(searchTerm)
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Editare Materii Prime</h2>
      
      <div className="mb-4">
        <input
          placeholder="🔍 Caută material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border-2 border-blue-400 rounded"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <input 
          placeholder="Cod" 
          value={formData.cod} 
          disabled
          className="p-2 border rounded bg-gray-100" 
        />
        <input 
          placeholder="Denumire *" 
          value={formData.denumire}
          onChange={(e) => setFormData({...formData, denumire: e.target.value})}
          className="p-2 border rounded" 
        />
        <select 
          value={formData.um}
          onChange={(e) => setFormData({...formData, um: e.target.value})}
          className="p-2 border rounded"
        >
          <option value="Kg">Kg</option>
          <option value="Litru">Litru</option>
          <option value="buc">buc</option>
          <option value="grame">grame</option>
          <option value="ml">ml</option>
          <option value="st. 0,5">st. 0,5</option>
          <option value="st. 0,7">st. 0,7</option>
        </select>
        <input 
          placeholder="Preț *" 
          type="number" 
          step="0.01"
          value={formData.pret}
          onChange={(e) => setFormData({...formData, pret: e.target.value})}
          className="p-2 border rounded" 
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <input 
          placeholder="Grupa" 
          type="number"
          value={formData.grupa}
          onChange={(e) => setFormData({...formData, grupa: parseInt(e.target.value) || 0})}
          className="p-2 border rounded" 
        />
        <input 
          placeholder="Stoc Minim" 
          type="number" 
          step="0.01"
          value={formData.st_min}
          onChange={(e) => setFormData({...formData, st_min: parseFloat(e.target.value) || 0})}
          className="p-2 border rounded" 
        />
        <input 
          placeholder="Exp (zile)" 
          type="number"
          value={formData.zile}
          onChange={(e) => setFormData({...formData, zile: parseInt(e.target.value) || 0})}
          className="p-2 border rounded" 
        />
        <select 
          value={formData.tva}
          onChange={(e) => setFormData({...formData, tva: parseFloat(e.target.value)})}
          className="p-2 border rounded"
        >
          <option value="1.21">TVA 21%</option>
          <option value="1.11">TVA 11%</option>
          <option value="1.00">TVA 0%</option>
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={handleAdaugare}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
        >
          ➕ Adaugare
        </button>
        <button 
          onClick={handleModificare}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
          disabled={!selectedMaterial}
        >
          ✏️ Modificare
        </button>
        <button 
          onClick={handleStergere}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
          disabled={!selectedMaterial}
        >
          🗑️ Stergere
        </button>
        <button 
          onClick={resetForm}
          className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-bold ml-auto"
        >
          🔄 Resetare
        </button>
      </div>

      <div className="overflow-x-auto max-h-96 border-2 border-gray-300 rounded">
        <table className="w-full border-collapse border border-gray-400">
          <thead className="bg-gray-400 sticky top-0">
            <tr>
              <th className="border p-2">Cod</th>
              <th className="border p-2">Denumire</th>
              <th className="border p-2">U.M.</th>
              <th className="border p-2">Preț</th>
              <th className="border p-2">Grupa</th>
              <th className="border p-2">St.Min</th>
              <th className="border p-2">TVA</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterii.map(m => (
              <tr 
                key={m.cod} 
                onClick={() => handleSelectMaterial(m)}
                className={`cursor-pointer hover:bg-blue-100 ${selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''}`}
              >
                <td className="border p-2">{m.cod}</td>
                <td className="border p-2">{m.denumire}</td>
                <td className="border p-2">{m.um}</td>
                <td className="border p-2 text-right">{m.pret?.toFixed(2)}</td>
                <td className="border p-2 text-center">{m.grupa}</td>
                <td className="border p-2 text-right">{m.st_min?.toFixed(2)}</td>
                <td className="border p-2 text-center">{m.tva === 1.21 ? '21%' : m.tva === 1.11 ? '11%' : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        Total materii prime: {filteredMaterii.length} / {materii.length}
      </div>
    </div>
  );
}

function StocuriGestiuni() {
  const [gestiuni, setGestiuni] = React.useState([]);
  const [materii, setMaterii] = React.useState([]);
  const [nirList, setNirList] = React.useState([]);
  const [selectedGestiune, setSelectedGestiune] = React.useState('GESTIUNI');
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [formData, setFormData] = React.useState({
    furnizor: '',
    factura_nr: '',
    data_fact: new Date().toISOString().split('T')[0],
    nir_nr: '',
    cant_initiala: '',
    pret: '',
    valoare: '',
    tva: '21',
    cant_curenta: '',
    data_exp: ''
  });

  React.useEffect(() => {
    loadGestiuni();
    loadMaterii();
    loadNIRList();
  }, []);

  const loadGestiuni = async () => {
    try {
      const res = await axios.get('/api/magazie/gestiuni');
      setGestiuni(res.data);
    } catch (err) {
      console.error('Eroare load gestiuni:', err);
    }
  };

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadNIRList = async () => {
    try {
      const res = await axios.get('/api/magazie/nir');
      setNirList(res.data.slice(0, 10));
    } catch (err) {
      console.error('Eroare load NIR:', err);
    }
  };

  const handleSelectMaterial = (material) => {
    setSelectedMaterial(material);
    setFormData({
      ...formData,
      cant_initiala: material.st_min || '',
      pret: material.pret || '',
      cant_curenta: material.st_min || ''
    });
  };

  const calculateValoare = () => {
    const cant = parseFloat(formData.cant_initiala) || 0;
    const pret = parseFloat(formData.pret) || 0;
    return (cant * pret).toFixed(2);
  };

  const handleAdaugare = () => {
    alert('Funcție Adăugare stoc - implementare completă cu salvare în baza de date');
  };

  const handleModificare = () => {
    if (!selectedMaterial) {
      alert('Selectează un material din listă!');
      return;
    }
    alert('Funcție Modificare stoc - actualizare cantitate/preț');
  };

  const handleSalvare = () => {
    alert('Funcție Salvare - confirmare modificări stoc');
  };

  const handleStergere = () => {
    if (!selectedMaterial) {
      alert('Selectează un material din listă!');
      return;
    }
    if (confirm(`Ștergi materialul ${selectedMaterial.denumire} din stoc?`)) {
      alert('Funcție Ștergere - eliminare din stoc');
    }
  };

  const stocCurent = formData.cant_curenta || '0';
  const valoareStoc = formData.pret && formData.cant_curenta 
    ? (parseFloat(formData.pret) * parseFloat(formData.cant_curenta)).toFixed(2) 
    : '0';

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Stocuri</h2>
      
      {/* Layout 2 coloane ca în screenshot */}
      <div className="grid grid-cols-2 gap-4">
        {/* Coloana stânga - Lista materiale + Dropdown */}
        <div>
          {/* Dropdown GESTIUNI MAGAZIE */}
          <div className="mb-2 text-center">
            <select 
              value={selectedGestiune}
              onChange={(e) => setSelectedGestiune(e.target.value)}
              className="w-full p-2 border-2 border-gray-400 text-lg font-bold text-center"
            >
              <option value="GESTIUNI">GESTIUNI</option>
              <option value="MAGAZIE">MAGAZIE</option>
              <option value="GESTIUNI">GESTIUNI</option>
            </select>
          </div>

          {/* Tabel materiale stânga */}
          <div className="border-2 border-black bg-white h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {materii.map((m, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => handleSelectMaterial(m)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''
                    }`}
                  >
                    <td className="p-1 border-r w-8">
                      <input type="checkbox" checked={selectedMaterial?.cod === m.cod} readOnly />
                    </td>
                    <td className="p-1">{m.denumire}</td>
                    <td className="p-1 text-right w-16">{m.um}</td>
                    <td className="p-1 text-right font-bold w-20">{m.st_min?.toFixed(2) || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coloana dreapta - Tabel NIR + Câmpuri */}
        <div>
          {/* Tabel NIR-uri */}
          <div className="border-2 border-black bg-white h-48 overflow-y-auto mb-2">
            <table className="w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1">NR_NIR</th>
                  <th className="border p-1">DATA_FACT</th>
                  <th className="border p-1">CANT_F</th>
                  <th className="border p-1">CANT</th>
                  <th className="border p-1">PRET</th>
                  <th className="border p-1">V...</th>
                </tr>
              </thead>
              <tbody>
                {nirList.map((nir, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="border p-1">{nir.nir_number || ''}</td>
                    <td className="border p-1">{nir.data_nir?.split('T')[0] || ''}</td>
                    <td className="border p-1"></td>
                    <td className="border p-1"></td>
                    <td className="border p-1"></td>
                    <td className="border p-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stoc curent + Valoare */}
          <div className="flex gap-4 mb-2 text-right italic">
            <div className="flex-1">
              <span className="mr-2">Stoc curent:</span>
              <input 
                type="text" 
                value={stocCurent}
                readOnly
                className="w-16 border text-right p-1"
              />
            </div>
            <div className="flex-1">
              <span className="mr-2">Val:</span>
              <input 
                type="text" 
                value={valoareStoc}
                readOnly
                className="w-20 border text-right p-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Câmpuri input jos */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-sm">
        <div>
          <label className="italic">Furnizor:</label>
          <input 
            type="text"
            value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic">Factura Nr:</label>
          <input 
            type="text"
            value={formData.factura_nr}
            onChange={(e) => setFormData({...formData, factura_nr: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic">Data fact.:</label>
          <input 
            type="date"
            value={formData.data_fact}
            onChange={(e) => setFormData({...formData, data_fact: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic">N.I.R.:</label>
          <input 
            type="text"
            value={formData.nir_nr}
            onChange={(e) => setFormData({...formData, nir_nr: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div></div>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-2 text-sm">
        <div>
          <label className="italic">Cant. Initiala:</label>
          <input 
            type="number"
            step="0.01"
            value={formData.cant_initiala}
            onChange={(e) => setFormData({...formData, cant_initiala: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic">Pret:</label>
          <input 
            type="number"
            step="0.01"
            value={formData.pret}
            onChange={(e) => setFormData({...formData, pret: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic">Valoare:</label>
          <input 
            type="text"
            value={calculateValoare()}
            readOnly
            className="w-full border p-1 bg-gray-100"
          />
        </div>
        <div>
          <label className="italic">T.V.A.:</label>
          <select
            value={formData.tva}
            onChange={(e) => setFormData({...formData, tva: e.target.value})}
            className="w-full border p-1"
          >
            <option value="21">21%</option>
            <option value="11">11%</option>
            <option value="0">0%</option>
          </select>
        </div>
        <div></div>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-2 text-sm">
        <div>
          <label className="italic">Cant. curenta:</label>
          <input 
            type="number"
            step="0.01"
            value={formData.cant_curenta}
            onChange={(e) => setFormData({...formData, cant_curenta: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div className="col-span-3"></div>
        <div>
          <label className="italic">Data Exp.:</label>
          <input 
            type="date"
            value={formData.data_exp}
            onChange={(e) => setFormData({...formData, data_exp: e.target.value})}
            className="w-full border p-1"
          />
        </div>
      </div>

      {/* Butoane */}
      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleAdaugare}
          className="px-6 py-2 font-bold text-white rounded"
          style={{backgroundColor: '#E91E63'}}
        >
          Adaugare
        </button>
        <button 
          onClick={handleModificare}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded"
        >
          Modificare
        </button>
        <button 
          onClick={handleSalvare}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 font-bold text-white rounded"
        >
          Salvare
        </button>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-400 hover:bg-gray-500 font-bold rounded ml-auto"
        >
          Iesire
        </button>
        <button 
          onClick={handleStergere}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 font-bold text-white rounded"
        >
          Stergere
        </button>
      </div>
    </div>
  );
}

function TransferGestiuni() {
  const [materii, setMaterii] = React.useState([]);
  const [gestiuni, setGestiuni] = React.useState([]);
  const [transferHistory, setTransferHistory] = React.useState([]);
  const [selectedProdus, setSelectedProdus] = React.useState('');
  const [produsDetalii, setProdusDetalii] = React.useState(null);
  const [formData, setFormData] = React.useState({
    cantitate_existenta: 0,
    data_transfer: new Date().toISOString().split('T')[0],
    cant_transferat: '',
    in_gestiunea_nr: '1',
    nota_transfer: ''
  });

  React.useEffect(() => {
    loadMaterii();
    loadGestiuni();
    loadTransferHistory();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadGestiuni = async () => {
    try {
      const res = await axios.get('/api/magazie/gestiuni');
      setGestiuni(res.data);
    } catch (err) {
      console.error('Eroare load gestiuni:', err);
    }
  };

  const loadTransferHistory = async () => {
    try {
      const res = await axios.get('/api/magazie/transfer-gestiuni');
      setTransferHistory(res.data.slice(0, 5));
    } catch (err) {
      console.error('Eroare load history:', err);
    }
  };

  const handleSelectProdus = (codProdus) => {
    setSelectedProdus(codProdus);
    const produs = materii.find(m => m.cod === parseInt(codProdus));
    if (produs) {
      setProdusDetalii(produs);
      setFormData({
        ...formData,
        cantitate_existenta: produs.st_min || 0
      });
    }
  };

  const handleTransfer = async () => {
    if (!selectedProdus || !formData.cant_transferat || !formData.in_gestiunea_nr) {
      alert('Completează toate câmpurile obligatorii!');
      return;
    }

    try {
      await axios.post('/api/magazie/transfer-gestiuni', {
        cod_material: parseInt(selectedProdus),
        cant_transfer: parseFloat(formData.cant_transferat),
        din_gestiune_id: 1,
        in_gestiune_id: parseInt(formData.in_gestiunea_nr),
        data_transfer: formData.data_transfer,
        nota_transfer: formData.nota_transfer,
        pret_transfer: produsDetalii?.pret || 0
      });

      alert('✓ Transfer executat cu succes!');
      loadTransferHistory();
      setFormData({
        ...formData,
        cant_transferat: '',
        nota_transfer: ''
      });
    } catch (err) {
      alert('Eroare transfer: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Transfer din Magazie in Gestiuni</h2>

      {/* Dropdown Produs */}
      <div className="mb-4">
        <label className="italic font-bold mr-2">Produs</label>
        <select
          value={selectedProdus}
          onChange={(e) => handleSelectProdus(e.target.value)}
          className="p-2 border-2 border-gray-400 w-64"
        >
          <option value="">Selectează produs...</option>
          {materii.map(m => (
            <option key={m.cod} value={m.cod}>{m.denumire}</option>
          ))}
        </select>
        <span className="ml-4 font-bold">{selectedProdus || '63'}</span>
      </div>

      {/* Layout 2 coloane */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Tabel stânga */}
        <div>
          <table className="w-full border-2 border-black text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-1">Cant.int</th>
                <th className="border p-1">Cant_c</th>
                <th className="border p-1">Pret</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1 text-center">{produsDetalii?.st_min?.toFixed(2) || '0'}</td>
                <td className="border p-1 text-center">{formData.cantitate_existenta}</td>
                <td className="border p-1 text-center">{produsDetalii?.pret?.toFixed(2) || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel dreapta */}
        <div>
          <table className="w-full border-2 border-black text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-1">P_Nr</th>
                <th className="border p-1">Data</th>
                <th className="border p-1">Data exp</th>
              </tr>
            </thead>
            <tbody>
              {transferHistory.map((t, idx) => (
                <tr key={idx}>
                  <td className="border p-1 text-center">{t.id}</td>
                  <td className="border p-1 text-center">{t.data_transfer?.split('T')[0]}</td>
                  <td className="border p-1 text-center"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Câmpuri input */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <label className="italic">Cantitate Existenta:</label>
          <input
            type="number"
            value={formData.cantitate_existenta}
            readOnly
            className="ml-2 w-24 border p-1 bg-gray-100"
          />
        </div>
        <div>
          <label className="italic">Data:</label>
          <input
            type="date"
            value={formData.data_transfer}
            onChange={(e) => setFormData({...formData, data_transfer: e.target.value})}
            className="ml-2 border p-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="italic">Cant. de Transferat:</label>
          <input
            type="number"
            step="0.01"
            value={formData.cant_transferat}
            onChange={(e) => setFormData({...formData, cant_transferat: e.target.value})}
            className="ml-2 w-32 border p-1"
          />
        </div>
        <div>
          <label className="italic">in gestiunea nr:</label>
          <select
            value={formData.in_gestiunea_nr}
            onChange={(e) => setFormData({...formData, in_gestiunea_nr: e.target.value})}
            className="ml-2 w-16 border p-1"
          >
            {gestiuni.map(g => (
              <option key={g.id} value={g.id}>{g.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="italic">Nota de Transfer:</label>
        <input
          type="text"
          value={formData.nota_transfer}
          onChange={(e) => setFormData({...formData, nota_transfer: e.target.value})}
          className="ml-2 w-96 border p-1"
        />
      </div>

      {/* Butoane */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={handleTransfer}
          className="px-8 py-2 font-bold text-white rounded"
          style={{backgroundColor: '#E91E63'}}
        >
          ✓ Transfer
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-8 py-2 bg-red-600 hover:bg-red-700 font-bold text-white rounded"
        >
          ✗ Iesire
        </button>
      </div>
    </div>
  );
}

function ReturMateriale() {
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [magazieRetururi, setMagazieRetururi] = React.useState([]);
  const [gestiuniRetururi, setGestiuniRetururi] = React.useState([]);

  React.useEffect(() => {
    loadMaterii();
    loadRetururi();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadRetururi = async () => {
    try {
      const res = await axios.get('/api/magazie/retur-materiale');
      // Simulare împărțire retururi în Magazie vs Gestiuni
      setMagazieRetururi(res.data.slice(0, 3));
      setGestiuniRetururi(res.data.slice(3, 6));
    } catch (err) {
      console.error('Eroare load retururi:', err);
    }
  };

  const handleRetur = async () => {
    if (!selectedMaterial) {
      alert('Selectează un material pentru retur!');
      return;
    }

    try {
      await axios.post('/api/magazie/retur-materiale', {
        cod_material: selectedMaterial.cod,
        cant_retur: 0, // Va fi completat din interfață
        din_gestiune_id: 1,
        motiv: 'Retur manual',
        pret_retur: selectedMaterial.pret || 0
      });

      alert('✓ Retur înregistrat cu succes!');
      loadRetururi();
    } catch (err) {
      alert('Eroare retur: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Retur</h2>

      {/* Lista materiale sus */}
      <div className="border-2 border-black bg-white mb-4 h-48 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            {materii.map((m, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedMaterial(m)}
                className={`cursor-pointer border-b hover:bg-blue-100 ${
                  selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''
                }`}
              >
                <td className="p-1 border-r w-8">
                  <input type="checkbox" checked={selectedMaterial?.cod === m.cod} readOnly />
                </td>
                <td className="p-1">{m.denumire}</td>
                <td className="p-1 text-right w-16">{m.um}</td>
                <td className="p-1 text-right w-20 font-bold">{m.st_min?.toFixed(2) || '0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Layout 2 coloane - MAGAZIE și GESTIUNI */}
      <div className="grid grid-cols-2 gap-8">
        {/* Coloana stânga - MAGAZIE */}
        <div>
          <h3 className="text-center font-bold text-2xl mb-2 italic">MAGAZIE</h3>
          <div className="border-2 border-black bg-white h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1">NR_FACT</th>
                  <th className="border p-1">NR_N</th>
                  <th className="border p-1">DATA_FACT</th>
                  <th className="border p-1">CANT_I</th>
                  <th className="border p-1">CANT</th>
                  <th className="border p-1">PRET</th>
                </tr>
              </thead>
              <tbody>
                {magazieRetururi.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="border p-1"></td>
                    <td className="border p-1">{r.id}</td>
                    <td className="border p-1">{r.data_retur?.split('T')[0] || ''}</td>
                    <td className="border p-1 text-right">{r.cant_retur?.toFixed(2) || ''}</td>
                    <td className="border p-1 text-right">{r.cant_retur?.toFixed(2) || ''}</td>
                    <td className="border p-1 text-right">{r.pret_retur?.toFixed(2) || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coloana dreapta - GESTIUNI */}
        <div>
          <h3 className="text-center font-bold text-2xl mb-2 italic">GESTIUNI</h3>
          <div className="border-2 border-black bg-white h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1">NR_FACT</th>
                  <th className="border p-1">NR_N</th>
                  <th className="border p-1">DATA_FACT</th>
                  <th className="border p-1">CANT_I</th>
                  <th className="border p-1">CANT</th>
                  <th className="border p-1">PRET</th>
                </tr>
              </thead>
              <tbody>
                {gestiuniRetururi.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="border p-1"></td>
                    <td className="border p-1">{r.id}</td>
                    <td className="border p-1">{r.data_retur?.split('T')[0] || ''}</td>
                    <td className="border p-1 text-right">{r.cant_retur?.toFixed(2) || ''}</td>
                    <td className="border p-1 text-right">{r.cant_retur?.toFixed(2) || ''}</td>
                    <td className="border p-1 text-right">{r.pret_retur?.toFixed(2) || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="mt-6 flex justify-center gap-16">
        <button
          onClick={handleRetur}
          className="px-8 py-2 font-bold text-red-600 rounded border-2 border-gray-400 bg-white hover:bg-gray-100"
          style={{fontStyle: 'italic'}}
        >
          &lt;RETUR&gt;
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-8 py-2 font-bold rounded border-2 border-gray-400 bg-white hover:bg-gray-100"
          style={{fontStyle: 'italic'}}
        >
          Iesire
        </button>
      </div>
    </div>
  );
}

function NIRMagazie() {
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [furnizori, setFurnizori] = React.useState([]);
  const [nirItems, setNirItems] = React.useState([]);
  const [formData, setFormData] = React.useState({
    data: new Date().toISOString().split('T')[0],
    fact_nr: '',
    nir_nr: '',
    furnizor: ''
  });
  const [sumaplatita, setSumaplatita] = React.useState('');

  React.useEffect(() => {
    loadMaterii();
    loadFurnizori();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadFurnizori = async () => {
    try {
      const res = await axios.get('/api/magazie/furnizori');
      setFurnizori(res.data);
    } catch (err) {
      console.error('Eroare load furnizori:', err);
    }
  };

  const handleValidare = () => {
    alert('Funcție Validare NIR - salvare în baza de date');
  };

  const calculateTotal = () => {
    return nirItems.reduce((sum, item) => sum + (item.valoare || 0), 0).toFixed(2);
  };

  return (
    <div className="bg-gray-100 p-4 rounded min-h-screen">
      <h2 className="text-xl font-bold mb-4">IntNirM</h2>

      {/* Header cu Data, Fact.nr, N.I.R., Furnizor */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="italic font-bold">Data</label>
          <div className="flex gap-1">
            <input 
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border p-1"
            />
            <button className="px-2 border bg-white text-xs">Nir nou</button>
          </div>
        </div>
        <div>
          <label className="italic font-bold">Fact. nr:</label>
          <input 
            type="text"
            value={formData.fact_nr}
            onChange={(e) => setFormData({...formData, fact_nr: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic font-bold">N.I.R.:</label>
          <input 
            type="text"
            value={formData.nir_nr}
            onChange={(e) => setFormData({...formData, nir_nr: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic font-bold">Furnizor:</label>
          <input 
            type="text"
            value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1"
            placeholder="Selectează..."
          />
        </div>
      </div>

      {/* Layout 2 coloane - Tabel jos + Lista materiale dreapta */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Tabel jos - 2 coloane */}
        <div className="col-span-2">
          <div className="border-2 border-black bg-white h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1 w-8">Nr.</th>
                  <th className="border p-1">Denumire</th>
                  <th className="border p-1 w-12">U.M.</th>
                  <th className="border p-1 w-16">Cant.</th>
                  <th className="border p-1 w-16">Pr. un.</th>
                  <th className="border p-1 w-12">Cota</th>
                  <th className="border p-1 w-20">Valoare</th>
                  <th className="border p-1 w-12">TVA</th>
                  <th className="border p-1 w-16">Cod.M.P.</th>
                </tr>
              </thead>
              <tbody>
                {nirItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="border p-1 text-center">{idx + 1}</td>
                    <td className="border p-1">{item.denumire}</td>
                    <td className="border p-1 text-center">{item.um}</td>
                    <td className="border p-1 text-right">{item.cant}</td>
                    <td className="border p-1 text-right">{item.pret}</td>
                    <td className="border p-1 text-center">{item.cota}</td>
                    <td className="border p-1 text-right">{item.valoare}</td>
                    <td className="border p-1 text-center">{item.tva}</td>
                    <td className="border p-1 text-center">{item.cod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista materiale dreapta + Buton Cautare */}
        <div>
          <div className="mb-2 text-right">
            <button className="px-4 py-1 border-2 border-gray-400 bg-white italic">
              Cautare
            </button>
          </div>
          <div className="border-2 border-black bg-white h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {materii.map((m, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => setSelectedMaterial(m)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''
                    }`}
                  >
                    <td className="p-1">{m.denumire}</td>
                    <td className="p-1 text-right w-16">{m.um}</td>
                    <td className="p-1 text-right w-20">{m.pret?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <button
            onClick={handleValidare}
            className="px-6 py-2 border-2 border-gray-400 bg-white font-bold italic hover:bg-gray-100"
          >
            Validare
          </button>
          <span className="font-bold">=</span>
          <div className="flex items-center gap-2">
            <label className="italic">Suma platita:</label>
            <input 
              type="text"
              value={sumaplatita}
              onChange={(e) => setSumaplatita(e.target.value)}
              className="w-32 border p-1"
            />
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border-2 border-gray-400 bg-white font-bold italic hover:bg-gray-100"
        >
          Iesire
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <p className="italic font-bold">N.I.R.</p>
      </div>
    </div>
  );
}

function NIRGestiuni() {
  // Identică cu NIRMagazie dar cu titlu "Introducere N.I.R."
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [furnizori, setFurnizori] = React.useState([]);
  const [nirItems, setNirItems] = React.useState([]);
  const [formData, setFormData] = React.useState({
    data: new Date().toISOString().split('T')[0],
    fact_nr: '',
    nir_nr: '',
    furnizor: ''
  });
  const [sumaplatita, setSumaplatita] = React.useState('');

  React.useEffect(() => {
    loadMaterii();
    loadFurnizori();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadFurnizori = async () => {
    try {
      const res = await axios.get('/api/magazie/furnizori');
      setFurnizori(res.data);
    } catch (err) {
      console.error('Eroare load furnizori:', err);
    }
  };

  const handleValidare = () => {
    alert('Funcție Validare NIR Gestiuni - salvare în baza de date');
  };

  return (
    <div className="bg-gray-100 p-4 rounded min-h-screen">
      <h2 className="text-xl font-bold mb-4">Introducere N.I.R.</h2>

      {/* Header cu Data, Fact.nr, N.I.R., Furnizor */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="italic font-bold">Data</label>
          <div className="flex gap-1">
            <input 
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border p-1"
            />
            <button className="px-2 border bg-white text-xs">NIR nou</button>
          </div>
        </div>
        <div>
          <label className="italic font-bold">Fact. nr:</label>
          <input 
            type="text"
            value={formData.fact_nr}
            onChange={(e) => setFormData({...formData, fact_nr: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic font-bold">N.I.R.:</label>
          <input 
            type="text"
            value={formData.nir_nr}
            onChange={(e) => setFormData({...formData, nir_nr: e.target.value})}
            className="w-full border p-1"
          />
        </div>
        <div>
          <label className="italic font-bold">Furnizor:</label>
          <input 
            type="text"
            value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1"
            placeholder="Selectează..."
          />
        </div>
      </div>

      {/* Layout 2 coloane */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Tabel jos - 2 coloane */}
        <div className="col-span-2">
          <div className="border-2 border-black bg-white h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1 w-8">Nr.</th>
                  <th className="border p-1">Denumire</th>
                  <th className="border p-1 w-12">U.M.</th>
                  <th className="border p-1 w-16">Cant.</th>
                  <th className="border p-1 w-16">Pr. un.</th>
                  <th className="border p-1 w-12">Cota</th>
                  <th className="border p-1 w-20">Valoare</th>
                  <th className="border p-1 w-12">TVA</th>
                  <th className="border p-1 w-16">Cod.M.P.</th>
                </tr>
              </thead>
              <tbody>
                {nirItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="border p-1 text-center">{idx + 1}</td>
                    <td className="border p-1">{item.denumire}</td>
                    <td className="border p-1 text-center">{item.um}</td>
                    <td className="border p-1 text-right">{item.cant}</td>
                    <td className="border p-1 text-right">{item.pret}</td>
                    <td className="border p-1 text-center">{item.cota}</td>
                    <td className="border p-1 text-right">{item.valoare}</td>
                    <td className="border p-1 text-center">{item.tva}</td>
                    <td className="border p-1 text-center">{item.cod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista materiale dreapta + Buton Cautare */}
        <div>
          <div className="mb-2 text-right">
            <button className="px-4 py-1 border-2 border-gray-400 bg-white italic">
              Cautare
            </button>
          </div>
          <div className="border-2 border-black bg-white h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {materii.map((m, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => setSelectedMaterial(m)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''
                    }`}
                  >
                    <td className="p-1">{m.denumire}</td>
                    <td className="p-1 text-right w-16">{m.um}</td>
                    <td className="p-1 text-right w-20">{m.pret?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <button
            onClick={handleValidare}
            className="px-6 py-2 border-2 border-gray-400 bg-white font-bold italic hover:bg-gray-100"
          >
            Validare
          </button>
          <span className="font-bold">=</span>
          <div className="flex items-center gap-2">
            <label className="italic">Suma platita:</label>
            <input 
              type="text"
              value={sumaplatita}
              onChange={(e) => setSumaplatita(e.target.value)}
              className="w-32 border p-1"
            />
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border-2 border-gray-400 bg-white font-bold italic hover:bg-gray-100"
        >
          Iesire
        </button>
      </div>
    </div>
  );
}

function NIRManager() {
  const [nirList, setNirList] = React.useState([]);
  const [furnizori, setFurnizori] = React.useState([]);
  const [gestiuni, setGestiuni] = React.useState([]);
  const [formData, setFormData] = React.useState({
    nr_nir: '',
    nr_factura: '',
    data_factura: new Date().toISOString().split('T')[0],
    furnizor_id: '',
    gestiune_id: '',
    cant_facturata: '',
    cant_primita: '',
    pret_unitar: '',
    valoare: ''
  });

  React.useEffect(() => {
    loadNirList();
    loadFurnizori();
    loadGestiuni();
  }, []);

  const loadNirList = async () => {
    try {
      const res = await axios.get('/api/magazie/nir');
      setNirList(res.data);
    } catch (err) {
      console.error('Eroare load NIR:', err);
    }
  };

  const loadFurnizori = async () => {
    try {
      const res = await axios.get('/api/magazie/furnizori');
      setFurnizori(res.data);
      if (res.data.length > 0) setFormData(prev => ({...prev, furnizor_id: res.data[0].id}));
    } catch (err) {
      console.error('Eroare load furnizori:', err);
    }
  };

  const loadGestiuni = async () => {
    try {
      const res = await axios.get('/api/magazie/gestiuni');
      setGestiuni(res.data);
      if (res.data.length > 0) setFormData(prev => ({...prev, gestiune_id: res.data[0].id}));
    } catch (err) {
      console.error('Eroare load gestiuni:', err);
    }
  };

  const handleSalveazaNIR = async () => {
    try {
      if (!formData.nr_nir || !formData.nr_factura || !formData.furnizor_id || !formData.gestiune_id) {
        alert('Completează toate câmpurile obligatorii!');
        return;
      }

      const cant_f = parseFloat(formData.cant_facturata) || 0;
      const cant_p = parseFloat(formData.cant_primita) || 0;
      const pret = parseFloat(formData.pret_unitar) || 0;
      const valoare = cant_p * pret;

      await axios.post('/api/magazie/nir', {
        nr_nir: formData.nr_nir,
        nr_factura: formData.nr_factura,
        data_factura: formData.data_factura,
        furnizor_id: formData.furnizor_id,
        gestiune_id: formData.gestiune_id,
        cant_facturata: cant_f,
        cant_primita: cant_p,
        pret_unitar: pret,
        valoare: valoare
      });

      alert('NIR salvat cu succes!');
      loadNirList();
      resetForm();
    } catch (err) {
      alert('Eroare la salvare NIR: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      nr_nir: '',
      nr_factura: '',
      data_factura: new Date().toISOString().split('T')[0],
      furnizor_id: furnizori.length > 0 ? furnizori[0].id : '',
      gestiune_id: gestiuni.length > 0 ? gestiuni[0].id : '',
      cant_facturata: '',
      cant_primita: '',
      pret_unitar: '',
      valoare: ''
    });
  };

  React.useEffect(() => {
    const cant_p = parseFloat(formData.cant_primita) || 0;
    const pret = parseFloat(formData.pret_unitar) || 0;
    const valoare = cant_p * pret;
    if (formData.valoare !== valoare.toFixed(2)) {
      setFormData(prev => ({...prev, valoare: valoare.toFixed(2)}));
    }
  }, [formData.cant_primita, formData.pret_unitar]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Introducere N.I.R.</h2>
      
      <div className="bg-blue-50 p-4 rounded border-2 border-blue-400 mb-4">
        <h3 className="font-bold mb-2">NIR NOU</h3>
        
        <div className="grid grid-cols-5 gap-2 mb-2">
          <input 
            placeholder="Nr. NIR *" 
            value={formData.nr_nir}
            onChange={(e) => setFormData({...formData, nr_nir: e.target.value})}
            className="p-2 border rounded" 
          />
          <input 
            placeholder="Nr. Factură *" 
            value={formData.nr_factura}
            onChange={(e) => setFormData({...formData, nr_factura: e.target.value})}
            className="p-2 border rounded" 
          />
          <input 
            type="date" 
            value={formData.data_factura}
            onChange={(e) => setFormData({...formData, data_factura: e.target.value})}
            className="p-2 border rounded" 
          />
          <select 
            value={formData.furnizor_id}
            onChange={(e) => setFormData({...formData, furnizor_id: e.target.value})}
            className="p-2 border rounded"
          >
            <option value="">Selectează Furnizor</option>
            {furnizori.map(f => (
              <option key={f.id} value={f.id}>{f.denumire}</option>
            ))}
          </select>
          <select 
            value={formData.gestiune_id}
            onChange={(e) => setFormData({...formData, gestiune_id: e.target.value})}
            className="p-2 border rounded"
          >
            <option value="">Selectează Gestiune</option>
            {gestiuni.map(g => (
              <option key={g.id} value={g.id}>{g.nume}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          <input 
            placeholder="Cantitate Facturată" 
            type="number"
            step="0.01"
            value={formData.cant_facturata}
            onChange={(e) => setFormData({...formData, cant_facturata: e.target.value})}
            className="p-2 border rounded" 
          />
          <input 
            placeholder="Cantitate Primită *" 
            type="number"
            step="0.01"
            value={formData.cant_primita}
            onChange={(e) => setFormData({...formData, cant_primita: e.target.value})}
            className="p-2 border rounded" 
          />
          <input 
            placeholder="Preț Unitar *" 
            type="number"
            step="0.01"
            value={formData.pret_unitar}
            onChange={(e) => setFormData({...formData, pret_unitar: e.target.value})}
            className="p-2 border rounded" 
          />
          <input 
            placeholder="Valoare" 
            value={formData.valoare}
            disabled
            className="p-2 border rounded bg-gray-100 font-bold" 
          />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSalveazaNIR}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
          >
            💾 SALVEAZA NIR
          </button>
          <button 
            onClick={resetForm}
            className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-bold"
          >
            🔄 RESETARE
          </button>
        </div>
      </div>

      <h3 className="font-bold mb-2">Listă NIR-uri</h3>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead className="bg-green-400 text-white">
          <tr>
            <th className="border p-1">Nr. NIR</th>
            <th className="border p-1">Nr. Factură</th>
            <th className="border p-1">Data</th>
            <th className="border p-1">Furnizor</th>
            <th className="border p-1">Gestiune</th>
            <th className="border p-1">Cant. Fact.</th>
            <th className="border p-1">Cant. Prim.</th>
            <th className="border p-1">Preț</th>
            <th className="border p-1">Valoare</th>
          </tr>
        </thead>
        <tbody>
          {nirList.map((n, idx) => (
            <tr key={idx} className="hover:bg-gray-100">
              <td className="border p-1">{n.nr_nir}</td>
              <td className="border p-1">{n.nr_factura}</td>
              <td className="border p-1">{n.data_factura?.split('T')[0]}</td>
              <td className="border p-1">{n.furnizor}</td>
              <td className="border p-1">{n.gestiune}</td>
              <td className="border p-1 text-right">{n.cant_facturata?.toFixed(2)}</td>
              <td className="border p-1 text-right">{n.cant_primita?.toFixed(2)}</td>
              <td className="border p-1 text-right">{n.pret_unitar?.toFixed(2)}</td>
              <td className="border p-1 text-right font-bold">{n.valoare?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {nirList.length === 0 && (
        <p className="text-center text-gray-500 mt-4">Nu există NIR-uri înregistrate</p>
      )}
    </div>
  );
}

function FurnizoriManager() {
  const [furnizori, setFurnizori] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [formData, setFormData] = React.useState({
    cod: '',
    denumire: '',
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
      cod: furn.cod_client || '',
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
      if (!formData.denumire) {
        alert('Denumirea este obligatorie!');
        return;
      }

      if (selected) {
        await axios.put(`/api/magazie/furnizori/${selected.id}`, {
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
        });
        alert('Furnizor actualizat!');
      } else {
        await axios.post('/api/magazie/furnizori', {
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
        });
        alert('Furnizor adăugat!');
      }

      loadFurnizori();
      resetForm();
    } catch (err) {
      alert('Eroare salvare: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetForm = () => {
    setSelected(null);
    setFormData({
      cod: '',
      denumire: '',
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
  };

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Furnizori</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Listă furnizori stânga */}
        <div className="border-2 border-black bg-white h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="border p-1 w-16">COD</th>
                <th className="border p-1">DENUMIRE</th>
              </tr>
            </thead>
            <tbody>
              {furnizori.map((f, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleSelect(f)}
                  className={`cursor-pointer hover:bg-blue-100 ${
                    selected?.id === f.id ? 'bg-blue-200' : ''
                  }`}
                >
                  <td className="border p-1 text-center">{f.cod_client || idx + 1}</td>
                  <td className="border p-1">{f.denumire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form detaliat dreapta */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic">Denumire:</label>
              <input
                type="text"
                value={formData.denumire}
                onChange={(e) => setFormData({...formData, denumire: e.target.value})}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="italic">Cod Fiscal:</label>
              <input
                type="text"
                value={formData.cod_fiscal}
                onChange={(e) => setFormData({...formData, cod_fiscal: e.target.value})}
                className="w-full border p-1"
              />
            </div>
          </div>

          <div>
            <label className="italic">Reg. Com.:</label>
            <input
              type="text"
              value={formData.reg_com}
              onChange={(e) => setFormData({...formData, reg_com: e.target.value})}
              className="w-full border p-1"
            />
          </div>

          <div>
            <label className="italic">Adresa Sediu:</label>
            <input
              type="text"
              value={formData.adresa_sediu}
              onChange={(e) => setFormData({...formData, adresa_sediu: e.target.value})}
              className="w-full border p-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic">Judetul:</label>
              <input
                type="text"
                value={formData.judetul}
                onChange={(e) => setFormData({...formData, judetul: e.target.value})}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="italic">Cont:</label>
              <input
                type="text"
                value={formData.cont}
                onChange={(e) => setFormData({...formData, cont: e.target.value})}
                className="w-full border p-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic">Furnizor Nou:</label>
              <input
                type="text"
                value={formData.furnizor_nou}
                onChange={(e) => setFormData({...formData, furnizor_nou: e.target.value})}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="italic">Banca:</label>
              <input
                type="text"
                value={formData.banca}
                onChange={(e) => setFormData({...formData, banca: e.target.value})}
                className="w-full border p-1"
              />
            </div>
          </div>

          <div>
            <label className="italic">Pers. contact:</label>
            <input
              type="text"
              value={formData.pers_contact}
              onChange={(e) => setFormData({...formData, pers_contact: e.target.value})}
              className="w-full border p-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="italic">Telefon:</label>
              <input
                type="text"
                value={formData.telefon}
                onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="italic">Mobil:</label>
              <input
                type="text"
                value={formData.mobil}
                onChange={(e) => setFormData({...formData, mobil: e.target.value})}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="italic">Fax:</label>
              <input
                type="text"
                value={formData.fax}
                onChange={(e) => setFormData({...formData, fax: e.target.value})}
                className="w-full border p-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic">B.I. Seria:</label>
              <input
                type="text"
                value={formData.bi_seria}
                onChange={(e) => setFormData({...formData, bi_seria: e.target.value})}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="italic">B.I. Numar:</label>
              <input
                type="text"
                value={formData.bi_numar}
                onChange={(e) => setFormData({...formData, bi_numar: e.target.value})}
                className="w-full border p-1"
              />
            </div>
          </div>

          <div>
            <label className="italic">Mijloc de transport:</label>
            <input
              type="text"
              value={formData.mijloc_transport}
              onChange={(e) => setFormData({...formData, mijloc_transport: e.target.value})}
              className="w-full border p-1"
            />
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border-2 border-gray-400 bg-white font-bold italic hover:bg-gray-100"
        >
          Iesire
        </button>
        <button
          onClick={handleSalvare}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded"
        >
          Salvare
        </button>
      </div>
    </div>
  );
}

function RetetePage() {
  const [retete, setRetete] = React.useState([]);
  const [selectedReteta, setSelectedReteta] = React.useState(null);
  const [retetaDetalii, setRetetaDetalii] = React.useState([]);
  const [materii, setMaterii] = React.useState([]);
  const [produse, setProduse] = React.useState([]);
  const [newIngredient, setNewIngredient] = React.useState({
    cod_mat: '',
    cant: '',
    um: 'grame'
  });
  const [selectedProdus, setSelectedProdus] = React.useState(null);

  React.useEffect(() => {
    loadRetete();
    loadMaterii();
    loadProduse();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadProduse = async () => {
    try {
      const res = await axios.get('/api/produse');
      setProduse(res.data);
    } catch (err) {
      console.error('Eroare load produse:', err);
    }
  };

  const loadRetete = async () => {
    try {
      const res = await axios.get('/api/magazie/retete');
      // Group by cod_ret
      const grouped = {};
      res.data.forEach(r => {
        if (!grouped[r.cod_ret]) {
          grouped[r.cod_ret] = [];
        }
        grouped[r.cod_ret].push(r);
      });
      
      const uniques = Object.keys(grouped).map(cod => ({
        cod_ret: parseInt(cod),
        denumire: grouped[cod][0]?.denumire || `Rețetă ${cod}`,
        linii: grouped[cod].length
      }));
      
      setRetete(uniques);
    } catch (err) {
      console.error('Eroare load retete:', err);
    }
  };

  const loadRetetaDetalii = async (cod_ret) => {
        <input 
          placeholder="Reg. Com." 
          value={formData.reg_com}
          onChange={(e) => setFormData({...formData, reg_com: e.target.value})}
          className="p-2 border rounded" 
        />
        <input 
          placeholder="CUI / Cod Fiscal" 
          value={formData.cod_fiscal}
          onChange={(e) => setFormData({...formData, cod_fiscal: e.target.value})}
          className="p-2 border rounded" 
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input 
          placeholder="Adresa" 
          value={formData.adresa}
          onChange={(e) => setFormData({...formData, adresa: e.target.value})}
          className="p-2 border rounded" 
        />
        <input 
          placeholder="Județ" 
          value={formData.judetul}
          onChange={(e) => setFormData({...formData, judetul: e.target.value})}
          className="p-2 border rounded" 
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <input 
          placeholder="Telefon" 
          value={formData.telefon}
          onChange={(e) => setFormData({...formData, telefon: e.target.value})}
          className="p-2 border rounded" 
        />
        <input 
          placeholder="Mobil" 
          value={formData.tel_mobil}
          onChange={(e) => setFormData({...formData, tel_mobil: e.target.value})}
          className="p-2 border rounded" 
        />
        <input 
          placeholder="Cont Bancar" 
          value={formData.cont}
          onChange={(e) => setFormData({...formData, cont: e.target.value})}
          className="p-2 border rounded" 
        />
      </div>

      <div className="mb-2">
        <input 
          placeholder="Bancă" 
          value={formData.banca}
          onChange={(e) => setFormData({...formData, banca: e.target.value})}
          className="w-full p-2 border rounded" 
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={handleAdauga}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
        >
          ADAUGA
        </button>
        <button 
          onClick={handleModifica}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
          disabled={!selected}
        >
          MODIFICA
        </button>
        <button 
          onClick={handleSterge}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
          disabled={!selected}
        >
          STERGE
        </button>
        <button 
          onClick={resetForm}
          className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-bold ml-auto"
        >
          RESETARE
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead className="bg-gray-400">
          <tr>
            <th className="border p-2">Cod</th>
            <th className="border p-2">Furnizor</th>
            <th className="border p-2">CUI</th>
            <th className="border p-2">Adresa</th>
            <th className="border p-2">Telefon</th>
          </tr>
        </thead>
        <tbody>
          {furnizori.map(f => (
            <tr 
              key={f.id} 
              onClick={() => handleSelect(f)}
              className={`cursor-pointer hover:bg-blue-100 ${selected?.id === f.id ? 'bg-blue-200' : ''}`}
            >
              <td className="border p-2">{f.cod_client}</td>
              <td className="border p-2">{f.denumire}</td>
              <td className="border p-2">{f.cod_fiscal}</td>
              <td className="border p-2">{f.adresa}</td>
              <td className="border p-2">{f.telefon || f.tel_mobil}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-2 text-sm text-gray-600">
        Total furnizori: {furnizori.length}
      </div>
    </div>
  );
}

function RetetePage() {
  const [retete, setRetete] = React.useState([]);
  const [selectedReteta, setSelectedReteta] = React.useState(null);
  const [retetaDetalii, setRetetaDetalii] = React.useState([]);
  const [materii, setMaterii] = React.useState([]);
  const [produse, setProduse] = React.useState([]);
  const [newIngredient, setNewIngredient] = React.useState({
    cod_mat: '',
    cant: '',
    um: 'grame'
  });
  const [selectedProdus, setSelectedProdus] = React.useState(null);

  React.useEffect(() => {
    loadRetete();
    loadMaterii();
    loadProduse();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  const loadProduse = async () => {
    try {
      const res = await axios.get('/api/produse');
      setProduse(res.data);
    } catch (err) {
      console.error('Eroare load produse:', err);
    }
  };

  const loadRetete = async () => {
    try {
      const res = await axios.get('/api/magazie/retete');
      // Group by cod_ret
      const grouped = {};
      res.data.forEach(r => {
        if (!grouped[r.cod_ret]) {
          grouped[r.cod_ret] = [];
        }
        grouped[r.cod_ret].push(r);
      });
      
      const uniques = Object.keys(grouped).map(cod => ({
        cod_ret: parseInt(cod),
        denumire: grouped[cod][0]?.denumire || `Rețetă ${cod}`,
        linii: grouped[cod].length
      }));
      
      setRetete(uniques);
    } catch (err) {
      console.error('Eroare load retete:', err);
    }
  };

  const loadRetetaDetalii = async (cod_ret) => {
    try {
      const res = await axios.get(`/api/magazie/retete/${cod_ret}`);
      setRetetaDetalii(res.data);
      setSelectedReteta(cod_ret);
      
      // Find corresponding product
      const produs = produse.find(p => p.cod_prod === cod_ret);
      setSelectedProdus(produs);
    } catch (err) {
      console.error('Eroare load detalii:', err);
    }
  };

  const handleAdaugaIngredient = async () => {
    try {
      if (!selectedReteta || !newIngredient.cod_mat || !newIngredient.cant) {
        alert('Selectează rețeta și completează ingredientul!');
        return;
      }

      const material = materii.find(m => m.cod === parseInt(newIngredient.cod_mat));
      
      await axios.post('/api/magazie/retete', {
        cod_ret: selectedReteta,
        cod_mat: parseInt(newIngredient.cod_mat),
        denumire: material?.denumire || '',
        cant: parseFloat(newIngredient.cant),
        um: newIngredient.um,
        gestiune_id: 1,
        pret_material: material?.pret || 0,
        buc: 1,
        coef: 1
      });

      alert('Ingredient adăugat!');
      loadRetete();
      loadRetetaDetalii(selectedReteta);
      setNewIngredient({ cod_mat: '', cant: '', um: 'grame' });
    } catch (err) {
      alert('Eroare: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStergeIngredient = async (id) => {
    if (!confirm('Ștergi acest ingredient din rețetă?')) return;
    try {
      await axios.delete(`/api/magazie/retete/${id}`);
      alert('Ingredient șters!');
      loadRetete();
      loadRetetaDetalii(selectedReteta);
    } catch (err) {
      alert('Eroare ștergere: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Retete Mancare</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Lista rețete */}
        <div>
          <h3 className="text-lg font-bold mb-3 bg-blue-100 p-2 rounded">
            Rețete disponibile ({retete.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-2">
            {retete.map(r => (
              <button
                key={r.cod_ret}
                onClick={() => loadRetetaDetalii(r.cod_ret)}
                className={`w-full text-left p-2 rounded border-2 transition ${
                  selectedReteta === r.cod_ret 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold">#{r.cod_ret} - {r.denumire}</div>
                <div className="text-xs text-gray-600">{r.linii} ingrediente</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalii rețetă */}
        <div>
          {selectedReteta ? (
            <div>
              <h3 className="text-lg font-bold mb-3 bg-green-100 p-2 rounded">
                Detalii Rețetă #{selectedReteta}
                {selectedProdus && (
                  <span className="text-sm font-normal ml-2">
                    → {selectedProdus.den_prod} ({selectedProdus.pret_vanzare} Lei)
                  </span>
                )}
              </h3>

              {/* Adaugă ingredient nou */}
              <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-400 mb-3">
                <h4 className="font-bold mb-2 text-sm">➕ Adaugă Ingredient</h4>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={newIngredient.cod_mat}
                    onChange={(e) => setNewIngredient({...newIngredient, cod_mat: e.target.value})}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="">Material...</option>
                    {materii.map(m => (
                      <option key={m.cod} value={m.cod}>{m.denumire}</option>
                    ))}
                  </select>
                  <input 
                    placeholder="Cantitate" 
                    type="number"
                    step="0.01"
                    value={newIngredient.cant}
                    onChange={(e) => setNewIngredient({...newIngredient, cant: e.target.value})}
                    className="p-2 border rounded text-sm" 
                  />
                  <select 
                    value={newIngredient.um}
                    onChange={(e) => setNewIngredient({...newIngredient, um: e.target.value})}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="grame">grame</option>
                    <option value="ml">ml</option>
                    <option value="buc">buc</option>
                    <option value="Kg">Kg</option>
                    <option value="Litru">Litru</option>
                  </select>
                </div>
                <button 
                  onClick={handleAdaugaIngredient}
                  className="mt-2 w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm"
                >
                  ➕ ADAUGA INGREDIENT
                </button>
              </div>

              <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead className="bg-green-400 text-white">
                  <tr>
                    <th className="border p-1">Material</th>
                    <th className="border p-1">Cant</th>
                    <th className="border p-1">UM</th>
                    <th className="border p-1">Preț</th>
                    <th className="border p-1">Total</th>
                    <th className="border p-1">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {retetaDetalii.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-100">
                      <td className="border p-1">{r.denumire_material}</td>
                      <td className="border p-1 text-right">{r.cant.toFixed(2)}</td>
                      <td className="border p-1">{r.um}</td>
                      <td className="border p-1 text-right">{r.pret_material?.toFixed(2) || '-'}</td>
                      <td className="border p-1 text-right">
                        {r.cant && r.pret_material ? (r.cant * r.pret_material).toFixed(2) : '-'}
                      </td>
                      <td className="border p-1 text-center">
                        <button
                          onClick={() => handleStergeIngredient(r.id)}
                          className="text-red-600 hover:underline text-xs font-bold"
                        >
                          Șterge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {retetaDetalii.length > 0 && (
                <div className="mt-2 text-right font-bold bg-gray-100 p-2 rounded">
                  Preț total ingrediente: {retetaDetalii.reduce((sum, r) => sum + (r.cant * (r.pret_material || 0)), 0).toFixed(2)} Lei
                  {selectedProdus && (
                    <span className="ml-4 text-green-600">
                      | Preț vânzare: {selectedProdus.pret_vanzare} Lei
                      | Profit: {(selectedProdus.pret_vanzare - retetaDetalii.reduce((sum, r) => sum + (r.cant * (r.pret_material || 0)), 0)).toFixed(2)} Lei
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4 border rounded">
              Selectează o rețetă pentru a vedea ingredientele
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DescarcareInterface() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded border-2 border-gray-300">
        <h3 className="font-bold mb-2">Backup Baza de Date</h3>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">CREEAZA BACKUP</button>
        <p className="text-sm mt-2 text-gray-600">Ultimul backup: 2026-02-01 23:19:57</p>
      </div>
      <div className="bg-gray-100 p-4 rounded border-2 border-gray-300">
        <h3 className="font-bold mb-2">Export Date</h3>
        <select className="w-full p-2 border rounded mb-2">
          <option>Comenzi (CSV)</option>
          <option>Facturi (PDF)</option>
          <option>Stocuri (XLSX)</option>
        </select>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold">DESCARCA</button>
      </div>
    </div>
  );
}

function UtilitareInterface() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded border-2 border-gray-300">
        <h3 className="font-bold mb-2">Configurare Sistem</h3>
        <div className="space-y-2">
          <div>
            <label className="block font-bold">Nume Restaurant</label>
            <input defaultValue="Restaurant App Hybrid" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">CUI</label>
            <input defaultValue="12345678" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Adresa</label>
            <input defaultValue="București, România" className="w-full p-2 border rounded" />
          </div>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold">SALVEAZA</button>
        </div>
      </div>
    </div>
  );
}

function RapoarteInterface() {
  const [tabRaport, setTabRaport] = React.useState('inventar');
  const [raportData, setRaportData] = React.useState([]);
  const [stats, setStats] = React.useState({});

  React.useEffect(() => {
    loadRaportData();
  }, [tabRaport]);

  const loadRaportData = async () => {
    try {
      if (tabRaport === 'inventar') {
        const res = await axios.get('/api/magazie/materii-prime');
        setRaportData(res.data);
        
        const total = res.data.reduce((sum, m) => sum + (m.pret * (m.st_min || 0)), 0);
        setStats({ total_materiale: res.data.length, valoare_totala: total });
      }
      else if (tabRaport === 'stocuri') {
        const res = await axios.get('/api/history/rapoarte-stocuri');
        setRaportData(res.data.slice(0, 50));
        
        const total = res.data.reduce((sum, r) => sum + (r.num8 || 0), 0);
        setStats({ total_linii: res.data.length, valoare_totala: total });
      }
      else if (tabRaport === 'furnizori') {
        const res = await axios.get('/api/magazie/furnizori');
        setRaportData(res.data);
        setStats({ total_furnizori: res.data.length });
      }
      else if (tabRaport === 'jurnal') {
        const res = await axios.get('/api/history/comenzi-istoric');
        setRaportData(res.data);
        
        const total = res.data.reduce((sum, c) => sum + (c.valoare || 0), 0);
        setStats({ total_comenzi: res.data.length, valoare_totala: total });
      }
      else if (tabRaport === 'facturi') {
        const res = await axios.get('/api/history/bonuri');
        setRaportData(res.data);
        
        const total = res.data.reduce((sum, b) => sum + (b.valoare || 0), 0);
        setStats({ total_facturi: res.data.length, valoare_totala: total });
      }
    } catch (err) {
      console.error('Eroare load raport:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Rapoarte și Analize</h2>

      {/* Tabs pentru tipuri rapoarte */}
      <div className="flex gap-2 border-b-2 border-gray-400 pb-2">
        {[
          { id: 'inventar', label: 'Inventar Materii' },
          { id: 'stocuri', label: 'Raport Stocuri' },
          { id: 'furnizori', label: 'Furnizori' },
          { id: 'jurnal', label: 'Jurnal Comenzi' },
          { id: 'facturi', label: 'Listă Facturi' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabRaport(tab.id)}
            className={`px-4 py-2 font-bold rounded ${
              tabRaport === tab.id
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Statistici */}
      <div className="grid grid-cols-4 gap-4">
        {stats.total_materiale && (
          <div className="bg-blue-100 p-4 rounded border-2 border-blue-400">
            <h3 className="font-bold">Total Materiale</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total_materiale}</p>
          </div>
        )}
        {stats.total_furnizori >= 0 && (
          <div className="bg-green-100 p-4 rounded border-2 border-green-400">
            <h3 className="font-bold">Total Furnizori</h3>
            <p className="text-2xl font-bold text-green-600">{stats.total_furnizori}</p>
          </div>
        )}
        {stats.total_comenzi >= 0 && (
          <div className="bg-purple-100 p-4 rounded border-2 border-purple-400">
            <h3 className="font-bold">Total Comenzi</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.total_comenzi}</p>
          </div>
        )}
        {stats.valoare_totala >= 0 && (
          <div className="bg-red-100 p-4 rounded border-2 border-red-400">
            <h3 className="font-bold">Valoare Totală</h3>
            <p className="text-2xl font-bold text-red-600">{stats.valoare_totala?.toFixed(2)} RON</p>
          </div>
        )}
      </div>

      {/* Tabel raport */}
      {tabRaport === 'inventar' && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead className="bg-blue-400 text-white">
            <tr>
              <th className="border p-1">Cod</th>
              <th className="border p-1">Denumire</th>
              <th className="border p-1">UM</th>
              <th className="border p-1">Preț</th>
              <th className="border p-1">St. Min</th>
              <th className="border p-1">TVA</th>
              <th className="border p-1">Valoare Min</th>
            </tr>
          </thead>
          <tbody>
            {raportData.map((m, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border p-1">{m.cod}</td>
                <td className="border p-1">{m.denumire}</td>
                <td className="border p-1">{m.um}</td>
                <td className="border p-1 text-right">{m.pret?.toFixed(2)}</td>
                <td className="border p-1 text-right">{m.st_min?.toFixed(2)}</td>
                <td className="border p-1 text-center">{m.tva === 1.21 ? '21%' : '11%'}</td>
                <td className="border p-1 text-right font-bold">{(m.pret * (m.st_min || 0))?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tabRaport === 'stocuri' && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead className="bg-green-400 text-white">
            <tr>
              <th className="border p-1">Denumire</th>
              <th className="border p-1">UM</th>
              <th className="border p-1">Stoc</th>
              <th className="border p-1">Valoare</th>
              <th className="border p-1">Data</th>
            </tr>
          </thead>
          <tbody>
            {raportData.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border p-1">{r.denumire}</td>
                <td className="border p-1">{r.um}</td>
                <td className="border p-1 text-right font-bold">{r.num7?.toFixed(2)}</td>
                <td className="border p-1 text-right text-green-600">{r.num8?.toFixed(2)}</td>
                <td className="border p-1 text-xs">{r.data?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tabRaport === 'furnizori' && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead className="bg-purple-400 text-white">
            <tr>
              <th className="border p-1">Cod</th>
              <th className="border p-1">Denumire</th>
              <th className="border p-1">CUI</th>
              <th className="border p-1">Adresa</th>
              <th className="border p-1">Telefon</th>
              <th className="border p-1">Cont Bancar</th>
            </tr>
          </thead>
          <tbody>
            {raportData.map((f, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border p-1">{f.cod_client}</td>
                <td className="border p-1 font-bold">{f.denumire}</td>
                <td className="border p-1">{f.cod_fiscal}</td>
                <td className="border p-1">{f.adresa}</td>
                <td className="border p-1">{f.telefon || f.tel_mobil}</td>
                <td className="border p-1 text-xs">{f.cont}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tabRaport === 'jurnal' && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead className="bg-orange-400 text-white">
            <tr>
              <th className="border p-1">Data</th>
              <th className="border p-1">Masă</th>
              <th className="border p-1">Ospătar</th>
              <th className="border p-1">Produs</th>
              <th className="border p-1">Cant</th>
              <th className="border p-1">Preț</th>
              <th className="border p-1">Valoare</th>
            </tr>
          </thead>
          <tbody>
            {raportData.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border p-1 text-xs">{c.data?.split('T')[0]}</td>
                <td className="border p-1 text-center">{c.nr_masa}</td>
                <td className="border p-1 text-center">{c.nr_osp}</td>
                <td className="border p-1">{c.den_prod}</td>
                <td className="border p-1 text-right">{c.cant}</td>
                <td className="border p-1 text-right">{c.pr_unitar?.toFixed(2)}</td>
                <td className="border p-1 text-right font-bold">{c.valoare?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tabRaport === 'facturi' && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead className="bg-red-400 text-white">
            <tr>
              <th className="border p-1">Data</th>
              <th className="border p-1">Denumire</th>
              <th className="border p-1">Cant</th>
              <th className="border p-1">Preț</th>
              <th className="border p-1">Valoare</th>
              <th className="border p-1">TVA</th>
              <th className="border p-1">Dept</th>
            </tr>
          </thead>
          <tbody>
            {raportData.map((b, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border p-1 text-xs">{b.data_bon?.split('T')[0]}</td>
                <td className="border p-1">{b.denumire}</td>
                <td className="border p-1 text-right">{b.cantitate}</td>
                <td className="border p-1 text-right">{b.pret_unitar?.toFixed(2)}</td>
                <td className="border p-1 text-right font-bold">{b.valoare?.toFixed(2)}</td>
                <td className="border p-1">{b.tva}</td>
                <td className="border p-1">{b.dep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {raportData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">Nu sunt date disponibile pentru acest raport</p>
      )}

      {/* Export options */}
      <div className="flex gap-2 mt-4">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">
          📄 EXPORT PDF
        </button>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold">
          📊 EXPORT EXCEL
        </button>
        <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold">
          🖨️ TIPARESTE
        </button>
      </div>
    </div>
  );
}

function FacturiInterface() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Gestionare Facturi</h2>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <input placeholder="Numar Factura" className="p-2 border rounded" />
        <input placeholder="De la data" type="date" className="p-2 border rounded" />
        <input placeholder="Pana la data" type="date" className="p-2 border rounded" />
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">CAUTA</button>
      </div>
      <table className="w-full border-collapse border border-gray-400">
        <thead className="bg-blue-400 text-white">
          <tr>
            <th className="border p-2">Nr Factura</th>
            <th className="border p-2">Data</th>
            <th className="border p-2">Client</th>
            <th className="border p-2">Valoare</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map(i => (
            <tr key={i} className="hover:bg-gray-100">
              <td className="border p-2">FAC-2024-00{i}</td>
              <td className="border p-2">01.02.2024</td>
              <td className="border p-2">Client {i}</td>
              <td className="border p-2">{(i * 250).toFixed(2)} RON</td>
              <td className="border p-2"><span className="px-2 py-1 bg-green-500 text-white rounded">Platita</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IstoricInterface() {
  const [istoData, setIstoData] = React.useState([]);
  const [tabIstoId, setTabIstoId] = React.useState('comenzi');

  React.useEffect(() => {
    loadHistoryData();
  }, [tabIstoId]);

  const loadHistoryData = async () => {
    try {
      let endpoint = '/api/history/comenzi-istoric';
      if (tabIstoId === 'bonuri') endpoint = '/api/history/bonuri';
      if (tabIstoId === 'rapoarte') endpoint = '/api/history/rapoarte-stocuri';
      if (tabIstoId === 'stats') {
        const res = await axios.get('/api/history/stats/comenzi-per-masa');
        setIstoData(res.data);
        return;
      }
      
      const res = await axios.get(endpoint);
      setIstoData(res.data.slice(0, 50));
    } catch (err) {
      console.error('Eroare load history:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Istoric și Rapoarte</h2>
      
      <div className="flex gap-2 mb-4 border-b-2 border-gray-400 pb-2">
        {[
          { id: 'comenzi', label: 'Comenzi Istoric' },
          { id: 'bonuri', label: 'Bonuri' },
          { id: 'rapoarte', label: 'Rapoarte Stocuri' },
          { id: 'stats', label: 'Statistici' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabIstoId(tab.id)}
            className={`px-4 py-2 font-bold rounded ${
              tabIstoId === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabIstoId === 'comenzi' && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead className="bg-blue-400 text-white">
            <tr>
              <th className="border p-1">Masa</th>
              <th className="border p-1">Ospătar</th>
              <th className="border p-1">Produs</th>
              <th className="border p-1">Cant</th>
              <th className="border p-1">Preț</th>
              <th className="border p-1">Valoare</th>
              <th className="border p-1">Data</th>
            </tr>
          </thead>
          <tbody>
            {istoData.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border p-1">{c.nr_masa}</td>
                <td className="border p-1">{c.nr_osp}</td>
                <td className="border p-1">{c.den_prod}</td>
                <td className="border p-1 text-right">{c.cant}</td>
                <td className="border p-1 text-right">{c.pr_unitar?.toFixed(2)}</td>
                <td className="border p-1 text-right font-bold">{c.valoare?.toFixed(2)}</td>
                <td className="border p-1 text-xs">{c.data?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {istoData.length === 0 && tabIstoId === 'comenzi' && (
        <p className="text-center text-gray-500 mt-4">Nu sunt date disponibile</p>
      )}
    </div>
  );
}
