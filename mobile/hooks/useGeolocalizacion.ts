import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordenadas } from '../types';

interface UseGeolocalizacionReturn {
  coordenadas: Coordenadas | null;
  error: string | null;
  permiso: 'concedido' | 'denegado' | 'pendiente';
  cargando: boolean;
}

export function useGeolocalizacion(): UseGeolocalizacionReturn {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permiso, setPermiso] = useState<'concedido' | 'denegado' | 'pendiente'>(
    'pendiente'
  );
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    solicitarPermisos();
  }, []);

  async function solicitarPermisos() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setPermiso('concedido');
        iniciarMonitoreo();
      } else {
        setPermiso('denegado');
        setError('Activa la ubicación para descubrir sitios cerca de ti');
        setCargando(false);
      }
    } catch (err) {
      setPermiso('denegado');
      setError('Error al solicitar permisos de ubicación');
      setCargando(false);
    }
  }

  async function iniciarMonitoreo() {
    try {
      // Obtener ubicación inicial
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoordenadas({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Iniciar monitoreo continuo
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 segundos
          distanceInterval: 10, // 10 metros
        },
        (location) => {
          setCoordenadas({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

      setCargando(false);

      // Limpiar al desmontar
      return () => {
        subscription.remove();
      };
    } catch (err) {
      setError('No se pudo obtener la ubicación');
      setCargando(false);
    }
  }

  return {
    coordenadas,
    error,
    permiso,
    cargando,
  };
}
