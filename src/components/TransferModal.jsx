import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransferModal = ({ isOpen, onClose, gestiuni, ingrediente, onTransferSucces }) => {
    if (!isOpen) return null;

    // --- STATE ---
    const [selectedCod, setSelectedCod] = useState('');
    const [selectedProdus, setSelectedProdus] = useState(null);
    const [nirHistory, setNirHistory] = useState([]);
    const [stocCurent, setStocCurent] = useState(0);

    // Form Data
    const [formData, setFormData] = useState({
        cantitate: '',
        in_gestiune: '',
        nota_transfer: '',
        data: new Date().toLocaleDateString('ro-RO'), // DD/MM/YYYY
    });

    // --- HANDLERS ---

    // Cand se schimba produsul selectat (din dropdown sau cod)
    const handleSelectProdus = async (ing) => {
        setSelectedProdus(ing);
        setSelectedCod(ing.cod);
        setStocCurent('...'); // Loading placeholder

        try {
            // 1. Fetch Istoric Intrari (NIR) - pentru tabelul central
            const respNir = await axios.get('/api/magazie/nir', { params: { cod_material: ing.cod } });
            setNirHistory(respNir.data || []);

            // 2. Fetch Stoc Curent (Total in Depozit - Gestiune 1)
            const respStoc = await axios.get('/api/magazie/stocuri/gestiune/1');
            // Cautam stocul produsului in lista
            const itemStoc = respStoc.data.find(s => s.cod_material == ing.cod);
            setStocCurent(itemStoc ? itemStoc.cant_stoc : 0);

        } catch (e) {
            console.error("Eroare la incarcare date produs:", e);
            setStocCurent(0);
        }
    };

    const handleCodChange = (e) => {
        const cod = e.target.value;
        setSelectedCod(cod);
        const ing = ingrediente.find(i => i.cod == cod);
        if (ing) {
            handleSelectProdus(ing);
        } else {
            setSelectedProdus(null);
            setNirHistory([]);
            setStocCurent(0);
        }
    };

    const doTransfer = async () => {
        if (!selectedProdus) return alert("Selectați un produs!");
        if (!formData.cantitate || parseFloat(formData.cantitate) <= 0) return alert("Introduceți o cantitate validă!");
        if (!formData.in_gestiune) return alert("Selectați gestiunea de destinație!");
        if (parseFloat(formData.cantitate) > parseFloat(stocCurent)) {
            if (!window.confirm("ATENȚIE: Cantitatea depășește stocul scriptic! Continuați?")) return;
        }

        try {
            await axios.post('/api/magazie/transfer-gestiuni', {
                cod_material: selectedProdus.cod,
                cant_transfer: parseFloat(formData.cantitate),
                din_gestiune_id: 1, // Presupunem Depozit Magazie Centrala
                in_gestiune_id: parseInt(formData.in_gestiune),
                nota_transfer: formData.nota_transfer,
                pret_transfer: selectedProdus.pret // Prețul de referință sau mediu ponderat (backend ar trebui sa se ocupe, trimitem pret curent)
            });

            alert("Transfer realizat cu succes! ✅");
            if (onTransferSucces) onTransferSucces();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Eroare transfer: " + (e.response?.data?.error || e.message));
        }
    };

    // --- RENDER ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#f0f0f0] rounded shadow-2xl w-full max-w-4xl border border-gray-400 p-1 select-none font-sans relative">

                {/* Title Bar Style Windows */}
                <div className="bg-white px-2 py-1 flex justify-between items-center border-b border-gray-300 mb-4 shadow-sm">
                    <div className="font-bold text-gray-700 flex items-center gap-2">
                        <span className="text-blue-600 text-xl">🚀</span>
                        <span className="text-sm">Transfer din Magazie în Gestiuni</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold px-2">&times;</button>
                </div>

                <div className="p-6 pt-2">

                    {/* --- SECTIUNEA SUPERIOARA: Produs --- */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <label className="font-serif italic text-xl font-bold text-gray-800">Produs</label>

                        {/* Dropdown Produs */}
                        <select
                            className="border border-blue-400 bg-blue-600 text-white font-bold p-1 w-96 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={selectedCod}
                            onChange={(e) => {
                                const ing = ingrediente.find(i => i.cod == e.target.value);
                                if (ing) handleSelectProdus(ing);
                            }}
                        >
                            <option value="">-- Alegeți Produsul --</option>
                            {ingrediente.map(ing => (
                                <option key={ing.cod} value={ing.cod}>{ing.denumire}</option>
                            ))}
                        </select>

                        {/* Input Cod Mic */}
                        <input
                            type="text"
                            className="w-16 border border-gray-300 p-1 text-center font-mono text-gray-600 bg-white shadow-inner"
                            value={selectedCod}
                            onChange={handleCodChange}
                            placeholder="Cod"
                        />
                    </div>


                    {/* --- TABEL ISTORIC INTRARI --- */}
                    <div className="border border-gray-400 bg-white h-64 overflow-y-auto mb-6 shadow-inset">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#e0e0e0] sticky top-0 text-gray-700 font-serif italic border-b border-gray-400">
                                <tr>
                                    <th className="p-1 border-r border-gray-300 font-normal">Cant.int</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">Cant.c.</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">Pret un.</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">Valoare</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">TVA</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">Fact. Nr</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">N.I.R. Nr.</th>
                                    <th className="p-1 border-r border-gray-300 font-normal">Data</th>
                                    <th className="p-1 font-normal">Data exp.</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono text-gray-800">
                                {nirHistory.length === 0 ? (
                                    <tr><td colSpan="9" className="p-4 text-center text-gray-400">Selectați un produs pentru a vedea loturile...</td></tr>
                                ) : (
                                    nirHistory.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50 border-b border-gray-100 cursor-pointer">
                                            <td className="p-1 border-r text-right">{row.cant}</td>
                                            {/* Aici am putea calcula cat a mai ramas teoretic daca am avea FIFO. Afisam tot cant intrare momentan sau o estimare */}
                                            <td className="p-1 border-r text-right text-gray-500">{row.cant}</td>
                                            <td className="p-1 border-r text-right">{row.pret}</td>
                                            <td className="p-1 border-r text-right">{row.valoare}</td>
                                            <td className="p-1 border-r text-right">{(row.tva_proc || 9)}%</td>
                                            <td className="p-1 border-r">{row.nr_fact}</td>
                                            <td className="p-1 border-r">{row.nr_nir}</td>
                                            <td className="p-1 border-r">{row.data_fact}</td>
                                            <td className="p-1">{row.data_exp || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>


                    {/* --- SECTIUNEA INFERIOARA: FORMULAR TRANSFER --- */}
                    <div className="grid grid-cols-2 gap-8 items-end">

                        {/* Stanga: Cantitati */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="font-serif italic text-lg text-gray-800">Cantitate Existenta</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={stocCurent}
                                    className="border border-gray-300 w-24 p-1 text-right bg-gray-100 font-mono font-bold"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="font-serif italic text-lg text-gray-800">Cant. de Transferat</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.cantitate}
                                    onChange={(e) => setFormData({ ...formData, cantitate: e.target.value })}
                                    className="border border-gray-300 w-24 p-1 text-right bg-white font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="text-right text-xs text-gray-500 font-serif italic">in gestiunea nr.</div>

                            <div className="flex justify-end">
                                {/* Dropdown in loc de input numeric simplu pt Gestiune, mai user friendly dar pastram aspect input */}
                                <select
                                    className="border border-gray-300 w-48 p-1 text-sm bg-white"
                                    value={formData.in_gestiune}
                                    onChange={(e) => setFormData({ ...formData, in_gestiune: e.target.value })}
                                >
                                    <option value="">- Select -</option>
                                    {gestiuni.filter(g => g.id !== 1).map(g => (
                                        <option key={g.id} value={g.id}>{g.id}. {g.nume}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <label className="font-serif italic text-sm text-gray-800">Nota de Transfer</label>
                                <input
                                    type="text"
                                    value={formData.nota_transfer}
                                    onChange={(e) => setFormData({ ...formData, nota_transfer: e.target.value })}
                                    className="border border-gray-300 w-32 p-1 bg-white text-sm"
                                />
                            </div>
                        </div>

                        {/* Dreapta: Data si Butoane */}
                        <div className="flex flex-col justify-between h-full">
                            <div className="flex items-center gap-2 mb-8">
                                <label className="font-serif italic text-lg text-gray-800">Data</label>
                                <input
                                    type="text"
                                    value={formData.data}
                                    readOnly
                                    className="border border-gray-300 w-32 p-1 text-center bg-gray-100"
                                />
                            </div>

                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={doTransfer}
                                    className="bg-[#f0f0f0] border border-gray-400 px-6 py-2 shadow-md hover:bg-gray-200 active:translate-y-1 transition-all flex items-center gap-2 text-red-600 font-serif italic font-bold text-xl"
                                >
                                    <span>✔</span> Transfer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Buton Iesire (Centrat Jos) */}
                    <div className="flex justify-center mt-8 border-t border-gray-300 pt-4">
                        <button
                            onClick={onClose}
                            className="bg-[#f0f0f0] border border-gray-400 px-8 py-1 shadow hover:bg-red-50 text-black font-bold font-serif flex items-center gap-2"
                        >
                            <span className="text-red-600">✱</span> Iesire
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TransferModal;
