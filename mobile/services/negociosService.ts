import api from './api';
import { Negocio, CategoriaNegocio, ApiResponse } from '../types';

class NegociosService {
  async getCategorias(): Promise<CategoriaNegocio[]> {
    try {
      const response = await api.get<ApiResponse<CategoriaNegocio[]>>('/negocios/categorias');
      return response.data.data || [];
    } catch (error: any) {
      throw error;
    }
  }

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

  async getMisNegocios(): Promise<Negocio[]> {
    try {
      const response = await api.get<ApiResponse<Negocio[]>>('/negocios/mis-negocios');
      console.log('[getMisNegocios] response:', JSON.stringify(response.data));
      return response.data.data || [];
    } catch (error: any) {
      console.error('[getMisNegocios] error:', error.response?.status, error.response?.data);
      throw error;
    }
  }

  async subirImagenNegocio(
    negocioId: string,
    uri: string,
    esPortada: boolean = false
  ): Promise<any> {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'imagen.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('imagen', { uri, name: filename, type } as any);
      formData.append('es_portada', String(esPortada));

      console.log('[subirImagen] negocioId:', negocioId, 'uri:', uri, 'esPortada:', esPortada);

      const response = await api.post(
        `/imagenes-negocio/${negocioId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.log('[subirImagen] éxito:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[subirImagen] error:', error.response?.status, error.response?.data);
      throw new Error(
        error.response?.data?.message || 'Error al subir imagen'
      );
    }
  }
}

export default new NegociosService();
