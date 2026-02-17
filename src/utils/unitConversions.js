// Tabela de conversie pentru unități de măsură
// Structura: Cheie (Unitate Intrare) -> { type: 'tip', base: 'Unitate Baza', factor: Coeficient }

export const UNIT_CONVERSIONS = {
    // --- GREUTATE (Baza: grame) ---
    'grame': { type: 'weight', base: 'grame', factor: 1 },
    'g': { type: 'weight', base: 'grame', factor: 1 },
    'kg': { type: 'weight', base: 'grame', factor: 1000 },
    'kilogram': { type: 'weight', base: 'grame', factor: 1000 },
    'mg': { type: 'weight', base: 'grame', factor: 0.001 },

    // --- VOLUM (Baza: ml) ---
    'ml': { type: 'volume', base: 'ml', factor: 1 },
    'l': { type: 'volume', base: 'ml', factor: 1000 },
    'litru': { type: 'volume', base: 'ml', factor: 1000 },
    'cl': { type: 'volume', base: 'ml', factor: 10 },

    // Sticle / Recipiente specifice (convertite la ml)
    'st. 0,25': { type: 'volume', base: 'ml', factor: 250 },
    'st. 0.25': { type: 'volume', base: 'ml', factor: 250 },
    'st. 0,33': { type: 'volume', base: 'ml', factor: 330 },
    'st. 0.33': { type: 'volume', base: 'ml', factor: 330 },
    'st. 0,5': { type: 'volume', base: 'ml', factor: 500 },
    'st. 0.5': { type: 'volume', base: 'ml', factor: 500 },
    'st. 0,7': { type: 'volume', base: 'ml', factor: 700 },
    'st. 0.7': { type: 'volume', base: 'ml', factor: 700 },
    'st. 0,75': { type: 'volume', base: 'ml', factor: 750 },
    'st. 0.75': { type: 'volume', base: 'ml', factor: 750 },
    'st. 1l': { type: 'volume', base: 'ml', factor: 1000 },
    'st. 1L': { type: 'volume', base: 'ml', factor: 1000 },
    'st. 2l': { type: 'volume', base: 'ml', factor: 2000 },
    'st. 2L': { type: 'volume', base: 'ml', factor: 2000 },
    'doza 0.33': { type: 'volume', base: 'ml', factor: 330 },
    'doza 0.5': { type: 'volume', base: 'ml', factor: 500 },

    // --- LUNGIME (Baza: m - rar folosit in Horeca dar exista in exemplu) ---
    'm': { type: 'length', base: 'm', factor: 1 },
    'cm': { type: 'length', base: 'm', factor: 0.01 },
    'mm': { type: 'length', base: 'm', factor: 0.001 },

    // --- STANDARD ---
    'buc': { type: 'qty', base: 'buc', factor: 1 },
    'portie': { type: 'qty', base: 'buc', factor: 1 },
    'bax 6': { type: 'qty', base: 'buc', factor: 6 },
    'bax 12': { type: 'qty', base: 'buc', factor: 12 },
    'bax 24': { type: 'qty', base: 'buc', factor: 24 }
};

/**
 * Găsește toate unitățile compatibile pentru o unitate de bază dată.
 * Ex: Dacă baza e 'ml', returnează ['ml', 'l', 'st. 0,5', etc.]
 */
export const getCompatibleUnits = (baseUnit) => {
    const normalize = (u) => u?.toLowerCase().trim();
    const base = normalize(baseUnit);

    // Căutăm tipul unității de bază
    const baseDef = UNIT_CONVERSIONS[base];
    if (!baseDef) return [baseUnit]; // Dacă nu știm unitatea, returnăm doar pe ea însăși

    const compatible = Object.entries(UNIT_CONVERSIONS)
        .filter(([_, def]) => def.type === baseDef.type)
        .map(([key, _]) => key);

    return compatible.sort(); // Sortare alfabetică
};

/**
 * Calculează factorul de conversie.
 * Ex: convert('kg', 'grame') -> 1000
 */
export const getConversionFactor = (fromUnit, toUnit) => {
    const from = UNIT_CONVERSIONS[fromUnit?.toLowerCase()];
    const to = UNIT_CONVERSIONS[toUnit?.toLowerCase()];

    if (!from || !to) return 1;
    if (from.type !== to.type) return 1; // Nu poți converti kg în litri direct fără densitate

    // Factor de la 'from' la baza comună, apoi de la baza comună la 'to'
    // Ex: kg -> grame: (factor kg 1000) / (factor g 1) = 1000
    return from.factor / to.factor;
};
