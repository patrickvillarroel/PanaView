import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORES } from '../../constants/config';

const KEY_NOTIFICACIONES = 'perfil-config:notificaciones';
const KEY_PERFIL_PUBLICO = 'perfil-config:perfilPublico';

export default function ConfiguracionPerfilScreen() {
  const { usuario } = useAuth();
  const router = useRouter();

  const [notificaciones, setNotificaciones] = useState(true);
  const [perfilPublico, setPerfilPublico] = useState(true);

  useEffect(() => {
    void cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const [notificacionesGuardadas, perfilPublicoGuardado] = await Promise.all([
        AsyncStorage.getItem(KEY_NOTIFICACIONES),
        AsyncStorage.getItem(KEY_PERFIL_PUBLICO),
      ]);

      if (notificacionesGuardadas !== null) {
        setNotificaciones(notificacionesGuardadas === 'true');
      }

      if (perfilPublicoGuardado !== null) {
        setPerfilPublico(perfilPublicoGuardado === 'true');
      }
    } catch {
      // Mantener valores por defecto.
    }
  };

  const guardarCambio = async (key: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    await AsyncStorage.setItem(key, String(value));
  };

  const limpiarConfiguracionLocal = async () => {
    await AsyncStorage.multiRemove([KEY_NOTIFICACIONES, KEY_PERFIL_PUBLICO]);
    setNotificaciones(true);
    setPerfilPublico(true);
    Alert.alert('Listo', 'Las preferencias locales se restablecieron.');
  };

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.volver} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORES.primario} />
        <Text style={styles.volverTexto}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Configuración</Text>
        <Text style={styles.subtitulo}>
          Ajustes locales de la cuenta para {usuario?.nombre ?? 'tu perfil'}.
        </Text>
      </View>

      <View style={styles.tarjeta}>
        <View style={styles.fila}>
          <View style={styles.filaTexto}>
            <Text style={styles.filaTitulo}>Notificaciones</Text>
            <Text style={styles.filaDescripcion}>Recibe avisos sobre novedades, guardados y actividad.</Text>
          </View>
          <Switch
            value={notificaciones}
            onValueChange={(value) => guardarCambio(KEY_NOTIFICACIONES, value, setNotificaciones)}
            trackColor={{ false: '#D5DCE5', true: '#9FC2E6' }}
            thumbColor={notificaciones ? COLORES.primario : '#F4F6FB'}
          />
        </View>
      </View>

      <View style={styles.tarjeta}>
        <View style={styles.fila}>
          <View style={styles.filaTexto}>
            <Text style={styles.filaTitulo}>Perfil público</Text>
            <Text style={styles.filaDescripcion}>Permite que otros vean tu nombre y tus guardados compartidos.</Text>
          </View>
          <Switch
            value={perfilPublico}
            onValueChange={(value) => guardarCambio(KEY_PERFIL_PUBLICO, value, setPerfilPublico)}
            trackColor={{ false: '#D5DCE5', true: '#9FC2E6' }}
            thumbColor={perfilPublico ? COLORES.primario : '#F4F6FB'}
          />
        </View>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.filaTitulo}>Privacidad y seguridad</Text>
        <Text style={styles.filaDescripcion}>
          Los datos de sesión se administran desde la app y puedes cerrar sesión cuando quieras.
        </Text>
      </View>

      <TouchableOpacity style={styles.botonSecundario} onPress={limpiarConfiguracionLocal}>
        <Text style={styles.botonSecundarioTexto}>Restablecer preferencias</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  contenido: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volverTexto: {
    fontSize: 14,
    color: COLORES.primario,
    fontWeight: '700',
  },
  encabezado: {
    marginBottom: 4,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: COLORES.textoBorrado,
    lineHeight: 19,
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filaTexto: {
    flex: 1,
  },
  filaTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 4,
  },
  filaDescripcion: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORES.textoBorrado,
  },
  botonSecundario: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  botonSecundarioTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F36',
  },
});