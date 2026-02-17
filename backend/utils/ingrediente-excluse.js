/**
 * Ingrediente care NU trebuie inserate in stocuri sau retete (derivate/preparate din altele, fara stoc propriu).
 * Ex: apa fierbinte, spuma de lapte, frisca – se folosesc Apa/Lapte, nu articole separate.
 */
import { faraDiacritice } from './fara-diacritice.js';

const PATTERN_EXCLUSE = [
  /\bapa\s+fierbinte\b/i,
  /\bapa\s+calda\b/i,
  /\bapa\s+caldă\b/i,
  /\bspuma\s+(de\s+)?lapte\b/i,
  /\blapte\s+spumat\b/i,
  /\bfrisca\b/i,
  /\bspuma\s+de\s+lapte\b/i,
  /\bwhipped\s+cream\b/i,
  /\bzahar\s+topit\b/i,
  /\bapa\s+fiarta\b/i,
  /\bapa\s+fiartă\b/i,
  /\bgheata\b/i,
  /\bgheață\b/i,
  /\bice\b/i,
  /\babur\s+de\s+apa\b/i,
  /\babur\s+de\s+apă\b/i,
  /\bspuma\s+de\s+apa\b/i,
  /\bspuma\s+de\s+apă\b/i,
].map(p => {
  const raw = p.source.replace(/\\b/g, '').replace(/\s+/g, ' ');
  return new RegExp(raw.replace(/[a-zăâîșț]/gi, '[a-zA-Zăâîșț]'), 'i');
});

/** Verifica daca denumirea (ingredient/material) este in lista de exclus – nu se insereaza in stocuri/retete. */
export function isIngredientExclus(denumire) {
  if (denumire == null || typeof denumire !== 'string') return false;
  const n = faraDiacritice(denumire.trim());
  if (!n) return false;
  const lower = n.toLowerCase();
  if (/^apa\s+fierbinte$/i.test(n) || /^apa\s+calda$/i.test(n)) return true;
  if (/^spuma\s+(de\s+)?lapte$/i.test(n) || /^lapte\s+spumat$/i.test(n)) return true;
  if (/^frisca$/i.test(n) || /^whipped\s+cream$/i.test(n)) return true;
  if (/^zahar\s+topit$/i.test(n) || /^apa\s+fiarta$/i.test(n)) return true;
  if (/^gheata$/i.test(n) || /^ice$/i.test(n)) return true;
  if (/^abur\s+de\s+apa$/i.test(n) || /^spuma\s+de\s+apa$/i.test(n)) return true;
  return false;
}
