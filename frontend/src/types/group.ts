export interface RentalGroup {
  id: string;
  name: string;
  createdAt: string;
  renterCount: number;
  totalRent: number;
}

export interface Payment {
  id: string;
  renterId: string;
  month: number;
  year: number;
  isPaid: boolean;
  paidDate: string | null;
}

export interface Renter {
  id: string;
  groupId: string;
  name: string;
  phoneNumber: string;
  rentPrice: number;
  createdAt: string;
  updatedAt: string | null;
  payment: Payment | null; // payment for the requested month
}

export interface GroupSummary {
  groupId: string;
  groupName: string;
  month: number;
  year: number;
  totalRenters: number;
  totalRentPrice: number;
  paidRenters: number;
  totalPaidAmount: number;
  unpaidRenters: number;
  totalUnpaidAmount: number;
}

export interface MonthlyRecord {
  month: number;
  year: number;
  paidCount: number;
  unpaidCount: number;
}

export interface CreateGroup {
  name: string;
}

export interface CreateRenter {
  name: string;
  phoneNumber: string;
  rentPrice: number;
}

export interface SetPayment {
  month: number;
  year: number;
  isPaid: boolean;
}
