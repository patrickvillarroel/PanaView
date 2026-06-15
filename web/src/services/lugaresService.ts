import api from '../api/client';
import type { ApiResponse, Lugar } from '../types';

export interface LugarPayload {
  nombre: string;
  descripcion: string;
  historia?: string;
  latitud: number;
  longitud: number;
  direccion?: string;
  provincia?: string;
  audio_url?: string;
  categoria_id: number;
}

export const lugaresService = {
  async listAll(): Promise<Lugar[]> {
    const res = await api.get<ApiResponse<Lugar[]>>('/lugares/admin/todos');
    return res.data.data ?? [];
  },

  async create(payload: LugarPayload): Promise<Lugar> {
    const res = await api.post<ApiResponse<Lugar>>('/lugares', payload);
    return res.data.data!;
  },

  async update(id: string, payload: Partial<LugarPayload>): Promise<Lugar> {
    const res = await api.put<ApiResponse<Lugar>>(`/lugares/${id}`, payload);
    return res.data.data!;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/lugares/${id}`);
  },

  async uploadImage(lugarId: string, file: File): Promise<void> {
    const body = new FormData();
    body.append('imagen', file);
    body.append('es_portada', 'true');
    await api.post(`/imagenes-lugar/${lugarId}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
