import type { Rental, RentalCreate, RentalUpdate } from '../types/rental';
import { getStoredToken } from './auth';
import { RENTALS_BASE as BASE } from './config';

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    const event = new CustomEvent('auth:logout');
    window.dispatchEvent(event);
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    let message = text || `HTTP ${res.status}`;
    if (res.status === 503) {
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        /* use text as-is */
      }
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async getRentals(params?: { status?: string; search?: string }): Promise<Rental[]> {
    const url = new URL(BASE, window.location.origin);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.search) url.searchParams.set('search', params.search);
    const res = await fetch(url.toString(), { headers: authHeaders() });
    return handleResponse<Rental[]>(res);
  },

  async getRental(id: string): Promise<Rental> {
    const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() });
    return handleResponse<Rental>(res);
  },

  async createRental(data: RentalCreate): Promise<Rental> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Rental>(res);
  },

  async updateRental(id: string, data: RentalUpdate): Promise<Rental> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Rental>(res);
  },

  async deleteRental(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<void>(res);
  },
};
