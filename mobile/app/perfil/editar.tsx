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
import { useAuth } from '../../context/AuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { COLORES } from '../../constants/config';
import authService from '../../services/authService';

export default function EditarPerfilScreen() {
  const { usuario, setUsuario } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setNombre(usuario?.nombre ?? '');
    setFotoUrl(usuario?.foto_url ?? '');
  }, [usuario]);

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
        foto_url: fotoUrl.trim() || null,
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
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
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
          <View style={styles.avatarWrap}>
            {fotoUrl.trim() ? (
              <Image source={{ uri: fotoUrl.trim() }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[COLORES.secundario, COLORES.primario]} style={styles.avatar}>
                <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
              </LinearGradient>
            )}
          </View>
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
          <TextInput
            value={fotoUrl}
            onChangeText={setFotoUrl}
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={COLORES.textoBorrado}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity style={styles.botonSecundario} onPress={() => setFotoUrl('')}>
            <Text style={styles.botonSecundarioTexto}>Quitar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonPrimario} onPress={handleGuardar}>
            <Text style={styles.botonPrimarioTexto}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={guardando} mensaje="Guardando cambios..." />
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
  botonSecundario: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  botonSecundarioTexto: {
    color: '#1A1F36',
    fontSize: 14,
    fontWeight: '700',
  },
});