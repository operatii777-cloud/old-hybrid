import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRestaurantStore } from '../stores/restaurantStore';
import { loadLoginUsers } from '../utils/loginUsers';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const { setOspatar, setMese } = useRestaurantStore();
  const navigate = useNavigate();

  useEffect(() => {
    setUsers(loadLoginUsers());
  }, []);

  const handleKeyPress = (key) => {
    if (key === 'C') {
      setPin('');
      setError('');
    } else if (key === 'ENTER') {
      handleLogin();
    } else {
      setPin(pin + key);
    }
  };

  const handleLogin = async () => {
    if (!pin) {
      setError('Introdu PIN-ul');
      return;
    }
    if (pin.length !== 4) {
      setError('PIN-ul trebuie să aibă 4 cifre');
      return;
    }

    setLoading(true);
    setError('');

    const user = users.find((u) => u.pin === pin);
    if (user) {
      if (user.rol === 'admin' || user.tip === 'admin') {
        setOspatar({
          id: `admin_${user.id}`,
          nume: user.nume,
          pin: user.pin,
          rol: 'MANAGER'
        });
        setMese([]);
        navigate('/admin-dashboard');
      } else {
        setOspatar({
          id: `osp_${user.id}`,
          nume: user.nume,
          pin: user.pin,
          rol: 'OSPATAR'
        });
        try {
          const response = await axios.get('/api/mese');
          setMese(response.data || []);
        } catch (err) {
          setMese([]);
        }
        navigate('/plan-mese');
      }
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', { ospatar_pin: pin });
      setOspatar(response.data.ospatar);
      setMese(response.data.mese);
      navigate('/plan-mese');
    } catch (err) {
      setError('PIN incorect');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-login-container">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900 to-black opacity-30"></div>

      <div className="flex justify-center items-center min-h-screen p-4 gap-8">
        {/* Login Form */}
        <div className="pos-login-box">
          <h1 className="pos-header mb-2">COD OSPATAR :</h1>
          <p className="text-yellow-300 text-center mb-6 text-sm">Introdu PIN-ul (4 cifre)</p>

          <input
            type="password"
            value={'•'.repeat(pin.length)}
            readOnly
            className="w-full px-4 py-3 bg-white text-black text-center text-2xl rounded mb-2 font-bold"
          />
          {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

          <div className="grid grid-cols-3 gap-2 mb-6">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl"
              >
                {key}
              </button>
            ))}
            <button onClick={() => handleKeyPress('0')} className="col-span-2 bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl">0</button>
            <button onClick={() => handleKeyPress('C')} className="bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl">C</button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full pos-button-primary mb-6 text-xl"
          >
            {loading ? 'Se conectează...' : 'ENTER'}
          </button>

          <div className="text-yellow-600 text-xs text-center border-t border-gray-600 pt-2 mt-2">
            <p>Restaurant App Hybrid v1.0</p>
            <p>Powered by QrOms</p>
          </div>
        </div>

        {/* Tabel utilizatori – doar afișare (fără PIN, fără editare). Setați din Setări. */}
        <div className="bg-black bg-opacity-80 border border-red-600 rounded-lg p-6 max-w-xl">
          <h2 className="text-red-500 text-xl font-bold mb-2">👥 Utilizatori</h2>
          <p className="text-gray-400 text-sm mb-4">Utilizatorii sunt setați de administrator din <strong>Setări</strong> (după logare).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-600">
                  <th className="text-red-400 font-bold py-2 px-2 text-left w-12">Nr.crt.</th>
                  <th className="text-red-400 font-bold py-2 px-2 text-left">Rol</th>
                  <th className="text-red-400 font-bold py-2 px-2 text-left">Nume</th>
                  <th className="text-red-400 font-bold py-2 px-2 text-left">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map((user, index) => {
                  if (!user) return null;
                  const rol = user.rol ?? (user.tip === 'admin' ? 'admin' : 'ospatar');
                  const nume = user.nume ?? (user.prenume ? `${user.nume || ''} ${user.prenume}`.trim() : `Utilizator ${user.id}`);
                  return (
                    <tr key={user.id} className="border-b border-gray-600">
                      <td className="text-gray-300 py-2 px-2">{index + 1}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rol === 'admin' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {rol === 'admin' ? 'Admin' : 'Ospatar'}
                        </span>
                      </td>
                      <td className="text-white py-2 px-2 font-bold">{nume}</td>
                      <td className="text-gray-400 py-2 px-2 text-sm italic">{user.obs ?? '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!users || users.length === 0) && (
            <p className="text-gray-500 text-sm mt-4">Niciun utilizator configurat. Logați-vă ca administrator (PIN implicit 0000) și setați utilizatorii din <strong>Utilitare → Setări</strong>.</p>
          )}
        </div>
      </div>
    </div>
  );
}
