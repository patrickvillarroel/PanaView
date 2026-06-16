import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORES } from '../constants/config';
import { useAuth } from '../context/AuthContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabRoute = { key: string; name: string };
type TabBarState = { index: number; routes: TabRoute[] };
type TabBarNavigation = {
  emit: (e: any) => any;
  navigate: (name: string) => void;
};
type CustomTabBarProps = { state: TabBarState; navigation: TabBarNavigation };

const TABS: Record<string, { label: string; activo: IoniconName; inactivo: IoniconName }> = {
  mapa:      { label: 'Mapa',      activo: 'map',     inactivo: 'map-outline' },
  explorar:  { label: 'Explorar',  activo: 'compass', inactivo: 'compass-outline' },
  guardados: { label: 'Guardados', activo: 'heart',   inactivo: 'heart-outline' },
  perfil:    { label: 'Perfil',    activo: 'person',  inactivo: 'person-outline' },
};

// ─── Tab item individual con animación ───────────────────────────────────────

interface TabItemProps {
  route: TabRoute;
  activo: boolean;
  tab: (typeof TABS)[string];
  onPress: () => void;
}

function TabItem({ route, activo, tab, onPress }: TabItemProps) {
  const escala = useRef(new Animated.Value(activo ? 1 : 0.82)).current;
  const opacidadLabel = useRef(new Animated.Value(activo ? 1 : 0.55)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, {
        toValue: activo ? 1 : 0.82,
        useNativeDriver: true,
        tension: 320,
        friction: 14,
      }),
      Animated.timing(opacidadLabel, {
        toValue: activo ? 1 : 0.55,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activo]);

  return (
    <Pressable
      key={route.key}
      style={styles.tab}
      onPress={onPress}
      android_ripple={null}
    >
      {/* Pastilla con spring de escala */}
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <View style={[styles.pastilla, activo && styles.pastillaActiva]}>
          <Ionicons
            name={activo ? tab.activo : tab.inactivo}
            size={22}
            color={activo ? COLORES.primario : '#9AA0A6'}
          />
        </View>
      </Animated.View>

      {/* Etiqueta con fade */}
      <Animated.Text
        style={[styles.etiqueta, activo && styles.etiquetaActiva, { opacity: opacidadLabel }]}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

// ─── Tab bar principal ────────────────────────────────────────────────────────

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { usuario } = useAuth();
  const esNegocio = usuario?.rol === 'negocio';
  const esAdmin = usuario?.rol === 'admin';
  const mostrarEscaner = esNegocio || esAdmin;

  return (
    <View style={[styles.contenedor, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        if (route.name === 'guardados' && esNegocio) return null;

        const activo = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!activo && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            activo={activo}
            tab={tab}
            onPress={onPress}
          />
        );
      })}

      {mostrarEscaner && (
        <Pressable
          style={styles.tab}
          onPress={() => router.push('/negocio/escanerQR')}
          android_ripple={null}
        >
          <View style={styles.pastilla}>
            <Ionicons name="qr-code-outline" size={22} color="#9AA0A6" />
          </View>
          <Text style={styles.etiqueta}>Escanear</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilla: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    overflow: 'hidden',
  },
  pastillaActiva: {
    backgroundColor: COLORES.acento,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9AA0A6',
  },
  etiquetaActiva: {
    color: COLORES.primario,
    fontWeight: '700',
  },
});
