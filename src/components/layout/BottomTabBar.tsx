import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useTranslation, type TranslationKey } from '../../constants/i18n';
import { colors, fontWeight } from '../../constants/theme';

interface TabDef {
  name: string;
  icon: string;
  labelKey: TranslationKey;
  adminOnly?: boolean;
}

const TABS: TabDef[] = [
  { name: 'index', icon: '🏠', labelKey: 'tab_dashboard' },
  { name: 'nutrients', icon: '🧪', labelKey: 'tab_nutrients' },
  { name: 'plants', icon: '🏷️', labelKey: 'tab_plants' },
  { name: 'logs', icon: '📋', labelKey: 'tab_sop' },
  { name: 'vpd', icon: '🌡️', labelKey: 'tab_vpd' },
  { name: 'users', icon: '👥', labelKey: 'tab_dashboard', adminOnly: true },
];

const ADMIN_LABEL = { th: 'ผู้ใช้งาน', en: 'Users' };

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const userRole = useAuthStore((s) => s.userRole);
  const isTh = useI18nStore((s) => s.isTh);
  const { t } = useTranslation(isTh);

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 },
      ]}
    >
      {TABS.map((tab) => {
        if (tab.adminOnly && userRole !== 'ADMIN') return null;

        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        const isActive = routeIndex >= 0 && state.index === routeIndex;
        const label =
          tab.name === 'users' ? (isTh ? ADMIN_LABEL.th : ADMIN_LABEL.en) : t(tab.labelKey);

        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => navigation.navigate(tab.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', opacity: 0.5, flex: 1 },
  tabItemActive: { opacity: 1 },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { color: colors.textMuted, fontSize: 10, fontWeight: fontWeight.semibold },
  tabLabelActive: { color: colors.accent },
});
