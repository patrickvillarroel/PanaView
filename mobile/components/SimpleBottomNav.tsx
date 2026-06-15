import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORES } from '../constants/config';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: string; route: string; label: string; activo: IoniconName; inactivo: IoniconName }[] = [
  { key: 'mapa', route: '/(tabs)/mapa', label: 'Mapa', activo: 'map', inactivo: 'map-outline' },
  { key: 'explorar', route: '/(tabs)/explorar', label: 'Explorar', activo: 'compass', inactivo: 'compass-outline' },
  { key: 'guardados', route: '/(tabs)/guardados', label: 'Guardados', activo: 'heart', inactivo: 'heart-outline' },
  { key: 'perfil', route: '/(tabs)/perfil', label: 'Perfil', activo: 'person', inactivo: 'person-outline' },
];

interface Props {
  activeTab?: string;
}

export default function SimpleBottomNav({ activeTab }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.contenedor, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const activo = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
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
