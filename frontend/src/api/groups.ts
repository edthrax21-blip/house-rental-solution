import type { RentalGroup, Renter, GroupSummary, MonthlyRecord, CreateGroup, CreateRenter, SetPayment, Payment } from '../types/group';
import { getStoredToken } from './auth';
import { apiBase } from './config';

const BASE = `${apiBase}/api/groups`;

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    let message = text || `HTTP ${res.status}`;
    try { const j = JSON.parse(text); if (j.message) message = j.message; } catch { /* */ }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const groupsApi = {
  // ── Groups ───────────────────────────────────
  async getGroups(): Promise<RentalGroup[]> {
    const res = await fetch(BASE, { headers: authHeaders() });
    return handleResponse<RentalGroup[]>(res);
  },

  async getGroup(id: string): Promise<RentalGroup> {
    const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() });
    return handleResponse<RentalGroup>(res);
  },

  async createGroup(data: CreateGroup): Promise<RentalGroup> {
    const res = await fetch(BASE, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
    return handleResponse<RentalGroup>(res);
  },

  async updateGroup(id: string, data: CreateGroup): Promise<RentalGroup> {
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
    return handleResponse<RentalGroup>(res);
  },

  async deleteGroup(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
    return handleResponse<void>(res);
  },

  async getGroupSummary(id: string, month: number, year: number): Promise<GroupSummary> {
    const res = await fetch(`${BASE}/${id}/summary?month=${month}&year=${year}`, { headers: authHeaders() });
    return handleResponse<GroupSummary>(res);
  },

  // ── Renters ──────────────────────────────────
  async getRenters(groupId: string, month: number, year: number): Promise<Renter[]> {
    const res = await fetch(`${BASE}/${groupId}/renters?month=${month}&year=${year}`, { headers: authHeaders() });
    return handleResponse<Renter[]>(res);
  },

  async addRenter(groupId: string, data: CreateRenter): Promise<Renter> {
    const res = await fetch(`${BASE}/${groupId}/renters`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
    return handleResponse<Renter>(res);
  },

  async updateRenter(groupId: string, renterId: string, data: CreateRenter): Promise<Renter> {
    const res = await fetch(`${BASE}/${groupId}/renters/${renterId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
    return handleResponse<Renter>(res);
  },

  async deleteRenter(groupId: string, renterId: string): Promise<void> {
    const res = await fetch(`${BASE}/${groupId}/renters/${renterId}`, { method: 'DELETE', headers: authHeaders() });
    return handleResponse<void>(res);
  },

  // ── Payments ─────────────────────────────────
  async setPayment(groupId: string, renterId: string, data: SetPayment): Promise<Payment> {
    const res = await fetch(`${BASE}/${groupId}/renters/${renterId}/payment`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
    return handleResponse<Payment>(res);
  },

  async getPaymentRecords(groupId: string): Promise<MonthlyRecord[]> {
    const res = await fetch(`${BASE}/${groupId}/payments`, { headers: authHeaders() });
    return handleResponse<MonthlyRecord[]>(res);
  },
};
