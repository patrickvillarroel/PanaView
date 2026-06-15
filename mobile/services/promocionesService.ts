import api from './api';
import { Promocion, ApiResponse } from '../types';

class PromocionesService {
  async listar(negocioId: string): Promise<Promocion[]> {
    const resp = await api.get<ApiResponse<Promocion[]>>(`/promociones/negocios/${negocioId}`);
    return resp.data.data || [];
  }

  async crear(negocioId: string, payload: Partial<Promocion>): Promise<Promocion> {
    const resp = await api.post<ApiResponse<Promocion>>(`/promociones/negocios/${negocioId}`, payload);
    return resp.data.data!;
  }

  async obtener(id: string): Promise<Promocion> {
    const resp = await api.get<ApiResponse<Promocion>>(`/promociones/${id}`);
    return resp.data.data!;
  }

  async redeemByQR(qr: string): Promise<void> {
    await api.post('/promociones/redeem-by-qr', { qr_codigo: qr });
  }

  async redeemById(id: string): Promise<void> {
    await api.post(`/promociones/${id}/redeem`);
  }

  async subirImagen(
    promocionId: string,
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

      const response = await api.post(
        `/imagenes-promocion/${promocionId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al subir imagen'
      );
    }
  }
}

export default new PromocionesService();
