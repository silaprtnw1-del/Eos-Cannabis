import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initLocalDb } from '../localDb';
import { useAuthStore } from '../src/stores/authStore';
import { useConnectionStore } from '../src/stores/connectionStore';
import { colors, spacing, fontSize, fontWeight } from '../src/constants/theme';

export default function RootLayout() {
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);
  const checkConnection = useConnectionStore((s) => s.check);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        await initLocalDb();
      } catch (e) {
        console.warn('Failed to init local sqlite:', e);
      }
      await checkConnection();
      cleanup = await init();
      setBootstrapped(true);
    })();
    return () => cleanup?.();
  }, [init, checkConnection]);

  if (!bootstrapped || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Initializing APN GACP System...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    marginTop: spacing.md,
    fontWeight: fontWeight.semibold,
  },
});
