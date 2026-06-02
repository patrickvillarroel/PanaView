import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Lugar, Coordenadas } from '../types';
import { COLORES } from '../constants/config';

interface MapaViewProps {
  lugares: Lugar[];
  coordenadas: Coordenadas | null;
  cargando: boolean;
  onMarkerPress?: (lugarId: string) => void;
}

const MapaView: React.FC<MapaViewProps> = ({
  lugares,
  coordenadas,
  cargando,
  onMarkerPress,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [webViewError, setWebViewError] = useState(false);

  const lat = coordenadas?.latitude ?? 8.9824;
  const lng = coordenadas?.longitude ?? -79.5199;

  const lugaresJson = JSON.stringify(
    lugares.map((l) => ({
      id: l.id,
      nombre: l.nombre,
      lat: Number(l.latitud),
      lng: Number(l.longitud),
      distancia: l.distancia_metros,
    }))
  );

  useEffect(() => {
    if (!cargando && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        actualizarLugares(${lugaresJson});
        true;
      `);
    }
  }, [lugares, cargando]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.tipo === 'markerPress' && data.lugarId) {
          onMarkerPress?.(data.lugarId);
        }
      } catch {}
    },
    [onMarkerPress]
  );

  if (webViewError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>No se pudo cargar el mapa</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setWebViewError(false)}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando && !coordenadas) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; }
    #mapa { height: 100%; width: 100%; }
    .custom-marker {
      background: #1F4E79; color: white; border-radius: 50%;
      text-align: center; font-size: 16px; line-height: 32px;
      width: 32px; height: 32px;
      border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    .leaflet-popup-content-wrapper { border-radius: 10px; }
    .leaflet-popup-content { margin: 10px; min-width: 180px; }
    .popup-title { font-weight: bold; font-size: 14px; color: #1F4E79; margin-bottom: 4px; }
    .popup-dist { color: #999; font-size: 12px; margin-bottom: 8px; }
    .popup-btn {
      background: #1F4E79; color: white; border: none;
      border-radius: 6px; padding: 8px 16px; width: 100%;
      font-size: 13px; font-weight: bold; cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script>
    var mapa = L.map('mapa', { zoomControl: false }).setView([${lat}, ${lng}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(mapa);
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);

    var marcadores = [];

    function actualizarLugares(lugares) {
      marcadores.forEach(function(m) { mapa.removeLayer(m); });
      marcadores = [];
      lugares.forEach(function(l) {
        var m = L.marker([l.lat, l.lng]).addTo(mapa);
        var distHtml = l.distancia
          ? '<div class="popup-dist">' + (l.distancia / 1000).toFixed(2) + ' km</div>'
          : '';
        m.bindPopup(
          '<div class="popup-content">' +
            '<div class="popup-title">' + l.nombre + '</div>' +
            distHtml +
            '<button class="popup-btn" onclick="onMarkerClick(\'' + l.id + '\')">Ver detalle</button>' +
          '</div>'
        );
        marcadores.push(m);
      });
      if (lugares.length > 0) {
        var grupo = L.featureGroup(marcadores);
        mapa.fitBounds(grupo.getBounds().pad(0.2));
      }
    }

    function onMarkerClick(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'markerPress', lugarId: id }));
      }
    }
  </script>
</body>
</html>`;

  return (
    <WebView
      ref={webViewRef}
      style={styles.mapa}
      source={{ html }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      onMessage={handleMessage}
      onError={() => setWebViewError(true)}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      )}
      allowsInlineMediaPlayback
      mixedContentMode="compatibility"
    />
  );
};

const styles = StyleSheet.create({
  mapa: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    color: COLORES.texto,
    fontSize: 16,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORES.primario,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORES.fondo,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapaView;
