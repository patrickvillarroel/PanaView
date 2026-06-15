import api from './api';
import { ApiResponse } from '../types';

class ImagenesUsuarioService {
  async subirImagen(usuarioId: string, uri: string): Promise<{ foto_url: string }> {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'imagen.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('imagen', { uri, name: filename, type } as any);
      formData.append('es_portada', 'true');

      const response = await api.post<ApiResponse<{ foto_url: string }>>(
        `/imagenes-usuario/${usuarioId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al subir la imagen'
      );
    }
  }

  async eliminarImagen(usuarioId: string, imagenId: number): Promise<void> {
    try {
      await api.delete(`/imagenes-usuario/${usuarioId}/${imagenId}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al eliminar la imagen'
      );
    }
  }
}

export default new ImagenesUsuarioService();
