export interface Rental {
  id: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface RentalCreate {
  address: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status?: string;
  notes?: string | null;
}

export interface RentalUpdate {
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  status?: string;
  notes?: string | null;
}
