import api from './api';
import { Lugar, ApiResponse } from '../types';

class LugaresService {
  async getLugaresCercanos(
    lat: number,
    lng: number,
    radio: number = 500
  ): Promise<Lugar[]> {
    try {
      const response = await api.get<ApiResponse<Lugar[]>>('/lugares', {
        params: { lat, lng, radio },
      });
      return response.data.data || [];
    } catch (error: any) {
      throw error;
    }
  }

  async getLugarById(id: string): Promise<Lugar> {
    try {
      const response = await api.get<ApiResponse<Lugar>>(`/lugares/${id}`);
      if (!response.data.data) {
        throw new Error('Lugar no encontrado');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener lugar:', error);
      throw error;
    }
  }

  async crearLugar(payload: Partial<Lugar>): Promise<Lugar> {
    try {
      const response = await api.post<ApiResponse<Lugar>>('/lugares', payload);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al crear lugar'
      );
    }
  }

  async actualizarLugar(id: string, payload: Partial<Lugar>): Promise<Lugar> {
    try {
      const response = await api.put<ApiResponse<Lugar>>(
        `/lugares/${id}`,
        payload
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al actualizar lugar'
      );
    }
  }
}

export default new LugaresService();
