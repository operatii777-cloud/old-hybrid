import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRestaurantStore } from '../stores/restaurantStore';

export default function PlanMesePageOld() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setOspatar, setMese } = useRestaurantStore();
  const navigate = useNavigate();

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

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/login', {
        ospatar_pin: pin
      });

      console.log('Login response:', response.data);

      setOspatar(response.data.ospatar);
      setMese(response.data.mese);
      
      // Navigate to plan mese
      setTimeout(() => {
        navigate('/plan-mese');
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError('PIN incorect');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-login-container">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900 to-black opacity-30"></div>

      {/* Login Form */}
      <div className="pos-login-box">
        <h1 className="pos-header mb-2">COD OSPATAR :</h1>
        <p className="text-yellow-300 text-center mb-8 text-sm">(codul "1" pt. ospatar 1)</p>

        {/* Input */}
        <input
          type="password"
          value={'•'.repeat(pin.length)}
          readOnly
          className="w-full px-4 py-3 bg-white text-black text-center text-2xl rounded mb-2 font-bold"
        />
        
        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {['7', '8', '9'].map(key => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl"
            >
              {key}
            </button>
          ))}
          {['4', '5', '6'].map(key => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl"
            >
              {key}
            </button>
          ))}
          {['1', '2', '3'].map(key => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl"
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => handleKeyPress('0')}
            className="col-span-2 bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('C')}
            className="bg-white hover:bg-gray-200 text-red-600 font-bold py-4 rounded text-xl"
          >
            C
          </button>
        </div>

        {/* ENTER button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full pos-button-primary mb-6 text-xl"
        >
          {loading ? 'Se conectează...' : 'ENTER'}
        </button>

        {/* Footer */}
        <div className="text-yellow-600 text-xs text-center border-t border-gray-600 pt-2 mt-2">
          <p>Restaurant App Hybrid v1.0</p>
        </div>
      </div>
    </div>
  );
}
