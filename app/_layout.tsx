import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { initLocalDb } from '../localDb';
import { useAuthStore } from '../src/stores/authStore';
import { useConnectionStore, startNetworkWatcher } from '../src/stores/connectionStore';
import { colors, spacing, fontSize, fontWeight } from '../src/constants/theme';
import { queryClient } from '../src/lib/queryClient';

export default function RootLayout() {
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);
  const checkConnection = useConnectionStore((s) => s.check);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const netWatcher = startNetworkWatcher();
    (async () => {
      try {
        await initLocalDb();
      } catch (e) {
        console.warn('Failed to init local sqlite:', e);
      }
      await checkConnection(); // also drains any queued offline writes
      cleanup = await init();
      setBootstrapped(true);
    })();
    return () => {
      cleanup?.();
      netWatcher();
    };
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
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
