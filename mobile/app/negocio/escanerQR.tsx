import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import promocionesService from '../../services/promocionesService';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';

type Resultado = {
  ok: boolean;
  titulo: string;
  mensaje: string;
  nombrePromo?: string;
};

export default function EscanerQR() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const handleBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (procesando || resultado) return;

      if (!data.startsWith('PANAVIEW:')) return;

      setProcesando(true);
      try {
        const res = await promocionesService.redeemByQR(data);
        setResultado({
          ok: true,
          titulo: '¡Canjeado!',
          mensaje: 'La promoción fue registrada exitosamente.',
          nombrePromo: res.promo?.nombre,
        });
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Error al procesar el QR';
        setResultado({
          ok: false,
          titulo: status === 409 ? 'Ya canjeado' : 'QR no válido',
          mensaje: msg,
        });
      } finally {
        setProcesando(false);
      }
    },
    [procesando, resultado]
  );

  const reiniciar = () => setResultado(null);

  if (!permission) return <View style={styles.contenedor} />;

  if (!permission.granted) {
    return (
      <View style={[styles.contenedor, styles.centrado, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.botonAtras, { top: insets.top + 8 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color={COLORES.texto} />
        </TouchableOpacity>
        <Ionicons name="camera-outline" size={72} color={COLORES.textoBorrado} />
        <Text style={styles.permisotTitulo}>Permiso de cámara</Text>
        <Text style={styles.permisoSubtitulo}>
          Necesitamos acceso a la cámara para escanear el código QR del cliente.
        </Text>
        <TouchableOpacity style={styles.botonPermiso} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.botonPermisoTexto}>Permitir cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonCancelar} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.botonCancelarTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (resultado) {
    return (
      <View style={[styles.contenedor, styles.centrado]}>
        <TouchableOpacity style={[styles.botonAtras, { top: insets.top + 8 }]} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORES.texto} />
        </TouchableOpacity>

        <View style={[styles.iconoResultado, { backgroundColor: resultado.ok ? '#E8F5E9' : '#FDECEA' }]}>
          <Ionicons
            name={resultado.ok ? 'checkmark-circle' : 'close-circle'}
            size={64}
            color={resultado.ok ? COLORES.exito : COLORES.error}
          />
        </View>

        <Text style={[styles.resultadoTitulo, { color: resultado.ok ? COLORES.exito : COLORES.error }]}>
          {resultado.titulo}
        </Text>

        {resultado.nombrePromo && (
          <Text style={styles.resultadoPromo}>{resultado.nombrePromo}</Text>
        )}

        <Text style={styles.resultadoMensaje}>{resultado.mensaje}</Text>

        <TouchableOpacity style={styles.botonReintentar} onPress={reiniciar} activeOpacity={0.85}>
          <Text style={styles.botonReintentarTexto}>Escanear otro QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botonCancelar} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.botonCancelarTexto}>Volver al perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <CameraView
        style={styles.camara}
        facing="back"
        onBarcodeScanned={procesando ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.botonAtrasCamera} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={21} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Canjear QR del cliente</Text>
        </View>

        {/* Marco con esquinas */}
        <View style={styles.overlay}>
          <View style={styles.marco}>
            <View style={[styles.esquina, styles.esquinaTopLeft]} />
            <View style={[styles.esquina, styles.esquinaTopRight]} />
            <View style={[styles.esquina, styles.esquinaBottomLeft]} />
            <View style={[styles.esquina, styles.esquinaBottomRight]} />
          </View>
          <Text style={styles.instruccion}>
            {procesando ? 'Procesando...' : 'Enfoca el código QR del cliente'}
          </Text>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Ionicons name="qr-code-outline" size={20} color="rgba(255,255,255,0.8)" />
          <Text style={styles.footerTexto}>El cliente debe mostrar su QR desde la app</Text>
        </View>
      </CameraView>
    </View>
  );
}

const MARCO_SIZE = 240;
const ESQUINA_SIZE = 24;
const ESQUINA_GROSOR = 4;

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#000',
  },
  camara: {
    flex: 1,
  },
  centrado: {
    backgroundColor: COLORES.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.md,
    paddingHorizontal: 32,
  },

  // Header sobre la cámara
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  botonAtras: {
    position: 'absolute',
    left: 16,
    top: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  botonAtrasCamera: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },

  // Marco de escaneo
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: 'transparent',
  },
  marco: {
    width: MARCO_SIZE,
    height: MARCO_SIZE,
    position: 'relative',
  },
  esquina: {
    position: 'absolute',
    width: ESQUINA_SIZE,
    height: ESQUINA_SIZE,
    borderColor: '#fff',
  },
  esquinaTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: ESQUINA_GROSOR,
    borderLeftWidth: ESQUINA_GROSOR,
    borderTopLeftRadius: 4,
  },
  esquinaTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: ESQUINA_GROSOR,
    borderRightWidth: ESQUINA_GROSOR,
    borderTopRightRadius: 4,
  },
  esquinaBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: ESQUINA_GROSOR,
    borderLeftWidth: ESQUINA_GROSOR,
    borderBottomLeftRadius: 4,
  },
  esquinaBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: ESQUINA_GROSOR,
    borderRightWidth: ESQUINA_GROSOR,
    borderBottomRightRadius: 4,
  },
  instruccion: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  footerTexto: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '500',
  },

  // Permiso
  permisotTitulo: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORES.texto,
    textAlign: 'center',
    marginTop: ESPACIADO.md,
  },
  permisoSubtitulo: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    lineHeight: 21,
  },
  botonPermiso: {
    backgroundColor: COLORES.primario,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: BORDES.redondeadoGrande,
    marginTop: ESPACIADO.sm,
  },
  botonPermisoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: TAMAÑOS.fontoMedio,
  },

  // Resultado
  iconoResultado: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ESPACIADO.sm,
  },
  resultadoTitulo: {
    fontSize: 26,
    fontWeight: '800',
  },
  resultadoPromo: {
    fontSize: TAMAÑOS.fontoMedio,
    color: COLORES.texto,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultadoMensaje: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    lineHeight: 21,
  },
  botonReintentar: {
    backgroundColor: COLORES.primario,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: BORDES.redondeadoGrande,
    marginTop: ESPACIADO.md,
  },
  botonReintentarTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: TAMAÑOS.fontoMedio,
  },
  botonCancelar: {
    paddingVertical: 10,
  },
  botonCancelarTexto: {
    color: COLORES.textoBorrado,
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
  },
});
