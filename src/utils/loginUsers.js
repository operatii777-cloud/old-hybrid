/** Utilizatori pentru logare (6: 1 admin + 5 ospătari). Folosit pe Login (citire) și Setări (editare). */

export const USERS_STORAGE_KEY = 'restaurant-users';
export const USERS_DATA_VERSION = 4;

export const defaultLoginUsers = [
  { id: 1, rol: 'admin', nume: 'Admin', pin: '0000', obs: '(admin only)' },
  { id: 2, rol: 'ospatar', nume: 'Raluca', pin: '1111', obs: 'tura dimineata' },
  { id: 3, rol: 'ospatar', nume: 'Ospatar 2', pin: '2222', obs: '' },
  { id: 4, rol: 'ospatar', nume: 'Ospatar 3', pin: '3333', obs: '' },
  { id: 5, rol: 'ospatar', nume: 'Ospatar 4', pin: '4444', obs: '' },
  { id: 6, rol: 'ospatar', nume: 'Ospatar 5', pin: '5555', obs: '' }
];

/** Încarcă lista de utilizatori din localStorage (cu migrare la format nou). */
export function loadLoginUsers() {
  if (typeof window === 'undefined') return defaultLoginUsers;
  const version = parseInt(localStorage.getItem('restaurant-users-version') || '0', 10);
  if (version < USERS_DATA_VERSION) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultLoginUsers));
    localStorage.setItem('restaurant-users-version', String(USERS_DATA_VERSION));
    return defaultLoginUsers;
  }
  const saved = localStorage.getItem(USERS_STORAGE_KEY);
  if (!saved) return defaultLoginUsers;
  try {
    const parsed = JSON.parse(saved);
    const hasOldFormat = parsed.some((u) => u.tip != null || u.prenume != null);
    if (hasOldFormat) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultLoginUsers));
      return defaultLoginUsers;
    }
    return parsed.map((u, i) => ({
      id: u.id ?? i + 1,
      rol: u.rol ?? 'ospatar',
      nume: u.nume || `Utilizator ${u.id}`,
      pin: u.pin || '0000',
      obs: u.obs ?? ''
    }));
  } catch {
    return defaultLoginUsers;
  }
}

export function saveLoginUsers(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem('restaurant-users-version', String(USERS_DATA_VERSION));
}
