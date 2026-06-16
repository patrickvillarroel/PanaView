import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../constants/config';

const PANAMA_LAT = 9.089204;
const PANAMA_LNG = -79.4029686;

interface MapaSelectorModalProps {
  visible: boolean;
  latitudInicial?: number;
  longitudInicial?: number;
  onConfirmar: (lat: number, lng: number) => void;
  onCerrar: () => void;
}

function construirHtml(lat: number, lng: number) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

    function enviar(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
    }

    marker.on('dragend', function (e) {
      var pos = e.target.getLatLng();
      enviar(pos.lat, pos.lng);
    });

    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      enviar(e.latlng.lat, e.latlng.lng);
    });

    function manejarMensaje(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'setLocation') {
          var pos = [data.lat, data.lng];
          marker.setLatLng(pos);
          map.setView(pos, 15, { animate: true });
        }
      } catch (err) {}
    }
    document.addEventListener('message', manejarMensaje);
    window.addEventListener('message', manejarMensaje);
  </script>
</body>
</html>`;
}

export default function MapaSelectorModal({
  visible,
  latitudInicial,
  longitudInicial,
  onConfirmar,
  onCerrar,
}: MapaSelectorModalProps) {
  const webviewRef = useRef<WebView>(null);
  const [initialCoords, setInitialCoords] = useState({
    lat: latitudInicial || PANAMA_LAT,
    lng: longitudInicial || PANAMA_LNG,
  });
  const [coords, setCoords] = useState(initialCoords);
  const [ubicando, setUbicando] = useState(false);

  useEffect(() => {
    if (visible) {
      const lat = latitudInicial || PANAMA_LAT;
      const lng = longitudInicial || PANAMA_LNG;
      setInitialCoords({ lat, lng });
      setCoords({ lat, lng });
    }
  }, [visible, latitudInicial, longitudInicial]);

  const html = useMemo(() => construirHtml(initialCoords.lat, initialCoords.lng), [initialCoords]);

  async function usarMiUbicacion() {
    setUbicando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu ubicación para usar esta función.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCoords({ lat: latitude, lng: longitude });
      webviewRef.current?.postMessage(JSON.stringify({ type: 'setLocation', lat: latitude, lng: longitude }));
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
    } finally {
      setUbicando(false);
    }
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        setCoords({ lat: data.lat, lng: data.lng });
      }
    } catch {}
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Ubicación del negocio</Text>
          <TouchableOpacity onPress={onCerrar}>
            <Ionicons name="close" size={24} color={COLORES.texto} />
          </TouchableOpacity>
        </View>

        <Text style={styles.instruccion}>
          Toca el mapa o arrastra el marcador para ubicar tu negocio.
        </Text>

        <View style={styles.mapaContenedor}>
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html }}
            onMessage={handleMessage}
            style={styles.mapa}
          />
        </View>

        <View style={styles.coordsRow}>
          <Ionicons name="location" size={16} color={COLORES.primario} />
          <Text style={styles.coordsTexto}>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botonUbicacion}
          onPress={usarMiUbicacion}
          disabled={ubicando}
          activeOpacity={0.8}
        >
          {ubicando ? (
            <ActivityIndicator color={COLORES.primario} size="small" />
          ) : (
            <>
              <Ionicons name="navigate-outline" size={16} color={COLORES.primario} />
              <Text style={styles.botonUbicacionTexto}>Usar mi ubicación actual</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonConfirmar}
          onPress={() => onConfirmar(coords.lat, coords.lng)}
          activeOpacity={0.85}
        >
          <Text style={styles.botonConfirmarTexto}>Confirmar ubicación</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORES.texto,
  },
  instruccion: {
    fontSize: 13,
    color: COLORES.textoBorrado,
    marginBottom: 14,
    lineHeight: 18,
  },
  mapaContenedor: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  mapa: {
    flex: 1,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  coordsTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.texto,
  },
  botonUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.primario,
  },
  botonUbicacionTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.primario,
  },
  botonConfirmar: {
    backgroundColor: COLORES.primario,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  botonConfirmarTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
