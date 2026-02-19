export type Lang = 'en' | 'ms';

export interface Translations {
  appName: string; navHouseBlock: string; navPayments: string; navReports: string; logOut: string;
  signInSubtitle: string; username: string; password: string; enterUsername: string; enterPassword: string;
  signingIn: string; signIn: string; loginDefault: string; dbConnection: string; checking: string;
  online: string; offline: string; rentalsTable: string; ok: string; missingRestartApi: string;
  dashboard: string; dashboardSubtitle: string; moduleBlocks: string; moduleBlocksDesc: string;
  modulePayments: string; modulePaymentsDesc: string; moduleReports: string; moduleReportsDesc: string;
  blockManagementTitle: string; blocks: string; addBlock: string; noBlocksYet: string;
  renter: string; renters: string; editBlock: string; addBlockModal: string; blockName: string;
  blockPlaceholder: string; rentersLabel: string; addRenter: string; loading: string;
  noRentersYet: string; selectBlockToManage: string; name: string; phone: string; rentPrice: string;
  actions: string; edit: string; delete: string; deleteRenterConfirm: string; nameRequired: string;
  editRenter: string; addRenterModal: string; phoneNumber: string; rentPriceDollar: string;
  cancel: string; save: string; saving: string; invalidRentPrice: string;
  paymentManagementTitle: string; blockLabel: string; selectBlock: string; monthLabel: string;
  yearLabel: string; selectBlockToManage2: string; noRentersInBlock: string;
  renterCol: string; rentCol: string; electricityCol: string; waterCol: string; totalRentAmountCol: string;
  statusCol: string; receiptCol: string; waStatusCol: string;
  paid: string; unpaid: string; perMonth: string;
  enterElecBillAmount: string; enterWaterBillAmount: string;
  amountDollar: string; updateBills: string; waSentAt: string; waNotSent: string;
  reportsTitle: string; blockOverview: string; noBlocksFound: string; totalRent: string;
  renterDetails: string; exportPdf: string; rentStatus: string; elecStatus: string; waterStatus: string;
  months: string[];
  receiptTitle: string; receiptPeriod: string; receiptGenerated: string; receiptDetails: string;
  receiptBlock: string; receiptRenter: string; receiptPhone: string;
  receiptRentAmount: string; receiptElecAmount: string; receiptWaterAmount: string; receiptTotalAmount: string;
  receiptStatus: string; receiptPaidStatus: string;
  receiptConfirmed: string; receiptThankYou: string; receiptId: string;
  typeRent: string; typeElectricity: string; typeWater: string;
  reportPaymentReport: string; reportSummary: string; reportTotalRenters: string;
  reportCollected: string; reportGeneratedOn: string; dismiss: string; na: string;
  sendWhatsApp: string; waSending: string; waSentSuccess: string; waReceiptMsg: string; waDownloadReceipt: string;
}

const en: Translations = {
  // App / Nav
  appName: 'House Rental Manager',
  navHouseBlock: 'House/Block',
  navPayments: 'Payments',
  navReports: 'Reports',
  logOut: 'Log out',

  // Login
  signInSubtitle: 'Sign in to continue',
  username: 'Username',
  password: 'Password',
  enterUsername: 'Enter username',
  enterPassword: 'Enter password',
  signingIn: 'Signing in…',
  signIn: 'Sign in',
  loginDefault: 'Default:',
  dbConnection: 'DB connection:',
  checking: '…',
  online: 'online',
  offline: 'offline',
  rentalsTable: 'Rentals table:',
  ok: 'ok',
  missingRestartApi: 'missing — restart the API',

  // Dashboard
  dashboard: 'Dashboard',
  dashboardSubtitle: 'Select a module to get started',
  moduleBlocks: 'House/Block Management',
  moduleBlocksDesc: 'Create and manage rental blocks. Add, edit, and remove renters within each block.',
  modulePayments: 'Payment Management',
  modulePaymentsDesc: 'Record monthly payments for Rent, Electricity, and Water bills. Generate PDF receipts.',
  moduleReports: 'Reports',
  moduleReportsDesc: 'View payment dashboards per block. Drill down to individual renter payment status.',

  // Block Management
  blockManagementTitle: 'House/Block Management',
  blocks: 'Blocks',
  addBlock: '+ Add Block',
  noBlocksYet: 'No blocks yet',
  renter: 'renter',
  renters: 'renters',
  editBlock: 'Edit Block',
  addBlockModal: 'Add Block',
  blockName: 'Block Name',
  blockPlaceholder: 'Block A',
  rentersLabel: 'Renters',
  addRenter: '+ Add Renter',
  loading: 'Loading...',
  noRentersYet: 'No renters yet. Click "+ Add Renter" to get started.',
  selectBlockToManage: 'Select a block to manage its renters.',
  name: 'Name',
  phone: 'Phone',
  rentPrice: 'Rent Price',
  actions: 'Actions',
  edit: 'Edit',
  delete: 'Delete',
  deleteRenterConfirm: 'Delete this renter?',
  nameRequired: 'Name is required.',

  // Renter Form
  editRenter: 'Edit Renter',
  addRenterModal: 'Add Renter',
  phoneNumber: 'Phone Number',
  rentPriceDollar: 'Rent Price ($)',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  invalidRentPrice: 'Please enter a valid rent price.',

  // Payment Management
  paymentManagementTitle: 'Payment Management',
  blockLabel: 'Block:',
  selectBlock: '-- Select Block --',
  monthLabel: 'Month:',
  yearLabel: 'Year:',
  selectBlockToManage2: 'Select a block to manage payments.',
  noRentersInBlock: 'No renters in this block. Add renters in Block Management first.',
  renterCol: 'Renter',
  rentCol: 'Rent',
  electricityCol: 'Electricity',
  waterCol: 'Water',
  totalRentAmountCol: 'Total Rent Amount',
  statusCol: 'Status',
  receiptCol: 'Receipt',
  waStatusCol: 'WhatsApp Status',
  paid: 'Paid',
  unpaid: 'Unpaid',
  perMonth: '/mo',
  enterElecBillAmount: 'Enter Electricity Bill Amount',
  enterWaterBillAmount: 'Enter Water Bill Amount',
  amountDollar: 'Amount ($)',
  updateBills: 'Update',
  waSentAt: 'Sent',
  waNotSent: 'Not sent',

  // Reports
  reportsTitle: 'Reports',
  blockOverview: 'Block Overview',
  noBlocksFound: 'No blocks found. Create blocks in Block Management.',
  totalRent: 'total rent',
  renterDetails: 'Renter Details',
  exportPdf: 'Export PDF',
  rentStatus: 'Rent Status',
  elecStatus: 'Elec Status',
  waterStatus: 'Water Status',

  // Months
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

  // Receipt PDF
  receiptTitle: 'PAYMENT RECEIPT',
  receiptPeriod: 'Period:',
  receiptGenerated: 'Generated:',
  receiptDetails: 'Payment Breakdown',
  receiptBlock: 'Block:',
  receiptRenter: 'Renter:',
  receiptPhone: 'Phone:',
  receiptRentAmount: 'Rent:',
  receiptElecAmount: 'Electricity:',
  receiptWaterAmount: 'Water:',
  receiptTotalAmount: 'Total Amount:',
  receiptStatus: 'Status:',
  receiptPaidStatus: 'PAID',
  receiptConfirmed: 'Payment Confirmed',
  receiptThankYou: 'Thank you for your payment.',
  receiptId: 'Receipt ID:',

  // Payment type labels
  typeRent: 'Rent',
  typeElectricity: 'Electricity',
  typeWater: 'Water',

  // Report PDF
  reportPaymentReport: 'Payment Report',
  reportSummary: 'Summary',
  reportTotalRenters: 'Total Renters:',
  reportCollected: 'Collected:',
  reportGeneratedOn: 'Generated:',
  dismiss: 'Dismiss',
  na: 'N/A',
  sendWhatsApp: 'Send WhatsApp',
  waSending: 'Sending...',
  waSentSuccess: 'WhatsApp message sent successfully!',
  waReceiptMsg: 'Hi {name}, here is your payment receipt for {period}.\n\nBlock: {block}\nRent: ${rent}\nElectricity: ${electricity}\nWater: ${water}\nTotal: ${total}\nStatus: Paid\n\nThank you!',
  waDownloadReceipt: 'Download your receipt here:',
};

const ms: Translations = {
  appName: 'Pengurus Sewa Rumah',
  navHouseBlock: 'Rumah/Blok',
  navPayments: 'Pembayaran',
  navReports: 'Laporan',
  logOut: 'Log keluar',

  signInSubtitle: 'Log masuk untuk meneruskan',
  username: 'Nama pengguna',
  password: 'Kata laluan',
  enterUsername: 'Masukkan nama pengguna',
  enterPassword: 'Masukkan kata laluan',
  signingIn: 'Sedang log masuk…',
  signIn: 'Log masuk',
  loginDefault: 'Lalai:',
  dbConnection: 'Sambungan DB:',
  checking: '…',
  online: 'dalam talian',
  offline: 'luar talian',
  rentalsTable: 'Jadual sewaan:',
  ok: 'ok',
  missingRestartApi: 'tiada — mulakan semula API',

  dashboard: 'Dashboard',
  dashboardSubtitle: 'Pilih modul untuk bermula',
  moduleBlocks: 'Pengurusan Rumah/Blok',
  moduleBlocksDesc: 'Cipta dan urus blok sewaan. Tambah, edit, dan padam penyewa dalam setiap blok.',
  modulePayments: 'Pengurusan Pembayaran',
  modulePaymentsDesc: 'Rekod pembayaran bulanan untuk Sewa, Bil Elektrik, dan Bil Air. Jana resit PDF.',
  moduleReports: 'Laporan',
  moduleReportsDesc: 'Lihat papan pemuka pembayaran mengikut blok. Perincian status pembayaran setiap penyewa.',

  blockManagementTitle: 'Pengurusan Rumah/Blok',
  blocks: 'Blok',
  addBlock: '+ Tambah Blok',
  noBlocksYet: 'Tiada blok lagi',
  renter: 'penyewa',
  renters: 'penyewa',
  editBlock: 'Edit Blok',
  addBlockModal: 'Tambah Blok',
  blockName: 'Nama Blok',
  blockPlaceholder: 'Blok A',
  rentersLabel: 'Penyewa',
  addRenter: '+ Tambah Penyewa',
  loading: 'Memuatkan...',
  noRentersYet: 'Tiada penyewa lagi. Klik "+ Tambah Penyewa" untuk bermula.',
  selectBlockToManage: 'Pilih blok untuk mengurus penyewa.',
  name: 'Nama',
  phone: 'Telefon',
  rentPrice: 'Harga Sewa',
  actions: 'Tindakan',
  edit: 'Edit',
  delete: 'Padam',
  deleteRenterConfirm: 'Padam penyewa ini?',
  nameRequired: 'Nama diperlukan.',

  editRenter: 'Edit Penyewa',
  addRenterModal: 'Tambah Penyewa',
  phoneNumber: 'Nombor Telefon',
  rentPriceDollar: 'Harga Sewa ($)',
  cancel: 'Batal',
  save: 'Simpan',
  saving: 'Menyimpan...',
  invalidRentPrice: 'Sila masukkan harga sewa yang sah.',

  paymentManagementTitle: 'Pengurusan Pembayaran',
  blockLabel: 'Blok:',
  selectBlock: '-- Pilih Blok --',
  monthLabel: 'Bulan:',
  yearLabel: 'Tahun:',
  selectBlockToManage2: 'Pilih blok untuk mengurus pembayaran.',
  noRentersInBlock: 'Tiada penyewa dalam blok ini. Tambah penyewa di Pengurusan Blok terlebih dahulu.',
  renterCol: 'Penyewa',
  rentCol: 'Sewa',
  electricityCol: 'Elektrik',
  waterCol: 'Air',
  totalRentAmountCol: 'Jumlah Sewa Keseluruhan',
  statusCol: 'Status',
  receiptCol: 'Resit',
  waStatusCol: 'Status WhatsApp',
  paid: 'Dibayar',
  unpaid: 'Belum Bayar',
  perMonth: '/bln',
  enterElecBillAmount: 'Masukkan Jumlah Bil Elektrik',
  enterWaterBillAmount: 'Masukkan Jumlah Bil Air',
  amountDollar: 'Jumlah ($)',
  updateBills: 'Kemaskini',
  waSentAt: 'Dihantar',
  waNotSent: 'Belum dihantar',

  reportsTitle: 'Laporan',
  blockOverview: 'Gambaran Keseluruhan Blok',
  noBlocksFound: 'Tiada blok dijumpai. Cipta blok di Pengurusan Blok.',
  totalRent: 'jumlah sewa',
  renterDetails: 'Perincian Penyewa',
  exportPdf: 'Eksport PDF',
  rentStatus: 'Status Sewa',
  elecStatus: 'Status Elektrik',
  waterStatus: 'Status Air',

  months: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],

  receiptTitle: 'RESIT PEMBAYARAN',
  receiptPeriod: 'Tempoh:',
  receiptGenerated: 'Dijana:',
  receiptDetails: 'Pecahan Pembayaran',
  receiptBlock: 'Blok:',
  receiptRenter: 'Penyewa:',
  receiptPhone: 'Telefon:',
  receiptRentAmount: 'Sewa:',
  receiptElecAmount: 'Elektrik:',
  receiptWaterAmount: 'Air:',
  receiptTotalAmount: 'Jumlah Keseluruhan:',
  receiptStatus: 'Status:',
  receiptPaidStatus: 'DIBAYAR',
  receiptConfirmed: 'Pembayaran Disahkan',
  receiptThankYou: 'Terima kasih atas pembayaran anda.',
  receiptId: 'ID Resit:',

  typeRent: 'Sewa',
  typeElectricity: 'Elektrik',
  typeWater: 'Air',

  reportPaymentReport: 'Laporan Pembayaran',
  reportSummary: 'Ringkasan',
  reportTotalRenters: 'Jumlah Penyewa:',
  reportCollected: 'Dikutip:',
  reportGeneratedOn: 'Dijana:',
  dismiss: 'Tutup',
  na: 'T/A',
  sendWhatsApp: 'Hantar WhatsApp',
  waSending: 'Menghantar...',
  waSentSuccess: 'Mesej WhatsApp berjaya dihantar!',
  waReceiptMsg: 'Hai {name}, ini resit pembayaran anda untuk {period}.\n\nBlok: {block}\nSewa: ${rent}\nElektrik: ${electricity}\nAir: ${water}\nJumlah: ${total}\nStatus: Dibayar\n\nTerima kasih!',
  waDownloadReceipt: 'Muat turun resit anda di sini:',
};

export const translations: Record<Lang, Translations> = { en, ms };
