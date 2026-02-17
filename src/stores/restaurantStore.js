import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRestaurantStore = create(
  persist(
    (set) => ({
      // Auth
      ospatar: null,
      setOspatar: (ospatar) => set({ ospatar }),

      // Tables
      mese: [],
      setMese: (mese) => set({ mese }),
      selectMasa: (masa_id) => set((state) => ({
        mese: state.mese.map(m => ({
          ...m,
          selectata: m.id === masa_id ? true : false
        }))
      })),

      // Update masa status
      updateMasaStatus: (masa_id, status) => set((state) => ({
        mese: state.mese.map(m => m.id === masa_id ? { ...m, status } : m)
      })),

      // Current order - PERSISTED
      currentComanda: {
        id: null,       // comanda_id din DB (când e încărcată din backend)
        masa_id: null,
        linii: [],
        total: 0,
        status: 'noua'  // noua, memorata, finalizata
      },
      
      setCurrentComanda: (comanda) => set({ currentComanda: { ...comanda, linii: comanda.linii || [], total: comanda.total ?? 0 } }),
      
      updateLinieCantitate: (idx, delta) => set((state) => {
        const linii = [...(state.currentComanda.linii || [])];
        if (idx < 0 || idx >= linii.length) return state;
        const l = { ...linii[idx] };
        const newCant = Math.max(0, (Number(l.cant) || 0) + delta);
        if (newCant <= 0) { linii.splice(idx, 1); } else {
          l.cant = newCant;
          l.valoare = newCant * (Number(l.pret_unitar) || 0);
          linii[idx] = l;
        }
        const total = linii.reduce((s, x) => s + (Number(x.valoare) || 0), 0);
        return { currentComanda: { ...state.currentComanda, linii, total: Math.round(total * 100) / 100 } };
      }),
      removeLinie: (idx) => set((state) => {
        const linii = [...(state.currentComanda.linii || [])];
        if (idx >= 0 && idx < linii.length) linii.splice(idx, 1);
        const total = linii.reduce((s, x) => s + (Number(x.valoare) || 0), 0);
        return { currentComanda: { ...state.currentComanda, linii, total: Math.round(total * 100) / 100 } };
      }),
      addProdusToComanda: (produs) => set((state) => {
        const pret = Number(produs.pret_vanzare) || 0;
        const existing = state.currentComanda.linii.find(l => l.cod_prod === produs.cod_prod);
        let linii;
        if (existing) {
          linii = state.currentComanda.linii.map(l => {
            if (l.cod_prod !== produs.cod_prod) return l;
            const newCant = l.cant + 1;
            const pretUnitar = Number(l.pret_unitar) || pret;
            return { ...l, cant: newCant, pret_unitar: pretUnitar, valoare: newCant * pretUnitar };
          });
        } else {
          linii = [...state.currentComanda.linii, {
            cod_prod: produs.cod_prod,
            den_prod: produs.den_prod,
            cant: 1,
            pret_unitar: pret,
            valoare: pret
          }];
        }
        const total = linii.reduce((sum, l) => sum + (Number(l.valoare) || (l.cant * (l.pret_unitar || 0))), 0);
        return {
          currentComanda: { ...state.currentComanda, linii, total: Math.round(total * 100) / 100 }
        };
      }),

      resetComanda: () => set({ currentComanda: { id: null, masa_id: null, linii: [], total: 0, status: 'noua' } }),
      
      memorizeComanda: (masa_id) => set((state) => ({
        currentComanda: { ...state.currentComanda, masa_id, status: 'memorata' }
      })),
      
      finalizeComanda: (tip_plata) => set((state) => ({
        currentComanda: { ...state.currentComanda, status: 'finalizata', tip_plata }
      }))
    }),
    {
      name: 'restaurant-store',
      partialize: (state) => ({
        ospatar: state.ospatar,
        mese: state.mese,
        currentComanda: state.currentComanda
      })
    }
  )
);
