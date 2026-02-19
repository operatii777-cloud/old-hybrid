import * as XLSX from 'xlsx';

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename = 'export.csv', headers = null) {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }
  
  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = csvHeaders.join(',') + '\n';
  
  data.forEach(row => {
    const values = csvHeaders.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Export data to Excel
 */
export function exportToExcel(data, filename = 'export.xlsx', sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }
  
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and download
  XLSX.writeFile(workbook, filename);
}

/**
 * Export multiple sheets to Excel
 */
export function exportToExcelMultiSheet(sheets, filename = 'export.xlsx') {
  if (!sheets || sheets.length === 0) {
    console.error('No sheets to export');
    return;
  }
  
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(({ data, name }) => {
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }
  });
  
  XLSX.writeFile(workbook, filename);
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders, filename = 'comenzi.csv') {
  const data = orders.map(order => ({
    'ID Comandă': order.id,
    'Masă': order.masa_id,
    'Ospătar': order.ospatar_id,
    'Data': new Date(order.data).toLocaleString('ro-RO'),
    'Status': order.status,
    'Total': order.total?.toFixed(2) || '0.00',
    'Discount': order.discount?.toFixed(2) || '0.00',
    'Tip Plată': order.tip_plata
  }));
  
  exportToCSV(data, filename);
}

/**
 * Export orders to Excel
 */
export function exportOrdersToExcel(orders, filename = 'comenzi.xlsx') {
  const data = orders.map(order => ({
    'ID Comandă': order.id,
    'Masă': order.masa_id,
    'Ospătar': order.ospatar_id,
    'Data': new Date(order.data).toLocaleString('ro-RO'),
    'Status': order.status,
    'Total': order.total?.toFixed(2) || '0.00',
    'Discount': order.discount?.toFixed(2) || '0.00',
    'Tip Plată': order.tip_plata
  }));
  
  exportToExcel(data, filename, 'Comenzi');
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(products, filename = 'produse.csv') {
  const data = products.map(product => ({
    'Cod': product.cod_prod,
    'Denumire': product.den_prod,
    'Departament': product.dept,
    'Grupă': product.grupa,
    'Preț Vânzare': product.pret_vanzare?.toFixed(2) || '0.00',
    'TVA': product.tva,
    'Categorie': product.categorie
  }));
  
  exportToCSV(data, filename);
}

/**
 * Export products to Excel
 */
export function exportProductsToExcel(products, filename = 'produse.xlsx') {
  const data = products.map(product => ({
    'Cod': product.cod_prod,
    'Denumire': product.den_prod,
    'Departament': product.dept,
    'Grupă': product.grupa,
    'Preț Vânzare': product.pret_vanzare?.toFixed(2) || '0.00',
    'TVA': product.tva,
    'Categorie': product.categorie
  }));
  
  exportToExcel(data, filename, 'Produse');
}

/**
 * Export inventory to Excel with multiple sheets
 */
export function exportInventoryToExcel(inventory, filename = 'inventar.xlsx') {
  const sheets = [
    {
      name: 'Materii Prime',
      data: inventory.materials?.map(m => ({
        'Cod': m.cod,
        'Denumire': m.denumire,
        'Grupă': m.grupa,
        'Preț': m.pret?.toFixed(2) || '0.00',
        'UM': m.um,
        'Stoc Minim': m.st_min,
        'TVA': m.tva
      })) || []
    },
    {
      name: 'Stocuri',
      data: inventory.stocks?.map(s => ({
        'Gestiune': s.gestiune_nume,
        'Material': s.material_denumire,
        'Cantitate': s.cant_stoc?.toFixed(2) || '0.00',
        'Minim': s.cant_minim?.toFixed(2) || '0.00',
        'Maxim': s.cant_maxim?.toFixed(2) || '0.00',
        'Preț Unitar': s.pret_unitar?.toFixed(2) || '0.00',
        'Valoare': (s.cant_stoc * s.pret_unitar)?.toFixed(2) || '0.00'
      })) || []
    }
  ];
  
  exportToExcelMultiSheet(sheets, filename);
}

/**
 * Helper function to download blob
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export AG Grid data to CSV
 */
export function exportAgGridToCSV(gridApi, filename = 'export.csv') {
  if (!gridApi) {
    console.error('Grid API not available');
    return;
  }
  
  gridApi.exportDataAsCsv({
    fileName: filename,
    processCellCallback: (params) => {
      // Custom cell processing if needed
      return params.value;
    }
  });
}

/**
 * Export AG Grid data to Excel
 */
export function exportAgGridToExcel(gridApi, filename = 'export.xlsx') {
  if (!gridApi) {
    console.error('Grid API not available');
    return;
  }
  
  // Get all data from grid
  const data = [];
  gridApi.forEachNode(node => {
    if (node.data) {
      data.push(node.data);
    }
  });
  
  exportToExcel(data, filename);
}
