import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../../src/components/layout/AppHeader';
import { BottomTabBar } from '../../src/components/layout/BottomTabBar';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, spacing } from '../../src/constants/theme';

export default function TabsLayout() {
  const session = useAuthStore((s) => s.session);
  const userRole = useAuthStore((s) => s.userRole);
  const insets = useSafeAreaInsets();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppHeader />
      <View style={styles.content}>
        <Tabs
          screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
          tabBar={(props) => <BottomTabBar {...props} />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="nutrients" />
          <Tabs.Screen name="plants" />
          <Tabs.Screen name="logs" />
          <Tabs.Screen name="vpd" />
          <Tabs.Screen
            name="users"
            options={{ href: userRole === 'ADMIN' ? undefined : null }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
});
