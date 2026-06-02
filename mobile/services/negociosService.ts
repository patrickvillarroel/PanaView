import api from './api';
import { Negocio, ApiResponse } from '../types';

class NegociosService {
  async getNegociosCercanos(
    lat: number,
    lng: number,
    radio: number = 500
  ): Promise<Negocio[]> {
    try {
      const response = await api.get<ApiResponse<Negocio[]>>('/negocios', {
        params: { lat, lng, radio },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error al obtener negocios cercanos:', error);
      throw error;
    }
  }

  async getNegocioById(id: string): Promise<Negocio> {
    try {
      const response = await api.get<ApiResponse<Negocio>>(`/negocios/${id}`);
      if (!response.data.data) {
        throw new Error('Negocio no encontrado');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener negocio:', error);
      throw error;
    }
  }

  async crearNegocio(payload: Partial<Negocio>): Promise<Negocio> {
    try {
      const response = await api.post<ApiResponse<Negocio>>(
        '/negocios',
        payload
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al crear negocio'
      );
    }
  }

  async actualizarNegocio(id: string, payload: Partial<Negocio>): Promise<Negocio> {
    try {
      const response = await api.put<ApiResponse<Negocio>>(
        `/negocios/${id}`,
        payload
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al actualizar negocio'
      );
    }
  }
}

export default new NegociosService();
