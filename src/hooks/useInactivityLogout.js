import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantStore } from '../stores/restaurantStore';
import { getInactivityTimeoutSec, INACTIVITY_TIMEOUT_KEY } from '../utils/inactivityTimeout';

/**
 * Hook pentru logout automat la inactivitate pe interfața de vânzări (Plan mese, Comandă).
 * Resetează timerul la orice mișcare mouse, click, tastă, touch.
 * La schimbarea valorii din Setări (același tab sau alt tab), timerul se actualizează automat.
 */
export function useInactivityLogout() {
  const navigate = useNavigate();
  const { setOspatar } = useRestaurantStore();
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    setOspatar(null);
    navigate('/', { replace: true });
  }, [setOspatar, navigate]);

  const resetTimer = useCallback(() => {
    const sec = getInactivityTimeoutSec();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, sec * 1000);
  }, [logout]);

  useEffect(() => {
    const sec = getInactivityTimeoutSec();
    timerRef.current = setTimeout(logout, sec * 1000);

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    // Când admin salvează noul timeout în Setări (același tab sau alt tab), aplică-l imediat
    const onStorage = (e) => {
      if (e.key === INACTIVITY_TIMEOUT_KEY) resetTimer();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener('storage', onStorage);
    };
  }, [logout, resetTimer]);
}
