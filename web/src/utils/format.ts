import type { Imagen } from '../types';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000/api';

// Origen del backend (sin el /api) para servir /uploads/...
const ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Convierte una ruta relativa de imagen del backend en URL absoluta. */
export function assetUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Devuelve la URL de la imagen de portada de una lista de imágenes. */
export function portadaUrl(imagenes?: Imagen[]): string | null {
  if (!imagenes || imagenes.length === 0) return null;
  const portada = imagenes.find((i) => i.es_portada) ?? imagenes[0];
  return assetUrl(portada.url);
}

/** Iniciales de un nombre para avatares/fallbacks. */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

/** Formatea fecha ISO a algo legible en es-PA. */
export function fechaCorta(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Recorta texto largo. */
export function recortar(texto: string | null | undefined, max = 60): string {
  if (!texto) return '—';
  return texto.length > max ? texto.slice(0, max - 1).trimEnd() + '…' : texto;
}
