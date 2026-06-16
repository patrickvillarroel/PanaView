export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'turista' | 'negocio' | 'admin';
  rol_id?: 1 | 2 | 3;
  foto_url?: string;
}

export interface Lugar {
  id: string;
  nombre: string;
  descripcion: string;
  historia?: string;
  latitud: number;
  longitud: number;
  direccion?: string;
  provincia?: string;
  audio_url?: string;
  historia_en?: string;
  activo?: boolean;
  categoria: {
    id: number;
    nombre: string;
    icono: string;
  };
  imagenes: {
    id?: number;
    url: string;
    es_portada: boolean;
    orden?: number;
  }[];
  calificacion_promedio?: number;
  total_resenas?: number;
  distancia_metros?: number;
  resenas?: Resena[];
}

export interface Negocio {
  id: string;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  horario?: string;
  sitio_web?: string;
  verificado?: boolean;
  activo?: boolean;
  comision_porcentaje?: number;
  tipo_ciclo?: 'quincenal' | 'mensual';
  categoria: {
    id: number;
    nombre: string;
    icono?: string;
  };
  imagenes: {
    id?: number;
    url: string;
    es_portada: boolean;
    orden?: number;
  }[];
  calificacion_promedio?: number;
  total_resenas?: number;
  distancia_metros?: number;
  propietario_id?: string;
}

export interface Resena {
  id: number;
  calificacion: number;
  comentario?: string;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    foto_url?: string;
  };
}

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LugarFavoritoResumen {
  id: string;
  nombre: string;
  direccion?: string;
  provincia?: string;
  categoria: {
    id?: number;
    nombre: string;
    icono?: string;
  } | null;
  imagen_portada?: string | null;
}

export interface NegocioFavoritoResumen {
  id: string;
  nombre: string;
  direccion?: string;
  categoria: {
    id?: number;
    nombre: string;
    icono?: string;
  } | null;
  imagen_portada?: string | null;
}

export interface UsuarioPerfil extends Usuario {
  creado_en?: string;
  favoritos: LugarFavoritoResumen[];
  negociosFavoritos: NegocioFavoritoResumen[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CategoriaLugar {
  id: number;
  nombre: string;
  icono: string;
}

export interface CategoriaNegocio {
  id: number;
  nombre: string;
  icono: string;
}

export interface Promocion {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  fecha_validez?: string;
  qr_codigo: string;
  activo?: boolean;
  creado_en?: string;
  imagenes: {
    id?: number;
    url: string;
    es_portada: boolean;
    orden?: number;
  }[];
}
