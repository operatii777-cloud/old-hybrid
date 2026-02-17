/** Timeout inactivitate pentru interfața de vânzări (POS). După X secunde fără activitate, redirect la login. */

export const INACTIVITY_TIMEOUT_KEY = 'pos-inactivity-timeout-sec';
const DEFAULT_SEC = 60;
const MIN_SEC = 30;
const MAX_SEC = 600;

export function getInactivityTimeoutSec() {
  if (typeof window === 'undefined') return DEFAULT_SEC;
  const v = parseInt(localStorage.getItem(INACTIVITY_TIMEOUT_KEY), 10);
  if (Number.isNaN(v) || v < MIN_SEC || v > MAX_SEC) return DEFAULT_SEC;
  return v;
}

export function setInactivityTimeoutSec(sec) {
  if (typeof window === 'undefined') return;
  const val = Math.max(MIN_SEC, Math.min(MAX_SEC, parseInt(sec, 10) || DEFAULT_SEC));
  localStorage.setItem(INACTIVITY_TIMEOUT_KEY, String(val));
  return val;
}

export { DEFAULT_SEC, MIN_SEC, MAX_SEC };
