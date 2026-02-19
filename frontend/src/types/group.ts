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

export interface PaymentItem {
  id: string | null;
  type: string;
  amount: number;
  isPaid: boolean;
  paidDate: string | null;
}

export interface RenterPayments {
  renterId: string;
  name: string;
  phoneNumber: string;
  rentPrice: number;
  rent: PaymentItem;
  electricity: PaymentItem;
  water: PaymentItem;
}

export interface CreateGroup { name: string; }
export interface CreateRenter { name: string; phoneNumber: string; rentPrice: number; }
export interface SetPayment { month: number; year: number; type: string; amount: number; isPaid: boolean; }

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
}
export interface PaymentStatus { amount: number; isPaid: boolean; paidDate: string | null; }
export interface RenterReport {
  renterId: string;
  name: string;
  rentPrice: number;
  rent: PaymentStatus;
  electricity: PaymentStatus;
  water: PaymentStatus;
}
