/**
 * Deschide fereastră nouă cu bon/chitanță și declanșează print
 */
export function printBon({ linii = [], total = 0, tipPlata = 1, masaId = '', ospatar = {} }) {
  const tipLabels = { 1: 'CASH', 2: 'CARD', 3: 'VIRAMENT', 4: 'PROF', 5: 'PROTOCOL' };
  const label = tipLabels[tipPlata] || 'CASH';
  const dataOra = new Date().toLocaleString('ro-RO');
  const linesHtml = (linii || [])
    .map(l => `<tr><td>${l.den_prod || l.cod_prod} x${Number(l.cant) || 0}</td><td style="text-align:right">${((Number(l.cant) || 0) * (Number(l.pret_unitar) || 0)).toFixed(2)} RON</td></tr>`)
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bon</title>
<style>body{font-family:monospace;padding:20px;max-width:300px;margin:0 auto} table{width:100%} th,td{padding:4px} .total{font-weight:bold;border-top:2px solid #000;padding-top:8px}</style></head>
<body>
<div style="text-align:center;font-weight:bold;font-size:18px;margin-bottom:16px">RESTAURANT APP HYBRID</div>
<div style="text-align:center;font-size:12px;margin-bottom:12px">Bon / Chitanță</div>
<div style="border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:8px;font-size:12px">
  Data: ${dataOra}<br>Masa: ${masaId} | Ospătar: ${ospatar.nume || '-'}<br>Plată: ${label}
</div>
<table>${linesHtml}</table>
<div class="total" style="display:flex;justify-content:space-between;margin-top:12px">
  <span>TOTAL:</span><span>${Number(total).toFixed(2)} RON</span>
</div>
<div style="text-align:center;margin-top:24px;font-size:12px">Mulțumim!</div>
</body></html>`;
  try {
    const w = window.open('', '_blank');
    if (!w) return; // popup blocat
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.print();
      w.close();
    };
  } catch (e) {
    console.warn('Print bon:', e);
  }
}
