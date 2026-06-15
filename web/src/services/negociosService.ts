import api from '../api/client';
import type { ApiResponse, Categoria, Negocio } from '../types';

export interface NegocioPayload {
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  horario?: string;
  sitio_web?: string;
  categoria_id: number;
  verificado?: boolean;
  imagen_portada?: string;
}

export const negociosService = {
  async listAll(verificado?: boolean): Promise<Negocio[]> {
    const params =
      verificado === undefined ? {} : { verificado: verificado ? 1 : 0 };
    const res = await api.get<ApiResponse<Negocio[]>>('/negocios/admin/todos', {
      params,
    });
    return res.data.data ?? [];
  },

  async categorias(): Promise<Categoria[]> {
    const res = await api.get<ApiResponse<Categoria[]>>('/negocios/categorias');
    return res.data.data ?? [];
  },

  async create(payload: NegocioPayload): Promise<Negocio> {
    const res = await api.post<ApiResponse<Negocio>>('/negocios', payload);
    return res.data.data!;
  },

  async update(id: string, payload: Partial<NegocioPayload>): Promise<Negocio> {
    const res = await api.put<ApiResponse<Negocio>>(`/negocios/${id}`, payload);
    return res.data.data!;
  },

  async setVerificado(id: string, verificado: boolean): Promise<void> {
    await api.patch(`/negocios/${id}/verificar`, { verificado });
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/negocios/${id}`);
  },
};
