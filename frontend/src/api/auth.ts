import { AUTH_BASE } from './config';

const TOKEN_KEY = 'house_rental_token';
const USER_KEY = 'house_rental_user';

export interface LoginResponse {
  token: string;
  userName: string;
  expiresAt: string;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUserName(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setStoredAuth(token: string, userName: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, userName);
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export interface DbStatus {
  dbConnection: 'online' | 'offline';
  rentalsTableOk: boolean;
}

/** Check if the API's database connection and Rentals table are OK (for debug on login page). */
export async function checkDbStatus(): Promise<DbStatus> {
  try {
    const res = await fetch(`${AUTH_BASE}/db-status`);
    if (!res.ok) return { dbConnection: 'offline', rentalsTableOk: false };
    const data = await res.json() as { dbConnection?: string; rentalsTableOk?: boolean };
    return {
      dbConnection: data.dbConnection === 'online' ? 'online' : 'offline',
      rentalsTableOk: !!data.rentalsTableOk,
    };
  } catch {
    return { dbConnection: 'offline', rentalsTableOk: false };
  }
}

export async function login(userName: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: userName.trim(), password }),
    });
  } catch (err) {
    const isNetworkError = err instanceof TypeError || (err && (err as Error).message?.toLowerCase().includes('fetch'));
    if (isNetworkError) {
      throw new Error('Cannot reach the API. Ensure the API is running (e.g. https://localhost:44335/swagger) and try again.');
    }
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Login failed');
  }
  return res.json();
}

export async function register(userName: string, password: string): Promise<{ userName: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: userName.trim(), password }),
    });
  } catch (err) {
    const isNetworkError = err instanceof TypeError || (err && (err as Error).message?.toLowerCase().includes('fetch'));
    if (isNetworkError) {
      throw new Error('Cannot reach the API. Ensure the API is running (e.g. https://localhost:44335/swagger) and try again.');
    }
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Registration failed');
  }
  return res.json();
}
