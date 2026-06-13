import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../constants/config';
import LoadingOverlay from '../components/LoadingOverlay';

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  const { register } = useAuth();
  const router = useRouter();

  const validarEmail = (text: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(text);
  };

  const validar = () => {
    const nuevosErrores: { [key: string]: string } = {};

    if (!nombre) {
      nuevosErrores.nombre = 'El nombre es requerido';
    } else if (nombre.length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!validarEmail(email)) {
      nuevosErrores.email = 'Email inválido';
    }

    if (!password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!confirmPassword) {
      nuevosErrores.confirmPassword = 'Debes confirmar la contraseña';
    } else if (password !== confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleRegister = async () => {
    if (!validar()) return;

    try {
      setCargando(true);
      await register(nombre, email, password);
      router.replace('/(tabs)/mapa');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.contenedor}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.titulo}>Crear Cuenta</Text>
          <Text style={styles.subtitulo}>Únete a la comunidad PanaRoute</Text>
        </View>

        <View style={styles.formulario}>
          <View style={styles.grupoInput}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={[styles.input, errores.nombre && styles.inputError]}
              placeholder="Tu nombre"
              placeholderTextColor={COLORES.textoBorrado}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              editable={!cargando}
            />
            {errores.nombre && (
              <Text style={styles.mensajeError}>{errores.nombre}</Text>
            )}
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errores.email && styles.inputError]}
              placeholder="tu@email.com"
              placeholderTextColor={COLORES.textoBorrado}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!cargando}
            />
            {errores.email && (
              <Text style={styles.mensajeError}>{errores.email}</Text>
            )}
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, errores.password && styles.inputError]}
              placeholder="••••••••"
              placeholderTextColor={COLORES.textoBorrado}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!cargando}
            />
            {errores.password && (
              <Text style={styles.mensajeError}>{errores.password}</Text>
            )}
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={[
                styles.input,
                errores.confirmPassword && styles.inputError,
              ]}
              placeholder="••••••••"
              placeholderTextColor={COLORES.textoBorrado}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!cargando}
            />
            {errores.confirmPassword && (
              <Text style={styles.mensajeError}>{errores.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.botonPrimario, cargando && styles.botonDisabled]}
            onPress={handleRegister}
            disabled={cargando}
          >
            <Text style={styles.botonTexto}>Crear Cuenta</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.textoLogin}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            disabled={cargando}
          >
            <Text style={styles.enlaceLogin}>Inicia sesión aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={cargando} mensaje="Creando cuenta..." />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: ESPACIADO.lg,
  },
  header: {
    marginBottom: ESPACIADO.xxl,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORES.primario,
    marginBottom: ESPACIADO.sm,
  },
  subtitulo: {
    fontSize: TAMAÑOS.fontoMedio,
    color: COLORES.textoBorrado,
  },
  formulario: {
    gap: ESPACIADO.lg,
  },
  grupoInput: {
    gap: ESPACIADO.xs,
  },
  label: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
    color: COLORES.texto,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORES.acento,
    borderRadius: BORDES.redondeado,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.md,
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    backgroundColor: COLORES.fondoGris,
  },
  inputError: {
    borderColor: COLORES.error,
  },
  mensajeError: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.error,
  },
  botonPrimario: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    alignItems: 'center',
    marginTop: ESPACIADO.lg,
  },
  botonDisabled: {
    opacity: 0.6,
  },
  botonTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORES.acento,
    marginVertical: ESPACIADO.lg,
  },
  textoLogin: {
    textAlign: 'center',
    color: COLORES.textoBorrado,
    fontSize: TAMAÑOS.fontoNormal,
  },
  enlaceLogin: {
    textAlign: 'center',
    color: COLORES.primario,
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    marginTop: ESPACIADO.sm,
  },
});
