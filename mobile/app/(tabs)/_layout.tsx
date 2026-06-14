import React from 'react';
import { Tabs } from 'expo-router';
import { COLORES } from '../../constants/config';
import AppHeader from '../../components/AppHeader';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <AppHeader />,
      }}
    >
      <Tabs.Screen name="mapa" />
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="guardados" />
      <Tabs.Screen name="perfil" />
      <Tabs.Screen name="perfil-negocios" />
    </Tabs>
  );
}
