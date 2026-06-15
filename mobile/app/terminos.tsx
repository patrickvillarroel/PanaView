import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../constants/config';

export default function TerminosScreen() {
  const router = useRouter();

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Términos y Condiciones</Text>
        <Text style={styles.fecha}>Última actualización: 15 de junio de 2026</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.parrafo}>
          Bienvenido a PanaRoute. Al acceder y utilizar esta aplicación, aceptas
          cumplir con los siguientes términos y condiciones. Si no estás de
          acuerdo con alguna parte, no debes usar la aplicación.
        </Text>

        <Text style={styles.subtitulo}>1. Uso de la aplicación</Text>
        <Text style={styles.parrafo}>
          PanaRoute es una plataforma diseñada para la exploración de lugares
          turísticos y registro de negocios locales. El usuario se compromete a
          utilizar la aplicación de manera responsable y conforme a la ley.
        </Text>

        <Text style={styles.subtitulo}>2. Registro de cuenta</Text>
        <Text style={styles.parrafo}>
          Para acceder a ciertas funciones, debes crear una cuenta proporcionando
          información veraz y actualizada. Eres responsable de mantener la
          confidencialidad de tus credenciales de acceso.
        </Text>

        <Text style={styles.subtitulo}>3. Privacidad de datos</Text>
        <Text style={styles.parrafo}>
          Tus datos personales serán tratados conforme a nuestra Política de
          Privacidad. No compartiremos tu información personal con terceros sin
          tu consentimiento, salvo que la ley lo requiera.
        </Text>

        <Text style={styles.subtitulo}>4. Responsabilidades del usuario</Text>
        <Text style={styles.parrafo}>
          El usuario acepta no utilizar la plataforma para actividades ilícitas,
          no publicar contenido ofensivo o engañoso, y no realizar acciones que
          puedan dañar la integridad del sistema o la experiencia de otros
          usuarios.
        </Text>

        <Text style={styles.subtitulo}>5. Propiedad intelectual</Text>
        <Text style={styles.parrafo}>
          Todo el contenido disponible en PanaRoute, incluyendo textos, imágenes,
          logotipos y software, está protegido por derechos de autor y otras
          leyes de propiedad intelectual.
        </Text>

        <Text style={styles.subtitulo}>6. Modificaciones</Text>
        <Text style={styles.parrafo}>
          Nos reservamos el derecho de modificar estos términos en cualquier
          momento. Las modificaciones entrarán en vigor inmediatamente después de
          su publicación en la aplicación.
        </Text>

        <Text style={styles.subtitulo}>7. Contacto</Text>
        <Text style={styles.parrafo}>
          Si tienes preguntas sobre estos términos, puedes contactarnos a través
          de los canales de atención disponibles en la aplicación.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.boton}
          onPress={() => router.back()}
        >
          <Text style={styles.botonTexto}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: ESPACIADO.lg,
    paddingBottom: ESPACIADO.lg,
    backgroundColor: COLORES.primario,
  },
  titulo: {
    fontSize: TAMAÑOS.fontoExtraGrande,
    fontWeight: '700',
    color: COLORES.fondo,
  },
  fecha: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.acento,
    marginTop: ESPACIADO.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: ESPACIADO.lg,
    paddingBottom: ESPACIADO.xxl,
  },
  subtitulo: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.primario,
    marginTop: ESPACIADO.xl,
    marginBottom: ESPACIADO.sm,
  },
  parrafo: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 22,
    marginBottom: ESPACIADO.sm,
  },
  footer: {
    padding: ESPACIADO.lg,
    borderTopWidth: 1,
    borderTopColor: COLORES.acento,
  },
  boton: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    alignItems: 'center',
  },
  botonTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
});
