import { jsPDF } from 'jspdf';
import type { Renter } from '../types/group';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function generateReceipt(renter: Renter, groupName: string, month: number, year: number) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  // Header
  doc.setFillColor(45, 106, 79);
  doc.rect(0, 0, pageWidth, 44, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RENT RECEIPT', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${periodLabel}`, pageWidth / 2, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${now}`, pageWidth / 2, 38, { align: 'center' });

  // Body
  doc.setTextColor(26, 25, 23);
  let y = 60;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details', 20, y);
  y += 3;
  doc.setDrawColor(45, 106, 79);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 85, y);
    y += 11;
  };

  addRow('Block:', groupName);
  addRow('Renter:', renter.name);
  addRow('Phone:', renter.phoneNumber || 'N/A');
  addRow('Rent Period:', periodLabel);
  addRow('Rent Amount:', `$${Number(renter.rentPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  addRow('Payment Status:', 'PAID');

  if (renter.payment?.paidDate) {
    const paidDate = new Date(renter.payment.paidDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    addRow('Date Paid:', paidDate);
  }

  // Divider
  y += 5;
  doc.setDrawColor(232, 228, 223);
  doc.line(20, y, pageWidth - 20, y);
  y += 15;

  // Confirmation box
  doc.setFillColor(216, 243, 220);
  doc.roundedRect(20, y - 5, pageWidth - 40, 28, 3, 3, 'F');
  doc.setTextColor(45, 106, 79);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Confirmed', pageWidth / 2, y + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your payment.', pageWidth / 2, y + 18, { align: 'center' });

  // Footer
  doc.setTextColor(92, 88, 84);
  doc.setFontSize(9);
  doc.text(`Receipt ID: ${renter.id.substring(0, 8).toUpperCase()}-${year}${String(month).padStart(2, '0')}`, pageWidth / 2, 270, { align: 'center' });
  doc.text('House Rental Manager', pageWidth / 2, 278, { align: 'center' });

  const fileName = `receipt-${renter.name.replace(/\s+/g, '-').toLowerCase()}-${MONTH_NAMES[month - 1].toLowerCase()}-${year}.pdf`;
  doc.save(fileName);
}
