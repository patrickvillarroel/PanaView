import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES } from '../constants/config';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabRoute = {
  key: string;
  name: string;
};

type TabBarState = {
  index: number;
  routes: TabRoute[];
};

type TabBarNavigation = {
  emit: (event: {
    type: 'tabPress';
    target: string;
    canPreventDefault: boolean;
  }) => { defaultPrevented: boolean };
  navigate: (routeName: string) => void;
};

type CustomTabBarProps = {
  state: TabBarState;
  navigation: TabBarNavigation;
};

const TABS: Record<string, { label: string; activo: IoniconName; inactivo: IoniconName }> = {
  mapa:       { label: 'Mapa',       activo: 'map',       inactivo: 'map-outline' },
  explorar:   { label: 'Explorar',   activo: 'compass',   inactivo: 'compass-outline' },
  guardados:  { label: 'Guardados',  activo: 'heart',     inactivo: 'heart-outline' },
  perfil:     { label: 'Perfil',     activo: 'person',    inactivo: 'person-outline' },
};

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.contenedor, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const activo = state.index === index;
        const tab = TABS[route.name];
        if (!tab) return null;

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
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.75}
          >
            <View style={[styles.pastilla, activo && styles.pastillaActiva]}>
              <Ionicons
                name={activo ? tab.activo : tab.inactivo}
                size={22}
                color={activo ? COLORES.primario : '#9AA0A6'}
              />
            </View>
            <Text style={[styles.etiqueta, activo && styles.etiquetaActiva]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
