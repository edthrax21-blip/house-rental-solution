import type { RentalGroup, Renter, RenterPayments, CreateGroup, CreateRenter, UpdateBills, TogglePaid, BlockReport, RenterReport } from '../types/group';
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
  if (res.status === 401) { window.dispatchEvent(new CustomEvent('auth:logout')); throw new Error('Unauthorized'); }
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
  async getGroups(): Promise<RentalGroup[]> {
    return handleResponse(await fetch(BASE, { headers: authHeaders() }));
  },
  async createGroup(data: CreateGroup): Promise<RentalGroup> {
    return handleResponse(await fetch(BASE, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }));
  },
  async updateGroup(id: string, data: CreateGroup): Promise<RentalGroup> {
    return handleResponse(await fetch(`${BASE}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }));
  },
  async deleteGroup(id: string): Promise<void> {
    return handleResponse(await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },

  // Renters
  async getRenters(groupId: string): Promise<Renter[]> {
    return handleResponse(await fetch(`${BASE}/${groupId}/renters`, { headers: authHeaders() }));
  },
  async addRenter(groupId: string, data: CreateRenter): Promise<Renter> {
    return handleResponse(await fetch(`${BASE}/${groupId}/renters`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }));
  },
  async updateRenter(groupId: string, renterId: string, data: CreateRenter): Promise<Renter> {
    return handleResponse(await fetch(`${BASE}/${groupId}/renters/${renterId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }));
  },
  async deleteRenter(groupId: string, renterId: string): Promise<void> {
    return handleResponse(await fetch(`${BASE}/${groupId}/renters/${renterId}`, { method: 'DELETE', headers: authHeaders() }));
  },

  // Payments
  async getPayments(groupId: string, month: number, year: number): Promise<RenterPayments[]> {
    return handleResponse(await fetch(`${BASE}/${groupId}/payments?month=${month}&year=${year}`, { headers: authHeaders() }));
  },
  async updateBills(groupId: string, renterId: string, data: UpdateBills): Promise<unknown> {
    return handleResponse(await fetch(`${BASE}/${groupId}/renters/${renterId}/bills`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }));
  },
  async togglePaid(groupId: string, renterId: string, data: TogglePaid): Promise<unknown> {
    return handleResponse(await fetch(`${BASE}/${groupId}/renters/${renterId}/toggle-paid`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }));
  },

  // Reports
  async getReportSummary(month: number, year: number): Promise<BlockReport[]> {
    return handleResponse(await fetch(`${BASE}/reports/summary?month=${month}&year=${year}`, { headers: authHeaders() }));
  },
  async getRenterReport(groupId: string, month: number, year: number): Promise<RenterReport[]> {
    return handleResponse(await fetch(`${BASE}/reports/${groupId}/renters?month=${month}&year=${year}`, { headers: authHeaders() }));
  },
};

const WA_BASE = `${apiBase}/api/whatsapp`;
const RECEIPTS_BASE = `${apiBase}/api/receipts`;

export const whatsAppApi = {
  async getStatus(): Promise<{ configured: boolean }> {
    return handleResponse(await fetch(`${WA_BASE}/status`, { headers: authHeaders() }));
  },
  async sendReceipt(phoneNumber: string, message: string, renterId?: string, month?: number, year?: number): Promise<{ sid: string; status: string; whatsAppSentAt: string }> {
    return handleResponse(await fetch(`${WA_BASE}/send-receipt`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ phoneNumber, message, renterId, month, year }) }));
  },
};

export const receiptsApi = {
  async upload(pdfBlob: Blob, fileName: string): Promise<{ id: string; downloadUrl: string }> {
    const token = getStoredToken();
    const form = new FormData();
    form.append('file', pdfBlob, fileName);
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return handleResponse(await fetch(`${RECEIPTS_BASE}/upload`, { method: 'POST', headers, body: form }));
  },
};
