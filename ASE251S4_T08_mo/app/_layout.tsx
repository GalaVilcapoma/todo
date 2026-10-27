import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuthSession } from '../store/auth.store';
import { Colors } from '../constants/colors';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Guarda de rutas.
 *
 * Se usa `Stack.Protected` en lugar de un `useEffect` con `router.replace`:
 * durante la restauración de la sesión el usuario queda "deslogueado" durante
 * unos milisegundos, y un redirect basado en ese estado lo expulsaría al login
 * antes de que `loadSession` termine. `Stack.Protected` no renderiza la ruta
 * hasta que el guard resuelve, así que no hay parpadeo ni carrera.
 *
 * También evita montar las pantallas privadas (y disparar sus peticiones al
 * backend) cuando no hay sesión.
 */
function RootNavigator() {
  const { isAuthenticated, isRestoring } = useAuthSession();

  useEffect(() => {
    if (isRestoring) return;
    void SplashScreen.hideAsync();
  }, [isRestoring]);

  if (isRestoring) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });