import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRestaurantStore } from '../stores/restaurantStore';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

const STORAGE_KEY = 'plan-sala-positions';
const TABLE_SIZE = 44;
const TABLE_GAP = 12;
const COLS = 10;

function getDefaultPositions(mese) {
  const positions = {};
  mese.forEach((masa, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    positions[masa.id] = {
      x: col * (TABLE_SIZE + TABLE_GAP) + 8,
      y: row * (TABLE_SIZE + TABLE_GAP) + 8
    };
  });
  return positions;
}

function loadPositions(mese) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPositions(mese);
    const saved = JSON.parse(raw);
    const positions = {};
    mese.forEach((masa, i) => {
      if (saved[masa.id] && typeof saved[masa.id].x === 'number' && typeof saved[masa.id].y === 'number') {
        positions[masa.id] = { x: saved[masa.id].x, y: saved[masa.id].y };
      } else {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        positions[masa.id] = { x: col * (TABLE_SIZE + TABLE_GAP) + 8, y: row * (TABLE_SIZE + TABLE_GAP) + 8 };
      }
    });
    return positions;
  } catch {
    return getDefaultPositions(mese);
  }
}

function savePositions(positions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    console.error('Save positions:', e);
  }
}

export default function PlanMesePage() {
  const navigate = useNavigate();
  const { ospatar, mese, setMese, selectMasa, setCurrentComanda } = useRestaurantStore();
  useInactivityLogout();
  const [positions, setPositions] = useState({});
  const [comenziMemorate, setComenziMemorate] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pointerStart, setPointerStart] = useState(null);
  const [loadingMese, setLoadingMese] = useState(false);
  const containerRef = useRef(null);

  // La montare sau refresh: dacă avem ospătar dar nu avem mese, încarcă mesele din API
  useEffect(() => {
    if (!ospatar || ospatar.rol === 'MANAGER') return;
    if (mese.length > 0) return;
    setLoadingMese(true);
    axios
      .get('/api/mese')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.mese || []);
        setMese(list);
      })
      .catch(() => setMese([]))
      .finally(() => setLoadingMese(false));
  }, [ospatar?.id, setMese]);

  useEffect(() => {
    if (mese.length) setPositions(loadPositions(mese));
  }, [mese.length]);

  useEffect(() => {
    axios.get('/api/comenzi/memorate').then(res => setComenziMemorate(res.data || [])).catch(() => setComenziMemorate([]));
    const iv = setInterval(() => {
      axios.get('/api/comenzi/memorate').then(res => setComenziMemorate(res.data || [])).catch(() => { });
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const masaCuMemo = new Set((comenziMemorate || []).map(c => String(c.masa_id)));

  const handlePointerDown = useCallback((e, masaId) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    // Capturăm pointer-ul pentru a continua drag-ul chiar dacă ieșim din element
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) { }

    const rect = container.getBoundingClientRect();
    const pos = positions[masaId] || { x: 0, y: 0 };

    setPointerStart({ x: e.clientX, y: e.clientY });
    setDraggingId(masaId);

    // Calculăm offset-ul cursorului față de colțul mesei, relativ la container
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    setDragOffset({ x: relativeX - pos.x, y: relativeY - pos.y });
  }, [positions]);

  const handlePointerMove = useCallback((e) => {
    if (draggingId == null) return;
    // e.preventDefault(); // Scot preventDefault aici pentru a permite pointer events global
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Poziția nouă este poziția cursorului minus offset-ul inițial
    let x = (e.clientX - rect.left) - dragOffset.x;
    let y = (e.clientY - rect.top) - dragOffset.y;

    // Constrângeri margini
    x = Math.max(0, Math.min(rect.width - TABLE_SIZE, x));
    y = Math.max(0, Math.min(rect.height - TABLE_SIZE, y));

    setPositions(prev => ({ ...prev, [draggingId]: { x, y } }));
  }, [draggingId, dragOffset]);

  const handlePointerUp = useCallback(async (e, masaId) => {
    if (draggingId == null) return;
    const wasDrag = pointerStart && (Math.abs(e.clientX - pointerStart.x) > 5 || Math.abs(e.clientY - pointerStart.y) > 5);
    setDraggingId(null);
    setPointerStart(null);
    if (wasDrag) {
      setPositions(prev => {
        const next = { ...prev };
        savePositions(next);
        return next;
      });
    } else {
      selectMasa(masaId);
      try {
        const res = await axios.get(`/api/comenzi/masa/${masaId}`);
        const com = res.data;
        if (com && com.linii && com.linii.length > 0) {
          const linii = com.linii.map(l => ({ cod_prod: l.cod_prod, den_prod: l.den_prod, cant: l.cant, pret_unitar: l.pret_unitar, valoare: l.valoare }));
          const total = linii.reduce((s, l) => s + (Number(l.cant) || 0) * (Number(l.pret_unitar) || 0), 0);
          setCurrentComanda({ id: com.id, masa_id: com.masa_id, linii, total: Math.round(total * 100) / 100, status: com.status || 'memorata' });
        } else {
          setCurrentComanda({ id: null, masa_id: masaId, linii: [], total: 0, status: 'noua' });
        }
      } catch {
        setCurrentComanda({ id: null, masa_id: masaId, linii: [], total: 0, status: 'noua' });
      }
      navigate('/comanda');
    }
  }, [draggingId, pointerStart, selectMasa, setCurrentComanda, navigate]);

  useEffect(() => {
    if (draggingId == null) return;
    const onMove = (e) => handlePointerMove(e);
    const onUp = (e) => handlePointerUp(e, draggingId);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingId, handlePointerMove, handlePointerUp]);

  if (!ospatar) {
    navigate('/');
    return null;
  }

  return (
    <div className="bg-gray-900 min-h-screen p-4">
      <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded">
        <h1 className="text-2xl font-bold text-red-600">RESTAURANT APP HYBRID</h1>
        <div className="text-right text-yellow-400 text-sm">
          <p className="font-bold">Ospătar: {ospatar.nume}</p>
          <p className="text-xs text-gray-400">Trage mesele pentru plan sală · Click pe masă pentru comandă</p>
        </div>
      </div>

      {/* Sala - zonă drag-and-drop */}
      <div
        ref={containerRef}
        className="relative bg-gray-800 rounded-xl border-2 border-gray-600 min-h-[420px] overflow-auto touch-none"
        style={{ minHeight: '420px', minWidth: '320px', touchAction: 'none' }}
      >
        {loadingMese && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Se încarcă planul salii…
          </div>
        )}
        {!loadingMese && mese.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 px-4 text-center">
            Nu există mese definite. Contactați administratorul.
          </div>
        )}
        {mese.map(masa => {
          const pos = positions[masa.id] ?? { x: 0, y: 0 };
          const isDragging = draggingId === masa.id;
          return (
            <div
              key={masa.id}
              role="button"
              tabIndex={0}
              onPointerDown={(e) => handlePointerDown(e, masa.id)}
              className={`absolute cursor-grab active:cursor-grabbing flex items-center justify-center font-bold rounded-lg shadow-lg select-none relative ${isDragging ? 'z-50 scale-110 shadow-2xl transition-none' : 'z-10 transition-all duration-300'
                } ${masa.status === 'ocupata'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              style={{
                left: pos.x,
                top: pos.y,
                width: TABLE_SIZE,
                height: TABLE_SIZE,
                fontSize: '0.9rem'
              }}
            >
              {masa.id}
              {masaCuMemo.has(String(masa.id)) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold" title="Comandă memorată">M</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded"
        >
          IESIRE
        </button>
        <button
          onClick={() => {
            if (window.confirm('Sigur vrei să resetezi pozițiile meselor la configurația implicită?')) {
              const defaults = getDefaultPositions(mese);
              setPositions(defaults);
              savePositions(defaults);
            }
          }}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded"
        >
          RESETARE PLAN
        </button>
      </div>
    </div>
  );
}
