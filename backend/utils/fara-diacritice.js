/**
 * Înlocuiește diacriticele românești cu litere fără diacritice.
 * Aplicația hybrid nu folosește diacritice pentru retete, ingrediente, stocuri.
 */
const MAP = {
  ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
  Ă: 'A', Â: 'A', Î: 'I', Ș: 'S', Ț: 'T'
};

export function faraDiacritice(str) {
  if (str == null || typeof str !== 'string') return str;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += MAP[str[i]] ?? str[i];
  }
  return out;
}
