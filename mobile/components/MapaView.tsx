import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
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

interface LugarFijo {
  id: string;
  nombre: string;
  descripcion: string;
  lat: number;
  lng: number;
  categoria: string;
  horario?: string;
}

const LUGARES_FIJOS: LugarFijo[] = [
  {
    id: 'la-parada-utp',
    nombre: 'La Parada UTP',
    descripcion:
      'Puesto de comida ubicado en la entrada de la UTP. Ofrece deliciosas comidas r\u00e1pidas, refrescos naturales y platillos t\u00edpicos paname\u00f1os a precios accesibles para estudiantes.',
    lat: 9.0235,
    lng: -79.5324,
    categoria: 'comida',
    horario: 'Lun - Vie: 7:00 AM - 6:00 PM',
  },
  // Linea 1 del Metro de Panama (sur a norte)
  { id: 'm1-albrook', nombre: 'Albrook', descripcion: 'Estaci\u00f3n terminal sur de la L\u00ednea 1. Conexi\u00f3n con el Terminal de Transporte y Albrook Mall.', lat: 8.9669, lng: -79.5448, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-5mayo', nombre: '5 de Mayo', descripcion: 'Estaci\u00f3n de la L\u00ednea 1. Cerca del Casco Viejo y la Avenida 5 de Mayo.', lat: 8.9663, lng: -79.5378, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-loteria', nombre: 'Loter\u00eda', descripcion: 'Estaci\u00f3n de la L\u00ednea 1. Cerca de la Loter\u00eda Nacional de Panam\u00e1.', lat: 8.9685, lng: -79.5310, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-santotomas', nombre: 'Santo Tom\u00e1s', descripcion: 'Estaci\u00f3n de la L\u00ednea 1. Cerca del Hospital Santo Tom\u00e1s.', lat: 8.9712, lng: -79.5255, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-iglesiacarmen', nombre: 'Iglesia del Carmen', descripcion: 'Estaci\u00f3n de la L\u00ednea 1. Cerca de la Iglesia del Carmen.', lat: 8.9738, lng: -79.5200, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-viaargentina', nombre: 'V\u00eda Argentina', descripcion: 'Estaci\u00f3n de la L\u00ednea 1. Cerca de la V\u00eda Argentina, zona comercial.', lat: 8.9775, lng: -79.5155, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-fernandezcordoba', nombre: 'Fern\u00e1ndez de C\u00f3rdoba', descripcion: 'Estaci\u00f3n de la L\u00ednea 1.', lat: 8.9818, lng: -79.5115, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-elingenio', nombre: 'El Ingenio', descripcion: 'Estaci\u00f3n de la L\u00ednea 1.', lat: 8.9865, lng: -79.5080, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-12octubre', nombre: '12 de Octubre', descripcion: 'Estaci\u00f3n de la L\u00ednea 1.', lat: 8.9915, lng: -79.5045, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-pueblonuevo', nombre: 'Pueblo Nuevo', descripcion: 'Estaci\u00f3n de la L\u00ednea 1. Cerca del sector de Pueblo Nuevo.', lat: 8.9965, lng: -79.5015, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-sanmiguelito', nombre: 'San Miguelito', descripcion: 'Estaci\u00f3n de interconexi\u00f3n entre L\u00ednea 1 y L\u00ednea 2 del Metro de Panam\u00e1.', lat: 9.0030, lng: -79.4995, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-panazucar', nombre: 'Pan de Az\u00facar', descripcion: 'Estaci\u00f3n de la L\u00ednea 1.', lat: 9.0080, lng: -79.4975, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-losandes', nombre: 'Los Andes', descripcion: 'Estaci\u00f3n de la L\u00ednea 1.', lat: 9.0140, lng: -79.4960, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm1-sanisidro', nombre: 'San Isidro', descripcion: 'Estaci\u00f3n terminal norte de la L\u00ednea 1.', lat: 9.0200, lng: -79.4950, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  // Linea 2 del Metro de Panama (oeste a este)
  { id: 'm2-paraiso', nombre: 'Para\u00edso', descripcion: 'Estaci\u00f3n de la L\u00ednea 2. Cerca del sector de Para\u00edso.', lat: 9.0035, lng: -79.4880, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-villalucre', nombre: 'Villa Lucre', descripcion: 'Estaci\u00f3n de la L\u00ednea 2. Cerca de Villa Lucre.', lat: 9.0050, lng: -79.4760, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-donbosco', nombre: 'Don Bosco', descripcion: 'Estaci\u00f3n de la L\u00ednea 2. Cerca de la Iglesia Don Bosco.', lat: 9.0065, lng: -79.4640, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-pedroaltamirano', nombre: 'Pedro Altamirano', descripcion: 'Estaci\u00f3n de la L\u00ednea 2.', lat: 9.0100, lng: -79.4515, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-24diciembre', nombre: '24 de Diciembre', descripcion: 'Estaci\u00f3n de la L\u00ednea 2. Cerca del corregimiento 24 de Diciembre.', lat: 9.0135, lng: -79.4390, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-lasmañanitas', nombre: 'Las Ma\u00f1anitas', descripcion: 'Estaci\u00f3n de la L\u00ednea 2. Cerca de Las Ma\u00f1anitas.', lat: 9.0165, lng: -79.4270, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-correviento', nombre: 'Correviento', descripcion: 'Estaci\u00f3n de la L\u00ednea 2.', lat: 9.0195, lng: -79.4150, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-pedregal', nombre: 'Pedregal', descripcion: 'Estaci\u00f3n de la L\u00ednea 2. Cerca de Pedregal.', lat: 9.0225, lng: -79.4030, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-sanantonio', nombre: 'San Antonio', descripcion: 'Estaci\u00f3n de la L\u00ednea 2.', lat: 9.0260, lng: -79.3910, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
  { id: 'm2-nuevotocumen', nombre: 'Nuevo Tocumen', descripcion: 'Estaci\u00f3n terminal este de la L\u00ednea 2. Cerca del Aeropuerto Internacional de Tocumen.', lat: 9.0300, lng: -79.3790, categoria: 'metro', horario: 'Lun - Dom: 5:00 AM - 10:00 PM' },
];

const UTP_LAT = 9.0219;
const UTP_LNG = -79.5321;
const ZOOM_INICIAL = 13;

const MapaView: React.FC<MapaViewProps> = ({
  lugares,
  coordenadas,
  cargando,
  onMarkerPress,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] = useState<LugarFijo | null>(null);

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
      webViewRef.current.injectJavaScript(
        'actualizarLugares(' + lugaresJson + ');true;'
      );
    }
  }, [lugares, cargando]);

  useEffect(() => {
    if (coordenadas && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        'actualizarPosicion(' + coordenadas.latitude + ',' + coordenadas.longitude + ');true;'
      );
    }
  }, [coordenadas]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.tipo === 'markerPress' && data.lugarId) {
          onMarkerPress?.(data.lugarId);
        } else if (data.tipo === 'lugarFijo' && data.id) {
          const lugar = LUGARES_FIJOS.find((l) => l.id === data.id);
          if (lugar) {
            setLugarSeleccionado(lugar);
            setModalVisible(true);
          }
        } else if (data.tipo === 'debug') {
          console.log('WebView:', data.msg);
        }
      } catch {}
    },
    [onMarkerPress]
  );

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorText}>No se pudo cargar el mapa</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => setError(false)}>
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

  const fijosJson = JSON.stringify(LUGARES_FIJOS);
  const screenW = Math.round(Dimensions.get('window').width);

  const html = [
    '<!DOCTYPE html><html><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=2,user-scalable=no">',
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>',
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>',
    '<style>',
    '*{margin:0;padding:0}',
    'html,body,#map{height:100%;width:100%}',
    '.leaflet-control-zoom{border:none!important;border-radius:12px!important;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1)!important}',
    '.leaflet-control-zoom a{width:40px!important;height:40px!important;line-height:40px!important;font-size:20px!important;color:#6C5CE7!important;background:#fff!important;border:none!important;transition:all .2s}',
    '.leaflet-control-zoom a:hover{background:#F8F9FA!important;color:#5F3DC4!important}',
    '.leaflet-control-zoom a.leaflet-control-zoom-in{border-radius:12px 12px 0 0!important}',
    '.leaflet-control-zoom a.leaflet-control-zoom-out{border-radius:0 0 12px 12px!important}',
    '.leaflet-popup-content-wrapper{border-radius:16px!important;box-shadow:0 8px 32px rgba(0,0,0,.12)!important;padding:0!important;overflow:hidden;border:1px solid rgba(0,0,0,.04)}',
    '.leaflet-popup-content{margin:0!important;min-width:220px;font-family:-apple-system,BlinkMacSystemFont,sans-serif}',
    '.leaflet-popup-tip{box-shadow:0 4px 16px rgba(0,0,0,.08)!important}',
    '.popup-body{padding:14px 16px}',
    '.popup-title{font-size:15px;font-weight:600;color:#2D3436;margin-bottom:2px}',
    '.popup-dist{font-size:12px;color:#B2BEC3;margin-bottom:8px}',
    '.popup-btn{background:#6C5CE7;color:#fff;border:none;border-radius:10px;padding:10px 0;width:100%;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(108,92,231,.3)}',
    '.popup-btn:active{transform:scale(.96);opacity:.9}',
    '</style>',
    '</head><body><div id="map"></div><script>',

    // Map init
    'var map=L.map("map",{zoomControl:false,zoom:' + ZOOM_INICIAL + ',center:[' + UTP_LAT + ',' + UTP_LNG + ']});',
    'L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{maxZoom:20,attribution:\'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>\'}).addTo(map);',
    'L.control.zoom({position:"bottomright"}).addTo(map);',
    'setTimeout(function(){map.invalidateSize()},300);',

    // Error handler
    'window.onerror=function(m){window.ReactNativeWebView.postMessage(JSON.stringify({tipo:"debug",msg:"JS:"+m}))};',

    // Marker factory — inline styles only, ASCII text (no emoji)
    'var _todos=[];',
    'function crearPin(lat,lng,color,txt,minZ){',
    'var d=\'<div style="width:28px;height:28px;border-radius:50%;background:\'+color+\';border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);text-align:center;line-height:28px;font-size:13px;color:#fff;font-weight:700">\'+txt+\'</div>\';',
    'var mk=L.marker([lat,lng],{icon:L.divIcon({className:"",html:d,iconSize:[34,34],iconAnchor:[17,17]})});',
    'if(minZ!=null)mk._mz=minZ;',
    'mk.addTo(map);_todos.push(mk);',
    'return mk;',
    '}',

    // Zoom visibility — fires on init
    'function vis(){var z=map.getZoom();_todos.forEach(function(m){if(m._mz!=null){if(z<m._mz){if(map.hasLayer(m))map.removeLayer(m)}else{if(!map.hasLayer(m))m.addTo(map)}}})}',
    'map.on("zoomend",vis);vis();',

    // User location
    'function actualizarPosicion(lat,lng){if(window._pm){map.removeLayer(window._pm)}window._pm=L.circleMarker([lat,lng],{radius:8,color:"#4285F4",fillColor:"#4285F4",fillOpacity:.8,weight:3,interactive:false}).addTo(map)}',

    // UTP pulse + marker
    'L.circleMarker([' + UTP_LAT + ',' + UTP_LNG + '],{radius:20,color:"rgba(238,90,36,.4)",fillColor:"rgba(238,90,36,.1)",weight:2,interactive:false}).addTo(map);',
    '(function(){var r=20,d=1;setInterval(function(){r+=d*.4;if(r>36||r<20)d*=-1;window._up&&window._up.setRadius(r);window._up&&window._up.setStyle({color:"rgba(238,90,36,"+(.5-(r-20)/32)+")",fillColor:"rgba(238,90,36,"+(.15-(r-20)/80)+")"})},50)})();',
    'window._up=crearPin(' + UTP_LAT + ',' + UTP_LNG + ',"#FF6B6B","U")',
    '.bindPopup(\'<div class="popup-body"><div style="font-size:16px;font-weight:700;color:#1F4E79;margin-bottom:4px">Universidad Tecnol&oacute;gica de Panam&aacute;</div><div style="color:#666;font-size:13px">Campus Central</div></div>\');',

    // Fixed places — ASCII labels only
    'var fijos=' + fijosJson + ';',
    'fijos.forEach(function(f){',
    'var co,lb,mz;',
    'if(f.categoria=="comida"){co="#00B894";lb="F";mz=13}',
    'else if(f.categoria=="metro"){co="#34495E";lb="M";mz=11}',
    'else{co="#6C5CE7";lb="*";mz=13}',
    'var mk=crearPin(f.lat,f.lng,co,lb,mz);',
    'mk.on("click",function(){window.ReactNativeWebView.postMessage(JSON.stringify({tipo:"lugarFijo",id:f.id}))});',
    '});',

    // Backend places
    'var _back=[];',
    'function actualizarLugares(lista){',
    '_back.forEach(function(m){map.removeLayer(m);var i=_todos.indexOf(m);if(i>-1)_todos.splice(i,1)});_back=[];',
    'lista.forEach(function(l){',
    'var mk=crearPin(l.lat,l.lng,"#6C5CE7","*",null);',
    'var pop=\'<div class="popup-body"><div class="popup-title">\'+l.nombre+\'</div>\';',
    'if(l.distancia){pop+=\'<div class="popup-dist">\'+(l.distancia/1000).toFixed(2)+\' km</div>\'}',
    'pop+=\'<button class="popup-btn">Ver detalle</button></div>\';',
    'mk.bindPopup(pop);_back.push(mk);',
    '});',
    'if(lista.length>0){map.fitBounds(L.featureGroup(_back).getBounds().pad(0.2))}',
    '}',

    // Popup button → RN
    'document.addEventListener("click",function(e){',
    'if(e.target&&e.target.className=="popup-btn"){',
    'map.eachLayer(function(l){if(l._popup&&l._popup.isOpen()){',
    'var c=l._popup.getContent();var m=c.match(/<div class="popup-title">([^<]+)<\\/div>/);',
    'if(m&&window._lugares){for(var i=0;i<window._lugares.length;i++){if(window._lugares[i].nombre==m[1]){window.ReactNativeWebView.postMessage(JSON.stringify({tipo:"markerPress",lugarId:window._lugares[i].id}));break;}}}',
    '}});',
    '}',
    '});',

    'window._lugares=' + lugaresJson + ';',
    // Report marker count
    'setTimeout(function(){window.ReactNativeWebView.postMessage(JSON.stringify({tipo:"debug",msg:"Marcadores:"+_todos.length}))},500);',

    '<\/script></body></html>',
  ].join('\n');

  const iconoPorCategoria = (cat: string) => {
    switch (cat) {
      case 'comida':
        return '\u{1F372}';
      case 'metro':
        return '\u{1F687}';
      default:
        return '\u{1F4CD}';
    }
  };

  return (
    <>
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
        onError={() => setError(true)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORES.primario} />
          </View>
        )}
        mixedContentMode="always"
        geolocationEnabled
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: screenW * 0.85 }]}>
            {lugarSeleccionado && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={[
                    styles.modalIconContainer,
                    { backgroundColor: lugarSeleccionado.categoria === 'metro' ? '#E8EAF0' : '#FEF3E2' }
                  ]}>
                    <Text style={styles.modalIcon}>
                      {iconoPorCategoria(lugarSeleccionado.categoria)}
                    </Text>
                  </View>
                  <Text style={styles.modalTitle}>
                    {lugarSeleccionado.nombre}
                  </Text>
                </View>
                <View style={styles.modalDivider} />
                <Text style={styles.modalDescripcion}>
                  {lugarSeleccionado.descripcion}
                </Text>
                {lugarSeleccionado.horario && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Horario:</Text>
                    <Text style={styles.modalInfoValue}>
                      {lugarSeleccionado.horario}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  mapa: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
  },
  errorIcon: { fontSize: 48, marginBottom: 12, color: COLORES.error, fontWeight: 'bold' },
  errorText: { color: COLORES.texto, fontSize: 16, marginBottom: 16 },
  retryBtn: {
    backgroundColor: COLORES.primario,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: COLORES.fondo, fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORES.fondo,
    borderRadius: 20,
    padding: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: { fontSize: 32 },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORES.primario,
    textAlign: 'center',
  },
  modalDivider: { height: 1, backgroundColor: COLORES.acento, marginBottom: 16 },
  modalDescripcion: {
    fontSize: 14,
    color: COLORES.texto,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'justify',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: COLORES.fondoGris,
    padding: 12,
    borderRadius: 10,
  },
  modalInfoLabel: { fontSize: 13, fontWeight: '600', color: COLORES.texto, marginRight: 8 },
  modalInfoValue: { fontSize: 13, color: COLORES.textoBorrado, flex: 1 },
  modalBtn: {
    backgroundColor: COLORES.primario,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: { color: COLORES.fondo, fontSize: 15, fontWeight: '600' },
});

export default MapaView;
