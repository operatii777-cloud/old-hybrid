import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate PDF invoice for an order
 */
export async function generateInvoicePDF(invoiceData) {
  const { invoice, restaurant, order, items, totals } = invoiceData;
  
  // Create PDF document
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header - Restaurant Info
  doc.setFontSize(20);
  doc.setTextColor(220, 38, 38); // Red color
  doc.text(restaurant.name, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(restaurant.address, 105, 28, { align: 'center' });
  doc.text(restaurant.city, 105, 33, { align: 'center' });
  doc.text(`Tel: ${restaurant.phone}`, 105, 38, { align: 'center' });
  doc.text(`CUI: ${restaurant.cui}`, 105, 43, { align: 'center' });
  
  // Invoice Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BON FISCAL', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Număr: ${invoice.number}`, 15, 62);
  doc.text(`Data: ${invoice.date}`, 15, 67);
  doc.text(`Ora: ${invoice.time}`, 15, 72);
  
  doc.text(`Masă: ${order.table}`, 120, 62);
  doc.text(`Ospătar: ${order.waiter}`, 120, 67);
  doc.text(`Status: ${order.status}`, 120, 72);
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 78, 195, 78);
  
  // Items table
  const tableData = items.map(item => [
    item.name,
    item.quantity.toFixed(2),
    `${item.unitPrice.toFixed(2)} RON`,
    `${item.tva.toFixed(0)}%`,
    `${item.total.toFixed(2)} RON`
  ]);
  
  doc.autoTable({
    startY: 83,
    head: [['Produs', 'Cantitate', 'Preț Unitar', 'TVA', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text('Subtotal:', 130, finalY);
  doc.text(`${totals.subtotal} RON`, 195, finalY, { align: 'right' });
  
  doc.text('TVA:', 130, finalY + 6);
  doc.text(`${totals.tva} RON`, 195, finalY + 6, { align: 'right' });
  
  if (parseFloat(totals.discount) > 0) {
    doc.text('Discount:', 130, finalY + 12);
    doc.text(`-${totals.discount} RON`, 195, finalY + 12, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL DE PLATĂ:', 130, finalY + 20);
    doc.text(`${totals.total} RON`, 195, finalY + 20, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL DE PLATĂ:', 130, finalY + 14);
    doc.text(`${totals.total} RON`, 195, finalY + 14, { align: 'right' });
  }
  
  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const footerY = doc.internal.pageSize.height - 20;
  doc.text('Mulțumim pentru comandă!', 105, footerY, { align: 'center' });
  doc.text('Vă așteptăm din nou!', 105, footerY + 5, { align: 'center' });
  
  return doc;
}

/**
 * Download PDF invoice
 */
export async function downloadInvoicePDF(invoiceData, filename) {
  const doc = await generateInvoicePDF(invoiceData);
  doc.save(filename || `factura-${invoiceData.invoice.number}.pdf`);
}

/**
 * Open PDF invoice in new tab
 */
export async function viewInvoicePDF(invoiceData) {
  const doc = await generateInvoicePDF(invoiceData);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

/**
 * Print PDF invoice
 */
export async function printInvoicePDF(invoiceData) {
  const doc = await generateInvoicePDF(invoiceData);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Create iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  };
}
