export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'turista' | 'negocio' | 'admin';
  rol_id?: number;
  foto_url?: string | null;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
}

export interface Imagen {
  url: string;
  es_portada: boolean;
  orden?: number;
}

export interface Lugar {
  id: string;
  categoria_id: number;
  nombre: string;
  descripcion: string;
  historia?: string | null;
  latitud: number | string;
  longitud: number | string;
  direccion?: string | null;
  provincia?: string | null;
  audio_url?: string | null;
  activo?: boolean;
  creado_en?: string;
  categoria?: Categoria | null;
  imagenes?: Imagen[];
}

export interface PropietarioResumen {
  id: string;
  nombre: string;
  email: string;
}

export interface Negocio {
  id: string;
  propietario_id: string;
  categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  latitud: number | string;
  longitud: number | string;
  direccion?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  horario?: string | null;
  sitio_web?: string | null;
  verificado?: boolean;
  activo?: boolean;
  creado_en?: string;
  categoria?: Categoria | null;
  imagenes?: Imagen[];
  propietario?: PropietarioResumen | null;
}

/** Categorías de lugar sembradas en la BD (categorias_lugar) */
export const CATEGORIAS_LUGAR: Categoria[] = [
  { id: 1, nombre: 'Historia y Cultura', icono: 'history' },
  { id: 2, nombre: 'Naturaleza', icono: 'leaf' },
  { id: 3, nombre: 'Playa', icono: 'water' },
  { id: 4, nombre: 'Religioso', icono: 'cross' },
  { id: 5, nombre: 'Mirador', icono: 'eye' },
  { id: 6, nombre: 'Museo', icono: 'building' },
  { id: 7, nombre: 'Entretenimiento', icono: 'gamepad' },
  { id: 8, nombre: 'Gastronomía', icono: 'utensils' },
];
