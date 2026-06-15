import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORES } from '../../constants/config';

const KEY_DATOS_CACHE = 'perfil-config:datosCache';

export default function ConfiguracionPerfilScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cacheLimpiado, setCacheLimpiado] = useState(false);

  const limpiarDatosLocales = async () => {
    Alert.alert(
      'Limpiar datos locales',
      '¿Quieres eliminar las preferencias guardadas en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const clavesPanaView = keys.filter((k) => k.startsWith('perfil-'));
            await AsyncStorage.multiRemove(clavesPanaView);
            setCacheLimpiado(true);
            Alert.alert('Listo', 'Las preferencias locales se eliminaron.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.volver} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORES.primario} />
        <Text style={styles.volverTexto}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Configuración</Text>
        <Text style={styles.subtitulo}>
          Ajustes de la cuenta de {usuario?.nombre ?? 'tu perfil'}.
        </Text>
      </View>

      <View style={styles.tarjeta}>
        <View style={styles.filaInfo}>
          <Ionicons name="person-outline" size={20} color={COLORES.primario} />
          <View style={styles.filaTexto}>
            <Text style={styles.filaTitulo}>Nombre</Text>
            <Text style={styles.filaValor}>{usuario?.nombre ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.separador} />
        <View style={styles.filaInfo}>
          <Ionicons name="mail-outline" size={20} color={COLORES.primario} />
          <View style={styles.filaTexto}>
            <Text style={styles.filaTitulo}>Email</Text>
            <Text style={styles.filaValor}>{usuario?.email ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.separador} />
        <View style={styles.filaInfo}>
          <Ionicons name="shield-outline" size={20} color={COLORES.primario} />
          <View style={styles.filaTexto}>
            <Text style={styles.filaTitulo}>Rol</Text>
            <Text style={styles.filaValor}>{usuario?.rol ?? '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.seccionTitulo}>Datos del dispositivo</Text>
        <Text style={styles.filaDescripcion}>
          Las preferencias de intereses y ajustes se guardan localmente en este dispositivo.
        </Text>
        <TouchableOpacity style={styles.botonDestructivo} onPress={limpiarDatosLocales} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={16} color="#E53935" />
          <Text style={styles.botonDestructivoTexto}>Limpiar datos locales</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F4F6FB' },
  contenido: { padding: 16, paddingBottom: 40, gap: 14 },

  volver: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  volverTexto: { fontSize: 14, color: COLORES.primario, fontWeight: '700' },

  encabezado: { marginBottom: 4 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#1A1F36', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: COLORES.textoBorrado, lineHeight: 19 },

  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  separador: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8EAED' },

  filaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filaTexto: { flex: 1 },
  filaTitulo: { fontSize: 12, color: COLORES.textoBorrado, fontWeight: '600', marginBottom: 2 },
  filaValor: { fontSize: 15, fontWeight: '700', color: '#1A1F36' },

  seccionTitulo: { fontSize: 15, fontWeight: '800', color: '#1A1F36' },
  filaDescripcion: { fontSize: 13, color: COLORES.textoBorrado, lineHeight: 19 },

  botonDestructivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    alignSelf: 'flex-start',
  },
  botonDestructivoTexto: { fontSize: 14, fontWeight: '700', color: '#E53935' },
});
