/**
 * API base URL. When running with Vite dev server, leave unset to use the proxy (default).
 * Set VITE_API_URL (e.g. in .env) if the API runs on a different port or host.
 * Example: VITE_API_URL=http://localhost:5000
 */
export const apiBase = (import.meta.env.VITE_API_URL as string)?.trim() || '';

export const AUTH_BASE = `${apiBase}/api/auth`;
export const RENTALS_BASE = `${apiBase}/api/rentals`;
