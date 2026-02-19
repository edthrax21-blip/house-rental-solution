import { jsPDF } from 'jspdf';
import { translations, type Lang, type Translations } from '../i18n/translations';

function getLang(): Lang {
  try {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'ms') return saved;
  } catch { /* */ }
  return 'en';
}

function getT(): Translations {
  return translations[getLang()];
}

export interface RenterInfo {
  id: string;
  name: string;
  phoneNumber: string;
  rentPrice: number;
}

export interface PaymentBreakdown {
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  totalAmount: number;
}

function fmtCurrency(n: number): string {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function buildReceiptDoc(renter: RenterInfo, groupName: string, month: number, year: number, breakdown: PaymentBreakdown): jsPDF {
  const t = getT();
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const period = `${t.months[month - 1]} ${year}`;

  doc.setFillColor(45, 106, 79);
  doc.rect(0, 0, pw, 44, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(t.receiptTitle, pw / 2, 16, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.receiptPeriod} ${period}`, pw / 2, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`${t.receiptGenerated} ${today}`, pw / 2, 38, { align: 'center' });

  doc.setTextColor(26, 25, 23);
  let y = 60;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(t.receiptDetails, 20, y);
  y += 3;
  doc.setDrawColor(45, 106, 79);
  doc.setLineWidth(0.5);
  doc.line(20, y, pw - 20, y);
  y += 14;

  doc.setFontSize(11);
  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 90, y);
    y += 11;
  };

  addRow(t.receiptBlock, groupName);
  addRow(t.receiptRenter, renter.name);
  addRow(t.receiptPhone, renter.phoneNumber || t.na);
  addRow(t.receiptPeriod, period);

  y += 4;
  doc.setDrawColor(232, 228, 223);
  doc.line(20, y, pw - 20, y);
  y += 12;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.receiptDetails, 25, y);
  y += 12;

  doc.setFontSize(11);
  addRow(t.receiptRentAmount, fmtCurrency(breakdown.rentAmount));
  addRow(t.receiptElecAmount, fmtCurrency(breakdown.electricityAmount));
  addRow(t.receiptWaterAmount, fmtCurrency(breakdown.waterAmount));

  y += 2;
  doc.setDrawColor(45, 106, 79);
  doc.setLineWidth(0.8);
  doc.line(25, y, pw - 25, y);
  y += 10;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(t.receiptTotalAmount, 25, y);
  doc.setTextColor(45, 106, 79);
  doc.text(fmtCurrency(breakdown.totalAmount), 110, y);
  doc.setTextColor(26, 25, 23);
  y += 6;

  addRow(t.receiptStatus, t.receiptPaidStatus);

  y += 5;
  doc.setDrawColor(232, 228, 223);
  doc.line(20, y, pw - 20, y);
  y += 15;

  doc.setFillColor(216, 243, 220);
  doc.roundedRect(20, y - 5, pw - 40, 28, 3, 3, 'F');
  doc.setTextColor(45, 106, 79);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.receiptConfirmed, pw / 2, y + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(t.receiptThankYou, pw / 2, y + 18, { align: 'center' });

  doc.setTextColor(92, 88, 84);
  doc.setFontSize(9);
  doc.text(`${t.receiptId} ${renter.id.substring(0, 8).toUpperCase()}-${year}${String(month).padStart(2, '0')}`, pw / 2, 270, { align: 'center' });
  doc.text(t.appName, pw / 2, 278, { align: 'center' });

  return doc;
}

function getFileName(renter: RenterInfo, month: number, year: number): string {
  const t = getT();
  return `receipt-${renter.name.replace(/\s+/g, '-').toLowerCase()}-${t.months[month - 1].toLowerCase()}-${year}.pdf`;
}

export function generateReceipt(renter: RenterInfo, groupName: string, month: number, year: number, breakdown: PaymentBreakdown) {
  const doc = buildReceiptDoc(renter, groupName, month, year, breakdown);
  doc.save(getFileName(renter, month, year));
}

export function buildReceiptBlob(renter: RenterInfo, groupName: string, month: number, year: number, breakdown: PaymentBreakdown): { blob: Blob; fileName: string } {
  const doc = buildReceiptDoc(renter, groupName, month, year, breakdown);
  return { blob: doc.output('blob'), fileName: getFileName(renter, month, year) };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
}

export function buildWhatsAppMsg(renter: RenterInfo, groupName: string, month: number, year: number, breakdown: PaymentBreakdown, downloadUrl?: string): string {
  const t = getT();
  const period = `${t.months[month - 1]} ${year}`;
  let msg = t.waReceiptMsg
    .replace('{name}', renter.name)
    .replace('{period}', period)
    .replace('{block}', groupName)
    .replace('{rent}', Number(breakdown.rentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }))
    .replace('{electricity}', Number(breakdown.electricityAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }))
    .replace('{water}', Number(breakdown.waterAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }))
    .replace('{total}', Number(breakdown.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }));

  if (downloadUrl) {
    const t2 = getT();
    msg += `\n\n${t2.waDownloadReceipt}\n${downloadUrl}`;
  }
  return msg;
}

export async function sendWhatsAppReceipt(renter: RenterInfo, groupName: string, month: number, year: number, breakdown: PaymentBreakdown, downloadUrl?: string) {
  const doc = buildReceiptDoc(renter, groupName, month, year, breakdown);
  const fileName = getFileName(renter, month, year);
  const message = buildWhatsAppMsg(renter, groupName, month, year, breakdown, downloadUrl);
  const phone = normalizePhone(renter.phoneNumber);

  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
  if (canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({ text: message, files: [pdfFile] });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
    }
  }

  doc.save(fileName);

  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}
