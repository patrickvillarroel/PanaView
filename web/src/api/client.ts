import axios from 'axios';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000/api';

const TOKEN_KEY = 'panaview_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el token a cada petición
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira o es inválido, limpiamos sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      tokenStore.clear();
      // Evita bucles si ya estamos en login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/** Extrae un mensaje legible de un error de axios */
export function getApiError(err: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default api;
