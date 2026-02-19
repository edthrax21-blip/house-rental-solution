import { jsPDF } from 'jspdf';
import { translations, type Lang } from '../i18n/translations';

const TYPE_KEYS: Record<string, 'typeRent' | 'typeElectricity' | 'typeWater'> = {
  rent: 'typeRent',
  electricity: 'typeElectricity',
  water: 'typeWater',
};

function getLang(): Lang {
  try {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'ms') return saved;
  } catch { /* */ }
  return 'en';
}

interface RenterInfo {
  id: string;
  name: string;
  phoneNumber: string;
  rentPrice: number;
}

export function generateReceipt(renter: RenterInfo, groupName: string, month: number, year: number, type: string, amount: number) {
  const t = translations[getLang()];
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const period = `${t.months[month - 1]} ${year}`;
  const typeLabel = t[TYPE_KEYS[type] || 'typeRent'];

  doc.setFillColor(45, 106, 79);
  doc.rect(0, 0, pw, 44, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`${typeLabel.toUpperCase()} ${t.receiptTitle}`, pw / 2, 16, { align: 'center' });
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
  addRow(t.receiptPaymentType, typeLabel);
  addRow(t.receiptPeriod, period);
  addRow(t.receiptAmount, `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
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
  doc.text(`${t.receiptId} ${renter.id.substring(0, 8).toUpperCase()}-${type.toUpperCase()}-${year}${String(month).padStart(2, '0')}`, pw / 2, 270, { align: 'center' });
  doc.text(t.appName, pw / 2, 278, { align: 'center' });

  doc.save(`receipt-${renter.name.replace(/\s+/g, '-').toLowerCase()}-${type}-${t.months[month - 1].toLowerCase()}-${year}.pdf`);
}
