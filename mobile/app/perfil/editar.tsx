import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { COLORES, BASE_URL } from '../../constants/config';
import authService from '../../services/authService';
import imagenesUsuarioService from '../../services/imagenesUsuarioService';

export default function EditarPerfilScreen() {
  const { usuario, setUsuario, logout } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setNombre(usuario?.nombre ?? '');
    setFotoUrl(usuario?.foto_url ?? '');
  }, [usuario]);

  const seleccionarFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (resultado.canceled) return;

    const uri = resultado.assets[0].uri;
    if (!usuario?.id) return;

    try {
      setSubiendoFoto(true);
      const data = await imagenesUsuarioService.subirImagen(usuario.id, uri);
      setFotoUrl(data.foto_url);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const quitarFoto = () => {
    setFotoUrl('');
  };

  const handleGuardar = async () => {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      Alert.alert('Nombre requerido', 'Escribe un nombre válido para tu perfil.');
      return;
    }

    try {
      setGuardando(true);
      const perfilActualizado = await authService.updateMe({
        nombre: nombreLimpio,
        foto_url: fotoUrl || null,
      });

      const usuarioBase = {
        id: perfilActualizado.id,
        nombre: perfilActualizado.nombre,
        email: perfilActualizado.email,
        rol: perfilActualizado.rol,
        foto_url: perfilActualizado.foto_url,
      };

      setUsuario(usuarioBase);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuarioBase));

      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
        {
          text: 'Aceptar',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const msg = error.message || '';
      if (msg === 'Usuario no encontrado') {
        await logout();
        return;
      }
      Alert.alert('Error', msg || 'No se pudo actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = nombre
    .split(' ')
    .map((parte) => parte[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.volver} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORES.primario} />
          <Text style={styles.volverTexto}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <TouchableOpacity style={styles.avatarWrap} onPress={seleccionarFoto} disabled={subiendoFoto}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl.startsWith('/uploads/') ? `${BASE_URL}${fotoUrl}` : fotoUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[COLORES.secundario, COLORES.primario]} style={styles.avatar}>
                <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
              </LinearGradient>
            )}
            <View style={styles.camaraBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.titulo}>Editar perfil</Text>
          <Text style={styles.subtitulo}>Actualiza tu nombre y foto para mantener sincronizada tu cuenta.</Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor={COLORES.textoBorrado}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Foto de perfil</Text>

          <TouchableOpacity style={styles.botonGaleria} onPress={seleccionarFoto} disabled={subiendoFoto}>
            <Ionicons name="images-outline" size={18} color={COLORES.primario} />
            <Text style={styles.botonGaleriaTexto}>
              {subiendoFoto ? 'Subiendo foto...' : fotoUrl ? 'Cambiar foto' : 'Seleccionar foto'}
            </Text>
          </TouchableOpacity>

          {fotoUrl ? (
            <TouchableOpacity style={styles.botonQuitar} onPress={quitarFoto}>
              <Ionicons name="trash-outline" size={16} color="#E53935" />
              <Text style={styles.botonQuitarTexto}>Quitar foto</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.botonPrimario} onPress={handleGuardar}>
            <Text style={styles.botonPrimarioTexto}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={guardando || subiendoFoto} mensaje="Guardando cambios..." />
    </KeyboardAvoidingView>
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
  },
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  volverTexto: {
    fontSize: 14,
    color: COLORES.primario,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrap: {
    marginBottom: 12,
    shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  camaraBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: COLORES.primario,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 13,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    lineHeight: 19,
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F36',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORES.texto,
    backgroundColor: '#F9FBFD',
  },
  botonGaleria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.primario,
    borderStyle: 'dashed',
  },
  botonGaleriaTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.primario,
  },
  botonQuitar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  botonQuitarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
  },
  botonPrimario: {
    backgroundColor: COLORES.primario,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  botonPrimarioTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
