import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { loading } = useAuth();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 260,
          gestureEnabled: true,
        }}
      >
        {/* Splash / index: fade limpio sin slide */}
        <Stack.Screen
          name="index"
          options={{ animation: 'fade', animationDuration: 300 }}
        />
        {/* Auth: sube desde abajo como modal */}
        <Stack.Screen
          name="login"
          options={{ animation: 'slide_from_bottom', animationDuration: 320 }}
        />
        <Stack.Screen
          name="register"
          options={{ animation: 'slide_from_bottom', animationDuration: 320 }}
        />
        {/* Tabs: fade para no chocar con el tab bar */}
        <Stack.Screen
          name="(tabs)"
          options={{ animation: 'fade', animationDuration: 220 }}
        />
        {/* Detalle de lugar: slide estándar de drill-down */}
        <Stack.Screen
          name="lugar/[id]"
          options={{ animation: 'slide_from_right', animationDuration: 260 }}
        />
      </Stack>
      <LoadingOverlay visible={loading} mensaje="Inicializando..." />
    </>
  );
}

export default RootLayout;
