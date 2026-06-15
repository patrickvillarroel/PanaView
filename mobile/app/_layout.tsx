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
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="terminos" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <LoadingOverlay visible={loading} mensaje="Inicializando..." />
    </>
  );
}

export default RootLayout;
