import React, { useState, useEffect } from 'react';
import { loadLoginUsers, saveLoginUsers, defaultLoginUsers } from '../utils/loginUsers';
import { getInactivityTimeoutSec, setInactivityTimeoutSec, MIN_SEC, MAX_SEC } from '../utils/inactivityTimeout';

const SetariPage = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [visiblePinIds, setVisiblePinIds] = useState({});
  const [error, setError] = useState('');
  const [inactivitySec, setInactivitySec] = useState(60);
  const [inactivitySaved, setInactivitySaved] = useState(false);

  useEffect(() => {
    setUsers(loadLoginUsers());
    setInactivitySec(getInactivityTimeoutSec());
  }, []);

  useEffect(() => {
    setUsers(loadLoginUsers());
  }, []);

  const togglePinVisibility = (id) => {
    setVisiblePinIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditUser = (user, rol, nume) => {
    setEditingUser({
      id: user.id,
      rol: rol ?? user.rol ?? 'ospatar',
      nume: user.nume ?? nume ?? '',
      pin: user.pin || '',
      obs: user.obs ?? ''
    });
    setError('');
  };

  const handleSaveUser = () => {
    if (!editingUser?.nume?.trim()) {
      setError('Numele este obligatoriu.');
      return;
    }
    if (!editingUser.pin || editingUser.pin.length !== 4 || !/^\d{4}$/.test(editingUser.pin)) {
      setError('PIN-ul trebuie să aibă exact 4 cifre.');
      return;
    }
    const existing = users.find((u) => u.id !== editingUser.id && u.pin === editingUser.pin);
    if (existing) {
      setError('PIN-ul este deja folosit de alt utilizator.');
      return;
    }
    const savedUser = {
      id: editingUser.id,
      rol: editingUser.rol || 'ospatar',
      nume: editingUser.nume.trim(),
      pin: editingUser.pin,
      obs: (editingUser.obs || '').trim()
    };
    const updated = users.map((u) => (u.id === editingUser.id ? savedUser : u));
    setUsers(updated);
    saveLoginUsers(updated);
    setEditingUser(null);
    setError('');
    setVisiblePinIds({});
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setError('');
  };

  const handleSaveInactivity = () => {
    const val = setInactivityTimeoutSec(inactivitySec);
    setInactivitySec(val);
    setInactivitySaved(true);
    setTimeout(() => setInactivitySaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">⚙️ Setări</h1>
        <p className="text-black">Setări generale și utilizatori pentru logare.</p>
      </div>

      {/* Utilizatori logare – editare și salvare (doar admin) */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-2">👥 Utilizatori logare</h2>
        <p className="text-gray-600 text-sm mb-4">
          La prima utilizare administratorul se loghează cu PIN <strong>0000</strong>. Aici setați numele, rolurile și PIN-urile pentru cei 6 utilizatori (1 admin + 5 ospătari). Modificările se salvează local și apar pe ecranul de login.
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Apasă <strong className="text-green-700">Edit</strong> la un rând, modificați câmpurile, apoi <strong>Salvează</strong>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="font-bold py-2 px-2 text-left w-12 text-black">Nr.crt.</th>
                <th className="font-bold py-2 px-2 text-left text-black">Nume</th>
                <th className="font-bold py-2 px-2 text-left text-black">Rol</th>
                <th className="font-bold py-2 px-2 text-left text-black">PIN</th>
                <th className="font-bold py-2 px-2 text-left text-black">Obs.</th>
                <th className="font-bold py-2 px-2 text-center text-black">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {(users.length ? users : defaultLoginUsers).map((user, index) => {
                if (!user) return null;
                const rol = user.rol ?? (user.tip === 'admin' ? 'admin' : 'ospatar');
                const nume = user.nume ?? `Utilizator ${user.id}`;
                return (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-2 text-black">{index + 1}</td>
                    <td className="py-2 px-2 font-medium text-black">{nume}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${rol === 'admin' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {rol === 'admin' ? 'Admin' : 'Ospatar'}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono font-bold min-w-[4ch] text-black">
                          {visiblePinIds[user.id] ? (user.pin || '') : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(user.id)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500"
                          title={visiblePinIds[user.id] ? 'Ascunde PIN' : 'Arată PIN'}
                        >
                          {visiblePinIds[user.id] ? '🙈' : '👁'}
                        </button>
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-600 italic text-sm">{user.obs ?? '–'}</td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleEditUser(user, rol, nume)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-xs font-bold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeout inactivitate – interfața de vânzări */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-black mb-2">⏱️ Timeout inactivitate (vânzări)</h2>
        <p className="text-gray-600 text-sm mb-4">
          După acest timp fără activitate (mouse, tastatură, touch) pe ecranul de vânzări (Plan mese sau Comandă), aplicația revine automat la ecranul de login. Valori între {MIN_SEC} și {MAX_SEC} secunde.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="font-medium text-black">Timeout (secunde):</label>
          <input
            type="number"
            min={MIN_SEC}
            max={MAX_SEC}
            value={inactivitySec}
            onChange={(e) => setInactivitySec(Math.max(MIN_SEC, Math.min(MAX_SEC, parseInt(e.target.value, 10) || 60)))}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-black"
          />
          <span className="text-gray-600 text-sm">sec (implicit 60 = 1 minut)</span>
          <button
            type="button"
            onClick={handleSaveInactivity}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
          >
            Salvează
          </button>
          {inactivitySaved && <span className="text-green-600 text-sm font-medium">Salvat.</span>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <section>
          <h2 className="text-lg font-bold text-black mb-2">Afișare</h2>
          <p className="text-black text-sm">Tema (clar/închis), dimensiune font – vor fi implementate aici.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-black mb-2">Limbă</h2>
          <p className="text-black text-sm">Limba interfeței: Română (implicit).</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-black mb-2">Notificări</h2>
          <p className="text-black text-sm">Alerte stoc minim, rapoarte programate – configurare ulterioară.</p>
        </section>
        <p className="text-gray-600 text-sm pt-4">
          Pentru configurare firmă, date bancare și ANAF folosiți <strong>Utilitare → Configurare</strong>.
        </p>
      </div>

      {/* Modal editare utilizator */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-black mb-4">
              Editare {editingUser.rol === 'admin' ? 'Admin' : `Ospatar #${editingUser.id}`}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-black font-bold mb-1">Nume</label>
                <input
                  type="text"
                  value={editingUser.nume}
                  onChange={(e) => setEditingUser({ ...editingUser, nume: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  placeholder="ex: Raluca"
                />
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Rol</label>
                <select
                  value={editingUser.rol}
                  onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                >
                  <option value="admin">Admin</option>
                  <option value="ospatar">Ospatar</option>
                </select>
              </div>
              <div>
                <label className="block text-black font-bold mb-1">PIN (4 cifre)</label>
                <div className="flex items-center gap-2">
                  <input
                    type={visiblePinIds[editingUser.id] ? 'text' : 'password'}
                    maxLength={4}
                    value={editingUser.pin}
                    onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value.replace(/\D/g, '') })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-center text-xl text-black"
                    placeholder="0000"
                  />
                  <button
                    type="button"
                    onClick={() => togglePinVisibility(editingUser.id)}
                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    {visiblePinIds[editingUser.id] ? '🙈' : '👁'}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">Doar cifre, exact 4 caractere</p>
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Obs.</label>
                <input
                  type="text"
                  value={editingUser.obs ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, obs: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  placeholder="ex: tura dimineata"
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveUser} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-bold">
                Salvează
              </button>
              <button onClick={handleCancelEdit} className="flex-1 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 font-bold">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetariPage;
