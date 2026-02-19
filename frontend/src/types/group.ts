export interface RentalGroup {
  id: string;
  name: string;
  createdAt: string;
  renterCount: number;
  totalRent: number;
}

export interface Renter {
  id: string;
  groupId: string;
  name: string;
  phoneNumber: string;
  rentPrice: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface RenterPayments {
  renterId: string;
  name: string;
  phoneNumber: string;
  rentPrice: number;
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  totalAmount: number;
  isPaid: boolean;
  paidDate: string | null;
  whatsAppSentAt: string | null;
}

export interface CreateGroup { name: string; }
export interface CreateRenter { name: string; phoneNumber: string; rentPrice: number; }
export interface UpdateBills { month: number; year: number; electricityAmount: number; waterAmount: number; }
export interface TogglePaid { month: number; year: number; isPaid: boolean; }

// Reports
export interface TypeSummary { paid: number; unpaid: number; collectedAmount: number; }
export interface BlockReport {
  groupId: string;
  groupName: string;
  renterCount: number;
  totalRent: number;
  rent: TypeSummary;
  electricity: TypeSummary;
  water: TypeSummary;
  totalCollected: number;
}
export interface RenterReport {
  renterId: string;
  name: string;
  rentPrice: number;
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  totalAmount: number;
  isPaid: boolean;
  paidDate: string | null;
}
