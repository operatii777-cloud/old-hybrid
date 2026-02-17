/**
 * Clasificare HORECA: ingrediente → gestiune Bar (3), Bucătărie (2) sau comune (ambele).
 * Conform standardelor HORECA: bar storage pentru băuturi/alcool, kitchen pentru alimente,
 * ingrediente comune (zahăr, lapte, fructe garnish) în ambele.
 * Model: data/model-ingrediente-gestiuni.json
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { faraDiacritice } from './fara-diacritice.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, '../../data/model-ingrediente-gestiuni.json');

let modelCache = null;

function getModel() {
  if (modelCache) return modelCache;
  try {
    modelCache = JSON.parse(readFileSync(MODEL_PATH, 'utf8'));
  } catch (e) {
    modelCache = { bucatarie: {}, bar: {}, comune: {} };
  }
  return modelCache;
}

function normal(s) {
  if (!s || typeof s !== 'string') return '';
  return faraDiacritice(s).toLowerCase().trim();
}

function matchTerm(denumireNorm, termNorm) {
  if (!termNorm) return false;
  if (denumireNorm === termNorm) return true;
  if (denumireNorm.startsWith(termNorm + ' ') || denumireNorm.endsWith(' ' + termNorm)) return true;
  if (termNorm.length <= 3) return false;
  if (denumireNorm.includes(termNorm)) return true;
  if (denumireNorm.length <= 3) return false;
  return termNorm.includes(denumireNorm);
}

function matchCategorie(denumireNorm, listOfTerms) {
  for (const term of listOfTerms) {
    const t = normal(term);
    if (!t) continue;
    if (matchTerm(denumireNorm, t)) return true;
  }
  return false;
}

function gasesteCategorie(denumireNorm, sectiune) {
  if (!sectiune || typeof sectiune !== 'object') return null;
  for (const list of Object.values(sectiune)) {
    if (Array.isArray(list) && matchCategorie(denumireNorm, list)) return true;
  }
  return false;
}

/**
 * Clasifică un ingredient după denumire.
 * @param {string} denumire - Denumirea materiilor prime
 * @returns {'bar'|'bucatarie'|'comune'} - bar = doar Bar, bucatarie = doar Bucătărie, comune = ambele
 */
export function clasificaIngredient(denumire) {
  const denNorm = normal(denumire);
  const m = getModel();
  if (gasesteCategorie(denNorm, m.comune)) return 'comune';
  if (gasesteCategorie(denNorm, m.bar)) return 'bar';
  if (gasesteCategorie(denNorm, m.bucatarie)) return 'bucatarie';
  return 'comune'; // implicit: poate fi folosit în ambele
}

export const GESTIUNE_BUCATARIE = 2;
export const GESTIUNE_BAR = 3;
