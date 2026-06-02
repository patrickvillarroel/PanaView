import { useState, useEffect } from 'react';
import { Lugar, Coordenadas } from '../types';
import lugaresService from '../services/lugaresService';
import { RADIO_DEFAULT } from '../constants/config';

interface UseLugaresReturn {
  lugares: Lugar[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

export function useLugares(
  coordenadas: Coordenadas | null,
  radio: number = RADIO_DEFAULT
): UseLugaresReturn {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coordenadas) {
      obtenerLugares();
    }
  }, [coordenadas, radio]);

  async function obtenerLugares() {
    if (!coordenadas) {
      setLugares([]);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const nuevosLugares = await lugaresService.getLugaresCercanos(
        coordenadas.latitude,
        coordenadas.longitude,
        radio
      );
      setLugares(nuevosLugares);
    } catch (err: any) {
      setError(err.message || 'Error al obtener lugares');
      setLugares([]);
    } finally {
      setCargando(false);
    }
  }

  async function recargar() {
    await obtenerLugares();
  }

  return {
    lugares,
    cargando,
    error,
    recargar,
  };
}
